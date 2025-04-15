/**
 * Agent Coordinator Service
 * 
 * This service coordinates the interaction between user inputs and the appropriate tools.
 * It uses OpenAI's function calling to determine which tools to execute.
 */

import OpenAI from 'openai';
import { toolRegistry } from '../tools/registry';
import { storage } from '../storage';
import { InsertLog } from '@shared/schema';

interface ProcessOptions {
  context?: string;
  agentId?: number;
  userId?: number;
  sessionId?: string;
}

/**
 * Agent Coordinator class
 */
export class AgentCoordinator {
  private openai: OpenAI;
  
  /**
   * Create a new agent coordinator
   * @param apiKey OpenAI API key
   */
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  /**
   * Process a user input message and determine what action to take
   * @param input User input message
   * @param options Processing options
   * @returns Processing result
   */
  async processUserInput(
    input: string, 
    options: ProcessOptions = {}
  ): Promise<any> {
    const { context = 'general', agentId, userId, sessionId } = options;
    
    // Create log entry
    const logEntry: InsertLog = {
      agentId: agentId || 1, // Default agent ID
      workflowId: 0, // No specific workflow
      status: "running",
      input: { message: input }, // Store input as object
      output: {}, // Will be filled later
      executionPath: {
        execution_type: "agent_chat", 
        source: "user_input",
        message: `Processing user input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`,
        status: "in_progress"
      }
    };
    
    const executionLog = await storage.createLog(logEntry);
    
    try {
      // Get tool definitions based on context
      const toolDefinitions = toolRegistry.getToolDefinitions(context);
      
      // Create the messages array with system instructions
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant that helps users interact with the AI Agent Builder platform. 
                   You have access to various tools to help manage agents, workflows, and platform settings.
                   
                   Before using a tool, make sure you understand what the user wants.
                   If you're unclear, ask for clarification instead of guessing.
                   After using a tool, provide a brief explanation of what you did.
                   
                   Current context: ${context}`
        },
        { role: 'user', content: input }
      ] as Array<{ role: 'system' | 'user' | 'assistant', content: string }>;
      
      // Call the OpenAI API with function calling
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: messages as any,
        functions: toolDefinitions,
        function_call: 'auto'
      });
      
      // Get the response message
      const responseMessage = response.choices[0]?.message;
      
      if (responseMessage.function_call) {
        // Tool was called
        const functionName = responseMessage.function_call.name;
        const functionArgs = JSON.parse(responseMessage.function_call.arguments);
        
        // Find the tool
        const tool = toolRegistry.getTool(functionName);
        
        if (tool) {
          try {
            // Execute the tool
            const result = await tool.execute(functionArgs);
            
            // Update log with success
            await storage.updateLog(executionLog.id, {
              status: "completed",
              output: result,
              completedAt: new Date(),
              executionPath: {
                message: `Successfully executed tool: ${functionName}`,
                status: "completed",
                result: result
              }
            });
            
            // Create a user-friendly response
            let finalResponse = '';
            
            if (result.success) {
              finalResponse = `✅ ${result.message || 'Operation completed successfully'}`;
            } else {
              finalResponse = `❌ Error: ${result.error || 'Unknown error occurred'}`;
            }
            
            return {
              success: true,
              action: functionName,
              result: result,
              message: finalResponse,
              logId: executionLog.id
            };
          } catch (error) {
            // Handle execution error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Update log with error
            await storage.updateLog(executionLog.id, {
              status: "error",
              error: errorMessage,
              completedAt: new Date(),
              executionPath: {
                message: `Error executing tool: ${functionName}`,
                status: "error",
                error: errorMessage
              }
            });
            
            return {
              success: false,
              action: functionName,
              error: errorMessage,
              message: `Error executing ${functionName}: ${errorMessage}`,
              logId: executionLog.id
            };
          }
        } else {
          // Tool not found
          await storage.updateLog(executionLog.id, {
            status: "error",
            error: `Tool not found: ${functionName}`,
            completedAt: new Date(),
            executionPath: {
              message: `Tool not found: ${functionName}`,
              status: "error"
            }
          });
          
          return {
            success: false,
            error: `Tool not found: ${functionName}`,
            message: `I'm sorry, I tried to use a tool that doesn't exist: ${functionName}`,
            logId: executionLog.id
          };
        }
      } else {
        // Direct response (no tool call)
        await storage.updateLog(executionLog.id, {
          status: "completed",
          output: { response: responseMessage.content },
          completedAt: new Date(),
          executionPath: {
            message: `Direct response provided`,
            status: "completed"
          }
        });
        
        return {
          success: true,
          message: responseMessage.content,
          logId: executionLog.id
        };
      }
    } catch (error) {
      // Handle overall processing error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await storage.updateLog(executionLog.id, {
        status: "error",
        error: errorMessage,
        completedAt: new Date(),
        executionPath: {
          message: `Error processing user input`,
          status: "error",
          error: errorMessage
        }
      });
      
      return {
        success: false,
        error: errorMessage,
        message: `I'm sorry, an error occurred: ${errorMessage}`,
        logId: executionLog.id
      };
    }
  }
}

/**
 * Create a new agent coordinator
 * @param apiKey OpenAI API key
 * @returns A new agent coordinator instance
 */
export function createAgentCoordinator(apiKey: string): AgentCoordinator {
  return new AgentCoordinator(apiKey);
}