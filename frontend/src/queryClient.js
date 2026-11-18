import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance configured for safe in-memory caching:
 * 
 * SECURITY & PERSISTENCE NOTICE:
 * Persistence (localStorage, sessionStorage, IndexedDB, Service Worker caches)
 * is INTENTIONALLY ABSENT by design in this official government portal.
 * All cached figures live strictly in volatile JavaScript heap memory and are wiped
 * on logout, role change, 401 unauthorized errors, and window reload.
 * This guarantees that sensitive public funds, statutory audit states, and project approvals
 * can NEVER be falsely served from stale disk caches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 10-minute garbage collection: returning to visited sections within 10m is instant
      gcTime: 10 * 60 * 1000,
      // 30-second safe default freshness (overridden per category in cacheConfig.js)
      staleTime: 30 * 1000,
      // Revalidate in the background when stale upon mounting
      refetchOnMount: true,
      // Revalidate on window focus
      refetchOnWindowFocus: true,
      // Explicit reconnect refetch: guarantees fresh live data after connection restoration
      refetchOnReconnect: true,
      networkMode: 'online',
      // Retry up to 2 times for network errors and 5xx, never retry for 4xx (especially 401/403)
      retry: (failureCount, error) => {
        const status = error?.status || error?.response?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        if (
          error?.message &&
          (error.message.includes('401') ||
            error.message.includes('403') ||
            error.message.includes('404') ||
            error.message.toLowerCase().includes('unauthorized') ||
            error.message.toLowerCase().includes('forbidden'))
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: 'online',
    },
  },
});

/**
 * Completely clears in-memory query cache and cleans up any legacy storage artifacts.
 * Must be invoked on logout, session expiration, 401 responses, and role/office transitions.
 */
export function clearInMemoryCache() {
  queryClient.clear();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('mplads_query_cache');
      sessionStorage.removeItem('mplads_cached_routes');
    } catch {}
  }
}

// Backwards-compatible alias for existing imports
export const clearPersistedQueryCache = clearInMemoryCache;
