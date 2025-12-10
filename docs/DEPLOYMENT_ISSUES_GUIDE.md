# ScriptForge Deployment Issues - Debugging & Resolution Guide

## Overview

Your published app (`https://scriptforge-nine.vercel.app`) is experiencing **3 critical failures**:

1. ❌ **HTTP 500 on form submission** → No data sent to n8n → No scripts generated
2. ❌ **Missing PWA icon assets** → Frontend console errors → Visual/manifest issues
3. ❌ **Database not syncing** → Submissions row not created → Status polling fails forever

This guide walks through diagnosing and fixing each issue.

---

## Issue #1: HTTP 500 on Form Submit (BLOCKING)

### Symptoms
- Press "Generate Script" button
- Network tab shows: `POST /api/submit → 500 Internal Server Error`
- No submission appears in Supabase
- App says "Job Created" but nothing happens
- Status page shows "Initializing..." forever and eventually times out

### Root Cause
The `/api/submit` serverless function on Vercel cannot find the n8n webhook URL because:

```
Vercel backend (/api/submit.ts)
  ↓
  Tries to read: N8N_WEBHOOK_URL env var
  ↓
  Not found in Vercel Project Settings
  ↓
  Falls back to: API_BASE_URL, NEXT_PUBLIC_API_BASE_URL
  ↓
  Not found either
  ↓
  Returns: "n8n webhook URL not configured"
  ↓
  Code tries to POST to undefined URL
  ↓
  500 error ❌
```

**Important Concept**: 
- `VITE_API_BASE_URL` in `.env.local` is CLIENT-SIDE only
- Serverless functions (`/api/*`) are BACKEND and can't access `VITE_*` variables
- You must configure `N8N_WEBHOOK_URL` in Vercel's Project Settings

### How to Fix

**Step 1: Add Environment Variable to Vercel**

1. Open https://vercel.com/dashboard
2. Click on your project: **scriptforge**
3. Go to: **Settings** → **Environment Variables**
4. Click "Add Environment Variable"
5. Fill in:
   - **Name**: `N8N_WEBHOOK_URL`
   - **Value**: `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge`
   - **Environments**: Select "Production" (and Preview/Development if desired)
6. Click "Save"

**Step 2: Verify the Variable was Added**

You should see it listed in the Environment Variables section.

**Step 3: Redeploy the Project**

Via Vercel UI:
1. Go to **Deployments** tab
2. Find the most recent deployment
3. Click the **⋮** menu → **Redeploy**

OR via CLI:
```bash
cd c:\Users\c\Desktop\scriptforge
git add .
git commit -m "Trigger redeploy with N8N_WEBHOOK_URL env var"
git push
```

**Step 4: Test the Fix**

1. Wait for Vercel to finish deploying (2-3 minutes)
2. Refresh the app: https://scriptforge-nine.vercel.app
3. Fill in the form and click "Generate Script"
4. Check Network tab → `/api/submit` should now return **200** instead of 500

### Verify in Vercel Logs

```bash
# View live logs while testing
vercel logs --follow

# You should see:
# "Supabase not configured on the server" or SUCCESS message
# Check if submission was inserted
```

---

## Issue #2: Missing PWA Icon Assets (VISUAL)

### Symptoms
- Console shows: **`Failed to load resource: the server responded with a status of 404 (/assets/icons/icon-192x192.png)`**
- PWA install badge might not appear
- Manifest.json references missing files

### Root Cause
The `public/icons/` directory is either missing files or the build process isn't including them.

### How to Fix

**Step 1: Check what icons exist locally**

```powershell
# List all icons
Get-ChildItem -Path "c:\Users\c\Desktop\scriptforge\public\icons\" -Recurse

# Should show files like:
# icon-192x192.png
# icon-512x512.png
# etc.
```

**Step 2: If icons don't exist, create them**

You need to generate PWA icons. Use a tool like:
- https://pwa-asset-generator.netlify.app
- https://www.favicon-generator.org
- Or use your logo to generate multiple sizes

Required sizes for PWA:
- 192x192 (icon-192x192.png)
- 512x512 (icon-512x512.png)
- 144x144 (icon-144x144.png)
- 96x96 (icon-96x96.png)
- 72x72 (icon-72x72.png)

