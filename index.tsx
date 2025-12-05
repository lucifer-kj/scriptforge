import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

// Register Service Worker for PWA support only in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .catch(() => {
                // Service Worker registration failed, continue without it
            });
    });
}

