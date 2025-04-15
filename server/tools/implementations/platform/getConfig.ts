/**
 * Get Configuration Tool
 * 
 * This tool retrieves platform configuration information.
 */

import { Tool, ToolResult } from '../../toolTypes';
import { toolRegistry } from '../../registry';

/**
 * Tool implementation for getting platform configuration
 */
const getConfigTool: Tool = {
  name: 'getConfig',
  description: 'Retrieves platform configuration information',
  category: 'platform',
  parameters: {
    type: 'object',
    properties: {
      includeApiStatus: {
        type: 'boolean',
        description: 'Whether to include API connection status (default: true)'
      }
    },
    required: []
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const includeApiStatus = params.includeApiStatus !== false;
      
      // Generate configuration information
      const config = {
        platform: {
          version: '1.0.0',
          name: 'AI Agent Builder Platform',
          environment: process.env.NODE_ENV || 'development'
        }
      };
      
      // Add API status if requested
      if (includeApiStatus) {
        const apiStatus = {
          openai: !!process.env.OPENAI_API_KEY,
          claude: !!process.env.CLAUDE_API_KEY,
          perplexity: !!process.env.PERPLEXITY_API_KEY
        };
        
        Object.assign(config, { apiStatus });
      }
      
      return {
        success: true,
        config,
        message: 'Platform configuration retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting configuration'
      };
    }
  }
};

// Register the tool with the registry
toolRegistry.register(getConfigTool);

// Export the tool for testing or individual usage
export default getConfigTool;