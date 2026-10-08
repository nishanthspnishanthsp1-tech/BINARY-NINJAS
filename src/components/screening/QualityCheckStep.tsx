import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw, ArrowRight, CameraOff, AlertOctagon } from 'lucide-react';
import { ImageQualityMetrics, RawAIResponse } from '../../types';

interface QualityCheckStepProps {
  imageUrl: string;
  quality: ImageQualityMetrics;
  rawAI?: RawAIResponse;
  onProceedToAI: () => void;
  onRecapture: () => void;
}

export const QualityCheckStep: React.FC<QualityCheckStepProps> = ({
  imageUrl,
  quality,
  rawAI,
  onProceedToAI,
  onRecapture,
}) => {
  const isImageValid = rawAI ? rawAI.image_valid : quality.status !== 'unusable';
  const isQualityAcceptable = isImageValid && (quality.status === 'good' || quality.status === 'excellent' || quality.status === 'acceptable') && quality.overallScore >= 55;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-semibold text-teal-700 tracking-wider">
          STEP 2 · PRE-SCREENING RETINAL IMAGE VALIDATION
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Image Content & Optical Quality Gate
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          AI vision models must verify that the upload is a genuine fundus photograph and passes optical screening criteria.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* CASE 1: REJECTED - NOT A FUNDUS PHOTOGRAPH */}
        {!isImageValid ? (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border-2 border-rose-500 bg-rose-50/80 text-rose-950 flex flex-col sm:flex-row items-start gap-4">
              <CameraOff className="w-10 h-10 text-rose-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-700 block">
                    VALIDATION FAILED · NON-RETINAL IMAGE DETECTED
                  </span>
                  <h3 className="text-xl font-extrabold text-rose-950 mt-0.5">
                    Retinal Image Not Suitable
                  </h3>
                </div>
                <p className="text-sm text-rose-900 font-medium leading-relaxed">
                  Please retake the image using a fundus/retinal camera. A normal camera photograph cannot be used for diabetic retinopathy screening.
                </p>
              </div>
            </div>

            {/* Rejection Details & Image Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden bg-black border-2 border-rose-300 shadow-xs">
                <img
                  src={imageUrl}
                  alt="Rejected upload"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] flex items-center justify-center p-4 text-center">
                  <span className="bg-rose-700 text-white font-mono text-xs font-bold px-3 py-1.5 rounded shadow">
                    REJECTED: NON-RETINAL
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block font-mono">
                    Detection Reason:
                  </span>
                  <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                    "{rawAI?.rejection_reason || quality.reasons[0] || 'No retinal structures detected. The image appears to be a normal photograph rather than a fundus camera capture.'}"
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal pt-1 border-t border-slate-200">
                    The AI vision system identified non-fundus attributes (lack of retinal circular field, absence of branching retinal vasculature, or external facial/eyelid structures).
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Clinical Safety Requirement:</strong> The system will not generate a diabetic retinopathy report from a non-retinal image to prevent misleading diagnostic output.
                </div>
              </div>
            </div>

            {/* Retake Button (Proceed button is strictly hidden/prohibited) */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Analysis blocked: Invalid image</span>
              <button
                onClick={onRecapture}
                className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
            </div>
          </div>
        ) : !isQualityAcceptable ? (
          /* CASE 2: REJECTED - IMAGE QUALITY TOO LOW (BELOW THRESHOLD) */
          <div className="space-y-6">
            <div className="p-5 rounded-xl border-2 border-amber-500 bg-amber-50/80 text-amber-950 flex flex-col sm:flex-row items-start gap-4">
              <AlertOctagon className="w-10 h-10 text-amber-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-800 block">
                    OPTICAL QUALITY CHECK FAILED ({quality.overallScore}%)
                  </span>
                  <h3 className="text-xl font-extrabold text-amber-950 mt-0.5">
                    Image Quality Too Low
                  </h3>
                </div>
                <p className="text-sm text-amber-900 font-medium leading-relaxed">
                  Please retake the image using a fundus/retinal camera.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden bg-black border-2 border-amber-300 shadow-xs">
                <img
                  src={imageUrl}
                  alt="Low quality fundus"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs text-amber-300 text-xs p-2 rounded font-mono text-center">
                  Score: {quality.overallScore}% — Status: {quality.status.toUpperCase()}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block font-mono">
                  Optical Defect Diagnostics:
                </span>
                <ul className="space-y-1.5 text-xs text-amber-900 bg-amber-50/60 p-3.5 rounded-lg border border-amber-200">
                  {quality.reasons.length > 0 ? (
                    quality.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Blur and poor illumination obscure paramacular capillary networks.</span>
                    </li>
                  )}
                </ul>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Screening accuracy is compromised when images are blurred or underexposed. The system enforces minimum clarity standards before DR grading.
                </p>
              </div>
            </div>

            {/* Retake Button (Proceed button is strictly hidden/prohibited) */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Quality below threshold: Recapture required</span>
              <button
                onClick={onRecapture}
                className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>
            </div>
          </div>
        ) : (
          /* CASE 3: ACCEPTED - VALID RETINAL FUNDUS WITH ACCEPTABLE QUALITY */
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">
                    Image Quality: {quality.overallScore}% — {quality.status.toUpperCase()}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Authentic retinal fundus photograph verified. Focus and contrast meet clinical screening criteria.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                  {quality.overallScore}%
                </span>
                <span className="text-[11px] text-slate-500 block">Gradability Index</span>
              </div>
            </div>

            {/* Fundus Preview & Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs">
                <img
                  src={imageUrl}
                  alt="Gradable fundus"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[11px] p-2 rounded-lg font-mono flex items-center justify-between">
                  <span>Optic Disc & Fovea</span>
                  <span className="text-teal-400 font-semibold">{rawAI?.anatomy.optic_disc.detected ? 'Visible' : 'Partial'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  Optical Channels Assessment
                </h4>

                {/* Focus / Blur */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Focus & Sharpness</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {quality.focusBlurScore}% ({rawAI?.image_quality.blur || 'Low'} Blur)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${quality.focusBlurScore}%` }} className="h-full bg-emerald-600" />
                  </div>
                </div>

                {/* Illumination & Brightness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Illumination & Exposure</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {quality.illuminationScore}% ({rawAI?.image_quality.illumination || 'Good'})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${quality.illuminationScore}%` }} className="h-full bg-emerald-600" />
                  </div>
                </div>

                {/* Field of View */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Field of View</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {quality.fieldOfViewScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${quality.fieldOfViewScore}%` }} className="h-full bg-emerald-600" />
                  </div>
                </div>

                {/* Centering */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Disc & Fovea Centering</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {quality.centeringScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${quality.centeringScore}%` }} className="h-full bg-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
              <button
                onClick={onRecapture}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-upload / Change Image</span>
              </button>

              <button
                onClick={onProceedToAI}
                className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Proceed to AI DR Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
