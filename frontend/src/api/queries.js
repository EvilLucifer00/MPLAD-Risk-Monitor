import { broadcastPortalEvent } from '../utils/portalSync';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './mpApi';
import { daApi } from './daApi';
import { reportsApi, documentsApi, projectsApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';

// ── Query Keys Factory ─────────────────────────────────────────
export const queryKeys = {
  mp: {
    all: ['mp'],
    stats: (id) => ['mp', 'stats', id || 'me'],
    recommendations: (id) => ['mp', 'recommendations', id || 'me'],
    projects: (id, filters) => ['mp', 'projects', id || 'me', filters || {}],
    project: (projectId) => ['mp', 'project', String(projectId)],
    reports: (id, year) => ['mp', 'reports', id || 'me', year || 'all'],
    documents: (id, params) => ['mp', 'documents', id || 'me', params || {}],
    notifications: (id) => ['mp', 'notifications', id || 'me'],
  },
  da: {
    all: ['da'],
    stats: (dist) => ['da', 'stats', dist || 'me'],
    recommendations: (dist) => ['da', 'recommendations', dist || 'me'],
    districtMps: (dist) => ['da', 'districtMps', dist || 'me'],
    projects: (dist, filters) => ['da', 'projects', dist || 'me', filters || {}],
    reviewQueue: (dist) => ['da', 'reviewQueue', dist || 'me'],
    mpProjects: (mpId) => ['da', 'mpProjects', String(mpId)],
    projectDetail: (projectId) => ['da', 'projectDetail', String(projectId)],
    documents: (dist, params) => ['da', 'documents', dist || 'me', params || {}],
    agencies: (dist) => ['da', 'agencies', dist || 'me'],
    vendors: (dist) => ['da', 'vendors', dist || 'me'],
    notifications: (dist) => ['da', 'notifications', dist || 'me'],
  },
};

// ── MP Portal Hooks ───────────────────────────────────────────

export const useMpStats = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.stats(user?.id),
    queryFn: () => api.getDashboardStats(),
    enabled: true,
  });
};

export const useMpRecommendations = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.recommendations(user?.id),
    queryFn: () => api.getRecommendations(),
    enabled: true,
  });
};

export const useMpProjects = (filters = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.projects(user?.id, filters),
    queryFn: () => api.getProjects(filters),
    enabled: true,
  });
};

export const useMpProjectDetail = (projectId) => {
  return useQuery({
    queryKey: queryKeys.mp.project(projectId),
    queryFn: () => api.getProjectById(projectId),
    enabled: Boolean(projectId),
  });
};

export const useMpReports = (year = null) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.reports(user?.id, year),
    queryFn: () => reportsApi.getSummary(year),
    enabled: true,
  });
};

export const useMpDocuments = (params = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.documents(user?.id, params),
    queryFn: () => documentsApi.getMpDocuments(params),
    enabled: true,
  });
};

export const useMpNotifications = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.notifications(user?.id),
    queryFn: () => api.getNotifications(),
    enabled: true,
  });
};

// ── DA Portal Hooks ───────────────────────────────────────────

export const useDaStats = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.stats(user?.dist),
    queryFn: () => daApi.getDashboardStats(),
    enabled: true,
  });
};

export const useDaRecommendations = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.recommendations(user?.dist),
    queryFn: () => daApi.getRecommendations(),
    enabled: true,
  });
};

export const useDaDistrictMps = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.districtMps(user?.dist),
    queryFn: () => daApi.getDistrictMPs(),
    enabled: true,
  });
};

export const useDaProjects = (filters = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.projects(user?.dist, filters),
    queryFn: () => daApi.getProjects(filters),
    enabled: true,
  });
};

export const useDaReviewQueue = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.reviewQueue(user?.dist),
    queryFn: () => daApi.getReviewQueue(),
    enabled: true,
  });
};

export const useDaMpProjects = (mpId) => {
  return useQuery({
    queryKey: queryKeys.da.mpProjects(mpId),
    queryFn: () => daApi.getMPProjects(mpId),
    enabled: Boolean(mpId),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useDaProjectDetail = (projectId) => {
  return useQuery({
    queryKey: queryKeys.da.projectDetail(projectId),
    queryFn: () => daApi.getProjectById(projectId),
    enabled: Boolean(projectId),
  });
};

export const useDaDocuments = (params = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.documents(user?.dist, params),
    queryFn: () => documentsApi.getDmDocuments(params),
    enabled: true,
  });
};

export const useDaAgencies = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.agencies(user?.dist),
    queryFn: () => daApi.getImplementingAgencies(),
    enabled: true,
  });
};

