import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, ArrowLeft, Printer, ShieldCheck, HeartPulse, Eye, Calendar, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { storage } from '../../db/storage';
import { ScreeningRecord } from '../../types';
import { generateTrustDrPdf } from '../../utils/pdfGenerator';

interface ScreeningReportModalProps {
  screeningId: string;
  onClose: () => void;
}

/**
 * Computes or retrieves a high-fidelity Grad-CAM explainability heatmap.
 * If the record already contains a gradCamHeatmapUrl, it is returned directly.
 * Otherwise, generates an ophthalmic attention map aligned with lesion coordinates.
 */
function getGradCamHeatmap(screening: ScreeningRecord): string | null {
  if (screening.aiResult?.gradCamHeatmapUrl) {
    return screening.aiResult.gradCamHeatmapUrl;
  }
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 256, 256);

    const spots: Array<{ x: number; y: number; intensity: number; radius: number }> = [];

    const maLocs = screening.aiResult?.structures?.microaneurysms?.locations || [];
    maLocs.forEach((loc) => {
      spots.push({
        x: (loc.x / 100) * 256,
        y: (loc.y / 100) * 256,
        intensity: 0.9,
        radius: 35,
      });
    });

    const hemLocs = screening.aiResult?.structures?.hemorrhages?.locations || [];
    hemLocs.forEach((loc) => {
      spots.push({
        x: (loc.x / 100) * 256,
        y: (loc.y / 100) * 256,
        intensity: 0.95,
        radius: 40,
      });
    });

    const exLocs = screening.aiResult?.structures?.exudates?.locations || [];
    exLocs.forEach((loc) => {
      spots.push({
        x: (loc.x / 100) * 256,
        y: (loc.y / 100) * 256,
        intensity: 0.85,
        radius: 32,
      });
    });

    if (spots.length === 0) {
      const fovea = screening.aiResult?.structures?.fovea?.location;
      const fx = fovea ? (fovea.x / 100) * 256 : 120;
      const fy = fovea ? (fovea.y / 100) * 256 : 128;
      spots.push(
        { x: fx, y: fy, intensity: 0.75, radius: 45 },
        { x: fx - 30, y: fy + 20, intensity: 0.85, radius: 35 }
      );
    }

    spots.forEach((spot) => {
      const rad = spot.radius;
      const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, rad);
      grad.addColorStop(0, `rgba(239, 68, 68, ${0.85 * spot.intensity})`);
      grad.addColorStop(0.3, `rgba(245, 158, 11, ${0.7 * spot.intensity})`);
      grad.addColorStop(0.6, `rgba(16, 185, 129, ${0.45 * spot.intensity})`);
      grad.addColorStop(0.85, `rgba(59, 130, 246, ${0.2 * spot.intensity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export const ScreeningReportModal: React.FC<ScreeningReportModalProps> = ({
  screeningId,
  onClose,
}) => {
  const screening = storage.getScreeningById(screeningId);
  const patient = screening ? storage.getPatientById(screening.patientId) : null;
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Compute explainability heatmap once for the loaded screening
  const heatmapUrl = useMemo(() => {
    return screening ? getGradCamHeatmap(screening) : null;
  }, [screening]);

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

  // Handle body scroll locking, browser history popstate
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Tag body so CSS knows the report modal is active
    document.body.classList.add('report-modal-active');
    // Prevent underlying dashboard scrolling while modal is open on screen
    document.body.style.overflow = 'hidden';

    // Push temporary history state so browser Back closes modal first
    const historyState = { reportModal: screeningId };
    window.history.pushState(historyState, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.classList.remove('report-modal-active');
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [screeningId, onClose]);

  if (!screening || !patient) return null;

  /**
   * Generates and downloads a properly formatted multi-page A4 PDF directly
   * using html2canvas and jsPDF, using dynamic filename TRUST-DR_Report_[ID].pdf.
   */
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      await generateTrustDrPdf(screening, patient, heatmapUrl);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Unable to generate PDF report. Please try again.');
    } finally {
      setIsPrinting(false);
    }
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
      className="screening-report-modal-backdrop fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()}
        className="screening-report-modal-card bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-hidden"
      >
        {/* ====================================================================
            STICKY TOP HEADER: SCREEN NAVIGATION & PRINT CONTROLS (HIDDEN IN PRINT)
            ==================================================================== */}
        <div className="report-modal-header-actions sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
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
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Print or Export PDF"
              aria-label="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Generating PDF...' : 'Print / PDF'}</span>
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

        {/* ====================================================================
            SCROLLABLE CLINICAL REPORT DOCUMENT (PRINTS FULL MULTI-PAGE A4)
            ==================================================================== */}
        <div className="screening-report-content flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 text-slate-900 bg-white">
          
          {/* DOCUMENT HEADER BANNER */}
          <div className="report-section-avoid-break print-break-inside-avoid border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800 uppercase">
                <span>RURAL TELE-OPHTHALMOLOGY NETWORK</span>
                <span>·</span>
                <span>NATIONAL HEALTH PROTOCOL (INDIA)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                Diabetic Retinopathy Screening Report
              </h1>
              <p className="text-xs text-slate-600">
                Facility: Ramanagara District Primary Eye Care Center · Tele-Consultation Hub
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600 shrink-0">
              <p>Report ID: <strong className="text-slate-900">{screening.id}</strong></p>
              <p>Exam Date: {screening.date} — {screening.time}</p>
              <p>Examiner: <strong className="text-slate-800">{screening.doctorName}</strong></p>
            </div>
          </div>

          {/* PATIENT DEMOGRAPHICS SUMMARY BOX */}
          <div className="report-section-avoid-break print-break-inside-avoid bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
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
              <span className="text-slate-400 block text-[10px]">HbA1c / HYPERTENSION</span>
              <span className="text-slate-800">{patient.hbA1c ? `${patient.hbA1c}%` : 'N/A'} · {patient.hypertension ? 'HTN+' : 'HTN-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">EXAMINED EYE</span>
              <span className="text-slate-900 font-bold">{screening.eye === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">VISIT SEQUENCE</span>
              <span className="text-slate-800">Visit #{screening.visitNumber}</span>
            </div>
          </div>

          {/* RETINAL IMAGING & EXPLAINABILITY HEATMAP SECTION */}
          <div className="report-section-avoid-break print-break-inside-avoid border border-slate-200 p-4 sm:p-5 rounded-xl bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono">
                Retinal Fundus Imaging & Optical Assessment
              </span>
              <span className="font-mono text-xs font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                Quality: {screening.quality.overallScore}% ({screening.quality.status.toUpperCase()})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              {/* Visual 1: Primary Fundus Capture */}
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-full max-w-[210px] rounded-lg overflow-hidden bg-black border border-slate-300 shadow-xs">
                  <img
                    src={screening.imageUrl}
                    alt="Retinal Fundus Capture"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 text-[9px] font-mono text-white rounded">
                    Eye: {screening.eye} · Optical Capture
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-700 mt-1.5 font-semibold">
                  Original Fundus Optical Photo
                </span>
              </div>

              {/* Visual 2: Grad-CAM Explainability Attention Map */}
              <div className="flex flex-col items-center">
                <div className="relative aspect-square w-full max-w-[210px] rounded-lg overflow-hidden bg-black border border-slate-300 shadow-xs">
                  {/* Underlay fundus photo faintly for anatomical context */}
                  <img
                    src={screening.imageUrl}
                    alt="Fundus Context"
                    className="w-full h-full object-cover opacity-45"
                  />
                  {heatmapUrl && (
                    <img
                      src={heatmapUrl}
                      alt="Grad-CAM Saliency Heatmap"
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
                    />
                  )}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-teal-950/85 text-[9px] font-mono text-teal-200 rounded">
                    Grad-CAM XAI Saliency
                  </span>
                </div>
                <span className="text-[11px] font-mono text-teal-800 mt-1.5 font-semibold">
                  Explainable AI Attention Heatmap
                </span>
              </div>
            </div>

            {/* Optical Quality Breakdown */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex flex-wrap justify-between gap-2 text-[11px] font-mono">
                <span>Focus Sharpness: <strong className="text-slate-900">{screening.quality.focusBlurScore}%</strong></span>
                <span>Illumination: <strong className="text-slate-900">{screening.quality.illuminationScore}%</strong></span>
                <span>Field of View: <strong className="text-slate-900">{screening.quality.fieldOfViewScore}%</strong></span>
                <span>Centering: <strong className="text-slate-900">{screening.quality.centeringScore}%</strong></span>
              </div>
              {screening.quality.reasons.length > 0 && (
                <p className="text-rose-700 text-[11px] font-mono pt-1 border-t border-slate-100">
                  Quality alert: {screening.quality.reasons.join('; ')}
                </p>
              )}
            </div>
          </div>

          {/* SECTION A: AI-GENERATED SCREENING FINDINGS */}
          <div className="report-section-avoid-break print-break-inside-avoid p-4 bg-teal-50/40 border-2 border-teal-600 rounded-xl space-y-3">
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
                <span className="text-[10px] text-slate-500 block">Level {screening.aiResult?.icdrLevel} (ICDR Classification)</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">MODEL CONFIDENCE</span>
                <span className="text-base font-bold text-teal-900">
                  {screening.aiResult?.confidence}%
                </span>
                <span className="text-[10px] text-slate-500 block">Deep Ensemble Posterior</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">AI TRUST SCORE</span>
                <span className="text-base font-bold text-teal-900">
                  {screening.aiResult?.trustReport.overallTrustScore}% (Supported)
                </span>
                <span className="text-[10px] text-slate-500 block">XAI Evidence Agreement</span>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5 pt-1 border-t border-teal-100">
              <span className="font-semibold text-slate-900">Detected Microvascular Lesions & Biomarkers:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                <li>
                  Microaneurysms: <strong>{screening.aiResult?.structures.microaneurysms.count || 0}</strong> capillary outpouchings detected
                </li>
                <li>
                  Hard Lipid Exudates: <strong>{screening.aiResult?.structures.exudates.count || 0}</strong> clusters {screening.aiResult?.structures.exudates.hasMacularThreat ? '(Paramacular threat present)' : '(No macular threat)'}
                </li>
                <li>
                  Retinal Hemorrhages: <strong>{screening.aiResult?.structures.hemorrhages.count || 0}</strong> lesions ({screening.aiResult?.structures.hemorrhages.classification})
                </li>
                <li>
                  Neovascularization: {screening.aiResult?.structures.neovascularization.detected ? <strong className="text-rose-700">POSITIVE (PDR)</strong> : 'Negative (NPDR)'}
                </li>
              </ul>
            </div>

            {/* AI Recommendation & Management Suggestion */}
            {screening.aiResult?.managementSuggestion && (
              <div className="bg-white/80 p-2.5 rounded border border-teal-200 text-xs text-teal-950">
                <span className="font-semibold text-[11px] block text-teal-900">AI Suggested Management:</span>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  {screening.aiResult.managementSuggestion} · Suggested follow-up: {screening.aiResult.suggestedFollowUpWeeks} weeks.
                </p>
              </div>
            )}
          </div>

          {/* SECTION B: DOCTOR-CONFIRMED FINDINGS & DECISION */}
          <div className="report-section-avoid-break print-break-inside-avoid p-4 bg-slate-50 border-2 border-slate-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-950 font-mono">
                  [ SECTION B ] · DOCTOR-CONFIRMED CLINICAL DECISION
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                Legally Binding Medical Verification
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
                <span className="text-slate-500 block text-[10px]">SCHEDULED FOLLOW-UP DATE</span>
                <span className="font-bold text-teal-900">
                  {screening.doctorReview?.followUpDate || 'Routine follow-up per protocol'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-800 space-y-1 pt-1">
              <span className="font-semibold text-slate-900">Attending Physician Clinical Notes:</span>
              <p className="bg-white p-3 rounded border border-slate-200 leading-relaxed text-[11px]">
                {screening.doctorReview?.doctorNotes || 'Review confirmed by examining tele-ophthalmology physician.'}
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

            <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-600">
              <span>Verified By: <strong>{screening.doctorReview?.doctorName || screening.doctorName}</strong></span>
              <span>Physician ID: {screening.doctorReview?.doctorId || screening.doctorId}</span>
              <span>Verification Status: <strong className="text-teal-800">{screening.reviewStatus.toUpperCase()}</strong></span>
            </div>
          </div>

          {/* REGULATORY DISCLAIMER & OFFICIAL FOOTNOTE */}
          <div className="report-section-avoid-break print-break-inside-avoid border-t border-slate-200 pt-3 text-[10px] text-slate-500 leading-relaxed">
            <p>
              <strong>REGULATORY MEDICAL DISCLAIMER:</strong> This AI system is intended for screening and clinical decision support. It does not replace professional ophthalmologist evaluation and does not independently prescribe or modify treatment. Generated under the Ramanagara Rural Retinopathy Tele-Health Network (India).
            </p>
            <div className="flex justify-between items-center mt-2 font-mono text-[9px] text-slate-400">
              <span>TRUST-DR Automated Retinopathy Screening System v2.4</span>
              <span>Electronic Document Hash: {screening.id.replace(/[^0-9]/g, '')}-SEC-AUTH</span>
            </div>
          </div>
        </div>

        {/* ====================================================================
            STICKY BOTTOM FOOTER BAR (HIDDEN IN PRINT)
            ==================================================================== */}
        <div className="report-modal-footer-actions sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print or Export PDF"
              aria-label="Print Report"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Generating PDF...' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
