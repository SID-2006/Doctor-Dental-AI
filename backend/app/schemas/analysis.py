from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Helper: FDI Tooth dictionary with standard clinical anatomy
FDI_TOOTH_NAMES: Dict[str, Dict[str, Any]] = {
    # Quadrant 1: Upper Right (Patient's Right, Viewer's Left on standard radiograph)
    "18": {"name": "Maxillary Right Third Molar", "type": "Molar", "quadrant": 1},
    "17": {"name": "Maxillary Right Second Molar", "type": "Molar", "quadrant": 1},
    "16": {"name": "Maxillary Right First Molar", "type": "Molar", "quadrant": 1},
    "15": {"name": "Maxillary Right Second Premolar", "type": "Premolar", "quadrant": 1},
    "14": {"name": "Maxillary Right First Premolar", "type": "Premolar", "quadrant": 1},
    "13": {"name": "Maxillary Right Canine", "type": "Canine", "quadrant": 1},
    "12": {"name": "Maxillary Right Lateral Incisor", "type": "Incisor", "quadrant": 1},
    "11": {"name": "Maxillary Right Central Incisor", "type": "Incisor", "quadrant": 1},
    
    # Quadrant 2: Upper Left (Patient's Left, Viewer's Right)
    "21": {"name": "Maxillary Left Central Incisor", "type": "Incisor", "quadrant": 2},
    "22": {"name": "Maxillary Left Lateral Incisor", "type": "Incisor", "quadrant": 2},
    "23": {"name": "Maxillary Left Canine", "type": "Canine", "quadrant": 2},
    "24": {"name": "Maxillary Left First Premolar", "type": "Premolar", "quadrant": 2},
    "25": {"name": "Maxillary Left Second Premolar", "type": "Premolar", "quadrant": 2},
    "26": {"name": "Maxillary Left First Molar", "type": "Molar", "quadrant": 2},
    "27": {"name": "Maxillary Left Second Molar", "type": "Molar", "quadrant": 2},
    "28": {"name": "Maxillary Left Third Molar", "type": "Molar", "quadrant": 2},

    # Quadrant 3: Lower Left (Patient's Left, Viewer's Right)
    "31": {"name": "Mandibular Left Central Incisor", "type": "Incisor", "quadrant": 3},
    "32": {"name": "Mandibular Left Lateral Incisor", "type": "Incisor", "quadrant": 3},
    "33": {"name": "Mandibular Left Canine", "type": "Canine", "quadrant": 3},
    "34": {"name": "Mandibular Left First Premolar", "type": "Premolar", "quadrant": 3},
    "35": {"name": "Mandibular Left Second Premolar", "type": "Premolar", "quadrant": 3},
    "36": {"name": "Mandibular Left First Molar", "type": "Molar", "quadrant": 3},
    "37": {"name": "Mandibular Left Second Molar", "type": "Molar", "quadrant": 3},
    "38": {"name": "Mandibular Left Third Molar", "type": "Molar", "quadrant": 3},

    # Quadrant 4: Lower Right (Patient's Right, Viewer's Left)
    "41": {"name": "Mandibular Right Central Incisor", "type": "Incisor", "quadrant": 4},
    "42": {"name": "Mandibular Right Lateral Incisor", "type": "Incisor", "quadrant": 4},
    "43": {"name": "Mandibular Right Canine", "type": "Canine", "quadrant": 4},
    "44": {"name": "Mandibular Right First Premolar", "type": "Premolar", "quadrant": 4},
    "45": {"name": "Mandibular Right Second Premolar", "type": "Premolar", "quadrant": 4},
    "46": {"name": "Mandibular Right First Molar", "type": "Molar", "quadrant": 4},
    "47": {"name": "Mandibular Right Second Molar", "type": "Molar", "quadrant": 4},
    "48": {"name": "Mandibular Right Third Molar", "type": "Molar", "quadrant": 4},
}

ALL_32_FDI_TEETH = sorted(list(FDI_TOOTH_NAMES.keys()))

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float

class ToothDetection(BaseModel):
    id: str
    fdi_number: str
    anatomical_name: str
    quadrant: int
    tooth_type: str
    confidence: float
    box: BoundingBox
    associated_diseases: List[str] = Field(default_factory=list)

