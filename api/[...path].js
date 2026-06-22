import app from '../server/server.js';

export default function handler(req, res) {
  // Vercel catch-all routes may omit the /api prefix — restore it for Express matching
  const url = req.url || '';
  const [pathname, query = ''] = url.split('?');
  if (!pathname.startsWith('/api')) {
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    req.url = `/api${normalized}${query ? `?${query}` : ''}`;
  }
  return app(req, res);
}