export const useDaVendors = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.vendors(user?.dist),
    queryFn: () => daApi.getVendors(),
    enabled: true,
  });
};

export const useDaNotifications = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.notifications(user?.dist),
    queryFn: () => daApi.getNotifications(),
    enabled: true,
  });
};

export const useDaReviewActionMutation = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ id, action, details = {} }) => {
      if (action === 'Sanction') {
        return daApi.sanctionProject(id, details);
      } else if (action === 'Reject') {
        return daApi.rejectProject(id, details);
      } else if (action === 'Request Documents') {
        return daApi.requestDocuments(id, details);
      } else if (action === 'Suspend') {
        return daApi.suspendProject(id, details);
      } else if (action === 'Escalate') {
        return daApi.escalateProject(id, details);
      }
      return daApi.reviewProject(id, action, details);
    },
    onMutate: async ({ id, action, details }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.da.reviewQueue(user?.dist) });
      await queryClient.cancelQueries({ queryKey: queryKeys.da.stats(user?.dist) });
      if (id) {
        await queryClient.cancelQueries({ queryKey: queryKeys.da.projectDetail(id) });
      }

      const previousQueue = queryClient.getQueryData(queryKeys.da.reviewQueue(user?.dist));
      const previousStats = queryClient.getQueryData(queryKeys.da.stats(user?.dist));
      const previousDetail = id ? queryClient.getQueryData(queryKeys.da.projectDetail(id)) : null;

      // Optimistically remove from queue if approved or rejected
      if (['Sanction', 'Reject', 'Approve'].includes(action)) {
        queryClient.setQueryData(queryKeys.da.reviewQueue(user?.dist), (old = []) =>
          Array.isArray(old) ? old.filter((p) => p.id !== id && p.rawId !== id) : []
        );
      }

      // Optimistically update project detail status if present in cache
      if (id && previousDetail) {
        const nextStatus = action === 'Sanction' ? 'Sanctioned' : action === 'Reject' ? 'Rejected' : action === 'Suspend' ? 'Suspended' : previousDetail.status;
        const nextReviewStatus = action === 'Sanction' ? 'Sanctioned' : action === 'Reject' ? 'Rejected' : action === 'Request Documents' ? 'Awaiting Verification' : action === 'Suspend' ? 'Suspended' : action === 'Escalate' ? 'Escalated' : previousDetail.reviewStatus;
        queryClient.setQueryData(queryKeys.da.projectDetail(id), {
          ...previousDetail,
          status: nextStatus,
          reviewStatus: nextReviewStatus,
          implementingAgency: details?.implementingAgencyId || previousDetail.implementingAgency,
        });
      }

      return { previousQueue, previousStats, previousDetail, id };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueue) {
        queryClient.setQueryData(queryKeys.da.reviewQueue(user?.dist), context.previousQueue);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.da.stats(user?.dist), context.previousStats);
      }
      if (context?.id && context?.previousDetail) {
        queryClient.setQueryData(queryKeys.da.projectDetail(context.id), context.previousDetail);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.da.reviewQueue(user?.dist) });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.stats(user?.dist) });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.projects(user?.dist) });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.da.projectDetail(variables.id) });
      }
    },
  });
};

export const useMpSubmitProjectMutation = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (projectData) => {
      return projectsApi.submitProject(projectData);
    },
    onMutate: async (newProjectData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mp.projects(user?.id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.mp.stats(user?.id) });

      const previousProjects = queryClient.getQueryData(queryKeys.mp.projects(user?.id));
      const previousStats = queryClient.getQueryData(queryKeys.mp.stats(user?.id));

      const optimisticProject = {
        id: `PRJ-TEMP-${Date.now()}`,
        title: newProjectData.title,
        category: newProjectData.category,
        estimatedCost: Number(newProjectData.estimatedCost) || 0,
        sanctionedAmount: 0,
        amountSpent: 0,
        status: 'Pending Sanction',
        reviewStatus: 'Pending Review',
        riskLevel: 'Low',
        riskScore: 0,
        district: user?.dist || '',
        implementingAgency: newProjectData.implementingAgency || 'Pending Assignment',
        startDate: new Date().toISOString().split('T')[0],
        documents: [],
      };

      if (previousProjects && Array.isArray(previousProjects)) {
        queryClient.setQueryData(queryKeys.mp.projects(user?.id), [optimisticProject, ...previousProjects]);
      }

      return { previousProjects, previousStats };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.mp.projects(user?.id), context.previousProjects);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.mp.stats(user?.id), context.previousStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.all });
    },
  });
};
