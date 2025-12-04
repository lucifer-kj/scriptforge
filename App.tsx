import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Submission, Notification as NotificationType, Page } from './types';
import { SplashScreen, DesktopHeader, MobileBottomNav, HomePage, HistoryPage, AboutPage, HelpPage, ScriptViewerScreen, NotificationHandler, Footer } from './components';

const SUBMISSIONS_KEY = 'scriptforge_submissions';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<AppView>('page');
    const [page, setPage] = useState<Page>('home');
    const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
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

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const newNotification = { id: Date.now(), message, type };
        setNotifications(prev => [newNotification, ...prev.filter(n => n.message !== message)]);
        setTimeout(() => removeNotification(newNotification.id), 3500);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <HomePage addSubmission={addSubmission} addNotification={addNotification} />;
            case 'history':
                return <HistoryPage submissions={submissions} updateSubmission={updateSubmission} onSelectScript={handleSelectScript} />;
            case 'about':
                return <AboutPage />;
            case 'help':
                return <HelpPage addNotification={addNotification} />;
            default:
                return <HomePage addSubmission={addSubmission} addNotification={addNotification} />;
        }
    };

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
