import axios from 'axios';
import { buildApiUrl } from '../config/api';

/**
 * Authenticate against the backend. The signed token is stored by the backend
 * in an HttpOnly cookie, not in browser localStorage.
 */
export const authenticateUser = async (username, password) => {
  try {
    const response = await axios.post(buildApiUrl('/api/auth/login'), {
      username: (username || '').trim(),
      password: (password || '').trim(),
    });

    return {
      success: true,
      user: response.data.user || null,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid username or password');
    }
    throw new Error(error.response?.data?.detail || 'Unable to sign in');
  }
};

export const fetchSession = async () => {
  try {
    const response = await axios.get(buildApiUrl('/api/auth/session'));
    return {
      success: true,
      user: response.data.user || null,
    };
  } catch {
    return { success: false, user: null };
  }
};

export const logoutUser = async () => {
  await axios.post(buildApiUrl('/api/auth/logout'));
};
