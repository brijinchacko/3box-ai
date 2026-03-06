/* ─── HTML builder ─────────────────────────────────────────────── */

export interface BuildHTMLParams {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: string[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    verified: boolean;
  }[];
  template: string;
  showWatermark: boolean;
}

export function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildResumeHTML(params: BuildHTMLParams): string {
  const {
    contact,
    summary,
    experience,
    education,
    skills,
    certifications,
    template,
    showWatermark,
  } = params;

  // Template-based accent colours
  const accentMap: Record<string, string> = {
    modern: '#2563eb',
    executive: '#1e293b',
    minimal: '#374151',
    creative: '#7c3aed',
  };
  const accent = accentMap[template] ?? accentMap.modern;

  const experienceHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${esc(exp.role)}</span>
            <span class="entry-sub"> &mdash; ${esc(exp.company)}</span>
          </div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${esc(exp.endDate)}</span>
        </div>
        <div class="entry-location">${esc(exp.location)}</div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  const educationHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${esc(edu.degree)} ${esc(edu.field)}</span>
            <span class="entry-sub"> &mdash; ${esc(edu.institution)}</span>
            ${edu.gpa ? `<span class="gpa">GPA: ${esc(edu.gpa)}</span>` : ''}
          </div>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
      </div>`,
    )
    .join('');

  const skillsHTML = skills.map((s) => esc(s)).join(' &bull; ');

  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}
         <span class="cert-name">${esc(c.name)}</span>
         <span class="cert-issuer"> &mdash; ${esc(c.issuer)} (${esc(c.date)})</span></div>`,
    )
    .join('');

  const watermarkHTML = showWatermark
    ? `<div class="watermark">Created with nxtED AI &mdash; nxted.ai</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(contact.name)} &ndash; Resume</title>
  <style>
    /* ── Reset & base ──────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 56px;
    }

    /* ── Header / contact ─────────────────── */
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid ${accent}; }
    .header h1 { font-size: 26px; font-weight: 700; color: ${accent}; margin-bottom: 6px; }
    .contact-row { font-size: 13px; color: #6b7280; }
    .contact-row a { color: ${accent}; text-decoration: none; }
    .contact-row span + span::before { content: ' | '; color: #d1d5db; }

    /* ── Section titles ───────────────────── */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${accent};
      margin: 20px 0 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }

    /* ── Entries ───────────────────────────── */
    .entry { margin-bottom: 14px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-title { font-weight: 600; font-size: 14px; }
    .entry-sub { font-size: 14px; color: #6b7280; }
    .entry-date { font-size: 12px; color: #9ca3af; white-space: nowrap; }
    .entry-location { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
    .gpa { font-size: 12px; color: #9ca3af; margin-left: 8px; }
    ul { list-style: disc; padding-left: 20px; margin-top: 4px; }
    li { font-size: 13px; color: #374151; margin-bottom: 3px; line-height: 1.45; }

    /* ── Skills ────────────────────────────── */
    .skills { font-size: 13px; color: #374151; }

    /* ── Certifications ───────────────────── */
    .cert { font-size: 13px; color: #374151; margin-bottom: 4px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Summary ──────────────────────────── */
    .summary { font-size: 13px; color: #4b5563; line-height: 1.55; }

    /* ── Watermark ────────────────────────── */
    .watermark {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    /* ── Print tweaks ─────────────────────── */
    @media print {
      body { background: #fff; }
      .page { padding: 32px 40px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#f3f4f6;text-align:center;padding:12px;font-size:14px;color:#374151;">
    Press <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) to save as PDF &nbsp;|&nbsp;
    <button onclick="window.print()" style="background:${accent};color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;">Print / Save PDF</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-row">
        <span>${esc(contact.email)}</span>
        <span>${esc(contact.phone)}</span>
        <span>${esc(contact.location)}</span>
        ${contact.linkedin ? `<span><a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a></span>` : ''}
        ${contact.portfolio ? `<span><a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a></span>` : ''}
      </div>
    </div>

    <!-- Summary -->
    ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

    <!-- Experience -->
    ${experience.length ? `<div class="section-title">Experience</div>${experienceHTML}` : ''}

    <!-- Education -->
    ${education.length ? `<div class="section-title">Education</div>${educationHTML}` : ''}

    <!-- Skills -->
    ${skills.length ? `<div class="section-title">Technical Skills</div><div class="skills">${skillsHTML}</div>` : ''}

    <!-- Certifications -->
    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

    ${watermarkHTML}
  </div>
</body>
</html>`;
}
