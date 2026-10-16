"""
Tests for the tooth alignment screening service.
Run from the project root:
    backend/.venv/bin/pytest backend/tests/test_alignment_service.py -v
"""
import pytest
from backend.app.schemas.analysis import BoundingBox, ToothDetection
from backend.app.services.alignment_service import (
    AlignmentService,
    MIN_TEETH_FOR_FIT,
    DEVIATION_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_tooth(fdi: str, x1: float, y1: float, x2: float, y2: float,
               quadrant: int = 1, confidence: float = 0.85) -> ToothDetection:
    return ToothDetection(
        id=f"tooth-{fdi}",
        fdi_number=fdi,
        anatomical_name=f"Test Tooth {fdi}",
        quadrant=quadrant,
        tooth_type="Incisor",
        confidence=confidence,
        box=BoundingBox(
            x1=x1, y1=y1, x2=x2, y2=y2,
            width=x2 - x1, height=y2 - y1,
        ),
        associated_diseases=[],
    )


def make_upper_arch_teeth(n: int = 6) -> list:
    """Create n upper-arch teeth laid out in a roughly parabolic arc."""
    teeth = []
    fdi_ids = ["11", "12", "13", "14", "15", "16", "17", "18"][:n]
    for i, fdi in enumerate(fdi_ids):
        cx = 100 + i * 60
        # Simulate upper arch: slight downward curve toward the centre
        cy = 200 + (i - n // 2) ** 2 * 2
        w, h = 40, 50
        teeth.append(make_tooth(fdi, cx - w/2, cy - h/2, cx + w/2, cy + h/2, quadrant=1))
    return teeth


def make_lower_arch_teeth(n: int = 6) -> list:
    """Create n lower-arch teeth laid out in a roughly parabolic arc."""
    teeth = []
    fdi_ids = ["41", "42", "43", "44", "45", "46", "47", "48"][:n]
    for i, fdi in enumerate(fdi_ids):
        cx = 100 + i * 60
        cy = 400 + (i - n // 2) ** 2 * 2
        w, h = 40, 50
        teeth.append(make_tooth(fdi, cx - w/2, cy - h/2, cx + w/2, cy + h/2, quadrant=4))
    return teeth


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestInsufficientData:
    def test_no_teeth_returns_insufficient(self):
        svc = AlignmentService()
        result = svc.generate_alignment_report([])
        assert result.sufficient_data is False
        assert result.flagged_count == 0
        assert result.findings == []
        assert result.insufficient_data_reason is not None

    def test_too_few_teeth_per_arch_returns_insufficient(self):
        svc = AlignmentService()
        # 2 upper teeth + 2 lower teeth — both below MIN_TEETH_FOR_FIT (4)
        teeth = make_upper_arch_teeth(2) + make_lower_arch_teeth(2)
        result = svc.generate_alignment_report(teeth)
        assert result.sufficient_data is False
        assert "Insufficient" in (result.insufficient_data_reason or "")

    def test_exactly_min_teeth_allows_fit(self):
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(MIN_TEETH_FOR_FIT)
        result = svc.generate_alignment_report(teeth)
        assert result.sufficient_data is True
        assert result.teeth_analyzed == MIN_TEETH_FOR_FIT


class TestArchGrouping:
    def test_upper_arch_only(self):
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(6)
        result = svc.generate_alignment_report(teeth)
        assert result.sufficient_data is True
        assert result.arch in ("upper", "both")
        assert result.teeth_analyzed == 6

    def test_lower_arch_only(self):
        svc = AlignmentService()
        teeth = make_lower_arch_teeth(6)
        result = svc.generate_alignment_report(teeth)
        assert result.sufficient_data is True
        assert result.arch in ("lower", "both")

    def test_both_arches(self):
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(6) + make_lower_arch_teeth(6)
        result = svc.generate_alignment_report(teeth)
        assert result.arch == "both"
        assert result.teeth_analyzed == 12


class TestDeviationCalculation:
    def test_teeth_on_perfect_arch_no_flags(self):
        """Teeth placed exactly on a parabola should not be flagged."""
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(8)
        result = svc.generate_alignment_report(teeth)
        # Teeth are generated on a clean parabola; deviation should be near zero
        assert result.flagged_count == 0

    def test_outlier_tooth_gets_flagged(self):
        """A tooth grossly displaced from the arch should be flagged."""
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(7)
        # Introduce a large vertical displacement on the last tooth
        outlier = teeth[-1]
        outlier.box.y1 += 300
        outlier.box.y2 += 300
        result = svc.generate_alignment_report(teeth)
        # At least the outlier should appear in findings
        assert result.flagged_count >= 1

    def test_tooth_centers_count_matches_teeth(self):
        svc = AlignmentService()
        n = 6
        teeth = make_upper_arch_teeth(n)
        result = svc.generate_alignment_report(teeth)
        assert len(result.tooth_centers) == n

    def test_arch_curve_points_generated(self):
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(6)
        result = svc.generate_alignment_report(teeth)
        assert len(result.arch_curve_points) > 0
        for pt in result.arch_curve_points:
            assert len(pt) == 2


class TestSpacingAnalysis:
    def test_spacing_ratios_count(self):
        """Spacing ratios should be n-1 for n sorted teeth."""
        svc = AlignmentService()
        n = 6
        teeth = make_upper_arch_teeth(n)
        result = svc.generate_alignment_report(teeth)
        assert len(result.spacing_ratios) == n - 1

    def test_spacing_ratio_fields_present(self):
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(6)
        result = svc.generate_alignment_report(teeth)
        for sr in result.spacing_ratios:
            assert "from_fdi" in sr
            assert "to_fdi" in sr
            assert "gap_px" in sr
            assert "ratio" in sr
            assert "wide" in sr

    def test_zero_gap_not_flagged_as_wide(self):
        """Overlapping / touching teeth should not be flagged as wide spacing."""
        svc = AlignmentService()
        teeth = make_upper_arch_teeth(6)
        # Make teeth overlap by adjusting x2 of each to exceed x1 of the next
        for i in range(len(teeth) - 1):
            teeth[i].box.x2 = teeth[i + 1].box.x1 + 10
        result = svc.generate_alignment_report(teeth)
        for sr in result.spacing_ratios:
            assert not sr["wide"], f"Expected no wide gaps but got: {sr}"


class TestLimitationNotice:
    def test_limitation_note_always_present(self):
        svc = AlignmentService()
        # Sufficient data
        result_ok = svc.generate_alignment_report(make_upper_arch_teeth(6))
        assert len(result_ok.limitation_note) > 50

        # Insufficient data
        result_bad = svc.generate_alignment_report([])
        assert len(result_bad.limitation_note) > 50
