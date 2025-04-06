import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertWorkflowSchema, insertNodeSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
  prompt: string, 
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
  
  // Execute standard workflow execution (our new node types will be used by the workflow engine)
  // The special case handling has been moved to the respective node executors
  
  // Create a log entry for standard workflow execution
  const workflowLog = await storage.createLog({
    agentId: workflow.agentId || 0,
    workflowId: workflow.id,
    status: "running",
    input: { prompt, ...context },
  });
  
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
    
    // Inject the prompt into the first text_input node
    const startNode = nodes.find((node: { type: string }) => node.type === 'text_input');
    if (startNode) {
      if (!startNode.data) startNode.data = {};
      startNode.data.inputText = prompt;
    } else if (nodes.length > 0) {
      // If no start node found, add the prompt as input to the first node
      if (!nodes[0].data) nodes[0].data = {};
      nodes[0].data.inputText = prompt;
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

  // Debug endpoint to help test the agent creation flow
  app.get("/api/debug/test-agent-creation", async (req, res) => {
    try {
      // Get the workflow for creating agents
      const createAgentWorkflow = await storage.getWorkflow(15);
      if (!createAgentWorkflow) {
        return res.status(404).json({
          success: false,
          message: "Create agent workflow (ID 15) not found"
        });
      }
      
      // Import workflow engine
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // Execute the workflow with test data
      const testPrompt = "Create a Weather Checking Agent that can provide weather forecasts";
      const result = await runWorkflow(
        createAgentWorkflow,
        "Test Create Agent Workflow",
        testPrompt,
        executeWorkflow,
        { 
          metadata: { 
            source: "ui_button",
            debug: true
          }
        }
      );
      
      return res.json({
        success: true,
        result: result
      });
    } catch (error) {
      console.error("Error testing agent creation:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to test agent creation",
        error: error instanceof Error ? error.message : String(error)
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

  app.post("/api/execute-agent-chain", async (req, res) => {
    try {
      const { prompt, agentId, metadata = {}, _callStack = [] } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // If specific agent ID is provided, execute that agent's workflow
      if (agentId) {
        const promptStr = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        console.log(`Executing specific agent chain (agentId: ${agentId}) with prompt: ${promptStr}`);
        
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
          console.log(`Executing ${agent.name}'s workflow (${agentWorkflow.name})...`);
          const result = await runWorkflow(
            agentWorkflow, 
            agentWorkflow.name, 
            promptStr, 
            executeWorkflow, 
            { _callStack: updatedCallStack, metadata: metadata }
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
            logId: result.logId
          });
        } catch (error) {
          console.error(`Error executing agent ${agentId}:`, error);
          return res.status(500).json({ 
            success: true,
            status: "error",
            message: "Failed to execute agent workflow",
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Default behavior (no specific agent ID) - general conversation flow
      console.log(`Starting intelligent chain execution with prompt: ${prompt}`);
      
      // Get the simple chat workflow (ID 13) and coordinator workflow (ID 7)
      const simpleChatWorkflow = await storage.getWorkflow(13);
      const coordinatorWorkflow = await storage.getWorkflow(7);
      
      if (!simpleChatWorkflow) {
        console.log("Simple chat workflow (ID 13) not found.");
        return res.status(404).json({ message: "Simple chat workflow not found" });
      }
      
      // Import and register workflow engine and executors
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      registerAllNodeExecutors();
      
      // Execute the simple chat workflow first (this is for immediate response)
      const simpleChatResult = await runWorkflow(simpleChatWorkflow, "Simple Chat Workflow", prompt, executeWorkflow);
      
      // Now execute the coordinator workflow if it exists
      let coordinatorResult = null;
      if (coordinatorWorkflow) {
        console.log("Executing Coordinator Workflow...");
        // Pass the original prompt string as is
        coordinatorResult = await runWorkflow(coordinatorWorkflow, "Coordinator Workflow", prompt, executeWorkflow);
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
          logId: coordinatorResult.logId
        } : null
      });
    } catch (error) {
      console.error('Error in workflow execution:', error);
      res.status(500).json({ 
        message: "Failed to execute workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
