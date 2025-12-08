import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Submission, Script, Scene as SceneType, SourceType, OutputType, Tone, Notification as NotificationType, Page } from './types';
import { submitJob, getJobStatus, getScript, formatTimeAgo, sendHelpRequest } from './api';

// --- Icons ---
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AboutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- Styled Components from Design System ---
const ButtonPrimary = ({ children, onClick, disabled, className = '', type = 'button' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, className?: string, type?: 'button' | 'submit' }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-5 py-3 rounded-[var(--radius-md)] text-[var(--text-100)] font-semibold shadow-[var(--shadow-sm)] transition-all duration-[var(--anim-medium)] ease-[var(--ease)] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]'} ${className}`} style={{ background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400))' }}>{children}</button>
);
const ButtonSecondary = ({ children, onClick, disabled, className = '' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, className?: string }) => (
    <button onClick={onClick} disabled={disabled} className={`px-5 py-3 rounded-[var(--radius-md)] bg-transparent border border-[var(--muted)] text-[var(--text-80)] font-medium transition-colors duration-[var(--anim-medium)] ease-[var(--ease)] hover:bg-[var(--glass)] hover:border-[rgba(255,255,255,0.15)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>{children}</button>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-[var(--card)] border border-[rgba(255,255,255,0.06)] text-[var(--text-100)] p-3 rounded-[var(--radius-sm)] transition-all duration-[var(--anim-medium)] ease-[var(--ease)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_2px_rgba(79,140,255,0.2)] focus:outline-none placeholder:text-[var(--text-60)] ${props.className || ''}`} />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-[var(--card)] border border-[rgba(255,255,255,0.06)] text-[var(--text-100)] p-3 rounded-[var(--radius-sm)] transition-all duration-[var(--anim-medium)] ease-[var(--ease)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_2px_rgba(79,140,255,0.2)] focus:outline-none placeholder:text-[var(--text-60)] ${props.className || ''}`} />
);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className={`w-full bg-[var(--card)] border border-[rgba(255,255,255,0.06)] text-[var(--text-100)] p-3 rounded-[var(--radius-sm)] transition-all duration-[var(--anim-medium)] ease-[var(--ease)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_2px_rgba(79,140,255,0.2)] focus:outline-none appearance-none ${props.className || ''}`} />
);
const SegmentedControl = ({ options, value, onChange }: { options: { label: string, value: string }[], value: string, onChange: (value: string) => void }) => (
    <div className="inline-flex bg-[var(--card)] p-1 rounded-[var(--radius-md)] border border-[var(--muted)]">
        {options.map(opt => (
            <button type="button" key={opt.value} onClick={() => onChange(opt.value)} className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-[var(--anim-medium)] ease-[var(--ease)] ${value === opt.value ? 'text-white scale-105 shadow-[var(--shadow-sm)]' : 'text-[var(--text-80)] hover:bg-[var(--glass)]'}`} style={{ background: value === opt.value ? 'linear-gradient(90deg, var(--primary-600), var(--primary-400))' : 'transparent' }}>{opt.label}</button>
        ))}
    </div>
);

// --- Reusable Components ---
const Logo = ({ className = '' }: { className?: string }) => (
    <div style={{ fontFamily: 'var(--font-display)' }} className={`m-0 leading-none tracking-[-2px] uppercase flex ${className}`}>
        <span style={{
            background: 'linear-gradient(180deg, #6fd3f5 10%, #2b6ea6 70%, #1f4e79 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))',
            paddingRight: '2px',
        }}>SCRIPT</span>
        <span style={{
            background: 'linear-gradient(180deg, #ffffff 15%, #b4c1cd 70%, #8a99a8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))',
        }}>FORGE</span>
    </div>
);
const useCopyToClipboard = () => {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    };
    return { copied, copy };
};
const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
    const { copied, copy } = useCopyToClipboard();
    return <button onClick={() => copy(textToCopy)} className="relative text-[var(--text-60)] hover:text-white transition-colors">{copied ? <CheckIcon /> : <CopyIcon />}</button>;
};
const EmailModal = ({ show, onClose, onSend }: { show: boolean, onClose: () => void, onSend: (email: string) => void }) => {
    const [email, setEmail] = useState('');
    if (!show) return null;
    const handleSend = () => { if (email.includes('@')) { onSend(email); setEmail(''); } };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-[var(--card)] rounded-[var(--radius-md)] p-[var(--space-5)] w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--muted)]">
                <h2 className="text-xl font-bold mb-2 text-[var(--text-100)]">Email Script</h2>
                <p className="text-[var(--text-60)] mb-6">Enter the recipient&apos;s email address.</p>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recipient@example.com" aria-label="Recipient's email" className="mb-6" />
                <div className="flex justify-end space-x-4">
                    <ButtonSecondary onClick={onClose} className="py-2.5">Cancel</ButtonSecondary>
                    <ButtonPrimary onClick={handleSend} className="py-2.5">Send</ButtonPrimary>
                </div>
            </div>
        </div>
    );
};

