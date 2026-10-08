import {
  Patient,
  ScreeningRecord,
  Doctor,
  LongitudinalComparison,
  ShareTokenRecord,
  DRSeverity,
} from '../types';
import { DEFAULT_DOCTORS, INITIAL_PATIENTS, INITIAL_SCREENINGS } from './seedData';

const PATIENTS_KEY = 'trust_dr_patients_v1';
const SCREENINGS_KEY = 'trust_dr_screenings_v1';
const DOCTORS_KEY = 'trust_dr_doctors_v1';
const ACTIVE_DOC_KEY = 'trust_dr_active_doc_v1';
const SHARE_TOKENS_KEY = 'trust_dr_share_tokens_v1';

class StorageService {
  private initialized = false;

  public init() {
    if (this.initialized) return;

    if (!localStorage.getItem(PATIENTS_KEY)) {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!localStorage.getItem(SCREENINGS_KEY)) {
      localStorage.setItem(SCREENINGS_KEY, JSON.stringify(INITIAL_SCREENINGS));
    }
    if (!localStorage.getItem(DOCTORS_KEY)) {
      localStorage.setItem(DOCTORS_KEY, JSON.stringify(DEFAULT_DOCTORS));
    }
    if (!localStorage.getItem(ACTIVE_DOC_KEY)) {
      localStorage.setItem(ACTIVE_DOC_KEY, JSON.stringify(DEFAULT_DOCTORS[0]));
    }
    if (!localStorage.getItem(SHARE_TOKENS_KEY)) {
      localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify([]));
    }

