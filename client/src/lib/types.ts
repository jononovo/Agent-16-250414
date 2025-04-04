import { Agent, Workflow, Node } from '@shared/schema';

export type TabType = 'agents' | 'workflows' | 'nodes';

export interface NodeCategory extends Omit<Node, 'id'> {
  id?: number;
  nodeCount: number;
}
