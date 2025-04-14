/**
 * API Routes - Express route handlers
 */
import { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { Agent, InsertAgent, InsertLog, InsertWorkflow, Log, Node, Workflow } from "@shared/schema";
import { storage } from "./storage";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { fetchWithTimeout } from "./utils/fetch";
import { log } from "./vite";
import { workflowGenerationService } from "./services/workflowGenerationService";

/**
 * Utility function to execute a workflow
 * This is outside registerRoutes to avoid strict mode issues
 */
async function runWorkflow(
  workflowId: number,
  input: any,
  options: { 
    includeDetail?: boolean, 
    debug?: boolean, 
    executionMode?: string 
  } = {}
): Promise<any> {
  
  // Default options
  const { includeDetail = false, debug = false, executionMode = "step" } = options;
  
  // Get workflow
  const workflow = await storage.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error("Workflow not found");
  }
  
  // Parse the flow data (could be string or already parsed)
  let flowData: { nodes: any[], edges: any[] };
  try {
    if (typeof workflow.flowData === 'string') {
      flowData = JSON.parse(workflow.flowData);
    } else {
      flowData = workflow.flowData as any;
    }
  } catch (error) {
    console.error(`Error parsing workflow data for workflow ${workflowId}:`, error);
    throw new Error("Invalid workflow data structure");
  }
  
  // Ensure we have nodes and edges
  if (!Array.isArray(flowData.nodes) || !Array.isArray(flowData.edges)) {
    throw new Error("Workflow missing nodes or edges");
  }
  
  // Identify input and output nodes
  let inputNodes = flowData.nodes.filter((node: any) => node.type?.includes('input') || node.data?.category === 'input');
  let outputNodes = flowData.nodes.filter((node: any) => node.type?.includes('output') || node.data?.category === 'output');
  
  // Starting with input nodes, execute each node in the workflow
  const nodeOutputs: Record<string, any> = {};
  const nodeExecutionOrder: string[] = [];
  const nodeExecutionTimes: Record<string, { start: number, end: number }> = {};
  
  // Include the user input for all input nodes
  inputNodes.forEach((node: any) => {
    if (node && node.id) {
      nodeOutputs[node.id] = { output: input };
      
      // Record execution
      nodeExecutionOrder.push(node.id);
      nodeExecutionTimes[node.id] = { 
        start: Date.now(), 
        end: Date.now() 
      };
    }
  });
  
  // Create a log entry for this workflow execution
  const logEntry: InsertLog = {
    agentId: workflow.agentId,
    type: "workflow_execution",
    level: "info",
    message: `Starting workflow execution: ${workflow.name}`,
    source: "workflow_engine",
    data: {
      workflowId,
      input,
      status: "in_progress"
    }
  };
  const executionLog = await storage.createLog(logEntry);
  
  // Start executing the workflow
  console.log(`Executing workflow ${workflowId}: ${workflow.name}`);
  
  try {
    // Implement basic execution, but preferably use an existing solution:
    
    // 1. Identify the nodes that need to be executed next
    // For now, just execute nodes in order they appear in edges
    
    if (flowData.nodes.length === 0) {
      const result = {
        output: "Workflow is empty (no nodes to execute)",
        nodeOutputs: {},
        executionDetails: {
          workflowId,
          executionTime: 0,
          nodeCount: 0,
          executionOrder: [],
          status: "completed",
          logId: executionLog.id,
        }
      };
      
      // Update the log entry
      await storage.updateLog(executionLog.id, {
        message: `Workflow execution completed: ${workflow.name}`,
        level: "info",
        data: {
          ...executionLog.data,
          status: "completed",
          result: result.output
        }
      });
      
      return result;
    }
    
    // Start a timer for overall execution
    const executionStartTime = Date.now();
    
    // Process each node based on the edges
    // This is a simplified execution algorithm that processes nodes in topological order
    const nodeMap = Object.fromEntries(flowData.nodes.map((node: any) => [node.id, node]));
    
    // Find root nodes (no incoming edges) that aren't input nodes
    const nonInputNodes = flowData.nodes.filter((node: any) => !inputNodes.includes(node));
    const edgesTo = Object.fromEntries(flowData.edges.map((edge: any) => [edge.target, edge]));
    
    // Process nodes with dependencies satisfied
    let nodeQueue = [...nonInputNodes].filter((node: any) => {
      const hasIncomingEdges = flowData.edges.some((edge: any) => edge.target === node.id);
      if (!hasIncomingEdges) return true;
      
      // If it has incoming edges, check if they're all from input nodes that we've already processed
      const incomingEdges = flowData.edges.filter((edge: any) => edge.target === node.id);
      return incomingEdges.every((edge: any) => nodeOutputs[edge.source] !== undefined);
    });
    
    // For debug mode, include more details in logs
    if (debug) {
      console.log("Execution mode:", executionMode);
      console.log("Input nodes:", inputNodes.map((n: any) => n.id));
      console.log("Output nodes:", outputNodes.map((n: any) => n.id));
      console.log("Initial nodeQueue:", nodeQueue.map((n: any) => n.id));
      console.log("Edges:", flowData.edges);
    }
    
    // Simple execution for now
    const processedNodes = new Set<string>(inputNodes.map((n: any) => n.id));
    const maxIterations = 100; // Safety to prevent infinite loops
    let iterationCount = 0;
    
    // Process nodes until none remain or we hit max iterations
    while (nodeQueue.length > 0 && iterationCount < maxIterations) {
      iterationCount++;
      
      // Process the current node
      const currentNode = nodeQueue.shift();
      if (!currentNode || !currentNode.id || processedNodes.has(currentNode.id)) continue;
      
      // Get the input for this node from its incoming edges
      const nodeInputs: Record<string, any> = {};
      const incomingEdges = flowData.edges.filter((edge: any) => edge.target === currentNode.id);
      
      // If some input nodes don't have outputs yet, put this node back in queue
      const allInputsReady = incomingEdges.every((edge: any) => nodeOutputs[edge.source] !== undefined);
      if (!allInputsReady) {
        nodeQueue.push(currentNode);
        continue;
      }
      
      // Get inputs from incoming edges
      incomingEdges.forEach((edge: any) => {
        const sourceNode = nodeMap[edge.source];
        const sourceOutput = nodeOutputs[edge.source];
        
        if (sourceNode && sourceOutput) {
          nodeInputs[edge.source] = sourceOutput;
        }
      });
      
      // Record execution start
      nodeExecutionOrder.push(currentNode.id);
      nodeExecutionTimes[currentNode.id] = { 
        start: Date.now(), 
        end: 0 // Will be updated after execution
      };
      
      try {
        if (debug) {
          console.log(`Executing node: ${currentNode.id}`, currentNode);
          console.log(`Node inputs:`, nodeInputs);
        }
        
        // Extract node information
        const nodeType = currentNode.type || currentNode.data?.type || "unknown";
        const nodeData = currentNode.data || {};
        let nodeResult: any = null;
        
        try {
          // Use the folder-based node system for execution
          // The enhanced node executor system from client/src/lib/nodeSystem.ts should be
          // mirrored on the server side or made accessible via a shared module
          
          // Here we assume we have access to the node executor registry
          // This is a simplified implementation - in a real system we would:
          // 1. Import the node executor dynamically 
          // 2. Execute it with the proper input format
          // 3. Transform the result to the expected output format
          
          // For now, we'll just pass through the inputs to maintain compatibility
          const inputs = Object.values(nodeInputs)[0]?.output || {};
          
          // Get the first input as our data source
          nodeResult = {
            output: inputs
          };
          
          if (debug) {
            console.log(`Executed node ${nodeType} (ID: ${currentNode.id}) with folder-based executor`);
          }
        } catch (error) {
          console.warn(`Error executing node ${nodeType} (ID: ${currentNode.id}):`, error);
          
          // Provide a fallback for backward compatibility
          nodeResult = {
            output: Object.values(nodeInputs)[0]?.output || null,
            error: `Error executing node: ${error.message}`
          };
        }
        
        // Store the node's output
        nodeOutputs[currentNode.id] = nodeResult;
        
        // Record execution end time
        nodeExecutionTimes[currentNode.id].end = Date.now();
        
        // Mark node as processed
        processedNodes.add(currentNode.id);
        
        // Add nodes that can now be executed to the queue
        const newEligibleNodes = flowData.nodes.filter((node: any) => {
          // Skip already processed nodes
          if (processedNodes.has(node.id)) return false;
          
          // Check if all incoming edges are from processed nodes
          const nodeIncomingEdges = flowData.edges.filter((edge: any) => edge.target === node.id);
          return nodeIncomingEdges.every((edge: any) => processedNodes.has(edge.source));
        });
        
        nodeQueue.push(...newEligibleNodes);
        
        if (debug) {
          console.log(`Node ${currentNode.id} execution complete:`, nodeResult);
          console.log(`Updated queue:`, nodeQueue.map((n: any) => n.id));
        }
        
      } catch (error) {
        console.error(`Error executing node ${currentNode.id}:`, error);
        
        // Store error output
        nodeOutputs[currentNode.id] = { 
          error: error instanceof Error ? error.message : String(error),
          output: null
        };
        
        // Record execution end time
        nodeExecutionTimes[currentNode.id].end = Date.now();
        processedNodes.add(currentNode.id);
      }
    }
    
    // Calculate execution time
    const executionEndTime = Date.now();
    const executionTime = executionEndTime - executionStartTime;
    
    // Get the final output from output nodes
    const outputs = outputNodes.map((node: any) => nodeOutputs[node.id]?.output).filter(Boolean);
    const finalOutput = outputs.length > 0 ? outputs[0] : "No output produced";
    
    // Find any errors in execution
    const errors = Object.entries(nodeOutputs)
      .filter(([_, output]) => output?.error !== undefined)
      .map(([nodeId, output]) => ({ nodeId, error: output.error }));
    
    const executionStatus = errors.length > 0 ? "error" : "completed";
    
    const result = {
      output: finalOutput,
      errors: errors.length > 0 ? errors : undefined,
      nodeOutputs: includeDetail ? nodeOutputs : undefined,
      executionDetails: {
        workflowId,
        executionTime,
        nodeCount: flowData.nodes.length,
        nodesExecuted: processedNodes.size,
        executionOrder: nodeExecutionOrder,
        executionTimes: includeDetail ? nodeExecutionTimes : undefined,
        status: executionStatus,
        logId: executionLog.id,
      }
    };
    
    // Update the log entry
    await storage.updateLog(executionLog.id, {
      message: `Workflow execution ${executionStatus}: ${workflow.name}`,
      level: executionStatus === "error" ? "error" : "info",
      data: {
        ...executionLog.data,
        status: executionStatus,
        result: finalOutput,
        errors: errors.length > 0 ? errors : undefined,
        executionTime,
        nodesExecuted: processedNodes.size
      }
    });
    
    return result;
    
  } catch (error) {
    console.error(`Workflow execution error:`, error);
    
    // Update the log entry with the error
    await storage.updateLog(executionLog.id, {
      message: `Workflow execution failed: ${workflow.name}`,
      level: "error",
      data: {
        ...executionLog.data,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    throw error;
  }
}

// Register API routes
export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Add token validation middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // We could validate tokens here
    next();
  });
  
  // Basic API health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Proxy for Claude API
  app.post('/api/proxy/claude', async (req: Request, res: Response) => {
    try {
      const claudeApiKey = process.env.CLAUDE_API_KEY;
      
      if (!claudeApiKey) {
        return res.status(400).json({ 
          error: true,
          message: "Claude API key not configured on the server. Please set the CLAUDE_API_KEY environment variable."
        });
      }
      
      // Forward the request to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(req.body)
      });
      
      // Get the response data
      const data = await response.json();
      
      // Return the response to the client
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Error proxying request to Claude API:", error);
      return res.status(500).json({ 
        error: true,
        message: error instanceof Error ? error.message : "Unknown error proxying to Claude API"
      });
    }
  });
  
  // API Configuration endpoints
  
  // Get API configuration
  app.get('/api/config', (req: Request, res: Response) => {
    try {
      // Return masked API keys to verify they exist
      // Don't return the actual keys for security reasons
      const config = {
        // Check for environment variables and create masked versions
        openaiApiKey: process.env.OPENAI_API_KEY ? '****' + process.env.OPENAI_API_KEY.slice(-4) : null,
        claudeApiKey: process.env.CLAUDE_API_KEY ? '****' + process.env.CLAUDE_API_KEY.slice(-4) : null,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY ? '****' + process.env.PERPLEXITY_API_KEY.slice(-4) : null
      };
      
      res.json(config);
    } catch (error) {
      console.error("Error getting API config:", error);
      res.status(500).json({ 
        error: true, 
        message: "Failed to get API configuration" 
      });
    }
  });
  
  // Update API configuration
  app.post('/api/config', (req: Request, res: Response) => {
    try {
      const { openaiApiKey, claudeApiKey, perplexityApiKey } = req.body;
      
      // In a production environment, we would save these to a secure storage
      // For this demo, we'll log them (but masked) and use environment variables
      console.log('API Key update requested:', {
        openaiApiKey: openaiApiKey ? '****' + openaiApiKey.slice(-4) : null,
        claudeApiKey: claudeApiKey ? '****' + claudeApiKey.slice(-4) : null,
        perplexityApiKey: perplexityApiKey ? '****' + perplexityApiKey.slice(-4) : null
      });
      
      // Return the masked config to confirm receipt
      const config = {
        openaiApiKey: openaiApiKey ? '****' + openaiApiKey.slice(-4) : null,
        claudeApiKey: claudeApiKey ? '****' + claudeApiKey.slice(-4) : null,
        perplexityApiKey: perplexityApiKey ? '****' + perplexityApiKey.slice(-4) : null
      };
      
      res.json(config);
    } catch (error) {
      console.error("Error updating API config:", error);
      res.status(500).json({ 
        error: true, 
        message: "Failed to update API configuration" 
      });
    }
  });
  
  // ===== Agent Routes =====
  
  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const agents = await storage.getAgents(type);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching agents" });
    }
  });
  
  // Get a specific agent
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Error fetching agent" });
    }
  });
  
  // Create a new agent
  app.post("/api/agents", async (req, res) => {
    try {
      // Validate request body
      const agentSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        icon: z.string().optional(),
        status: z.enum(["active", "inactive", "draft"]).optional()
      });
      
      const result = agentSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid agent data", 
          details: validationError.message 
        });
      }
      
      const { name, description, type, icon, status } = result.data;
      const agentData = { name, description, type, icon, status };
      
      // Create the agent
      const agent = await storage.createAgent(agentData);
      
      // Return the created agent
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update an agent
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get existing agent
      const existingAgent = await storage.getAgent(id);
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate request body
      const agentUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        icon: z.string().optional(),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = agentUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid agent data", 
          details: validationError.message 
        });
      }
      
      // Update the agent
      const updatedAgent = await storage.updateAgent(id, result.data);
      
      // Return the updated agent
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete an agent
  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Check if agent exists
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Delete the agent
      const success = await storage.deleteAgent(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete agent" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Run an agent
  app.post("/api/agents/:id/run", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate request body
      const runSchema = z.object({
        input: z.any(),
        options: z.object({
          includeDetail: z.boolean().optional(),
          debug: z.boolean().optional(),
          executionMode: z.string().optional()
        }).optional()
      });
      
      const result = runSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid run request", 
          details: validationError.message 
        });
      }
      
      const { input, options } = result.data;
      
      // Get associated workflows
      const workflows = await storage.getWorkflowsByAgentId(id);
      if (workflows.length === 0) {
        return res.status(400).json({ 
          message: "This agent has no associated workflows" 
        });
      }
      
      // Use the first workflow for now (in the future we could support multiple)
      const workflow = workflows[0];
      
      // Execute the workflow
      const outcome = await runWorkflow(workflow.id, input, options);
      
      // Return the result
      res.json(outcome);
      
    } catch (error) {
      console.error("Agent run error:", error);
      
      res.status(500).json({ 
        message: "Error running agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get workflows associated with an agent
  app.get("/api/agents/:id/workflows", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Get workflows associated with this agent
      const workflows = await storage.getWorkflowsByAgentId(id);
      
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching agent workflows", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get logs for an agent
  app.get("/api/agents/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Get limit from query
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      // Get logs for this agent
      const logs = await storage.getLogs(id, limit);
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching agent logs", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Workflow Routes =====
  
  // Generate a new workflow from a natural language prompt
  app.post("/api/workflows/generate", async (req, res) => {
    try {
      // Validate request body
      const generateSchema = z.object({
        prompt: z.string(),
        agentId: z.number().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
          timeout: z.number().optional(),
        }).optional(),
      });
      
      const result = generateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow generation request", 
          details: validationError.message 
        });
      }
      
      // Extract prompt and options from the request
      const { prompt, agentId, options } = result.data;
      
      console.log(`Generating workflow from prompt: "${prompt}"`);
      
      // Try to use the dynamic workflow generation service
      try {
        console.log("Using workflowGenerationService to generate dynamic workflow");
        
        // Generate a workflow using the dynamic generation service
        const generatedWorkflow = await workflowGenerationService.generateWorkflow(
          prompt,
          agentId,
          {
            ...(options || {}),
            complexity: options?.complexity || 'moderate',
            domain: options?.domain || 'general',
            maxNodes: options?.maxNodes || 10
          }
        );
        
        // Return the generated workflow
        return res.status(200).json({
          workflow: generatedWorkflow,
          message: "Workflow generated successfully with dynamically generated nodes"
        });
        
      } catch (error) {
        console.error("Error using dynamic workflow generation:", error);
        
        // Handle error case with a fallback simple workflow
        console.log("Using fallback approach for workflow generation");
        
        // Create a simple "generated text" workflow based on the prompt
        const timestamp = Date.now();
        const workflowName = `Generated workflow ${new Date().toLocaleString()}`;
        
        // Create a flow with a basic three-node pattern
        const textInputNode = {
          id: `text-input-${timestamp}`,
          type: 'text_input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Input from prompt',
            category: 'input',
            description: `Input created from: ${prompt}`,
            type: 'text_input'
          }
        };
        
        const processingNode = {
          id: `process-${timestamp}`,
          type: 'generate_text',
          position: { x: 350, y: 100 },
          data: {
            label: 'Process Input',
            category: 'ai',
            description: 'Processes the input data',
            type: 'generate_text',
            settings: {
              prompt: 'Process this input: {{text_input.output}}'
            }
          }
        };
        
        const outputNode = {
          id: `output-${timestamp}`,
          type: 'output',
          position: { x: 600, y: 100 },
          data: {
            label: 'Output Result',
            category: 'output',
            description: 'Shows the processed result',
            type: 'output'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-input-process-${timestamp}`,
          source: textInputNode.id,
          target: processingNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-process-output-${timestamp}`,
          source: processingNode.id,
          target: outputNode.id,
          type: 'default'
        };
        
        // Create the flow data structure
        const flowData = {
          nodes: [textInputNode, processingNode, outputNode],
          edges: [edge1, edge2]
        };
        
        // Create a new workflow
        const fallbackWorkflow = await storage.createWorkflow({
          name: workflowName,
          description: `Workflow generated from prompt: ${prompt}`,
          type: 'custom',
          agentId: agentId,
          flowData: flowData
        });
        
        return res.status(200).json({
          workflow: fallbackWorkflow,
          message: "Workflow generated with basic processing nodes (fallback mode)"
        });
      }
    } catch (error) {
      console.error("Workflow generation error:", error);
      
      // Special handling for API key errors
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          error: true,
          message: "Missing or invalid API key for the LLM service",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: true,
        message: "Failed to generate workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update an existing workflow based on a natural language prompt
  app.post("/api/workflows/update/:id", async (req, res) => {
    try {
      // Validate request body
      const updateSchema = z.object({
        prompt: z.string(),
        currentWorkflowId: z.number(),
        currentWorkflowName: z.string().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
          timeout: z.number().optional(),
        }).optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow update request", 
          details: validationError.message 
        });
      }
      
      const workflowId = parseInt(req.params.id, 10);
      if (isNaN(workflowId)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Get the existing workflow
      const existingWorkflow = await storage.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Extract prompt and options from the request
      const { prompt, options } = result.data;
      
      // Include additional context in the prompt for the AI
      const contextualizedPrompt = `Update the existing workflow "${existingWorkflow.name}" (ID: ${workflowId}): ${prompt}`;
      
      console.log(`Updating workflow ${workflowId} from prompt: "${prompt}"`);
      
      // Parse the existing flow data structure
      let flowData: { nodes: any[], edges: any[] };
      
      try {
        // Handle both string and object flowData formats
        if (typeof existingWorkflow.flowData === 'string') {
          flowData = JSON.parse(existingWorkflow.flowData);
        } else {
          flowData = existingWorkflow.flowData as any || { nodes: [], edges: [] };
        }
        
        // Ensure we have nodes and edges arrays
        if (!Array.isArray(flowData.nodes)) flowData.nodes = [];
        if (!Array.isArray(flowData.edges)) flowData.edges = [];
      } catch (error) {
        console.error("Error parsing workflow data:", error);
        // If we can't parse the existing data, start with empty arrays
        flowData = { nodes: [], edges: [] };
      }
      
      // Try to use the dynamic workflow generation service
      try {
        console.log("Using workflowGenerationService to generate dynamic workflow");
        
        // Generate a workflow using the dynamic generation service
        const generatedWorkflow = await workflowGenerationService.generateWorkflow(
          contextualizedPrompt,
          existingWorkflow.agentId || undefined,
          {
            ...(options || {}),
            complexity: options?.complexity || 'moderate',
            domain: options?.domain || 'general',
            maxNodes: options?.maxNodes || 10
          }
        );
        
        // Parse the generated workflow data
        let generatedFlowData;
        if (typeof generatedWorkflow.flowData === 'string') {
          generatedFlowData = JSON.parse(generatedWorkflow.flowData);
        } else {
          generatedFlowData = generatedWorkflow.flowData || { nodes: [], edges: [] };
        }
        
        // Ensure the generated data has nodes and edges arrays
        if (!generatedFlowData.nodes) generatedFlowData.nodes = [];
        if (!generatedFlowData.edges) generatedFlowData.edges = [];
        
        // Position nodes properly to ensure visibility (top-left of the canvas)
        const startX = 100;
        const startY = 100;
        const spacing = 200;
        
        // Update node positions and ensure each node has a unique ID
        const timestamp = Date.now();
        generatedFlowData.nodes = generatedFlowData.nodes.map((node: any, index: number) => {
          // Ensure node has a unique ID
          if (!node.id) {
            node.id = `${node.type || 'node'}-${timestamp}-${index}`;
          }
          
          // Ensure node has a position
          if (!node.position) {
            node.position = {
              x: startX + (index % 3) * spacing,
              y: startY + Math.floor(index / 3) * spacing
            };
          }
          
          return node;
        });
        
        // Update edge IDs and ensure connections are valid
        generatedFlowData.edges = generatedFlowData.edges.map((edge: any, index: number) => {
          // Ensure edge has an ID
          if (!edge.id) {
            edge.id = `edge-${timestamp}-${index}`;
          }
          
          // Ensure edge has type
          if (!edge.type) {
            edge.type = 'default';
          }
          
          return edge;
        });
        
        // Add the generated nodes and edges to the existing workflow
        flowData.nodes.push(...generatedFlowData.nodes);
        flowData.edges.push(...generatedFlowData.edges);
        
        console.log(`Added ${generatedFlowData.nodes.length} nodes and ${generatedFlowData.edges.length} edges from dynamically generated workflow`);
        
        // Update the workflow in the database
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData,
          description: generatedWorkflow.description || existingWorkflow.description
        };
        
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated successfully with dynamically generated nodes"
        });
        
      } catch (error) {
        console.error("Error using dynamic workflow generation:", error);
        
        // Handle error case with a fallback simple node
        console.log("Using fallback approach for workflow update");
        
        // Create a simple "generated text" node based on the prompt
        const timestamp = Date.now();
        
        // Very simple fallback of a text input node and a processing node
        const textInputNode = {
          id: `text-input-${timestamp}`,
          type: 'text_input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Input from prompt',
            category: 'input',
            description: `Input created from: ${prompt}`,
            type: 'text_input'
          }
        };
        
        const processingNode = {
          id: `process-${timestamp}`,
          type: 'generate_text',
          position: { x: 350, y: 100 },
          data: {
            label: 'Process Input',
            category: 'ai',
            description: 'Processes the input data',
            type: 'generate_text',
            settings: {
              prompt: 'Process this input: {{text_input.output}}'
            }
          }
        };
        
        const outputNode = {
          id: `output-${timestamp}`,
          type: 'output',
          position: { x: 600, y: 100 },
          data: {
            label: 'Output Result',
            category: 'output',
            description: 'Shows the processed result',
            type: 'output'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-input-process-${timestamp}`,
          source: textInputNode.id,
          target: processingNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-process-output-${timestamp}`,
          source: processingNode.id,
          target: outputNode.id,
          type: 'default'
        };
        
        // Add the fallback nodes and edges to the workflow
        flowData.nodes.push(textInputNode, processingNode, outputNode);
        flowData.edges.push(edge1, edge2);
        
        // Update the workflow with new data
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData
        };
        
        // Update the workflow in the database
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated with basic processing nodes (fallback mode)"
        });
      }
    } catch (error) {
      console.error("Workflow update error:", error);
      
      // Special handling for API key errors
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          error: true,
          message: "Missing or invalid API key for the LLM service",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: true,
        message: "Failed to update workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const workflows = await storage.getWorkflows(type);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching workflows" });
    }
  });
  
  // Get a specific workflow
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Error fetching workflow" });
    }
  });
  
  // Create a new workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      // Validate request body
      const workflowSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        agentId: z.number().optional(),
        flowData: z.union([z.record(z.any()), z.string()]).optional(),
        prompt: z.string().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
        }).optional()
      });
      
      const result = workflowSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow data", 
          details: validationError.message 
        });
      }
      
      let { name, description, type, agentId, flowData, prompt, options } = result.data;
      
      // If we have a prompt, use the workflow generation service
      if (prompt) {
        try {
          console.log("Using workflowGenerationService for new workflow");
          
          // Generate a workflow using the service
          const generatedWorkflow = await workflowGenerationService.generateWorkflow(
            prompt,
            agentId,
            {
              ...(options || {}),
              complexity: options?.complexity || 'moderate',
              domain: options?.domain || 'general',
              maxNodes: options?.maxNodes || 10
            }
          );
          
          // Merge the generated workflow data with our request
          name = name || generatedWorkflow.name;
          description = description || generatedWorkflow.description;
          type = type || generatedWorkflow.type;
          flowData = generatedWorkflow.flowData;
          
          // Create the workflow
          const workflow = await storage.createWorkflow({
            name,
            description,
            type,
            agentId,
            flowData
          });
          
          // Return the created workflow
          return res.status(201).json({
            workflow,
            message: "Workflow created successfully with generated nodes"
          });
          
        } catch (error) {
          console.error("Error generating workflow:", error);
          
          if (error instanceof Error && error.message.includes('API key')) {
            return res.status(401).json({
              error: true,
              message: "Missing or invalid API key for the LLM service",
              details: error.message
            });
          }
          
          // Continue with manual workflow creation as fallback
          console.log("Using fallback approach for workflow creation");
        }
      }
      
      // If no flowData is provided or generation failed, create an empty workflow
      if (!flowData) {
        flowData = { nodes: [], edges: [] };
      }
      
      // Create the workflow
      const workflow = await storage.createWorkflow({
        name,
        description,
        type,
        agentId,
        flowData
      });
      
      // Return the created workflow
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a workflow
  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Get existing workflow
      const existingWorkflow = await storage.getWorkflow(id);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Validate request body
      const workflowUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        agentId: z.number().optional(),
        flowData: z.union([z.record(z.any()), z.string()]).optional(),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = workflowUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow data", 
          details: validationError.message 
        });
      }
      
      // Update the workflow
      const updatedWorkflow = await storage.updateWorkflow(id, result.data);
      
      // Return the updated workflow
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete a workflow
  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Check if workflow exists
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Delete the workflow
      const success = await storage.deleteWorkflow(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete workflow" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Execute a workflow
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Validate request body
      const executeSchema = z.object({
        input: z.any().optional(),
        options: z.object({
          includeDetail: z.boolean().optional(),
          debug: z.boolean().optional(),
          executionMode: z.string().optional()
        }).optional()
      });
      
      const result = executeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid execution request", 
          details: validationError.message 
        });
      }
      
      const { input, options } = result.data;
      
      // Execute the workflow
      const outcome = await runWorkflow(id, input || {}, options || {});
      
      // Return the result
      res.json(outcome);
      
    } catch (error) {
      console.error("Workflow execution error:", error);
      
      res.status(500).json({ 
        message: "Error executing workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Node Routes =====
  
  // Get all nodes
  app.get("/api/nodes", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const nodes = await storage.getNodes(type);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching nodes" });
    }
  });
  
  // Get a specific node
  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      res.json(node);
    } catch (error) {
      res.status(500).json({ message: "Error fetching node" });
    }
  });
  
  // Create a new node
  app.post("/api/nodes", async (req, res) => {
    try {
      // Validate request body
      const nodeSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        icon: z.string().optional(),
        inputs: z.record(z.any()).optional(),
        outputs: z.record(z.any()).optional(),
        settings: z.record(z.any()).optional()
      });
      
      const result = nodeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid node data", 
          details: validationError.message 
        });
      }
      
      // Create the node
      const node = await storage.createNode(result.data);
      
      // Return the created node
      res.status(201).json(node);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a node
  app.patch("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Get existing node
      const existingNode = await storage.getNode(id);
      if (!existingNode) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Validate request body
      const nodeUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        icon: z.string().optional(),
        inputs: z.record(z.any()).optional(),
        outputs: z.record(z.any()).optional(),
        settings: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = nodeUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid node data", 
          details: validationError.message 
        });
      }
      
      // Update the node
      const updatedNode = await storage.updateNode(id, result.data);
      
      // Return the updated node
      res.json(updatedNode);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete a node
  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Check if node exists
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Delete the node
      const success = await storage.deleteNode(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete node" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Execute a specific node
  app.post("/api/nodes/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Get the node
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Validate request body
      const executeSchema = z.object({
        inputs: z.record(z.any()).optional()
      });
      
      const result = executeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid execution request", 
          details: validationError.message 
        });
      }
      
      const { inputs = {} } = result.data;
      
      // For now, return a mock response
      // In a real application, this would execute the node's specific logic
      res.json({
        output: "Node mock execution completed",
        nodeType: node.type,
        executionTime: 100
      });
      
    } catch (error) {
      res.status(500).json({ 
        message: "Error executing node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Log Routes =====
  
  // Get all logs
  app.get("/api/logs", async (req, res) => {
    try {
      // Parse optional query parameters
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      const logs = await storage.getLogs(agentId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching logs" });
    }
  });
  
  // Get a specific log
  app.get("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Error fetching log" });
    }
  });
  
  // Create a new log
  app.post("/api/logs", async (req, res) => {
    try {
      // Validate request body
      const logSchema = z.object({
        agentId: z.number().optional(),
        type: z.string(),
        level: z.enum(["debug", "info", "warn", "error"]),
        message: z.string(),
        source: z.string(),
        data: z.record(z.any()).optional()
      });
      
      const result = logSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid log data", 
          details: validationError.message 
        });
      }
      
      // Create the log
      const log = await storage.createLog(result.data);
      
      // Return the created log
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating log", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a log
  app.put("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      // Validate request body
      const logUpdateSchema = z.object({
        type: z.string().optional(),
        level: z.enum(["debug", "info", "warn", "error"]).optional(),
        message: z.string().optional(),
        source: z.string().optional(),
        data: z.record(z.any()).optional()
      });
      
      const result = logUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid log data", 
          details: validationError.message 
        });
      }
      
      // Update the log
      const updatedLog = await storage.updateLog(id, result.data);
      
      // Return the updated log
      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating log", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // API request proxy to avoid CORS issues when making requests to third-party APIs
  app.post("/api/proxy", async (req, res) => {
    try {
      // Validate request body
      const proxySchema = z.object({
        url: z.string().url(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
        headers: z.record(z.string()).optional(),
        data: z.any().optional(),
        timeout: z.number().optional(),
      });
      
      const result = proxySchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid proxy request", 
          details: validationError.message 
        });
      }
      
      const { url, method, headers, data, timeout } = result.data;
      
      // Create fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {})
        },
        // Add body for non-GET requests
        ...(method !== 'GET' && data ? { body: JSON.stringify(data) } : {})
      };
      
      // Make the request
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      
      // Get the response body
      let responseBody: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Create response data
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: responseBody
      };
      
      // Return response with original status code
      res.status(response.status).json(responseData);
    } catch (error) {
      console.error('API Proxy error:', error);
      res.status(500).json({ 
        message: "API Proxy error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a message from the API
  app.post("/api/message", async (req, res) => {
    try {
      const messageSchema = z.object({
        agentId: z.number(),
        prompt: z.string(),
        workflowId: z.number().optional(),
        sessionId: z.string().optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = messageSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid message request", 
          details: validationError.message 
        });
      }
      
      const { agentId, prompt, workflowId, sessionId, metadata } = result.data;
      
      // Get the agent
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Create a session ID if one wasn't provided
      const session = sessionId || uuidv4();
      
      // Create a log for this message
      const messageLog: InsertLog = {
        agentId,
        type: "message",
        level: "info",
        message: prompt,
        source: "user",
        data: {
          session,
          prompt,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        }
      };
      
      const log = await storage.createLog(messageLog);
      
      // Log the incoming message
      console.log(`Message to agent ${agentId}: ${prompt}`);
      
      // If the agent has a linked workflow, use that workflow to process the message
      if (workflowId) {
        try {
          // Execute the workflow
          const workflowResult = await runWorkflow(workflowId, { prompt, session, metadata });
          
          // Return the workflow result
          return res.status(200).json({
            message: workflowResult.output,
            sessionId: session,
            agentId,
            logId: log.id,
            workflowId,
            ...workflowResult
          });
        } catch (error) {
          console.error("Error executing workflow for message:", error);
          
          return res.status(500).json({
            error: true,
            message: "Failed to process message through workflow",
            details: error instanceof Error ? error.message : String(error),
            sessionId: session
          });
        }
      }
      
      // For now, if there's no workflow, return a mock response from the workflow (a stub)
      const mockResponse = `Mock response from agent: I received your message: "${prompt}"`;
      
      // Update the log with the response
      await storage.updateLog(log.id, {
        data: {
          ...log.data,
          response: mockResponse,
          responseTimestamp: new Date().toISOString()
        }
      });
      
      res.json({
        message: mockResponse,
        sessionId: session,
        agentId,
        logId: log.id
      });
      
    } catch (error) {
      console.error("Message processing error:", error);
      
      res.status(500).json({
        error: true,
        message: "Error processing message",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return server;
}
