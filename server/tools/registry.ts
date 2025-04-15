/**
 * Tool Registry
 * 
 * This module provides a central registry for all available tools
 * in the system. It manages tool registration, discovery, and lookup.
 */
import { Tool, ToolWithContext, ToolRegistryConfig } from './toolTypes';

/**
 * Tool Registry
 * 
 * Maintains a collection of all registered tools and provides methods
 * for registering, finding, and filtering tools.
 */
class ToolRegistry {
  private tools: Map<string, Tool>;
  private config: ToolRegistryConfig;
  
  constructor(config: ToolRegistryConfig = {}) {
    this.tools = new Map<string, Tool>();
    this.config = {
      allowDuplicates: false,
      validateTools: true,
      ...config
    };
  }
  
  /**
   * Register a tool with the registry
   * @param tool The tool to register
   * @returns True if registration was successful
   */
  register(tool: Tool): boolean {
    // Check if tool already exists
    if (this.tools.has(tool.name) && !this.config.allowDuplicates) {
      console.log(`Tool with name '${tool.name}' already exists. Overwriting.`);
    }
    
    // Validate the tool if enabled
    if (this.config.validateTools) {
      if (!tool.name || tool.name.trim() === '') {
        console.error('Tool must have a name');
        return false;
      }
      
      if (!tool.description || tool.description.trim() === '') {
        console.error(`Tool '${tool.name}' must have a description`);
        return false;
      }
      
      if (!tool.category || tool.category.trim() === '') {
        console.error(`Tool '${tool.name}' must have a category`);
        return false;
      }
      
      if (typeof tool.execute !== 'function') {
        console.error(`Tool '${tool.name}' must have an execute function`);
        return false;
      }
    }
    
    // Register the tool
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name} (${tool.category})`);
    return true;
  }
  
  /**
   * Get all registered tools
   * @returns All registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get a tool by name
   * @param name The name of the tool to find
   * @returns The tool if found, undefined otherwise
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get tools by category
   * @param category The category to filter by
   * @returns Tools in the specified category
   */
  getToolsByCategory(category: string): Tool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }
  
  /**
   * Get tools by context (if available)
   * @param context The context to filter by
   * @returns Tools applicable to the context
   */
  getToolsByContext(context: string): Tool[] {
    return this.getAllTools().filter(tool => {
      // All tools that don't specify contexts are available everywhere
      if (!(tool as ToolWithContext).contexts) {
        return true;
      }
      
      // Otherwise, check if the tool is available in this context
      return (tool as ToolWithContext).contexts?.includes(context);
    });
  }
  
  /**
   * Get tools as OpenAI function calling format
   * @param context Optional context to filter tools
   * @returns Tools in OpenAI function calling format
   */
  getToolsAsOpenAIFunctions(context?: string): any[] {
    const tools = context ? this.getToolsByContext(context) : this.getAllTools();
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {
        type: 'object',
        properties: {},
      },
    }));
  }
  
  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
  }
}

// Create and export a single instance
export const toolRegistry = new ToolRegistry();