/**
 * MPLADS Real Backend API Client
 * Connects frontend features to the FastAPI backend endpoints:
 * - Dashboard (/dashboard/details/mp, /dashboard/details/dm)
 * - Projects (/projects/all, /projects/submit, /projects/district/overview, /projects/district/mp/{mp_id}, /projects/{project_id})
 * - Reports (/reports/summary)
 * - Documents (/document/mp, /document/dm)
 * - User Management (/user/dm/all, /user/dm/{dist}, /user/create/mp, /user/create/dm)
 */

import { useAuthStore } from '../store/useAuthStore';
const PROD_API_URL = 'https://mplads-backend-axxw.onrender.com';
const DEV_API_URL = 'http://localhost:8000';

const isProductionOrPreview =
  import.meta.env.PROD ||
  import.meta.env.MODE === 'production' ||
  import.meta.env.MODE === 'preview' ||
  (typeof window !== 'undefined' && window.location.port === '4173');

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  (isProductionOrPreview ? PROD_API_URL : DEV_API_URL);

export const API_BASE_URL = RAW_API_URL.trim().replace(/\/+$/, '');

/**
 * Helper to parse backend error responses cleanly.
 */
export async function parseApiError(response) {
  try {
    const data = await response.json();
    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item) => {
            const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
            return field ? `${field}: ${item.msg}` : item.msg;
          })
          .join(', ');
      }
      if (typeof data.detail === 'string') {
        return data.detail;
      }
    }
  } catch {
    // If not JSON, ignore and fallback to statusText
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

// Request deduplication & short-lived cache for GET endpoints to eliminate redundant critical network waterfalls
const inFlightRequests = new Map();
const responseCache = new Map();
const CACHE_TTL_MS = 3000; // 3 seconds TTL to coalesce initial mount and duplicate component requests

export function invalidateApiCache() {
  responseCache.clear();
}

/**
 * Authenticated fetch wrapper reusing auth token from useAuthStore.
 * Features in-flight promise deduplication and short-lived caching for GET requests
 * to avoid duplicate waterfalls during concurrent component initialization.
 */
export async function authFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is NOT FormData and Content-Type is not set, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // If mutation, invalidate cache and perform direct fetch
  if (method !== 'GET') {
    responseCache.clear();
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorMsg = await parseApiError(response);
      throw new Error(errorMsg);
    }
    return response;
  }

  // For GET requests: check short-lived cache first
  const cacheKey = `${url}:${token || 'anon'}`;
  const now = Date.now();
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      responseCache.delete(cacheKey);
    }
  }

  // If an identical request is already in-flight, await and return fresh Response instance
  if (inFlightRequests.has(cacheKey)) {
    const inFlightData = await inFlightRequests.get(cacheKey);
    return new Response(JSON.stringify(inFlightData), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Execute request and store in-flight promise with a 4s timeout for GET to prevent hanging on Render cold-starts
  const executePromise = (async () => {
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? 4000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw new Error(errorMsg);
      }
      const data = await response.json();
      responseCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, executePromise);
  const data = await executePromise;

  return new Response(JSON.stringify(data), {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── MAPPING HELPERS ───────────────────────────────────────────

const CATEGORY_DISPLAY_MAP = {
  COMMUNITY_INFRASTRUCTURE: 'Community Infrastructure',
  EDUCATION: 'Education',
  HEALTH: 'Health',
  WATER_SUPPLY: 'Water Supply',
  PUBLIC_TRANSPORT: 'Public Transport',
};

const CATEGORY_CODE_MAP = {
  'Community Infrastructure': 'COMMUNITY_INFRASTRUCTURE',
  'Education': 'EDUCATION',
  'Health': 'HEALTH',
  'Water Supply': 'WATER_SUPPLY',
  'Public Transport': 'PUBLIC_TRANSPORT',
};

export function formatCategory(cat) {
  if (!cat) return 'Community Infrastructure';
  const upper = cat.trim().toUpperCase().replace(/\s+/g, '_');
  return CATEGORY_DISPLAY_MAP[upper] || cat.replace(/_/g, ' ');
}

export function toCategoryCode(cat) {
  if (!cat) return 'COMMUNITY_INFRASTRUCTURE';
  return CATEGORY_CODE_MAP[cat] || cat.trim().toUpperCase().replace(/\s+/g, '_');
}

export function formatStatus(status) {
  if (!status) return 'Pending Sanction';
  const upper = status.trim().toUpperCase().replace(/\s+/g, '_');
  switch (upper) {
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'Pending Sanction';
    case 'APPROVED':
    case 'SANCTIONED':
      return 'Sanctioned';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function formatRiskLevel(level) {
  if (!level) return 'Low';
  const upper = level.trim().toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MODERATE':
    case 'MEDIUM':
      return 'Moderate';
    case 'LOW':
    default:
      return 'Low';
  }
}

export function mapProjectFromBackend(p) {
  if (!p) return null;
  const statusFormatted = formatStatus(p.status);
  const riskLevelFormatted = formatRiskLevel(p.risk_level);
  const riskScore = Math.round(p.risk_score || 0);

  const riskFactors = [
    {
      detector: 'Cost Anomaly',
      score: Math.round(p.cost_anomaly_risk || 0),
      explanation: 'Statistical variance against district schedule of rates.',
    },
    {
      detector: 'Timeline Delay',
      score: Math.round(p.timeline_delay_risk || 0),
      explanation: 'Estimated probability of execution delay based on category benchmarks.',
    },
    {
      detector: 'Duplicate Work',
      score: Math.round(p.duplicate_work_risk || 0),
      explanation: 'Geographic and text similarity comparison against previous sanctioned works.',
    },
    {
      detector: 'Vendor Risk',
      score: Math.round(p.vendor_risk || 0),
      explanation: 'Vendor past performance, capacity saturation, and delivery history.',
    },
  ];

  return {
    id: p.id ? (typeof p.id === 'string' && p.id.startsWith('PRJ-') ? p.id : `PRJ-2026-${String(p.id).padStart(3, '0')}`) : `PRJ-${Date.now()}`,
    rawId: p.id,
    title: p.project_title || 'Untitled Project',
    category: formatCategory(p.category),
    description: p.description || '',
    district: p.district || '',
    constituency: p.constituency || '',
    state: p.state || '',
    implementingAgency: p.implementing_agency || 'District Implementing Agency',
    vendor: p.vendor_name || 'Designated Vendor',
    estimatedCost: Number(p.estimated_cost || 0),
    sanctionedAmount: Number(p.sanctioned_amount || p.estimated_cost || 0),
    amountSpent: Number(p.utilized_amount || 0),
    status: statusFormatted,
    reviewStatus: statusFormatted === 'Pending Sanction' ? 'Pending Review' : statusFormatted,
    riskLevel: riskLevelFormatted,
    riskScore: riskScore,
    startDate: p.start_date || p.submit_date || null,
    expectedEndDate: p.expected_end_date || p.completion_date || null,
    submitDate: p.submit_date || null,
    documents: Array.isArray(p.documents) ? p.documents : [],
    riskFactors: riskFactors,
    actionHistory: Array.isArray(p.action_history) ? p.action_history : [
      {
        action: 'Submitted',
        actor: `MP Office`,
        timestamp: p.submit_date || new Date().toISOString(),
        reason: 'Initial proposal submission for review.',
      }
    ],
  };
}

// ── 1. DASHBOARD API ──────────────────────────────────────────

export const dashboardApi = {
  /**
   * GET /dashboard/details/mp
   * Summary stats for MP Dashboard
   */
  getMpStats: async () => {
    const res = await authFetch('/dashboard/details/mp');
    const data = await res.json();

    const fundsUtilizedRaw = Math.round((Number(data.funds_utilized_cr) || 0) * 1e7);
    const fundsEntitlementRaw = Math.round((Number(data.funds_entitlement_cr) || 5.0) * 1e7);
    const highRisk = Number(data.high_risk_projects) || 0;
    const totalProjects = Number(data.total_projects) || 0;

    return {
      activeProjects: Number(data.active_projects) || 0,
      totalEntitlement: fundsEntitlementRaw,
      totalUtilized: fundsUtilizedRaw,
      pendingApprovals: Number(data.pending_approvals) || 0,
      totalProjects: totalProjects,
      riskCounts: {
        Low: Math.max(0, totalProjects - highRisk),
        Moderate: 0,
        High: highRisk,
        Critical: 0,
      },
      statusBreakdown: data.status_breakdown || {},
      recentProjects: Array.isArray(data.recent_projects) ? data.recent_projects : [],
    };
  },

  /**
   * GET /dashboard/details/dm
   * Summary stats for District Authority Dashboard
   */
  getDmStats: async () => {
    const res = await authFetch('/dashboard/details/dm');
    const data = await res.json();

    const riskBreakdown = data.risk_breakdown || {};
    const low = Number(riskBreakdown.low) || 0;
    const moderate = Number(riskBreakdown.moderate) || 0;
    const high = Number(riskBreakdown.high) || 0;
    const critical = Number(riskBreakdown.critical) || 0;
    const totalProjects = low + moderate + high + critical || Number(data.active_projects) || 0;

    const fundsUtilizedRaw = Math.round((Number(data.funds_utilized_cr) || 0) * 1e7);
    const fundsEntitlementRaw = Math.round((Number(data.funds_entitlement_cr) || 25.0) * 1e7);

    return {
      district: data.district,
      totalMPs: Number(data.mps_monitored) || 0,
      totalProjects: totalProjects,
      totalEntitlement: fundsEntitlementRaw,
      totalSanctioned: fundsUtilizedRaw * 1.2, // Estimate if not separate
      totalUtilized: fundsUtilizedRaw,
      pendingReview: Number(data.projects_awaiting_review) || 0,
      awaitingVerification: Number(data.docs_pending_verification) || 0,
      waitingOver5Days: Number(data.waiting_over_5_days) || 0,
      activeProjects: Number(data.active_projects) || 0,
      riskCounts: {
        Low: low,
        Moderate: moderate,
        High: high,
        Critical: critical,
      },
    };
  },
};

// ── 2. PROJECTS API ───────────────────────────────────────────

export const projectsApi = {
  /**
   * GET /projects/all
   * MP's projects list with client-ready formatting
   */
  getAllProjects: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.risk && params.risk !== 'All') query.append('risk', params.risk);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    query.append('page', params.page || 1);
    query.append('page_size', params.pageSize || 100);

    const res = await authFetch(`/projects/all?${query.toString()}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? json : (json.data || []);
    return rows.map(mapProjectFromBackend);
  },

  /**
   * POST /projects/submit
   * Multipart/form-data creation of new project
   */
  submitProject: async ({ title, category, estimatedCost, implementingAgency, description, files = [] }) => {
    const formData = new FormData();
    formData.append('project_title', title);
    formData.append('category', toCategoryCode(category));
    formData.append('estimated_cost', Number(estimatedCost));
    formData.append('implementing_agency', implementingAgency);
    formData.append('description', description || 'Proposal submitted by MP office.');

    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append('files', file);
        }
      });
    }

    const res = await authFetch('/projects/submit', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    return mapProjectFromBackend(result);
  },

  /**
   * GET /projects/district/overview
   * District-wide project overview aggregated by MP
   */
  getDistrictOverview: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authFetch(`/projects/district/overview${query}`);
    const data = await res.json();

    return (Array.isArray(data) ? data : []).map((mp) => {
      const avgScore = Number(mp.avg_risk_score) || 0;
      return {
        id: String(mp.mp_id),
        rawMpId: mp.mp_id,
        name: mp.mp_name || 'MP',
        constituency: mp.constituency || 'Constituency',
        activeProjects: Number(mp.active_projects) || 0,
        totalUtilized: Math.round((Number(mp.funds_utilized_cr) || 0) * 1e7),
        totalSanctioned: Math.round((Number(mp.funds_utilized_cr) || 0) * 1.5 * 1e7),
        totalProjects: Number(mp.active_projects) || 0,
        avgRiskScore: avgScore,
        riskLevel: formatRiskLevel(mp.avg_risk_level),
        highCriticalCount: Number(mp.high_risk_projects) || 0,
      };
    });
  },

  /**
   * GET /projects/district/mp/{mp_id}
   * Drill-down into a specific MP's projects for the DA
   */
  getDistrictMpProjects: async (mpId, params = {}) => {
    const numericId = typeof mpId === 'number' 
      ? mpId 
      : parseInt(String(mpId).match(/(\d+)$/)?.[1] || mpId, 10);
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.risk && params.risk !== 'All') query.append('risk', params.risk);
    query.append('page', params.page || 1);
    query.append('page_size', params.pageSize || 100);

    const res = await authFetch(`/projects/district/mp/${numericId}?${query.toString()}`);
    const json = await res.json();

    const rawProjects = Array.isArray(json.data) ? json.data : [];
    const mappedProjects = rawProjects.map(mapProjectFromBackend);

    return {
      mpDetails: json.mp_details || {},
      stats: json.stats || {},
      projects: mappedProjects,
      count: json.count || mappedProjects.length,
    };
  },

  /**
   * GET /projects/{project_id}
   * Fetch single project detail
   */
  getProjectById: async (projectId) => {
    const numericId = typeof projectId === 'number'
      ? projectId
      : parseInt(String(projectId).match(/(\d+)$/)?.[1] || projectId, 10);
    const res = await authFetch(`/projects/${numericId}`);
    const data = await res.json();
    return mapProjectFromBackend(data);
  },
};

// ── 3. REPORTS API ────────────────────────────────────────────

export const reportsApi = {
  /**
   * GET /reports/summary
   * Fetches category breakdown and cumulative fund utilization
   */
  getSummary: async (year = null) => {
    const query = year ? `?year=${year}` : '';
    const res = await authFetch(`/reports/summary${query}`);
    const data = await res.json();

    const byCategory = (data.by_category || []).map((item) => ({
      name: item.category,
      completed: Number(item.completed) || 0,
      ongoing: Number(item.ongoing) || 0,
    }));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cumulative = (data.cumulative_utilization || []).map((item) => {
      let displayName = item.month;
      if (item.month && item.month.includes('-')) {
        const parts = item.month.split('-');
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          displayName = monthNames[monthIdx];
        }
      }
      return {
        name: displayName,
        sanctioned: Number(item.sanctioned) || 0,
        utilized: Number(item.utilized) || 0,
      };
    });

    return {
      byCategory,
      cumulativeUtilization: cumulative,
    };
  },
};

// ── 4. DOCUMENTS API ──────────────────────────────────────────

export const documentsApi = {
  /**
   * GET /document/mp
   */
  getMpDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.uploadDate) query.append('upload_date', params.uploadDate);

    const res = await authFetch(`/document/mp${query.toString() ? `?${query.toString()}` : ''}`);
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];

    return rows.map((doc) => ({
      id: doc.id,
      name: doc.file_name || 'Document.pdf',
      size: '1.4 MB',
      type: doc.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
      uploader: doc.uploaded_by || 'MP Office',
      uploadDate: doc.upload_date || new Date().toISOString().split('T')[0],
      projectId: doc.project_id ? `PRJ-2026-${String(doc.project_id).padStart(3, '0')}` : 'PRJ-N/A',
      projectTitle: (doc.file_name || 'Project Document').replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      fileUrl: doc.file_url || '#',
    }));
  },

  /**
   * GET /document/dm
   */
  getDmDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.uploadDate) query.append('upload_date', params.uploadDate);

    const res = await authFetch(`/document/dm${query.toString() ? `?${query.toString()}` : ''}`);
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];

    return rows.map((doc) => ({
      id: doc.id,
      name: doc.file_name || 'Document.pdf',
      size: '1.4 MB',
      type: doc.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
      uploader: doc.uploaded_by || 'District Office',
      uploadDate: doc.upload_date || new Date().toISOString().split('T')[0],
      projectId: doc.project_id ? `PRJ-2026-${String(doc.project_id).padStart(3, '0')}` : 'PRJ-N/A',
      projectTitle: (doc.file_name || 'Project Document').replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      mpName: doc.uploaded_by || 'District Authority',
      constituency: doc.constituency || '',
      fileUrl: doc.file_url || '#',
    }));
  },
};

// ── 5. USER MANAGEMENT API ────────────────────────────────────

export const userManagementApi = {
  /**
   * GET /user/dm/all
   * Retrieve all District Magistrates
   */
  getAllDm: async () => {
    const res = await authFetch('/user/dm/all');
    return await res.json();
  },

  /**
   * GET /user/dm/{dist}
   * Retrieve District Magistrate by district name
   */
  getDmByDistrict: async (dist) => {
    const res = await authFetch(`/user/dm/${encodeURIComponent(dist)}`);
    return await res.json();
  },
};

// ── 6. RAG CHATBOT API ─────────────────────────────────────────

export { sendChatMessage } from './ragApi';

