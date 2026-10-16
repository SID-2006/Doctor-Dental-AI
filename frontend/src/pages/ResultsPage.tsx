/**
 * ResultsPage.tsx — Premium Diagnostic Radiograph Review Layout
 *
 * New page order (full-width sections):
 *  1. Header bar (scan ID, timestamp, actions)
 *  2. Warnings banner (if any)
 *  3. ClinicalSummary (3-column: Detected Conditions, Alignment, Next Steps)
 *  4. ImageViewer — full width, 75vh min-height
 *  5. ToothDetectionList — full width, odontogram + card grid
 *  6. FollowUpGuidance — accordion, cross-linked with viewer
 *  7. DiseaseFindings — full height, no inner scroll
 *  8. AlignmentPanel — collapsible
 *  9. Disclaimer
 *
 * All API calls, state, and navigation preserved exactly from original.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, ApiError } from '../api/client';
import { AnalysisResponse } from '../types/api';
import { ImageViewer } from '../components/analysis/ImageViewer';
import { ToothDetectionList } from '../components/analysis/ToothDetectionList';
import { DiseaseFindings } from '../components/analysis/DiseaseFindings';
import { FollowUpGuidance } from '../components/analysis/FollowUpGuidance';
import { ClinicalSummary } from '../components/analysis/ClinicalSummary';
import { AlignmentPanel } from '../components/analysis/AlignmentPanel';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Disclaimer } from '../components/common/Disclaimer';
import {
  FileDown, ArrowLeft, Calendar, Hash,
  AlertTriangle, RotateCcw, CheckCircle2,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Synchronized selections between viewer, odontogram, and accordion */
  const [selectedToothFdi, setSelectedToothFdi] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    setIsLoading(true);
    setError(null);
    apiClient
      .getAnalysis(analysisId)
      .then(data => { setAnalysis(data); setIsLoading(false); })
      .catch((err: any) => {
        setIsLoading(false);
        setError(err instanceof ApiError ? err.message : 'Failed to retrieve analysis results.');
      });
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState message="Loading diagnostic analysis report…" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Analysis Not Found"
          message={error || `Could not find analysis results for ID '${analysisId}'.`}
          backTo="/analyze"
        />
      </div>
    );
  }

  /* Prepend API base URL if needed */
  const baseUrl = apiClient.getBaseUrl();
  const fmt = (url?: string) => (!url ? '' : url.startsWith('http') ? url : `${baseUrl}${url}`);

  const imageUrls = {
    original:      fmt(analysis.image_urls.original),
    annotated:     fmt(analysis.image_urls.annotated),
    teeth_only:    fmt(analysis.image_urls.teeth_only),
    diseases_only: fmt(analysis.image_urls.diseases_only),
  };

  const reportUrl = fmt(apiClient.getReportDownloadUrl(analysis.analysis_id));

  return (
    /* max-w larger for breathing room — no dead right-side space */
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 bg-[#F7F9FB] min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER BAR
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: back-link + title + meta */}
          <div className="space-y-1.5">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Analyze Another Radiograph
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Diagnostic Radiograph Review
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                {analysis.analysis_id}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(analysis.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <FileDown className="w-4 h-4" />
              Download Clinical PDF
            </a>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Scan
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. WARNINGS BANNER (if any)
      ════════════════════════════════════════════════════════════════════ */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Inference Pipeline Alerts:
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800">
            {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. CLINICAL SUMMARY — 3-column cards
      ════════════════════════════════════════════════════════════════════ */}
      <ClinicalSummary analysis={analysis} />

      {/* ═══════════════════════════════════════════════════════════════════
          4. RADIOGRAPH VIEWER — full width, large (75vh min-height)
      ════════════════════════════════════════════════════════════════════ */}
      <ImageViewer
        imageUrls={imageUrls}
        imageInfo={analysis.image_info}
        teeth={analysis.enumeration.teeth}
        diseases={analysis.disease_analysis.diseases}
        selectedToothFdi={selectedToothFdi}
        onSelectTooth={setSelectedToothFdi}
        selectedDiseaseId={selectedDiseaseId}
        onSelectDisease={setSelectedDiseaseId}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          5. ODONTOGRAM & TOOTH ENUMERATION — full width
      ════════════════════════════════════════════════════════════════════ */}
      <ToothDetectionList
        teeth={analysis.enumeration.teeth}
        missingTeeth={analysis.enumeration.missing_teeth_fdi}
        selectedToothFdi={selectedToothFdi}
        onSelectTooth={setSelectedToothFdi}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          6. RESTORATION PLANNING ACCORDION — full width, cross-linked
      ════════════════════════════════════════════════════════════════════ */}
      <FollowUpGuidance
        guidance={analysis.restoration_guidance}
        selectedToothFdi={selectedToothFdi}
        onSelectTooth={setSelectedToothFdi}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          7 + 8. DISEASE FINDINGS + ALIGNMENT — 2-column grid
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <DiseaseFindings
          diseases={analysis.disease_analysis.diseases}
          summaryCounts={analysis.disease_analysis.summary_counts}
          selectedDiseaseId={selectedDiseaseId}
          onSelectDisease={setSelectedDiseaseId}
          onSelectTooth={setSelectedToothFdi}
        />
        <AlignmentPanel
          alignment={analysis.alignment_screening}
          imageUrl={imageUrls.annotated}
          imageInfo={analysis.image_info}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          9. BOTTOM DISCLAIMER
      ════════════════════════════════════════════════════════════════════ */}
      <Disclaimer />
    </div>
  );
};
