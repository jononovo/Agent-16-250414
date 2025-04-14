/**
 * HTTP Request Node
 * 
 * This node allows making HTTP requests to external APIs.
 */

import { NodeRegistryEntry } from '../registry';
import metadata from './metadata.json';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Globe } from 'lucide-react';
import React from 'react';

// HTTP Request Node Implementation
const HttpRequestNode: NodeRegistryEntry = {
  type: 'http_request',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(Globe, { size: 16 })
};

export default HttpRequestNode;