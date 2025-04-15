/**
 * Tool Implementations Index
 * 
 * This file imports and registers all tool implementations.
 */
import { Tool } from '../toolTypes';
import { toolRegistry } from '../registry';

// Import individual tools
import createAgentTool from './agent/createAgent';
import listAgentsTool from './agent/listAgents';
import createWorkflowTool from './workflow/createWorkflow';
import listWorkflowsTool from './workflow/listWorkflows';
import getConfigTool from './platform/getConfig';

// All available tools
export const tools: Tool[] = [
  createAgentTool,
  listAgentsTool,
  createWorkflowTool,
  listWorkflowsTool,
  getConfigTool
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