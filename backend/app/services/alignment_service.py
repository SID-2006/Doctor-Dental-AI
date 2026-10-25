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
    OverlappingPair,
    CrowdingArchDetail,
    CrowdingAnalysis,
    MidlineDiastema,
    SpacingAnalysis,
    RotationFinding,
)

logger = logging.getLogger("dental_ai.alignment_service")

# ---------------------------------------------------------------------------
# Configurable thresholds — documented clearly for clinical transparency
# ---------------------------------------------------------------------------

# Minimum number of teeth per arch required to attempt polynomial curve fitting.
MIN_TEETH_FOR_FIT: int = 4

# Normalised deviation threshold from fitted arch curve.
DEVIATION_THRESHOLD: float = 0.50

# Spacing irregularity thresholds
SPACING_GAP_RATIO_THRESHOLD: float = 0.35   # Noticeable interdental gap (>35% of median tooth width)
SPACING_THRESHOLD: float = 1.5              # Wide spacing threshold (>150% of median tooth width)
DIASTEMA_MIN_GAP_PX: float = 6.0            # Minimum gap in px to flag midline diastema
DIASTEMA_RATIO_THRESHOLD: float = 0.12      # Minimum ratio of tooth width for midline diastema

# Crowding thresholds
OVERLAP_RATIO_THRESHOLD: float = 0.05       # Minimum 5% width overlap to register overlapping teeth

# Rotation aspect-ratio deviation threshold
ROTATION_DEV_THRESHOLD: float = 0.25        # 25% deviation from expected aspect ratio

# Number of points used to render the estimated arch curve on the frontend.
ARCH_CURVE_SAMPLE_POINTS: int = 50

# Upper-arch quadrant numbers (FDI quadrants 1 and 2)
UPPER_QUADRANTS = {1, 2}
# Lower-arch quadrant numbers (FDI quadrants 3 and 4)
LOWER_QUADRANTS = {3, 4}

# Standard expected aspect ratio (width / height) on panoramic radiographs by FDI number
EXPECTED_ASPECT_RATIOS: Dict[str, float] = {
    # Maxillary (Upper)
    "11": 0.78, "21": 0.78,  # Central incisors
    "12": 0.64, "22": 0.64,  # Lateral incisors
    "13": 0.66, "23": 0.66,  # Canines
    "14": 0.75, "24": 0.75,  # 1st Premolars
    "15": 0.75, "25": 0.75,  # 2nd Premolars
    "16": 1.10, "26": 1.10,  # 1st Molars
    "17": 1.08, "27": 1.08,  # 2nd Molars
    "18": 1.05, "28": 1.05,  # 3rd Molars
    # Mandibular (Lower)
    "31": 0.50, "41": 0.50,  # Central incisors
    "32": 0.54, "42": 0.54,  # Lateral incisors
    "33": 0.62, "43": 0.62,  # Canines
    "34": 0.72, "44": 0.72,  # 1st Premolars
    "35": 0.72, "45": 0.72,  # 2nd Premolars
    "36": 1.15, "46": 1.15,  # 1st Molars
    "37": 1.12, "47": 1.12,  # 2nd Molars
    "38": 1.10, "48": 1.10,  # 3rd Molars
}

