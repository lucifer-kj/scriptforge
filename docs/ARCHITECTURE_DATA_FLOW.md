# ScriptForge Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCRIPTFORGE FULL STACK                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   FRONTEND (REACT)   │
│  scriptforge-nine    │
│  .vercel.app         │
│                      │
│ • HomePage           │
│ • Form inputs        │
│ • Results polling    │
│ • Status display     │
└──────────┬───────────┘
           │
           │ VITE_API_BASE_URL
           │ (client-side only)
           │
           ↓
┌──────────────────────────────────────────┐
│    VERCEL SERVERLESS (BACKEND)           │
│    /api/submit                           │
│    /api/status/[jobId]                   │
│    /api/script/[scriptId]                │
│                                          │
│ Environment Variables:                   │
│ • SUPABASE_URL ✓                         │
│ • SUPABASE_SERVICE_ROLE_KEY ✓            │
│ • N8N_WEBHOOK_URL ❌ (MISSING!)          │
└──────┬───────────────────────────┬───────┘
       │                           │
       │                           │
       ↓                           ↓
┌──────────────────┐        ┌──────────────────┐
│    SUPABASE      │        │   N8N WEBHOOK    │
│    Database      │        │   Automation     │
│                  │        │                  │
│ Tables:          │        │ • Receives POST  │
│ • submissions    │        │ • Extracts text  │
│ • scripts        │        │ • Calls OpenAI   │
│                  │        │ • Generates text │
│ Status:          │        │ • Updates DB     │
│ processing → ----┼────────→ → done           │
│ done             │        │ • Returns JSON   │
│                  │        │                  │
└──────────────────┘        └──────────────────┘
       ↑
       │
       └─ POLLING FOR UPDATES
```

---

## Current Problem: The Broken Chain

```
User submits form
    ↓
Frontend calls: POST /api/submit
    ↓
Vercel backend searches for webhook URL
    ↓
N8N_WEBHOOK_URL not found ❌
    ↓
HTTP 500 error returned
    ↓
Nothing happens:
  ❌ Row not inserted into Supabase
  ❌ Data never reaches n8n
  ❌ Script never generated
  ❌ Status polling finds nothing
