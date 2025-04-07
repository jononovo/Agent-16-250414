# Database Migration Guide

This document provides comprehensive instructions for migrating data between databases for the AI Agent Workflow Platform.

## Overview

The migration system allows you to:
1. Export all data from an existing database to a JSON file
2. Import data from a JSON file into a new database
3. Create backups of your database

The system is designed to preserve all relationships between agents, workflows, nodes, logs, and their configurations.

## Critical Migration Considerations

### API-Centric Architecture

The platform has transitioned to a client-centric, API-based architecture:
- Workflows execute primarily in the browser with nodes making API calls to the backend
- The migration must preserve all API endpoint configurations used by nodes
- The `flowData` JSON in each workflow contains crucial endpoint references that must be maintained

### Workbench Page and Workflow Logs

- The platform includes a workbench page that displays comprehensive logs of workflow executions
- These logs must be explicitly included in the migration using the `--import-logs` flag
- **Always use this flag when migrating to a production environment** to ensure workflow history and debugging capabilities are preserved
- The workbench relies on complete log data for proper visualization and debugging

### Node Registry and Node Types

- Nodes are registered in client-side registries with specific executors
- Migration must preserve node configuration data for all node types
- API nodes have specific endpoint configurations that must be maintained
- The node registry is dynamically built from data in the database

### Complete Node and Workflow Data

- The client-side workflow execution depends on complete node and workflow data
- Some platform functionality relies on data that may not be directly stored in database tables
- The `flowData` field in workflows contains critical execution information
- When migrating, ensure that ALL nodes, workflows, and their configurations are included

## Prerequisites

- Access to both the source and target database environments
- Node.js and NPM installed
- Proper DATABASE_URL environment variable set
- Understanding of the API-centric workflow architecture

## Migration Steps

### 1. Prepare the Environment

Before migrating, ensure:
- Both source and target environments are running the same version of the platform
- The DATABASE_URL environment variable is correctly set
- Your database credentials have full read/write access

### 2. Creating a Backup

Always create a backup before any migration:

```bash
./migrate.sh backup
```

This will create a file named `backup-[timestamp].json` in the current directory.

### 3. Exporting Data

To export all your data from the current database:

```bash
./migrate.sh export [optional-output-path]
```

If no output path is specified, the data will be exported to `db-export.json` in the current directory.

### 4. Importing Data

To import data into a new database:

```bash
./migrate.sh import <path-to-json-file> [options]
```

Available options:
- `--clear` - Clear existing data in the target database before import
- `--skip-users` - Don't import user accounts
- `--import-logs` - Import execution logs (by default, logs are skipped)
- `--no-preserve-ids` - Generate new IDs for all imported data

### 5. Critical Import Scenarios

#### For Production Migrations
For production environments, always include logs and clear existing data:
```bash
./migrate.sh import data.json --clear --import-logs
```

#### For Development/Testing
For testing environments, you might want to generate new IDs:
```bash
./migrate.sh import data.json --no-preserve-ids
```

#### When Preserving Workflow History is Critical
If workflow history and debugging via the workbench is important:
```bash
./migrate.sh import data.json --clear --import-logs
```

## What Gets Migrated

The migration includes:

### 1. Database Tables
- Users - Authentication and user information
- Agents - AI agent definitions and configurations
- Workflows - Workflow definitions and their flow data (nodes, edges, configurations)
- Nodes - Node type definitions and metadata
- Logs - Execution logs for all workflows

### 2. API Endpoint References
- All API endpoint references within workflow flow data
- Custom API configurations in node data
- Workflow triggers and execution paths

### 3. Node Configurations
- Node type information
- Node-specific settings and parameters
- Custom code snippets within node configurations
- API endpoint configurations used by nodes

### 4. Workflow Execution Data
- Execution paths and history
- Input/output relationships
- Error states and debugging information
- Performance metrics and timing data

## Structural Relationships Preserved

The migration process preserves these critical relationships:
- Workflows → Agents
- Nodes ↔ Workflows (via flowData)
- API Endpoints ↔ Nodes
- Logs → Agents and Workflows
- Flow data references to nodes and workflows

## Technical Details

### Data Structure

The exported JSON file contains:
```json
{
  "users": [...],
  "agents": [...],
  "workflows": [...],
  "nodes": [...],
  "logs": [...],
  "metadata": {
    "exportedAt": "ISO-date",
    "version": "1.0.0"
  }
}
```

### Implementation Notes

1. **Flow Data Integrity**:
   - The `flowData` field in workflows contains the complete node graph
   - This includes all node positions, connections, and configurations
   - API endpoint references in flow data will be preserved during migration

2. **Node Registry Data**:
   - The node registry is rebuilt based on the migrated node data
   - Ensure all node types and their executors are present in the target environment

3. **API Endpoint Configuration**:
   - API nodes contain endpoint configurations that must be preserved
   - These configurations may include URLs, methods, headers, and body templates

### Date Field Handling

The migration utility includes automatic date field processing:
- A `processDateFields` helper function properly converts string dates to JavaScript Date objects
- Handled date fields include: `createdAt`, `updatedAt`, `startedAt`, `completedAt`
- This prevents common errors like `value.toISOString is not a function` during database imports
- The conversion happens during the import process before insertion into the database

## Troubleshooting

### Common Issues

1. **Missing API Configurations**:
   - If workflows load but nodes fail to execute, check that API configurations were properly migrated
   - Verify that the `flowData` field contains complete node configurations
   - Ensure that API endpoint references are valid in the new environment

2. **Workbench Page Shows No Logs**:
   - If the workbench page doesn't display workflow execution history, ensure logs were included in migration
   - Use the `--import-logs` flag when importing
   - Check that log relationships to workflows and agents are preserved

3. **Node Registration Problems**:
   - If nodes aren't executing properly, verify that all node types are registered
   - Ensure the target environment has all necessary node executors
   - Check that node configurations are complete in the imported data

4. **Database connection errors**:
   - Ensure the DATABASE_URL environment variable is set correctly
   - Verify database permissions

5. **Import conflicts**:
   - Use the `--clear` option to avoid conflicts with existing data

## Examples

### Full Production Migration with Logs

1. On the source system:
```bash
./migrate.sh export production-data.json
```

2. Transfer the JSON file to the target system.

3. On the target system:
```bash
./migrate.sh import production-data.json --clear --import-logs
```

### Development Environment Setup

```bash
# Export production data
./migrate.sh export prod-data.json

# Import to development environment with new IDs to avoid conflicts
./migrate.sh import prod-data.json --no-preserve-ids
```

### Configuration-Only Migration

For setting up a new environment with just the configuration (no historical data):
```bash
./migrate.sh import config-only.json --clear
```

## Verification After Migration

After migration, verify:

1. **Agents**: Check that all agents appear in the agent list
2. **Workflows**: Verify workflows load correctly in the editor
3. **Nodes**: Test that all node types function as expected
4. **API Integration**: Test workflows that make API calls
5. **Workbench**: Confirm logs appear in the workbench (if imported)
6. **Node Registry**: Verify all node types are registered correctly

By following this guide, you should be able to successfully migrate your AI Agent Workflow Platform between environments while preserving all functionality and data relationships.
