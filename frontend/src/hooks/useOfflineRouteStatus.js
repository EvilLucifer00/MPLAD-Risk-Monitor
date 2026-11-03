import { useState, useEffect, useCallback } from 'react';
import { isRouteCached, markRouteAsCached, notifyOfflineBlocked } from '../utils/offlineCacheTracker';

/**
 * Hook providing reactive offline status and route caching checks.
 * Determines if a navigation target is cached or must be disabled while offline.
 */
export function useOfflineRouteStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [cacheVersion, setCacheVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleCacheUpdate = () => setCacheVersion((v) => v + 1);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mplads:cache-updated', handleCacheUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mplads:cache-updated', handleCacheUpdate);
    };
  }, []);

  const checkIsCached = useCallback((path) => {
    return isRouteCached(path);
  }, [cacheVersion, isOnline]);

  const isRouteDisabled = useCallback((path) => {
    if (isOnline) return false;
    return !checkIsCached(path);
  }, [isOnline, checkIsCached]);

  return {
    isOnline,
    isRouteCached: checkIsCached,
    isRouteDisabled,
    markRouteAsCached,
    notifyOfflineBlocked,
  };
}

export default useOfflineRouteStatus;
