import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const [pathDetails, setPathDetails] = useState<{
    path: string;
    segments: string[];
    hash: string;
    search: string;
    href: string;
    routes: string[];
  }>({ 
    path: "", 
    segments: [],
    hash: "",
    search: "",
    href: "",
    routes: ["/", "/workflow-editor/new", "/workflow-editor/:id", "/agent/:id"]
  });

  useEffect(() => {
    // Get the current path and analyze it for debugging
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const hash = window.location.hash;
    const search = window.location.search;
    const href = window.location.href;
    
    console.log('NotFound page reached. Location:', location);
    console.log('Path:', path);
    console.log('Segments:', segments);
    console.log('Hash:', hash);
    console.log('Search:', search);
    console.log('Full URL:', href);
    
    setPathDetails({ 
      path, 
      segments, 
      hash, 
      search, 
      href,
      routes: ["/", "/workflow-editor/new", "/workflow-editor/:id", "/agent/:id"]
    });
  }, [location]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist or you may not have access to it.
          </p>
          
          <div className="mt-6 p-3 bg-gray-100 rounded-md text-xs text-gray-700 font-mono overflow-auto">
            <p><strong>Current Location:</strong> {location}</p>
            <p className="mt-1"><strong>Path:</strong> {pathDetails.path}</p>
            <p className="mt-1"><strong>Full URL:</strong> {pathDetails.href}</p>
            <p className="mt-1"><strong>Hash:</strong> {pathDetails.hash || "<none>"}</p>
            <p className="mt-1"><strong>Search:</strong> {pathDetails.search || "<none>"}</p>
            
            <p className="mt-2"><strong>Path Segments:</strong></p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {pathDetails.segments.map((segment, index) => (
                <li key={index}>{segment}</li>
              ))}
              {pathDetails.segments.length === 0 && (
                <li className="text-gray-500 italic">No segments</li>
              )}
            </ul>
            
            <p className="mt-2"><strong>Available Routes:</strong></p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {pathDetails.routes.map((route, index) => (
                <li key={index}>{route}</li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button 
            onClick={() => setLocation('/')}
          >
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
