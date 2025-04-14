/**
 * HTTP Request Node
 * 
 * This node allows workflows to make HTTP requests to external APIs
 * and web services.
 */

import { NodeRegistryEntry } from '../../lib/types';
import definition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Globe } from 'lucide-react';
import React from 'react';

// Ensure the definition complies with NodeMetadata interface
const metadata = {
  name: "HTTP Request", // We need to add a name if it's missing in definition
  description: definition.description || "Make HTTP requests to external services",
  category: definition.category || "integration",
  version: definition.version || "1.0.0"
};

const HttpRequestNode: NodeRegistryEntry = {
  type: 'http_request',
  metadata,
  schema,
  executor: {
    execute: executor.execute,
    defaultData: ui.defaultData // Move defaultData from UI to executor as per interface
  },
  ui: ui.component,
  validator: ui.validator,
  icon: React.createElement(Globe, { size: 16 })
};

export default HttpRequestNode;