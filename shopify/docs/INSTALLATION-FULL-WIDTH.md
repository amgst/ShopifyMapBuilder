# Full-Width Shopify Integration Installation Guide

This guide explains how to install the Map Builder app in your Shopify theme with **100% full-width layout**, removing all container constraints.

## Files Updated for Full-Width

All files have been updated to ensure 100% width across all devices and override any theme container constraints:

### 1. Section File: `sections/custom-map-builder.liquid`
- Removed all container divs
- Added `!important` CSS rules to force 100% width
- Added theme-specific overrides for common Shopify containers

### 2. CSS File: `assets/custom-map-builder.css`
- Enhanced with aggressive full-width CSS
- Overrides common Shopify theme containers (.container, .page-width, .wrapper, .grid, .row)
- Added `.map-builder-full-width` class for viewport-width display
- Mobile responsive while maintaining 100% width

### 3. Product Template: `templates/product.custom-map.liquid`
- Updated to use full viewport width
- Added `.map-builder-full-width` class to break out of any theme constraints

## Installation Steps

### Step 1: Upload CSS File
1. In your Shopify admin, go to **Online Store** > **Themes**
2. Click **Actions** > **Edit code** on your active theme
3. In the **Assets** folder, click **Add a new asset**
4. Upload `custom-map-builder.css`

### Step 2: Add Section File
1. In the **Sections** folder, click **Add a new section**
2. Name it `custom-map-builder`
3. Copy and paste the content from `custom-map-builder.liquid`

### Step 3: Add Product Template (Optional)
1. In the **Templates** folder, click **Add a new template**
2. Choose **product** and name it `custom-map`
3. Copy and paste the content from `product.custom-map.liquid`

### Step 4: Configure Section Settings
1. Go to **Online Store** > **Themes** > **Customize**
2. Add the **Custom Map Builder** section to any page
3. Configure the settings:
   - **App URL**: `https://shopify-map-builder.vercel.app`
   - **Product Variant ID**: Your custom map product variant ID
   - **Heading**: Customize as needed
   - **Description**: Add your description

## Full-Width Features

### CSS Overrides Applied
```css
/* Force 100% width on all elements */
.map-builder-section,
.map-builder-widget,
.map-builder-container {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Override common Shopify theme containers */
.shopify-section .map-builder-section .container,
.shopify-section .map-builder-section .page-width,
.shopify-section .map-builder-section .wrapper,
.shopify-section .map-builder-section .grid,
.shopify-section .map-builder-section .row {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Full viewport width class */
.map-builder-full-width {
  width: 100vw !important;
  position: relative;
  left: 50% !important;
  right: 50% !important;
  margin-left: -50vw !important;
  margin-right: -50vw !important;
}
```

### Responsive Behavior
- **Desktop**: Full browser width (100vw)
- **Tablet**: 100% width with proper scaling
- **Mobile**: 100% width with optimized height

## Configuration Options

### Environment Variables for Vercel App
Make sure your Vercel app has these environment variables:
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Section Settings
- **Heading**: Section title (optional)
- **Description**: Section description (optional)
- **App URL**: Your Vercel deployment URL
- **Product Variant ID**: The product variant for custom maps
- **Redirect to Cart**: Auto-redirect after adding to cart

## Troubleshooting Full-Width Issues

### If the app is still contained:
1. Check if your theme has additional container classes
2. Add this CSS to force full width:
```css
.your-theme-container .map-builder-section {
  width: 100vw !important;
  margin-left: calc(-50vw + 50%) !important;
}
```

### Theme-Specific Adjustments
Some themes may need additional overrides. Add these classes to your theme's CSS if needed:

```css
/* For themes with specific container classes */
.main-content .map-builder-section,
.page-content .map-builder-section,
.site-content .map-builder-section {
  width: 100% !important;
  max-width: none !important;
}
```

## Testing Full-Width Layout

1. Add the section to a page
2. View the page on different devices
3. Verify the map builder extends to full browser width
4. Test the embed iframe loads correctly
5. Confirm add-to-cart functionality works

## Support

If you encounter any issues with the full-width integration:
1. Check browser developer tools for CSS conflicts
2. Verify the Vercel app is accessible
3. Ensure all environment variables are configured
4. Test on different devices and browsers

The integration now provides true 100% width display, breaking out of any theme containers and utilizing the full viewport width.