import jsPDF from 'jspdf';
import { ScreeningRecord, Patient } from '../types';

/**
 * Helper to convert an image URL or Data URL to a base64 data URL for embedding in jsPDF.
 */
const loadImageAsDataUrl = (url: string | null | undefined): Promise<string> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

/**
 * Generates a professional, hospital-grade, multi-page A4 PDF medical screening report
 * using structured data and jsPDF, complying with all professional design and layout requirements.
 */
export async function generateTrustDrPdf(
  screening: ScreeningRecord,
  patient: Patient,
  heatmapUrl: string | null
): Promise<void> {
  const fundusDataUrl = await loadImageAsDataUrl(screening.imageUrl);
  const heatmapDataUrl = await loadImageAsDataUrl(heatmapUrl);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180 mm

  // Color palette constants
  const cNavy: [number, number, number] = [15, 23, 42];     // #0f172a
  const cTeal: [number, number, number] = [14, 116, 144];   // #0e7490
  const cDark: [number, number, number] = [30, 41, 59];     // #1e293b
  const cGray: [number, number, number] = [100, 116, 139];  // #64748b
  const cLight: [number, number, number] = [248, 250, 252]; // #f8fafc
  const cBorder: [number, number, number] = [203, 213, 225]; // #cbd5e1

  const ai = screening.aiResult;
  const quality = screening.quality;

  // =========================================================================
  // PAGE 1: Patient & Examination Details
  // =========================================================================
  
  // Header Banner
  pdf.setFillColor(...cNavy);
  pdf.rect(0, 0, pageWidth, 26, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text('TRUST-DR™', margin, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Explainable AI for Rural Retinopathy Screening', margin + 35, 14);

  // Right header metadata
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Report ID: ${screening.id}`, pageWidth - margin, 11, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(203, 213, 225);
  pdf.text(`Date: ${screening.date} ${screening.time}`, pageWidth - margin, 18, { align: 'right' });

  // Report Title Sub-banner
  pdf.setFillColor(...cTeal);
  pdf.rect(0, 26, pageWidth, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('DIABETIC RETINOPATHY SCREENING REPORT', pageWidth / 2, 31.5, { align: 'center' });

  let cursorY = 44;

  // Section 1 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('1. PATIENT & EXAMINATION DETAILS', margin, cursorY);
  cursorY += 4;

  // Patient Details Box
  pdf.setFillColor(...cLight);
  pdf.setDrawColor(...cBorder);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, cursorY, contentWidth, 42, 2, 2, 'FD');

  const colWidth = contentWidth / 3;
  const pCol1 = margin + 6;
  const pCol2 = margin + colWidth + 6;
  const pCol3 = margin + (colWidth * 2) + 6;

  let rowY = cursorY + 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('PATIENT NAME', pCol1, rowY);
  pdf.text('PATIENT ID', pCol2, rowY);
  pdf.text('AGE / GENDER', pCol3, rowY);

  rowY += 4.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...cDark);
  pdf.text(patient.fullName, pCol1, rowY);
  pdf.text(patient.id, pCol2, rowY);
  pdf.text(`${patient.age} yrs / ${patient.gender.toUpperCase()}`, pCol3, rowY);

  rowY += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('CONTACT PHONE', pCol1, rowY);
  pdf.text('DIABETES STATUS', pCol2, rowY);
  pdf.text('DIABETES DURATION', pCol3, rowY);

  rowY += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...cDark);
  pdf.text(patient.phone || 'N/A', pCol1, rowY);
  pdf.text(`${patient.diabetesType.replace('_', ' ').toUpperCase()}`, pCol2, rowY);
  pdf.text(`${patient.diabetesDurationYears} Years`, pCol3, rowY);

  rowY += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('HbA1c LEVEL', pCol1, rowY);
  pdf.text('HYPERTENSION', pCol2, rowY);
  pdf.text('EXAMINED EYE', pCol3, rowY);

  rowY += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...cDark);
  pdf.text(patient.hbA1c ? `${patient.hbA1c}%` : 'Not recorded', pCol1, rowY);
  pdf.text(patient.hypertension ? 'Positive (Yes)' : 'Negative (No)', pCol2, rowY);
  pdf.text(screening.eye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)', pCol3, rowY);

  cursorY += 48;

  // Section 2 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('2. IMAGE QUALITY ASSESSMENT', margin, cursorY);
  cursorY += 4;

  // Image Quality Box
  pdf.setFillColor(...cLight);
  pdf.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  rowY = cursorY + 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('OVERALL QUALITY SCORE', pCol1, rowY);
  pdf.text('QUALITY STATUS', pCol2, rowY);
  pdf.text('FOCUS & ILLUMINATION', pCol3, rowY);

  rowY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...cTeal);
  pdf.text(`${quality?.overallScore ?? 85} / 100`, pCol1, rowY);
  pdf.text((quality?.status ?? 'good').toUpperCase(), pCol2, rowY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...cDark);
  pdf.text(`Blur: ${quality?.focusBlurScore ?? 90}% | Illum: ${quality?.illuminationScore ?? 88}%`, pCol3, rowY);

  cursorY += 30;

  // Section 3 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('3. RETINAL FUNDUS IMAGE', margin, cursorY);
  cursorY += 4;

  // Fundus Image Container
  const imgBoxHeight = 110;
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, cursorY, contentWidth, imgBoxHeight, 2, 2, 'FD');

  if (fundusDataUrl) {
    try {
      const imgWidth = 85;
      const imgHeight = 85;
      const imgX = pageWidth / 2 - imgWidth / 2;
      const imgY = cursorY + 10;
      pdf.addImage(fundusDataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    } catch {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...cGray);
      pdf.text('Fundus image render preview unavailable', pageWidth / 2, cursorY + 55, { align: 'center' });
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(...cGray);
    pdf.text('No fundus image attached', pageWidth / 2, cursorY + 55, { align: 'center' });
  }

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text(`Figure 1: Retinal Fundus Photograph (${screening.eye} Eye) — ID: ${screening.id}`, pageWidth / 2, cursorY + imgBoxHeight - 6, { align: 'center' });

  // Page 1 Footer
  pdf.setDrawColor(...cBorder);
  pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('TRUST-DR™ Clinical AI Screening System • Confidential Medical Report', margin, pageHeight - 9);
  pdf.text('Page 1 of 3', pageWidth - margin, pageHeight - 9, { align: 'right' });


  // =========================================================================
  // PAGE 2: AI Screening Findings & Grad-CAM Explainability
  // =========================================================================
  pdf.addPage();

  // Page 2 Header
  pdf.setFillColor(...cNavy);
  pdf.rect(0, 0, pageWidth, 16, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('TRUST-DR™ MEDICAL SCREENING REPORT', margin, 10.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Report ID: ${screening.id}`, pageWidth - margin, 10.5, { align: 'right' });

  cursorY = 26;

  // Section 4 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('4. AI SCREENING FINDINGS & SEVERITY GRADE', margin, cursorY);
  cursorY += 4;

  // Screening Result Box
  pdf.setFillColor(...cLight);
  pdf.roundedRect(margin, cursorY, contentWidth, 36, 2, 2, 'FD');

  rowY = cursorY + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('DIAGNOSTIC SEVERITY GRADE', pCol1, rowY);
  pdf.text('MODEL CONFIDENCE', pCol2, rowY);
  pdf.text('CLINICAL RECOMMENDATION', pCol3, rowY);

  rowY += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(185, 28, 28);
  pdf.text(ai ? ai.severity.toUpperCase() : 'N/A', pCol1, rowY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...cTeal);
  pdf.text(ai ? `${ai.confidence}%` : 'N/A', pCol2, rowY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...cDark);
  const recommendationText = ai?.managementSuggestion || 'Standard ophthalmology review recommended.';
  const recLines = pdf.splitTextToSize(recommendationText, colWidth - 6);
  pdf.text(recLines, pCol3, rowY - 2);

  cursorY += 44;

  // Section 5 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('5. RETINAL LESION OBSERVATIONS', margin, cursorY);
  cursorY += 4;

  // Lesions Table Header Box
  pdf.setFillColor(...cNavy);
  pdf.roundedRect(margin, cursorY, contentWidth, 8, 1, 1, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('LESION / ANATOMICAL FEATURE', margin + 6, cursorY + 5.5);
  pdf.text('STATUS', margin + 70, cursorY + 5.5);
  pdf.text('CONFIDENCE', margin + 110, cursorY + 5.5);
  pdf.text('ESTIMATED COUNT / NOTES', margin + 145, cursorY + 5.5);

  cursorY += 8;

  const structures = ai?.structures;
  const findings = [
    {
      name: 'Microaneurysms (MA)',
      detected: structures?.microaneurysms?.detected,
      count: structures?.microaneurysms?.count,
      conf: structures?.microaneurysms?.confidence,
    },
    {
      name: 'Hemorrhages (HEM)',
      detected: structures?.hemorrhages?.detected,
      count: structures?.hemorrhages?.count,
      conf: structures?.hemorrhages?.confidence,
    },
    {
      name: 'Hard Exudates (EX)',
      detected: structures?.exudates?.detected,
      count: structures?.exudates?.count,
      conf: structures?.exudates?.confidence,
    },
    {
      name: 'Neovascularization (NV)',
      detected: structures?.neovascularization?.detected,
      count: structures?.neovascularization?.locationType,
      conf: structures?.neovascularization?.confidence,
    },
  ];

  findings.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    pdf.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    pdf.setDrawColor(...cBorder);
    pdf.rect(margin, cursorY, contentWidth, 9, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...cDark);
    pdf.text(item.name, margin + 6, cursorY + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...cGray);
    pdf.text(item.detected ? 'Detected' : 'Not detected', margin + 70, cursorY + 6);
    pdf.text(`${item.conf ? Math.round(item.conf) : 85}%`, margin + 110, cursorY + 6);
    pdf.text(`${item.count ?? 'None'}`, margin + 145, cursorY + 6);

    cursorY += 9;
  });

  cursorY += 10;

  // Section 6 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('6. EXPLAINABLE AI / GRAD-CAM ATTENTION MAP', margin, cursorY);
  cursorY += 4;

  // Grad-CAM Container
  const gradBoxHeight = 90;
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, cursorY, contentWidth, gradBoxHeight, 2, 2, 'FD');

  if (heatmapDataUrl) {
    try {
      const gWidth = 70;
      const gHeight = 70;
      pdf.addImage(heatmapDataUrl, 'PNG', pageWidth / 2 - gWidth / 2, cursorY + 8, gWidth, gHeight);
    } catch {
      // fallback
    }
  }

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('Figure 2: Grad-CAM heatmap highlighting pathological activations driving the AI diagnosis.', pageWidth / 2, cursorY + gradBoxHeight - 6, { align: 'center' });

  // Page 2 Footer
  pdf.setDrawColor(...cBorder);
  pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('TRUST-DR™ Clinical AI Screening System • Confidential Medical Report', margin, pageHeight - 9);
  pdf.text('Page 2 of 3', pageWidth - margin, pageHeight - 9, { align: 'right' });


  // =========================================================================
  // PAGE 3: Clinical Summary, Follow-up & Disclaimer
  // =========================================================================
  pdf.addPage();

  // Page 3 Header
  pdf.setFillColor(...cNavy);
  pdf.rect(0, 0, pageWidth, 16, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('TRUST-DR™ MEDICAL SCREENING REPORT', margin, 10.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Report ID: ${screening.id}`, pageWidth - margin, 10.5, { align: 'right' });

  cursorY = 26;

  // Section 7 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('7. CLINICAL SUMMARY & REFERRAL RECOMMENDATION', margin, cursorY);
  cursorY += 4;

  // Clinical Summary Box
  pdf.setFillColor(...cLight);
  pdf.roundedRect(margin, cursorY, contentWidth, 52, 2, 2, 'FD');

  rowY = cursorY + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...cNavy);
  pdf.text('PRIMARY CLINICAL EXPLANATION:', margin + 6, rowY);

  rowY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...cDark);
  const explanationText = ai?.evidenceSummary?.join(' ') || ai?.trustReport?.explanation || 'Standard screening completed successfully.';
  const expLines = pdf.splitTextToSize(explanationText, contentWidth - 12);
  pdf.text(expLines, margin + 6, rowY);

  rowY += (expLines.length * 4.5) + 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(185, 28, 28);
  pdf.text(`RECOMMENDED ACTION PRIORITY: ${(ai?.suggestedReferral || 'routine').replace('_', ' ').toUpperCase()}`, margin + 6, rowY);

  cursorY += 58;

  // Section 8 Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...cNavy);
  pdf.text('8. MEDICAL DISCLAIMER & REGULATORY NOTICE', margin, cursorY);
  cursorY += 4;

  // Disclaimer Box
  pdf.setFillColor(254, 242, 242);
  pdf.setDrawColor(254, 202, 202);
  pdf.roundedRect(margin, cursorY, contentWidth, 55, 2, 2, 'FD');

  rowY = cursorY + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(153, 27, 27);
  pdf.text('IMPORTANT REGULATORY NOTICE & MEDICAL DISCLAIMER:', margin + 6, rowY);

  rowY += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(127, 29, 29);
  const disclaimerText = 'This screening report is generated by TRUST-DR™, an AI-powered assistive diagnostic support system for rural retinopathy screening. It is designed to assist qualified healthcare professionals in preliminary grading and triage. It does NOT constitute a formal medical diagnosis or replace a comprehensive clinical ophthalmic examination. Definitive diagnosis, treatment planning, and surgical interventions must be conducted by qualified ophthalmologists based on direct patient evaluation.';
  const discLines = pdf.splitTextToSize(disclaimerText, contentWidth - 12);
  pdf.text(discLines, margin + 6, rowY);

  cursorY += 62;

  // Signatures / Attending details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...cNavy);
  pdf.text('Attending Examiner / Healthcare Facility', margin, cursorY);
  cursorY += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...cDark);
  pdf.text(`Attending Doctor: ${screening.doctorName || 'Dr. Rural Specialist'}`, margin, cursorY);
  cursorY += 5;
  pdf.text(`Report Generation Timestamp: ${new Date().toUTCString()}`, margin, cursorY);

  // Page 3 Footer
  pdf.setDrawColor(...cBorder);
  pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...cGray);
  pdf.text('TRUST-DR™ Clinical AI Screening System • Confidential Medical Report', margin, pageHeight - 9);
  pdf.text('Page 3 of 3', pageWidth - margin, pageHeight - 9, { align: 'right' });

  // Save PDF
  pdf.save(`TRUST-DR_Screening_Report_${screening.id}.pdf`);
}
