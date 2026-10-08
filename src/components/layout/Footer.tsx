import React from 'react';
import { AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      {/* Medical Safety Disclaimer Strip */}
      <div className="bg-amber-950/40 border-b border-amber-800/40 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-amber-200/90 leading-relaxed text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-300">CLINICAL SAFETY DISCLAIMER:</span> This AI system is intended for screening and clinical decision support. It does not replace professional ophthalmologist evaluation and does not independently prescribe or modify treatment. Final clinical judgment remains exclusively with the certified physician.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <HeartPulse className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-white">TRUST-DR Platform</span>
            <span>·</span>
            <span>Smart India Hackathon Problem Statement</span>
            <span>·</span>
            <span>Rural Tele-Ophthalmology Network</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>ICDR Classification Standard</span>
            <span>·</span>
            <span>Grad-CAM XAI Engine</span>
            <span>·</span>
            <span>Ramanagara District Pilot</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
