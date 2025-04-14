  // Update an existing workflow based on a natural language prompt
  app.post("/api/workflows/update/:id", async (req, res) => {
    try {
      // Validate request body
      const updateSchema = z.object({
        prompt: z.string(),
        currentWorkflowId: z.number(),
        currentWorkflowName: z.string().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
          timeout: z.number().optional(),
        }).optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow update request", 
          details: validationError.message 
        });
      }
      
      const workflowId = parseInt(req.params.id, 10);
      if (isNaN(workflowId)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Get the existing workflow
      const existingWorkflow = await storage.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Extract prompt and options from the request
      const { prompt, options } = result.data;
      
      // Include additional context in the prompt for the AI
      const contextualizedPrompt = `Update the existing workflow "${existingWorkflow.name}" (ID: ${workflowId}): ${prompt}`;
      
      console.log(`Updating workflow ${workflowId} from prompt: "${prompt}"`);
      
      // Parse the existing flow data structure
      let flowData: { nodes: any[], edges: any[] };
      
      try {
        // Handle both string and object flowData formats
        if (typeof existingWorkflow.flowData === 'string') {
          flowData = JSON.parse(existingWorkflow.flowData);
        } else {
          flowData = existingWorkflow.flowData as any || { nodes: [], edges: [] };
        }
        
        // Ensure we have nodes and edges arrays
        if (!Array.isArray(flowData.nodes)) flowData.nodes = [];
        if (!Array.isArray(flowData.edges)) flowData.edges = [];
      } catch (error) {
        console.error("Error parsing workflow data:", error);
        // If we can't parse the existing data, start with empty arrays
        flowData = { nodes: [], edges: [] };
      }
      
      // Try to use the dynamic workflow generation service
      try {
        console.log("Using workflowGenerationService to generate dynamic workflow");
        
        // Generate a workflow using the dynamic generation service
        const generatedWorkflow = await workflowGenerationService.generateWorkflow(
          contextualizedPrompt,
          existingWorkflow.agentId || undefined,
          {
            ...(options || {}),
            complexity: options?.complexity || 'moderate',
            domain: options?.domain || 'general',
            maxNodes: options?.maxNodes || 10
          }
        );
        
        // Parse the generated workflow data
        let generatedFlowData;
        if (typeof generatedWorkflow.flowData === 'string') {
          generatedFlowData = JSON.parse(generatedWorkflow.flowData);
        } else {
          generatedFlowData = generatedWorkflow.flowData || { nodes: [], edges: [] };
        }
        
        // Ensure the generated data has nodes and edges arrays
        if (!generatedFlowData.nodes) generatedFlowData.nodes = [];
        if (!generatedFlowData.edges) generatedFlowData.edges = [];
        
        // Position nodes properly to ensure visibility (top-left of the canvas)
        const startX = 100;
        const startY = 100;
        const spacing = 200;
        
        // Update node positions and ensure each node has a unique ID
        const timestamp = Date.now();
        generatedFlowData.nodes = generatedFlowData.nodes.map((node: any, index: number) => {
          // Ensure node has a unique ID
          if (!node.id) {
            node.id = `${node.type || 'node'}-${timestamp}-${index}`;
          }
          
          // Ensure node has a position
          if (!node.position) {
            node.position = {
              x: startX + (index % 3) * spacing,
              y: startY + Math.floor(index / 3) * spacing
            };
          }
          
          return node;
        });
        
        // Update edge IDs and ensure connections are valid
        generatedFlowData.edges = generatedFlowData.edges.map((edge: any, index: number) => {
          // Ensure edge has an ID
          if (!edge.id) {
            edge.id = `edge-${timestamp}-${index}`;
          }
          
          // Ensure edge has type
          if (!edge.type) {
            edge.type = 'default';
          }
          
          return edge;
        });
        
        // Add the generated nodes and edges to the existing workflow
        flowData.nodes.push(...generatedFlowData.nodes);
        flowData.edges.push(...generatedFlowData.edges);
        
        console.log(`Added ${generatedFlowData.nodes.length} nodes and ${generatedFlowData.edges.length} edges from dynamically generated workflow`);
        
        // Update the workflow in the database
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData,
          description: generatedWorkflow.description || existingWorkflow.description
        };
        
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated successfully with dynamically generated nodes"
        });
        
      } catch (error) {
        console.error("Error using dynamic workflow generation:", error);
        
        // Handle error case with a fallback simple node
        console.log("Using fallback approach for workflow update");
        
        // Create a simple "generated text" node based on the prompt
        const timestamp = Date.now();
        
        // Very simple fallback of a text input node and a processing node
        const textInputNode = {
          id: `text-input-${timestamp}`,
          type: 'text_input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Input from prompt',
            category: 'input',
            description: `Input created from: ${prompt}`,
            type: 'text_input'
          }
        };
        
        const processingNode = {
          id: `process-${timestamp}`,
          type: 'generate_text',
          position: { x: 350, y: 100 },
          data: {
            label: 'Process Input',
            category: 'ai',
            description: 'Processes the input data',
            type: 'generate_text',
            settings: {
              prompt: 'Process this input: {{text_input.output}}'
            }
          }
        };
        
        const outputNode = {
          id: `output-${timestamp}`,
          type: 'output',
          position: { x: 600, y: 100 },
          data: {
            label: 'Output Result',
            category: 'output',
            description: 'Shows the processed result',
            type: 'output'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-input-process-${timestamp}`,
          source: textInputNode.id,
          target: processingNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-process-output-${timestamp}`,
          source: processingNode.id,
          target: outputNode.id,
          type: 'default'
        };
        
        // Add the fallback nodes and edges to the workflow
        flowData.nodes.push(textInputNode, processingNode, outputNode);
        flowData.edges.push(edge1, edge2);
        
        // Update the workflow with new data
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData
        };
        
        // Update the workflow in the database
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated with basic processing nodes (fallback mode)"
        });
      }
    } catch (error) {
      console.error("Workflow update error:", error);
      
      // Special handling for API key errors
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          error: true,
          message: "Missing or invalid API key for the LLM service",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: true,
        message: "Failed to update workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });