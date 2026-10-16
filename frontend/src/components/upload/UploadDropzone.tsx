import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileImage,
  X,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface UploadDropzoneProps {
  onAnalyze: (file: File | Blob, filename: string, enumConf: number, diseaseConf: number) => void;
  isLoading: boolean;
}

// ── Exposed so AnalyzePage can also use this interface ──────────────────────
export interface DropzoneState {
  selectedFile: File | null;
  previewUrl: string | null;
  dimensions: { width: number; height: number } | null;
  errorMsg: string | null;
  dragActive: boolean;
  hasConsent: boolean;
  enumConf: number;
  diseaseConf: number;
  setHasConsent: (v: boolean) => void;
  setEnumConf: (v: number) => void;
  setDiseaseConf: (v: number) => void;
  handleFile: (f: File) => void;
  handleRemove: () => void;
  handleSampleScan: () => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setErrorMsg: (v: string | null) => void;
}

/**
 * useDropzoneState — extracts all dropzone state/logic into a reusable hook
 * so AnalyzePage can read file & consent state for stepper / CTA control.
 */
export function useDropzoneState(): DropzoneState {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enumConf, setEnumConf] = useState(0.15);
  const [diseaseConf, setDiseaseConf] = useState(0.15);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  const handleFile = useCallback((file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
      setErrorMsg('Invalid file type. Please select a JPG or PNG radiograph image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is 10 MB.`);
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  }, []);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDimensions(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSampleScan = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await fetch('/samples/sample_panoramic.jpg');
      const blob = await res.blob();
      handleFile(new File([blob], 'sample_panoramic.jpg', { type: 'image/jpeg' }));
    } catch {
      setErrorMsg('Could not load sample scan. Ensure the dev server is running.');
    }
  }, [handleFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return {
    selectedFile, previewUrl, dimensions, dragActive, hasConsent, errorMsg,
    enumConf, diseaseConf,
    setHasConsent, setEnumConf, setDiseaseConf,
    handleFile, handleRemove, handleSampleScan,
    handleDrag, handleDrop,
    fileInputRef, setErrorMsg,
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DropZone — animated drag-and-drop upload area                             */
/* ─────────────────────────────────────────────────────────────────────────── */
interface DropZoneProps {
  state: DropzoneState;
}

export const DropZone: React.FC<DropZoneProps> = ({ state }) => {
  const { dragActive, previewUrl, selectedFile, dimensions, handleDrag, handleDrop,
    handleRemove, handleSampleScan, fileInputRef, handleFile } = state;

  if (previewUrl && selectedFile) {
    // ── Preview state: dark clinical viewer ────────────────────────────────
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-[#0B1220]">
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0d1527] border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex items-center gap-2 ml-1">
              <FileImage className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-mono text-slate-300 truncate max-w-[240px] sm:max-w-sm">
                {selectedFile.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replace
          </button>
        </div>

        {/* Image */}
        <div className="relative flex items-center justify-center bg-slate-950 min-h-[280px] max-h-[420px] overflow-hidden">
          <img
            src={previewUrl}
            alt="Radiograph preview"
            className="max-h-[400px] w-auto object-contain"
          />
          {/* Corner info chip */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/60 rounded-xl px-3 py-2">
            <p className="text-teal-400 text-[11px] font-mono font-bold leading-none">
              {(selectedFile.size / 1024).toFixed(0)} KB
              {dimensions && ` · ${dimensions.width}×${dimensions.height}px`}
            </p>
            <p className="text-slate-500 text-[10px] mt-0.5">Ready for analysis</p>
          </div>
          {/* Ready badge */}
          <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Radiograph Loaded
          </div>
        </div>
      </div>
    );
  }

  // ── Empty drop zone ───────────────────────────────────────────────────────
  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload dental radiograph"
      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      className={`
        relative group cursor-pointer rounded-2xl p-10 sm:p-14 text-center
        flex flex-col items-center justify-center transition-all duration-200
        border-2 border-dashed
        ${dragActive
          ? 'border-teal-400 bg-teal-500/8 scale-[1.01] shadow-[0_0_40px_rgba(20,184,166,0.2)]'
          : 'border-slate-300 hover:border-teal-400 bg-white hover:bg-teal-50/30 hover:shadow-lg'
        }
      `}
      style={{
        backgroundImage: dragActive
          ? 'radial-gradient(circle at center, rgba(20,184,166,0.04) 0%, transparent 70%)'
          : undefined,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        aria-label="File input"
      />

      {/* Animated upload icon */}
      <div className={`
        w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-md
        ${dragActive
          ? 'bg-teal-500 shadow-teal-400/40 shadow-xl scale-110'
          : 'bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 group-hover:scale-105 group-hover:shadow-teal-200/50'
        }
      `}>
        <UploadCloud className={`w-10 h-10 transition-colors duration-200 ${dragActive ? 'text-white' : 'text-teal-600'}`} />
      </div>

      {dragActive ? (
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-teal-700">Drop to upload</h3>
          <p className="text-sm text-teal-600/80">Release to load your radiograph</p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">
            Drag & drop dental radiograph
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            or click anywhere in this area to browse your files
          </p>

          {/* Format chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['JPG / JPEG', 'PNG', 'OPG Panoramic', 'Bitewing', '≤ 10 MB'].map((chip) => (
              <span key={chip} className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                {chip}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.97]"
            >
              Browse Files
            </button>
            <button
              type="button"
              onClick={handleSampleScan}
              className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.97] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-500" />
              Load Sample OPG
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Legacy wrapper — keeps backward compatibility for any direct import       */
/* ─────────────────────────────────────────────────────────────────────────── */
export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onAnalyze, isLoading }) => {
  const state = useDropzoneState();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedFile) { state.setErrorMsg('Please select an X-ray image.'); return; }
    if (!state.hasConsent) { state.setErrorMsg('Please confirm clinical decision support consent.'); return; }
    onAnalyze(state.selectedFile, state.selectedFile.name, state.enumConf, state.diseaseConf);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DropZone state={state} />
      {state.errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          {state.errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={!state.selectedFile || !state.hasConsent || isLoading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition-all"
      >
        Run AI Dental Diagnosis
      </button>
    </form>
  );
};
