# ScriptForge - Complete Fix & Verification Guide

## Executive Summary

Your app is published but **not functional** because:

1. **🔴 BLOCKING**: `N8N_WEBHOOK_URL` environment variable missing from Vercel backend
2. **🟡 MEDIUM**: Missing PWA icon assets (404 errors)
3. **🟡 MEDIUM**: Need to verify n8n workflow and Supabase schema

**Estimated fix time: 20-30 minutes**

---

## Phase 1: Critical Fix (Do This First!)

### The Problem in 30 Seconds

```
User submits form
    ↓
POST /api/submit
    ↓
Backend tries to find N8N_WEBHOOK_URL env var
    ↓
NOT FOUND (not configured in Vercel)
    ↓
Cannot send data to n8n
    ↓
HTTP 500 error ❌
```

### The Solution

**Add this to Vercel Project Settings:**

| Variable | Value |
|----------|-------|
| `N8N_WEBHOOK_URL` | `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge` |

### How to Do It

#### 1. Access Vercel Settings

- URL: https://vercel.com/dashboard
- Project: **scriptforge**
- Section: **Settings** → **Environment Variables**

#### 2. Add Variable

```
Name:         N8N_WEBHOOK_URL
Value:        https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
Environment:  Production ✓
```

Click **Save**.

#### 3. Redeploy

- Go to: **Deployments** tab
- Right-click latest deployment → **Redeploy**
- OR click ⋮ menu → **Redeploy**
- Wait for green checkmark (2-3 minutes)

#### 4. Test

```
1. Refresh app: https://scriptforge-nine.vercel.app
2. Fill form and click "Generate Script"
3. Open DevTools (F12) → Network tab
4. Look for /api/submit request
5. Should show 200 OK (not 500)
```

---

## Phase 2: Verify Database

### Check Supabase Setup

#### 1. Verify Credentials in Vercel

Go back to Vercel Settings → Environment Variables.

Check you have:
- ✅ `SUPABASE_URL` = `https://nixmhntgxvynjkgeatft.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (long token)
- ✅ `N8N_WEBHOOK_URL` = (just added)

#### 2. Verify Table Schema

Go to: https://supabase.com/dashboard → your project → **Table Editor**

Select **submissions** table and verify columns:

```
✓ id              (uuid, primary key)
✓ status          (text) - values: 'processing', 'done', 'failed'
✓ script_id       (text, nullable)
✓ source_url      (text, nullable)
✓ source_type     (text, nullable)
✓ category        (text, nullable)
✓ requirements    (text, nullable)
✓ output_type     (text, nullable)
✓ tone            (text, nullable)
✓ client_token    (text, nullable)
✓ created_at      (timestamp)
```

#### 3. Check Row-Level Security

Go to: **Authentication** → **Policies**

For `submissions` table:
- If RLS is **enabled**: Verify service role can INSERT/UPDATE
- If RLS is **disabled**: That's fine for now (but less secure)

**To test without worrying about RLS:**
1. Select `submissions` table
2. Toggle **RLS off** (if it's on)
3. Test form submission
4. If it works, RLS was the issue - fix the policy later

#### 4. Manual Test

In Supabase → **SQL Editor**, run:

```sql
INSERT INTO submissions 
(status, source_url, source_type, category, requirements, output_type, tone, client_token)
VALUES 
('processing', 'https://test.com', 'website', 'test', 'test', 'long', 'neutral', 'test-token')
RETURNING id, created_at;
```

Should succeed and return a new row.

#### 5. Check Submissions Table

After form submission, run in SQL Editor:

```sql
SELECT id, status, source_url, created_at 
FROM submissions 
ORDER BY created_at DESC 
LIMIT 10;
```

You should see your submitted form with `status = 'processing'`.

---

## Phase 3: Verify n8n Workflow

### 1. Check Webhook is Accessible

```bash
# Test with curl (opens PowerShell in VS Code terminal)
curl -X POST "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge" `
  -H "Content-Type: application/json" `
  -d '{"test": "data", "submission_id": "test-123"}'
