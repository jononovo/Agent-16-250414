/**
 * Database Operation Node Executor
 * 
 * This executor handles database operations through API calls.
 * It provides a standardized way to interact with the database
 * from client-side workflows, while maintaining proper security.
 */

import { NodeExecutionData, createExecutionDataFromValue } from "../types/workflow";
import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient";

// Supported operation types
type DatabaseOperation = 'get' | 'getAll' | 'create' | 'update' | 'delete';

// Supported entity types
type EntityType = 'agent' | 'workflow' | 'node' | 'log';

/**
 * Executes a database operation node
 * 
 * @param nodeData Node configuration
 * @param inputs Input data from previous nodes
 * @returns Execution data with operation results
 */
export default async function executeDatabaseOperationNode(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData>
): Promise<NodeExecutionData> {
  try {
    // Get inputs
    const inputData = inputs.default || Object.values(inputs)[0];
    if (!inputData) {
      throw new Error('No input data provided');
    }
    
    // Get operation configuration
    const operation: DatabaseOperation = nodeData.operation || 'get';
    const entityType: EntityType = nodeData.entityType || 'agent';
    const useInputAsId = nodeData.useInputAsId || false;
    
    // Get ID from input data or node configuration
    let id = nodeData.entityId;
    if (useInputAsId && inputData.items && inputData.items[0]) {
      const inputItem = inputData.items[0];
      if (typeof inputItem.json === 'object' && inputItem.json.id) {
        id = inputItem.json.id;
      } else if (typeof inputItem.json === 'number' || typeof inputItem.json === 'string') {
        id = inputItem.json;
      }
    }

    // Prepare data for create/update operations
    let data = nodeData.data || {};
    if (nodeData.useInputAsData && inputData.items && inputData.items[0]) {
      const inputItem = inputData.items[0];
      if (typeof inputItem.json === 'object') {
        data = { ...data, ...inputItem.json };
      }
    }
    
    console.log(`Executing database operation: ${operation} on ${entityType}${id ? ` with ID ${id}` : ''}`);
    
    // Construct API endpoint
    const baseEndpoint = `/api/${entityType}s`;
    let endpoint = baseEndpoint;
    if (id && operation !== 'getAll') {
      endpoint = `${baseEndpoint}/${id}`;
    }
    
    // Execute operation
    let result;
    switch (operation) {
      case 'get':
        result = await apiGet(endpoint);
        break;
      case 'getAll':
        result = await apiGet(endpoint);
        break;
      case 'create':
        result = await apiPost(endpoint, data);
        break;
      case 'update':
        result = await apiPatch(endpoint, data);
        break;
      case 'delete':
        result = await apiDelete(endpoint);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    // Return result
    return createExecutionDataFromValue({
      success: true,
      operation,
      entityType,
      data: result
    }, 'database_operation');
  } catch (error) {
    console.error('Error executing database operation node:', error);
    
    // Return error information
    return createExecutionDataFromValue({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, 'database_operation');
  }
}