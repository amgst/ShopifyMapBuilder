# Vercel Environment Variables Setup Guide

## Step 1: Get Required Values

### 1. Database URL (NeonDB - Recommended)
1. Go to https://console.neon.tech/
2. Sign up/login and create a new project
3. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Shopify API Credentials
1. Go to https://partners.shopify.com/
2. Navigate to your app or create a new one
3. Go to "App setup" > "App credentials"
4. Copy:
   - API key
   - API secret key

### 3. Your Vercel Domain
After first deployment, you'll get a URL like: `https://your-app-name.vercel.app`

## Step 2: Add Variables to Vercel Dashboard

### Method 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `DATABASE_URL` | `your_neon_db_url` | Production |
| `SHOPIFY_API_KEY` | `your_shopify_api_key` | Production |
| `SHOPIFY_API_SECRET` | `your_shopify_api_secret` | Production |
| `SHOPIFY_SCOPES` | `read_products,write_orders,read_customers` | Production |
| `APP_URL` | `https://your-app-name.vercel.app` | Production |
| `MAPBOX_ACCESS_TOKEN` | `your_mapbox_token` (optional) | Production |

### Method 2: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Set environment variables
vercel env add NODE_ENV
# Enter: production

vercel env add DATABASE_URL
# Enter: your_database_url

vercel env add SHOPIFY_API_KEY
# Enter: your_shopify_api_key

vercel env add SHOPIFY_API_SECRET
# Enter: your_shopify_api_secret

vercel env add SHOPIFY_SCOPES
# Enter: read_products,write_orders,read_customers

vercel env add APP_URL
# Enter: https://your-app-name.vercel.app
```

## Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Your app will now use the environment variables
```

## Important Notes:

1. **Never commit sensitive values** - The `.env.vercel` file contains placeholders only
2. **Set environment for Production** - Make sure to select "Production" when adding variables
3. **Redeploy after adding variables** - Run `vercel --prod` after adding new environment variables
4. **Test your setup** - Use the `/shopify-debug` page to test Shopify integration

## Troubleshooting:

- **Variables not loading**: Make sure they're set for "Production" environment
- **Database connection fails**: Verify the DATABASE_URL format includes `?sslmode=require`
- **Shopify API errors**: Check that your API keys are correct and have proper permissions