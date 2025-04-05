import fs from 'fs';
import path from 'path';
import { db } from '../database';
import { 
  users, agents, workflows, nodes, logs,
  type User, type Agent, type Workflow, type Node, type Log
} from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Helper function to ensure date strings are properly converted to Date objects
 */
function processDateFields<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj } as any;
  
  // Process known date fields
  const dateFields = ['createdAt', 'updatedAt', 'startedAt', 'completedAt'];
  for (const field of dateFields) {
    if (field in result && typeof result[field] === 'string') {
      try {
        // Convert string date to Date object
        result[field] = new Date(result[field]);
      } catch (e) {
        console.warn(`Failed to parse date field ${field}:`, e);
      }
    }
  }
  
  return result as T;
}

/**
 * Migration Utility
 * 
 * This utility provides functions to export and import data from the database.
 * It preserves all relationships between different entities.
 */

interface ExportedData {
  users: User[];
  agents: Agent[];
  workflows: Workflow[];
  nodes: Node[];
  logs: Log[];
  metadata: {
    exportedAt: string;
    version: string;
  };
}

/**
 * Exports all data from the database into a JSON file
 * @param outputPath Path where the exported data should be saved
 */
export async function exportAllData(outputPath?: string): Promise<string> {
  try {
    // Fetch all data from the database
    const allUsers = await db.select().from(users);
    const allAgents = await db.select().from(agents);
    const allWorkflows = await db.select().from(workflows);
    const allNodes = await db.select().from(nodes);
    const allLogs = await db.select().from(logs);

    // Create the export data structure
    const exportData: ExportedData = {
      users: allUsers,
      agents: allAgents,
      workflows: allWorkflows,
      nodes: allNodes,
      logs: allLogs,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Default output path if not provided
    const filePath = outputPath || path.join(process.cwd(), 'db-export.json');
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log(`Data successfully exported to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Imports data from a JSON file into the database
 * @param inputPath Path to the exported JSON file
 * @param options Configuration options for the import
 */
export async function importAllData(
  inputPath: string,
  options: {
    clearExisting?: boolean;
    skipUsers?: boolean;
    skipLogs?: boolean;
    preserveIds?: boolean;
  } = {}
): Promise<void> {
  const {
    clearExisting = false,
    skipUsers = false,
    skipLogs = true,
    preserveIds = true
  } = options;

  try {
    // Read the import file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Import file not found: ${inputPath}`);
    }

    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const importData: ExportedData = JSON.parse(fileContent);

    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Clear existing data if requested
      if (clearExisting) {
        if (!skipLogs) await tx.delete(logs);
        await tx.delete(workflows);
        await tx.delete(agents);
        await tx.delete(nodes);
        if (!skipUsers) await tx.delete(users);
      }

      // Import users (if not skipped)
      if (!skipUsers) {
        for (const user of importData.users) {
          // Skip existing users if not clearing
          if (!clearExisting) {
            const existingUser = await tx.select()
              .from(users)
              .where(eq(users.username, user.username))
              .limit(1);
            
            if (existingUser.length > 0) continue;
          }

          // Insert with preserved ID if specified
          if (preserveIds) {
            // Process any potential date fields (none for users, but for consistency)
            const processedUser = processDateFields(user);
            await tx.insert(users).values(processedUser);
          } else {
            const { id, ...userData } = user;
            // Process any potential date fields (none for users, but for consistency)
            const processedUserData = processDateFields(userData);
            await tx.insert(users).values(processedUserData);
          }
        }
      }

      // Import nodes
      const nodeIdMap = new Map<number, number>();
      for (const node of importData.nodes) {
        let newNodeId: number;
        
        if (preserveIds) {
          // Process date fields before insertion
          const processedNode = processDateFields(node);
          await tx.insert(nodes).values(processedNode);
          newNodeId = node.id;
        } else {
          const { id, ...nodeData } = node;
          // Process date fields before insertion
          const processedNodeData = processDateFields(nodeData);
          const result = await tx.insert(nodes).values(processedNodeData).returning({ id: nodes.id });
          newNodeId = result[0].id;
        }
        
        nodeIdMap.set(node.id, newNodeId);
      }

      // Import agents
      const agentIdMap = new Map<number, number>();
      for (const agent of importData.agents) {
        let newAgentId: number;
        
        if (preserveIds) {
          // Process date fields before insertion
          const processedAgent = processDateFields(agent);
          await tx.insert(agents).values(processedAgent);
          newAgentId = agent.id;
        } else {
          const { id, ...agentData } = agent;
          // Process date fields before insertion
          const processedAgentData = processDateFields(agentData);
          const result = await tx.insert(agents).values(processedAgentData).returning({ id: agents.id });
          newAgentId = result[0].id;
        }
        
        agentIdMap.set(agent.id, newAgentId);
      }

      // Import workflows (preserving agent relationships)
      const workflowIdMap = new Map<number, number>();
      for (const workflow of importData.workflows) {
        let newWorkflowData: any;
        
        if (preserveIds) {
          newWorkflowData = { ...workflow };
        } else {
          const { id, ...workflowData } = workflow;
          newWorkflowData = workflowData;
        }
        
        // Map agent ID if necessary
        if (workflow.agentId && !preserveIds) {
          const newAgentId = agentIdMap.get(workflow.agentId);
          if (newAgentId) {
            newWorkflowData.agentId = newAgentId;
          }
        }
        
        // Process date fields before insertion
        newWorkflowData = processDateFields(newWorkflowData);
        
        // Insert workflow
        let newWorkflowId: number;
        if (preserveIds) {
          await tx.insert(workflows).values(newWorkflowData);
          newWorkflowId = workflow.id;
        } else {
          const result = await tx.insert(workflows)
            .values(newWorkflowData)
            .returning({ id: workflows.id });
          newWorkflowId = result[0].id;
        }
        
        workflowIdMap.set(workflow.id, newWorkflowId);
      }

      // Import logs (if not skipped, preserving agent and workflow relationships)
      if (!skipLogs) {
        for (const log of importData.logs) {
          let newLogData: any;
          
          if (preserveIds) {
            newLogData = { ...log };
          } else {
            const { id, ...logData } = log;
            newLogData = logData;
          }
          
          // Map agent and workflow IDs if necessary
          if (!preserveIds) {
            if (log.agentId) {
              const newAgentId = agentIdMap.get(log.agentId);
              if (newAgentId) {
                newLogData.agentId = newAgentId;
              }
            }
            
            if (log.workflowId) {
              const newWorkflowId = workflowIdMap.get(log.workflowId);
              if (newWorkflowId) {
                newLogData.workflowId = newWorkflowId;
              }
            }
          }
          
          // Process date fields before insertion
          newLogData = processDateFields(newLogData);
          
          // Insert log
          await tx.insert(logs).values(newLogData);
        }
      }
    });

    console.log('Data imported successfully');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

