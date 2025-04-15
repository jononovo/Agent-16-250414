/**
 * List Agents Tool
 * 
 * This tool lists all agents or filters them by type or status.
 */

import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';
import { storage } from '../../../storage';

/**
 * Tool implementation for listing agents
 */
const listAgentsTool: Tool = {
  name: 'listAgents',
  description: 'Lists all agents or agents of a specific type or status',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Optional type of agents to filter by'
      },
      status: {
        type: 'string',
        description: 'Optional status to filter by (active, inactive, draft)'
      }
    },
    required: []
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      // Get all agents, optionally filtered by type
      const agents = await storage.getAgents(params.type);
      
      // Filter by status if provided
      let filteredAgents = agents;
      if (params.status) {
        filteredAgents = agents.filter(agent => 
          agent.status === params.status
        );
      }
      
      // Generate a human-readable message
      let message = `Found ${filteredAgents.length} agent(s)`;
      if (params.type && params.status) {
        message += ` of type "${params.type}" with status "${params.status}"`;
      } else if (params.type) {
        message += ` of type "${params.type}"`;
      } else if (params.status) {
        message += ` with status "${params.status}"`;
      }
      
      return {
        success: true,
        agents: filteredAgents,
        count: filteredAgents.length,
        message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing agents'
      };
    }
  }
};

// Register the tool with the registry
toolRegistry.register(listAgentsTool);

// Export the tool for testing or individual usage
export default listAgentsTool;