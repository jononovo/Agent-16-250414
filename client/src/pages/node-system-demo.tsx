/**
 * Node System Demo Page
 * 
 * This page demonstrates the new node system architecture.
 * It shows the available nodes categorized by type.
 */
import React from 'react';
import { getNodeCategories, getNodesByCategory } from '../nodes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeRegistryEntry } from '../lib/types';

export default function NodeSystemDemo() {
  // Get all node categories and nodes grouped by category
  const categories = getNodeCategories();
  const nodesByCategory = getNodesByCategory();

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Node System Architecture</h1>
        <p className="text-muted-foreground">
          Explore the available node types in the new folder-based workflow system.
        </p>
      </div>

      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodesByCategory[category].map((node: NodeRegistryEntry) => (
                <Card key={node.type} className="border-l-4" style={{ borderLeftColor: node.metadata.color || '#888' }}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {node.metadata.icon && <div className="text-muted-foreground">{node.metadata.icon}</div>}
                        <CardTitle className="text-lg">{node.metadata.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {node.metadata.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{node.metadata.description}</p>
                    
                    {node.metadata.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {node.metadata.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Inputs</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {Object.keys(node.schema.inputs || {}).length > 0 ? (
                            Object.entries(node.schema.inputs).map(([name, info]: [string, any]) => (
                              <div key={name} className="flex flex-col">
                                <span className="font-mono">{name}</span>
                                <span className="text-xs opacity-70">{info.type}</span>
                              </div>
                            ))
                          ) : (
                            <p>No inputs defined</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Outputs</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {Object.keys(node.schema.outputs || {}).length > 0 ? (
                            Object.entries(node.schema.outputs).map(([name, info]: [string, any]) => (
                              <div key={name} className="flex flex-col">
                                <span className="font-mono">{name}</span>
                                <span className="text-xs opacity-70">{info.type}</span>
                              </div>
                            ))
                          ) : (
                            <p>No outputs defined</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}