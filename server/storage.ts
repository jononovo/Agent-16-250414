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
  // Database access for low-level operations
  db: Database;
  
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
 * In-memory storage implementation with Replit Database persistence
 */
import Database from '@replit/database';

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
  
  // Public db property to allow access to the database
  public db: Database;
  private initializing: boolean;

  constructor() {
    this.initializing = true;
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
    
    // Initialize Replit Database
    this.db = new Database();
    
    // Load persisted data or initialize with sample data
    this.initialize();
  }
  
  /**
   * Initialize the storage system and load persisted data
   */
  async initialize(): Promise<void> {
    try {
      await this.loadPersistedData();
      console.log('Storage system initialized');
      this.initializing = false;
    } catch (error) {
      console.error('Error initializing storage system:', error);
      // Initialize with sample data as fallback
      this.initializeDefaultData();
      this.initializing = false;
    }
  }
  
  /**
   * Save all data to Replit Database (useful for application shutdown or maintenance)
   */
  async saveAllData(): Promise<void> {
    try {
      // Set initializing to false to ensure data is saved
      const wasInitializing = this.initializing;
      this.initializing = false;
      
      console.log('Starting saveAllData operation...');
      console.log(`Current state: ${this.workflows.size} workflows, ${this.agents.size} agents, ${this.nodes.size} nodes, ${this.logs.size} logs`);
      
      // Save each data type sequentially for more reliable saving
      console.log('Saving workflows...');
      await this.saveWorkflows();
      
      console.log('Saving agents...');
      await this.saveAgents();
      
      console.log('Saving nodes...');
      await this.saveNodes();
      
      console.log('Saving logs...');
      await this.saveLogs();
      
      console.log('All data successfully saved to Replit Database');
      
      // Force a specific save of workflow data again to ensure it's properly persisted
      if (this.workflows.size > 0) {
        const workflowData = Array.from(this.workflows.values());
        console.log(`Ensuring ${workflowData.length} workflows are saved...`);
        await this.db.set('workflows', JSON.stringify(workflowData));
        console.log('Workflows explicitly saved');
      }
      
      // Restore initializing state
      this.initializing = wasInitializing;
    } catch (error) {
      console.error('Error saving all data:', error);
      throw error; // Re-throw to allow calling code to handle the error
    }
  }
  
  /**
   * Helper to convert database result to usable data
   */
  private parseDbResult(data: unknown): any {
    if (!data) return null;
    
    // Handle different data types that might be returned
    let dataStr: string;
    
    if (typeof data === 'string') {
      dataStr = data;
    } else if (typeof data === 'object') {
      dataStr = JSON.stringify(data);
    } else {
      console.warn('Unexpected data type from database:', typeof data);
      dataStr = String(data);
    }
    
    try {
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Error parsing database result:', error);
      return null;
    }
  }
  
  private async loadPersistedData() {
    try {
      let hasData = false;
      
      // Load workflows
      const workflowsData = await this.db.get('workflows') as unknown;
      if (workflowsData) {
        const workflows = this.parseDbResult(workflowsData);
        
        if (Array.isArray(workflows)) {
          workflows.forEach((workflow: Workflow) => {
            this.workflows.set(workflow.id, workflow);
            // Update workflowId counter to be higher than any existing workflow ID
            if (workflow.id >= this.workflowId) {
              this.workflowId = workflow.id + 1;
            }
          });
          console.log(`Loaded ${workflows.length} workflows from Replit Database`);
          hasData = true;
        }
      }
      
      // Load agents
      const agentsData = await this.db.get('agents') as unknown;
      if (agentsData) {
        const agents = this.parseDbResult(agentsData);
        
        if (Array.isArray(agents)) {
          agents.forEach((agent: Agent) => {
            this.agents.set(agent.id, agent);
            // Update agentId counter to be higher than any existing agent ID
            if (agent.id >= this.agentId) {
              this.agentId = agent.id + 1;
            }
          });
          console.log(`Loaded ${agents.length} agents from Replit Database`);
          hasData = true;
        }
      }
      
      // Load nodes
      const nodesData = await this.db.get('nodes') as unknown;
      if (nodesData) {
        const nodes = this.parseDbResult(nodesData);
        
        if (Array.isArray(nodes)) {
          // Array to store custom node types for registration with the front-end
          const customNodeTypes: string[] = [];
          
          nodes.forEach((node: Node) => {
            this.nodes.set(node.id, node);
            
            // Update nodeId counter to be higher than any existing node ID
            if (node.id >= this.nodeId) {
              this.nodeId = node.id + 1;
            }
            
            // Add custom nodes to the customNodeTypes array
            if (node.isCustom && node.type) {
              customNodeTypes.push(node.type);
            }
          });
          
          // Store custom node types in the database for the front-end to access
          if (customNodeTypes.length > 0) {
            this.saveData('customNodeTypes', customNodeTypes);
            console.log(`Registered ${customNodeTypes.length} custom node types`);
          }
          
          console.log(`Loaded ${nodes.length} nodes from Replit Database`);
          hasData = true;
        }
      }
      
      // Load logs
      const logsData = await this.db.get('logs') as unknown;
      if (logsData) {
        const logs = this.parseDbResult(logsData);
        
        if (Array.isArray(logs)) {
          logs.forEach((log: Log) => {
            this.logs.set(log.id, log);
            // Update logId counter to be higher than any existing log ID
            if (log.id >= this.logId) {
              this.logId = log.id + 1;
            }
          });
          console.log(`Loaded ${logs.length} logs from Replit Database`);
          hasData = true;
        }
      }
      
      // Initialize with sample data if no persisted data was found
      if (!hasData) {
        console.log('No persisted data found, initializing with default data');
        this.initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
      // Initialize with sample data as fallback
      this.initializeDefaultData();
    }
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
      configuration: { defaultText: '' },
      isCustom: false,
      version: "1.0.0"
    });
    
    this.createNode({
      name: "HTTP Request",
      type: "http_request",
      category: "integration",
      icon: "Globe",
      description: "Make HTTP requests to external APIs and web services",
      configuration: { url: '', method: 'GET', headers: {} },
      isCustom: false,
      version: "1.0.0"
    });
    
    this.createNode({
      name: "Claude AI",
      type: "claude",
      category: "ai",
      icon: "Brain",
      description: "Generate text using Claude AI model",
      configuration: { model: 'claude-3-opus-20240229', temperature: 0.7 },
      isCustom: false,
      version: "1.0.0"
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
    
    // Persist agents
    this.saveAgents();
    
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
    
    // Persist agents
    this.saveAgents();
    
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    const result = this.agents.delete(id);
    
    // Persist agents if deletion was successful
    if (result) {
      this.saveAgents();
    }
    
    return result;
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
  
  /**
   * Save data to Replit Database for persistence
   */
  private async saveData(key: string, data: any) {
    // Skip saving during initialization
    if (this.initializing) return;
    
    try {
      await this.db.set(key, JSON.stringify(data));
      console.log(`Saved data to Replit Database: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error saving data to Replit Database (${key}):`, error);
      return false;
    }
  }
  
  /**
   * Save workflows to Replit Database
   */
  private async saveWorkflows() {
    if (this.initializing) return;
    const workflows = Array.from(this.workflows.values());
    return this.saveData('workflows', workflows);
  }
  
  /**
   * Save agents to Replit Database
   */
  private async saveAgents() {
    if (this.initializing) return;
    const agents = Array.from(this.agents.values());
    return this.saveData('agents', agents);
  }
  
  /**
   * Save nodes to Replit Database
   */
  private async saveNodes() {
    if (this.initializing) return;
    const nodes = Array.from(this.nodes.values());
    return this.saveData('nodes', nodes);
  }
  
  /**
   * Save logs to Replit Database
   */
  private async saveLogs() {
    if (this.initializing) return;
    // Only save the most recent logs (e.g., last 100) to avoid excessive storage usage
    const logs = Array.from(this.logs.values())
      .sort((a, b) => {
        const dateA = a.startedAt || new Date(0);
        const dateB = b.startedAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 100); // Keep only the most recent 100 logs
    
    return this.saveData('logs', logs);
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
    
    // Persist the workflows
    this.saveWorkflows();
    
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
    
    // Persist the workflows
    this.saveWorkflows();
    
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    const result = this.workflows.delete(id);
    
    // Persist the workflows if deletion was successful
    if (result) {
      this.saveWorkflows();
    }
    
    return result;
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
    
    // Persist nodes
    this.saveNodes();
    
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
    
    // Persist nodes
    this.saveNodes();
    
    return updatedNode;
  }
  
  async deleteNode(id: number): Promise<boolean> {
    const result = this.nodes.delete(id);
    
    // Persist nodes if deletion was successful
    if (result) {
      this.saveNodes();
    }
    
    return result;
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
    
    // Persist logs
    this.saveLogs();
    
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
    
    // Persist logs if this update completes the log (status is completed or error)
    if (logUpdate.status === 'completed' || logUpdate.status === 'error') {
      this.saveLogs();
    }
    
    return updatedLog;
  }
}

// Create and export a single instance of the storage
export const storage = new MemStorage();