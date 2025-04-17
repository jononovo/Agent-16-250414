import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names, handles conditional classes, and optimizes Tailwind CSS classes
 * using clsx and tailwind-merge.
 * 
 * @param inputs - Class names, objects with conditional classes, or arrays of class names
 * @returns - Optimized string of class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}