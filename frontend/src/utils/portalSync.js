/**
 * Real-Time Portal Event Hub
 * Provides zero-latency cross-tab and cross-session event synchronization using BroadcastChannel.
 * Allows MP submissions and DA reviews to sync instantly across all active views.
 */

const CHANNEL_NAME = 'mplads_portal_sync';

let channel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    // Graceful fallback if unsupported
  }
}

/**
 * Broadcast an event to all other open tabs/windows
 * @param {'PROJECT_SUBMITTED' | 'PROJECT_REVIEWED' | 'DOCUMENT_UPLOADED'} type 
 * @param {Object} payload 
 */
export function broadcastPortalEvent(type, payload = {}) {
  if (!channel) return;
  try {
    channel.postMessage({
      type,
      payload,
      timestamp: Date.now(),
    });
  } catch {
    // Handled silently
  }
}

/**
 * Subscribe to cross-tab portal events
 * @param {Function} onMessage - Callback receiving { type, payload, timestamp }
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribePortalSync(onMessage) {
  if (!channel || typeof onMessage !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    try {
      if (event && event.data) {
        onMessage(event.data);
      }
    } catch {
      // Ignore malformed payloads
    }
  };

  channel.addEventListener('message', handler);
  return () => {
    channel.removeEventListener('message', handler);
  };
}

