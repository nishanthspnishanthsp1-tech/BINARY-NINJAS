import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for retinal image base64 uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI if API key exists
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini GenAI client initialized successfully with server-side API key.');
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

/**
 * Helper to extract mimeType and base64 data from dataURL, file path, or base64 string
 */
function resolveImagePayload(imageInput: string): { mimeType: string; base64Data: string } | null {
  if (!imageInput) return null;

  // Case 1: Data URL (e.g. data:image/jpeg;base64,....)
  if (imageInput.startsWith('data:')) {
    const matches = imageInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], base64Data: matches[2] };
    }
  }

  // Case 2: Local file path on disk (e.g. /src/assets/images/... or src/assets/images/...)
  const normalizedPath = imageInput.startsWith('/') ? imageInput.slice(1) : imageInput;
  const fullDiskPath = path.resolve(__dirname, normalizedPath);
  if (fs.existsSync(fullDiskPath) && fs.statSync(fullDiskPath).isFile()) {
    const ext = path.extname(fullDiskPath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    const buffer = fs.readFileSync(fullDiskPath);
    return { mimeType, base64Data: buffer.toString('base64') };
  }

  // Case 3: Raw base64 string
  if (imageInput.length > 200 && !imageInput.includes(' ') && !imageInput.includes('/')) {
    return { mimeType: 'image/jpeg', base64Data: imageInput };
  }

  return null;
}

/**
 * POST /api/analyze-retina
 * Executes deep vision validation and DR analysis on the actual uploaded image
 */
