/**
 * Data Transform Node Definition
 * 
 * This file defines the metadata and schema for the Data Transform node.
 */

// Node metadata
export const metadata = {
  name: "Data Transform",
  description: "Transform data with JavaScript expressions and operations",
  category: "data", // Embedded category information
  version: "1.0.0",
  tags: ["data", "transform", "map", "filter", "javascript"],
  color: "#FF5722" // Deep Orange color
};

// Node schema
export const schema = {
  inputs: {
    data: {
      type: "any",
      description: "Input data to be transformed"
    }
  },
  outputs: {
    result: {
      type: "any",
      description: "The transformed data"
    },
    error: {
      type: "string",
      description: "Error message if the transformation fails"
    }
  },
  parameters: {
    transformations: {
      type: "array",
      description: "List of transformation operations to apply",
      default: [
        {
          name: "Default Transform",
          expression: "data => data",
          enabled: true
        }
      ]
    }
  }
};