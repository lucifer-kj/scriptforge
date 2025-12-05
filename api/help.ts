import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function
 * Proxies requests to the n8n help webhook to avoid CORS issues in production.
 * 
 * This function acts as a same-origin proxy for the help contact form:
 * - Frontend sends POST to https://<your-domain>/api/help
 * - This function receives the request and forwards it to the n8n help webhook
 * - Response is returned to the frontend
 * 
 * Access it at: POST https://<your-domain>/api/help
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
    // Forward the request to the n8n help webhook
    const helpWebhookUrl = process.env.VITE_HELP_WEBHOOK_URL;

    if (!helpWebhookUrl) {
      res.status(500).json({ error: 'n8n help webhook URL not configured' });
      return;
    }

    const response = await fetch(helpWebhookUrl, {
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
      error: 'Failed to forward request to n8n help webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
