/**
 * API Node Executor for Client-Centric Architecture
 * 
 * This executor handles API requests to both internal and external endpoints.
 * For internal endpoints, it uses the apiClient directly.
 * For external endpoints, it routes through the server proxy endpoint.
 */

import { apiClient } from '../apiClient';

// Type definition for API node settings
export interface ApiNodeSettings {
  apiType: 'internal' | 'external';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  useInputAsEndpoint?: boolean;
  useInputForData?: boolean;
  useInputForParams?: boolean;
  useInputForHeaders?: boolean;
  data?: Record<string, any>;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Execute an API node with the given settings and input
 * 
 * @param nodeData - The node configuration data
 * @param input - The input data to the node
 * @returns The result of the API request
 */
export async function executeApiNode(nodeData: any, input: any): Promise<any> {
  // Extract settings from node data
  const settings: ApiNodeSettings = {
    apiType: nodeData.apiType || 'internal',
    method: nodeData.method || 'GET',
    endpoint: nodeData.endpoint || '',
    useInputAsEndpoint: nodeData.useInputAsEndpoint || false,
    useInputForData: nodeData.useInputForData || false,
    useInputForParams: nodeData.useInputForParams || false,
    useInputForHeaders: nodeData.useInputForHeaders || false,
    data: nodeData.data || {},
    headers: nodeData.headers || {},
    params: nodeData.params || {}
  };

  // Build the endpoint URL
  let endpoint = settings.endpoint;
  if (settings.useInputAsEndpoint && typeof input === 'string') {
    endpoint = input;
  }

  // For external APIs, use the proxy endpoint
  if (settings.apiType === 'external') {
    endpoint = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
  }

  // Prepare request data
  let requestData = settings.data;
  if (settings.useInputForData) {
    requestData = input;
  }

  // Prepare request headers
  let headers = { ...settings.headers };
  if (settings.useInputForHeaders && input && typeof input === 'object' && input.headers) {
    headers = { ...headers, ...input.headers };
  }

  // Prepare request parameters
  let params = { ...settings.params };
  if (settings.useInputForParams && input && typeof input === 'object' && input.params) {
    params = { ...params, ...input.params };
  }

  // Execute the API request based on the method
  try {
    let response;
    switch (settings.method) {
      case 'GET':
        response = await apiClient.get(endpoint, { headers, params });
        break;
      case 'POST':
        response = await apiClient.post(endpoint, requestData, { headers, params });
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, requestData, { headers, params });
        break;
      case 'PATCH':
        response = await apiClient.patch(endpoint, requestData, { headers, params });
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint, { headers, params });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${settings.method}`);
    }

    return response;
  } catch (error) {
    console.error('API node execution error:', error);
    
    // Return a structured error response
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown API error',
      details: error
    };
  }
}