/**
 * Database module - Replit Key-Value Database Implementation
 * 
 * This file provides a direct export of the Replit Database client
 * to be used across the application for data persistence that will
 * survive remixes.
 */

import Database from '@replit/database';

// Create a single database instance to be used throughout the application
export const db = new Database();

// Export a helper function to check if the database is available
export const checkDb = async (): Promise<boolean> => {
  try {
    // Quick check if the database is working by attempting to list keys
    await db.list();
    return true;
  } catch (error) {
    console.error('Error connecting to Replit Database:', error);
    return false;
  }
};
