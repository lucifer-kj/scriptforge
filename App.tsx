import { useState, useEffect, useCallback } from 'react';
import { AppView, Submission, Notification as NotificationType, Page } from './types';
import { SplashScreen, DesktopHeader, MobileBottomNav, HomePage, HistoryPage, AboutPage, HelpPage, ScriptViewerScreen, NotificationHandler, Footer, ResultsPage } from './components';

const SUBMISSIONS_KEY = 'scriptforge_submissions';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<AppView>('page');
    const [page, setPage] = useState<Page>('home');
    const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
    const [resultsJobId, setResultsJobId] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [notifications, setNotifications] = useState<NotificationType[]>([]);

    useEffect(() => {
        // Simulate app loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SUBMISSIONS_KEY);
            if (stored) setSubmissions(JSON.parse(stored));
        } catch (error) {
            console.error("Failed to load submissions from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            const submissionsToSave = submissions.filter(s => s.status !== 'failed' || s.script_id);
            localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissionsToSave));
        } catch (error) {
            console.error("Failed to save submissions to localStorage", error);
        }
    }, [submissions]);

    const addSubmission = useCallback((submission: Submission) => {
        setSubmissions(prev => [submission, ...prev]);
        setPage('history');
    }, []);

    // Navigate to results page for a job id (updates history)
    const navigateToResults = useCallback((jobId: string) => {
        try {
            window.history.pushState({}, '', `/results/${jobId}`);
        } catch (e) {
            // ignore
        }
        setResultsJobId(jobId);
        setPage('results');
    }, []);

    const updateSubmission = useCallback((updatedSubmission: Submission) => {
        setSubmissions(prev => prev.map(s => s.id === updatedSubmission.id ? updatedSubmission : s));
    }, []);

    const handleSelectScript = (scriptId: string) => {
        setSelectedScriptId(scriptId);
        setView('scriptViewer');
    };

    const handleBackToPage = () => {
        setSelectedScriptId(null);
        setView('page');
    };

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [newNotification, ...prev.filter(n => n.message !== message)]);
        setTimeout(() => removeNotification(newNotification.id), 3500);
    }, [removeNotification]);

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <HomePage addSubmission={addSubmission} addNotification={addNotification} navigateToResults={navigateToResults} />;
            case 'history':
                return <HistoryPage submissions={submissions} updateSubmission={updateSubmission} onSelectScript={handleSelectScript} />;
            case 'results':
                return resultsJobId ? <ResultsPage jobId={resultsJobId} /> : <HomePage addSubmission={addSubmission} addNotification={addNotification} navigateToResults={navigateToResults} />;
            case 'about':
                return <AboutPage />;
            case 'help':
                return <HelpPage addNotification={addNotification} />;
            default:
                return <HomePage addSubmission={addSubmission} addNotification={addNotification} />;
        }
    };

    // Initialize from URL (support direct /results/:jobId links)
    useEffect(() => {
        const path = window.location.pathname || '/';
        const m = path.match(/^\/results\/(.+)$/);
        if (m) {
            setResultsJobId(m[1]);
            setPage('results');
        }

        const onPop = () => {
            const p = window.location.pathname || '/';
            const mm = p.match(/^\/results\/(.+)$/);
            if (mm) {
                setResultsJobId(mm[1]);
                setPage('results');
            } else {
                // default to home when not results
                setPage('home');
                setResultsJobId(null);
            }
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    return (
        <>
            <SplashScreen visible={isLoading} />
            <div className={`min-h-screen bg-[var(--bg-900)] text-[var(--text-100)] pb-20 md:pb-0 transition-opacity duration-500 ${!isLoading ? 'opacity-100' : 'opacity-0'}`}>
                <DesktopHeader activePage={page} setPage={setPage} />
                <MobileBottomNav activePage={page} setPage={setPage} />
                
                <main>
                    {view === 'page' && (
                        <>
                            {renderPage()}
                            <Footer />
                        </>
                    )}
                    {view === 'scriptViewer' && selectedScriptId && (
                        <ScriptViewerScreen
                            scriptId={selectedScriptId}
                            onBack={handleBackToPage}
                            addNotification={addNotification}
                        />
                    )}
                </main>
                
                <NotificationHandler notifications={notifications} onDismiss={removeNotification} />
            </div>
        </>
    );
};

export default App;
