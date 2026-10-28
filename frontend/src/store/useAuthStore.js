import { create } from 'zustand';
import { authApi } from '../api/auth';

const TOKEN_KEY = 'mplads_auth_token';
const ROLE_KEY = 'mplads_auth_role';
const USER_KEY = 'mplads_auth_user';

let inFlightValidationPromise = null;

/**
 * Zustand Store for Authentication and User Session.
 * Persists auth token, role, and profile in localStorage.
 */
export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  role: localStorage.getItem(ROLE_KEY) || null, // 'MP' | 'DM'
  user: (() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,
  error: null,

  setAuth: (token, role, user) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);

    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);

    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);

    set({ token, role, user, error: null });
  },

  setUser: (user) => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
    set({ user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, role: null, user: null, error: null });
  },

  /**
   * Validates stored token with backend on reload.
   * If valid, updates profile in state; if invalid/expired, clears session.
   * Uses in-flight promise deduplication to prevent duplicate /me calls.
   */
  validateSession: async () => {
    if (inFlightValidationPromise) {
      return inFlightValidationPromise;
    }

    const { token, role } = get();
    if (!token || !role) {
      get().logout();
      return null;
    }

    inFlightValidationPromise = (async () => {
      try {
        let profile = null;
        if (role === 'MP') {
          profile = await authApi.getMpProfile(token);
        } else if (role === 'DM') {
          profile = await authApi.getDmProfile(token);
        }

        if (profile) {
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
          set({ user: profile, isLoading: false, error: null });
          return profile;
        } else {
          return get().user;
        }
      } catch (err) {
        if (err && err.message === 'UNAUTHORIZED') {
          get().logout();
          set({ isLoading: false });
          return null;
        }
        // Network timeout / Render cold start: preserve cached authenticated profile
        set({ isLoading: false, error: null });
        return get().user;
      } finally {
        inFlightValidationPromise = null;
      }
    })();

    return inFlightValidationPromise;
  },
}));

