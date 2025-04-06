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
      // Process the input data - extract the name and description if they were provided directly
      const inputData = context.inputData || {};
      const name = inputData.name || inputData.json?.name || '';
      const description = inputData.description || inputData.json?.description || '';
      
      // Log what's happening for debugging
      console.log(`Internal trigger node - ID: ${nodeData.id}, Type: ${nodeType}, Input: ${JSON.stringify(inputData, null, 2)}`);
      
      // Only respond to one trigger node within a workflow to avoid circular references
      // If this is an internal_new_agent, prioritize it, otherwise check nodeId for specifics
      if (nodeType === 'internal_new_agent' || nodeData.id === 'internal_new_agent-1') {
        console.log(`Activating trigger node ${nodeData.id}`);
        return {
          status: 'success',
          output: createExecutionDataFromValue({
            trigger_type: nodeType,
            timestamp: new Date().toISOString(),
            name,
            description,
            ...inputData // Pass any additional input data to the next node
          }, 'internal_trigger')
        };
      } else {
        // Not the primary trigger for this workflow
        console.log(`Skipping trigger node ${nodeData.id} (not primary)`);
        return {
          status: 'skipped',
          output: createExecutionDataFromValue({
            _skipped: true,
            _info: 'Multiple trigger nodes detected, this secondary trigger was skipped'
          }, 'internal_trigger_skipped')
        };
      }
    }
    
    // Action nodes that perform actual operations
    // Get settings from the node data
    const settings = nodeData.data?.settings || {};
    const actionType = settings.action_type || 'unknown';
    
    // Handle different action types
    switch (actionType) {
      case 'create_agent': {
        // Get agent data from the input - support both direct and nested json format
        const inputData = context.inputData || {};
        
        // First try to get data directly from the context
        let name = inputData.name || '';
        let description = inputData.description || '';
        
        // If not found, try to get from json property
        if (!name && inputData.json?.name) {
          name = inputData.json.name;
        }
        
        if (!description && inputData.json?.description) {
          description = inputData.json.description;
        }
        
        // If still no name, use default
        if (!name) {
          name = 'New Agent';
        }
        
        // Use either the description or a default
        if (!description) {
          description = 'A new agent created by workflow';
        }
        
        const agentData = {
          name,
          description,
          type: inputData.type || inputData.json?.type || 'custom',
          icon: inputData.icon || inputData.json?.icon || 'user-plus'
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