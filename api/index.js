import app from '../server/server.js';

export default function handler(req, res) {
  try {
    // Route all API requests to the Express app
    // Vercel will invoke this for /api and /api/*
    
    // Ensure the URL starts with /api for Express routing
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? req.url : '/' + req.url}`;
    }
    
    // Invoke the Express app
    app(req, res);
  } catch (err) {
    console.error('[API Handler] Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
