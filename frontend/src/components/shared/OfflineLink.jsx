import React from 'react';
import { Link } from 'react-router-dom';
import { useOfflineRouteStatus } from '../../hooks/useOfflineRouteStatus';
import { TbCloudOff } from 'react-icons/tb';

/**
 * Offline-aware Link component.
 * When the user is offline and the destination route is not cached:
 * - Disables navigation completely
 * - Adds aria-disabled="true" and disabled styling (cursor-not-allowed, opacity-40)
 * - Prevents navigation clicks and provides user feedback
 * - Automatically re-enables as soon as internet connection is restored
 */
export const OfflineLink = ({
  to,
  children,
  className = '',
  disabledClassName = '',
  showOfflineBadge = false,
  offlineBadgeText = 'Offline',
  disabledTitle = 'This section is not cached offline. Reconnect to the internet to access it.',
  onClick,
  ...props
}) => {
  const { isOnline, isRouteCached, notifyOfflineBlocked } = useOfflineRouteStatus();
  const isCached = isRouteCached(typeof to === 'string' ? to : to?.pathname);
  const isDisabled = !isOnline && !isCached;

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={disabledTitle}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          notifyOfflineBlocked(typeof to === 'string' ? to : to?.pathname);
        }}
        className={`cursor-not-allowed opacity-40 select-none ${disabledClassName || className}`}
        {...props}
      >
        {children}
        {showOfflineBadge && (
          <span 
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20"
            title="Page not available offline"
          >
            <TbCloudOff size={11} aria-hidden="true" />
            <span>{offlineBadgeText}</span>
          </span>
        )}
      </button>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick} {...props}>
      {children}
    </Link>
  );
};

export default OfflineLink;
