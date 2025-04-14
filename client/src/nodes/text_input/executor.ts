/**
 * Text Input Node Executor
 * Handles the execution logic for the Text Input node type
 */
import { NodeExecutionData } from '../../lib/types/workflow';

export interface TextInputNodeData {
  inputText?: string;
  label?: string;
  placeholder?: string;
  [key: string]: any;
}

/**
 * Execute the Text Input node
 * @param nodeData - Configuration and state data for this node instance
 * @param inputs - Inputs passed to this node from connected nodes
 * @returns The execution result with output data
 */
export async function execute(
  nodeData: TextInputNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  try {
    // Get the input text from node data
    const inputText = nodeData.inputText || '';
    
    // Create execution result
    return {
      items: [
        {
          json: { text: inputText }
        }
      ],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        status: 'success'
      }
    };
  } catch (error: any) {
    console.error(`Error executing text input node:`, error);
    
    // Return error result
    return {
      items: [],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        status: 'error',
        message: error.message || 'Error processing text input'
      }
    };
  }
}

export default { execute };