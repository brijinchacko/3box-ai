# 3BOX AI Chrome Extension — Specification

## 1. Overview

The 3BOX AI Chrome Extension is a browser companion to the 3BOX AI job application platform. It auto-fills job application forms on employer career portals and job boards, syncs applied jobs back to the user's 3BOX AI dashboard, and attaches the user's stored resume and cover letter to applications.

### Supported Platforms

**Job Boards (Easy Apply):**
- LinkedIn Jobs
- Indeed
- Naukri

**ATS Portals (Form Auto-fill):**
- Workday (wd1-wd5 instances via myworkdayjobs.com)
- iCIMS (iframe-based apply forms)
- Taleo
- SuccessFactors
- SmartRecruiters
- BambooHR
- Jobvite

> Greenhouse and Lever are handled server-side via direct API submission and do not require the extension.

---

## 2. Architecture

### 2.1 Auth Flow

1. User clicks "Connect Extension" in the extension popup.
2. Extension opens the 3BOX AI web app at `/extension-auth`.
3. If the user is not signed in, they are redirected to `/signin?callbackUrl=/extension-auth`.
4. Once authenticated, the page automatically calls `POST /api/extension/token` to generate a JWT.
5. The JWT is written to `localStorage` under the key `3box_extension_token`.
6. A custom DOM event `3box-token-ready` is dispatched.
7. The extension's auth-bridge content script listens for this event, reads the token from `localStorage`, and passes it to the background service worker for persistent storage.

### 2.2 JWT Token Payload

The token is signed with `NEXTAUTH_SECRET` and expires after **30 days**. Payload:

| Field            | Type    | Description                        |
| ---------------- | ------- | ---------------------------------- |
| `userId`         | string  | Database user ID                   |
| `email`          | string  | User's email address               |
| `name`           | string  | User's display name                |
| `plan`           | string  | Subscription plan (`FREE`, etc.)   |
| `extensionAuth`  | boolean | Always `true` — marks token origin |

### 2.3 Data Flow

```
Extension (content script on ATS page)
   │
   ├─ GET /api/extension/resume ──► Fetch resume data for auto-fill
   │
   ├─ Auto-fill form fields on the ATS page
   │
   └─ POST /api/extension/sync ──► Sync completed application to dashboard
                                      │
                                      ├─ Creates JobApplication record
                                      ├─ Deduplicates by (userId, jobUrl, company)
                                      └─ Consumes daily application slot
```

All API calls use `Authorization: Bearer <jwt>` header. The backend validates the JWT and checks for the `extensionAuth: true` claim.

---

## 3. Supported ATS Systems

### 3.1 Detection

ATS type is detected from the job URL using regex patterns defined in `src/lib/ats/router.ts`. The `detectATSType()` function matches against known URL patterns and returns an `ATSType` enum value.

### 3.2 Workday

**URL Patterns:**
- `{company}.wd{N}.myworkdayjobs.com/...`
- `myworkdayjobs.com/{company}/...`
- `workday.com/.../job`

**Parsed Metadata:** company slug, Workday instance (wd1-wd5), site locale, job slug, job ID.

**Form Fields Auto-filled:**

| Field            | Source                           |
| ---------------- | -------------------------------- |
| First Name       | Parsed from resume contact name  |
| Last Name        | Parsed from resume contact name  |
| Email            | `resume.contact.email`           |
| Phone            | `resume.contact.phone`           |
| Address          | `resume.contact.location`        |
| LinkedIn URL     | `resume.contact.linkedin`        |
| Portfolio URL    | `resume.contact.portfolio`       |
| Cover Letter     | Generated cover letter text      |
| Resume Filename  | `FirstName_LastName_Resume.pdf`  |

### 3.3 iCIMS

**URL Patterns:**
- `{company}.icims.com/jobs/{id}/...`
- `careers-{company}.icims.com/jobs/{id}/...`
- `jobs-{company}.icims.com/jobs/{id}`

