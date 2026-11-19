import React from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { TbRefresh } from 'react-icons/tb';

/**
 * Non-blocking indicator showing when cached queries are revalidating in the background.
 * Uses WCAG-compliant accessible status announcements.
 */
export const QueryStatusIndicator = ({ className = '' }) => {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200 shadow-xs transition-opacity duration-200 ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"
        aria-hidden="true"
      />
      <TbRefresh className="w-3 h-3 text-sky-600 animate-spin" aria-hidden="true" />
      <span>Refreshing...</span>
      <span className="sr-only">Updating data in background</span>
    </div>
  );
};

/**
 * Discreet timestamp label for financial and statutory figures.
 */
export const QueryLastUpdated = ({
  timestamp = null,
  label = 'Last updated:',
  className = '',
}) => {
  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <span
      className={`text-[11px] text-slate-500 font-medium inline-flex items-center gap-1 ${className}`}
      aria-label={`${label} ${timeStr}`}
    >
      <span>{label}</span>
      <time dateTime={dateObj.toISOString()} className="font-semibold text-slate-700">
        {timeStr}
      </time>
    </span>
  );
};

/**
 * Non-blocking banner displayed if background revalidation fails while cached data is displayed.
 */
export const QueryErrorBanner = ({
  onRetry,
  lastUpdatedTime = null,
  className = '',
}) => {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      queryClient.refetchQueries({ type: 'active' });
    }
  };

  const formattedTime = lastUpdatedTime
    ? new Date(lastUpdatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'earlier today';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-xs ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span>Couldn't refresh. Showing cached figures from {formattedTime}.</span>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        className="font-semibold underline hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 rounded px-1.5 py-0.5 text-xs transition-colors"
      >
        Retry
      </button>
    </div>
  );
};

export default QueryStatusIndicator;
