/**
 * IMPORTANT: This file is deprecated. 
 * These types have been moved to the shared/nodeTypes.ts file.
 * 
 * Please import node types from '@shared/nodeTypes' instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future update.
 */

import { PortDefinition as BasePortDefinition } from '../lib/types';
import { 
  NodeSchema as SharedNodeSchema,
  NodeDefinition as SharedNodeDefinition,
  PortDefinition as SharedPortDefinition,
  NodeConfigOption as SharedNodeConfigOption,
  WorkflowItem as SharedWorkflowItem,
  NodeExecutionData as SharedNodeExecutionData,
  EnhancedNodeExecutor as SharedEnhancedNodeExecutor,
  createWorkflowItem as sharedCreateWorkflowItem
} from '@shared/nodeTypes';

// Re-export shared types with local interfaces
export type NodeSchema = SharedNodeSchema;
export type NodeDefinition = SharedNodeDefinition;
export interface PortDefinition extends SharedPortDefinition {
  // This extends BasePortDefinition for backward compatibility
  // but uses the shared definition as its base
}
export type NodeConfigOption = SharedNodeConfigOption;
export type WorkflowItem = SharedWorkflowItem;
export type NodeExecutionData = SharedNodeExecutionData;
export type EnhancedNodeExecutor = SharedEnhancedNodeExecutor;
export const createWorkflowItem = sharedCreateWorkflowItem;