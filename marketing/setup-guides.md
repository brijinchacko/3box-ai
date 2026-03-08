# 3BOX AI — Setup Guides for Manual Tasks

---

## 1. Google Analytics (GA4) Setup

**Code is ready!** You just need to:

1. Go to https://analytics.google.com
2. Click "Start measuring" → Create an account named "3BOX AI"
3. Create a property named "3box.ai"
4. Set up a Web data stream with URL: https://3box.ai
5. Copy the **Measurement ID** (starts with `G-`)
6. Add it to your server `.env` file:
   ```
   ssh -i ~/.ssh/seekof_deploy root@72.62.230.223
   nano /var/www/3boxai/.env
   # Add: NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```
7. Rebuild and restart:
   ```
   cd /var/www/3boxai
   npm run build
   pm2 restart 3box-ai
   ```

That's it! GA4 will start tracking immediately.

---

## 2. Google Search Console Setup

1. Go to https://search.google.com/search-console
2. Click "Add property" → Choose "URL prefix" → Enter: `https://3box.ai`
3. Verify ownership using ONE of these methods:

   **Option A: HTML file upload (easiest)**
   - Download the verification HTML file Google gives you
   - Upload it to your server:
     ```
     scp -i ~/.ssh/seekof_deploy google*.html root@72.62.230.223:/var/www/3boxai/public/
     ```
   - Click "Verify" in Google Search Console

   **Option B: DNS TXT record**
   - Go to your DNS provider (where 3box.ai domain is registered)
   - Add the TXT record Google provides
   - Click "Verify" (may take 5-10 minutes)

4. After verification, submit your sitemap:
   - Go to "Sitemaps" in the left menu
   - Enter: `https://3box.ai/sitemap.xml`
   - Click "Submit"

5. Verify sitemap was accepted:
   - Status should show "Success"
   - You'll see the number of discovered URLs (should be ~30)

6. Request indexing for key pages:
   - Go to "URL Inspection" in the left menu
   - Enter each important URL and click "Request Indexing":
     - https://3box.ai
     - https://3box.ai/tools/ats-checker
     - https://3box.ai/tools/resume-builder
     - https://3box.ai/tools/salary-estimator
     - https://3box.ai/pricing
     - https://3box.ai/blog

---

## 3. Google Analytics Goals/Events to Track

Once GA4 is running, set up these conversion events:

| Event Name | Trigger | Importance |
|-----------|---------|------------|
| `signup` | User creates account | Primary conversion |
| `plan_upgrade` | User upgrades to paid plan | Revenue conversion |
| `assessment_complete` | User completes skill assessment | Engagement |
| `resume_create` | User creates a resume | Feature usage |
| `tool_ats_check` | Free ATS tool used | Top-of-funnel |
| `newsletter_subscribe` | Newsletter signup | Lead gen |

These events are already being sent from the code! You just need to mark them as "conversions" in the GA4 interface:
- Go to GA4 → Admin → Events → Toggle "Mark as conversion" for the events above

---

## 4. Social Media Accounts to Create

If not already done:

| Platform | Handle | Profile |
|----------|--------|---------|
| Twitter/X | @3boxai | AI career platform |
| LinkedIn | 3BOX AI (company page) | AI career platform |
| YouTube | 3BOX AI | Career tips & platform demos |
| Instagram | @3box.ai | Career tips, infographics |
| Product Hunt | 3BOX AI | Product listing |

---

## 5. Product Hunt Checklist

Before launching on Product Hunt:

- [ ] Create Product Hunt maker account
- [ ] Prepare 5-6 high-quality screenshots/GIFs
- [ ] Write tagline, description, maker comment (see product-hunt-listing.md)
- [ ] Find 3-5 hunters with 500+ followers to consider hunting your product
- [ ] Schedule launch for Tuesday-Thursday (highest PH traffic)
- [ ] Prepare social media posts to drive votes on launch day
- [ ] Have email ready to send to your network asking for support
- [ ] Test all links and features before launch day
