# Vercel Deployment Guide - TechAssassin Frontend

## Issue: White Page on Vercel

If you're seeing a white page on Vercel, it's likely due to missing environment variables.

## Required Environment Variables

You need to set these environment variables in your Vercel project:

### 1. Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Select your TechAssassin project
3. Go to **Settings** → **Environment Variables**

### 2. Add These Variables

Add the following environment variables (one by one):

#### Backend API URL
```
Name: VITE_API_URL
Value: https://your-backend-url.onrender.com/api
```
**Note**: Replace `your-backend-url.onrender.com` with your actual Render backend URL

#### Supabase Configuration
```
Name: VITE_SUPABASE_URL
Value: https://wwmcqakezlcdzvlecsav.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bWNxYWtlemxjZHp2bGVjc2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDE4MDEsImV4cCI6MjA4OTkxNzgwMX0.TBcqOQ-vxcoH4ndhxMU1LzIJuzMFQiVnNajinUucOQU
```

#### Application Configuration
```
Name: VITE_APP_NAME
Value: TechAssassin
```

```
Name: VITE_APP_URL
Value: https://your-vercel-app.vercel.app
```
**Note**: Replace with your actual Vercel app URL

```
Name: VITE_DEBUG
Value: false
```

### 3. Environment Scope

For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache" (optional)
5. Click **Redeploy**

## Troubleshooting

### Still seeing white page?

1. **Check Browser Console**:
   - Open your Vercel site
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for error messages
   - Share the errors with me

2. **Check Vercel Build Logs**:
   - Go to Deployments tab
   - Click on the latest deployment
   - Check the "Building" section for errors

3. **Check Runtime Logs**:
   - In the deployment details
   - Go to "Functions" tab
   - Check for runtime errors

### Common Issues

**Issue**: "Failed to fetch" or network errors
- **Solution**: Make sure `VITE_API_URL` points to your deployed backend on Render

**Issue**: Supabase errors
- **Solution**: Verify your Supabase project is active (not paused)

**Issue**: 404 on routes
- **Solution**: Vercel should auto-detect SPA routing. If not, create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Backend Deployment (Render)

Your backend also needs to be deployed. Make sure:

1. Backend is deployed on Render
2. Backend environment variables are set on Render
3. Backend URL is used in `VITE_API_URL` on Vercel

## Quick Checklist

- [ ] All environment variables added to Vercel
- [ ] Backend deployed on Render
- [ ] `VITE_API_URL` points to Render backend
- [ ] Redeployed after adding env vars
- [ ] Checked browser console for errors
- [ ] Supabase project is active

## Need Help?

If you're still seeing issues:
1. Share the browser console errors
2. Share the Vercel build logs
3. Confirm your backend URL
