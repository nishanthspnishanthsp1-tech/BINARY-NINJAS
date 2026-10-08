import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Layers,
  Activity,
  History,
} from 'lucide-react';
import { LongitudinalComparison, Patient, ScreeningRecord } from '../../types';
import { storage } from '../../db/storage';

interface LongitudinalComparisonViewProps {
  patient: Patient;
  currentScreening: ScreeningRecord;
  onProceedToDecision: () => void;
}

export const LongitudinalComparisonView: React.FC<LongitudinalComparisonViewProps> = ({
  patient,
  currentScreening,
  onProceedToDecision,
}) => {
  const comparison = storage.getComparisonForScreening(patient.id, currentScreening.id);
  const allPatientScreenings = storage
    .getScreenings(patient.id)
    .sort((a, b) => a.timestamp - b.timestamp);

  const prevScreening = comparison
    ? storage.getScreeningById(comparison.previousScreeningId)
    : null;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-semibold text-teal-700 tracking-wider">
          STEP 4 · LONGITUDINAL TEMPORAL COMPARISON & CHANGE DETECTION
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Previous vs. Current Screening Progression
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Tracking patient history over time prevents undetected disease escalation in diabetic retinopathy.
        </p>
      </div>

      {/* Change Detection Banner (Section 18) */}
      {comparison && comparison.changeStatus === 'progression' ? (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-5 shadow-xs text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-700">
                🔴 PROGRESSION / CHANGE DETECTED
              </span>
              <h3 className="text-lg font-bold text-rose-950">
                Ophthalmologist review is strongly recommended
              </h3>
              <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                {comparison.summaryMessage} Microaneurysm count rose by {comparison.microaneurysmDelta} and new lipid exudates were identified.
              </p>
            </div>
          </div>

          <div className="bg-white/80 border border-rose-200 px-3 py-2 rounded-lg text-xs font-mono shrink-0">
            <span className="text-rose-700 font-bold block">PRIORITY REFERRAL</span>
            <span className="text-slate-600">Within 1–2 Weeks</span>
          </div>
        </div>
      ) : comparison && comparison.changeStatus === 'stable' ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-xs text-emerald-950 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-700">
              🟢 STABLE RETINOPATHY PROFILE
            </span>
            <p className="text-xs text-emerald-900 mt-0.5">
              No significant microvascular change or pathological progression detected across available screening records.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs text-slate-700 flex items-center gap-3">
          <History className="w-6 h-6 text-slate-400 shrink-0" />
          <div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500">
              BASELINE VISIT / NOT ENOUGH COMPARABLE EVIDENCE
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              This is the patient's initial recorded fundus examination. Future screening visits will automatically track progression deltas against this baseline.
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison: Previous Screening vs Current Screening (Section 16) */}
      {comparison && prevScreening && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Side-by-Side Clinical Metric Comparison</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Patient ID: {patient.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Previous Visit Card */}
            <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase block">
                    Previous Screening ({prevScreening.date})
                  </span>
                  <p className="text-sm font-bold text-slate-900">Visit #{prevScreening.visitNumber}</p>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                  {comparison.previousSeverity} DR
                </span>
              </div>

              <div className="aspect-square max-w-[260px] mx-auto rounded-lg overflow-hidden bg-black border border-slate-300">
                <img
                  src={prevScreening.imageUrl}
                  alt="Previous fundus"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100 font-mono">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">DR Severity:</span>
                  <span className="font-bold text-slate-900 capitalize">{comparison.previousSeverity}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Model Confidence:</span>
                  <span className="font-bold text-slate-900">{comparison.previousConfidence}%</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Microaneurysms:</span>
                  <span className="font-bold text-slate-900">
                    {prevScreening.aiResult?.structures.microaneurysms.count || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Lipid Exudates:</span>
                  <span className="font-bold text-slate-900">
                    {prevScreening.aiResult?.structures.exudates.count || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Hemorrhages:</span>
                  <span className="font-bold text-slate-900">
                    {prevScreening.aiResult?.structures.hemorrhages.count || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Image Quality:</span>
                  <span className="font-bold text-slate-900">{prevScreening.quality.overallScore}%</span>
                </div>
              </div>
            </div>

            {/* Current Visit Card */}
            <div className="space-y-4 border-2 border-teal-600 rounded-xl p-4 bg-teal-50/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-teal-700 uppercase font-bold block">
                    Current Screening ({currentScreening.date})
                  </span>
                  <p className="text-sm font-bold text-slate-900">Visit #{currentScreening.visitNumber}</p>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-700 text-white uppercase">
                  {comparison.currentSeverity} DR
                </span>
              </div>

              <div className="aspect-square max-w-[260px] mx-auto rounded-lg overflow-hidden bg-black border border-teal-300">
                <img
                  src={currentScreening.imageUrl}
                  alt="Current fundus"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-xs divide-y divide-teal-100 font-mono">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">DR Severity:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {comparison.currentSeverity}
                    {comparison.changeStatus === 'progression' && (
                      <span className="text-rose-600 ml-1.5 font-bold">▲ Progression</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Model Confidence:</span>
                  <span className="font-bold text-slate-900">{comparison.currentConfidence}%</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Microaneurysms:</span>
                  <span className="font-bold text-slate-900">
                    {currentScreening.aiResult?.structures.microaneurysms.count || 0}
                    {comparison.microaneurysmDelta > 0 && (
                      <span className="text-amber-600 ml-1.5 font-bold">
                        (+{comparison.microaneurysmDelta})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Lipid Exudates:</span>
                  <span className="font-bold text-slate-900">
                    {currentScreening.aiResult?.structures.exudates.count || 0}
                    {comparison.exudateDelta > 0 && (
                      <span className="text-amber-600 ml-1.5 font-bold">
                        (+{comparison.exudateDelta})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Hemorrhages:</span>
                  <span className="font-bold text-slate-900">
                    {currentScreening.aiResult?.structures.hemorrhages.count || 0}
                    {comparison.hemorrhageDelta > 0 && (
                      <span className="text-rose-600 ml-1.5 font-bold">
                        (+{comparison.hemorrhageDelta})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Image Quality:</span>
                  <span className="font-bold text-slate-900">{currentScreening.quality.overallScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphical Comparison: DR Severity Over Time (Section 17) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Longitudinal DR Severity Over Time</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualizing disease stage progression across documented visits
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {allPatientScreenings.length} Total Visits Recorded
          </span>
        </div>

        {/* Timeline SVG Chart */}
        <div className="py-4">
          <div className="relative border-b border-slate-200 pb-8 pt-4">
            {/* Axis Labels */}
            <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase mb-4">
              <span>Visit 1 (Baseline)</span>
              {allPatientScreenings.length > 2 && <span>Intermediate Visits</span>}
              <span>Current Visit</span>
            </div>

            {/* Visit Points Connected */}
            <div className="flex items-center justify-between relative px-6">
              {/* Connecting line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>

              {allPatientScreenings.map((sc, i) => {
                const isCurrent = sc.id === currentScreening.id;
                const sev = sc.aiResult?.severity || 'healthy';

                let dotBg = 'bg-emerald-600';
                if (sev === 'mild') dotBg = 'bg-amber-500';
                if (sev === 'moderate') dotBg = 'bg-orange-600';
                if (sev === 'severe') dotBg = 'bg-rose-600';

                return (
                  <div key={sc.id} className="relative z-10 flex flex-col items-center group">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono transition-transform group-hover:scale-110 ${dotBg} ${
                        isCurrent ? 'ring-4 ring-teal-200 shadow-md' : ''
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-800 mt-2">
                      {sc.date}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {sev} DR
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Proceed Action */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-end">
          <button
            onClick={onProceedToDecision}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <span>Proceed to Doctor Final Decision</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
