import logging
from typing import List
from backend.app.schemas.analysis import (
    CombinedFinding,
    RestorationPlanningGuidance,
)

logger = logging.getLogger("dental_ai.guidance_service")

# ---------------------------------------------------------------------------
# Condition-specific clinical guidance knowledge base.
#
# Each entry contains:
#   condition        : Short clinical label for the detected finding.
#   interpretation   : Plain-language explanation of what the AI finding suggests.
#                      Generated from the actual predicted class — no unsupported claims.
#   next_step        : What type of clinical assessment is appropriate.
#   considerations   : Possible treatment categories, presented as possibilities only,
#                      NOT prescriptions. Final selection requires clinical examination.
#
# SAFETY RULES (enforced here):
#   - No direct prescription of any specific procedure.
#   - No claim that the model has established details it cannot observe.
#   - Considerations are possibilities dependent on clinical findings.
# ---------------------------------------------------------------------------
GUIDANCE_KNOWLEDGE_BASE = {
    "Deep_Caries": {
        "condition": "Deep Carious Lesion",
        "interpretation": (
            "The AI has detected a pattern consistent with extensive tooth decay that may extend "
            "close to the inner part of the tooth (the pulp). The full extent and depth of the "
            "lesion can only be confirmed through clinical examination and targeted radiography."
        ),
        "next_step": (
            "A clinical assessment is recommended to evaluate the depth of the lesion, "
            "the remaining tooth structure, and the vitality of the tooth. "
            "Sensitivity testing and a detailed examination of the tooth are appropriate next steps."
        ),
        "considerations": (
            "Depending on the clinical findings, possible management options may include "
            "deep-cleaning and protective restoration, pulp-preservation treatment, or — "
            "if pulp involvement is confirmed — endodontic assessment. "
            "Final treatment selection depends entirely on the clinical examination."
        ),
    },
    "Caries": {
        "condition": "Carious Lesion",
        "interpretation": (
            "The AI has detected a pattern that may indicate tooth decay affecting the enamel "
            "or dentine. The lesion's exact extent, activity status, and depth require clinical "
            "and radiographic assessment to determine."
        ),
        "next_step": (
            "A clinical examination is recommended to assess the lesion directly, including "
            "visual inspection, tactile probing, and review of any relevant periapical radiographs "
            "for a complete picture of the affected area."
        ),
        "considerations": (
            "Depending on the size and activity of the lesion, management options may range from "
            "preventive remineralisation approaches to direct restoration. "
            "The appropriate option will be determined by the treating dentist after examination."
        ),
    },
    "Periapical_Lesion": {
        "condition": "Periapical Radiolucency",
        "interpretation": (
            "The AI has detected a pattern near the root tip of the tooth that may be consistent "
            "with inflammation or changes in the surrounding bone. This type of finding is often "
            "associated with infection or non-vitality of the tooth, but clinical confirmation "
            "is necessary before drawing any conclusions."
        ),
        "next_step": (
            "Clinical evaluation is recommended, including assessment of the tooth's vitality, "
            "tenderness to percussion, and review of targeted periapical radiographs. "
            "The treating dentist will determine whether further investigation is needed."
        ),
        "considerations": (
            "Depending on the clinical and radiographic findings, options may include "
            "monitoring, root canal assessment, retreatment of a previously treated tooth, "
            "or referral for specialist evaluation. "
            "The appropriate course of action requires clinical examination."
        ),
    },
    "Impacted": {
        "condition": "Impacted / Unerupted Tooth",
        "interpretation": (
            "The AI has detected a tooth whose position suggests it may be impacted — "
            "meaning its path of eruption may be blocked by adjacent teeth, bone, or soft tissue. "
            "The clinical significance depends on factors that require direct assessment."
        ),
        "next_step": (
            "An assessment is recommended to evaluate the tooth's position, eruption status, "
            "and its relationship to adjacent teeth and surrounding structures. "
            "The treating dentist may consider additional imaging if required."
        ),
        "considerations": (
            "Depending on the clinical assessment, management options may include "
            "monitoring with periodic review, surgical exposure and orthodontic guidance, "
            "or extraction if clinically indicated. "
            "The appropriate option will be determined following a thorough examination."
        ),
    },
}


class GuidanceService:
    def generate_guidance(
        self, combined_findings: List[CombinedFinding]
    ) -> List[RestorationPlanningGuidance]:
        """
        Generate concise, condition-specific clinical guidance for each detected finding.

        Guidance is derived strictly from the predicted disease class.
        No prescriptions are made; treatment considerations are presented as
        possibilities dependent on clinical examination.
        """
        guidance_list: List[RestorationPlanningGuidance] = []

        for finding in combined_findings:
            for disease_name in finding.findings:
                kb_entry = GUIDANCE_KNOWLEDGE_BASE.get(disease_name)
                if kb_entry:
                    guidance = RestorationPlanningGuidance(
                        tooth_number=finding.tooth_number,
                        anatomical_name=finding.anatomical_name,
                        condition=kb_entry["condition"],
                        clinical_interpretation=kb_entry["interpretation"],
                        recommended_next_step=kb_entry["next_step"],
                        treatment_considerations=kb_entry["considerations"],
                        # evaluation_questions intentionally empty — removed from UI and PDF
                        evaluation_questions=[],
                    )
                    guidance_list.append(guidance)

        return guidance_list


guidance_service = GuidanceService()
