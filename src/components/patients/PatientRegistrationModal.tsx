import React, { useState } from 'react';
import { UserPlus, X, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Patient } from '../../types';
import { storage } from '../../db/storage';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    fullName: '',
    age: '52',
    dateOfBirth: '1974-05-15',
    gender: 'female' as 'male' | 'female' | 'other',
    phone: '+91 ',
    email: '',
    address: '',
    village: '',
    subDistrict: 'Ramanagara',
    district: 'Ramanagara',
    diabetesType: 'type_2' as 'type_1' | 'type_2' | 'gestational' | 'prediabetes',
    diabetesDurationYears: '6',
    hbA1c: '7.8',
    hypertension: true,
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      return;
    }

    // Generate local application patient ID (e.g. PAT-0001)
    const patientId = storage.generateNextPatientId();

    const fullAddress =
      formData.address.trim() ||
      [formData.village.trim(), formData.subDistrict, formData.district]
        .filter(Boolean)
        .join(', ');

    const newPatient: Patient = {
      id: patientId,
      fullName: formData.fullName.trim(),
      age: Number(formData.age) || 50,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      address: fullAddress,
      village: formData.village.trim() || fullAddress,
      subDistrict: formData.subDistrict,
      district: formData.district,
      diabetesType: formData.diabetesType,
      diabetesDurationYears: Number(formData.diabetesDurationYears) || 0,
      hbA1c: formData.hbA1c ? Number(formData.hbA1c) : undefined,
      hypertension: formData.hypertension,
      createdAt: new Date().toISOString(),
      screeningCount: 0,
      currentSeverity: 'healthy',
      currentReferralStatus: 'none',
    };

    // Store in application state and active session
    storage.savePatient(newPatient);
    storage.setCurrentSessionPatientId(patientId);

    setRegisteredPatient(newPatient);
    setIsSuccess(true);
  };

  const handleStartScreeningForNewPatient = () => {
    if (registeredPatient) {
      onPatientCreated(registeredPatient);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Patient Registration</h2>
              <p className="text-xs text-slate-500">New Patient Intake & Clinical Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS VIEW */}
        {isSuccess && registeredPatient ? (
          <div className="py-6 space-y-5 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Patient Registered Successfully</h3>
              <p className="text-xs text-slate-500">
                Patient record created in session and ready for retinal screening
              </p>
            </div>

            {/* Prominent Patient ID Banner */}
            <div className="p-4 bg-teal-50/80 border-2 border-teal-600 rounded-xl text-center space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800">
                Assigned Patient ID
              </span>
              <div className="text-3xl font-extrabold font-mono text-teal-950 tracking-wide">
                Patient ID: {registeredPatient.id}
              </div>
              <p className="text-xs text-teal-700 pt-1">
                This Patient ID is linked to your active session and will be attached to all retinal screenings.
              </p>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-900">{registeredPatient.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="font-semibold text-slate-900">{registeredPatient.age} yrs · {registeredPatient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-900">{registeredPatient.phone}</span>
              </div>
              {registeredPatient.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-900">{registeredPatient.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Address / Location:</span>
                <span className="text-slate-900">{registeredPatient.address || registeredPatient.village}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onPatientCreated(registeredPatient);
                  onClose();
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close & View Dashboard
              </button>
              <button
                type="button"
                onClick={handleStartScreeningForNewPatient}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Start Retinal Screening for {registeredPatient.id}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* Full Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Arun Kumar"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Gender & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Channapatna Rural, Ramanagara"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Diabetes Status & Medical Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-800 uppercase block">
                Diabetes Status & Medical Profile
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Diabetes Type
                  </label>
                  <select
                    value={formData.diabetesType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diabetesType: e.target.value as any,
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="type_2">Type 2 DM</option>
                    <option value="type_1">Type 1 DM</option>
                    <option value="gestational">Gestational DM</option>
                    <option value="prediabetes">Prediabetes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.diabetesDurationYears}
                    onChange={(e) =>
                      setFormData({ ...formData, diabetesDurationYears: e.target.value })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    HbA1c (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hbA1c}
                    onChange={(e) => setFormData({ ...formData, hbA1c: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="htn"
                  checked={formData.hypertension}
                  onChange={(e) => setFormData({ ...formData, hypertension: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="htn" className="text-xs text-slate-700 cursor-pointer">
                  Co-existing Systemic Hypertension
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Register Patient</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
