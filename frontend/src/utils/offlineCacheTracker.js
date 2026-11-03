/**
 * Offline Route & Cache Tracker for MPLADS Portal
 * Tracks which routes, code chunks, and query caches are available offline.
 * Enables automatic background preloading when online and informs UI navigation
 * to disable clicks to uncached routes when offline.
 */

const CACHED_ROUTES_STORAGE_KEY = 'mplads_cached_routes';

// In-memory set of cached route patterns
let cachedRoutesSet = new Set();

// Initialize from sessionStorage if available
if (typeof window !== 'undefined') {
  try {
    const stored = sessionStorage.getItem(CACHED_ROUTES_STORAGE_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        arr.forEach(r => cachedRoutesSet.add(r));
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Always mark the initial landing route as cached
  if (window.location && window.location.pathname) {
    cachedRoutesSet.add(window.location.pathname.replace(/\/+$/, '') || '/');
  }
}

function persistCachedRoutes() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      CACHED_ROUTES_STORAGE_KEY,
      JSON.stringify(Array.from(cachedRoutesSet))
    );
  } catch {
    // Storage full or private mode safeguard
  }
}

/**
 * Dispatch an event to notify that an uncached route was blocked while offline.
 * @param {string} path
 */
export function notifyOfflineBlocked(path) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mplads:offline-blocked', { detail: { path } }));
  }
}

/**
 * Mark a specific route path as cached and available offline.
 * @param {string} routePath - e.g. '/da/projects', '/mp', '/da/review'
 */
export function markRouteAsCached(routePath) {
  if (!routePath) return;
  const normalized = routePath.split('?')[0].replace(/\/+$/, '') || '/';
  if (!cachedRoutesSet.has(normalized)) {
    cachedRoutesSet.add(normalized);
    persistCachedRoutes();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mplads:cache-updated', { detail: { path: normalized } }));
    }
  }
}

/**
 * Checks whether a given route is cached and safe to navigate to offline.
 * @param {string} routePath - Target URL or route path
 * @returns {boolean}
 */
export function isRouteCached(routePath) {
  if (!routePath) return true;
  // If user is online, all routes are accessible
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    return true;
  }

  const normalized = routePath.split('?')[0].replace(/\/+$/, '') || '/';

  // Current page is always considered cached
  if (typeof window !== 'undefined') {
    const currentNorm = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    if (currentNorm === normalized) {
      return true;
    }
  }

  // Direct match in cached routes set
  if (cachedRoutesSet.has(normalized)) {
    return true;
  }

  // Check for dynamic project or review routes: require data in query cache
  const idMatch = normalized.match(/(?:projects|review)(?:\/mp)?\/([^/]+)/);
  if (idMatch) {
    if (typeof window !== 'undefined') {
      try {
        const queryCacheStr = sessionStorage.getItem('mplads_query_cache');
        if (queryCacheStr && queryCacheStr.includes(idMatch[1])) {
          return true;
        }
      } catch {
        // Fall through
      }
    }
    // Dynamic page not explicitly cached and not in query data
    return false;
  }

  // Check if static section route is registered
  for (const cached of cachedRoutesSet) {
    if (cached === normalized) return true;
  }

  return false;
}

/**
 * Returns all currently cached routes.
 */
export function getCachedRoutes() {
  return Array.from(cachedRoutesSet);
}

/**
 * Preload all portal route chunks in the background while online.
 * Runs non-blocking after initial page mount to ensure all routes
 * become cached for subsequent offline use.
 * @param {'MP' | 'DM'} role
 */
export function preloadPortalRoutes(role) {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const preloadRoutes = async () => {
    try {
      if (role === 'DM') {
        const daImports = [
          { path: '/da', loader: () => import('../pages/da/DaDashboard.jsx') },
          { path: '/da/projects', loader: () => import('../pages/da/DaProjects.jsx') },
          { path: '/da/projects/mp', loader: () => import('../pages/da/DaMPDetail.jsx') },
          { path: '/da/review', loader: () => import('../pages/da/DaProjectReview.jsx') },
          { path: '/da/review/detail', loader: () => import('../pages/da/DaReviewDetail.jsx') },
          { path: '/da/documents', loader: () => import('../pages/da/DaDocuments.jsx') },
          { path: '/da/notifications', loader: () => import('../pages/da/DaNotifications.jsx') },
          { path: '/da/agencies', loader: () => import('../pages/da/DaIADirectory.jsx') },
          { path: '/da/vendors', loader: () => import('../pages/da/DaVendorWatchlist.jsx') },
          { path: '/da/settings', loader: () => import('../pages/da/DaSettings.jsx') },
        ];

        for (const item of daImports) {
          try {
            await item.loader();
            markRouteAsCached(item.path);
          } catch {
            // Ignore individual prefetch errors
          }
        }
      } else if (role === 'MP') {
        const mpImports = [
          { path: '/mp', loader: () => import('../pages/mp/MpDashboard.jsx') },
          { path: '/mp/projects', loader: () => import('../pages/mp/MpProjects.jsx') },
          { path: '/mp/projects/detail', loader: () => import('../pages/mp/MpProjectDetail.jsx') },
          { path: '/mp/submit', loader: () => import('../pages/mp/MpSubmitProject.jsx') },
          { path: '/mp/reports', loader: () => import('../pages/mp/MpReports.jsx') },
          { path: '/mp/documents', loader: () => import('../pages/mp/MpDocuments.jsx') },
          { path: '/mp/notifications', loader: () => import('../pages/mp/MpNotifications.jsx') },
          { path: '/mp/settings', loader: () => import('../pages/mp/MpSettings.jsx') },
        ];

        for (const item of mpImports) {
          try {
            await item.loader();
            markRouteAsCached(item.path);
          } catch {
            // Ignore individual prefetch errors
          }
        }
      }
    } catch {
      // Non-critical background task
    }
  };

  // Schedule preloading during browser idle time or after 2s delay
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preloadRoutes(), { timeout: 4000 });
  } else {
    setTimeout(preloadRoutes, 2000);
  }
}
