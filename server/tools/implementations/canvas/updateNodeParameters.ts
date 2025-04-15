/**
 * Update Node Parameters Tool
 * 
 * This tool updates the parameters or editable fields of a specific node in a workflow.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const updateNodeParametersTool: Tool = {
  name: 'updateNodeParameters',
  description: 'Update the parameters or editable fields of a specific node in a workflow',
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