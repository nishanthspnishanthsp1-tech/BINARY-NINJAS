import React, { useState, useEffect } from 'react';
import { Patient, ScreeningRecord, Doctor, DoctorDecisionRecord, ImageQualityMetrics, AIAnalysisResult, RawAIResponse } from '../../types';
import { storage } from '../../db/storage';
import { AIAnalysisEngine } from '../../services/aiAnalysisEngine';
import { PatientIdentificationStep } from './PatientIdentificationStep';
import { FundusCaptureUploadStep } from './FundusCaptureUploadStep';
import { QualityCheckStep } from './QualityCheckStep';
import { AiPipelineProgress } from './AiPipelineProgress';
import { AnalysisResultView } from './AnalysisResultView';
import { LongitudinalComparisonView } from './LongitudinalComparisonView';
import { DoctorDecisionView } from './DoctorDecisionView';
import { Loader2, ShieldCheck, Eye, AlertTriangle } from 'lucide-react';

interface NewScreeningFlowProps {
  doctor: Doctor;
  initialPatientId?: string;
  onOpenRegisterModal: () => void;
  onViewReport: (screeningId: string) => void;
  onCompleted: () => void;
}

type ScreeningStep =
  | 'identify'
  | 'capture'
  | 'validating'
  | 'quality'
  | 'pipeline'
  | 'result'
  | 'compare'
  | 'decision'
  | 'error';