```

---

## Fixed Flow: What Should Happen

```
┌─ USER SUBMITS FORM ─────────────────────────────────────────┐
│                                                               │
│ Fills:                                                        │
│ • Source URL: https://youtube.com/watch?v=...               │
│ • Source Type: YouTube                                       │
│ • Category: Tech                                             │
│ • Requirements: Add CTA to subscribe                         │
│ • Output Type: Long-form                                     │
│ • Tone: Friendly                                             │
│                                                               │
│ Clicks: "Generate Script" button                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │  STEP 1: Submit to Backend       │
        │                                  │
        │  POST /api/submit                │
        │  Headers: Content-Type: JSON     │
        │  Body: {                         │
        │    source_url: "...",            │
        │    source_type: "youtube",       │
        │    category: "Tech",             │
        │    requirements: "...",          │
        │    output_type: "long",          │
        │    tone: "friendly",             │
        │    client_token: "uuid-xxx"      │
        │  }                               │
        └──────────────┬───────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │  STEP 2: Backend Processing      │
        │                                  │
        │  ✓ Validate inputs               │
        │  ✓ Check Supabase credentials    │
        │  ✓ Check N8N_WEBHOOK_URL env var │
        │  ✓ INSERT submission row         │
        │                                  │
        │  INSERT submissions (            │
        │    id: "uuid-123",               │
        │    status: "processing",         │
        │    source_url: "...",            │
        │    ...                           │
        │  ) RETURNING id;                 │
        │                                  │
        │  SUPABASE                        │
        └──────────────┬───────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │  STEP 3: Async Webhook Fire      │
        │                                  │
        │  POST /webhook/script-forge      │
        │  (to n8n.alphabusinessdesigns)   │
        │  Headers: Content-Type: JSON     │
        │  Body: {                         │
        │    source_url: "...",            │
        │    source_type: "youtube",       │
        │    ...                           │
        │    submission_id: "uuid-123"     │
        │  }                               │
        │                                  │
        │  N8N                             │
        └──────────────┬───────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │ Backend returns immediately │
        │ Response: 200 OK            │
        │ {                           │
        │   job_id: "uuid-123",       │
        │   status: "processing"      │
        │ }                           │
        │                             │
        │ FRONTEND                    │
        ↓
        ┌──────────────────────────────────┐
        │  STEP 4: Start Polling           │
        │                                  │
        │  Every 3 seconds:                │
        │  GET /api/status/uuid-123        │
        │                                  │
        │  Returns: { status: "processing"}│
        │  (while n8n is working)          │
        │                                  │
        │  FRONTEND                        │
        └──────────────┬───────────────────┘
                       │
        (Meanwhile, n8n is working...)
                       │
        ┌──────────────┴──────────────────────┐
        │  STEP 5: n8n Workflow Runs          │
        │                                     │
        │  1. Receive webhook POST            │
        │  2. Extract source_url              │
        │  3. Fetch content from URL          │
        │  4. Send to OpenAI API              │
        │  5. Generate script with scenes     │
        │  6. INSERT scripts table            │
        │  7. UPDATE submissions table        │
        │                                     │
        │  UPDATE submissions                 │
        │  SET status = 'done',               │
        │      script_id = 'uuid-456'         │
        │  WHERE id = 'uuid-123'              │
        │                                     │
        │  N8N                                │
        └──────────────┬──────────────────────┘
                       │
        ┌──────────────┴──────────────────────┐
        │  STEP 6: Polling Detects Change    │
        │                                     │
        │  GET /api/status/uuid-123           │
        │                                     │
        │  Returns: {                         │
        │    status: "done",                  │
        │    script_id: "uuid-456"            │
        │  }                                  │
        │                                     │
        │  FRONTEND sees status='done'        │
        └──────────────┬──────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │  STEP 7: Fetch Script Details    │
        │                                  │
        │  GET /api/script/uuid-456        │
        │                                  │
        │  Returns: {                      │
        │    id: "uuid-456",               │
        │    title_suggestions: [...],     │
        │    description: "...",           │
        │    tags: [...],                  │
        │    scenes: [                     │
        │      {scene: 1, text: "..."},    │
        │      {scene: 2, text: "..."}     │
        │    ],                            │
        │    full_text: "...",             │
        │    source_link: "..."            │
        │  }                               │
        │                                  │
        │  FRONTEND                        │
        └──────────────┬───────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │  STEP 8: Display Results         │
        │                                  │
        │  ✓ Show script title             │
        │  ✓ Show full script text         │
        │  ✓ Show scenes breakdown         │
        │  ✓ Copy button, email button     │
        │  ✓ Add to history                │
        │                                  │
        │ SUCCESS! ✓                       │
        └──────────────────────────────────┘
```

---

## Critical Path Dependencies

```
For the app to work, this chain MUST complete:

Frontend Form Submit
    ↓ DEPENDS ON:
Backend API (/api/submit) accessible
    ↓ DEPENDS ON:
N8N_WEBHOOK_URL in Vercel env ← THIS IS MISSING
    ↓ DEPENDS ON:
Can INSERT to Supabase
    ↓ DEPENDS ON:
Supabase credentials in Vercel env
    ↓ DEPENDS ON:
n8n webhook endpoint accessible
    ↓ DEPENDS ON:
n8n workflow active and correct
    ↓ DEPENDS ON:
Can UPDATE Supabase from n8n
    ↓ DEPENDS ON:
Status polling sees update
    ↓ DEPENDS ON:
Fetch script from /api/script
    ↓ DEPENDS ON:
