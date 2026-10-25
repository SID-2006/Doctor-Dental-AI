import React from 'react';
import {
  AnalysisResponse,
  DiseaseAnalysisResult,
  CombinedFinding,
  AlignmentScreeningResult,
} from '../../types/api';
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Ruler,
  ArrowRight,
  Info,
  Stethoscope,
} from 'lucide-react';

interface ClinicalSummaryProps {
  analysis: AnalysisResponse;
}

const DISEASE_LABEL_MAP: Record<string, string> = {
  Deep_Caries: 'Deep Caries',
  Caries: 'Caries',
  Periapical_Lesion: 'Periapical Lesion',
  Impacted: 'Impacted Tooth',
};

const DISEASE_COLORS: Record<string, string> = {
  Deep_Caries: 'bg-red-100 text-red-800 border-red-200',
  Caries: 'bg-amber-100 text-amber-800 border-amber-200',
  Periapical_Lesion: 'bg-purple-100 text-purple-800 border-purple-200',
  Impacted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

function buildNextSteps(
  combinedFindings: CombinedFinding[],
  alignment: AlignmentScreeningResult | null | undefined
): Array<{ text: string; why: string }> {
  const steps: Array<{ text: string; why: string }> = [];
  const diseases = new Set(combinedFindings.flatMap((f) => f.findings));

  if (diseases.has('Deep_Caries')) {
    steps.push({
      text: 'Clinical pulp vitality assessment',
      why: 'Deep carious lesions detected that may be close to the pulp.',
    });
  }
  if (diseases.has('Caries')) {
    steps.push({
      text: 'Caries activity and depth evaluation',
      why: 'Carious lesions identified requiring clinical staging.',
    });
  }
  if (diseases.has('Periapical_Lesion')) {
    steps.push({
      text: 'Periapical assessment & targeted radiographs',
      why: 'Periapical radiolucency detected near root apex.',
    });
  }
  if (diseases.has('Impacted')) {
    steps.push({
      text: 'Impaction assessment & eruption status review',
      why: 'One or more teeth show position consistent with impaction.',
    });
  }

  const hasOrthoFindings =
    alignment?.sufficient_data &&
    (alignment.flagged_count > 0 ||
      (alignment.crowding?.has_crowding && alignment.crowding.overall_severity !== 'None') ||
      (alignment.rotations && alignment.rotations.length > 0) ||
      alignment.spacing?.midline_diastema?.present);

  if (hasOrthoFindings && alignment) {
    const reasons: string[] = [];
    if (alignment.flagged_count > 0) reasons.push(`${alignment.flagged_count} arch curve region(s)`);
    if (alignment.crowding?.has_crowding && alignment.crowding.overall_severity !== 'None') reasons.push(`${alignment.crowding.overall_severity.toLowerCase()} crowding`);
    if (alignment.spacing?.midline_diastema?.present) reasons.push('midline diastema');
    if (alignment.rotations && alignment.rotations.length > 0) reasons.push(`${alignment.rotations.length} suspected rotated tooth/teeth`);

    steps.push({
      text: 'Orthodontic / alignment consultation',
      why: `Preliminary screening identified ${reasons.join(', ')}.`,
    });
  }
  if (steps.length === 0) {
    steps.push({
      text: 'Routine clinical examination',
      why: 'No specific pathologies detected; routine review recommended.',
    });
  }
  return steps;
}

export const ClinicalSummary: React.FC<ClinicalSummaryProps> = ({ analysis }) => {
  const { disease_analysis, combined_findings, alignment_screening } = analysis;
  const nextSteps = buildNextSteps(combined_findings, alignment_screening);

  const totalFindings = combined_findings.length;
  const hasFindings = totalFindings > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ── Column 1: Detected Conditions ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-red-500" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Detected Conditions</h2>
        </div>

        {hasFindings ? (
          <div className="space-y-2">
            {/* Disease pills */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(disease_analysis.summary_counts).map(([name, count]) => (
                <span
                  key={name}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    DISEASE_COLORS[name] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {DISEASE_LABEL_MAP[name] || name} ×{count}
                </span>
              ))}
            </div>

            {/* Affected teeth */}
            <div className="text-xs text-slate-600 space-y-1 pt-1">
              <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                Affected teeth (FDI):
              </p>
              <div className="flex flex-wrap gap-1">
                {combined_findings.map((f) => (
                  <span
                    key={f.tooth_number}
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                      f.highest_severity === 'High'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                    title={f.findings.join(', ')}
                  >
                    T{f.tooth_number}
                  </span>
                ))}
              </div>
            </div>

            {/* Confidence note */}
            {combined_findings.length > 0 && (
              <p className="text-[10px] text-slate-400 pt-1">
                Highest confidence:{' '}
                {(Math.max(...combined_findings.map((f) => f.confidence)) * 100).toFixed(0)}%
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>No disease lesions were detected at current confidence thresholds.</span>
          </div>
        )}
      </div>

      {/* ── Column 2: Alignment Screening ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Ruler className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Alignment Screening</h2>
        </div>

        {!alignment_screening ? (
          <p className="text-xs text-slate-500 italic">
            Alignment screening data is not available for this analysis.
          </p>
        ) : !alignment_screening.sufficient_data ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{alignment_screening.insufficient_data_reason}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic">{alignment_screening.limitation_note}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-medium text-[11px]">
                {alignment_screening.teeth_analyzed} teeth
              </span>
              {alignment_screening.flagged_count > 0 ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                  {alignment_screening.flagged_count} curve dev
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Arch normal
                </span>
              )}

              {alignment_screening.crowding?.has_crowding && alignment_screening.crowding.overall_severity !== 'None' && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium text-[11px]">
                  {alignment_screening.crowding.overall_severity} Crowding
                </span>
              )}
              {alignment_screening.spacing?.midline_diastema?.present && (
                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-medium text-[11px]">
                  Diastema
                </span>
              )}
              {(alignment_screening.rotations?.length ?? 0) > 0 && (
                <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-medium text-[11px]">
                  {alignment_screening.rotations?.length} Rotations
                </span>
              )}
            </div>

            {/* Flagged finding summaries */}
            {alignment_screening.findings.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-slate-600">{f.region}</span>
              </div>
            ))}
            {alignment_screening.flagged_count > 3 && (
              <p className="text-[11px] text-slate-400 italic pl-5">
                + {alignment_screening.flagged_count - 3} more — see Alignment panel below
              </p>
            )}

            <p className="text-[10px] text-slate-400 pt-1 italic leading-tight">
              Preliminary geometric screening only. Not a validated orthodontic assessment.
            </p>
          </div>
        )}
      </div>

      {/* ── Column 3: Suggested Next Steps ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Suggested Next Steps</h2>
        </div>

        <div className="space-y-2.5">
          {nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800">{step.text}</p>
                <p className="text-[11px] text-slate-500">{step.why}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 italic leading-tight">
            Final clinical decisions require examination by a qualified dental professional.
            These suggestions are based on AI detections only.
          </p>
        </div>
      </div>
    </div>
  );
};
