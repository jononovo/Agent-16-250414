/**
 * Decision Node Executor
 * 
 * This file contains the execution logic for the decision node,
 * which evaluates a condition and routes data accordingly.
 */

export interface DecisionNodeData {
  condition: string;
  trueData?: Record<string, any>;
  falseData?: Record<string, any>;
}

/**
 * Safely evaluate a JavaScript expression with a data context
 */
function evaluateExpression(expression: string, data: any): boolean {
  try {
    // Create a function from the expression with 'data' as a parameter
    const fn = new Function('data', `return !!(${expression});`);
    return !!fn(data);
  } catch (error) {
    throw new Error(`Error evaluating condition "${expression}": ${error}`);
  }
}

/**
 * Execute the decision node
 * 
 * @param nodeData The node configuration data
 * @param inputs Optional inputs from connected nodes
 * @returns The execution result
 */
export const execute = async (nodeData: DecisionNodeData, inputs?: any): Promise<any> => {
  try {
    const startTime = new Date().toISOString();
    
    // Check if we have data to evaluate
    if (!inputs?.data) {
      throw new Error('No data provided for condition evaluation');
    }
    
    // Get the condition to evaluate
    const condition = nodeData.condition || 'false';
    
    // Evaluate the condition
    const result = evaluateExpression(condition, inputs.data);
    
    // Prepare the output based on the condition result
    const outputData = result ? 
      { true: { ...(inputs.data), ...(nodeData.trueData || {}) } } : 
      { false: { ...(inputs.data), ...(nodeData.falseData || {}) } };
    
    const endTime = new Date().toISOString();
    return {
      meta: {
        status: 'success',
        message: `Condition evaluated to ${result}`,
        startTime,
        endTime
      },
      items: [
        {
          json: outputData,
          binary: null
        }
      ]
    };
  } catch (error: any) {
    return {
      meta: {
        status: 'error',
        message: error.message || 'Error evaluating condition',
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