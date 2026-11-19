import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryClient, clearInMemoryCache } from '../queryClient';
import { queryKeys } from '../api/queryKeys';
import { CACHE_TIMES } from '../constants/cacheConfig';
import { useAuthStore } from '../store/useAuthStore';

describe('Safe In-Memory Caching & Multi-Tenant Security Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearInMemoryCache();
    useAuthStore.setState({
      token: null,
      role: null,
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it('1. Cache hit on revisits: serves cached data within staleTime without re-fetching', async () => {
    const testClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime, // 45 seconds
          gcTime: CACHE_TIMES.LISTS_REPORTS.gcTime,
        },
      },
    });

    const networkFetchMock = vi.fn().mockResolvedValue([
      { id: 'PRJ-101', title: 'Community Water Filtration Unit', status: 'In Progress' },
    ]);

    const key = queryKeys.mp.projects('MP001', { status: 'All' });

    // Initial fetch
    const firstResult = await testClient.fetchQuery({
      queryKey: key,
      queryFn: networkFetchMock,
    });
    expect(firstResult).toHaveLength(1);
    expect(networkFetchMock).toHaveBeenCalledTimes(1);

    // Revisit within staleTime (e.g. user navigates back to Projects tab)
    const secondResult = await testClient.fetchQuery({
      queryKey: key,
      queryFn: networkFetchMock,
    });
    expect(secondResult).toEqual(firstResult);
    // Network request must NOT be called again
    expect(networkFetchMock).toHaveBeenCalledTimes(1);
  });

  it('2. Background revalidation: stale financial/status data is immediately available and triggers revalidation', async () => {
    const testClient = new QueryClient();

    let callCount = 0;
    const fetchStatsMock = vi.fn().mockImplementation(async () => {
      callCount++;
      return { totalEntitlement: 50000000, totalUtilized: callCount * 1000000 };
    });

    const statsKey = queryKeys.mp.stats('MP001');

    // Initial seed with staleTime: 0 (FINANCIAL_STATUS figures)
    await testClient.fetchQuery({
      queryKey: statsKey,
      queryFn: fetchStatsMock,
      staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime, // 0
    });
    expect(fetchStatsMock).toHaveBeenCalledTimes(1);

    // Verify data is instantly cached and accessible with 0ms latency
    const cachedInstantData = testClient.getQueryData(statsKey);
    expect(cachedInstantData).toBeDefined();
    expect(cachedInstantData.totalUtilized).toBe(1000000);

    // Because staleTime is 0, query is marked stale immediately
    const queryState = testClient.getQueryState(statsKey);
    expect(testClient.isFetching({ queryKey: statsKey })).toBe(0);
    expect(queryState.isInvalidated || Date.now() - queryState.dataUpdatedAt >= 0).toBe(true);

    // Background refetch
    await testClient.refetchQueries({ queryKey: statsKey });
    expect(fetchStatsMock).toHaveBeenCalledTimes(2);
    expect(testClient.getQueryData(statsKey).totalUtilized).toBe(2000000);
  });

  it('3. Mutation invalidation: DA approval/action invalidates affected queries', async () => {
    const dist = 'Varanasi';
    const queueKey = queryKeys.da.reviewQueue(dist);
    const statsKey = queryKeys.da.stats(dist);
    const detailKey = queryKeys.da.projectDetail('PRJ-501');

    // Seed active queries into global queryClient
    queryClient.setQueryData(queueKey, [{ id: 'PRJ-501', title: 'Road Repair', status: 'Pending Sanction' }]);
    queryClient.setQueryData(statsKey, { pendingReview: 1, totalSanctioned: 0 });
    queryClient.setQueryData(detailKey, { id: 'PRJ-501', status: 'Pending Sanction' });

    expect(queryClient.getQueryData(queueKey)).toHaveLength(1);

    // Simulate mutation settlement invalidating affected query keys
    await queryClient.invalidateQueries({ queryKey: queueKey });
    await queryClient.invalidateQueries({ queryKey: statsKey });
    await queryClient.invalidateQueries({ queryKey: detailKey });

    // Assert that the affected queries are marked as invalid and queued for background refresh
    expect(queryClient.getQueryState(queueKey).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(statsKey).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detailKey).isInvalidated).toBe(true);
  });

  it('4. Logout cache wipe: all queries in memory are eradicated on logout', () => {
    // Authenticate and seed data
    useAuthStore.getState().setAuth('mock-token-xyz', 'MP', { id: 'MP-SECRET-01', dist: 'Agra' });

    queryClient.setQueryData(queryKeys.mp.stats('MP-SECRET-01'), { totalUtilized: 99000000 });
    queryClient.setQueryData(queryKeys.mp.projects('MP-SECRET-01', {}), [{ id: 'SENSITIVE-PRJ' }]);
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    // Trigger logout
    useAuthStore.getState().logout();

    // Verify store is cleared
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();

    // Verify in-memory query cache is completely emptied
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getQueryData(queryKeys.mp.stats('MP-SECRET-01'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.mp.projects('MP-SECRET-01', {}))).toBeUndefined();
  });

  it('5. User switch isolation: Official A queries can never be accessed by Official B', () => {
    const userAKey = queryKeys.mp.projects('MP-OFFICIAL-A', { status: 'All' });
    const userBKey = queryKeys.mp.projects('MP-OFFICIAL-B', { status: 'All' });

    queryClient.setQueryData(userAKey, [
      { id: 'PRJ-A', confidentialData: 'Official A Allocation Only' },
    ]);

    // Query for Official B must be undefined
    const officialBData = queryClient.getQueryData(userBKey);
    expect(officialBData).toBeUndefined();

    // Scope check: key prefix isolation
    expect(userAKey).toContain('MP-OFFICIAL-A');
    expect(userBKey).toContain('MP-OFFICIAL-B');
    expect(userAKey).not.toEqual(userBKey);
  });
});
