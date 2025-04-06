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
      console.log(`Trigger type: ${triggerType || 'none'}, Input:`, JSON.stringify(input || {}));
      
      // Create a log entry for the execution
      await storage.createLog({
        agentId: workflow.agentId || 0, // Provide default value if agentId is null
        workflowId: workflowId, // Add required workflowId
        status: 'running', // Add required status
        input: input || {}, // Add input field
        // Note: other fields like timestamp are handled by db defaults
      });
      
      // In a real implementation, we would actually execute the workflow
      // For now, we're just returning success
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
  app.post("/api/execute-agent-chain", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      console.log(`Executing workflow with prompt: ${prompt}`);
      
      // Try to get workflow 13 (our simple chat workflow)
      const requestedWorkflow = await storage.getWorkflow(13);
      
      if (!requestedWorkflow) {
        console.log("Workflow 13 not found.");
        return res.status(404).json({ message: "Simple chat workflow not found" });
      }
      
      console.log('Executing workflow 13...');
      
      // Create a log entry for this execution
      const workflowLog = await storage.createLog({
        agentId: requestedWorkflow.agentId || 0,
        workflowId: 13,
        status: "running",
        input: { prompt },
      });
      
      try {
        // Make sure workflow has flowData
        if (!requestedWorkflow.flowData) {
          await storage.updateLog(workflowLog.id, {
            status: "error",
            error: "Workflow has no flow data",
            completedAt: new Date()
          });
          return res.status(400).json({ message: "Workflow has no flow data" });
        }
        
        // Import and register workflow engine and executors
        const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
        const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
        registerAllNodeExecutors();
        
        // Parse the flow data
        const flowData = typeof requestedWorkflow.flowData === 'string' 
          ? JSON.parse(requestedWorkflow.flowData) 
          : requestedWorkflow.flowData;
        
        const nodes = flowData.nodes || [];
        const edges = flowData.edges || [];
        
        console.log(`Executing workflow with ${nodes.length} nodes and ${edges.length} edges`);
        
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
        
        // Initialize node states tracking
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
          return res.status(500).json({ 
            message: "Workflow execution failed",
            status: result.status,
            outputs,
            error: result.error,
            logId: workflowLog.id
          });
        }
        
        // Extract the primary output (first output node, or node named 'output')
        let primaryOutput = '';
        const outputNodeId = outputNodes[0]?.id || 'output';
        if (result.nodeStates[outputNodeId] && result.nodeStates[outputNodeId].data) {
          primaryOutput = result.nodeStates[outputNodeId].data;
        }
        
        // For compatibility with the existing chat UI, format the response with both coordinator and generator
        return res.json({
          success: true,
          coordinatorResult: {
            status: result.status,
            output: primaryOutput,
            logId: workflowLog.id
          },
          // For backward compatibility with the chat UI that expects both outputs
          generatorResult: {
            status: result.status,
            output: primaryOutput,
            logId: workflowLog.id
          }
        });
        
      } catch (executionError) {
        console.error('Error executing workflow:', executionError);
        // Update log with error
        await storage.updateLog(workflowLog.id, {
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
