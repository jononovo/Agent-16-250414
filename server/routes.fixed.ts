// Fixed function for server/routes.ts

async function runWorkflow(
  workflow: any, 
  workflowName: string, 
  input: string | Record<string, any>, 
  executeWorkflow: any,
  context: Record<string, any> = {}
) {
  console.log(`Executing workflow ${workflowName}...`);
  
  // Extract metadata if present
  const { metadata = {}, _callStack = [] } = context;
  
  // Log for reference - later these workflows will be completely
  // replaced by proper node-based implementations
  if (workflow.id === 5) {
    console.log(`Using Workflow Creator Flow (ID: 5) - Consider migrating to create_workflow node type`);
  } else if (workflow.id === 6) {
    console.log(`Using Link Workflow to Agent Flow (ID: 6) - Consider migrating to link_workflow_to_agent node type`);
  }
  
  // Execute standard workflow execution (our new node types will be used by the workflow engine)
  // The special case handling has been moved to the respective node executors
  
  // Create a log entry for standard workflow execution
  const workflowLog = await storage.createLog({
    agentId: workflow.agentId || 0,
    workflowId: workflow.id,
    status: "running",
    input: { input, ...context },
  });
  
  // SPECIAL CASE FOR WORKFLOW 15: Build New Agent Structure v1
  // This is needed because server-side node executors don't properly handle the OR-dependency pattern
  if (workflow.id === 15) {
    console.log('Special handling for Build New Agent Structure workflow (ID 15)');
    
    // Determine the source from metadata to support multiple trigger paths
    const source = metadata.source || 'ui_button';
    console.log(`Source for workflow 15: ${source}`);
    
    // For direct agent creation case
    if (typeof input === 'object' && input.name) {
      try {
        // Create agent with the provided data
        const agentData = {
          name: input.name,
          description: input.description || 'Agent created from workflow',
          type: 'custom',
          icon: 'brain',
          status: 'active'
        };
        
        console.log('Creating agent directly with data:', JSON.stringify(agentData));
        const agent = await storage.createAgent(agentData);
        
        // Update the log
        await storage.updateLog(workflowLog.id, {
          status: 'success',
          output: {
            action: 'create_agent',
            result: 'success',
            agent,
            message: `Created new agent: ${agentData.name}`,
          },
          completedAt: new Date()
        });
        
        // Return success result
        return {
          success: true,
          status: 'complete',
          output: {
            action: 'create_agent',
            result: 'success',
            agent,
            message: `Created new agent: ${agentData.name}`,
          },
          logId: workflowLog.id
        };
      } catch (error) {
        // If direct creation fails, log the error but continue with regular execution
        console.error('Direct agent creation failed, falling back to workflow execution:', error);
      }
    }
  }
  
  try {
    // Check for valid workflow data
    if (!workflow.flowData) {
      await storage.updateLog(workflowLog.id, {
        status: "error",
        error: `${workflowName} has no flow data`,
        completedAt: new Date()
      });
      return { 
        success: false, 
        error: `${workflowName} has no flow data`,
        logId: workflowLog.id
      };
    }
    
    // Parse the flow data
    const flowData = typeof workflow.flowData === 'string' 
      ? JSON.parse(workflow.flowData) 
      : workflow.flowData;
    
    const nodes = flowData.nodes || [];
    const edges = flowData.edges || [];
    
    console.log(`${workflowName}: ${nodes.length} nodes and ${edges.length} edges`);
    
    // Inject the input into the first text_input node
    // Determine the appropriate input text based on the input type
    const inputText = typeof input === 'string' 
      ? input 
      : (input.text || input.prompt || JSON.stringify(input));
      
    const startNode = nodes.find((node: { type: string }) => node.type === 'text_input');
    if (startNode) {
      if (!startNode.data) startNode.data = {};
      startNode.data.inputText = inputText;
      
      // If input is an object, add the full object properties as well
      if (typeof input === 'object') {
        startNode.data = { ...startNode.data, ...input };
      }
    } else if (nodes.length > 0) {
      // If no start node found, add the input to the first node
      if (!nodes[0].data) nodes[0].data = {};
      nodes[0].data.inputText = inputText;
      
      // If input is an object, add the full object properties as well
      if (typeof input === 'object') {
        nodes[0].data = { ...nodes[0].data, ...input };
      }
    }
    
    // Pass the context (metadata and call stack) to all relevant nodes
    for (const node of nodes) {
      if (!node.data) node.data = {};
      
      // Pass metadata to all nodes that might need it
      if (Object.keys(metadata).length > 0) {
        node.data.metadata = { ...metadata };
        console.log(`Passing metadata to node ${node.id}:`, metadata);
      }
      
      // Pass call stack specifically to workflow/agent trigger nodes
      if (_callStack.length > 0 && (node.type === 'workflow_trigger' || node.type === 'agent_trigger')) {
        node.data._callStack = _callStack;
      }
    }
    
    // Initialize node states tracking
    const nodeStates: Record<string, any> = {};
    
    // Add debugging info for workflow and nodes
    console.log('DEBUG - Workflow data:', workflowName, workflowLog.id);
    console.log('DEBUG - Nodes:', JSON.stringify(nodes.map((n: any) => ({
      id: n.id,
      type: n.type,
      data: { 
        ...n.data,
        label: n.data?.label, 
        workflowId: n.data?.workflowId,
        triggerType: n.data?.triggerType 
      }
    }))));
    
    // Execute the workflow
    const result = await executeWorkflow(
      nodes,
      edges,
      (nodeId: string, state: any) => {
        // Store node states as they change
        nodeStates[nodeId] = state;
        console.log(`[${workflowName}] Node ${nodeId} state: ${state.state}`);
      },
      (finalState: any) => {
        console.log(`[${workflowName}] Execution completed with status: ${finalState.status}`);
      }
    );
    
    // Find the output nodes
    const outputNodes = nodes.filter((node: { id: string }) => {
      // Nodes with no outgoing edges are considered output nodes
      return !edges.some((edge: { source: string }) => edge.source === node.id);
    });
    
    // Collect output from the final nodes
    const outputs: Record<string, any> = {};
    outputNodes.forEach((node: { id: string }) => {
      if (result.nodeStates[node.id]) {
        outputs[node.id] = result.nodeStates[node.id].data;
      }
    });
    
    // Update log with results
    await storage.updateLog(workflowLog.id, {
      status: result.status === 'error' ? 'error' : 'success',
      output: outputs,
      error: result.error,
      executionPath: { 
        nodes: Object.keys(result.nodeStates),
        completed: result.status === 'complete',
        error: result.error
      },
      completedAt: new Date()
    });
    
    if (result.status !== 'complete') {
      return { 
        success: false, 
        error: `${workflowName} execution failed: ${result.error || 'Unknown error'}`,
        status: result.status,
        outputs,
        logId: workflowLog.id
      };
    }
    
    // Extract the primary output (first output node, or node named 'output')
    let primaryOutput = '';
    const outputNodeId = outputNodes[0]?.id || 'output';
    if (result.nodeStates[outputNodeId] && result.nodeStates[outputNodeId].data) {
      primaryOutput = result.nodeStates[outputNodeId].data;
    }
    
    return {
      success: true,
      status: result.status,
      output: primaryOutput,
      logId: workflowLog.id
    };
    
  } catch (executionError) {
    console.error(`Error executing ${workflowName}:`, executionError);
    // Update log with error
    await storage.updateLog(workflowLog.id, {
      status: 'error',
      error: executionError instanceof Error ? executionError.message : String(executionError),
      completedAt: new Date()
    });
    
    return { 
      success: false, 
      error: `${workflowName} execution error: ${executionError instanceof Error ? executionError.message : String(executionError)}`,
      logId: workflowLog.id
    };
  }
}