import React, { useState } from 'react';
import { Search, UserPlus, Filter, User, ChevronRight, Eye, Calendar } from 'lucide-react';
import { Patient, DRSeverity } from '../../types';
import { storage } from '../../db/storage';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
  onOpenRegisterModal: () => void;
  onStartScreening: (patientId: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onOpenRegisterModal,
  onStartScreening,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<DRSeverity | 'all'>('all');
  const [villageFilter, setVillageFilter] = useState('');

  const patients = storage.getPatients({
    search,
    severity: severityFilter,
    village: villageFilter,
  });

  const getSeverityBadge = (sev: DRSeverity) => {
    switch (sev) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Healthy / No DR
          </span>
        );
      case 'mild':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mild DR
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Moderate DR
          </span>
        );
      case 'severe':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Severe / PDR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search and manage long-term rural retinopathy cohorts across Ramanagara district
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register New Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient ID (PAT-..., DR-...), Name, Village, Phone..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-none"
            >
              <option value="all">All DR Severity Grades</option>
              <option value="healthy">Healthy / No DR</option>
              <option value="mild">Mild DR</option>
              <option value="moderate">Moderate DR</option>
              <option value="severe">Severe / Proliferative DR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Patient ID / Name</th>
                <th className="py-3 px-4">Demographics & Village</th>
                <th className="py-3 px-4">Diabetes Profile</th>
                <th className="py-3 px-4">Current DR Grade</th>
                <th className="py-3 px-4">Visits</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectPatient(p.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-teal-900">
                            {p.fullName}
                          </p>
                          <span className="font-mono text-[10px] text-slate-500">{p.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <p>{p.age}y · <span className="capitalize">{p.gender}</span></p>
                      <p className="text-[11px] text-slate-400">{p.village}, {p.subDistrict}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <p className="capitalize">{p.diabetesType.replace('_', ' ')}</p>
                      <p className="text-[11px] text-slate-400">Duration: {p.diabetesDurationYears}y · {p.hbA1c ? `HbA1c ${p.hbA1c}%` : 'No HbA1c'}</p>
                    </td>

                    <td className="py-3 px-4">
                      {getSeverityBadge(p.currentSeverity)}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {p.screeningCount} visit{p.screeningCount === 1 ? '' : 's'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onStartScreening(p.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold border border-teal-200 transition-colors"
                        >
                          Screen
                        </button>
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
                        >
                          Profile →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
