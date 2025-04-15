/**
 * Create Agent Tool
 * 
 * This tool creates a new agent in the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const createAgentTool: Tool = {
  name: 'createAgent',
  description: 'Creates a new agent with the specified name and properties',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the agent',
      },
      description: {
        type: 'string',
        description: 'A description of the agent',
      },
      type: {
        type: 'string',
        description: 'The type of agent (e.g., "assistant", "workflow", "custom")',
      },
      icon: {
        type: 'string',
        description: 'An icon identifier for the agent (optional)',
      },
      status: {
        type: 'string',
        description: 'The status of the agent (active, inactive, draft)',
        enum: ['active', 'inactive', 'draft'],
      },
    },
    required: ['name'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { name, description, type = 'assistant', icon, status = 'active' } = params;
      
      // Create the agent
      const agent = await storage.createAgent({
        name,
        description,
        type,
        icon,
        status,
      });
      
      return {
        success: true,
        message: `Agent "${name}" created successfully with ID ${agent.id}`,
        data: agent,
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating agent',
      };
    }
  },
};

export default createAgentTool;