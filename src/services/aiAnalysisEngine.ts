import {
  AIAnalysisResult,
  ImageQualityMetrics,
  RawAIResponse,
} from '../types';
import { VisionAnalysisEngine } from './visionAnalysisEngine';

export class AIAnalysisEngine {
  /**
   * Performs end-to-end vision AI analysis on the actual uploaded retinal image.
   * NEVER returns static/mock reports or hardcoded numbers.
   */
  public static async analyzeRetinalImage(
    imageUrl: string,
    options?: { patientName?: string; eye?: string }
  ): Promise<{ raw: RawAIResponse; result: AIAnalysisResult }> {
    const analysisId = VisionAnalysisEngine.generateAnalysisId();

    // Call vision engine (Gemini multimodal vision model on actual uploaded image)
    const raw = await VisionAnalysisEngine.analyzeImage(imageUrl, options);

    // Map into domain AIAnalysisResult with dynamic findings
    const result = VisionAnalysisEngine.mapToAIAnalysisResult(raw, imageUrl, analysisId);

    return { raw, result };
  }

  /**
   * Extract ImageQualityMetrics directly from the raw vision model assessment
   */
  public static extractQualityMetrics(raw: RawAIResponse): ImageQualityMetrics {
    const reasons: string[] = [];

    if (!raw.image_valid) {
      if (raw.rejection_reason) {
        reasons.push(raw.rejection_reason);
      } else {
        reasons.push('This image does not appear to be a valid fundus photograph. Please retake the image using a retinal/fundus camera.');
      }
      return {
        focusBlurScore: 0,
        illuminationScore: 0,
        fieldOfViewScore: 0,
        centeringScore: 0,
        overallScore: 0,
        status: 'unusable',
        reasons,
      };
    }

    if (raw.image_quality.blur === 'Severe' || raw.image_quality.blur === 'High') {
      reasons.push(`High optical blur detected (${raw.image_quality.blur} blur)`);
    }

    if (raw.image_quality.illumination === 'Dark') {
      reasons.push('Severe underexposure / image too dark');
    } else if (raw.image_quality.illumination === 'Overexposed') {
      reasons.push('Retinal overexposure / excessive optical glare');
    }

    if (raw.image_quality.contrast === 'Poor') {
      reasons.push('Poor vascular contrast preventing microaneurysm assessment');
    }

    if (raw.image_quality.retina_visibility === 'Low' || raw.image_quality.retina_visibility === 'Obscured') {
      reasons.push('Retina or key anatomical structures not sufficiently visible');
    }

    const statusMap: Record<string, 'excellent' | 'good' | 'acceptable' | 'poor' | 'unusable'> = {
      Excellent: 'excellent',
      Good: 'good',
      Acceptable: 'acceptable',
      Poor: 'poor',
      Unusable: 'unusable',
    };

    const qScore = Math.min(100, Math.max(0, raw.image_quality.score || 0));

    return {
      focusBlurScore: Math.min(100, Math.max(0, Math.round(qScore * (raw.image_quality.blur === 'None' ? 1.0 : raw.image_quality.blur === 'Low' ? 0.95 : 0.7)))),
      illuminationScore: Math.min(100, Math.max(0, Math.round(qScore * (raw.image_quality.illumination === 'Good' ? 1.0 : 0.8)))),
      fieldOfViewScore: Math.min(100, Math.max(0, Math.round(qScore * 0.95))),
      centeringScore: Math.min(100, Math.max(0, Math.round(qScore * (raw.anatomy.optic_disc.detected ? 1.0 : 0.65)))),
      overallScore: qScore,
      status: statusMap[raw.image_quality.status] || (qScore >= 85 ? 'excellent' : qScore >= 70 ? 'good' : qScore >= 55 ? 'acceptable' : qScore >= 40 ? 'poor' : 'unusable'),
      reasons,
    };
  }
}
