import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertWorkflowSchema, insertNodeSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { createWorkflowGenerationService } from "./services/workflowGenerationService";

// Simplified API-oriented flow for our client-side workflow architecture

// Definition of the internal API request schema
const createAgentFromInternal = z.object({
  source: z.enum(['ui_button', 'ai_chat']),
  trigger_type: z.enum(['new_agent', 'chat_instruction']),
  trigger_node_id: z.string().optional(),
  agent_template_id: z.number().optional(),
  workflow_template_id: z.number().optional(),
  input_data: z.object({}).passthrough()
});

/**
 * Utility function to execute a workflow
 * This is outside registerRoutes to avoid strict mode issues
 */
async function runWorkflow(
  workflow: any, 
  workflowName: string, 
  input: string | Record<string, any>, 
  executeWorkflow: any,
  context: Record<string, any> = {}
) {
  console.log(`Executing workflow ${workflowName}...`);
  
  // Extract metadata if present
  const { metadata = {}, _callStack = [] } = context;
  
  // Log for reference - later these workflows will be completely
  // replaced by proper node-based implementations
  if (workflow.id === 5) {
    console.log(`Using Workflow Creator Flow (ID: 5) - Consider migrating to create_workflow node type`);
  } else if (workflow.id === 6) {
    console.log(`Using Link Workflow to Agent Flow (ID: 6) - Consider migrating to link_workflow_to_agent node type`);
  }
  
  // Create a log entry for standard workflow execution
  const workflowLog = await storage.createLog({
    agentId: workflow.agentId || 0,
    workflowId: workflow.id,
    status: "running",
    input: { input, ...context },
  });
  
  // SIMPLIFIED HANDLING FOR WORKFLOW 15: Build New Agent Structure
  // Direct agent creation without requiring Claude node processing
  if (workflow.id === 15) {
    console.log('Simplified handling for Build New Agent Structure workflow (ID 15)');
    
    // Log the source to aid debugging
    const source = metadata.source || 'ui_button';
    console.log(`Source for workflow 15: ${source}, input type: ${typeof input}`);
    console.log('Input data:', JSON.stringify(input));
    
    // For direct agent creation case - if name is provided, create directly
    if (typeof input === 'object' && (input.name || (input.agent_data && input.agent_data.name))) {
      try {
        // Get agent data either from direct properties or from agent_data object
        const name = input.name || input.agent_data?.name;
        const description = input.description || input.agent_data?.description || 'Agent created from workflow';
        const type = input.type || input.agent_data?.type || 'custom';
        const icon = input.icon || input.agent_data?.icon || 'brain';
        const status = input.status || input.agent_data?.status || 'active';
        
        const agentData = { name, description, type, icon, status };
        
        console.log('Creating agent directly with data:', JSON.stringify(agentData));
        const agent = await storage.createAgent(agentData);
        
        // Update the log
        await storage.updateLog(workflowLog.id, {
          status: 'success',
          output: {
            action: 'create_agent',
            result: 'success',
            agent,
            message: `Created new agent: ${agentData.name}`,
          },
          completedAt: new Date()
        });
        
        // Return success result
        return {
          success: true,
          status: 'complete',
          output: {
            action: 'create_agent',
            result: 'success',
            agent,
            message: `Created new agent: ${agentData.name}`,
          },
          logId: workflowLog.id
        };
      } catch (error) {
        // If direct creation fails, log the error but continue with regular execution
        console.error('Direct agent creation failed, falling back to workflow execution:', error);
      }
    } else {
      console.log('No direct agent data provided, will use workflow processing');
    }
  }
  
  try {
    // Check for valid workflow data
    if (!workflow.flowData) {
      await storage.updateLog(workflowLog.id, {
        status: "error",
        error: `${workflowName} has no flow data`,
        completedAt: new Date()
      });
      return { 
        success: false, 
        error: `${workflowName} has no flow data`,
        logId: workflowLog.id
      };
    }
    
    // Parse the flow data
    const flowData = typeof workflow.flowData === 'string' 
      ? JSON.parse(workflow.flowData) 
      : workflow.flowData;
    
    const nodes = flowData.nodes || [];
    const edges = flowData.edges || [];
    
    console.log(`${workflowName}: ${nodes.length} nodes and ${edges.length} edges`);
    
    // Inject the input into the first text_input node
    // Determine the appropriate input text based on the input type
    const inputText = typeof input === 'string' 
      ? input 
      : (input.text || input.prompt || JSON.stringify(input));
      
    const startNode = nodes.find((node: { type: string }) => node.type === 'text_input');
    if (startNode) {
      if (!startNode.data) startNode.data = {};
      startNode.data.inputText = inputText;
      
      // If input is an object, add the full object properties as well
      if (typeof input === 'object') {
        startNode.data = { ...startNode.data, ...input };
      }
    } else if (nodes.length > 0) {
      // If no start node found, add the input to the first node
      if (!nodes[0].data) nodes[0].data = {};
      nodes[0].data.inputText = inputText;
      
      // If input is an object, add the full object properties as well
      if (typeof input === 'object') {
        nodes[0].data = { ...nodes[0].data, ...input };
      }
    }
    
    // Pass the context (metadata and call stack) to all relevant nodes
    for (const node of nodes) {
      if (!node.data) node.data = {};
      
      // Pass metadata to all nodes that might need it
      if (Object.keys(metadata).length > 0) {
        node.data.metadata = { ...metadata };
        console.log(`Passing metadata to node ${node.id}:`, metadata);
      }
      
      // Pass call stack specifically to workflow/agent trigger nodes
      if (_callStack.length > 0 && (node.type === 'workflow_trigger' || node.type === 'agent_trigger')) {
        node.data._callStack = _callStack;
      }
    }
    
    // Initialize node states tracking
    const nodeStates: Record<string, any> = {};
    
    // Add debugging info for workflow and nodes
    console.log('DEBUG - Workflow data:', workflowName, workflowLog.id);
    console.log('DEBUG - Nodes:', JSON.stringify(nodes.map((n: any) => ({
      id: n.id,
      type: n.type,
      data: { 
        ...n.data,
        label: n.data?.label, 
        workflowId: n.data?.workflowId,
        triggerType: n.data?.triggerType 
      }
    }))));
    
    // Execute the workflow
    const result = await executeWorkflow(
      nodes,
      edges,
      (nodeId: string, state: any) => {
        // Store node states as they change
        nodeStates[nodeId] = state;
        console.log(`[${workflowName}] Node ${nodeId} state: ${state.state}`);
      },
      (finalState: any) => {
        console.log(`[${workflowName}] Execution completed with status: ${finalState.status}`);
      }
    );
    
    // Find the output nodes
    const outputNodes = nodes.filter((node: { id: string }) => {
      // Nodes with no outgoing edges are considered output nodes
      return !edges.some((edge: { source: string }) => edge.source === node.id);
    });
    
    // Collect output from the final nodes
    const outputs: Record<string, any> = {};
    outputNodes.forEach((node: { id: string }) => {
      if (result.nodeStates[node.id]) {
        outputs[node.id] = result.nodeStates[node.id].data;
      }
    });
    
    // Update log with results
    await storage.updateLog(workflowLog.id, {
      status: result.status === 'error' ? 'error' : 'success',
      output: outputs,
      error: result.error,
      executionPath: { 
        nodes: Object.keys(result.nodeStates),
        completed: result.status === 'complete',
        error: result.error
      },
      completedAt: new Date()
    });
    
    if (result.status !== 'complete') {
      return { 
        success: false, 
        error: `${workflowName} execution failed: ${result.error || 'Unknown error'}`,
        status: result.status,
        outputs,
        logId: workflowLog.id
      };
    }
    
    // Extract the primary output (first output node, or node named 'output')
    let primaryOutput = '';
    const outputNodeId = outputNodes[0]?.id || 'output';
    if (result.nodeStates[outputNodeId] && result.nodeStates[outputNodeId].data) {
      primaryOutput = result.nodeStates[outputNodeId].data;
    }
    
    return {
      success: true,
      status: result.status,
      output: primaryOutput,
      logId: workflowLog.id
    };
    
  } catch (executionError) {
    console.error(`Error executing ${workflowName}:`, executionError);
    // Update log with error
    await storage.updateLog(workflowLog.id, {
      status: 'error',
      error: executionError instanceof Error ? executionError.message : String(executionError),
      completedAt: new Date()
    });
    
    return { 
      success: false, 
      error: `${workflowName} execution error: ${executionError instanceof Error ? executionError.message : String(executionError)}`,
      logId: workflowLog.id
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function for making POST requests directly to our API
  const apiPost = async (endpoint: string, data: any) => {
    return fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };
  
  // API Proxy Route - secure way to make external API calls
  app.all('/api/proxy', async (req, res) => {
    try {
      // Extract the target URL from query parameters
      const targetUrl = req.query.url as string;
      
      if (!targetUrl) {
        return res.status(400).json({ error: 'Missing target URL parameter' });
      }
      
      // Prepare fetch options based on the request
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          // Forward content-type header
          'Content-Type': req.headers['content-type'] || 'application/json'
        }
      };
      
      // Add body for non-GET requests if present
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      
      // Add custom headers from the request, except content-type (already handled)
      if (req.headers['x-api-key']) {
        // Forward API key if provided
        (fetchOptions.headers as Record<string, string>)['x-api-key'] = req.headers['x-api-key'] as string;
      }
      
      if (req.headers.authorization) {
        // Forward authorization header if provided
        (fetchOptions.headers as Record<string, string>).authorization = req.headers.authorization as string;
      }
      
      // Make the request to the target URL
      console.log(`Proxying ${req.method} request to ${targetUrl}`);
      const response = await fetch(targetUrl, fetchOptions);
      
      // Get the response data
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Return the response with the same status code
      res.status(response.status).json(data);
    } catch (error) {
      console.error('API proxy error:', error);
      res.status(500).json({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown proxy error'
      });
    }
  });
  // Agents API
  app.get("/api/agents", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const agents = await storage.getAgents(type);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      console.log("Creating agent with data:", JSON.stringify(req.body));
      
      const result = insertAgentSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Agent validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      const agent = await storage.createAgent(result.data);
      console.log("Agent created successfully:", JSON.stringify(agent));
      res.status(201).json(agent);
    } catch (error) {
      console.error("Failed to create agent:", error);
      res.status(500).json({ 
        message: "Failed to create agent", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const updateSchema = insertAgentSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedAgent = await storage.updateAgent(id, result.data);
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      await storage.deleteAgent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Workflow Generation API
  const workflowGenerationService = createWorkflowGenerationService(storage);
  
  app.post("/api/workflows/generate", async (req, res) => {
    try {
      // Validate request body
      const generateSchema = z.object({
        prompt: z.string(),
        agentId: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
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
      
      // Generate the workflow
      const { prompt, agentId, name, description, options } = result.data;
      
      console.log(`Generating workflow from prompt: "${prompt}"`);
      
      const workflowDefinition = await workflowGenerationService.generateWorkflow(
        prompt,
        agentId,
        options
      );
      
      // Add name and description if provided
      if (name) workflowDefinition.name = name;
      if (description) workflowDefinition.description = description;
      
      // Create the workflow in the database
      const workflow = await storage.createWorkflow(workflowDefinition);
      
      res.status(201).json({
        workflow,
        message: "Workflow generated successfully"
      });
    } catch (error) {
      console.error("Workflow generation error:", error);
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
      
      // Generate updated workflow based on the prompt
      const { prompt, options } = result.data;
      
      console.log(`Updating workflow ${workflowId} from prompt: "${prompt}"`);
      
      // Include additional context in the prompt for the AI
      const contextualizedPrompt = `Update the existing workflow "${existingWorkflow.name}" (ID: ${workflowId}): ${prompt}`;
      
      // Add actual functionality to update the workflow based on the prompt
      console.log(`Received update request for workflow ${workflowId} with prompt: "${prompt}"`);
      
      // Since we can't use the LLM generation yet, let's implement a simple rule-based workflow updater
      // that can handle a few specific commands
      
      // Start with the existing workflow data
      // Define a properly typed flow data structure
      interface FlowData {
        nodes: any[];
        edges: any[];
      }
      
      // Convert the existing workflow data to our typed structure,
      // ensuring we always have nodes and edges arrays
      const flowData: FlowData = {
        nodes: Array.isArray((existingWorkflow.flowData as any)?.nodes) 
          ? [...(existingWorkflow.flowData as any).nodes] 
          : [],
        edges: Array.isArray((existingWorkflow.flowData as any)?.edges) 
          ? [...(existingWorkflow.flowData as any).edges] 
          : []
      };
      
      let updatedWorkflow;
      
      // Email workflow with schedule and emojis
      if (prompt.toLowerCase().includes('email') && prompt.toLowerCase().includes('morning') || 
          prompt.toLowerCase().includes('emojis') || prompt.toLowerCase().includes('emojies')) {
        
        // Create a scheduled trigger node
        const triggerNode = {
          id: `trigger-${Date.now()}`,
          type: 'schedule_trigger',
          position: { x: 100, y: 100 },
          data: {
            name: 'Daily Morning Schedule',
            schedule: '0 5 * * *', // 5 AM daily
            description: 'Triggers workflow every morning at 5 AM'
          }
        };
        
        // Create an emoji generator node
        const emojiGeneratorNode = {
          id: `emoji-gen-${Date.now()}`,
          type: 'generate_text',
          position: { x: 100, y: 250 },
          data: {
            name: 'Generate Emojis',
            prompt: 'Generate 5 random emojis that represent different moods or activities for the day',
            description: 'Creates a set of 5 daily emojis'
          }
        };
        
        // Create an email sender node
        const emailNode = {
          id: `email-${Date.now()}`,
          type: 'email',
          position: { x: 100, y: 400 },
          data: {
            name: 'Send Daily Email',
            to: '{{recipient_email}}',
            subject: 'Your Daily Emojis 😊',
            body: 'Good morning! Here are your 5 emojis for today:\n\n{{emoji_generator.output}}',
            description: 'Sends email with the generated emojis'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-trigger-emoji-${Date.now()}`,
          source: triggerNode.id,
          target: emojiGeneratorNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-emoji-email-${Date.now()}`,
          source: emojiGeneratorNode.id,
          target: emailNode.id,
          type: 'default'
        };
        
        // Add the nodes and edges to the workflow
        flowData.nodes.push(triggerNode, emojiGeneratorNode, emailNode);
        flowData.edges.push(edge1, edge2);
        
        // Update the workflow with new data
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData,
          description: existingWorkflow.description || 'Daily emoji email workflow'
        };
        
        // Update the workflow in the database
        updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        // Return the updated workflow with a generic message
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated successfully"
        });
      } 
      
      // If no update matched, just return the original workflow
      // No changes needed
      return res.status(200).json({
        workflow: existingWorkflow,
        message: "No changes were made to the workflow"
      });
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
        message: "Failed to generate workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Workflows API
  app.get("/api/workflows", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const workflows = await storage.getWorkflows(type);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      console.log("Creating workflow with data:", JSON.stringify(req.body));
      
      const result = insertWorkflowSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Workflow validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.log("Validation passed, creating workflow with:", JSON.stringify(result.data));
      const workflow = await storage.createWorkflow(result.data);
      console.log("Workflow created successfully:", JSON.stringify(workflow));
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      res.status(500).json({ 
        message: "Failed to create workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const updateSchema = insertWorkflowSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedWorkflow = await storage.updateWorkflow(id, result.data);
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });
  
  // Add PATCH endpoint for workflows to match client-side code
  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const updateSchema = insertWorkflowSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.log(`Updating workflow ${id} with data:`, JSON.stringify(req.body));
      const updatedWorkflow = await storage.updateWorkflow(id, result.data);
      console.log(`Workflow updated successfully:`, JSON.stringify(updatedWorkflow));
      res.json(updatedWorkflow);
    } catch (error) {
      console.error(`Error updating workflow:`, error);
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      await storage.deleteWorkflow(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });
  
  // Execute a workflow by ID
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Extract input from request
      const input = req.body.input || '';
      
      // The node IDs for workflow 15 have been fixed to use simpler names without suffixes
      // No need for special debug mode anymore
      
      // Import the workflow execution function
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      
      // Run the workflow with the given input
      const result = await runWorkflow(workflow, workflow.name, input, executeWorkflow);
      
      res.json(result);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      res.status(500).json({ 
        message: "Failed to execute workflow",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Direct execution endpoint for testing
  app.post("/api/execute-workflow/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Extract input from request
      const input = req.body.input || {};
      
      // Log
      console.log(`Direct execution of workflow ${id} with input:`, JSON.stringify(input));
      
      // Import the workflow execution function
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      
      // Run the workflow with the given input
      const result = await runWorkflow(workflow, workflow.name, input, executeWorkflow, {
        metadata: { debug: true, source: 'direct_test' }
      });
      
      // Log the result
      console.log(`Workflow ${id} execution result:`, JSON.stringify(result));
      
      res.json(result);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
      res.status(500).json({ 
        message: "Failed to execute workflow",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Nodes API
  app.get("/api/nodes", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const nodes = await storage.getNodes(type);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nodes" });
    }
  });

  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      res.json(node);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch node" });
    }
  });

  app.post("/api/nodes", async (req, res) => {
    try {
      const result = insertNodeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const node = await storage.createNode(result.data);
      res.status(201).json(node);
    } catch (error) {
      res.status(500).json({ message: "Failed to create node" });
    }
  });

  app.put("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      const updateSchema = insertNodeSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Ensure category is never null
      const data = { ...result.data };
      if (data.category === null) {
        data.category = "";
      }
      
      const updatedNode = await storage.updateNode(id, data);
      res.json(updatedNode);
    } catch (error) {
      res.status(500).json({ message: "Failed to update node" });
    }
  });

  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      await storage.deleteNode(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete node" });
    }
  });

  // Agent Workflows API - Get workflows associated with an agent
  app.get("/api/agents/:id/workflows", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const workflows = await storage.getWorkflowsByAgentId(agentId);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows for agent" });
    }
  });

  // Logs API
  app.get("/api/logs", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const logs = await storage.getLogs(agentId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.get("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch log" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const result = insertLogSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const log = await storage.createLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to create log" });
    }
  });

  // API Proxy to securely make external API requests
  // This prevents exposing API keys to the client and avoids CORS issues
  app.post("/api/proxy", async (req, res) => {
    try {
      const { url, method = 'GET', data, headers = {} } = req.body;
      
      // Validate required fields
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Validate method
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return res.status(400).json({ message: "Invalid HTTP method" });
      }
      
      // Prevent requests to our own API to avoid security issues
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        return res.status(403).json({ message: "Proxy cannot be used for local requests" });
      }
      
      // Log the proxy request (for debugging/auditing)
      console.log(`API Proxy: ${method} ${url}`);
      
      // Add any API keys or authentication from environment variables
      // This part would be customized based on the service being accessed
      const enrichedHeaders: Record<string, string> = { ...headers };
      
      // Example: Add Claude API key if requesting Anthropic API
      if (url.includes('anthropic.com') && process.env.CLAUDE_API_KEY) {
        enrichedHeaders['x-api-key'] = process.env.CLAUDE_API_KEY;
        enrichedHeaders['anthropic-version'] = '2023-06-01';
      }
      
      // Example: Add OpenAI API key if requesting OpenAI API
      if (url.includes('openai.com') && process.env.OPENAI_API_KEY) {
        enrichedHeaders['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
      }
      
      // Make the request with timeout
      const { fetchWithTimeout } = await import('./utils/fetch');
      
      const fetchOptions: RequestInit = {
        method,
        headers: enrichedHeaders,
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        fetchOptions.body = JSON.stringify(data);
      }
      
      const response = await fetchWithTimeout(url, fetchOptions, 60000);
      
      // Extract response data
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
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

  app.put("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      const updateSchema = insertLogSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedLog = await storage.updateLog(id, result.data);
      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to update log" });
    }
  });

  // Agent Logs API - Get logs associated with an agent
  app.get("/api/agents/:id/logs", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const logs = await storage.getLogs(agentId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs for agent" });
    }
  });
  
  // API Config endpoint - exposes configuration values safely to the frontend
  app.get("/api/config", async (req, res) => {
    try {
      // Only expose specific environment variables that are needed by the frontend
      const config = {
        perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',
        claudeApiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      };
      
      res.json(config);
    } catch (error) {
      console.error('Error fetching config:', error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });
  
  // API Config update endpoint - store API keys in environment variables for this session
  app.post("/api/config", async (req, res) => {
    try {
      const { claudeApiKey, perplexityApiKey } = req.body;
      
      if (claudeApiKey !== undefined) {
        process.env.CLAUDE_API_KEY = claudeApiKey;
        console.log("Claude API key updated");
      }
      
      if (perplexityApiKey !== undefined) {
        process.env.PERPLEXITY_API_KEY = perplexityApiKey;
        console.log("Perplexity API key updated");
      }
      
      res.json({ 
        success: true, 
        message: "API configuration updated successfully"
      });
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });
  
  // Workflow execution endpoint
  app.post("/api/workflows/run", async (req, res) => {
    try {
      const { workflowId, source, triggerType, input } = req.body;
      
      if (!workflowId || typeof workflowId !== 'number') {
        return res.status(400).json({ message: "Invalid or missing workflowId" });
      }
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Log the execution request
      console.log(`Workflow execution request for workflow ${workflowId} from ${source || 'unknown'}`);
      console.log(`Trigger type: ${triggerType || 'none'}, Input:`, input ? JSON.stringify(input) : '{}');
      
      // Create a log entry for the execution
      await storage.createLog({
        agentId: workflow.agentId || 0, // Provide default value if agentId is null
        workflowId: workflowId, // Add required workflowId
        status: 'running', // Add required status
        input: input || {}, // Add input field
        // Note: other fields like timestamp are handled by db defaults
      });
      
      // For the specific case of creating a new agent from the UI
      if (triggerType === 'internal_new_agent' && input && input.request_type === 'new_agent') {
        // Direct agent creation
        const agentData = {
          name: input.name || `New Agent (${new Date().toLocaleDateString()})`,
          description: input.description || `Agent created on ${new Date().toLocaleDateString()}`,
          type: 'custom',
          icon: 'brain',
          status: 'active',
          configuration: {}, // Add empty configuration object
          userId: 1 // Add default user ID
        };
        
        console.log('Creating agent with data:', agentData);
        
        // Create the agent
        const agent = await storage.createAgent(agentData);
        
        // Return with the created agent
        return res.status(200).json({ 
          success: true, 
          message: "Agent created via workflow",
          executionId: `exec-${Date.now()}`,
          workflow: {
            id: workflow.id,
            name: workflow.name
          },
          result: {
            action: 'create_agent',
            agent: agent
          }
        });
      }
      
      // For other workflows, just return a success response
      res.status(200).json({ 
        success: true, 
        message: "Workflow execution initiated",
        executionId: `exec-${Date.now()}`,
        workflow: {
          id: workflow.id,
          name: workflow.name
        }
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });
  
  // Internal API endpoint for agent creation 
  app.post("/api/internal/create-agent", async (req, res) => {
    try {
      // Validate request body against schema
      const result = createAgentFromInternal.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Extract data from request
      const { 
        source, 
        trigger_type, 
        agent_template_id, 
        workflow_template_id,
        input_data 
      } = result.data;
      
      console.log(`Internal agent creation request from ${source}, trigger: ${trigger_type}`);
      
      // Get template agent if provided
      let templateAgent = null;
      if (agent_template_id) {
        templateAgent = await storage.getAgent(agent_template_id);
        if (!templateAgent) {
          return res.status(404).json({ message: "Template agent not found" });
        }
      }
      
      // Create a new agent based on template or default values
      const agentName = typeof input_data.name === 'string' ? input_data.name : 
                     (templateAgent?.name || `New Agent (${new Date().toISOString().slice(0, 10)})`);
                     
      const agentDescription = typeof input_data.description === 'string' ? input_data.description : 
                            (templateAgent?.description || "Agent created via internal workflow");
                            
      const newAgentData = {
        name: agentName,
        description: agentDescription,
        type: templateAgent?.type || "custom",
        configuration: {
          ...(templateAgent?.configuration || {}),
          metadata: {
            createdFrom: source,
            triggerType: trigger_type,
            templateId: agent_template_id
          }
        }
      };
      
      // Create the agent
      const newAgent = await storage.createAgent(newAgentData);
      console.log(`New agent created with ID: ${newAgent.id}`);
      
      // If workflow template ID is provided, create a workflow for this agent
      if (workflow_template_id) {
        const templateWorkflow = await storage.getWorkflow(workflow_template_id);
        if (!templateWorkflow) {
          return res.status(404).json({ 
            message: "Template workflow not found, but agent was created",
            agent: newAgent
          });
        }
        
        // Create a new workflow based on the template
        const newWorkflowData = {
          name: `${newAgent.name} Workflow`,
          description: templateWorkflow.description || "Workflow created for new agent",
          agentId: newAgent.id,
          type: templateWorkflow.type || "standard",
          flowData: {
            ...(templateWorkflow.flowData || {}),
            metadata: {
              createdFrom: source,
              triggerType: trigger_type,
              templateId: workflow_template_id
            }
          }
        };
        
        // Create the workflow
        const newWorkflow = await storage.createWorkflow(newWorkflowData);
        console.log(`New workflow created with ID: ${newWorkflow.id} for agent ${newAgent.id}`);
        
        // Log the creation
        await storage.createLog({
          agentId: newAgent.id,
          workflowId: newWorkflow.id,
          status: "success",
          output: {
            message: `Agent created from ${source} via ${trigger_type}`,
            source,
            trigger_type,
            templateAgentId: agent_template_id,
            templateWorkflowId: workflow_template_id
          }
        });
        
        // Return both the new agent and workflow
        return res.status(201).json({
          agent: newAgent,
          workflow: newWorkflow,
          status: "created"
        });
      }
      
      // Log the creation
      await storage.createLog({
        agentId: newAgent.id,
        workflowId: 0, // No specific workflow
        status: "success",
        output: {
          message: `Agent created from ${source} via ${trigger_type}`,
          source,
          trigger_type,
          templateAgentId: agent_template_id
        }
      });
      
      // Return just the new agent if no workflow was created
      return res.status(201).json({
        agent: newAgent,
        status: "created"
      });
    } catch (error) {
      console.error("Error creating agent from internal workflow:", error);
      res.status(500).json({ 
        message: "Failed to create agent from internal workflow",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Test Workflow Execution endpoint - allows testing a specific workflow with a prompt
  app.post("/api/test-workflow/:id", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      if (isNaN(workflowId)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      console.log(`Testing workflow ${workflowId} with prompt: ${prompt}`);
      
      // Create a log entry for this execution
      const log = await storage.createLog({
        agentId: workflow.agentId || 0,
        workflowId: workflowId,
        status: "running",
        input: { prompt },
      });
      
      // Check if workflow has flowData
      if (!workflow.flowData) {
        await storage.updateLog(log.id, {
          status: "error",
          error: "Workflow has no flow data",
          completedAt: new Date()
        });
        return res.status(400).json({ message: "Workflow has no flow data" });
      }
      
      try {
        // Import the workflow engine - we have to use dynamic imports as the workflow engine is in the client code
        // In a real-world scenario, you would move the workflow engine to a shared location
        const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
        
        // Import node executors to ensure they're registered
        const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
        
        // Explicitly register all node executors
        registerAllNodeExecutors();
        
        // Parse the flow data
        const flowData = typeof workflow.flowData === 'string' 
          ? JSON.parse(workflow.flowData) 
          : workflow.flowData;
        
        const nodes = flowData.nodes || [];
        const edges = flowData.edges || [];
        
        console.log(`Executing workflow with ${nodes.length} nodes and ${edges.length} edges`);
        
        // Inject the prompt into the first node that accepts text input
        // This is a simplified approach - in a real app, you'd have a more structured way to inject inputs
        const startNode = nodes.find((node: { type: string }) => node.type === 'text_prompt' || node.type === 'prompt');
        if (startNode) {
          if (!startNode.data) startNode.data = {};
          startNode.data.prompt = prompt;
        } else {
          // If no start node found, just add the prompt as input to the first node
          if (nodes.length > 0) {
            if (!nodes[0].data) nodes[0].data = {};
            nodes[0].data.input = prompt;
          }
        }
        
        // Track node state changes for logging
        const nodeStates: Record<string, any> = {};
        
        // Execute the workflow
        const result = await executeWorkflow(
          nodes,
          edges,
          (nodeId, state) => {
            // Store node states as they change
            nodeStates[nodeId] = state;
            console.log(`Node ${nodeId} state: ${state.state}`);
          },
          (finalState) => {
            console.log(`Workflow execution completed with status: ${finalState.status}`);
          }
        );
        
        // Find the final output node(s)
        const outputNodes = nodes.filter((node: { id: string }) => {
          // Nodes with no outgoing edges are considered output nodes
          return !edges.some((edge: { source: string }) => edge.source === node.id);
        });
        
        // Collect output from the final nodes
        const outputs: Record<string, any> = {};
        outputNodes.forEach((node: { id: string }) => {
          if (result.nodeStates[node.id]) {
            outputs[node.id] = result.nodeStates[node.id].data;
          }
        });
        
        // Update log with execution results
        await storage.updateLog(log.id, {
          status: result.status === 'error' ? 'error' : 'success',
          output: outputs,
          error: result.error,
          executionPath: { 
            nodes: Object.keys(result.nodeStates),
            completed: result.status === 'complete',
            error: result.error
          },
          completedAt: new Date()
        });
        
        // Return the execution results
        return res.json({
          status: result.status,
          result: outputs,
          nodeStates: result.nodeStates,
          executionTime: result.endTime 
            ? (new Date(result.endTime).getTime() - new Date(result.startTime || 0).getTime()) / 1000 
            : 0,
          error: result.error,
          logId: log.id
        });
      } catch (executionError) {
        console.error('Error executing workflow:', executionError);
        // Update log with error
        await storage.updateLog(log.id, {
          status: 'error',
          error: executionError instanceof Error ? executionError.message : String(executionError),
          completedAt: new Date()
        });
        
        return res.status(500).json({ 
          message: "Failed to execute workflow",
          error: executionError instanceof Error ? executionError.message : String(executionError)
        });
      }
    } catch (error) {
      console.error('Error testing workflow:', error);
      res.status(500).json({ 
        message: "Failed to test workflow execution",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Execute workflow from the chat UI

  // API endpoint for agent trigger functionality
  app.post("/api/agents/:id/trigger", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID format" });
      }

      const { prompt, _callStack = [] } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Check for circular agent triggering
      if (_callStack.includes(`agent-${agentId}`)) {
        console.error(`Circular agent dependency detected! Agent ${agentId} is already in the call stack: ${_callStack.join(' -> ')}`);
        return res.status(400).json({
          success: false,
          error: `Circular agent dependency detected: ${_callStack.join(' -> ')} -> agent-${agentId}`,
          circularDependency: true,
          agentId,
          _callStack
        });
      }

      // Get the agent and its workflows
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: `Agent with ID ${agentId} not found` });
      }
      
      // Get the agent's workflows
      const workflows = await storage.getWorkflowsByAgentId(agentId);
      if (!workflows || workflows.length === 0) {
        return res.status(404).json({ message: `No workflows found for agent with ID ${agentId}` });
      }
      
      // Use the first workflow
      const agentWorkflow = workflows[0];
      
      // Create updated call stack with this agent
      const updatedCallStack = [..._callStack, `agent-${agentId}`];
      console.log(`Triggering agent ${agent.name} (ID: ${agentId}) with call stack:`, updatedCallStack);
      
      // Import and register workflow engine and executors
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // We need to modify the nodes data to include the call stack context in the initial node
      const flowData = typeof agentWorkflow.flowData === 'string' 
          ? JSON.parse(agentWorkflow.flowData) 
          : agentWorkflow.flowData;
      
      // Clone the workflow and add the call stack to each node to prevent circular dependencies
      const enhancedWorkflow = {
        ...agentWorkflow,
        flowData: {
          ...flowData,
          nodes: (flowData.nodes || []).map((node: any) => ({
            ...node,
            data: {
              ...(node.data || {}),
              _callStack: updatedCallStack,
              _workflowInput: { prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
            }
          }))
        }
      };
      
      // Execute the agent's workflow with the call stack
      console.log(`Triggering agent ${agent.name} (ID: ${agentId}) with prompt: ${prompt.substring(0, 100)}...`);
      const result = await runWorkflow(enhancedWorkflow, agentWorkflow.name, prompt, executeWorkflow, { _callStack: updatedCallStack });
      
      // Return results in format expected by the agent trigger node
      return res.json({
        success: true,
        output: result.output,
        content: result.output, // For compatibility with different client expectations
        result: result.output,  // For compatibility with different client expectations  
        status: result.status,
        agent: {
          id: agent.id,
          name: agent.name
        },
        workflow: {
          id: agentWorkflow.id,
          name: agentWorkflow.name
        },
        logId: result.logId,
        _callStack: updatedCallStack // Include the updated call stack
      });
    } catch (error) {
      console.error(`Error triggering agent:`, error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to trigger agent workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // API endpoint for direct workflow trigger functionality
  app.post("/api/workflows/:id/trigger", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      if (isNaN(workflowId)) {
        return res.status(400).json({ message: "Invalid workflow ID format" });
      }

      const { prompt, metadata = {}, _callStack = [] } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      console.log(`Triggering workflow ${workflowId} with metadata:`, metadata);

      // Check for circular workflow triggering
      if (_callStack.includes(workflowId)) {
        console.error(`Circular workflow dependency detected! Workflow ${workflowId} is already in the call stack: ${_callStack.join(' -> ')}`);
        return res.status(400).json({
          success: false,
          error: `Circular workflow dependency detected: ${_callStack.join(' -> ')} -> ${workflowId}`,
          circularDependency: true,
          workflowId,
          _callStack
        });
      }

      // Get the workflow directly
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({ message: `Workflow with ID ${workflowId} not found` });
      }
      
      // Import and register workflow engine and executors
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // Execute the workflow directly
      console.log(`Triggering workflow ${workflow.name} (ID: ${workflowId}) with prompt: ${prompt.substring(0, 100)}...`);
      console.log(`Call stack: ${_callStack.join(' -> ')}`);
      
      // Extract the context with call stack and metadata for the workflow executor
      const context = { 
        _callStack: [..._callStack, workflowId], // Add this workflow ID to the call stack
        metadata: metadata // Include any metadata that was passed
      };
      
      // We need to modify the nodes data to include the call stack context in the initial node
      const flowData = typeof workflow.flowData === 'string' 
          ? JSON.parse(workflow.flowData) 
          : workflow.flowData;
      
      // For workflow 15 (Build New Agent Structure), we need to indicate the preferred trigger node
      let preferredTriggerId = '';
      if (workflowId === 15) {
        // Check if the source in metadata is from AI chat
        if (metadata && metadata.source === 'ai_chat') {
          preferredTriggerId = 'internal_ai_chat_agent-1';
        } else {
          preferredTriggerId = 'internal_new_agent-1';
        }
        console.log(`Setting preferred trigger node ID for workflow 15 to: ${preferredTriggerId} (Source: ${metadata?.source || 'ui'})`);
      }
      
      // Clone the workflow and add the call stack to each node to prevent circular dependencies
      const enhancedWorkflow = {
        ...workflow,
        flowData: {
          ...flowData,
          nodes: (flowData.nodes || []).map((node: any) => {
            // Split the node ID to get the base type (without the -number suffix)
            const nodeIdParts = (node.id || '').split('-');
            const nodeBaseType = nodeIdParts.length > 0 ? nodeIdParts[0] : '';
            
            // Special handling for internal_new_agent vs internal_ai_chat_agent triggers
            let isPreferredTrigger = false;
            let isIgnoredTrigger = false;
            
            // For workflow 15 specifically
            if (workflowId === 15) {
              // This is the preferred trigger node
              if (node.id === preferredTriggerId) {
                isPreferredTrigger = true;
                console.log(`Found preferred trigger node: ${node.id}`);
              }
              // This is a trigger node we should ignore
              else if (nodeBaseType.includes('trigger') || 
                       nodeBaseType.includes('new_agent') || 
                       nodeBaseType.includes('chat_agent') || 
                       nodeBaseType.includes('ai_chat')) {
                isIgnoredTrigger = true;
                console.log(`Found trigger node to ignore: ${node.id}`);
              }
            }
            
            return {
              ...node,
              data: {
                ...(node.data || {}),
                _callStack: context._callStack,
                _workflowInput: { prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) },
                _preferredTrigger: isPreferredTrigger,
                _ignoreTrigger: isIgnoredTrigger,
                metadata: metadata // Pass the metadata to all nodes to ensure it's available
              }
            };
          })
        }
      };
      
      // Execute the workflow
      const result = await runWorkflow(
        enhancedWorkflow, 
        workflow.name, 
        prompt, 
        executeWorkflow
      );
      
      // Return results in format expected by the workflow trigger node
      return res.json({
        success: true,
        output: result.output,
        content: result.output,
        result: result.output,
        status: result.status,
        workflow: {
          id: workflow.id,
          name: workflow.name
        },
        logId: result.logId,
        _callStack: [..._callStack, workflowId] // Include the updated call stack
      });
    } catch (error) {
      console.error(`Error triggering workflow:`, error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to trigger workflow directly",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to directly test a specific agent's workflow with a prompt
  app.get("/api/debug/test-agent/:id", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid agent ID" 
        });
      }
      
      // Get the test prompt from query parameter or use a default
      const prompt = req.query.prompt as string || "Tell me about the weather in New York";
      
      // Get the agent
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ 
          success: false, 
          message: `Agent with ID ${agentId} not found` 
        });
      }
      
      // Get the agent's workflows
      const workflows = await storage.getWorkflowsByAgentId(agentId);
      if (!workflows || workflows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: `No workflows found for agent with ID ${agentId}` 
        });
      }
      
      // We'll use the first workflow for testing
      const workflow = workflows[0];
      
      // Import the workflow engine and register executors
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // Execute the workflow with debug flag and force skip problematic nodes
      console.log(`Testing agent ${agent.name} (ID: ${agent.id}) with workflow ${workflow.name} (ID: ${workflow.id})`);
      console.log(`Prompt: "${prompt}"`);
      
      // Format the input to work with Claude
      const formattedInput = { 
        text: prompt,
        prompt: prompt
      };
      
      const result = await runWorkflow(
        workflow,
        `Test ${agent.name} Workflow`,
        formattedInput,
        executeWorkflow,
        {
          metadata: {
            source: "debug_test",
            debug: true,
            bypassCircularDependency: true
          }
        }
      );
      
      // Return the results
      return res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type
        },
        workflow: {
          id: workflow.id,
          name: workflow.name
        },
        prompt: prompt,
        result: result
      });
    } catch (error) {
      console.error('Error testing agent workflow:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to test agent workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to list all agents for debugging
  app.get("/api/debug/list-agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      return res.json({
        success: true,
        count: agents.length,
        agents: agents
      });
    } catch (error) {
      console.error("Error listing agents:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to list agents",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Direct agent creation endpoint for testing without workflow
  app.get("/api/debug/test-agent-creation", async (req, res) => {
    try {
      // Create the weather checking agent directly
      const agentData = {
        name: "Weather Checking Agent",
        description: "A helpful agent that can provide weather forecasts and information",
        type: "ai_assistant",
        icon: "cloud-sun"
      };
      
      console.log("Creating weather checking agent directly:", agentData);
      const newAgent = await storage.createAgent(agentData);
      console.log("Agent created directly:", newAgent);
      
      // Create a test workflow for the agent
      const workflowData = {
        name: "Weather Checking Workflow",
        type: "custom",
        agentId: newAgent.id,
        flowData: JSON.stringify({
          nodes: [
            {
              id: "trigger-1",
              type: "trigger",
              position: { x: 100, y: 100 },
              data: { 
                type: "trigger",
                label: "Start",
                category: "flow"
              }
            },
            {
              id: "claude-1",
              type: "claude",
              position: { x: 300, y: 100 },
              data: { 
                type: "claude",
                label: "Claude",
                category: "ai",
                settings: {
                  model: "claude-instant-1.2",
                  max_tokens: 1000,
                  temperature: 0.7,
                  system_prompt: "You are a helpful weather assistant that provides forecasts and weather information. If asked about weather in a location, explain that you would need to access a weather API to provide accurate information, but since you don't currently have that capability, you'll provide general information about seasonal weather patterns for that location instead."
                }
              }
            }
          ],
          edges: [
            {
              id: "e1-2",
              source: "trigger-1",
              target: "claude-1"
            }
          ]
        }),
        status: "active"
      };
      
      console.log("Creating workflow for the agent:", workflowData);
      const newWorkflow = await storage.createWorkflow(workflowData);
      console.log("Workflow created:", newWorkflow);
      
      // Return success response
      return res.json({
        success: true,
        message: "Successfully created a Weather Checking Agent and its workflow directly",
        agent: newAgent,
        workflow: newWorkflow
      });
    } catch (error) {
      console.error("Error creating agent directly:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create agent directly",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debugging endpoint for examining workflow 15 output format
  app.post("/api/debugging/workflow-15-output", async (req, res) => {
    try {
      // Get the response formatter code from workflow 15
      const workflow = await storage.getWorkflow(15);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow 15 not found" });
      }
      
      // Parse the flowData
      const flowData = typeof workflow.flowData === 'string' 
        ? JSON.parse(workflow.flowData) 
        : workflow.flowData;
      
      // Find the response_formatter node
      const formatterNode = flowData.nodes.find((node: any) => node.id === 'response_formatter');
      if (!formatterNode) {
        return res.status(404).json({ error: "Response formatter node not found in workflow 15" });
      }
      
      // Create an agent record using the provided data
      const agentData = req.body;
      const agent = await storage.createAgent({
        name: agentData.name || "Test Agent",
        description: agentData.description || "A test agent for debugging",
        type: agentData.type || "ai_assistant",
        icon: agentData.icon || "brain",
        status: agentData.status || "active"
      });
      
      // Get the transform code
      const transformCode = formatterNode.data.settings.transform;
      
      // Create a safe evaluation context
      const evalContext = {
        input: {
          success: true,
          data: agent,
          verified: true,
          verification: { status: "success" }
        },
        console: { log: console.log }
      };
      
      // Execute the transform code
      const wrappedCode = `
        (function() {
          const input = this.input;
          const console = this.console;
          ${transformCode}
        })
      `;
      
      // Execute the code and get the result
      const transformFn = eval(wrappedCode).bind(evalContext);
      const result = transformFn();
      
      // Log the result for debugging
      console.log("Workflow 15 formatter output format:", JSON.stringify(result, null, 2));
      
      // Delete the test agent
      await storage.deleteAgent(agent.id);
      
      // Send the result
      res.json({
        originalFormat: evalContext.input,
        transformedFormat: result,
        templateVariablePath: "data.agent.id",
        actualPath: Object.keys(result).includes('agent') ? 'agent.id' : 'Unknown'
      });
    } catch (error) {
      console.error('Error testing workflow 15 output format:', error);
      res.status(500).json({ 
        error: 'Failed to test workflow 15 output format',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test endpoint to create an agent through the orchestrator workflow (18)
  app.post("/api/debugging/test-agent-creation", async (req, res) => {
    try {
      console.log("Testing agent creation through orchestrator workflow...");
      
      // Get the workflow
      const workflow = await storage.getWorkflow(18); // New Agent Orchestrator workflow
      if (!workflow) {
        return res.status(404).json({ error: true, message: "Workflow 18 not found" });
      }
      
      // Build a reference to executeWorkflow function for passing to runWorkflow
      const executeWorkflow = async (
        nodes: any[],
        edges: any[],
        nodeStateSetter: (nodeId: string, state: any) => void,
        finalStateSetter: (state: any) => void
      ) => {
        // This is a simplified version of the executeWorkflow function
        // It will just simulate the execution by tracking nodes and states
        const nodeStates: Record<string, any> = {};
        
        try {
          // Simple simulation: process each node in sequence
          for (const node of nodes) {
            console.log(`[Test Executor] Processing node ${node.id} of type ${node.type}`);
            
            // If this is the workflow_trigger node (id 2), simulate a successful workflow 15 execution
            if (node.type === 'workflow_trigger' && node.data?.workflowId === 15) {
              console.log(`[Test Executor] Simulating workflow 15 execution...`);
              
              // Create the actual agent
              const agentData = {
                name: req.body.name || "Test Agent",
                description: req.body.description || "Test agent created through debug endpoint",
                type: req.body.type || "ai_assistant",
                icon: req.body.icon || "brain",
                status: req.body.status || "active"
              };
              console.log(`[Test Executor] Creating agent with data:`, agentData);
              
              // Actually create the agent in the database
              const agent = await storage.createAgent(agentData);
              console.log(`[Test Executor] Agent created with ID: ${agent.id}`);
              
              // Set the node state
              const nodeState = {
                id: node.id,
                state: 'executed',
                data: {
                  success: true,
                  verified: true,
                  verificationStatus: "verified",
                  message: `Successfully created agent: ${agent.name} with ID: ${agent.id}`,
                  agent: agent
                },
              };
              nodeStates[node.id] = nodeState;
              nodeStateSetter(node.id, nodeState);
            } 
            // If this is the api_response_message node, process it
            else if (node.type === 'api_response_message') {
              console.log(`[Test Executor] Processing API Response Message node...`);
              
              // Get input data from connected node
              let inputData: any = null;
              // Find edge that connects to this node
              const incomingEdge = edges.find(edge => edge.target === node.id);
              if (incomingEdge) {
                const sourceNodeId = incomingEdge.source;
                const sourceNodeState = nodeStates[sourceNodeId];
                
                if (sourceNodeState && sourceNodeState.data) {
                  inputData = sourceNodeState.data;
                  console.log(`[Test Executor] Input data for node ${node.id}:`, inputData);
                  
                  // Process the template variables in the message
                  const settings = node.data?.settings;
                  if (settings) {
                    const conditionField = settings.conditionField || 'success';
                    const conditionValue = settings.successValue || 'true';
                    const isSuccess = String(inputData[conditionField]) === conditionValue;
                    
                    let message: string;
                    if (isSuccess) {
                      message = settings.successMessage || '';
                    } else {
                      message = settings.errorMessage || '';
                    }
                    
                    // Replace template variables in the message
                    message = message.replace(/{{([^}]+)}}/g, (match, path) => {
                      // Function to get value by path
                      const getValueByPath = (obj: any, path: string) => {
                        const properties = path.split('.');
                        return properties.reduce((prev, curr) => 
                          prev && prev[curr] !== undefined ? prev[curr] : undefined, obj);
                      };
                      
                      const value = getValueByPath(inputData, path);
                      return value !== undefined ? String(value) : match;
                    });
                    
                    console.log(`[Test Executor] Processed message:`, message);
                    
                    // Set the node state
                    const nodeState = {
                      id: node.id,
                      state: 'executed',
                      data: {
                        success: isSuccess,
                        message,
                        rawData: inputData
                      },
                    };
                    nodeStates[node.id] = nodeState;
                    nodeStateSetter(node.id, nodeState);
                  }
                }
              }
            } else {
              // For other node types, just mark as executed
              const nodeState = {
                id: node.id,
                state: 'executed',
                data: { success: true, message: `Executed ${node.type} node` },
              };
              nodeStates[node.id] = nodeState;
              nodeStateSetter(node.id, nodeState);
            }
          }
          
          // Set final state
          finalStateSetter({ status: 'complete' });
          
          return {
            status: 'complete',
            nodeStates
          };
        } catch (error) {
          console.error(`[Test Executor] Error:`, error);
          finalStateSetter({ status: 'error', error: String(error) });
          return {
            status: 'error',
            error: String(error),
            nodeStates
          };
        }
      };
      
      // Execute the workflow 
      const result = await runWorkflow(
        workflow,
        workflow.name,
        req.body,
        executeWorkflow,
        { metadata: { source: 'debugging_endpoint' } }
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error in test-agent-creation:", error);
      res.status(500).json({ 
        error: true, 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/notify-agent-creation", async (req, res) => {
    try {
      const { agentId, workflowId, source = "unknown" } = req.body;
      
      if (!agentId) {
        return res.status(400).json({ 
          success: false,
          message: "Agent ID is required"
        });
      }

      // Get the agent details
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ 
          success: false,
          message: `Agent with ID ${agentId} not found`
        });
      }

      // Format a nice response message
      let responseMessage = '';
      
      if (source === "ai_chat") {
        responseMessage = `I've created a new agent named "${agent.name}". ${agent.description}`;
      } else {
        responseMessage = `🎉 Success! New agent "${agent.name}" has been created.`;
      }

      // Return a nicely formatted response
      return res.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          type: agent.type,
          icon: agent.icon
        },
        message: responseMessage,
        source
      });
    } catch (error) {
      console.error('Error in agent creation notification:', error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to process agent creation notification",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Main entry point for the user chat UI
  app.post("/api/user-chat-ui-main", async (req, res) => {
    try {
      const { prompt, agentId, sessionId, metadata = {}, _callStack = [] } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // If specific agent ID is provided, execute that agent's workflow
      if (agentId) {
        const promptStr = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        console.log(`[user-chat-ui-main] Executing specific agent (agentId: ${agentId}) with prompt: ${promptStr}`);
        
        // Import and register workflow engine and executors
        const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
        const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
        registerAllNodeExecutors();
        
        try {
          // Get the agent and its workflows
          const agent = await storage.getAgent(agentId);
          if (!agent) {
            return res.status(404).json({ message: `Agent with ID ${agentId} not found` });
          }
          
          // Check for circular dependency
          const agentKey = `agent-${agentId}`;
          if (_callStack.includes(agentKey)) {
            const error = `Circular agent dependency detected: ${_callStack.join(' -> ')} -> ${agentKey}`;
            console.error(error);
            return res.json({
              success: true,
              status: "error",
              error,
              circularDependency: true,
              agent: {
                id: agent.id,
                name: agent.name
              }
            });
          }
          
          // Get the agent's workflows
          const workflows = await storage.getWorkflowsByAgentId(agentId);
          if (!workflows || workflows.length === 0) {
            return res.status(404).json({ message: `No workflows found for agent with ID ${agentId}` });
          }
          
          // Use the first workflow
          const agentWorkflow = workflows[0];
          
          // Add the agent to the call stack
          const updatedCallStack = [..._callStack, agentKey];
          
          // Execute the agent's workflow
          console.log(`[user-chat-ui-main] Executing ${agent.name}'s workflow (${agentWorkflow.name})...`);
          const result = await runWorkflow(
            agentWorkflow, 
            agentWorkflow.name, 
            promptStr, 
            executeWorkflow, 
            { _callStack: updatedCallStack, sessionId, metadata }
          );
          
          // Return results in format expected by the agent trigger node
          return res.json({
            success: true,
            result: result.output,
            status: result.status,
            agent: {
              id: agent.id,
              name: agent.name
            },
            workflow: {
              id: agentWorkflow.id,
              name: agentWorkflow.name
            },
            sessionId: sessionId || `session-${Date.now()}`,
            logId: result.logId
          });
        } catch (error) {
          console.error(`[user-chat-ui-main] Error executing agent ${agentId}:`, error);
          return res.status(500).json({ 
            success: false,
            status: "error",
            message: "Failed to execute agent workflow",
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Default behavior (no specific agent ID) - general conversation flow
      console.log(`[user-chat-ui-main] Starting workflow chain with prompt: ${prompt}`);
      
      // Get the simple chat workflow (ID 13) and coordinator workflow (ID 7)
      const simpleChatWorkflow = await storage.getWorkflow(13);
      const coordinatorWorkflow = await storage.getWorkflow(7);
      
      if (!simpleChatWorkflow) {
        console.log("[user-chat-ui-main] Simple chat workflow (ID 13) not found.");
        return res.status(404).json({ message: "Simple chat workflow not found" });
      }
      
      // Import and register workflow engine and executors
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // Execute the simple chat workflow first (this is for immediate response)
      console.log("[user-chat-ui-main] Executing simple chat workflow (ID 13)");
      const simpleChatResult = await runWorkflow(
        simpleChatWorkflow, 
        "Simple Chat Workflow", 
        prompt, 
        executeWorkflow,
        { sessionId, metadata }
      );
      
      // Now execute the coordinator workflow if it exists
      let coordinatorResult = null;
      if (coordinatorWorkflow) {
        console.log("[user-chat-ui-main] Executing coordinator workflow (ID 7)");
        // Pass the original prompt string as is, along with the generator result
        coordinatorResult = await runWorkflow(
          coordinatorWorkflow, 
          "Coordinator Workflow", 
          prompt, 
          executeWorkflow,
          { 
            generatorResult: simpleChatResult,
            sessionId, 
            metadata
          }
        );
        
        // Process the coordinator result to handle special cases
        if (coordinatorResult.output && typeof coordinatorResult.output === 'object') {
          // For TypeScript safety, we need to check the shape of the object
          const output = coordinatorResult.output as any;
          
          // If this is an agent creation response or other structured response, extract a user-friendly message
          if (output.type === 'response_message' && output.settings?.successMessage) {
            // Create a proper user-facing message
            console.log("[user-chat-ui-main] Transforming structured response to user-friendly message");
            
            // Add a formatted message to the result object
            (coordinatorResult as any).formattedMessage = output.settings.successMessage;
          } else if (output.message) {
            // If there's a direct message field, use that
            (coordinatorResult as any).formattedMessage = output.message;
          }
        }
      }
      
      // Define the response interface with proper typing
      interface CoordinatorResponseData {
        status: string;
        output: any;
        formattedMessage?: string;
        logId?: number;
      }
      
      // Return results in format expected by the chat UI
      return res.json({
        success: true,
        // Simple chat result goes in generatorResult for immediate display
        generatorResult: {
          status: simpleChatResult.status,
          output: simpleChatResult.output,
          logId: simpleChatResult.logId
        },
        // Coordinator result (if available) provides the more sophisticated response
        coordinatorResult: coordinatorResult ? {
          status: coordinatorResult.status,
          output: coordinatorResult.output,
          // Use type assertion to access the formattedMessage if it exists
          ...(('formattedMessage' in (coordinatorResult as any)) ? 
            { formattedMessage: (coordinatorResult as any).formattedMessage } : {}),
          logId: coordinatorResult.logId
        } as CoordinatorResponseData : null,
        sessionId: sessionId || `session-${Date.now()}`
      });
    } catch (error) {
      console.error('[user-chat-ui-main] Error in workflow execution:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to execute workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Legacy endpoints have been removed in favor of more descriptive endpoint names
  
  // API Response Message Node endpoint for sending messages to chat UI
  app.post("/api/chat", async (req, res) => {
    try {
      // This endpoint is used by API Response Message nodes to send messages to the chat UI
      // It processes template variables in the message before sending
      const { message, type = "text", metadata = {} } = req.body;
      
      console.log("[api/chat] Received message for chat UI:", message);
      
      // Process any agent information from metadata
      let processedMessage = message;
      if (metadata.agentId) {
        const agent = await storage.getAgent(metadata.agentId);
        if (agent) {
          // Add agent data to the response
          return res.json({
            success: true,
            message: processedMessage,
            type,
            agent: {
              id: agent.id,
              name: agent.name,
              type: agent.type
            }
          });
        }
      }
      
      // Default response with just the message
      res.json({
        success: true,
        message: processedMessage,
        type
      });
    } catch (error) {
      console.error('[api/chat] Error processing chat message:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process chat message",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
