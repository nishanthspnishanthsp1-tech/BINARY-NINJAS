import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Eye,
  ArrowRight,
  User,
  Activity,
} from 'lucide-react';
import { storage } from '../../db/storage';
import { Patient, ScreeningRecord } from '../../types';

interface PriorityQueueProps {
  onSelectPatient: (patientId: string) => void;
  onSelectScreening: (screeningId: string) => void;
  onStartScreening: (patientId: string) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  onSelectPatient,
  onSelectScreening,
  onStartScreening,
}) => {
  const queue = storage.getPriorityQueue();
  const [activeTab, setActiveTab] = useState<'high' | 'moderate' | 'uncertain' | 'low'>('high');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-700 uppercase">
          <Activity className="w-4 h-4" />
          <span>TRIAGE DECISION SUPPORT</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          Doctor Priority Clinical Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Triage rural patients by urgency of vitreo-retinal evaluation, progression velocity, and explainable AI confidence check status.
        </p>
      </div>

      {/* 4 Triage Segmented Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* High Priority */}
        <button
          onClick={() => setActiveTab('high')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'high'
              ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              High Priority
            </span>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              {queue.highPriority.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Proliferative DR / Macular Threat</p>
        </button>

        {/* Moderate Risk */}
        <button
          onClick={() => setActiveTab('moderate')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'moderate'
              ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Moderate Risk
            </span>
            <span className="text-xs font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
              {queue.moderateRisk.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Moderate NPDR / Progression</p>
        </button>

        {/* AI Uncertain */}
        <button
          onClick={() => setActiveTab('uncertain')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'uncertain'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              AI Uncertain / Recapture
            </span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              {queue.aiUncertain.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Image Blur / Low Trust Score</p>
        </button>

        {/* Low Risk */}
        <button
          onClick={() => setActiveTab('low')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'low'
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Low Risk
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              {queue.lowRisk.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Normal Retina / Mild Stable</p>
        </button>
      </div>

      {/* Queue List Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          {activeTab === 'high' && '🔴 High Priority Emergency / Rapid Referral Queue'}
          {activeTab === 'moderate' && '🟠 Moderate Risk Clinical Review Queue'}
          {activeTab === 'uncertain' && '🟡 AI Uncertain Check / Retinal Recapture Queue'}
          {activeTab === 'low' && '🟢 Low Risk Stable Monitoring Queue'}
        </h2>

        <div className="divide-y divide-slate-100">
          {(() => {
            const currentList =
              activeTab === 'high'
                ? queue.highPriority
                : activeTab === 'moderate'
                ? queue.moderateRisk
                : activeTab === 'uncertain'
                ? queue.aiUncertain
                : queue.lowRisk;

            if (currentList.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No patients currently triaged in this category.
                </div>
              );
            }

            return currentList.map(({ patient, latestScreening, reason }, i) => (
              <div
                key={patient.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{patient.fullName}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {patient.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {patient.age}y · {patient.village} · Diabetes {patient.diabetesDurationYears}y · Phone: {patient.phone}
                    </p>
                    <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-50 p-1.5 rounded border border-slate-200/60 inline-block">
                      Triage Flag: {reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {latestScreening ? (
                    <button
                      onClick={() => onSelectScreening(latestScreening.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors"
                    >
                      Inspect Screening
                    </button>
                  ) : null}

                  <button
                    onClick={() => onStartScreening(patient.id)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Case</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
