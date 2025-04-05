/**
 * Command-line interface for migration utility
 */
import { exportAllData, importAllData, createBackup } from './migration';

// Parse command line arguments
const [_node, _script, command, ...args] = process.argv;

async function main() {
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
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function handleExport(args: string[]) {
  const outputPath = args[0];
  await exportAllData(outputPath);
  console.log('Export completed successfully');
}

async function handleImport(args: string[]) {
  const [inputPath, ...options] = args;
  
  if (!inputPath) {
    console.error('Error: Import file path is required');
    process.exit(1);
  }
  
  // Parse options
  const importOptions = {
    clearExisting: options.includes('--clear'),
    skipUsers: options.includes('--skip-users'),
    skipLogs: !options.includes('--import-logs'),
    preserveIds: !options.includes('--no-preserve-ids')
  };
  
  console.log(`Importing data from ${inputPath} with options:`, importOptions);
  await importAllData(inputPath, importOptions);
  console.log('Import completed successfully');
}

async function handleBackup() {
  const backupPath = await createBackup();
  console.log(`Backup created successfully at: ${backupPath}`);
}

function showHelp() {
  console.log(`
Migration Utility
Usage: npx tsx server/utils/migrate.ts <command> [options]

Commands:
  export [output-path]       Export all data (default: db-export.json)
  import <file> [options]    Import data from a file
  backup                     Create a timestamped backup

Import options:
  --clear                    Clear existing data before import
  --skip-users               Don't import user accounts
  --import-logs              Import execution logs (skipped by default)
  --no-preserve-ids          Generate new IDs for all imported data

Examples:
  npx tsx server/utils/migrate.ts export my-data.json
  npx tsx server/utils/migrate.ts import my-data.json --clear
  npx tsx server/utils/migrate.ts backup
  `);
}

// Run the CLI
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});