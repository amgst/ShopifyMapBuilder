# Shopify Integration Deployment Guide

This guide covers deploying both the Vercel application and Shopify theme integration files.

## 🚀 Complete Deployment Process

### Phase 1: Vercel Application Deployment

#### 1. Environment Setup
Create these environment variables in Vercel:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
MAPBOX_ACCESS_TOKEN=your-mapbox-token
NODE_ENV=production
```

#### 2. Deploy to Vercel
```bash
# Build and deploy
npm run build:client
vercel --prod
```

Your app will be available at: `https://your-app-name.vercel.app`

### Phase 2: Shopify Theme Integration

#### 1. Access Theme Editor
1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Actions** → **Edit code** on your active theme

#### 2. Upload Theme Files
Upload files from the `shopify/theme-files/` directory:

**Sections** (Upload to `sections/` folder):
- `custom-map-builder.liquid`

**Assets** (Upload to `assets/` folder):
- `custom-map-builder.css`
- `custom-map-builder.js`

**Templates** (Upload to `templates/` folder):
- `product.custom-map.liquid`

#### 3. Configure Section Settings
1. Go to **Online Store** → **Themes** → **Customize**
2. Add **Custom Map Builder** section
3. Set **App URL** to your Vercel deployment URL
4. Configure other settings as needed

## 🔧 Configuration Reference

### Required Vercel Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_STORE_DOMAIN` | Your store's domain | `mystore.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Storefront API token | `shpat_xxxxx` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API token | `pk.xxxxx` |

### Shopify Section Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| App URL | `https://your-app.vercel.app` | Replace with your Vercel URL |
| Product Variant ID | `gid://shopify/ProductVariant/xxxxx` | Your map product variant |
| Heading | "Create Your Custom Map" | Customizable |
| Description | Your description | Optional |
| Redirect to Cart | `false` | Recommended setting |

## 📂 Project Structure Integration

Your files are now organized as:

```
ShopifyMapBuilder/
├── client/                    # React application
├── server/                    # Express.js backend
├── api/                      # Vercel serverless functions
├── shopify/                  # 🆕 Shopify integration
│   ├── theme-files/         # Ready-to-upload files
│   │   ├── sections/
│   │   ├── assets/
│   │   └── templates/
│   ├── docs/               # Documentation
│   └── README.md           # Integration guide
├── package.json
└── vercel.json
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured in Vercel
- [ ] Vercel deployment successful and accessible
- [ ] Shopify store and product setup complete

### Theme Integration
- [ ] All theme files uploaded to correct Shopify folders
- [ ] Section added and configured in theme customizer
- [ ] App URL points to correct Vercel deployment
- [ ] Product variant ID is correct

### Testing
- [ ] Map builder loads correctly on your store
- [ ] Full-width layout displays properly
- [ ] Mobile responsiveness verified
- [ ] Add to cart functionality works
- [ ] Cart integration successful

### Go-Live
- [ ] Test on actual store domain
- [ ] Verify all device compatibility
- [ ] Check page load performance
- [ ] Monitor for any errors

## 🔍 Troubleshooting Deployment

### Vercel Issues
- **Build fails**: Check `package.json` dependencies
- **Environment variables**: Verify all required vars are set
- **Function timeout**: Check API response times

### Shopify Integration Issues
- **Section not appearing**: Verify file upload and naming
- **Iframe not loading**: Check CORS and app URL
- **Full-width not working**: Review CSS overrides in docs

### Performance Optimization
- Enable Vercel edge functions for faster loading
- Optimize images and assets
- Use Shopify's CDN for static assets
- Monitor Core Web Vitals

## 📊 Monitoring & Maintenance

### Vercel Monitoring
- Check function logs in Vercel dashboard
- Monitor deployment status
- Review performance metrics

### Shopify Monitoring
- Test section regularly after theme updates
- Verify cart integration after Shopify updates
- Monitor customer feedback and support tickets

## 🔄 Update Process

### Application Updates
1. Make changes to your code
2. Test locally: `npm run dev`
3. Deploy: `vercel --prod`
4. Verify deployment successful

### Theme File Updates
1. Update files in `shopify/theme-files/`
2. Re-upload changed files to Shopify theme
3. Test changes in theme preview
4. Publish theme when ready

## 🆘 Support & Resources

### Documentation
- **Full-Width Setup**: `shopify/docs/INSTALLATION-FULL-WIDTH.md`
- **Integration Guide**: `shopify/README.md`
- **API Reference**: Check `/api` folder for endpoints

### Useful Commands
```bash
# Local development
npm run dev

# Build for production
npm run build:client

# Deploy to Vercel
vercel --prod

# Check Vercel logs
vercel logs
```

### Getting Help
1. Check browser developer console for errors
2. Review Vercel function logs
3. Test API endpoints individually
4. Verify Shopify configuration

---

🎉 **Success!** Your Map Builder application is now fully integrated with Shopify and ready for customers to create custom maps!