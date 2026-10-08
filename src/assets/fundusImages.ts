export const SAMPLE_FUNDUS_IMAGES = {
  HEALTHY: '/src/assets/images/fundus_healthy_retina_1791475360855.jpg',
  MILD_DR: '/src/assets/images/fundus_mild_dr_retina_1791475372468.jpg',
  SEVERE_DR: '/src/assets/images/fundus_proliferative_dr_1791475384139.jpg',
  POOR_QUALITY: '/src/assets/images/fundus_poor_quality_retina_1791475394698.jpg',
  EXTERNAL_EYE: '/src/assets/images/external_eye_selfie_1791479117181.jpg',
};

export interface SampleFundusCase {
  id: string;
  name: string;
  category: 'healthy' | 'mild' | 'severe' | 'poor_quality' | 'non_retinal';
  description: string;
  url: string;
  tag: string;
}

export const PRESET_SAMPLE_CASES: SampleFundusCase[] = [
  {
    id: 'sample-healthy',
    name: 'Normal Retinal Fundus (OD)',
    category: 'healthy',
    description: 'Crisp optic disc margins, normal cup-to-disc ratio, intact foveal avascular zone, no microvascular lesions.',
    url: SAMPLE_FUNDUS_IMAGES.HEALTHY,
    tag: 'Grade 0 · Healthy',
  },
  {
    id: 'sample-mild',
    name: 'Early Non-Proliferative DR (OS)',
    category: 'mild',
    description: 'Scattered microaneurysms in paramacular arcade, isolated dot hemorrhages, early lipid exudate deposits.',
    url: SAMPLE_FUNDUS_IMAGES.MILD_DR,
    tag: 'Grade 1–2 · Mild/Moderate',
  },
  {
    id: 'sample-severe',
    name: 'Proliferative Retinopathy with NVE (OD)',
    category: 'severe',
    description: 'Extensive flame and blot hemorrhages across all 4 quadrants, cotton wool spots, fragile neovascular vessel fronds.',
    url: SAMPLE_FUNDUS_IMAGES.SEVERE_DR,
    tag: 'Grade 4 · High Risk Referral',
  },
  {
    id: 'sample-poor',
    name: 'Sub-Optimal Underexposed / Blurred Fundus',
    category: 'poor_quality',
    description: 'Severe motion blur, dark optical haze, obscured retinal vessels failing the automated quality threshold.',
    url: SAMPLE_FUNDUS_IMAGES.POOR_QUALITY,
    tag: 'Ungradable · Recapture Needed',
  },
  {
    id: 'sample-external',
    name: 'External Eye Selfie (Non-Fundus)',
    category: 'non_retinal',
    description: 'Normal phone camera photo showing external eyelid, iris, and eyelashes. Tests automated non-retinal image rejection.',
    url: SAMPLE_FUNDUS_IMAGES.EXTERNAL_EYE,
    tag: 'Non-Retinal · Rejection Test',
  },
];
