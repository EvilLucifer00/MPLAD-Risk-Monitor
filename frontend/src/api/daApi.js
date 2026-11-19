// src/api/daApi.js
import { projectsApi, dashboardApi, notificationsApi, documentsApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';
import { queryClient } from '../queryClient';
import { queryKeys } from './queryKeys';

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
  getDistrictMPs: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await projectsApi.getDistrictOverview('', options);
      }
    } catch {
      // Graceful fallback to empty array
    }
    return [];
  },

  getMPProjects: async (mpId, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const result = await projectsApi.getDistrictMpProjects(mpId, {}, options);
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
      const queue = await daApi.getReviewQueue(options);
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
  getProjects: async (filters = {}, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        // High-speed direct district query: single round-trip (no N+1 waterfall)
        try {
          const directProjects = await projectsApi.getDistrictAllProjects(filters, options);
          if (Array.isArray(directProjects)) {
            return directProjects;
          }
        } catch {
          // Graceful fallback to multi-MP collation if direct endpoint is unavailable
        }

        // Fetch all district MPs (check cache first)
        const user = useAuthStore.getState().user;
        const dist = user?.dist || user?.id;
        const cachedMps = queryClient.getQueryData(queryKeys.da.districtMps(dist));
        const mps = (Array.isArray(cachedMps) && cachedMps.length > 0) ? cachedMps : await projectsApi.getDistrictOverview('', options);
        if (!mps || mps.length === 0) return [];

        // Fetch projects asynchronously for each MP in the district
        const projectPromises = mps.map(async (mp) => {
          try {
            const res = await projectsApi.getDistrictMpProjects(mp.rawMpId || mp.id, filters, options);
            return (res.projects || []).map(p => ({
              ...p,
              mpId: p.mpId || String(mp.rawMpId || mp.id),
              mpName: p.mpName || mp.name,
              constituency: p.constituency || mp.constituency,
            }));
          } catch {
            return [];
          }
        });
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

  getProjectById: async (id, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const proj = await projectsApi.getProjectById(id, options);
        if (proj) return proj;
      }
    } catch {
      // Direct fetch error - try review queue fallback
    }

    try {
      const queue = await daApi.getReviewQueue(options);
      const match = queue.find(p => String(p.id) === String(id) || String(p.rawId) === String(id));
      if (match) return match;
    } catch {
      // Ignore
    }
    return null;
  },

  // ── Actions ──
  sanctionProject: async (id, { condition = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, status: 'Sanctioned', condition };
  },

  rejectProject: async (id, { rejectionReason = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, status: 'Rejected', rejectionReason };
  },

  requestDocuments: async (id, { requiredDocs = [] } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, requiredDocs };
  },

  suspendProject: async (id, { justification = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, status: 'Suspended', justification };
  },

  escalateProject: async (id, { notes = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, status: 'Escalated', notes };
  },

  quickApprove: async (id, { implementingAgencyId = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id, status: 'Sanctioned', implementingAgencyId };
  },

  getReviewQueue: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const mps = await projectsApi.getDistrictOverview('', options);
        if (!mps || mps.length === 0) return [];
        const projectPromises = mps.map(async (mp) => {
          const mpIdStr = String(mp.rawMpId || mp.id);
          try {
            const res = await projectsApi.getDistrictMpProjects(mpIdStr, { status: 'PENDING_REVIEW' }, options);
            let list = res.projects || [];
            if (list.length === 0) {
              const allRes = await projectsApi.getDistrictMpProjects(mpIdStr, {}, options);
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
  getImplementingAgencies: async (options = {}) => {
    try {
      const user = useAuthStore.getState().user;
      const dist = user?.dist || user?.id;
      const cachedProjects = queryClient.getQueryData(queryKeys.da.projects(dist, {}));
      const projects = (Array.isArray(cachedProjects) && cachedProjects.length > 0)
        ? cachedProjects
        : await daApi.getProjects({}, options);
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
  getVendors: async (options = {}) => {
    try {
      const user = useAuthStore.getState().user;
      const dist = user?.dist || user?.id;
      const cachedProjects = queryClient.getQueryData(queryKeys.da.projects(dist, {}));
      const projects = (Array.isArray(cachedProjects) && cachedProjects.length > 0)
        ? cachedProjects
        : await daApi.getProjects({}, options);
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

  flagVendor: async (id, { notes = '' } = {}, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { id, flagged: true, flagNotes: notes };
  },

  unflagVendor: async (id, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { id, flagged: false, flagNotes: '' };
  },

  // ── Notifications ──
  getNotifications: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.getDmNotifications(null, options);
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  markNotificationRead: async (id, isRead = true, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.markDmRead(id, isRead, options);
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  markAllNotificationsRead: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.markAllDmRead(options);
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  deleteNotification: async (id, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await notificationsApi.deleteDmNotification(id, options);
      }
    } catch {
      // Graceful fallback
    }
    return true;
  },

  // ── Recommendations ──
  getRecommendations: async (options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        const user = useAuthStore.getState().user;
        const dist = user?.dist || user?.id;
        const cachedStats = queryClient.getQueryData(queryKeys.da.stats(dist));
        const stats = cachedStats || await dashboardApi.getDmStats(options).catch(() => null);
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

  // ── Documents ──
  getDocuments: async (params = {}, options = {}) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        return await documentsApi.getDmDocuments(params, options);
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  // ── Dashboard Stats ──
  /**
   * Fetches district overview metrics from the real backend API.
   * Throws on error so React Query correctly handles retry and loading state,
   * avoiding rendering false/zero skeletons before real data arrives.
   */
  getDashboardStats: async (options = {}) => {
    const token = useAuthStore.getState().token;
    if (token) {
      return await dashboardApi.getDmStats(options);
    }
    throw new Error('Authentication required for District Dashboard metrics.');
  }
};