class DiseaseDetection(BaseModel):
    id: str
    disease_name: str
    confidence: float
    box: BoundingBox
    associated_tooth: Optional[str] = None
    overlap_ratio: Optional[float] = None

class EnumerationResult(BaseModel):
    model_name: str = "dentex_yolo11m"
    detections_count: int
    teeth: List[ToothDetection]
    missing_teeth_fdi: List[str]

class DiseaseAnalysisResult(BaseModel):
    model_name: str = "yolo11m_disease"
    detections_count: int
    diseases: List[DiseaseDetection]
    summary_counts: Dict[str, int]

class CombinedFinding(BaseModel):
    tooth_number: str
    anatomical_name: str
    quadrant: int
    findings: List[str]
    highest_severity: str = "Normal"  # Normal, Low, Moderate, High
    confidence: float
    details: str

# ---------------------------------------------------------------------------
# Enhanced RestorationPlanningGuidance — replaces chairside question lists
# with concise, structured clinical guidance sections.
# ---------------------------------------------------------------------------
class RestorationPlanningGuidance(BaseModel):
    tooth_number: str
    anatomical_name: str
    condition: str
    # Plain-language explanation of what the AI finding suggests
    clinical_interpretation: str
    # What type of clinical assessment/follow-up is needed
    recommended_next_step: str
    # Possible treatment categories (not prescriptions); empty string if N/A
    treatment_considerations: str
    # Legacy field kept for backward compatibility with any stored analyses
    # New analyses will have empty list; field will be removed in a future version
    evaluation_questions: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "Informational decision-support only. Not a clinical diagnosis or treatment prescription. "
        "Requires comprehensive clinical examination by a licensed dental professional."
    )

# ---------------------------------------------------------------------------
# Tooth Alignment Screening — geometric analysis of detected tooth positions
# ---------------------------------------------------------------------------
class AlignmentFinding(BaseModel):
    """A single region or tooth flagged during alignment screening."""
    region: str                    # e.g. "Upper arch — region near tooth T13-T15"
    tooth_fdi: Optional[str]       # specific tooth FDI if identifiable, else None
    deviation_px: Optional[float]  # deviation from estimated arch curve in pixels
    deviation_normalized: Optional[float]  # deviation as fraction of avg tooth width
    description: str               # plain-language explanation of the finding
    requires_assessment: bool      # whether clinical orthodontic assessment is suggested

class OverlappingPair(BaseModel):
    """A pair of adjacent teeth whose 2D bounding boxes overlap horizontally."""
    from_fdi: str
    to_fdi: str
    overlap_px: float
    overlap_ratio: float           # overlap_px / median_width
    arch: str
    # Coordinates for visual overlay on X-ray
    overlap_x1: float = 0.0
    overlap_x2: float = 0.0
    y1: float = 0.0
    y2: float = 0.0
    cx: float = 0.0
    cy: float = 0.0

class CrowdingArchDetail(BaseModel):
    """Arch-length discrepancy and crowding analysis for a single arch."""
    arch: str                      # "upper" or "lower"
    teeth_count: int
    total_tooth_width_px: float
    available_arch_length_px: float
    space_discrepancy_px: float    # available - required (negative = crowding / space deficit)
    discrepancy_ratio: float       # space_discrepancy_px / available_arch_length_px
    severity: str                  # "None", "Mild", "Moderate", "Severe"
    overlapping_pairs: List[OverlappingPair] = Field(default_factory=list)

class CrowdingAnalysis(BaseModel):
    """Comprehensive 2D geometric arch-length crowding assessment."""
    has_crowding: bool
    overall_severity: str          # "None", "Mild", "Moderate", "Severe"
    upper_arch: Optional[CrowdingArchDetail] = None
    lower_arch: Optional[CrowdingArchDetail] = None
    overlapping_pairs: List[OverlappingPair] = Field(default_factory=list)
    description: str

