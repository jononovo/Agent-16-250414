import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  users, type User, type InsertUser,
  agents, type Agent, type InsertAgent,
  workflows, type Workflow, type InsertWorkflow,
  nodes, type Node, type InsertNode,
  logs, type Log, type InsertLog
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage } from './storage';

// Create a Postgres client with improved connection handling
const connectionOptions = {
  max: 5, // Reduce max connections for faster startup
  idle_timeout: 10, // Shorter timeout in seconds (was 20)
  connect_timeout: 5, // Shorter connect timeout in seconds (was 10)
  max_lifetime: 60 * 15, // Shorter connection lifetime in seconds (was 30 mins)
  connection: {
    application_name: 'workflow-builder', // Identify the application in PostgreSQL logs
    keepalive: true, // Use TCP keepalive
    statement_timeout: 10000, // 10 second query timeout
  },
  debug: false, // Disable debug for performance
  fetch_types: false, // We know our types already
  prepare: false, // Skip prepare for startup speed
  types: {} // Empty types object to avoid type fetching
};

// Create the client with error handling
console.log('Initializing PostgreSQL storage...');
let client;
try {
  client = postgres(process.env.DATABASE_URL!, connectionOptions);
} catch (e) {
  console.error('Error creating database client:', e);
  // Create a minimal client that won't crash the application
  client = postgres({} as any, {} as any);
}

// Create a drizzle client with postgres.js
export const db = drizzle(client);

export class PostgresStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Agent methods
  async getAgents(type?: string): Promise<Agent[]> {
    if (type) {
      return await db.select().from(agents).where(eq(agents.type, type));
    }
    return await db.select().from(agents);
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    const result = await db.select().from(agents).where(eq(agents.id, id));
    return result[0];
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const now = new Date();
    const result = await db.insert(agents).values({
      ...insertAgent,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  
  async updateAgent(id: number, agentUpdate: Partial<Agent>): Promise<Agent | undefined> {
    const now = new Date();
    const result = await db.update(agents)
      .set({
        ...agentUpdate,
        updatedAt: now
      })
      .where(eq(agents.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id)).returning();
    return result.length > 0;
  }
  
  // Workflow methods
  async getWorkflows(type?: string): Promise<Workflow[]> {
    if (type) {
      return await db.select().from(workflows).where(eq(workflows.type, type));
    }
    return await db.select().from(workflows);
  }
  
  async getWorkflowsByAgentId(agentId: number): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.agentId, agentId));
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const result = await db.select().from(workflows).where(eq(workflows.id, id));
    return result[0];
  }
  
  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const now = new Date();
    const result = await db.insert(workflows).values({
      ...insertWorkflow,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  
  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const now = new Date();
    
    // Handle flowData properly - ensure it's saved as JSON if it's a string
    const updateData: Partial<Workflow> = { ...workflowUpdate, updatedAt: now };
    
    // If flowData is provided as a string, make sure it's parsed as JSON
    if (typeof updateData.flowData === 'string') {
      try {
        // Parse the string to make sure it's valid JSON
        const parsedData = JSON.parse(updateData.flowData);
        // Store it back as a JSON object
        updateData.flowData = parsedData;
      } catch (error) {
        console.error("Error parsing flowData:", error);
        // If parsing fails, still try to save as-is
      }
    }
    
    const result = await db.update(workflows)
      .set(updateData)
      .where(eq(workflows.id, id))
      .returning();
    return result[0];
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    const result = await db.delete(workflows).where(eq(workflows.id, id)).returning();
    return result.length > 0;
  }
  
  // Node methods
  async getNodes(type?: string): Promise<Node[]> {
    if (type) {
      return await db.select().from(nodes).where(eq(nodes.type, type));
    }
    return await db.select().from(nodes);
  }
  
  async getNode(id: number): Promise<Node | undefined> {
    const result = await db.select().from(nodes).where(eq(nodes.id, id));
    return result[0];
  }
  
  async createNode(insertNode: InsertNode): Promise<Node> {
    const now = new Date();
    const result = await db.insert(nodes).values({
      ...insertNode,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  
  async updateNode(id: number, nodeUpdate: Partial<Node>): Promise<Node | undefined> {
    const now = new Date();
    const result = await db.update(nodes)
      .set({
        ...nodeUpdate,
        updatedAt: now
      })
      .where(eq(nodes.id, id))
      .returning();
    return result[0];
  }
  
  async deleteNode(id: number): Promise<boolean> {
    const result = await db.delete(nodes).where(eq(nodes.id, id)).returning();
    return result.length > 0;
  }
  
  // Log methods
  async getLogs(agentId?: number, limit: number = 20): Promise<Log[]> {
    if (agentId) {
      return await db.select()
        .from(logs)
        .where(eq(logs.agentId, agentId))
        .orderBy(desc(logs.startedAt))
        .limit(limit);
    }
    return await db.select()
      .from(logs)
      .orderBy(desc(logs.startedAt))
      .limit(limit);
  }
  
  async getLog(id: number): Promise<Log | undefined> {
    const result = await db.select().from(logs).where(eq(logs.id, id));
    return result[0];
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const result = await db.insert(logs).values(insertLog).returning();
    return result[0];
  }
  
  async updateLog(id: number, logUpdate: Partial<Log>): Promise<Log | undefined> {
    const result = await db.update(logs)
      .set(logUpdate)
      .where(eq(logs.id, id))
      .returning();
    return result[0];
  }
}

// Function to seed initial data if needed
export async function seedInitialData() {
  try {
    // Check if tables exist first (we'll use a safe query)
    const tableExists = await db.execute(/* sql */`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    // Only seed if tables actually exist
    if (tableExists[0]?.exists) {
      try {
        // Check if we already have users
        const existingUsers = await db.select().from(users);
        if (existingUsers.length === 0) {
          // Create a default user
          await db.insert(users).values({
            username: 'admin',
            password: 'admin' // In a real app, this should be hashed
          });
        }
        
        // Check if we already have nodes
        const existingNodes = await db.select().from(nodes);
        if (existingNodes.length === 0) {
          // Add some default nodes that match the folder-based node system
          await db.insert(nodes).values([
            {
              name: 'Text Input',
              type: 'text_input',
              category: 'input',
              icon: 'MessageSquare',
              description: 'A simple text input node for workflow input',
              configuration: { defaultText: '' }
            },
            {
              name: 'HTTP Request',
              type: 'http_request',
              category: 'integration',
              icon: 'Globe',
              description: 'Make HTTP requests to external APIs and web services',
              configuration: { url: '', method: 'GET', headers: {} }
            },
            {
              name: 'Claude AI',
              type: 'claude',
              category: 'ai',
              icon: 'Brain',
              description: 'Generate text using Claude AI model',
              configuration: { model: 'claude-3-opus-20240229', temperature: 0.7 }
            },
            {
              name: 'Data Transform',
              type: 'data_transform',
              category: 'transformation',
              icon: 'Sparkles',
              description: 'Transform data using JavaScript expressions',
              configuration: { transform: 'return input;' }
            },
            {
              name: 'Decision',
              type: 'decision',
              category: 'flow',
              icon: 'GitBranch',
              description: 'Create conditional branches in your workflow',
              configuration: { conditions: [] }
            }
          ]);
        }
        console.log('Database seeded successfully');
      } catch (innerError) {
        console.error('Error seeding database:', innerError);
      }
    } else {
      console.log('Tables not yet created, skipping initial seeding');
    }
  } catch (error) {
    console.error('Error checking database tables:', error);
  }
}