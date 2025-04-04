import { NodeCategory } from './types';

export const nodeCategories: NodeCategory[] = [
  {
    name: "Interface Nodes",
    description: "Connect your workflows to user interfaces and external systems",
    type: "category",
    icon: "code",
    nodeCount: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "interface",
    configuration: {}
  },
  {
    name: "Workflow Nodes",
    description: "Control the flow of data and execution in your workflows",
    type: "category",
    icon: "sitemap",
    nodeCount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "workflow",
    configuration: {}
  },
  {
    name: "Integration Nodes",
    description: "Connect your workflows to third-party services and APIs",
    type: "category",
    icon: "plug",
    nodeCount: 28,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "integration",
    configuration: {}
  },
  {
    name: "Input Nodes",
    description: "Collect user input and data for your workflows",
    type: "category",
    icon: "type",
    nodeCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "input",
    configuration: {}
  },
  {
    name: "AI Model Nodes",
    description: "Generate content using various AI models and architectures",
    type: "category",
    icon: "cpu",
    nodeCount: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "ai",
    configuration: {}
  },
  {
    name: "Visualization Nodes",
    description: "Display outputs and results to users in various formats",
    type: "category",
    icon: "eye",
    nodeCount: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "visualization",
    configuration: {}
  },
  {
    name: "Routing Nodes",
    description: "Control the flow logic and direct data through your workflow",
    type: "category",
    icon: "git-branch",
    nodeCount: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    category: "routing",
    configuration: {}
  }
];
