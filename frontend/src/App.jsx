import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import ProtectedRoute from './components/shared/ProtectedRoute.jsx';
import { useAuthStore } from './store/useAuthStore.js';

// Lazy-loaded routes for code-splitting & performance
const Home = lazy(() => import('./pages/HomePage/index.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage/index.jsx'));

// MP (Member of Parliament) Pages
const MpLayout = lazy(() => import('./pages/mp/MpLayout.jsx'));
const MpDashboard = lazy(() => import('./pages/mp/MpDashboard.jsx'));
const MpProjects = lazy(() => import('./pages/mp/MpProjects.jsx'));
const MpProjectDetail = lazy(() => import('./pages/mp/MpProjectDetail.jsx'));
const MpSubmitProject = lazy(() => import('./pages/mp/MpSubmitProject.jsx'));
const MpReports = lazy(() => import('./pages/mp/MpReports.jsx'));
const MpDocuments = lazy(() => import('./pages/mp/MpDocuments.jsx'));
const MpNotifications = lazy(() => import('./pages/mp/MpNotifications.jsx'));
const MpSettings = lazy(() => import('./pages/mp/MpSettings.jsx'));

// DA (District Authority / District Magistrate) Pages
const DaLayout = lazy(() => import('./pages/da/DaLayout.jsx'));
const DaDashboard = lazy(() => import('./pages/da/DaDashboard.jsx'));
const DaProjects = lazy(() => import('./pages/da/DaProjects.jsx'));
const DaMPDetail = lazy(() => import('./pages/da/DaMPDetail.jsx'));
const DaProjectReview = lazy(() => import('./pages/da/DaProjectReview.jsx'));
const DaReviewDetail = lazy(() => import('./pages/da/DaReviewDetail.jsx'));
const DaDocuments = lazy(() => import('./pages/da/DaDocuments.jsx'));
const DaNotifications = lazy(() => import('./pages/da/DaNotifications.jsx'));
const DaIADirectory = lazy(() => import('./pages/da/DaIADirectory.jsx'));
const DaVendorWatchlist = lazy(() => import('./pages/da/DaVendorWatchlist.jsx'));
const DaSettings = lazy(() => import('./pages/da/DaSettings.jsx'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Portal...</p>
    </div>
  </div>
);

/**
 * Main App Component
 * Handles the application routing using React Router.
 * Separates views into Public, MP (Member of Parliament), and DA (District Authority) sections.
 */
function App() {
  useEffect(() => {
    // Defer session validation until real user interaction or after a long delay
    // to prevent chaining external API requests into the critical navigation path & LCP waterfall.
    let timerId = null;
    let validated = false;

    const performValidation = () => {
      if (validated) return;
      validated = true;
      cleanup();
      useAuthStore.getState().validateSession();
    };

    const cleanup = () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('pointerdown', performValidation);
      window.removeEventListener('keydown', performValidation);
      window.removeEventListener('touchstart', performValidation);
    };

    window.addEventListener('pointerdown', performValidation, { once: true, passive: true });
    window.addEventListener('keydown', performValidation, { once: true, passive: true });
    window.addEventListener('touchstart', performValidation, { once: true, passive: true });

    // Fallback timer: only trigger validation if user remains on page for >30 seconds
    timerId = setTimeout(performValidation, 30000);

    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      {/* WCAG 2.4.1: Skip to main content link for keyboard & screen reader accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2.5 focus:bg-[#123b63] focus:text-white focus:rounded-lg focus:shadow-xl focus:font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* MP Dashboard Routes - Protected and wrapped in MpLayout */}
          <Route 
            path="/mp" 
            element={
              <ProtectedRoute allowedRole="MP">
                <MpLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MpDashboard />} />
            <Route path="projects" element={<MpProjects />} />
            <Route path="projects/:id" element={<MpProjectDetail />} />
            <Route path="submit" element={<MpSubmitProject />} />
            <Route path="reports" element={<MpReports />} />
            <Route path="documents" element={<MpDocuments />} />
            <Route path="notifications" element={<MpNotifications />} />
            <Route path="settings" element={<MpSettings />} />
          </Route>

          {/* DA (District Authority) Dashboard Routes - Protected and wrapped in DaLayout */}
          <Route 
            path="/da" 
            element={
              <ProtectedRoute allowedRole="DM">
                <DaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DaDashboard />} />
            <Route path="projects" element={<DaProjects />} />
            <Route path="projects/mp/:mpId" element={<DaMPDetail />} />
            <Route path="review" element={<DaProjectReview />} />
            <Route path="review/:id" element={<DaReviewDetail />} />
            <Route path="documents" element={<DaDocuments />} />
            <Route path="notifications" element={<DaNotifications />} />
            <Route path="agencies" element={<DaIADirectory />} />
            <Route path="vendors" element={<DaVendorWatchlist />} />
            <Route path="settings" element={<DaSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
