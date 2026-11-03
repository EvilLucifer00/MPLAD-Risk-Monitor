import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';

const CACHE_STORAGE_KEY = 'mplads_query_cache';

/**
 * Global QueryClient instance configured for SPA performance.
 * - staleTime: 5 minutes (data remains fresh and navigation is instantaneous)
 * - gcTime: 30 minutes (cached responses kept in memory for quick back/forth navigation)
 * - refetchOnWindowFocus: false (avoids unnecessary background network calls)
 * - retry: 1 (safe retry for intermittent connectivity)
 * - networkMode: offlineFirst (serves memory/cached state when connection is lost)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// ── Persistent Session Storage Hydration & Sync ───────────────
if (typeof window !== 'undefined') {
  try {
    const serialized = sessionStorage.getItem(CACHE_STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      hydrate(queryClient, parsed);
    }
  } catch {
    // Ignore corrupt storage
  }

  // Auto-sync successful queries into sessionStorage with debounce
  let saveTimeout = null;
  queryClient.getQueryCache().subscribe((event) => {
    if (['added', 'updated'].includes(event?.type)) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        try {
          const dehydrated = dehydrate(queryClient, {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          });
          sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(dehydrated));
        } catch {
          // Quota exceeded or private browsing safeguard
        }
      }, 400);
    }
  });
}

export function clearPersistedQueryCache() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {}
  }
}
