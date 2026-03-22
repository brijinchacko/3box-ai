// A4 dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_MARGIN_MM = 15;
export const A4_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - (A4_MARGIN_MM * 2); // 267mm

// Estimate lines capacity per page (~48 lines at 10pt with 1.4 line-height)
export const PAGE_LINE_CAPACITY = 48;

export interface ResumeContent {
  contact: { name: string; email: string; phone?: string; location: string; linkedin?: string; portfolio?: string };
  summary: string;
  experience: { id: string; company: string; role: string; location?: string; startDate: string; endDate: string; current: boolean; bullets: string[] }[];
  skills: string[];
  education: { id: string; institution: string; degree: string; field: string; startDate?: string; endDate: string; gpa?: string }[];
  certifications?: string[];
  projects?: { id: string; name: string; description: string; url?: string; technologies?: string[] }[];
}

export function calculatePageCount(content: ResumeContent): 1 | 2 {
  let totalLines = 0;
  totalLines += 3; // Name + contact block
  totalLines += Math.ceil((content.summary || '').length / 80) || 0;
  for (const exp of content.experience || []) {
    totalLines += 2; // Title + company
    totalLines += (exp.bullets || []).length;
  }
  totalLines += Math.ceil((content.skills || []).length / 4);
  totalLines += (content.education || []).length * 2;
  totalLines += (content.certifications || []).length;
  totalLines += (content.projects || []).length * 3;

  return totalLines <= PAGE_LINE_CAPACITY ? 1 : 2;
}

export function getContentFillPercentage(content: ResumeContent): number {
  // Returns 0-100 how full the content fills one page
  let totalLines = 0;
  totalLines += 3;
  totalLines += Math.ceil((content.summary || '').length / 80) || 0;
  for (const exp of content.experience || []) {
    totalLines += 2;
    totalLines += (exp.bullets || []).length;
  }
  totalLines += Math.ceil((content.skills || []).length / 4);
  totalLines += (content.education || []).length * 2;
  totalLines += (content.certifications || []).length;

  return Math.min(100, Math.round((totalLines / PAGE_LINE_CAPACITY) * 100));
}
