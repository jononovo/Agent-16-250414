/**
 * HTTP Request Node Executor
 * 
 * This file contains the execution logic for the HTTP request node.
 */

import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '../../../lib/types/workflow';

export interface HttpRequestNodeData {
  url: string;
  method: Method;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Execute the HTTP request node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: HttpRequestNodeData, inputs?: any): Promise<NodeExecutionData> => {
  try {
    // Validate required parameters
    if (!nodeData.url) {
      return createErrorOutput('URL is required');
    }
    
    // Merge headers from node data and inputs
    const headers = {
      ...(nodeData.headers || {}),
      ...(inputs?.headers || {})
    };
    
    // Prepare request configuration
    const requestConfig: AxiosRequestConfig = {
      url: nodeData.url,
      method: nodeData.method || 'GET',
      headers,
      timeout: nodeData.timeout || 10000
    };
    
    // Add body if method is not GET or HEAD
    if (
      nodeData.method &&
      !['GET', 'HEAD'].includes(nodeData.method) &&
      (nodeData.body || inputs?.body)
    ) {
      // Prefer body from inputs, fall back to nodeData body
      const requestBody = inputs?.body || nodeData.body;
      
      // If body is a string and we're sending JSON, try to parse it
      if (
        typeof requestBody === 'string' &&
        headers['Content-Type'] === 'application/json'
      ) {
        try {
          requestConfig.data = JSON.parse(requestBody);
        } catch (e) {
          // If parsing fails, send as raw string
          requestConfig.data = requestBody;
        }
      } else {
        requestConfig.data = requestBody;
      }
    }
    
    console.log(`Executing HTTP request: ${requestConfig.method} ${requestConfig.url}`);
    
    // Execute the request
    const response: AxiosResponse = await axios(requestConfig);
    
    // Process the response using standardized format
    return createNodeOutput({
      response: response,
      data: response.data,
      status: response.status,
      headers: response.headers
    });
  } catch (error: any) {
    // Handle errors with standardized format
    const errorMessage = error.message || 'Error executing HTTP request';
    console.error('HTTP request error:', errorMessage);
    
    // Create detailed error data
    const errorData = {
      message: errorMessage,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    };
    
    return createErrorOutput(errorMessage);
  }
};