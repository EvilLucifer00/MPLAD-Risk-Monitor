/**
 * Query Key Factory for MPLADS React Query In-Memory Caching.
 * 
 * Multi-Tenant Government Portal Isolation:
 * Deterministic query keys scoped by role, user ID, and jurisdiction (constituency/district).
 * This ensures that cache segmentation prevents one official's data from being served
 * to another official, while maintaining deterministic cache lookup and invalidation.
 */

function resolveId(userOrId, fallback = 'me') {
  if (!userOrId) return fallback;
  if (typeof userOrId === 'string' || typeof userOrId === 'number') {
    return String(userOrId);
  }
  return String(userOrId.id || userOrId.rawMpId || userOrId.username || userOrId.dist || fallback);
}

function resolveDist(userOrDist, fallback = 'me') {
  if (!userOrDist) return fallback;
  if (typeof userOrDist === 'string' || typeof userOrDist === 'number') {
    return String(userOrDist);
  }
  return String(userOrDist.dist || userOrDist.district || userOrDist.id || userOrDist.username || fallback);
}

export const queryKeys = {
  // ── MP Portal Scope ─────────────────────────────────────────
  mp: {
    all: ['mp'],
    stats: (id) => ['mp', 'stats', resolveId(id)],
    recommendations: (id) => ['mp', 'recommendations', resolveId(id)],
    projects: (id, filters = {}) => ['mp', 'projects', resolveId(id), filters || {}],
    project: (projectId) => ['mp', 'project', String(projectId)],
    reports: (id, year = 'all') => ['mp', 'reports', resolveId(id), String(year || 'all')],
    documents: (id, params = {}) => ['mp', 'documents', resolveId(id), params || {}],
    notifications: (id) => ['mp', 'notifications', resolveId(id)],
  },

  // ── District Authority (DA / DM) Scope ──────────────────────
  da: {
    all: ['da'],
    stats: (dist) => ['da', 'stats', resolveDist(dist)],
    recommendations: (dist) => ['da', 'recommendations', resolveDist(dist)],
    districtMps: (dist) => ['da', 'districtMps', resolveDist(dist)],
    projects: (dist, filters = {}) => ['da', 'projects', resolveDist(dist), filters || {}],
    reviewQueue: (dist) => ['da', 'reviewQueue', resolveDist(dist)],
    mpProjects: (mpId) => ['da', 'mpProjects', String(mpId)],
    projectDetail: (projectId) => ['da', 'projectDetail', String(projectId)],
    documents: (dist, params = {}) => ['da', 'documents', resolveDist(dist), params || {}],
    agencies: (dist) => ['da', 'agencies', resolveDist(dist)],
    vendors: (dist) => ['da', 'vendors', resolveDist(dist)],
    notifications: (dist) => ['da', 'notifications', resolveDist(dist)],
  },

  // ── Reference Data (Agencies, Categories, Vendors) ──────────
  reference: {
    agencies: (dist) => ['reference', 'agencies', resolveDist(dist, 'all')],
    vendors: (dist) => ['reference', 'vendors', resolveDist(dist, 'all')],
    categories: () => ['reference', 'categories'],
  },

  // ── Public & Static Reference ──────────────────────────────
  geo: {
    indiaConstituencies: () => ['geo', 'indiaConstituenciesSimplified'],
  },
};
