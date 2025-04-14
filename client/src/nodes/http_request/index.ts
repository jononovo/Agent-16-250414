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

const HttpRequestNode: NodeRegistryEntry = {
  type: 'http_request',
  metadata: definition, // Use definition instead of metadata
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