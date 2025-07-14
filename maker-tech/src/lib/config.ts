// Application configuration

interface Config {
  apiUrl: string;
  chatbot: {
    enabled: boolean;
    maxRetries: number;
    timeout: number;
  };
}

const config: Config = {
  // Backend URL - change according to environment
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  
  chatbot: {
    enabled: import.meta.env.VITE_CHATBOT_ENABLED === 'true',
    maxRetries: parseInt(import.meta.env.VITE_CHATBOT_MAX_RETRIES || '3'),
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'), // 10 seconds
  },
};

export default config;


export const buildApiUrl = (endpoint: string) => {
  return `${config.apiUrl}${endpoint}`;
};

// Specific API URLs
export const API_ENDPOINTS = {
  query: '/api/v1/query',
  health: '/api/v1/health',
  info: '/api/v1/info',
} as const; 