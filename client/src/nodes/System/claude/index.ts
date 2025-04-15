/**
 * Claude AI Node
 * 
 * This node provides integration with the Claude AI API for text generation.
 */

import { NodeDefinition } from '../../../nodes/types';
import nodeDefinition, { nodeMetadata } from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';

// Re-export the node definition and metadata
export { nodeDefinition, nodeMetadata };

// Re-export the executor for dynamic imports
export { execute } from './executor';

// Export UI components
export { 
  component,
  defaultData,
  validator
} from './ui';

export default nodeDefinition;