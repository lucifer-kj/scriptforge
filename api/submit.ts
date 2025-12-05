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

  try {
    // Forward the request to the n8n webhook
    const n8nWebhookUrl = process.env.VITE_API_BASE_URL;

    if (!n8nWebhookUrl) {
      res.status(500).json({ error: 'n8n webhook URL not configured' });
      return;
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Forward the n8n response back to the client
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to forward request to n8n',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
