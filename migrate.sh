#!/bin/bash

# Database Migration Script for AI Agent Workflow Platform
# This script provides utilities for exporting and importing data from the database

# Set the command to run the migration utility
MIGRATE_CMD="npx tsx server/utils/migrate.ts"

# Function to display help
show_help() {
  echo "Database Migration Script"
  echo ""
  echo "Usage:"
  echo "  $0 <command> [options]"
  echo ""
  echo "Commands:"
  echo "  export [output-path]       Export all data (default: db-export.json)"
  echo "  import <file> [options]    Import data from a file"
  echo "  backup                     Create a timestamped backup"
  echo "  help                       Show this help"
  echo ""
  echo "Import options:"
  echo "  --clear                    Clear existing data before import"
  echo "  --skip-users               Don't import user accounts"
  echo "  --import-logs              Import execution logs (skipped by default)"
  echo "  --no-preserve-ids          Generate new IDs for all imported data"
  echo ""
  echo "Examples:"
  echo "  $0 export my-data.json"
  echo "  $0 import my-data.json --clear"
  echo "  $0 backup"
}

# Check if any arguments provided
if [ "$#" -lt 1 ]; then
  show_help
  exit 1
fi

# Process commands
command="$1"
shift

case "$command" in
  export)
    output_path="$1"
    if [ -z "$output_path" ]; then
      output_path="db-export.json"
    fi
    echo "Exporting data to $output_path..."
    $MIGRATE_CMD export "$output_path"
    ;;
    
  import)
    if [ "$#" -lt 1 ]; then
      echo "Error: Import file not specified"
      echo ""
      show_help
      exit 1
    fi
    
    import_file="$1"
    shift
    
    # Process options
    clear_existing=""
    skip_users=""
    skip_logs="--skip-logs"
    preserve_ids="--preserve-ids"
    
    for arg in "$@"; do
      case "$arg" in
        --clear)
          clear_existing="--clear"
          ;;
        --skip-users)
          skip_users="--skip-users"
          ;;
        --import-logs)
          skip_logs=""
          ;;
        --no-preserve-ids)
          preserve_ids=""
          ;;
      esac
    done
    
    echo "Importing data from $import_file..."
    $MIGRATE_CMD import "$import_file" $clear_existing $skip_users $skip_logs $preserve_ids
    ;;
    
  backup)
    echo "Creating database backup..."
    $MIGRATE_CMD backup
    ;;
    
  help)
    show_help
    ;;
    
  *)
    echo "Error: Unknown command '$command'"
    echo ""
    show_help
    exit 1
    ;;
esac
