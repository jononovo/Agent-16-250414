/**
 * Get Configuration Tool
 * 
 * This tool retrieves platform configuration information.
 */
import { Tool, ToolResult } from '../../toolTypes';

const getConfigTool: Tool = {
  name: 'getConfig',
  description: 'Gets platform configuration information',
  category: 'platform',
  
  async execute(params: any): Promise<ToolResult> {
    try {
      // Get API keys (masked for security)
      const config = {
        // Check for environment variables and create masked versions
        openaiApiKey: process.env.OPENAI_API_KEY ? '****' + process.env.OPENAI_API_KEY.slice(-4) : null,
        claudeApiKey: process.env.CLAUDE_API_KEY ? '****' + process.env.CLAUDE_API_KEY.slice(-4) : null,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY ? '****' + process.env.PERPLEXITY_API_KEY.slice(-4) : null,
      };
      
      // Check for API keys to determine status
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasClaude = !!process.env.CLAUDE_API_KEY;
      const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
      
      // Generate message based on available APIs
      let message = 'Platform configuration:';
      if (hasOpenAI) message += ' OpenAI API configured.';
      if (hasClaude) message += ' Claude API configured.';
      if (hasPerplexity) message += ' Perplexity API configured.';
      if (!hasOpenAI && !hasClaude && !hasPerplexity) {
        message += ' No API keys configured.';
      }
      
      return {
        success: true,
        message,
        data: {
          config,
          hasOpenAI,
          hasClaude,
          hasPerplexity
        },
      };
    } catch (error) {
      console.error('Error getting configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting configuration',
      };
    }
  },
};

export default getConfigTool;