from fastapi import APIRouter
from backend.app.schemas.analysis import HealthResponse
from backend.app.services.model_service import model_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return application and model readiness status."""
    is_ready = model_service.enumeration_ready and model_service.disease_ready
    return HealthResponse(
        status="healthy" if is_ready else "degraded",
        app_name="DentalAI",
        version="1.0.0",
        device=model_service.device,
        enumeration_model_ready=model_service.enumeration_ready,
        disease_model_ready=model_service.disease_ready,
    )
