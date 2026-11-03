import { useState, useEffect } from 'react';

/**
 * Hook detecting online / offline network connectivity transitions.
 * Allows MP and DA portals to inform officials when navigating cached offline views.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let recoveryTimer = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      recoveryTimer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (recoveryTimer) clearTimeout(recoveryTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

export default useNetworkStatus;

