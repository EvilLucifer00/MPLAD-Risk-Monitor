import React from 'react';
import EmblemImage from './EmblemImage';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors and dynamic module import (chunk load) failures anywhere
 * in their child component tree, providing state-of-the-art error typography,
 * government layout topology, and specialized handling for offline uncached pages.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isOnline: typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
      wasReconnected: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ERROR BOUNDARY CAUGHT:', error, errorInfo);
  }

  componentDidMount() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true, wasReconnected: true });
    // When returning online from offline mode, silently recover and reload the view without any animations
    if (this.state.hasError && this.isOfflineChunkError(this.state.error)) {
      this.setState({ hasError: false, error: null });
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false, wasReconnected: false });
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  isOfflineChunkError = (error) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true;
    }
    const msg = (error?.message || '').toLowerCase();
    const name = (error?.name || '').toLowerCase();
    return (
      name === 'chunkloaderror' ||
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading chunk') ||
      msg.includes('network error') ||
      msg.includes('import call failed')
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isOfflineFailure = this.isOfflineChunkError(this.state.error);

      // ── SPECIALIZED OFFLINE / UNCACHED PAGE VIEW ──────────────────
      if (isOfflineFailure) {
        return (
          <div 
            role="alert" 
            aria-live="assertive"
            className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased selection:bg-cyan-500/20 selection:text-cyan-900"
          >
            {/* Official Top Govt Header */}
            <header className="bg-[#0d2744] text-white border-b border-white/10 px-6 py-3.5 shadow-sm">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1">
                  <EmblemImage width="34" height="42" className="w-8 h-10 object-contain shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 leading-none">Government of India</p>
                    <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                      MPLADS Risk Monitor
                    </h1>
                  </div>
                </a>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Offline Status</span>
                  </span>
                  <a 
                    href="/" 
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <span>Home</span>
                  </a>
                </div>
              </div>
            </header>

            {/* Main Center Content */}
            <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#123b63_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

              <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
                {/* Accent Ribbon */}
                <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-[#00a8e8] to-[#123b63]" />

                <div className="p-8 sm:p-10 text-center">
                  {/* Cloud Offline Graphic */}
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Status Indicator */}
                  <div className="mb-4">
                    {this.state.isOnline ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Connection Restored • Ready to Load
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Device Offline • Page Not Cached
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-extrabold text-[#123b63] tracking-tight mb-2.5">
                    Page Unavailable Offline
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-8 text-pretty">
                    This section has not been cached on your device yet. Reconnect to the internet to load this view, or return to an already cached portal section.
                  </p>

                  {/* Action Buttons with Optimal Layout & Spacing */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      type="button"
                      onClick={this.handleGoBack}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Go Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={this.handleReload}
                      className={`w-full sm:w-auto px-6 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 ${
                        this.state.isOnline
                          ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 focus-visible:ring-emerald-500 ring-2 ring-emerald-400/50'
                          : 'bg-[#123b63] hover:bg-[#0d2744] active:scale-95 focus-visible:ring-cyan-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{this.state.isOnline ? 'Load View Now' : 'Reload Page'}</span>
                    </button>

                    <a
                      href="/"
                      className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center"
                    >
                      Return to Home
                    </a>
                  </div>
                </div>
              </div>
            </main>

            {/* Official Footer */}
            <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
              <p>Ministry of Statistics and Programme Implementation (MoSPI) • Government of India</p>
            </footer>
          </div>
        );
      }

      // ── GENERAL RUNTIME ERROR VIEW WITH REFINED TOPOLOGY ───────────
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased selection:bg-cyan-500/20 selection:text-cyan-900"
        >
          {/* Official Top Govt Header */}
          <header className="bg-[#0d2744] text-white border-b border-white/10 px-6 py-3.5 shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <a href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1">
                <EmblemImage width="34" height="42" className="w-8 h-10 object-contain shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 leading-none">Government of India</p>
                  <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                    MPLADS Risk Monitor
                  </h1>
                </div>
              </a>
              <div className="flex items-center gap-2">
                <a 
                  href="/" 
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <span>Home</span>
                </a>
              </div>
            </div>
          </header>

          {/* Main Center Content */}
          <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#123b63_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

            <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
              {/* Top Accent Strip */}
              <div className="h-2 w-full bg-[#123b63]" />

              <div className="p-8 sm:p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 mb-3 border border-slate-200">
                  System Notice • View Interrupted
                </span>

                <h2 className="text-2xl font-extrabold text-[#123b63] tracking-tight mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6 text-pretty">
                  An unexpected issue occurred while rendering this section. Your user session and recorded data remain safe.
                </p>

                {/* Developer Details Accordion */}
                {this.state.error && (
                  <div className="mb-6 text-left">
                    <button
                      type="button"
                      onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                      className="text-xs font-semibold text-[#123b63] hover:underline flex items-center gap-1 mb-2"
                    >
                      <span>{this.state.showDetails ? 'Hide Technical Details' : 'View Technical Details'}</span>
                      <span aria-hidden="true">{this.state.showDetails ? '▲' : '▼'}</span>
                    </button>
                    {this.state.showDetails && (
                      <pre className="text-xs bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-auto max-h-36 font-mono leading-relaxed">
                        {this.state.error.toString()}
                      </pre>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    type="button"
                    onClick={this.handleGoBack}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Go Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#123b63] hover:bg-[#0d2744] active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    Reload Page
                  </button>

                  <a
                    href="/"
                    className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center"
                  >
                    Return to Home
                  </a>
                </div>
              </div>
            </div>
          </main>

          {/* Official Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
            <p>Ministry of Statistics and Programme Implementation (MoSPI) • Government of India</p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
