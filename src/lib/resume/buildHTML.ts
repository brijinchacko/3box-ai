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

/* ─── Shared fragments ────────────────────────────────────────── */

function printBar(accent: string): string {
  return `<div class="no-print" style="background:#f3f4f6;text-align:center;padding:12px;font-size:14px;color:#374151;">
    Press <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) to save as PDF &nbsp;|&nbsp;
    <button onclick="window.print()" style="background:${accent};color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;">Print / Save PDF</button>
  </div>`;
}

function watermark(show: boolean): string {
  if (!show) return '';
  return `<div class="watermark">Created with jobTED AI &mdash; jobted.ai</div>`;
}

function docHead(title: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    /* ── Reset ──────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ${css}
    /* ── Print ──────────────────────────────── */
    @media print {
      body { background: #fff !important; }
      .no-print { display: none !important; }
      .page { padding: 32px 40px; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>`;
}

/* ================================================================
   Template 1 — Modern  (accent #2563eb)
   Two-column: left sidebar + right content
   ================================================================ */

function buildModern(p: BuildHTMLParams): string {
  const accent = '#2563eb';
  const { contact, summary, experience, education, skills, certifications, showWatermark } = p;

  /* ── Sidebar contact lines ─────────────── */
  const contactLines: string[] = [];
  if (contact.email) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9993;</span> ${esc(contact.email)}</div>`);
  if (contact.phone) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9742;</span> ${esc(contact.phone)}</div>`);
  if (contact.location) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9906;</span> ${esc(contact.location)}</div>`);
  if (contact.linkedin) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">in</span> <a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a></div>`);
  if (contact.portfolio) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9901;</span> <a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a></div>`);

  /* ── Sidebar skills pills ──────────────── */
  const skillPills = skills
    .map((s) => `<span class="skill-pill">${esc(s)}</span>`)
    .join('');

  /* ── Experience HTML ────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div><span class="entry-role">${esc(exp.role)}</span><span class="entry-company"> &mdash; ${esc(exp.company)}</span></div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <div class="entry-location">${esc(exp.location)}</div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education HTML ─────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-role">${esc(edu.institution)}</span>
          </div>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="edu-detail">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Certifications HTML ────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}
         <span class="cert-name">${esc(c.name)}</span>
         <span class="cert-issuer"> &mdash; ${esc(c.issuer)} (${esc(c.date)})</span></div>`,
    )
    .join('');

  const css = `
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #fff; line-height: 1.55;
    }
    .page { max-width: 800px; margin: 0 auto; display: flex; min-height: 100vh; }

    /* ── Sidebar ────────────────────────────── */
    .sidebar {
      width: 30%; background: #f0f4f8; padding: 36px 20px 28px; flex-shrink: 0;
    }
    .sidebar h1 { font-size: 20px; font-weight: 700; color: ${accent}; margin-bottom: 16px; line-height: 1.25; }
    .sidebar-section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #d0d8e4;
    }
    .sidebar-item { font-size: 12px; color: #374151; margin-bottom: 6px; word-break: break-word; }
    .sidebar-item a { color: ${accent}; text-decoration: none; }
    .sidebar-icon { display: inline-block; width: 16px; color: ${accent}; font-style: normal; text-align: center; margin-right: 4px; }
    .skill-pill {
      display: inline-block; font-size: 11px; background: ${accent}15; color: ${accent};
      border: 1px solid ${accent}30; border-radius: 12px; padding: 2px 10px; margin: 2px 3px 2px 0;
    }

    /* ── Main content ───────────────────────── */
    .main { width: 70%; padding: 36px 32px 28px; }
    .section-title {
      font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 24px 0 10px; padding-bottom: 5px; border-bottom: 2px solid ${accent};
    }
    .section-title:first-child { margin-top: 0; }
    .summary { font-size: 13px; color: #4b5563; line-height: 1.6; }
    .entry { margin-bottom: 16px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 14px; color: #111827; }
    .entry-company { font-size: 13px; color: #6b7280; }
    .entry-date { font-size: 12px; color: #9ca3af; white-space: nowrap; }
    .entry-location { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
    .edu-detail { font-size: 13px; color: #4b5563; margin-top: 2px; }
    ul { list-style: disc; padding-left: 18px; margin-top: 4px; }
    li { font-size: 13px; color: #374151; margin-bottom: 3px; line-height: 1.5; }
    .cert { font-size: 13px; color: #374151; margin-bottom: 5px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }
    .watermark {
      text-align: center; font-size: 11px; color: #9ca3af;
      margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <h1>${esc(contact.name)}</h1>

      <div class="sidebar-section-title">Contact</div>
      ${contactLines.join('\n      ')}

      ${skills.length ? `<div class="sidebar-section-title">Skills</div><div>${skillPills}</div>` : ''}
    </div>

    <!-- Main content -->
    <div class="main">
      ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

      ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

      ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

      ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

      ${watermark(showWatermark)}
    </div>
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 2 — Classic  (accent #1e293b)
   Single-column, centered header, serif-inspired, traditional
   ================================================================ */

function buildClassic(p: BuildHTMLParams): string {
  const accent = '#1e293b';
  const { contact, summary, experience, education, skills, certifications, showWatermark } = p;

  /* ── Contact row (pipe-separated) ──────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactRow = contactParts.join(' <span class="pipe">|</span> ');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div><span class="entry-role">${esc(exp.role)}</span>, <span class="entry-company">${esc(exp.company)}</span><span class="entry-loc"> &mdash; ${esc(exp.location)}</span></div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-role">${esc(edu.institution)}</span>
            <span class="entry-loc"> &mdash; ${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? `, GPA: ${esc(edu.gpa)}` : ''}</span>
          </div>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
      </div>`,
    )
    .join('');

  /* ── Skills ─────────────────────────────── */
  const skillsHTML = skills.map((s) => esc(s)).join(' &bull; ');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}
         <span class="cert-name">${esc(c.name)}</span>
         <span class="cert-issuer"> &mdash; ${esc(c.issuer)} (${esc(c.date)})</span></div>`,
    )
    .join('');

  const css = `
    body {
      font-family: Georgia, 'Times New Roman', 'Palatino Linotype', serif;
      color: #1f2937; background: #fff; line-height: 1.5;
    }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }

    /* ── Header ─────────────────────────────── */
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 28px; font-weight: 700; color: ${accent}; margin-bottom: 8px; letter-spacing: 0.5px; }
    .contact-row { font-size: 12px; color: #6b7280; font-family: 'Segoe UI', system-ui, sans-serif; }
    .contact-row a { color: ${accent}; text-decoration: none; }
    .pipe { color: #d1d5db; margin: 0 4px; }
    .header hr { border: none; border-top: 1.5px solid ${accent}; margin-top: 16px; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
      color: ${accent}; margin: 24px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1;
    }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 14px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 700; font-size: 14px; color: ${accent}; }
    .entry-company { font-size: 14px; color: #374151; }
    .entry-loc { font-size: 13px; color: #6b7280; }
    .entry-date { font-size: 12px; color: #9ca3af; white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif; }
    ul { list-style: disc; padding-left: 20px; margin-top: 6px; }
    li { font-size: 13px; color: #374151; margin-bottom: 3px; line-height: 1.5; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 13px; color: #4b5563; line-height: 1.6; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Skills ──────────────────────────────── */
    .skills { font-size: 13px; color: #374151; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 13px; color: #374151; margin-bottom: 5px; font-family: 'Segoe UI', system-ui, sans-serif; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    .watermark {
      text-align: center; font-size: 11px; color: #9ca3af;
      margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-row">${contactRow}</div>
      <hr />
    </div>

    ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

    ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${skills.length ? `<div class="section-title">Skills</div><div class="skills">${skillsHTML}</div>` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 3 — Minimal  (accent #374151)
   Single-column, maximum whitespace, ultraclean
   ================================================================ */

function buildMinimal(p: BuildHTMLParams): string {
  const accent = '#374151';
  const { contact, summary, experience, education, skills, certifications, showWatermark } = p;

  /* ── Contact inline ─────────────────────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactLine = contactParts.join(' <span class="dot">&middot;</span> ');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(exp.role)}</span>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <div class="entry-company">${esc(exp.company)} &middot; ${esc(exp.location)}</div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(edu.institution)}</span>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="entry-company">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Skills ─────────────────────────────── */
  const skillsHTML = skills.map((s) => esc(s)).join(' &middot; ');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}${esc(c.name)} &mdash; ${esc(c.issuer)}, ${esc(c.date)}</div>`,
    )
    .join('');

  const css = `
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #374151; background: #fff; line-height: 1.6;
    }
    .page { max-width: 800px; margin: 0 auto; padding: 56px 60px; }

    /* ── Header ─────────────────────────────── */
    .header { margin-bottom: 36px; }
    .header h1 { font-size: 32px; font-weight: 300; color: #111827; margin-bottom: 2px; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 14px; color: #9ca3af; margin-bottom: 12px; }
    .contact-line { font-size: 12px; color: #9ca3af; }
    .contact-line a { color: #6b7280; text-decoration: none; }
    .dot { margin: 0 6px; color: #d1d5db; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;
      color: #9ca3af; margin: 32px 0 14px;
    }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 18px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 500; font-size: 14px; color: #111827; }
    .entry-company { font-size: 13px; color: #9ca3af; margin-top: 1px; }
    .entry-date { font-size: 12px; color: #d1d5db; white-space: nowrap; }
    ul { list-style: none; padding-left: 0; margin-top: 6px; }
    li { font-size: 13px; color: #4b5563; margin-bottom: 4px; line-height: 1.55; padding-left: 14px; position: relative; }
    li::before { content: '\\2013'; position: absolute; left: 0; color: #d1d5db; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 13px; color: #6b7280; line-height: 1.65; }

    /* ── Skills ──────────────────────────────── */
    .skills { font-size: 13px; color: #6b7280; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 13px; color: #6b7280; margin-bottom: 5px; }
    .verified { color: #16a34a; margin-right: 4px; }

    .watermark {
      text-align: center; font-size: 11px; color: #d1d5db;
      margin-top: 40px; padding-top: 16px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      ${summary ? `<div class="subtitle">${esc(experience[0]?.role ?? '')}</div>` : ''}
      <div class="contact-line">${contactLine}</div>
    </div>

    ${summary ? `<div class="section-title">About</div><div class="summary">${esc(summary)}</div>` : ''}

    ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${skills.length ? `<div class="section-title">Skills</div><div class="skills">${skillsHTML}</div>` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 4 — Creative  (accent #7c3aed purple)
   Gradient header + two-column body
   ================================================================ */

function buildCreative(p: BuildHTMLParams): string {
  const accent = '#7c3aed';
  const { contact, summary, experience, education, skills, certifications, showWatermark } = p;

  /* ── Contact pills ──────────────────────── */
  const pillColors = ['#a855f7', '#00d4ff', '#00ff88', '#a855f7', '#00d4ff'];
  const contactParts: { label: string; value: string; href?: string }[] = [];
  if (contact.email) contactParts.push({ label: contact.email, value: contact.email });
  if (contact.phone) contactParts.push({ label: contact.phone, value: contact.phone });
  if (contact.location) contactParts.push({ label: contact.location, value: contact.location });
  if (contact.linkedin) contactParts.push({ label: contact.linkedin, value: contact.linkedin, href: `https://${contact.linkedin}` });
  if (contact.portfolio) contactParts.push({ label: contact.portfolio, value: contact.portfolio, href: `https://${contact.portfolio}` });

  const pillsHTML = contactParts
    .map((cp, i) => {
      const color = pillColors[i % pillColors.length];
      const inner = cp.href
        ? `<a href="${esc(cp.href)}" style="color:${color};text-decoration:none;">${esc(cp.label)}</a>`
        : esc(cp.label);
      return `<span class="pill" style="border-color:${color}30;background:${color}0a;color:${color};">${inner}</span>`;
    })
    .join('');

  /* ── Skills tags ────────────────────────── */
  const tagColors = ['#a855f7', '#00d4ff', '#00ff88'];
  const skillTags = skills
    .map((s, i) => {
      const c = tagColors[i % tagColors.length];
      return `<span class="skill-tag" style="border-color:${c}40;color:${c};background:${c}08;">${esc(s)}</span>`;
    })
    .join('');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(exp.role)}</span>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <div class="entry-company">${esc(exp.company)} &middot; ${esc(exp.location)}</div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(edu.institution)}</span>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="entry-company">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}
         <span class="cert-name">${esc(c.name)}</span>
         <span class="cert-issuer"> &mdash; ${esc(c.issuer)} (${esc(c.date)})</span></div>`,
    )
    .join('');

  const css = `
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #fff; line-height: 1.55;
    }
    .page { max-width: 800px; margin: 0 auto; overflow: hidden; }

    /* ── Gradient header ────────────────────── */
    .creative-header {
      background: linear-gradient(135deg, #a855f7, #00d4ff, #00ff88);
      padding: 32px 40px 28px; color: #fff;
    }
    .creative-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .creative-header .role { font-size: 14px; color: rgba(255,255,255,0.8); }

    /* ── Contact pills ──────────────────────── */
    .pills { padding: 16px 40px; display: flex; flex-wrap: wrap; gap: 8px; }
    .pill {
      display: inline-block; font-size: 11px; padding: 4px 14px;
      border-radius: 20px; border: 1px solid; white-space: nowrap;
    }
    .pill a { text-decoration: none; }

    /* ── Summary with accent bar ────────────── */
    .summary-wrap { display: flex; gap: 14px; padding: 0 40px; margin: 8px 0 20px; }
    .accent-bar {
      width: 3px; flex-shrink: 0; border-radius: 2px;
      background: linear-gradient(to bottom, #a855f7, #00d4ff);
    }
    .summary { font-size: 13px; color: #4b5563; line-height: 1.65; }

    /* ── Two-column body ────────────────────── */
    .body-grid { display: flex; gap: 28px; padding: 0 40px 32px; }
    .col-left { width: 35%; flex-shrink: 0; }
    .col-right { width: 65%; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 0 0 10px; padding-bottom: 5px;
      border-bottom: 2px solid ${accent}30;
    }
    .section-title + .section-title { margin-top: 24px; }

    /* ── Skills tags ─────────────────────────── */
    .skill-tag {
      display: inline-block; font-size: 11px; padding: 3px 10px; margin: 2px 3px 2px 0;
      border-radius: 12px; border: 1px solid; font-weight: 500;
    }
    .skills-wrap { margin-bottom: 24px; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 16px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 14px; color: #111827; }
    .entry-company { font-size: 13px; color: #9ca3af; margin-top: 1px; }
    .entry-date { font-size: 12px; color: #9ca3af; white-space: nowrap; }
    ul { list-style: disc; padding-left: 18px; margin-top: 4px; }
    li { font-size: 13px; color: #374151; margin-bottom: 3px; line-height: 1.5; }

    .cert { font-size: 13px; color: #374151; margin-bottom: 5px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Bottom gradient bar ─────────────────── */
    .bottom-bar {
      height: 4px; margin: 0 40px;
      background: linear-gradient(90deg, #a855f7, #00d4ff, #00ff88); border-radius: 2px;
    }

    .watermark {
      text-align: center; font-size: 11px; color: #9ca3af;
      margin-top: 24px; padding: 12px 40px 24px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Gradient header -->
    <div class="creative-header">
      <h1>${esc(contact.name)}</h1>
      ${experience.length ? `<div class="role">${esc(experience[0].role)}</div>` : ''}
    </div>

    <!-- Contact pills -->
    <div class="pills">${pillsHTML}</div>

    <!-- Summary with accent bar -->
    ${summary ? `<div class="summary-wrap"><div class="accent-bar"></div><div class="summary">${esc(summary)}</div></div>` : ''}

    <!-- Two-column body -->
    <div class="body-grid">
      <!-- Left column: skills + certs -->
      <div class="col-left">
        ${skills.length ? `<div class="skills-wrap"><div class="section-title">Skills</div>${skillTags}</div>` : ''}
        ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}
      </div>

      <!-- Right column: experience + education -->
      <div class="col-right">
        ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}
        ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}
      </div>
    </div>

    <!-- Bottom gradient bar -->
    <div class="bottom-bar"></div>

    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Main dispatcher
   ================================================================ */

export function buildResumeHTML(params: BuildHTMLParams): string {
  switch (params.template) {
    case 'classic':
      return buildClassic(params);
    case 'minimal':
      return buildMinimal(params);
    case 'creative':
      return buildCreative(params);
    case 'modern':
    default:
      return buildModern(params);
  }
}
