import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Node } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import NodeItem from './NodeItem';

const NODE_TYPES = [
  { id: 'trigger', name: 'Triggers', description: 'Start a workflow' },
  { id: 'processor', name: 'Processors', description: 'Process data' },
  { id: 'output', name: 'Outputs', description: 'Send results' },
  { id: 'custom', name: 'Custom', description: 'Your custom nodes' },
  { id: 'input', name: 'Input', description: 'Collect user input' },
  { id: 'ai', name: 'AI Models', description: 'Generate content with AI' },
  { id: 'visualization', name: 'Visualization', description: 'Display results visually' },
  { id: 'routing', name: 'Routing', description: 'Control the flow logic' },
];

const NodesPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: nodes, isLoading } = useQuery({
    queryKey: ['/api/nodes'],
    queryFn: async () => {
      const res = await fetch('/api/nodes');
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return res.json() as Promise<Node[]>;
    }
  });
  
  const filteredNodes = nodes?.filter(node => {
    // First apply type filter if not "all"
    if (activeTab !== 'all' && node.type !== activeTab) {
      return false;
    }
    
    // Then apply search filter if there's a query
    if (searchQuery) {
      return (
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return true;
  });

  // Group nodes by type
  const groupedNodes = filteredNodes?.reduce((acc, node) => {
    const type = node.type || 'custom';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="trigger" className="flex-1">Triggers</TabsTrigger>
          <TabsTrigger value="processor" className="flex-1">Process</TabsTrigger>
          <TabsTrigger value="output" className="flex-1">Output</TabsTrigger>
        </TabsList>
      </Tabs>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading nodes...
          </div>
        ) : (
          <>
            {NODE_TYPES.map((type) => {
              const typeNodes = groupedNodes?.[type.id] || [];
              
              if (activeTab !== 'all' && activeTab !== type.id) {
                return null;
              }
              
              if (typeNodes.length === 0 && activeTab === 'all') {
                return null;
              }
              
              return (
                <Accordion
                  key={type.id}
                  type="single"
                  collapsible
                  defaultValue={type.id}
                  className="mb-4"
                >
                  <AccordionItem value={type.id} className="border-0">
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      {type.name} ({typeNodes.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {typeNodes.map((node) => (
                          <NodeItem 
                            key={node.id} 
                            node={{
                              ...node,
                              data: {
                                label: node.name,
                                description: node.description || '',
                                icon: node.icon || 'circle'
                              }
                            }} 
                          />
                        ))}
                        
                        {typeNodes.length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No {type.name.toLowerCase()} found
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
            
            {filteredNodes?.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No nodes found for "{searchQuery}"
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
};

export default NodesPanel;