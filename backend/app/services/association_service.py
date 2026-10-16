import logging
from typing import List, Tuple
from backend.app.schemas.analysis import (
    EnumerationResult,
    DiseaseAnalysisResult,
    CombinedFinding,
    BoundingBox,
)
from backend.app.config import settings

logger = logging.getLogger("dental_ai.association_service")

class AssociationService:
    def _compute_overlap(self, disease_box: BoundingBox, tooth_box: BoundingBox, is_periapical: bool = False) -> float:
        """Compute the fraction of the disease bounding box that overlaps the tooth bounding box."""
        d_x1, d_y1, d_x2, d_y2 = disease_box.x1, disease_box.y1, disease_box.x2, disease_box.y2
        t_x1, t_y1, t_x2, t_y2 = tooth_box.x1, tooth_box.y1, tooth_box.x2, tooth_box.y2
        
        # Periapical lesions typically appear at the root apex, slightly extending beyond the crown/root box
        if is_periapical:
            t_height = t_y2 - t_y1
            # Expand root search area by 15% vertically
            t_y1 -= t_height * 0.15
            t_y2 += t_height * 0.15

        int_x1 = max(d_x1, t_x1)
        int_y1 = max(d_y1, t_y1)
        int_x2 = min(d_x2, t_x2)
        int_y2 = min(d_y2, t_y2)

        if int_x2 <= int_x1 or int_y2 <= int_y1:
            return 0.0

        int_area = (int_x2 - int_x1) * (int_y2 - int_y1)
        disease_area = (d_x2 - d_x1) * (d_y2 - d_y1)

        if disease_area <= 0:
            return 0.0

        return int_area / disease_area

    def associate_teeth_and_diseases(
        self,
        enumeration: EnumerationResult,
        disease_analysis: DiseaseAnalysisResult,
        overlap_threshold: float = None,
    ) -> Tuple[EnumerationResult, DiseaseAnalysisResult, List[CombinedFinding]]:
        """
        Associate disease detections with specific tooth detections based on spatial overlap.
        Preserves raw detections while producing a documented combined findings list.
        """
        if overlap_threshold is None:
            overlap_threshold = settings.ASSOCIATION_IOU_THRESHOLD

        # Map teeth by FDI number for fast lookup
        tooth_map = {t.fdi_number: t for t in enumeration.teeth}
        
        # Reset any previous associations
        for t in enumeration.teeth:
            t.associated_diseases = []

        # For each disease detection, find the best matching tooth
        for disease in disease_analysis.diseases:
            best_tooth_fdi = None
            max_overlap = 0.0
            is_peri = "Periapical" in disease.disease_name

            for tooth in enumeration.teeth:
                overlap = self._compute_overlap(disease.box, tooth.box, is_periapical=is_peri)
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_tooth_fdi = tooth.fdi_number

            if max_overlap >= overlap_threshold and best_tooth_fdi:
                disease.associated_tooth = best_tooth_fdi
                disease.overlap_ratio = round(max_overlap, 3)
                
                # Add to tooth's associated diseases list
                target_tooth = tooth_map[best_tooth_fdi]
                if disease.disease_name not in target_tooth.associated_diseases:
                    target_tooth.associated_diseases.append(disease.disease_name)
            else:
                disease.associated_tooth = None
                disease.overlap_ratio = round(max_overlap, 3) if max_overlap > 0 else 0.0

        # Construct CombinedFindings for teeth that have findings
        combined_findings: List[CombinedFinding] = []
        for tooth in enumeration.teeth:
            if tooth.associated_diseases:
                # Determine severity
                severity = "Low"
                if any(d in tooth.associated_diseases for d in ["Deep_Caries", "Periapical_Lesion"]):
                    severity = "High"
                elif "Caries" in tooth.associated_diseases:
                    severity = "Moderate"
                elif "Impacted" in tooth.associated_diseases:
                    severity = "Moderate"

                # Find max confidence of associated diseases
                matching_confs = [
                    d.confidence for d in disease_analysis.diseases if d.associated_tooth == tooth.fdi_number
                ]
                max_conf = max(matching_confs) if matching_confs else tooth.confidence

                finding_desc = (
                    f"Tooth FDI {tooth.fdi_number} ({tooth.anatomical_name}) exhibits spatial overlap with "
                    f"{', '.join(tooth.associated_diseases)} (confidence: {max_conf * 100:.1f}%)."
                )

                combined_findings.append(CombinedFinding(
                    tooth_number=tooth.fdi_number,
                    anatomical_name=tooth.anatomical_name,
                    quadrant=tooth.quadrant,
                    findings=list(tooth.associated_diseases),
                    highest_severity=severity,
                    confidence=max_conf,
                    details=finding_desc,
                ))

        # Sort findings by quadrant and tooth number
        combined_findings.sort(key=lambda f: f.tooth_number)

        return enumeration, disease_analysis, combined_findings

association_service = AssociationService()
