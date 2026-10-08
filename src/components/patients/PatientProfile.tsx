import React, { useState } from 'react';
import {
  User,
  Calendar,
  Share2,
  PlusCircle,
  Eye,
  TrendingUp,
  FileText,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Patient, ScreeningRecord, DRSeverity } from '../../types';
import { storage } from '../../db/storage';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onStartScreening: (patientId: string) => void;
  onSelectScreening: (screeningId: string) => void;
  onSharePatient: (patientId: string) => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  patientId,
  onBack,
  onStartScreening,
  onSelectScreening,
  onSharePatient,
}) => {
  const patient = storage.getPatientById(patientId);
  const screenings = storage.getScreenings(patientId).sort((a, b) => a.timestamp - b.timestamp);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        Patient record not found.
        <button onClick={onBack} className="block mx-auto mt-4 text-teal-700 underline text-sm">
          Return to Patients List
        </button>
      </div>
    );
  }

  const getSeverityBadge = (sev: DRSeverity) => {
    switch (sev) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Healthy / No DR
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mild DR
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Moderate DR
          </span>
        );
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Severe / PDR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Patients</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSharePatient(patient.id)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Generate Secure Share Token</span>
          </button>
          <button
            onClick={() => onStartScreening(patient.id)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Start New Screening Visit</span>
          </button>
        </div>
      </div>

      {/* Patient Master Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{patient.fullName}</h1>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {patient.id}
                </span>
                {getSeverityBadge(patient.currentSeverity)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.age} years · <span className="capitalize">{patient.gender}</span> · {patient.village}, {patient.subDistrict} · Phone: <span className="font-mono">{patient.phone}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Visits</span>
              <span className="text-lg font-bold text-slate-900">{screenings.length}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Diabetes</span>
              <span className="text-sm font-bold text-slate-900">
                {patient.diabetesType.replace('_', ' ').toUpperCase()} ({patient.diabetesDurationYears}y)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">HbA1c</span>
              <span className="text-sm font-bold text-slate-900">
                {patient.hbA1c ? `${patient.hbA1c}%` : 'Unchecked'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Hypertension</span>
              <span className="text-sm font-bold text-slate-900">
                {patient.hypertension ? 'Positive (HTN)' : 'Negative'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Screening Timeline (Section 15) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Longitudinal Screening Timeline</span>
            </h2>
            <p className="text-xs text-slate-500">
              Chronological fundus evaluations and clinical doctor decisions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {screenings.length} Chronological Screenings
          </span>
        </div>

        {screenings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No screenings performed yet. Click "Start New Screening Visit" to capture baseline fundus photograph.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-600/30 space-y-8 my-4">
            {screenings.map((sc, idx) => {
              const hasProgression =
                idx > 0 &&
                sc.aiResult?.severity &&
                screenings[idx - 1].aiResult?.severity &&
                sc.aiResult.severity !== screenings[idx - 1].aiResult?.severity;

              return (
                <div key={sc.id} className="relative group">
                  {/* Timeline circle */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-white border-4 border-teal-600 flex items-center justify-center"></div>

                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            Visit #{sc.visitNumber} — {sc.date}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ({sc.time}) · {sc.eye}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          Screening ID: {sc.id} · Examiner: {sc.doctorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sc.aiResult && getSeverityBadge(sc.aiResult.severity)}
                        <button
                          onClick={() => onSelectScreening(sc.id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
                        >
                          View Inspection Details →
                        </button>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      {/* Fundus Thumb */}
                      <div className="aspect-square max-w-[140px] rounded-lg overflow-hidden bg-black border border-slate-200 shrink-0">
                        <img
                          src={sc.imageUrl}
                          alt="Fundus"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* AI Findings Summary */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider block font-mono">
                          AI Findings (XAI Corroborated)
                        </span>
                        <p>Confidence: <strong className="font-mono text-slate-900">{sc.aiResult?.confidence || 'N/A'}%</strong></p>
                        <p>Quality Score: <strong className="font-mono text-slate-900">{sc.quality.overallScore}%</strong></p>
                        <p>
                          Microaneurysms: <strong className="font-mono text-slate-900">{sc.aiResult?.structures.microaneurysms.count || 0}</strong>
                        </p>
                        <p>
                          Lipid Exudates: <strong className="font-mono text-slate-900">{sc.aiResult?.structures.exudates.count || 0}</strong>
                        </p>
                      </div>

                      {/* Doctor Decision & Notes */}
                      <div className="md:col-span-2 space-y-2 text-xs bg-white p-3.5 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-teal-800 uppercase text-[10px] tracking-wider font-mono">
                            Doctor Action Confirmed
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {sc.doctorReview?.decidedAt
                              ? new Date(sc.doctorReview.decidedAt).toLocaleDateString()
                              : 'Pending'}
                          </span>
                        </div>

                        <p className="text-slate-800 font-medium">
                          {sc.doctorReview?.doctorNotes || 'No notes documented.'}
                        </p>

                        {sc.doctorReview?.modifiedPlanDetails && (
                          <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                            <strong>Modified Management:</strong> {sc.doctorReview.modifiedPlanDetails}
                          </div>
                        )}

                        {sc.doctorReview?.followUpDate && (
                          <div className="text-[11px] font-mono text-amber-800 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Follow-up Scheduled: <strong>{sc.doctorReview.followUpDate}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progression Warning Banner on visit if severity changed */}
                    {hasProgression && (
                      <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>Progression Detected:</strong> Severity advanced from previous screening. Priority referral protocol initiated.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
