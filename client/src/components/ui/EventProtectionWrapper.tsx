/**
 * EventProtectionWrapper Component
 * 
 * A utility component that protects against React's event system errors
 * when clicking on non-interactive elements or empty space.
 * 
 * This component should be used to wrap content in areas where users might
 * click on empty space, especially in drawers, sheets, and other overlay components.
 */

import React from 'react';

interface EventProtectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  preventPropagationOnEmptyClick?: boolean;
}

export const EventProtectionWrapper: React.FC<EventProtectionWrapperProps> = ({
  children,
  className = '',
  preventPropagationOnEmptyClick = true
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Only prevent propagation if clicking directly on this div (empty area)
    // and not on a child element (form control, button, etc.)
    if (preventPropagationOnEmptyClick && e.target === e.currentTarget) {
      e.stopPropagation();
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
};

export default EventProtectionWrapper;