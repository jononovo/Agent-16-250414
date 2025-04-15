/**
 * Get Tools Tool
 * 
 * This meta-tool retrieves information about all available tools in the system.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';

const getToolsTool: Tool = {
  name: 'getTools',
  description: 'Lists all available tools, optionally filtered by category',
  category: 'platform',
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter tools by category',
        enum: ['agent', 'workflow', 'platform', 'all']
      },
      context: {
        type: 'string',
        description: 'Filter tools by context',
      },
      includeParameters: {
        type: 'boolean',
        description: 'Whether to include parameter details in the result',
        default: true
      }
    },
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { category, context, includeParameters = true } = params;
      
      // Get all tools
      let tools = toolRegistry.getAllTools();
      
      // Filter by category if provided
      if (category && category !== 'all') {
        tools = tools.filter(tool => tool.category === category);
      }
      
      // Filter by context if provided
      if (context) {
        tools = toolRegistry.getToolsByContext(context);
      }
      
      // Format the tools for the response
      const formattedTools = tools.map(tool => {
        const result: any = {
          name: tool.name,
          description: tool.description,
          category: tool.category,
        };
        
        // Include parameters if requested
        if (includeParameters && tool.parameters) {
          result.parameters = tool.parameters;
        }
        
        return result;
      });
      
      return {
        success: true,
        message: `Found ${formattedTools.length} tools${category && category !== 'all' ? ` in category "${category}"` : ''}`,
        data: formattedTools,
      };
    } catch (error) {
      console.error('Error getting tools:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting tools',
      };
    }
  },
};

export default getToolsTool;