class MidlineDiastema(BaseModel):
    """Specific spacing detection at the dental midline."""
    present: bool
    arch: Optional[str] = None     # "upper" (11-21) or "lower" (31-41)
    gap_px: float = 0.0
    ratio: float = 0.0
    teeth: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    # Coordinates for visual caliper on X-ray
    x1: float = 0.0
    x2: float = 0.0
    y: float = 0.0

class SpacingAnalysis(BaseModel):
    """Comprehensive interdental spacing and diastema screening."""
    has_spacing: bool
    overall_severity: str          # "None", "Mild", "Moderate", "Generalized"
    midline_diastema: Optional[MidlineDiastema] = None
    wide_spacing_count: int = 0
    spaced_pairs: List[Dict[str, Any]] = Field(default_factory=list)
    description: str

class RotationFinding(BaseModel):
    """A tooth flagged for suspected axial rotation or coronal tipping."""
    fdi: str
    anatomical_name: str
    arch: str                      # "upper" or "lower"
    aspect_ratio: float            # measured box width / box height
    expected_ratio: float          # typical anatomical aspect ratio on OPG
    deviation_percent: float       # percentage deviation from expected
    severity: str                  # "Mild", "Moderate", "Marked"
    description: str
    # Coordinates for visual bounding marker on X-ray
    cx: float = 0.0
    cy: float = 0.0
    x1: float = 0.0
    y1: float = 0.0
    x2: float = 0.0
    y2: float = 0.0

class AlignmentScreeningResult(BaseModel):
    """Result of the geometric tooth alignment screening module."""
    sufficient_data: bool          # False if <4 teeth detected per arch
    arch: str                      # "upper", "lower", or "both"
    teeth_analyzed: int
    flagged_count: int
    findings: List[AlignmentFinding]
    # Points along estimated arch curve: list of [x, y] pairs
    arch_curve_points: List[List[float]] = Field(default_factory=list)
    # Tooth centers used in the analysis: list of {fdi, cx, cy}
    tooth_centers: List[Dict[str, Any]] = Field(default_factory=list)
    # Spacing ratios between adjacent teeth (normalized by avg tooth width)
    spacing_ratios: List[Dict[str, Any]] = Field(default_factory=list)
    # Extended orthodontic screening modules
    crowding: Optional[CrowdingAnalysis] = None
    spacing: Optional[SpacingAnalysis] = None
    rotations: List[RotationFinding] = Field(default_factory=list)
    limitation_note: str = (
        "This is a preliminary 2D geometric screening based on panoramic X-ray bounding-box detections only. "
        "It provides preliminary geometric estimates for crowding, spacing, and tooth rotation based on arch-length "
        "and tooth aspect-ratio approximations. It does not replace 3D dental models, study casts, or cephalometric "
        "orthodontic assessment. All findings require clinical evaluation by a qualified dental professional."
    )
    insufficient_data_reason: Optional[str] = None

# ---------------------------------------------------------------------------

class ImageInfo(BaseModel):
    filename: str
    width: int
    height: int
    file_size_bytes: int

class ImageUrls(BaseModel):
    original: str
    annotated: str
    teeth_only: Optional[str] = None
    diseases_only: Optional[str] = None

class ModelMetadata(BaseModel):
    model_type: str
    architecture: str
    classes: List[str]
    input_size: int
    device: str
    ready: bool
    path: str

class ModelsInfoResponse(BaseModel):
    status: str
    enumeration: ModelMetadata
    disease: ModelMetadata
    device: str

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    device: str
    enumeration_model_ready: bool
    disease_model_ready: bool

class AnalysisResponse(BaseModel):
    analysis_id: str
    created_at: str
    image_info: ImageInfo
    image_urls: ImageUrls
    enumeration: EnumerationResult
    disease_analysis: DiseaseAnalysisResult
    combined_findings: List[CombinedFinding]
    restoration_guidance: List[RestorationPlanningGuidance]
    # New optional field — None for old stored analyses, populated for new ones
    alignment_screening: Optional[AlignmentScreeningResult] = None
    model_metadata: Dict[str, Any]
    warnings: List[str]
    disclaimer: str = (
        "DentalAI is a computer-assisted decision support prototype for research and educational purposes. "
        "Predictions are probabilistic and not clinical diagnoses. All findings require comprehensive evaluation by a licensed dental professional."
    )
