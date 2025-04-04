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
    configuration: {}
  }
];