TOOTH_TYPE_ASPECT_RATIOS: Dict[str, float] = {
    "Incisor": 0.65,
    "Canine": 0.64,
    "Premolar": 0.74,
    "Molar": 1.10,
}


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
        Covers arch curve deviation, crowding (arch-length discrepancy & overlaps),
        spacing (interdental gaps & midline diastema), and tooth rotation screening.
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
        all_rotations: List[RotationFinding] = []
        upper_crowd_detail: Optional[CrowdingArchDetail] = None
        lower_crowd_detail: Optional[CrowdingArchDetail] = None
        upper_diastema: Optional[MidlineDiastema] = None
        lower_diastema: Optional[MidlineDiastema] = None
        all_spaced_pairs: List[Dict[str, Any]] = []
        teeth_analyzed = 0

        if upper_ok:
            f, tc, sr, cp, rot, crowd_det, diastema, spaced = self._analyse_arch(
                upper_teeth, "upper"
            )
            all_findings.extend(f)
            all_tooth_centers.extend(tc)
            all_spacing_ratios.extend(sr)
            all_curve_points.extend(cp)
            all_rotations.extend(rot)
            upper_crowd_detail = crowd_det
            upper_diastema = diastema
            all_spaced_pairs.extend(spaced)
            teeth_analyzed += len(upper_teeth)

        if lower_ok:
            f, tc, sr, cp, rot, crowd_det, diastema, spaced = self._analyse_arch(
                lower_teeth, "lower"
            )
            all_findings.extend(f)
            all_tooth_centers.extend(tc)
            all_spacing_ratios.extend(sr)
            all_curve_points.extend(cp)
            all_rotations.extend(rot)
            lower_crowd_detail = crowd_det
            lower_diastema = diastema
            all_spaced_pairs.extend(spaced)
            teeth_analyzed += len(lower_teeth)

        if upper_ok and lower_ok:
            arch_label = "both"
        elif upper_ok:
            arch_label = "upper"
        else:
            arch_label = "lower"

        # Build Crowding Analysis
        all_overlaps: List[OverlappingPair] = []
        if upper_crowd_detail:
            all_overlaps.extend(upper_crowd_detail.overlapping_pairs)
        if lower_crowd_detail:
            all_overlaps.extend(lower_crowd_detail.overlapping_pairs)

        severities = [c.severity for c in [upper_crowd_detail, lower_crowd_detail] if c]
        if "Severe" in severities:
            overall_crowding_sev = "Severe"
        elif "Moderate" in severities:
            overall_crowding_sev = "Moderate"
        elif "Mild" in severities:
            overall_crowding_sev = "Mild"
        else:
            overall_crowding_sev = "None"

        has_crowding = overall_crowding_sev != "None" or len(all_overlaps) > 0
        crowding_desc_parts = []
        if has_crowding:
            if upper_crowd_detail and upper_crowd_detail.severity != "None":
                crowding_desc_parts.append(
                    f"Upper arch shows {upper_crowd_detail.severity.lower()} crowding "
                    f"(space discrepancy: {upper_crowd_detail.space_discrepancy_px:.0f} px, "
                    f"{len(upper_crowd_detail.overlapping_pairs)} overlapping pair(s))."
                )
            if lower_crowd_detail and lower_crowd_detail.severity != "None":
                crowding_desc_parts.append(
                    f"Lower arch shows {lower_crowd_detail.severity.lower()} crowding "
                    f"(space discrepancy: {lower_crowd_detail.space_discrepancy_px:.0f} px, "
                    f"{len(lower_crowd_detail.overlapping_pairs)} overlapping pair(s))."
                )
        else:
            crowding_desc_parts.append("No significant 2D arch-length crowding or tooth overlaps detected.")

        crowding_analysis = CrowdingAnalysis(
            has_crowding=has_crowding,
            overall_severity=overall_crowding_sev,
            upper_arch=upper_crowd_detail,
            lower_arch=lower_crowd_detail,
            overlapping_pairs=all_overlaps,
            description=" ".join(crowding_desc_parts),
        )

        # Build Spacing Analysis
        primary_diastema = upper_diastema if (upper_diastema and upper_diastema.present) else lower_diastema
        wide_spacing_count = sum(1 for sr in all_spacing_ratios if sr.get("wide", False))
        has_spacing = (primary_diastema and primary_diastema.present) or len(all_spaced_pairs) > 0 or wide_spacing_count > 0

        if len(all_spaced_pairs) >= 3 or wide_spacing_count >= 2:
            spacing_sev = "Generalized"
        elif (primary_diastema and primary_diastema.present) or wide_spacing_count >= 1:
            spacing_sev = "Moderate"
        elif len(all_spaced_pairs) >= 1:
            spacing_sev = "Mild"
        else:
            spacing_sev = "None"

        spacing_desc_parts = []
        if primary_diastema and primary_diastema.present and primary_diastema.description:
            spacing_desc_parts.append(primary_diastema.description)
        if wide_spacing_count > 0:
            spacing_desc_parts.append(f"{wide_spacing_count} wide interdental spacing region(s) identified.")
        elif not spacing_desc_parts:
            spacing_desc_parts.append("Interdental spacing is within standard anatomical parameters.")

        spacing_analysis = SpacingAnalysis(
            has_spacing=has_spacing,
            overall_severity=spacing_sev,
            midline_diastema=primary_diastema,
            wide_spacing_count=wide_spacing_count,
            spaced_pairs=all_spaced_pairs,
            description=" ".join(spacing_desc_parts),
        )

        return AlignmentScreeningResult(
            sufficient_data=True,
            arch=arch_label,
            teeth_analyzed=teeth_analyzed,
            flagged_count=len(all_findings),
            findings=all_findings,
            arch_curve_points=all_curve_points,
            tooth_centers=all_tooth_centers,
            spacing_ratios=all_spacing_ratios,
            crowding=crowding_analysis,
            spacing=spacing_analysis,
            rotations=all_rotations,
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
        List[RotationFinding],
        Optional[CrowdingArchDetail],
        Optional[MidlineDiastema],
        List[Dict[str, Any]],
    ]:
        """
        Analyse one arch (upper or lower).
        Returns:
            findings, tooth_centers, spacing_ratios, curve_points,
            rotations, crowding_detail, midline_diastema, spaced_pairs
        """
        centers = self._extract_centers(arch_teeth)
        widths = [t.box.width for t in arch_teeth]
        median_width = float(np.median(widths)) if widths else 1.0

        # Sort left to right in image
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
            return [], [], [], [], [], None, None, []

        # Sample arch curve for frontend rendering
        cx_min, cx_max = float(cx_arr.min()), float(cx_arr.max())
        curve_x = np.linspace(cx_min, cx_max, ARCH_CURVE_SAMPLE_POINTS)
        curve_y = poly(curve_x)
        curve_points = [[float(x), float(y)] for x, y in zip(curve_x, curve_y)]

        # 1. Per-tooth deviations from arch curve
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
                "box": {
                    "x1": round(tooth.box.x1, 1),
                    "y1": round(tooth.box.y1, 1),
                    "x2": round(tooth.box.x2, 1),
                    "y2": round(tooth.box.y2, 1),
                    "w": round(tooth.box.width, 1),
                    "h": round(tooth.box.height, 1),
                },
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
                            "This positional deviation may warrant further clinical assessment."
                        ),
                        requires_assessment=True,
                    )
                )

        # 2. Spacing analysis & Midline Diastema
        spacing_ratios: List[Dict[str, Any]] = []
        spaced_pairs: List[Dict[str, Any]] = []
        midline_diastema: Optional[MidlineDiastema] = None
        target_midline_pair = {"11", "21"} if arch_name == "upper" else {"31", "41"}

        for i in range(len(sorted_teeth) - 1):
            t_a = sorted_teeth[i]
            t_b = sorted_teeth[i + 1]
            gap = max(0.0, t_b.box.x1 - t_a.box.x2)
            ratio = gap / median_width if median_width > 0 else 0.0
            mid_y = (t_a.box.y1 + t_a.box.y2 + t_b.box.y1 + t_b.box.y2) / 4.0

            spacing_item = {
                "from_fdi": t_a.fdi_number,
                "to_fdi": t_b.fdi_number,
                "gap_px": round(gap, 1),
                "ratio": round(ratio, 3),
                "arch": arch_name,
                "wide": ratio >= SPACING_THRESHOLD,
                "x1": round(t_a.box.x2, 1),
                "x2": round(t_b.box.x1, 1),
                "y": round(mid_y, 1),
            }
            spacing_ratios.append(spacing_item)

            if ratio >= SPACING_GAP_RATIO_THRESHOLD:
                spaced_pairs.append(spacing_item)

            # Check midline diastema between 11-21 or 31-41
            pair_set = {t_a.fdi_number, t_b.fdi_number}
            if pair_set == target_midline_pair:
                if ratio >= DIASTEMA_RATIO_THRESHOLD or gap >= DIASTEMA_MIN_GAP_PX:
                    midline_diastema = MidlineDiastema(
                        present=True,
                        arch=arch_name,
                        gap_px=round(gap, 1),
                        ratio=round(ratio, 3),
                        teeth=sorted(list(pair_set)),
                        description=(
                            f"Midline diastema of approximately {gap:.0f} px "
                            f"({ratio * 100:.0f}% avg tooth width) detected between central incisors "
                            f"FDI {t_a.fdi_number} and FDI {t_b.fdi_number}."
                        ),
                        x1=round(t_a.box.x2, 1),
                        x2=round(t_b.box.x1, 1),
                        y=round(mid_y, 1),
                    )

        # 3. Crowding analysis (arch-length vs tooth width sum & horizontal overlaps)
        # Compute arc length of fitted polynomial along arch span
        x_min_arch = min(t.box.x1 for t in arch_teeth)
        x_max_arch = max(t.box.x2 for t in arch_teeth)
        fine_xs = np.linspace(x_min_arch, x_max_arch, 150)
        fine_ys = poly(fine_xs)
        dx = np.diff(fine_xs)
        dy = np.diff(fine_ys)
        available_arch_length = float(np.sum(np.sqrt(dx**2 + dy**2)))

        total_tooth_width = float(sum(t.box.width for t in arch_teeth))
        space_discrepancy = available_arch_length - total_tooth_width
        discrepancy_ratio = space_discrepancy / available_arch_length if available_arch_length > 0 else 0.0

        overlapping_pairs: List[OverlappingPair] = []
        for i in range(len(sorted_teeth) - 1):
            t_a = sorted_teeth[i]
            t_b = sorted_teeth[i + 1]
            if t_b.box.x1 < t_a.box.x2:
                overlap = t_a.box.x2 - t_b.box.x1
                overlap_ratio = overlap / median_width if median_width > 0 else 0.0
                if overlap_ratio >= OVERLAP_RATIO_THRESHOLD:
                    y_top = min(t_a.box.y1, t_b.box.y1)
                    y_bot = max(t_a.box.y2, t_b.box.y2)
                    overlapping_pairs.append(
                        OverlappingPair(
                            from_fdi=t_a.fdi_number,
                            to_fdi=t_b.fdi_number,
                            overlap_px=round(overlap, 1),
                            overlap_ratio=round(overlap_ratio, 3),
                            arch=arch_name,
                            overlap_x1=round(t_b.box.x1, 1),
                            overlap_x2=round(t_a.box.x2, 1),
                            y1=round(y_top, 1),
                            y2=round(y_bot, 1),
                            cx=round((t_b.box.x1 + t_a.box.x2) / 2.0, 1),
                            cy=round((y_top + y_bot) / 2.0, 1),
                        )
                    )

        max_overlap_ratio = max([p.overlap_ratio for p in overlapping_pairs], default=0.0)
        if max_overlap_ratio >= 0.25 or discrepancy_ratio <= -0.15 or len(overlapping_pairs) >= 3:
            crowd_sev = "Severe"
        elif max_overlap_ratio >= 0.10 or discrepancy_ratio <= -0.06 or len(overlapping_pairs) >= 1:
            crowd_sev = "Moderate"
        elif max_overlap_ratio >= OVERLAP_RATIO_THRESHOLD or discrepancy_ratio < -0.02:
            crowd_sev = "Mild"
        else:
            crowd_sev = "None"

        crowding_detail = CrowdingArchDetail(
            arch=arch_name,
            teeth_count=len(arch_teeth),
            total_tooth_width_px=round(total_tooth_width, 1),
            available_arch_length_px=round(available_arch_length, 1),
            space_discrepancy_px=round(space_discrepancy, 1),
            discrepancy_ratio=round(discrepancy_ratio, 3),
            severity=crowd_sev,
            overlapping_pairs=overlapping_pairs,
        )

        # 4. Tooth rotation screening (Aspect ratio deviation from normal anatomical projection)
        rotations: List[RotationFinding] = []
        for tooth in arch_teeth:
            w = tooth.box.width
            h = tooth.box.height
            if h <= 0:
                continue
            aspect_ratio = w / h
            expected_ar = EXPECTED_ASPECT_RATIOS.get(
                tooth.fdi_number,
                TOOTH_TYPE_ASPECT_RATIOS.get(tooth.tooth_type, 0.75),
            )
            dev = abs(aspect_ratio - expected_ar) / expected_ar

            if dev >= ROTATION_DEV_THRESHOLD:
                if dev >= 0.45:
                    rot_sev = "Marked"
                elif dev >= 0.35:
                    rot_sev = "Moderate"
                else:
                    rot_sev = "Mild"

                direction = "narrower (axial twist / rotated profile)" if aspect_ratio < expected_ar else "wider (tilted crown profile)"
                rotations.append(
                    RotationFinding(
                        fdi=tooth.fdi_number,
                        anatomical_name=tooth.anatomical_name,
                        arch=arch_name,
                        aspect_ratio=round(aspect_ratio, 2),
                        expected_ratio=round(expected_ar, 2),
                        deviation_percent=round(dev * 100, 1),
                        severity=rot_sev,
                        description=(
                            f"Tooth FDI {tooth.fdi_number} ({tooth.anatomical_name}) exhibits an aspect ratio "
                            f"of {aspect_ratio:.2f} (expected standard ~{expected_ar:.2f}, {dev * 100:.0f}% deviation, {direction}). "
                            "This geometric alteration indicates potential axial tooth rotation or significant crown tipping."
                        ),
                        cx=round((tooth.box.x1 + tooth.box.x2) / 2.0, 1),
                        cy=round((tooth.box.y1 + tooth.box.y2) / 2.0, 1),
                        x1=round(tooth.box.x1, 1),
                        y1=round(tooth.box.y1, 1),
                        x2=round(tooth.box.x2, 1),
                        y2=round(tooth.box.y2, 1),
                    )
                )

        return (
            findings,
            tooth_centers_out,
            spacing_ratios,
            curve_points,
            rotations,
            crowding_detail,
            midline_diastema,
            spaced_pairs,
        )

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
            crowding=None,
            spacing=None,
            rotations=[],
            insufficient_data_reason=reason,
        )


alignment_service = AlignmentService()
