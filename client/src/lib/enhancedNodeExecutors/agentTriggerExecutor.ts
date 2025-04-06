/**
 * Executor for the AgentTrigger node
 * This node allows triggering another agent from within a workflow
 */
import { apiRequest } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

export const agentTriggerExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'agent_trigger',
    displayName: 'Agent Trigger Node',
    description: 'Triggers another agent from within a workflow',
    icon: 'refresh-cw',
    category: 'Workflow',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'The input data to pass to the agent',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The response from the agent'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Agent Trigger Node - Starting execution', nodeData);
    
    try {
      const settings = nodeData.settings || {};
      const { agentId, promptField = 'text', timeout = 30000 } = settings;
      
      // Validate agent ID
      if (!agentId) {
        console.error('Agent Trigger Node - Missing agent ID');
        return {
          items: [
            {
              json: { 
                error: 'Missing agent ID in settings'
              }
            }
          ],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            status: 'error',
            message: 'Agent ID is required'
          }
        };
      }
      
      // Get the input data to send to the agent
      let promptData = '';
      if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const inputItem = inputs.input.items[0].json;
        
        // Try to extract the prompt from different possible input formats
        if (typeof inputItem === 'object' && inputItem !== null) {
          if (typeof (inputItem as any).text === 'string') {
            promptData = (inputItem as any).text;
          } else if (typeof (inputItem as any).content === 'string') {
            promptData = (inputItem as any).content;
          } else if (typeof (inputItem as any).prompt === 'string') {
            promptData = (inputItem as any).prompt;
          } else if (typeof (inputItem as any)[promptField] === 'string') {
            promptData = (inputItem as any)[promptField];
          } else {
            // Fallback to stringifying the entire object
            promptData = JSON.stringify(inputItem);
          }
        } else if (typeof inputItem === 'string') {
          promptData = inputItem;
        } else {
          promptData = String(inputItem);
        }
      }
  
      if (!promptData) {
        console.warn('Agent Trigger Node - Empty prompt data');
      }
      
      console.log(`Agent Trigger Node - Calling agent ID: ${agentId} with prompt: ${promptData.substring(0, 100)}...`);
      
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
      });
      
      try {
        // Call the agent through the API with a timeout race
        const responsePromise = apiRequest(
          `/api/agents/${agentId}/trigger`,
          'POST',
          {
            prompt: promptData
          }
        );
        
        // Race between the API call and the timeout
        const response = await Promise.race([responsePromise, timeoutPromise]) as any;
        
        console.log('Agent Trigger Node - Response received', response);
        
        const agent = await apiRequest(`/api/agents/${agentId}`);
        
        // Return a success response with all the data from the agent response
        return {
          items: [
            {
              json: {
                result: response,
                agentId,
                agentName: agent?.name || 'Unknown',
                generatedText: response?.output || response?.content || response?.result || response,
                fullResponse: response
              }
            }
          ],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            status: 'success'
          }
        };
      } catch (error) {
        // Just rethrow the error since Promise.race handles the timeout
        throw error;
      }
    } catch (error: any) {
      console.error('Agent Trigger Node - Execution error:', error);
      
      // Return error result
      return {
        items: [
          {
            json: { 
              error: error.message || 'Error in Agent Trigger node'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error.message || 'Error in Agent Trigger node'
        }
      };
    }
  }
};

export default agentTriggerExecutor;