import React from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Disclaimer } from '../components/common/Disclaimer';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Radiographic Scan Ingestion & Validation',
      status: 'Implemented',
      desc: 'The user uploads a dental radiograph (Panoramic OPG or Bitewing). The backend validates file format (JPG, JPEG, PNG), enforces the 10 MB limit, inspects image header integrity, and standardizes image matrices for neural inference.',
      details: ['Validates image dimensions (128px to 4096px)', 'Ensures strict path-traversal prevention', 'Assigns unique scan ID'],
    },
    {
      num: '02',
      title: 'Tooth Enumeration & Localization (YOLO11m)',
      status: 'Implemented',
      desc: 'Our trained checkpoint (enumeration.pt) executes YOLO11m object detection over the entire radiograph. It localizes each tooth boundary and classifies it into one of 32 FDI standard categories (11–18, 21–28, 31–38, 41–48).',
      details: ['FDI World Dental Federation 2-digit notation', '32 distinct anatomical tooth classes', 'Returns bounding box coordinates [x1, y1, x2, y2]'],
    },
    {
      num: '03',
      title: 'Dental Disease & Pathology Detection (YOLO11m)',
      status: 'Implemented',
      desc: 'Our trained checkpoint (disesase.pt / disease.pt) runs concurrently. It scans the radiograph for 4 primary dental pathologies: Superficial Caries, Deep Caries approaching the pulp chamber, Periapical Lesions at root apices, and Impacted tooth positions.',
      details: ['4 pathological classes detected with confidence scores', 'Localized bounding boxes rendered with high-contrast colors', 'Sub-300ms execution on local CPU'],
    },
    {
      num: '04',
      title: 'Spatial Overlap & Anatomical Association Engine',
      status: 'Implemented',
      desc: 'DentalAI matches detected disease lesions with the closest corresponding tooth boundary using a configurable intersection-over-lesion-area algorithm. Periapical lesions incorporate a 15% root apex tolerance window.',
      details: ['Intersection over lesion area (threshold: 20%)', 'Maps caries directly to specific FDI tooth numbers', 'Preserves unmapped lesions as independent image-level findings'],
    },
    {
      num: '05',
      title: 'Chairside Restoration Decision Support Prompts',
      status: 'Implemented (Rule-Based)',
      desc: 'Rather than fabricating black-box surgical plans, DentalAI translates verified model findings into transparent, rule-based clinical evaluation questions for the treating dentist.',
      details: ['Non-prescriptive educational decision support', 'Prompts for pulp vitality, proximal tactile probing, and marginal seal', 'Explicit disclaimer separating software suggestions from doctor diagnosis'],
    },
    {
      num: '06',
      title: 'Automated Diagnostic PDF Report Generation',
      status: 'Implemented',
      desc: 'A clinical diagnostic report is compiled in real time using ReportLab, including the original and annotated radiographs, tooth-wise tables, detected pathologies, and a dedicated doctor signature and notes block.',
      details: ['Vector typography and clinical color coding', 'Multi-layer visualization embedded', 'Downloadable for patient records'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Technical Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How DentalAI Works
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          A step-by-step breakdown of our local-first multi-model inference pipeline, spatial association engine, and clinical decision support.
        </p>
      </div>

      {/* Step by step timeline */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-teal-400 transition flex flex-col md:flex-row md:items-start gap-6"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-mono font-bold text-lg shrink-0 shadow-xs">
              {step.num}
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {step.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                {step.details.map((d, dIdx) => (
                  <span
                    key={dIdx}
                    className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md"
                  >
                    <CheckCircle2 className="w-3 h-3 text-teal-600 mr-1" />
                    <span>{d}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Implemented vs Planned Capabilities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Transparency: Implemented Features vs. Planned Research Extensions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-950 uppercase tracking-wider">
              Currently Implemented & Verified
            </span>
            <ul className="space-y-1.5 text-emerald-900 list-disc list-inside">
              <li>Full 32 FDI tooth localization with YOLO11m</li>
              <li>4-class dental pathology detection (Caries, Deep Caries, Periapical Lesion, Impacted)</li>
              <li>Spatial bounding box intersection & tooth mapping</li>
              <li>Interactive multi-layer dental image viewer with SVG</li>
              <li>ReportLab automated clinical PDF generation</li>
              <li>100% local inference on consumer hardware</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider">
              Future Planned Extensions (Not In Scope)
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>3D CBCT volumetric segmentation and airway measurement</li>
              <li>Automated orthodontic bracket placement simulation</li>
              <li>Grad-CAM saliency heatmaps for CNN feature attribution</li>
              <li>Electronic Health Record (EHR / DICOM) cloud sync</li>
            </ul>
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
};
