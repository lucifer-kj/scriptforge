# Vercel Environment Variables Setup Guide

## 🔴 CRITICAL: This is why your app is failing

The `/api/submit` endpoint is returning **HTTP 500** because the n8n webhook URL is not configured in your Vercel backend environment.

### The Problem

1. **Client-side variables** (prefixed with `VITE_`) are bundled into your frontend code
2. **Server-side variables** (no prefix) are only available to backend functions like `/api/submit`
3. Your `.env.local` file has `VITE_API_BASE_URL` - which is **client-side only**
4. Your serverless functions (`/api/*`) cannot access `VITE_*` variables
5. Result: n8n never receives your form submissions

### The Solution

Add these environment variables to your **Vercel Project Settings**:

## Steps to Fix

### 1. Go to Vercel Project Settings

- Visit: https://vercel.com/dashboard
- Select your project: **scriptforge**
- Go to: **Settings** → **Environment Variables**

### 2. Add These Variables

Add three environment variables (choose which environment: Production, Preview, Development):

#### Option A: Add to Production (RECOMMENDED for published app)

| Variable Name | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://nixmhntgxvynjkgeatft.supabase.co` | Already configured ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Already configured ✓ |
| `N8N_WEBHOOK_URL` | `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge` | **ADD THIS** |

#### Option B: Add to All Environments

If you want the same config for Development, Preview, and Production:

1. Add `N8N_WEBHOOK_URL` three times (once per environment)
2. Use the same value for all: `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge`

### 3. Redeploy

After adding the environment variable:

```bash
# Option 1: Trigger redeploy from Vercel UI
# Settings → Deployments → Click on latest deployment → Redeploy

# Option 2: Push a new commit (forces automatic redeploy)
git commit --allow-empty -m "Trigger redeploy with N8N_WEBHOOK_URL"
git push

# Option 3: Use Vercel CLI
vercel --prod
```

## Verification Steps

### 1. Check Vercel Logs

After redeploying, submit a form and check the logs:

```bash
# Via Vercel CLI
vercel logs --follow

# Via Vercel UI
# Dashboard → Select project → Go to Function logs
```

You should see:
- ✅ "Supabase configured"
- ✅ "n8n webhook URL configured"
- ✅ Submission inserted into database
- ✅ Webhook fired to n8n

Or errors if something is wrong.

### 2. Check Supabase

After submitting a job:

1. Go to: https://supabase.com/dashboard
2. Select project: **scriptforge**
3. Go to **SQL Editor** → Run this query:

```sql
SELECT id, status, created_at 
FROM submissions 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see your newly created submission with `status: 'processing'`.

### 3. Check n8n Webhook

Log into your n8n instance:

1. Go to: https://n8n.alphabusinessdesigns.co.uk
2. Open the **ScriptForge workflow**
3. Check **Execution history**
4. You should see new executions after submitting a form

---

## Complete Environment Variables Reference

### For Vercel Backend (`/api/*` endpoints)

```
SUPABASE_URL=https://nixmhntgxvynjkgeatft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_URL=https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
```

### For Frontend (in `.env.local` or `.env`)

```
VITE_API_BASE_URL=https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
VITE_HELP_WEBHOOK_URL=https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/help
VITE_SUPABASE_URL=https://nixmhntgxvynjkgeatft.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Data Flow After Fix

```
User fills form
    ↓
POST /api/submit (on Vercel)
    ↓
[Uses N8N_WEBHOOK_URL from Vercel env] ✅
    ↓
INSERT into Supabase.submissions
    ↓
Fire-and-forget POST to n8n webhook
    ↓
n8n workflow runs
    ↓
n8n generates script
    ↓
n8n UPDATEs Supabase.submissions (status: 'done', script_id: '...')
    ↓
Frontend polls /api/status/:jobId
    ↓
Frontend fetches /api/script/:scriptId
    ↓
Display results to user ✅
```

---

## Troubleshooting

### Problem: Still getting 500 error after adding env var

**Solution:**
1. Check variable name is exactly: `N8N_WEBHOOK_URL`
2. Check you redeployed after adding the variable
3. Hard refresh browser: `Ctrl+Shift+Del` to clear cache
4. Check Vercel logs for the exact error message

### Problem: Submission created but n8n doesn't run

**Solution:**
1. Verify n8n webhook URL is correct: `https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge`
2. Check n8n workflow is active (not paused)
3. Check n8n execution history for errors
4. Test webhook manually:
```bash
curl -X POST "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Problem: Submission created but status polling shows nothing

**Solution:**
1. Ensure Supabase credentials are correct
2. Check submissions table exists and has correct schema
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
4. Check Vercel logs for database connection errors

---

## Key Takeaways

- 🔴 **VITE_* variables are CLIENT-SIDE ONLY** - they cannot be used by backend functions
- 🟢 **Backend functions need environment variables WITHOUT VITE_ prefix**
- 📝 **Add N8N_WEBHOOK_URL to Vercel Settings** (this is the main fix)
- 🔄 **Redeploy after changing environment variables**
- 📊 **Use Vercel logs and Supabase console to debug**

---

## Support

If issues persist:

1. Check Vercel logs: `vercel logs --follow`
2. Check n8n execution history
3. Check Supabase activity logs
4. Verify all three services (Vercel, Supabase, n8n) can reach each other
