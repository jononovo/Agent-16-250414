/**
 * Executor for the AgentTrigger node
 * This node allows triggering another agent or workflow from within a workflow
 */
import { apiRequest } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

type TriggerType = 'agent' | 'workflow';

export const agentTriggerExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'agent_trigger',
    displayName: 'Agent/Workflow Trigger Node',
    description: 'Triggers another agent or workflow from within a workflow',
    icon: 'refresh-cw',
    category: 'Workflow',
    version: '2.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'The input data to pass to the agent or workflow',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The response from the agent or workflow'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Agent/Workflow Trigger Node - Starting execution', nodeData);
    
    try {
      const settings = nodeData.settings || {};
      const { 
        triggerType = 'agent',
        agentId, 
        workflowId,
        promptField = 'text', 
        timeout = 30000 
      } = settings;
      
      // Validate based on trigger type
      if (triggerType === 'agent' && !agentId) {
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
      
      if (triggerType === 'workflow' && !workflowId) {
        console.error('Workflow Trigger Node - Missing workflow ID');
        return {
          items: [
            {
              json: { 
                error: 'Missing workflow ID in settings'
              }
            }
          ],
          meta: {
            startTime: new Date(),
            endTime: new Date(),
            status: 'error',
            message: 'Workflow ID is required'
          }
        };
      }
      
      // Get the input data to send to the agent or workflow
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
        console.warn('Trigger Node - Empty prompt data');
      }
      
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
      });
      
      try {
        let responsePromise;
        let entityInfo;
        
        // Call the appropriate API endpoint based on trigger type
        if (triggerType === 'agent') {
          console.log(`Agent Trigger - Calling agent ID: ${agentId} with prompt: ${promptData.substring(0, 100)}...`);
          
          responsePromise = apiRequest(
            `/api/agents/${agentId}/trigger`,
            'POST',
            {
              prompt: promptData
            }
          );
          
          // Get the agent info for response
          entityInfo = await apiRequest(`/api/agents/${agentId}`);
        } else {
          // Workflow trigger
          console.log(`Workflow Trigger - Calling workflow ID: ${workflowId} with prompt: ${promptData.substring(0, 100)}...`);
          
          responsePromise = apiRequest(
            `/api/workflows/${workflowId}/trigger`,
            'POST',
            {
              prompt: promptData
            }
          );
          
          // Get the workflow info for response
          entityInfo = await apiRequest(`/api/workflows/${workflowId}`);
        }
        
        // Race between the API call and the timeout
        const response = await Promise.race([responsePromise, timeoutPromise]) as any;
        
        console.log(`${triggerType === 'agent' ? 'Agent' : 'Workflow'} Trigger Node - Response received`, response);
        
        // Return a success response with all the data from the response
        if (triggerType === 'agent') {
          return {
            items: [
              {
                json: {
                  result: response,
                  agentId,
                  agentName: entityInfo?.name || 'Unknown',
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
        } else {
          return {
            items: [
              {
                json: {
                  result: response,
                  workflowId,
                  workflowName: entityInfo?.name || 'Unknown',
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
        }
      } catch (error) {
        // Just rethrow the error since Promise.race handles the timeout
        throw error;
      }
    } catch (error: any) {
      console.error('Trigger Node - Execution error:', error);
      
      // Return error result
      return {
        items: [
          {
            json: { 
              error: error.message || 'Error in Trigger node'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error.message || 'Error in Trigger node'
        }
      };
    }
  }
};

export default agentTriggerExecutor;