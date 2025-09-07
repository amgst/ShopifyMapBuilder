# 🗺️ Professional Server-Side High-Resolution Map Generation

## Overview

This implementation provides **professional-grade, server-side map generation** using the **Mapbox Static Images API**. This is the recommended approach for generating high-quality maps suitable for:

- **Print/Poster applications** (up to 1280×1280 standard, larger with enterprise)
- **Professional presentations**
- **E-commerce product images**
- **Marketing materials**
- **Laser engraving** (when combined with appropriate processing)

## 🚀 Key Advantages

### **vs Client-Side Generation:**
- ✅ **Much higher resolution** (up to 1280×1280, enterprise can go larger)
- ✅ **Professional map styles** (Mapbox quality)
- ✅ **Consistent quality** across devices
- ✅ **No browser limitations** 
- ✅ **Reliable rendering** (no canvas size limits)
- ✅ **Server-side processing** capabilities

### **vs Basic Tile Rendering:**
- ✅ **Single API call** vs hundreds of tile requests
- ✅ **Optimized for static images**
- ✅ **Better typography** and styling
- ✅ **Marker and overlay support**
- ✅ **Professional cartography**

---

## 📁 Implementation Files

### **Server-Side (Backend)**
```
server/
├── mapbox-static.ts        # Core Mapbox Static API implementation
└── routes.ts              # API endpoints integration
```

### **Client-Side (Frontend)**
```
client/src/
├── components/
│   └── high-res-map-generator.tsx    # React UI component
└── utils/
    └── map-generation-examples.ts    # Usage examples
```

---

## 🔧 API Endpoints

### **1. Generate High-Resolution Map**
```http
POST /api/generate-high-res-map
Content-Type: application/json

{
  "lat": 40.7128,
  "lng": -74.0060,
  "zoom": 12,
  "width": 1280,
  "height": 1280,
  "style": "streets-v12",
  "format": "png",
  "retina": true,
  "markers": [
    {
      "lat": 40.7128,
      "lng": -74.0060,
      "options": {
        "color": "red",
        "size": "large",
        "label": "A"
      }
    }
  ]
}
```

**Response:** Binary image data (PNG/JPEG/WebP)

### **2. Generate Poster-Size Map**
```http
POST /api/generate-poster-map
Content-Type: application/json

{
  "lat": 40.7128,
  "lng": -74.0060,
  "zoom": 12,
  "width": 2560,
  "height": 2560,
  "dpi": 300,
  "style": "streets-v12"
}
```

### **3. Generate with Bounding Box**
```http
POST /api/generate-map-bbox
Content-Type: application/json

{
  "bbox": {
    "north": 40.7829,
    "south": 40.7489,
    "east": -74.0059,
    "west": -74.0759
  },
  "width": 1920,
  "height": 1080,
  "style": "outdoors-v12",
  "format": "jpg"
}
```

---

## 🎨 Available Map Styles

| **Style ID** | **Description** | **Best For** |
|--------------|-----------------|--------------|
| `streets-v12` | Google Maps-like streets | General use, navigation |
| `outdoors-v12` | Terrain and outdoor features | Hiking, outdoor activities |
| `light-v11` | Clean, minimal design | Professional presentations |
| `dark-v11` | Dark theme | Modern applications |
| `satellite-v9` | High-resolution satellite | Aerial views, geography |
| `navigation-day-v1` | Navigation optimized | Turn-by-turn directions |
| `monochrome` | Black and white | Print, engraving |

---

## 📏 Size Presets & Print Calculations

### **Common Size Presets:**
```javascript
const PRESET_SIZES = {
  'web-hd': { width: 1920, height: 1080 },     // Web HD
  'print-letter': { width: 2550, height: 3300 }, // 8.5×11" at 300 DPI
  'print-a4': { width: 2480, height: 3508 },    // A4 at 300 DPI
  'poster-small': { width: 3600, height: 2400 }, // 12×8" at 300 DPI
  'poster-large': { width: 4800, height: 3200 }  // 16×10.7" at 300 DPI
};
```

### **Print Size Calculator:**
```javascript
function calculatePrintSize(widthPx, heightPx, dpi = 300) {
  return {
    widthInches: (widthPx / dpi).toFixed(2),
    heightInches: (heightPx / dpi).toFixed(2),
    aspectRatio: (widthPx / heightPx).toFixed(2)
  };
}

// Example: 3600×2400 at 300 DPI = 12"×8"
```

---

## 🔑 Setup & Configuration

### **1. Environment Variables**
```bash
# Add to .env file
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
```

