/**
 * Workflow Generation Service
 * 
 * This service is responsible for generating workflow definitions from natural language
 * prompts using AI models. It structures the data to be compatible with ReactFlow
 * visualization and our workflow execution engine.
 */

import { IStorage } from '../storage';
import { InsertWorkflow, Node } from '@shared/schema';
import { fetchWithTimeout } from '../utils/fetch';

/**
 * Interface for workflow generation options
 */
interface WorkflowGenerationOptions {
  apiKey?: string;
  model?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  domain?: string;
  nodeTypes?: string[];
  maxNodes?: number;
  timeout?: number;
}

/**
 * Structure of the node types catalog
 */
interface NodeTypesCatalog {
  [key: string]: {
    type: string;
    displayName: string;
    description: string;
    category: string;
    icon: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    settings?: Record<string, any>;
  };
}

/**
 * Workflow Generation Service
 */
export class WorkflowGenerationService {
  private storage: IStorage;
  private nodeTypesCatalog: NodeTypesCatalog;
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.nodeTypesCatalog = {}; // Will be populated in the init method
  }
  
  /**
   * Initialize the service, loading available node types
   */
  async init(): Promise<void> {
    // Retrieve all registered node types from the database
    const nodes = await this.storage.getNodes();
    
    // Create a catalog of node types for the AI to reference
    this.nodeTypesCatalog = nodes.reduce((catalog: NodeTypesCatalog, node: Node) => {
      // Extract node configuration
      const config = node.configuration as any || {};
      
      // Add node to catalog
      catalog[node.type] = {
        type: node.type,
        displayName: node.name,
        description: node.description || '',
        category: node.category || 'Other',
        icon: node.icon || 'square',
        inputs: config.inputs || {},
        outputs: config.outputs || {},
        settings: config.settings || {}
      };
      
      return catalog;
    }, {});
    
    console.log(`Workflow Generation Service initialized with ${Object.keys(this.nodeTypesCatalog).length} node types`);
  }
  
  /**
   * Generate a workflow definition from a natural language prompt
   */
  async generateWorkflow(
    prompt: string, 
    agentId?: number,
    options: WorkflowGenerationOptions = {}
  ): Promise<any> {
    // Default options
    const {
      model = 'gpt-4',
      complexity = 'moderate',
      domain = 'general',
      maxNodes = 10,
      timeout = 30000,
      apiKey
    } = options;
    
    try {
      // Check if we have an API key for the LLM
      if (!apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error('No API key provided for workflow generation');
      }
      
      // Prepare the prompt for the LLM
      const systemPrompt = this.createSystemPrompt(complexity, domain, maxNodes);
      const userPrompt = this.createUserPrompt(prompt);
      
      // Check for API key
      const apiKeyToUse = apiKey || process.env.OPENAI_API_KEY;
      if (!apiKeyToUse) {
        throw new Error('No API key available for the LLM service');
      }
      
      // Call the LLM API to generate the workflow
      const response = await this.callLLMApi(systemPrompt, userPrompt, model, apiKeyToUse, timeout);
      
      // Parse and validate the workflow structure
      const workflowDefinition = this.parseAndValidateWorkflow(response);
      
      // Add agent ID if provided
      if (agentId) {
        workflowDefinition.agentId = agentId;
      }
      
      // Ensure type field is set (required by the schema)
      if (!workflowDefinition.type) {
        workflowDefinition.type = 'generated';
      }
      
      return workflowDefinition;
    } catch (error) {
      console.error('Error generating workflow:', error);
      throw error;
    }
  }
  
  /**
   * Create the system prompt for the LLM
   */
  private createSystemPrompt(
    complexity: string, 
    domain: string, 
    maxNodes: number
  ): string {
    // Get the node types catalog as a formatted string
    const nodeTypesFormatted = Object.entries(this.nodeTypesCatalog)
      .map(([_, nodeType]) => {
        return `- ${nodeType.type} (${nodeType.category}): ${nodeType.description}`;
      })
      .join('\n');
    
    // Create the system prompt
    return `You are an expert workflow designer for an AI agent system. 
Your task is to create workflow definitions that can be visualized in ReactFlow and executed by a workflow engine.

Available node types:
${nodeTypesFormatted}

Complexity level: ${complexity}
Domain focus: ${domain}
Maximum nodes: ${maxNodes}

Your task is to:
1. Analyze the user's natural language description of a workflow
2. Identify the appropriate node types to use
3. Create a coherent workflow with properly connected nodes and edges
4. Return a valid JSON workflow definition with the following structure:

{
  "name": "Workflow name",
  "description": "Workflow description",
  "flowData": {
    "nodes": [
      {
        "id": "unique-node-id",
        "type": "node-type",
        "position": { "x": number, "y": number },
        "data": {
          "label": "Node Label",
          "description": "Node Description",
          "type": "node-type",
          "category": "node-category",
          "settings": {}
        }
      }
    ],
    "edges": [
      {
        "id": "unique-edge-id",
        "source": "source-node-id",
        "sourceHandle": "output-name",
        "target": "target-node-id",
        "targetHandle": "input-name"
      }
    ]
  }
}

Ensure that:
- All nodes are properly connected with edges
- The workflow has clear input and output nodes
- Node positions are logical (from left to right, with proper spacing)
- Response is ONLY valid JSON without any additional text or explanation
- Each node has appropriate settings based on its type`;
  }
  
  /**
   * Create the user prompt for the LLM
   */
  private createUserPrompt(prompt: string): string {
    return `Create a workflow based on this description: "${prompt}"`;
  }
  
  /**
   * Call the LLM API to generate the workflow
   */
  private async callLLMApi(
    systemPrompt: string, 
    userPrompt: string, 
    model: string,
    apiKey: string,
    timeout: number
  ): Promise<string> {
    try {
      // Prepare the request to OpenAI API
      const url = 'https://api.openai.com/v1/chat/completions';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      const data = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };
      
      // Make the API request
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        },
        timeout
      );
      
      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} ${errorText}`);
      }
      
      // Parse the response
      const result = await response.json();
      
      // Extract and return the generated workflow
      return result.choices[0].message.content;
    } catch (error) {
      console.error('Error calling LLM API:', error);
      throw error;
    }
  }
  
  /**
   * Parse and validate the workflow structure
   */
  private parseAndValidateWorkflow(responseText: string): any {
    try {
      // Extract JSON from the response
      let jsonStr = responseText.trim();
      
      // If the response includes markdown code blocks, extract the JSON
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      // Parse the JSON
      const workflow = JSON.parse(jsonStr);
      
      // Basic validation
      if (!workflow.name) throw new Error('Workflow name is required');
      if (!workflow.flowData) throw new Error('Workflow flowData is required');
      if (!workflow.flowData.nodes || !Array.isArray(workflow.flowData.nodes)) {
        throw new Error('Workflow nodes must be an array');
      }
      if (!workflow.flowData.edges || !Array.isArray(workflow.flowData.edges)) {
        throw new Error('Workflow edges must be an array');
      }
      
      // Convert to string for storage
      workflow.flowData = JSON.stringify(workflow.flowData);
      
      return workflow;
    } catch (error) {
      console.error('Error parsing workflow JSON:', error);
      throw new Error(`Failed to parse workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a new workflow in the database
   */
  async createWorkflow(workflowData: InsertWorkflow): Promise<any> {
    try {
      // Create the workflow in the database
      const workflow = await this.storage.createWorkflow(workflowData);
      
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }
}

// Export a function to create the service
export function createWorkflowGenerationService(storage: IStorage): WorkflowGenerationService {
  const service = new WorkflowGenerationService(storage);
  service.init().catch(error => {
    console.error('Error initializing workflow generation service:', error);
  });
  return service;
}