/**
 * JSONPath Node Definition
 * 
 * This file defines the metadata and schema for the JSONPath node.
 */

// Node metadata
export const metadata = {
  name: "JSONPath",
  description: "Extract data from JSON objects using path expressions",
  category: "data", // Embedded category information
  version: "1.0.0",
  tags: ["data", "json", "extract", "query", "path"],
  color: "#F59E0B" // Amber color
};

// Node schema
export const schema = {
  inputs: {
    data: {
      type: "object",
      description: "JSON data to extract from"
    }
  },
  outputs: {
    value: {
      type: "any",
      description: "The extracted value"
    },
    error: {
      type: "string",
      description: "Error message if the extraction fails"
    }
  },
  parameters: {
    path: {
      type: "string",
      description: "JSONPath expression to extract data (e.g., $.user.name)",
      default: "$.data"
    }
  }
};