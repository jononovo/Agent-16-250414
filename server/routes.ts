import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertWorkflowSchema, insertNodeSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
      const result = insertAgentSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const agent = await storage.createAgent(result.data);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
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
      const result = insertWorkflowSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const workflow = await storage.createWorkflow(result.data);
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
      
      // Execute the workflow (mock implementation - in a real app this would connect to the workflow engine)
      // For now, we'll just simulate execution and return a response
      
      // For simplicity, we'll check if this is the Coordinator Workflow and simulate its execution
      if (workflow.name === "Coordinator Workflow") {
        // Update log with success status
        const updatedLog = await storage.updateLog(log.id, {
          status: "success",
          output: { 
            response: `This is a test response from the Coordinator Workflow for prompt: "${prompt}". In a full implementation, this would execute the actual workflow nodes with Claude.` 
          },
          completedAt: new Date()
        });
        
        // Return the response
        return res.json({
          status: "success",
          result: updatedLog.output,
          logId: log.id
        });
      } else {
        // Handle other workflows or return a general response
        const updatedLog = await storage.updateLog(log.id, {
          status: "success",
          output: { 
            response: `Test execution of workflow "${workflow.name}" completed with prompt: "${prompt}". This is a simulated response.` 
          },
          completedAt: new Date()
        });
        
        return res.json({
          status: "success",
          result: updatedLog.output,
          logId: log.id
        });
      }
    } catch (error) {
      console.error('Error testing workflow:', error);
      res.status(500).json({ message: "Failed to test workflow execution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
