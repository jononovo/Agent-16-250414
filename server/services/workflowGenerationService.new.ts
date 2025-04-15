/**
 * Workflow Generation Service
 *
 * This service is responsible for generating workflow definitions from natural language
 * prompts using AI models. It structures the data to be compatible with ReactFlow
 * visualization and our workflow execution engine.
 */

import { IStorage } from "../storage";
import { InsertWorkflow, Node } from "@shared/schema";
import { fetchWithTimeout } from "../utils/fetch";
import { storage } from "../storage";

// Define the list of available node types
// This should match client/src/nodes and the addNode tool list
export const AVAILABLE_NODE_TYPES = [
  // System node types
  'text_input',
  'claude',
  'http_request',
  'text_template',
  'data_transform',
  'decision',
  'function',
  'json_path',
  'text_prompt',
  // Other node types found in the codebase
  'json_parser',
  'csv_parser',
  'delay',
  'file_input',
  'logger',
  'api_response'
];

/**
 * Helper functions for node descriptions and categories
 */

// Map node types to descriptions
const NODE_DESCRIPTIONS: Record<string, string> = {
  'text_input': 'For collecting text input from users',
  'claude': 'For using the Claude AI model for text generation',
  'http_request': 'For making API calls to external services',
  'text_template': 'For creating formatted text with variables',
  'data_transform': 'For transforming data between different formats',
  'decision': 'For creating conditional branches based on criteria',
  'function': 'For executing custom code functions',
  'json_path': 'For extracting data from JSON using JSONPath',
  'text_prompt': 'For text prompts or questions a user would answer',
  'json_parser': 'For parsing JSON data into structured format',
  'csv_parser': 'For parsing CSV data into structured format',
  'delay': 'For adding time delays in workflow execution',
  'file_input': 'For handling file uploads and processing',
  'logger': 'For logging events and data during workflow execution',
  'api_response': 'For formatting API responses and outputs'
};

// Map node types to categories
const NODE_CATEGORIES: Record<string, string> = {
  // Trigger nodes
  trigger: "trigger",
  schedule_trigger: "trigger",
  webhook: "trigger",
  email_trigger: "trigger",

  // AI nodes
  text_prompt: "AI",
  prompt_crafter: "AI",
  generate_text: "AI",
  claude: "AI",
  perplexity: "AI",

  // Input/Output nodes
  text_input: "input",
  output: "output",
  email_send: "output",
  visualize_text: "output",
  api_response: "output",

  // Data nodes
  transform: "data",
  database_query: "data",
  filter: "data",
  data_transform: "data",
  json_parser: "data",
  csv_parser: "data",
  json_path: "data",

  // Processor nodes
  processor: "process",
  http_request: "process",
  function: "process",
  delay: "process",
  file_input: "process",
  logger: "process",
  decision: "process",
};

/**
 * Interface for workflow generation options
 */
interface WorkflowGenerationOptions {
  apiKey?: string;
  model?: string;
  complexity?: "simple" | "moderate" | "complex";
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
 * Get a descriptive string for a node type
 */
function getNodeDescription(type: string): string {
  return NODE_DESCRIPTIONS[type] || `Generic ${type.replace('_', ' ')} node`;
}

/**
 * Get the appropriate category for a node type
 */
function getCategoryForNodeType(type: string | undefined): string {
  if (!type) return "default";
  return NODE_CATEGORIES[type] || "default";
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
    this.nodeTypesCatalog = nodes.reduce(
      (catalog: NodeTypesCatalog, node: Node) => {
        // Extract node configuration
        const config = (node.configuration as any) || {};

        // Add node to catalog
        catalog[node.type] = {
          type: node.type,
          displayName: node.name,
          description: node.description || "",
          category: node.category || "Other",
          icon: node.icon || "square",
          inputs: config.inputs || {},
          outputs: config.outputs || {},
          settings: config.settings || {},
        };

        return catalog;
      },
      {},
    );

    console.log(
      `Workflow Generation Service initialized with ${Object.keys(this.nodeTypesCatalog).length} node types`,
    );
  }

