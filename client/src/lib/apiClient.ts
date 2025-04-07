/**
 * API Client
 * 
 * A standardized utility for making API requests to the backend.
 * This centralizes API communication and provides consistent error handling.
 */

const API_BASE_URL = ''; // Empty string for same-domain requests

/**
 * Handles API response checking
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed (${response.status})`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = `${errorMessage}: ${errorData.message}`;
      }
    } catch (e) {
      // If the error response isn't JSON, use the text directly
      if (errorText) {
        errorMessage = `${errorMessage}: ${errorText}`;
      }
    }
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // For empty responses, return an empty object
  if (response.status === 204) {
    return {};
  }
  
  return response.json();
}

/**
 * Makes a GET request to the API
 */
export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
}

/**
 * Makes a POST request to the API
 */
export async function apiPost(endpoint: string, data: any) {
  console.log(`Making POST request to ${window.location.origin}${endpoint}`);
  console.log(`Request body:`, JSON.stringify(data));
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
}

/**
 * Makes a PATCH request to the API
 */
export async function apiPatch(endpoint: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return handleResponse(response);
}

/**
 * Makes a DELETE request to the API
 */
export async function apiDelete(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
}

/**
 * Makes a request to an external API
 * 
 * This uses the server as a proxy to avoid CORS issues and to protect API keys
 */
export async function externalApiRequest(
  url: string,
  method: string = 'GET',
  data?: any,
  headers?: Record<string, string>
) {
  // Use the server as a proxy
  const proxyEndpoint = '/api/proxy';
  
  const response = await fetch(proxyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      method,
      data,
      headers,
    }),
  });
  
  return handleResponse(response);
}