Display to user ✓
```

If ANY step fails, the whole chain breaks.

**The current failure is at step 1**: N8N_WEBHOOK_URL missing.

---

## Environment Variables Overview

### What Exists Now (✓)

```
VERCEL (Backend):
✓ SUPABASE_URL
✓ SUPABASE_SERVICE_ROLE_KEY

LOCAL/FRONTEND (.env.local):
✓ VITE_API_BASE_URL
✓ VITE_HELP_WEBHOOK_URL
```

### What's Missing (❌)

```
VERCEL (Backend):
❌ N8N_WEBHOOK_URL  ← THIS IS THE PROBLEM
```

### Why This Matters

```
Frontend (.env.local):
VITE_API_BASE_URL = "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge"
    ↓
    These get bundled into the JavaScript code
    ↓
    Only available to React components (client-side)
    ↓
    NOT available to serverless functions (/api/*)

Backend (/api/submit.ts):
Needs to POST to n8n webhook
    ↓
    Looks for: process.env.N8N_WEBHOOK_URL
    ↓
    NOT FOUND (not in Vercel settings)
    ↓
    Cannot POST to webhook
    ↓
    500 error ❌
```

---

## The Fix

```
1. ADD to Vercel Settings:
   Name: N8N_WEBHOOK_URL
   Value: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
   
2. REDEPLOY the app

3. BACKEND can now access the webhook URL
    ↓
4. DATA FLOWS properly
    ↓
5. EVERYTHING WORKS ✓
```

---

## Component Responsibilities

### Frontend (React)
- ✓ Display form
- ✓ Collect user input
- ✓ Call `/api/submit`
- ✓ Poll `/api/status/:jobId`
- ✓ Fetch `/api/script/:scriptId`
- ✓ Display results
- ✓ Handle UI state & loading

### Backend (Vercel Serverless)
- ✓ Validate incoming data
- ✓ Authenticate with Supabase
- ✓ Create submission row
- ✓ Fire webhook to n8n
- ✓ Query Supabase for status
- ✓ Fetch script data
- ✓ Return JSON to frontend

### Database (Supabase)
- ✓ Store submissions
- ✓ Store generated scripts
- ✓ Maintain schema
- ✓ Handle authentication

### Workflow (n8n)
- ✓ Receive webhook POST
- ✓ Extract content from URL
- ✓ Call LLM API
- ✓ Generate script
- ✓ Parse response
- ✓ Insert/update database

---

## Configuration Summary

### What Each Service Needs to Know

**Frontend needs:**
```
VITE_API_BASE_URL = Vercel /api endpoint (or n8n webhook in dev)
VITE_HELP_WEBHOOK_URL = n8n help webhook
VITE_SUPABASE_URL = (optional fallback)
VITE_SUPABASE_ANON_KEY = (optional fallback)
```

**Backend needs:**
```
SUPABASE_URL = Supabase instance URL
SUPABASE_SERVICE_ROLE_KEY = Service role API key
N8N_WEBHOOK_URL = n8n webhook endpoint
```

**n8n needs:**
```
SUPABASE_URL = Supabase instance URL
SUPABASE_SERVICE_ROLE_KEY = Service role API key
OPENAI_API_KEY = (or whatever LLM you use)
(configured in n8n UI, not env vars)
```

**Supabase needs:**
```
Tables configured with proper schema
RLS policies allowing service role access
Webhook configured (if using realtime)
```

---

## Success Metrics

After all fixes, these should work:

| Action | Expected Result |
|--------|-----------------|
| Submit form | 200 OK response |
| Check Supabase | New row in submissions |
| Check n8n | Execution started |
| Wait 1-5 min | Workflow completes |
| Check Supabase | Row updated with script_id |
| Refresh app | Results displayed |
| Check console | No errors |

---

## Quick Reference

**The Problem**: N8N_WEBHOOK_URL missing
**The Solution**: Add to Vercel env vars
**The Impact**: Unblocks entire data flow
**The Effort**: 5 minutes
**The Result**: App becomes functional ✓

