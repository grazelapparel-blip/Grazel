# Vercel Deployment Guide for Grazel

## Overview
This guide covers deploying your full-stack application (React frontend + Express backend + MongoDB) to Vercel with optional backend separation.

## Architecture Options

### Option 1: Frontend on Vercel + Backend Elsewhere (Recommended for Beginners)
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to Railway, Render, or Heroku
- **Pros**: Simple, clear separation of concerns
- **Cons**: Might have CORS issues, two different platforms to manage

### Option 2: Full-Stack on Vercel (Advanced)
- Everything on Vercel using serverless functions
- **Pros**: Single platform, cheaper
- **Cons**: Requires backend restructuring

---

## Prerequisites
1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account** - Push your code to GitHub
3. **MongoDB Atlas Account** - For cloud database at [mongodb.com/cloud](https://mongodb.com/cloud)
4. **Environment Variables Ready**:
   - `MONGODB_URI` - MongoDB connection string
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key

---

## Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub
```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grazel.git
git push -u origin main
```

### 1.2 Create `.env.local` file (for local development)
Copy `.env.example` to `.env.local` and fill in your values:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/grazel
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### 1.3 Update Backend Configuration
Edit `server/server.js` to handle both development and production:
```javascript
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grazel';
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Your GitHub Repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"

### 2.2 Configure Build Settings
1. **Framework**: Select "Vite"
2. **Build Command**: `npm run build` (should be auto-detected)
3. **Output Directory**: `dist` (should be auto-detected)
4. **Install Command**: `npm install` or `bun install`

### 2.3 Add Environment Variables
In the Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add the following:
   - `VITE_SUPABASE_URL` → Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key

**Important**: Prefix with `VITE_` so they're accessible in the frontend

3. Click "Deploy"

---

## Step 3: Deploy Backend (Choose One Option)

### Option A: Deploy to Railway (Recommended)

#### 3A.1 Set Up Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your Grazel repository

#### 3A.2 Configure Environment Variables on Railway
1. In Railway dashboard, go to **Variables**
2. Add:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Click "Deploy"

#### 3A.3 Get Your Backend URL
After deployment, Railway provides a URL like: `https://grazel-production.up.railway.app`

---

### Option B: Deploy to Render.com

#### 3B.1 Set Up Render Service
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "Create" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `grazel-api`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Plan**: Free (or paid if needed)

#### 3B.2 Add Environment Variables
1. Go to **Environment**
2. Add all variables from `.env.example`

#### 3B.3 Deploy
Click "Create Web Service" and wait for deployment

---

### Option C: Deploy to Heroku (No Free Tier Anymore)

If you prefer Heroku, you'll need a paid plan. Similar process to Railway.

---

## Step 4: Update Frontend API Calls

After getting your backend URL (e.g., `https://grazel-api.railway.app`), update your Vite config:

### 4.1 Create Environment Configuration
Create `src/config/api.ts`:
```typescript
const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.railway.app' 
    : 'http://localhost:5000';

export default API_BASE_URL;
```

### 4.2 Update API Calls Throughout App
Replace all API calls:
```typescript
// Instead of: fetch('http://localhost:5000/api/products')
import API_BASE_URL from '@/config/api';
fetch(`${API_BASE_URL}/api/products`)
```

### 4.3 Update Vite Config Proxy
Modify `vite.config.ts`:
```typescript
export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // ... rest of config
}));
```

---

## Step 5: Configure CORS

### 5.1 Update Backend CORS
Edit `server/server.js`:
```javascript
const allowedOrigins = [
  'https://your-vercel-domain.vercel.app',
  'http://localhost:3000',
  'http://localhost:8080'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## Step 6: Connect Frontend to Backend

### 6.1 Update Vercel Environment Variables
1. Go to your Vercel project settings
2. Add `VITE_API_URL`:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

### 6.2 Redeploy Frontend
Push a new commit or manually redeploy:
```powershell
git add .
git commit -m "Update backend API URL"
git push origin main
```

---

## Step 7: Testing

### 7.1 Test Frontend
Visit your Vercel domain and check:
- ✅ App loads without errors
- ✅ Products load correctly
- ✅ Authentication works
- ✅ Cart operations function

### 7.2 Test Backend
```powershell
# Check API health
curl https://your-backend-url/api/health

# Should return: {"status":"active","database":"connected"}
```

### 7.3 Check Logs
- **Vercel Logs**: Dashboard → Deployments → Logs
- **Railway/Render Logs**: Check service dashboard

---

## Step 8: Custom Domain (Optional)

### 8.1 Frontend Custom Domain
1. Vercel Dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `grazel.com`)
3. Update DNS records as instructed

### 8.2 Backend Custom Domain
Similar process on Railway/Render dashboard

---

## Troubleshooting

### Issue: API Calls Return 404
**Solution**: Ensure backend API URL is correctly set in environment variables

### Issue: CORS Errors
**Solution**: Check `allowedOrigins` in backend includes your Vercel domain

### Issue: MongoDB Connection Failed
**Solution**: 
- Verify `MONGODB_URI` is correct
- Ensure IP whitelist on MongoDB Atlas includes your hosting provider's IPs

### Issue: Env Variables Not Loading
**Solution**: 
- Redeploy after adding env variables
- Check variable names (must match exactly)
- `VITE_` prefix required for frontend variables

---

## Environment Variables Reference

| Variable | Type | Example |
|----------|------|---------|
| `MONGODB_URI` | Backend | `mongodb+srv://user:pass@cluster.mongodb.net/grazel` |
| `SUPABASE_URL` | Backend | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Backend | `eyJxxx...` |
| `VITE_SUPABASE_URL` | Frontend | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | `eyJxxx...` |
| `VITE_API_URL` | Frontend | `https://grazel-api.railway.app` |

---

## Monitoring & Maintenance

### Vercel
- Check deployments: Dashboard → Deployments
- View logs: Click on deployment → Logs
- Monitor performance: Analytics tab

### Railway/Render
- Monitor resource usage
- Set up alerts for failed deployments
- Review error logs regularly

---

## Summary

Your deployment flow:
```
Local Development
    ↓
Push to GitHub
    ↓
Vercel (Frontend) + Railway (Backend)
    ↓
Connected via API URL
    ↓
Live Application!
```

Good luck! 🚀
