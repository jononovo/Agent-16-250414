/**
 * Create Reaction Tool
 * 
 * This tool allows the agent to react to a message or action with feedback.
 * It's useful for providing structured responses to user actions.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';
import { InsertLog } from '@shared/schema';

const createReactionTool: Tool = {
  name: 'createReaction',
  description: 'Create a reaction to a message or action with structured feedback',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The ID of the message to react to (can be a logId from the system)',
      },
      type: {
        type: 'string',
        description: 'The type of reaction (success, warning, error, info)',
        enum: ['success', 'warning', 'error', 'info']
      },
      content: {
        type: 'string',
        description: 'The reaction content or message',
      },
      suggestions: {
        type: 'array',
        description: 'List of suggested actions or next steps',
        items: {
          type: 'string'
        },
        default: []
      },
      agentId: {
        type: 'number',
        description: 'The ID of the agent creating the reaction',
      }
    },
    required: ['type', 'content'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { messageId, type, content, suggestions = [], agentId } = params;
      
      // Create a new log entry for this reaction
      const logEntry: InsertLog = {
        agentId: agentId || undefined,
        status: type,
        input: {
          messageId,
          reactionType: type,
        },
        output: {
          content,
          suggestions
        },
        executionPath: {
          source: 'agent_coordinator',
          messageType: 'agent_reaction',
          reactionType: type,
          timestamp: new Date()
        }
      };
      
      const log = await storage.createLog(logEntry);
      
      return {
        success: true,
        message: `Created ${type} reaction`,
        data: {
          reactionId: log.id,
          type,
          content,
          suggestions,
          timestamp: new Date()
        },
      };
    } catch (error) {
      console.error('Error creating reaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating reaction',
      };
    }
  },
};

export default createReactionTool;