import React, { useEffect, useRef } from 'react';
import { X, ArrowLeft, Printer, ShieldCheck, HeartPulse, ArrowDownToLine, Eye, Calendar, User } from 'lucide-react';
import { storage } from '../../db/storage';

interface ScreeningReportModalProps {
  screeningId: string;
  onClose: () => void;
}

export const ScreeningReportModal: React.FC<ScreeningReportModalProps> = ({
  screeningId,
  onClose,
}) => {
  const screening = storage.getScreeningById(screeningId);
  const patient = screening ? storage.getPatientById(screening.patientId) : null;
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle body scroll locking and browser history state back-navigation
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent underlying dashboard scrolling while modal is open
    document.body.style.overflow = 'hidden';

    // Push a temporary history state so the browser back button closes the modal
    const historyState = { reportModal: screeningId };
    window.history.pushState(historyState, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [screeningId, onClose]);

  if (!screening || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  // Click outside to close: only close if the click originated on the darkened backdrop itself
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto"
    >
      <div
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none overflow-hidden"
      >
        {/* STICKY TOP HEADER WITH "← Back" AND "X" (Close) BUTTON */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">← Back</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="flex items-center gap-2 truncate">
              <HeartPulse className="w-4 h-4 text-teal-600 shrink-0" />
              <h2
                id="report-modal-title"
                className="text-xs sm:text-sm font-bold text-slate-900 truncate"
              >
                Screening Report: <span className="text-teal-800 font-mono">{patient.fullName}</span> ({screening.id})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Print or Export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close report"
              title="Close report (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CLINICAL REPORT DOCUMENT CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 text-slate-900 print:overflow-visible print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800 uppercase">
                <span>RURAL TELE-OPHTHALMOLOGY NETWORK</span>
                <span>·</span>
                <span>GOVERNMENT OF KARNATAKA PILOT</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                Diabetic Retinopathy Screening Report
              </h1>
              <p className="text-xs text-slate-600">
                Facility: Ramanagara District Primary Eye Care Center · Tele-Consultation Hub
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600">
              <p>Report ID: <strong className="text-slate-900">{screening.id}</strong></p>
              <p>Exam Date: {screening.date} — {screening.time}</p>
              <p>Examiner: {screening.doctorName}</p>
            </div>
          </div>

          {/* Patient Demographics Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
              <span className="text-sm font-bold text-slate-900">{patient.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PATIENT ID</span>
              <span className="text-sm font-bold text-teal-800">{patient.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">AGE / GENDER</span>
              <span className="text-slate-800">{patient.age}y / {patient.gender.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">VILLAGE / DISTRICT</span>
              <span className="text-slate-800">{patient.village}, {patient.district}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">DIABETES STATUS</span>
              <span className="text-slate-800">{patient.diabetesType.toUpperCase()} ({patient.diabetesDurationYears}y)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">HbA1c / HTN</span>
              <span className="text-slate-800">{patient.hbA1c ? `${patient.hbA1c}%` : 'N/A'} · {patient.hypertension ? 'HTN+' : 'HTN-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">EXAMINED EYE</span>
              <span className="text-slate-900 font-bold">{screening.eye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">VISIT NUMBER</span>
              <span className="text-slate-800">Visit #{screening.visitNumber}</span>
            </div>
          </div>

          {/* Fundus Visual & Quality Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center border border-slate-200 p-4 rounded-xl">
            <div className="aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden bg-black border border-slate-300">
              <img
                src={screening.imageUrl}
                alt="Retinal Fundus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="sm:col-span-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Optical Image Quality Assessment</span>
                <span className="font-mono font-bold text-teal-800">{screening.quality.overallScore}% — {screening.quality.status.toUpperCase()}</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Focus sharpness: {screening.quality.focusBlurScore}% · Illumination: {screening.quality.illuminationScore}% · Field: {screening.quality.fieldOfViewScore}% · Centering: {screening.quality.centeringScore}%
              </p>
              {screening.quality.reasons.length > 0 && (
                <p className="text-rose-700 text-[11px]">
                  Quality alert: {screening.quality.reasons.join('; ')}
                </p>
              )}
            </div>
          </div>

          {/* CLEAR SECTION A: AI-GENERATED FINDINGS */}
          <div className="p-4 bg-teal-50/40 border-2 border-teal-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-teal-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-teal-950 font-mono">
                  [ SECTION A ] · AI-GENERATED SCREENING FINDINGS
                </h3>
              </div>
              <span className="text-[10px] font-mono text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-300">
                Automated Multi-Task DL Pipeline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">AI SEVERITY GRADE</span>
                <span className="text-base font-extrabold text-teal-950 uppercase">
                  {screening.aiResult?.severity} DR
                </span>
                <span className="text-[10px] text-slate-500 block">Level {screening.aiResult?.icdrLevel}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">MODEL CONFIDENCE</span>
                <span className="text-base font-bold text-teal-900">
                  {screening.aiResult?.confidence}%
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">AI TRUST SCORE</span>
                <span className="text-base font-bold text-teal-900">
                  {screening.aiResult?.trustReport.overallTrustScore}% (Supported)
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1 pt-1">
              <span className="font-semibold text-slate-900">Detected Microvascular Lesions:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                <li>Microaneurysms: {screening.aiResult?.structures.microaneurysms.count || 0} capillary outpouchings</li>
                <li>Hard Lipid Exudates: {screening.aiResult?.structures.exudates.count || 0} clusters {screening.aiResult?.structures.exudates.hasMacularThreat ? '(Paramacular threat present)' : ''}</li>
                <li>Hemorrhages: {screening.aiResult?.structures.hemorrhages.count || 0} lesions ({screening.aiResult?.structures.hemorrhages.classification})</li>
                <li>Neovascularization: {screening.aiResult?.structures.neovascularization.detected ? 'POSITIVE (PDR)' : 'Negative (NPDR)'}</li>
              </ul>
            </div>
          </div>

          {/* CLEAR SECTION B: DOCTOR-CONFIRMED FINDINGS & DECISION */}
          <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 font-mono">
                  [ SECTION B ] · DOCTOR-CONFIRMED CLINICAL DECISION
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                Final Legally Binding Medical Decision
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">DOCTOR ACTION</span>
                <span className="font-bold text-slate-900 uppercase">
                  {screening.doctorReview?.decision.replace(/_/g, ' ') || 'Pending Review'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">NEXT FOLLOW-UP DATE</span>
                <span className="font-bold text-amber-800">
                  {screening.doctorReview?.followUpDate || 'Not Scheduled'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-800 space-y-1 pt-1">
              <span className="font-semibold text-slate-900">Clinical Attending Notes:</span>
              <p className="bg-white p-3 rounded border border-slate-200 leading-relaxed text-[11px]">
                {screening.doctorReview?.doctorNotes || 'Review pending doctor final verification.'}
              </p>
            </div>

            {screening.doctorReview?.modifiedPlanDetails && (
              <div className="text-xs text-slate-800 space-y-1">
                <span className="font-semibold text-slate-900">Documented Modification Details:</span>
                <p className="bg-white p-2.5 rounded border border-slate-200 text-[11px]">
                  {screening.doctorReview.modifiedPlanDetails}
                </p>
              </div>
            )}
          </div>

          {/* Regulatory Disclaimer Strip */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 leading-relaxed">
            <p>
              <strong>REGULATORY MEDICAL DISCLAIMER:</strong> This AI system is intended for screening and clinical decision support. It does not replace professional ophthalmologist evaluation and does not independently prescribe or modify treatment. Generated under the Ramanagara Rural Retinopathy Tele-Health Network.
            </p>
          </div>
        </div>

        {/* STICKY BOTTOM NAVIGATION BAR WITH "← Back to Dashboard" */}
        <div className="sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
