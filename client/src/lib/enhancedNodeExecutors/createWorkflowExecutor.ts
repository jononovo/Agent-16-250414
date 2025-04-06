/**
 * Create Workflow Node Executor
 * 
 * This node creates a new workflow in the system using the provided input data.
 * It provides a proper separation of concerns for workflow creation operations.
 */
import { apiRequest } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

export const createWorkflowExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'create_workflow',
    displayName: 'Create Workflow Node',
    description: 'Creates a new workflow in the system',
    icon: 'git-branch',
    category: 'Workflow',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'Workflow data or name to use for creation',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The created workflow data'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Create Workflow Node - Starting execution', nodeData);
    
    try {
      // Extract input data
      let inputData = '';
      let workflowData: Record<string, any> = {};
      
      if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const inputItem = inputs.input.items[0].json;
        
        if (typeof inputItem === 'string') {
          // If input is a string, use it as the workflow name
          workflowData = { name: inputItem };
        } else if (typeof inputItem === 'object' && inputItem !== null) {
          // If input is an object, use it as workflow data
          workflowData = inputItem;
        }
      }
      
      if (Object.keys(workflowData).length === 0) {
        workflowData = { name: 'New Workflow' };
      }
      
      // Extract workflow properties with defaults
      const name = workflowData.name || nodeData.defaultName || 'New Workflow';
      const description = workflowData.description || nodeData.defaultDescription || 'Created by Create Workflow Node';
      const type = workflowData.type || nodeData.defaultType || 'custom';
      const icon = workflowData.icon || nodeData.defaultIcon || 'git-branch';
      
      // Create workflow data for API request
      const createData = {
        name,
        description,
        type,
        status: 'active',
        icon,
        flowData: JSON.stringify({ nodes: [], edges: [] }) // Empty workflow structure
      };
      
      console.log('Create Workflow Node - Creating workflow with data:', createData);
      
      // Call the API to create the workflow
      const response = await apiRequest('/api/workflows', 'POST', createData);
      
      console.log('Create Workflow Node - Workflow created successfully:', response);
      
      // Return success response with created workflow data
      return {
        items: [
          {
            json: {
              success: true,
              workflow: response,
              status: 'complete',
              message: `Workflow "${name}" created successfully`
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'success',
          message: `Workflow "${name}" created successfully`
        }
      };
    } catch (error: any) {
      console.error('Create Workflow Node - Execution error:', error);
      
      // Return error result
      return {
        items: [
          {
            json: { 
              success: false,
              error: error.message || 'Error creating workflow',
              status: 'error'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error.message || 'Error creating workflow'
        }
      };
    }
  }
};

export default createWorkflowExecutor;