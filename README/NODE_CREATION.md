# Node Creation Technical Specification

## Overview
This document outlines the technical requirements for creating nodes in the workflow system. It specifies the exact input/output formats, node structure, and validation requirements to ensure compatibility across all node types.

## Node Structure

### Required Files
Each node type must have the following files:
```
client/src/nodes/[node_type]/
├── executor.ts       # Contains core node execution logic
├── index.ts          # Exports node metadata
├── ui.tsx            # React component for node UI
└── schema.ts         # Zod validation schema for node data (optional)
```

### Node Registration
Nodes are automatically discovered and registered via the folder-based system in `client/src/lib/nodeSystem.ts`.

## Standardized Output Format

### NodeExecutionData Interface
All node executors MUST return data in the following format:

```typescript
interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}

interface WorkflowItem {
  json: any;              // The actual data
  text?: string;          // Text representation
  binary?: {              // For binary data (images, files, etc.)
    mimeType: string;
    data: string;
    filename?: string;
  };
}
```

### Output Creation
Always use the utility functions to create node outputs:

```typescript
// For successful execution
return createNodeOutput(data);

// For error states
return createErrorOutput(errorMessage);
```

## Input Processing

### Input Extraction
Nodes MUST implement extraction logic to handle nested standardized output format:

```typescript
function extractFromStandardizedFormat(input: any): any {
  // Case 1: Direct string/primitive
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  // Case 2: Standardized format with items array
  if (input.items && Array.isArray(input.items) && input.items.length > 0) {
    const firstItem = input.items[0];
    
    // Case 2a: Handle nested items (node output of node output)
    if (firstItem.json && firstItem.json.items && 
        Array.isArray(firstItem.json.items) && firstItem.json.items.length > 0) {
      const nestedItem = firstItem.json.items[0];
      
      // Extract from nested json
      if (nestedItem.json) {
        if (nestedItem.json.text) {
          return nestedItem.json.text;
        }
        return nestedItem.json;
      }
    }
    
    // Case 2b: Direct json content
    if (firstItem.json) {
      return firstItem.json;
    }
    
    // Case 2c: Direct text
    if (firstItem.text) {
      return firstItem.text;
    }
  }
  
  // Fall back to original input
  return input;
}
```

## Node Type-Specific Formats

### Text Processing Nodes
- Input: Accept both string and { text: string } formats
- Output: { text: string } in standardized format

### AI Model Nodes
- Input: Always extract prompt text from standardized format
- Output: Wrap model response in standardized format with response field

### Data Transformation Nodes
- Input: Accept any JSON data structure
- Output: Transformed data in standardized format

## Testing Requirements
1. Create unit tests for both direct inputs and nested standardized inputs
2. Test with empty, string, and object inputs
3. Verify correct extraction of data from standardized format
4. Ensure output complies with standardized format specification

## Common Pitfalls
1. **Failing to extract from nested structure**: Always implement proper extraction logic
2. **Direct output without standardization**: Never return raw data; use `createNodeOutput`
3. **Ignoring input format**: Always handle both direct and standardized formats
4. **Hardcoded special cases**: Avoid workflow-specific logic; use generic extraction
5. **Format incompatibility**: Ensure all node outputs follow the standardized format