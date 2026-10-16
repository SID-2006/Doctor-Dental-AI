import React, { useState, useEffect } from 'react';
import { Activity, Cpu, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Analyzing dental radiograph...' }) => {
  const [step, setStep] = useState(0);

  const steps = [
    'Validating image geometry and radiograph integrity...',
    'Running YOLO11m Tooth Enumeration Model (FDI 11–48)...',
    'Running YOLO11m Dental Disease Detection Model...',
    'Computing tooth-lesion spatial overlap and bounding boxes...',
    'Synthesizing decision support guidance and compiling PDF...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
      {/* Visual Scanner Animation */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-2xl bg-teal-50 border-2 border-teal-200 animate-pulse flex items-center justify-center">
          <Activity className="w-10 h-10 text-teal-600 animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-teal-400 border-dashed animate-spin [animation-duration:8s] opacity-70" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">{message}</h3>
      <p className="text-xs text-slate-500 mb-8">Executing local dual-model inference pipeline</p>

      {/* Pipeline Step Checklist */}
      <div className="w-full space-y-3">
        {steps.map((s, idx) => {
          const isDone = idx < step;
          const isCurrent = idx === step;
          return (
            <div
              key={s}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg border transition text-xs ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : isCurrent
                  ? 'bg-teal-50 border-teal-300 text-teal-950 font-medium shadow-sm'
                  : 'bg-slate-50/50 border-slate-200/60 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className="flex-1">{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
