/**
 * Create Agent Tool
 * 
 * This tool creates a new agent in the platform.
 */

import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';
import { storage } from '../../../storage';
import { InsertAgent } from '@shared/schema';

/**
 * Tool implementation for creating an agent
 */
const createAgentTool: Tool = {
  name: 'createAgent',
  description: 'Creates a new agent in the platform',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the agent'
      },
      description: {
        type: 'string',
        description: 'Description of the agent (optional)'
      },
      type: {
        type: 'string',
        description: 'Type of the agent (default: custom)'
      },
      icon: {
        type: 'string',
        description: 'Icon for the agent (default: brain)'
      },
      status: {
        type: 'string',
        description: 'Initial status of the agent (default: active)',
        enum: ['active', 'inactive', 'draft']
      }
    },
    required: ['name']
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      // Prepare the agent data
      const agentData: InsertAgent = {
        name: params.name,
        description: params.description || '',
        type: params.type || 'custom',
        icon: params.icon || 'brain',
        status: params.status || 'active'
      };
      
      // Create the agent
      const agent = await storage.createAgent(agentData);
      
      return {
        success: true,
        agent,
        message: `Created agent "${params.name}" successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating agent'
      };
    }
  }
};

// Register the tool with the registry
toolRegistry.register(createAgentTool);

// Export the tool for testing or individual usage
export default createAgentTool;