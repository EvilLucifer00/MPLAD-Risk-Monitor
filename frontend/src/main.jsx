import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
<<<<<<< HEAD
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
=======
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';

// Prevent browser errors and unhandled exceptions from logging to console
if (typeof window !== 'undefined') {
  // Check if debug mode is requested via URL (?debug=true) or global flag
  const isDebug = window.__DEBUG__ || window.location.search.includes('debug=true');

  if (!isDebug) {
    // Silence console.error and console.warn to keep browser console clean
    console.error = () => {};
    console.warn = () => {};

    // Prevent uncaught errors from dumping red browser error messages to the console
    window.addEventListener('error', (event) => {
      event.preventDefault();
    });

    // Prevent unhandled promise rejections from logging browser errors to the console
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
    });
  }
}
>>>>>>> 0cc7204af2d25e77145bc95a8d6cd281e94a9276

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
<<<<<<< HEAD
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register Service Worker in production for instant offline navigation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
=======
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
>>>>>>> 0cc7204af2d25e77145bc95a8d6cd281e94a9276
