# Vercel Serverless Proxy Setup

## Overview

ScriptForge uses Vercel serverless functions to proxy requests to your n8n webhook backend, avoiding CORS issues in production. This allows your frontend to communicate with external APIs without running into browser security restrictions.

## Architecture

### Development Flow
```
Frontend (http://localhost:5173)
    ↓
Vite Dev Server Proxy (configured in vite.config.ts)
    ↓
n8n Webhook (https://n8n.alphabusinessdesigns.co.uk/webhook/...)
```

**Why**: During local development, the Vite dev server proxies requests to the actual n8n webhook, eliminating CORS issues locally.

### Production Flow (Vercel Deployed)
```
Frontend (https://your-scriptforge-domain.vercel.app)
    ↓
Vercel Serverless Function (/api/submit or /api/help)
    ↓
n8n Webhook (https://n8n.alphabusinessdesigns.co.uk/webhook/...)
```

**Why**: In production, the frontend calls same-origin endpoints (`/api/submit`, `/api/help`), which are served by Vercel serverless functions. These functions act as a proxy, forwarding requests to the actual n8n webhooks. Since both the frontend and the proxy are on the same origin, CORS is not an issue.

## Serverless Functions

### `/api/submit` (api/submit.ts)
Proxies job submission requests to the main n8n webhook.

**Request**: `POST https://<your-domain>/api/submit`
**Body**: JSON payload with script parameters and client token
**Response**: Forwarded response from n8n webhook

### `/api/help` (api/help.ts)
Proxies help/contact form submissions to the help webhook.

**Request**: `POST https://<your-domain>/api/help`
**Body**: JSON payload with `{ name, email, message }`
**Response**: Forwarded response from n8n help webhook

## Configuration

### Environment Variables
The serverless functions use the following environment variables (already in `.env.local`):

```env
VITE_API_BASE_URL=https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
VITE_HELP_WEBHOOK_URL=https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge/help
```

These are automatically passed to the Vercel runtime when deployed.

### API Client Routing (api.ts)
The `api.ts` client automatically routes requests:

- **Development** (`import.meta.env.DEV`):
  - `/api/submit` → `/webhook/script-forge/submit` (Vite proxy)
  - `/api/help` → `/webhook/script-forge/help` (Vite proxy)

- **Production** (deployed):
  - `/api/submit` → Vercel serverless function → n8n webhook
  - `/api/help` → Vercel serverless function → n8n help webhook

## Deployment Steps

1. **Ensure the `/api` directory is present** (already included in this repo):
   ```
   api/
     ├── submit.ts
     └── help.ts
   ```

2. **Deploy to Vercel**:
   ```bash
   npm run build
   git add .
   git commit -m "Add Vercel serverless proxy functions"
   git push
   ```
   Vercel will automatically detect the `/api` directory and deploy the serverless functions.

3. **Verify Deployment**:
   - Check Vercel dashboard → Functions tab to confirm `api/submit` and `api/help` are listed.
   - Test with a manual request:
     ```bash
     curl -X POST https://<your-domain>/api/submit \
       -H "Content-Type: application/json" \
       -d '{"script_name": "test", "client_token": "test-token"}'
     ```

## Local Testing

### Option 1: Via Vite Dev Proxy
```bash
npm run dev
# Frontend sends to /webhook/script-forge (relative path)
# Vite proxy forwards to n8n
```

### Option 2: Simulate Production (using `npm run preview`)
```bash
npm run build
npm run preview
# Navigate to http://localhost:4173
# Requests will fail because /api functions are not available locally
# This is expected; serverless functions only work on Vercel
```

## Troubleshooting

### CORS Errors Still Appearing
- **In development**: Ensure Vite proxy is configured in `vite.config.ts` and you're running `npm run dev`.
- **In production**: Verify that:
  1. Vercel deployment includes the `/api` directory.
  2. Serverless functions are listed in Vercel dashboard → Functions.
  3. Environment variables (`VITE_API_BASE_URL`, `VITE_HELP_WEBHOOK_URL`) are set in Vercel project settings.

### "Failed to forward request to n8n"
- Check that the n8n webhook URLs are accessible and responding.
- Verify n8n is not rate-limiting requests from Vercel's IP range.
- Check Vercel function logs for detailed error messages.

### 404 on `/api/submit`
- Ensure the serverless function files are committed and pushed to the repository.
- Trigger a redeploy on Vercel if functions are not detected.

## Security Notes

- Environment variables (`VITE_API_BASE_URL`, `VITE_HELP_WEBHOOK_URL`) are kept in `.env.local` and not committed to the repo.
- Serverless functions run on Vercel's infrastructure, not on n8n or your own servers.
- The proxy only forwards POST requests; other HTTP methods return 405 Method Not Allowed.
- Error messages are generic to avoid leaking sensitive information.

## Future Enhancements

- **Rate limiting**: Add rate limiting to serverless functions to prevent abuse.
- **Authentication**: Add API key or token-based authentication between frontend and serverless functions.
- **Caching**: Cache responses where appropriate to reduce costs and latency.
- **Logging**: Integrate with Vercel logging or a third-party service to monitor proxy traffic.
- **Middleware**: Add request/response middleware for validation, transformation, or monitoring.

---

For more information on Vercel serverless functions, see: https://vercel.com/docs/concepts/functions/serverless-functions
