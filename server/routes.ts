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
  
  // Execute Generator Agent Workflow - Called by the Coordinator to create a new agent
  app.post("/api/execute-generator-workflow", async (req, res) => {
    try {
      const { specification, agentId } = req.body;
      
      if (!specification) {
        return res.status(400).json({ message: "Specification is required" });
      }
      
      console.log(`Executing Generator Agent workflow with specification for agent creation`);
      
      // Get the Generator Agent
      const generatorAgent = await storage.getAgent(agentId || 2); // Default to ID 2 = Generator Agent
      
      if (!generatorAgent) {
        return res.status(404).json({ message: "Generator Agent not found" });
      }
      
      // Import required modules
      const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
      const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
      
      // Register all node executors
      registerAllNodeExecutors();
      
      // Create a log entry for the generator execution
      const generatorLog = await storage.createLog({
        agentId: generatorAgent.id,
        workflowId: 0, // We'll create a workflow on the fly
        status: "running",
        input: { specification },
      });
      
      // Create or use an existing workflow for the Generator Agent
      let generatorWorkflow = await storage.getWorkflow(10); // Try to get workflow ID 10
      
      if (!generatorWorkflow) {
        // Create a simplified generator workflow for the first version
        generatorWorkflow = await storage.createWorkflow({
          name: "Agent Generator Workflow",
          description: "Creates new agents based on specifications",
          type: "custom",
          icon: "wand-magic-sparkles",
          status: "active",
          agentId: generatorAgent.id,
          flowData: {
            nodes: [
              {
                id: "input",
                type: "text_prompt",
                data: {
                  label: "Agent Specification",
                  description: "Specification for the agent to be created",
                  prompt: specification
                },
                position: { x: 50, y: 100 }
              },
              {
                id: "generator",
                type: "claude",
                data: {
                  label: "Generator Agent",
                  description: "Creates agent based on specification",
                  config: {
                    model: "claude-3-opus-20240229",
                    systemPrompt: "You are the Generator Agent responsible for creating new AI agents based on specifications. Follow these steps:\n\n1. Parse the agent specification\n2. Create a suitable agent name, description, and configuration\n3. Design an appropriate workflow for the agent\n4. Generate the JSON structure for both the agent and workflow\n\nRespond with a JSON object containing:\n- agentConfig: containing name, description, type, icon\n- workflowConfig: containing name, description, nodes, edges"
                  }
                },
                position: { x: 350, y: 100 }
              },
              {
                id: "creator",
                type: "api",
                data: {
                  label: "Agent Creator",
                  description: "Creates the actual agent in the system",
                  url: "/api/create-agent-workflow",
                  method: "POST"
                },
                position: { x: 650, y: 100 }
              },
              {
                id: "output",
                type: "visualize_text",
                data: {
                  label: "Output",
                  description: "Displays the result of agent creation"
                },
                position: { x: 950, y: 100 }
              }
            ],
            edges: [
              {
                id: "input-to-generator",
                source: "input",
                target: "generator",
                animated: true
              },
              {
                id: "generator-to-creator",
                source: "generator",
                target: "creator",
                animated: true
              },
              {
                id: "creator-to-output",
                source: "creator",
                target: "output",
                animated: true
              }
            ]
          }
        });
        
        console.log(`Created new generator workflow with ID: ${generatorWorkflow.id}`);
      }
      
      // Update the workflow ID in the log
      await storage.updateLog(generatorLog.id, {
        workflowId: generatorWorkflow.id
      });
      
      // Execute the Generator workflow
      const flowData = generatorWorkflow.flowData as { 
        nodes: any[];
        edges: any[];
      };
      
      // Inject the specification into the first text_prompt node
      const inputNode = flowData.nodes.find((node: { id: string }) => node.id === "input");
      if (inputNode) {
        if (!inputNode.data) inputNode.data = {};
        inputNode.data.prompt = specification;
      }
      
      // Execute the workflow
      const generatorResult = await executeWorkflow(
        flowData.nodes, 
        flowData.edges, 
        (nodeId, state) => {
          console.log(`Generator node ${nodeId} state: ${state.state}`);
        },
        (finalState) => {
          console.log(`Generator workflow execution completed with status: ${finalState.status}`);
        }
      );
      
      // Update the log with the result
      await storage.updateLog(generatorLog.id, {
        status: generatorResult.status === 'error' ? 'error' : 'success',
        output: generatorResult.nodeStates,
        error: generatorResult.error,
        executionPath: { 
          nodes: Object.keys(generatorResult.nodeStates),
          completed: generatorResult.status === 'complete',
          error: generatorResult.error
        },
        completedAt: new Date()
      });
      
      // Extract output from the output node
      const outputNode = flowData.nodes.find((node: { id: string }) => node.id === "output");
      let output = "";
      if (outputNode && generatorResult.nodeStates[outputNode.id]) {
        output = generatorResult.nodeStates[outputNode.id].data;
      }
      
      return res.json({
        success: true,
        status: generatorResult.status,
        output,
        logId: generatorLog.id
      });
      
    } catch (error) {
      console.error('Error executing generator workflow:', error);
      return res.status(500).json({ 
        message: "Failed to execute generator workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // API to create an agent and its workflow based on generator output
  app.post("/api/create-agent-workflow", async (req, res) => {
    try {
      const { agentConfig, workflowConfig } = req.body;
      
      if (!agentConfig || !workflowConfig) {
        return res.status(400).json({ message: "Agent and workflow configurations are required" });
      }
      
      // Create the agent
      const agent = await storage.createAgent({
        name: agentConfig.name,
        description: agentConfig.description,
        type: agentConfig.type || "custom",
        icon: agentConfig.icon || "robot",
        status: "draft"
      });
      
      // Create the workflow and link it to the agent
      const workflow = await storage.createWorkflow({
        name: workflowConfig.name,
        description: workflowConfig.description,
        type: "custom",
        icon: workflowConfig.icon || "flow-chart",
        status: "draft",
        agentId: agent.id,
        flowData: {
          nodes: workflowConfig.nodes || [],
          edges: workflowConfig.edges || []
        }
      });
      
      return res.json({
        success: true,
        message: `Successfully created agent '${agent.name}' with workflow '${workflow.name}'`,
        agent,
        workflow
      });
      
    } catch (error) {
      console.error('Error creating agent and workflow:', error);
      return res.status(500).json({ 
        message: "Failed to create agent and workflow",
        error: error instanceof Error ? error.message : String(error)
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

  // Execute Coordinator Agent and then Generator Agent chain
  app.post("/api/execute-agent-chain", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      console.log(`Executing Coordinator-Generator Agent chain with prompt: ${prompt}`);
      
      // Check if there's a coordinator workflow from JSON file
      const fs = require('fs');
      let coordinatorWorkflow;
      
      try {
        // Try to load the coordinator workflow from the JSON file
        const coordinatorData = fs.readFileSync('coordinator_workflow_new.json', 'utf8');
        const coordinatorFlowData = JSON.parse(coordinatorData);
        
        // Find coordinator agent ID
        const coordinatorAgent = await storage.getAgent(1); // ID 1 = Coordinator Agent
        
        if (!coordinatorAgent) {
          console.log('Coordinator agent not found, using DB workflow instead');
        } else {
          // Find or create a workflow for the Coordinator Agent
          let workflowFromDB = await storage.getWorkflow(9);
          
          if (!workflowFromDB) {
            // Create a new workflow with the json data
            workflowFromDB = await storage.createWorkflow({
              name: "Coordinator Agent Workflow",
              description: "Handles the agent building process by coordinating with the Generator Agent",
              type: "custom",
              icon: "robot",
              status: "active",
              agentId: coordinatorAgent.id,
              flowData: coordinatorFlowData
            });
            
            console.log(`Created new coordinator workflow with ID: ${workflowFromDB.id}`);
          } else {
            // Update the existing workflow
            const updatedWorkflow = await storage.updateWorkflow(workflowFromDB.id, {
              flowData: coordinatorFlowData
            });
            
            if (updatedWorkflow) {
              workflowFromDB = updatedWorkflow;
              console.log(`Updated existing coordinator workflow with ID: ${workflowFromDB.id}`);
            } else {
              console.log(`Failed to update workflow with ID: ${workflowFromDB.id}`);
            }
          }
          
          coordinatorWorkflow = workflowFromDB;
        }
      } catch (error) {
        console.log('Error loading coordinator workflow from file:', error);
        // Fallback to the database workflow
        coordinatorWorkflow = await storage.getWorkflow(9);
      }
      
      if (!coordinatorWorkflow) {
        return res.status(404).json({ message: "Coordinator workflow not found" });
      }
      
      console.log('Executing Coordinator workflow...');
      
      // Create a log entry for the coordinator execution
      const coordinatorLog = await storage.createLog({
        agentId: coordinatorWorkflow.agentId || 0,
        workflowId: coordinatorWorkflow.id,
        status: "running",
        input: { prompt },
      });
      
      try {
        // Import required modules
        const { executeWorkflow } = await import('../client/src/lib/workflowEngine');
        const { registerAllNodeExecutors } = await import('../client/src/lib/nodeExecutors');
        
        // Register all node executors
        registerAllNodeExecutors();
        
        // Execute the Coordinator workflow
        if (!coordinatorWorkflow.flowData) {
          throw new Error("Coordinator workflow has no flow data");
        }
        
        // Ensure flowData is correctly typed
        const flowData = coordinatorWorkflow.flowData as { 
          nodes: any[];
          edges: any[];
        };
        
        // Inject the prompt into the first text_prompt node
        const startNode = flowData.nodes.find((node: { type: string }) => node.type === 'text_prompt' || node.type === 'prompt');
        if (startNode) {
          if (!startNode.data) startNode.data = {};
          startNode.data.prompt = prompt;
        } else {
          // If no start node found, just add the prompt as input to the first node
          if (flowData.nodes.length > 0) {
            if (!flowData.nodes[0].data) flowData.nodes[0].data = {};
            flowData.nodes[0].data.input = prompt;
          }
        }
        
        // Initialize node states storage
        const nodeStates: Record<string, any> = {};
        
        const coordinatorResult = await executeWorkflow(
          flowData.nodes, 
          flowData.edges, 
          (nodeId, state) => {
            // Store node states as they change
            nodeStates[nodeId] = state;
            console.log(`Coordinator node ${nodeId} state: ${state.state}`);
          },
          (finalState) => {
            console.log(`Coordinator workflow execution completed with status: ${finalState.status}`);
          }
        );
        
        // Find the output nodes in the coordinator workflow
        const coordinatorOutputNodes = flowData.nodes.filter((node: { id: string }) => {
          // Nodes with no outgoing edges are considered output nodes
          return !flowData.edges.some((edge: { source: string }) => edge.source === node.id);
        });
        
        // Collect output from the final nodes
        const coordinatorOutputs: Record<string, any> = {};
        coordinatorOutputNodes.forEach((node: { id: string }) => {
          if (coordinatorResult.nodeStates[node.id]) {
            coordinatorOutputs[node.id] = coordinatorResult.nodeStates[node.id].data;
          }
        });
        
        // Update the log with the result
        await storage.updateLog(coordinatorLog.id, {
          status: coordinatorResult.status === 'error' ? 'error' : 'success',
          output: coordinatorOutputs,
          error: coordinatorResult.error,
          executionPath: { 
            nodes: Object.keys(coordinatorResult.nodeStates),
            completed: coordinatorResult.status === 'complete',
            error: coordinatorResult.error
          },
          completedAt: new Date()
        });
        
        // Convert nodeStates to result format for compatibility
        if (coordinatorResult.status !== 'complete') {
          return res.status(500).json({ 
            message: "Coordinator workflow execution failed",
            status: coordinatorResult.status,
            outputs: coordinatorOutputs,
            error: coordinatorResult.error,
            logId: coordinatorLog.id
          });
        }
        
        // Get the output from the output node (assuming there's only one output node with ID 'output')
        let coordinatorOutput = '';
        const outputNodeId = coordinatorOutputNodes[0]?.id || 'output';
        if (coordinatorResult.nodeStates[outputNodeId] && coordinatorResult.nodeStates[outputNodeId].data) {
          coordinatorOutput = coordinatorResult.nodeStates[outputNodeId].data;
        }
        console.log('Coordinator output received, passing to Generator...');
        
        // 2. Get the Generator Agent workflow (ID 10)
        const generatorWorkflow = await storage.getWorkflow(10);
        
        if (!generatorWorkflow) {
          return res.status(404).json({ message: "Generator workflow not found" });
        }
        
        // Create a log entry for the generator execution
        const generatorLog = await storage.createLog({
          agentId: generatorWorkflow.agentId || 0,
          workflowId: 10,
          status: "running",
          input: { prompt: coordinatorOutput },
        });
        
        // Execute the Generator workflow with the Coordinator's output
        if (!generatorWorkflow.flowData) {
          throw new Error("Generator workflow has no flow data");
        }
        
        // Ensure generatorFlowData is correctly typed
        const generatorFlowData = generatorWorkflow.flowData as { 
          nodes: any[];
          edges: any[];
        };
        
        // Inject the coordinator output into the first text_prompt node of the generator
        const generatorStartNode = generatorFlowData.nodes.find((node: { type: string }) => 
          node.type === 'text_prompt' || node.type === 'prompt');
        if (generatorStartNode) {
          if (!generatorStartNode.data) generatorStartNode.data = {};
          generatorStartNode.data.prompt = coordinatorOutput;
        } else {
          // If no start node found, add the prompt as input to the first node
          if (generatorFlowData.nodes.length > 0) {
            if (!generatorFlowData.nodes[0].data) generatorFlowData.nodes[0].data = {};
            generatorFlowData.nodes[0].data.input = coordinatorOutput;
          }
        }
        
        // Initialize node states storage for generator
        const generatorNodeStates: Record<string, any> = {};
        
        const generatorResult = await executeWorkflow(
          generatorFlowData.nodes, 
          generatorFlowData.edges, 
          (nodeId, state) => {
            // Store node states as they change
            generatorNodeStates[nodeId] = state;
            console.log(`Generator node ${nodeId} state: ${state.state}`);
          },
          (finalState) => {
            console.log(`Generator workflow execution completed with status: ${finalState.status}`);
          }
        );
        
        // Find the output nodes in the generator workflow
        const generatorOutputNodes = generatorFlowData.nodes.filter((node: { id: string }) => {
          // Nodes with no outgoing edges are considered output nodes
          return !generatorFlowData.edges.some((edge: { source: string }) => edge.source === node.id);
        });
        
        // Collect output from the final nodes
        const generatorOutputs: Record<string, any> = {};
        generatorOutputNodes.forEach((node: { id: string }) => {
          if (generatorResult.nodeStates[node.id]) {
            generatorOutputs[node.id] = generatorResult.nodeStates[node.id].data;
          }
        });
        
        // Get the output from the output node (assuming there's only one output node with ID 'output')
        let generatorOutput = '';
        const genOutputNodeId = generatorOutputNodes[0]?.id || 'output';
        if (generatorResult.nodeStates[genOutputNodeId] && generatorResult.nodeStates[genOutputNodeId].data) {
          generatorOutput = generatorResult.nodeStates[genOutputNodeId].data;
        }
        
        // Update the log with the result
        await storage.updateLog(generatorLog.id, {
          status: generatorResult.status === 'error' ? 'error' : 'success',
          output: generatorOutputs,
          error: generatorResult.error,
          executionPath: { 
            nodes: Object.keys(generatorResult.nodeStates),
            completed: generatorResult.status === 'complete',
            error: generatorResult.error
          },
          completedAt: new Date()
        });
        
        // Return both results
        return res.json({
          success: true,
          coordinatorResult: {
            status: coordinatorResult.status,
            output: coordinatorOutput,
            logId: coordinatorLog.id
          },
          generatorResult: {
            status: generatorResult.status,
            output: generatorOutput,
            logId: generatorLog.id
          }
        });
        
      } catch (executionError) {
        console.error('Error executing agent chain:', executionError);
        // Update log with error
        await storage.updateLog(coordinatorLog.id, {
          status: 'error',
          error: executionError instanceof Error ? executionError.message : String(executionError),
          completedAt: new Date()
        });
        
        return res.status(500).json({ 
          message: "Failed to execute agent chain",
          error: executionError instanceof Error ? executionError.message : String(executionError)
        });
      }
    } catch (error) {
      console.error('Error in agent chain execution:', error);
      res.status(500).json({ 
        message: "Failed to execute agent chain",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
