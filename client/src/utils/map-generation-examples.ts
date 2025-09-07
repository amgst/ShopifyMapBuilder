/**
 * Server-Side High-Resolution Map Generation Examples
 * 
 * This file demonstrates how to use the professional Mapbox Static Images API
 * for generating high-quality maps suitable for printing and professional use.
 */

// Example 1: Basic High-Resolution Map Generation
export async function generateBasicHighResMap(location: { lat: number; lng: number; zoom: number }) {
  try {
    const response = await fetch('/api/generate-high-res-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        zoom: location.zoom,
        width: 1280,
        height: 1280,
        style: 'streets-v12',
        format: 'png',
        retina: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating high-res map:', error);
    throw error;
  }
}

// Example 2: Poster-Size Map for Printing
export async function generatePosterMap(location: { lat: number; lng: number; zoom: number }) {
  try {
    const response = await fetch('/api/generate-poster-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        zoom: location.zoom,
        width: 2560,  // Poster size
        height: 2560,
        dpi: 300,     // Print quality
        style: 'streets-v12'
      })
    });

    const blob = await response.blob();
    
    // Auto-download the poster
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster_map_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return blob;
  } catch (error) {
    console.error('Error generating poster map:', error);
    throw error;
  }
}

// Example 3: Bounding Box Map Generation
export async function generateBoundingBoxMap(bbox: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  try {
    const response = await fetch('/api/generate-map-bbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bbox,
        width: 1920,
        height: 1080,
        style: 'outdoors-v12',
        format: 'jpg',
        retina: true
      })
    });

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating bbox map:', error);
    throw error;
  }
}

// Example 4: Batch Generation for Multiple Sizes
export async function generateMultipleSizes(location: { lat: number; lng: number; zoom: number }) {
  const sizes = [
    { name: 'web', width: 1920, height: 1080 },
    { name: 'print', width: 3600, height: 2400 },
    { name: 'poster', width: 4800, height: 3200 }
  ];

  const results = [];

  for (const size of sizes) {
    try {
      const response = await fetch('/api/generate-high-res-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          zoom: location.zoom,
          width: size.width,
          height: size.height,
          style: 'streets-v12',
          format: 'png',
          retina: true
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        results.push({
          name: size.name,
          size: `${size.width}x${size.height}`,
          blob,
          sizeMB: (blob.size / (1024 * 1024)).toFixed(1)
        });
      }
    } catch (error) {
      console.error(`Error generating ${size.name} size:`, error);
    }
  }

  return results;
}

// Example 5: Custom Style Map with Markers
export async function generateMapWithMarkers(
  location: { lat: number; lng: number; zoom: number },
  markers: Array<{ lat: number; lng: number; label?: string; color?: string }>
) {
  try {
    const response = await fetch('/api/generate-high-res-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        zoom: location.zoom,
        width: 1280,
        height: 1280,
        style: 'light-v11',
        format: 'png',
        retina: true,
        markers: markers.map(marker => ({
          lat: marker.lat,
          lng: marker.lng,
          options: {
            color: marker.color || 'red',
            label: marker.label || '',
            size: 'large'
          }
        }))
      })
    });

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating map with markers:', error);
    throw error;
  }
}

// Example 6: Different Map Styles
export const MAP_STYLE_EXAMPLES = {
  // Google Maps-like
  streets: 'streets-v12',
  
  // Outdoor/Terrain
  outdoors: 'outdoors-v12',
  
  // Clean/Minimal
  light: 'light-v11',
  
  // Dark theme
  dark: 'dark-v11',
  
  // Satellite imagery
  satellite: 'satellite-v9',
  
  // Navigation optimized
  navigation: 'navigation-day-v1',
  
  // Black and white
  monochrome: 'monochrome'
};

// Example 7: Print Quality Calculator
export function calculatePrintDimensions(widthPx: number, heightPx: number, dpi: number = 300) {
  return {
    widthInches: (widthPx / dpi).toFixed(2),
    heightInches: (heightPx / dpi).toFixed(2),
    dpi,
    pixels: `${widthPx}x${heightPx}`,
    aspectRatio: (widthPx / heightPx).toFixed(2)
  };
}

// Example Usage in React Component:
/*
import { generateBasicHighResMap, generatePosterMap } from './map-generation-examples';

function MyMapComponent() {
  const [location] = useState({ lat: 40.7128, lng: -74.0060, zoom: 12 });
  
  const handleGenerateMap = async () => {
    try {
      const blob = await generateBasicHighResMap(location);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'high-res-map.png';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate map:', error);
    }
  };
  
  return (
    <button onClick={handleGenerateMap}>
      Generate High-Res Map
    </button>
  );
}
*/

// Environment Variables Required:
/*
// Add to your .env file:
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here

// Get token from: https://account.mapbox.com/access-tokens/
*/

export {
  generateBasicHighResMap,
  generatePosterMap,
  generateBoundingBoxMap,
  generateMultipleSizes,
  generateMapWithMarkers,
  calculatePrintDimensions
};