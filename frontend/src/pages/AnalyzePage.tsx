/**
 * AnalyzePage.tsx — Premium redesign of the DentalAI scan upload & analysis page.
 *
 * DESIGN: Medical SaaS (Linear + Apple Health + PACS viewer aesthetic)
 * Palette: deep teal (#0F766E → #14B8A6), slate neutrals, #F7F9FB background,
 *          #0B1220 dark panel, amber warnings, red critical, green healthy.
 *
 * All backend wiring, API calls, navigation, and state logic are preserved from
 * the original implementation. Only UI/UX is changed.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  FileText,
  Sliders,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Cpu,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';
import { apiClient, ApiError } from '../api/client';
import { DropZone, useDropzoneState } from '../components/upload/UploadDropzone';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  LOADING STATUS — rotating messages during inference                       */
/* ─────────────────────────────────────────────────────────────────────────── */
const LOADING_STEPS = [
  'Validating radiograph format…',
  'Detecting teeth with enumeration model…',
  'Mapping FDI standard tooth numbers…',
  'Running disease classification model…',
  'Classifying caries & periapical lesions…',
  'Associating pathologies to tooth positions…',
  'Generating restoration planning guidance…',
  'Compiling clinical PDF report…',
  'Finalising analysis results…',
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEPPER                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
interface StepperProps {
  step: 1 | 2 | 3;
}
const Stepper: React.FC<StepperProps> = ({ step }) => {
  const steps = [
    { id: 1, label: 'Upload',    icon: '01' },
    { id: 2, label: 'Configure', icon: '02' },
    { id: 3, label: 'Analyse',   icon: '03' },
  ];
  return (
    <div className="flex items-center justify-center gap-0" aria-label="Progress stepper">
      {steps.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300
                ${done   ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-200' :
                  active ? 'bg-white border-teal-500 text-teal-600 shadow-md shadow-teal-100 ring-4 ring-teal-100' :
                           'bg-white border-slate-200 text-slate-400'}
              `}>
                {done ? <CheckCircle2 className="w-4.5 h-4.5" /> : s.icon}
              </div>
              <span className={`text-[11px] font-semibold transition-colors ${active ? 'text-teal-700' : done ? 'text-teal-500' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-16 sm:w-24 mx-2 mb-5 transition-all duration-500 ${step > s.id ? 'bg-teal-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CONFIDENCE SLIDER                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
interface SliderRowProps {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}
const SliderRow: React.FC<SliderRowProps> = ({ label, hint, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
        value <= 0.15 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
        value >= 0.5  ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-teal-50 text-teal-700 border border-teal-200'
      }`}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
    {/* Track wrapper with 15% marker */}
    <div className="relative">
      <input
        type="range"
        min="0.05" max="0.80" step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="w-full h-1.5 appearance-none bg-slate-200 rounded-full outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
        style={{
          background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${((value - 0.05) / 0.75) * 100}%, #e2e8f0 ${((value - 0.05) / 0.75) * 100}%, #e2e8f0 100%)`,
        }}
      />
      {/* Default 15% marker */}
      <div
        className="absolute -top-0.5 w-px h-3 bg-amber-400/80 pointer-events-none"
        style={{ left: `${((0.15 - 0.05) / 0.75) * 100}%` }}
        title="Default: 15%"
      />
    </div>
    <p className="text-[11px] text-slate-400">{hint}</p>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  WHAT YOU'LL GET — 3 cards                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const WhatYoullGet: React.FC = () => (
  <div className="grid grid-cols-3 gap-3">
    {[
      { icon: Layers,   label: 'FDI Tooth Map',          sub: '32-class enumeration' },
      { icon: Search,   label: 'Pathology Localisation',  sub: 'Confidence scores' },
      { icon: FileText, label: 'Clinical PDF Report',     sub: 'Instant download' },
    ].map((item) => (
      <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-3.5 text-center shadow-sm hover:shadow-md transition-shadow">
        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-2">
          <item.icon className="w-4.5 h-4.5 text-teal-600" />
        </div>
        <p className="text-xs font-bold text-slate-800 leading-tight">{item.label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
export const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scanType, setScanType] = useState<'auto' | 'opg' | 'bitewing'>('auto');

  // All dropzone / form state via shared hook
  const dz = useDropzoneState();

  /* Derived stepper step */
  const currentStep: 1 | 2 | 3 = isLoading ? 3 : dz.selectedFile ? 2 : 1;

  /* Rotate loading messages every ~1.8 s */
  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); setLoadingProgress(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
      setLoadingProgress((p) => Math.min(p + 100 / LOADING_STEPS.length, 95));
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  /* Submit handler — preserves original API call */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dz.selectedFile) { dz.setErrorMsg('Please select an X-ray image to analyse.'); return; }
    if (!dz.hasConsent) { dz.setErrorMsg('Please confirm clinical decision-support consent before proceeding.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.uploadAndAnalyze(
        dz.selectedFile,
        dz.selectedFile.name,
        dz.enumConf,
        dz.diseaseConf,
      );
      navigate(`/results/${response.analysis_id}`);
    } catch (err: any) {
      setIsLoading(false);
      setError(err instanceof ApiError ? err.message : (err.message || 'Failed to analyse radiographic image.'));
    }
  };

  /* Can submit? */
  const canSubmit = !!dz.selectedFile && dz.hasConsent && !isLoading;

  /* Tooltip for disabled state */
  const disabledReason = !dz.selectedFile ? 'Upload a radiograph first'
    : !dz.hasConsent ? 'Accept the clinical consent below'
    : '';

  /* ── Loading overlay ──────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-[#F7F9FB]">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 text-center space-y-7">
          {/* Animated icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-40" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-200">
              <Activity className="w-9 h-9 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Analysing Radiograph</h2>
            <p className="text-sm text-slate-500 font-medium transition-all duration-500 min-h-[20px]">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          {/* Step pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Tooth Detection', 'FDI Mapping', 'Disease Classification', 'PDF Report'].map((s, i) => (
              <span
                key={s}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-500 ${
                  loadingStep >= i * 2
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Dual YOLO11m inference engines · 100% local processing
          </p>
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#F7F9FB]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-red-100 shadow-xl p-10 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Analysis Could Not Be Completed</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
          <button
            onClick={() => setError(null)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.97]"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Main layout ──────────────────────────────────────────────────────── */
  return (
    <div className="bg-[#F7F9FB] min-h-screen">
      <form onSubmit={handleSubmit} noValidate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              YOLO11m Dual-Model Inference Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Analyze Dental Radiograph
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Upload an OPG panoramic or bitewing X-ray for AI tooth enumeration,
              pathology detection, and restoration planning in seconds.
            </p>

            {/* Stepper */}
            <div className="pt-2">
              <Stepper step={currentStep} />
            </div>
          </div>

          {/* ── 2-column grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-8 items-start">

            {/* ═══════════════════════════════════════════════════════════════
                LEFT COLUMN — dropzone / preview + what you'll get
            ════════════════════════════════════════════════════════════════ */}
            <div className="space-y-5">

              {/* Dropzone / Preview */}
              <DropZone state={dz} />

              {/* Inline error */}
              {dz.errorMsg && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{dz.errorMsg}</span>
                </div>
              )}

              {/* What you'll get */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  What you'll get
                </p>
                <WhatYoullGet />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                RIGHT COLUMN — sticky settings card
            ════════════════════════════════════════════════════════════════ */}
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">

                {/* Card header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <Sliders className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Analysis Settings</h2>
                    <p className="text-[11px] text-slate-400">Configure detection parameters</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-6">

                  {/* Scan type selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scan Type</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {([['auto', 'Auto-detect'], ['opg', 'OPG'], ['bitewing', 'Bitewing']] as const).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setScanType(val)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                            scanType === val
                              ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confidence thresholds — collapsible */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                      aria-expanded={settingsOpen}
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-teal-500" />
                        Detection Confidence Thresholds
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">Default: 15%</span>
                        {settingsOpen
                          ? <ChevronDown className="w-4 h-4 text-slate-400" />
                          : <ChevronRight className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                    </button>

                    {settingsOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-5">
                        <SliderRow
                          label="Tooth Enumeration"
                          hint="Controls FDI tooth localisation sensitivity. Lower = more detections, higher = fewer."
                          value={dz.enumConf}
                          onChange={dz.setEnumConf}
                        />
                        <SliderRow
                          label="Disease Detection"
                          hint="Controls caries & periapical lesion sensitivity. Lower = more flags, higher = fewer."
                          value={dz.diseaseConf}
                          onChange={dz.setDiseaseConf}
                        />
                        <button
                          type="button"
                          onClick={() => { dz.setEnumConf(0.15); dz.setDiseaseConf(0.15); }}
                          className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset to default (15%)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Consent card ──────────────────────────────────────── */}
                  <div
                    className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                      dz.hasConsent
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => dz.setHasConsent(!dz.hasConsent)}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      {/* Custom checkbox */}
                      <div className={`
                        mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150
                        ${dz.hasConsent
                          ? 'bg-teal-500 border-teal-500 shadow-sm'
                          : 'bg-white border-slate-300 hover:border-teal-400'}
                      `}>
                        {dz.hasConsent && (
                          <svg viewBox="0 0 12 9" className="w-3 h-3 fill-none stroke-white stroke-[2.5] stroke-round">
                            <polyline points="1,4.5 4.5,8 11,1" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          Clinical Decision-Support Consent
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          I confirm this radiograph is processed for decision support and research.
                          AI predictions are probabilistic and require chairside verification by a
                          licensed dental professional.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* ── Primary CTA ───────────────────────────────────────── */}
                  <div title={disabledReason} className="relative group">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      aria-label="Run AI Dental Diagnosis and Restoration Planning"
                      className={`
                        w-full py-4 px-6 rounded-xl font-extrabold text-sm
                        flex items-center justify-center gap-2.5
                        transition-all duration-200 active:scale-[0.98]
                        ${canSubmit
                          ? 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-xl shadow-teal-200/60 hover:shadow-2xl hover:shadow-teal-200/80 hover:-translate-y-0.5'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}
                      `}
                    >
                      <Activity className={`w-4.5 h-4.5 ${canSubmit ? 'text-teal-100' : 'text-slate-300'}`} />
                      Run AI Dental Diagnosis & Restoration Planning
                    </button>

                    {/* Tooltip for disabled state */}
                    {!canSubmit && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">
                        {disabledReason}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                      </div>
                    )}
                  </div>

                  {/* Amber notice */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      <span className="font-bold">Decision-support prototype.</span> Requires
                      independent chairside clinical evaluation by a licensed dentist.
                    </p>
                  </div>

                  {/* Security badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['100% Local Processing', 'FDI Standard', 'YOLO11m'].map((b) => (
                      <span key={b} className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
