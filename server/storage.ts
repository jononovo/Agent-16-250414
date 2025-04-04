import { 
  users, type User, type InsertUser,
  agents, type Agent, type InsertAgent,
  workflows, type Workflow, type InsertWorkflow,
  nodes, type Node, type InsertNode
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private workflows: Map<number, Workflow>;
  private nodes: Map<number, Node>;
  
  private userId: number;
  private agentId: number;
  private workflowId: number;
  private nodeId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.workflows = new Map();
    this.nodes = new Map();
    
    this.userId = 1;
    this.agentId = 1;
    this.workflowId = 1;
    this.nodeId = 1;
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create internal builder agents
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
      name: "Generator Agent",
      description: "Creates components and workflows based on user specifications",
      type: "internal",
      icon: "wand-magic-sparkles",
      status: "active",
      userId: 0,
      configuration: {}
    });
    
    this.createAgent({
      name: "Optimizer Agent",
      description: "Analyzes and improves existing workflows and agent performance",
      type: "internal",
      icon: "sliders",
      status: "active",
      userId: 0,
      configuration: {}
    });
    
    // Create sample custom agents
    this.createAgent({
      name: "Customer Support Agent",
      description: "Handles customer inquiries using knowledge base and escalates when needed",
      type: "custom",
      icon: "headset",
      status: "deployed",
      userId: 0,
      configuration: {}
    });
    
    this.createAgent({
      name: "Market Analysis Agent",
      description: "Analyzes market trends and generates reports with actionable insights",
      type: "custom",
      icon: "chart-line",
      status: "draft",
      userId: 0,
      configuration: {}
    });
    
    // Create sample workflows
    this.createWorkflow({
      name: "Data Processing Pipeline",
      description: "Extracts, transforms, and loads data from multiple sources",
      type: "custom",
      icon: "sitemap",
      status: "active",
      userId: 0,
      agentId: 0,
      flowData: {}
    });
    
    this.createWorkflow({
      name: "Content Approval Flow",
      description: "Manages content creation, review, editing, and publishing process",
      type: "custom",
      icon: "code-branch",
      status: "draft",
      userId: 0,
      agentId: 0,
      flowData: {}
    });
    
    // Create sample nodes
    this.createNode({
      name: "Data Filter",
      description: "Filters data based on custom conditions",
      type: "custom",
      icon: "filter",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Text Translator",
      description: "Translates text between languages",
      type: "custom",
      icon: "language",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Data Merger",
      description: "Combines data from multiple sources",
      type: "custom",
      icon: "database",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "CSV Parser",
      description: "Parses and transforms CSV data",
      type: "custom",
      icon: "file-csv",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Agent methods
  async getAgents(type?: string): Promise<Agent[]> {
    const allAgents = Array.from(this.agents.values());
    if (type) {
      return allAgents.filter(agent => agent.type === type);
    }
    return allAgents;
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
      createdAt: now, 
      updatedAt: now
    };
    this.agents.set(id, agent);
    return agent;
  }
  
  async updateAgent(id: number, agentUpdate: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent: Agent = { 
      ...agent, 
      ...agentUpdate, 
      updatedAt: new Date()
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }
  
  // Workflow methods
  async getWorkflows(type?: string): Promise<Workflow[]> {
    const allWorkflows = Array.from(this.workflows.values());
    if (type) {
      return allWorkflows.filter(workflow => workflow.type === type);
    }
    return allWorkflows;
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowId++;
    const now = new Date();
    const workflow: Workflow = { 
      ...insertWorkflow, 
      id, 
      createdAt: now, 
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    return workflow;
  }
  
  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow: Workflow = { 
      ...workflow, 
      ...workflowUpdate, 
      updatedAt: new Date()
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }
  
  // Node methods
  async getNodes(type?: string): Promise<Node[]> {
    const allNodes = Array.from(this.nodes.values());
    if (type) {
      return allNodes.filter(node => node.type === type);
    }
    return allNodes;
  }
  
  async getNode(id: number): Promise<Node | undefined> {
    return this.nodes.get(id);
  }
  
  async createNode(insertNode: InsertNode): Promise<Node> {
    const id = this.nodeId++;
    const now = new Date();
    const node: Node = { 
      ...insertNode, 
      id, 
      createdAt: now, 
      updatedAt: now
    };
    this.nodes.set(id, node);
    return node;
  }
  
  async updateNode(id: number, nodeUpdate: Partial<Node>): Promise<Node | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const updatedNode: Node = { 
      ...node, 
      ...nodeUpdate, 
      updatedAt: new Date()
    };
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }
  
  async deleteNode(id: number): Promise<boolean> {
    return this.nodes.delete(id);
  }
}

export const storage = new MemStorage();
