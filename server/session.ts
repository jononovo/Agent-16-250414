import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { db } from './database';

// Create a PostgreSQL session store
const PgStore = pgSession(session);

// Define the session options
export const sessionOptions = {
  store: new PgStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    tableName: 'session',
    createTableIfMissing: true  // Automatically create the session table if missing
  }),
  secret: process.env.SESSION_SECRET || 'my-secret-key', // In production, use an environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};