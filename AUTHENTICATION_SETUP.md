# Grazel Authentication Setup Guide

## ✅ Current Status

### Working ✅
- **Email/Password Authentication**
- **Admin Default User:** `admin@grazel.com` / `admin123`
- **JWT Token Management**
- **In-Memory User Storage** (for development)

### Not Yet Configured ⚠️
- **Google OAuth** (requires setup)
- **Supabase Integration** (optional, for production)

---

## 🚀 Quick Start (Development)

### 1. **Start the Server**
```bash
# Terminal 1: Start backend server
npm run dev:server
# or with bun
bun run dev:server
```

The server will start on **http://localhost:3001**

### 2. **Start the Frontend**
```bash
# Terminal 2: Start Vite dev server
npm run dev
# or with bun
bun run dev
```

The frontend will start on **http://localhost:8080**

### 3. **Login with Admin Account**
- **Email:** `admin@grazel.com`
- **Password:** `admin123`
- **Role:** Admin (full access to all features)

---

## 🔐 Authentication Endpoints

### Login (Email/Password)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@grazel.com",
  "password": "admin123"
}

# Response (200 OK)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin_001",
    "email": "admin@grazel.com",
    "name": "Grazel Admin",
    "role": "admin"
  }
}
```

### Verify Token
```bash
GET /api/auth/me
Authorization: Bearer {token}

# Response (200 OK)
{
  "id": "admin_001",
  "email": "admin@grazel.com",
  "name": "Grazel Admin",
  "role": "admin"
}
```

### Register New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "user"  // optional, defaults to 'user'
}

# Response (201 Created)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1719999999999",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

## 🔧 Port Configuration

Your application uses these ports:

| Service | Port | URL |
|---------|------|-----|
| Vite Frontend Dev Server | 8080 | http://localhost:8080 |
| Express Backend API Server | 3001 | http://localhost:3001 |
| Vite API Proxy | (same) | /api → http://localhost:3001 |

**Important:** The Vite config proxies `/api/*` requests to `http://localhost:3001`

---

## 🔑 Configuring Google Sign-In (Optional)

### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Click **Create OAuth 2.0 Client ID**
5. Select **Web application**
6. Add Authorized Origins:
   - `http://localhost:8080`
   - `http://localhost:3001`
7. Add Authorized Redirect URIs:
   - `http://localhost:3001/api/auth/google`
   - `http://localhost:8080/auth/callback`
8. Copy your **Client ID**

### Step 2: Update .env
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

### Step 3: Restart the App
```bash
# Stop both servers (Ctrl+C)
# Restart both
npm run dev:server
npm run dev
```

### Step 4: Test Google Sign-In
- Reload http://localhost:8080
- Click "Sign in with Google"
- Complete the OAuth flow

---

## 🗄️ User Storage

### Development (Current)
- **Storage:** In-memory Map (server memory)
- **Persistence:** Lost on server restart
- **Use:** Quick development & testing
- **Default User:** `admin@grazel.com` / `admin123` (auto-created)

### Production (Optional)
- **Storage:** Supabase PostgreSQL
- **Persistence:** Database (permanent)
- **Use:** Production deployment
- **Setup:** Configure Supabase credentials in `.env`

---

## 📦 Environment Variables

### Required (Already Configured)
```env
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=grazel_jwt_secret_key_change_in_production_12345

# Supabase (Optional)
VITE_SUPABASE_URL=https://xixnewbfptrtzzevfouy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional (For Google OAuth)
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

---

## 🧪 Testing Authentication

### Test as Admin
```
Email: admin@grazel.com
Password: admin123
Expected: Dashboard with admin features
```

### Test as Regular User
```
Email: user@example.com
Password: password123
Expected: Regular user features (no admin panel)
```

### Create Test User
```bash
# Make a POST request to /api/auth/register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## ⚠️ Troubleshooting

### Issue: 401 Unauthorized when logging in
**Cause:** Server not running or wrong port
```bash
# Check if server is running on 3001
curl http://localhost:3001/api/health

# If error, restart server:
npm run dev:server
```

### Issue: "The given client ID is not found" (Google)
**Cause:** Google OAuth not configured or invalid Client ID
**Solution:** 
- Create Google OAuth app (see steps above)
- Update `VITE_GOOGLE_CLIENT_ID` in `.env`
- Restart the app

### Issue: CORS errors
**Cause:** API requests to wrong URL or port
**Solution:**
- Check vite.config.ts proxy: should be `http://localhost:3001`
- Verify server is running on port 3001
- Clear browser cache

### Issue: Token expires or "Unauthorized"
**Cause:** JWT token expired or invalid
**Solution:**
- Clear localStorage: `localStorage.clear()`
- Log in again
- Token expires in 7 days (adjustable in server.js)

---

## 🚀 Production Deployment

### Before deploying:
1. ✅ Change `JWT_SECRET` in `.env` to a strong random string
2. ✅ Set `NODE_ENV=production`
3. ✅ Configure Supabase for user persistence
4. ✅ Set up Google OAuth with production URLs
5. ✅ Use HTTPS (not HTTP)
6. ✅ Add domain to Google OAuth authorized origins

---

## 📚 Related Files

- **Frontend Auth:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx)
- **Auth Page:** [src/pages/AuthPage.tsx](src/pages/AuthPage.tsx)
- **Backend Auth:** [server/server.js](server/server.js) (lines 137-250)
- **Config:** [vite.config.ts](vite.config.ts)
- **Environment:** [.env](.env)

---

## 💡 Next Steps

1. **✅ Test Email/Password Login** (works now)
2. **📋 Set up Google OAuth** (optional but recommended)
3. **🗄️ Migrate to Supabase** (for production)
4. **🔒 Implement 2FA** (optional, for security)
5. **🎯 Add Social Logins** (Facebook, GitHub, etc.)

---

**Last Updated:** 2026-06-21  
**Status:** ✅ Ready for Development & Testing
