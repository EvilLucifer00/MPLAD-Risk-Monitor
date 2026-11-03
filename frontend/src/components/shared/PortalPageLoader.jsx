import React from 'react';

/**
 * PortalPageLoader
 * Clean, accessible full-content loader shown while real API data is being fetched.
 * Prevents showing misleading skeleton zeroes, flash of mock data, or incorrect metrics.
 */
export const PortalPageLoader = ({ message = 'Loading details...' }) => (
  <div 
    className="flex flex-col items-center justify-center min-h-[360px] py-20 w-full animate-in fade-in duration-200" 
    role="status" 
    aria-live="polite"
    aria-label={message}
  >
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#123b63] border-r-cyan-500 animate-spin"></div>
      <div className="absolute w-2 h-2 rounded-full bg-[#123b63]"></div>
    </div>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{message}</p>
    <span className="sr-only">{message}</span>
  </div>
);

export default PortalPageLoader;

