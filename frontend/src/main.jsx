import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