  /**
   * Generate a workflow definition from a natural language prompt
   */
  async generateWorkflow(
    prompt: string,
    agentId?: number,
    options: WorkflowGenerationOptions = {},
  ): Promise<any> {
    // Default options
    const {
      model = "claude-3-7-sonnet-20250219",
      complexity = "moderate",
      domain = "general",
      maxNodes = 10,
      timeout = 30000,
      apiKey,
    } = options;

    try {
      // Check if we have an API key for the LLM
      if (!apiKey && !process.env.CLAUDE_API_KEY) {
        throw new Error("No API key provided for workflow generation");
      }

      // Prepare the prompt for the LLM
      const systemPrompt = this.createSystemPrompt(
        complexity,
        domain,
        maxNodes,
      );
      const userPrompt = this.createUserPrompt(prompt);

      // Check for API key
      const apiKeyToUse = apiKey || process.env.CLAUDE_API_KEY;
      if (!apiKeyToUse) {
        throw new Error("No API key available for the Claude service");
      }

      // Call the LLM API to generate the workflow
      const response = await this.callLLMApi(
        systemPrompt,
        userPrompt,
        model,
        apiKeyToUse,
        timeout,
      );

      // Parse and validate the workflow structure
      const workflowDefinition = this.parseAndValidateWorkflow(response);

      // Add agent ID if provided
      if (agentId) {
        workflowDefinition.agentId = agentId;
      }

      // Ensure type field is set (required by the schema)
      if (!workflowDefinition.type) {
        workflowDefinition.type = "generated";
      }

      return workflowDefinition;
    } catch (error) {
      console.error("Error generating workflow:", error);
      throw error;
    }
  }

