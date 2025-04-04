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

// Create a Postgres client using postgres.js with connection retries
const connectionOptions = {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Connection timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
  max_lifetime: 60 * 30 // Max connection lifetime in seconds
};

const client = postgres(process.env.DATABASE_URL!, connectionOptions);

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
    const result = await db.update(workflows)
      .set({
        ...workflowUpdate,
        updatedAt: now
      })
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
          // Add some default nodes
          await db.insert(nodes).values([
            {
              name: 'Text Prompt',
              type: 'prompt',
              category: 'input',
              icon: 'MessageSquare',
              description: 'A text input node',
              configuration: { template: '' }
            },
            {
              name: 'API Call',
              type: 'api',
              category: 'integration',
              icon: 'Globe',
              description: 'Make an API request',
              configuration: { url: '', method: 'GET' }
            },
            {
              name: 'Data Transform',
              type: 'transform',
              category: 'processing',
              icon: 'FileJson',
              description: 'Transform data between nodes',
              configuration: { transform: 'return input;' }
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