**Parsed Metadata:** company slug, numeric job ID, portal URL.

**Form Fields Auto-filled:**

| Field            | Source                           |
| ---------------- | -------------------------------- |
| First Name       | Parsed from resume contact name  |
| Last Name        | Parsed from resume contact name  |
| Email            | `resume.contact.email`           |
| Phone            | `resume.contact.phone`           |
| City             | Parsed from location (pre-comma) |
| State            | Parsed from location (post-comma)|
| LinkedIn URL     | `resume.contact.linkedin`        |
| Cover Letter     | Generated cover letter text      |
| Resume Filename  | `FirstName_LastName_Resume.pdf`  |

### 3.4 Other Extension-Supported ATS

The following are detected by URL pattern and routed to the extension queue, but do not yet have dedicated parsers or form-mapping modules:

| ATS             | URL Pattern                        |
| --------------- | ---------------------------------- |
| Taleo           | `taleo.net`, `oracle.com/...taleo` |
| SuccessFactors  | `successfactors.com`, `sap.com/...career` |
| SmartRecruiters | `smartrecruiters.com`              |
| BambooHR        | `bamboohr.com/.../jobs`            |
| Jobvite         | `jobvite.com`                      |
| LinkedIn        | `linkedin.com/jobs`                |
| Indeed          | `indeed.com`, `indeed.co`          |
| Naukri          | `naukri.com`                       |

### 3.5 Non-Extension ATS (Server-Side Only)

| ATS        | Channel    | Notes                      |
| ---------- | ---------- | -------------------------- |
| Greenhouse | `ats_api`  | Direct API submission      |
| Lever      | `ats_api`  | Direct API submission      |
| Ashby      | `portal_queue` | No API or extension support |

---

## 4. Features

### 4.1 Auto-fill Application Forms

The extension fetches the user's resume via `GET /api/extension/resume` and populates form fields on the current ATS page. For Workday and iCIMS, structured form data is prepared server-side using `prepareWorkdayApplicationData()` and `prepareIcimsApplicationData()` respectively. The content script maps this data to DOM input fields.

### 4.2 Resume Attachment

The resume file is named `{FirstName}_{LastName}_Resume.pdf` (spaces replaced with underscores). The extension handles file-input injection for ATS portals that require file upload.

### 4.3 Cover Letter Injection

If a cover letter is available, it is included in the form data (`coverLetter` field) and injected into the appropriate text area or upload field on the ATS form.

### 4.4 Job Sync to Dashboard

After a successful application, the extension calls `POST /api/extension/sync` with application details. This creates a `JobApplication` record with:
- Status set to `APPLIED`
- Source set to `extension`
- Application method set to `extension`
- Audit trail containing `appliedVia: chrome_extension` with a timestamp
- The user's daily application slot is consumed

Duplicate applications are detected by matching `(userId, jobUrl, company)` and are not re-created.

### 4.5 Application Routing

The backend router (`src/lib/ats/router.ts`) determines the optimal application channel for each job URL. When the extension is connected (`hasExtension: true`), extension-supported ATS types are routed to the `extension_queue` channel at priority 2. Batch routing is also supported via `routeApplicationsBatch()`.

**Channel Priority Order:**
1. `ats_api` — Direct ATS API (Greenhouse, Lever)
2. `extension_queue` — Browser extension auto-fill
3. `user_email` — User's connected Gmail/Outlook
4. `cold_email` — Cold email via company domain
5. `portal_queue` — Manual portal application (last resort)

---

## 5. API Contract

All extension endpoints are located under `/api/extension/`. Authentication is via `Authorization: Bearer <jwt>` header. The JWT must contain `extensionAuth: true`.

### 5.1 POST /api/extension/token

**Purpose:** Generate a JWT for the extension.

**Auth:** Requires an active NextAuth session (cookie-based).

