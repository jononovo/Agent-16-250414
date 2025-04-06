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
      
      // Check for direct input from workflow execution first
      let input = '';
      
      // Check if we have a prompt in the nodeData (from the workflow execution)
      if (nodeData._workflowInput && nodeData._workflowInput.prompt) {
        input = nodeData._workflowInput.prompt;
        console.log('Found prompt in _workflowInput:', input);
      }
      // Then try to extract from the incoming items
      else if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const item = inputs.input.items[0];
        
        // Try different possible input formats
        if (item.text) {
          input = item.text;
        } else if (item.json) {
          if (typeof item.json === 'string') {
            input = item.json;
          } else if (item.json.prompt) {
            input = item.json.prompt;
          } else if (item.json.content) {
            input = item.json.content;
          } else if (item.json.input) {
            input = item.json.input;
          } else {
            // Fallback to full JSON if we can't find a specific field
            input = JSON.stringify(item.json);
          }
        }
      }
      // Fallback if all else fails
      else if (nodeData.inputText) {
        input = nodeData.inputText;
      }
      
      console.log('Workflow trigger using input:', input);
      
      return {
        output: [{ text: input, json: { prompt: input, workflowId: nodeData.workflowId } }]
      };
    }
  });
}