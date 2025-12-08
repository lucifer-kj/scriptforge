import { v4 as uuidv4 } from 'uuid';
import { SubmitJobPayload, SubmitJobResponse, JobStatusResponse, Script } from './types';
import { createClient } from '@supabase/supabase-js';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const rawHelpWebhook = import.meta.env.VITE_HELP_WEBHOOK_URL || '';

// In development we proxy '/webhook' to the real n8n host via Vite server proxy.
// Extract the pathname from the configured URL so the frontend calls a relative path
// (e.g. '/webhook/script-forge') which Vite will proxy.
function toDevPath(raw: string) {
    try {
        const u = new URL(raw);
        return u.pathname.replace(/\/$/, '');
    } catch (e) {
        return raw.replace(/\/$/, '');
    }
}

// Submit endpoint behavior:
// - In DEV: use the exact webhook path (e.g. '/webhook/script-forge') so Vite proxies to n8n
// - In PROD: POST to the serverless proxy at '/api/submit' which forwards to n8n (avoids CORS)
const SUBMIT_ENDPOINT = import.meta.env.DEV ? toDevPath(rawApiBase) : '/api/submit';

// Server-side API base used for status/script retrieval (serverless functions)
const SERVER_API_BASE = '/api';

const HELP_WEBHOOK_URL = import.meta.env.DEV ? toDevPath(rawHelpWebhook) : '/api/help';

// --- Client Token ---
const CLIENT_TOKEN_KEY = 'scriptforge_client_token';

export function getClientToken(): string {
    const existing = localStorage.getItem(CLIENT_TOKEN_KEY);
    if (existing) return existing;
    const newToken = uuidv4();
    localStorage.setItem(CLIENT_TOKEN_KEY, newToken);
    return newToken;
}

// --- API Calls ---

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Rate limit: Max 10 submissions per hour. Please try again later.');
        }
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export async function submitJob(payload: Omit<SubmitJobPayload, 'client_token'>): Promise<SubmitJobResponse> {
    if (!SUBMIT_ENDPOINT) {
        throw new Error("API submit endpoint is not configured. Please check your environment variables.");
    }
    const client_token = getClientToken();
    // POST directly to the configured webhook path in DEV, or the serverless proxy in PROD
    const response = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, client_token }),
    });
    return handleResponse<SubmitJobResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
    // First try the server-side status proxy which uses the service role key.
    try {
        const response = await fetch(`${SERVER_API_BASE}/status/${jobId}`);
        if (response.ok) {
            return handleResponse<JobStatusResponse>(response);
        }

        // If server returned 404 (not found), fall through to client-side Supabase fallback below
        if (response.status !== 404) {
            // For other HTTP errors, surface the error
            return handleResponse<JobStatusResponse>(response);
        }
    } catch (err) {
        // network error or server unavailable — attempt fallback
        console.warn('Server status endpoint unavailable, attempting Supabase fallback', err);
    }

    // Fallback: if environment provides Supabase anon credentials, query the submissions table directly
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL_ALT || '';
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY_ALT || '';

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            const supabase = createClient(String(SUPABASE_URL), String(SUPABASE_ANON_KEY));
            const { data, error } = await supabase
                .from('submissions')
                .select('id, status, script_id')
                .eq('id', jobId)
                .single();

            if (error) {
                // If row not found, throw a 404-like error to let callers handle polling
                const msg = (error as any).message || 'Supabase query error';
                throw new Error(msg);
            }

            if (!data) throw new Error('Job not found');

            return {
                job_id: data.id,
                status: data.status,
                script_id: data.script_id || null,
            } as JobStatusResponse;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to fetch job status');
        }
    }

    // If we reach here and couldn't fetch status, throw a generic error
    throw new Error('Unable to determine job status (no server or Supabase fallback available)');
}

export async function getScript(scriptId: string): Promise<Script> {
    const response = await fetch(`${SERVER_API_BASE}/script/${scriptId}`);
    return handleResponse<Script>(response);
}

export async function sendHelpRequest(data: { name: string; email: string; message: string }): Promise<{ ok: boolean }> {
    if (!HELP_WEBHOOK_URL) {
        console.error("Help webhook URL is not configured.");
        throw new Error("Cannot send help request, service is not configured.");
    }
    const response = await fetch(HELP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to send help request.");
    }
    return { ok: true };
}


// --- Utility Functions ---

export function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}