// --- Results Page ---
export const ResultsPage = ({ jobId }: { jobId: string }) => {
    const [status, setStatus] = useState<string>('queued');
    const [script, setScript] = useState<Script | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const poll = async () => {
            try {
                const res = await getJobStatus(jobId);
                if (!mounted) return;
                setStatus(res.status);
                if (res.status === 'done' && res.script_id) {
                    const s = await getScript(res.script_id);
                    if (!mounted) return;
                    setScript(s);
                    if (intervalId) clearInterval(intervalId);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch status');
            }
        };

        // initial poll then interval
        poll();
        let intervalId: number | undefined = undefined;
        intervalId = window.setInterval(poll, 3000);

        return () => { mounted = false; if (intervalId) clearInterval(intervalId); };
    }, [jobId]);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-[var(--card)] p-[var(--space-5)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--muted)]">
                <h2 className="text-xl font-bold mb-2">Results for job {jobId}</h2>
                <p className="text-[var(--text-60)] mb-4">Status: <strong className="capitalize">{status}</strong></p>
                {error && <p className="text-[var(--danger)]">{error}</p>}
                {script ? (
                    <div>
                        <h3 className="text-lg font-semibold">{script.title_suggestions[0]}</h3>
                        <p className="text-[var(--text-80)] whitespace-pre-wrap my-4">{script.full_text || script.description}</p>
                        <div className="space-y-4">{script.scenes.map(s => (
                            <div key={s.scene} className="p-3 bg-[var(--surface)] rounded-[var(--radius-sm)]">
                                <strong>Scene {s.scene}</strong>
                                <p className="whitespace-pre-wrap mt-2">{s.text}</p>
                            </div>
                        ))}</div>
                    </div>
                ) : (
                    <div className="text-[var(--text-60)]">{status === 'done' ? 'Fetching script...' : 'Processing... Please wait.'}</div>
                )}
            </div>
        </div>
    );
};
export const NotificationHandler = ({ notifications, onDismiss }: { notifications: NotificationType[], onDismiss: (id: number) => void }) => (
    <div className="fixed bottom-20 md:bottom-5 md:right-5 left-4 right-4 md:left-auto md:w-full md:max-w-sm z-50 space-y-2">
        {notifications.map(notification => {
            const typeClasses = { success: 'bg-[var(--success)]', error: 'bg-[var(--danger)]', info: 'bg-[var(--primary-500)]' };
            return (
                <div key={notification.id} className={`p-4 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] text-white flex items-center justify-between text-sm font-medium ${typeClasses[notification.type]}`} role="alert">
                    <span>{notification.message}</span>
                    <button onClick={() => onDismiss(notification.id)} className="ml-4 font-bold text-xl leading-none opacity-70 hover:opacity-100">&times;</button>
                </div>
            );
        })}
    </div>
);
const StatusPill = ({ status }: { status: Submission['status'] }) => {
    const styles = {
        queued: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: <SpinnerIcon /> },
        processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: <SpinnerIcon /> },
        done: { bg: 'bg-green-500/10', text: 'text-green-400', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> }
    };
    const currentStyle = styles[status];
    return <div className={`flex items-center space-x-2 px-2.5 py-1 text-xs font-semibold rounded-full ${currentStyle.bg} ${currentStyle.text}`}>{currentStyle.icon} <span className="capitalize">{status}</span></div>;
};
export const Footer = () => <footer className="text-center py-6 text-sm text-[var(--text-60)]">Powered by Alpha Business Digital</footer>;

