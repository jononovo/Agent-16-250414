import * as Lucide from 'lucide-react';
import { Circle } from 'lucide-react';
import React from 'react';

// Helper type for icon components
type IconComponent = React.ComponentType<{ className?: string }>;

interface DynamicIconProps {
  icon?: string | IconComponent | null;
  className?: string;
}

const DynamicIcon = ({ icon, className = "h-4 w-4" }: DynamicIconProps) => {
  // If icon is a React component
  if (typeof icon === 'function') {
    const IconComponent = icon as IconComponent;
    return <IconComponent className={className} />;
  }
  
  // If icon is a string
  if (typeof icon === 'string') {
    const iconName = icon || 'circle';
    const IconComponent = (Lucide as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
    
    if (!IconComponent) {
      return <Circle className={className} />;
    }
    
    return <IconComponent className={className} />;
  }
  
  // Default
  return <Circle className={className} />;
};

export default DynamicIcon;