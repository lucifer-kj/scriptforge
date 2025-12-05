# Vercel Serverless Proxy Implementation Summary

## What Was Added

### 1. Serverless Function Endpoints

#### `/api/submit.ts`
- Proxies POST requests to your main n8n webhook (`VITE_API_BASE_URL`)
- Receives job submission payloads from the frontend
- Forwards requests to n8n and returns responses
- Handles errors gracefully with meaningful messages

#### `/api/help.ts`
- Proxies POST requests to your help webhook (`VITE_HELP_WEBHOOK_URL`)
- Handles contact form submissions from the help page
- Forwards to n8n and returns responses
- Provides error feedback

### 2. Updated Files

#### `api.ts` (Client API Layer)
**Changes**:
- Routes now use `/api/submit` and `/api/help` endpoints in production
- In development, still uses Vite proxy for `/webhook/script-forge/*` paths
- Maintains backward compatibility with `.env.local` variables

**Routing Logic**:
```
Development: /webhook/script-forge/* (Vite proxy) → n8n
Production:  /api/* (Vercel serverless) → n8n
```

#### `env.d.ts` (TypeScript Environment Types)
**Changes**:
- Added `DEV`, `PROD`, and `SSR` flags to `ImportMetaEnv`
- These are standard Vite environment variables for conditional logic

#### `index.tsx` (App Bootstrap)
**Changes**:
- Service Worker registration now only runs in production (`import.meta.env.PROD`)
- Prevents interference with HMR during development

### 3. Configuration Files

#### `vercel.json`
- Build command: `npm run build`
- Dev command: `npm run dev`
- Specifies Vite as the framework
- Routes all `/api/*` requests to serverless functions
- Routes all other requests to the React app (SPA)
- References environment variables (must be set in Vercel dashboard)

#### `.vercelignore`
- Ensures the `/api` directory is included in deployment
- Ignores unnecessary files (node_modules, git, dist)
- Keeps PROXY_SETUP.md for reference

### 4. Documentation

#### `PROXY_SETUP.md`
- Complete guide on the proxy architecture
- Development vs. production flow diagrams
- Deployment steps and troubleshooting
- Security notes and future enhancements

## How It Works

### Local Development (`npm run dev`)
```
Frontend → Vite Dev Server Proxy → n8n Webhook
  ↓
Client makes request to `/webhook/script-forge/submit`
Vite intercepts and proxies to n8n backend
No CORS issues because request is proxied server-side
```

### Production (Vercel Deployed)
```
Frontend → Vercel Serverless Function → n8n Webhook
  ↓
Client makes request to `/api/submit`
Vercel runs serverless function that forwards to n8n
No CORS issues because frontend and function are same-origin
Function response is returned to frontend
```

## Deployment Checklist

1. **Environment Variables** (Set in Vercel Dashboard):
   - `VITE_API_BASE_URL`: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
   - `VITE_HELP_WEBHOOK_URL`: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/help

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add Vercel serverless proxy for CORS resolution"
   git push
   ```
   Vercel will automatically:
   - Detect the `/api` directory
   - Deploy serverless functions
   - Build the frontend with `npm run build`
   - Serve static assets + functions

3. **Verify**:
   - Check Vercel dashboard → Deployments → Functions tab
   - Confirm `api/submit` and `api/help` are listed
   - Test a request to your deployed site

## Key Benefits

✅ **No CORS Errors**: Frontend communicates with same-origin endpoints
✅ **Transparent**: Client code doesn't need to know about the proxy layer
✅ **Scalable**: Vercel serverless functions auto-scale with traffic
✅ **Secure**: n8n webhook URLs are hidden from the client (only env vars visible on server)
✅ **Maintainable**: Clear separation between dev (Vite proxy) and production (serverless)
✅ **Cost-Effective**: Only pay for requests to serverless functions

## TypeScript Support

Both serverless functions are written in TypeScript:
- Use `@vercel/node` types for `VercelRequest` and `VercelResponse`
- Vercel automatically transpiles `.ts` files to JavaScript during deployment
- Full IDE support and type safety for development

## Testing Locally

### Test via Vite Proxy (Most Accurate)
```bash
npm run dev
# Frontend sends to /webhook/script-forge/submit
# Vite proxies to n8n
```

### Test the Build
```bash
npm run build
npm run preview
# Frontend will try /api/submit (won't work locally - expected)
# Serverless functions only work on Vercel
```

## Troubleshooting

### "Cannot find module '@vercel/node'"
- The types are optional. Vercel provides them at deploy time.
- Build will succeed anyway.

### Serverless functions not showing in Vercel dashboard
- Ensure `/api/*.ts` files are committed to git
- Trigger a redeploy on Vercel
- Check Vercel build logs for errors

### Requests still failing with CORS
- Verify environment variables are set in Vercel project settings
- Check Vercel function logs for proxy errors
- Ensure n8n webhook URLs are correct and accessible

## Next Steps

1. Push changes to your repository
2. Set environment variables in Vercel dashboard
3. Deploy and verify the functions appear in the Functions tab
4. Test a submission from your deployed site
5. Monitor Vercel logs for any issues

---

For full documentation, see `PROXY_SETUP.md`
