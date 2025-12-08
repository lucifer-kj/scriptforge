import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const scriptIdParam = req.query.scriptId || req.query.script_id || req.query.id;
  const scriptId = Array.isArray(scriptIdParam) ? scriptIdParam[0] : scriptIdParam;

  if (!scriptId || typeof scriptId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid script id' });
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
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (error) {
      const msg = (error as any).message || '';
      if (msg.includes('Results contain 0 rows') || (error as any).code === 'PGRST116') {
        res.status(404).json({ error: 'Script not found' });
        return;
      }
      res.status(500).json({ error: error.message || 'Supabase query error' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }

    // Transform DB row into the frontend `Script` shape
    const scriptRow: any = data;

    // Ensure tags is an array
    let tags: string[] = [];
    if (Array.isArray(scriptRow.tags)) tags = scriptRow.tags;
    else if (typeof scriptRow.tags === 'string' && scriptRow.tags.length) {
      try {
        // maybe stored as JSON string
        const parsed = JSON.parse(scriptRow.tags);
        if (Array.isArray(parsed)) tags = parsed;
      } catch (e) {
        // fallback: comma-separated
        tags = scriptRow.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    // Parse AI output stored in `scenes` (expected JSON with keys: hook, intro, main_content, conclusion, cta)
    let aiOutput: any = null;
    if (Array.isArray(scriptRow.scenes)) {
      // older format: array of scenes — keep as fallback
      aiOutput = null;
    } else if (typeof scriptRow.scenes === 'string' && scriptRow.scenes.length) {
      try { aiOutput = JSON.parse(scriptRow.scenes); } catch (e) { aiOutput = null; }
    } else if (typeof scriptRow.scenes === 'object' && scriptRow.scenes !== null) {
      aiOutput = scriptRow.scenes;
    }

    // Build frontend `scenes` array from AI output if available, otherwise try to use stored array
    let scenes: any[] = [];
    if (aiOutput && typeof aiOutput === 'object') {
      const order = ['hook', 'intro', 'main_content', 'conclusion', 'cta'];
      let idx = 1;
      for (const key of order) {
        const text = aiOutput[key];
        if (typeof text === 'string' && text.trim().length > 0) {
          scenes.push({ scene: idx++, text: text.trim() });
        }
      }
    } else if (Array.isArray(scriptRow.scenes)) {
      // ensure items have {scene, text}
      scenes = scriptRow.scenes.map((s: any, i: number) => ({ scene: s.scene ?? i + 1, text: s.text ?? String(s) }));
    }

    // Ensure title_suggestions exists - derive from description if missing
    let title_suggestions: string[] = [];
    if (Array.isArray(scriptRow.title_suggestions)) title_suggestions = scriptRow.title_suggestions;
    else if (typeof scriptRow.title_suggestions === 'string' && scriptRow.title_suggestions.length) {
      try { const parsed = JSON.parse(scriptRow.title_suggestions); if (Array.isArray(parsed)) title_suggestions = parsed; } catch (e) { title_suggestions = [scriptRow.title_suggestions]; }
    } else if (scriptRow.description && typeof scriptRow.description === 'string') {
      const firstLine = scriptRow.description.split('\n').find((l: string) => l.trim().length > 10);
      title_suggestions = [firstLine ? firstLine.trim().slice(0, 120) : 'Suggested Title'];
    } else {
      title_suggestions = ['Suggested Title'];
    }

    // Build full_text from AI output when available
    let full_text = '';
    if (aiOutput && typeof aiOutput === 'object') {
      const parts = ['hook', 'intro', 'main_content', 'conclusion', 'cta'];
      const pieces: string[] = [];
      for (const p of parts) {
        if (typeof aiOutput[p] === 'string' && aiOutput[p].trim().length > 0) pieces.push(aiOutput[p].trim());
      }
      full_text = pieces.join('\n\n');
    } else {
      full_text = scriptRow.full_text || scriptRow.fulltext || '';
    }

    // If no title suggestions, derive a simple one from the first available piece
    if ((!title_suggestions || title_suggestions.length === 0) && full_text) {
      const first = full_text.split('\n').find((l: string) => l.trim().length > 10) || full_text.slice(0, 120);
      title_suggestions = [first.trim().slice(0, 120)];
    }

    const transformed = {
      id: scriptRow.id,
      submission_id: scriptRow.submission_id || null,
      title_suggestions,
      description: scriptRow.description || '',
      tags,
      scenes,
      full_text,
      generation_time_ms: scriptRow.generation_time_ms || scriptRow.generation_time || 0,
      source_link: scriptRow.source_link || null,
    };

    res.status(200).json(transformed);
  } catch (err) {
    console.error('Error fetching script:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
