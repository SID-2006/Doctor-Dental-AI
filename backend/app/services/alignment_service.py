"""
Tooth Alignment Screening Service
==================================
A preliminary geometric screening tool that analyses the 2D spatial positions
of teeth detected by the enumeration model on a panoramic X-ray.

IMPORTANT LIMITATIONS (hard-coded into every result):
  - This is NOT a clinically validated orthodontic diagnostic.
  - Panoramic radiographs have inherent geometric distortion.
  - Bounding-box centres are approximations of tooth centroids only.
  - Results depend entirely on the enumeration model's detection quality.
  - No alignment score is produced; only per-region deviation measurements.

Methodology:
  1. Extract centre-point (cx, cy) and width from each detected tooth bounding box.
  2. Group teeth into upper arch (quadrants 1 & 2 → FDI 11-28) and
     lower arch (quadrants 3 & 4 → FDI 31-48).
  3. For each arch with ≥ MIN_TEETH_FOR_FIT teeth, sort centres by cx and
     fit a 2nd-degree polynomial  y = a·x² + b·x + c  (arch curve).
  4. Compute per-tooth deviation: |actual_cy - fitted_cy|.
  5. Normalise by the median tooth width for that arch.
  6. Flag teeth whose normalised deviation exceeds DEVIATION_THRESHOLD.
  7. Also compute relative spacing between adjacent detected teeth,
     normalised by mean tooth width.

All thresholds are documented and configurable below.
"""

import logging
from typing import List, Dict, Tuple, Optional, Any

import numpy as np

from backend.app.schemas.analysis import (
    ToothDetection,
    AlignmentFinding,
    AlignmentScreeningResult,
)

logger = logging.getLogger("dental_ai.alignment_service")

# ---------------------------------------------------------------------------
# Configurable thresholds — documented clearly for clinical transparency
# ---------------------------------------------------------------------------

# Minimum number of teeth per arch required to attempt polynomial curve fitting.
# Below this count the arch geometry is under-determined; no fit is attempted.
MIN_TEETH_FOR_FIT: int = 4

# Normalised deviation threshold.
# A tooth whose centre deviates from the fitted arch curve by more than
# DEVIATION_THRESHOLD × (median tooth width) is flagged for review.
# Value of 0.5 means the deviation is at least half an average tooth width.
# This is intentionally conservative to avoid over-flagging.
DEVIATION_THRESHOLD: float = 0.50

# Spacing irregularity threshold.
# If the gap between two adjacent detected teeth exceeds
# SPACING_THRESHOLD × (mean tooth width), it is noted as a wide spacing region.
SPACING_THRESHOLD: float = 1.5

# Number of points used to render the estimated arch curve on the frontend.
ARCH_CURVE_SAMPLE_POINTS: int = 50

# Upper-arch quadrant numbers (FDI quadrants 1 and 2)
UPPER_QUADRANTS = {1, 2}
# Lower-arch quadrant numbers (FDI quadrants 3 and 4)
LOWER_QUADRANTS = {3, 4}


