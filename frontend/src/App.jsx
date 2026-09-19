import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

import MpLayout from './pages/mp/MpLayout.jsx';
import MpDashboard from './pages/mp/MpDashboard.jsx';
import MpProjects from './pages/mp/MpProjects.jsx';
import MpProjectDetail from './pages/mp/MpProjectDetail.jsx';
import MpSubmitProject from './pages/mp/MpSubmitProject.jsx';
import MpReports from './pages/mp/MpReports.jsx';
import MpDocuments from './pages/mp/MpDocuments.jsx';
import MpNotifications from './pages/mp/MpNotifications.jsx';
import MpSettings from './pages/mp/MpSettings.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* MP Dashboard Routes */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
