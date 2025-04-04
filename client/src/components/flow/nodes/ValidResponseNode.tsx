import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NodeData } from '../NodeItem';
import DynamicIcon from '../DynamicIcon';

const ValidResponseNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <Card className={`w-64 transition-all duration-200 ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ background: '#111', color: '#fff', borderColor: '#333' }}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
            <DynamicIcon icon={data.icon || 'checkCheck'} />
          </div>
          <span className="font-medium text-sm truncate">{data.label || 'Valid Response'}</span>
        </div>
        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-[10px] font-normal border-zinc-700">Validator</Badge>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 text-xs text-zinc-400">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="validation-toggle" className="cursor-pointer">Enable validation</Label>
            <Switch 
              id="validation-toggle" 
              defaultChecked={data.validationEnabled !== false} 
              onCheckedChange={(checked) => {
                if (data.onChange) {
                  data.onChange({ ...data, validationEnabled: checked });
                }
              }}
            />
          </div>
          
          <div>
            <Label className="block mb-1">Validation Rules</Label>
            <Textarea 
              className="bg-zinc-900 border-zinc-700 text-zinc-300 min-h-[80px] text-xs font-mono"
              placeholder="Enter validation rules..."
              value={data.validationRules || "// If the content is not valid, you should return\n// false to trigger the invalid node branch\nreturn contentLength < 500;"}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (data.onChange) {
                  data.onChange({ ...data, validationRules: e.target.value });
                }
              }}
            />
          </div>
          
          <div className="flex justify-between items-center bg-zinc-800 p-2 rounded">
            <span className="text-zinc-300">If validation fails:</span>
            <Badge className="bg-red-900 text-red-300 text-[10px] border-none">Invalid Output</Badge>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-7 text-xs bg-zinc-800 text-zinc-300 border-zinc-700">
              <Lucide.Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900"
      />
      <Handle
        id="valid"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900 !-translate-x-8"
      />
      <Handle
        id="invalid"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-zinc-500 !bg-zinc-900 !translate-x-8"
      />
    </Card>
  );
};

export default ValidResponseNode;