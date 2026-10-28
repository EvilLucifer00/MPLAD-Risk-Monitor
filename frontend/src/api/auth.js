/**
 * Authentication API Service
 * Handles communication with the FastAPI backend for user authentication,
 * profile retrieval, and registration.
 */
const PROD_API_URL = 'https://mplads-backend-axxw.onrender.com';
const DEV_API_URL = 'http://localhost:8000';

const isProductionOrPreview =
  import.meta.env.PROD ||
  import.meta.env.MODE === 'production' ||
  import.meta.env.MODE === 'preview' ||
  (typeof window !== 'undefined' && window.location.port === '4173');

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  (isProductionOrPreview ? PROD_API_URL : DEV_API_URL);

const API_BASE_URL = RAW_API_URL.trim().replace(/\/+$/, '');

/**
 * Helper to parse backend error responses cleanly.
 * Surfaces specific detail strings or combines validation errors.
 */
async function parseError(response) {
  try {
    const data = await response.json();
    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        // FastAPI validation errors: [{"loc": ["body", "field"], "msg": "Field required"}]
        return data.detail
          .map((item) => {
            const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
            return field ? `${field}: ${item.msg}` : item.msg;
          })
          .join(', ');
      }
      if (typeof data.detail === 'string') {
        return data.detail;
      }
    }
  } catch {
    // If not JSON, ignore and fallback to statusText
  }

  return response.statusText || `Request failed with status ${response.status}`;
}

const inFlightAuthGet = new Map();

export const authApi = {
  /**
   * Authenticate a user (MP or DM)
   * @param {{ username: string, password: string, role: 'MP' | 'DM' }} credentials
   * @returns {Promise<{ access_token: string, token_type: string }>}
   */
  login: async ({ username, password, role }) => {
    // Ensure role matches UserRole Enum in backend ('MP' | 'DM' | 'DA')
    const normalizedRole = role === 'district_authority' ? 'DM' : role.toUpperCase();

    const response = await fetch(`${API_BASE_URL}/user/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        role: normalizedRole,
      }),
    });

    if (!response.ok) {
      const message = await parseError(response);
      throw new Error(message);
    }

    return await response.json();
  },

  /**
   * Fetch authenticated MP's profile
   * @param {string} token - JWT Access token
   * @returns {Promise<{ id: number, mp_name: string, constituency: string, dist: string, state: string, house: string, dm_id: number }>}
   */
  getMpProfile: async (token) => {
    const key = `MP_me:${token}`;
    if (inFlightAuthGet.has(key)) {
      return inFlightAuthGet.get(key);
    }

    const p = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(`${API_BASE_URL}/user/auth/MP/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
          }
          const message = await parseError(response);
          throw new Error(message);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
        inFlightAuthGet.delete(key);
      }
    })();

    inFlightAuthGet.set(key, p);
    return p;
  },

  /**
   * Fetch authenticated DM's profile
   * @param {string} token - JWT Access token
   * @returns {Promise<{ id: number, dm_name: string, dist: string, state: string }>}
   */
  getDmProfile: async (token) => {
    const key = `DM_me:${token}`;
    if (inFlightAuthGet.has(key)) {
      return inFlightAuthGet.get(key);
    }

    const p = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(`${API_BASE_URL}/user/auth/DM/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
          }
          const message = await parseError(response);
          throw new Error(message);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
        inFlightAuthGet.delete(key);
      }
    })();

    inFlightAuthGet.set(key, p);
    return p;
  },

  /**
   * Register a new MP
   * @param {{ username: string, password: string, mp_name: string, constituency: string, dist: string, house: string, state: string, dm_id: number }} data
   * @returns {Promise<{ message: string, user_id: number }>}
   */
  registerMp: async (data) => {
    const response = await fetch(`${API_BASE_URL}/user/create/mp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const message = await parseError(response);
      throw new Error(message);
    }

    return await response.json();
  },

  /**
   * Register a new DM
   * @param {{ username: string, password: string, dm_name: string, dist: string, state: string }} data
   * @returns {Promise<{ message: string, user_id: number }>}
   */
  registerDm: async (data) => {
    const response = await fetch(`${API_BASE_URL}/user/create/dm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const message = await parseError(response);
      throw new Error(message);
    }

    return await response.json();
  },
};
