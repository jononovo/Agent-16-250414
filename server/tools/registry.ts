/**
 * Tool Registry
 * 
 * This file provides a central registry for all tools available to the agent.
 */

import { Tool } from './toolTypes';

/**
 * ToolRegistry class - manages the collection of tools available to the agent
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool with the registry
   * @param tool Tool to register
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name} (${tool.category})`);
  }

  /**
   * Get a specific tool by name
   * @param name Name of the tool to retrieve
   * @returns The tool, or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all active tools
   * @returns Array of all active tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values()).filter(tool => tool.active !== false);
  }

  /**
   * Get tools by category
   * @param category Category to filter by
   * @returns Array of tools in the specified category
   */
  getToolsByCategory(category: string): Tool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  /**
   * Get tool definitions in the format expected by OpenAI function calling
   * @param context Optional context to filter tools by (e.g., 'workflow-canvas')
   * @returns Array of tool definitions
   */
  getToolDefinitions(context?: string): any[] {
    let tools = this.getAllTools();
    
    // Filter tools by context if provided
    if (context) {
      // Simple context filtering - can be made more sophisticated
      if (context === 'workflow-canvas') {
        tools = tools.filter(tool => 
          tool.category === 'workflow' || 
          tool.category === 'node'
        );
      } else if (context === 'homepage') {
        tools = tools.filter(tool => 
          tool.category === 'agent' || 
          tool.category === 'platform'
        );
      }
    }
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

// Export a singleton instance
export const toolRegistry = new ToolRegistry();