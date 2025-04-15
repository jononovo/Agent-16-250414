/**
 * Data Transform Node Executor
 * 
 * This executor applies JavaScript transformations to data.
 */

import { createNodeOutput, createErrorOutput } from '../../lib/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the shape of a transformation
export interface Transformation {
  name: string;
  expression: string;
  enabled: boolean;
}

// Define the shape of the node's data
export interface DataTransformNodeData {
  transformations: Transformation[];
}

/**
 * Execute the data transform node with the provided data and inputs
 */
export async function execute(
  nodeData: DataTransformNodeData, 
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const { transformations } = nodeData;
  
  try {
    // Extract input data from standardized format
    let inputData;
    
    // If input exists and follows our standardized format
    if (inputs.data && inputs.data.items && inputs.data.items.length > 0) {
      // Get the first item's json content
      inputData = inputs.data.items[0].json;
    } else {
      // Fallback for compatibility
      inputData = inputs.data;
    }
    
    if (inputData === undefined) {
      return createErrorOutput('No input data provided');
    }
    
    if (!transformations || transformations.length === 0) {
      // Return the input data with a warning
      return createNodeOutput(inputData);
    }
    
    // Apply each enabled transformation in sequence
    let currentData = inputData;
    const enabledTransformations = transformations.filter(t => t.enabled);
    
    for (const transform of enabledTransformations) {
      try {
        // Create a function from the expression string
        const transformFunction = new Function('data', transform.expression);
        
        // Execute the transformation
        currentData = transformFunction(currentData);
        
      } catch (transformError) {
        // Return error with data up to the point of failure
        return createErrorOutput(
          `Error in transformation "${transform.name}": ${
            transformError instanceof Error ? transformError.message : String(transformError)
          }`
        );
      }
    }
    
    // Return the transformed data in standardized format
    return createNodeOutput(currentData);
  } catch (error) {
    console.error('Error executing data transform:', error);
    return createErrorOutput(
      error instanceof Error ? error.message : String(error)
    );
  }
}

export const defaultData: DataTransformNodeData = {
  transformations: [
    {
      name: "Default Transform",
      expression: "return data;",
      enabled: true
    }
  ]
};