/**
 * Data Transform Node Executor
 * 
 * This file contains the execution logic for the data transform node,
 * which transforms data using mapping expressions.
 */

export interface Transformation {
  field: string;
  operation: string;
  expression: string;
}

export interface DataTransformNodeData {
  transformations: Transformation[];
  outputTemplate?: Record<string, any>;
}

/**
 * Safely evaluate a JavaScript expression with a data context
 */
function evaluateExpression(expression: string, data: any): any {
  try {
    // Create a function from the expression with 'data' as a parameter
    const fn = new Function('data', `return ${expression};`);
    return fn(data);
  } catch (error) {
    throw new Error(`Error evaluating expression "${expression}": ${error}`);
  }
}

/**
 * Apply a transformation to the data
 */
function applyTransformation(transformation: Transformation, data: any): any {
  switch (transformation.operation) {
    case 'map':
      return evaluateExpression(transformation.expression, data);
      
    case 'filter':
      const shouldInclude = evaluateExpression(transformation.expression, data);
      return shouldInclude ? data[transformation.field] : undefined;
      
    case 'reduce':
      // For reduce operations on arrays, the expression should return a single value
      if (Array.isArray(data[transformation.field])) {
        return data[transformation.field].reduce((acc: any, curr: any, idx: number) => {
          const context = { acc, curr, idx, data };
          return evaluateExpression(transformation.expression, context);
        }, evaluateExpression('data.initialValue || 0', data));
      }
      throw new Error(`Field ${transformation.field} is not an array, cannot apply reduce operation`);
      
    default:
      throw new Error(`Unknown operation: ${transformation.operation}`);
  }
}

/**
 * Execute the data transform node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: DataTransformNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Check if we have data to transform
    if (!inputs?.data) {
      throw new Error('No data provided for transformation');
    }
    
    // Create the result object with the output template if provided
    const result = nodeData.outputTemplate ? { ...nodeData.outputTemplate } : {};
    
    // Apply each transformation
    for (const transformation of nodeData.transformations) {
      // Skip transformations without a field or expression
      if (!transformation.field || !transformation.expression) continue;
      
      // Apply the transformation and set the result field
      result[transformation.field] = applyTransformation(transformation, inputs.data);
    }
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: 'Data transformation completed successfully',
        startTime,
        endTime
      },
      items: [
        {
          json: {
            result
          },
          binary: null
        }
      ]
    };
  } catch (error: any) {
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error during data transformation',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack
        }
      },
      items: [
        {
          json: {
            error: error.message
          },
          binary: null
        }
      ]
    };
  }
};