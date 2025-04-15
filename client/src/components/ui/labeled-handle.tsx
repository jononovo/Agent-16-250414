/**
 * Labeled Handle Component
 * 
 * A custom ReactFlow handle that includes a label for better usability
 * Labels are positioned completely outside the node
 */
import React from 'react';
import { Handle, Position } from 'reactflow';

interface LabeledHandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  label: string;
  isConnectable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  handlePosition: number;
  bgColor?: string;
}

export const LabeledHandle: React.FC<LabeledHandleProps> = ({
  type,
  position,
  id,
  label,
  isConnectable = true,
  className = '',
  style = {},
  handlePosition,
  bgColor = 'bg-blue-500'
}) => {
  const isRight = position === Position.Right;
  
  return (
    <div 
      className="absolute"
      style={{ top: `${handlePosition * 100}%`, transform: 'translateY(-50%)', 
               [isRight ? 'right' : 'left']: '-1px' }}
    >
      {/* Handle */}
      <Handle
        type={type}
        position={position}
        id={id}
        isConnectable={isConnectable}
        className={`w-2 h-6 rounded-sm ${bgColor} ${isRight ? '-mr-0.5' : '-ml-0.5'} ${className}`}
        style={style}
      />
      
      {/* Label positioned outside the node */}
      <div 
        className={`absolute text-[8px] ${isRight ? 'right-3' : 'left-3'} text-muted-foreground px-1 py-0.5 bg-background shadow-sm rounded-full select-none whitespace-nowrap border border-muted/40`}
        style={{ top: '-1px', transform: 'translateY(-100%)' }}
      >
        {label}
      </div>
    </div>
  );
};

export default LabeledHandle;