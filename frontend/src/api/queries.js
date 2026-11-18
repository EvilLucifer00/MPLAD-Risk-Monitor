import { broadcastPortalEvent } from '../utils/portalSync';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from './mpApi';
import { daApi } from './daApi';
import { reportsApi, documentsApi, projectsApi } from './mpladsApi';
import { useAuthStore } from '../store/useAuthStore';
import { queryKeys } from './queryKeys';
import { CACHE_TIMES } from '../constants/cacheConfig';

// Re-export queryKeys for backwards-compatibility and direct consumer access
export { queryKeys };

// ── MP Portal Hooks ───────────────────────────────────────────

export const useMpStats = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.stats(user?.id),
    queryFn: ({ signal }) => api.getDashboardStats({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime,
    gcTime: CACHE_TIMES.FINANCIAL_STATUS.gcTime,
  });
};

export const useMpRecommendations = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.recommendations(user?.id),
    queryFn: ({ signal }) => api.getRecommendations({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useMpProjects = (filters = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.projects(user?.id, filters),
    queryFn: ({ signal }) => api.getProjects(filters, { signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useMpProjectDetail = (projectId) => {
  return useQuery({
    queryKey: queryKeys.mp.project(projectId),
    queryFn: ({ signal }) => api.getProjectById(projectId, { signal }),
    enabled: Boolean(projectId),
    staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime,
    gcTime: CACHE_TIMES.FINANCIAL_STATUS.gcTime,
  });
};

export const useMpReports = (year = null) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.reports(user?.id, year),
    queryFn: ({ signal }) => reportsApi.getSummary(year, { signal }),
    enabled: true,
    staleTime: CACHE_TIMES.DASHBOARD.staleTime,
    gcTime: CACHE_TIMES.DASHBOARD.gcTime,
  });
};

export const useMpDocuments = (params = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.documents(user?.id, params),
    queryFn: ({ signal }) => documentsApi.getMpDocuments(params, { signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useMpNotifications = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.mp.notifications(user?.id),
    queryFn: ({ signal }) => api.getNotifications(null, { signal }),
    enabled: true,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

// ── DA Portal Hooks ───────────────────────────────────────────

export const useDaStats = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.stats(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getDashboardStats({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime,
    gcTime: CACHE_TIMES.FINANCIAL_STATUS.gcTime,
  });
};

export const useDaRecommendations = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.recommendations(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getRecommendations({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaDistrictMps = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.districtMps(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getDistrictMPs({ signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaProjects = (filters = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.projects(user?.dist || user?.id, filters),
    queryFn: ({ signal }) => daApi.getProjects(filters, { signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaReviewQueue = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.reviewQueue(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getReviewQueue({ signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaMpProjects = (mpId) => {
  return useQuery({
    queryKey: queryKeys.da.mpProjects(mpId),
    queryFn: ({ signal }) => daApi.getMPProjects(mpId, { signal }),
    enabled: Boolean(mpId),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaProjectDetail = (projectId) => {
  return useQuery({
    queryKey: queryKeys.da.projectDetail(projectId),
    queryFn: ({ signal }) => daApi.getProjectById(projectId, { signal }),
    enabled: Boolean(projectId),
    staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime,
    gcTime: CACHE_TIMES.FINANCIAL_STATUS.gcTime,
  });
};

export const useDaDocuments = (params = {}) => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.documents(user?.dist || user?.id, params),
    queryFn: ({ signal }) => documentsApi.getDmDocuments(params, { signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaAgencies = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.agencies(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getImplementingAgencies({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.REFERENCE.staleTime,
    gcTime: CACHE_TIMES.REFERENCE.gcTime,
  });
};

export const useDaVendors = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.vendors(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getVendors({ signal }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

export const useDaNotifications = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.da.notifications(user?.dist || user?.id),
    queryFn: ({ signal }) => daApi.getNotifications({ signal }),
    enabled: true,
    staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
    gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
  });
};

// ── Geographic & Public Reference Hooks ─────────────────────────

export const useGeoData = () => {
  return useQuery({
    queryKey: queryKeys.geo.indiaConstituencies(),
    queryFn: async ({ signal }) => {
      const res = await fetch('/data/india_constituencies_simplified.geojson', { signal });
      if (!res.ok) {
        throw new Error(`Failed to load constituency boundaries (${res.status})`);
      }
      return res.json();
    },
    staleTime: CACHE_TIMES.MAP_GEO.staleTime,
    gcTime: CACHE_TIMES.MAP_GEO.gcTime,
  });
};

// ── Mutations (Safe In-Memory Workflow: Invalidate on Server Response) ──

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
    // No optimistic updates on statutory approvals/financials
    onSuccess: (data, variables) => {
      const dist = user?.dist || user?.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.da.reviewQueue(dist) });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.stats(dist) });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.projects(dist) });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.da.projectDetail(variables.id) });
      }
      // Cross-portal invalidation so MP sees approval state change
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.all });
      broadcastPortalEvent('PROJECT_REVIEWED', { id: variables.id, action: variables.action });
    },
    onSettled: (_data, _error, variables) => {
      const dist = user?.dist || user?.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.da.reviewQueue(dist) });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.stats(dist) });
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
    // No optimistic updates on project submission
    onSuccess: (data) => {
      const id = user?.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.projects(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.stats(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.reports(id) });
      // Invalidate DA review queue so district authority sees the new submission
      queryClient.invalidateQueries({ queryKey: queryKeys.da.all });
      broadcastPortalEvent('PROJECT_SUBMITTED', { id: data?.id });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mp.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.da.all });
    },
  });
};
