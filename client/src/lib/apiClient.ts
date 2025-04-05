/**
 * API Client
 * 
 * A simple client for making API requests with consistent error handling
 * and response formatting.
 */

// Default fetch options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'same-origin', // Includes cookies for same-origin requests
};

// Function to check if the response is JSON
async function isResponseJson(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type');
  return contentType != null && contentType.includes('application/json');
}

/**
 * Make an API request with consistent error handling
 */
export async function apiRequest(url: string, options?: RequestInit): Promise<Response> {
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    // For 204 No Content, don't try to parse the body
    if (response.status === 204) {
      return response;
    }
    
    // For network errors or other fetch failures
    if (!response.ok) {
      // Try to get structured error information if available
      if (await isResponseJson(response)) {
        try {
          const errorData = await response.clone().json();
          // Add the structured error to the response for later processing
          (response as any).errorData = errorData;
        } catch (e) {
          // If JSON parsing fails, move on with the original response
          console.warn('Failed to parse error response as JSON');
        }
      }
    }
    
    return response;
  } catch (error) {
    // Create a synthetic Response for network errors
    console.error('API request failed:', error);
    
    // Create a Response object with the error
    return new Response(JSON.stringify({ 
      error: 'Network error', 
      message: error instanceof Error ? error.message : 'Failed to connect to the server' 
    }), {
      status: 0,
      statusText: 'Network Error',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  }
}

/**
 * Helper function to make a GET request
 */
export async function apiGet(url: string, options?: RequestInit): Promise<Response> {
  return apiRequest(url, { ...options, method: 'GET' });
}

/**
 * Helper function to make a POST request
 */
export async function apiPost(url: string, data?: any, options?: RequestInit): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function to make a PUT request
 */
export async function apiPut(url: string, data?: any, options?: RequestInit): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function to make a PATCH request
 */
export async function apiPatch(url: string, data?: any, options?: RequestInit): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper function to make a DELETE request
 */
export async function apiDelete(url: string, options?: RequestInit): Promise<Response> {
  return apiRequest(url, { ...options, method: 'DELETE' });
}