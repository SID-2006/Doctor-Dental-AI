/**
 * ImageViewer.tsx — Premium Clinical Radiograph Viewer
 *
 * Features:
 *  - Full-width large viewer (min-height 75vh)
 *  - Compact segmented view-switcher (All / Teeth / Diseases / Original)
 *  - Custom immersive fullscreen overlay (CSS scale+fade, no browser API)
 *    • Glassmorphism bottom dock for view switching
 *    • Keyboard shortcuts: Esc, +/-, 1-4
 *    • Annotation legend
 *  - Interactive SVG overlay: click teeth/lesions, hover glow, rounded labels
 *  - All props/state logic preserved exactly from original
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, X,
  Layers, Activity, Stethoscope, ScanLine, Info, Loader2,
} from 'lucide-react';
import { ToothDetection, DiseaseDetection, ImageUrls, ImageInfo } from '../../types/api';

/* ─────────────────────────────────────────────────────────────────────── */
type LayerMode = 'annotated' | 'teeth' | 'diseases' | 'original';

interface ImageViewerProps {
  imageUrls: ImageUrls;
  imageInfo: ImageInfo;
  teeth: ToothDetection[];
  diseases: DiseaseDetection[];
  selectedToothFdi?: string | null;
  onSelectTooth?: (fdi: string | null) => void;
  selectedDiseaseId?: string | null;
  onSelectDisease?: (id: string | null) => void;
}

const VIEW_LAYERS: { key: LayerMode; label: string; short: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'annotated', label: 'All Annotations', short: 'All', Icon: Layers },
  { key: 'teeth',     label: 'Teeth Only',      short: 'Teeth', Icon: Activity },
  { key: 'diseases',  label: 'Diseases Only',   short: 'Diseases', Icon: Stethoscope },
  { key: 'original',  label: 'Original Scan',   short: 'Original', Icon: ScanLine },
];

const LEGEND = [
  { color: '#38BDF8', label: 'Tooth' },
  { color: '#FBBF24', label: 'Caries' },
  { color: '#F87171', label: 'Deep Caries / Periapical' },
  { color: '#22D3EE', label: 'Impacted' },
];

function getDiseaseStroke(name: string) {
  if (name === 'Deep_Caries' || name === 'Periapical_Lesion') return '#F87171';
  if (name === 'Caries') return '#FBBF24';
  if (name === 'Impacted') return '#22D3EE';
  return '#A78BFA';
}

