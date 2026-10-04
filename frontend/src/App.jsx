import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/HomePage/index.jsx';
import LoginPage from './pages/LoginPage/index.jsx';

// MP (Member of Parliament) Pages
import MpLayout from './pages/mp/MpLayout.jsx';
import MpDashboard from './pages/mp/MpDashboard.jsx';
import MpProjects from './pages/mp/MpProjects.jsx';
import MpProjectDetail from './pages/mp/MpProjectDetail.jsx';
import MpSubmitProject from './pages/mp/MpSubmitProject.jsx';
import MpReports from './pages/mp/MpReports.jsx';
import MpDocuments from './pages/mp/MpDocuments.jsx';
import MpNotifications from './pages/mp/MpNotifications.jsx';
import MpSettings from './pages/mp/MpSettings.jsx';

// DA (District Authority / District Magistrate) Pages
import DaLayout from './pages/da/DaLayout.jsx';
import DaDashboard from './pages/da/DaDashboard.jsx';
import DaProjects from './pages/da/DaProjects.jsx';
import DaMPDetail from './pages/da/DaMPDetail.jsx';
import DaProjectReview from './pages/da/DaProjectReview.jsx';
import DaReviewDetail from './pages/da/DaReviewDetail.jsx';
import DaDocuments from './pages/da/DaDocuments.jsx';
import DaNotifications from './pages/da/DaNotifications.jsx';
import DaIADirectory from './pages/da/DaIADirectory.jsx';
import DaVendorWatchlist from './pages/da/DaVendorWatchlist.jsx';
import DaSettings from './pages/da/DaSettings.jsx';

/**
 * Main App Component
 * Handles the application routing using React Router.
 * Separates views into Public, MP (Member of Parliament), and DA (District Authority) sections.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* MP Dashboard Routes - Wrapped in MpLayout for consistent sidebar/navbar */}
        <Route path="/mp" element={<MpLayout />}>
          <Route index element={<MpDashboard />} />
          <Route path="projects" element={<MpProjects />} />
          <Route path="projects/:id" element={<MpProjectDetail />} />
          <Route path="submit" element={<MpSubmitProject />} />
          <Route path="reports" element={<MpReports />} />
          <Route path="documents" element={<MpDocuments />} />
          <Route path="notifications" element={<MpNotifications />} />
          <Route path="settings" element={<MpSettings />} />
        </Route>

        {/* DA (District Authority) Dashboard Routes - Wrapped in DaLayout */}
        <Route path="/da" element={<DaLayout />}>
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
    </BrowserRouter>
  );
}

export default App;
