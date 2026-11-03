import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  isRouteCached,
  markRouteAsCached,
  notifyOfflineBlocked,
  getCachedRoutes,
} from '../utils/offlineCacheTracker';
import OfflineLink from '../components/shared/OfflineLink';

describe('Offline Navigation & Cache Tracker', () => {
  const originalNavigatorOnLine = navigator.onLine;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('marks routes as cached and detects cached routes correctly', () => {
    markRouteAsCached('/da/review');
    expect(getCachedRoutes()).toContain('/da/review');

    // When online, all routes return true
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isRouteCached('/da/review')).toBe(true);
    expect(isRouteCached('/da/random-uncached-page')).toBe(true);

    // When offline, uncached route returns false, cached route returns true
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isRouteCached('/da/review')).toBe(true);
    expect(isRouteCached('/da/random-uncached-page')).toBe(false);
  });

  it('dispatches mplads:offline-blocked event via notifyOfflineBlocked', () => {
    const handler = vi.fn();
    window.addEventListener('mplads:offline-blocked', handler);

    notifyOfflineBlocked('/da/documents');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.path).toBe('/da/documents');
    window.removeEventListener('mplads:offline-blocked', handler);
  });

  it('renders disabled button and suppresses navigation when offline and uncached', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    render(
      <BrowserRouter>
        <OfflineLink to="/da/uncached-section" showOfflineBadge>
          Uncached Section
        </OfflineLink>
      </BrowserRouter>
    );

    const btn = screen.getByRole('button', { name: /uncached section/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders normal active Link when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    render(
      <BrowserRouter>
        <OfflineLink to="/da/projects">
          District Projects
        </OfflineLink>
      </BrowserRouter>
    );

    const link = screen.getByRole('link', { name: /district projects/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/da/projects');
    expect(link).not.toHaveAttribute('aria-disabled');
  });
});
