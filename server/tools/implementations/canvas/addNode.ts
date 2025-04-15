/**
 * Add Node Tool
 * 
 * This tool adds a specific node type to a workflow in the canvas.
 * It validates that the requested node type exists in the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

// Define available node types - these are the only ones that should be used
// This list should match the node types available in the client/src/nodes directory
const AVAILABLE_NODE_TYPES = [
  // System node types
  'text_input',
  'claude',
  'http_request',
  'text_template',
  'data_transform',
  'decision',
  'function',
  'json_path',
  'text_prompt',
  // Other node types found in the codebase
  'json_parser',
  'csv_parser',
  'delay',
  'file_input',
  'logger',
  'api_response'
];

const addNodeTool: Tool = {
  name: 'addNode',
  description: 'Add a specific node to the current workflow in the canvas. Note: Only use existing node types, do not invent new ones.',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to add the node to',
      },
      nodeType: {
        type: 'string',
        description: 'The type of node to add. Must be one of the available node types: ' + AVAILABLE_NODE_TYPES.join(', '),
        enum: AVAILABLE_NODE_TYPES // Limit to only available types
      },
      position: {
        type: 'object',
        description: 'The position of the node in the canvas (x and y coordinates)',
        properties: {
          x: {
            type: 'number',
            description: 'The x coordinate',
          },
          y: {
            type: 'number',
            description: 'The y coordinate',
          },
        },
        required: ['x', 'y'],
      },
      data: {
        type: 'object',
        description: 'Additional data to configure the node with. Use this to customize the node behavior without inventing new node types.',
      },
    },
    required: ['workflowId', 'nodeType'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId, nodeType, position, data } = params;
      
      // Validate the node type exists
      if (!AVAILABLE_NODE_TYPES.includes(nodeType)) {
        return {
          success: false,
          error: `Invalid node type: "${nodeType}". You must use one of the available node types: ${AVAILABLE_NODE_TYPES.join(', ')}`,
        };
      }
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`,
        };
      }
      
      // Create a new node
      const newNode = await storage.createNode({
        workflowId,
        name: `${nodeType}_${Date.now()}`, // Generate a name using the nodeType and timestamp
        type: nodeType,
        category: 'workflow', // Default category
        isCustom: false,
        version: '1.0.0',
        position: position || { x: 100, y: 100 }, // Default position if not provided
        data: data || {},
        connections: [],
      });
      
      return {
        success: true,
        message: `Node ${newNode.id} (${nodeType}) added to workflow ${workflowId}`,
        data: newNode,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default addNodeTool;