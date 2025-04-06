/**
 * Executor for the WorkflowTrigger node
 * This node allows triggering another workflow from within a workflow
 */
import { apiRequest } from '../apiClient';
import { EnhancedNodeExecutor, NodeExecutionData } from '../types/workflow';

export const workflowTriggerExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'workflow_trigger',
    displayName: 'Workflow Trigger Node',
    description: 'Triggers another workflow from within a workflow',
    icon: 'git-branch',
    category: 'Workflow',
    version: '1.0',
    inputs: {
      input: {
        type: 'any',
        displayName: 'Input',
        description: 'The input data to pass to the workflow',
        required: true
      }
    },
    outputs: {
      output: {
        type: 'any',
        displayName: 'Output',
        description: 'The response from the workflow'
      }
    }
  },
  
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    console.log('Workflow Trigger Node - Starting execution', nodeData);
    
    try {
      // Check for data directly on nodeData first (as used in the workflow definition)
      // Then fall back to the settings object for backward compatibility
      const workflowId = nodeData.workflowId || (nodeData.settings?.workflowId);
      const inputField = nodeData.inputField || nodeData.settings?.inputField || 'text';
      const timeout = nodeData.timeout || nodeData.settings?.timeout || 30000;
      
      // Validate workflow ID
      if (!workflowId) {
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
      
      // Get the input data to send to the workflow
      let inputData = '';
      let rawInputData: any = null;
      
      if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const inputItem = inputs.input.items[0].json;
        rawInputData = inputItem; // Store the raw input data for passing through
        
        // Try to extract the input from different possible input formats
        if (typeof inputItem === 'object' && inputItem !== null) {
          // Record extracted fields for logging
          const possibleFields = ['text', 'content', 'input', inputField];
          const extractedFields: Record<string, any> = {};
          
          possibleFields.forEach(field => {
            if (typeof (inputItem as any)[field] !== 'undefined') {
              extractedFields[field] = (inputItem as any)[field];
            }
          });
          
          console.log('Workflow Trigger Node - Available input fields:', extractedFields);
          
          if (typeof (inputItem as any).text === 'string') {
            inputData = (inputItem as any).text;
          } else if (typeof (inputItem as any).content === 'string') {
            inputData = (inputItem as any).content;
          } else if (typeof (inputItem as any).input === 'string') {
            inputData = (inputItem as any).input;
          } else if (typeof (inputItem as any)[inputField] === 'string') {
            inputData = (inputItem as any)[inputField];
          } else {
            // Fallback to the full object
            inputData = JSON.stringify(inputItem);
          }
        } else if (typeof inputItem === 'string') {
          inputData = inputItem;
        } else {
          inputData = String(inputItem);
        }
      }
  
      if (!inputData) {
        console.warn('Workflow Trigger Node - Empty input data, defaulting to empty string');
      }
      
      // For debugging
      console.log('Workflow Trigger Node - Input data details:', {
        inputDataType: typeof inputData,
        inputDataLength: inputData ? inputData.length : 0,
        inputDataSample: inputData ? inputData.substring(0, 50) : '',
        rawInputType: typeof rawInputData
      });
      
      console.log(`Workflow Trigger Node - Calling workflow ID: ${workflowId} with input: ${inputData.substring(0, 100)}...`);
      
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
      });
      
      try {
        // Check for circular workflow triggering
        // Get call stack from nodeData if it exists or initialize a new one
        const callStack = nodeData._callStack || [];
        
        // Check if we're trying to trigger a workflow already in the call stack (circular dependency)
        if (callStack.includes(workflowId)) {
          console.error(`Circular workflow dependency detected! Workflow ${workflowId} is already in the call stack: ${callStack.join(' -> ')}`);
          return {
            items: [
              {
                json: { 
                  error: `Circular workflow dependency detected: ${callStack.join(' -> ')} -> ${workflowId}`,
                  circularDependency: true,
                  workflowId
                }
              }
            ],
            meta: {
              startTime: new Date(),
              endTime: new Date(),
              status: 'error',
              message: `Circular workflow dependency detected: ${callStack.join(' -> ')} -> ${workflowId}`
            }
          };
        }
        
        // Add the current workflow to the call stack
        const updatedCallStack = [...callStack, workflowId];
        
        // Enhance request payload for better debugging
        const requestPayload = {
          prompt: inputData,
          _callStack: updatedCallStack, // Pass the call stack to prevent circular dependencies
          metadata: {
            source: 'workflowTriggerNode',
            sourceNodeId: nodeData.id,
            parentWorkflowId: nodeData.workflowId || 'unknown'
          }
        };

        console.log(`Workflow Trigger Node - Request payload to workflow ${workflowId}:`, 
          JSON.stringify({
            ...requestPayload,
            prompt: inputData.length > 100 ? `${inputData.substring(0, 100)}...` : inputData
          })
        );
        
        // Call the workflow through the API with a timeout race and pass the call stack
        const responsePromise = apiRequest(
          `/api/workflows/${workflowId}/trigger`,
          'POST',
          requestPayload
        );
        
        // Race between the API call and the timeout
        const response = await Promise.race([responsePromise, timeoutPromise]) as any;
        
        console.log('Workflow Trigger Node - Response received', response);
        
        const workflow = await apiRequest(`/api/workflows/${workflowId}`);
        
        // Extract critical fields from the response for easier consumption by downstream nodes
        const extractedResult = {
          result: response,
          workflowId,
          workflowName: workflow?.name || 'Unknown',
          // Extract nested response data to make it easier for downstream nodes to access
          agent: response?.agent || (response?.result?.agent ? response.result.agent : null),
          workflow: response?.workflow || (response?.result?.workflow ? response.result.workflow : null),
          output: response?.output || response?.result || response,
          status: response?.status || 'complete',
          fullResponse: response,
          _callStack: updatedCallStack // Include call stack in the output
        };
        
        console.log('Workflow Trigger Node - Extracted result:', JSON.stringify(extractedResult, null, 2));
        
        // Return a success response with all the data from the workflow response
        return {
          items: [
            {
              json: extractedResult
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
      console.error('Workflow Trigger Node - Execution error:', error);
      
      // Return error result
      return {
        items: [
          {
            json: { 
              error: error.message || 'Error in Workflow Trigger node'
            }
          }
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          status: 'error',
          message: error.message || 'Error in Workflow Trigger node'
        }
      };
    }
  }
};

export default workflowTriggerExecutor;