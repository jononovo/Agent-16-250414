/**
 * Create Orchestrator
 * 
 * This script demonstrates how to use the new client-centric workflow architecture
 * to create an agent and link a workflow to it.
 */

import { executeWorkflow, createAgent, linkWorkflowToAgent } from './client/src/lib/workflowClient.js';

async function createAgentWithWorkflow() {
  try {
    console.log('Creating New Agent Builder agent using the workflowClient API...');
    
    // Create agent using Workflow 15
    const agentResult = await createAgent({
      name: "New Agent Builder",
      description: "Agent that orchestrates the creation of new agents and workflows",
      type: "system",
      status: "active",
      icon: "wand-sparkles"
    }, {
      onNodeStateChange: (nodeId, state) => {
        console.log(`Node ${nodeId} state changed to ${state.status}`);
      },
      onWorkflowComplete: (state) => {
        console.log(`Agent creation workflow completed with status: ${state.status}`);
      }
    });
    
    if (!agentResult || !agentResult.success) {
      console.error('Error creating agent:', agentResult?.error || 'Unknown error');
      return;
    }
    
    const agentId = agentResult.data.id;
    console.log(`Successfully created New Agent Builder agent with id ${agentId}`);
    
    // Now, link the orchestrator workflow to the agent
    const workflowId = 18; // ID of the "New Agent Orchestrator v1" workflow
    
    console.log(`Linking workflow ${workflowId} to agent ${agentId}...`);
    
    const linkResult = await linkWorkflowToAgent(agentId, workflowId, {
      onNodeStateChange: (nodeId, state) => {
        console.log(`Node ${nodeId} state changed to ${state.status}`);
      },
      onWorkflowComplete: (state) => {
        console.log(`Link workflow completed with status: ${state.status}`);
      }
    });
    
    if (!linkResult || !linkResult.success) {
      console.error('Error linking workflow to agent:', linkResult?.error || 'Unknown error');
      return;
    }
    
    console.log(`Successfully linked workflow ${workflowId} to agent ${agentId}`);
    
    console.log('Setup complete!');
    console.log(`New Agent Builder agent (ID: ${agentId}) is now linked to the New Agent Orchestrator workflow (ID: ${workflowId})`);
    console.log('This orchestrator will chain together:');
    console.log('1. Build New Agent Structure v1 (ID: 15)');
    console.log('2. Workflow Creator Flow v1 (ID: 16)');
    console.log('3. Link Workflow to Agent v1 (ID: 6)');
  } catch (error) {
    console.error('Error:', error);
  }
}

createAgentWithWorkflow();