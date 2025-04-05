import { 
  EnhancedNodeExecutor, 
  NodeExecutionData,
  createExecutionDataFromValue,
  createWorkflowItem
} from '../types/workflow';
import { createEnhancedNodeExecutor } from '../enhancedWorkflowEngine';

/**
 * Text Input Node Data Interface
 */
interface TextInputNodeData {
  text?: string;
  [key: string]: any;
}

/**
 * Text Input Node Definition
 */
const textInputDefinition = {
  type: 'text_input',
  displayName: 'Text Input',
  description: 'Provides text input to a workflow',
  icon: 'Text',
  category: 'input',
  version: '1.0',
  
  // Define the input parameters
  inputs: {
    text: {
      type: 'string' as const,
      displayName: 'Text Input',
      description: 'Text to provide as input',
      required: true
    }
  },
  
  // Define the outputs
  outputs: {
    default: {
      type: 'string' as const,
      displayName: 'Text Output',
      description: 'The text input'
    }
  }
};

/**
 * Executor for text input nodes
 */
export const textInputExecutor: EnhancedNodeExecutor = createEnhancedNodeExecutor(
  textInputDefinition,
  async (nodeData: TextInputNodeData, inputs: Record<string, NodeExecutionData>): Promise<NodeExecutionData> => {
    const text = nodeData.text || '';
    
    if (!text.trim()) {
      throw new Error("No text input provided");
    }
    
    // Return text as output
    const item = createWorkflowItem(text, 'text_input');
    
    return {
      items: [item],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        itemsProcessed: 1,
        sourceOperation: 'text_input'
      }
    };
  }
);