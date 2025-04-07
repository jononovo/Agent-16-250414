/**
 * API Node Executor
 * 
 * Handles the execution of API nodes, which make HTTP requests to internal or external APIs.
 */

import { EnhancedNodeExecutor, NodeExecutionData, createExecutionDataFromValue } from '../types/workflow';

// Simple function to execute scripts from string with proper context
function executeScript(script: string, inputData: any) {
  try {
    // Create a function from the script with input as parameter
    const scriptFn = new Function('input', script);
    // Execute the function with input data
    return scriptFn(inputData);
  } catch (error) {
    console.error('Error executing API script:', error);
    return inputData; // Return original input on error
  }
}

export const apiExecutor: EnhancedNodeExecutor = {
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    try {
      console.log('Executing API node', nodeData.id || 'unknown');
      
      // Extract settings from the node data
      const settings = nodeData.settings || {};
      const { url, method = 'POST', headers = {}, body } = settings;
      
      if (!url) {
        throw new Error('API URL is missing');
      }
      
      // Get input data from the first connected input
      const inputKey = Object.keys(inputs)[0] || 'main';
      const inputData = inputs[inputKey]?.items[0]?.json || {};
      
      console.log('API node input data:', JSON.stringify(inputData));
      
      // Prepare request body
      let requestBody = inputData;
      
      // If a body transform script is provided, execute it
      if (body && typeof body === 'string') {
        requestBody = executeScript(body, inputData);
      }
      
      // Determine if we need to use relative or absolute URL
      const requestUrl = url.startsWith('http') 
        ? url 
        : (typeof window !== 'undefined' 
            ? `${window.location.origin}${url}` 
            : `http://localhost:5000${url}`);
      
      console.log(`Making ${method} request to ${requestUrl}`);
      console.log('Request body:', typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody));
      
      // Make the request
      const response = await fetch(requestUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody),
        credentials: 'include' // Include cookies for same-origin requests
      });
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed (${response.status}):`, errorText);
        
        return createExecutionDataFromValue({
          error: `API request failed with status ${response.status}`,
          statusCode: response.status,
          details: errorText,
          _hasError: true,
          _errorMessage: `API request failed: ${errorText}`
        }, 'api_error');
      }
      
      // Parse response - handle both JSON and text responses
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
        // Try to parse text as JSON in case Content-Type is wrong
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // Keep as text if not valid JSON
        }
      }
      
      console.log('API response:', typeof responseData === 'string' ? responseData : JSON.stringify(responseData));
      
      // Return the response data with appropriate metadata
      return createExecutionDataFromValue(responseData, 'api_response');
      
    } catch (error: any) {
      console.error('Error executing API node:', error);
      
      return createExecutionDataFromValue({
        error: error.message || 'Unknown API execution error',
        _hasError: true,
        _errorMessage: error.message || 'Unknown API execution error'
      }, 'api_error');
    }
  }
};

export default apiExecutor;