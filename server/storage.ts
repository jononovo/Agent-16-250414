import { 
  users, type User, type InsertUser,
  agents, type Agent, type InsertAgent,
  workflows, type Workflow, type InsertWorkflow,
  nodes, type Node, type InsertNode,
  logs, type Log, type InsertLog
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

    // Add Flow-Chain workflow with Prompt Crafter and ValidResponse
    const flowChainNodes = [
      {
        id: 'text_input-1',
        type: 'text_input',
        position: { x: 100, y: 200 },
        data: {
          label: 'Text Input',
          description: 'Enter your content requirements',
          icon: 'type',
          inputText: 'Create a product description for our new ultra-light hiking backpack'
        }
      },
      {
        id: 'prompt_crafter-1',
        type: 'prompt_crafter',
        position: { x: 400, y: 200 },
        data: {
          label: 'Prompt Crafter',
          description: 'Build prompt template with variables',
          icon: 'sparkles',
          promptTemplate: 'You are a helpful assistant.\n{{system_message}}\nUser: {{input}}\nAssistant:',
          variables: [
            { id: 'system_message', value: 'You are a marketing expert specialized in creating compelling product descriptions.' },
            { id: 'input', value: '' }
          ]
        }
      },
      {
        id: 'generate_text-1',
        type: 'generate_text',
        position: { x: 700, y: 200 },
        data: {
          label: 'Generate Text',
          description: 'AI Content Generator',
          icon: 'cpu',
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'You are a marketing expert specialized in creating compelling product descriptions.',
          userPrompt: 'Create a product description for our new ultra-light hiking backpack',
        }
      },
      {
        id: 'valid_response-1',
        type: 'valid_response',
        position: { x: 1000, y: 200 },
        data: {
          label: 'Response Validator',
          description: 'Verify content meets requirements',
          icon: 'checkCheck',
          validationEnabled: true,
          validationRules: "// Check if content is at least 100 characters\nreturn content.length >= 100;"
        }
      },
      {
        id: 'visualize_text-1',
        type: 'visualize_text',
        position: { x: 1300, y: 100 },
        data: {
          label: 'Valid Result',
          description: 'Display valid content',
          icon: 'eye',
          textContent: 'Valid content will appear here'
        }
      },
      {
        id: 'visualize_text-2',
        type: 'visualize_text',
        position: { x: 1300, y: 300 },
        data: {
          label: 'Invalid Result',
          description: 'Display invalid content',
          icon: 'alertTriangle',
          textContent: 'Invalid content will appear here'
        }
      }
    ];

    const flowChainEdges = [
      {
        id: 'edge-1',
        source: 'text_input-1',
        target: 'prompt_crafter-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-2',
        source: 'prompt_crafter-1',
        target: 'generate_text-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-3',
        source: 'generate_text-1',
        target: 'valid_response-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-4',
        source: 'valid_response-1',
        target: 'visualize_text-1',
        sourceHandle: 'valid',
        animated: true,
        style: { stroke: '#4ade80', strokeWidth: 2 }
      },
      {
        id: 'edge-5',
        source: 'valid_response-1',
        target: 'visualize_text-2',
        sourceHandle: 'invalid',
        animated: true,
        style: { stroke: '#ef4444', strokeWidth: 2 }
      }
    ];

    this.createWorkflow({
      name: "AI Content Chain",
      description: "Creates and validates AI-generated content with flexible prompt templating",
      type: "custom",
      icon: "link",
      status: "active",
      userId: 0,
      agentId: 0,
      flowData: JSON.stringify({
        nodes: flowChainNodes,
        edges: flowChainEdges
      })
    });
    
    // Add Agentic Orchestration workflow based on screenshot
    const agenticOrchestratorNodes = [
      {
        id: 'text_input-1',
        type: 'text_input',
        position: { x: 100, y: 150 },
        data: {
          label: 'Text Input',
          description: 'Enter your request here',
          icon: 'type',
          inputText: '<Assistant_Info>\nYou are a Project Manager and Developer. You excel at breaking down complex projects and efficiently organizing your team.\n\nYou have access to tools that help you plan and monitor development. Your team requires detailed instructions, so provide clear user stories.</Assistant_Info>'
        }
      },
      {
        id: 'generate_text-1',
        type: 'generate_text',
        position: { x: 400, y: 150 },
        data: {
          label: 'Generate Text',
          description: 'AI Content Generator',
          icon: 'cpu',
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'You are an AI assistant specialized in project management and development planning.',
          userPrompt: 'Parse the assistant info and create a system message for a project manager AI',
        }
      },
      {
        id: 'visualize_text-1',
        type: 'visualize_text',
        position: { x: 700, y: 150 },
        data: {
          label: 'Visualize Text',
          description: 'Display generated content',
          icon: 'eye',
          textContent: 'No text to display'
        }
      },
      {
        id: 'text_input-2',
        type: 'text_input',
        position: { x: 100, y: 350 },
        data: {
          label: 'Text Input',
          description: 'Enter your request here',
          icon: 'type',
          inputText: 'Please create a project plan for developing a new e-commerce website with user authentication, product catalog, shopping cart, and payment processing.'
        }
      },
      {
        id: 'generate_text-2',
        type: 'generate_text',
        position: { x: 400, y: 350 },
        data: {
          label: 'Generate Text',
          description: 'System',
          icon: 'cpu',
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'You are a Project Manager and Developer. You excel at breaking down complex projects and efficiently organizing your team.',
          outputs: [
            {
              id: 'project',
              label: 'Project Plan',
              content: 'Output appears here'
            },
            {
              id: 'tasks',
              label: 'Task List',
              content: 'Output appears here'
            }
          ]
        }
      },
      {
        id: 'text_input-3',
        type: 'text_input',
        position: { x: 700, y: 250 },
        data: {
          label: 'Text Input',
          description: 'User input for new task',
          icon: 'plus',
          inputText: 'Add "implement social sharing" task'
        }
      },
      {
        id: 'visualize_text-2',
        type: 'visualize_text',
        position: { x: 1000, y: 350 },
        data: {
          label: 'Visualize Text',
          description: 'Display generated content',
          icon: 'eye',
          textContent: 'No text to display'
        }
      }
    ];

    const agenticOrchestratorEdges = [
      {
        id: 'edge-1',
        source: 'text_input-1',
        target: 'generate_text-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-2',
        source: 'generate_text-1',
        target: 'visualize_text-1',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-3',
        source: 'text_input-2',
        target: 'generate_text-2',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-4',
        source: 'text_input-3',
        target: 'generate_text-2',
        targetHandle: 'input',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      },
      {
        id: 'edge-5',
        source: 'generate_text-2',
        sourceHandle: 'result',
        target: 'visualize_text-2',
        animated: true,
        style: { stroke: '#8884d8', strokeWidth: 2 }
      }
    ];

    this.createWorkflow({
      name: "Agentic Orchestration",
      description: "Coordinates multiple AI agents to work together on complex tasks with specialized roles",
      type: "custom",
      icon: "users",
      status: "active",
      userId: 0,
      agentId: 0,
      flowData: JSON.stringify({
        nodes: agenticOrchestratorNodes,
        edges: agenticOrchestratorEdges
      })
    });
    
    // Create sample logs for Customer Support Agent
    // Sample successful log
    this.createLog({
      agentId: 4, // Customer Support Agent
      workflowId: 1,
      status: "success",
      input: { query: "How do I reset my password?" },
      output: { response: "You can reset your password by clicking on the 'Forgot Password' link on the login page and following the instructions sent to your email." },
      completedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      executionPath: { 
        nodes: ["textInput-1", "routing-1", "generateText-1", "visualizeText-1"],
        completed: true 
      }
    });
    
    // Sample error log
    this.createLog({
      agentId: 4, // Customer Support Agent
      workflowId: 2,
      status: "error",
      input: { query: "I want to cancel my subscription" },
      error: "Unable to access customer database",
      completedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      executionPath: { 
        nodes: ["textInput-1", "database-query-1"],
        error: "Database connection failed", 
        completed: false 
      }
    });
    
    // Sample logs for Market Analysis Agent
    for (let i = 0; i < 20; i++) {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      const minutesAgo = 10 + (i * 30); // Spread out over time
      
      this.createLog({
        agentId: 5, // Market Analysis Agent
        workflowId: i % 2 === 0 ? 3 : 4,
        status: isSuccess ? "success" : "error",
        input: { 
          query: `Analyze market trends for Product ${i + 1}`,
          parameters: { timeframe: "last 30 days", region: "North America" }
        },
        output: isSuccess ? { 
          summary: `Analysis for Product ${i + 1} completed successfully.`,
          data: { sentiment: Math.random() > 0.5 ? "positive" : "negative", score: Math.floor(Math.random() * 100) } 
        } : {},
        error: isSuccess ? null : "Insufficient market data available",
        completedAt: new Date(Date.now() - 1000 * 60 * minutesAgo),
        executionPath: { 
          nodes: ["textInput-1", "data-fetch-1", isSuccess ? "analysis-1" : null, isSuccess ? "visualizeText-1" : null].filter(Boolean),
          completed: isSuccess
        }
      });
    }
    
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
    
    // Create nodes from the technical documentation
    
    // AI Nodes
    this.createNode({
      name: "Text Input",
      description: "Provides static text input to the workflow",
      type: "text_input",
      icon: "type",
      category: "ai",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Generate Text",
      description: "Creates AI-generated text using various models",
      type: "generate_text",
      icon: "cpu",
      category: "ai",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Prompt Crafter",
      description: "Designs templated prompts with variables",
      type: "prompt_crafter",
      icon: "sparkles",
      category: "ai",
      userId: 0,
      configuration: {}
    });
    
    // Data Nodes
    this.createNode({
      name: "Visualize Text",
      description: "Displays text output in the workflow",
      type: "visualize_text",
      icon: "eye",
      category: "data",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Data Transform",
      description: "Transforms data structure",
      type: "data_transform",
      icon: "repeat",
      category: "data",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Filter",
      description: "Filters data based on conditions",
      type: "filter",
      icon: "filter",
      category: "data",
      userId: 0,
      configuration: {}
    });
    
    // Trigger Nodes
    this.createNode({
      name: "Webhook Trigger",
      description: "Triggers a workflow from an HTTP request",
      type: "webhook",
      icon: "webhook",
      category: "triggers",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Scheduler",
      description: "Runs a workflow on a schedule",
      type: "scheduler",
      icon: "clock",
      category: "triggers",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Email Trigger",
      description: "Triggers from email events",
      type: "email_trigger",
      icon: "mail",
      category: "triggers",
      userId: 0,
      configuration: {}
    });
    
    // Action Nodes
    this.createNode({
      name: "HTTP Request",
      description: "Makes API requests to external services",
      type: "http_request",
      icon: "globe",
      category: "actions",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Email Send",
      description: "Sends email messages",
      type: "email_send",
      icon: "send",
      category: "actions",
      userId: 0,
      configuration: {}
    });
    
    this.createNode({
      name: "Database Query",
      description: "Performs database operations",
      type: "database_query",
      icon: "database",
      category: "actions",
      userId: 0,
      configuration: {}
    });
    
    // Additional specialized nodes
    this.createNode({
      name: "Response Validator",
      description: "Validates AI responses against rules and directs flow accordingly",
      type: "valid_response",
      icon: "check-check",
      category: "ai",
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
      id,
      name: insertAgent.name,
      type: insertAgent.type,
      createdAt: now, 
      updatedAt: now,
      icon: insertAgent.icon || null,
      description: insertAgent.description || null,
      status: insertAgent.status || null,
      userId: insertAgent.userId || null,
      configuration: insertAgent.configuration || {}
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
      id,
      name: insertWorkflow.name,
      type: insertWorkflow.type,
      createdAt: now, 
      updatedAt: now,
      icon: insertWorkflow.icon || null,
      description: insertWorkflow.description || null,
      status: insertWorkflow.status || "draft",
      userId: insertWorkflow.userId || null,
      agentId: insertWorkflow.agentId || null,
      flowData: insertWorkflow.flowData || {}
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
      id,
      name: insertNode.name,
      type: insertNode.type, 
      createdAt: now, 
      updatedAt: now,
      icon: insertNode.icon || null,
      description: insertNode.description || null,
      userId: insertNode.userId || null,
      category: insertNode.category || "",
      configuration: insertNode.configuration || {}
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
  
  // Workflow by agent methods
  async getWorkflowsByAgentId(agentId: number): Promise<Workflow[]> {
    const allWorkflows = Array.from(this.workflows.values());
    return allWorkflows.filter(workflow => workflow.agentId === agentId);
  }
  
  // Log methods
  async getLogs(agentId?: number, limit: number = 20): Promise<Log[]> {
    let logs = Array.from(this.logs.values());
    
    if (agentId) {
      logs = logs.filter(log => log.agentId === agentId);
    }
    
    // Sort by startedAt descending (latest first)
    logs.sort((a, b) => {
      const timeA = a.startedAt ? a.startedAt.getTime() : 0;
      const timeB = b.startedAt ? b.startedAt.getTime() : 0;
      return timeB - timeA;
    });
    
    // Apply limit
    return logs.slice(0, limit);
  }
  
  async getLog(id: number): Promise<Log | undefined> {
    return this.logs.get(id);
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logId++;
    const now = new Date();
    const log: Log = { 
      id,
      agentId: insertLog.agentId,
      workflowId: insertLog.workflowId,
      status: insertLog.status,
      input: insertLog.input || {},
      output: insertLog.output || {},
      error: insertLog.error || null,
      startedAt: now,
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
      ...logUpdate 
    };
    this.logs.set(id, updatedLog);
    return updatedLog;
  }
}

export const storage = new MemStorage();
