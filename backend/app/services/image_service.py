import os
import io
import logging
from pathlib import Path
from typing import Tuple, Dict
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
from fastapi import HTTPException, UploadFile

from backend.app.config import settings
from backend.app.schemas.analysis import (
    EnumerationResult,
    DiseaseAnalysisResult,
    ImageInfo,
)

logger = logging.getLogger("dental_ai.image_service")

# Distinct clinical color palette for rendering
DISEASE_COLORS = {
    "Deep_Caries": (239, 68, 68),       # Crimson/Red
    "Caries": (245, 158, 11),          # Amber/Orange
    "Periapical_Lesion": (139, 92, 246),# Purple/Violet
    "Impacted": (6, 182, 212),         # Cyan/Teal
}
DEFAULT_DISEASE_COLOR = (220, 38, 38)
TOOTH_BOX_COLOR = (14, 165, 233)        # Sky Blue / Cyan for teeth
TOOTH_FILL_COLOR = (14, 165, 233, 25)

class ImageService:
    async def validate_and_save_upload(self, file: UploadFile, target_path: Path) -> ImageInfo:
        """Validate uploaded file format, size, and dimensions, then save safely."""
        # 1. Check extension
        filename = file.filename or "upload.jpg"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed extensions are: {', '.join(settings.ALLOWED_EXTENSIONS)}",
            )

        # 2. Read bytes and check size
        content = await file.read()
        size_bytes = len(content)
        if size_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if size_bytes > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File size ({size_bytes / (1024 * 1024):.2f} MB) exceeds maximum allowed limit of {max_mb:.0f} MB.",
            )

        # 3. Decode image and verify integrity
        try:
            image = Image.open(io.BytesIO(content))
            image.verify()  # Verify image integrity
            # Reopen because verify() closes the file
            image = Image.open(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid or corrupted image file: {str(e)}")

        # 4. Check dimensions
        width, height = image.size
        if (
            width < settings.MIN_IMAGE_DIMENSION
            or height < settings.MIN_IMAGE_DIMENSION
            or width > settings.MAX_IMAGE_DIMENSION
            or height > settings.MAX_IMAGE_DIMENSION
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Image dimensions ({width}x{height}) out of permitted range "
                    f"({settings.MIN_IMAGE_DIMENSION}x{settings.MIN_IMAGE_DIMENSION} to "
                    f"{settings.MAX_IMAGE_DIMENSION}x{settings.MAX_IMAGE_DIMENSION} px)."
                ),
            )

        # 5. Save normalized RGB image
        target_path.parent.mkdir(parents=True, exist_ok=True)
        rgb_image = image.convert("RGB")
        rgb_image.save(target_path, "JPEG", quality=95)

        return ImageInfo(
            filename=filename,
            width=width,
            height=height,
            file_size_bytes=size_bytes,
        )

    def generate_annotated_images(
        self,
        original_image_path: Path,
        enumeration: EnumerationResult,
        disease_analysis: DiseaseAnalysisResult,
        output_dir: Path,
    ) -> Dict[str, Path]:
        """
        Generate high quality clinical visualizations:
        1. combined_annotated.jpg (Teeth + Diseases)
        2. teeth_only.jpg
        3. diseases_only.jpg
        """
        orig_img = Image.open(original_image_path).convert("RGBA")
        width, height = orig_img.size

        # Load default font
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

        # Helper to draw annotations on a copy
        def render_layers(show_teeth: bool, show_diseases: bool) -> Image.Image:
            base = orig_img.copy()
            # Overlay for translucent fills
            overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # 1. Render Teeth if requested
            if show_teeth:
                for tooth in enumeration.teeth:
                    b = tooth.box
                    # Subtle box outline
                    draw.rectangle([b.x1, b.y1, b.x2, b.y2], outline=(14, 165, 233, 200), width=2)
                    
                    # Tooth label badge at top-left
                    label = f"T{tooth.fdi_number}"
                    badge_w = len(label) * 8 + 6
                    badge_h = 16
                    badge_y1 = max(0, b.y1 - badge_h)
                    draw.rectangle([b.x1, badge_y1, b.x1 + badge_w, badge_y1 + badge_h], fill=(14, 165, 233, 230))
                    draw.text((b.x1 + 3, badge_y1 + 2), label, fill=(255, 255, 255, 255), font=font)

            # 2. Render Diseases if requested
            if show_diseases:
                for d in disease_analysis.diseases:
                    b = d.box
                    color_rgb = DISEASE_COLORS.get(d.disease_name, DEFAULT_DISEASE_COLOR)
                    border_color = (*color_rgb, 240)
                    fill_color = (*color_rgb, 35)

                    # Highlight box
                    draw.rectangle([b.x1, b.y1, b.x2, b.y2], fill=fill_color, outline=border_color, width=3)

                    # Disease label banner
                    lbl = f"{d.disease_name} {int(d.confidence * 100)}%"
                    if d.associated_tooth:
                        lbl += f" (T{d.associated_tooth})"
                    lbl_w = len(lbl) * 7 + 8
                    lbl_h = 18
                    lbl_y1 = max(0, b.y1 - lbl_h)
                    draw.rectangle([b.x1, lbl_y1, b.x1 + lbl_w, lbl_y1 + lbl_h], fill=(*color_rgb, 245))
                    draw.text((b.x1 + 4, lbl_y1 + 3), lbl, fill=(255, 255, 255, 255), font=font)

            combined = Image.alpha_composite(base, overlay)
            return combined.convert("RGB")

        # Generate the 3 variations
        combined_path = output_dir / "annotated.jpg"
        teeth_path = output_dir / "teeth_only.jpg"
        diseases_path = output_dir / "diseases_only.jpg"

        render_layers(show_teeth=True, show_diseases=True).save(combined_path, "JPEG", quality=92)
        render_layers(show_teeth=True, show_diseases=False).save(teeth_path, "JPEG", quality=92)
        render_layers(show_teeth=False, show_diseases=True).save(diseases_path, "JPEG", quality=92)

        return {
            "annotated": combined_path,
            "teeth_only": teeth_path,
            "diseases_only": diseases_path,
        }

image_service = ImageService()
