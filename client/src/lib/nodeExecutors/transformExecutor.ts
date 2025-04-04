import { NodeExecutor } from '../workflowEngine';

interface TransformNodeData {
  transformFunction?: string;
  [key: string]: any;
}

interface TransformNodeInput {
  default?: any;
  [key: string]: any;
}

/**
 * Executor for transform nodes
 * 
 * This node applies a JavaScript function to transform its input and produce an output.
 */
export const transformExecutor: NodeExecutor = {
  async execute(nodeData: TransformNodeData, inputs: TransformNodeInput): Promise<any> {
    // Get the input to transform
    const inputValue = inputs.default;
    
    if (inputValue === undefined) {
      throw new Error('No input provided to transform node');
    }
    
    // Get the transform function from the node data
    const transformFunctionStr = nodeData.transformFunction;
    
    if (!transformFunctionStr) {
      throw new Error('No transform function defined for transform node');
    }
    
    try {
      // Create a function from the string
      // Format expected: "function transform(input) { ... return output; }"
      const transformFunctionBody = transformFunctionStr.trim();
      
      // Extract function body
      let functionBody = transformFunctionBody;
      
      // If it's defined as a named function, extract the body
      if (transformFunctionBody.startsWith('function transform')) {
        const match = transformFunctionBody.match(/\{([\s\S]*)\}/);
        if (match && match[1]) {
          functionBody = match[1].trim();
        }
      }
      
      // Create a new function with the extracted body
      const transform = new Function('input', functionBody);
      
      // Execute the transform function with the input
      const result = transform(inputValue);
      
      return result;
    } catch (error) {
      console.error('Error executing transform function:', error);
      throw new Error(`Transform error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};