**Request:** No body required.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "30d"
}
```

**Errors:**
- `401` — User not authenticated

---

### 5.2 POST /api/extension/sync

**Purpose:** Sync an applied job from the extension to the dashboard.

**Auth:** Bearer JWT with `extensionAuth: true`.

**Request Body:**
```json
{
  "jobTitle": "Software Engineer",
  "company": "Acme Corp",
  "location": "San Francisco, CA",
  "jobUrl": "https://acme.wd5.myworkdayjobs.com/...",
  "source": "extension",
  "applicationMethod": "extension",
  "atsType": "workday",
  "coverLetter": "Dear Hiring Manager..."
}
```

| Field              | Type   | Required | Description                     |
| ------------------ | ------ | -------- | ------------------------------- |
| `jobTitle`         | string | Yes      | Job title                       |
| `company`          | string | Yes      | Company name                    |
| `location`         | string | No       | Job location                    |
| `jobUrl`           | string | No       | Full URL of the job posting     |
| `source`           | string | No       | Defaults to `"extension"`       |
| `applicationMethod`| string | No       | Defaults to `"extension"`       |
| `atsType`          | string | No       | ATS platform identifier         |
| `coverLetter`      | string | No       | Cover letter text used          |

**Response (success):**
```json
{
  "success": true,
  "applicationId": "clx..."
}
```

**Response (duplicate):**
```json
{
  "message": "Already tracked",
  "applicationId": "clx..."
}
```

**Errors:**
- `400` — Missing `jobTitle` or `company`
- `401` — Invalid or missing token
- `500` — Server error

---

### 5.3 GET /api/extension/resume

**Purpose:** Retrieve the user's most recently updated resume data.

**Auth:** Bearer JWT with `extensionAuth: true`.

**Request:** No body or query params.

**Response:**
```json
{
  "resume": {
    "contact": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/janedoe",
      "portfolio": "https://janedoe.dev"
    }
  }
}
```

The `resume` field contains the full structured resume data object as stored in the database.

**Errors:**
- `401` — Invalid or missing token
- `404` — No resume found for this user

---

## 6. Status

The Chrome Extension is currently **under Chrome Web Store review** (pending verification). It is not yet publicly available for installation.

---

## 7. Browser Support

| Browser          | Support Level | Notes                              |
| ---------------- | ------------- | ---------------------------------- |
| Google Chrome    | Primary       | Full support, primary target       |
| Microsoft Edge   | Secondary     | Chromium-based, compatible         |

The extension uses Manifest V3 APIs and targets Chromium-based browsers.

---

## 8. Privacy & Permissions

### Required Permissions

| Permission        | Reason                                                        |
| ----------------- | ------------------------------------------------------------- |
| `activeTab`       | Read and auto-fill form fields on the current ATS page        |
| `storage`         | Persist the JWT auth token in `chrome.storage.local`          |
| `host_permissions`| Access to ATS domains (myworkdayjobs.com, icims.com, etc.) and the 3BOX AI API |

### Data Handling

- The extension stores only a JWT token locally. No passwords or credentials are persisted.
- Resume data is fetched on-demand from the 3BOX AI backend and is not cached in extension storage.
- Job application data (title, company, URL) is sent to the 3BOX AI backend only after the user applies.
- The extension does not collect browsing history, keystrokes, or data from non-ATS pages.
- Communication with the backend uses HTTPS exclusively.
- The JWT token expires after 30 days and must be re-generated via the auth flow.

---

## Source Files

| File | Purpose |
| ---- | ------- |
| `src/app/extension-auth/page.tsx` | Extension auth page — token generation UI |
| `src/app/api/extension/token/route.ts` | JWT token generation endpoint |
| `src/app/api/extension/sync/route.ts` | Sync applied jobs to dashboard |
| `src/app/api/extension/resume/route.ts` | Serve resume data to extension |
| `src/lib/ats/router.ts` | ATS detection and application routing |
| `src/lib/ats/workday.ts` | Workday URL parser and form data preparer |
| `src/lib/ats/icims.ts` | iCIMS URL parser and form data preparer |
