/**
 * Database module stub
 * 
 * This file provides a stub for the database module to maintain compatibility
 * with any code that might still be importing from it.
 * This is just a transitional file - in a real implementation, we would remove
 * all references to this module and delete it.
 */

// Stub object to avoid breaking imports
export const db = {
  execute: async (query: string) => {
    console.warn('Warning: Attempt to execute SQL through db.execute() but PostgreSQL is no longer used');
    return null;
  }
};