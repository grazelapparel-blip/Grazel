import app from '../server/server.js';

export default function handler(req, res) {
  try {
    // Vercel routes /api/* to this catch-all handler
    // We need to ensure req.url has the /api prefix for Express routing
    
    let url = req.url || '';
    
    // Handle case where Vercel passes path without /api prefix
    if (url && !url.startsWith('/api')) {
      url = `/api${url.startsWith('/') ? url : '/' + url}`;
    }
    
    // Set the normalized URL
    req.url = url;
    
    console.log(`[API Catch-All] ${req.method} ${req.url}`);
    
    // Invoke the Express app
    app(req, res);
  } catch (err) {
    console.error('[API Catch-All Error]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
