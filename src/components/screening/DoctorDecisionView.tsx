import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileCheck,
  Send,
  Building,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Doctor, Patient, ScreeningRecord, DoctorDecisionRecord } from '../../types';

interface DoctorDecisionViewProps {
  patient: Patient;
  screening: ScreeningRecord;
  doctor: Doctor;
  onSaveDecision: (decision: DoctorDecisionRecord) => void;
  onViewReport: () => void;
}

export const DoctorDecisionView: React.FC<DoctorDecisionViewProps> = ({
  patient,
  screening,
  doctor,
  onSaveDecision,
  onViewReport,
}) => {
  const aiSuggestion = screening.aiResult?.managementSuggestion || 'Routine monitoring advised.';
  const defaultFollowUpWeeks = screening.aiResult?.suggestedFollowUpWeeks || 12;

  // Calculate default follow-up date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + defaultFollowUpWeeks * 7);
  const defaultFollowUpDateStr = targetDate.toISOString().split('T')[0];

  const [selectedAction, setSelectedAction] = useState<
    'continue_current_plan' | 'modify_management' | 'refer_to_specialist' | 'request_recapture'
  >('continue_current_plan');

  const [modifiedPlanText, setModifiedPlanText] = useState('');
  const [reasonForChangeText, setReasonForChangeText] = useState('');
  const [specialistType, setSpecialistType] = useState('Vitreo-Retina Specialist / Tertiary Eye Hospital');
  const [referralHospital, setReferralHospital] = useState(
    'Ramanagara District Hospital Ophthalmic OPD / Minto RIO'
  );
  const [doctorNotes, setDoctorNotes] = useState(
    screening.doctorReview?.doctorNotes ||
      (screening.aiResult?.severity === 'moderate'
        ? 'Patient advised ophthalmology consultation due to progression from mild to moderate DR.'
        : 'Fundus findings reviewed and confirmed with patient.')
  );
  const [followUpDate, setFollowUpDate] = useState(
    screening.doctorReview?.followUpDate || defaultFollowUpDateStr
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const decisionRecord: DoctorDecisionRecord = {
      decision: selectedAction,
      modifiedPlanDetails: selectedAction === 'modify_management' ? modifiedPlanText : undefined,
      reasonForChange: selectedAction === 'modify_management' ? reasonForChangeText : undefined,
      specialistType: selectedAction === 'refer_to_specialist' ? specialistType : undefined,
      referralHospital: selectedAction === 'refer_to_specialist' ? referralHospital : undefined,
      doctorNotes,
      followUpDate,
      doctorName: doctor.name,
      doctorId: doctor.id,
      decidedAt: new Date().toISOString(),
    };

    onSaveDecision(decisionRecord);
    setSavedSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-semibold text-teal-700 tracking-wider">
          STEP 5 · FINAL CLINICAL DECISION & MANAGEMENT PROTOCOL
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Doctor Review & Clinical Action
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          The AI assists the doctor, but the certified doctor remains the final decision-maker.
        </p>
      </div>

      {/* AI Management Suggestion Box (Section 20) */}
      <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider font-mono">
              AI Management Suggestion (Decision Support)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">
            Suggested Interval: {defaultFollowUpWeeks} Weeks
          </span>
        </div>

        <p className="text-xs text-amber-900 leading-relaxed font-medium bg-white/70 p-3 rounded-lg border border-amber-200">
          "{aiSuggestion}"
        </p>

        {/* Mandatory Regulatory Warning */}
        <div className="flex items-start gap-2 text-[11px] text-amber-900/90 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            CRITICAL DISCLAIMER: AI-generated decision-support suggestion. The AI does not prescribe treatment or modify care plans. Final management decision must be made by the doctor.
          </span>
        </div>
      </div>

      {/* Doctor Action Controls Form (Section 21) */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Select Doctor Management Plan:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedAction('continue_current_plan')}
              className={`p-3 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between h-20 ${
                selectedAction === 'continue_current_plan'
                  ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span>Continue Current Plan</span>
              <span className="text-[10px] text-slate-500 font-normal">Maintain regimen</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('modify_management')}
              className={`p-3 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between h-20 ${
                selectedAction === 'modify_management'
                  ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span>Modify Management</span>
              <span className="text-[10px] text-slate-500 font-normal">Adjust dosage/care</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('refer_to_specialist')}
              className={`p-3 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between h-20 ${
                selectedAction === 'refer_to_specialist'
                  ? 'border-orange-500 bg-orange-50 text-orange-950 ring-1 ring-orange-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span>Refer to Specialist</span>
              <span className="text-[10px] text-slate-500 font-normal">Ophthalmologist</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('request_recapture')}
              className={`p-3 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between h-20 ${
                selectedAction === 'request_recapture'
                  ? 'border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span>Request Recapture</span>
              <span className="text-[10px] text-slate-500 font-normal">Repeat imaging</span>
            </button>
          </div>
        </div>

        {/* Dynamic Fields for "Modify Management" */}
        {selectedAction === 'modify_management' && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in">
            <span className="text-xs font-mono font-bold text-teal-800 uppercase block">
              Required Modification Details
            </span>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                What management/treatment change did you make?
              </label>
              <input
                type="text"
                required
                value={modifiedPlanText}
                onChange={(e) => setModifiedPlanText(e.target.value)}
                placeholder="e.g. Intensified oral glycemic control, added fenofibrate, scheduled HbA1c review"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for change?
              </label>
              <input
                type="text"
                required
                value={reasonForChangeText}
                onChange={(e) => setReasonForChangeText(e.target.value)}
                placeholder="e.g. Documented transition from mild to moderate retinopathy over 4-month interval"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Dynamic Fields for "Refer to Specialist" */}
        {selectedAction === 'refer_to_specialist' && (
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-4 animate-in fade-in">
            <span className="text-xs font-mono font-bold text-orange-900 uppercase block">
              Referral Protocol & Hospital Facility
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Specialist Cadre
                </label>
                <select
                  value={specialistType}
                  onChange={(e) => setSpecialistType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="Vitreo-Retina Specialist">Vitreo-Retina Specialist</option>
                  <option value="General District Ophthalmologist">General District Ophthalmologist</option>
                  <option value="Laser Photocoagulation Clinic">Laser Photocoagulation Clinic</option>
                  <option value="Tertiary Government Eye Institute">Tertiary Government Eye Institute</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Referred Health Center / Facility
                </label>
                <input
                  type="text"
                  value={referralHospital}
                  onChange={(e) => setReferralHospital(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Doctor Clinical Notes (Section 22) */}
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
            Doctor Clinical Notes:
          </label>
          <textarea
            rows={3}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Document physical examination findings, visual acuity notes, patient counselling..."
            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Next Follow-up Date (Section 23) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Next Follow-up Date:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none font-mono"
              />
              <span className="text-xs text-slate-500">
                (Default: {defaultFollowUpWeeks} weeks)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-right text-xs text-slate-500 font-mono">
              <span className="block text-slate-700 font-semibold">{doctor.name}</span>
              <span>{doctor.registrationNumber}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onViewReport}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate Patient Screening Report</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Finalize Doctor Decision</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Doctor decision and follow-up successfully recorded in patient longitudinal history!</span>
          </div>
        )}
      </form>
    </div>
  );
};
