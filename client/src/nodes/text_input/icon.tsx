/**
 * Text Input Node Icon Component
 */
import React from 'react';

export const TextInputIcon = () => {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M13 6H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-4.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16 3.5v10M13 6.5l3-3 3 3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TextInputIcon;