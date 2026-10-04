import { create } from 'zustand';

/**
 * Zustand Global State Store for MP (Member of Parliament) Dashboard.
 * Stores UI state (like active filters and views) so they persist as the user navigates pages.
 */
export const useMpStore = create((set) => ({
  // --- Dashboard State ---
  // Tracks the active tab or view on the main dashboard chart
  dashboardChartView: 'Status',
  setDashboardChartView: (view) => set({ dashboardChartView: view }),

  // --- Projects Page State ---
  // Filter for project status (e.g., 'All', 'In Progress', 'Completed')
  projectsStatusFilter: 'All',
  setProjectsStatusFilter: (status) => set({ projectsStatusFilter: status }),
  
  // Filter for project risk level (e.g., 'All', 'High', 'Low')
  projectsRiskFilter: 'All',
  setProjectsRiskFilter: (risk) => set({ projectsRiskFilter: risk }),
}));
