import React, { useState } from 'react';
import { Navbar, NavigationTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { NewScreeningFlow } from './components/screening/NewScreeningFlow';
import { PatientList } from './components/patients/PatientList';
import { PatientProfile } from './components/patients/PatientProfile';
import { PriorityQueue } from './components/priority/PriorityQueue';
import { FollowUpsManager } from './components/followups/FollowUpsManager';
import { SharedRecordViewer } from './components/shared/SharedRecordViewer';
import { PatientRegistrationModal } from './components/patients/PatientRegistrationModal';
import { DoctorLoginModal } from './components/auth/DoctorLoginModal';
import { ScreeningReportModal } from './components/reports/ScreeningReportModal';
import { storage } from './db/storage';
import { Doctor, Patient } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [activeDoctor, setActiveDoctor] = useState<Doctor>(() => storage.getActiveDoctor());

  // Deep view selections
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  const [inspectingScreeningId, setInspectingScreeningId] = useState<string | null>(null);
  const [screeningTargetPatientId, setScreeningTargetPatientId] = useState<string | undefined>(undefined);

  // Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [reportScreeningId, setReportScreeningId] = useState<string | null>(null);

  // Force render trigger for storage updates
  const [, setTick] = useState(0);
  const refreshUI = () => setTick((t) => t + 1);

  const handleNavigate = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setViewingPatientId(null);
    setScreeningTargetPatientId(undefined);
  };

  const handleSelectPatient = (patientId: string) => {
    setViewingPatientId(patientId);
    setCurrentTab('patients');
  };

  const handleStartScreeningForPatient = (patientId: string) => {
    setScreeningTargetPatientId(patientId);
    setViewingPatientId(null);
    setCurrentTab('new_screening');
  };

  const handleSelectScreening = (screeningId: string) => {
    setReportScreeningId(screeningId);
  };

  const handleResetDemoData = () => {
    storage.resetDemoData();
    setActiveDoctor(storage.getActiveDoctor());
    setViewingPatientId(null);
    setScreeningTargetPatientId(undefined);
    setCurrentTab('dashboard');
    refreshUI();
  };

  const handlePatientCreated = (newPatient: Patient) => {
    refreshUI();
    // Prompt to start screening immediately
    handleStartScreeningForPatient(newPatient.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        doctor={activeDoctor}
        onOpenDoctorModal={() => setIsDoctorModalOpen(true)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Viewport Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* VIEW 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <DoctorDashboard
            onNavigate={handleNavigate}
            onSelectPatient={handleSelectPatient}
            onSelectScreening={handleSelectScreening}
            onStartScreeningWithPatient={handleStartScreeningForPatient}
          />
        )}

        {/* VIEW 2: New Screening Master Pipeline */}
        {currentTab === 'new_screening' && (
          <NewScreeningFlow
            doctor={activeDoctor}
            initialPatientId={screeningTargetPatientId}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onViewReport={(scId) => setReportScreeningId(scId)}
            onCompleted={() => {
              refreshUI();
              setCurrentTab('dashboard');
            }}
          />
        )}

        {/* VIEW 3: Patients Directory or Profile */}
        {currentTab === 'patients' && (
          viewingPatientId ? (
            <PatientProfile
              patientId={viewingPatientId}
              onBack={() => setViewingPatientId(null)}
              onStartScreening={handleStartScreeningForPatient}
              onSelectScreening={handleSelectScreening}
              onSharePatient={() => setCurrentTab('shared_records')}
            />
          ) : (
            <PatientList
              onSelectPatient={handleSelectPatient}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onStartScreening={handleStartScreeningForPatient}
            />
          )
        )}

        {/* VIEW 4: Priority Queue */}
        {currentTab === 'priority_queue' && (
          <PriorityQueue
            onSelectPatient={handleSelectPatient}
            onSelectScreening={handleSelectScreening}
            onStartScreening={handleStartScreeningForPatient}
          />
        )}

        {/* VIEW 5: Reports Archive */}
        {currentTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Screening Reports Archive</h1>
              <p className="text-xs text-slate-500 mt-1">
                Clinical screening documents with AI findings and certified doctor decisions
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs divide-y divide-slate-100">
              {storage.getScreenings().map((sc) => {
                const p = storage.getPatientById(sc.patientId);
                return (
                  <div
                    key={sc.id}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => setReportScreeningId(sc.id)}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p?.fullName || sc.patientId}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {sc.id} · {sc.date} {sc.time} · {sc.eye} · {sc.aiResult?.severity.toUpperCase()} DR
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportScreeningId(sc.id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
                    >
                      View Report →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: Follow-ups Schedule */}
        {currentTab === 'followups' && (
          <FollowUpsManager
            onStartScreening={handleStartScreeningForPatient}
            onSelectPatient={handleSelectPatient}
          />
        )}

        {/* VIEW 7: Shared Records Portal */}
        {currentTab === 'shared_records' && (
          <SharedRecordViewer />
        )}
      </main>

      {/* Footer with Medical Safety Disclaimer */}
      <Footer />

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Doctor Login & Profile Switcher Modal */}
      <DoctorLoginModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        activeDoctor={activeDoctor}
        onDoctorChanged={(doc) => {
          setActiveDoctor(doc);
          refreshUI();
        }}
      />

      {/* Printable Clinical Screening Report Modal */}
      {reportScreeningId && (
        <ScreeningReportModal
          screeningId={reportScreeningId}
          onClose={() => setReportScreeningId(null)}
        />
      )}
    </div>
  );
}
