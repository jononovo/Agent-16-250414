/**
 * Analyze Workflow Criteria Tool
 * 
 * This tool analyzes a workflow to determine its criteria, objectives,
 * and how the AI assistant can help improve it.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';

const analyzeWorkflowCriteriaTool: Tool = {
  name: 'analyzeWorkflowCriteria',
  description: 'Analyze a workflow to determine its criteria, objectives, and how the AI assistant can help',
  category: 'canvas',
  contexts: ['canvas', 'workflow'], // This tool is only available in canvas contexts
  parameters: {
    type: 'object',
    properties: {
      workflowId: {
        type: 'number',
        description: 'The ID of the workflow to analyze',
      },
    },
    required: ['workflowId'],
  },
  async execute(params: any): Promise<ToolResult> {
    try {
      const { workflowId } = params;
      
      // Get the workflow
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        return {
          success: false,
          error: `Workflow with ID ${workflowId} not found`,
        };
      }
      
      // Get all nodes in the workflow
      const nodes = await storage.getNodes();
      const workflowNodes = nodes.filter(node => node.workflowId === workflowId);
      
      // Analyze the workflow structure to determine its purpose
      const nodeTypes = workflowNodes.map(node => node.type);
      const uniqueNodeTypes = [...new Set(nodeTypes)];
      
      // Determine workflow type based on node composition
      let workflowType = 'general';
      let primaryObjective = 'process data';
      let criteria = ['functionality'];
      
      // Look for patterns in the node types to determine workflow category
      if (uniqueNodeTypes.includes('openAiCompletion') || uniqueNodeTypes.includes('openAiChat')) {
        workflowType = 'ai_generation';
        primaryObjective = 'generate AI content or responses';
        criteria = ['accuracy', 'relevance', 'quality'];
      } 
      else if (uniqueNodeTypes.includes('httpRequest') && uniqueNodeTypes.includes('jsonTransform')) {
        workflowType = 'api_integration';
        primaryObjective = 'integrate with external APIs and process data';
        criteria = ['reliability', 'error handling', 'data validation'];
      }
      else if (uniqueNodeTypes.includes('textInput') && uniqueNodeTypes.includes('textOutput')) {
        workflowType = 'text_processing';
        primaryObjective = 'process and transform text input';
        criteria = ['text processing quality', 'output formatting'];
      }
      else if (uniqueNodeTypes.includes('formInput') || uniqueNodeTypes.includes('userInterface')) {
        workflowType = 'user_interaction';
        primaryObjective = 'collect and process user input';
        criteria = ['usability', 'input validation', 'user experience'];
      }
      
      // Determine complexity
      const complexity = workflowNodes.length <= 3 ? 'simple' : 
                          workflowNodes.length <= 10 ? 'moderate' : 'complex';
      
      // Determine completeness
      const hasInputNode = workflowNodes.some(node => 
        ['textInput', 'fileInput', 'formInput', 'httpRequest'].includes(node.type)
      );
      
      const hasOutputNode = workflowNodes.some(node => 
        ['textOutput', 'visualization', 'fileOutput', 'emailSender'].includes(node.type)
      );
      
      const completeness = hasInputNode && hasOutputNode ? 'complete' : 
                          (hasInputNode || hasOutputNode) ? 'partial' : 'incomplete';
      
      // Analyze potential ways the assistant can help
      const assistanceSuggestions = [];
      
      if (completeness !== 'complete') {
        assistanceSuggestions.push({
          type: 'structure_improvement',
          description: 'Complete the workflow structure with missing input or output nodes',
          priority: 'high'
        });
      }
      
      if (complexity === 'complex') {
        assistanceSuggestions.push({
          type: 'optimization',
          description: 'Simplify and optimize the workflow for better performance and maintainability',
          priority: 'medium'
        });
      }
      
      // Add specific suggestions based on workflow type
      switch (workflowType) {
        case 'ai_generation':
          assistanceSuggestions.push({
            type: 'ai_optimization',
            description: 'Optimize AI model parameters and prompts for better results',
            priority: 'high'
          });
          break;
          
        case 'api_integration':
          assistanceSuggestions.push({
            type: 'error_handling',
            description: 'Enhance error handling and implement retry mechanisms for API calls',
            priority: 'high'
          });
          break;
          
        case 'text_processing':
          assistanceSuggestions.push({
            type: 'formatting_enhancement',
            description: 'Improve text formatting and processing techniques',
            priority: 'medium'
          });
          break;
          
        case 'user_interaction':
          assistanceSuggestions.push({
            type: 'ux_improvement',
            description: 'Enhance user interface elements and input validation',
            priority: 'high'
          });
          break;
          
        default:
          assistanceSuggestions.push({
            type: 'general_enhancement',
            description: 'Provide general workflow enhancements and best practices',
            priority: 'medium'
          });
      }
      
      return {
        success: true,
        message: `Analysis complete for workflow ${workflowId} (${workflow.name})`,
        data: {
          workflowName: workflow.name,
          workflowDescription: workflow.description || 'No description provided',
          analysis: {
            workflowType,
            primaryObjective,
            criteria,
            complexity,
            completeness,
            nodeCount: workflowNodes.length,
            uniqueNodeTypes,
          },
          assistanceSuggestions,
          nextSteps: [
            'Review the identified criteria and objectives',
            'Select a specific area where you would like AI assistance',
            'Use the improveWorkflow tool to get specific enhancement suggestions',
            'Apply suggested improvements using the updateNodeParameters tool'
          ]
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze workflow criteria: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

export default analyzeWorkflowCriteriaTool;