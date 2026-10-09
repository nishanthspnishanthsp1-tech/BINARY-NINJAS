import React from 'react';
import {
  Users,
  Eye,
  Clock,
  AlertOctagon,
  ArrowRight,
  PlusCircle,
  Camera,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { storage } from '../../db/storage';
import { DRSeverity, Patient, ScreeningRecord } from '../../types';
import { NavigationTab } from '../layout/Navbar';

interface DoctorDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectPatient: (patientId: string) => void;
  onSelectScreening: (screeningId: string) => void;
  onStartScreeningWithPatient?: (patientId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onNavigate,
  onSelectPatient,
  onSelectScreening,
  onStartScreeningWithPatient,
}) => {
  const stats = storage.getDashboardStats();
  const totalSeverity =
    stats.severityBreakdown.healthy +
    stats.severityBreakdown.mild +
    stats.severityBreakdown.moderate +
    stats.severityBreakdown.severe || 1;

  const healthyPct = Math.round((stats.severityBreakdown.healthy / totalSeverity) * 100);
  const mildPct = Math.round((stats.severityBreakdown.mild / totalSeverity) * 100);
  const moderatePct = Math.round((stats.severityBreakdown.moderate / totalSeverity) * 100);
  const severePct = Math.round((stats.severityBreakdown.severe / totalSeverity) * 100);

  const getSeverityBadge = (sev: DRSeverity) => {
    switch (sev) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Healthy / No DR
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Mild DR
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-800">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            Moderate DR
          </span>
        );
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            Severe / Proliferative
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Screening Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-700 font-semibold mb-1">
            <span>RURAL TELE-OPHTHALMOLOGY AI SUITE</span>
            <span>·</span>
            <span>SIH CLINICAL PROTOCOL</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Diabetic Retinopathy Screening Console
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Longitudinal AI explainability, lesion localization, and clinical decision support for primary health centers in rural India.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('new_screening')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            <span>New Patient Screening</span>
          </button>
          <button
            onClick={() => onNavigate('priority_queue')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <span>Priority Queue ({stats.highRiskCount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary 6 Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{stats.totalPatients}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Ramanagara PHCs</span>
        </div>

        {/* Today's Screenings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Today's Visits</span>
            <Eye className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{stats.todayScreeningsCount}</p>
          <span className="text-[11px] text-teal-700 font-medium mt-1 block">Active screening cohort</span>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{stats.pendingReviewsCount}</p>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">Awaiting doctor decision</span>
        </div>

        {/* High Risk Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High Risk (PDR)</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 tabular-nums">{stats.highRiskCount}</p>
          <span className="text-[11px] text-rose-700 font-medium mt-1 block">Urgent specialist alert</span>
        </div>

        {/* Patients Requiring Referral */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Referrals Due</span>
            <ArrowRight className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-orange-600 tabular-nums">{stats.requiringReferralCount}</p>
          <span className="text-[11px] text-orange-700 font-medium mt-1 block">District hospital slips</span>
        </div>

        {/* Poor Image Quality / Recapture */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Recapture Needed</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{stats.poorQualityCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Ungradable optical blur</span>
        </div>
      </div>

      {/* Clinical Distribution & Longitudinal Alert Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution Chart Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Diabetic Retinopathy Severity Spectrum
              </h2>
              <p className="text-xs text-slate-500">
                ICDR international grading distribution across Ramanagara rural cohort ({totalSeverity} total evaluated eyes)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">ICDR 0–4 Standard</span>
          </div>

          {/* Color stacked bar */}
          <div className="h-6 w-full rounded-md overflow-hidden flex bg-slate-100 mb-4 border border-slate-200">
            <div
              style={{ width: `${healthyPct}%` }}
              title={`Healthy: ${stats.severityBreakdown.healthy} (${healthyPct}%)`}
              className="bg-emerald-600 transition-all duration-300"
            />
            <div
              style={{ width: `${mildPct}%` }}
              title={`Mild DR: ${stats.severityBreakdown.mild} (${mildPct}%)`}
              className="bg-amber-500 transition-all duration-300"
            />
            <div
              style={{ width: `${moderatePct}%` }}
              title={`Moderate DR: ${stats.severityBreakdown.moderate} (${moderatePct}%)`}
              className="bg-orange-600 transition-all duration-300"
            />
            <div
              style={{ width: `${severePct}%` }}
              title={`Severe / Proliferative: ${stats.severityBreakdown.severe} (${severePct}%)`}
              className="bg-rose-600 transition-all duration-300"
            />
          </div>

          {/* 4 Severity Cards with Consistent Medical Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Healthy */}
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-semibold text-emerald-950">Healthy / No DR</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
                  {stats.severityBreakdown.healthy}
                </span>
                <span className="text-xs font-mono text-emerald-700">{healthyPct}%</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-1">Annual routine screen</p>
            </div>

            {/* Mild */}
            <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-amber-950">Mild DR</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">
                  {stats.severityBreakdown.mild}
                </span>
                <span className="text-xs font-mono text-amber-700">{mildPct}%</span>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-1">6-month monitoring</p>
            </div>

            {/* Moderate */}
            <div className="border border-orange-200 bg-orange-50/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                <span className="text-xs font-semibold text-orange-950">Moderate DR</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono text-orange-800 tabular-nums">
                  {stats.severityBreakdown.moderate}
                </span>
                <span className="text-xs font-mono text-orange-700">{moderatePct}%</span>
              </div>
              <p className="text-[11px] text-orange-700/80 mt-1">1–2 week referral</p>
            </div>

            {/* Severe / Proliferative */}
            <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-xs font-semibold text-rose-950">Severe / PDR</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono text-rose-800 tabular-nums">
                  {stats.severityBreakdown.severe}
                </span>
                <span className="text-xs font-mono text-rose-700">{severePct}%</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">Emergency vitreo-retina</p>
            </div>
          </div>
        </div>

        {/* Feature Spotlight: Arun Kumar Progression Alert */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>LONGITUDINAL CHANGE DETECTED</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Arun Kumar (DR-2026-001245)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Screening comparison shows disease progression from <strong className="text-amber-300">Mild DR</strong> (June/August 2026) to <strong className="text-orange-400">Moderate DR</strong> (Today, Oct 8). Multiple new paramacular microaneurysms and hard exudates detected.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Microaneurysm delta:</span>
                <span className="text-amber-400 font-bold">+12 new lesions</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Exudate threat:</span>
                <span className="text-orange-400 font-bold">Paramacular cluster</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>AI Recommendation:</span>
                <span className="text-white">Expedited Ophthalmology Referral</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => onSelectScreening('SCR-2026-0891')}
              className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg text-center transition-colors"
            >
              Review October Screening
            </button>
            <button
              onClick={() => onSelectPatient('DR-2026-001245')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg text-center transition-colors border border-slate-700"
            >
              View Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Split Columns: Recent Screenings & Follow-ups Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Screenings Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Screenings</h2>
              <p className="text-xs text-slate-500">Latest fundus records processed through AI grading</p>
            </div>
            <button
              onClick={() => onNavigate('new_screening')}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recentScreenings.map((screening) => {
              const patient = storage.getPatientById(screening.patientId);
              return (
                <div
                  key={screening.id}
                  onClick={() => onSelectScreening(screening.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={screening.imageUrl}
                      alt="Fundus thumb"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-slate-900 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {patient?.fullName || screening.patientId}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({screening.eye})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{screening.date}</span>
                        <span>·</span>
                        <span className="font-mono">{screening.time}</span>
                        <span>·</span>
                        <span>Visit #{screening.visitNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {screening.isRecaptureNeeded ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Recapture
                      </span>
                    ) : screening.aiResult ? (
                      <div>
                        {getSeverityBadge(screening.aiResult.severity)}
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {screening.aiResult.confidence}% conf · {screening.quality.overallScore}% qual
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow-ups Due */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Follow-ups Due</h2>
              <p className="text-xs text-slate-500">Scheduled re-screening & review appointments</p>
            </div>
            <button
              onClick={() => onNavigate('followups')}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.followUpsDue.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No scheduled follow-ups pending</div>
            ) : (
              stats.followUpsDue.slice(0, 5).map((fu, idx) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-mono text-xs font-semibold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{fu.patientName}</p>
                      <p className="text-xs text-slate-500">
                        <span>{fu.village}</span> · <span className="font-mono">{fu.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-slate-900 block">
                        {fu.followUpDate}
                      </span>
                      <span className="text-[11px] text-slate-400">Target Re-screen</span>
                    </div>

                    <button
                      onClick={() => onStartScreeningWithPatient?.(fu.patientId)}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors whitespace-nowrap"
                    >
                      Screen Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
