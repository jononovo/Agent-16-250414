/**
 * Claude AI Node
 * 
 * This node provides integration with the Claude AI API for text generation.
 */

import { NodeDefinition } from '../types';
import nodeDefinition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';

// Re-export the node definition
export { nodeDefinition };

// Re-export the executor for dynamic imports
export { execute } from './executor';

// Export UI components
export { 
  component,
  defaultData,
  validator
} from './ui';

export default nodeDefinition;