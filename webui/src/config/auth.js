// Authentication configuration
// This reads from React environment variables (REACT_APP_*)
// These are set during the Docker build process from the parent .env file

export const AUTH_CONFIG = {
  // Read from React environment variables with fallbacks
  WEBADMIN: process.env.REACT_APP_WEBADMIN || 'admin',
  WEBPASSWORD: process.env.REACT_APP_WEBPASSWORD || 'admin123',
};

// Note: In a production environment, these credentials would be:
// 1. Stored securely on the backend
// 2. Never exposed in the frontend code
// 3. Validated through secure API endpoints
// 
// The credentials are set in the parent .env file:
// WEBADMIN=your_admin_username
// WEBPASSWORD=your_admin_password
// 
// These are passed to the Docker container via docker-compose.yml and
// converted to REACT_APP_* variables during the build process
