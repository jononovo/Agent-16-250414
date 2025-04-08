'use client';

import MainContent from '@/components/layout/MainContent';
import { WorkflowGenerator } from '@/components/workflows/WorkflowGenerator';
import { Separator } from '@/components/ui/separator';

export default function WorkflowGeneratorPage() {
  return (
    <MainContent>
      <div className="container py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Workflow from Description</h1>
          <p className="text-muted-foreground max-w-3xl">
            Describe your AI workflow in natural language, and our system will generate a ready-to-use workflow for you.
            You can then customize and refine it to exactly match your needs.
          </p>
        </div>
        
        <Separator />
        
        <WorkflowGenerator />
        
        <div className="mt-8 space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">1. Describe Your Workflow</h3>
              <p className="text-sm text-muted-foreground">
                Write a clear description of what you want your workflow to accomplish.
                The more details you provide, the better the results.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">2. Generate</h3>
              <p className="text-sm text-muted-foreground">
                Our AI will create a workflow structure with the appropriate nodes and connections
                to accomplish your described task.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">3. Customize</h3>
              <p className="text-sm text-muted-foreground">
                You'll be taken to the workflow editor where you can adjust, enhance, or
                modify the generated workflow to suit your exact needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}