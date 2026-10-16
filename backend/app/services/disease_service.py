import logging
from typing import List, Dict
from collections import Counter
from backend.app.services.model_service import model_service
from backend.app.schemas.analysis import (
    BoundingBox,
    DiseaseDetection,
    DiseaseAnalysisResult,
)

logger = logging.getLogger("dental_ai.disease_service")

class DiseaseService:
    def run_disease_inference(self, image_path: str, conf_threshold: float = 0.15) -> DiseaseAnalysisResult:
        """Run dental disease detection model on the given image path."""
        model = model_service.get_disease_model()
        results = model(image_path, conf=conf_threshold, verbose=False)
        
        detections: List[DiseaseDetection] = []
        result = results[0]
        boxes = result.boxes
        names = result.names
        
        counts: Counter = Counter()
        
        for idx, box in enumerate(boxes):
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()
            disease_name = str(names.get(cls_id, f"Class_{cls_id}"))
            counts[disease_name] += 1
            
            x1, y1, x2, y2 = xyxy
            bbox = BoundingBox(
                x1=round(x1, 2),
                y1=round(y1, 2),
                x2=round(x2, 2),
                y2=round(y2, 2),
                width=round(x2 - x1, 2),
                height=round(y2 - y1, 2),
            )
            
            disease_det = DiseaseDetection(
                id=f"disease-{idx + 1}-{disease_name}",
                disease_name=disease_name,
                confidence=round(conf, 4),
                box=bbox,
                associated_tooth=None,
                overlap_ratio=None,
            )
            detections.append(disease_det)
            
        # Sort disease detections by confidence descending
        detections.sort(key=lambda d: d.confidence, reverse=True)
        
        return DiseaseAnalysisResult(
            model_name="yolo11m_disease",
            detections_count=len(detections),
            diseases=detections,
            summary_counts=dict(counts),
        )

disease_service = DiseaseService()
