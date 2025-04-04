# Workflow Automation Platform

A powerful workflow automation platform that enables users to design complex process flows through an intuitive, visual interface with advanced interaction capabilities.

## Overview

This workflow automation system allows you to create, visualize and execute sophisticated automation workflows through a drag-and-drop interface. Built with React Flow and powered by a Node.js backend, the system provides a rich set of pre-built nodes for executing various tasks.

## Features

- **Visual Workflow Builder**: Drag-and-drop interface for designing workflows
- **Advanced Node System**: Specialized nodes for AI, data transformation, triggers, and actions
- **Real-time Workflow Execution**: Execute workflows and view results in real-time
- **Edge Connection System**: Connect nodes with intelligent edge routing
- **Workflow Management**: Save, load, and manage multiple workflows
- **AI-Powered Nodes**: Text generation, prompt crafting, and visualization nodes
- **Expandable Architecture**: Easily add new node types

## Getting Started

### Using the Workflow Editor

1. **Create a new workflow**:
   - Navigate to the Workflows page and click "Create New Workflow"
   - Give your workflow a name and description

2. **Design your workflow**:
   - Drag nodes from the sidebar onto the canvas
   - Configure each node by selecting it and using the configuration panel
   - Connect nodes by dragging from an output handle to an input handle

3. **Save and execute**:
   - Save your workflow using the save button
   - Execute the workflow to see the results

### Node Types

#### AI Nodes

- **Text Input Node**: Provides static text input to the workflow
- **Generate Text Node**: Creates AI-generated text using various models
- **Prompt Crafter Node**: Designs templated prompts with variables
- **Visualize Text Node**: Displays text output in the workflow

#### Trigger Nodes

- **Webhook**: Triggers a workflow from an HTTP request
- **Scheduler**: Runs a workflow on a schedule
- **Email Trigger**: Triggers from email events

#### Action Nodes

- **HTTP Request**: Makes API requests to external services
- **Email Send**: Sends email messages
- **Database Query**: Performs database operations

#### Data Nodes

- **Data Transform**: Transforms data structure
- **Filter**: Filters data based on conditions

## Technical Architecture

The platform is built with the following technologies:

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Workflow Engine**: React Flow
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Context API with React Query

## Development

Please refer to the following technical documentation for detailed implementation specifics:

- [Node Implementation Details](./node-implementation-details.md): Detailed specifications for each node
- [Node Styling Guide](./node-styling-guide.md): Visual styling guidelines for consistent node appearance
- [Workflow System Code Examples](./workflow_system_code_examples.md): Example code for key system components
- [Technical Documentation](./workflow-nodes-technical-documentation.md): Complete technical documentation

## Lead Generation Use Case

The system is particularly well-suited for lead generation workflows, with a three-step process:

1. **Company Identification**: Identify target companies based on criteria
2. **Contact Discovery**: Find key decision-makers within target companies
3. **Contact Information Retrieval**: Obtain contact information for identified individuals

This process can be fully automated using the workflow system, connecting various nodes to form a complete lead generation pipeline.

## Extending the System

### Adding New Node Types

To add a new node type:

1. Create a new component file in `client/src/components/flow/`
2. Implement the node interface and visual appearance
3. Register the node in the node registry
4. Add the node to the appropriate category in the sidebar

See the technical documentation for detailed examples.
