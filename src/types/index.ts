export type DRSeverity = 'healthy' | 'mild' | 'moderate' | 'severe';

export type ClinicalICDRLevel = 0 | 1 | 2 | 3 | 4;

export type ImageQualityStatus = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unusable';

export type TrustStatus = 'ai_supported' | 'doctor_review_required' | 'recapture_required';

export type ReferralPriority = 'none' | 'routine' | 'urgent_1_2_weeks' | 'emergency';

export type ReviewStatus = 'pending_review' | 'confirmed_by_doctor' | 'modified_by_doctor' | 'referred';

export interface RawAIResponse {
  image_valid: boolean;
  image_type: 'fundus' | 'external_eye' | 'face' | 'document' | 'non_retinal' | 'xray' | 'skin' | 'other';
  rejection_reason: string | null;
  image_quality: {
    score: number;
    status: 'Excellent' | 'Good' | 'Acceptable' | 'Poor' | 'Unusable';
    blur: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe';
    illumination: 'Good' | 'Adequate' | 'Dark' | 'Overexposed' | 'Uneven';
    contrast: 'High' | 'Good' | 'Fair' | 'Poor';
    retina_visibility: 'High' | 'Moderate' | 'Low' | 'Obscured';
  };
  screening: {
    severity_grade: 0 | 1 | 2 | 3 | 4;
    severity_label: string;
    confidence: number;
  };
  findings: {
    microaneurysms: {
      status: 'Detected' | 'Not detected' | 'Uncertain' | string;
      estimated_count: number | null;
      confidence: number;
      locations?: Array<{ x: number; y: number; quadrant?: string }>;
    };
    hard_exudates: {
      status: 'Detected' | 'Not detected' | 'Uncertain' | string;
      estimated_count: number | null;
      confidence: number;
      locations?: Array<{ x: number; y: number; radius?: number; quadrant?: string }>;
    };
    hemorrhages: {
      status: 'Detected' | 'Not detected' | 'Uncertain' | string;
      estimated_count: number | null;
      confidence: number;
      locations?: Array<{ x: number; y: number; radius?: number; quadrant?: string }>;
    };
    neovascularization: {
      status: 'Present' | 'Not clearly visible' | 'Suspected' | string;
      confidence: number;
    };
  };
  anatomy: {
    optic_disc: {
      detected: boolean;
      x: number | null;
      y: number | null;
      radius?: number;
      confidence: number;
    };
    fovea: {
      detected: boolean;
      x: number | null;
      y: number | null;
      radius?: number;
      confidence: number;
    };
  };
  blood_vessels: {
    detected: boolean;
    estimated_coverage_percent: number | null;
  };
  explanation: string;
  recommendation: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  role: string;
  facility: string;
  district: string;
  state: string;
  registrationNumber: string;
}

export interface Patient {
  id: string; // e.g. PAT-0001
  fullName: string;
  age: number;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  village: string;
  subDistrict: string;
  district: string;
  diabetesType: 'type_1' | 'type_2' | 'gestational' | 'prediabetes' | 'unknown' | string;
  diabetesDurationYears: number;
  hbA1c?: number;
  hypertension: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  lastVisitAt?: string;
  screeningCount: number;
  currentSeverity: DRSeverity;
  currentReferralStatus: ReferralPriority;
}

export interface ImageQualityMetrics {
  focusBlurScore: number; // 0-100
  illuminationScore: number; // 0-100
  fieldOfViewScore: number; // 0-100
  centeringScore: number; // 0-100
  overallScore: number; // 0-100
  status: ImageQualityStatus;
  reasons: string[];
}

export interface LesionCoordinate {
  id: string;
  type: 'microaneurysm' | 'hard_exudate' | 'cotton_wool' | 'hemorrhage' | 'neovascularization';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius?: number;
  confidence: number;
  quadrant: 'superior_nasal' | 'superior_temporal' | 'inferior_nasal' | 'inferior_temporal' | 'macular';
}

