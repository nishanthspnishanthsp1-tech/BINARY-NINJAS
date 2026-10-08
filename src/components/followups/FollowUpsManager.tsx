import React, { useState } from 'react';
import { Calendar, Clock, Phone, MapPin, Eye, ArrowRight, CheckCircle2 } from 'lucide-react';
import { storage } from '../../db/storage';
import { DRSeverity } from '../../types';

interface FollowUpsManagerProps {
  onStartScreening: (patientId: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export const FollowUpsManager: React.FC<FollowUpsManagerProps> = ({
  onStartScreening,
  onSelectPatient,
}) => {
  const stats = storage.getDashboardStats();
  const followUps = stats.followUpsDue;
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = followUps.filter((fu) => {
    if (filter === 'overdue') return fu.followUpDate < todayStr;
    if (filter === 'upcoming') return fu.followUpDate >= todayStr;
    return true;
  });

  const getSeverityBadge = (sev: DRSeverity) => {
    switch (sev) {
      case 'healthy':
        return <span className="text-emerald-700 font-semibold text-xs">Healthy</span>;
      case 'mild':
        return <span className="text-amber-700 font-semibold text-xs">Mild DR</span>;
      case 'moderate':
        return <span className="text-orange-700 font-semibold text-xs">Moderate DR</span>;
      case 'severe':
        return <span className="text-rose-700 font-semibold text-xs">Severe DR</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 uppercase">
          <Clock className="w-4 h-4" />
          <span>LONGITUDINAL MONITORING SCHEDULE</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          Follow-ups Due & Re-Screening Appointments
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Automated appointment tracker for rural diabetic patients due for repeat fundus examinations or post-referral checks.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-xs text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          All ({followUps.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            filter === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            filter === 'overdue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Follow-up list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No follow-up appointments found for this filter.
            </div>
          ) : (
            filtered.map((fu, idx) => {
              const isOverdue = fu.followUpDate < todayStr;

              return (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{fu.patientName}</span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {fu.patientId}
                        </span>
                        {getSeverityBadge(fu.severity)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{fu.village}</span>
                        <span>·</span>
                        <span className="font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {fu.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900 block">
                        {fu.followUpDate}
                      </span>
                      {isOverdue ? (
                        <span className="text-[10px] font-semibold text-rose-600 font-mono">
                          OVERDUE RE-SCREEN
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">SCHEDULED</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectPatient(fu.patientId)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => onStartScreening(fu.patientId)}
                        className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                      >
                        <span>Screen Visit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
