import app from '../server/server.js';

export default async function handler(req, res) {
  try {
    // For serverless, we need to ensure the request is properly routed
    // Vercel passes the full URL path including /api prefix
    let url = req.url || '';
    
    // Normalize URL for Express
    if (!url.startsWith('/api')) {
      url = `/api${url.startsWith('/') ? url : '/' + url}`;
    }
    
    req.url = url;
    
    console.log(`[Vercel Handler] ${req.method} ${req.url}`);
    
    // Invoke Express app
    app(req, res);
  } catch (err) {
    console.error('[Handler Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
      });
    }
  }
}
