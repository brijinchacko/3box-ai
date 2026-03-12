/**
 * Job Page Detector — Identifies job posting pages and extracts metadata.
 * Used by all content scripts to detect when a user is viewing a job.
 */

export interface DetectedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  description?: string;
}

/**
 * Send job detection data to background worker and get match info.
 */
export async function checkJobWithBackend(job: DetectedJob): Promise<{
  alreadyApplied: boolean;
  applicationStatus: string | null;
  matchScore: number;
  atsType: string;
}> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'DETECT_JOB',
        data: {
          jobUrl: job.url,
          jobTitle: job.title,
          company: job.company,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      },
    );
  });
}

/**
 * Report successful application back to 3BOX dashboard.
 */
export async function syncAppliedJob(job: DetectedJob & {
  applicationMethod: string;
  atsType: string;
  coverLetter?: string;
}): Promise<{ success: boolean; applicationId: string }> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'SYNC_APPLICATION',
        data: {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          jobUrl: job.url,
          source: job.source,
          applicationMethod: job.applicationMethod,
          atsType: job.atsType,
          coverLetter: job.coverLetter,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      },
    );
  });
}
