/**
 * Folder-Based Node System
 * 
 * This module provides a centralized system for discovering, registering,
 * and executing nodes based on the folder-based node architecture.
 * 
 * Each node is expected to have its own folder with:
 * - ui.tsx: The UI component for ReactFlow
 * - executor.ts: The execution logic
 * - definition.ts: Metadata about the node
 */

import { NodeProps } from 'reactflow';
import React from 'react';

// Type definitions
export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode | string;
  color?: string;
  inputs?: NodePortDefinition[];
  outputs?: NodePortDefinition[];
  defaultData?: Record<string, any>;
}

export interface NodePortDefinition {
  id: string;
  label: string;
  description?: string;
}

export interface NodeExecutor {
  execute: (nodeData: any, inputs: any) => Promise<any>;
}

// Node registry storage
const nodeDefinitions: Record<string, NodeDefinition> = {};
const nodeUiComponents: Record<string, React.ComponentType<NodeProps>> = {};
const nodeExecutors: Record<string, NodeExecutor> = {};

/**
 * Register a node's UI component
 */
export function registerNodeUiComponent(
  nodeType: string, 
  component: React.ComponentType<NodeProps>
): void {
  nodeUiComponents[nodeType] = component;
  console.log(`Registered UI component for node type: ${nodeType}`);
}

/**
 * Register a node's definition
 */
export function registerNodeDefinition(
  nodeType: string,
  definition: NodeDefinition
): void {
  nodeDefinitions[nodeType] = definition;
  console.log(`Registered definition for node type: ${nodeType}`);
}

/**
 * Register a node's executor
 */
export function registerNodeExecutor(
  nodeType: string,
  executor: NodeExecutor
): void {
  nodeExecutors[nodeType] = executor;
  console.log(`Registered executor for node type: ${nodeType}`);
}

/**
 * Get a node's UI component
 */
export function getNodeUiComponent(nodeType: string): React.ComponentType<NodeProps> | undefined {
  return nodeUiComponents[nodeType];
}

/**
 * Get a node's definition
 */
export function getNodeDefinition(nodeType: string): NodeDefinition | undefined {
  return nodeDefinitions[nodeType];
}

/**
 * Get a node's executor
 */
export function getNodeExecutor(nodeType: string): NodeExecutor | undefined {
  return nodeExecutors[nodeType];
}

/**
 * Get all registered node types
 */
export function getAllNodeTypes(): string[] {
  return Object.keys(nodeDefinitions);
}

/**
 * Get all node definitions
 */
export function getAllNodeDefinitions(): Record<string, NodeDefinition> {
  return { ...nodeDefinitions };
}

/**
 * Get all node UI components
 */
export function getAllNodeUiComponents(): Record<string, React.ComponentType<NodeProps>> {
  return { ...nodeUiComponents };
}

/**
 * Execute a node
 */
export async function executeNode(
  nodeType: string,
  nodeData: any,
  inputs: any
): Promise<any> {
  const executor = getNodeExecutor(nodeType);
  
  if (!executor) {
    throw new Error(`No executor registered for node type: ${nodeType}`);
  }
  
  try {
    return await executor.execute(nodeData, inputs);
  } catch (error) {
    console.error(`Error executing node of type ${nodeType}:`, error);
    throw error;
  }
}

/**
 * Group nodes by category
 */
export function groupNodesByCategory(): Record<string, NodeDefinition[]> {
  const groupedNodes: Record<string, NodeDefinition[]> = {};
  
  Object.values(nodeDefinitions).forEach(definition => {
    const category = definition.category || 'Uncategorized';
    
    if (!groupedNodes[category]) {
      groupedNodes[category] = [];
    }
    
    groupedNodes[category].push(definition);
  });
  
  return groupedNodes;
}

/**
 * Filter nodes by search term
 */
export function filterNodesBySearch(searchTerm: string): NodeDefinition[] {
  if (!searchTerm) {
    return Object.values(nodeDefinitions);
  }
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return Object.values(nodeDefinitions).filter(definition => {
    return (
      definition.type.toLowerCase().includes(lowerSearchTerm) ||
      definition.label.toLowerCase().includes(lowerSearchTerm) ||
      definition.description.toLowerCase().includes(lowerSearchTerm) ||
      definition.category.toLowerCase().includes(lowerSearchTerm)
    );
  });
}

/**
 * Helper function to load all folder-based nodes
 * This would typically be called at application startup
 */
export function registerFolderBasedNode(
  nodeType: string,
  uiComponent: React.ComponentType<NodeProps>,
  executor: NodeExecutor,
  definition: NodeDefinition
): void {
  registerNodeDefinition(nodeType, definition);
  registerNodeUiComponent(nodeType, uiComponent);
  registerNodeExecutor(nodeType, executor);
}