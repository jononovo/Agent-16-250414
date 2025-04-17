/**
 * CSV Processor Node UI Component
 * 
 * This file contains the React component used to render the CSV processor node
 * in the workflow editor, with a Simple AI Dev inspired UI.
 */

import React, { useState, useEffect } from 'react';
import { Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LabeledHandle } from '@/components/ui/labeled-handle';
import { EnhancedNode } from '@/components/nodes/common/EnhancedNode';

// Default data for the node
export const defaultData = {
  hasHeader: true,
  delimiter: ',',
  trimValues: true,
  columnsToInclude: '',
  filterColumn: '',
  filterValue: '',
  filterOperation: 'equals',
  label: 'CSV Processor',
  preview: null
};

// Filter operations
const filterOperations = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' }
];

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state
  const [hasHeader, setHasHeader] = useState<boolean>(
    nodeData.hasHeader ?? defaultData.hasHeader
  );
  
  const [delimiter, setDelimiter] = useState<string>(
    nodeData.delimiter || defaultData.delimiter
  );
  
  const [trimValues, setTrimValues] = useState<boolean>(
    nodeData.trimValues ?? defaultData.trimValues
  );
  
  const [columnsToInclude, setColumnsToInclude] = useState<string>(
    nodeData.columnsToInclude || defaultData.columnsToInclude
  );
  
  const [filterColumn, setFilterColumn] = useState<string>(
    nodeData.filterColumn || defaultData.filterColumn
  );
  
  const [filterValue, setFilterValue] = useState<string>(
    nodeData.filterValue || defaultData.filterValue
  );
  
  const [filterOperation, setFilterOperation] = useState<string>(
    nodeData.filterOperation || defaultData.filterOperation
  );
  
  const [activeTab, setActiveTab] = useState<string>('general');
  
  // Preview state (would be populated from processed data)
  const [preview, setPreview] = useState<any>(nodeData.preview);
  
  // Update local state when node data changes
  useEffect(() => {
    if (nodeData.hasHeader !== undefined) setHasHeader(nodeData.hasHeader);
    if (nodeData.delimiter !== undefined) setDelimiter(nodeData.delimiter);
    if (nodeData.trimValues !== undefined) setTrimValues(nodeData.trimValues);
    if (nodeData.columnsToInclude !== undefined) setColumnsToInclude(nodeData.columnsToInclude);
    if (nodeData.filterColumn !== undefined) setFilterColumn(nodeData.filterColumn);
    if (nodeData.filterValue !== undefined) setFilterValue(nodeData.filterValue);
    if (nodeData.filterOperation !== undefined) setFilterOperation(nodeData.filterOperation);
    if (nodeData.preview !== undefined) setPreview(nodeData.preview);
  }, [nodeData]);
  
  // Callback for updating node data
  const updateNodeData = (updates: Record<string, any>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        ...updates
      });
    }
  };
  
  // Handler for header toggle
  const handleHeaderToggle = (checked: boolean) => {
    setHasHeader(checked);
    updateNodeData({ hasHeader: checked });
  };
  
  // Handler for trim values toggle
  const handleTrimToggle = (checked: boolean) => {
    setTrimValues(checked);
    updateNodeData({ trimValues: checked });
  };
  
  // Handler for delimiter change
  const handleDelimiterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDelimiter(newValue);
    updateNodeData({ delimiter: newValue });
  };
  
  // Handler for columns to include change
  const handleColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setColumnsToInclude(newValue);
    updateNodeData({ columnsToInclude: newValue });
  };
  
  // Handler for filter column change
  const handleFilterColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilterColumn(newValue);
    updateNodeData({ filterColumn: newValue });
  };
  
  // Handler for filter value change
  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilterValue(newValue);
    updateNodeData({ filterValue: newValue });
  };
  
  // Handler for filter operation change
  const handleFilterOperationChange = (newValue: string) => {
    setFilterOperation(newValue);
    updateNodeData({ filterOperation: newValue });
  };
  
  // Enhanced node data with settings
  const enhancedData = {
    ...data,
    icon: <Table className="h-4 w-4 text-indigo-600" />,
    description: "Processes CSV data with column mapping and filtering",
    category: "data",
    settings: {
      title: "CSV Processor Settings",
      fields: [
        {
          key: "label",
          label: "Node Label",
          type: "text" as const,
          description: "Display name for this node"
        },
        {
          key: "hasHeader",
          label: "Has Header Row",
          type: "checkbox" as const,
          description: "Whether CSV has column headers in the first row"
        },
        {
          key: "delimiter",
          label: "Delimiter",
          type: "text" as const,
          description: "Character used to separate values (e.g., comma, tab, semicolon)"
        },
        {
          key: "trimValues",
          label: "Trim Values",
          type: "checkbox" as const,
          description: "Remove whitespace from beginning and end of values"
        },
        {
          key: "columnsToInclude",
          label: "Columns to Include",
          type: "text" as const,
          description: "Comma-separated list of columns to include (empty = all)"
        },
        {
          key: "filterColumn",
          label: "Filter Column",
          type: "text" as const,
          description: "Column name to filter on"
        },
        {
          key: "filterValue",
          label: "Filter Value",
          type: "text" as const,
          description: "Value to filter by"
        },
        {
          key: "filterOperation",
          label: "Filter Operation",
          type: "select" as const,
          description: "Operation to use when filtering rows",
          options: filterOperations
        }
      ]
    }
  };
  
  // Node content
  const nodeContent = (
    <>
      {/* Status badges */}
      <div className="flex justify-end gap-1 mb-2">
        {columnsToInclude && (
          <Badge variant="outline" className="text-xs">
            {columnsToInclude.split(',').filter(c => c.trim()).length} cols
          </Badge>
        )}
        
        {filterColumn && filterValue && (
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
            Filter: {filterOperation}
          </Badge>
        )}
      </div>
      
      {/* Configuration section */}
      <div className="flex flex-col gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-2">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="filter" className="text-xs">Filter</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="pt-1">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="has-header">
                  Has Header Row
                </Label>
                <Switch
                  id="has-header"
                  checked={hasHeader}
                  onCheckedChange={handleHeaderToggle}
                  className="scale-75"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs cursor-pointer" htmlFor="trim-values">
                  Trim Whitespace
                </Label>
                <Switch
                  id="trim-values"
                  checked={trimValues}
                  onCheckedChange={handleTrimToggle}
                  className="scale-75"
                />
              </div>
              
              <div className="mt-1">
                <Label className="text-xs mb-1 block" htmlFor="delimiter">
                  Delimiter
                </Label>
                <Input
                  id="delimiter"
                  value={delimiter}
                  onChange={handleDelimiterChange}
                  className="h-8 text-sm"
                  placeholder=","
                />
              </div>
              
              <div className="mt-1">
                <Label className="text-xs mb-1 block" htmlFor="columns-to-include">
                  Columns to Include (comma separated)
                </Label>
                <Input
                  id="columns-to-include"
                  value={columnsToInclude}
                  onChange={handleColumnsChange}
                  className="h-8 text-sm"
                  placeholder="col1,col2,col3"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Leave empty to include all columns
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Filter Tab */}
          <TabsContent value="filter" className="pt-1">
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs mb-1 block" htmlFor="filter-column">
                  Filter Column
                </Label>
                <Input
                  id="filter-column"
                  value={filterColumn}
                  onChange={handleFilterColumnChange}
                  className="h-8 text-sm"
                  placeholder="Column name"
                />
              </div>
              
              <div>
                <Label className="text-xs mb-1 block" htmlFor="filter-operation">
                  Filter Operation
                </Label>
                <Select value={filterOperation} onValueChange={handleFilterOperationChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOperations.map(op => (
                      <SelectItem key={op.value} value={op.value} className="text-sm">
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs mb-1 block" htmlFor="filter-value">
                  Filter Value
                </Label>
                <Input
                  id="filter-value"
                  value={filterValue}
                  onChange={handleFilterValueChange}
                  className="h-8 text-sm"
                  placeholder="Value to filter by"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Preview section - would show a small sample of data if available */}
        {preview && (
          <div className="mt-2">
            <Separator className="my-2" />
            <div className="text-xs font-medium mb-1">Preview</div>
            <div className="text-xs text-muted-foreground">
              {preview.rowCount} rows, {preview.columnCount} columns
            </div>
          </div>
        )}
      </div>
      
      {/* Input Handles - Reduced to just 1 */}
      <LabeledHandle
        type="target"
        position={Position.Left}
        id="csvInput"
        label="CSV Input"
        isConnectable={isConnectable}
        handlePosition={0.5}
        bgColor="bg-blue-500"
      />
      
      {/* Output Handles - Reduced to just 2 */}
      <LabeledHandle
        type="source"
        position={Position.Right}
        id="data"
        label="Processed Data"
        isConnectable={isConnectable}
        handlePosition={0.33}
        bgColor="bg-green-500"
      />
      
      <LabeledHandle
        type="source"
        position={Position.Right}
        id="metadata"
        label="Metadata"
        isConnectable={isConnectable}
        handlePosition={0.66}
        bgColor="bg-yellow-500"
      />
    </>
  );
  
  // Return the enhanced node with our content
  return (
    <EnhancedNode
      id={data.id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </EnhancedNode>
  );
};

export default component;