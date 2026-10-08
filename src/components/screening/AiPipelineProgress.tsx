import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Brain, Cpu, ShieldCheck } from 'lucide-react';

interface AiPipelineProgressProps {
  onComplete: () => void;
}

const STAGES = [
  { id: 1, name: 'Image Quality Assessment', detail: 'Evaluating optical sharpness and SNR' },
  { id: 2, name: 'DR Grading Classification', detail: 'Deep convolutional feature extraction' },
  { id: 3, name: 'Grad-CAM Explainability', detail: 'Backpropagating gradients to visual layer' },
  { id: 4, name: 'Optic Disc Localization', detail: 'Detecting neuroretinal rim and CDR' },
  { id: 5, name: 'Fovea Localization', detail: 'Demarcating foveal avascular zone (FAZ)' },
  { id: 6, name: 'Blood Vessel Segmentation', detail: 'Extracting arteriolar/venular arcade mask' },
  { id: 7, name: 'Microaneurysm Detection', detail: 'Scanning red dots & capillary outpouchings' },
  { id: 8, name: 'Exudate Segmentation', detail: 'Differentiating hard lipid from soft exudates' },
  { id: 9, name: 'Hemorrhage Classification', detail: 'Classifying flame vs dot-and-blot lesions' },
  { id: 10, name: 'Neovascularization Detection', detail: 'Screening NVD/NVE vessel fronds' },
  { id: 11, name: 'Evidence Aggregation', detail: 'Cross-verifying lesion spatial density' },
  { id: 12, name: 'AI Confidence & Trust Analysis', detail: 'Computing multimodal self-check index' },
];

export const AiPipelineProgress: React.FC<AiPipelineProgressProps> = ({ onComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(interval);
  }, [onComplete]);

  const progressPercent = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-semibold text-teal-700 tracking-wider flex items-center justify-center gap-1.5">
          <Brain className="w-3.5 h-3.5" />
          <span>DEEP RETINAL ANALYSIS PIPELINE IN PROGRESS</span>
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Explainable DR Inference & Lesion Extraction
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Executing 12-stage multi-task diagnostic network with Grad-CAM activation mapping and self-check verification.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* Progress Bar & Counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              Stage {currentStageIndex + 1} of {STAGES.length}: {STAGES[currentStageIndex].name}
            </span>
            <span className="text-teal-700 font-bold tabular-nums">{progressPercent}%</span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-teal-600 transition-all duration-200 ease-out"
            />
          </div>
        </div>

        {/* 12 Stages Visual List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-slate-100 bg-white text-slate-400 opacity-60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center font-mono text-[9px]">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`font-semibold truncate ${
                      isCurrent ? 'text-teal-950 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {stage.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{stage.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400 font-mono">
            Optimized for edge inference in rural primary care units
          </p>
        </div>
      </div>
    </div>
  );
};
