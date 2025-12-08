import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Edge Function / Serverless Function
 * Proxies requests to the n8n webhook to avoid CORS issues in production.
 * 
 * This function acts as a same-origin proxy:
 * - Frontend sends POST to https://<your-domain>/api/submit
 * - This function receives the request and forwards it to the n8n webhook
 * - Response is returned to the frontend (CORS is not an issue since both are on the same origin)
 * 
 * Deployment:
 * - Place this file in the /api directory of your Vercel project
 * - Vercel automatically detects and deploys it as a serverless function
 * - Access it at: POST https://<your-domain>/api/submit
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Basic input validation
  const body = req.body || {};
  const { source_url, source_type, requirements } = body as Record<string, unknown>;

  if (!source_url || !source_type || typeof requirements === 'undefined') {
    res.status(400).json({ error: 'Missing required fields: source_url, source_type, requirements' });
    return;
  }

  try {
    const n8nWebhookUrl = process.env.VITE_API_BASE_URL;
    if (!n8nWebhookUrl) {
      res.status(500).json({ error: 'n8n webhook URL not configured' });
      return;
    }

    const upstreamResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/*',
      },
      body: JSON.stringify(body),
    });

    // If upstream returned non-OK status, still examine content-type
    const contentType = upstreamResponse.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!isJson) {
      // read raw text for debugging, but do not forward HTML to client
      const raw = await upstreamResponse.text().catch(() => '<unreadable response>');
      console.error('Upstream non-JSON response:', {
        url: n8nWebhookUrl,
        status: upstreamResponse.status,
        contentType,
        bodyPreview: raw.slice ? raw.slice(0, 2000) : String(raw),
      });

      res.status(502).json({ error: 'Upstream service error', details: 'Non-JSON response received' });
      return;
    }

    // Parse and forward JSON response
    const data = await upstreamResponse.json().catch((err) => {
      console.error('Failed to parse upstream JSON:', err);
      return null;
    });

    if (data === null) {
      res.status(502).json({ error: 'Upstream service error', details: 'Invalid JSON received' });
      return;
    }

    // Forward status and parsed body
    res.status(upstreamResponse.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Upstream service error', details: err instanceof Error ? err.message : 'Unknown error' });
  }
}
