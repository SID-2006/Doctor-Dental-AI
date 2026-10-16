export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface ToothDetection {
  id: string;
  fdi_number: string;
  anatomical_name: string;
  quadrant: number;
  tooth_type: string;
  confidence: number;
  box: BoundingBox;
  associated_diseases: string[];
}

export interface DiseaseDetection {
  id: string;
  disease_name: string;
  confidence: number;
  box: BoundingBox;
  associated_tooth?: string | null;
  overlap_ratio?: number | null;
}

export interface EnumerationResult {
  model_name: string;
  detections_count: number;
  teeth: ToothDetection[];
  missing_teeth_fdi: string[];
}

export interface DiseaseAnalysisResult {
  model_name: string;
  detections_count: number;
  diseases: DiseaseDetection[];
  summary_counts: Record<string, number>;
}

export interface CombinedFinding {
  tooth_number: string;
  anatomical_name: string;
  quadrant: number;
  findings: string[];
  highest_severity: 'Normal' | 'Low' | 'Moderate' | 'High';
  confidence: number;
  details: string;
}

/**
 * Enhanced restoration planning guidance.
 * evaluation_questions is kept for backward compatibility with stored analyses
 * but will be empty for all new analyses.
 */
export interface RestorationPlanningGuidance {
  tooth_number: string;
  anatomical_name: string;
  condition: string;
  /** Plain-language explanation of what the AI finding suggests. */
  clinical_interpretation: string;
  /** What type of clinical assessment/follow-up is appropriate. */
  recommended_next_step: string;
  /** Possible treatment categories — NOT prescriptions. */
  treatment_considerations: string;
  /** @deprecated Empty in new analyses; retained for stored-analysis compatibility. */
  evaluation_questions: string[];
  disclaimer: string;
  /** Kept for backward compatibility with old stored analyses. */
  informational_note?: string;
}

/** A single region or tooth flagged during alignment screening. */
export interface AlignmentFinding {
  region: string;
  tooth_fdi: string | null;
  deviation_px: number | null;
  deviation_normalized: number | null;
  description: string;
  requires_assessment: boolean;
}

/** Result of the geometric tooth alignment screening module. */
export interface AlignmentScreeningResult {
  sufficient_data: boolean;
  arch: string;
  teeth_analyzed: number;
  flagged_count: number;
  findings: AlignmentFinding[];
  /** Points along the estimated arch curve: [[x, y], ...] */
  arch_curve_points: [number, number][];
  /** Tooth centres: { fdi, cx, cy, fitted_cy, deviation_px, deviation_normalized, arch } */
  tooth_centers: Array<{
    fdi: string;
    cx: number;
    cy: number;
    fitted_cy: number;
    deviation_px: number;
    deviation_normalized: number;
    arch: string;
  }>;
  /** Spacing ratios between adjacent detected teeth */
  spacing_ratios: Array<{
    from_fdi: string;
    to_fdi: string;
    gap_px: number;
    ratio: number;
    arch: string;
    wide: boolean;
  }>;
  limitation_note: string;
  insufficient_data_reason?: string | null;
}

export interface ImageInfo {
  filename: string;
  width: number;
  height: number;
  file_size_bytes: number;
}

export interface ImageUrls {
  original: string;
  annotated: string;
  teeth_only?: string;
  diseases_only?: string;
}

export interface ModelMetadata {
  model_type: string;
  architecture: string;
  classes: string[];
  input_size: number;
  device: string;
  ready: boolean;
  path: string;
}

export interface ModelsInfoResponse {
  status: string;
  enumeration: ModelMetadata;
  disease: ModelMetadata;
  device: string;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  device: string;
  enumeration_model_ready: boolean;
  disease_model_ready: boolean;
}

export interface AnalysisResponse {
  analysis_id: string;
  created_at: string;
  image_info: ImageInfo;
  image_urls: ImageUrls;
  enumeration: EnumerationResult;
  disease_analysis: DiseaseAnalysisResult;
  combined_findings: CombinedFinding[];
  restoration_guidance: RestorationPlanningGuidance[];
  /** Null for old stored analyses; populated for new ones. */
  alignment_screening?: AlignmentScreeningResult | null;
  model_metadata: Record<string, any>;
  warnings: string[];
  disclaimer: string;
}
