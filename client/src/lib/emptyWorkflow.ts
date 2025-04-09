/**
 * Creates an empty workflow with a default structure
 * to display in the workflow editor without any saved data
 */
export function getEmptyWorkflow() {
  return {
    nodes: [
      {
        id: 'start',
        type: 'input',
        position: { x: 250, y: 50 },
        data: { 
          label: 'Start', 
          description: 'Beginning of workflow'
        }
      },
      {
        id: 'process',
        type: 'process',
        position: { x: 250, y: 150 },
        data: { 
          label: 'Process', 
          description: 'Data processing step'
        }
      },
      {
        id: 'end',
        type: 'output',
        position: { x: 250, y: 250 },
        data: { 
          label: 'End', 
          description: 'End of workflow'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'start',
        target: 'process',
        animated: true
      },
      {
        id: 'e2-3',
        source: 'process',
        target: 'end',
        animated: true
      }
    ]
  };
}