class AlignmentService:
    """Geometric tooth alignment screening from enumeration model outputs."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_alignment_report(
        self, teeth: List[ToothDetection]
    ) -> AlignmentScreeningResult:
        """
        Analyse detected tooth positions and return an alignment screening result.

        Parameters
        ----------
        teeth : list of ToothDetection
            All teeth detected by the enumeration model in this scan.

        Returns
        -------
        AlignmentScreeningResult
            Contains flagged regions, arch curve points, tooth centres,
            spacing ratios, and an explicit limitation notice.
            If insufficient teeth were detected, sufficient_data=False and
            no findings are generated.
        """
        if not teeth:
            return self._insufficient_result(
                arch="none",
                reason=(
                    "No teeth were detected in this scan. "
                    "Alignment screening requires at least "
                    f"{MIN_TEETH_FOR_FIT} detected teeth per arch."
                ),
            )

        upper_teeth = [t for t in teeth if t.quadrant in UPPER_QUADRANTS]
        lower_teeth = [t for t in teeth if t.quadrant in LOWER_QUADRANTS]

        upper_ok = len(upper_teeth) >= MIN_TEETH_FOR_FIT
        lower_ok = len(lower_teeth) >= MIN_TEETH_FOR_FIT

        if not upper_ok and not lower_ok:
            return self._insufficient_result(
                arch="none",
                reason=(
                    f"Insufficient detections: upper arch has {len(upper_teeth)} teeth, "
                    f"lower arch has {len(lower_teeth)} teeth. "
                    f"A minimum of {MIN_TEETH_FOR_FIT} teeth per arch is required "
                    "for meaningful geometric analysis."
                ),
            )

        all_findings: List[AlignmentFinding] = []
        all_tooth_centers: List[Dict[str, Any]] = []
        all_spacing_ratios: List[Dict[str, Any]] = []
        all_curve_points: List[List[float]] = []
        teeth_analyzed = 0

        if upper_ok:
            f, tc, sr, cp = self._analyse_arch(upper_teeth, "upper")
            all_findings.extend(f)
            all_tooth_centers.extend(tc)
            all_spacing_ratios.extend(sr)
            all_curve_points.extend(cp)
            teeth_analyzed += len(upper_teeth)

        if lower_ok:
            f, tc, sr, cp = self._analyse_arch(lower_teeth, "lower")
            all_findings.extend(f)
            all_tooth_centers.extend(tc)
            all_spacing_ratios.extend(sr)
            all_curve_points.extend(cp)
            teeth_analyzed += len(lower_teeth)

        if upper_ok and lower_ok:
            arch_label = "both"
        elif upper_ok:
            arch_label = "upper"
        else:
            arch_label = "lower"

        return AlignmentScreeningResult(
            sufficient_data=True,
            arch=arch_label,
            teeth_analyzed=teeth_analyzed,
            flagged_count=len(all_findings),
            findings=all_findings,
            arch_curve_points=all_curve_points,
            tooth_centers=all_tooth_centers,
            spacing_ratios=all_spacing_ratios,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _analyse_arch(
        self,
        arch_teeth: List[ToothDetection],
        arch_name: str,
    ) -> Tuple[
        List[AlignmentFinding],
        List[Dict[str, Any]],
        List[Dict[str, Any]],
        List[List[float]],
    ]:
        """
        Analyse one arch (upper or lower).

        Returns
        -------
        findings, tooth_centers, spacing_ratios, curve_points
        """
        # Extract geometry
        centers = self._extract_centers(arch_teeth)
        widths = [t.box.width for t in arch_teeth]
        median_width = float(np.median(widths)) if widths else 1.0

        # Sort by cx (left to right in image)
        paired = sorted(zip(centers, arch_teeth), key=lambda p: p[0][0])
        sorted_centers = [p[0] for p in paired]
        sorted_teeth = [p[1] for p in paired]

        cx_arr = np.array([c[0] for c in sorted_centers])
        cy_arr = np.array([c[1] for c in sorted_centers])

        # Fit 2nd-degree polynomial: cy = f(cx)
        try:
            coeffs = np.polyfit(cx_arr, cy_arr, deg=2)
            poly = np.poly1d(coeffs)
        except Exception as exc:
            logger.warning(f"Polynomial fit failed for {arch_name} arch: {exc}")
            return [], [], [], []

        # Sample arch curve for frontend rendering
        cx_min, cx_max = float(cx_arr.min()), float(cx_arr.max())
        curve_x = np.linspace(cx_min, cx_max, ARCH_CURVE_SAMPLE_POINTS)
        curve_y = poly(curve_x)
        curve_points = [[float(x), float(y)] for x, y in zip(curve_x, curve_y)]

        # Per-tooth deviations
        tooth_centers_out: List[Dict[str, Any]] = []
        findings: List[AlignmentFinding] = []

        for (cx, cy), tooth in zip(sorted_centers, sorted_teeth):
            fitted_cy = float(poly(cx))
            dev_px = abs(cy - fitted_cy)
            dev_norm = dev_px / median_width if median_width > 0 else 0.0

            tooth_centers_out.append({
                "fdi": tooth.fdi_number,
                "cx": round(cx, 1),
                "cy": round(cy, 1),
                "fitted_cy": round(fitted_cy, 1),
                "deviation_px": round(dev_px, 1),
                "deviation_normalized": round(dev_norm, 3),
                "arch": arch_name,
            })

            if dev_norm >= DEVIATION_THRESHOLD:
                findings.append(
                    AlignmentFinding(
                        region=f"{arch_name.capitalize()} arch — near tooth FDI {tooth.fdi_number}",
                        tooth_fdi=tooth.fdi_number,
                        deviation_px=round(dev_px, 1),
                        deviation_normalized=round(dev_norm, 3),
                        description=(
                            f"The detected centre of tooth FDI {tooth.fdi_number} "
                            f"({tooth.anatomical_name}) deviates approximately "
                            f"{dev_px:.0f} px ({dev_norm * 100:.0f}% of average tooth width) "
                            f"from the estimated {arch_name} arch curve. "
                            "This positional deviation may warrant further clinical assessment, "
                            "bearing in mind the inherent limitations of panoramic 2D geometry."
                        ),
                        requires_assessment=True,
                    )
                )

        # Spacing analysis between adjacent detected teeth
        spacing_ratios: List[Dict[str, Any]] = []
        for i in range(len(sorted_teeth) - 1):
            t_a = sorted_teeth[i]
            t_b = sorted_teeth[i + 1]
            # Gap between right edge of t_a and left edge of t_b
            gap = max(0.0, t_b.box.x1 - t_a.box.x2)
            ratio = gap / median_width if median_width > 0 else 0.0
            spacing_ratios.append({
                "from_fdi": t_a.fdi_number,
                "to_fdi": t_b.fdi_number,
                "gap_px": round(gap, 1),
                "ratio": round(ratio, 3),
                "arch": arch_name,
                "wide": ratio >= SPACING_THRESHOLD,
            })

        return findings, tooth_centers_out, spacing_ratios, curve_points

    @staticmethod
    def _extract_centers(teeth: List[ToothDetection]) -> List[Tuple[float, float]]:
        """Return (cx, cy) centre points from bounding boxes."""
        return [
            (
                (t.box.x1 + t.box.x2) / 2.0,
                (t.box.y1 + t.box.y2) / 2.0,
            )
            for t in teeth
        ]

    @staticmethod
    def _insufficient_result(arch: str, reason: str) -> AlignmentScreeningResult:
        return AlignmentScreeningResult(
            sufficient_data=False,
            arch=arch,
            teeth_analyzed=0,
            flagged_count=0,
            findings=[],
            arch_curve_points=[],
            tooth_centers=[],
            spacing_ratios=[],
            insufficient_data_reason=reason,
        )


alignment_service = AlignmentService()
