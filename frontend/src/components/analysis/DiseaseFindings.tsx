import React from 'react';
import { DiseaseDetection } from '../../types/api';
import { AlertTriangle, Flame, ShieldAlert, Crosshair } from 'lucide-react';

interface DiseaseFindingsProps {
  diseases: DiseaseDetection[];
  summaryCounts: Record<string, number>;
  selectedDiseaseId?: string | null;
  onSelectDisease: (id: string | null) => void;
  onSelectTooth: (fdi: string | null) => void;
}

export const DiseaseFindings: React.FC<DiseaseFindingsProps> = ({
  diseases,
  summaryCounts,
  selectedDiseaseId,
  onSelectDisease,
  onSelectTooth,
}) => {
  const getDiseaseColor = (name: string) => {
    switch (name) {
      case 'Deep_Caries':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
          bar: 'bg-red-500',
        };
      case 'Caries':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
          bar: 'bg-amber-500',
        };
      case 'Periapical_Lesion':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800',
          bar: 'bg-purple-500',
        };
      case 'Impacted':
        return {
          bg: 'bg-cyan-50',
          border: 'border-cyan-200',
          text: 'text-cyan-700',
          badge: 'bg-cyan-100 text-cyan-800',
          bar: 'bg-cyan-500',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-800',
          bar: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header & Counts Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Pathology & Disease Lesions</h3>
          <p className="text-xs text-slate-500">{diseases.length} total pathological lesions localized</p>
        </div>

        {/* Aggregate Pill Counts */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {Object.entries(summaryCounts).map(([diseaseName, count]) => {
            const colors = getDiseaseColor(diseaseName);
            return (
              <span
                key={diseaseName}
                className={`px-2 py-0.5 rounded-full font-medium border ${colors.bg} ${colors.border} ${colors.text}`}
              >
                {diseaseName}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Disease List */}
      {diseases.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-700">No pathological lesions detected</p>
          <p className="text-xs text-slate-500 mt-1">
            No caries, periapical lesions, or impactions met the confidence threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {diseases.map((d, idx) => {
            const isSelected = selectedDiseaseId === d.id;
            const colors = getDiseaseColor(d.disease_name);
            return (
              <div
                key={`${d.id}-${idx}`}
                onClick={() => {
                  onSelectDisease(isSelected ? null : d.id);
                  if (d.associated_tooth) {
                    onSelectTooth(d.associated_tooth);
                  }
                }}
                className={`p-3 rounded-xl border cursor-pointer transition text-left space-y-2 ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ring-2 ring-red-400 shadow-sm`
                    : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>
                      {d.disease_name}
                    </span>
                    {d.associated_tooth ? (
                      <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Mapped to Tooth T{d.associated_tooth}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Unassociated lesion</span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {(d.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(d.confidence * 100, 100)}%` }}
                  />
                </div>

                {/* Spatial bounding box details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="flex items-center space-x-1">
                    <Crosshair className="w-3 h-3 text-slate-400" />
                    <span>
                      Box: ({Math.round(d.box.x1)}, {Math.round(d.box.y1)}) to ({Math.round(d.box.x2)}, {Math.round(d.box.y2)})
                    </span>
                  </span>
                  {d.overlap_ratio !== undefined && d.overlap_ratio !== null && (
                    <span className="text-teal-700 font-medium">
                      Overlap: {(d.overlap_ratio * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
