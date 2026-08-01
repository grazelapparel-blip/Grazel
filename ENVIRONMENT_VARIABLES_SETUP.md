# Vercel Environment Variables Setup Guide

## Overview
Environment variables are key-value pairs configured outside your source code that allow values to change based on the deployment environment (Production, Preview, Development).

**Important:** Any changes to environment variables only apply to **new deployments**, not previous ones.

## Required Environment Variables for Grazel

Add these variables to your Vercel Project Settings:

### 1. **Supabase Configuration** (Required)
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. **Authentication** (Required)
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. **Server Configuration** (Required)
```
NODE_ENV=production
PORT=3001
```

### 4. **Email Configuration** (Optional)
Choose one email service:

**Gmail Option:**
```
VITE_EMAIL_SERVICE=gmail
VITE_EMAIL_FROM=noreply@grazel.com
GMAIL_APP_PASSWORD=your-16-char-app-password
GMAIL_USER=your-email@gmail.com
```

**SendGrid Option:**
```
VITE_EMAIL_SERVICE=sendgrid
VITE_EMAIL_FROM=noreply@grazel.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Step-by-Step Setup

### Step 1: Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Grazel** project

### Step 2: Navigate to Environment Variables
1. Click **Settings** in the top navigation
2. Click **Environment Variables** in the left sidebar

### Step 3: Add Each Variable
For each environment variable:

1. Enter the **Name** (e.g., `VITE_SUPABASE_URL`)
2. Enter the **Value** (e.g., your actual Supabase URL)
3. Select **Environments**:
   - ✅ **Production** - for production deployments (main branch)
   - ✅ **Preview** - for preview deployments (other branches)
   - ✅ **Development** - for local development with `vercel dev`
4. Click **Save**

### Step 4: Redeploy After Adding Variables
After adding all environment variables:

1. Go to **Deployments** tab
2. Select the latest deployment
3. Click the three dots (**...**)
4. Select **Redeploy**

This ensures your new deployment uses the environment variables.

## Environment Types

### Production Environment
- Applied to deployments from the **main** branch
- Set using `git push` or `vercel --prod`
- Changes only apply to new deployments

### Preview Environment
- Applied to deployments from non-main branches
- Useful for testing different configurations
- Can override variables per-branch

### Development Environment
- Used locally with `vercel dev` or your local dev server
- Download variables with: `vercel env pull`
- Creates `.env` file in your project root

## Best Practices

1. **Keep Sensitive Data Secure**
   - Never commit `.env` files to git
   - Use Vercel's encrypted storage for secrets

2. **Organization**
   - Group related variables together
   - Use clear naming conventions (e.g., `VITE_` for frontend, `SUPABASE_` for backend)

3. **Limits**
   - Maximum 64 KB total per deployment
   - No single variable larger than 64 KB
   - Edge Functions limited to 5 KB per variable

4. **Version Control**
   - Keep `.env.example` in git (without secrets)
   - Add `.env*` to `.gitignore` (already done)

## Verification Checklist

After setting up environment variables:

- [ ] All required variables are added
- [ ] Variables are set for Production environment
- [ ] Redeploy has been triggered
- [ ] Check Vercel deployment logs for successful build
- [ ] Test your application in production

## Troubleshooting

### Variables Not Working
1. Check if deployment has been redeployed after adding variables
2. Verify variable names match exactly (case-sensitive)
3. Check build logs in Vercel dashboard

### Wrong Values Being Used
- Verify the correct environment is selected
- Make sure to redeploy after changes

### Build Fails Due to Missing Variables
- Check if all required variables are set
- Verify variable values are correct
- Check server logs for error messages

## Local Development Setup

To pull environment variables for local development:

```bash
vercel env pull
```

This creates a `.env` file with all Development environment variables.

Then start your local dev server:

```bash
npm run dev
```

Or with Vercel CLI:

```bash
vercel dev
```

---

**Last Updated:** 2026-08-01
**Status:** Ready to Configure
