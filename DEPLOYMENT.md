# Netlify Deployment Guide

This guide will help you deploy your GenBooks application to Netlify with proper configuration and seamless functionality.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Git repository with your project code
3. Node.js 18.x or higher

## Quick Deployment Steps

### Option 1: Direct Deployment via Admin Panel

1. **Access Admin Panel**: Navigate to `/admin` and log in
2. **Go to Publishing Tab**: Click on the "Publishing" tab in the admin dashboard
3. **Deploy to Netlify**: Click the "Deploy to Netlify" button
4. **Download Config**: Use the "Download Config" button to get `netlify.toml`
5. **Open Dashboard**: Click "Open Dashboard" to access your Netlify account

### Option 2: Manual Deployment

1. **Connect Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Netlify**:
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Connect your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `./`
     - Node version: `18`

## Configuration Files

### netlify.toml
The `netlify.toml` file is already configured with:
- Build settings
- Redirects for SPA routing
- API proxy configuration
- Security headers
- Cache optimization

### Environment Variables
Set these in your Netlify dashboard under Site Settings > Environment Variables:

```
NODE_VERSION=18
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

## Landing Page Links

The application includes these public access points:

- **Main Site**: `/` - Homepage with product showcase
- **Payment Page**: `/payment` - Checkout and order processing
- **Products**: `/products` - Product catalog
- **Gallery**: `/gallery` - Product gallery
- **Features**: `/features` - Feature highlights

## Admin Panel Access

- **Admin Login**: `/admin/login` - Administrative access
- **Admin Dashboard**: `/admin` - Full admin panel with publishing controls
- **Publishing Tab**: Includes Netlify deployment controls and status monitoring

## Build Process

The build process includes:

1. **Static File Optimization**: All static assets are optimized for production
2. **Security Headers**: Configured for enhanced security
3. **SPA Routing**: Single Page Application routing with fallbacks
4. **API Proxying**: Backend API calls are properly routed

## Testing Deployment

After deployment, test these endpoints:

- [ ] Main site loads correctly
- [ ] Payment processing works
- [ ] Admin panel is accessible
- [ ] API endpoints respond properly
- [ ] Static assets load with proper caching

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check Node.js version (should be 18.x)
2. **API Errors**: Verify environment variables are set
3. **Routing Issues**: Ensure `netlify.toml` redirects are configured
4. **Admin Access**: Check authentication configuration

### Support:

- Check deployment logs in Netlify dashboard
- Use the admin panel's deployment logs for real-time monitoring
- Verify all environment variables are properly set

## Security Considerations

- Admin panel is protected with authentication
- Environment variables contain sensitive data
- HTTPS is enforced by default on Netlify
- Security headers are configured in `netlify.toml`

## Performance Optimization

- Static assets are cached for 1 year
- Gzip compression is enabled
- CDN distribution via Netlify's global network
- Optimized build process for fast loading

---

For additional support, refer to the admin panel's Publishing tab for real-time deployment status and logs.