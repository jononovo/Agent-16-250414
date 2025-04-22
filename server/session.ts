import session from 'express-session';
import memoryStore from 'memorystore';

// Create a memory store for sessions
const MemoryStore = memoryStore(session);

// Define the session options
export const sessionOptions = {
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'my-secret-key', // In production, use an environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};