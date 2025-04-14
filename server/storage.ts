/**
 * Storage Module
 * 
 * This file defines and implements the storage interface for the application.
 * It uses an in-memory implementation for simplicity.
 */

import { 
  type User, type InsertUser,
  type Agent, type InsertAgent,
  type Workflow, type InsertWorkflow,
  type Node, type InsertNode,
  type Log, type InsertLog
} from "@shared/schema";

/**
 * Storage interface for all data access
 */
export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAgents(type?: string): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Workflow methods
  getWorkflows(type?: string): Promise<Workflow[]>;
  getWorkflowsByAgentId(agentId: number): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Node methods
  getNodes(type?: string): Promise<Node[]>;
  getNode(id: number): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: number, node: Partial<Node>): Promise<Node | undefined>;
  deleteNode(id: number): Promise<boolean>;
  
  // Log methods
  getLogs(agentId?: number, limit?: number): Promise<Log[]>;
  getLog(id: number): Promise<Log | undefined>;
  createLog(log: InsertLog): Promise<Log>;
  updateLog(id: number, log: Partial<Log>): Promise<Log | undefined>;
}

/**
 * In-memory storage implementation
 */
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private workflows: Map<number, Workflow>;
  private nodes: Map<number, Node>;
  private logs: Map<number, Log>;
  
  private userId: number;
  private agentId: number;
  private workflowId: number;
  private nodeId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.workflows = new Map();
    this.nodes = new Map();
    this.logs = new Map();
    
    this.userId = 1;
    this.agentId = 1;
    this.workflowId = 1;
    this.nodeId = 1;
    this.logId = 1;
    
    // Initialize with sample data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Sample agents
    this.createAgent({
      name: "Coordinator Agent",
      description: "Handles user requests and orchestrates other agents to fulfill tasks",
      type: "internal",
      icon: "robot",
      status: "active",
      userId: 0,
      configuration: {}
    });
    
    this.createAgent({
      name: "Customer Support Agent",
      description: "Handles customer inquiries using knowledge base and escalates when needed",
      type: "custom",
      icon: "headset",
      status: "deployed",
      userId: 0,
      configuration: {}
    });
    
    // Sample nodes for the folder-based node system
    this.createNode({
      name: "Text Input",
      type: "text_input",
      category: "input",
      icon: "MessageSquare",
      description: "A simple text input node for workflow input",
      configuration: { defaultText: '' }
    });
    
    this.createNode({
      name: "HTTP Request",
      type: "http_request",
      category: "integration",
      icon: "Globe",
      description: "Make HTTP requests to external APIs and web services",
      configuration: { url: '', method: 'GET', headers: {} }
    });
    
    this.createNode({
      name: "Claude AI",
      type: "claude",
      category: "ai",
      icon: "Brain",
      description: "Generate text using Claude AI model",
      configuration: { model: 'claude-3-opus-20240229', temperature: 0.7 }
    });
    
    // Sample workflow with minimal structure
    this.createWorkflow({
      name: "Content Generation Workflow",
      description: "Creates blog posts and social media content based on prompts",
      type: "generation",
      icon: "file-text",
      status: "draft",
      userId: 0,
      agentId: null,
      flowData: { nodes: [], edges: [] }
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Agent methods
  async getAgents(type?: string): Promise<Agent[]> {
    const agents = Array.from(this.agents.values());
    if (type) {
      return agents.filter(agent => agent.type === type);
    }
    return agents;
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentId++;
    const now = new Date();
    const agent: Agent = { 
      ...insertAgent,
      id,
      status: insertAgent.status || "active",
      description: insertAgent.description || null,
      icon: insertAgent.icon || null,
      userId: insertAgent.userId || null,
      configuration: insertAgent.configuration || {},
      createdAt: now,
      updatedAt: now
    };
    this.agents.set(id, agent);
    return agent;
  }
  
  async updateAgent(id: number, agentUpdate: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const now = new Date();
    const updatedAgent: Agent = { 
      ...agent,
      ...agentUpdate,
      id,
      updatedAt: now
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }
  
  // Workflow methods
  async getWorkflows(type?: string): Promise<Workflow[]> {
    const workflows = Array.from(this.workflows.values());
    if (type) {
      return workflows.filter(workflow => workflow.type === type);
    }
    return workflows;
  }
  
  async getWorkflowsByAgentId(agentId: number): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.agentId === agentId
    );
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowId++;
    const now = new Date();
    
    // Ensure flowData is stored properly
    let flowData = insertWorkflow.flowData;
    if (typeof flowData === 'string') {
      try {
        flowData = JSON.parse(flowData);
      } catch (e) {
        // If the string can't be parsed, keep it as-is
        console.warn('Could not parse flowData string:', e);
      }
    }
    
    const workflow: Workflow = { 
      ...insertWorkflow,
      id,
      name: insertWorkflow.name,
      type: insertWorkflow.type,
      description: insertWorkflow.description || null,
      icon: insertWorkflow.icon || null, 
      status: insertWorkflow.status || "draft",
      userId: insertWorkflow.userId || null,
      agentId: insertWorkflow.agentId || null,
      flowData,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  
  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const now = new Date();
    
    // Process flowData if it's provided as a string
    let flowData = workflowUpdate.flowData;
    if (typeof flowData === 'string') {
      try {
        flowData = JSON.parse(flowData);
        workflowUpdate.flowData = flowData;
      } catch (e) {
        console.warn('Could not parse flowData string:', e);
      }
    }
    
    const updatedWorkflow: Workflow = { 
      ...workflow,
      ...workflowUpdate,
      id,
      updatedAt: now
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }
  
  // Node methods
  async getNodes(type?: string): Promise<Node[]> {
    const nodes = Array.from(this.nodes.values());
    if (type) {
      return nodes.filter(node => node.type === type);
    }
    return nodes;
  }
  
  async getNode(id: number): Promise<Node | undefined> {
    return this.nodes.get(id);
  }
  
  async createNode(insertNode: InsertNode): Promise<Node> {
    const id = this.nodeId++;
    const now = new Date();
    
    // Add the category if not present
    const category = insertNode.category || 'general';
    
    const node: Node = { 
      ...insertNode,
      id,
      name: insertNode.name,
      type: insertNode.type,
      description: insertNode.description || null,
      icon: insertNode.icon || null,
      userId: insertNode.userId || null,
      configuration: insertNode.configuration || {},
      category,
      createdAt: now,
      updatedAt: now
    };
    this.nodes.set(id, node);
    return node;
  }
  
  async updateNode(id: number, nodeUpdate: Partial<Node>): Promise<Node | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const now = new Date();
    const updatedNode: Node = { 
      ...node,
      ...nodeUpdate,
      id,
      updatedAt: now
    };
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }
  
  async deleteNode(id: number): Promise<boolean> {
    return this.nodes.delete(id);
  }
  
  // Log methods
  async getLogs(agentId?: number, limit: number = 20): Promise<Log[]> {
    const logs = Array.from(this.logs.values())
      .sort((a, b) => {
        // Sort by startedAt in descending order
        const dateA = a.startedAt || new Date(0);
        const dateB = b.startedAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    
    // Filter by agentId if provided
    const filtered = agentId 
      ? logs.filter(log => log.agentId === agentId)
      : logs;
    
    // Apply limit
    return filtered.slice(0, limit);
  }
  
  async getLog(id: number): Promise<Log | undefined> {
    return this.logs.get(id);
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logId++;
    const now = new Date();
    
    // Create log with required fields
    const log: Log = { 
      id,
      status: insertLog.status,
      agentId: insertLog.agentId,
      workflowId: insertLog.workflowId,
      input: insertLog.input || {},
      output: insertLog.output || {},
      error: insertLog.error || null,
      startedAt: now, // Always set startedAt to now
      completedAt: insertLog.completedAt || null,
      executionPath: insertLog.executionPath || {}
    };
    
    this.logs.set(id, log);
    return log;
  }
  
  async updateLog(id: number, logUpdate: Partial<Log>): Promise<Log | undefined> {
    const log = this.logs.get(id);
    if (!log) return undefined;
    
    const updatedLog: Log = { 
      ...log,
      ...logUpdate,
      id
    };
    this.logs.set(id, updatedLog);
    return updatedLog;
  }
}

// Create and export a single instance of the storage
export const storage = new MemStorage();