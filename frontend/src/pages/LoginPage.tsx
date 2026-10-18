import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

export interface LoginPageProps {
  onLogin: (operatorId: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [operatorId, setOperatorId] = useState<string>('OP-Delhi-104');
  const [password, setPassword] = useState<string>('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(operatorId.trim() || 'OP-Delhi-104');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 selection:bg-teal-500/30 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute -top-36 -left-36 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-36 -right-36 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-sm animate-fadeIn relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-teal-950/50 mb-3.5 mx-auto ring-4 ring-teal-500/20">
            <img src={logoImg} alt="eSahaay Official Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            eSahaay
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Intelligent Helpline Triage • Listen Triage Support
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 text-teal-300 text-xs font-medium border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Operator Access Portal</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="operator-id"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Operator ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="operator-id"
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="OP-Delhi-104"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Operator Security Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm font-mono tracking-widest"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Demo credentials pre-filled for hackathon evaluation</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-teal-600 hover:bg-teal-500 active:bg-teal-700 shadow-md shadow-teal-900/40 transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            >
              <span>Sign In to Operator Console</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Small footer text */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Decision-Support Tool • Not an Emergency Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
