import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      role: null,
      user: null,
      isLoading: false,
      error: null,
    });
  });

  it('initializes with null credentials when localStorage is empty', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.role).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setAuth persists token, role, and user into state and localStorage', () => {
    const mockUser = { id: 'MP001', name: 'Rajnath Singh', dist: 'Lucknow' };
    useAuthStore.getState().setAuth('test-jwt-token-123', 'MP', mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe('test-jwt-token-123');
    expect(state.role).toBe('MP');
    expect(state.user).toEqual(mockUser);

    expect(localStorage.getItem('mplads_auth_token')).toBe('test-jwt-token-123');
    expect(localStorage.getItem('mplads_auth_role')).toBe('MP');
    expect(JSON.parse(localStorage.getItem('mplads_auth_user'))).toEqual(mockUser);
  });

  it('setUser updates user in state and localStorage', () => {
    const initialUser = { id: 'MP001', name: 'Initial' };
    useAuthStore.getState().setAuth('token', 'MP', initialUser);

    const updatedUser = { id: 'MP001', name: 'Updated Name', dist: 'Lucknow' };
    useAuthStore.getState().setUser(updatedUser);

    expect(useAuthStore.getState().user).toEqual(updatedUser);
    expect(JSON.parse(localStorage.getItem('mplads_auth_user'))).toEqual(updatedUser);
  });

  it('logout cleans up state and wipes localStorage credentials', () => {
    useAuthStore.getState().setAuth('jwt-token', 'DM', { id: 'DM01', dist: 'Lucknow' });
    expect(useAuthStore.getState().token).toBe('jwt-token');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.role).toBeNull();
    expect(state.user).toBeNull();

    expect(localStorage.getItem('mplads_auth_token')).toBeNull();
    expect(localStorage.getItem('mplads_auth_role')).toBeNull();
    expect(localStorage.getItem('mplads_auth_user')).toBeNull();
  });
});

