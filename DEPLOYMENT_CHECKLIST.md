# Vercel Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] `.env.local` is created and NOT committed (in `.gitignore`)
- [ ] All dependencies are in `package.json`
- [ ] Backend and frontend tested locally
- [ ] MongoDB Atlas account created with connection string
- [ ] Supabase project created with API keys

## Frontend Deployment (Vercel)
- [ ] GitHub repository created
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Build settings configured:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Environment variables added:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_API_URL` (after backend URL is ready)
- [ ] Frontend deployed successfully

## Backend Deployment (Railway/Render)
- [ ] Create Railway/Render account
- [ ] Connect GitHub repository
- [ ] Configure environment variables:
  - [ ] `MONGODB_URI`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `PORT` = 5000
  - [ ] `NODE_ENV` = production
- [ ] Set start command: `npm run server`
- [ ] Backend deployed successfully
- [ ] Backend URL obtained (e.g., `https://grazel-api.railway.app`)

## Post-Deployment Setup
- [ ] Update Frontend `VITE_API_URL` with backend URL
- [ ] Redeploy frontend to apply changes
- [ ] Test API health: `https://backend-url/api/health`
- [ ] Test product loading
- [ ] Test authentication flow
- [ ] Test cart functionality
- [ ] Test checkout process

## CORS Configuration
- [ ] Backend allows frontend domain in `cors()` config
- [ ] Frontend domain whitelisted in MongoDB Atlas (if using IP whitelist)

## Monitoring
- [ ] Set up email alerts for deployment failures
- [ ] Monitor error logs
- [ ] Check database connection status
- [ ] Test scheduled tasks (if any)

## Custom Domain (Optional)
- [ ] Domain purchased
- [ ] DNS records updated for frontend
- [ ] DNS records updated for backend (if separate domain)
- [ ] SSL certificates auto-renewed

## Security
- [ ] No sensitive data in `.env` files tracked in Git
- [ ] API keys rotated if leaked
- [ ] Rate limiting configured (if needed)
- [ ] Input validation on all endpoints

## Performance
- [ ] Frontend optimized (lazy loading, code splitting)
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] Caching configured (if needed)
