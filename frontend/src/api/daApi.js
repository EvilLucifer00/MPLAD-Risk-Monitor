// src/api/daApi.js
import { projectsApi, dashboardApi, notificationsApi } from './mpladsApi';
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
        let projects = result?.projects || [];
        if (projects.length > 0) {
          projects.mpDetails = result.mpDetails || {};
          projects.stats = result.stats || {};
          return projects;
        }
      }
    } catch {
      // Direct fetch failed - proceed to review queue fallback
    }

    // Fallback: check review queue for this MP's projects
    try {
      const queue = await daApi.getReviewQueue();
      const mpQueue = (queue || []).filter(p => String(p.mpId) === String(mpId) || String(p.rawMpId) === String(mpId));
      if (mpQueue.length > 0) {
        const fallbackProjects = [...mpQueue];
        fallbackProjects.mpDetails = {
          mp_id: mpId,
          mp_name: mpQueue[0].mpName,
          constituency: mpQueue[0].constituency,
          total_projects: mpQueue.length,
        };
        fallbackProjects.stats = {
          active_projects: mpQueue.filter(p => ['Sanctioned', 'In Progress', 'APPROVED', 'IN_PROGRESS'].includes(p.status)).length,
          sanctioned_amount_cr: 0,
          utilized_amount_cr: 0,
          avg_risk_score: Math.round(mpQueue.reduce((acc, p) => acc + (p.riskScore || 0), 0) / mpQueue.length),
        };
        return fallbackProjects;
      }
    } catch {
      // Ignore
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
            .then(res => (res.projects || []).map(p => ({
              ...p,
              mpId: p.mpId || String(mp.rawMpId || mp.id),
              mpName: p.mpName || mp.name,
              constituency: p.constituency || mp.constituency,
            })))
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
        const proj = await projectsApi.getProjectById(id);
        if (proj) return proj;
      }
    } catch {
      // Direct fetch error - try review queue fallback
    }

    try {
      const queue = await daApi.getReviewQueue();
      const match = queue.find(p => String(p.id) === String(id) || String(p.rawId) === String(id));
      if (match) return match;
    } catch {
      // Ignore
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
        const projectPromises = mps.map(async (mp) => {
          const mpIdStr = String(mp.rawMpId || mp.id);
          try {
            const res = await projectsApi.getDistrictMpProjects(mpIdStr, { status: 'PENDING_REVIEW' });
            let list = res.projects || [];
            if (list.length === 0) {
              const allRes = await projectsApi.getDistrictMpProjects(mpIdStr);
              list = (allRes.projects || []).filter(p => 
                p.status === 'Pending Sanction' || 
                p.reviewStatus === 'Pending Review' || 
                p.status === 'Pending Review' ||
                p.status === 'SUBMITTED'
              );
            }
            return list.map(p => ({
              ...p,
              mpId: p.mpId || mpIdStr,
              mpName: p.mpName || mp.name,
              constituency: p.constituency || mp.constituency,
            }));
          } catch {
            return [];
          }
        });
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
    try {
      const projects = await daApi.getProjects();
      const iaMap = new Map();
      (projects || []).forEach(p => {
        const name = p.implementingAgency || p.implementing_agency;
        if (!name || name === 'TBD' || name === 'None' || name === 'null') return;
        if (!iaMap.has(name)) {
          iaMap.set(name, {
            id: `IA-${name.replace(/\s+/g, '-').toUpperCase()}`,
            name,
            status: 'Active',
            projectsHandled: 0,
            activeProjects: 0,
            totalRisk: 0,
            riskCount: 0,
          });
        }
        const ia = iaMap.get(name);
        ia.projectsHandled += 1;
        if (['In Progress', 'Sanctioned', 'APPROVED', 'IN_PROGRESS'].includes(p.status)) {
          ia.activeProjects += 1;
        }
        if (p.riskScore != null) {
          ia.totalRisk += Number(p.riskScore);
          ia.riskCount += 1;
        }
      });
      return Array.from(iaMap.values()).map(ia => ({
        ...ia,
        avgRiskScore: ia.riskCount > 0 ? Math.round(ia.totalRisk / ia.riskCount) : 0,
      }));
    } catch {
      return [];
    }
  },

  // ── Vendors ──
  getVendors: async () => {
    try {
      const projects = await daApi.getProjects();
      const vendorMap = new Map();
      (projects || []).forEach(p => {
        const name = p.vendor;
        if (!name || name === 'TBD' || name === 'None' || name === 'null') return;
        if (!vendorMap.has(name)) {
          vendorMap.set(name, {
            id: `VEN-${name.replace(/\s+/g, '-').toUpperCase()}`,
            name,
            pan: p.vendorPan || 'N/A',
            activeProjects: 0,
            totalProjects: 0,
            totalContractCr: 0,
            avgRiskScore: 0,
            totalRisk: 0,
            flagged: false,
            flagNotes: '',
          });
        }
        const v = vendorMap.get(name);
        v.totalProjects += 1;
        if (['In Progress', 'Sanctioned', 'APPROVED', 'IN_PROGRESS'].includes(p.status)) {
          v.activeProjects += 1;
        }
        v.totalContractCr += (Number(p.sanctionedAmount || p.amountSpent || 0) / 1e7);
        if (p.riskScore != null) {
          v.totalRisk += Number(p.riskScore);
        }
      });
      return Array.from(vendorMap.values()).map(v => ({
        ...v,
        totalContractCr: Number(v.totalContractCr.toFixed(2)),
        avgRiskScore: v.totalProjects > 0 ? Math.round(v.totalRisk / v.totalProjects) : 0,
      }));
    } catch {
      return [];
    }
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
