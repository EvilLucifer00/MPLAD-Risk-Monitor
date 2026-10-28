// src/api/mockDaApi.js
import { projectsApi, dashboardApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';

export const daApi = {
  // ── Profile ──
  getProfile: async () => {
    const user = useAuthStore.getState().user;
    return {
      name: user?.dm_name || 'District Authority',
      designation: 'District Magistrate',
      district: user?.dist || 'District',
      state: user?.state || 'State',
    };
  },

  // ── MPs in District ──
  /**
   * Retrieves all Members of Parliament (MPs) in the DM's district from backend /projects/district/overview.
   */
  getDistrictMPs: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getDistrictOverview();
      }
    } catch {
      // Graceful fallback to empty array
    }
    return [];
  },

  getMPProjects: async (mpId) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const result = await projectsApi.getDistrictMpProjects(mpId);
        return result.projects || [];
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  // ── Projects ──
  /**
   * Retrieves all district projects across MPs from the backend.
   */
  getProjects: async (filters = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        // Fetch all district MPs first
        const mps = await projectsApi.getDistrictOverview();
        if (!mps || mps.length === 0) return [];

        // Fetch projects for each MP in the district
        const projectPromises = mps.map(mp => 
          projectsApi.getDistrictMpProjects(mp.rawMpId || mp.id, filters)
            .then(res => res.projects || [])
            .catch(() => [])
        );
        const nested = await Promise.all(projectPromises);
        let allProjects = nested.flat();

        if (filters.search) {
          const s = filters.search.toLowerCase();
          allProjects = allProjects.filter(p =>
            p.title?.toLowerCase().includes(s) ||
            p.vendor?.toLowerCase().includes(s) ||
            p.implementingAgency?.toLowerCase().includes(s)
          );
        }
        if (filters.status && filters.status !== 'All') {
          allProjects = allProjects.filter(p => p.status === filters.status);
        }
        if (filters.riskLevel && filters.riskLevel !== 'All') {
          allProjects = allProjects.filter(p => p.riskLevel === filters.riskLevel);
        }
        return allProjects;
      }
    } catch {
      // Return empty array
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
      // Return null
    }
    return null;
  },

  // ── Actions ──
  sanctionProject: async (id, { condition = '' } = {}) => {
    return { success: true, id, status: 'Sanctioned' };
  },

  rejectProject: async (id, { rejectionReason = '' } = {}) => {
    return { success: true, id, status: 'Rejected' };
  },

  requestDocuments: async (id, { requiredDocs = [] } = {}) => {
    return { success: true, id };
  },

  suspendProject: async (id, { justification = '' } = {}) => {
    return { success: true, id, status: 'Suspended' };
  },

  escalateProject: async (id, { notes = '' } = {}) => {
    return { success: true, id, status: 'Escalated' };
  },

  quickApprove: async (id, { implementingAgencyId = '' } = {}) => {
    return { success: true, id, status: 'Sanctioned' };
  },

  getReviewQueue: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const mps = await projectsApi.getDistrictOverview();
        if (!mps || mps.length === 0) return [];
        const projectPromises = mps.map(mp => 
          projectsApi.getDistrictMpProjects(mp.rawMpId || mp.id, { status: 'PENDING_REVIEW' })
            .then(res => res.projects || [])
            .catch(() => [])
        );
        const nested = await Promise.all(projectPromises);
        return nested.flat();
      }
    } catch {
      // Return empty
    }
    return [];
  },

  generateReport: async () => {
    return { success: true, timestamp: new Date().toISOString() };
  },

  // ── Implementing Agencies ──
  getImplementingAgencies: async () => {
    return [];
  },

  // ── Vendors ──
  getVendors: async () => {
    return [];
  },

  flagVendor: async (id, { notes = '' } = {}) => {
    return { id, flagged: true, flagNotes: notes };
  },

  unflagVendor: async (id) => {
    return { id, flagged: false, flagNotes: '' };
  },

  // ── Notifications ──
  getNotifications: async () => {
    return [];
  },

  markNotificationRead: async (id) => {
    return true;
  },

  // ── Recommendations ──
  getRecommendations: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const stats = await dashboardApi.getDmStats().catch(() => null);
        const recs = [];
        if (stats && stats.pendingReview > 0) {
          recs.push({
            id: 'rec-da-1',
            type: 'Pending Sanction',
            message: `${stats.pendingReview} proposal(s) currently awaiting district sanction and technical verification.`,
          });
        }
        if (stats && (stats.riskCounts?.High + stats.riskCounts?.Critical > 0)) {
          const count = stats.riskCounts.High + stats.riskCounts.Critical;
          recs.push({
            id: 'rec-da-2',
            type: 'Risk Alert',
            message: `${count} project(s) flagged with elevated risk in your jurisdiction.`,
          });
        }
        return recs;
      }
    } catch {
      return [];
    }
    return [];
  },

  // ── Dashboard Stats ──
  /**
   * Fetches district overview metrics from the real backend API.
   * If values are zero, returns clean zero values.
   */
  getDashboardStats: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await dashboardApi.getDmStats();
      }
    } catch {
      // Graceful zero fallback
    }
    return {
      district: '',
      totalMPs: 0,
      totalProjects: 0,
      totalEntitlement: 250000000,
      totalSanctioned: 0,
      totalUtilized: 0,
      pendingReview: 0,
      awaitingVerification: 0,
      waitingOver5Days: 0,
      activeProjects: 0,
      riskCounts: {
        Low: 0,
        Moderate: 0,
        High: 0,
        Critical: 0,
      },
    };
  }
};
