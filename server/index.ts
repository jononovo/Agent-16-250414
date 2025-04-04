import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from 'express-session';
import { sessionOptions } from './session';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './database';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize session middleware
app.use(session(sessionOptions));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let server;
  
  try {
    // Create database schema if needed
    if (process.env.DATABASE_URL) {
      log('Creating database schema if needed...');
      
      try {
        // Create tables based on the schema
        const result = await db.execute(/* sql */`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS agents (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            icon TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            user_id INTEGER,
            configuration JSONB DEFAULT '{}'::jsonb
          );
          
          CREATE TABLE IF NOT EXISTS workflows (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            icon TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            user_id INTEGER,
            agent_id INTEGER,
            flow_data JSONB DEFAULT '{}'::jsonb
          );
          
          CREATE TABLE IF NOT EXISTS nodes (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            icon TEXT,
            category TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            user_id INTEGER,
            configuration JSONB DEFAULT '{}'::jsonb
          );
          
          CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            agent_id INTEGER NOT NULL,
            workflow_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            input JSONB DEFAULT '{}'::jsonb,
            output JSONB DEFAULT '{}'::jsonb,
            error TEXT,
            started_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            execution_path JSONB DEFAULT '{}'::jsonb
          );
          
          CREATE TABLE IF NOT EXISTS session (
            sid VARCHAR NOT NULL,
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL,
            CONSTRAINT session_pkey PRIMARY KEY (sid)
          )
        `);
        
        log('Database schema created successfully');
      } catch (dbError) {
        log(`Warning: Database schema creation error: ${dbError}`);
        log('Continuing with application startup despite database error');
      }
    }
    
    server = await registerRoutes(app);
    
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      res.status(status).json({ message });
      console.error('Error:', err);
    });
    
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Error initializing application: ${error}`);
    
    // Create a simple HTTP server to make the error visible
    const http = require('http');
    const simpleServer = http.createServer((req: any, res: any) => {
      if (req.url.startsWith('/api')) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database connection error. Please try again later.' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head>
              <title>Application Error</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 30px; max-width: 800px; margin: 0 auto; }
                .error-container { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                h1 { color: #721c24; }
                .retry-btn { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="error-container">
                <h1>Application Error</h1>
                <p>We're experiencing some technical difficulties. The server encountered an issue while connecting to the database.</p>
                <p>Please try again in a few moments.</p>
              </div>
              <button class="retry-btn" onclick="window.location.reload()">Retry</button>
            </body>
          </html>
        `);
      }
    });
    
    simpleServer.listen(5000, '0.0.0.0', () => {
      log('Error recovery server started on port 5000');
    });
  }
})();
