import json
import logging
import uuid
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.schemas.analysis import AnalysisResponse

logger = logging.getLogger("dental_ai.analysis_store")

class AnalysisStore:
    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or settings.STORAGE_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def generate_id(self) -> str:
        """Generate a random, safe analysis ID."""
        return f"scan_{uuid.uuid4().hex[:16]}"

    def get_analysis_dir(self, analysis_id: str) -> Path:
        """Resolve and validate directory for an analysis ID, preventing path traversal."""
        # Sanitize ID to ensure no directory traversal characters
        safe_id = Path(analysis_id).name
        target = (self.base_dir / safe_id).resolve()
        
        # Ensure target is strictly within base_dir
        if not str(target).startswith(str(self.base_dir.resolve())):
            raise ValueError(f"Illegal path traversal attempt for analysis ID '{analysis_id}'")
            
        return target

    def save_analysis(self, analysis: AnalysisResponse) -> None:
        """Persist analysis result to JSON."""
        analysis_dir = self.get_analysis_dir(analysis.analysis_id)
        analysis_dir.mkdir(parents=True, exist_ok=True)
        json_file = analysis_dir / "analysis.json"
        
        with open(json_file, "w", encoding="utf-8") as f:
            f.write(analysis.model_dump_json(indent=2))
        logger.info(f"Persisted analysis {analysis.analysis_id} to {json_file}")

    def get_analysis(self, analysis_id: str) -> Optional[AnalysisResponse]:
        """Load analysis from storage if it exists."""
        try:
            analysis_dir = self.get_analysis_dir(analysis_id)
            json_file = analysis_dir / "analysis.json"
            if not json_file.exists():
                return None
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return AnalysisResponse.model_validate(data)
        except Exception as e:
            logger.error(f"Error loading analysis {analysis_id}: {e}")
            return None

    def get_file_path(self, analysis_id: str, filename: str) -> Optional[Path]:
        """Safely retrieve path to an image or report file."""
        safe_filename = Path(filename).name
        analysis_dir = self.get_analysis_dir(analysis_id)
        file_path = (analysis_dir / safe_filename).resolve()
        
        if not str(file_path).startswith(str(analysis_dir.resolve())):
            return None
        if not file_path.exists():
            return None
        return file_path

analysis_store = AnalysisStore()
