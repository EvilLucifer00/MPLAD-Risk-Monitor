/**
 * Central Cache Configuration for In-Memory React Query Cache.
 * 
 * Strict Goverment Security Standard:
 * - In-memory only. No persistence to localStorage, sessionStorage, or IndexedDB.
 * - Categorized by data volatility to balance instant navigation with statutory freshness.
 */

export const CACHE_TIMES = {
  /**
   * Reference data: states, districts, constituencies, agencies, categories
   * Very stable metadata that rarely changes during a working session.
   */
  REFERENCE: {
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours (in-memory)
  },

  /**
   * Lists and reports: works lists, sanctioned projects, recommendations, tables
   * Short stale time: keeps navigation snappy while capturing new submissions and updates.
   */
  LISTS_REPORTS: {
    staleTime: 45 * 1000,           // 45 seconds
    gcTime: 10 * 60 * 1000,         // 10 minutes
  },

  /**
   * Dashboard and aggregate charts: summary counts, category distributions
   */
  DASHBOARD: {
    staleTime: 60 * 1000,           // 60 seconds
    gcTime: 10 * 60 * 1000,         // 10 minutes
  },

  /**
   * Financial and status figures: funds released, balance, expenditure, utilization, work status, approval state
   * staleTime: 0 ensures that while cached figures render instantly with 0ms delay on return visits,
   * a background revalidation ALWAYS triggers on mount and window focus.
   */
  FINANCIAL_STATUS: {
    staleTime: 0,                   // 0 seconds (always revalidate in background)
    gcTime: 10 * 60 * 1000,         // 10 minutes
  },

  /**
   * Map/geo data: boundary GeoJSON layers and coordinates
   * Static geographic polygon layers that do not change during runtime.
   */
  MAP_GEO: {
    staleTime: 60 * 60 * 1000,      // 1 hour
    gcTime: 2 * 60 * 60 * 1000,     // 2 hours
  },
};
