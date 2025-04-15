/**
 * Get Agent Details Tool
 * 
 * This tool retrieves detailed information about a specific agent,
 * including associated workflows and configuration.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const getAgentDetailsTool: Tool = {
  name: 'getAgentDetails',
  description: 'Get detailed information about a specific agent',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      agentId: {
        type: 'number',
        description: 'The ID of the agent to retrieve',
      },
      includeWorkflows: {
        type: 'boolean',
        description: 'Whether to include associated workflows in the result',
        default: true
      },
      includeLogs: {
        type: 'boolean',
        description: 'Whether to include recent logs in the result',
        default: false
      },
      logLimit: {
        type: 'number',
        description: 'Maximum number of logs to include',
        default: 10
      }
    },
    required: ['agentId'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { agentId, includeWorkflows = true, includeLogs = false, logLimit = 10 } = params;
      
      // Get the agent
      const agent = await storage.getAgent(agentId);
      
      if (!agent) {
        return {
          success: false,
          error: `Agent with ID ${agentId} not found`
        };
      }
      
      // Build the response
      const result: any = {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        icon: agent.icon,
        configuration: agent.configuration || {},
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      };
      
      // Include workflows if requested
      if (includeWorkflows) {
        const workflows = await storage.getWorkflowsByAgentId(agentId);
        result.workflows = workflows.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          type: workflow.type,
          status: workflow.status,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        }));
      }
      
      // Include recent logs if requested
      if (includeLogs) {
        const logs = await storage.getLogs(agentId, logLimit);
        result.recentLogs = logs.map(log => ({
          id: log.id,
          status: log.status,
          input: log.input,
          output: log.output,
          error: log.error,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
        }));
      }
      
      return {
        success: true,
        message: `Retrieved agent details for "${agent.name}"`,
        data: result,
      };
    } catch (error) {
      console.error('Error getting agent details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting agent details',
      };
    }
  },
};

export default getAgentDetailsTool;