// API Configuration
// For Docker Compose deployment, this uses the service name from docker-compose.yml

export const API_CONFIG = {
  // API base URL - hardcoded for Docker environment
  API_URL: 'benchmarkinator-api',
  
  // API port - default for the benchmarkinator API
  API_PORT: '12345',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    
    // Hardware endpoints
    CPU: '/api/cpu',
    GPU: '/api/gpu',
    MOTHERBOARD: '/api/motherboard',
    RAM: '/api/ram',
    DISK: '/api/disk',
    OS: '/api/oses',
    
    // Configuration and benchmark endpoints
    CONFIG: '/api/config',
    BENCHMARK: '/api/benchmark',
    BENCHMARK_RESULTS: '/api/benchmark_results',
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `http://${API_CONFIG.API_URL}:${API_CONFIG.API_PORT}${endpoint}`;
};

// Note: This configuration is set for Docker Compose deployment
// The service name 'benchmarkinator-api' resolves to the correct internal network address
// If you need different configurations for different environments, you can modify this file
