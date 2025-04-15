/**
 * Tool Implementations Index
 * 
 * This file imports and registers all tool implementations.
 */
import { Tool } from '../toolTypes';
import { toolRegistry } from '../registry';

// Import agent tools
import createAgentTool from './agent/createAgent';
import listAgentsTool from './agent/listAgents';
import getAgentDetailsTool from './agent/getAgentDetails';
import createReactionTool from './agent/createReaction';
import suggestActionsTool from './agent/suggestActions';
import implementTaskTool from './agent/implementTask';

// Import workflow tools
import createWorkflowTool from './workflow/createWorkflow';
import listWorkflowsTool from './workflow/listWorkflows';
import getWorkflowDetailsTool from './workflow/getWorkflowDetails';
import executeWorkflowTool from './workflow/executeWorkflow';

// Import platform tools
import getConfigTool from './platform/getConfig';
import getToolsTool from './platform/getTools';

// All available tools
export const tools: Tool[] = [
  // Agent tools
  createAgentTool,
  listAgentsTool,
  getAgentDetailsTool,
  createReactionTool,
  suggestActionsTool,
  implementTaskTool,
  
  // Workflow tools
  createWorkflowTool,
  listWorkflowsTool,
  getWorkflowDetailsTool,
  executeWorkflowTool,
  
  // Platform tools
  getConfigTool,
  getToolsTool
];

/**
 * Register all tools with the registry
 */
export function registerAllTools(): void {
  tools.forEach(tool => {
    toolRegistry.register(tool);
  });
  
  console.log(`Registered ${tools.length} tools in the registry`);
}