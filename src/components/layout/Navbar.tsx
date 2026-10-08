import React from 'react';
import {
  Activity,
  UserCheck,
  RotateCcw,
  PlusCircle,
  FileText,
  Clock,
  Share2,
  Users,
  Eye,
  LogOut,
} from 'lucide-react';
import { Doctor } from '../../types';

export type NavigationTab =
  | 'dashboard'
  | 'new_screening'
  | 'patients'
  | 'priority_queue'
  | 'reports'
  | 'followups'
  | 'shared_records';

interface NavbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  doctor: Doctor;
  onOpenDoctorModal: () => void;
  onResetDemoData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  doctor,
  onOpenDoctorModal,
  onResetDemoData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  TRUST-DR
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-mono text-slate-400">
                  Rural Tele-Ophthalmology AI
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('new_screening')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'new_screening'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              New Screening
            </button>
            <button
              onClick={() => onNavigate('patients')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentTab === 'patients'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => onNavigate('priority_queue')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'priority_queue'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-600" />
              Priority Queue
            </button>
            <button
              onClick={() => onNavigate('followups')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'followups'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Follow-ups
            </button>
            <button
              onClick={() => onNavigate('shared_records')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'shared_records'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              Shared Records
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onResetDemoData}
              title="Reset test data to default demo state"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="tabular-nums">Reset Demo</span>
            </button>

            <button
              onClick={onOpenDoctorModal}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <UserCheck className="w-4 h-4 text-teal-700" />
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <p className="font-semibold text-slate-900 truncate max-w-[130px]">{doctor.name}</p>
                <p className="text-slate-500 font-mono text-[10px] truncate max-w-[130px]">{doctor.facility}</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('new_screening')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start Screening</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar text-xs font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('new_screening')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'new_screening' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
          >
            New Screening
          </button>
          <button
            onClick={() => onNavigate('patients')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'patients' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Patients
          </button>
          <button
            onClick={() => onNavigate('priority_queue')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'priority_queue' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Priority Queue
          </button>
          <button
            onClick={() => onNavigate('followups')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'followups' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Follow-ups
          </button>
          <button
            onClick={() => onNavigate('shared_records')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentTab === 'shared_records' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            Shared Records
          </button>
        </div>
      </div>
    </header>
  );
};
