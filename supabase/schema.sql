-- Supabase Schema for ScriptForge
-- This schema is based on the Product Requirements Document (PRD).

-- 1. Submissions Table
-- This table stores the initial job requests submitted by the user from the frontend.
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_url text not null,
  source_type text not null check (source_type in ('youtube', 'website', 'rss')),
  category text,
  requirements text,
  output_type text not null check (output_type in ('short', 'long')),
  tone text not null check (tone in ('neutral', 'friendly', 'energetic')),
  status text not null check (status in ('queued', 'processing', 'done', 'failed')),
  job_id uuid not null unique,
  extractor text,
  extractor_meta jsonb,
  retry_count int not null default 0
);

-- Add comments for clarity
comment on table public.submissions is 'Stores user script generation requests and their status.';
comment on column public.submissions.job_id is 'The unique ID of the job in the processing queue (e.g., n8n execution ID).';
comment on column public.submissions.source_type is 'The type of the source URL, resolved by the backend.';
comment on column public.submissions.status is 'The current status of the script generation job.';


-- 2. Scripts Table
-- This table stores the final generated script content once a job is successfully completed.
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  title_suggestions jsonb,
  chosen_title text,
  description text,
  tags text[],
  scenes jsonb,
  full_text text,
  token_count int,
  generation_time_ms int
);

-- Add comments for clarity
comment on table public.scripts is 'Stores the generated script content from successful jobs.';
comment on column public.scripts.submission_id is 'A foreign key linking the script back to the original submission request.';
comment on column public.scripts.scenes is 'A JSON array of scene objects, e.g., [{"scene": 1, "text": "..."}, ...].';
comment on column public.scripts.tags is 'An array of SEO tags.';


-- 3. Rate Limits Table
-- This table tracks submissions per client token to allow the backend to enforce rate limits.
create table public.rate_limits (
  client_token text primary key,
  window_start timestamptz not null,
  submissions_count int not null
);

-- Add comments for clarity
comment on table public.rate_limits is 'Tracks API usage per client token for rate limiting purposes.';


-- 4. Row Level Security (RLS)
-- Enable RLS for all tables as a security best practice.
-- The backend (n8n) should use the service_role key to bypass RLS policies.
-- No policies are defined here, meaning all access is denied by default unless using the service_role key.
alter table public.submissions enable row level security;
alter table public.scripts enable row level security;
alter table public.rate_limits enable row level security;
