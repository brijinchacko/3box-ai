/**
 * Generate a clean PDF resume from structured resume data using pdf-lib.
 * Returns a Buffer containing the PDF bytes.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ResumeContact {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

interface ResumeExperience {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

interface ResumeEducation {
  degree: string;
  field?: string;
  institution: string;
  endDate?: string;
}

interface ResumeData {
  contact: ResumeContact;
  summary?: string;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: string[];
  certifications?: { name: string }[];
}

const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export async function generateResumePdf(data: ResumeData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = { name: 18, sectionTitle: 12, body: 10, small: 9 };
  const lineHeight = 14;
  const sectionGap = 16;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // Helper: add new page if needed
  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  // Helper: draw text with word wrap
  const drawText = (text: string, x: number, size: number, f = font, color = rgb(0.2, 0.2, 0.2), maxW = CONTENT_WIDTH) => {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = f.widthOfTextAtSize(testLine, size);
      if (width > maxW && line) {
        ensureSpace(lineHeight);
        page.drawText(line, { x, y, size, font: f, color });
        y -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ensureSpace(lineHeight);
      page.drawText(line, { x, y, size, font: f, color });
      y -= lineHeight;
    }
  };

  // Helper: section title
  const drawSectionTitle = (title: string) => {
    y -= sectionGap;
    ensureSpace(24);
    page.drawText(title.toUpperCase(), {
      x: MARGIN, y, size: fontSize.sectionTitle, font: fontBold, color: rgb(0.15, 0.38, 0.92),
    });
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 1,
      color: rgb(0.15, 0.38, 0.92),
    });
    y -= 12;
  };

  // ── Header ──
  page.drawText(data.contact.name, {
    x: MARGIN, y, size: fontSize.name, font: fontBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 22;

  const contactParts = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.contact.linkedin,
  ].filter(Boolean);
  if (contactParts.length) {
    drawText(contactParts.join('  |  '), MARGIN, fontSize.small, font, rgb(0.4, 0.45, 0.5));
  }
  y -= 4;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1.5,
    color: rgb(0.15, 0.38, 0.92),
  });
  y -= 8;

  // ── Summary ──
  if (data.summary) {
    drawSectionTitle('Professional Summary');
    drawText(data.summary, MARGIN, fontSize.body);
  }

  // ── Experience ──
  if (data.experience?.length) {
    drawSectionTitle('Work Experience');
    for (const exp of data.experience) {
      ensureSpace(40);
      const dates = `${exp.startDate || ''} – ${exp.endDate || 'Present'}`;
      page.drawText(`${exp.role}`, { x: MARGIN, y, size: fontSize.body, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      const dateW = font.widthOfTextAtSize(dates, fontSize.small);
      page.drawText(dates, { x: PAGE_WIDTH - MARGIN - dateW, y, size: fontSize.small, font, color: rgb(0.5, 0.5, 0.5) });
      y -= lineHeight;
      page.drawText(exp.company, { x: MARGIN, y, size: fontSize.body, font, color: rgb(0.35, 0.35, 0.35) });
      y -= lineHeight + 2;

      for (const bullet of (exp.bullets || [])) {
        if (!bullet || bullet.length < 5) continue;
        ensureSpace(lineHeight * 2);
        const cleanBullet = bullet.replace(/^\*\*/g, '').replace(/\*\*/g, '').replace(/^[•·●\-*]\s*/g, '').trim();
        page.drawText('•', { x: MARGIN + 4, y, size: fontSize.body, font, color: rgb(0.15, 0.38, 0.92) });
        drawText(cleanBullet, MARGIN + 16, fontSize.body, font, rgb(0.25, 0.25, 0.25), CONTENT_WIDTH - 16);
        y -= 2;
      }
      y -= 6;
    }
  }

  // ── Education ──
  if (data.education?.length) {
    drawSectionTitle('Education');
    for (const edu of data.education) {
      ensureSpace(30);
      const eduText = [edu.degree, edu.field].filter(Boolean).join(' in ');
      page.drawText(eduText, { x: MARGIN, y, size: fontSize.body, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
      const instLine = [edu.institution, edu.endDate].filter(Boolean).join(' — ');
      page.drawText(instLine, { x: MARGIN, y, size: fontSize.body, font, color: rgb(0.35, 0.35, 0.35) });
      y -= lineHeight + 4;
    }
  }

  // ── Skills ──
  if (data.skills?.length) {
    drawSectionTitle('Skills');
    drawText(data.skills.join('  •  '), MARGIN, fontSize.body, font, rgb(0.25, 0.25, 0.25));
  }

  // ── Certifications ──
  if (data.certifications?.length) {
    drawSectionTitle('Certifications');
    for (const cert of data.certifications) {
      ensureSpace(lineHeight);
      page.drawText(`• ${cert.name}`, { x: MARGIN, y, size: fontSize.body, font, color: rgb(0.25, 0.25, 0.25) });
      y -= lineHeight;
    }
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
