import { create } from 'zustand';

export const useMpStore = create((set) => ({
  // Dashboard State
  dashboardChartView: 'Status',
  setDashboardChartView: (view) => set({ dashboardChartView: view }),

  // Projects State
  projectsStatusFilter: 'All',
  setProjectsStatusFilter: (status) => set({ projectsStatusFilter: status }),
  
  projectsRiskFilter: 'All',
  setProjectsRiskFilter: (risk) => set({ projectsRiskFilter: risk }),
}));