```

Should return something (not error).

### 2. Check Workflow in n8n

- URL: https://n8n.alphabusinessdesigns.co.uk
- Find: **ScriptForge** workflow (or whatever it's called)
- Verify it's **active** (not paused)
- Verify it has a **webhook trigger** listening on `/webhook/script-forge`

### 3. Check Workflow Logic

The workflow should:

```
1. Receive webhook POST with body containing submission_id
2. Extract: source_url, source_type, category, requirements, output_type, tone
3. Call LLM API to generate script
4. Extract: title_suggestions, description, tags, scenes (array with scene, text)
5. Create a row in Supabase.scripts table
6. UPDATE Supabase.submissions SET status='done', script_id=<script_id>
```

### 4. Check Execution History

In n8n:
- Open workflow
- Click **View** → **Executions**
- Submit a form from the app
- Should see new execution appear in list
- Click to view details and check for errors

---

## Phase 4: Verify Frontend Assets

### 1. Check Icon Files

Open File Explorer:

```
c:\Users\c\Desktop\scriptforge\public\icons\
```

Should contain:
- ✓ icon-192x192.png
- ✓ icon-512x512.png
- ✓ icon-144x144.png (optional but recommended)
- ✓ icon-96x96.png (optional but recommended)

If missing, you need to:

1. **Download existing icons** from: https://scriptforge-nine.vercel.app/icons/
   - Right-click → Save as
   
2. OR **Generate new icons**:
   - Tool: https://pwa-asset-generator.netlify.app
   - Upload your logo
   - Download all sizes

3. **Place in `public/icons/`**

### 2. Check Manifest

Open: `manifest.json`

Should have valid icon references:

```json
"icons": [
  {
    "src": "/icons/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icons/icon-512x512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

### 3. Rebuild and Deploy

```bash
cd c:\Users\c\Desktop\scriptforge
npm run build
git add .
git commit -m "Fix: Add missing PWA icon assets"
git push
```

Then redeploy from Vercel.

### 4. Verify in Browser

After deployment:
- Open app: https://scriptforge-nine.vercel.app
- Press F12 → **Application** tab
- Click **Manifest** in left sidebar
- All icons should show with green checkmarks
- **Network** tab should show all icon files returning 200 (not 404)

---

## Complete Verification Checklist

Use this to verify everything after fixes:

```
BACKEND SETUP
☐ Vercel env var: N8N_WEBHOOK_URL is set correctly
☐ Vercel env var: SUPABASE_URL is set
☐ Vercel env var: SUPABASE_SERVICE_ROLE_KEY is set
☐ Vercel project redeployed after adding env vars
☐ Vercel logs show no "webhook URL not configured" errors

FRONTEND ASSETS
☐ public/icons/ directory exists and has all required PNG files
☐ manifest.json references icons correctly
☐ npm run build completes without errors
☐ App deployed to Vercel
☐ Browser DevTools shows no 404 errors for icons

DATABASE
☐ Supabase submissions table exists
☐ All required columns exist with correct types
☐ RLS policy allows service role to insert/update (or RLS is disabled)
☐ Manual INSERT test works in SQL Editor
☐ Supabase env vars in Vercel are correct

n8n WORKFLOW
☐ n8n instance is accessible and logged in
☐ Workflow exists and is active (not paused)
☐ Webhook endpoint path is correct: /webhook/script-forge
☐ Workflow receives webhook POST correctly
☐ Workflow generates script successfully
☐ Workflow updates Supabase row (status='done', script_id set)

DATA FLOW TEST
☐ User fills form and clicks "Generate Script"
☐ Network tab: /api/submit returns 200 OK
☐ Supabase: new row created in submissions table
☐ n8n: execution appears in execution history
☐ n8n: workflow completes without errors
☐ Supabase: row status changed to 'done' and script_id is populated
☐ App: results page displays generated script
☐ Console: no JavaScript errors
```

---

## Troubleshooting by Error

### ❌ "Failed to load resource: 404" (icon files)

**Solution**: Add icon files to `public/icons/` and redeploy

### ❌ "HTTP 500" on form submit

**Solution**: Add `N8N_WEBHOOK_URL` to Vercel and redeploy

### ❌ Form submits but nothing in Supabase

**Causes**:
- RLS policy too restrictive → Disable RLS or fix policy
- Wrong `SUPABASE_SERVICE_ROLE_KEY` → Verify in Vercel settings
- Submissions table missing columns → Check schema

**Debug**: Check Vercel logs: `vercel logs --follow`

### ❌ Submission created but n8n doesn't execute

**Causes**:
- Webhook URL wrong → Verify: `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge`
- Workflow paused → Check n8n dashboard
- Workflow has errors → Check n8n execution history

**Debug**: Check n8n execution logs

### ❌ n8n runs but Supabase not updated

**Causes**:
- n8n using wrong API key → Verify `SUPABASE_SERVICE_ROLE_KEY` in n8n
- Workflow not calling UPDATE → Check workflow logic
- Wrong column names → Verify `status`, `script_id` columns

**Debug**: Check n8n execution logs → look for UPDATE node

### ❌ "Initializing..." forever, then timeout

**Cause**: Status polling finds nothing because submission row wasn't created

**Solution**: Fix the initial `/api/submit` issue first

---

## Testing Commands

### Test Vercel Logs
```bash
vercel logs --follow
```
Submit a form and watch real-time logs.

### Test Supabase Query
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) as total_submissions FROM submissions;
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;
```

### Test n8n Webhook
```bash
# In PowerShell
curl -X POST "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge" `
  -H "Content-Type: application/json" `
  -d '{"test":"data"}'
```

---

## Success Criteria

Your app is **fully fixed** when:

1. ✅ Form submission returns 200 OK
2. ✅ Submission row appears in Supabase within 1 second
3. ✅ n8n workflow executes within 2 seconds
4. ✅ Workflow completes (generates script) in 1-5 minutes
5. ✅ Supabase row updates with status='done' and script_id
6. ✅ Results page displays generated script
7. ✅ No console errors in browser
8. ✅ All icon files load (no 404s)

---

## Next Steps

1. **Start with Phase 1**: Add `N8N_WEBHOOK_URL` to Vercel (CRITICAL)
2. **Test form submission**: Should return 200, not 500
3. **Run through Phases 2-4**: Verify database, workflow, assets
4. **Run verification checklist**: Make sure all ✓ are checked
5. **Test end-to-end**: Submit → See results

**Estimated total time: 20-30 minutes**

---

## Questions?

- **Vercel issue?** → Check `vercel logs --follow`
- **Database issue?** → Check Supabase SQL logs
- **n8n issue?** → Check n8n execution history
- **Frontend issue?** → Check browser console (F12)

All issues will show clear error messages in one of these places.

