import os
from pathlib import Path
from typing import List
from pydantic import BaseModel

# Project root calculation: Dr.dental/
BACKEND_APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BACKEND_APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "DentalAI"
    PROJECT_TITLE: str = "Smart Dental Diagnosis and Restoration Planning Using Tooth Alignment Analysis"
    API_V1_PREFIX: str = "/api"
    
    # Storage and paths
    PROJECT_ROOT: Path = PROJECT_ROOT
    BACKEND_DIR: Path = BACKEND_DIR
    STORAGE_DIR: Path = BACKEND_DIR / "data" / "analyses"
    
    # Model checkpoints
    ENUMERATION_MODEL_PATH: Path = BACKEND_DIR / os.getenv("ENUMERATION_MODEL_PATH", "enumeration.pt")
    # Support disesase.pt (as specifically documented in prompt) and disease.pt
    DISEASE_MODEL_PATH: Path = BACKEND_DIR / os.getenv("DISEASE_MODEL_PATH", "disesase.pt" if (BACKEND_DIR / "disesase.pt").exists() else "disease.pt")
    
    # Thresholds
    CONFIDENCE_ENUMERATION: float = float(os.getenv("CONFIDENCE_ENUMERATION", "0.15"))
    CONFIDENCE_DISEASE: float = float(os.getenv("CONFIDENCE_DISEASE", "0.15"))
    ASSOCIATION_IOU_THRESHOLD: float = float(os.getenv("ASSOCIATION_IOU_THRESHOLD", "0.20"))
    
    # Upload limits
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", str(10 * 1024 * 1024)))  # 10 MB
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png"}
    MAX_IMAGE_DIMENSION: int = 4096
    MIN_IMAGE_DIMENSION: int = 128
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8005",
        "http://127.0.0.1:8005",
        "http://localhost:3000",
    ]

settings = Settings()
# Ensure storage directory exists
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
