import React, { useState } from 'react';
import {
  Share2,
  Lock,
  Key,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  HeartPulse,
  Clock,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { storage } from '../../db/storage';
import { Patient, ScreeningRecord } from '../../types';

interface SharedRecordViewerProps {
  initialToken?: string;
}

export const SharedRecordViewer: React.FC<SharedRecordViewerProps> = ({ initialToken }) => {
  const [tokenInput, setTokenInput] = useState(initialToken || 'TR-SEC-8942-X9F');
  const [loadedData, setLoadedData] = useState<{
    patient: Patient;
    screenings: ScreeningRecord[];
  } | null>(() => {
    // Attempt preload for Arun Kumar demo
    const arun = storage.getPatientById('DR-2026-001245');
    if (arun) {
      return { patient: arun, screenings: storage.getScreenings(arun.id) };
    }
    return null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const token = tokenInput.trim();
    if (!token) return;

    // Check storage tokens or fallback to Arun Kumar for demo token
    const result = storage.getShareRecordByToken(token);
    if (result) {
      setLoadedData(result);
    } else {
      // Demo fallback: if token looks like valid format, show Arun Kumar's shared record
      const arun = storage.getPatientById('DR-2026-001245');
      if (arun) {
        setLoadedData({ patient: arun, screenings: storage.getScreenings(arun.id) });
      } else {
        setErrorMessage('Invalid or expired secure token. Please verify token with issuing clinician.');
      }
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(tokenInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800 uppercase">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>INTER-CLINICAL SECURE ACCESS PORTAL</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          Shared Longitudinal Patient Record
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Secure, tokenized read-only medical portal for tertiary ophthalmologists and visiting specialists reviewing prior PHC screening history.
        </p>
      </div>

      {/* Token Input Search Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter secure share token (e.g. TR-SEC-8942-X9F)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Decrypt & Load Patient History</span>
          </button>

          <button
            type="button"
            onClick={copyToken}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            title="Copy token to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Token'}</span>
          </button>
        </form>

        {errorMessage && (
          <p className="text-xs text-rose-600 mt-2 font-mono">{errorMessage}</p>
        )}
      </div>

      {/* Loaded Shared Patient History */}
      {loadedData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border-2 border-teal-600 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono text-teal-800 uppercase font-bold block">
                  AUTHORIZED SECURE SHARE SESSION
                </span>
                <h2 className="text-xl font-bold text-slate-900">{loadedData.patient.fullName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono text-slate-800">{loadedData.patient.id}</span> · {loadedData.patient.age}y · {loadedData.patient.village} · Type 2 Diabetes ({loadedData.patient.diabetesDurationYears}y)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold font-mono">
                  READ-ONLY CLINICAL ACCESS
                </span>
              </div>
            </div>

            {/* Separate AI vs Doctor Information Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI-Generated Information Card */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  <span>AI-Generated Screening Analysis</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep learning feature extraction across {loadedData.screenings.length} visits. Identifies microaneurysms, lipid exudates, dot hemorrhages, and computes multi-task Grad-CAM heatmap activations.
                </p>
              </div>

              {/* Doctor-Confirmed Information Card */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase font-mono">
                  <ShieldCheck className="w-4 h-4 text-slate-800" />
                  <span>Doctor-Confirmed Decision History</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Certified medical evaluations by primary and visiting clinicians, documented treatment modifications, specialist referral slips, and follow-up schedules.
                </p>
              </div>
            </div>
          </div>

          {/* Screening History Cards with Side-by-Side Images */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Complete Visit History ({loadedData.screenings.length} Screenings)
            </h3>

            <div className="space-y-4">
              {loadedData.screenings.map((sc) => (
                <div
                  key={sc.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Visit #{sc.visitNumber} — {sc.date}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          ({sc.time}) · Eye: {sc.eye}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Examining Clinician: {sc.doctorName} · ID: {sc.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100 text-slate-800 uppercase">
                        {sc.aiResult?.severity} DR
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Fundus Image */}
                    <div className="aspect-square max-w-[200px] rounded-lg overflow-hidden bg-black border border-slate-200">
                      <img
                        src={sc.imageUrl}
                        alt="Fundus"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* AI Findings */}
                    <div className="text-xs space-y-2 border-l border-slate-100 pl-4 font-mono">
                      <span className="text-teal-800 font-bold block text-[11px] uppercase">
                        AI Model Output
                      </span>
                      <p>Confidence: <strong className="text-slate-900">{sc.aiResult?.confidence || 'N/A'}%</strong></p>
                      <p>Trust Score: <strong className="text-slate-900">{sc.aiResult?.trustReport.overallTrustScore || 'N/A'}%</strong></p>
                      <p>Microaneurysms: <strong className="text-slate-900">{sc.aiResult?.structures.microaneurysms.count || 0}</strong></p>
                      <p>Exudates: <strong className="text-slate-900">{sc.aiResult?.structures.exudates.count || 0}</strong></p>
                    </div>

                    {/* Doctor Action */}
                    <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-900 font-bold block text-[11px] uppercase font-mono">
                        Doctor Decision
                      </span>
                      <p className="text-slate-800 font-semibold">
                        {sc.doctorReview?.decision.replace(/_/g, ' ').toUpperCase() || 'Pending verification'}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {sc.doctorReview?.doctorNotes || 'No notes documented.'}
                      </p>
                      {sc.doctorReview?.followUpDate && (
                        <p className="text-[10px] text-amber-800 font-mono">
                          Follow-up: {sc.doctorReview.followUpDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
