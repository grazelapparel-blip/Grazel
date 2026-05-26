# Quick Start: Deploy to Vercel + Railway

## 5-Minute Setup

### Step 1: Prepare Local Environment (5 min)
```powershell
# 1. Create .env.local (copy from .env.example)
Copy-Item .env.example .env.local

# 2. Edit .env.local with your actual credentials
notepad .env.local
```

Fill in:
```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/grazel
NODE_ENV=development
PORT=5000
```

### Step 2: Push to GitHub (5 min)
```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grazel.git
git push -u origin main
```

### Step 3: Deploy Frontend to Vercel (10 min)
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"
5. Settings auto-fill (Vite detected)
6. Go to **Settings → Environment Variables**
7. Add environment variable:
   ```
   VITE_API_URL = https://your-railway-url.up.railway.app
   ```
8. Click "Deploy"
9. Wait for deployment ✅

**Your frontend URL**: `https://grazel-xxxxx.vercel.app`

### Step 4: Deploy Backend to Railway (10 min)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Click "Create Project"
7. Click on the service that was created
8. Go to **Variables** tab
9. Add environment variables:
   ```
   MONGODB_URI = your_mongodb_uri
   PORT = 5000
   NODE_ENV = production

   ```
10. Click "Deploy"
11. Wait for deployment ✅

**Your backend URL**: Check Railway dashboard (in the domains section)

### Step 5: Connect Frontend to Backend (5 min)
1. Copy your backend URL from Railway
2. Go to Vercel project settings
3. Add environment variable:
   ```
   VITE_API_URL = https://your-railway-url.up.railway.app
   ```
4. Go to Deployments
5. Click the three dots on latest deployment
6. Click "Redeploy"
7. Wait for deployment ✅

### Step 6: Test Everything (5 min)
```powershell
# Test frontend loads
Start-Process https://grazel-xxxxx.vercel.app

# Test backend health
curl https://your-railway-url/api/health

# Check browser console for errors
```

---

## Troubleshooting

### Frontend shows blank page
- Check Vercel logs: Dashboard → Deployments → Latest → Logs
- Ensure environment variables are set
- Clear browser cache (Ctrl+Shift+Delete)

### API calls fail
- Verify `VITE_API_URL` is set in Vercel
- Check backend URL is accessible
- Add frontend domain to CORS in `server/server.js`

### MongoDB connection error
- Verify `MONGODB_URI` is correct
- Check IP whitelist on MongoDB Atlas
- For Railway: Add Railway's IP to MongoDB Atlas whitelist

### Database not populated
- This is normal! Your database starts empty
- Add products via admin panel or API
- Default admin: `admin@grazel.com` / `admin123`

---

## Next Steps

### After Live Deployment
1. **Change admin password** immediately
2. **Set up custom domain** (optional)
3. **Configure email service** for order confirmations
4. **Set up analytics** (Vercel Analytics)
5. **Monitor logs** regularly

### Resources
- 📚 [Vercel Docs](https://vercel.com/docs)
- 🚂 [Railway Docs](https://docs.railway.app)
- 🍃 [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- 📙 [Supabase Docs](https://supabase.com/docs)

---

## Environment Variables Checklist

| Service | Variable | Status |
|---------|----------|--------|
| Vercel (Frontend) | VITE_API_URL | ⬜ |
| Railway (Backend) | MONGODB_URI | ⬜ |
| Railway (Backend) | PORT | ✅ (5000) |
| Railway (Backend) | NODE_ENV | ✅ (production) |

---

**Estimated Time**: 30 minutes total

**Cost**: Free tier for both Vercel and Railway (sufficient for testing/small scale)

Good luck! 🚀
