# ScriptForge - Visual Quick Reference

## The Problem in One Image

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  USER FILLS FORM AND CLICKS "GENERATE SCRIPT"               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Source URL: https://youtube.com/watch?v=abc123       │   │
│  │ Category: Tech                                       │   │
│  │ Requirements: Add CTA to subscribe                   │   │
│  │ Output Type: Long-form                               │   │
│  │ Tone: Friendly                                       │   │
│  │ [GENERATE SCRIPT]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ↓                                    │
│         ┌───────────────────────────┐                        │
│         │  POST /api/submit         │                        │
│         │  (Vercel backend)         │                        │
│         └───────────────┬───────────┘                        │
│                         │                                    │
│         ┌───────────────↓───────────┐                        │
│         │ Look for webhook URL:      │                        │
│         │ process.env.N8N_WEBHOOK_URL│                        │
│         │              ❌ NOT FOUND  │                        │
│         └───────────────┬───────────┘                        │
│                         │                                    │
│                         ↓                                    │
│         ┌───────────────────────────┐                        │
│         │   HTTP 500 ERROR ❌        │                        │
│         │                           │                        │
│         │ Cannot send to n8n        │                        │
│         │ Cannot create submission  │                        │
│         │ Cannot generate script    │                        │
│         └───────────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The Solution in One Image

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  VERCEL PROJECT SETTINGS                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Settings → Environment Variables                     │   │
│  │                                                      │   │
│  │ ✓ SUPABASE_URL                                      │   │
│  │ ✓ SUPABASE_SERVICE_ROLE_KEY                         │   │
│  │ ✓ N8N_WEBHOOK_URL ← ADD THIS                        │   │
│  │   https://n8n.alphabusinessdesigns.co.uk/...        │   │
│  │                                                      │   │
│  │ [SAVE] [REDEPLOY]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ↓ After 3 minutes                   │
│                                                              │
│         ┌───────────────────────────┐                        │
│         │  POST /api/submit         │                        │
│         │  (Vercel backend)         │                        │
│         └───────────────┬───────────┘                        │
│                         │                                    │
│         ┌───────────────↓───────────┐                        │
│         │ Look for webhook URL:      │                        │
│         │ process.env.N8N_WEBHOOK_URL│                        │
│         │              ✓ FOUND ✅    │                        │
│         └───────────────┬───────────┘                        │
│                         │                                    │
│                         ↓                                    │
│         ┌───────────────────────────┐                        │
│         │  HTTP 200 OK ✅             │                        │
│         │                           │                        │
│         │ Created submission row    │                        │
│         │ Posted to n8n webhook    │                        │
│         │ App is now functional    │                        │
│         └───────────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Fix Process

```
STEP 1: Open Vercel Dashboard
┌──────────────────────────────────────────────┐
│ https://vercel.com/dashboard                 │
│                                              │
│ [Look for 'scriptforge' in projects list]    │
└──────────────────────────────────────────────┘
                    ↓

STEP 2: Click Settings
┌──────────────────────────────────────────────┐
│ scriptforge → Settings (tab)                  │
└──────────────────────────────────────────────┘
                    ↓

STEP 3: Navigate to Environment Variables
┌──────────────────────────────────────────────┐
│ Left sidebar → Environment Variables          │
└──────────────────────────────────────────────┘
                    ↓

STEP 4: Add New Variable
┌──────────────────────────────────────────────┐
│ [Add Environment Variable] button             │
│                                              │
│ Name:   N8N_WEBHOOK_URL                      │
│ Value:  https://n8n.alphabusinessdesigns...  │
│ Env:    ☑ Production                         │
│                                              │
│ [Save]                                       │
└──────────────────────────────────────────────┘
                    ↓

STEP 5: Redeploy
┌──────────────────────────────────────────────┐
│ Deployments tab → Latest deployment          │
│ ⋮ menu → Redeploy                            │
│                                              │
│ ⏳ Wait 2-3 minutes for ✓ checkmark         │
└──────────────────────────────────────────────┘
                    ↓

STEP 6: Test
┌──────────────────────────────────────────────┐
│ Go to: https://scriptforge-nine.vercel.app   │
│ Fill form → Click "Generate Script"          │
│ Network tab → /api/submit → Should see 200 OK│
│                                              │
│ ✓ SUCCESS - App now works!                   │
└──────────────────────────────────────────────┘
```

---

## Data Flow Comparison

### BROKEN (Current State) ❌

```
Frontend
   │
   └─→ POST /api/submit
       │
       └─→ Backend looks for N8N_WEBHOOK_URL
           │
           └─→ ❌ NOT FOUND
               │
               └─→ HTTP 500 error
                   │
                   └─→ Nothing happens
```

### FIXED (After Adding Env Var) ✅

