/**
 * API Node Executor
 * 
 * This executor handles API requests from workflow nodes.
 * It supports both internal and external API calls.
 */

import { NodeExecutionData, createExecutionDataFromValue } from "../types/workflow";
import { apiGet, apiPost, apiPatch, apiDelete, externalApiRequest } from "../apiClient";

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ApiType = 'internal' | 'external';

/**
 * Executes an API node
 * 
 * @param nodeData Node configuration
 * @param inputs Input data from previous nodes
 * @returns Execution data with API response
 */
export default async function executeApiNode(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData>
): Promise<NodeExecutionData> {
  try {
    // Get inputs
    const inputData = inputs.default || Object.values(inputs)[0];
    
    // Extract configuration from node data
    const apiType: ApiType = nodeData.apiType || 'internal';
    const method: ApiMethod = (nodeData.method as ApiMethod) || 'GET';
    let endpoint = nodeData.endpoint || '';
    let headers = nodeData.headers || {};
    let requestData = nodeData.data || {};
    
    // Use input data if specified
    if (nodeData.useInputForEndpoint && inputData) {
      const inputItem = inputData.items?.[0];
      if (inputItem?.json?.endpoint) {
        endpoint = inputItem.json.endpoint;
      }
    }
    
    if (nodeData.useInputForData && inputData) {
      const inputItem = inputData.items?.[0];
      if (inputItem?.json) {
        // Use input data as request body
        if (typeof inputItem.json === 'object') {
          requestData = { ...requestData, ...inputItem.json };
        } else if (typeof inputItem.json === 'string') {
          try {
            const parsedJson = JSON.parse(inputItem.json);
            requestData = { ...requestData, ...parsedJson };
          } catch (e) {
            // If not valid JSON, use as-is
            requestData = inputItem.json;
          }
        }
      }
    }
    
    console.log(`Executing API node`, apiType);
    
    // Execute request based on API type
    let response;
    if (apiType === 'internal') {
      switch (method) {
        case 'GET':
          response = await apiGet(endpoint);
          break;
        case 'POST':
          response = await apiPost(endpoint, requestData);
          break;
        case 'PATCH':
          response = await apiPatch(endpoint, requestData);
          break;
        case 'DELETE':
          response = await apiDelete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } else {
      // External API request using the proxy
      response = await externalApiRequest(
        endpoint,
        method,
        requestData,
        headers
      );
    }
    
    // Return response
    return createExecutionDataFromValue({
      success: true,
      response
    }, 'api');
  } catch (error) {
    console.error('Error executing API node:', error);
    
    // Return error information
    return createExecutionDataFromValue({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, 'api');
  }
}