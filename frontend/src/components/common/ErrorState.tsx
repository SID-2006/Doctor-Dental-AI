import React from 'react';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  backTo?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Inference Pipeline Error',
  message = 'An unexpected error occurred during image processing or model inference.',
  onRetry,
  backTo = '/analyze',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-red-200 shadow-sm max-w-lg mx-auto my-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Select Another Scan</span>
          </Link>
        )}
      </div>
    </div>
  );
};
