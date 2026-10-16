import React, { useState } from 'react';
import {
  AlignmentScreeningResult,
  AlignmentFinding,
  ImageInfo,
} from '../../types/api';
import {
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
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

export const AlignmentPanel: React.FC<AlignmentPanelProps> = ({
  alignment,
  imageUrl,
  imageInfo,
}) => {
  const [expanded, setExpanded] = useState(false);

  // ── No alignment data ────────────────────────────────────────────────────
  if (!alignment) {
    return null;
  }

  const svgW = imageInfo.width;
  const svgH = imageInfo.height;

  // Group curve points by arch colour heuristic (upper curve at smaller Y)
  const upperCurvePoints = alignment.tooth_centers
    .filter((tc) => tc.arch === 'upper')
    .sort((a, b) => a.cx - b.cx);
  const lowerCurvePoints = alignment.tooth_centers
    .filter((tc) => tc.arch === 'lower')
    .sort((a, b) => a.cx - b.cx);

  function polylinePts(centers: typeof upperCurvePoints) {
    return centers.map((c) => `${c.cx},${c.fitted_cy}`).join(' ');
  }

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
            <h3 className="text-base font-bold text-slate-900">Tooth Alignment Screening</h3>
            <p className="text-xs text-slate-500">
              Preliminary geometric analysis from detected tooth positions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {alignment.sufficient_data ? (
            alignment.flagged_count > 0 ? (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {alignment.flagged_count} region{alignment.flagged_count > 1 ? 's' : ''} flagged
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                No regions flagged
              </span>
            )
          ) : (
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Insufficient data
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
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
              {/* ── Arch Curve Overlay ───────────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Estimated Arch Curve Overlay</h4>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={imageUrl}
                    alt="Dental scan with arch overlay"
                    className="w-full h-auto block opacity-80"
                    style={{ maxHeight: '340px', objectFit: 'contain' }}
                  />
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Upper arch estimated curve */}
                    {upperCurvePoints.length >= 2 && (
                      <polyline
                        points={polylinePts(upperCurvePoints)}
                        fill="none"
                        stroke={ARCH_COLORS.upper}
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                    )}

                    {/* Lower arch estimated curve */}
                    {lowerCurvePoints.length >= 2 && (
                      <polyline
                        points={polylinePts(lowerCurvePoints)}
                        fill="none"
                        stroke={ARCH_COLORS.lower}
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        strokeLinecap="round"
                        opacity="0.9"
                      />
                    )}

                    {/* Tooth centres with deviation indicators */}
                    {alignment.tooth_centers.map((tc, tcIdx) => {
                      const level = deviationLevel(tc.deviation_normalized);
                      const col = DEVIATION_COLORS[level];
                      const archColor = tc.arch === 'upper' ? ARCH_COLORS.upper : ARCH_COLORS.lower;
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
                            r="6"
                            fill={col.fill}
                            stroke={col.stroke}
                            strokeWidth="2"
                          />
                          {/* FDI label */}
                          <text
                            x={tc.cx}
                            y={tc.cy - 10}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill={archColor}
                            stroke="rgba(0,0,0,0.6)"
                            strokeWidth="3"
                            paintOrder="stroke"
                          >
                            {tc.fdi}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5">
                    <svg width="20" height="4">
                      <line x1="0" y1="2" x2="20" y2="2" stroke={ARCH_COLORS.upper} strokeWidth="2" strokeDasharray="4,2"/>
                    </svg>
                    Upper arch curve
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="20" height="4">
                      <line x1="0" y1="2" x2="20" y2="2" stroke={ARCH_COLORS.lower} strokeWidth="2" strokeDasharray="4,2"/>
                    </svg>
                    Lower arch curve
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-300 border border-red-500 inline-block" />
                    Flagged deviation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-500 inline-block" />
                    Within expected range
                  </span>
                </div>
              </div>

              {/* ── Per-tooth deviation table ──────────────────────────── */}
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
                        return (
                          <div
                            key={`tc-row-${tc.fdi}-${tcIdx}`}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs ${col.text}`}
                          >
                            <span className="font-mono font-bold">FDI {tc.fdi}</span>
                            <span>{tc.deviation_px.toFixed(0)} px</span>
                            <span className="font-semibold">{(tc.deviation_normalized * 100).toFixed(0)}%</span>
                          </div>
                        );
                      })}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    % = deviation as fraction of average tooth width. Values ≥50% are flagged.
                  </p>
                </div>
              )}

              {/* ── Flagged findings ───────────────────────────────────── */}
              {alignment.findings.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Flagged Regions</h4>
                  {alignment.findings.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1.5"
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
                  <span>No regions were flagged for alignment review at the current deviation threshold.</span>
                </div>
              )}

              {/* ── Spacing summary ──────────────────────────────────────── */}
              {alignment.spacing_ratios.some((sr) => sr.wide) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Wide Spacing Regions</h4>
                  {alignment.spacing_ratios
                    .filter((sr) => sr.wide)
                    .map((sr, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Gap between <strong>FDI {sr.from_fdi}</strong> and <strong>FDI {sr.to_fdi}</strong>:{' '}
                          {sr.gap_px.toFixed(0)} px ({(sr.ratio * 100).toFixed(0)}% of avg tooth width)
                        </span>
                      </div>
                    ))}
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
