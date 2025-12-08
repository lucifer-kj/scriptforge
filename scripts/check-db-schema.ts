import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type ColSpec = { name: string; description?: string };

const scriptColumns: ColSpec[] = [
  { name: 'title_suggestions', description: 'text[] or jsonb' },
  { name: 'source_link', description: 'text' },
  { name: 'tags', description: 'text[] or jsonb' },
  { name: 'scenes', description: 'jsonb' },
  { name: 'full_text', description: 'text' },
  { name: 'description', description: 'text' },
  { name: 'generation_time_ms', description: 'int8 / bigint' },
];

const submissionsColumns: ColSpec[] = [
  { name: 'script_id', description: 'uuid' },
  { name: 'status', description: 'text' },
];

async function checkColumn(table: string, column: string): Promise<boolean> {
  // Try selecting the column; if column missing PostgREST returns an error
  try {
    const { error } = await supabase.from(table).select(`${column}`).limit(1);
    if (error) {
      const msg = (error as any).message || '';
      // If Postgres reports missing column, return false
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')) {
        return false;
      }
      // For other errors, rethrow to show user
      throw error;
    }
    return true;
  } catch (err) {
    // If error object contains message about missing column, treat as missing
    const msg = (err as any)?.message || String(err);
    if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')) return false;
    // Re-throw otherwise
    throw err;
  }
}

function alterStatementsForScript(missing: string[]): string[] {
  const stmts: string[] = [];
  for (const col of missing) {
    switch (col) {
      case 'title_suggestions':
        stmts.push(`ALTER TABLE public.script ADD COLUMN title_suggestions jsonb;`);
        break;
      case 'source_link':
        stmts.push(`ALTER TABLE public.script ADD COLUMN source_link text;`);
        break;
      case 'tags':
        stmts.push(`ALTER TABLE public.script ADD COLUMN tags jsonb;`);
        break;
      case 'scenes':
        stmts.push(`ALTER TABLE public.script ADD COLUMN scenes jsonb;`);
        break;
      case 'full_text':
        stmts.push(`ALTER TABLE public.script ADD COLUMN full_text text;`);
        break;
      case 'description':
        stmts.push(`ALTER TABLE public.script ADD COLUMN description text;`);
        break;
      case 'generation_time_ms':
        stmts.push(`ALTER TABLE public.script ADD COLUMN generation_time_ms bigint;`);
        break;
      default:
        stmts.push(`-- Unknown column ${col} on script (manual add)`);
    }
  }
  return stmts;
}

function alterStatementsForSubmissions(missing: string[]): string[] {
  const stmts: string[] = [];
  for (const col of missing) {
    switch (col) {
      case 'script_id':
        stmts.push(`ALTER TABLE public.submissions ADD COLUMN script_id uuid;`);
        break;
      case 'status':
        stmts.push(`ALTER TABLE public.submissions ADD COLUMN status text;`);
        break;
      default:
        stmts.push(`-- Unknown column ${col} on submissions (manual add)`);
    }
  }
  return stmts;
}

async function run() {
  console.log('Checking Supabase schema...');

  const results: Record<string, { present: string[]; missing: string[] }> = {};

  // Check script table
  const scriptPresent: string[] = [];
  const scriptMissing: string[] = [];
  for (const col of scriptColumns) {
    try {
      const ok = await checkColumn('scripts', col.name);
      if (ok) scriptPresent.push(col.name);
      else scriptMissing.push(col.name);
    } catch (err) {
      console.error(`Error checking column ${col.name} on table script:`, (err as Error)?.message || err);
      process.exitCode = 2;
      return;
    }
  }
  results['script'] = { present: scriptPresent, missing: scriptMissing };

  // Check submissions table
  const subPresent: string[] = [];
  const subMissing: string[] = [];
  for (const col of submissionsColumns) {
    try {
      const ok = await checkColumn('submissions', col.name);
      if (ok) subPresent.push(col.name);
      else subMissing.push(col.name);
    } catch (err) {
      console.error(`Error checking column ${col.name} on table submissions:`, (err as Error)?.message || err);
      process.exitCode = 2;
      return;
    }
  }
  results['submissions'] = { present: subPresent, missing: subMissing };

  // Output
  console.log('\nSchema check results:');
  for (const t of Object.keys(results)) {
    console.log(`\nTable: ${t}`);
    console.log(`  Present columns: ${results[t].present.length ? results[t].present.join(', ') : '(none of the checked columns found)'}`);
    console.log(`  Missing columns: ${results[t].missing.length ? results[t].missing.join(', ') : '(none)'} `);
  }

  // Print ALTER TABLE statements if any missing
  let anyMissing = false;
  if (results['script'].missing.length) {
    anyMissing = true;
    console.log('\n-- SQL to add missing columns to public.scripts');
    const stmts = alterStatementsForScript(results['script'].missing);
    for (const s of stmts) console.log(s);
  }
  if (results['submissions'].missing.length) {
    anyMissing = true;
    console.log('\n-- SQL to add missing columns to public.submissions');
    const stmts = alterStatementsForSubmissions(results['submissions'].missing);
    for (const s of stmts) console.log(s);
  }

  if (!anyMissing) console.log('\nAll required columns are present.');
}

run().catch((err) => {
  console.error('Fatal error while checking schema:', err);
  process.exit(1);
});
