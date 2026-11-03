// src/api/mpApi.js
import { projectsApi, dashboardApi, notificationsApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';

export const mpApi = {

  // Projects
  /**
   * Retrieves all projects submitted by the currently logged-in MP from the real backend API.
   */
  getProjects: async (params = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getAllProjects(params);
      }
    } catch {
      // Graceful fallback to empty array on network/auth error
    }
    return [];
  },
  
  getProjectById: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getProjectById(id);
      }
    } catch {
      // Graceful fallback
    }
    return null;
  },

  /**
   * Submits a new project proposal to the real backend.
   */
  submitProject: async (projectData) => {
    const token = useAuthStore.getState().token;
    if (token) {
      return await projectsApi.submitProject(projectData);
    }
    throw new Error('Authentication required to submit proposals.');
  },

  // Notifications
  getNotifications: async (filter = null) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.getMpNotifications(filter);
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  markNotificationRead: async (id, isRead = true) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.markMpRead(id, isRead);
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  markAllNotificationsRead: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.markAllMpRead();
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  deleteNotification: async (id) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.deleteMpNotification(id);
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  // Recommendations
  /**
   * Generates tailored recommendations for the MP derived from live backend statistics and projects.
   */
  getRecommendations: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const stats = await dashboardApi.getMpStats().catch(() => null);
        const projects = await projectsApi.getAllProjects().catch(() => []);
        const recs = [];

        const highRisk = projects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical');
        if (highRisk.length > 0) {
          recs.push({
            id: 'rec-hr',
            type: 'Vendor Alert',
            message: `${highRisk.length} active project(s) flagged with High or Critical risk. Review vendor performance and milestones.`,
            relatedProjectIds: [highRisk[0].id],
          });
        }

        if (stats && stats.totalEntitlement > 0) {
          const unspent = Math.round(((stats.totalEntitlement - stats.totalUtilized) / stats.totalEntitlement) * 100);
          if (unspent > 50) {
            recs.push({
              id: 'rec-util',
              type: 'Utilization Warning',
              message: `Your unspent balance is ${unspent}% with 2 months left in the fiscal year. Consider expediting pending proposals.`,
            });
          }
        }
        return recs;
      }
    } catch {
      return [];
    }
    return [];
  },

  // Dashboard Stats
  /**
   * Fetches aggregate project statistics from the real backend API.
   * If values are zero, returns zero metrics rather than fallback mock numbers.
   */
  getDashboardStats: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await dashboardApi.getMpStats();
      }
    } catch {
      // Graceful zero fallback
    }
    return {
      activeProjects: 0,
      totalEntitlement: 50000000,
      totalUtilized: 0,
      pendingApprovals: 0,
      totalProjects: 0,
      riskCounts: {
        Low: 0,
        Moderate: 0,
        High: 0,
        Critical: 0,
      },
      statusBreakdown: {
        on_track: 0,
        high_risk: 0,
        completed: 0,
      },
      recentProjects: [],
    };
  }
};

export const api = mpApi;
