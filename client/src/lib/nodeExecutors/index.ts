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
  registerNodeExecutor('trigger', { 
    execute: async (nodeData, inputs) => {
      // Extract the prompt directly from the workflow execution input
      let prompt = '';
      if (nodeData._workflowInput && nodeData._workflowInput.prompt) {
        prompt = nodeData._workflowInput.prompt;
      } else if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        // Fallback to input if available
        prompt = inputs.input.items[0].text || JSON.stringify(inputs.input.items[0]);
      }
      
      // Return the input as-is to pass to the next node
      return {
        output: [{ text: prompt, json: { prompt } }]
      };
    }
  }); // Custom trigger node executor
  
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
  
  // Import enhanced workflow node executors for backward compatibility
  registerNodeExecutor('workflow_trigger', {
    execute: async (nodeData, inputs) => {
      console.log('Basic workflow_trigger node executor - passing through input', nodeData);
      const input = inputs.input?.items?.[0]?.text || 
                   inputs.input?.items?.[0]?.json?.prompt || 
                   JSON.stringify(inputs.input?.items?.[0]?.json || {});
      
      return {
        output: [{ text: input, json: { prompt: input, workflowId: nodeData.workflowId } }]
      };
    }
  });
}