// --- Splash Screen ---
export const SplashScreen = ({ visible }: { visible: boolean }) => {
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500); // Unmount after fade-out
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-900)] transition-opacity duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <Logo className={`text-6xl md:text-8xl lg:text-[100px] transition-all duration-1000 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} />
        </div>
    );
};

// --- Navigation Components ---
const navItems = [
    { page: 'home' as Page, label: 'Home', icon: <HomeIcon /> },
    { page: 'history' as Page, label: 'History', icon: <HistoryIcon /> },
    { page: 'about' as Page, label: 'About', icon: <AboutIcon /> },
    { page: 'help' as Page, label: 'Help', icon: <HelpIcon /> },
];
export const DesktopHeader = ({ activePage, setPage }: { activePage: Page, setPage: (page: Page) => void }) => (
    <header className="hidden md:flex justify-between items-center py-3 px-8 border-b border-[var(--muted)] sticky top-0 bg-[var(--bg-900)]/80 backdrop-blur-lg z-10">
        <Logo className="!text-3xl" />
        <nav className="flex items-center space-x-2">
            {navItems.map(item => (
                <button key={item.page} onClick={() => setPage(item.page)} className={`px-4 py-2 rounded-[var(--radius-sm)] font-medium transition-colors ${activePage === item.page ? 'text-[var(--text-100)] bg-[var(--glass)]' : 'text-[var(--text-60)] hover:bg-[var(--glass)]'}`}>{item.label}</button>
            ))}
        </nav>
    </header>
);
export const MobileBottomNav = ({ activePage, setPage }: { activePage: Page, setPage: (page: Page) => void }) => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--muted)] shadow-[var(--shadow-lg)] z-10">
        <div className="flex justify-around items-center h-16">
            {navItems.map(item => (
                <button key={item.page} onClick={() => setPage(item.page)} className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-200 ${activePage === item.page ? 'text-[var(--primary-400)]' : 'text-[var(--text-60)] hover:text-[var(--text-100)]'}`}>
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    </nav>
);

// --- Page Components ---
const FormLabel = ({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--text-60)] mb-2">{children}</label>;