**Get Token:** [Mapbox Access Tokens](https://account.mapbox.com/access-tokens/)

### **2. Usage Limits**
- **Standard Mapbox:** Up to 1280×1280 pixels
- **Enterprise Mapbox:** Larger sizes available
- **Rate Limits:** Apply per account tier
- **Pricing:** Pay per request (check Mapbox pricing)

---

## 💻 Frontend Usage Examples

### **Basic Usage:**
```typescript
import { generateBasicHighResMap } from '@/utils/map-generation-examples';

const location = { lat: 40.7128, lng: -74.0060, zoom: 12 };
const blob = await generateBasicHighResMap(location);

// Create download
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'high-res-map.png';
link.click();
```

### **React Component:**
```tsx
import HighResMapGenerator from '@/components/high-res-map-generator';

function MyPage() {
  return (
    <div>
      <h1>Professional Map Generation</h1>
      <HighResMapGenerator />
    </div>
  );
}
```

### **Batch Generation:**
```typescript
const sizes = [
  { name: 'web', width: 1920, height: 1080 },
  { name: 'print', width: 3600, height: 2400 },
  { name: 'poster', width: 4800, height: 3200 }
];

const results = await generateMultipleSizes(location);
// Downloads: web_map.png, print_map.png, poster_map.png
```

---

## 🖼️ Integration with Existing System

### **For Shopify Integration:**
```typescript
// In your cart addition flow:
app.post("/api/shopify/add-to-cart", async (req, res) => {
  // 1. Generate high-res map
  const mapBlob = await generateHighResMapForOrder(mapData);
  
  // 2. Save to server
  const imageUrl = await saveMapImage(mapBlob, orderId);
  
  // 3. Add to cart with image reference
  const cartResult = await addToShopifyCart({
    ...cartData,
    imageUrl
  });
  
  res.json({ success: true, cart: cartResult, imageUrl });
});
```

### **For Print/Engraving Workflow:**
```typescript
// Generate specific formats for different processes
const printMap = await fetch('/api/generate-poster-map', {
  method: 'POST',
  body: JSON.stringify({
    ...location,
    width: 3600,  // 12" at 300 DPI
    height: 2400, // 8" at 300 DPI
    dpi: 300,
    format: 'png',
    style: 'light-v11' // Clean for engraving
  })
});
```

---

## 🔍 Quality Comparison

| **Method** | **Max Resolution** | **Quality** | **Consistency** | **Speed** |
|------------|-------------------|-------------|-----------------|-----------|
| **Client html2canvas** | ~2000×2000 | Variable | Device-dependent | Slow |
| **OpenLayers tiles** | Unlimited | Basic | Variable | Very slow |
| **Mapbox Static API** | 1280×1280+ | Professional | Consistent | Fast |

---

## 🛠️ Advanced Features

### **Custom Markers:**
```javascript
const markers = [
  {
    lat: 40.7128,
    lng: -74.0060,
    options: {
      size: 'large',
      color: 'red',
      label: 'NYC'
    }
  }
];
```

### **Bounding Box Auto-Calculation:**
```javascript
function calculateBoundingBox(center, zoomLevel) {
  const zoomFactor = Math.pow(2, 15 - zoomLevel);
  const latDelta = 0.01 * zoomFactor;
  const lngDelta = 0.01 * zoomFactor;
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
}
```

### **Print Quality Optimization:**
```javascript
const printSettings = {
  dpi: 300,           // Standard print quality
  format: 'png',      // Lossless for text clarity
  retina: true,       // 2x pixel density
  style: 'light-v11'  // Clean for printing
};
```

---

## 🚀 Getting Started

1. **Get Mapbox Token:**
   - Sign up at [Mapbox](https://mapbox.com)
   - Create access token
   - Add to environment variables

2. **Install Implementation:**
   - Server files already included
   - Routes are registered
   - Frontend components available

3. **Test Implementation:**
   ```bash
   # Test endpoint
   curl -X POST http://localhost:3000/api/generate-high-res-map \
     -H "Content-Type: application/json" \
     -d '{"lat":40.7128,"lng":-74.0060,"zoom":12,"width":1280,"height":1280}'
   ```

4. **Use in Frontend:**
   ```tsx
   import HighResMapGenerator from '@/components/high-res-map-generator';
   // Add to your component tree
   ```

---

## 💡 Benefits for Your Use Case

- ✅ **Professional Quality:** Google Maps-level cartography
- ✅ **Print Ready:** 300+ DPI support
- ✅ **Reliable:** Server-side, no browser limitations
- ✅ **Scalable:** Handle multiple users simultaneously
- ✅ **Consistent:** Same quality across all devices
- ✅ **Fast:** Single API call vs hundreds of tile requests
- ✅ **Professional:** Enterprise-grade mapping solution

This implementation transforms your map generation from basic client-side rendering to **professional-grade, server-side image generation** suitable for commercial applications.