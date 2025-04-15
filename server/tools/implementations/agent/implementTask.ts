/**
 * Implement Task Tool
 * 
 * This tool helps the agent implement a task requested by the user,
 * providing step-by-step guidance and implementation plans.
 */
import { Tool, ToolResult } from '../../toolTypes';
import { storage } from '../../../storage';
import { InsertWorkflow } from '@shared/schema';
import { workflowGenerationService } from '../../../services/workflowGenerationService';

const implementTaskTool: Tool = {
  name: 'implementTask',
  description: 'Implement a task by creating a step-by-step plan or workflow',
  category: 'agent',
  parameters: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'The task to implement',
      },
      description: {
        type: 'string',
        description: 'Additional description or context for the task',
        default: ''
      },
      agentId: {
        type: 'number',
        description: 'The ID of the agent implementing the task',
      },
      createWorkflow: {
        type: 'boolean',
        description: 'Whether to create a workflow from this task',
        default: true
      },
      complexity: {
        type: 'string',
        description: 'The complexity level of the workflow to generate',
        enum: ['simple', 'moderate', 'complex'],
        default: 'moderate'
      }
    },
    required: ['task'],
  },
  
  async execute(params: any): Promise<ToolResult> {
    try {
      const { task, description = '', agentId, createWorkflow = true, complexity = 'moderate' } = params;
      
      // Create a step-by-step implementation plan
      const implementationSteps = [
        {
          step: 1,
          action: 'Analyze the request',
          description: 'Understand exactly what the user is requesting'
        },
        {
          step: 2,
          action: 'Break down the task',
          description: 'Divide the task into smaller, manageable subtasks'
        },
        {
          step: 3, 
          action: 'Identify required tools',
          description: 'Determine which tools are needed to implement each subtask'
        },
        {
          step: 4,
          action: 'Create implementation plan',
          description: 'Design a logical sequence of operations to accomplish the task'
        },
        {
          step: 5,
          action: 'Execute the implementation plan',
          description: 'Carry out each step of the plan, adjusting as needed'
        }
      ];
      
      // If creating a workflow is requested
      let workflowResult = null;
      
      if (createWorkflow) {
        try {
          // Generate a workflow from the task description
          const workflowData = await workflowGenerationService.generateWorkflow(
            task,
            agentId,
            { 
              complexity, 
              maxNodes: complexity === 'simple' ? 5 : complexity === 'moderate' ? 10 : 15 
            }
          );
          
          // Create the workflow in storage
          const insertWorkflow: InsertWorkflow = {
            name: `${task.slice(0, 30)}${task.length > 30 ? '...' : ''}`,
            description: description || task,
            type: 'task',
            status: 'active',
            agentId: agentId,
            flowData: JSON.stringify(workflowData),
          };
          
          const workflow = await storage.createWorkflow(insertWorkflow);
          workflowResult = {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            flowData: workflowData
          };
        } catch (error) {
          console.error('Error generating workflow:', error);
          workflowResult = {
            error: 'Failed to generate workflow automatically',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      return {
        success: true,
        message: `Created implementation plan for task: ${task}`,
        data: {
          task,
          description,
          implementationSteps,
          workflow: workflowResult
        },
      };
    } catch (error) {
      console.error('Error implementing task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error implementing task',
      };
    }
  },
};

export default implementTaskTool;