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
      
      {/* Label positioned higher above the handle with subtle background */}
      <div 
        className={`absolute text-[8px] text-muted-foreground px-0.5 py-0.5 bg-background/80 z-10 select-none whitespace-nowrap rounded-sm`}
        style={{ 
          top: '-16px',
          [isRight ? 'right' : 'left']: '0px',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default LabeledHandle;