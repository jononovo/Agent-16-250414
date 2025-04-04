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
    
    // Add AI Content Routing workflow modeled after the example
    const routingWorkflowNodes = [
      {
        id: 'textInput-1',
        type: 'textInput',
        position: { x: 100, y: 200 },
        data: {
          label: 'Text Input',
          description: 'Enter your request here',
          icon: 'type',
          inputText: 'I want to create a twitter post for launching my new website simple-ai.dev'
        }
      },
      {
        id: 'routing-1',
        type: 'routing',
        position: { x: 400, y: 200 },
        data: {
          label: 'Generate Text',
          description: 'System',
          icon: 'gitFork',
          systemPrompt: 'You will receive a request by the user and your task is to route it to the appropriate expert.',
          routes: [
            { id: 'blog-expert', description: 'Route the input here if the request is about writing blogs, or related' },
            { id: 'short-form-expert', description: 'Route the input here if the request is about short form content' },
            { id: 'seo-web-expert', description: 'Route the input here if the request is to optimize for search engines' }
          ]
        }
      },
      {
        id: 'generateText-1',
        type: 'generateText',
        position: { x: 700, y: 100 },
        data: {
          label: 'Generate Text',
          description: 'AI Content Generator',
          icon: 'cpu',
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'Tool outputs',
          userPrompt: 'blog-expert\nRoute the input here if the request is about writing blogs, or related',
        }
      },
      {
        id: 'visualizeText-1',
        type: 'visualizeText',
        position: { x: 1000, y: 100 },
        data: {
          label: 'Visualize Text',
          description: 'Display generated content',
          icon: 'eye',
          textContent: 'I want to create a twitter post for launching my new website simple-ai.dev'
        }
      },
      {
        id: 'visualizeText-2',
        type: 'visualizeText',
        position: { x: 1000, y: 300 },
        data: {
          label: 'Visualize Text',
          description: 'Display generated content',
          icon: 'eye',
          textContent: 'No text to display'
        }
      }
    ];

    const routingWorkflowEdges = [
      {
        id: 'edge-1',
        source: 'textInput-1',
        target: 'routing-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-2',
        source: 'routing-1',
        target: 'generateText-1',
        sourceHandle: 'blog-expert',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-3',
        source: 'generateText-1',
        target: 'visualizeText-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-4',
        source: 'routing-1',
        target: 'visualizeText-2',
        sourceHandle: 'seo-web-expert',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      }
    ];

    this.createWorkflow({
      name: "AI Content Routing",
      description: "Routes content requests to the appropriate AI specialists based on content type",
      type: "custom",
      icon: "share-alt",
      status: "active",
      userId: 0,
      agentId: 0,
      flowData: JSON.stringify({
        nodes: routingWorkflowNodes,
        edges: routingWorkflowEdges
      })
    });
    
    // Create sample nodes
    this.createNode({
      name: "Data Filter",
      description: "Filters data based on custom conditions",
      type: "processor",
      icon: "filter",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Text Translator",
      description: "Translates text between languages",
      type: "processor",
      icon: "language",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Data Merger",
      description: "Combines data from multiple sources",
      type: "processor",
      icon: "database",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "CSV Parser",
      description: "Parses and transforms CSV data",
      type: "processor",
      icon: "file-csv",
      category: "transformation",
      userId: 0,
      configuration: {}
    });
    
    // Create new node types for AI content routing
    this.createNode({
      name: "Text Input",
      description: "Collects text input from users",
      type: "textInput",
      icon: "type",
      category: "input",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Generate Text",
      description: "Generates text content using AI models",
      type: "generateText",
      icon: "cpu",
      category: "ai",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Visualize Text",
      description: "Displays text content to users",
      type: "visualizeText",
      icon: "eye",
      category: "visualization",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Content Router",
      description: "Routes content to the appropriate specialist based on content type",
      type: "routing",
      icon: "git-branch",
      category: "routing",
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
