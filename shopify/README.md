# Shopify Theme Integration

This directory contains all the necessary files for integrating the Map Builder application with your Shopify store theme.

## 📁 Directory Structure

```
shopify/
├── theme-files/           # Files to upload to your Shopify theme
│   ├── sections/         # Shopify section files
│   │   └── custom-map-builder.liquid
│   ├── assets/           # CSS and JavaScript assets
│   │   ├── custom-map-builder.css
│   │   └── custom-map-builder.js
│   └── templates/        # Custom page templates
│       └── product.custom-map.liquid
├── docs/                 # Integration documentation
│   └── INSTALLATION-FULL-WIDTH.md
└── README.md            # This file
```

## 🚀 Quick Installation

### Step 1: Upload Theme Files
1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Actions** → **Edit code** on your active theme
3. Upload files to their respective folders:
   - `sections/custom-map-builder.liquid` → **Sections** folder
   - `assets/custom-map-builder.css` → **Assets** folder  
   - `assets/custom-map-builder.js` → **Assets** folder
   - `templates/product.custom-map.liquid` → **Templates** folder

### Step 2: Configure Section
1. Go to **Online Store** → **Themes** → **Customize**
2. Add the **Custom Map Builder** section to any page
3. Configure these settings:
   - **App URL**: `https://shopify-map-builder.vercel.app`
   - **Product Variant ID**: Your map product variant ID
   - **Heading**: "Create Your Custom Map" (or customize)

## 🎯 Features

### ✨ Full-Width Layout
- **100% browser width** on all devices
- Breaks out of theme containers automatically
- Responsive design optimized for mobile

### 🛒 Shopify Integration
- Native cart integration with your store
- Product variant support
- Automatic price updates
- Seamless checkout process

### 📱 Cross-Platform Support
- Works on all Shopify themes
- Mobile-responsive design
- Touch-optimized interface

## 🔧 Configuration

### Environment Variables (Vercel)
Your Vercel deployment needs these environment variables:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Section Settings
Configure these in the Shopify theme customizer:

| Setting | Description | Example |
|---------|-------------|---------|
| App URL | Your Vercel deployment URL | `https://shopify-map-builder.vercel.app` |
| Product Variant ID | Map product variant | `gid://shopify/ProductVariant/41068385009711` |
| Heading | Section title | "Create Your Custom Map" |
| Description | Section description | "Design a personalized map..." |
| Redirect to Cart | Auto-redirect after adding | `false` (recommended) |

## 📖 Implementation Options

### Option A: Page Section
Add the Map Builder as a section to any page:
1. Use `custom-map-builder.liquid` section
2. Configure via theme customizer
3. Suitable for landing pages, product pages

### Option B: Dedicated Product Page
Create a custom product template:
1. Use `product.custom-map.liquid` template
2. Assign to your map products
3. Provides focused product experience

## 🎨 Customization

### CSS Customization
Modify `custom-map-builder.css` to match your theme:

```css
/* Custom theme colors */
.map-builder-heading {
  color: var(--theme-primary-color);
  font-family: var(--theme-heading-font);
}

/* Custom button styles */
.btn-primary {
  background-color: var(--theme-accent-color);
}
```

### JavaScript Events
Listen for map builder events:

```javascript
window.addEventListener('message', function(event) {
  if (event.data.type === 'MAP_ADDED_TO_CART') {
    // Custom success handling
    console.log('Map added to cart!', event.data);
  }
});
```

## 🔍 Troubleshooting

### Common Issues

#### Map Builder Not Loading
- Verify Vercel app URL is correct and accessible
- Check browser console for CORS errors
- Ensure iframe allows geolocation

#### Full-Width Not Working
- Some themes may need additional CSS overrides
- Check `docs/INSTALLATION-FULL-WIDTH.md` for theme-specific fixes
- Inspect element to identify container classes

#### Cart Integration Issues
- Verify Shopify environment variables in Vercel
- Check product variant ID is correct
- Test cart API endpoints manually

### Debug Mode
Enable debug logging by adding to your theme:

```javascript
window.MapBuilderDebug = true;
```

## 📱 Testing Checklist

- [ ] Section loads correctly in theme customizer
- [ ] Map builder iframe displays properly
- [ ] Full-width layout works on desktop
- [ ] Mobile responsive design functions
- [ ] Add to cart functionality works
- [ ] Cart redirect/success message shows
- [ ] Cross-browser compatibility verified

## 🆕 Version History

### v2.0 - Full-Width Integration
- Added 100% full-width layout support
- Enhanced mobile responsiveness
- Improved theme compatibility
- Added viewport-width CSS classes

### v1.0 - Initial Integration
- Basic Shopify section integration
- Cart functionality implementation
- Product template creation

## 📞 Support

For integration support:
1. Check the documentation in `docs/`
2. Review troubleshooting section above
3. Test with browser developer tools
4. Verify Vercel deployment status

## 🔗 Related Files

- **Main App**: `/client/src/` - React application source
- **API Endpoints**: `/api/` - Vercel serverless functions
- **Server Routes**: `/server/routes.ts` - Express.js routes
- **Shopify Integration**: `/client/src/lib/shopify.ts` - Shopify API client

---

💡 **Tip**: Keep this directory structure in your Git repository to maintain version control of your Shopify theme integration files alongside your main application code.