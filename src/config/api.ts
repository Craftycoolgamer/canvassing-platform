// API Configuration
export const API_CONFIG = {
  // Development - change this to your backend URL
  BASE_URL: 'http://192.168.1.34:3000/api',
  
  // Alternative URLs for different environments
  // LOCAL: 'http://localhost:3000/api',
  // DOCKER: 'http://localhost:3000/api',
  // PRODUCTION: 'https://your-production-domain.com/api',
  
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Helper function to get the current API base URL
export const getApiBaseUrl = (): string => {
  // You can add environment-specific logic here
  // For example, check if running in development vs production
  return API_CONFIG.BASE_URL;
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}; 