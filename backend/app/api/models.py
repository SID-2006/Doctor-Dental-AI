from fastapi import APIRouter
from backend.app.schemas.analysis import ModelsInfoResponse
from backend.app.services.model_service import model_service

router = APIRouter()

@router.get("/models/info", response_model=ModelsInfoResponse)
def get_models_info() -> ModelsInfoResponse:
    """Return discovered model metadata, class mappings, and capabilities."""
    info = model_service.get_models_info()
    return ModelsInfoResponse(**info)
