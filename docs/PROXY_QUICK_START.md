# 🚀 Vercel Serverless Proxy - Quick Start

## What Just Happened

You now have a **complete production-ready proxy system** that eliminates CORS errors by routing API requests through Vercel serverless functions.

## Files Added/Modified

### ✨ New Files
```
api/submit.ts              → Proxies job submissions
api/help.ts                → Proxies help form submissions
vercel.json                → Deployment configuration
.vercelignore              → Build file exclusions
PROXY_SETUP.md             → Full documentation
PROXY_IMPLEMENTATION.md    → Change summary
PROXY_STATUS.md            → Quick reference
```

### 📝 Modified Files
```
api.ts                     → Uses /api/* in production, /webhook in dev
env.d.ts                   → Added DEV/PROD flags for TypeScript
index.tsx                  → Service Worker registration limited to production
```

## Deployment in 3 Steps

### 1️⃣ Add Environment Variables to Vercel
Go to your Vercel project dashboard → Settings → Environment Variables

```
Name: VITE_API_BASE_URL
Value: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge

Name: VITE_HELP_WEBHOOK_URL
Value: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/help
```

### 2️⃣ Push to GitHub
```bash
git add .
git commit -m "Add Vercel serverless proxy for CORS resolution"
git push origin main
```

### 3️⃣ Verify on Vercel
Check your Vercel dashboard → Deployments → Functions tab

You should see:
- ✅ `api/submit`
- ✅ `api/help`

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser                    Vercel                 n8n      │
│  ┌──────────────┐     ┌────────────────┐      ┌────────┐  │
│  │  React App   │────▶│ Serverless     │─────▶│Webhook │  │
│  │              │     │ Function       │      │        │  │
│  │ /api/submit  │     │ /api/submit    │      │        │  │
│  └──────────────┘     └────────────────┘      └────────┘  │
│       ✓ Same Origin               ✓ Same Origin           │
│       (No CORS)                   (No CORS)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser                 Vite Dev                 n8n      │
│  ┌──────────────┐     ┌────────────────┐      ┌────────┐  │
│  │  React App   │────▶│ Dev Proxy      │─────▶│Webhook │  │
│  │              │     │                │      │        │  │
│  │ /webhook/*   │     │ (localhost)    │      │        │  │
│  └──────────────┘     └────────────────┘      └────────┘  │
│       ✓ Proxy on Same Server (No CORS)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### Development
```javascript
fetch('/webhook/script-forge/submit', { method: 'POST' })
     ↓
Vite Dev Server (proxy configured)
     ↓
n8n Webhook (https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/submit)
```

### Production
```javascript
fetch('/api/submit', { method: 'POST' })
     ↓
Vercel Serverless Function (api/submit.ts)
     ↓
n8n Webhook (https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/submit)
```

## Verify Everything Works

### Local Development
```bash
npm run dev
# Open http://localhost:5173
# Try submitting a job
# Check Network tab - requests go to /webhook/script-forge
```

### Production (After Deployment)
```
1. Go to https://your-scriptforge-domain.vercel.app
2. Try submitting a job
3. Check Network tab - requests go to /api/submit
4. Verify response comes back (no CORS error!)
```

## What Gets Fixed

| Before | After |
|--------|-------|
| ❌ CORS error on submit | ✅ Request succeeds |
| ❌ Webhook blocked by browser | ✅ Proxied through /api |
| ❌ Preflight OPTIONS rejected | ✅ No preflight needed |
| ❌ Rate limiting from CORS | ✅ Direct proxy request |

## Key Points

✅ **Zero Frontend Code Changes Needed** - `api.ts` handles routing automatically
✅ **Works Both Local & Production** - Different proxies used seamlessly
✅ **Fully Typed** - TypeScript support for serverless functions
✅ **Error Handling** - Graceful error messages in responses
✅ **Environment Variables** - Easily configurable via Vercel dashboard
✅ **Auto-Scaling** - Vercel handles server load automatically

## File Locations

```
scriptforge/
├── api/                          ← Serverless functions
│   ├── submit.ts                ← Proxies /api/submit
│   └── help.ts                  ← Proxies /api/help
├── api.ts                       ← Updated routing logic
├── env.d.ts                     ← Updated env types
├── index.tsx                    ← Updated SW registration
├── vite.config.ts               ← Has dev proxy config
├── vercel.json                  ← Deployment config
├── .vercelignore                ← Exclusions
└── PROXY_*.md                   ← Documentation
```

## Debugging

### Check if Functions Deployed
Vercel Dashboard → Deployments → [Your Deployment] → Functions Tab

### View Function Logs
Vercel Dashboard → Logs → Functions

### Test Function Locally (Won't Work)
```bash
npm run preview
# /api endpoints won't work locally
# Expected - only available on Vercel
```

## Success Criteria ✓

- [ ] Environment variables set in Vercel
- [ ] Changes pushed to GitHub
- [ ] Vercel deployment shows "Functions" tab with 2 functions
- [ ] Production site loads without errors
- [ ] Job submission completes without CORS error
- [ ] Vercel function logs show successful requests

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 /api/submit | Redeploy or check Functions tab |
| Still getting CORS | Verify env vars in Vercel settings |
| Functions not listed | Commit `/api/*.ts` files & redeploy |
| 500 errors | Check Vercel function logs |

## Next Steps

1. ✅ Set environment variables (if not done)
2. ✅ Push code to GitHub (if not done)
3. ⏳ Wait for Vercel deployment
4. ✅ Verify Functions appear in dashboard
5. ✅ Test your application
6. 📊 Monitor Vercel logs

---

**Status**: ✅ Proxy system ready for deployment

For detailed documentation, see:
- 📖 `PROXY_SETUP.md` - Full guide
- 📋 `PROXY_IMPLEMENTATION.md` - Changes
- 📌 `PROXY_STATUS.md` - Reference

Questions? Check the documentation files above!
