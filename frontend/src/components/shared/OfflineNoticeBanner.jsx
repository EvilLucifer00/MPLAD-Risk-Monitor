import React, { useState, useEffect } from 'react';
import { TbCloudOff, TbX } from 'react-icons/tb';

/**
 * Global offline blocked notification banner.
 * Appears whenever an uncached route navigation is prevented while offline.
 */
export const OfflineNoticeBanner = () => {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer = null;
    const handleBlocked = (e) => {
      const path = e?.detail?.path || 'This page';
      setNotice({
        message: 'This section is not cached on your device. Please reconnect to the internet to access it.',
        path,
      });

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setNotice(null);
      }, 4000);
    };

    const handleDismiss = () => setNotice(null);
    window.addEventListener('mplads:offline-blocked', handleBlocked);
    window.addEventListener('online', handleDismiss);
    window.addEventListener('mplads:silent-reload', handleDismiss);

    return () => {
      window.removeEventListener('online', handleDismiss);
      window.removeEventListener('mplads:silent-reload', handleDismiss);
      if (timer) clearTimeout(timer);
      window.removeEventListener('mplads:offline-blocked', handleBlocked);
    };
  }, []);

  if (!notice) return null;

  return (
    <aside 
      aria-label="Offline Navigation Alert"
      role="status" 
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92vw] sm:w-auto bg-[#0d2744] text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
        <TbCloudOff size={18} aria-hidden="true" />
      </div>
      <div className="text-xs sm:text-sm font-medium pr-1">
        <p className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">Unavailable Offline</p>
        <p className="text-slate-200 mt-0.5 leading-snug">{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label="Dismiss offline alert"
        className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
      >
        <TbX size={16} />
      </button>
    </aside>
  );
};

export default OfflineNoticeBanner;

