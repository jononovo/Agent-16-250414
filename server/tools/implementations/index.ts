/**
 * Tool Implementations Index
 * 
 * This file imports and registers all tool implementations.
 */

import { Tool } from '../toolTypes';
import { toolRegistry } from '../registry';

// Import all agent tools
import createAgentTool from './agent/createAgent';
import listAgentsTool from './agent/listAgents';

// Import all workflow tools
import createWorkflowTool from './workflow/createWorkflow';
import listWorkflowsTool from './workflow/listWorkflows';

// Import all platform tools
import getConfigTool from './platform/getConfig';

// List of all available tools
export const tools: Tool[] = [
  // Agent tools
  createAgentTool,
  listAgentsTool,
  
  // Workflow tools
  createWorkflowTool,
  listWorkflowsTool,
  
  // Platform tools
  getConfigTool,
];

/**
 * Register all tools with the registry
 */
export function registerAllTools(): void {
  tools.forEach(tool => {
    // Only register if not already registered
    if (!toolRegistry.getTool(tool.name)) {
      toolRegistry.register(tool);
    }
  });
  
  console.log(`Registered ${tools.length} tools in the registry`);
}