/**
 * JSON Parser Node Executor
 * 
 * This file contains the logic for executing the JSON parser node.
 * It takes a JSON string input and returns a parsed JavaScript object.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '../../../lib/types/workflow';

// Interface for JSON parser node configuration
interface JSONParserNodeData {
  returnErrorObject?: boolean;
}

/**
 * Extract string from standardized input format
 */
function extractInputString(input: NodeExecutionData | any): string {
  // If input follows our standardized format
  if (input && input.items && input.items.length > 0) {
    const item = input.items[0];
    // Use the text property if available, otherwise stringify the json
    return item.text || (typeof item.json === 'string' ? item.json : JSON.stringify(item.json));
  }
  // Return the input directly for backward compatibility
  return input || '{}';
}

export const execute = async (
  nodeData: JSONParserNodeData, 
  inputs: Record<string, NodeExecutionData | any> = {}
): Promise<NodeExecutionData> => {
  try {
    // Get the input JSON string using our helper
    const rawInput = inputs?.json_string;
    const jsonString = extractInputString(rawInput);
    
    // Default settings
    const returnErrorObject = nodeData?.returnErrorObject || false;
    
    try {
      // Attempt to parse the JSON string
      const parsedData = JSON.parse(jsonString);
      
      // Return successful result in standardized format
      return createNodeOutput(parsedData);
    } catch (parseError: any) {
      // Handle JSON parsing error
      const errorMessage = `Failed to parse JSON: ${parseError.message || String(parseError)}`;
      
      if (returnErrorObject) {
        // Return both the error and null data if configured that way
        return createNodeOutput(null, {
          additionalMeta: {
            error: true,
            errorMessage
          }
        });
      } else {
        // Otherwise, return a proper error output
        return createErrorOutput(errorMessage);
      }
    }
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Error in JSON parser node:', error);
    return createErrorOutput(error.message || 'Error processing JSON parser');
  }
};