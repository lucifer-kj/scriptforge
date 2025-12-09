import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    // Require server-side Supabase credentials to create the submission row
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: 'Supabase not configured on the server' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Insert a new submission row BEFORE calling the webhook so n8n can update it
    const insertPayload: any = {
      status: 'pending',
      source_url: body.source_url || null,
      source_type: body.source_type || null,
      category: body.category || null,
      requirements: body.requirements || null,
      output_type: body.output_type || null,
      tone: body.tone || null,
      client_token: body.client_token || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('submissions')
      .insert(insertPayload)
      .select('id, status, script_id')
      .single();

    if (insertError) {
      console.error('Failed to insert submission row:', insertError);
      res.status(500).json({ error: 'Failed to create submission' });
      return;
    }

    const submissionId = inserted.id;

    // Call the upstream n8n webhook and include the submission id in the payload.
    // Do not wait for n8n to finish — return immediately so the serverless function stays short.
    const n8nWebhookUrl = process.env.VITE_API_BASE_URL;
    if (!n8nWebhookUrl) {
      res.status(500).json({ error: 'n8n webhook URL not configured' });
      return;
    }

    // Fire-and-forget the webhook call. Attach a catch to avoid unhandled rejections.
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/*',
      },
      body: JSON.stringify({ ...body, submission_id: submissionId }),
    }).then((resp) => {
      if (!resp.ok) console.warn('n8n webhook returned non-OK:', resp.status);
      return null;
    }).catch((err) => {
      console.error('n8n webhook call failed (fire-and-forget):', err);
    });

    // Immediately return the created job id. Frontend will poll `/api/status/:jobId`.
    res.status(200).json({ job_id: submissionId, status: 'pending' });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Upstream service error', details: err instanceof Error ? err.message : 'Unknown error' });
  }
}