  /**
   * Create the system prompt for the LLM
   */
  private createSystemPrompt(
    complexity: string,
    domain: string,
    maxNodes: number,
  ): string {
    // Get the node types catalog as a formatted string
    const nodeTypesFormatted = Object.entries(this.nodeTypesCatalog)
      .map(([_, nodeType]) => {
        return `- ${nodeType.type} (${nodeType.category}): ${nodeType.description}`;
      })
      .join("\n");

    // Define the supported node types with clear descriptions - ONLY use from this exact list
    const supportedNodeTypes = `
AVAILABLE NODE TYPES (IMPORTANT: use ONLY these exact types, do not invent new ones):
${AVAILABLE_NODE_TYPES.map(type => `- ${type}: ${getNodeDescription(type)}`).join('\n')}
`;

    // Create the system prompt
    return `You are an expert workflow designer for an AI agent system. 
Your task is to create workflow definitions that can be visualized in ReactFlow and executed by a workflow engine.

${supportedNodeTypes}

Available node types in catalog (reference only):
${nodeTypesFormatted}

Complexity level: ${complexity}
Domain focus: ${domain}
Maximum nodes: ${maxNodes}

Your task is to:
1. Analyze the user's natural language description of a workflow
2. Identify the appropriate node types, ALWAYS using ONLY from the "AVAILABLE NODE TYPES" list above
3. Create a coherent workflow with properly connected nodes and edges
4. Return a valid JSON workflow definition with the following structure:

{
  "name": "Workflow name",
  "description": "Workflow description",
  "flowData": {
    "nodes": [
      {
        "id": "unique-node-id",
        "type": "text_prompt", // ALWAYS use types from the AVAILABLE NODE TYPES list
        "position": { "x": number, "y": number },
        "data": {
          "label": "Node Label",
          "description": "Node Description",
          "type": "text_prompt", // Must match the node's type field
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
- All nodes MUST use types from the "AVAILABLE NODE TYPES" list (text_input, claude, http_request, etc.)
- Never use deprecated or invented types - ONLY use the exact types listed above
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
    timeout: number,
  ): Promise<string> {
    // Use the provided API key, or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.CLAUDE_API_KEY;
    
    // Ensure we have an API key
    if (!effectiveApiKey) {
      throw new Error("No API key provided for Claude service. Please set CLAUDE_API_KEY environment variable or provide an API key in the request.");
    }
    try {
      // Prepare the request to Claude API
      const url = "https://api.anthropic.com/v1/messages";
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": effectiveApiKey,
        "anthropic-version": "2023-06-01"
      };
      
      const data = {
        model,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      };

      // Make the API request
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        },
        timeout,
      );

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} ${errorText}`);
      }

      // Parse the response
      const result = await response.json();

      // Extract and return the generated workflow
      return result.content[0].text;
    } catch (error) {
      console.error("Error calling Claude API:", error);
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
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
      }

      // Parse the JSON
      const workflow = JSON.parse(jsonStr);

      // Basic validation
      if (!workflow.name) throw new Error("Workflow name is required");
      if (!workflow.flowData) throw new Error("Workflow flowData is required");
      if (!workflow.flowData.nodes || !Array.isArray(workflow.flowData.nodes)) {
        throw new Error("Workflow nodes must be an array");
      }
      if (!workflow.flowData.edges || !Array.isArray(workflow.flowData.edges)) {
        throw new Error("Workflow edges must be an array");
      }

      // Map node types to the ones supported by the FlowEditor component
      // Only keeping essential mappings for standard node types
      const nodeTypeMapping: Record<string, string> = {
        transform: "data_transform",
        output: "api_response",
        database: "database_query",
        email: "email_send",
        trigger: "text_input",
        process: "function",
        filter: "decision",
      };

      // Update node types and positions in the workflow
      if (workflow.flowData.nodes) {
        // First, validate that all node types are supported
        const unsupportedNodes = workflow.flowData.nodes.filter(
          (node: any) => {
            const nodeType = node.type;
            // If the node type is in our mapping, it will be converted to a valid type
            const willBeMapped = nodeType && nodeTypeMapping[nodeType];
            // If the node type is already in our available types, it's valid
            const isAvailable = nodeType && AVAILABLE_NODE_TYPES.includes(nodeType);
            
            // Node is unsupported if it's neither mappable nor already available
            return nodeType && !willBeMapped && !isAvailable;
          }
        );
        
        // If we found unsupported node types, throw an error
        if (unsupportedNodes.length > 0) {
          const unsupportedTypes = unsupportedNodes.map((node: any) => node.type).join(', ');
          throw new Error(`Workflow contains unsupported node types: ${unsupportedTypes}. Only use available node types: ${AVAILABLE_NODE_TYPES.join(', ')}`);
        }
        
        // Ensure all nodes are nicely positioned in the top-left of the canvas
        // This makes them immediately visible to users
        const baseX = 100; // Start X position
        const baseY = 100; // Start Y position
        const nodeWidth = 250; // Average node width
        const nodePadding = 50; // Padding between nodes
        const nodesPerRow = 3; // Nodes per row before wrapping to a new row

        workflow.flowData.nodes = workflow.flowData.nodes.map(
          (node: any, index: number) => {
            // Check if this node type needs to be mapped
            if (node.type && nodeTypeMapping[node.type]) {
              node.type = nodeTypeMapping[node.type];
            }

            // Also update the type in the data object if it exists
            if (
              node.data &&
              node.data.type &&
              nodeTypeMapping[node.data.type]
            ) {
              node.data.type = nodeTypeMapping[node.data.type];
            }
            
            // Final validation - after mapping, the node type must be in our available types
            if (node.type && !AVAILABLE_NODE_TYPES.includes(node.type)) {
              throw new Error(`Invalid node type after mapping: ${node.type}. Must be one of: ${AVAILABLE_NODE_TYPES.join(', ')}`);
            }

            // Calculate grid position
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;

            // Position nodes in a grid layout, starting from top-left
            node.position = {
              x: baseX + col * (nodeWidth + nodePadding),
              y: baseY + row * 200, // 200px vertical spacing between rows
            };

            // Ensure every node has a unique ID
            if (!node.id) {
              node.id = `${node.type || "node"}-${Date.now()}-${index}`;
            }

            // Make sure data has label and category
            if (!node.data) {
              node.data = {};
            }

            if (!node.data.label) {
              node.data.label = node.type
                ? `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node`
                : "Node";
            }

            if (!node.data.category) {
              node.data.category = getCategoryForNodeType(node.type);
            }

            return node;
          },
        );
      }

      // Convert to string for storage
      workflow.flowData = JSON.stringify(workflow.flowData);

      return workflow;
    } catch (error) {
      console.error("Error parsing workflow JSON:", error);
      throw new Error(
        `Failed to parse workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
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
      console.error("Error creating workflow:", error);
      throw error;
    }
  }
}

// Export a function to create the service
export function createWorkflowGenerationService(
  storage: IStorage,
): WorkflowGenerationService {
  const service = new WorkflowGenerationService(storage);
  service.init().catch((error) => {
    console.error("Error initializing workflow generation service:", error);
  });
  return service;
}

// Create and export the default instance
export const workflowGenerationService =
  createWorkflowGenerationService(storage);