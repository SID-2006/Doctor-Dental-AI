import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand & Project Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Doctor <span className="text-teal-600">Dental</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Smart Dental Diagnosis and Restoration Planning Using Tooth Alignment Analysis.
              A local-first medical AI decision support prototype developed for clinical hackathon demonstration.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
                <span>YOLO11m Inference Engine</span>
              </span>
              <span>•</span>
              <span>FDI Standard Notation</span>
              <span>•</span>
              <span>100% Local Processing</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Application Pages
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/" className="hover:text-teal-600 transition">Landing Overview</Link></li>
              <li><Link to="/analyze" className="hover:text-teal-600 transition">Analyze Radiograph</Link></li>
              <li><Link to="/how-it-works" className="hover:text-teal-600 transition">Inference Pipeline</Link></li>
              <li><Link to="/about" className="hover:text-teal-600 transition">About & Methodology</Link></li>
            </ul>
          </div>

          {/* Model Capabilities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Trained Models
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span><b>Tooth Enumeration:</b> 32 FDI classes (11–48)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span><b>Disease Model:</b> Caries, Deep Caries, Periapical Lesions, Impacted</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span><b>Report Generation:</b> ReportLab PDF output</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>Important Clinical Prototype Notice:</b> Doctor Dental is an informational decision-support software intended
              solely for educational, research, and hackathon evaluation. Model outputs do not establish clinical certainty,
              medical prescription, or definitive diagnosis. All findings must be independently validated by a licensed dentist
              through clinical examination and diagnostic radiography.
            </p>
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Doctor Dental Research Team. Built for local-first healthcare innovation.
          </div>
        </div>
      </div>
    </footer>
  );
};
