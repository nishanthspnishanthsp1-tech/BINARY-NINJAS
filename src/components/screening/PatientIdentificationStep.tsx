import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, User, Phone, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Patient } from '../../types';
import { storage } from '../../db/storage';

interface PatientIdentificationStepProps {
  onPatientConfirmed: (patient: Patient) => void;
  onOpenRegisterModal: () => void;
}

export const PatientIdentificationStep: React.FC<PatientIdentificationStepProps> = ({
  onPatientConfirmed,
  onOpenRegisterModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const sessionPatientId = storage.getCurrentSessionPatientId();
    if (sessionPatientId && !selectedPatient) {
      const p = storage.getPatientById(sessionPatientId);
      if (p) {
        setSelectedPatient(p);
      }
    }
  }, []);

  const patients = storage.getPatients({ search: searchQuery });

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleConfirm = () => {
    if (selectedPatient) {
      onPatientConfirmed(selectedPatient);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-semibold text-teal-700 tracking-wider">
          STEP 1 · MANDATORY PATIENT IDENTIFICATION
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Who is this retinal image for?
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Every retinal image must be permanently associated with a verified patient ID before capture or AI analysis.
        </p>
      </div>

      {/* Selected Patient Confirmation Card */}
      {selectedPatient ? (
        <div className="bg-white border-2 border-teal-600 rounded-xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-teal-800">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">
                Patient Selected · Confirmation Required
              </span>
            </div>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2.5 py-1 rounded-md font-semibold border border-teal-200">
              {selectedPatient.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Patient Name</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{selectedPatient.fullName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{selectedPatient.age} yrs</span>
                <span>·</span>
                <span className="capitalize">{selectedPatient.gender}</span>
                <span>·</span>
                <span>{selectedPatient.village}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Previous Visits:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedPatient.screeningCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Screening:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedPatient.lastVisitAt
                    ? new Date(selectedPatient.lastVisitAt).toLocaleDateString('en-GB')
                    : 'None (First Visit)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Diabetes Status:</span>
                <span className="font-mono text-slate-800">
                  {selectedPatient.diabetesType.replace('_', ' ').toUpperCase()} ({selectedPatient.diabetesDurationYears} yrs)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Please confirm the patient identity against their OPD slip or physical card before proceeding with fundus capture.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Change Patient
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Confirm & Start Screening</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Search or Register New */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Patient by ID (PAT-..., DR-...), Name, or Phone..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Register New Patient CTA */}
            <button
              onClick={onOpenRegisterModal}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Patient</span>
            </button>
          </div>

          {/* Quick Select Patient List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>EXISTING PATIENTS ({patients.length})</span>
              <span>CLICK TO SELECT FOR SCREENING</span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {patients.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No matching patients found. Click "+ Register New Patient" to register.
                </div>
              ) : (
                patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className="p-3.5 hover:bg-teal-50/50 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-teal-100 text-slate-600 group-hover:text-teal-700 flex items-center justify-center text-xs font-semibold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-900">
                            {p.fullName}
                          </span>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{p.age}y</span>
                          <span>·</span>
                          <span className="capitalize">{p.gender}</span>
                          <span>·</span>
                          <span>{p.village}</span>
                          <span>·</span>
                          <span className="font-mono">{p.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-600 block">
                        {p.screeningCount} past visit{p.screeningCount === 1 ? '' : 's'}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-700 group-hover:underline">
                        Select Patient →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
