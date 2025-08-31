// Authentication configuration
// This reads from React environment variables (REACT_APP_*)
// Set these in your .env file in the webui directory

export const AUTH_CONFIG = {
  // Read from environment variables with fallbacks
  WEBADMIN: process.env.REACT_APP_WEBADMIN || 'admin',
  WEBPASSWORD: process.env.REACT_APP_WEBPASSWORD || 'admin123',
};

// Note: In a production environment, these credentials would be:
// 1. Stored securely on the backend
// 2. Never exposed in the frontend code
// 3. Validated through secure API endpoints
// 
// To use environment variables, create a .env file in the webui directory with:
// REACT_APP_WEBADMIN=your_admin_username
// REACT_APP_WEBPASSWORD=your_admin_password
// 
// The REACT_APP_ prefix is required for Create React App to expose these variables
