import React, { useState } from 'react';
import { UserCheck, X, Shield, Lock, CheckCircle2, User } from 'lucide-react';
import { Doctor } from '../../types';
import { storage } from '../../db/storage';

interface DoctorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoctor: Doctor;
  onDoctorChanged: (doctor: Doctor) => void;
}

export const DoctorLoginModal: React.FC<DoctorLoginModalProps> = ({
  isOpen,
  onClose,
  activeDoctor,
  onDoctorChanged,
}) => {
  if (!isOpen) return null;

  const doctors = storage.getDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState(activeDoctor.id);
  const [password, setPassword] = useState('••••••••••••');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === selectedDoctorId);
    if (doc) {
      storage.setActiveDoctor(doc);
      onDoctorChanged(doc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-teal-800">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Doctor Authentication & Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Certified Clinician Profile
            </label>
            <div className="space-y-2">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDoctorId === doc.id
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-teal-700 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">{doc.role}</p>
                      <p className="text-[10px] font-mono text-slate-400">{doc.facility}</p>
                    </div>
                  </div>

                  {selectedDoctorId === doc.id && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Clinician Access Pin / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setShowForgot(!showForgot)}
              className="text-teal-700 hover:underline"
            >
              Forgot clinician credentials?
            </button>
            <span className="text-slate-400 font-mono">KMC Verified</span>
          </div>

          {showForgot && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              For demo testing, both registered Karnataka Medical Council (KMC) clinician sessions are unlocked and ready for use.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Confirm Clinician Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
