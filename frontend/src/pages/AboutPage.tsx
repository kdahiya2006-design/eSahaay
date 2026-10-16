import React from 'react';
import {
  ShieldAlert,
  HeartHandshake,
  CheckCircle2,
  Lock,
  Layers,
  AlertTriangle
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8 max-w-5xl mx-auto text-slate-800 animate-fadeIn">
      {/* Title */}
      <div className="space-y-2 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <HeartHandshake className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Hackathon Social-Impact Innovation</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          About eSahaay: Intelligent Helpline Triage
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          An AI-powered decision-support assistant designed for women's safety helplines handling fragmented, high-stress complaints in Hindi, English, and Hinglish.
        </p>
      </div>

      {/* The Real-World Problem */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>The Challenge in Women's Safety Helplines</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Helplines in multilingual metropolitan and semi-urban hubs face urgent communication challenges:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1 text-xs">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-semibold text-slate-900">Fragmented Hinglish</h4>
            <p className="text-slate-600 leading-relaxed">
              Callers under intense anxiety mix Hindi verbs with Romanized English (<em>"scooty ke peeche aa raha hai... dekh lunga bola"</em>), confusing standard English-only NLP pipelines.
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-semibold text-slate-900">Ambiguous & Indirect Threats</h4>
            <p className="text-slate-600 leading-relaxed">
              Intimidation is often veiled rather than explicit physical threats, requiring careful context parsing rather than naive keyword matching.
            </p>
          </div>
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-semibold text-slate-900">Incomplete & Vague Locations</h4>
            <p className="text-slate-600 leading-relaxed">
              Callers describe landmarks (<em>"red building near metro"</em>) without city, area, or gate numbers, risking dangerous delays in dispatching field assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Core Innovation & Principles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span>Core Safeguards & Architectural Principles</span>
        </h3>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50/50 border border-teal-100">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Human Operator Remains in Full Control:</strong>
              <span className="text-slate-700 block mt-0.5 leading-relaxed">
                eSahaay is strictly a <strong>decision-support assistant</strong>. It does not replace human judgment, does not automatically contact police, and all provisional assessments must be verified by a certified operator.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Verbatim Evidence Grounding:</strong>
              <span className="text-slate-700 block mt-0.5 leading-relaxed">
                Every extracted finding is mapped directly back to exact verbatim excerpts in the caller's transcript with interactive UI highlights. The engine never invents facts, weapons, or names.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Explicit Negation Safeguards:</strong>
              <span className="text-slate-700 block mt-0.5 leading-relaxed">
                If a caller states <em>"usne mujhe dhamki nahi di"</em> (he did NOT threaten me) or <em>"chhua nahi"</em>, eSahaay recognizes negation and prevents false-positive threat classification.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Contradiction Detection:</strong>
              <span className="text-slate-700 block mt-0.5 leading-relaxed">
                If statements conflict (e.g. claiming to be at home safe, yet simultaneously trapped at a metro platform), urgency is provisionally marked <em>"Unable to Determine"</em> to force operator clarification.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>Technology Stack</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">Frontend</span>
            <span className="text-slate-600">React 18 + TypeScript</span>
            <span className="text-slate-600 block mt-1">Tailwind CSS + Lucide</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">Backend</span>
            <span className="text-slate-600">Python 3.11 + FastAPI</span>
            <span className="text-slate-600 block mt-1">Pydantic v2 Validation</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">AI & NLP Engine</span>
            <span className="text-slate-600">Interchangeable Provider</span>
            <span className="text-slate-600 block mt-1">Deterministic Rule Fallback</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">Storage & Charts</span>
            <span className="text-slate-600">Local SQLite DB</span>
            <span className="text-slate-600 block mt-1">Recharts Visualizations</span>
          </div>
        </div>
      </div>

      {/* Privacy, Ethics & Limitations */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2 text-xs text-slate-600">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-slate-600" />
          <span>Privacy, Security & Legal Disclaimer</span>
        </h4>
        <p className="leading-relaxed">
          1. <strong>Synthetic Data:</strong> All demo transcripts and evaluation benchmark cases in this repository are fictional. No private caller records are included or transmitted.
        </p>
        <p className="leading-relaxed">
          2. <strong>Zero Automated Dispatch:</strong> eSahaay does not place automated calls to law enforcement, emergency 112, or family contacts.
        </p>
        <p className="leading-relaxed">
          3. <strong>Decision Support:</strong> This system provides decision support for trained helpline agents. It does not provide legal advice or clinical diagnosis.
        </p>
      </div>
    </div>
  );
};
