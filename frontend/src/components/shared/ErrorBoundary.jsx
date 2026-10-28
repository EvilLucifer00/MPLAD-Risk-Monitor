import React from 'react';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in their child component tree,
 * logs them silently without dumping raw browser errors to the console,
 * and displays a user-friendly fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ERROR BOUNDARY CAUGHT:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-6">
              An unexpected issue occurred while rendering this section. You can refresh the view to continue.
            </p>
            {import.meta.env?.DEV && this.state.error && (
              <pre className="text-left text-xs bg-red-50 text-red-700 p-3 rounded-lg mb-6 overflow-auto max-h-36 border border-red-100 font-mono">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-[#123b63] hover:bg-[#0d2744] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
