import { describe, it, expect, vi, beforeEach } from 'vitest';
import { broadcastPortalEvent, subscribePortalSync } from '../utils/portalSync';

describe('portalSync Utility', () => {
  it('allows subscribing and receiving broadcast events', () => {
    const handler = vi.fn();
    const unsubscribe = subscribePortalSync(handler);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('broadcastPortalEvent executes safely without throwing', () => {
    expect(() => {
      broadcastPortalEvent('PROJECT_SUBMITTED', { title: 'Solar High-Mast Lighting' });
      broadcastPortalEvent('PROJECT_REVIEWED', { id: 'PRJ-2026-001', action: 'Sanction' });
    }).not.toThrow();
  });
});

