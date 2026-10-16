import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.models import router as models_router
from backend.app.api.analysis import router as analysis_router
from backend.app.services.model_service import model_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("dental_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DentalAI Backend Services...")
    # Initialize PyTorch / YOLO models once on startup
    model_service.initialize_models()
    yield
    logger.info("Shutting down DentalAI Backend Services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Dental Diagnosis and Restoration Planning Using Tooth Alignment Analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development and frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX, tags=["Health"])
app.include_router(models_router, prefix=settings.API_V1_PREFIX, tags=["Models"])
app.include_router(analysis_router, prefix=settings.API_V1_PREFIX, tags=["Analysis"])

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "title": settings.PROJECT_TITLE,
        "docs": "/docs",
        "health": "/api/health",
        "models": "/api/models/info",
        "status": "online",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
