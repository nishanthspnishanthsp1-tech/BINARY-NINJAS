import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Eye, Clock, CheckCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Patient } from '../../types';
import { PRESET_SAMPLE_CASES, SampleFundusCase } from '../../assets/fundusImages';

interface FundusCaptureUploadStepProps {
  patient: Patient;
  onImageReady: (data: {
    imageUrl: string;
    imageSource: 'fundus_camera' | 'upload_file' | 'demo_sample';
    eye: 'OD' | 'OS';
    timestamp: number;
    formattedDate: string;
    formattedTime: string;
  }) => void;
  onChangePatient: () => void;
}

export const FundusCaptureUploadStep: React.FC<FundusCaptureUploadStepProps> = ({
  patient,
  onImageReady,
  onChangePatient,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'samples'>('samples');
  const [selectedEye, setSelectedEye] = useState<'OD' | 'OS'>('OD');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'fundus_camera' | 'upload_file' | 'demo_sample'>('demo_sample');

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Formatted date/time
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Unable to connect to camera hardware. Please check permissions or upload an image.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewUrl(dataUrl);
      setSourceType('fundus_camera');
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string);
          setSourceType('upload_file');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (sample: SampleFundusCase) => {
    setPreviewUrl(sample.url);
    setSourceType('demo_sample');
  };

  const handleProceed = () => {
    if (previewUrl) {
      onImageReady({
        imageUrl: previewUrl,
        imageSource: sourceType,
        eye: selectedEye,
        timestamp: Date.now(),
        formattedDate,
        formattedTime,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Patient Association Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-teal-400 block">
            VERIFIED PATIENT SESSION
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-lg font-bold">{patient.fullName}</h2>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {patient.id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {patient.age}y · {patient.village} · Diabetes {patient.diabetesDurationYears}y · Visit #{patient.screeningCount + 1}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-slate-400 block">{formattedDate}</span>
            <span className="text-xs font-mono text-teal-300 font-semibold">{formattedTime}</span>
          </div>
          <button
            onClick={onChangePatient}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Change Patient
          </button>
        </div>
      </div>

      {/* Configuration & Input Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* Eye Selection & Date Stamp Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Retinal Examination Eye
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedEye('OD')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedEye === 'OD'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Right Eye (OD — Oculus Dexter)
              </button>
              <button
                type="button"
                onClick={() => setSelectedEye('OS')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedEye === 'OS'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Left Eye (OS — Oculus Sinister)
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-0.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Screening Timestamp</span>
            </div>
            <span>{formattedDate} — {formattedTime}</span>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-md">
          <button
            onClick={() => {
              setActiveTab('samples');
              stopCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'samples'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clinical Sample Bank
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Fundus File
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fundus Camera / Video
          </button>
        </div>

        {/* TAB 1: Clinical Sample Bank */}
        {activeTab === 'samples' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Select one of the pre-calibrated ophthalmic fundus cases to test quality assessment, explainability heatmaps, or progression:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {PRESET_SAMPLE_CASES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectPreset(sample)}
                  className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between ${
                    previewUrl === sample.url
                      ? 'border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="aspect-square rounded-lg overflow-hidden bg-black mb-2.5 relative border border-slate-200">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {previewUrl === sample.url && (
                        <div className="absolute top-2 right-2 bg-teal-600 text-white rounded-full p-1 shadow-md">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-900 block truncate">
                      {sample.tag}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">{sample.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`mt-3 w-full py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      previewUrl === sample.url
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                    }`}
                  >
                    {previewUrl === sample.url ? 'Selected' : 'Use Sample'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Click to upload or drag & drop fundus image
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Standard ophthalmic formats supported: JPG, PNG, TIFF, DICOM export (Max 25MB)
              </p>
              <label className="mt-4 inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: Connected Fundus Camera */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-4 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-semibold hover:bg-rose-800"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="relative aspect-video max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Retinal Circular Alignment Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border-2 border-teal-400/60 border-dashed animate-pulse flex items-center justify-center">
                    <div className="w-4 h-4 border border-teal-300 rounded-full"></div>
                  </div>
                </div>

                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={captureCameraFrame}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-semibold text-xs shadow-lg flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Fundus Frame</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Image Preview & Proceed CTA */}
        {previewUrl && (
          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={previewUrl}
                alt="Selected retinal fundus"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover bg-black border border-slate-200 shadow-xs"
              />
              <div>
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Retinal Image Ready for Analysis
                </span>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Target: {patient.fullName} ({patient.id}) · Eye: {selectedEye}
                </p>
              </div>
            </div>

            <button
              onClick={handleProceed}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Run Automated Quality Check</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
