'use client';

import { useState } from 'react';
import { apiEndpoints, getAllCategories, ApiEndpoint } from '@/lib/apiRegistry';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code } from 'lucide-react';

const methodColors = {
  GET: 'bg-blue-100 text-blue-800 border-blue-200',
  POST: 'bg-green-100 text-green-800 border-green-200',
  PUT: 'bg-amber-100 text-amber-800 border-amber-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  ALL: 'bg-gray-100 text-gray-800 border-gray-200',
};

function MethodBadge({ method }: { method: ApiEndpoint['method'] }) {
  const colorClass = methodColors[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  return (
    <Badge variant="outline" className={`font-mono ${colorClass}`}>
      {method}
    </Badge>
  );
}

function ApiEndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <TableRow key={`${endpoint.method}-${endpoint.path}`}>
      <TableCell className="font-medium">
        <MethodBadge method={endpoint.method} />
      </TableCell>
      <TableCell className="font-mono">{endpoint.path}</TableCell>
      <TableCell className="max-w-md">{endpoint.description}</TableCell>
      <TableCell>
        {endpoint.internal && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Internal
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-2">
        <MethodBadge method={endpoint.method} />
        <span className="font-mono text-sm">{endpoint.path}</span>
      </div>
      
      <div>
        <h4 className="font-medium mb-1">Description</h4>
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
      </div>
      
      {(endpoint.pathParams && endpoint.pathParams.length > 0) && (
        <div>
          <h4 className="font-medium mb-1">Path Parameters</h4>
          <div className="bg-muted rounded-md p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoint.pathParams.map(param => (
                  <TableRow key={param.name}>
                    <TableCell className="font-mono text-xs">{param.name}</TableCell>
                    <TableCell className="text-xs">{param.type}</TableCell>
                    <TableCell className="text-xs">{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {(endpoint.queryParams && endpoint.queryParams.length > 0) && (
        <div>
          <h4 className="font-medium mb-1">Query Parameters</h4>
          <div className="bg-muted rounded-md p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoint.queryParams.map(param => (
                  <TableRow key={param.name}>
                    <TableCell className="font-mono text-xs">{param.name}</TableCell>
                    <TableCell className="text-xs">{param.type}</TableCell>
                    <TableCell className="text-xs">{param.required ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-xs">{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {endpoint.requestFormat && (
        <div>
          <h4 className="font-medium mb-1">Request Format</h4>
          <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
            <code>{endpoint.requestFormat}</code>
          </pre>
        </div>
      )}
      
      {endpoint.responseFormat && (
        <div>
          <h4 className="font-medium mb-1">Response Format</h4>
          <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
            <code>{endpoint.responseFormat}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ApiRegistryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const categories = getAllCategories();
  
  // Filter endpoints based on search term
  const filteredEndpoints = searchTerm 
    ? apiEndpoints.filter(endpoint => 
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : apiEndpoints;
  
  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Code className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">API Registry</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        This registry documents the available API endpoints in the system, their parameters, and response formats.
        Use this documentation as a reference when developing applications that interact with the API.
      </p>
      
      <div className="mb-6">
        <Input
          placeholder="Search endpoints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Endpoints</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All API Endpoints</CardTitle>
              <CardDescription>
                Complete list of available API endpoints in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableCaption>A list of all API endpoints.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEndpoints.map(endpoint => (
                      <ApiEndpointRow key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Details</CardTitle>
              <CardDescription>
                Detailed documentation for each API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredEndpoints.map((endpoint, index) => (
                  <AccordionItem key={`${endpoint.method}-${endpoint.path}`} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <MethodBadge method={endpoint.method} />
                        <span className="font-mono text-sm">{endpoint.path}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EndpointDetail endpoint={endpoint} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{category.charAt(0).toUpperCase() + category.slice(1)} API Endpoints</CardTitle>
                <CardDescription>
                  API endpoints related to {category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEndpoints
                      .filter(endpoint => endpoint.category === category)
                      .map(endpoint => (
                        <ApiEndpointRow key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Details</CardTitle>
                <CardDescription>
                  Detailed documentation for {category} endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredEndpoints
                    .filter(endpoint => endpoint.category === category)
                    .map((endpoint, index) => (
                      <AccordionItem key={`${endpoint.method}-${endpoint.path}`} value={`item-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2 text-left">
                            <MethodBadge method={endpoint.method} />
                            <span className="font-mono text-sm">{endpoint.path}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <EndpointDetail endpoint={endpoint} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}