/* ─────────────────────────────────────────────────────────────────────── */
export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrls, imageInfo, teeth, diseases,
  selectedToothFdi, onSelectTooth,
  selectedDiseaseId, onSelectDisease,
}) => {
  const [layer, setLayer]             = useState<LayerMode>('annotated');
  const [zoom, setZoom]               = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredId, setHoveredId]     = useState<string | null>(null);

  const getUrl = useCallback((l: LayerMode) => {
    switch (l) {
      case 'original': return imageUrls.original;
      case 'teeth':    return imageUrls.teeth_only    || imageUrls.annotated;
      case 'diseases': return imageUrls.diseases_only || imageUrls.annotated;
      default:         return imageUrls.annotated;
    }
  }, [imageUrls]);

  const switchLayer = (l: LayerMode) => { setImageLoaded(false); setLayer(l); };
  const zoomIn    = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut   = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const zoomReset = () => setZoom(1);
  const openFS  = () => { setZoom(1); setIsFullscreen(true); };
  const closeFS = () => { setZoom(1); setIsFullscreen(false); };

  /* Keyboard shortcuts — only active in fullscreen */
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')              { closeFS(); return; }
      if (e.key === '+' || e.key === '=') { zoomIn();  return; }
      if (e.key === '-')                  { zoomOut(); return; }
      if (e.key === '0')                  { zoomReset(); return; }
      const layerMap: Record<string, LayerMode> = { '1': 'annotated', '2': 'teeth', '3': 'diseases', '4': 'original' };
      if (layerMap[e.key]) switchLayer(layerMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  /* ── SVG click / hover overlay (shared between normal and fullscreen) ─ */
  const SvgOverlay = () => {
    if (!imageLoaded) return null;
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        viewBox={`0 0 ${imageInfo.width} ${imageInfo.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Tooth boxes */}
        {(layer === 'annotated' || layer === 'teeth') && teeth.map(tooth => {
          const sel  = selectedToothFdi === tooth.fdi_number;
          const hov  = hoveredId === tooth.id;
          const b    = tooth.box;
          return (
            <g key={tooth.id}
              onClick={() => onSelectTooth?.(sel ? null : tooth.fdi_number)}
              onMouseEnter={() => setHoveredId(tooth.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={b.x1} y={b.y1} width={b.width} height={b.height} rx={4}
                fill={sel ? 'rgba(56,189,248,0.22)' : hov ? 'rgba(56,189,248,0.10)' : 'transparent'}
                stroke={sel ? '#38BDF8' : hov ? '#7DD3FC' : 'transparent'}
                strokeWidth={sel ? 3 : 2}
                strokeDasharray={sel ? '6,3' : undefined}
              />
              {/* Hover label */}
              {(hov || sel) && (
                <>
                  <rect
                    x={b.x1} y={b.y1 - 22} width={48} height={18} rx={4}
                    fill={sel ? '#0369A1' : 'rgba(0,0,0,0.75)'}
                  />
                  <text
                    x={b.x1 + 24} y={b.y1 - 8}
                    textAnchor="middle" fontSize={11} fontWeight="700"
                    fill="white" fontFamily="monospace"
                  >
                    FDI {tooth.fdi_number}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Disease boxes */}
        {(layer === 'annotated' || layer === 'diseases') && diseases.map(disease => {
          const sel   = selectedDiseaseId === disease.id;
          const hov   = hoveredId === disease.id;
          const b     = disease.box;
          const color = getDiseaseStroke(disease.disease_name);
          return (
            <g key={disease.id}
              onClick={() => {
                onSelectDisease?.(sel ? null : disease.id);
                if (disease.associated_tooth) onSelectTooth?.(disease.associated_tooth);
              }}
              onMouseEnter={() => setHoveredId(disease.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={b.x1} y={b.y1} width={b.width} height={b.height} rx={4}
                fill={sel ? `${color}35` : hov ? `${color}18` : 'transparent'}
                stroke={sel || hov ? color : 'transparent'}
                strokeWidth={sel ? 3 : 2}
              />
              {(hov || sel) && (
                <>
                  <rect x={b.x1} y={b.y1 - 22} width={72} height={18} rx={4} fill="rgba(0,0,0,0.8)" />
                  <text x={b.x1 + 36} y={b.y1 - 8} textAnchor="middle" fontSize={10} fontWeight="700" fill={color} fontFamily="sans-serif">
                    {disease.disease_name.replace('_', ' ')} {(disease.confidence * 100).toFixed(0)}%
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  /* ── The image + SVG container ─────────────────────────────────────── */
  const ImageCanvas = ({ maxH }: { maxH: string }) => (
    <div className="relative inline-block max-w-full select-none">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 min-w-[400px] min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <span className="text-slate-400 text-xs">Loading radiograph…</span>
          </div>
        </div>
      )}
      <img
        key={getUrl(layer)}
        src={getUrl(layer)}
        alt="Dental Radiograph"
        onLoad={() => setImageLoaded(true)}
        className="block rounded-lg border border-slate-700"
        style={{ maxHeight: maxH, width: 'auto', objectFit: 'contain', display: imageLoaded ? 'block' : 'block', minWidth: 300 }}
      />
      <SvgOverlay />
    </div>
  );

  /* ── Compact segmented control ─────────────────────────────────────── */
  const ViewSwitcher = ({ small = false }: { small?: boolean }) => (
    <div className={`flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 gap-0.5`}>
      {VIEW_LAYERS.map((l, i) => (
        <button key={l.key}
          onClick={() => switchLayer(l.key)}
          title={`${l.label} (${i + 1})`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 font-medium ${
            small ? 'text-[11px]' : 'text-xs'
          } ${
            layer === l.key
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <l.Icon className="w-3 h-3" />
          <span className={small ? 'hidden sm:inline' : ''}>{l.short}</span>
        </button>
      ))}
    </div>
  );

  /* ── Zoom controls ─────────────────────────────────────────────────── */
  const ZoomControls = () => (
    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-1.5 py-1 gap-0.5 text-slate-300">
      <button onClick={zoomOut} disabled={zoom <= 0.5} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition" title="Zoom Out (-)">
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="font-mono text-[11px] w-9 text-center text-slate-400">{Math.round(zoom * 100)}%</span>
      <button onClick={zoomReset} className="p-1.5 hover:bg-slate-800 rounded-lg transition" title="Reset Zoom">
        <RotateCcw className="w-3 h-3" />
      </button>
      <button onClick={zoomIn} disabled={zoom >= 3} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition" title="Zoom In (+)">
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     NORMAL VIEW
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="bg-[#0B1220] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: viewer label + selected indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-400 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="font-mono font-semibold text-slate-300">Clinical Viewer</span>
            </div>
            {selectedToothFdi && (
              <span className="bg-teal-950/80 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-md font-mono text-[10px] shrink-0">
                FDI {selectedToothFdi} selected
              </span>
            )}
          </div>

          {/* Right: compact switcher + zoom + expand */}
          <div className="flex items-center gap-2 shrink-0">
            <ViewSwitcher />
            <ZoomControls />
            <button
              onClick={openFS}
              title="Immersive Fullscreen Viewer (Esc to close)"
              className="p-2 bg-slate-900 hover:bg-teal-800/50 border border-slate-700 hover:border-teal-600 rounded-xl text-slate-300 hover:text-teal-300 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Image stage ─────────────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-auto flex items-center justify-center p-6 bg-[#0B1220]" style={{ minHeight: '75vh' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
            <ImageCanvas maxH="72vh" />
          </div>
        </div>

        {/* ── Footer bar ──────────────────────────────────────────────────── */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-500" />
              Click annotations to inspect findings
            </span>
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3">
              {LEGEND.map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block border border-white/10" style={{ background: l.color }} />
                  <span>{l.label}</span>
                </span>
              ))}
            </div>
          </div>
          <span className="font-mono text-[11px] text-slate-600">{imageInfo.width} × {imageInfo.height} px</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          IMMERSIVE FULLSCREEN OVERLAY
      ══════════════════════════════════════════════════════════════════ */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/96 flex flex-col"
          style={{ animation: 'fsOpen 0.22s cubic-bezier(0.32, 0.72, 0, 1)' }}
          aria-modal="true"
          aria-label="Immersive radiograph viewer"
        >
          <style>{`
            @keyframes fsOpen {
              from { opacity: 0; transform: scale(0.97); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-black/50 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Activity className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-white/60 text-xs font-mono truncate">{imageInfo.filename}</span>
              {selectedToothFdi && (
                <span className="bg-teal-900/60 text-teal-300 border border-teal-700 px-2 py-0.5 rounded-md font-mono text-[10px] shrink-0">
                  FDI {selectedToothFdi}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Zoom in fullscreen */}
              <div className="flex items-center bg-white/10 backdrop-blur border border-white/15 rounded-xl px-2 py-1 gap-1 text-white/70">
                <button onClick={zoomOut} disabled={zoom <= 0.5} className="p-1 hover:text-white disabled:opacity-30 transition">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomReset} className="p-1 hover:text-white transition">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomIn} disabled={zoom >= 3} className="p-1 hover:text-white disabled:opacity-30 transition">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              {/* Close */}
              <button
                onClick={closeFS}
                title="Close (Esc)"
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main image */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-8"
            style={{ minHeight: 0 }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
              <ImageCanvas maxH="76vh" />
            </div>
          </div>

          {/* ── Bottom glassmorphism dock ──────────────────────────────────── */}
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10">
            <div
              className="flex items-center gap-1 px-2 py-2 rounded-2xl border border-white/20 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)' }}
            >
              {VIEW_LAYERS.map((l, i) => (
                <button
                  key={l.key}
                  onClick={() => switchLayer(l.key)}
                  title={`${l.label} (${i + 1})`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    layer === l.key
                      ? 'bg-teal-500 text-white shadow-lg scale-105'
                      : 'text-white/55 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <l.Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legend + keyboard hints */}
          <div className="absolute bottom-7 right-6 text-right space-y-2">
            <div className="flex flex-col gap-1 items-end">
              {LEGEND.map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-white/35">
                  <span className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-white/20 font-mono leading-relaxed pt-1">
              <div>ESC — close</div>
              <div>+/- — zoom · 0 — reset</div>
              <div>1-4 — switch view</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