export const NewScreeningFlow: React.FC<NewScreeningFlowProps> = ({
  doctor,
  initialPatientId,
  onOpenRegisterModal,
  onViewReport,
  onCompleted,
}) => {
  const [step, setStep] = useState<ScreeningStep>('identify');
  const [patient, setPatient] = useState<Patient | null>(null);

  // Screening session data
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageSource, setImageSource] = useState<'fundus_camera' | 'upload_file' | 'demo_sample'>('demo_sample');
  const [eye, setEye] = useState<'OD' | 'OS'>('OD');
  const [qualityMetrics, setQualityMetrics] = useState<ImageQualityMetrics | null>(null);
  const [rawAI, setRawAI] = useState<RawAIResponse | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [currentScreening, setCurrentScreening] = useState<ScreeningRecord | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('Analyzing new retinal image...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if initial patient ID was passed (e.g. from dashboard follow-up click) or active session patient
  useEffect(() => {
    const targetId = initialPatientId || storage.getCurrentSessionPatientId();
    if (targetId) {
      const p = storage.getPatientById(targetId);
      if (p) {
        setPatient(p);
        setStep('capture');
      }
    }
  }, [initialPatientId]);

  // Step 1: Patient confirmed
  const handlePatientConfirmed = (p: Patient) => {
    setPatient(p);
    storage.setCurrentSessionPatientId(p.id);
    setStep('capture');
  };

  // Step 2: Image captured/uploaded -> Trigger AI validation
  const handleImageReady = async (data: {
    imageUrl: string;
    imageSource: 'fundus_camera' | 'upload_file' | 'demo_sample';
    eye: 'OD' | 'OS';
    timestamp: number;
    formattedDate: string;
    formattedTime: string;
  }) => {
    // Immediately clear all previous analysis state to prevent reuse
    setQualityMetrics(null);
    setRawAI(null);
    setAiResult(null);
    setCurrentScreening(null);
    setErrorMessage(null);

    setImageUrl(data.imageUrl);
    setImageSource(data.imageSource);
    setEye(data.eye);
    setStep('validating');
    setValidationMessage('Analyzing new retinal image...');

    try {
      // Execute vision AI analysis on the actual image
      const { raw, result } = await AIAnalysisEngine.analyzeRetinalImage(data.imageUrl, {
        patientName: patient?.fullName,
        eye: data.eye,
      });

      const q = AIAnalysisEngine.extractQualityMetrics(raw);

      setRawAI(raw);
      setQualityMetrics(q);
      setAiResult(result);
      setStep('quality');
    } catch (err: any) {
      console.error('Validation error:', err);
      setErrorMessage(err?.message || 'AI analysis could not be completed. Please try again.');
      setStep('error');
    }
  };

  // Step 3 -> 4: Quality passed, execute AI pipeline
  const handleProceedToAI = () => {
    setStep('pipeline');
  };

  // Step 4 complete: AI pipeline done -> Save screening record
  const handlePipelineComplete = () => {
    if (!patient || !qualityMetrics || !aiResult) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Build and save initial screening record
    const screeningRecord: ScreeningRecord = {
      id: storage.generateNextScreeningId(),
      imageId: aiResult.imageId,
      patientId: patient.id,
      visitNumber: (patient.screeningCount || 0) + 1,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      eye,
      doctorName: doctor.name,
      doctorId: doctor.id,
      imageSource,
      imageUrl,
      imageValid: aiResult.imageValid,
      rejectionReason: aiResult.rejectionReason,
      quality: qualityMetrics,
      aiResult: aiResult,
      reviewStatus: 'pending_review',
      isRecaptureNeeded: qualityMetrics.status === 'poor' || qualityMetrics.status === 'unusable',
    };

    const saved = storage.saveScreening(screeningRecord);
    setCurrentScreening(saved);
    setStep('result');
  };

  // Step 5 -> 6: Proceed to Comparison
  const handleProceedToComparison = () => {
    setStep('compare');
  };

  // Step 6 -> 7: Proceed to Doctor Decision
  const handleProceedToDecision = () => {
    setStep('decision');
  };

  // Step 7: Doctor Decision Saved
  const handleSaveDecision = (decision: DoctorDecisionRecord) => {
    if (!currentScreening) return;

    const updated: ScreeningRecord = {
      ...currentScreening,
      doctorReview: decision,
      reviewStatus:
        decision.decision === 'modify_management'
          ? 'modified_by_doctor'
          : decision.decision === 'refer_to_specialist'
          ? 'referred'
          : 'confirmed_by_doctor',
    };

    storage.saveScreening(updated);
    setCurrentScreening(updated);
  };

  const handleRecapture = () => {
    setQualityMetrics(null);
    setRawAI(null);
    setAiResult(null);
    setCurrentScreening(null);
    setStep('capture');
  };

  const handleChangePatient = () => {
    setPatient(null);
    setStep('identify');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workflow Navigation Progress Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'identify'
                  ? 'bg-teal-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-800">Identify Patient</span>
          </div>

          <span className="text-slate-300 font-mono">―</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'capture'
                  ? 'bg-teal-700 text-white'
                  : step === 'identify'
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-800">Capture Fundus</span>
          </div>

          <span className="text-slate-300 font-mono">―</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'quality' || step === 'validating'
                  ? 'bg-teal-700 text-white'
                  : ['identify', 'capture'].includes(step)
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-800">Quality Check</span>
          </div>

          <span className="text-slate-300 font-mono">―</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'pipeline' || step === 'result'
                  ? 'bg-teal-700 text-white'
                  : ['identify', 'capture', 'quality', 'validating'].includes(step)
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              4
            </span>
            <span className="text-xs font-semibold text-slate-800">AI Grading</span>
          </div>

          <span className="text-slate-300 font-mono">―</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'compare'
                  ? 'bg-teal-700 text-white'
                  : ['decision'].includes(step)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              5
            </span>
            <span className="text-xs font-semibold text-slate-800">Compare Visits</span>
          </div>

          <span className="text-slate-300 font-mono">―</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 'decision'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              6
            </span>
            <span className="text-xs font-semibold text-slate-800">Doctor Decision</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Identify Patient */}
      {step === 'identify' && (
        <PatientIdentificationStep
          onPatientConfirmed={handlePatientConfirmed}
          onOpenRegisterModal={onOpenRegisterModal}
        />
      )}

      {/* STEP 2: Capture / Upload Fundus */}
      {step === 'capture' && patient && (
        <FundusCaptureUploadStep
          patient={patient}
          onImageReady={handleImageReady}
          onChangePatient={handleChangePatient}
        />
      )}

      {/* STEP 2.5: Validating Spinner */}
      {step === 'validating' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Validating Retinal Image</h3>
            <p className="text-xs text-slate-500 mt-1">{validationMessage}</p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded">
            Executing multimodal vision AI on uploaded retinal frame
          </div>
        </div>
      )}

      {/* ERROR STEP: AI Analysis Failed */}
      {step === 'error' && (
        <div className="max-w-md mx-auto bg-white border border-rose-200 rounded-xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Analysis Failed</h3>
            <p className="text-xs text-rose-700 font-medium mt-1">
              {errorMessage || 'AI analysis could not be completed. Please try again.'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            The image could not be processed by the AI vision model. Please verify the image file and retry.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setErrorMessage(null);
                setStep('capture');
              }}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Quality Check & Image Validation Gate */}
      {step === 'quality' && qualityMetrics && (
        <QualityCheckStep
          imageUrl={imageUrl}
          quality={qualityMetrics}
          rawAI={rawAI || undefined}
          onProceedToAI={handleProceedToAI}
          onRecapture={handleRecapture}
        />
      )}

      {/* STEP 4: AI Analysis Pipeline Progress Animation */}
      {step === 'pipeline' && (
        <AiPipelineProgress onComplete={handlePipelineComplete} />
      )}

      {/* STEP 5: AI DR Result & Explainability */}
      {step === 'result' && patient && currentScreening && aiResult && (
        <AnalysisResultView
          patient={patient}
          screening={currentScreening}
          aiResult={aiResult}
          onProceedToComparison={handleProceedToComparison}
        />
      )}

      {/* STEP 6: Longitudinal Comparison */}
      {step === 'compare' && patient && currentScreening && (
        <LongitudinalComparisonView
          patient={patient}
          currentScreening={currentScreening}
          onProceedToDecision={handleProceedToDecision}
        />
      )}

      {/* STEP 7: Doctor Decision */}
      {step === 'decision' && patient && currentScreening && (
        <DoctorDecisionView
          patient={patient}
          screening={currentScreening}
          doctor={doctor}
          onSaveDecision={handleSaveDecision}
          onViewReport={() => onViewReport(currentScreening.id)}
        />
      )}
    </div>
  );
};
