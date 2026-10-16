import logging
from typing import List
from backend.app.services.model_service import model_service
from backend.app.schemas.analysis import (
    BoundingBox,
    ToothDetection,
    EnumerationResult,
    FDI_TOOTH_NAMES,
    ALL_32_FDI_TEETH,
)

logger = logging.getLogger("dental_ai.enumeration_service")

class EnumerationService:
    def run_enumeration(self, image_path: str, conf_threshold: float = 0.15) -> EnumerationResult:
        """Run tooth enumeration detection model on the given image path."""
        model = model_service.get_enumeration_model()
        results = model(image_path, conf=conf_threshold, verbose=False)
        
        detections: List[ToothDetection] = []
        result = results[0]
        boxes = result.boxes
        names = result.names
        
        detected_fdi_set = set()
        
        for idx, box in enumerate(boxes):
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()
            fdi_label = str(names.get(cls_id, f"T{cls_id}"))
            detected_fdi_set.add(fdi_label)
            
            x1, y1, x2, y2 = xyxy
            bbox = BoundingBox(
                x1=round(x1, 2),
                y1=round(y1, 2),
                x2=round(x2, 2),
                y2=round(y2, 2),
                width=round(x2 - x1, 2),
                height=round(y2 - y1, 2),
            )
            
            tooth_info = FDI_TOOTH_NAMES.get(fdi_label, {
                "name": f"Tooth FDI {fdi_label}",
                "type": "Unknown",
                "quadrant": int(fdi_label[0]) if fdi_label and fdi_label[0] in "1234" else 0,
            })
            
            tooth_detection = ToothDetection(
                id=f"tooth-{idx + 1}-{fdi_label}",
                fdi_number=fdi_label,
                anatomical_name=tooth_info["name"],
                quadrant=tooth_info["quadrant"],
                tooth_type=tooth_info["type"],
                confidence=round(conf, 4),
                box=bbox,
                associated_diseases=[],
            )
            detections.append(tooth_detection)
            
        # Sort detected teeth in clinical quadrant order (11-18, 21-28, 31-38, 41-48)
        detections.sort(key=lambda t: t.fdi_number)
        
        # Calculate missing teeth from standard adult dentition (32 teeth)
        missing_teeth = [fdi for fdi in ALL_32_FDI_TEETH if fdi not in detected_fdi_set]
        
        return EnumerationResult(
            model_name="dentex_yolo11m",
            detections_count=len(detections),
            teeth=detections,
            missing_teeth_fdi=missing_teeth,
        )

enumeration_service = EnumerationService()
