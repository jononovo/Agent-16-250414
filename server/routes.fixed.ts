import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { workflowService } from "./services/workflowService";
import { insertAgentSchema, insertWorkflowSchema, insertNodeSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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

async function runWorkflow(
  workflowId: number,
  input: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  // This is a stub function that returns a success response
  // In a real implementation, the client would execute the workflow
  // and then tell the server about the result via the /api/logs endpoint
  return {
    success: true,
    data: {
      message: "Workflow execution delegated to client",
      workflowId,
      input
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Workflows API
  app.get("/api/workflows", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const workflows = await workflowService.getWorkflows(type);
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
      
      const workflow = await workflowService.getWorkflow(id);
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
      const result = insertWorkflowSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const workflow = await workflowService.createWorkflow(result.data);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      const updateSchema = insertWorkflowSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedWorkflow = await workflowService.updateWorkflow(id, result.data);
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      await workflowService.deleteWorkflow(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Endpoint for client-side workflow execution
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await workflowService.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Create a log entry for the workflow execution
      const log = await workflowService.createLog({
        workflowId: id,
        agentId: workflow.agentId || 0,
        status: "running",
        input: req.body,
      });
      
      // Return a response with the log ID so the client can update it later
      res.json({
        success: true,
        message: "Workflow execution initiated",
        workflow: workflow,
        logId: log.id
      });
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to execute workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Node API
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
      
      const updatedNode = await storage.updateNode(id, result.data);
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

  // Logs API
  app.get("/api/logs", async (req, res) => {
    try {
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const logs = await workflowService.getLogs(agentId, limit);
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
      
      const log = await workflowService.getLog(id);
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
      
      const log = await workflowService.createLog(result.data);
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
      
      const log = await workflowService.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      const updateSchema = insertLogSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedLog = await workflowService.updateLog(id, result.data);
      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to update log" });
    }
  });

  // Internal API for creating agents via simplified workflow
  app.post("/api/internal/create-agent", async (req, res) => {
    try {
      // Parse and validate the request
      const result = createAgentFromInternal.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          success: false,
          message: validationError.message 
        });
      }
      
      const { source, trigger_type, input_data } = result.data;
      
      // Extract agent data from the input
      const agentData = {
        name: input_data.name || "New Agent",
        description: input_data.description || "Created via internal API",
        type: input_data.type || "custom",
        icon: input_data.icon || "brain",
        status: "active"
      };
      
      // Create the agent
      const agent = await storage.createAgent(agentData);
      
      // Create a response
      const response = {
        success: true,
        message: `Agent "${agentData.name}" created successfully`,
        source,
        trigger_type,
        agent
      };
      
      // If workflow template ID is provided, create a workflow based on that template
      if (result.data.workflow_template_id) {
        const templateId = result.data.workflow_template_id;
        
        // Get the template workflow
        const templateWorkflow = await workflowService.getWorkflow(templateId);
        if (!templateWorkflow) {
          return res.status(404).json({ 
            success: false,
            message: `Workflow template with ID ${templateId} not found` 
          });
        }
        
        // Create a new workflow based on the template
        const newWorkflow = await workflowService.createWorkflow({
          name: `${agentData.name} Workflow`,
          type: templateWorkflow.type,
          agentId: agent.id,
          flowData: templateWorkflow.flowData,
        });
        
        // Add workflow to the response
        Object.assign(response, { workflow: newWorkflow });
      }
      
      return res.json(response);
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create agent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Special endpoint for Chat UI to send messages to the coordinator
  app.post("/api/user-chat-ui-main", async (req, res) => {
    try {
      const { message, prompt } = req.body;
      
      if (!message && !prompt) {
        return res.status(400).json({
          success: false,
          message: "No message or prompt provided"
        });
      }
      
      const userInput = message || prompt;
      console.log("Chat UI input:", userInput);
      
      // Find the coordinator agent (ID 7)
      const coordinatorId = 7;
      const coordinator = await storage.getAgent(coordinatorId);
      
      if (!coordinator) {
        return res.status(404).json({
          success: false,
          message: "Coordinator agent not found"
        });
      }
      
      // Get coordinator workflows
      const workflows = await workflowService.getWorkflowsByAgentId(coordinatorId);
      if (!workflows || workflows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No workflows found for coordinator agent"
        });
      }
      
      // Create a log for this request
      const log = await workflowService.createLog({
        agentId: coordinatorId,
        workflowId: workflows[0].id,
        status: "running",
        input: { prompt: userInput }
      });
      
      // Return a response that indicates client should handle this
      return res.json({
        success: true,
        message: "Message received, client should execute coordinator workflow",
        agent: coordinator,
        workflow: workflows[0],
        input: userInput,
        logId: log.id
      });
    } catch (error) {
      console.error("Chat UI error:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing chat message",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const server = createServer(app);
  return server;
}