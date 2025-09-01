import { AUTH_CONFIG } from '../config/auth';

// NOTE: This is *client-side* auth intended for simple, non-production setups.
// Anything in a frontend .env (Create React App) is baked into the bundle and visible to users.
// For real auth, move checks to the backend.

const TOKEN_PREFIX = 'local-web-token-';

const getCredentials = () => ({
  // Trim to avoid accidental whitespace mismatches
  username: (AUTH_CONFIG.WEBADMIN || '').trim(),
  password: (AUTH_CONFIG.WEBPASSWORD || '').trim(),
});

/**
 * Authenticate user by comparing against env-provided credentials.
 * Returns a synthetic token used only to gate the UI (ProtectedRoute).
 */
export const authenticateUser = async (username, password) => {
  // Tiny delay so the UI can show a spinner if it wants to
  await new Promise((resolve) => setTimeout(resolve, 200));

  const { username: expectedUser, password: expectedPass } = getCredentials();

  if ((username || '').trim() === expectedUser && (password || '').trim() === expectedPass) {
    const token =
      TOKEN_PREFIX +
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));

    return {
      success: true,
      token,
      user: {
        username: expectedUser,
        role: AUTH_CONFIG.ROLE || 'admin',
      },
    };
  }

  throw new Error('Invalid username or password');
};

/**
 * Validate a token — purely syntactic check since there’s no backend.
 */
export const validateToken = (token) => {
  return typeof token === 'string' && token.startsWith(TOKEN_PREFIX);
};
