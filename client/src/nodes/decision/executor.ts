/**
 * Decision Node Executor
 * 
 * This executor evaluates conditional logic and routes data flow.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the shape of the node's data
export interface DecisionNodeData {
  condition: string;
}

/**
 * Extract data from standardized input format
 */
function extractInputValue(input: NodeExecutionData | any): any {
  // If input follows standardized format
  if (input && input.items && input.items.length > 0) {
    return input.items[0].json;
  }
  // Return the input itself for backward compatibility
  return input;
}

/**
 * Execute the decision node with the provided data and inputs
 */
export async function execute(
  nodeData: DecisionNodeData, 
  inputs: Record<string, NodeExecutionData | any> = {}
): Promise<Record<string, NodeExecutionData>> {
  const { condition } = nodeData;
  
  try {
    // Extract the value from inputs using standardized format
    const rawValue = inputs.value;
    const value = extractInputValue(rawValue);
    
    if (value === undefined) {
      return {
        error: createErrorOutput('No input value provided')
      };
    }
    
    if (!condition || condition.trim() === '') {
      return {
        error: createErrorOutput('No condition provided')
      };
    }
    
    // Create and evaluate the condition expression
    const conditionFunction = new Function('value', `return ${condition};`);
    const result = conditionFunction(value);
    
    // Return the appropriate output using standardized format
    if (result) {
      return {
        true: createNodeOutput(value)
      };
    } else {
      return {
        false: createNodeOutput(value)
      };
    }
  } catch (error) {
    console.error('Error executing decision node:', error);
    return {
      error: createErrorOutput(error instanceof Error ? error.message : String(error))
    };
  }
}

export const defaultData: DecisionNodeData = {
  condition: 'value === true'
};