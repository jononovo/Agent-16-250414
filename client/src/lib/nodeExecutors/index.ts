import { registerNodeExecutor } from '../workflowEngine';
import { textInputExecutor } from './textInputExecutor';
import { perplexityExecutor } from './perplexityExecutor';
import { visualizeTextExecutor } from './visualizeTextExecutor';
import { generateTextExecutor } from './generateTextExecutor';

// Register all node executors
export function registerAllNodeExecutors() {
  // Input nodes
  registerNodeExecutor('text_input', textInputExecutor);
  registerNodeExecutor('textInput', textInputExecutor);
  
  // AI nodes
  registerNodeExecutor('perplexity', perplexityExecutor);
  registerNodeExecutor('generate_text', generateTextExecutor);
  registerNodeExecutor('generateText', generateTextExecutor);
  
  // Output/Visualization nodes
  registerNodeExecutor('visualize_text', visualizeTextExecutor);
  registerNodeExecutor('visualizeText', visualizeTextExecutor);
}