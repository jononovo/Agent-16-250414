import { WorkflowData, NodeExecutionData, createExecutionDataFromValue, EnhancedNodeExecutor, InternalNodeExecutor } from '../types/workflow';
import { apiPost, apiPatch, apiDelete } from '../apiClient';

/**
 * Executor for internal system nodes
 * 
 * This executor handles nodes that interface directly with the system,
 * such as creating new agents, triggering workflows, or performing
 * other internal actions.
 */
const rawInternalExecutor: InternalNodeExecutor = async (
  nodeData: WorkflowData['nodes'][0],
  context: { inputData?: any }
): Promise<{ status: string; output?: NodeExecutionData; error?: string }> => {
  try {
    console.log(`Executing internal node: ${nodeData.id}, type: ${nodeData.type}`);
    
    // Check if this is a trigger or action node
    const nodeType = nodeData.id.split('-')[0];
    
    // For internal trigger nodes (just pass through data in test mode)
    if (nodeType.includes('trigger') || nodeType.includes('new_agent') || nodeType.includes('chat_agent') || nodeType.includes('ai_chat')) {
      return {
        status: 'success',
        output: createExecutionDataFromValue({
          trigger_type: nodeType,
          timestamp: new Date().toISOString(),
          ...context.inputData // Pass any input data to the next node
        }, 'internal_trigger')
      };
    }
    
    // Action nodes that perform actual operations
    // Get settings from the node data
    const settings = nodeData.data?.settings || {};
    const actionType = settings.action_type || 'unknown';
    
    // Handle different action types
    switch (actionType) {
      case 'create_agent': {
        // Get agent data from the input
        const inputData = context.inputData?.json || {};
        const agentData = {
          name: inputData.name || 'New Agent',
          description: inputData.description || 'A new agent created by workflow',
          type: inputData.type || 'custom',
          icon: inputData.icon || 'user'
        };
        
        // Create the agent via API
        try {
          const response = await apiPost('/api/agents', agentData);
          const responseData = await response.json();
          
          return {
            status: 'success',
            output: createExecutionDataFromValue({
              action: 'create_agent',
              result: 'success',
              agent: responseData
            }, 'internal_action')
          };
        } catch (error) {
          console.error('Error creating agent:', error);
          return {
            status: 'error',
            error: `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
      
      // Add other action types as needed
      case 'update_agent': {
        // Similar logic for updating agents
        return {
          status: 'error', 
          error: 'Update agent action not implemented yet'
        };
      }
      
      // Default case for unknown action types
      default:
        return {
          status: 'error',
          error: `Unknown internal action type: ${actionType}`
        };
    }
  } catch (error) {
    console.error('Error executing internal node:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Adapter that wraps the internal executor to match the EnhancedNodeExecutor interface
 */
export const internalExecutorAdapter: EnhancedNodeExecutor = {
  execute: async (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Convert inputs to a format the raw executor can understand
    const firstInputKey = Object.keys(inputs)[0] || 'main';
    const inputData = inputs[firstInputKey]?.items[0] || null;
    
    // Execute the raw internal executor
    const result = await rawInternalExecutor(
      nodeData as WorkflowData['nodes'][0], 
      { inputData }
    );
    
    // Return the output or create an error output
    if (result.status === 'success' && result.output) {
      return result.output;
    } else {
      return createExecutionDataFromValue({
        error: result.error || 'Unknown error in internal node executor',
        status: 'error'
      }, 'internal_error');
    }
  }
};

export default internalExecutorAdapter;