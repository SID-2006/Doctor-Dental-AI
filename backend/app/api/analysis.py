from typing import Optional
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from backend.app.schemas.analysis import AnalysisResponse
from backend.app.services.analysis_service import analysis_service
from backend.app.services.report_service import report_service
from backend.app.storage.analysis_store import analysis_store

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_scan(
    file: UploadFile = File(...),
    enumeration_conf: Optional[float] = Form(None),
    disease_conf: Optional[float] = Form(None),
) -> AnalysisResponse:
    """Upload dental radiograph image and perform tooth enumeration & disease analysis."""
    try:
        return await analysis_service.process_scan(
            file=file,
            enumeration_conf=enumeration_conf,
            disease_conf=disease_conf,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference pipeline execution error: {str(e)}")

@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(analysis_id: str) -> AnalysisResponse:
    """Retrieve existing analysis results by ID."""
    result = analysis_store.get_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")
    return result

@router.get("/analysis/{analysis_id}/image/original")
def get_original_image(analysis_id: str):
    """Serve the original uploaded scan image."""
    img_path = analysis_store.get_file_path(analysis_id, "original.jpg")
    if not img_path:
        raise HTTPException(status_code=404, detail="Original image not found.")
    return FileResponse(img_path, media_type="image/jpeg", filename=f"{analysis_id}_original.jpg")

@router.get("/analysis/{analysis_id}/image/annotated")
def get_annotated_image(analysis_id: str):
    """Serve the clinical multi-model annotated image."""
    img_path = analysis_store.get_file_path(analysis_id, "annotated.jpg")
    if not img_path:
        raise HTTPException(status_code=404, detail="Annotated image not found.")
    return FileResponse(img_path, media_type="image/jpeg", filename=f"{analysis_id}_annotated.jpg")

@router.get("/analysis/{analysis_id}/image/teeth_only")
def get_teeth_only_image(analysis_id: str):
    """Serve the teeth-only enumeration visualization."""
    img_path = analysis_store.get_file_path(analysis_id, "teeth_only.jpg")
    if not img_path:
        raise HTTPException(status_code=404, detail="Teeth annotation image not found.")
    return FileResponse(img_path, media_type="image/jpeg", filename=f"{analysis_id}_teeth.jpg")

@router.get("/analysis/{analysis_id}/image/diseases_only")
def get_diseases_only_image(analysis_id: str):
    """Serve the disease lesions-only detection visualization."""
    img_path = analysis_store.get_file_path(analysis_id, "diseases_only.jpg")
    if not img_path:
        raise HTTPException(status_code=404, detail="Diseases annotation image not found.")
    return FileResponse(img_path, media_type="image/jpeg", filename=f"{analysis_id}_diseases.jpg")

@router.get("/analysis/{analysis_id}/report")
def get_pdf_report(analysis_id: str):
    """Download generated PDF clinical diagnostic report."""
    analysis = analysis_store.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")
    
    pdf_path = analysis_store.get_file_path(analysis_id, "report.pdf")
    if not pdf_path or not pdf_path.exists():
        # Generate on-demand if not pre-generated
        analysis_dir = analysis_store.get_analysis_dir(analysis_id)
        pdf_path = report_service.generate_pdf_report(analysis, analysis_dir)
        
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"DentalAI_Report_{analysis_id}.pdf",
    )
