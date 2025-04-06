/**
 * Simple API client for making requests to the backend
 */
import axios from 'axios';

// Create an axios instance with defaults appropriate for our API
export const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Needed for cookies/session
});

// Response interceptor for API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors but don't expose internals to the user
    console.error('API request error:', error);
    
    return Promise.reject(error);
  }
);

// Simple wrapper for making API requests
export const apiRequest = async (endpoint: string, method: string = 'GET', data?: any) => {
  try {
    const config = {
      method,
      url: endpoint,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined,
    };
    
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error(`Error making ${method} request to ${endpoint}:`, error);
    throw error;
  }
};

// Helper methods for common HTTP methods
export const apiGet = async (endpoint: string, params?: any) => {
  return apiRequest(endpoint, 'GET', params);
};

export const apiPost = async (endpoint: string, data?: any) => {
  return apiRequest(endpoint, 'POST', data);
};

export const apiPatch = async (endpoint: string, data?: any) => {
  return apiRequest(endpoint, 'PATCH', data);
};

export const apiPut = async (endpoint: string, data?: any) => {
  return apiRequest(endpoint, 'PUT', data);
};

export const apiDelete = async (endpoint: string, data?: any) => {
  return apiRequest(endpoint, 'DELETE', data);
};

export default apiClient;