**Step 3: Place icons in public/icons/**

```powershell
# Icons should be in:
# c:\Users\c\Desktop\scriptforge\public\icons\icon-192x192.png
# c:\Users\c\Desktop\scriptforge\public\icons\icon-512x512.png
# etc.
```

**Step 4: Verify manifest.json**

Open `manifest.json` and check:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 5: Rebuild and redeploy**

```bash
cd c:\Users\c\Desktop\scriptforge
npm run build
git add .
git commit -m "Add missing PWA icons"
git push
```

**Step 6: Verify**

After deployment, check browser DevTools:
- **Application** → **Manifest** → should show all icons
- **Network** → icons should return 200 (not 404)

---

## Issue #3: Database Not Syncing (DATA FLOW)

### Symptoms
- Form submission returns job_id
- Submission NEVER appears in Supabase
- Status polling forever says "Initializing..."
- After 5 minutes, shows "Request Timed Out"

### Root Cause

The database insert in `/api/submit.ts` is failing because:

1. **Supabase credentials missing or wrong**
2. **Submissions table doesn't exist or has wrong schema**
3. **User doesn't have permission to insert**

### How to Fix

**Step 1: Verify Supabase Connection**

Check Vercel environment variables again:

```
SUPABASE_URL=https://nixmhntgxvynjkgeatft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (the long token)
```

Both should be in Vercel Settings → Environment Variables.

**Step 2: Check Submissions Table Schema**

1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → **submissions**
4. Verify columns:

```
id (UUID, primary key) ✓
status (text) ✓
script_id (text, nullable) ✓
source_url (text, nullable) ✓
source_type (text, nullable) ✓
category (text, nullable) ✓
requirements (text, nullable) ✓
output_type (text, nullable) ✓
tone (text, nullable) ✓
client_token (text, nullable) ✓
created_at (timestamp) ✓
```

**Step 3: Check Row-Level Security (RLS)**

1. In Supabase → **Authentication** → **Policies**
2. Find the `submissions` table policy
3. Should allow SERVICE ROLE to INSERT/UPDATE

OR disable RLS temporarily for debugging:

1. Select `submissions` table
2. Click **RLS toggle** to disable
3. Try submitting again

If it works with RLS disabled, your policy is too restrictive. Fix the policy.

**Step 4: Test Insert Manually**

In Supabase SQL Editor, run:

```sql
INSERT INTO submissions (status, source_url, source_type, category, requirements, output_type, tone, client_token)
VALUES ('processing', 'https://test.com', 'website', 'test', 'test', 'long', 'neutral', 'test-token')
RETURNING id;
```

Should return a new row with an ID. If it fails, you'll see the error message.

**Step 5: Check Vercel Logs**

```bash
vercel logs --follow
```

Submit a form and look for:
- "Supabase not configured" → Fix env vars
- "Failed to insert submission row" → Check table/RLS
- "Webhook call failed" → n8n is not reachable

---

## Complete Debugging Checklist

Use this to verify everything works:

### ✅ Backend Configuration

- [ ] Vercel env var: `N8N_WEBHOOK_URL` is set
- [ ] Vercel env var: `SUPABASE_URL` is set
- [ ] Vercel env var: `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Vercel project redeployed after adding env vars

### ✅ Frontend Assets

- [ ] `public/icons/` directory exists
- [ ] Icon files exist (192x192, 512x512)
- [ ] `manifest.json` references correct paths
- [ ] Build completes without errors: `npm run build`

### ✅ Database

- [ ] Supabase project is active
- [ ] `submissions` table exists
- [ ] All required columns exist
- [ ] RLS is either disabled or policy allows service role
- [ ] Manual INSERT test works

### ✅ n8n Webhook

- [ ] n8n instance is accessible: https://n8n.alphabusinessdesigns.co.uk
- [ ] Webhook endpoint exists: `/webhook/script-forge`
- [ ] Webhook is active (not paused)
- [ ] Workflow reads `submission_id` field
- [ ] Workflow updates Supabase row on completion

### ✅ Data Flow Test

1. Open app in browser
2. Fill form and submit
3. Network tab shows `/api/submit` → 200 OK
4. Check Supabase: new row appears in `submissions` table
5. Check n8n: execution appears in workflow history
6. Wait for workflow to complete
7. Check Supabase: row status changes to 'done' and `script_id` is populated
8. App shows results page with generated script

---

## Quick Fixes Summary

| Issue | Fix | Time |
|-------|-----|------|
| 500 on submit | Add `N8N_WEBHOOK_URL` to Vercel | 2 min |
| 404 icons | Add icon files to `public/icons/` | 5 min |
| DB not syncing | Check Supabase credentials & RLS | 5 min |
| n8n not receiving data | Verify webhook URL and n8n status | 3 min |

Total estimated fix time: **15-20 minutes**

---

## Getting Help

If you're still stuck:

1. **Check Vercel logs**: `vercel logs --follow`
2. **Check n8n execution history**: n8n dashboard → workflow executions
3. **Check Supabase logs**: Supabase dashboard → Database → SQL logs
4. **Check browser console**: F12 → Console tab → errors
5. **Share the error messages** from steps 1-3

---

## Next Steps

1. ✅ Add `N8N_WEBHOOK_URL` to Vercel (THIS IS CRITICAL)
2. ✅ Redeploy the app
3. ✅ Test form submission
4. ✅ Fix icon assets if still showing 404
5. ✅ Verify data flow end-to-end
