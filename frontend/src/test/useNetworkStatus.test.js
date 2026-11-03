import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

describe('useNetworkStatus Hook', () => {
  it('initializes with online status by default', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('updates state when window offline and online events trigger', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});

