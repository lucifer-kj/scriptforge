import { v4 as uuidv4 } from 'uuid';
import { SubmitJobPayload, SubmitJobResponse, JobStatusResponse, Script } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const HELP_WEBHOOK_URL = import.meta.env.VITE_HELP_WEBHOOK_URL;

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
    if (!API_BASE_URL) {
        throw new Error("API URL is not configured. Please check your environment variables.");
    }
    const client_token = getClientToken();
    const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, client_token }),
    });
    return handleResponse<SubmitJobResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
    if (!API_BASE_URL) {
        throw new Error("API URL is not configured. Please check your environment variables.");
    }
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    return handleResponse<JobStatusResponse>(response);
}

export async function getScript(scriptId: string): Promise<Script> {
    if (!API_BASE_URL) {
        throw new Error("API URL is not configured. Please check your environment variables.");
    }
    const response = await fetch(`${API_BASE_URL}/script/${scriptId}`);
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
