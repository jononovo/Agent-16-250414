/**
 * Suggest Actions Tool
 * 
 * This tool allows the agent to suggest possible actions to the user
 * based on their request, context, and system capabilities.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';

const suggestActionsTool: Tool = {
  name: 'suggestActions',
  description: 'Suggest possible actions to the user based on their request and available capabilities',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The user query or request to generate suggestions for',
      },
      context: {
        type: 'string',
        description: 'The context in which suggestions are being made (e.g., homepage, workflow, analytics)',
        default: 'default'
      },
      maxSuggestions: {
        type: 'number',
        description: 'Maximum number of suggestions to return',
        default: 3
      }
    },
    required: ['query'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { query, context = 'default', maxSuggestions = 3 } = params;
      
      // Get available tools for this context
      const availableTools = toolRegistry.getToolsByContext(context);
      
      // For now, just return basic suggestions based on available tools
      // In a real system, this would use NLP to match the query to relevant tools
      const suggestions = availableTools
        .slice(0, maxSuggestions)
        .map((tool: any) => {
          return {
            toolName: tool.name,
            description: tool.description,
            suggestion: `I can help you ${tool.description.toLowerCase()}. Would you like me to do this?`
          };
        });
      
      return {
        success: true,
        message: `Generated ${suggestions.length} suggestions based on user query`,
        data: {
          query,
          context,
          suggestions
        },
      };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating suggestions',
      };
    }
  },
};

export default suggestActionsTool;