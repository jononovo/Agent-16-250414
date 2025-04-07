/**
 * Database Operation Node Executor for Client-Centric Architecture
 * 
 * This executor handles database operations by proxying them through
 * our server API endpoints. It abstracts away the complexity of
 * working with the database directly.
 */

import { apiClient } from '../apiClient';

interface DatabaseOperationSettings {
  operation: 'get' | 'getAll' | 'create' | 'update' | 'delete';
  entityType: 'agent' | 'workflow' | 'node' | 'log';
  entityId?: number;
  useInputAsId?: boolean;
  useInputAsData?: boolean;
  data?: Record<string, any>;
}

/**
 * Executes a database operation node
 * 
 * @param nodeData - The node configuration data
 * @param input - The input data to the node
 * @returns The result of the database operation
 */
export async function executeDatabaseOperationNode(nodeData: any, input: any): Promise<any> {
  try {
    // Extract settings from node data
    const settings: DatabaseOperationSettings = {
      operation: nodeData.operation || 'getAll',
      entityType: nodeData.entityType || 'agent',
      entityId: nodeData.entityId,
      useInputAsId: nodeData.useInputAsId || false,
      useInputAsData: nodeData.useInputAsData || false,
      data: nodeData.data || {}
    };

    // Determine the entity ID from input if needed
    let entityId = settings.entityId;
    if (settings.useInputAsId) {
      if (typeof input === 'number') {
        entityId = input;
      } else if (typeof input === 'object' && input !== null) {
        // For the update operation, we need the ID from the input data
        if (input.id !== undefined && !isNaN(Number(input.id))) {
          entityId = Number(input.id);
        } else if (input.workflowId !== undefined && !isNaN(Number(input.workflowId))) {
          entityId = Number(input.workflowId);
        } else if (input.agentId !== undefined && !isNaN(Number(input.agentId))) {
          entityId = Number(input.agentId);
        } else if (input.nodeId !== undefined && !isNaN(Number(input.nodeId))) {
          entityId = Number(input.nodeId);
        } else if (input.logId !== undefined && !isNaN(Number(input.logId))) {
          entityId = Number(input.logId);
        }
      }
    }

    // Prepare data for create/update operations
    let data = settings.data;
    if (settings.useInputAsData && typeof input === 'object' && input !== null) {
      data = input;
    }

    // Build endpoint URL based on operation and entity type
    const baseEndpoint = `/api/${settings.entityType}s`;
    let endpoint = baseEndpoint;
    let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    // Configure the request based on the operation
    switch (settings.operation) {
      case 'get':
        if (entityId === undefined) {
          throw new Error(`Entity ID is required for get operation on ${settings.entityType}`);
        }
        endpoint = `${baseEndpoint}/${entityId}`;
        method = 'GET';
        break;

      case 'getAll':
        method = 'GET';
        break;

      case 'create':
        method = 'POST';
        break;

      case 'update':
        if (entityId === undefined) {
          throw new Error(`Entity ID is required for update operation on ${settings.entityType}`);
        }
        endpoint = `${baseEndpoint}/${entityId}`;
        method = 'PATCH';
        break;

      case 'delete':
        if (entityId === undefined) {
          throw new Error(`Entity ID is required for delete operation on ${settings.entityType}`);
        }
        endpoint = `${baseEndpoint}/${entityId}`;
        method = 'DELETE';
        break;

      default:
        throw new Error(`Unsupported database operation: ${settings.operation}`);
    }

    // Execute the request
    let response;
    switch (method) {
      case 'GET':
        response = await apiClient.get(endpoint);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data);
        break;
      case 'PATCH':
        response = await apiClient.patch(endpoint, data);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint);
        break;
    }

    return response;
  } catch (error) {
    console.error('Database operation error:', error);
    
    // Return a structured error response
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown database operation error',
      details: error
    };
  }
}