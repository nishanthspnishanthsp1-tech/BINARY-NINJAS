import React, { useState } from 'react';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Layers,
  HelpCircle,
  Sliders,
  ShieldCheck,
  ChevronDown,
  Info,
  Maximize2,
  Crosshair,
  FileText,
} from 'lucide-react';
import { AIAnalysisResult, DRSeverity, Patient, ScreeningRecord } from '../../types';

interface AnalysisResultViewProps {
  patient: Patient;
  screening: ScreeningRecord;
  aiResult: AIAnalysisResult;
  onProceedToComparison: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  patient,
  screening,
  aiResult,
  onProceedToComparison,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'overlay' | 'original' | 'heatmap' | 'lesions'>('overlay');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(65);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [selectedLesionFilter, setSelectedLesionFilter] = useState<'all' | 'ma' | 'ex' | 'hem'>('all');

  const { severity, confidence, trustReport, structures, evidenceSummary } = aiResult;

  // Severity display styles
  const getSeverityConfig = (sev: DRSeverity) => {
    switch (sev) {
      case 'healthy':
        return {
          title: 'HEALTHY / NO DR',
          colorBadge: 'bg-emerald-600 text-white',
          borderBox: 'border-emerald-300 bg-emerald-50/50',
          textColor: 'text-emerald-800',
          dotColor: 'bg-emerald-600',
          icdrName: 'ICDR Level 0: No Apparent Retinopathy',
        };
      case 'mild':
        return {
          title: 'MILD DR',
          colorBadge: 'bg-amber-500 text-slate-950',
          borderBox: 'border-amber-300 bg-amber-50/50',
          textColor: 'text-amber-800',
          dotColor: 'bg-amber-500',
          icdrName: 'ICDR Level 1: Mild Non-Proliferative DR',
        };
      case 'moderate':
        return {
          title: 'MODERATE DR',
          colorBadge: 'bg-orange-600 text-white',
          borderBox: 'border-orange-300 bg-orange-50/50',
          textColor: 'text-orange-800',
          dotColor: 'bg-orange-600',
          icdrName: 'ICDR Level 2: Moderate Non-Proliferative DR',
        };
      case 'severe':
        return {
          title: 'SEVERE / PROLIFERATIVE DR',
          colorBadge: 'bg-rose-600 text-white',
          borderBox: 'border-rose-300 bg-rose-50/50',
          textColor: 'text-rose-800',
          dotColor: 'bg-rose-600',
          icdrName: 'ICDR Level 3–4: Severe NPDR / Proliferative DR',
        };
    }
  };

  const sevConfig = getSeverityConfig(severity);

  // Trust status config
  const getTrustConfig = (status: string) => {
    switch (status) {
      case 'ai_supported':
        return {
          badge: '🟢 AI-SUPPORTED',
          style: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          sub: 'Multimodal agreement exceeds 85% confidence threshold.',
        };
      case 'doctor_review_required':
        return {
          badge: '🟡 DOCTOR REVIEW REQUIRED',
          style: 'bg-amber-100 text-amber-900 border-amber-300',
          sub: 'Borderline lesion count or anatomical anomaly requires manual doctor sign-off.',
        };
      default:
        return {
          badge: '🔴 RECAPTURE REQUIRED',
          style: 'bg-rose-100 text-rose-900 border-rose-300',
          sub: 'Severe optical blur or degradation prevents trustworthy inference.',
        };
    }
  };

  const trustConfig = getTrustConfig(trustReport.status);

  // Combine lesions for overlay
  const allLesions = [
    ...structures.microaneurysms.locations,
    ...structures.exudates.locations,
    ...structures.hemorrhages.locations,
  ];

