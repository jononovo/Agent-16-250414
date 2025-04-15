/**
 * Create Workflow Tool
 * 
 * This tool creates a new workflow in the platform, optionally linked to an agent.
 */

import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';
import { storage } from '../../../storage';
import { InsertWorkflow } from '@shared/schema';

/**
 * Tool implementation for creating a workflow
 */
const createWorkflowTool: Tool = {
  name: 'createWorkflow',
  description: 'Creates a new workflow, optionally linked to an agent',
  category: 'workflow',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the workflow'
      },
      description: {
        type: 'string',
        description: 'Description of the workflow (optional)'
      },
      agentId: {
        type: 'integer',
        description: 'ID of an agent to link this workflow to (optional)'
      },
      type: {
        type: 'string',
        description: 'Type of workflow (default: custom)'
      }
    },
    required: ['name']
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      // Check if agentId is valid if provided
      if (params.agentId) {
        const agent = await storage.getAgent(params.agentId);
        if (!agent) {
          return {
            success: false,
            error: `Agent with ID ${params.agentId} not found`
          };
        }
      }
      
      // Prepare the workflow data
      const workflowData: InsertWorkflow = {
        name: params.name,
        description: params.description || '',
        agentId: params.agentId || null,
        type: params.type || 'custom',
        status: 'active',
        flowData: { nodes: [], edges: [] } // Start with an empty workflow
      };
      
      // Create the workflow
      const workflow = await storage.createWorkflow(workflowData);
      
      // Get agent info if we linked to an agent
      let agentInfo = null;
      if (params.agentId) {
        const agent = await storage.getAgent(params.agentId);
        if (agent) {
          agentInfo = {
            id: agent.id,
            name: agent.name
          };
        }
      }
      
      return {
        success: true,
        workflow,
        agent: agentInfo,
        message: `Created workflow "${params.name}" successfully${
          agentInfo ? ` and linked it to agent "${agentInfo.name}"` : ''
        }`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating workflow'
      };
    }
  }
};

// Register the tool with the registry
toolRegistry.register(createWorkflowTool);

// Export the tool for testing or individual usage
export default createWorkflowTool;