/**
 * Creates a backup of the current database
 * @returns Path to the backup file
 */
export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(process.cwd(), `backup-${timestamp}.json`);
  return await exportAllData(backupPath);
}

/**
 * Updates flow data references in workflows
 * This is needed when IDs have changed during migration
 */
export async function updateFlowDataReferences(
  workflowIdMap: Map<number, number>,
  nodeIdMap: Map<number, number>
): Promise<void> {
  try {
    // Get all workflows
    const allWorkflows = await db.select().from(workflows);
    
    for (const workflow of allWorkflows) {
      if (!workflow.flowData) continue;
      
      let flowData: any;
      try {
        // Parse the flow data if it's a string
        if (typeof workflow.flowData === 'string') {
          flowData = JSON.parse(workflow.flowData);
        } else {
          flowData = workflow.flowData;
        }
        
        // Update node references in the flow data
        if (flowData.nodes && Array.isArray(flowData.nodes)) {
          for (const node of flowData.nodes) {
            if (node.data && node.data.nodeId) {
              const newNodeId = nodeIdMap.get(node.data.nodeId);
              if (newNodeId) {
                node.data.nodeId = newNodeId;
              }
            }
          }
        }
        
        // Update workflow references
        if (flowData.workflowId) {
          const newWorkflowId = workflowIdMap.get(flowData.workflowId);
          if (newWorkflowId) {
            flowData.workflowId = newWorkflowId;
          }
        }
        
        // Save the updated flow data
        await db.update(workflows)
          .set({ flowData })
          .where(eq(workflows.id, workflow.id));
        
      } catch (error) {
        console.error(`Error updating flow data for workflow ${workflow.id}:`, error);
      }
    }
    
    console.log('Flow data references updated successfully');
  } catch (error) {
    console.error('Error updating flow data references:', error);
    throw error;
  }
}