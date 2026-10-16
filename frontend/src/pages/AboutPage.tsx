import React from 'react';
import { Shield, Lock, Cpu, Stethoscope, Heart, Info, CheckCircle2 } from 'lucide-react';
import { Disclaimer } from '../components/common/Disclaimer';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-bold text-teal-700 tracking-wider">
          Healthcare Hackathon Research Prototype
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Smart Dental Diagnosis and Restoration Planning Using Tooth Alignment Analysis
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          DentalAI was built to explore how computer vision models can provide reliable, transparent radiographic decision support directly in chairside dental clinics.
        </p>
      </div>

      {/* Motivation & Vision */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Project Motivation</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Panoramic dental radiographs (orthopantomograms, OPG) capture the entire dentition, maxillary sinus, and mandibular nerve canals in a single 2D image. In high-volume clinics, detecting subtle interproximal caries, early periapical rarefactions, or tracking missing teeth across all four quadrants can be mentally taxing.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          DentalAI bridges this gap by deploying specialized YOLO11m models to localize every visible tooth using the international FDI numbering system and detect four frequent dental conditions (Caries, Deep Caries, Periapical Lesions, and Impactions) simultaneously.
        </p>
      </div>

      {/* Model Capabilities & Supported Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Supported Input Formats</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Formats:</b> Standard JPG, JPEG, and PNG images</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Modality:</b> Panoramic Radiographs (OPG) & Bitewings</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Resolution:</b> 128px to 4096px (auto-normalized to 640px for inference)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Size limit:</b> Configurable up to 10 MB per scan</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Privacy & Local-First Security</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Zero Cloud Transmission:</b> Runs entirely on your local machine</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>De-Identified:</b> Does not collect patient names or records</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>Path-Traversal Safe:</b> Random UUID filenames prevent exploits</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span><b>No Paid APIs:</b> Zero dependency on OpenAI, Google Cloud, or AWS</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Clinical Limitations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Intended Use & Clinical Limitations</h2>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            DentalAI is strictly designed as an assistive research prototype and educational decision support system. It is <b>not</b> certified by the FDA, CE, or CDSCO as a medical diagnostic device.
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 pl-2">
            <li>
              <b>Probabilistic Nature:</b> AI detections reflect learned patterns from training data and may produce false positives (e.g., cervical burnout mistaken for cervical caries) or false negatives (e.g., incipient enamel demineralization).
            </li>
            <li>
              <b>Chairside Verification:</b> Tactile probing with dental explorers, cold/hot pulp vitality tests, and periodontal pocket depth charting cannot be performed by radiograph analysis alone.
            </li>
            <li>
              <b>Restoration Decisions:</b> Software prompts are informational prompts for clinical consideration, not prescriptions for fillings, root canals, or crowns.
            </li>
          </ul>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
};
