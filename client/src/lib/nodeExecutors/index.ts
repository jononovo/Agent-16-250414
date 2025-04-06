import { registerNodeExecutor } from '../workflowEngine';
import { textInputExecutor } from './textInputExecutor';
import { textPromptExecutor } from './textPromptExecutor';
import { perplexityExecutor } from './perplexityExecutor';
import { visualizeTextExecutor } from './visualizeTextExecutor';
import { generateTextExecutor } from './generateTextExecutor';
import { transformExecutor } from './transformExecutor';
import { outputExecutor } from './outputExecutor';
import { webhookNodeExecutor } from './webhookNodeExecutor';

// Register all node executors
export function registerAllNodeExecutors() {
  // Input nodes
  registerNodeExecutor('text_input', textInputExecutor);
  registerNodeExecutor('textInput', textInputExecutor);
  registerNodeExecutor('text_prompt', textPromptExecutor);
  registerNodeExecutor('textPrompt', textPromptExecutor);
  registerNodeExecutor('trigger', textPromptExecutor); // Map 'trigger' type to textPromptExecutor
  
  // AI nodes
  registerNodeExecutor('perplexity', perplexityExecutor);
  registerNodeExecutor('generate_text', generateTextExecutor);
  registerNodeExecutor('generateText', generateTextExecutor);
  registerNodeExecutor('claude', generateTextExecutor); // Map 'claude' type to generateTextExecutor
  
  // Transform nodes
  registerNodeExecutor('transform', transformExecutor);
  
  // Output/Visualization nodes
  registerNodeExecutor('visualize_text', visualizeTextExecutor);
  registerNodeExecutor('visualizeText', visualizeTextExecutor);
  registerNodeExecutor('output', outputExecutor);
  
  // Action/API nodes
  registerNodeExecutor('webhook', webhookNodeExecutor);
  registerNodeExecutor('api', webhookNodeExecutor); // Map 'api' type to webhookNodeExecutor
}