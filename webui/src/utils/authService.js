import axios from 'axios';
import { buildApiUrl } from '../config/api';

/**
 * Authenticate against the backend and store the signed API token client-side.
 */
export const authenticateUser = async (username, password) => {
  try {
    const response = await axios.post(buildApiUrl('/api/auth/login'), {
      username: (username || '').trim(),
      password: (password || '').trim(),
    });

    return {
      success: true,
      token: response.data.access_token,
      user: {
        ...(response.data.user || {}),
        apiToken: response.data.access_token,
      },
    };
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid username or password');
    }
    throw new Error(error.response?.data?.detail || 'Unable to sign in');
  }
};

/**
 * Validate the signed token shape and client-side expiry.
 */
export const validateToken = (token) => {
  if (typeof token !== 'string' || !token.startsWith('bm.')) {
    return false;
  }

  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return Number(decoded.exp) * 1000 >= Date.now();
  } catch {
    return false;
  }
};
