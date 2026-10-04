import { create } from 'zustand';

/**
 * Zustand Global State Store for DA (District Authority) Dashboard.
 * Centralizes UI state management for filtering, views, and review modes.
 */
export const useDaStore = create((set) => ({
  // --- Dashboard State ---
  // Tracks which chart metric is currently displayed on the dashboard
  dashboardChartView: 'Risk',
  setDashboardChartView: (view) => set({ dashboardChartView: view }),

  // --- Projects Page State ---
  // Toggles between different viewing modes (grid of cards vs analytics table)
  projectsView: 'grid', // 'grid' | 'analytics'
  setProjectsView: (view) => set({ projectsView: view }),

  // Active MP filter for projects list
  projectsMpFilter: 'All',
  setProjectsMpFilter: (mp) => set({ projectsMpFilter: mp }),

  // Active Status filter for projects list
  projectsStatusFilter: 'All',
  setProjectsStatusFilter: (status) => set({ projectsStatusFilter: status }),

  // Active Risk level filter for projects list
  projectsRiskFilter: 'All',
  setProjectsRiskFilter: (risk) => set({ projectsRiskFilter: risk }),

  // --- Review Queue State ---
  // Toggles "Quick Mode" layout in the review queue
  reviewQuickMode: false,
  setReviewQuickMode: (mode) => set({ reviewQuickMode: mode }),

  // Filters for the project review queue
  reviewMpFilter: 'All',
  setReviewMpFilter: (mp) => set({ reviewMpFilter: mp }),

  reviewRiskFilter: 'All',
  setReviewRiskFilter: (risk) => set({ reviewRiskFilter: risk }),

  reviewCategoryFilter: 'All',
  setReviewCategoryFilter: (cat) => set({ reviewCategoryFilter: cat }),
}));
