/**
 * API Client
 * 
 * Standardized API client for making requests from the client to our server API
 * and, via a proxy, to external APIs.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create a base axios instance with common configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '',  // Using relative URLs
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Apply interceptors for common behaviors
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any request processing here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Extract and return just the data from successful responses
    return response.data;
  },
  (error) => {
    // Enhanced error handling
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Response Error:', error.response.status, error.response.data);
      
      // Convert server error responses to a standardized format
      return Promise.reject({
        status: error.response.status,
        message: error.response.data.message || 'Unknown error occurred',
        data: error.response.data
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Request Error (No Response):', error.request);
      return Promise.reject({
        status: 0,
        message: 'No response received from server',
        data: null
      });
    } else {
      // Error in setting up the request
      console.error('API Setup Error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'Error setting up the request',
        data: null
      });
    }
  }
);

/**
 * API client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make a GET request
   * 
   * @param url - The URL to request
   * @param config - Additional request configuration
   * @returns The response data
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config);
  },

  /**
   * Make a POST request
   * 
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional request configuration
   * @returns The response data
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config);
  },

  /**
   * Make a PUT request
   * 
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional request configuration
   * @returns The response data
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config);
  },

  /**
   * Make a PATCH request
   * 
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional request configuration
   * @returns The response data
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.patch(url, data, config);
  },

  /**
   * Make a DELETE request
   * 
   * @param url - The URL to request
   * @param config - Additional request configuration
   * @returns The response data
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config);
  }
};

/**
 * Shorthand function for making POST requests to the API
 * This is for compatibility with existing code
 * 
 * @param url - The URL to request
 * @param data - The data to send
 * @param config - Additional request configuration
 * @returns The response data
 */
export const apiPost = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.post<T>(url, data, config);
};

/**
 * Generic API request function for use with React Query mutations
 * 
 * @param method - The HTTP method to use
 * @param url - The URL to request
 * @param data - The data to send (for POST, PUT, PATCH)
 * @returns The response data
 */
export const apiRequest = async ({ 
  method, 
  url, 
  data 
}: { 
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; 
  url: string; 
  data?: any;
}): Promise<any> => {
  switch (method) {
    case 'GET':
      return apiClient.get(url);
    case 'POST':
      return apiClient.post(url, data);
    case 'PUT':
      return apiClient.put(url, data);
    case 'PATCH':
      return apiClient.patch(url, data);
    case 'DELETE':
      return apiClient.delete(url);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};