/**
 * List Workflows Tool
 * 
 * This tool lists all workflows or workflows for a specific agent.
 */

import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';
import { storage } from '../../../storage';

/**
 * Tool implementation for listing workflows
 */
const listWorkflowsTool: Tool = {
  name: 'listWorkflows',
  description: 'Lists all workflows or workflows for a specific agent',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Optional type of workflows to filter by'
      },
      agentId: {
        type: 'integer',
        description: 'Optional agent ID to filter workflows by'
      }
    },
    required: []
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      let workflows;
      let agentName;
      
      // If agent ID is provided, get workflows for that agent
      if (params.agentId) {
        const agent = await storage.getAgent(params.agentId);
        if (!agent) {
          return {
            success: false,
            error: `Agent with ID ${params.agentId} not found`
          };
        }
        
        workflows = await storage.getWorkflowsByAgentId(params.agentId);
        agentName = agent.name;
      } else {
        // Otherwise get all workflows, optionally filtered by type
        workflows = await storage.getWorkflows(params.type);
      }
      
      // Generate a human-readable message
      let message = `Found ${workflows.length} workflow(s)`;
      if (agentName) {
        message += ` for agent "${agentName}"`;
      }
      if (params.type) {
        message += ` of type "${params.type}"`;
      }
      
      return {
        success: true,
        workflows,
        count: workflows.length,
        message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing workflows'
      };
    }
  }
};

// Register the tool with the registry
toolRegistry.register(listWorkflowsTool);

// Export the tool for testing or individual usage
export default listWorkflowsTool;