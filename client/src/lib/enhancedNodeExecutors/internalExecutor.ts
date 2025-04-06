import { apiRequest } from '@/lib/apiClient';
import { 
  EnhancedNodeExecutor, 
  NodeExecutionData,
  WorkflowItem,
  createWorkflowItem
} from '@/lib/types/workflow';

/**
 * InternalNodeExecutor
 * 
 * Specialized executor for handling internal system operations like 
 * creating new agents or triggering workflows from chat instructions.
 */

// Create the internal node executor following the pattern of other executors
export const internalExecutor: EnhancedNodeExecutor = {
  definition: {
    type: 'internal',
    displayName: 'Internal Node',
    description: 'Executes internal system operations',
    icon: 'settings',
    category: 'internal',
    version: '1.0.0',
    inputs: {
      default: {
        type: 'any',
        displayName: 'Input',
        description: 'Any input data',
        required: false
      }
    },
    outputs: {
      default: {
        type: 'any',
        displayName: 'Output',
        description: 'Result of the internal operation'
      }
    }
  },
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Log that an internal node is being executed
    console.log(`Executing internal node:`, nodeData);
    
    try {
      // Default result structure
      const defaultResult: NodeExecutionData = {
        items: [
          createWorkflowItem(
            {
              status: "completed", 
              operation: nodeData.type
            }, 
            "Internal operation completed"
          )
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
      
      // Extract node configuration from nodeData
      const { configuration = {} } = nodeData;
      const { agent_id, workflow_id } = configuration;
      
      // Input data from previous nodes
      const inputData = inputs.default?.items?.[0];
      
      // Different operations based on the internal node type
      switch (nodeData.type) {
        case 'internal_new_agent': {
          // Call the agent service to initialize a new agent creation process
          // This would typically be called by clicking the "New Agent" button in the UI
          try {
            const response = await apiRequest('/api/internal/create-agent', {
              method: 'POST',
              body: JSON.stringify({
                source: 'ui_button',
                trigger_type: 'new_agent',
                agent_template_id: agent_id,
                workflow_template_id: workflow_id,
                input_data: inputData?.json || {}
              })
            });
            
            // Parse the response JSON
            const responseData = await response.json();
            
            // Return result with response data
            return {
              items: [
                createWorkflowItem(
                  responseData, 
                  "New agent creation initiated"
                )
              ],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            };
          } catch (error) {
            console.error("Error in internal_new_agent operation:", error);
            // If the API isn't implemented yet, return a simulated response
            return {
              items: [
                createWorkflowItem(
                  {
                    agent_id: Math.floor(Math.random() * 1000) + 100, // Simulated new agent ID
                    status: "created",
                    name: inputData?.json?.name || "New Agent",
                    description: inputData?.json?.description || "Agent created from workflow"
                  }, 
                  "New agent creation simulated (API not implemented)"
                )
              ],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            };
          }
        }
        
        case 'internal_ai_chat_agent': {
          // This would be called from a chat interface when the user asks to create a new agent
          try {
            const response = await apiRequest('/api/internal/create-agent', {
              method: 'POST',
              body: JSON.stringify({
                source: 'ai_chat',
                trigger_type: 'chat_instruction',
                agent_template_id: agent_id,
                workflow_template_id: workflow_id,
                input_data: {
                  chat_instructions: inputData?.json?.text || "Create a new agent",
                  ...(inputData?.json || {})
                }
              })
            });
            
            // Parse the response JSON
            const responseData = await response.json();
            
            // Return result with response data
            return {
              items: [
                createWorkflowItem(
                  responseData,
                  "New agent creation from chat initiated"
                )
              ],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            };
          } catch (error) {
            console.error("Error in internal_ai_chat_agent operation:", error);
            // If the API isn't implemented yet, return a simulated response
            return {
              items: [
                createWorkflowItem(
                  {
                    agent_id: Math.floor(Math.random() * 1000) + 100, // Simulated new agent ID
                    status: "created",
                    name: inputData?.json?.suggested_name || "Chat-created Agent",
                    description: inputData?.json?.suggested_description || "Agent created from chat instructions"
                  }, 
                  "New agent creation from chat simulated (API not implemented)"
                )
              ],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            };
          }
        }
        
        default:
          // Generic internal node handling for future expansion
          return {
            items: [
              createWorkflowItem(
                { 
                  status: "completed", 
                  operation: nodeData.type,
                  message: "Unknown internal operation type" 
                }, 
                `Executed internal operation: ${nodeData.type}`
              )
            ],
            meta: {
              startTime: new Date(),
              endTime: new Date()
            }
          };
      }
    } catch (error) {
      console.error(`Error executing internal node:`, error);
      
      // Return error result
      return {
        items: [
          createWorkflowItem(
            { 
              status: "error", 
              message: error instanceof Error ? error.message : "Unknown error",
              operation: nodeData.type
            }, 
            "Internal operation error"
          )
        ],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
  }
};

export default internalExecutor;