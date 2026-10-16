/**
 * ToothDetectionList.tsx — Full-width Odontogram & Tooth Card Grid
 *
 * Sections:
 *  1. Summary banner — "X teeth found · Y need attention · Z missing"
 *  2. Interactive visual odontogram: full 32-position FDI arch chart
 *     - Color: green=healthy, amber=caries, red=deep caries/periapical,
 *       blue=impacted, gray-dashed=missing/undetected
 *     - Hover tooltip (tooth name, FDI, finding, confidence)
 *     - Click selects tooth → cross-highlights viewer + accordion
 *  3. Quadrant filter tabs (All | Q1 | Q2 | Q3 | Q4) + "problems only" toggle
 *  4. Full card grid (4 cols desktop, 2 tablet, 1 mobile)
 *     - FDI badge, full tooth name (no truncation), type, confidence bar,
 *       plain-English status chip
 *  5. Missing FDI chips at bottom
 *
 * All props preserved from original.
 */
import React, { useState } from 'react';
import { ToothDetection } from '../../types/api';
import {
  CheckCircle2, AlertTriangle, AlertCircle, HelpCircle,
  Activity,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────── */
interface ToothDetectionListProps {
  teeth: ToothDetection[];
  missingTeeth: string[];
  selectedToothFdi?: string | null;
  onSelectTooth: (fdi: string | null) => void;
}

/* ── FDI arch layout ─────────────────────────────────────────────────── */
// Upper arch displayed left→right: Q1 (18→11) | Q2 (21→28)
// Lower arch displayed left→right: Q4 (48→41) | Q3 (31→38)
const UPPER_LEFT  = ['18','17','16','15','14','13','12','11'];   // Q1
const UPPER_RIGHT = ['21','22','23','24','25','26','27','28'];   // Q2
const LOWER_LEFT  = ['48','47','46','45','44','43','42','41'];   // Q4
const LOWER_RIGHT = ['31','32','33','34','35','36','37','38'];   // Q3

type ToothStatus = 'healthy' | 'caries' | 'critical' | 'impacted' | 'missing' | 'undetected';

interface ToothStatusConfig {
  bg: string;
  border: string;
  ring: string;
  chip: string;
  label: string;
  dot: string;
}

const STATUS_CONFIG: Record<ToothStatus, ToothStatusConfig> = {
  healthy:    { bg: '#10B981', border: '#059669', ring: '#6EE7B7', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',  label: 'Healthy',          dot: 'bg-emerald-500' },
  caries:     { bg: '#F59E0B', border: '#D97706', ring: '#FCD34D', chip: 'bg-amber-50 text-amber-800 border-amber-200',        label: 'Possible cavity',  dot: 'bg-amber-500' },
  critical:   { bg: '#EF4444', border: '#DC2626', ring: '#FCA5A5', chip: 'bg-red-50 text-red-800 border-red-200',              label: 'Deep cavity',       dot: 'bg-red-500' },
  impacted:   { bg: '#3B82F6', border: '#2563EB', ring: '#93C5FD', chip: 'bg-blue-50 text-blue-800 border-blue-200',           label: 'Impacted tooth',   dot: 'bg-blue-500' },
  missing:    { bg: 'transparent', border: '#94A3B8', ring: '#CBD5E1', chip: 'bg-slate-50 text-slate-500 border-slate-200',    label: 'Missing / unerupted', dot: 'bg-slate-300' },
  undetected: { bg: '#F1F5F9', border: '#E2E8F0', ring: '#E2E8F0', chip: 'bg-slate-50 text-slate-400 border-slate-100',       label: 'Not detected',     dot: 'bg-slate-200' },
};

function getStatus(fdi: string, teeth: ToothDetection[], missingTeeth: string[]): ToothStatus {
  if (missingTeeth.includes(fdi)) return 'missing';
  const tooth = teeth.find(t => t.fdi_number === fdi);
  if (!tooth) return 'undetected';
  const d = tooth.associated_diseases;
  if (d.includes('Deep_Caries') || d.includes('Periapical_Lesion')) return 'critical';
  if (d.includes('Caries')) return 'caries';
  if (d.includes('Impacted')) return 'impacted';
  return 'healthy';
}

function getSeverityBadge(tooth: ToothDetection) {
  const d = tooth.associated_diseases;
  if (!d || d.length === 0)
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" />Healthy
    </span>;
  if (d.includes('Deep_Caries') || d.includes('Periapical_Lesion'))
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
      <AlertCircle className="w-3 h-3" />Deep cavity
    </span>;
  if (d.includes('Impacted'))
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
      <AlertTriangle className="w-3 h-3" />Impacted
    </span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
    <AlertTriangle className="w-3 h-3" />Possible cavity
  </span>;
}

/* ── Single tooth cell in the odontogram ────────────────────────────── */
const ToothCell: React.FC<{
  fdi: string;
  teeth: ToothDetection[];
  missingTeeth: string[];
  selected: boolean;
  onClick: () => void;
  arch: 'upper' | 'lower';
}> = ({ fdi, teeth, missingTeeth, selected, onClick, arch }) => {
  const [hovered, setHovered] = useState(false);
  const status = getStatus(fdi, teeth, missingTeeth);
  const cfg = STATUS_CONFIG[status];
  const tooth = teeth.find(t => t.fdi_number === fdi);
  const isMissing = status === 'missing' || status === 'undetected';

  const rootStyle: React.CSSProperties = arch === 'upper'
    ? { borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }
    : { borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 };

  return (
    <div
      className="relative flex flex-col items-center gap-0.5 cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={tooth ? `FDI ${fdi} · ${tooth.anatomical_name} · ${STATUS_CONFIG[status].label}` : `FDI ${fdi} · ${STATUS_CONFIG[status].label}`}
    >
      {/* Crown / body */}
      <div
        className="w-7 h-8 transition-all duration-150"
        style={{
          ...rootStyle,
          background: isMissing ? 'transparent' : cfg.bg,
          border: `2px ${isMissing ? 'dashed' : 'solid'} ${cfg.border}`,
          opacity: isMissing ? 0.5 : 1,
          boxShadow: selected ? `0 0 0 3px ${cfg.ring}` : hovered ? `0 0 0 2px ${cfg.ring}` : 'none',
          transform: selected ? 'scale(1.15)' : hovered ? 'scale(1.05)' : 'scale(1)',
        }}
      />
      {/* FDI number */}
      <span className={`text-[9px] font-mono font-bold leading-none transition-colors ${
        selected ? 'text-teal-700' : 'text-slate-400'
      }`}>
        {fdi}
      </span>

      {/* Hover tooltip */}
      {hovered && tooth && (
        <div className={`absolute z-20 ${arch === 'upper' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 whitespace-nowrap`}>
          <div className="bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl leading-tight">
            <div className="font-mono font-black text-teal-400">FDI {fdi}</div>
            <div className="text-slate-300 mt-0.5">{tooth.anatomical_name}</div>
            <div className={`mt-0.5 font-semibold`} style={{ color: cfg.bg === 'transparent' ? '#94A3B8' : cfg.bg }}>
              {cfg.label}
            </div>
            <div className="text-slate-500 mt-0.5">{(tooth.confidence * 100).toFixed(0)}% conf</div>
          </div>
          <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 ${
            arch === 'upper' ? 'top-full -mt-1' : 'bottom-full -mb-1'
          }`} />
        </div>
      )}
    </div>
  );
};

/* ── Summary banner ─────────────────────────────────────────────────── */
const SummaryBanner: React.FC<{ teeth: ToothDetection[]; missingTeeth: string[] }> = ({ teeth, missingTeeth }) => {
  const problemTeeth = teeth.filter(t => t.associated_diseases.length > 0).length;
  const message = problemTeeth === 0
    ? 'No pathologies detected. Routine review recommended.'
    : `${problemTeeth} tooth/teeth show possible issues. Please review them with your dentist.`;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex flex-wrap gap-3 flex-1">
        {[
          { value: teeth.length,         label: 'teeth found',           color: 'text-teal-700 bg-teal-50 border-teal-200' },
          { value: problemTeeth,          label: 'need attention',         color: problemTeeth > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-50 border-slate-200' },
          { value: missingTeeth.length,  label: 'missing / unerupted',   color: 'text-slate-600 bg-slate-50 border-slate-200' },
        ].map(stat => (
          <div key={stat.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${stat.color}`}>
            <span className="text-2xl font-black tabular-nums">{stat.value}</span>
            <span className="text-xs leading-tight max-w-[80px]">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className={`flex-1 min-w-[200px] flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
        problemTeeth === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        {problemTeeth === 0
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        }
        <p className="text-sm leading-snug">{message}</p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────── */
export const ToothDetectionList: React.FC<ToothDetectionListProps> = ({
  teeth, missingTeeth, selectedToothFdi, onSelectTooth,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [problemOnly, setProblemOnly] = useState(false);

  const q1 = teeth.filter(t => t.quadrant === 1);
  const q2 = teeth.filter(t => t.quadrant === 2);
  const q3 = teeth.filter(t => t.quadrant === 3);
  const q4 = teeth.filter(t => t.quadrant === 4);

  const byTab = { all: teeth, q1, q2, q3, q4 };
  const tabTeeth = byTab[activeTab];
  const displayTeeth = problemOnly ? tabTeeth.filter(t => t.associated_diseases.length > 0) : tabTeeth;

  /* Problem teeth count */
  const problemCount = teeth.filter(t => t.associated_diseases.length > 0).length;

  const archTeeth = (fdis: string[]) => fdis.map(fdi => ({
    fdi,
    status: getStatus(fdi, teeth, missingTeeth),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
          <Activity className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Tooth Enumeration & Odontogram</h2>
          <p className="text-xs text-slate-500">Interactive dental arch chart — click a tooth to inspect</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* ── Summary banner ─────────────────────────────────────────── */}
        <SummaryBanner teeth={teeth} missingTeeth={missingTeeth} />

        {/* ── Odontogram ──────────────────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 overflow-x-auto">
          {/* Quadrant labels */}
          <div className="flex justify-center gap-0 mb-1">
            <div className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upper Right (Q1)</div>
            <div className="w-px bg-slate-200 mx-3" />
            <div className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upper Left (Q2)</div>
          </div>

          {/* Upper arch */}
          <div className="flex items-end justify-center gap-1">
            {/* Q1 (18→11) */}
            {UPPER_LEFT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} teeth={teeth} missingTeeth={missingTeeth}
                selected={selectedToothFdi === fdi}
                onClick={() => onSelectTooth(selectedToothFdi === fdi ? null : fdi)}
                arch="upper"
              />
            ))}
            {/* Midline */}
            <div className="w-px h-10 bg-slate-300 mx-1 self-center" />
            {/* Q2 (21→28) */}
            {UPPER_RIGHT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} teeth={teeth} missingTeeth={missingTeeth}
                selected={selectedToothFdi === fdi}
                onClick={() => onSelectTooth(selectedToothFdi === fdi ? null : fdi)}
                arch="upper"
              />
            ))}
          </div>

          {/* Arch gap */}
          <div className="flex justify-center my-2">
            <div className="h-4 w-full max-w-xs border-b-2 border-dashed border-slate-200 rounded-b-full" />
          </div>

          {/* Lower arch */}
          <div className="flex items-start justify-center gap-1">
            {/* Q4 (48→41) */}
            {LOWER_LEFT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} teeth={teeth} missingTeeth={missingTeeth}
                selected={selectedToothFdi === fdi}
                onClick={() => onSelectTooth(selectedToothFdi === fdi ? null : fdi)}
                arch="lower"
              />
            ))}
            {/* Midline */}
            <div className="w-px h-10 bg-slate-300 mx-1 self-center" />
            {/* Q3 (31→38) */}
            {LOWER_RIGHT.map(fdi => (
              <ToothCell key={fdi} fdi={fdi} teeth={teeth} missingTeeth={missingTeeth}
                selected={selectedToothFdi === fdi}
                onClick={() => onSelectTooth(selectedToothFdi === fdi ? null : fdi)}
                arch="lower"
              />
            ))}
          </div>

          <div className="flex justify-center gap-0 mt-1">
            <div className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lower Right (Q4)</div>
            <div className="w-px bg-slate-200 mx-3" />
            <div className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lower Left (Q3)</div>
          </div>

          {/* Odontogram legend */}
          <div className="flex flex-wrap justify-center gap-3 pt-3 mt-2 border-t border-slate-200">
            {(Object.entries(STATUS_CONFIG) as [ToothStatus, ToothStatusConfig][])
              .filter(([k]) => k !== 'undetected')
              .map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-3 h-3 rounded-sm inline-block border"
                    style={{
                      background: cfg.bg === 'transparent' ? 'transparent' : cfg.bg,
                      borderColor: cfg.border,
                      borderStyle: key === 'missing' ? 'dashed' : 'solid',
                    }}
                  />
                  {cfg.label}
                </span>
              ))
            }
          </div>
        </div>

        {/* ── Filter tabs + Problems toggle ────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {([
              ['all', `All (${teeth.length})`],
              ['q1',  `Q1 Upper Right (${q1.length})`],
              ['q2',  `Q2 Upper Left (${q2.length})`],
              ['q3',  `Q3 Lower Left (${q3.length})`],
              ['q4',  `Q4 Lower Right (${q4.length})`],
            ] as [string, string][]).map(([key, label]) => (
              <button key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeTab === key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Problems only toggle */}
          {problemCount > 0 && (
            <button
              onClick={() => setProblemOnly(!problemOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                problemOnly
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
              }`}
            >
              {problemOnly ? '✓ Problems only' : 'Show problems only'}
            </button>
          )}
        </div>

        {/* ── Card grid ───────────────────────────────────────────────── */}
        {displayTeeth.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-slate-600">No teeth match this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayTeeth.map((tooth, idx) => {
              const isSelected = selectedToothFdi === tooth.fdi_number;
              const status = getStatus(tooth.fdi_number, teeth, missingTeeth);
              const cfg = STATUS_CONFIG[status];
              const cleanName = tooth.anatomical_name;

              return (
                <div key={`${tooth.fdi_number}-${idx}`}
                  onClick={() => onSelectTooth(isSelected ? null : tooth.fdi_number)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 space-y-3 ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-400 ring-2 ring-teal-300/40 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Top row: FDI badge + status chip */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-mono font-black text-base px-2.5 py-1 rounded-lg border ${
                      isSelected ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 text-slate-900 border-slate-200'
                    }`}>
                      {tooth.fdi_number}
                    </span>
                    {getSeverityBadge(tooth)}
                  </div>

                  {/* Tooth name (never truncated) */}
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-snug break-words">{cleanName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tooth.tooth_type} · Q{tooth.quadrant}</p>
                  </div>

                  {/* Confidence bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Enumeration confidence</span>
                      <span className="font-mono font-bold text-slate-700">{(tooth.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${tooth.confidence * 100}%`, background: cfg.bg === 'transparent' ? '#94A3B8' : cfg.bg }}
                      />
                    </div>
                  </div>

                  {/* Disease tags */}
                  {tooth.associated_diseases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tooth.associated_diseases.map((d, di) => (
                        <span key={`${d}-${di}`} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.chip}`}>
                          {d.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Missing teeth chips ─────────────────────────────────────── */}
        {missingTeeth.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Missing / unidentified FDI positions ({missingTeeth.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingTeeth.map(fdi => (
                <span key={fdi} className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50 border border-dashed border-slate-300 px-2 py-0.5 rounded-md">
                  {fdi}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
