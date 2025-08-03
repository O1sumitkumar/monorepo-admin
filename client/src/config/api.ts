// API Configuration
export const API_CONFIG = {
  // Change this to switch between API versions
  VERSION: "v1", // Options: "v1", "v2", "legacy"

  // Base URLs for different environments
  BASE_URLS: {
    development: "http://localhost:5000",
    production: "/api", // Use relative path in production
  },

  // Get the current base URL
  getBaseURL: () => {
    const env = import.meta.env.MODE;
    const baseURL =
      API_CONFIG.BASE_URLS[env as keyof typeof API_CONFIG.BASE_URLS] ||
      API_CONFIG.BASE_URLS.development;

    // For legacy version, don't add version prefix
    if (API_CONFIG.VERSION === "legacy") {
      return `${baseURL}/api`;
    }

    // For versioned APIs, add version prefix
    return `${baseURL}/api/${API_CONFIG.VERSION}`;
  },

  // Get the current API version
  getVersion: () => API_CONFIG.VERSION,

  // Check if using legacy version
  isLegacy: () => API_CONFIG.VERSION === "legacy",

  // Get full endpoint URL
  getEndpoint: (endpoint: string) => {
    const baseURL = API_CONFIG.getBaseURL();
    return `${baseURL}${endpoint}`;
  },
};

// API Version Management
export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
  LEGACY: "legacy",
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

// Function to switch API version
export const switchApiVersion = (version: ApiVersion) => {
  API_CONFIG.VERSION = version;
  console.log(`🔄 Switched to API version: ${version}`);
  console.log(`📡 Base URL: ${API_CONFIG.getBaseURL()}`);

  // Optionally reload the page to apply changes
  if (import.meta.env.DEV) {
    console.log(
      "💡 In development mode, you may need to refresh the page to see changes"
    );
  }
};

// Export current configuration
export default API_CONFIG;
