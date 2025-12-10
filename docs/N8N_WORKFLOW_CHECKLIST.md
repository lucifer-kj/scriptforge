# n8n Workflow Configuration Checklist

## Verify n8n Webhook is Properly Configured

Before you start the app, make sure your n8n workflow is set up correctly to receive and process submissions.

---

## 1. Webhook Trigger Setup

### In n8n Workflow:

- [ ] **Node name**: Should be something like "Webhook" or "Trigger"
- [ ] **Node type**: "Webhook" (not HTTP Request)
- [ ] **HTTP Method**: POST
- [ ] **Webhook URL path**: `/webhook/script-forge`
- [ ] **Status code**: 200 (default)
- [ ] **Response data**: Should return received data or success message

### Test the Webhook

```bash
# In PowerShell, test the webhook manually:
curl -X POST "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge" `
  -H "Content-Type: application/json" `
  -d '{"test": "data", "submission_id": "test-123"}'
```

Should return a response (likely `{"success":true}` or empty).

---

## 2. Data Processing Flow

### The workflow should process in this order:

```
1. WEBHOOK TRIGGER
   Receives POST with:
   - source_url
   - source_type (youtube, website, rss)
   - category
   - requirements
   - output_type (long, short)
   - tone (neutral, friendly, energetic)
   - submission_id (UUID)
   - client_token (UUID)

2. EXTRACT CONTENT
   Depending on source_type:
   - YouTube: Download transcript
   - Website: Scrape text content
   - RSS: Parse feed item

3. CALL LLM API (OpenAI, Claude, etc)
   Input: Extracted content + user preferences
   Output: Generated script

4. PARSE RESPONSE
   Extract:
   - Title suggestions (array)
   - Description
   - Tags (array)
   - Scenes (array of {scene: number, text: string})
   - Full text

5. CREATE SCRIPT RECORD
   INSERT into Supabase.scripts table:
   - id (UUID)
   - submission_id (from webhook)
   - title_suggestions
   - description
   - tags
   - scenes
   - full_text
   - generation_time_ms
   - source_link

6. UPDATE SUBMISSION STATUS
   UPDATE Supabase.submissions:
   - SET status = 'done'
   - SET script_id = <newly created script id>
   - WHERE id = <submission_id from webhook>
```

---

## 3. Supabase Integration in n8n

### For INSERT into scripts table:

- [ ] **Node type**: "Supabase"
- [ ] **Action**: "Insert"
- [ ] **Table**: "scripts"
- [ ] **Supabase URL**: Your Supabase project URL
- [ ] **API Key**: Use **SERVICE ROLE KEY** (not anon key!)
- [ ] **Columns to insert**:
  ```
  id: $randomUUID()
  submission_id: {{ $json.submission_id }}
  title_suggestions: {{ JSON.stringify(titleArray) }}
  description: {{ descriptionText }}
  tags: {{ JSON.stringify(tagsArray) }}
  scenes: {{ JSON.stringify(scenesArray) }}
  full_text: {{ fullScriptText }}
  generation_time_ms: {{ new Date() - startTime }}
  source_link: {{ $json.source_url }}
  ```

### For UPDATE submissions table:

- [ ] **Node type**: "Supabase"
- [ ] **Action**: "Update"
- [ ] **Table**: "submissions"
- [ ] **Update key**: "id"
- [ ] **Update key value**: `{{ $json.submission_id }}`
- [ ] **Columns to update**:
  ```
  status: 'done'
  script_id: {{ scriptId }}
  ```

---

## 4. Error Handling

### The workflow should handle:

- [ ] **Invalid source URL**: Return error status, don't update DB
- [ ] **Content extraction fails**: Retry or log error
- [ ] **LLM API fails**: Retry with backoff, update status to 'failed'
- [ ] **Supabase connection fails**: Retry with backoff
- [ ] **Invalid submission_id**: Log error, don't crash

### Recommended error handling:

```
If any step fails:
  1. Log the error
  2. UPDATE submissions SET status = 'failed'
  3. Optionally: Send notification/alert
  4. STOP execution (don't try to continue)
```

---

## 5. Workflow Variables to Check

Make sure these are properly passed through the workflow:

```
{{ $json.submission_id }}     ✓ Used for DB updates
{{ $json.source_url }}        ✓ Used for extraction
{{ $json.source_type }}       ✓ Used for routing (youtube/website/rss)
{{ $json.category }}          ✓ Used for prompt context
{{ $json.requirements }}      ✓ Used for prompt context
{{ $json.output_type }}       ✓ Used for prompt (long/short)
{{ $json.tone }}              ✓ Used for prompt (neutral/friendly/energetic)
{{ $json.client_token }}      ✓ For tracking (optional)
```

All should be available from the webhook body.

---

## 6. Workflow Activity & Monitoring

### Check Execution History

1. Open your workflow in n8n
2. Click **View** → **Executions**
3. You should see:
   - [ ] Executions appear when you submit forms from the app
   - [ ] Green checkmarks for successful runs
   - [ ] Red X for failed runs
   - [ ] Execution details show all node outputs

### Monitor in Real-time

1. Open the workflow
2. Click **Activate** toggle (should be ON)
3. Keep the workflow open
4. Submit a form from the app
5. You should see a blue "Execution running..." indicator

