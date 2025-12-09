import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Serverless proxy to create a submission row and forward the payload to n8n.
 * Behavior:
 * - Inserts a submission row (status: "processing") using the Supabase
 *   service role key so n8n can later update the row.
 * - Fires a POST to the configured n8n webhook URL (fire-and-forget) including
 *   the `submission_id` so the workflow can update the row when finished.
 * - Returns immediately with the created job id so the client can poll `/api/status/:jobId`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const { source_url, source_type, requirements } = body as Record<string, unknown>;

  if (!source_url || !source_type || typeof requirements === 'undefined') {
    res.status(400).json({ error: 'Missing required fields: source_url, source_type, requirements' });
    return;
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase not configured on the server. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      res.status(500).json({ error: 'Supabase not configured on the server' });
      return;
    }

    const supabase = createClient(String(SUPABASE_URL), String(SUPABASE_SERVICE_ROLE_KEY));

    const insertPayload: any = {
      status: 'processing',
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

    const submissionId = (inserted as any).id;

    // Determine webhook URL from common environment variable names
    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL || process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

    if (!n8nWebhookUrl) {
      console.error('n8n webhook URL not configured. Check N8N_WEBHOOK_URL, API_BASE_URL, or VITE_API_BASE_URL');
      // We still return the created job id so the client can poll the status row.
      res.status(200).json({ job_id: submissionId, status: 'processing' });
      return;
    }

    // Fire-and-forget the webhook call; include submission_id so n8n can update the DB.
    void fetch(String(n8nWebhookUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/*' },
      body: JSON.stringify({ ...body, submission_id: submissionId }),
    })
      .then((resp) => {
        if (!resp.ok) console.warn('n8n webhook returned non-OK:', resp.status);
        return null;
      })
      .catch((err) => {
        console.error('n8n webhook call failed (fire-and-forget):', err);
      });

    // Return created job id to client
    res.status(200).json({ job_id: submissionId, status: 'processing' });
  } catch (err) {
    console.error('submit handler error:', err);
    res.status(502).json({ error: 'Upstream service error', details: err instanceof Error ? err.message : 'Unknown error' });
  }
}
