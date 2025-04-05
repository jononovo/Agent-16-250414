import { 
  EnhancedNodeExecutor, 
  NodeExecutionData
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

interface OutputNodeData {
  [key: string]: any;
}

/**
 * Output Node Definition
 */
const outputDefinition = {
  type: 'output',
  displayName: 'Output',
  description: 'Returns the result of a workflow',
  icon: 'Circle',
  category: 'output',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    default: {
      type: 'any' as const,
      displayName: 'Input',
      description: 'Input data to be output',
      required: true
    }
  },
  
  // Define the outputs
  outputs: {
    default: {
      type: 'any' as const,
      displayName: 'Output',
      description: 'Workflow output data'
    }
  }
};

/**
 * Executor for output nodes
 * 
 * This node simply passes along its input as output.
 */
export const outputExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  outputDefinition,
  async (_nodeData: OutputNodeData, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    // Pass through the default input
    if (!inputs.default || inputs.default.items.length === 0) {
      throw new Error('No input provided to output node');
    }
    
    // Add output metadata
    const result = { ...inputs.default };
    result.meta = {
      ...result.meta,
      isOutput: true,
      outputTime: new Date()
    };
    
    return result;
  }
);