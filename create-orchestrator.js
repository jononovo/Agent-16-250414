import fetch from 'node-fetch';

async function createAgentWithWorkflow() {
  try {
    // First, create the agent
    const agent = {
      name: "New Agent Builder",
      description: "Agent that orchestrates the creation of new agents and workflows",
      type: "system",
      status: "active",
      icon: "wand-sparkles",
      configuration: JSON.stringify({
        // Any configuration needed
      })
    };
    
    console.log('Creating New Agent Builder agent...');
    
    const agentResponse = await fetch('http://localhost:5000/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agent)
    });
    
    const agentData = await agentResponse.json();
    console.log('Agent response status:', agentResponse.status);
    console.log('Agent response body:', JSON.stringify(agentData, null, 2));
    
    if (agentResponse.status >= 400) {
      console.error('Error creating agent:', agentResponse.status, agentData);
      return;
    }
    
    console.log(`Successfully created New Agent Builder agent with id ${agentData.id}`);
    
    // Now, link the orchestrator workflow to the agent
    const agentId = agentData.id;
    const workflowId = 18; // ID of the "New Agent Orchestrator v1" workflow we just created
    
    const updateWorkflow = {
      agentId: agentId
    };
    
    console.log(`Linking workflow ${workflowId} to agent ${agentId}...`);
    
    const updateResponse = await fetch(`http://localhost:5000/api/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateWorkflow)
    });
    
    const updateData = await updateResponse.json();
    console.log('Update response status:', updateResponse.status);
    console.log('Update response body:', JSON.stringify(updateData, null, 2));
    
    if (updateResponse.status >= 400) {
      console.error('Error linking workflow to agent:', updateResponse.status, updateData);
      return;
    }
    
    console.log(`Successfully linked workflow ${workflowId} to agent ${agentId}`);
    
    console.log('Setup complete!');
    console.log(`New Agent Builder agent (ID: ${agentId}) is now linked to the New Agent Orchestrator workflow (ID: ${workflowId})`);
    console.log('This orchestrator will chain together:');
    console.log('1. Build New Agent Structure v1 (ID: 15)');
    console.log('2. Workflow Creator Flow v1 (ID: 16)');
    console.log('3. Link Workflow to Agent v1 (ID: 12)');
  } catch (error) {
    console.error('Error:', error);
  }
}

createAgentWithWorkflow();