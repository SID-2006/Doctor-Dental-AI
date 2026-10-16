import logging
from typing import Dict, Any, Optional
import torch
from ultralytics import YOLO

from backend.app.config import settings

logger = logging.getLogger("dental_ai.model_service")

class ModelService:
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.enumeration_model: Optional[YOLO] = None
        self.disease_model: Optional[YOLO] = None
        
        self.enumeration_ready: bool = False
        self.disease_ready: bool = False
        
        self.enumeration_metadata: Dict[str, Any] = {}
        self.disease_metadata: Dict[str, Any] = {}
        
        self.enumeration_error: Optional[str] = None
        self.disease_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def initialize_models(self) -> None:
        """Load YOLO checkpoints once into memory with clear status tracking."""
        logger.info(f"Initializing models on device: {self.device}")
        
        # 1. Load Enumeration Model
        try:
            enum_path = settings.ENUMERATION_MODEL_PATH
            if not enum_path.exists():
                raise FileNotFoundError(f"Enumeration checkpoint not found at {enum_path}")
            
            logger.info(f"Loading enumeration model from {enum_path}...")
            self.enumeration_model = YOLO(str(enum_path))
            # Put in evaluation / inference mode
            self.enumeration_model.to(self.device)
            self.enumeration_ready = True
            
            # Extract metadata
            names = getattr(self.enumeration_model, "names", {})
            class_list = [names[k] for k in sorted(names.keys())] if isinstance(names, dict) else list(names)
            self.enumeration_metadata = {
                "model_type": "YOLO Object Detector",
                "architecture": "YOLO11m (DENTEX trained)",
                "classes": class_list,
                "input_size": 640,
                "device": self.device,
                "ready": True,
                "path": enum_path.name,
            }
            logger.info(f"Enumeration model loaded successfully with {len(class_list)} classes.")
        except Exception as e:
            self.enumeration_ready = False
            self.enumeration_error = str(e)
            logger.error(f"Failed to load enumeration model: {e}")
            self.enumeration_metadata = {
                "model_type": "YOLO Object Detector",
                "architecture": "Unknown",
                "classes": [],
                "input_size": 640,
                "device": self.device,
                "ready": False,
                "path": settings.ENUMERATION_MODEL_PATH.name,
                "error": str(e),
            }

        # 2. Load Disease Model
        try:
            # Check disease model path (supports disease.pt and disesase.pt)
            disease_path = settings.DISEASE_MODEL_PATH
            if not disease_path.exists():
                alt_path = settings.BACKEND_DIR / "disease.pt" if disease_path.name == "disesase.pt" else settings.BACKEND_DIR / "disesase.pt"
                if alt_path.exists():
                    disease_path = alt_path
            
            if not disease_path.exists():
                raise FileNotFoundError(f"Disease checkpoint not found at {disease_path}")
                
            logger.info(f"Loading disease model from {disease_path}...")
            self.disease_model = YOLO(str(disease_path))
            self.disease_model.to(self.device)
            self.disease_ready = True
            
            names = getattr(self.disease_model, "names", {})
            class_list = [names[k] for k in sorted(names.keys())] if isinstance(names, dict) else list(names)
            self.disease_metadata = {
                "model_type": "YOLO Object Detector",
                "architecture": "YOLO11m (Disease trained)",
                "classes": class_list,
                "input_size": 640,
                "device": self.device,
                "ready": True,
                "path": disease_path.name,
            }
            logger.info(f"Disease model loaded successfully with {len(class_list)} classes.")
        except Exception as e:
            self.disease_ready = False
            self.disease_error = str(e)
            logger.error(f"Failed to load disease model: {e}")
            self.disease_metadata = {
                "model_type": "YOLO Object Detector",
                "architecture": "Unknown",
                "classes": [],
                "input_size": 640,
                "device": self.device,
                "ready": False,
                "path": settings.DISEASE_MODEL_PATH.name,
                "error": str(e),
            }

    def get_enumeration_model(self) -> YOLO:
        if not self.enumeration_ready or self.enumeration_model is None:
            raise RuntimeError(f"Enumeration model is not ready: {self.enumeration_error}")
        return self.enumeration_model

    def get_disease_model(self) -> YOLO:
        if not self.disease_ready or self.disease_model is None:
            raise RuntimeError(f"Disease model is not ready: {self.disease_error}")
        return self.disease_model

    def get_models_info(self) -> Dict[str, Any]:
        return {
            "status": "ready" if (self.enumeration_ready and self.disease_ready) else "degraded",
            "enumeration": self.enumeration_metadata,
            "disease": self.disease_metadata,
            "device": self.device,
        }

model_service = ModelService.get_instance()
