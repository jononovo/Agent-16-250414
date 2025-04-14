/**
 * HTTP Request Node Executor
 * 
 * This file contains the logic for executing the HTTP request node.
 * It makes an HTTP request to the specified URL and returns the response.
 */

export const execute = async (nodeData: any, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date();
    
    // Get configuration from node data and inputs
    const url = nodeData.url || '';
    const method = nodeData.method || 'GET';
    
    // Get headers from node data and merge with input headers
    let headers = { ...nodeData.headers };
    if (inputs?.headers?.json) {
      headers = { ...headers, ...inputs.headers.json };
    }
    
    // Get body from node data or inputs
    let body = nodeData.body || '';
    if (inputs?.body?.json !== undefined) {
      body = inputs.body.json;
      // Convert body to string if it's an object
      if (typeof body === 'object') {
        body = JSON.stringify(body);
      }
    }
    
    // Validate URL
    if (!url) {
      return {
        meta: {
          status: 'error',
          message: 'No URL provided for the HTTP request',
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: []
      };
    }
    
    console.log(`Executing HTTP request: ${method} ${url}`);
    
    // Create fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      // Only include body for methods that support it
      ...(method !== 'GET' && method !== 'HEAD' ? { body } : {})
    };
    
    // Execute the request
    try {
      const response = await fetch(url, fetchOptions);
      
      // Try to parse JSON response
      let responseData;
      const contentType = response.headers.get('content-type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        console.warn('Failed to parse response:', parseError);
        responseData = await response.text();
      }
      
      return {
        meta: {
          status: 'success',
          message: `HTTP ${method} request completed successfully`,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: [
          {
            json: {
              response: {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url
              },
              data: responseData,
              status: response.status
            },
            binary: null
          }
        ]
      };
    } catch (networkError: any) {
      console.error('HTTP request error:', networkError);
      
      return {
        meta: {
          status: 'error',
          message: `HTTP request failed: ${networkError.message || 'Network error'}`,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        items: []
      };
    }
  } catch (error: any) {
    // Handle any errors
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error executing HTTP request node',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      items: []
    };
  }
};