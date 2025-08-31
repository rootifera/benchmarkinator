import { AUTH_CONFIG } from '../config/auth';

// Authentication service for the web UI
// This simulates backend authentication using environment variables

const getCredentials = () => {
  // Use the configuration values
  return {
    username: AUTH_CONFIG.WEBADMIN,
    password: AUTH_CONFIG.WEBPASSWORD
  };
};

export const authenticateUser = async (username, password) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const credentials = getCredentials();
  
  if (username === credentials.username && password === credentials.password) {
    // Generate a simple token (in production, this would come from the backend)
    const token = `web-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      token,
      user: {
        username: credentials.username,
        role: 'admin'
      }
    };
  } else {
    throw new Error('Invalid username or password');
  }
};

export const validateToken = (token) => {
  // Simple token validation (in production, this would verify with the backend)
  if (token && token.startsWith('web-token-')) {
    return true;
  }
  return false;
};
