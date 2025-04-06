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
      
      // Check for special flags from the routes.ts workflow trigger system
      const isPreferredTrigger = inputData?._preferredTrigger || false;
      const isIgnoredTrigger = inputData?._ignoreTrigger || false;
      
      // Check for metadata to determine if we should use the ai_chat trigger
      const metadata = inputData?.metadata || {};
      const source = metadata.source || '';
      const isAiChatSource = source === 'ai_chat';
      
      // Get workflow input if available
      const workflowInput = inputData?._workflowInput || {};
      const prompt = workflowInput.prompt || '';
      
      // Log what's happening for debugging
      console.log(`Internal trigger node - ID: ${nodeData.id}, Type: ${nodeType}, Preferred: ${isPreferredTrigger}, Ignored: ${isIgnoredTrigger}, Source: ${source}`);
      console.log(`Input data for ${nodeData.id}:`, JSON.stringify(inputData, null, 2));
      
      // For trigger nodes in the same workflow, we need to propagate the data even if they're "ignored"
      // This allows the workflow to continue with other nodes
      if (isIgnoredTrigger) {
        console.log(`Ignored node ${nodeData.id} - passing data through for workflow continuity`);
        return {
          status: 'success',
          output: createExecutionDataFromValue({
            trigger_type: nodeType,
            timestamp: new Date().toISOString(),
            name,
            description,
            source,
            prompt,
            _isSecondaryTrigger: true, // Mark this as a secondary trigger
            ...inputData  // Pass along all the input data to ensure nodes have what they need
          }, 'internal_trigger')
        };
      }
      
      // If this node is explicitly preferred, activate it
      if (isPreferredTrigger) {
        console.log(`Activating preferred trigger node ${nodeData.id}`);
        return {
          status: 'success',
          output: createExecutionDataFromValue({
            trigger_type: nodeType,
            timestamp: new Date().toISOString(),
            name,
            description,
            source,
            prompt,
            ...inputData, // Pass any additional input data to the next node
          }, 'internal_trigger')
        };
      }
      
      // If source is ai_chat, activate internal_ai_chat_agent node types only
      if (isAiChatSource) {
        if (nodeData.type === 'internal_ai_chat_agent' || nodeData.id === 'internal_ai_chat_agent-1') {
          console.log(`Activating AI chat agent trigger node ${nodeData.id} for source: ${source}`);
          return {
            status: 'success',
            output: createExecutionDataFromValue({
              trigger_type: nodeType,
              timestamp: new Date().toISOString(),
              name,
              description,
              source,
              prompt,
              ...inputData // Pass any additional input data to the next node
            }, 'internal_trigger')
          };
        } else {
          // Not the right node type for AI chat source
          console.log(`Skipping trigger node ${nodeData.id} for AI chat source (not matching type)`);
          return {
            status: 'success', // Changed from 'skipped' to 'success' to prevent workflow engine errors 
            output: createExecutionDataFromValue({
              _skipped: true,
              _info: 'AI chat source requires internal_ai_chat_agent node type'
            }, 'internal_trigger_skipped')
          };
        }
      }
      
      // For UI-triggered new agent creation, use internal_new_agent node types
      if (!isAiChatSource) {
        if (nodeData.type === 'internal_new_agent' || nodeData.id === 'internal_new_agent-1') {
          console.log(`Activating new agent UI trigger node ${nodeData.id}`);
          return {
            status: 'success',
            output: createExecutionDataFromValue({
              trigger_type: nodeType,
              timestamp: new Date().toISOString(),
              name,
              description,
              source: 'ui_button', // Explicitly set source for UI trigger
              prompt,
              ...inputData // Pass any additional input data to the next node
            }, 'internal_trigger')
          };
        } else {
          // Not the right node type for UI source
          console.log(`Skipping trigger node ${nodeData.id} for UI source (not matching type)`);
          return {
            status: 'success', // Changed from 'skipped' to 'success' to prevent workflow engine errors
            output: createExecutionDataFromValue({
              _skipped: true,
              _info: 'UI source requires internal_new_agent node type'
            }, 'internal_trigger_skipped')
          };
        }
      }
      
      // Default case - if we get here, it means no specific rule matched
      // We'll succeed with a skipped marker to prevent workflow engine errors
      console.log(`No specific rule matched for trigger node ${nodeData.id}, marking as skipped`);
      return {
        status: 'success', // To prevent workflow engine errors
        output: createExecutionDataFromValue({
          _skipped: true,
          _info: 'No matching trigger rule'
        }, 'internal_trigger_skipped')
      };
    }
    
    // Action nodes that perform actual operations
    // Get settings from the node data
    const settings = nodeData.data?.settings || {};
    const actionType = settings.action_type || 'unknown';
    
    // Handle different action types
    switch (actionType) {
      case 'create_agent': {
        // Get agent data from the input - support various data formats
        const inputData = context.inputData || {};
        console.log('Create Agent Action - Raw Input:', JSON.stringify(inputData, null, 2));
        
        // Try to extract data from all possible locations
        // Sometimes the Claude node gives data in a nested structure that needs parsing
        let name = '';
        let description = '';
        let type = 'custom';
        let icon = 'user-plus';
        
        // Attempt direct access to properties
        if (inputData.name) name = inputData.name;
        if (inputData.description) description = inputData.description;
        if (inputData.type) type = inputData.type;
        if (inputData.icon) icon = inputData.icon;
        
        // Try nested json property
        if (inputData.json) {
          if (inputData.json.name && !name) name = inputData.json.name;
          if (inputData.json.description && !description) description = inputData.json.description;
          if (inputData.json.type && !type) type = inputData.json.type;
          if (inputData.json.icon && !icon) type = inputData.json.icon;
        }
        
        // Try content property (Claude often outputs this)
        if (inputData.content) {
          try {
            // Try to parse as JSON
            const contentObj = JSON.parse(inputData.content);
            if (contentObj.name && !name) name = contentObj.name;
            if (contentObj.description && !description) description = contentObj.description;
            if (contentObj.type && !type) type = contentObj.type;
            if (contentObj.icon && !icon) icon = contentObj.icon;
          } catch (e) {
            // Content isn't JSON, might be a descriptive string
            // Extract name and description using regex if possible
            const nameMatch = inputData.content.match(/name[:\s]+"([^"]+)"/i) || 
                            inputData.content.match(/name[:\s]+(.+)[\n\r]/i);
            if (nameMatch && nameMatch[1] && !name) {
              name = nameMatch[1].trim();
            }
            
            const descMatch = inputData.content.match(/description[:\s]+"([^"]+)"/i) || 
                            inputData.content.match(/description[:\s]+(.+)[\n\r]/i);
            if (descMatch && descMatch[1] && !description) {
              description = descMatch[1].trim();
            }
          }
        }
        
        // Look for claude-specific output format
        if (inputData.json?.content) {
          try {
            // Sometimes claude gives JSON inside json.content 
            const claudeObj = JSON.parse(inputData.json.content);
            if (claudeObj.name && !name) name = claudeObj.name;
            if (claudeObj.description && !description) description = claudeObj.description;
            if (claudeObj.type && !type) type = claudeObj.type;
            if (claudeObj.icon && !icon) icon = claudeObj.icon;
          } catch (e) {
            // Not parseable JSON
          }
        }
        
        // If still no name, use default
        if (!name) {
          name = 'New Agent';
        }
        
        // Use either the description or a default
        if (!description) {
          description = 'A new agent created by workflow';
        }
        
        // Construct the final agent data
        const agentData = {
          name,
          description,
          type,
          icon
        };
        
        console.log('Create Agent Action - Extracted Agent Data:', JSON.stringify(agentData, null, 2));
        
        // Create the agent via API
        try {
          const response = await apiPost('/api/agents', agentData);
          const responseData = await response.json();
          console.log('Create Agent Action - API Response:', JSON.stringify(responseData, null, 2));
          
          return {
            status: 'success',
            output: createExecutionDataFromValue({
              action: 'create_agent',
              result: 'success',
              agent: responseData,
              agentData // Include the original extracted data for debugging
            }, 'internal_action')
          };
        } catch (error) {
          console.error('Error creating agent:', error);
          console.error('Failed agent data:', agentData);
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