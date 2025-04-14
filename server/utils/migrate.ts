/**
 * Command-line interface for migration utility
 */
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { User, Agent, Workflow, Node, Log } from '@shared/schema';

/**
 * Export structure interface
 */
export interface ExportedData {
  users: User[];
  agents: Agent[];
  workflows: Workflow[];
  nodes: Node[];
  logs: Log[];
  metadata: {
    version: string;
    exportDate: string;
    recordCounts: {
      users: number;
      agents: number;
      workflows: number;
      nodes: number;
      logs: number;
    }
  };
}

/**
 * Exports all data from the storage to a JSON file
 */
export async function exportAllData(outputPath: string): Promise<void> {
  try {
    // Get all data
    const users = await storage.getUsers();
    const agents = await storage.getAgents();
    const workflows = await storage.getWorkflows();
    const nodes = await storage.getNodes();
    const logs = await storage.getLogs(undefined, 1000); // Get up to 1000 logs

    // Create the exported data structure
    const exportData: ExportedData = {
      users,
      agents,
      workflows,
      nodes,
      logs,
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        recordCounts: {
          users: users.length,
          agents: agents.length,
          workflows: workflows.length,
          nodes: nodes.length,
          logs: logs.length
        }
      }
    };

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the data to the output file
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`Data exported to ${outputPath}`);
    console.log(`Exported: ${users.length} users, ${agents.length} agents, ${workflows.length} workflows, ${nodes.length} nodes, ${logs.length} logs`);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Creates a backup file with timestamp
 */
export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
  await exportAllData(backupPath);
  
  return backupPath;
}

/**
 * Imports data from a JSON file into the storage
 */
export async function importAllData(
  inputPath: string,
  options: {
    clearExisting?: boolean;
    skipUsers?: boolean;
    skipLogs?: boolean;
  } = {}
): Promise<void> {
  const {
    clearExisting = false,
    skipUsers = false,
    skipLogs = true
  } = options;

  try {
    // Read the import file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Import file not found: ${inputPath}`);
    }

    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const importData: ExportedData = JSON.parse(fileContent);

    console.log(`Starting import from ${inputPath}`);
    console.log(`Data contains: ${importData.users.length} users, ${importData.agents.length} agents, ${importData.workflows.length} workflows, ${importData.nodes.length} nodes, ${importData.logs.length} logs`);

    // Clear existing data if requested
    // Note: This is just a placeholder since we're working with in-memory storage
    if (clearExisting) {
      console.log('Clearing existing data is not supported with in-memory storage');
    }

    // Import nodes
    for (const node of importData.nodes) {
      await storage.createNode({
        name: node.name,
        description: node.description,
        type: node.type,
        icon: node.icon,
        category: node.category,
        userId: node.userId,
        configuration: node.configuration
      });
    }
    console.log(`Imported ${importData.nodes.length} nodes`);

    // Import agents
    for (const agent of importData.agents) {
      await storage.createAgent({
        name: agent.name,
        description: agent.description,
        type: agent.type,
        icon: agent.icon,
        status: agent.status,
        userId: agent.userId,
        configuration: agent.configuration
      });
    }
    console.log(`Imported ${importData.agents.length} agents`);

    // Import workflows
    for (const workflow of importData.workflows) {
      await storage.createWorkflow({
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        icon: workflow.icon,
        status: workflow.status,
        userId: workflow.userId,
        agentId: workflow.agentId,
        flowData: workflow.flowData
      });
    }
    console.log(`Imported ${importData.workflows.length} workflows`);

    // Import users (if not skipped)
    if (!skipUsers) {
      for (const user of importData.users) {
        // Note: This assumes the user schema includes username and password
        await storage.createUser({
          username: user.username,
          password: user.password
        });
      }
      console.log(`Imported ${importData.users.length} users`);
    }

    // Import logs (if not skipped)
    if (!skipLogs) {
      for (const log of importData.logs) {
        await storage.createLog({
          agentId: log.agentId,
          workflowId: log.workflowId,
          status: log.status,
          input: log.input,
          output: log.output,
          error: log.error,
          completedAt: log.completedAt,
          executionPath: log.executionPath
        });
      }
      console.log(`Imported ${importData.logs.length} logs`);
    }

    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

/**
 * Main function to handle CLI commands
 */
async function main() {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'export':
        await handleExport(args);
        break;
      case 'import':
        await handleImport(args);
        break;
      case 'backup':
        await handleBackup();
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function handleExport(args: string[]) {
  if (args.length < 1) {
    console.error('Error: No output file specified');
    showHelp();
    process.exit(1);
  }

  const outputPath = args[0];
  await exportAllData(outputPath);
}

async function handleImport(args: string[]) {
  if (args.length < 1) {
    console.error('Error: No input file specified');
    showHelp();
    process.exit(1);
  }

  const inputPath = args[0];
  const options = {
    clearExisting: args.includes('--clear'),
    skipUsers: args.includes('--skip-users'),
    skipLogs: !args.includes('--with-logs')
  };

  await importAllData(inputPath, options);
}

async function handleBackup() {
  const backupPath = await createBackup();
  console.log(`Backup created at ${backupPath}`);
}

function showHelp() {
  console.log(`Usage: npx tsx server/utils/migrate.ts <command> [options]

Commands:
  export <outputFile>        Export all data to a JSON file
  import <inputFile> [opts]  Import data from a JSON file
  backup                     Create a timestamped backup file

Options for import:
  --clear                    Clear existing data before import
  --skip-users               Don't import users
  --with-logs                Import logs (skipped by default)

Examples:
  npx tsx server/utils/migrate.ts export my-data.json
  npx tsx server/utils/migrate.ts import my-data.json --clear
  npx tsx server/utils/migrate.ts backup
`);
}

// Add this function to the storage interface in storage.ts
// getUsers(): Promise<User[]>;

// Run main if this file is executed directly
if (require.main === module) {
  main();
}