/**
 * Labeled Handle Component
 * 
 * A custom ReactFlow handle that includes a label for better usability
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
      className={`absolute flex items-center ${isRight ? 'right-0 justify-end' : 'left-0 justify-start'}`}
      style={{ top: `${handlePosition * 100}%`, transform: 'translateY(-50%)' }}
    >
      {!isRight && (
        <div className={`${isConnectable ? 'opacity-100' : 'opacity-50'}`}>
          <Handle
            type={type}
            position={position}
            id={id}
            isConnectable={isConnectable}
            className={`w-2 h-6 rounded-sm ${bgColor} -ml-0.5 ${className}`}
            style={style}
          />
        </div>
      )}
      
      <div 
        className={`text-xs ${isRight ? 'mr-3' : 'ml-3'} text-muted-foreground px-1 select-none`}
      >
        {label}
      </div>
      
      {isRight && (
        <div className={`${isConnectable ? 'opacity-100' : 'opacity-50'}`}>
          <Handle
            type={type}
            position={position}
            id={id}
            isConnectable={isConnectable}
            className={`w-2 h-6 rounded-sm ${bgColor} -mr-0.5 ${className}`}
            style={style}
          />
        </div>
      )}
    </div>
  );
};

export default LabeledHandle;