```
Frontend
   │
   └─→ POST /api/submit
       │
       ├─→ Backend looks for N8N_WEBHOOK_URL
       │   │
       │   └─→ ✅ FOUND
       │
       ├─→ INSERT submission (Supabase)
       │   │
       │   └─→ Row created ✅
       │
       ├─→ POST webhook (n8n)
       │   │
       │   └─→ Workflow triggered ✅
       │
       ├─→ Return 200 OK
       │   │
       │   └─→ Job ID returned ✅
       │
       ├─→ Frontend polls /api/status
       │   │
       │   └─→ Status updates ✅
       │
       ├─→ n8n generates script
       │   │
       │   └─→ Script created ✅
       │
       ├─→ Fetch /api/script
       │   │
       │   └─→ Script retrieved ✅
       │
       └─→ Display results ✅
           │
           └─→ SUCCESS - User sees generated script!
```

---

## Environment Variable Reference

### What You Have Now (Local Dev)

```
.env.local
├── VITE_API_BASE_URL=https://n8n...    ✓ Client-side only
├── VITE_HELP_WEBHOOK_URL=https://n8n...✓ Client-side only
└── SUPABASE_SERVICE_ROLE_KEY=...       (not client-side)
```

### What You Need in Vercel (Backend)

```
Vercel Settings → Environment Variables
├── SUPABASE_URL=https://...          ✓ Already set
├── SUPABASE_SERVICE_ROLE_KEY=...     ✓ Already set
└── N8N_WEBHOOK_URL=https://n8n...    ❌ MISSING - ADD THIS
```

---

## Verification Checklist

### After Adding N8N_WEBHOOK_URL to Vercel

```
☐ Logged into Vercel dashboard
☐ Navigated to scriptforge project settings
☐ Found Environment Variables section
☐ Added N8N_WEBHOOK_URL variable
☐ Set value to: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
☐ Saved the variable
☐ Clicked Redeploy
☐ Waited for deployment to finish (green checkmark)
☐ Refreshed app in browser
☐ Filled form and clicked "Generate Script"
☐ Opened Network tab (F12)
☐ Looked for /api/submit request
☐ Confirmed status is 200 (not 500)
```

If all ☐ are checked → App is working! ✅

---

## Troubleshooting Tree

```
Is app showing HTTP 500 on form submit?
├─ YES
│  └─ Did you add N8N_WEBHOOK_URL to Vercel?
│     ├─ NO
│     │  └─ Go to docs/QUICK_FIX.md and add it now
│     └─ YES
│        └─ Did you redeploy?
│           ├─ NO
│           │  └─ Redeploy the app
│           └─ YES
│              └─ Hard refresh: Ctrl+Shift+Del
│                 └─ Try again
│
└─ NO
   └─ Form submission is working ✅
      │
      └─ Check Supabase for submission row
         ├─ Row doesn't exist
         │  └─ Check /api/submit endpoint logic
         └─ Row exists
            └─ Check n8n execution
               ├─ No execution
               │  └─ Check n8n webhook endpoint
               └─ Execution exists
                  └─ App should be working ✅
```

---

## Environment Variable Quick Copy

```
Name: N8N_WEBHOOK_URL
Value: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
Environment: Production ✓
```

Just copy-paste this into Vercel!

---

## Success Indicators

### You'll Know It's Working When...

| Indicator | What to Look For |
|-----------|-----------------|
| Form submission | Network tab shows `/api/submit` → **200 OK** |
| Supabase | Table shows new row in `submissions` table |
| n8n | Workflow execution appears in history |
| Backend | Vercel logs show successful webhook call |
| Frontend | Results page displays generated script |
| Console | No red errors (F12 → Console) |
| Icons | No 404 errors for icon files |

---

## Time Breakdown

```
Read this guide:      1 min
Add env var:          2 min
Redeploy:             3 min
Test:                 2 min
                      ────
TOTAL:                8 min
```

**You can have a working app in less than 10 minutes!**

---

## Quick Action Summary

```
┌─────────────────────────────────────────┐
│  THE FIX (DO THIS NOW)                  │
├─────────────────────────────────────────┤
│                                         │
│  1. Open: https://vercel.com/dashboard  │
│                                         │
│  2. Click: scriptforge project          │
│                                         │
│  3. Go to: Settings → Env Variables     │
│                                         │
│  4. Add:                                │
│     Name: N8N_WEBHOOK_URL               │
│     Value: https://n8n.alphabusiness... │
│                                         │
│  5. Click: Save                         │
│                                         │
│  6. Redeploy: ⋮ menu → Redeploy        │
│                                         │
│  7. Wait: 2-3 minutes                   │
│                                         │
│  8. Test: Fill form & submit            │
│                                         │
│  ✅ DONE - App now works!               │
│                                         │
└─────────────────────────────────────────┘
```

---

**Need more details? Open:** `docs/QUICK_FIX.md`

**Still have questions? Open:** `docs/COMPLETE_FIX_GUIDE.md`

