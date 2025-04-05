# Database Migration Guide

This document provides instructions for migrating data between databases for the AI Agent Workflow Platform.

## Overview

The migration system allows you to:
1. Export all data from an existing database to a JSON file
2. Import data from a JSON file into a new database
3. Create backups of your database

The system preserves all relationships between agents, workflows, nodes, and logs during the migration process.

## Prerequisites

- Access to both the source and target database environments
- Node.js and NPM installed
- Proper DATABASE_URL environment variable set

## Migration Steps

### 1. Exporting Data

To export all your data from the current database:

```bash
./migrate.sh export [optional-output-path]
```

If no output path is specified, the data will be exported to `db-export.json` in the current directory.

### 2. Creating a Backup

To create a timestamped backup of your current database:

```bash
./migrate.sh backup
```

This will create a file named `backup-[timestamp].json` in the current directory.

### 3. Importing Data

To import data into a new database:

```bash
./migrate.sh import <path-to-json-file> [options]
```

Available options:
- `--clear` - Clear existing data in the target database before import
- `--skip-users` - Don\'t import user accounts
- `--import-logs` - Import execution logs (by default, logs are skipped)
- `--no-preserve-ids` - Generate new IDs for all imported data

### 4. Advanced Usage

For development or testing scenarios, you might want to:

1. Import without clearing data:
```bash
./migrate.sh import data.json
```

2. Clear existing data and preserve IDs:
```bash
./migrate.sh import data.json --clear
```

3. Import everything including logs:
```bash
./migrate.sh import data.json --clear --import-logs
```

4. Generate new IDs (useful for creating duplicates):
```bash
./migrate.sh import data.json --no-preserve-ids
```

## Database Relationships

The migration process preserves these relationships:
- Workflows → Agents
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

### Implementation

The migration utility handles:
1. Exporting all data from database tables
2. Importing data while maintaining referential integrity
3. Updating references in JSON data (like workflow.flowData) to match new IDs if needed

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Ensure the DATABASE_URL environment variable is set correctly
   - Verify database permissions

2. **Import conflicts**:
   - Use the `--clear` option to avoid conflicts with existing data

3. **Missing relationships**:
   - Make sure to import the complete export file
   - Don\'t manually edit the exported JSON unless you understand the schema relationships

## Examples

### Full Migration Workflow

1. On the source system:
```bash
./migrate.sh export original-data.json
```

2. Transfer the JSON file to the target system.

3. On the target system:
```bash
./migrate.sh import original-data.json --clear
```

### Creating a Test Environment with Real Data

```bash
# Export production data
./migrate.sh export prod-data.json

# Import to test environment with new IDs to avoid conflicts
./migrate.sh import prod-data.json --no-preserve-ids
```
