import {
  EnhancedNodeExecutor,
  NodeExecutionData,
  WorkflowItem,
  createExecutionDataFromValue,
  createWorkflowItem
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

interface TransformNodeData {
  transformFunction?: string;
  [key: string]: any;
}

/**
 * Transform Node Definition
 */
const transformDefinition = {
  type: 'transform',
  displayName: 'Transform',
  description: 'Transform data using JavaScript',
  icon: 'Edit',
  category: 'transform',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    default: {
      type: 'any' as const,
      displayName: 'Input',
      description: 'Input data to transform',
      required: true
    },
    transformFunction: {
      type: 'string' as const,
      displayName: 'Transform Function',
      description: 'JavaScript function to transform the data. Use the data variable to access input.',
      required: true
    }
  },
  
  // Define the outputs
  outputs: {
    default: {
      type: 'any' as const,
      displayName: 'Transformed Data',
      description: 'Result of the transformation'
    }
  }
};

/**
 * Executor for transform nodes
 * 
 * This node applies a JavaScript function to transform the input data.
 */
export const transformExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  transformDefinition,
  async (nodeData: TransformNodeData, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Get the transform function code
    const transformFunctionCode = nodeData.transformFunction || '';
    
    if (!transformFunctionCode.trim()) {
      throw new Error('No transform function provided');
    }
    
    // Get input data
    const inputData = inputs.default;
    if (!inputData || !inputData.items || inputData.items.length === 0) {
      throw new Error('No input data provided for transformation');
    }
    
    try {
      // Process each item in the input data
      const transformedItems: WorkflowItem[] = [];
      
      for (const item of inputData.items) {
        // Data to be transformed
        const data = item.json;
        
        // Create a function from the provided code
        const transformCode = `
          return (function transform(data) {
            ${transformFunctionCode}
          })(data);
        `;
        
        // Execute the transform function in a safe manner
        const transformFn = new Function('data', transformCode);
        const result = transformFn(data);
        
        // Create a new workflow item with the transformed data
        transformedItems.push(createWorkflowItem(
          result,
          'transform',
          item.binary // Pass through any binary data
        ));
      }
      
      // Return the transformed data
      return {
        items: transformedItems,
        meta: {
          startTime: inputData.meta.startTime,
          endTime: new Date(),
          itemsProcessed: transformedItems.length,
          sourceOperation: 'transform'
        }
      };
    } catch (error) {
      // Log and rethrow with a helpful message
      console.error('Error executing transform function:', error);
      throw new Error(`Error in transform function: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);