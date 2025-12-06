export type SourceType = 'auto' | 'youtube' | 'website' | 'rss';
export type OutputType = 'short' | 'long';
export type Tone = 'neutral' | 'friendly' | 'energetic';
export type SubmissionStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface SubmitJobPayload {
    client_token: string;
    source_url: string;
    source_type: SourceType;
    category: string;
    requirements: string;
    output_type: OutputType;
    tone: Tone;
}

export interface SubmitJobResponse {
    job_id: string;
    status: SubmissionStatus;
    eta_seconds: number;
}

export interface JobStatusResponse {
    job_id: string;
    status: SubmissionStatus;
    script_id?: string;
}

export interface Scene {
    scene: number;
    text: string;
}

export interface Script {
    id: string;
    submission_id: string;
    title_suggestions: string[];
    description: string;
    tags: string[];
    scenes: Scene[];
    full_text: string;
    generation_time_ms: number;
    source_link: string;
}

export interface Submission {
    id: string; // This will be the job_id from the backend
    created_at: string;
    source_url: string;
    output_type: OutputType;
    status: SubmissionStatus;
    script_id?: string;
    source_type: SourceType;
    category: string;
    requirements: string;
    tone: Tone;
}

export type AppView = 'scriptViewer' | 'page';
export type Page = 'home' | 'history' | 'about' | 'help' | 'results';

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}
