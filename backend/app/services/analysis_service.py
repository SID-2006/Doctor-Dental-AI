import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from fastapi import UploadFile

from backend.app.config import settings
from backend.app.schemas.analysis import (
    AnalysisResponse,
    ImageUrls,
)
from backend.app.services.image_service import image_service
from backend.app.services.enumeration_service import enumeration_service
from backend.app.services.disease_service import disease_service
from backend.app.services.association_service import association_service
from backend.app.services.guidance_service import guidance_service
from backend.app.services.alignment_service import alignment_service
from backend.app.services.report_service import report_service
from backend.app.services.model_service import model_service
from backend.app.storage.analysis_store import analysis_store

logger = logging.getLogger("dental_ai.analysis_service")

class AnalysisService:
    async def process_scan(
        self,
        file: UploadFile,
        enumeration_conf: Optional[float] = None,
        disease_conf: Optional[float] = None,
    ) -> AnalysisResponse:
        """Complete orchestrated analysis pipeline for a dental scan upload."""
        e_conf = enumeration_conf if enumeration_conf is not None else settings.CONFIDENCE_ENUMERATION
        d_conf = disease_conf if disease_conf is not None else settings.CONFIDENCE_DISEASE

        # 1. Allocate unique ID and storage directory
        analysis_id = analysis_store.generate_id()
        analysis_dir = analysis_store.get_analysis_dir(analysis_id)
        analysis_dir.mkdir(parents=True, exist_ok=True)

        original_image_path = analysis_dir / "original.jpg"

        # 2. Validate and save uploaded image
        image_info = await image_service.validate_and_save_upload(file, original_image_path)

        # 3. Run model inferences off the event loop using asyncio.to_thread
        logger.info(f"Running inference for analysis {analysis_id}...")
        
        enumeration_result, disease_result = await asyncio.gather(
            asyncio.to_thread(enumeration_service.run_enumeration, str(original_image_path), e_conf),
            asyncio.to_thread(disease_service.run_disease_inference, str(original_image_path), d_conf),
        )

        # 4. Perform tooth-disease spatial association
        enumeration_res, disease_res, combined_findings = association_service.associate_teeth_and_diseases(
            enumeration_result,
            disease_result,
            settings.ASSOCIATION_IOU_THRESHOLD,
        )

        # 5. Generate rule-based restoration planning guidance (no chairside questions)
        restoration_guidance = guidance_service.generate_guidance(combined_findings)

        # 6. Run geometric tooth alignment screening (no new model — uses bounding boxes only)
        alignment_screening = None
        try:
            alignment_screening = alignment_service.generate_alignment_report(enumeration_res.teeth)
            logger.info(
                f"Alignment screening complete: sufficient_data={alignment_screening.sufficient_data}, "
                f"flagged={alignment_screening.flagged_count}"
            )
        except Exception as e:
            logger.warning(f"Alignment screening failed (non-fatal): {e}")
            # alignment_screening remains None; UI shows graceful fallback

        # 7. Generate clinical annotation images (combined, teeth only, diseases only)
        annotated_paths = await asyncio.to_thread(
            image_service.generate_annotated_images,
            original_image_path,
            enumeration_res,
            disease_res,
            analysis_dir,
        )

        # 8. Construct image URLs
        image_urls = ImageUrls(
            original=f"/api/analysis/{analysis_id}/image/original",
            annotated=f"/api/analysis/{analysis_id}/image/annotated",
            teeth_only=f"/api/analysis/{analysis_id}/image/teeth_only",
            diseases_only=f"/api/analysis/{analysis_id}/image/diseases_only",
        )

        # Collect warnings
        warnings: List[str] = []
        if enumeration_res.detections_count == 0:
            warnings.append("No teeth were localized by the enumeration model at the current confidence threshold.")
        if disease_res.detections_count == 0:
            warnings.append("No dental disease lesions were detected by the disease model at the current confidence threshold.")
        if not model_service.enumeration_ready:
            warnings.append(f"Enumeration model warning: {model_service.enumeration_error}")
        if not model_service.disease_ready:
            warnings.append(f"Disease model warning: {model_service.disease_error}")

        # 9. Assemble response
        analysis_response = AnalysisResponse(
            analysis_id=analysis_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            image_info=image_info,
            image_urls=image_urls,
            enumeration=enumeration_res,
            disease_analysis=disease_res,
            combined_findings=combined_findings,
            restoration_guidance=restoration_guidance,
            alignment_screening=alignment_screening,
            model_metadata=model_service.get_models_info(),
            warnings=warnings,
        )

        # 10. Pre-generate PDF report in background thread
        try:
            await asyncio.to_thread(report_service.generate_pdf_report, analysis_response, analysis_dir)
        except Exception as e:
            logger.error(f"Error pre-generating PDF report: {e}")
            warnings.append(f"PDF pre-generation deferred: {str(e)}")

        # 11. Persist analysis JSON
        analysis_store.save_analysis(analysis_response)

        return analysis_response

analysis_service = AnalysisService()
