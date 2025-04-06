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
      console.log('Trigger node executor - input:', nodeData._workflowInput);
      
      // Extract the prompt directly from the workflow execution input
      let prompt = '';
      let metadata = {};
      
      // First check for direct workflow input
      if (nodeData._workflowInput) {
        if (nodeData._workflowInput.prompt) {
          prompt = nodeData._workflowInput.prompt;
        }
        if (nodeData._workflowInput.metadata) {
          metadata = nodeData._workflowInput.metadata;
        }
      } 
      // Then check for inputs from connected nodes
      else if (inputs.input && inputs.input.items && inputs.input.items.length > 0) {
        const item = inputs.input.items[0];
        
        // Try to extract text content
        if (item.text) {
          prompt = item.text;
        }
        
        // Try to extract metadata and other JSON fields
        if (item.json) {
          if (item.json.metadata) {
            metadata = item.json.metadata;
          }
          if (item.json.prompt && !prompt) {
            prompt = item.json.prompt;
          }
          if (item.json.originalPrompt && !prompt) {
            prompt = item.json.originalPrompt;
          }
        }
      }
      
      // Also check for input text directly on the node data (from manual testing)
      if (!prompt && nodeData.inputText) {
        prompt = nodeData.inputText;
      }
      
      console.log('Trigger node using prompt:', prompt);
      if (Object.keys(metadata).length > 0) {
        console.log('Trigger node using metadata:', metadata);
      }
      
      // Return the processed data
      return {
        output: [{ 
          text: prompt, 
          json: { 
            prompt,
            metadata,
            execute: true 
          } 
        }]
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
      console.log('Basic workflow_trigger node executor - executing workflow', nodeData);
      
      // For orchestration workflows, we don't need to pass the entire prompt through
      // We just need to signal the workflow to execute with minimal required information
      
      // Extract metadata if available (name, description for new agent/workflow)
      let metadata = {};
      
      // Check various input sources for metadata
      if (inputs.input?.items?.[0]?.json?.metadata) {
        metadata = inputs.input.items[0].json.metadata;
      } else if (nodeData.metadata) {
        metadata = nodeData.metadata;
      }
      
      // Get the original prompt if available (for debugging or context)
      let originalPrompt = '';
      if (nodeData._workflowInput?.prompt) {
        originalPrompt = nodeData._workflowInput.prompt;
      } else if (inputs.input?.items?.[0]?.text) {
        originalPrompt = inputs.input.items[0].text;
      } else if (inputs.input?.items?.[0]?.json?.prompt) {
        originalPrompt = inputs.input.items[0].json.prompt;
      } else if (nodeData.inputText) {
        originalPrompt = nodeData.inputText;
      }
      
      console.log('Workflow trigger with metadata:', metadata);
      if (originalPrompt) {
        console.log('Original prompt (context only):', originalPrompt.substring(0, 100));
      }
      
      // For orchestration workflows, we just need to return a valid execution signal
      // with minimal metadata - no need to pass the entire prompt
      return {
        output: [{ 
          text: 'execute', 
          json: { 
            execute: true,
            metadata,
            originalPrompt,
            workflowId: nodeData.workflowId
          } 
        }]
      };
    }
  });
}