import React, { useState } from 'react';
import {
  AlignmentScreeningResult,
  ImageInfo,
} from '../../types/api';
import {
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  Maximize2,
  RotateCw,
  Eye,
} from 'lucide-react';

interface AlignmentPanelProps {
  alignment: AlignmentScreeningResult | null | undefined;
  /** Original scan image URL — used as background for the arch curve overlay */
  imageUrl: string;
  imageInfo: ImageInfo;
}

const ARCH_COLORS: Record<string, string> = {
  upper: '#38BDF8',  // sky-400
  lower: '#34D399',  // emerald-400
};

const DEVIATION_COLORS = {
  high: { stroke: '#F87171', fill: 'rgba(248,113,113,0.3)', text: 'text-red-700 bg-red-50 border-red-200' },
  moderate: { stroke: '#FBBF24', fill: 'rgba(251,191,36,0.2)', text: 'text-amber-700 bg-amber-50 border-amber-200' },
  ok: { stroke: '#34D399', fill: 'rgba(52,211,153,0.15)', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

function deviationLevel(devNorm: number | null) {
  if (devNorm === null) return 'ok';
  if (devNorm >= 0.75) return 'high';
  if (devNorm >= 0.50) return 'moderate';
  return 'ok';
}

function severityBadgeClass(sev: string) {
  switch (sev?.toLowerCase()) {
    case 'severe':
    case 'marked':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'moderate':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'mild':
    case 'generalized':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
}

type TabKey = 'arch' | 'crowding' | 'spacing' | 'rotation';

export const AlignmentPanel: React.FC<AlignmentPanelProps> = ({
  alignment,
  imageUrl,
  imageInfo,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('arch');

  // Layer visibility toggles for the X-ray viewer
  const [showCurves, setShowCurves] = useState(true);
  const [showCrowding, setShowCrowding] = useState(true);
  const [showSpacing, setShowSpacing] = useState(true);
  const [showRotations, setShowRotations] = useState(true);

  // Active tooth highlight
  const [highlightedFdi, setHighlightedFdi] = useState<string | null>(null);

  // ── No alignment data ────────────────────────────────────────────────────
  if (!alignment) {
    return null;
  }

  const svgW = imageInfo.width;
  const svgH = imageInfo.height;

  // Group curve points by arch colour heuristic
  const upperCurvePoints = alignment.tooth_centers
    .filter((tc) => tc.arch === 'upper')
    .sort((a, b) => a.cx - b.cx);
  const lowerCurvePoints = alignment.tooth_centers
    .filter((tc) => tc.arch === 'lower')
    .sort((a, b) => a.cx - b.cx);

  function polylinePts(centers: typeof upperCurvePoints) {
    return centers.map((c) => `${c.cx},${c.fitted_cy}`).join(' ');
  }

  const crowding = alignment.crowding;
  const spacing = alignment.spacing;
  const rotations = alignment.rotations ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Tooth Alignment & Orthodontic Screening</h3>
            <p className="text-xs text-slate-500">
              Geometric analysis: Arch Curves, Crowding, Spacing & Rotations
            </p>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {alignment.sufficient_data ? (
            <>
              {alignment.flagged_count > 0 ? (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {alignment.flagged_count} curve dev
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Arch normal
                </span>
              )}

              {crowding?.has_crowding && crowding.overall_severity !== 'None' && (
                <span className={`text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${severityBadgeClass(crowding.overall_severity)}`}>
                  {crowding.overall_severity} Crowding
                </span>
              )}

              {spacing?.midline_diastema?.present && (
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Diastema
                </span>
              )}

              {rotations.length > 0 && (
                <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  {rotations.length} Rotations
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Insufficient data
            </span>
          )}

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {/* Insufficient data notice */}
          {!alignment.sufficient_data ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold">Insufficient detections for arch analysis</p>
                <p>{alignment.insufficient_data_reason}</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── PERSISTENT X-RAY FINDINGS VIEWER ──────────────────────── */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Panoramic X-Ray Findings Overlay</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        (Live geometric visual markers on scan)
                      </span>
                    </h4>
                  </div>

                  {/* Layer Visibility Toggle Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Layers:
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowCurves(!showCurves)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium flex items-center gap-1 ${
                        showCurves
                          ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                      Arch Curves
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCrowding(!showCrowding)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium flex items-center gap-1 ${
                        showCrowding
                          ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Crowding Overlaps ({crowding?.overlapping_pairs.length ?? 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSpacing(!showSpacing)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium flex items-center gap-1 ${
                        showSpacing
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                      Spacing & Gaps
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRotations(!showRotations)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition font-medium flex items-center gap-1 ${
                        showRotations
                          ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      Rotations ({rotations.length})
                    </button>
                  </div>
                </div>

                {/* SVG Overlay Container */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                  <img
                    src={imageUrl}
                    alt="Dental scan with alignment and malocclusion overlay"
                    className="w-full h-auto block opacity-85"
                    style={{ maxHeight: '380px', objectFit: 'contain' }}
                  />
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* 1. ARCH CURVES LAYER */}
                    {showCurves && (
                      <>
                        {/* Upper arch curve */}
                        {upperCurvePoints.length >= 2 && (
                          <polyline
                            points={polylinePts(upperCurvePoints)}
                            fill="none"
                            stroke={ARCH_COLORS.upper}
                            strokeWidth="3.5"
                            strokeDasharray="8,4"
                            strokeLinecap="round"
                            opacity="0.9"
                          />
                        )}

                        {/* Lower arch curve */}
                        {lowerCurvePoints.length >= 2 && (
                          <polyline
                            points={polylinePts(lowerCurvePoints)}
                            fill="none"
                            stroke={ARCH_COLORS.lower}
                            strokeWidth="3.5"
                            strokeDasharray="8,4"
                            strokeLinecap="round"
                            opacity="0.9"
                          />
                        )}

                        {/* Tooth centres with deviation lines */}
                        {alignment.tooth_centers.map((tc, tcIdx) => {
                          const level = deviationLevel(tc.deviation_normalized);
                          const col = DEVIATION_COLORS[level];
                          const archColor = tc.arch === 'upper' ? ARCH_COLORS.upper : ARCH_COLORS.lower;
                          const isHighlighted = highlightedFdi === tc.fdi;

                          return (
                            <g key={`tc-svg-${tc.fdi}-${tcIdx}`}>
                              {/* Deviation line from actual centre to fitted curve */}
                              {tc.deviation_px > 12 && (
                                <line
                                  x1={tc.cx}
                                  y1={tc.cy}
                                  x2={tc.cx}
                                  y2={tc.fitted_cy}
                                  stroke={col.stroke}
                                  strokeWidth="2"
                                  strokeDasharray="3,2"
                                  opacity="0.85"
                                />
                              )}
                              {/* Tooth centre dot */}
                              <circle
                                cx={tc.cx}
                                cy={tc.cy}
                                r={isHighlighted ? '8' : '5'}
                                fill={col.fill}
                                stroke={isHighlighted ? '#FFFFFF' : col.stroke}
                                strokeWidth={isHighlighted ? '3' : '2'}
                              />
                              {/* FDI label */}
                              <text
                                x={tc.cx}
                                y={tc.cy - 9}
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="bold"
                                fill={isHighlighted ? '#FBBF24' : archColor}
                                stroke="rgba(0,0,0,0.7)"
                                strokeWidth="3"
                                paintOrder="stroke"
                              >
                                {tc.fdi}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    )}

                    {/* 2. CROWDING OVERLAPS LAYER */}
                    {showCrowding && crowding && crowding.overlapping_pairs.map((p, idx) => {
                      const x1 = p.overlap_x1 ?? 0;
                      const x2 = p.overlap_x2 ?? 0;
                      if (!x1 && !x2) return null;
                      const boxX = Math.min(x1, x2);
                      const boxW = Math.max(10, Math.abs(x2 - x1));
                      const boxY = (p.y1 ?? 0);
                      const boxH = Math.max(24, ((p.y2 ?? 0) - (p.y1 ?? 0)));
                      const isHighlighted = highlightedFdi === p.from_fdi || highlightedFdi === p.to_fdi;

                      return (
                        <g key={`crowd-svg-${idx}`}>
                          {/* Overlap area bounding highlight */}
                          <rect
                            x={boxX}
                            y={boxY}
                            width={boxW}
                            height={boxH}
                            rx="4"
                            fill={isHighlighted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.28)'}
                            stroke="#EF4444"
                            strokeWidth={isHighlighted ? '3' : '2'}
                            strokeDasharray="4,2"
                          />
                          {/* Top warning marker badge */}
                          <g transform={`translate(${boxX + boxW / 2}, ${boxY - 4})`}>
                            <rect
                              x="-26"
                              y="-16"
                              width="52"
                              height="15"
                              rx="3"
                              fill="#DC2626"
                              stroke="#FEE2E2"
                              strokeWidth="0.8"
                            />
                            <text
                              x="0"
                              y="-5"
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="bold"
                              fill="#FFFFFF"
                            >
                              Overlap {p.overlap_px.toFixed(0)}p
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* 3. SPACING & DIASTEMA LAYER */}
                    {showSpacing && (
                      <>
                        {/* Midline Diastema Caliper */}
                        {spacing?.midline_diastema?.present && spacing.midline_diastema.x1 && spacing.midline_diastema.x2 && (
                          <g key="midline-dia-marker">
                            {/* Horizontal Caliper bar */}
                            <line
                              x1={spacing.midline_diastema.x1}
                              y1={spacing.midline_diastema.y}
                              x2={spacing.midline_diastema.x2}
                              y2={spacing.midline_diastema.y}
                              stroke="#6366F1"
                              strokeWidth="3"
                            />
                            {/* Left and right caliper ticks */}
                            <line
                              x1={spacing.midline_diastema.x1}
                              y1={(spacing.midline_diastema.y ?? 0) - 10}
                              x2={spacing.midline_diastema.x1}
                              y2={(spacing.midline_diastema.y ?? 0) + 10}
                              stroke="#6366F1"
                              strokeWidth="3"
                            />
                            <line
                              x1={spacing.midline_diastema.x2}
                              y1={(spacing.midline_diastema.y ?? 0) - 10}
                              x2={spacing.midline_diastema.x2}
                              y2={(spacing.midline_diastema.y ?? 0) + 10}
                              stroke="#6366F1"
                              strokeWidth="3"
                            />
                            {/* Diastema tag */}
                            <g transform={`translate(${((spacing.midline_diastema.x1 ?? 0) + (spacing.midline_diastema.x2 ?? 0)) / 2}, ${(spacing.midline_diastema.y ?? 0) - 14})`}>
                              <rect
                                x="-38"
                                y="-15"
                                width="76"
                                height="15"
                                rx="3"
                                fill="#4F46E5"
                                stroke="#E0E7FF"
                                strokeWidth="0.8"
                              />
                              <text
                                x="0"
                                y="-4"
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="bold"
                                fill="#FFFFFF"
                              >
                                Diastema {spacing.midline_diastema.gap_px.toFixed(0)}px
                              </text>
                            </g>
                          </g>
                        )}

                        {/* General Spaced Regions Calipers */}
                        {alignment.spacing_ratios
                          .filter((sr) => (sr.wide || sr.ratio >= 0.35) && sr.x1 && sr.x2)
                          .map((sr, idx) => (
                            <g key={`gap-caliper-${idx}`}>
                              <line
                                x1={sr.x1}
                                y1={sr.y}
                                x2={sr.x2}
                                y2={sr.y}
                                stroke="#38BDF8"
                                strokeWidth="2.5"
                              />
                              <line
                                x1={sr.x1}
                                y1={(sr.y ?? 0) - 7}
                                x2={sr.x1}
                                y2={(sr.y ?? 0) + 7}
                                stroke="#38BDF8"
                                strokeWidth="2.5"
                              />
                              <line
                                x1={sr.x2}
                                y1={(sr.y ?? 0) - 7}
                                x2={sr.x2}
                                y2={(sr.y ?? 0) + 7}
                                stroke="#38BDF8"
                                strokeWidth="2.5"
                              />
                              <text
                                x={((sr.x1 ?? 0) + (sr.x2 ?? 0)) / 2}
                                y={(sr.y ?? 0) - 8}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="bold"
                                fill="#38BDF8"
                                stroke="rgba(0,0,0,0.8)"
                                strokeWidth="2.5"
                                paintOrder="stroke"
                              >
                                {sr.gap_px.toFixed(0)}px
                              </text>
                            </g>
                          ))}
                      </>
                    )}

                    {/* 4. TOOTH ROTATIONS LAYER */}
                    {showRotations && rotations.map((rot, idx) => {
                      if (rot.cx === undefined || rot.cy === undefined) return null;
                      const bx = rot.x1 ?? (rot.cx - 15);
                      const by = rot.y1 ?? (rot.cy - 20);
                      const bw = (rot.x2 !== undefined && rot.x1 !== undefined) ? (rot.x2 - rot.x1) : 30;
                      const bh = (rot.y2 !== undefined && rot.y1 !== undefined) ? (rot.y2 - rot.y1) : 40;
                      const isHighlighted = highlightedFdi === rot.fdi;

                      return (
                        <g key={`rot-marker-${rot.fdi}-${idx}`}>
                          {/* Rotated tooth bounding box outline */}
                          <rect
                            x={bx}
                            y={by}
                            width={bw}
                            height={bh}
                            rx="5"
                            fill={isHighlighted ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.16)'}
                            stroke="#A855F7"
                            strokeWidth={isHighlighted ? '2.5' : '1.8'}
                            strokeDasharray="4,2"
                          />
                          {/* Top Rotation circular pin */}
                          <g transform={`translate(${rot.cx}, ${by - 9})`}>
                            <circle
                              cx="0"
                              cy="0"
                              r="8"
                              fill="#7E22CE"
                              stroke="#F3E8FF"
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="black"
                              fill="#FFFFFF"
                            >
                              ⟳
                            </text>
                            <text
                              x="0"
                              y="-10"
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="bold"
                              fill="#E9D5FF"
                              stroke="rgba(0,0,0,0.7)"
                              strokeWidth="2"
                              paintOrder="stroke"
                            >
                              {rot.fdi}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* X-ray Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 px-1 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="4">
                      <line x1="0" y1="2" x2="18" y2="2" stroke={ARCH_COLORS.upper} strokeWidth="2.5" strokeDasharray="4,2"/>
                    </svg>
                    Upper curve
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="18" height="4">
                      <line x1="0" y1="2" x2="18" y2="2" stroke={ARCH_COLORS.lower} strokeWidth="2.5" strokeDasharray="4,2"/>
                    </svg>
                    Lower curve
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-red-500/30 border border-red-500 inline-block" />
                    Crowding overlap zone
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 border-b-2 border-sky-400 inline-block" />
                    Spacing gap / Diastema
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-600 text-white text-[8px] font-bold inline-flex items-center justify-center">
                      ⟳
                    </span>
                    Axial rotation / Tipping
                  </span>
                </div>
              </div>

              {/* ── Sub-navigation Tabs ─────────────────────────────────── */}
              <div className="flex border-b border-slate-200 space-x-1 pb-1 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('arch')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'arch'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Arch Curves & Deviations
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('crowding')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'crowding'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Crowding Analysis
                  {crowding?.has_crowding && crowding.overall_severity !== 'None' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('spacing')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'spacing'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Spacing & Diastema
                  {spacing?.has_spacing && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('rotation')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'rotation'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Tooth Rotation
                  {rotations.length > 0 && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {rotations.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ── TAB 1: Arch Curves & Deviations Table ───────────────── */}
              {activeTab === 'arch' && (
                <div className="space-y-4">
                  {/* Flagged findings */}
                  {alignment.findings.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800">Flagged Arch Curve Regions</h4>
                      {alignment.findings.map((f, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => f.tooth_fdi && setHighlightedFdi(f.tooth_fdi)}
                          onMouseLeave={() => setHighlightedFdi(null)}
                          className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1.5 transition hover:border-amber-400"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-xs font-semibold text-amber-900">{f.region}</span>
                            {f.deviation_px !== null && (
                              <span className="ml-auto text-[11px] text-amber-700 font-medium">
                                {f.deviation_px.toFixed(0)} px ({((f.deviation_normalized ?? 0) * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed pl-5">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>No regions were flagged for vertical arch curve deviation at the current threshold.</span>
                    </div>
                  )}

                  {/* Per-tooth deviation table */}
                  {alignment.tooth_centers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800">Per-Tooth Deviation from Arch Curve</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {alignment.tooth_centers
                          .slice()
                          .sort((a, b) => b.deviation_normalized - a.deviation_normalized)
                          .map((tc, tcIdx) => {
                            const level = deviationLevel(tc.deviation_normalized);
                            const col = DEVIATION_COLORS[level];
                            const isHighlighted = highlightedFdi === tc.fdi;

                            return (
                              <div
                                key={`tc-row-${tc.fdi}-${tcIdx}`}
                                onMouseEnter={() => setHighlightedFdi(tc.fdi)}
                                onMouseLeave={() => setHighlightedFdi(null)}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${col.text} ${
                                  isHighlighted ? 'ring-2 ring-blue-400 font-bold' : ''
                                }`}
                              >
                                <span className="font-mono font-bold">FDI {tc.fdi}</span>
                                <span>{tc.deviation_px.toFixed(0)} px</span>
                                <span className="font-semibold">{(tc.deviation_normalized * 100).toFixed(0)}%</span>
                              </div>
                            );
                          })}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Hover any tooth row to highlight its position on the X-ray scan above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: Crowding Analysis ───────────────────────────── */}
              {activeTab === 'crowding' && (
                <div className="space-y-4">
                  {crowding ? (
                    <>
                      {/* Overall Crowding Status Card */}
                      <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                        crowding.overall_severity === 'None'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : crowding.overall_severity === 'Severe'
                          ? 'bg-red-50/60 border-red-200 text-red-900'
                          : 'bg-amber-50/60 border-amber-200 text-amber-900'
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Overall Crowding Status:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${severityBadgeClass(crowding.overall_severity)}`}>
                              {crowding.overall_severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed pt-1">{crowding.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black font-mono">
                            {crowding.overlapping_pairs.length}
                          </span>
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Overlapping Pairs</span>
                        </div>
                      </div>

                      {/* Arch-by-Arch Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {crowding.upper_arch && (
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Upper Arch (Maxillary)</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBadgeClass(crowding.upper_arch.severity)}`}>
                                {crowding.upper_arch.severity}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <span className="block text-[10px] text-slate-400">Available Arch</span>
                                <span className="font-mono font-bold text-slate-700">{crowding.upper_arch.available_arch_length_px.toFixed(0)} px</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400">Teeth Width Sum</span>
                                <span className="font-mono font-bold text-slate-700">{crowding.upper_arch.total_tooth_width_px.toFixed(0)} px</span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">Space Discrepancy:</span>
                                <span className={`font-mono font-bold ${crowding.upper_arch.space_discrepancy_px < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                  {crowding.upper_arch.space_discrepancy_px > 0 ? '+' : ''}
                                  {crowding.upper_arch.space_discrepancy_px.toFixed(0)} px ({(crowding.upper_arch.discrepancy_ratio * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {crowding.lower_arch && (
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Lower Arch (Mandibular)</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBadgeClass(crowding.lower_arch.severity)}`}>
                                {crowding.lower_arch.severity}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <span className="block text-[10px] text-slate-400">Available Arch</span>
                                <span className="font-mono font-bold text-slate-700">{crowding.lower_arch.available_arch_length_px.toFixed(0)} px</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400">Teeth Width Sum</span>
                                <span className="font-mono font-bold text-slate-700">{crowding.lower_arch.total_tooth_width_px.toFixed(0)} px</span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">Space Discrepancy:</span>
                                <span className={`font-mono font-bold ${crowding.lower_arch.space_discrepancy_px < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                  {crowding.lower_arch.space_discrepancy_px > 0 ? '+' : ''}
                                  {crowding.lower_arch.space_discrepancy_px.toFixed(0)} px ({(crowding.lower_arch.discrepancy_ratio * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Overlapping Tooth Pairs */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800">Detected Horizontal Tooth Overlaps</h4>
                          <span className="text-[10px] text-slate-500 italic">Marked in red on the X-ray above</span>
                        </div>
                        {crowding.overlapping_pairs.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {crowding.overlapping_pairs.map((p, idx) => (
                              <div
                                key={idx}
                                onMouseEnter={() => setHighlightedFdi(p.from_fdi)}
                                onMouseLeave={() => setHighlightedFdi(null)}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs hover:border-amber-400 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                    FDI {p.from_fdi}
                                  </span>
                                  <span className="text-slate-400">overlaps</span>
                                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                    FDI {p.to_fdi}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-amber-800">{p.overlap_px.toFixed(0)} px</span>
                                  <span className="text-[10px] text-slate-500 block">{(p.overlap_ratio * 100).toFixed(0)}% width</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>No significant horizontal tooth overlaps detected.</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Crowding data not available.</p>
                  )}
                </div>
              )}

              {/* ── TAB 3: Spacing & Diastema ─────────────────────────── */}
              {activeTab === 'spacing' && (
                <div className="space-y-4">
                  {spacing ? (
                    <>
                      {/* Midline Diastema Special Callout */}
                      {spacing.midline_diastema?.present ? (
                        <div
                          onMouseEnter={() => spacing.midline_diastema?.teeth && setHighlightedFdi(spacing.midline_diastema.teeth[0])}
                          onMouseLeave={() => setHighlightedFdi(null)}
                          className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 flex items-start gap-3 cursor-pointer hover:border-indigo-400 transition"
                        >
                          <Maximize2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-900">Midline Diastema Flagged</span>
                              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-300">
                                {spacing.midline_diastema.arch?.toUpperCase()} ARCH
                              </span>
                            </div>
                            <p className="text-xs text-indigo-800 leading-relaxed">
                              {spacing.midline_diastema.description}
                            </p>
                            <span className="text-[10px] text-indigo-500 italic block">
                              Shown as an indigo caliper on the central incisors above.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>No midline diastema detected (central incisor contacts are closed).</span>
                        </div>
                      )}

                      {/* Wide Spacing Regions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800">Interdental Gaps & Spacing Regions</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBadgeClass(spacing.overall_severity)}`}>
                            {spacing.overall_severity} Spacing
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{spacing.description}</p>

                        {alignment.spacing_ratios.filter((sr) => sr.ratio >= 0.35).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {alignment.spacing_ratios
                              .filter((sr) => sr.ratio >= 0.35)
                              .map((sr, i) => (
                                <div
                                  key={i}
                                  onMouseEnter={() => setHighlightedFdi(sr.from_fdi)}
                                  onMouseLeave={() => setHighlightedFdi(null)}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer hover:border-sky-400 transition ${
                                    sr.wide ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300">
                                      FDI {sr.from_fdi}
                                    </span>
                                    <span className="text-slate-400">to</span>
                                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300">
                                      FDI {sr.to_fdi}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-semibold ${sr.wide ? 'text-amber-800 font-bold' : 'text-slate-700'}`}>
                                      {sr.gap_px.toFixed(0)} px
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">{(sr.ratio * 100).toFixed(0)}% avg width</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>No abnormal interdental gaps flagged across either dental arch.</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Spacing data not available.</p>
                  )}
                </div>
              )}

              {/* ── TAB 4: Tooth Rotation ─────────────────────────────── */}
              {activeTab === 'rotation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Tooth Rotation & Axial Twist Screening</h4>
                      <p className="text-[11px] text-slate-500">
                        Evaluates projected aspect-ratio anomalies against standard dental anatomical morphology. Highlighted in purple on X-ray.
                      </p>
                    </div>
                    {rotations.length > 0 && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded">
                        {rotations.length} Flagged
                      </span>
                    )}
                  </div>

                  {rotations.length > 0 ? (
                    <div className="space-y-2.5">
                      {rotations.map((rot, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHighlightedFdi(rot.fdi)}
                          onMouseLeave={() => setHighlightedFdi(null)}
                          className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1.5 hover:border-purple-400 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 text-xs">
                                FDI {rot.fdi}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">{rot.anatomical_name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBadgeClass(rot.severity)}`}>
                              {rot.severity} Rotation
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{rot.description}</p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-purple-100">
                            <span>Measured Aspect Ratio: <strong>{rot.aspect_ratio.toFixed(2)}</strong></span>
                            <span>Standard Reference: <strong>~{rot.expected_ratio.toFixed(2)}</strong></span>
                            <span>Deviation: <strong className="text-purple-700">{rot.deviation_percent.toFixed(0)}%</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>All detected teeth display aspect ratios consistent with normal coronal projection (no marked axial rotations flagged).</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Limitation notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <strong>Important limitation:</strong> {alignment.limitation_note}
          </div>
        </div>
      )}
    </div>
  );
};
