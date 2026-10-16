/**
 * FollowUpGuidance.tsx — Accordion-style Clinical Restoration Planning
 *
 * Design:
 *  - Collapsed row: FDI badge (mono) | condition badge | anatomical name | chevron
 *  - Left border accent colored by severity
 *  - Smooth height animation (CSS max-height transition)
 *  - Filter chips: All | Caries | Deep Caries | Impacted | Periapical
 *  - Expand all / Collapse all toggle
 *  - Auto-opens and scrolls to row matching selectedToothFdi
 *  - Clicking a row calls onSelectTooth to cross-highlight on the radiograph
 *  - All existing content preserved inside expanded sections
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope, ArrowRight, Wrench, ShieldAlert,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { RestorationPlanningGuidance } from '../../types/api';

/* ─────────────────────────────────────────────────────────────────────── */
interface FollowUpGuidanceProps {
  guidance: RestorationPlanningGuidance[];
  selectedToothFdi?: string | null;
  onSelectTooth?: (fdi: string | null) => void;
}

type FilterKey = 'all' | 'caries' | 'deep-caries' | 'impacted' | 'periapical';

interface ConditionStyle {
  border: string;
  badge: string;
  filter: FilterKey;
}

const CONDITION_MAP: Record<string, ConditionStyle> = {
  'Deep Carious Lesion': {
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-800 border-red-200',
    filter: 'deep-caries',
  },
  'Carious Lesion': {
    border: 'border-l-amber-400',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    filter: 'caries',
  },
  'Periapical Radiolucency': {
    border: 'border-l-violet-500',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    filter: 'periapical',
  },
  'Impacted / Unerupted Tooth': {
    border: 'border-l-cyan-400',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    filter: 'impacted',
  },
};

const FALLBACK_STYLE: ConditionStyle = {
  border: 'border-l-slate-300',
  badge: 'bg-slate-50 text-slate-700 border-slate-200',
  filter: 'all',
};

function getStyle(condition: string): ConditionStyle {
  for (const [key, val] of Object.entries(CONDITION_MAP)) {
    if (condition.startsWith(key)) return val;
  }
  return FALLBACK_STYLE;
}

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'caries',      label: 'Caries' },
  { key: 'deep-caries', label: 'Deep Caries' },
  { key: 'impacted',    label: 'Impacted' },
  { key: 'periapical',  label: 'Periapical' },
];

/* ─────────────────────────────────────────────────────────────────────── */
export const FollowUpGuidance: React.FC<FollowUpGuidanceProps> = ({
  guidance,
  selectedToothFdi,
  onSelectTooth,
}) => {
  if (guidance.length === 0) return null;

  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const isOpen = (idx: number) => expandAll || openItems.has(idx);

  const toggleItem = (idx: number) => {
    if (expandAll) {
      setExpandAll(false);
      setOpenItems(new Set([idx]));
    } else {
      const next = new Set(openItems);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      setOpenItems(next);
    }
    onSelectTooth?.(guidance[idx].tooth_number);
  };

  /* Auto-open + scroll to selected tooth */
  useEffect(() => {
    if (!selectedToothFdi) return;
    const idx = guidance.findIndex(g => g.tooth_number === selectedToothFdi);
    if (idx === -1) return;
    setOpenItems(prev => new Set([...prev, idx]));
    setTimeout(() => {
      rowRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }, [selectedToothFdi, guidance]);

  /* Filter counts */
  const counts = FILTER_LABELS.reduce<Record<FilterKey, number>>((acc, f) => {
    acc[f.key] = f.key === 'all' ? guidance.length : guidance.filter(g => getStyle(g.condition).filter === f.key).length;
    return acc;
  }, {} as Record<FilterKey, number>);

  const filtered = filterKey === 'all'
    ? guidance
    : guidance.filter(g => getStyle(g.condition).filter === filterKey);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Restoration Planning — Clinical Guidance</h2>
            <p className="text-xs text-slate-500">
              {guidance.length} finding{guidance.length !== 1 ? 's' : ''} · For dental professional review
            </p>
          </div>
        </div>
        <button
          onClick={() => { setExpandAll(!expandAll); if (!expandAll) setOpenItems(new Set()); }}
          className="text-xs text-teal-600 hover:text-teal-900 font-bold transition-colors mt-1"
        >
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* ── Filter chips ────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2">
        {FILTER_LABELS.filter(f => counts[f.key] > 0).map(f => (
          <button key={f.key}
            onClick={() => setFilterKey(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
              filterKey === f.key
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className={`ml-1.5 tabular-nums ${filterKey === f.key ? 'opacity-70' : 'opacity-50'}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Accordion rows ──────────────────────────────────────────────── */}
      <div className="divide-y divide-slate-100">
        {filtered.map((item) => {
          const globalIdx = guidance.indexOf(item);
          const style = getStyle(item.condition);
          const open  = isOpen(globalIdx);
          const active = selectedToothFdi === item.tooth_number;
          const interpretation = item.clinical_interpretation || item.informational_note || '';

          return (
            <div
              key={globalIdx}
              ref={el => { if (el) rowRefs.current.set(globalIdx, el); else rowRefs.current.delete(globalIdx); }}
              className={`border-l-4 transition-colors duration-150 ${style.border} ${
                active ? 'bg-teal-50/20' : ''
              }`}
            >
              {/* ── Collapsed row (always visible) ────────────────────── */}
              <button
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => toggleItem(globalIdx)}
                aria-expanded={open}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* FDI badge */}
                  <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                    FDI {item.tooth_number}
                  </span>
                  {/* Condition badge */}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${style.badge}`}>
                    {item.condition}
                  </span>
                  {/* Anatomical name */}
                  <span className="text-xs text-slate-500 truncate hidden sm:block">
                    {item.anatomical_name}
                  </span>
                </div>
                {open
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                }
              </button>

              {/* ── Expanded content (height animation) ───────────────── */}
              <div
                style={{
                  maxHeight: open ? '700px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-5">
                  {/* A — What this may indicate */}
                  {interpretation && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          What this finding may indicate
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{interpretation}</p>
                      </div>
                    </div>
                  )}

                  {/* B — Recommended next step */}
                  {item.recommended_next_step && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Recommended next step
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{item.recommended_next_step}</p>
                      </div>
                    </div>
                  )}

                  {/* C — Treatment considerations */}
                  {item.treatment_considerations && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Treatment considerations
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">{item.treatment_considerations}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer disclaimer ───────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 italic leading-relaxed">
          This guidance is informational only and does not constitute a clinical diagnosis or treatment prescription.
          All decisions require examination by a licensed dental professional.
        </p>
      </div>
    </div>
  );
};
