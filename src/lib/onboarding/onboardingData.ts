/**
 * Unified onboarding data model — shared between:
 *  - Landing page conversational wizard
 *  - /get-started form wizard
 *  - /signup pre-fill
 */

export interface UnifiedOnboardingProfile {
  fullName: string;
  email: string;
  location: string;
  currentStatus: string;
  experienceLevel: string;
  targetRole: string;
  industry: string[];
  skills: string[];
  bio: string;
  educationLevel: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  experiences: { title: string; company: string; duration: string; description: string }[];
  certifications: { name: string; issuer: string; date: string }[];
  projects: { name: string; description: string; url: string; technologies: string[] }[];
}

const KEYS = {
  profile: '3box_onboarding_profile',
  wizardData: '3box_onboarding_data',
  targetRole: '3box_target_role',
  interests: '3box_interests',
  location: '3box_user_location',
  skillScores: '3box_skill_scores',
  resumeDraft: '3box_resume_draft',
} as const;

const empty: UnifiedOnboardingProfile = {
  fullName: '', email: '', location: '', currentStatus: '', experienceLevel: '',
  targetRole: '', industry: [], skills: [], bio: '',
  educationLevel: '', fieldOfStudy: '', institution: '', graduationYear: '',
  phone: '', linkedin: '', portfolio: '',
  experiences: [], certifications: [], projects: [],
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Read unified profile from localStorage → sessionStorage fallback → merge */
export function getOnboardingProfile(): UnifiedOnboardingProfile | null {
  if (typeof window === 'undefined') return null;

  const local = safeParse<Record<string, unknown>>(localStorage.getItem(KEYS.profile));
  const session = safeParse<Record<string, unknown>>(sessionStorage.getItem(KEYS.wizardData));

  if (!local && !session) return null;

  return {
    ...empty,
    ...(session || {}),
    ...(local || {}),
    // Ensure skills is always an array
    skills: (local?.skills as string[] | undefined) ?? (session?.skills as string[] | undefined) ?? [],
  };
}

/** Save profile to BOTH localStorage and sessionStorage + update satellite keys */
export function saveOnboardingProfile(data: Partial<UnifiedOnboardingProfile>) {
  if (typeof window === 'undefined') return;

  // Merge with existing
  const existing = getOnboardingProfile() || empty;
  const merged = { ...existing, ...data };

  // Write canonical profile
  localStorage.setItem(KEYS.profile, JSON.stringify(merged));
  sessionStorage.setItem(KEYS.wizardData, JSON.stringify(merged));

  // Update satellite keys the landing page wizard uses
  if (merged.targetRole) {
    localStorage.setItem(KEYS.targetRole, merged.targetRole);
  }
  if (merged.skills.length > 0) {
    localStorage.setItem(KEYS.interests, JSON.stringify(merged.skills.slice(0, 5)));
  }
  if (merged.location) {
    localStorage.setItem(KEYS.location, merged.location);
  }
}

/** Wipe all onboarding data from both storages */
export function clearOnboardingData() {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/** Quick check if meaningful onboarding data exists */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  const p = getOnboardingProfile();
  return !!(p && p.fullName && p.targetRole);
}
