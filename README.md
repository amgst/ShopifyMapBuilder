# ShopifyMapBuilder

A comprehensive map customization application with full Shopify integration, allowing customers to create personalized maps and purchase them directly through your Shopify store.

## 🌟 Features

### 🗺️ Map Customization
- **Interactive map selection** with location search
- **Custom text and labels** with positioning
- **Icon placement** and customization
- **Compass decoration** options
- **Multiple product formats** (rectangle, circle, stick, twig)
- **High-quality output** (300 DPI print-ready)

### 🛒 Shopify Integration
- **Native cart integration** with your Shopify store
- **Real-time pricing** updates based on customization
- **Product variant support** for different sizes and materials
- **Seamless checkout** process
- **Order management** integration

### 📱 Full-Width Responsive Design
- **100% browser width** layout that breaks out of theme containers
- **Mobile-optimized** touch interface
- **Cross-platform compatibility** with all Shopify themes

## 🏗️ Project Structure

```
ShopifyMapBuilder/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   └── pages/           # Application pages
├── server/                   # Express.js backend
│   ├── routes.ts            # API route definitions
│   └── index.ts             # Server entry point
├── api/                     # Vercel serverless functions
│   ├── add-to-cart.ts       # Shopify cart integration
│   ├── generate-map-image.ts # Map image generation
│   └── save-image-export.ts # Image storage
├── shopify/                 # 🆕 Shopify theme integration
│   ├── theme-files/         # Ready-to-upload Shopify files
│   │   ├── sections/        # Shopify section files
│   │   ├── assets/          # CSS and JavaScript assets
│   │   └── templates/       # Custom page templates
│   ├── docs/               # Integration documentation
│   ├── README.md           # Shopify integration guide
│   └── DEPLOYMENT_GUIDE.md # Complete deployment instructions
├── shared/                  # Shared TypeScript schemas
├── public/                  # Static assets
├── package.json            # Dependencies and scripts
└── vercel.json             # Vercel deployment configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Shopify store with Storefront API access
- Mapbox account and API token
- Vercel account for deployment

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ShopifyMapBuilder
npm install
```

### 2. Environment Configuration
Create a `.env` file:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
MAPBOX_ACCESS_TOKEN=your-mapbox-token
NODE_ENV=development
```

### 3. Development
```bash
npm run dev
```
Visit: `http://localhost:3000`

### 4. Deploy to Vercel
```bash
npm run build:client
vercel --prod
```

### 5. Shopify Integration
Follow the guide in `shopify/DEPLOYMENT_GUIDE.md` to integrate with your Shopify theme.

## 🛍️ Shopify Integration

### Complete Integration Package
All Shopify theme files are included in the `shopify/` directory:

- **Sections**: Ready-to-use Shopify section with full-width layout
- **Assets**: Optimized CSS and JavaScript for theme integration
- **Templates**: Custom product page templates
- **Documentation**: Complete setup and deployment guides

### Key Integration Features
- **Full-width layout** that breaks out of theme containers
- **Native cart integration** with real Shopify cart
- **Mobile-responsive** design optimized for all devices
- **Theme compatibility** with CSS overrides for common themes

### Quick Integration
1. Upload files from `shopify/theme-files/` to your Shopify theme
2. Add the Custom Map Builder section to any page
3. Configure with your Vercel app URL
4. Test and go live!

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_STORE_DOMAIN` | Your store domain | ✅ |
| `SHOPIFY_ACCESS_TOKEN` | Storefront API token | ✅ |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API key | ✅ |
| `NODE_ENV` | Environment mode | ✅ |

### Shopify Setup
1. Create a map product in your Shopify store
2. Get the product variant ID
3. Configure Storefront API access
4. Set up the theme integration

## 📱 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **OpenLayers** for map rendering
- **Radix UI** components

### Backend
- **Express.js** with TypeScript
- **Vercel** serverless functions
- **Shopify Storefront API** integration
- **Mapbox** APIs for geocoding

### Deployment
- **Vercel** for application hosting
- **Shopify** theme integration
- **Git** version control

## 🎯 Core Features

### Map Customization Engine
- Interactive location selection
- Real-time preview updates
- Custom text positioning
- Icon library and placement
- Multiple export formats

### E-commerce Integration
- Dynamic pricing based on options
- Real-time cart updates
- Order processing pipeline
- Customer customization storage

### Quality Assurance
- High-resolution output (300 DPI)
- Print-ready file generation
- Quality validation system
- Professional image specifications

## 📖 Documentation

### For Developers
- **Setup Guide**: Environment configuration and development setup
- **API Reference**: Complete endpoint documentation
- **Component Guide**: React component usage and customization

### For Store Owners
- **Shopify Integration**: Complete theme integration guide
- **Configuration**: Section and template setup
- **Deployment**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and solutions

## 🔄 Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run build:client # Build frontend
npm run check        # Type checking
```

### Testing
```bash
npm test            # Run test suite
npm run e2e         # End-to-end tests
```

### Deployment
```bash
vercel --prod       # Deploy to production
```

## 📊 Performance

### Optimizations Applied
- **Code splitting** for faster initial loads
- **Image optimization** for maps and assets
- **API caching** for improved response times
- **Mobile optimization** for touch interfaces

### Monitoring
- Vercel analytics integration
- Performance monitoring
- Error tracking and logging
- User experience metrics

## 🆘 Support & Troubleshooting

### Common Issues
- **CORS errors**: Check Vercel configuration
- **Cart integration**: Verify Shopify API tokens
- **Mobile display**: Review responsive CSS
- **Theme conflicts**: Use CSS overrides in documentation

### Getting Help
1. Check the documentation in `shopify/docs/`
2. Review troubleshooting guides
3. Test with browser developer tools
4. Verify API configurations

## 🔗 Related Resources

- **Shopify Storefront API**: [Documentation](https://shopify.dev/api/storefront)
- **Mapbox APIs**: [Documentation](https://docs.mapbox.com/)
- **Vercel Deployment**: [Documentation](https://vercel.com/docs)
- **React Development**: [Documentation](https://react.dev/)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

🚀 **Ready to launch your custom map store?** Follow the deployment guide in `shopify/DEPLOYMENT_GUIDE.md` to get started!