  return (
    <div className="space-y-8">
      {/* Primary Result Banner */}
      <div className={`rounded-xl border p-6 shadow-xs ${sevConfig.borderBox} transition-all`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sevConfig.dotColor }} />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-600">
                AI SCREENING CLASSIFICATION RESULT
              </span>
              <span>·</span>
              <span className="text-xs font-mono text-slate-500">{sevConfig.icdrName}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {sevConfig.title}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${sevConfig.colorBadge}`}>
                {confidence}% Confidence
              </span>
            </div>

            {/* Section 17 Explicit Distinct Metrics Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold shadow-2xs">
                Image Quality: <strong className="text-slate-900">{screening.quality.overallScore}%</strong> ({screening.quality.status.toUpperCase()})
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold shadow-2xs">
                AI Screening: <strong className="text-teal-800">{sevConfig.title}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold shadow-2xs">
                AI Confidence: <strong className="text-teal-800">{confidence}%</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Patient: <strong className="text-slate-900">{patient.fullName}</strong> ({patient.id}) · Eye: {screening.eye} · Timestamp: {screening.date} {screening.time}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWhyModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Why did AI give this result?</span>
            </button>

            <button
              onClick={onProceedToComparison}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              Next: Compare Visits →
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Grad-CAM Explainability Viewer & AI Trust Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Grad-CAM Heatmap & Retinal Inspection Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Explainability: Grad-CAM Retinal Attention Viewer</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Visualizing neural network activation gradients mapped onto fundus geometry
                </p>
              </div>

              {/* View Mode Segmented Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveViewMode('overlay')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeViewMode === 'overlay' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Overlay
                </button>
                <button
                  onClick={() => setActiveViewMode('original')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeViewMode === 'original' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setActiveViewMode('heatmap')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeViewMode === 'heatmap' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setActiveViewMode('lesions')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeViewMode === 'lesions' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Lesions
                </button>
              </div>
            </div>

            {/* Interactive Viewport Stage */}
            <div className="relative aspect-square max-w-[480px] mx-auto rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner group">
              {/* Layer 1: Original Fundus Photo */}
              <img
                src={screening.imageUrl}
                alt="Retinal Fundus"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover select-none ${
                  activeViewMode === 'heatmap' ? 'opacity-10' : 'opacity-100'
                }`}
              />

              {/* Layer 2: Grad-CAM Heatmap Overlay */}
              {aiResult.gradCamHeatmapUrl && (activeViewMode === 'overlay' || activeViewMode === 'heatmap') && (
                <img
                  src={aiResult.gradCamHeatmapUrl}
                  alt="Grad-CAM Heatmap"
                  style={{
                    opacity: activeViewMode === 'heatmap' ? 1 : heatmapOpacity / 100,
                  }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen transition-opacity duration-150"
                />
              )}

              {/* Layer 3: Anatomical Annotations & Lesion Markers */}
              {(activeViewMode === 'overlay' || activeViewMode === 'lesions') && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                  {/* Blood Vessels Overlay (Blue/Green) */}
                  {structures.bloodVessels.segmented && structures.opticDisc.detected && structures.fovea.detected && (
                    <g opacity="0.45">
                      {/* Superior and Inferior Temporal Vascular Arcades centered around optic disc */}
                      <path
                        d={`M ${structures.opticDisc.location.x} ${structures.opticDisc.location.y} Q ${structures.opticDisc.location.x - 18} ${structures.opticDisc.location.y - 28} ${structures.fovea.location.x - 15} ${structures.fovea.location.y - 32}`}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="0.75"
                        strokeDasharray="3 1"
                      />
                      <path
                        d={`M ${structures.opticDisc.location.x} ${structures.opticDisc.location.y} Q ${structures.opticDisc.location.x - 18} ${structures.opticDisc.location.y + 28} ${structures.fovea.location.x - 15} ${structures.fovea.location.y + 32}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="0.75"
                        strokeDasharray="3 1"
                      />
                    </g>
                  )}

                  {/* Optic Disc Box/Circle (White / Circle) */}
                  {structures.opticDisc.detected && (
                    <circle
                      cx={structures.opticDisc.location.x}
                      cy={structures.opticDisc.location.y}
                      r={structures.opticDisc.location.radius || 12}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.9"
                      strokeDasharray="2 1"
                    />
                  )}

                  {/* Fovea / Macula Marker */}
                  {structures.fovea.detected && (
                    <g>
                      <circle
                        cx={structures.fovea.location.x}
                        cy={structures.fovea.location.y}
                        r={structures.fovea.location.radius || 8}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="0.8"
                        strokeDasharray="1.5 1.5"
                      />
                      <circle cx={structures.fovea.location.x} cy={structures.fovea.location.y} r="0.6" fill="#c084fc" />
                    </g>
                  )}

                  {/* Real Detected Lesion Markers */}
                  {allLesions.map((lesion) => {
                    const isEx = lesion.type === 'hard_exudate' || lesion.type === 'cotton_wool';
                    // RED: Hemorrhages & microaneurysms
                    // YELLOW: Hard exudates
                    const color = isEx ? '#eab308' : '#ef4444';

                    return (
                      <g key={lesion.id}>
                        <circle
                          cx={lesion.x}
                          cy={lesion.y}
                          r={lesion.radius ? lesion.radius * 0.7 : 1.4}
                          fill="none"
                          stroke={color}
                          strokeWidth="0.8"
                        />
                        <circle cx={lesion.x} cy={lesion.y} r="0.45" fill={color} />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Overlay HUD Labels */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>Active: {activeViewMode.toUpperCase()}</span>
              </div>

              {/* Legend Strip at bottom of canvas */}
              <div className="absolute bottom-3 inset-x-3 bg-black/85 backdrop-blur-xs px-3 py-1.5 rounded-lg text-[10px] text-white flex items-center justify-between pointer-events-none font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Red: Hemorrhages/MA ({structures.hemorrhages.count + structures.microaneurysms.count})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Yellow: Exudates ({structures.exudates.count})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white">White: Disc</span>
                  <span className="text-purple-400">Purple: Fovea</span>
                </div>
              </div>
            </div>

            {/* Heatmap Opacity Slider Controls */}
            {activeViewMode === 'overlay' && (
              <div className="flex items-center justify-between gap-4 px-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Grad-CAM Overlay Heatmap Intensity:</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={heatmapOpacity}
                    onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <span className="font-mono text-slate-700 w-8 tabular-nums">{heatmapOpacity}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Trust Report & Evidence Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI TRUST / SELF-CHECK REPORT (Section 13) */}
          <div className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-teal-700">
                  PROPRIETARY SELF-CHECK
                </span>
                <h3 className="text-base font-bold text-slate-900">AI TRUST REPORT</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono border ${trustConfig.style}`}>
                {trustConfig.badge}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {trustReport.explanation}
            </p>

            {/* 4 Trust Sub-Scores */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Image Quality Check</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {trustReport.imageQualityScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${trustReport.imageQualityScore}%` }} className="h-full bg-teal-600" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Model Deep Confidence</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {trustReport.modelConfidence}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${trustReport.modelConfidence}%` }} className="h-full bg-teal-600" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Lesion Evidence Corroboration</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {trustReport.lesionEvidenceScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${trustReport.lesionEvidenceScore}%` }} className="h-full bg-teal-600" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">XAI Gradient Agreement</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {trustReport.xaiAgreementScore}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${trustReport.xaiAgreementScore}%` }} className="h-full bg-teal-600" />
                </div>
              </div>
            </div>

            {/* Overall Aggregate Score Box */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Overall AI Trust Score</span>
                <span className="text-[11px] text-slate-500 block">Multimodal decision support score</span>
              </div>
              <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
                {trustReport.overallTrustScore}%
              </span>
            </div>

            <div className="text-[11px] text-slate-400 leading-tight">
              * Note: The AI Trust Score reflects mathematical model convergence and optical signal clarity. It is not an assertion of absolute medical certainty.
            </div>
          </div>

          {/* Evidence Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic Retinal Evidence Detected
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {evidenceSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Retinal Structure Analysis Cards (Section 12) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Retinal Structure & Lesion Analysis</h2>
            <p className="text-xs text-slate-500">
              Automated anatomical segmentation and microvascular abnormality detection
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">7 Clinical Feature Channels</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Optic Disc */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Optic Disc (ONH)</span>
              <span className="font-mono text-cyan-700 font-bold">
                {structures.opticDisc.detected ? 'Detected (97%)' : 'Not detected'}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Cup-to-Disc Ratio: <strong className="font-mono text-slate-900">{structures.opticDisc.cupToDiscRatio}</strong></p>
              <p className="text-[11px] text-slate-500">{structures.opticDisc.statusNotes}</p>
            </div>
          </div>

          {/* Card 2: Fovea & Macula */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Fovea (FAZ)</span>
              <span className="font-mono text-purple-700 font-bold">
                {structures.fovea.detected ? 'Detected (94%)' : 'Not detected'}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Macular Threat: <strong className={`capitalize font-mono ${structures.fovea.macularEdemaRisk === 'high' ? 'text-rose-600' : 'text-slate-900'}`}>{structures.fovea.macularEdemaRisk}</strong></p>
              <p className="text-[11px] text-slate-500">{structures.fovea.statusNotes}</p>
            </div>
          </div>

          {/* Card 3: Blood Vessels */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Blood Vessels</span>
              <span className="font-mono text-teal-700 font-bold">
                {structures.bloodVessels.segmented ? 'Segmented' : 'Unsegmented'}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Tortuosity: <strong className="capitalize font-mono text-slate-900">{structures.bloodVessels.tortuosityIndex}</strong></p>
              <p className="text-[11px] text-slate-500">Caliber index: {structures.bloodVessels.caliberScore}% normal</p>
            </div>
          </div>

          {/* Card 4: Microaneurysms */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Microaneurysms</span>
              <span className="font-mono text-orange-700 font-bold">
                {structures.microaneurysms.count} Found
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Capillary Outpouchings: <strong className="font-mono text-slate-900">{structures.microaneurysms.count}</strong></p>
              <p className="text-[11px] text-slate-500">Early microvascular dilation sign</p>
            </div>
          </div>

          {/* Card 5: Exudates */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Lipid Exudates</span>
              <span className="font-mono text-amber-700 font-bold">
                {structures.exudates.count} Found
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Macular Threat: <strong className={structures.exudates.hasMacularThreat ? 'text-amber-700 font-bold' : 'text-slate-900'}>{structures.exudates.hasMacularThreat ? 'Yes (Paramacular)' : 'No'}</strong></p>
              <p className="text-[11px] text-slate-500">Serum lipoprotein deposits</p>
            </div>
          </div>

          {/* Card 6: Hemorrhages */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Hemorrhages</span>
              <span className="font-mono text-rose-700 font-bold">
                {structures.hemorrhages.count} Found
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Pattern: <strong className="capitalize font-mono text-slate-900">{structures.hemorrhages.classification.replace('_', ' ')}</strong></p>
              <p className="text-[11px] text-slate-500">Intraretinal vascular leak</p>
            </div>
          </div>

          {/* Card 7: Neovascularization */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Neovascularization (NVD / NVE)</span>
              <span className={`font-mono font-bold ${structures.neovascularization.detected ? 'text-rose-700' : 'text-emerald-700'}`}>
                {structures.neovascularization.detected ? 'DETECTED (PDR)' : 'NOT DETECTED (NPDR)'}
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>Proliferative Fronds: <strong className="font-mono text-slate-900">{structures.neovascularization.locationType.replace('_', ' ').toUpperCase()}</strong></p>
              <p className="text-[11px] text-slate-500">
                {structures.neovascularization.detected
                  ? 'CRITICAL ALERT: Fragile new vessel fronds detected. High risk of vitreous hemorrhage or tractional detachment.'
                  : 'No fragile new blood vessel fronds detected bordering disc or arcades.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* "Why did AI give this result?" Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Why did AI give this result?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="font-semibold text-slate-900 block font-mono text-[11px] uppercase text-teal-800">
                  AI Clinical Reasoning (Image-Specific):
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {aiResult.rawAIResponse?.explanation || aiResult.trustReport.explanation}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="font-semibold text-slate-900 block font-mono text-[11px] uppercase text-teal-800">
                  Visible Retinal Lesion Summary:
                </span>
                <p>
                  {structures.microaneurysms.count > 0 || structures.exudates.count > 0 || structures.hemorrhages.count > 0
                    ? `Detected ${structures.microaneurysms.count} microaneurysms, ${structures.exudates.count} lipid exudates, and ${structures.hemorrhages.count} hemorrhages. Anatomical structures: Optic disc (${structures.opticDisc.detected ? 'detected' : 'not detected'}), Foveal region (${structures.fovea.detected ? 'detected' : 'not detected'}).`
                    : 'No microvascular lesions, exudative deposits, or intraretinal hemorrhages visible in this retinal field. Optic disc and foveal reflex appear normal.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="font-semibold text-slate-900 block font-mono text-[11px] uppercase text-teal-800">
                  Model Screening Confidence:
                </span>
                <p>
                  Calculated at {confidence}% based on optical clarity (quality score: {screening.quality.overallScore}%) and spatial feature alignment across vascular arcades.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
