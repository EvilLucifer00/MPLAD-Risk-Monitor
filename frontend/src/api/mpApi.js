// src/api/mpApi.js
import { projectsApi, dashboardApi, notificationsApi, documentsApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';
import { queryClient } from '../queryClient';
import { queryKeys } from './queryKeys';

export const mpApi = {

  // Projects
  /**
   * Retrieves all projects submitted by the currently logged-in MP from the real backend API.
   */
  getProjects: async (params = {}, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getAllProjects(params, options);
      }
    } catch {
      // Graceful fallback to empty array on network/auth error
    }
    return [];
  },
  
  getProjectById: async (id, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getProjectById(id, options);
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
  getNotifications: async (filter = null, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.getMpNotifications(filter, options);
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
  getRecommendations: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const user = useAuthStore.getState().user;
        const cachedStats = queryClient.getQueryData(queryKeys.mp.stats(user?.id));
        const cachedProjects = queryClient.getQueryData(queryKeys.mp.projects(user?.id, {}));

        const stats = cachedStats || await dashboardApi.getMpStats(options).catch(() => null);
        const projects = cachedProjects || await projectsApi.getAllProjects({}, options).catch(() => []);
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

  // Documents
  getDocuments: async (params = {}, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await documentsApi.getMpDocuments(params, options);
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  // Dashboard Stats
  /**
   * Fetches aggregate project statistics from the real backend API.
   * Throws on error so React Query correctly handles retry and loading state,
   * avoiding rendering false/zero skeletons before real data arrives.
   */
  getDashboardStats: async (options = {}) => {
    const token = useAuthStore.getState().token;
    if (token) {
      return await dashboardApi.getMpStats(options);
    }
    throw new Error('Authentication required for MP Dashboard metrics.');
  }
};

export const api = mpApi;