export interface RetinalStructureFindings {
  opticDisc: {
    detected: boolean;
    confidence: number;
    location: { x: number; y: number; radius: number };
    cupToDiscRatio: number;
    statusNotes: string;
  };
  fovea: {
    detected: boolean;
    confidence: number;
    location: { x: number; y: number; radius: number };
    macularEdemaRisk: 'low' | 'moderate' | 'high';
    statusNotes: string;
  };
  bloodVessels: {
    segmented: boolean;
    tortuosityIndex: 'normal' | 'mild' | 'moderate' | 'high';
    arteriovenousNicking: boolean;
    caliberScore: number;
  };
  microaneurysms: {
    detected: boolean;
    count: number;
    confidence: number;
    locations: LesionCoordinate[];
  };
  exudates: {
    detected: boolean;
    count: number;
    confidence: number;
    hasMacularThreat: boolean;
    locations: LesionCoordinate[];
  };
  hemorrhages: {
    detected: boolean;
    count: number;
    confidence: number;
    classification: 'none' | 'dot_blot' | 'flame_shaped' | 'widespread_4_quadrants';
    locations: LesionCoordinate[];
  };
  neovascularization: {
    detected: boolean;
    confidence: number;
    locationType: 'none' | 'disc_nvd' | 'elsewhere_nve';
    urgentSurgicalFlag: boolean;
  };
}

export interface AITrustReport {
  imageQualityScore: number; // 0-100
  modelConfidence: number; // 0-100
  lesionEvidenceScore: number; // 0-100
  xaiAgreementScore: number; // 0-100
  overallTrustScore: number; // 0-100
  status: TrustStatus;
  explanation: string;
  safetyNote: string;
}

export interface AIAnalysisResult {
  imageId: string;
  imageValid: boolean;
  rejectionReason?: string | null;
  severity: DRSeverity;
  icdrLevel: ClinicalICDRLevel;
  confidence: number; // 0-100
  trustReport: AITrustReport;
  structures: RetinalStructureFindings;
  gradCamHeatmapUrl?: string; // canvas or data url
  evidenceSummary: string[];
  suggestedReferral: ReferralPriority;
  suggestedFollowUpWeeks: number;
  managementSuggestion: string;
  analyzedAt: string;
  rawAIResponse?: RawAIResponse;
}

export interface DoctorDecisionRecord {
  decision: 'continue_current_plan' | 'modify_management' | 'refer_to_specialist' | 'request_recapture';
  modifiedPlanDetails?: string;
  reasonForChange?: string;
  specialistType?: string;
  referralHospital?: string;
  doctorNotes: string;
  followUpDate: string;
  doctorName: string;
  doctorId: string;
  decidedAt: string;
}

export interface ScreeningRecord {
  id: string; // e.g. SCR-2026-0891
  imageId?: string;
  patientId: string;
  visitNumber: number;
  date: string; // e.g. 2026-10-08
  time: string; // e.g. 09:42 PM
  timestamp: number;
  eye: 'OD' | 'OS'; // Right Eye (OD) or Left Eye (OS)
  doctorName: string;
  doctorId: string;
  imageSource: 'fundus_camera' | 'upload_file' | 'demo_sample';
  imageUrl: string;
  imageValid?: boolean;
  rejectionReason?: string | null;
  quality: ImageQualityMetrics;
  aiResult?: AIAnalysisResult;
  doctorReview?: DoctorDecisionRecord;
  reviewStatus: ReviewStatus;
  isRecaptureNeeded: boolean;
}

export interface LongitudinalComparison {
  previousScreeningId: string;
  previousDate: string;
  previousSeverity: DRSeverity;
  previousConfidence: number;
  previousLesionCount: number;

  currentScreeningId: string;
  currentDate: string;
  currentSeverity: DRSeverity;
  currentConfidence: number;
  currentLesionCount: number;

  changeStatus: 'stable' | 'progression' | 'regression' | 'insufficient_evidence';
  summaryMessage: string;
  microaneurysmDelta: number;
  exudateDelta: number;
  hemorrhageDelta: number;
  ophthalmologyAlert: boolean;
}

export interface ShareTokenRecord {
  token: string;
  patientId: string;
  createdAt: string;
  expiresAt: string;
  allowedVisits: 'all' | 'latest_only';
  accessCount: number;
  createdByName: string;
}
