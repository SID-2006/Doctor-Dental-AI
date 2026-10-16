import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  Search,
  Eye,
  Sparkles,
  Activity,
  Clock,
  Video,
  Zap,
  HeartPulse,
  ScanLine,
} from 'lucide-react';
import { Disclaimer } from '../components/common/Disclaimer';

/* ─── Collage image card — rounded-rectangle pill ────────────────────────── */
interface CollageCardProps {
  src: string;
  alt: string;
  size: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { w: 'w-[130px] sm:w-[150px]', h: 'h-[170px] sm:h-[200px]', mb: 'mb-10', radius: '40%' },
  md: { w: 'w-[140px] sm:w-[170px]', h: 'h-[200px] sm:h-[245px]', mb: 'mb-4', radius: '38%' },
  lg: { w: 'w-[160px] sm:w-[200px]', h: 'h-[240px] sm:h-[290px]', mb: 'mb-0', radius: '36%' },
};

const CollageCard: React.FC<CollageCardProps> = ({ src, alt, size }) => {
  const s = sizeMap[size];
  return (
    <div
      className={`${s.w} ${s.h} ${s.mb} shrink-0 overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-105 hover:-translate-y-2 ring-[3px] ring-white/50`}
      style={{ borderRadius: s.radius }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};

/* ─── Marquee strip ───────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'AI DIAGNOSIS', 'TOOTH ENUMERATION', 'DISEASE DETECTION',
  'ALIGNMENT SCREENING', 'CARIES ANALYSIS', 'CLINICAL REPORTS',
  'PERIAPICAL LESIONS', 'RESTORATION PLANNING',
];

/* ─── Stats counter pill ─────────────────────────────────────────────────── */
interface StatPillProps {
  value: string;
  label: string;
}
const StatPill: React.FC<StatPillProps> = ({ value, label }) => (
  <div className="flex flex-col items-center px-6 py-2">
    <span className="text-3xl sm:text-4xl font-black text-white drop-shadow">{value}</span>
    <span className="text-indigo-200 text-xs font-medium mt-0.5">{label}</span>
  </div>
);

export const HomePage: React.FC = () => {
  return (
    <div className="overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #c7d2fe 0%, #a5b4fc 14%, #818cf8 34%, #6366f1 60%, #4f46e5 85%, #4338ca 100%)',
          minHeight: '100vh',
        }}
      >
        {/* ── Decorative elements ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          {/* Glowing orbs */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/[0.08] blur-[100px]" />
          <div className="absolute top-20 right-[-80px] w-[420px] h-[420px] rounded-full bg-indigo-300/20 blur-[80px]" />
          <div className="absolute bottom-10 left-1/3 w-[500px] h-[260px] rounded-full bg-violet-950/25 blur-[100px]" />

          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Wave bottom */}
          <svg
            className="absolute bottom-0 left-0 w-full h-[90px]"
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
          >
            <path d="M0,50 C320,90 600,10 900,50 C1200,90 1350,30 1440,55 L1440,90 L0,90 Z" fill="#F8FAFC" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-44 flex flex-col items-center text-center">

          {/* Floating corner badges */}
          <div className="absolute top-8 right-4 sm:right-12 bg-white/90 backdrop-blur-md text-indigo-700 text-[11px] sm:text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-white/60 rotate-[5deg] hidden sm:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Advanced AI Treatments
          </div>
          <div className="absolute top-44 left-2 sm:left-10 bg-white/90 backdrop-blur-md text-indigo-700 text-[11px] sm:text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-white/60 -rotate-[4deg] hidden sm:flex items-center gap-1.5">
            🦷 Professional Services
          </div>

          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-full shadow-lg mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            AI-Powered Dental Diagnostics
          </div>

          {/* ── Main headline ── */}
          <h1 className="text-[2.75rem] sm:text-6xl lg:text-[5.2rem] font-black text-white leading-[1.06] tracking-tight drop-shadow-lg mb-2">
            We Take Care of
          </h1>
          <h1 className="text-[2.75rem] sm:text-6xl lg:text-[5.2rem] font-black leading-[1.06] tracking-tight flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 mb-6">
            {/* Tooth icon chip */}
            <span className="inline-flex items-center justify-center bg-white rounded-2xl sm:rounded-3xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl">
              <svg viewBox="0 0 32 36" className="w-9 h-11 sm:w-14 sm:h-[68px]" fill="none">
                <path
                  d="M16 2C20 2 26 6 26 13C26 19 22 24 20 29C18.5 33 17 35 16 35C15 35 13.5 33 12 29C10 24 6 19 6 13C6 6 12 2 16 2Z"
                  fill="#6366f1"
                />
                <path
                  d="M12 13C12 13 13.5 10 16 10C18.5 10 20 13 20 13"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-white drop-shadow-lg">Your</span>
            <span
              className="drop-shadow-lg"
              style={{
                background: 'linear-gradient(90deg, #fde68a 10%, #fbbf24 50%, #f59e0b 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Smile
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-indigo-100/90 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed font-light mb-10">
            AI-assisted panoramic X-ray analysis powered by dual YOLO11m deep learning models —
            instant tooth enumeration, disease detection, and restoration planning in seconds.
          </p>

          {/* ══ BIG CTA BUTTON ══ */}
          <Link
            to="/analyze"
            className="group relative inline-flex items-center gap-4 bg-white text-indigo-700 font-extrabold text-lg sm:text-xl px-10 sm:px-14 py-5 sm:py-6 rounded-full shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.35)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] mb-14"
          >
            {/* Glow ring behind button */}
            <span className="absolute inset-0 rounded-full bg-white/30 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
            <span className="relative">Analyse a Radiograph</span>
            <span className="relative w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-700 transition-colors shadow-md">
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          {/* ── Photo collage — rounded pill shapes ── */}
          <div className="flex items-end justify-center gap-3 sm:gap-5 w-full max-w-4xl">
            <CollageCard src="/hero1.jpg" alt="Dental clinic" size="sm" />
            <CollageCard src="/hero3.jpg" alt="Dental procedure" size="md" />
            <CollageCard src="/hero2.jpg" alt="Smiling patient" size="lg" />
            <CollageCard src="/hero5.jpg" alt="Dental exam" size="md" />
            <CollageCard src="/hero4.jpg" alt="Happy patient" size="sm" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          MARQUEE STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-100 py-5 overflow-hidden">
        <style>{`
          @keyframes marqueeLR {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-scroll { animation: marqueeLR 25s linear infinite; }
          .marquee-scroll:hover { animation-play-state: paused; }
        `}</style>
        <div className="flex whitespace-nowrap">
          <div className="marquee-scroll flex items-center gap-6 pr-6">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-800 font-black text-lg sm:text-2xl tracking-tight">{item}</span>
                <span className="text-indigo-400 text-lg font-black select-none">✦</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          EXPERT CARE SPLIT — X-ray + features
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Left — X-ray preview */}
        <div className="relative group">
          <div
            className="absolute -inset-5 rounded-[2rem] opacity-25 blur-3xl transition-opacity duration-700 group-hover:opacity-40"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)' }}
          />
          <div className="relative rounded-[1.5rem] overflow-hidden border border-slate-200/60 shadow-2xl bg-slate-950">
            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-400">DentalAI Clinical Viewer</span>
              </div>
              <span className="bg-teal-950 text-teal-400 border border-teal-800 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold">
                Dual-Model Active
              </span>
            </div>
            <img
              src="/samples/sample_panoramic.jpg"
              alt="Dental panoramic X-ray"
              className="w-full h-72 sm:h-[380px] object-cover opacity-90"
            />
            {/* Floating stat chip */}
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-3.5 shadow-xl border border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">32 Teeth Tracked</p>
                <p className="text-[11px] text-slate-500">4 Pathologies · 2 Models</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — text + 2×2 grid */}
        <div className="space-y-7">
          <div>
            <p className="text-indigo-600 font-bold text-sm flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Smart Dental AI
            </p>
            <h2 className="text-3xl sm:text-[2.6rem] font-black text-slate-900 leading-[1.15]">
              Expert Care for Every Tooth,{' '}
              <span className="text-indigo-600">Restore Your Confidence</span>
            </h2>
            <p className="mt-4 text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg">
              From tooth enumeration to disease detection and restoration planning — our AI
              models analyse panoramic radiographs in under 300 ms and produce clinician-ready
              decision support.
            </p>
          </div>

          {/* 2×2 feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: HeartPulse, title: 'Best Medical Service',  desc: 'Our AI delivers trusted, compassionate dental diagnostics.' },
              { icon: Cpu,        title: 'Expert AI Analysis',    desc: 'Dual YOLO11m models trained on dental clinical datasets.' },
              { icon: Clock,      title: 'Instant Results',       desc: 'Full analysis with interactive viewer in under 300 ms.' },
              { icon: Video,      title: 'Clinical PDF Report',   desc: 'Downloadable report with structured restoration guidance.' },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 space-y-2.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="font-extrabold text-slate-900 text-sm">{f.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <Link
            to="/analyze"
            className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.97]"
          >
            Start Analysis
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          POPULAR SERVICES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50/70 border-y border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3">
            <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              Popular Categories
            </p>
            <h2 className="text-3xl sm:text-[2.5rem] font-black text-slate-900">Advanced Dental Services</h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              Comprehensive dental treatments tailored to your needs, delivered with expertise and care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layers,   title: 'Tooth Enumeration',  desc: 'Automatic FDI numbering of all detected teeth in the panoramic radiograph.',            badge: '32 Classes',     color: 'from-indigo-500 to-violet-600' },
              { icon: Search,   title: 'Disease Screening',  desc: 'AI-driven detection of caries, periapical lesions and impacted teeth.',                  badge: '4 Pathologies',  color: 'from-pink-500 to-rose-600' },
              { icon: Eye,      title: 'Interactive Viewer',  desc: 'Zoomable multi-layer SVG overlay with synchronized tooth selection.',                    badge: 'Real-time',      color: 'from-amber-500 to-orange-500' },
              { icon: FileText, title: 'Clinical Reports',   desc: 'Downloadable PDF with restoration guidance and alignment screening.',                    badge: 'Instant PDF',    color: 'from-teal-500 to-emerald-600' },
            ].map((s, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className={`h-1.5 bg-gradient-to-r ${s.color}`} />
                <div className="p-6 sm:p-7 space-y-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    {s.badge}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4-STEP WORKFLOW
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center space-y-3 mb-16">
          <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            How It Works
          </p>
          <h2 className="text-3xl sm:text-[2.5rem] font-black text-slate-900">
            The 4-Step Analysis Workflow
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            From radiograph upload to clinical PDF — DentalAI handles it all in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Upload Radiograph',    desc: 'Upload any panoramic OPG or bitewing X-ray in JPG or PNG format.',                   icon: ScanLine },
            { step: '02', title: 'Dual-Model Inference', desc: 'Parallel YOLO11m models execute enumeration and disease detection in < 300 ms.', icon: Cpu },
            { step: '03', title: 'Spatial Association',  desc: 'IoA matching automatically links detected lesions to specific FDI tooth numbers.',   icon: Layers },
            { step: '04', title: 'Clinical PDF Report',  desc: 'Review structured restoration guidance and download the clinical report.',            icon: ShieldCheck },
          ].map((w, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group overflow-hidden"
            >
              {/* Big ghost step number */}
              <span className="absolute -top-5 -left-2 font-black text-[5.5rem] text-indigo-50 select-none leading-none group-hover:text-indigo-100 transition-colors">
                {w.step}
              </span>
              <div className="relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg group-hover:bg-indigo-700 group-hover:scale-110 transition-all duration-300">
                  <w.icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-black text-slate-900 text-lg">{w.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div
          className="max-w-5xl mx-auto rounded-[2rem] px-8 sm:px-14 py-16 sm:py-20 text-center relative overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)' }}
        >
          {/* Decorative orbs */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.08] blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-violet-300/15 blur-[60px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative space-y-6">
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em]">
              🦷 Ready to Try?
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Upload Your First Radiograph.<br />Get Instant AI Insights.
            </h2>
            <p className="text-indigo-200/80 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              No login required. Fully local processing. Clinical PDF included.
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-4 bg-white text-indigo-700 font-extrabold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
            >
              Analyse a Radiograph
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          DISCLAIMER
      ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <Disclaimer />
      </section>
    </div>
  );
};