export const HomePage = ({ addSubmission, addNotification, navigateToResults }: { addSubmission: (s: Submission) => void, addNotification: (msg: string, type: 'success' | 'error') => void, navigateToResults?: (jobId: string) => void }) => {
    const [sourceUrl, setSourceUrl] = useState('');
    const [sourceType, setSourceType] = useState<SourceType>('auto');
    const [category, setCategory] = useState('');
    const [requirements, setRequirements] = useState('');
    const [outputType, setOutputType] = useState<OutputType>('long');
    const [tone, setTone] = useState<Tone>('neutral');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [urlError, setUrlError] = useState('');

    useEffect(() => { setUrlError(sourceUrl && !sourceUrl.startsWith('http') ? 'Please enter a valid URL' : ''); }, [sourceUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceUrl || urlError) { addNotification('Please enter a valid source URL.', 'error'); return; }
        setIsSubmitting(true);
        try {
            // Submit the job - n8n now returns immediately with { status: 'processing', job_id }
            const response = await submitJob({ source_url: sourceUrl, source_type: sourceType, category, requirements, output_type: outputType, tone });

            // Add a local submission entry (processing)
            addSubmission({ id: response.job_id, created_at: new Date().toISOString(), status: response.status, source_url: sourceUrl, output_type: outputType, source_type: sourceType, category, requirements, tone });
            addNotification(`Job Created - Processing...`, 'success');
            setSourceUrl(''); setCategory(''); setRequirements('');

            // Poll the server-side status endpoint (which reads Supabase) until the job is done
            const pollIntervalMs = 3000;
            const maxPollTimeMs = 1000 * 60 * 5; // 5 minutes timeout
            const start = Date.now();
            let mounted = true;

            const checkOnce = async () => {
                try {
                    const statusResp = await getJobStatus(response.job_id);
                    if (!mounted) return { done: false };
                    if (statusResp.status === 'done' && statusResp.script_id) {
                        return { done: true, script_id: statusResp.script_id };
                    }
                    return { done: false };
                } catch (err) {
                    // If job isn't found yet (404) or transient error, just continue polling until timeout
                    return { done: false };
                }
            };

            // immediate first check then interval
            let finished = false;
            const first = await checkOnce();
            if (first.done) {
                finished = true;
                if (navigateToResults) navigateToResults(response.job_id);
            }

            let intervalId: number | undefined = undefined;
            if (!finished) {
                intervalId = window.setInterval(async () => {
                    if (Date.now() - start > maxPollTimeMs) {
                        // timeout
                        if (intervalId) clearInterval(intervalId);
                        setIsSubmitting(false);
                        addNotification('Script generation is taking longer than expected. You can check the results page later.', 'info');
                        mounted = false;
                        return;
                    }
                    const r = await checkOnce();
                    if (r.done) {
                        if (intervalId) clearInterval(intervalId);
                        if (navigateToResults) navigateToResults(response.job_id);
                        setIsSubmitting(false);
                        mounted = false;
                    }
                }, pollIntervalMs);
            } else {
                setIsSubmitting(false);
            }

        } catch (error) { addNotification(error instanceof Error ? error.message : 'An unknown error occurred.', 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-[680px] mx-auto bg-[var(--card)] p-[var(--space-5)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--muted)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><FormLabel htmlFor="sourceUrl">Source URL</FormLabel><Input type="url" id="sourceUrl" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />{urlError && <p className="text-[var(--danger)] text-sm mt-1">{urlError}</p>}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><FormLabel>Source Type</FormLabel><SegmentedControl options={[{ label: 'Auto', value: 'auto' }, { label: 'YouTube', value: 'youtube' }, { label: 'Website', value: 'website' }, { label: 'RSS', value: 'rss' }]} value={sourceType} onChange={(v) => setSourceType(v as SourceType)} /></div>
                        <div><FormLabel htmlFor="category">Category</FormLabel><Input type="text" id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Finance, Tech" /></div>
                    </div>
                    <div><FormLabel htmlFor="requirements">Requirements</FormLabel><Textarea id="requirements" value={requirements} onChange={e => setRequirements(e.target.value)} rows={3} placeholder="e.g., Add a CTA to subscribe." /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><FormLabel>Output Type</FormLabel><SegmentedControl options={[{ label: 'Long-form', value: 'long' }, { label: 'Short-form', value: 'short' }]} value={outputType} onChange={(v) => setOutputType(v as OutputType)} /></div>
                        <div><FormLabel htmlFor="tone">Tone</FormLabel><Select id="tone" value={tone} onChange={e => setTone(e.target.value as Tone)}>{(['neutral', 'friendly', 'energetic'] as Tone[]).map(t => <option key={t} value={t} className="capitalize bg-[var(--card)]">{t}</option>)}</Select></div>
                    </div>
                    <div className="pt-2"><ButtonPrimary type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Generating...' : 'Generate Script'}</ButtonPrimary></div>
                </form>
            </div>
        </div>
    );
};

const HistoryItem = ({ submission, onUpdate, onSelect }: { submission: Submission, onUpdate: (submission: Submission) => void, onSelect: (scriptId: string) => void }) => {
    useEffect(() => {
        let intervalId: number | undefined;
        const pollStatus = async () => {
            try {
                const data = await getJobStatus(submission.id);
                if (data.status !== submission.status || data.script_id !== submission.script_id) {
                    onUpdate({ ...submission, status: data.status, script_id: data.script_id });
                }
            } catch (error) { onUpdate({ ...submission, status: 'failed' }); }
        };
        if (submission.status === 'queued' || submission.status === 'processing') { intervalId = window.setInterval(pollStatus, 3000); }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [submission, onUpdate]);

    const canView = submission.status === 'done' && submission.script_id;
    const commonProps = { onClick: () => canView && onSelect(submission.script_id!), 'aria-label': `Submission for ${submission.source_url}, status ${submission.status}` };

    return (
        <>
            <tr className={`hidden lg:table-row border-b border-[var(--muted)] transition-colors duration-200 ${canView ? 'cursor-pointer hover:bg-[var(--glass)]' : 'opacity-60'}`} {...commonProps}>
                <td className="p-4 truncate max-w-xs text-[var(--text-80)]">{submission.source_url}</td>
                <td className="p-4 capitalize text-[var(--text-60)]">{submission.output_type}</td>
                <td className="p-4"><StatusPill status={submission.status} /></td>
                <td className="p-4 text-[var(--text-60)]">{formatTimeAgo(new Date(submission.created_at))}</td>
            </tr>
            <div className={`lg:hidden bg-[var(--surface)] p-4 rounded-[var(--radius-md)] border border-[var(--muted)] ${canView ? 'cursor-pointer' : 'opacity-60'}`} {...commonProps}>
                <div className="flex justify-between items-start mb-2"><p className="text-[var(--text-80)] text-sm break-all flex-1 pr-4">{submission.source_url}</p><StatusPill status={submission.status} /></div>
                <div className="flex justify-between items-center text-xs text-[var(--text-60)]"><span className="capitalize">{submission.output_type}-form</span><span>{formatTimeAgo(new Date(submission.created_at))}</span></div>
            </div>
        </>
    );
};
export const HistoryPage = ({ submissions, updateSubmission, onSelectScript }: { submissions: Submission[], updateSubmission: (s: Submission) => void, onSelectScript: (id: string) => void }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const filteredSubmissions = useMemo(() => submissions.filter(s => statusFilter === 'all' || s.status === statusFilter).filter(s => searchTerm === '' || s.source_url.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [submissions, statusFilter, searchTerm]);

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto"><h2 className="text-2xl font-bold mb-4 text-[var(--text-100)]">History</h2>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <SegmentedControl options={[{ label: 'All', value: 'all' }, { label: 'Queued', value: 'queued' }, { label: 'Processing', value: 'processing' }, { label: 'Done', value: 'done' }, { label: 'Failed', value: 'failed' }]} value={statusFilter} onChange={setStatusFilter} />
                    <Input type="search" placeholder="Search by URL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!p-2 !text-sm w-full sm:w-64" />
                </div>
                <div className="bg-[var(--card)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--muted)]">
                    <table className="hidden lg:table w-full text-left"><thead className="border-b border-[var(--muted)] text-xs text-[var(--text-60)] uppercase tracking-wider"><tr><th className="p-4 font-semibold">Source URL</th><th className="p-4 font-semibold">Type</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold">Time</th></tr></thead><tbody>{filteredSubmissions.length > 0 ? (filteredSubmissions.map(sub => (<HistoryItem key={sub.id} submission={sub} onUpdate={updateSubmission} onSelect={onSelectScript} />))) : (<tr><td colSpan={4} className="text-center p-8 text-[var(--text-60)]">No submissions found.</td></tr>)}</tbody></table>
                    <div className="lg:hidden p-4 space-y-3">{filteredSubmissions.length > 0 ? (filteredSubmissions.map(sub => (<HistoryItem key={sub.id} submission={sub} onUpdate={updateSubmission} onSelect={onSelectScript} />))) : (<div className="text-center p-8 text-[var(--text-60)]">No submissions found.</div>)}</div>
                </div>
            </div>
        </div>
    );
};
export const AboutPage = () => (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="prose prose-invert prose-h1:text-3xl prose-h2:text-2xl prose-p:text-[var(--text-80)] prose-a:text-[var(--primary-400)] space-y-6">
            <h1>About ScriptForge</h1>
            <p>ScriptForge is an AI-powered script generation system designed to accelerate content creation. By providing a YouTube URL, website link, or RSS feed, our system analyzes the source material and produces a comprehensive, YouTube-ready script.</p>
            <h2>Features</h2>
            <ul><li>Automatic content extraction from multiple source types.</li><li>Generation of title suggestions, SEO-friendly descriptions, and relevant tags.</li><li>Detailed scene-by-scene script breakdowns.</li><li>Customizable output for long-form and short-form content.</li></ul>
            <h2>Privacy & Terms</h2>
            <p>Your privacy is important. We do not store personal information beyond what is necessary for rate limiting and service operation. All submitted URLs and generated content are processed securely. By using ScriptForge, you agree to our terms of service, which prohibit the use of our platform for generating harmful, illegal, or infringing content. All generated content should be reviewed for accuracy and originality before publishing.</p>
        </div>
    </div>
);
export const HelpPage = ({ addNotification }: { addNotification: (msg: string, type: 'success' | 'error') => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sendHelpRequest({ name, email, message });
            addNotification('Your message has been sent!', 'success');
            setName(''); setEmail(''); setMessage('');
        } catch (error) {
            addNotification(error instanceof Error ? error.message : 'An unknown error occurred.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-[680px] mx-auto bg-[var(--card)] p-[var(--space-5)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--muted)]">
                <h2 className="text-2xl font-bold mb-2 text-[var(--text-100)]">Contact Support</h2>
                <p className="text-[var(--text-60)] mb-6">Have a question or need help? Fill out the form below.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><FormLabel htmlFor="name">Name</FormLabel><Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div><FormLabel htmlFor="email">Email</FormLabel><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    </div>
                    <div><FormLabel htmlFor="message">Message</FormLabel><Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={5} required /></div>
                    <div className="pt-2"><ButtonPrimary type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Sending...' : 'Send Message'}</ButtonPrimary></div>
                </form>
            </div>
        </div>
    );
};

// --- Screen/View Components ---
const Scene = ({ scene }: { scene: SceneType }) => {
    const [isOpen, setIsOpen] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    return (
        <div className="bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--muted)]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left" aria-expanded={isOpen}>
                <h4 className="font-semibold text-lg text-[var(--text-100)]">Scene {scene.scene}</h4>
                <span className="text-[var(--text-60)] transition-transform duration-[var(--anim-medium)]" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronDownIcon /></span>
            </button>
            <div ref={contentRef} className="overflow-hidden transition-[max-height] duration-[var(--anim-medium)] ease-[var(--ease)]" style={{ maxHeight: isOpen ? contentRef.current?.scrollHeight + 'px' : '0px' }}>
                <div className="p-4 pt-0"><p className="whitespace-pre-wrap text-[var(--text-80)] leading-relaxed">{scene.text}</p><div className="flex justify-end mt-2"><CopyButton textToCopy={scene.text} /></div></div>
            </div>
        </div>
    );
};
export const ScriptViewerScreen = ({ scriptId, onBack, addNotification }: { scriptId: string, onBack: () => void, addNotification: (msg: string, type: 'success' | 'error') => void }) => {
    const [script, setScript] = useState<Script | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const { copy: copyAll } = useCopyToClipboard();

    useEffect(() => {
        const fetchScript = async () => {
            setLoading(true); setError(null);
            try { setScript(await getScript(scriptId)); } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to load script.';
                setError(msg); addNotification(msg, 'error');
            } finally { setLoading(false); }
        };
        fetchScript();
    }, [scriptId, addNotification]);

    const handleCopyAll = () => {
        if (!script) return;
        const fullScriptText = `Title: ${script.title_suggestions[0]}\n\nDescription:\n${script.description}\n\nTags: ${script.tags.join(', ')}\n\n--- SCRIPT ---\n\n${script.scenes.map(s => `SCENE ${s.scene}\n${s.text}`).join('\n\n')}`.trim();
        copyAll(fullScriptText);
        addNotification('Copied all script content!', 'success');
    };
    const handleSendEmail = (email: string) => { addNotification(`Script sent to ${email}`, 'success'); setIsEmailModalOpen(false); };
    const SectionCard = ({ title, children, action }: { title: string, children: React.ReactNode, action?: React.ReactNode }) => (
        <div className="bg-[var(--card)] p-[var(--space-5)] rounded-[var(--radius-md)] border border-[var(--muted)]"><div className="flex justify-between items-center mb-3"><h3 className="text-xl font-bold text-[var(--text-100)]">{title}</h3>{action}</div>{children}</div>
    );

    if (loading) return <div className="text-center p-12 text-[var(--text-60)] animate-pulse">Loading Script...</div>;
    if (error) return <div className="text-center p-12 text-[var(--danger)]">Error: {error} <ButtonSecondary onClick={onBack} className="ml-4 !py-2">Back</ButtonSecondary></div>;
    if (!script) return <div className="text-center p-12 text-[var(--text-60)]">Script not found.</div>;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <ButtonSecondary onClick={onBack} className="mb-8 !py-2">&larr; Back to History</ButtonSecondary>
            <div className="space-y-8">
                <SectionCard title="Title Suggestions"><ul className="space-y-2">{script.title_suggestions.map((title, index) => (<li key={index} className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--radius-sm)]"><span className="text-[var(--text-80)]">&quot;{title}&quot;</span><CopyButton textToCopy={title} /></li>))}</ul></SectionCard>
                <SectionCard title="Description" action={<CopyButton textToCopy={script.description} />}><p className="text-[var(--text-80)] whitespace-pre-wrap">{script.description}</p></SectionCard>
                <SectionCard title="Tags" action={<CopyButton textToCopy={script.tags.join(', ')} />}><p className="text-[var(--text-80)]">{script.tags.join(', ')}</p></SectionCard>
                <div><h3 className="text-xl font-bold mb-3 text-[var(--text-100)]">Scenes</h3><div className="space-y-4">{script.scenes.sort((a, b) => a.scene - b.scene).map(scene => (<Scene key={scene.scene} scene={scene} />))}</div></div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-[var(--muted)]"><ButtonSecondary onClick={handleCopyAll} className="flex items-center space-x-2"><CopyIcon /><span>COPY ALL</span></ButtonSecondary><ButtonPrimary onClick={() => setIsEmailModalOpen(true)} className="flex items-center space-x-2"><EmailIcon /><span>EMAIL SCRIPT</span></ButtonPrimary></div>
            </div>
            <div className="text-xs text-[var(--text-60)] mt-6 text-center"><p>Generated in {script.generation_time_ms}ms. Source: <a href={script.source_link} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-400)] hover:underline">{script.source_link}</a></p></div>
            <EmailModal show={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} onSend={handleSendEmail} />
        </div>
    );
};
