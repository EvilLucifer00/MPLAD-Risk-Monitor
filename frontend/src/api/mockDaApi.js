// src/api/mockDaApi.js
import {
  mockDaProfile,
  mockMPs,
  mockDaProjects,
  mockImplementingAgencies,
  mockVendors,
  mockDaNotifications,
  mockDaRecommendations,
} from '../data/mockDaData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const daApi = {
  // ── Profile ──
  getProfile: async () => {
    await delay(200);
    return { ...mockDaProfile };
  },

  // ── MPs ──
  getDistrictMPs: async () => {
    await delay(600);
    return mockMPs.map(mp => {
      const mpProjects = mockDaProjects.filter(p => p.mpId === mp.id);
      const activeProjects = mpProjects.filter(p => ['In Progress', 'Sanctioned'].includes(p.status));
      const totalSanctioned = mpProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
      const totalUtilized = mpProjects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
      const avgRisk = mpProjects.length > 0
        ? Math.round(mpProjects.reduce((acc, p) => acc + p.riskScore, 0) / mpProjects.length)
        : 0;
      const highCriticalCount = mpProjects.filter(p => ['High', 'Critical'].includes(p.riskLevel)).length;

      return {
        ...mp,
        totalProjects: mpProjects.length,
        activeProjects: activeProjects.length,
        totalSanctioned,
        totalUtilized,
        avgRiskScore: avgRisk,
        highCriticalCount,
      };
    });
  },

  getMPProjects: async (mpId) => {
    await delay(500);
    return mockDaProjects.filter(p => p.mpId === mpId).map(p => ({ ...p }));
  },

  // ── Projects ──
  getProjects: async (filters = {}) => {
    await delay(500);
    let results = [...mockDaProjects];

    if (filters.mpId) results = results.filter(p => p.mpId === filters.mpId);
    if (filters.riskLevel && filters.riskLevel !== 'All') results = results.filter(p => p.riskLevel === filters.riskLevel);
    if (filters.status && filters.status !== 'All') results = results.filter(p => p.status === filters.status);
    if (filters.reviewStatus && filters.reviewStatus !== 'All') results = results.filter(p => p.reviewStatus === filters.reviewStatus);
    if (filters.implementingAgency && filters.implementingAgency !== 'All') {
      results = results.filter(p => p.assignedImplementingAgency === filters.implementingAgency);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(s) ||
        p.mpName.toLowerCase().includes(s) ||
        p.vendor.toLowerCase().includes(s) ||
        (p.implementingAgency || '').toLowerCase().includes(s)
      );
    }

    return results;
  },

  getProjectById: async (id) => {
    await delay(400);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");
    return { ...project };
  },

  // ── Review Queue ──
  getReviewQueue: async (filters = {}) => {
    await delay(500);
    let results = mockDaProjects.filter(p => p.reviewStatus === 'Pending Review');

    if (filters.mpId && filters.mpId !== 'All') results = results.filter(p => p.mpId === filters.mpId);
    if (filters.riskLevel && filters.riskLevel !== 'All') results = results.filter(p => p.riskLevel === filters.riskLevel);
    if (filters.category && filters.category !== 'All') results = results.filter(p => p.category === filters.category);

    // Sort by risk score descending (highest first)
    results.sort((a, b) => b.riskScore - a.riskScore);

    return results.map(p => ({ ...p }));
  },

  // ── DA Actions ──
  sanctionProject: async (id, { implementingAgencyId, notes }) => {
    await delay(1000);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");

    const ia = mockImplementingAgencies.find(a => a.id === implementingAgencyId);
    project.reviewStatus = 'Sanctioned';
    project.status = 'Sanctioned';
    project.assignedImplementingAgency = implementingAgencyId;
    project.implementingAgency = ia?.name || 'Unknown';
    project.actionHistory.push({
      action: 'Sanctioned',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: notes || `Approved and sanctioned. IA: ${ia?.name || 'Unknown'} assigned.`,
    });
    return { ...project };
  },

  rejectProject: async (id, { reason, presetReasons = [] }) => {
    await delay(800);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");

    const fullReason = [
      ...presetReasons,
      reason,
    ].filter(Boolean).join('. ');

    project.reviewStatus = 'Rejected';
    project.status = 'Rejected';
    project.actionHistory.push({
      action: 'Rejected',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: fullReason,
    });
    return { ...project };
  },

  requestDocuments: async (id, { documents, message }) => {
    await delay(800);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");

    project.reviewStatus = 'Awaiting Verification';
    project.actionHistory.push({
      action: 'Request Additional Documents',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: `Documents requested: ${documents}. Message: ${message}`,
    });
    return { ...project };
  },

  suspendProject: async (id, { justification }) => {
    await delay(1200);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");

    project.reviewStatus = 'Suspended';
    project.status = 'Suspended — Under Investigation';
    project.actionHistory.push({
      action: 'Suspended — Under Investigation',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: justification,
    });
    return { ...project };
  },

  escalateProject: async (id, { notes }) => {
    await delay(800);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");

    project.reviewStatus = 'Escalated';
    project.actionHistory.push({
      action: 'Escalated',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: `Escalated to State Nodal Authority / Ministry. ${notes}`,
    });
    return { ...project };
  },

  quickApprove: async (id, { implementingAgencyId }) => {
    await delay(600);
    const project = mockDaProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");
    if (project.riskLevel !== 'Low') throw new Error("Quick approve only available for Low risk projects");

    const ia = mockImplementingAgencies.find(a => a.id === implementingAgencyId);
    project.reviewStatus = 'Sanctioned';
    project.status = 'Sanctioned';
    project.assignedImplementingAgency = implementingAgencyId;
    project.implementingAgency = ia?.name || 'Unknown';
    project.actionHistory.push({
      action: 'Quick Approved',
      actor: `${mockDaProfile.name} (DA)`,
      timestamp: new Date().toISOString(),
      reason: `Quick approval (Low risk). IA: ${ia?.name || 'Unknown'}.`,
    });
    return { ...project };
  },

  // ── Implementing Agencies ──
  getImplementingAgencies: async () => {
    await delay(400);
    return mockImplementingAgencies.map(ia => {
      const iaProjects = mockDaProjects.filter(p => p.assignedImplementingAgency === ia.id);
      return {
        ...ia,
        activeProjects: iaProjects.filter(p => ['In Progress', 'Sanctioned'].includes(p.status)).length,
        totalProjectsInDistrict: iaProjects.length,
      };
    });
  },

  // ── Vendors ──
  getVendors: async () => {
    await delay(400);
    return mockVendors.map(v => {
      const vendorProjects = mockDaProjects.filter(p => p.vendorId === v.id);
      return {
        ...v,
        projects: vendorProjects.map(p => ({ id: p.id, title: p.title, mpName: p.mpName, riskScore: p.riskScore })),
        projectsCount: vendorProjects.length,
        avgRiskScore: vendorProjects.length > 0
          ? Math.round(vendorProjects.reduce((acc, p) => acc + p.riskScore, 0) / vendorProjects.length)
          : v.avgRiskScore,
      };
    });
  },

  flagVendor: async (id, { notes }) => {
    await delay(500);
    const vendor = mockVendors.find(v => v.id === id);
    if (!vendor) throw new Error("Vendor not found");
    vendor.flagged = true;
    vendor.flagNotes = notes;
    return { ...vendor };
  },

  unflagVendor: async (id) => {
    await delay(500);
    const vendor = mockVendors.find(v => v.id === id);
    if (!vendor) throw new Error("Vendor not found");
    vendor.flagged = false;
    vendor.flagNotes = '';
    return { ...vendor };
  },

  // ── Notifications ──
  getNotifications: async () => {
    await delay(300);
    return [...mockDaNotifications];
  },

  markNotificationRead: async (id) => {
    await delay(200);
    const notif = mockDaNotifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return true;
  },

  // ── Recommendations ──
  getRecommendations: async () => {
    await delay(400);
    return [...mockDaRecommendations];
  },

  // ── Dashboard Stats ──
  getDashboardStats: async () => {
    await delay(600);
    const totalMPs = mockMPs.length;
    const totalProjects = mockDaProjects.length;
    const totalEntitlement = mockMPs.reduce((acc, mp) => acc + mp.totalEntitlement, 0);
    const totalSanctioned = mockDaProjects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
    const totalUtilized = mockDaProjects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
    const pendingReview = mockDaProjects.filter(p => p.reviewStatus === 'Pending Review').length;
    const awaitingVerification = mockDaProjects.filter(p => p.reviewStatus === 'Awaiting Verification').length;
    const activeProjects = mockDaProjects.filter(p => ['In Progress', 'Sanctioned'].includes(p.status)).length;

    const riskCounts = {
      Low: mockDaProjects.filter(p => p.riskLevel === 'Low').length,
      Moderate: mockDaProjects.filter(p => p.riskLevel === 'Moderate').length,
      High: mockDaProjects.filter(p => p.riskLevel === 'High').length,
      Critical: mockDaProjects.filter(p => p.riskLevel === 'Critical').length,
    };

    return {
      totalMPs,
      totalProjects,
      totalEntitlement,
      totalSanctioned,
      totalUtilized,
      pendingReview,
      awaitingVerification,
      activeProjects,
      riskCounts,
    };
  },

  // ── Report Generation ──
  generateReport: async () => {
    await delay(3000); // Simulate longer processing
    return {
      success: true,
      reportName: `District_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      message: 'District summary report generated successfully.',
    };
  },
};