### Check Logs

- [ ] Click on an execution to see details
- [ ] Look for red error messages
- [ ] Check "Supabase" node output to see inserted data

---

## 7. Performance Checklist

- [ ] Webhook responds within 2 seconds
- [ ] Workflow completes in 30 seconds to 5 minutes
- [ ] No timeout errors (n8n default is 5 minutes)
- [ ] Supabase queries return in <1 second
- [ ] LLM API calls complete (typical: 10-60 seconds)

---

## 8. Security Checklist

- [ ] Webhook is POST-only (not GET)
- [ ] Webhook returns 200 OK after processing starts (fire-and-forget)
- [ ] **SERVICE ROLE KEY is used** (not anon key) for database access
- [ ] API keys are stored in n8n environment variables, not hardcoded
- [ ] submission_id is validated before updating DB
- [ ] No sensitive data logged to execution history

---

## 9. Testing Checklist

### Test 1: Webhook Connectivity

```bash
curl -X POST "https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge" `
  -H "Content-Type: application/json" `
  -d '{"submission_id": "test-123", "source_url": "https://test.com"}'
```

Expected: Returns 200 OK

### Test 2: Full Workflow

1. Submit form from app with YouTube URL
2. Check n8n execution history
3. Verify Supabase has:
   - [ ] New row in `submissions` (from backend)
   - [ ] New row in `scripts` (from n8n workflow)
   - [ ] submissions.status = 'done'
   - [ ] submissions.script_id = scripts.id

### Test 3: Frontend Result Display

1. After workflow completes
2. App should automatically show results
3. Results should include:
   - [ ] Title suggestions
   - [ ] Script text
   - [ ] Scene breakdown
   - [ ] Copy/email buttons

---

## 10. Common Issues & Fixes

### Issue: Webhook Executions show 0

**Cause**: Webhook never receives data from backend

**Fix**:
1. Verify Vercel env var: `N8N_WEBHOOK_URL`
2. Verify webhook URL is correct
3. Check Vercel logs for webhook call errors
4. Test webhook with curl command above

### Issue: Execution runs but Supabase doesn't update

**Cause**: Wrong API key or table/column names

**Fix**:
1. Verify SERVICE ROLE KEY (not anon key)
2. Verify table name: `scripts` and `submissions`
3. Verify column names match schema
4. Check Supabase node output for error message
5. Try manual INSERT in Supabase SQL editor

### Issue: LLM API fails

**Cause**: Invalid API key or rate limit

**Fix**:
1. Check API key is valid
2. Check API quota/credits
3. Add retry logic to the LLM node
4. Check LLM API logs for specific errors

### Issue: Workflow times out after 5 minutes

**Cause**: LLM taking too long or network issue

**Fix**:
1. Increase workflow timeout in n8n settings
2. Check if LLM API is slow
3. Check network connectivity
4. Simplify the prompt to require less processing

---

## n8n Configuration Template

```
Workflow Name: ScriptForge

Nodes:
1. Webhook (trigger)
   └─ Path: /webhook/script-forge
   └─ Method: POST

2. Extract Content
   └─ Route by source_type
   └─ Call appropriate API (YouTube/Web/RSS)

3. Process with LLM
   └─ Build prompt with extracted content
   └─ Call OpenAI/Claude/etc

4. Parse Response
   └─ Extract title, description, tags, scenes

5. Create Script in Supabase
   └─ INSERT into scripts table

6. Update Submission Status
   └─ UPDATE submissions table
   └─ Set status='done', script_id=<scriptId>

7. Error Handler (if any step fails)
   └─ UPDATE submissions SET status='failed'
   └─ Log error
```

---

## Verification After Setup

Before marking n8n as "done", verify:

1. Webhook endpoint is accessible from the internet
2. Workflow is active (toggle is ON)
3. Submitting a form triggers a workflow execution
4. Workflow completes without errors
5. Supabase scripts table gets a new row
6. Supabase submissions row updates with script_id
7. Frontend polls and detects the change
8. Results are displayed to user

All 8 items must be working for the full flow to succeed.

---

## Quick Debug Commands

### View Supabase Tables from n8n

```sql
-- Run in Supabase SQL editor
SELECT 'submissions' as table_name, COUNT(*) as count FROM submissions
UNION ALL
SELECT 'scripts' as table_name, COUNT(*) as count FROM scripts;
```

### View Latest Submission

```sql
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1;
```

### View Latest Script

```sql
SELECT * FROM scripts ORDER BY id DESC LIMIT 1;
```

### View Associated Submission + Script

```sql
SELECT 
  s.id, s.status, s.created_at,
  scr.id as script_id, scr.title_suggestions
FROM submissions s
LEFT JOIN scripts scr ON s.script_id = scr.id
ORDER BY s.created_at DESC
LIMIT 5;
```

---

## Success Criteria

Your n8n workflow is configured correctly when:

- [ ] Webhook receives POST from Vercel backend
- [ ] Workflow executes successfully
- [ ] Content is extracted from source
- [ ] LLM generates script
- [ ] Script is inserted into Supabase
- [ ] Submission status is updated to 'done'
- [ ] script_id is stored in submission row
- [ ] Frontend detects the change and displays results
- [ ] No errors in workflow execution logs

