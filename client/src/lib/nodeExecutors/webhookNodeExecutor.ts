/**
 * Webhook Node Executor
 * This executor handles making HTTP requests to webhooks and APIs
 */

import { Node } from 'reactflow';
import { NodeExecutor, NodeExecutionState } from '../workflowEngine';

// Simple function to execute scripts from string with proper context
function executeScript(script: string, inputData: any) {
  try {
    // Create a function from the script with input as parameter
    const scriptFn = new Function('input', script);
    // Execute the function with input data
    return scriptFn(inputData);
  } catch (error) {
    console.error('Error executing webhook script:', error);
    return inputData; // Return original input on error
  }
}

export const webhookNodeExecutor: NodeExecutor = {
  execute: async (nodeData: any, inputs: Record<string, any>) => {
    console.log('Executing webhook node', nodeData.id);

    const config = nodeData.configuration || {};
    const { url, method = 'POST', headers = {}, body } = config;
    
    if (!url) {
      console.error('Webhook URL is missing');
      return { error: 'Webhook URL is missing' };
    }

    try {
      // Get input data from the first connected input
      const inputData = inputs[Object.keys(inputs)[0]] || {};
      
      // Prepare request body
      let requestBody = inputData;
      
      // If a body transform script is provided, execute it
      if (body && typeof body === 'string') {
        requestBody = executeScript(body, inputData);
      }
      
      // Determine if we need to use relative or absolute URL
      // Use a server-safe approach without relying on window object
      const requestUrl = url.startsWith('http') 
        ? url 
        : (typeof window !== 'undefined' 
            ? `${window.location.origin}${url}` 
            : `http://localhost:5000${url}`);
      
      console.log(`Making ${method} request to ${requestUrl}`);
      
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
        console.error(`Webhook request failed (${response.status}):`, errorText);
        return { 
          error: `Webhook request failed with status ${response.status}`,
          status: response.status,
          details: errorText
        };
      }
      
      // Parse response - handle both JSON and text responses
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      console.log('Webhook response:', responseData);
      
      return responseData;
      
    } catch (error) {
      console.error('Error executing webhook:', error);
      return { 
        error: `Webhook execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
};