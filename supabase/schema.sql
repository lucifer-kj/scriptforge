Here is the exact SQL schema for my Supabase database. Please use this structure for all future code generation and ignore any previous assumptions.

-- Table 1: Submissions
-- This tracks the user request and job status.
-- This is updated by the 'Update Job' node in n8n.
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  
  -- The input parameters from the form
  client_token text, -- specific to the n8n flow logic
  category text,
  tone text,
  output_type text,
  requirements text,
  source_url text,
  
  -- Status tracking for the polling logic
  status text default 'pending', -- values: 'pending', 'processing', 'done', 'failed'
  
  -- Link to the generated script (nullable until job is done)
  script_id uuid references public.scripts(id)
);

-- Table 2: Scripts
-- This stores the AI-generated content.
-- This is populated by the 'Add Scripts' node in n8n.
create table public.scripts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  
  -- Fields mapped in n8n 'Add Scripts' node:
  description text,         -- Stores the 'intro' or summary
  scenes jsonb,            -- Stores the full structured JSON object (hook, intro, main_content, etc.)
  full_text text,          -- The complete concatenated script
  generation_time_ms int,  -- Execution time tracking
  
  -- Foreign key to link back to the submission
  submission_id uuid references public.submissions(id)
);