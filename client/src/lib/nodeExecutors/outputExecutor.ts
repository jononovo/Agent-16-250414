import { NodeExecutor, createSimpleNodeExecutor } from '../workflowEngine';

interface OutputNodeData {
  [key: string]: any;
}

/**
 * Executor for output nodes
 * 
 * This node simply passes along its input as output.
 */
export const outputExecutor: NodeExecutor = createSimpleNodeExecutor(
  async (_nodeData: OutputNodeData, inputs: Record<string, any>) => {
    // Pass through the default input
    return inputs.default;
  }
);