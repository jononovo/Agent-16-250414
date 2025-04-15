/**
 * List Workflows Tool
 * 
 * This tool lists workflows from the system based on filter criteria.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const listWorkflowsTool: Tool = {
  name: 'listWorkflows',
  description: 'Lists workflows in the system, optionally filtered by type or agent',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Filter workflows by type (e.g., "custom", "template")',
      },
      agentId: {
        type: 'number',
        description: 'Filter workflows by the agent they belong to',
      },
      includeInactive: {
        type: 'boolean',
        description: 'Whether to include inactive workflows in the results',
      },
    },
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { type, agentId, includeInactive = false } = params;
      
      // Get workflows from storage based on filters
      let workflows = agentId 
        ? await storage.getWorkflowsByAgentId(agentId)
        : await storage.getWorkflows(type);
      
      // Filter out inactive workflows if not explicitly requested
      if (!includeInactive) {
        workflows = workflows.filter(workflow => workflow.status !== 'inactive');
      }
      
      // Build response message based on filters
      let message = `Found ${workflows.length} workflows`;
      if (type) message += ` of type "${type}"`;
      if (agentId) message += ` for agent ID ${agentId}`;
      
      return {
        success: true,
        message,
        data: workflows,
      };
    } catch (error) {
      console.error('Error listing workflows:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error listing workflows',
      };
    }
  },
};

export default listWorkflowsTool;