    this.initialized = true;
  }

  public resetDemoData() {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem(SCREENINGS_KEY, JSON.stringify(INITIAL_SCREENINGS));
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(DEFAULT_DOCTORS));
    localStorage.setItem(ACTIVE_DOC_KEY, JSON.stringify(DEFAULT_DOCTORS[0]));
    localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify([]));
  }

  // Active Doctor / Authentication
  public getActiveDoctor(): Doctor {
    this.init();
    try {
      const data = localStorage.getItem(ACTIVE_DOC_KEY);
      return data ? JSON.parse(data) : DEFAULT_DOCTORS[0];
    } catch {
      return DEFAULT_DOCTORS[0];
    }
  }

  public setActiveDoctor(doc: Doctor): void {
    localStorage.setItem(ACTIVE_DOC_KEY, JSON.stringify(doc));
  }

  public getDoctors(): Doctor[] {
    this.init();
    try {
      const data = localStorage.getItem(DOCTORS_KEY);
      return data ? JSON.parse(data) : DEFAULT_DOCTORS;
    } catch {
      return DEFAULT_DOCTORS;
    }
  }

  // Patients
  public getPatients(filter?: {
    search?: string;
    severity?: DRSeverity | 'all';
    village?: string;
  }): Patient[] {
    this.init();
    try {
      const raw = localStorage.getItem(PATIENTS_KEY);
      let list: Patient[] = raw ? JSON.parse(raw) : INITIAL_PATIENTS;

      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.fullName.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.village.toLowerCase().includes(q)
        );
      }

      if (filter?.severity && filter.severity !== 'all') {
        list = list.filter((p) => p.currentSeverity === filter.severity);
      }

      if (filter?.village) {
        list = list.filter((p) => p.village.toLowerCase().includes(filter.village!.toLowerCase()));
      }

      return list.sort((a, b) => (b.lastVisitAt || b.createdAt).localeCompare(a.lastVisitAt || a.createdAt));
    } catch {
      return INITIAL_PATIENTS;
    }
  }

  public getPatientById(id: string): Patient | undefined {
    this.init();
    const list = this.getPatients();
    return list.find((p) => p.id === id);
  }

  public generateNextPatientId(): string {
    this.init();
    const list = this.getPatients();
    let maxPatNum = 0;

    list.forEach((p) => {
      if (p.id && p.id.startsWith('PAT-')) {
        const num = parseInt(p.id.replace('PAT-', ''), 10);
        if (!isNaN(num) && num > maxPatNum) {
          maxPatNum = num;
        }
      }
    });

    const nextNum = (maxPatNum + 1).toString().padStart(4, '0');
    return `PAT-${nextNum}`;
  }

  public savePatient(patient: Patient): Patient {
    this.init();
    const list = this.getPatients();
    const existingIndex = list.findIndex((p) => p.id === patient.id);

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...patient };
    } else {
      list.unshift(patient);
    }

    localStorage.setItem(PATIENTS_KEY, JSON.stringify(list));
    return patient;
  }

  // Session Patient Tracking (for active session patient ID)
  public getCurrentSessionPatientId(): string | null {
    try {
      return sessionStorage.getItem('trust_dr_session_patient_id');
    } catch {
      return null;
    }
  }

  public setCurrentSessionPatientId(patientId: string): void {
    try {
      sessionStorage.setItem('trust_dr_session_patient_id', patientId);
    } catch {
      // ignore
    }
  }

  // Screenings
  public getScreenings(patientId?: string): ScreeningRecord[] {
    this.init();
    try {
      const raw = localStorage.getItem(SCREENINGS_KEY);
      let list: ScreeningRecord[] = raw ? JSON.parse(raw) : INITIAL_SCREENINGS;

      if (patientId) {
        list = list.filter((s) => s.patientId === patientId);
      }

      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return INITIAL_SCREENINGS;
    }
  }

  public getScreeningById(id: string): ScreeningRecord | undefined {
    this.init();
    const list = this.getScreenings();
    return list.find((s) => s.id === id);
  }

  public saveScreening(screening: ScreeningRecord): ScreeningRecord {
    this.init();
    const list = this.getScreenings();
    const existingIndex = list.findIndex((s) => s.id === screening.id);

    if (existingIndex >= 0) {
      list[existingIndex] = screening;
    } else {
      list.unshift(screening);
    }

    localStorage.setItem(SCREENINGS_KEY, JSON.stringify(list));

    // Update patient's summary fields
    const patient = this.getPatientById(screening.patientId);
    if (patient) {
      const patientScreenings = list.filter((s) => s.patientId === patient.id);
      patient.screeningCount = patientScreenings.length;
      patient.lastVisitAt = new Date(screening.timestamp).toISOString();
      if (screening.aiResult) {
        patient.currentSeverity = screening.aiResult.severity;
        patient.currentReferralStatus = screening.aiResult.suggestedReferral;
      }
      this.savePatient(patient);
    }

    return screening;
  }

  public generateNextScreeningId(): string {
    const currentYear = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SCR-${currentYear}-${rand}`;
  }

  // Longitudinal Comparison Calculation
  public getComparisonForScreening(
    patientId: string,
    currentScreeningId: string
  ): LongitudinalComparison | null {
    const screenings = this.getScreenings(patientId).sort((a, b) => a.timestamp - b.timestamp);
    const currentIndex = screenings.findIndex((s) => s.id === currentScreeningId);

    if (currentIndex <= 0) {
      // First visit or not found
      return null;
    }

    const prev = screenings[currentIndex - 1];
    const curr = screenings[currentIndex];

    if (!prev.aiResult || !curr.aiResult) {
      return {
        previousScreeningId: prev.id,
        previousDate: prev.date,
        previousSeverity: prev.aiResult?.severity || 'healthy',
        previousConfidence: prev.aiResult?.confidence || 0,
        previousLesionCount: 0,
        currentScreeningId: curr.id,
        currentDate: curr.date,
        currentSeverity: curr.aiResult?.severity || 'healthy',
        currentConfidence: curr.aiResult?.confidence || 0,
        currentLesionCount: 0,
        changeStatus: 'insufficient_evidence',
        summaryMessage: 'Not enough comparable evidence between visits for quantitative progression analysis.',
        microaneurysmDelta: 0,
        exudateDelta: 0,
        hemorrhageDelta: 0,
        ophthalmologyAlert: false,
      };
    }

    const severityOrder: Record<DRSeverity, number> = {
      healthy: 0,
      mild: 1,
      moderate: 2,
      severe: 3,
    };

    const prevLevel = severityOrder[prev.aiResult.severity];
    const currLevel = severityOrder[curr.aiResult.severity];

    const prevMA = prev.aiResult.structures.microaneurysms.count;
    const currMA = curr.aiResult.structures.microaneurysms.count;
    const prevEx = prev.aiResult.structures.exudates.count;
    const currEx = curr.aiResult.structures.exudates.count;
    const prevHem = prev.aiResult.structures.hemorrhages.count;
    const currHem = curr.aiResult.structures.hemorrhages.count;

    const maDelta = currMA - prevMA;
    const exDelta = currEx - prevEx;
    const hemDelta = currHem - prevHem;

    let changeStatus: 'stable' | 'progression' | 'regression' = 'stable';
    let summaryMessage = 'No significant pathological change detected across screening records.';
    let ophthalmologyAlert = false;

    if (currLevel > prevLevel || maDelta > 5 || exDelta > 3 || hemDelta > 3) {
      changeStatus = 'progression';
      summaryMessage = `DR severity has progressed from ${prev.aiResult.severity.toUpperCase()} to ${curr.aiResult.severity.toUpperCase()} with new microvascular lesion formation.`;
      ophthalmologyAlert = true;
    } else if (currLevel < prevLevel) {
      changeStatus = 'regression';
      summaryMessage = `Microvascular lesion resolution observed compared to previous visit (${prev.date}).`;
    }

    return {
      previousScreeningId: prev.id,
      previousDate: prev.date,
      previousSeverity: prev.aiResult.severity,
      previousConfidence: prev.aiResult.confidence,
      previousLesionCount: prevMA + prevEx + prevHem,
      currentScreeningId: curr.id,
      currentDate: curr.date,
      currentSeverity: curr.aiResult.severity,
      currentConfidence: curr.aiResult.confidence,
      currentLesionCount: currMA + currEx + currHem,
      changeStatus,
      summaryMessage,
      microaneurysmDelta: maDelta,
      exudateDelta: exDelta,
      hemorrhageDelta: hemDelta,
      ophthalmologyAlert,
    };
  }

  // Dashboard Aggregates
  public getDashboardStats() {
    this.init();
    const patients = this.getPatients();
    const screenings = this.getScreenings();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayScreenings = screenings.filter((s) => s.date === todayStr || s.date === '2026-10-08');

    const pendingReviews = screenings.filter((s) => s.reviewStatus === 'pending_review' && !s.isRecaptureNeeded);
    const highRisk = patients.filter((p) => p.currentSeverity === 'severe');
    const requiringReferral = patients.filter(
      (p) => p.currentReferralStatus === 'emergency' || p.currentReferralStatus === 'urgent_1_2_weeks'
    );
    const poorQualityRecapture = screenings.filter((s) => s.isRecaptureNeeded || s.quality.status === 'poor');

    // Severity distribution
    const healthyCount = patients.filter((p) => p.currentSeverity === 'healthy').length;
    const mildCount = patients.filter((p) => p.currentSeverity === 'mild').length;
    const moderateCount = patients.filter((p) => p.currentSeverity === 'moderate').length;
    const severeCount = patients.filter((p) => p.currentSeverity === 'severe').length;

    // Follow-ups due
    const followUpsDue = screenings
      .filter((s) => s.doctorReview?.followUpDate)
      .map((s) => {
        const patient = patients.find((p) => p.id === s.patientId);
        return {
          patientId: s.patientId,
          patientName: patient?.fullName || 'Unknown Patient',
          followUpDate: s.doctorReview!.followUpDate,
          screeningId: s.id,
          severity: patient?.currentSeverity || 'healthy',
          village: patient?.village || 'Ramanagara',
          phone: patient?.phone || '',
        };
      })
      .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

    return {
      totalPatients: patients.length,
      todayScreeningsCount: todayScreenings.length,
      pendingReviewsCount: pendingReviews.length,
      highRiskCount: highRisk.length,
      requiringReferralCount: requiringReferral.length,
      poorQualityCount: poorQualityRecapture.length,
      severityBreakdown: {
        healthy: healthyCount,
        mild: mildCount,
        moderate: moderateCount,
        severe: severeCount,
      },
      followUpsDue,
      recentScreenings: screenings.slice(0, 8),
    };
  }

  // Priority Queue
  public getPriorityQueue() {
    this.init();
    const patients = this.getPatients();
    const screenings = this.getScreenings();

    const highPriority: Array<{ patient: Patient; latestScreening?: ScreeningRecord; reason: string }> = [];
    const moderateRisk: Array<{ patient: Patient; latestScreening?: ScreeningRecord; reason: string }> = [];
    const aiUncertain: Array<{ patient: Patient; latestScreening?: ScreeningRecord; reason: string }> = [];
    const lowRisk: Array<{ patient: Patient; latestScreening?: ScreeningRecord; reason: string }> = [];

    patients.forEach((patient) => {
      const patientScreenings = screenings.filter((s) => s.patientId === patient.id);
      const latest = patientScreenings[0];

      if (latest?.quality.status === 'poor' || latest?.isRecaptureNeeded) {
        aiUncertain.push({
          patient,
          latestScreening: latest,
          reason: 'Image quality sub-optimal (blur/underexposure). Automated DR ungradable.',
        });
      } else if (patient.currentSeverity === 'severe' || patient.currentReferralStatus === 'emergency') {
        highPriority.push({
          patient,
          latestScreening: latest,
          reason: 'Severe proliferative signs / macular threat detected. Urgent tertiary evaluation required.',
        });
      } else if (patient.currentSeverity === 'moderate') {
        moderateRisk.push({
          patient,
          latestScreening: latest,
          reason: 'Moderate NPDR with active lesion cluster and recent disease progression.',
        });
      } else if (latest?.aiResult?.trustReport.status === 'doctor_review_required') {
        aiUncertain.push({
          patient,
          latestScreening: latest,
          reason: 'Trust check flagged discrepancy or borderline model confidence. Doctor review advised.',
        });
      } else {
        lowRisk.push({
          patient,
          latestScreening: latest,
          reason: patient.currentSeverity === 'mild' ? 'Mild background DR (stable)' : 'Normal healthy retina',
        });
      }
    });

    return {
      highPriority,
      moderateRisk,
      aiUncertain,
      lowRisk,
    };
  }

  // Sharing
  public createShareToken(patientId: string, doctorName: string): ShareTokenRecord {
    this.init();
    const tokens: ShareTokenRecord[] = JSON.parse(localStorage.getItem(SHARE_TOKENS_KEY) || '[]');
    const token = `TR-SEC-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const record: ShareTokenRecord = {
      token,
      patientId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      allowedVisits: 'all',
      accessCount: 0,
      createdByName: doctorName,
    };

    tokens.push(record);
    localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify(tokens));
    return record;
  }

  public getShareRecordByToken(token: string): { patient: Patient; screenings: ScreeningRecord[] } | null {
    this.init();
    const tokens: ShareTokenRecord[] = JSON.parse(localStorage.getItem(SHARE_TOKENS_KEY) || '[]');
    const record = tokens.find((t) => t.token === token);
    if (!record) return null;

    record.accessCount += 1;
    localStorage.setItem(SHARE_TOKENS_KEY, JSON.stringify(tokens));

    const patient = this.getPatientById(record.patientId);
    if (!patient) return null;

    const screenings = this.getScreenings(patient.id);
    return { patient, screenings };
  }

  public getShareTokensForPatient(patientId: string): ShareTokenRecord[] {
    this.init();
    const tokens: ShareTokenRecord[] = JSON.parse(localStorage.getItem(SHARE_TOKENS_KEY) || '[]');
    return tokens.filter((t) => t.patientId === patientId);
  }
}

export const storage = new StorageService();
