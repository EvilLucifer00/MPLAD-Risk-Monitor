import { create } from 'zustand';

export const useDaStore = create((set) => ({
  // Dashboard State
  dashboardChartView: 'Risk',
  setDashboardChartView: (view) => set({ dashboardChartView: view }),

  // Projects State
  projectsView: 'grid', // 'grid' | 'analytics'
  setProjectsView: (view) => set({ projectsView: view }),

  projectsMpFilter: 'All',
  setProjectsMpFilter: (mp) => set({ projectsMpFilter: mp }),

  projectsStatusFilter: 'All',
  setProjectsStatusFilter: (status) => set({ projectsStatusFilter: status }),

  projectsRiskFilter: 'All',
  setProjectsRiskFilter: (risk) => set({ projectsRiskFilter: risk }),

  // Review Queue State
  reviewQuickMode: false,
  setReviewQuickMode: (mode) => set({ reviewQuickMode: mode }),

  reviewMpFilter: 'All',
  setReviewMpFilter: (mp) => set({ reviewMpFilter: mp }),

  reviewRiskFilter: 'All',
  setReviewRiskFilter: (risk) => set({ reviewRiskFilter: risk }),

  reviewCategoryFilter: 'All',
  setReviewCategoryFilter: (cat) => set({ reviewCategoryFilter: cat }),
}));
