/**
 * Update Node Parameters Tool
 * 
 * This tool updates the parameters or editable fields of a specific node in a workflow.
 * It works with the existing node types defined in the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';
import { AVAILABLE_NODE_TYPES } from '../../../services/workflowGenerationService';

const updateNodeParametersTool: Tool = {
  name: 'updateNodeParameters',
  description: 'Update the parameters or editable fields of a specific node in a workflow. Note: When updating node type, only existing node types are allowed.',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      nodeId: {
        type: 'number',
        description: 'The ID of the node to update',
      },
      parameters: {
        type: 'object',
        description: 'The parameters or fields to update in the node data',
      },
      reason: {
        type: 'string',
        description: 'The reason for updating the parameters (optional)',
      },
    },
    required: ['nodeId', 'parameters'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { nodeId, parameters, reason } = params;
      
      // Get the node
      const node = await storage.getNode(nodeId);
      if (!node) {
        return {
          success: false,
          error: `Node with ID ${nodeId} not found`,
        };
      }
      
      // Check if trying to update type and validate if so
      if (parameters.type && !AVAILABLE_NODE_TYPES.includes(parameters.type)) {
        return {
          success: false,
          error: `Invalid node type: "${parameters.type}". Must be one of the available node types: ${AVAILABLE_NODE_TYPES.join(', ')}`,
        };
      }

      // Update the node data by merging the new parameters
      const updatedData = {
        ...node.data,
        ...parameters,
      };
      
      // Update the node
      const updatedNode = await storage.updateNode(nodeId, {
        data: updatedData,
      });
      
      if (!updatedNode) {
        return {
          success: false,
          error: `Failed to update node ${nodeId}`,
        };
      }
      
      return {
        success: true,
        message: `Node ${nodeId} parameters updated${reason ? ` (Reason: ${reason})` : ''}`,
        data: updatedNode,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update node parameters: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default updateNodeParametersTool;