app.post('/api/analyze-retina', async (req, res) => {
  try {
    const { image, imageId, patientName, eye } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const payload = resolveImagePayload(image);
    if (!payload) {
      return res.status(400).json({ error: 'Unsupported image format or missing file' });
    }

    // If Gemini client is available, run multimodal vision model
    if (ai) {
      const prompt = `You are a clinical tele-ophthalmology artificial intelligence screening assistant for Diabetic Retinopathy (DR).
Examine this image with utmost clinical rigor.

CRITICAL INSTRUCTIONS:
You are analyzing THIS uploaded retinal image only.
Do not rely on previous images.
Do not assume the result from previous patients.
Do not generate a generic diabetic retinopathy report.
Do not invent lesions.
Only report findings that are visually supported by the provided image.
If something cannot be confidently identified, return Uncertain or null.

1. IMAGE VALIDATION:
Determine whether this uploaded image is an authentic internal retinal/fundus photograph.
ACCEPT:
- Real retinal fundus photographs captured via a fundus camera or ophthalmoscope showing retina, retinal blood vessels, optic disc, or macula.
REJECT:
- Human face photographs
- Normal camera selfies
- External eye photographs (showing eyelids, lashes, cornea, iris, sclera, anterior segment)
- Mobile phone photos of rooms, people, skin, objects
- X-rays, CT/MRI scans, ultrasound
- Documents, prescription slips, textbooks, screenshots
- Severe optical artifacts, totally blank/black images, or images where the fundus is completely obscured.

If the image is NOT a valid retinal fundus photograph:
- Set "image_valid": false
- Set "image_type" to the actual category ("external_eye", "face", "document", "skin", "non_retinal", etc.)
- Set "rejection_reason": "This image does not appear to be a valid fundus photograph. Please retake the image using a retinal/fundus camera." (or specific reason like "No retinal structures detected - image appears to be an external eye photograph").
- Set "image_quality": { "score": 0, "status": "Unusable", "blur": "Severe", "illumination": "Dark", "contrast": "Poor", "retina_visibility": "Obscured" }
- Set "screening": { "severity_grade": 0, "severity_label": "Ungradable / Non-Retinal", "confidence": 0 }
- Do not provide DR lesion findings or diagnosis.

2. FUNDUS IMAGE QUALITY CHECK (Only if image_valid is true):
Analyze optical sharpness, blur, illumination/exposure, contrast, field of view, and visibility of optic disc and macula.
Calculate a dynamic, image-specific "score" between 0 and 100 based on THIS specific image.
NEVER use a fixed number like 93. Calculate it dynamically from the image's actual clarity.
Status must be one of: "Excellent" (score >= 85), "Good" (70-84), "Acceptable" (55-69), "Poor" (40-54), "Unusable" (< 40).
If the quality score is below 55 (status "Poor" or "Unusable"), note the defects in the explanation.

3. DIABETIC RETINOPATHY LESION ANALYSIS (Only if image_valid is true):
Inspect the actual retinal photograph for microvascular pathology:
A. Microaneurysms: small punctate red dots. Count visible, provide status ("Detected", "Not detected", "Uncertain"), confidence (0-100), and approximate normalized coordinates x, y (percentages from 0 to 100) and quadrant ("macular", "superior_nasal", "superior_temporal", "inferior_nasal", "inferior_temporal"). If none, count: 0, locations: [].
B. Hard Lipid Exudates: waxy yellow/white lipoprotein deposits. Count clusters, status, confidence, approximate coordinates x, y, radius (0-100). If none, count: 0, locations: [].
C. Hemorrhages: dot, blot, or flame hemorrhages. Count visible, status, confidence, approximate coordinates x, y, radius (0-100). If none, count: 0, locations: [].
D. Neovascularization: fragile new vessel fronds (NVD/NVE). Status ("Present", "Not clearly visible", "Suspected"), confidence.
E. Optic Disc: center coordinates x, y (0-100), confidence, or null if obscured.
F. Fovea/Macula: center coordinates x, y (0-100), confidence, or null if obscured.
G. Blood Vessels: detected (true/false), estimated_coverage_percent (0-100).

4. SEVERITY GRADING:
Base the grade strictly on visible findings from THIS specific image:
- Grade 0: No apparent diabetic retinopathy (No microaneurysms or lesions)
- Grade 1: Mild NPDR (Microaneurysms only)
- Grade 2: Moderate NPDR (More than microaneurysms, scattered hemorrhages/exudates)
- Grade 3: Severe NPDR (>20 intraretinal hemorrhages in all 4 quadrants, venous beading, or prominent IRMA)
- Grade 4: Proliferative diabetic retinopathy (Neovascularization NVD/NVE or vitreous hemorrhage)
- If quality is ungradable: "Indeterminate - insufficient image evidence"

5. MODEL CONFIDENCE:
Provide a realistic confidence percentage (0-100) reflecting certainty for this specific image and image quality. Never use a hardcoded value.

6. EXPLANATION & RECOMMENDATION:
- "explanation": Comprehensive, image-specific clinical reasoning detailing the exact visible lesion findings and why this screening result was generated.
- "recommendation": Clinical decision-support suggestion (e.g. annual screening, 6-month check, referral within 2-4 weeks, or urgent vitreo-retinal consultation). Clearly phrase as decision support, not final medical diagnosis.

Output MUST be strictly valid JSON matching this schema:
{
  "image_valid": boolean,
  "image_type": string,
  "rejection_reason": string or null,
  "image_quality": {
    "score": number,
    "status": "Excellent" | "Good" | "Acceptable" | "Poor" | "Unusable",
    "blur": "None" | "Low" | "Moderate" | "High" | "Severe",
    "illumination": "Good" | "Adequate" | "Dark" | "Overexposed" | "Uneven",
    "contrast": "High" | "Good" | "Fair" | "Poor",
    "retina_visibility": "High" | "Moderate" | "Low" | "Obscured"
  },
  "screening": {
    "severity_grade": 0 | 1 | 2 | 3 | 4,
    "severity_label": string,
    "confidence": number
  },
  "findings": {
    "microaneurysms": {
      "status": "Detected" | "Not detected" | "Uncertain",
      "estimated_count": number or null,
      "confidence": number,
      "locations": [ { "x": number, "y": number, "quadrant": string } ]
    },
    "hard_exudates": {
      "status": "Detected" | "Not detected" | "Uncertain",
      "estimated_count": number or null,
      "confidence": number,
      "locations": [ { "x": number, "y": number, "radius": number, "quadrant": string } ]
    },
    "hemorrhages": {
      "status": "Detected" | "Not detected" | "Uncertain",
      "estimated_count": number or null,
      "confidence": number,
      "locations": [ { "x": number, "y": number, "radius": number, "quadrant": string } ]
    },
    "neovascularization": {
      "status": "Present" | "Not clearly visible" | "Suspected",
      "confidence": number
    }
  },
  "anatomy": {
    "optic_disc": {
      "detected": boolean,
      "x": number or null,
      "y": number or null,
      "radius": number,
      "confidence": number
    },
    "fovea": {
      "detected": boolean,
      "x": number or null,
      "y": number or null,
      "radius": number,
      "confidence": number
    }
  },
  "blood_vessels": {
    "detected": boolean,
    "estimated_coverage_percent": number or null
  },
  "explanation": string,
  "recommendation": string
}`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let lastAiError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: payload.mimeType,
                      data: payload.base64Data,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const responseText = response.text?.trim() || '';
          if (responseText) {
            try {
              const parsed = JSON.parse(responseText);
              return res.json({ success: true, data: parsed, engine: modelName });
            } catch (parseErr) {
              console.warn(`Failed to parse ${modelName} JSON output:`, parseErr);
            }
          }
        } catch (callErr: any) {
          lastAiError = callErr;
          console.warn(`Model ${modelName} call failed, trying next candidate...`, callErr?.message || callErr);
        }
      }

      console.warn('All Gemini models encountered errors:', lastAiError?.message);
    }

    // Do NOT return a fake report or mock report.
    return res.status(503).json({
      success: false,
      error: 'AI analysis could not be completed. Please try again.',
    });
  } catch (error: any) {
    console.error('Error during retinal analysis:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'AI analysis could not be completed. Please try again.',
    });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in dev mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRUST-DR Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
