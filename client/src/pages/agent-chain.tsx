import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentChainPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [coordinatorResponse, setCoordinatorResponse] = useState("");
  const [generatorResponse, setGeneratorResponse] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setCoordinatorResponse("");
    setGeneratorResponse("");
    
    try {
      const response = await fetch("/api/execute-agent-chain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to execute agent chain");
      }
      
      const data = await response.json();
      console.log("Agent chain response:", data);
      
      if (data.success) {
        // Handle coordinator response based on the new structure
        if (data.coordinatorResult && data.coordinatorResult.output) {
          setCoordinatorResponse(data.coordinatorResult.output);
        } else {
          setCoordinatorResponse("No response from Coordinator Agent");
        }
        
        // Handle generator response based on the new structure
        if (data.generatorResult && data.generatorResult.output) {
          setGeneratorResponse(data.generatorResult.output);
        } else {
          setGeneratorResponse("No response from Generator Agent");
        }
        
        toast({
          title: "Success",
          description: "Agent chain executed successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Agent chain execution failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error executing agent chain:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute agent chain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Agent Chain Testing</CardTitle>
            <CardDescription>
              Test the Coordinator-Generator agent chain by submitting a prompt below. 
              The Coordinator Agent will process your request and pass its output to the Generator Agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Your Prompt
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="I need to build an agent that..."
                  className="min-h-[120px] resize-y"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Execute Agent Chain"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {(coordinatorResponse || generatorResponse) && (
          <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
              <CardTitle>Agent Chain Results</CardTitle>
              <CardDescription>
                Results from the Coordinator and Generator agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="coordinator" className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="coordinator">Coordinator Response</TabsTrigger>
                  <TabsTrigger value="generator">Generator Response</TabsTrigger>
                </TabsList>
                
                <TabsContent value="coordinator" className="mt-2">
                  <Card className="border-0 shadow-none">
                    <CardContent className="pt-4">
                      <div className="rounded-md bg-muted p-4 whitespace-pre-wrap font-mono text-sm">
                        {coordinatorResponse || "No response from Coordinator Agent"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="generator" className="mt-2">
                  <Card className="border-0 shadow-none">
                    <CardContent className="pt-4">
                      <div className="rounded-md bg-muted p-4 whitespace-pre-wrap font-mono text-sm">
                        {generatorResponse || "No response from Generator Agent"}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setCoordinatorResponse("");
                setGeneratorResponse("");
              }}>
                Clear Results
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}