/**
 * List Agents Tool
 * 
 * This tool lists agents from the system based on filter criteria.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const listAgentsTool: Tool = {
  name: 'listAgents',
  description: 'Lists agents in the system, optionally filtered by type',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Filter agents by type (e.g., "assistant", "workflow", "custom")',
      },
      includeInactive: {
        type: 'boolean',
        description: 'Whether to include inactive agents in the results',
      },
    },
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { type, includeInactive = false } = params;
      
      // Get agents from storage
      let agents = await storage.getAgents(type);
      
      // Filter out inactive agents if not explicitly requested
      if (!includeInactive) {
        agents = agents.filter(agent => agent.status !== 'inactive');
      }
      
      return {
        success: true,
        message: `Found ${agents.length} agents${type ? ` of type "${type}"` : ''}`,
        data: agents,
      };
    } catch (error) {
      console.error('Error listing agents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing agents',
      };
    }
  },
};

export default listAgentsTool;