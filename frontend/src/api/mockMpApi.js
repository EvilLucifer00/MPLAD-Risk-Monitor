// src/api/mockMpApi.js
import { mockProjects, mockNotifications, mockRecommendations, mockMpProfile } from '../data/mockMpData';

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Projects
  getProjects: async () => {
    await delay();
    return [...mockProjects];
  },
  
  getProjectById: async (id) => {
    await delay();
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error("Project not found");
    return { ...project };
  },

  submitProject: async (projectData) => {
    await delay(1000);
    const newProject = {
      ...projectData,
      id: `PRJ-2026-${String(mockProjects.length + 1).padStart(3, '0')}`,
      status: "Pending Sanction",
      riskScore: 0,
      riskLevel: "Low",
      riskFactors: [],
      documents: projectData.documents || [],
      amountSpent: 0,
    };
    mockProjects.unshift(newProject);
    return newProject;
  },

  // Notifications
  getNotifications: async () => {
    await delay(300);
    return [...mockNotifications];
  },

  markNotificationRead: async (id) => {
    await delay(200);
    const notif = mockNotifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return true;
  },

  // Recommendations
  getRecommendations: async () => {
    await delay(400);
    const totalUtilized = mockProjects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
    const unspentPercentage = Math.round(((mockMpProfile.totalEntitlement - totalUtilized) / mockMpProfile.totalEntitlement) * 100);
    
    return mockRecommendations.map(rec => {
      if (rec.type === "Utilization Warning") {
        return {
          ...rec,
          message: `Your unspent balance is ${unspentPercentage}% with 2 months left in the fiscal year. Consider expediting pending proposals.`
        };
      }
      return rec;
    });
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    await delay(600);
    
    const activeProjects = mockProjects.filter(p => ["In Progress", "Sanctioned"].includes(p.status)).length;
    const totalEntitlement = mockMpProfile.totalEntitlement;
    const totalUtilized = mockProjects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
    const pendingApprovals = mockProjects.filter(p => p.status === "Pending Sanction").length;
    
    const riskCounts = {
      Low: mockProjects.filter(p => p.riskLevel === "Low").length,
      Moderate: mockProjects.filter(p => p.riskLevel === "Moderate").length,
      High: mockProjects.filter(p => p.riskLevel === "High").length,
      Critical: mockProjects.filter(p => p.riskLevel === "Critical").length,
    };

    return {
      activeProjects,
      totalEntitlement,
      totalUtilized,
      pendingApprovals,
      riskCounts
    };
  }
};
