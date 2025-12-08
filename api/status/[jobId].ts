import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const jobIdParam = req.query.jobId || req.query.job_id || req.query.id;
  const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;

  if (!jobId || typeof jobId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid job id' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Supabase not configured on the server' });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, status, script_id')
      .eq('id', jobId)
      .single();

    if (error) {
      const msg = (error as any).message || '';
      if (msg.includes('Results contain 0 rows') || (error as any).code === 'PGRST116') {
        res.status(404).json({ error: 'Job not found' });
        return;
      }
      res.status(500).json({ error: error.message || 'Supabase query error' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const response = {
      job_id: data.id,
      status: data.status,
      script_id: data.script_id || null,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching job status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
