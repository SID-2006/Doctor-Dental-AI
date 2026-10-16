import React from 'react';
import {
  CombinedFinding,
  ToothDetection,
  RestorationPlanningGuidance,
} from '../../types/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  X,
  Stethoscope,
  ArrowRight,
  Wrench,
} from 'lucide-react';

interface AnalysisSummaryProps {
  teeth: ToothDetection[];
  combinedFindings: CombinedFinding[];
  guidance: RestorationPlanningGuidance[];
  selectedToothFdi?: string | null;
  onClearSelection: () => void;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  teeth,
  combinedFindings,
  guidance,
  selectedToothFdi,
  onClearSelection,
}) => {
  const selectedTooth = selectedToothFdi
    ? teeth.find((t) => t.fdi_number === selectedToothFdi)
    : null;

  const selectedGuidance = selectedToothFdi
    ? guidance.filter((g) => g.tooth_number === selectedToothFdi)
    : [];

  // ── Tooth Drilldown View ──────────────────────────────────────────────────
  if (selectedTooth) {
    const hasPathology = selectedTooth.associated_diseases.length > 0;

    return (
      <div className="bg-white rounded-2xl border border-teal-500 shadow-md p-5 space-y-4 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-mono font-bold text-lg text-teal-800">
              T{selectedTooth.fdi_number}
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-teal-600 tracking-wider">
                Quadrant {selectedTooth.quadrant} • {selectedTooth.tooth_type}
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedTooth.anatomical_name}</h3>
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pathology Status */}
        <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Radiographic Findings:</span>
            {hasPathology ? (
              <span className="font-bold text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedTooth.associated_diseases.join(', ')}
              </span>
            ) : (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No Pathology Detected
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Enumeration Confidence: {(selectedTooth.confidence * 100).toFixed(1)}% • Spatial Bounds: [
            {Math.round(selectedTooth.box.x1)}, {Math.round(selectedTooth.box.y1)},{' '}
            {Math.round(selectedTooth.box.x2)}, {Math.round(selectedTooth.box.y2)}]
          </div>
        </div>

        {/* Clinical Guidance — concise, no chairside questions */}
        {selectedGuidance.length > 0 ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Clinical Guidance</span>
            </div>
            {selectedGuidance.map((g, idx) => {
              const interpretation = g.clinical_interpretation || g.informational_note || '';
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs space-y-2.5">
                  <div className="font-semibold text-teal-900">{g.condition}</div>

                  {interpretation && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        What this finding may indicate
                      </p>
                      <p className="text-slate-700 leading-relaxed">{interpretation}</p>
                    </div>
                  )}

                  {g.recommended_next_step && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> Recommended next step
                      </p>
                      <p className="text-slate-700 leading-relaxed">{g.recommended_next_step}</p>
                    </div>
                  )}

                  {g.treatment_considerations && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Treatment considerations
                      </p>
                      <p className="text-slate-600 leading-relaxed">{g.treatment_considerations}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This tooth structure appears intact with no immediate restorative follow-up indicated.</span>
          </div>
        )}
      </div>
    );
  }

  // ── Overall Summary View ──────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Multi-Model Diagnostic Synthesis</h3>
          <p className="text-xs text-slate-500">Cross-referenced tooth enumeration & pathology analysis</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xl font-extrabold text-slate-900">{teeth.length}</div>
          <div className="text-[11px] font-medium text-slate-500">Teeth Enumerated</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xl font-extrabold text-red-600">{combinedFindings.length}</div>
          <div className="text-[11px] font-medium text-slate-500">Teeth with Pathologies</div>
        </div>
      </div>

      {/* Findings list */}
      {combinedFindings.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-800">Identified Tooth Pathologies:</div>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {combinedFindings.map((f) => (
              <div
                key={f.tooth_number}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">T{f.tooth_number}</span>
                  <span className="text-slate-600 truncate max-w-[130px]">{f.findings.join(', ')}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    f.highest_severity === 'High'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {f.highest_severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No teeth were flagged with restorative or endodontic concerns.</span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 text-center">
        Tip: Click any tooth to view its clinical guidance.
      </div>
    </div>
  );
};
