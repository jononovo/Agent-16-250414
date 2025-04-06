/**
 * Link Workflow to Agent Node Executor
 * 
 * This node links an existing workflow to an agent, making the workflow
 * available as part of the agent's capabilities.
 */
import { apiRequest } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

export const linkWorkflowToAgentExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'link_workflow_to_agent',
    displayName: 'Link Workflow to Agent Node',
    description: 'Links a workflow to an agent',
    icon: 'link',
    category: 'Workflow',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'Agent and workflow IDs to link',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The result of the linking operation'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Link Workflow to Agent Node - Starting execution', nodeData);
    
    try {
      // Extract input data - could be an object with agentId and workflowId
      // or a string in format "agentId,workflowId"
      let agentId: number | undefined;
      let workflowId: number | undefined;
      
      // First check node settings (if configured in the UI)
      agentId = nodeData.agentId ? parseInt(nodeData.agentId) : undefined;
      workflowId = nodeData.workflowId ? parseInt(nodeData.workflowId) : undefined;
      
      // If not found in node settings, try to extract from input
      if (!agentId || !workflowId) {
        if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
          const inputItem = inputs.input.items[0].json;
          
          if (typeof inputItem === 'string') {
            // If input is a string, try to parse as "agentId,workflowId"
            const parts = inputItem.split(',');
            if (parts.length >= 2) {
              agentId = parseInt(parts[0].trim());
              workflowId = parseInt(parts[1].trim());
            }
          } else if (typeof inputItem === 'object' && inputItem !== null) {
            // If input is an object, try to extract agentId and workflowId properties
            if (inputItem.agentId) agentId = parseInt(inputItem.agentId);
            if (inputItem.workflowId) workflowId = parseInt(inputItem.workflowId);
            
            // Also check if they might be nested in a result property
            if (inputItem.result && typeof inputItem.result === 'object') {
              if (inputItem.result.agentId) agentId = parseInt(inputItem.result.agentId);
              if (inputItem.result.workflowId) workflowId = parseInt(inputItem.result.workflowId);
            }
          }
        }
      }
      
      // Validate input
      if (!agentId || isNaN(agentId)) {
        throw new Error('Missing or invalid agent ID');
      }
      
      if (!workflowId || isNaN(workflowId)) {
        throw new Error('Missing or invalid workflow ID');
      }
      
      console.log(`Link Workflow to Agent Node - Linking workflow ${workflowId} to agent ${agentId}`);
      
      // Update the workflow with the agent ID to create the link
      const updateData = {
        agentId: agentId
      };
      
      // Call the API to update the workflow
      const response = await apiRequest(`/api/workflows/${workflowId}`, 'PATCH', updateData);
      
      console.log('Link Workflow to Agent Node - Workflow linked successfully:', response);
      
      // Return success response
      return {
        items: [
          {
            json: {
              success: true,
              result: response,
              linkedWorkflow: workflowId,
              agentId: agentId,
              status: 'complete',
              message: `Workflow ${workflowId} linked to agent ${agentId} successfully`
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'success',
          message: `Workflow linked to agent successfully`
        }
      };
    } catch (error: any) {
      console.error('Link Workflow to Agent Node - Execution error:', error);
      
      // Return error result
      return {
        items: [
          {
            json: { 
              success: false,
              error: error.message || 'Error linking workflow to agent',
              status: 'error'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error.message || 'Error linking workflow to agent'
        }
      };
    }
  }
};

export default linkWorkflowToAgentExecutor;