import express from 'express';

// Mapbox Static Images API configuration
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || 'pk.test_token_here';
const MAPBOX_STYLE = 'mapbox/streets-v12'; // High-quality street style

export interface StaticMapOptions {
  lat: number;
  lng: number;
  zoom: number;
  width: number;
  height: number;
  bearing?: number;
  pitch?: number;
  style?: string;
  retina?: boolean;
  format?: 'png' | 'jpg' | 'webp';
  overlays?: string[];
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Generate high-resolution map image using Mapbox Static Images API
 * Supports up to 1280x1280 (standard) or larger with enterprise plan
 */
export function generateMapboxStaticUrl(options: StaticMapOptions): string {
  const {
    lat,
    lng,
    zoom,
    width = 1280,
    height = 1280,
    bearing = 0,
    pitch = 0,
    style = MAPBOX_STYLE,
    retina = true,
    format = 'png',
    overlays = []
  } = options;

  // Ensure dimensions are within Mapbox limits
  const maxDimension = 1280;
  const finalWidth = Math.min(width, maxDimension);
  const finalHeight = Math.min(height, maxDimension);

  // Build overlay string (markers, paths, etc.)
  const overlayString = overlays.length > 0 ? `/${overlays.join(',')}` : '';
  
  // Retina suffix for high-DPI displays
  const retinaString = retina ? '@2x' : '';
  
  // Construct Mapbox Static API URL
  const url = `https://api.mapbox.com/styles/v1/${style}/static${overlayString}/${lng},${lat},${zoom},${bearing},${pitch}/${finalWidth}x${finalHeight}${retinaString}?access_token=${MAPBOX_ACCESS_TOKEN}`;
  
  return url;
}

/**
 * Generate high-resolution map from bounding box
 * Automatically calculates optimal zoom and center point
 */
export function generateMapboxBoundingBoxUrl(
  bbox: BoundingBox, 
  width: number = 1280, 
  height: number = 1280,
  options: Partial<StaticMapOptions> = {}
): string {
  // Calculate center point from bounding box
  const centerLat = (bbox.north + bbox.south) / 2;
  const centerLng = (bbox.east + bbox.west) / 2;
  
  // Calculate zoom level to fit bounding box
  const latDiff = bbox.north - bbox.south;
  const lngDiff = bbox.east - bbox.west;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Rough zoom calculation (can be refined)
  let zoom = 10;
  if (maxDiff > 10) zoom = 4;
  else if (maxDiff > 5) zoom = 6;
  else if (maxDiff > 1) zoom = 8;
  else if (maxDiff > 0.5) zoom = 10;
  else if (maxDiff > 0.1) zoom = 12;
  else if (maxDiff > 0.05) zoom = 14;
  else zoom = 16;
  
  return generateMapboxStaticUrl({
    lat: centerLat,
    lng: centerLng,
    zoom,
    width,
    height,
    ...options
  });
}

/**
 * Create marker overlay string for Mapbox Static API
 */
export function createMarkerOverlay(
  lat: number, 
  lng: number, 
  options: {
    size?: 'small' | 'large';
    color?: string;
    label?: string;
  } = {}
): string {
  const { size = 'large', color = 'red', label } = options;
  const labelString = label ? `-${label}` : '';
  return `pin-${size}-${color}${labelString}(${lng},${lat})`;
}

/**
 * Express route handler for generating high-resolution maps
 */
export async function generateHighResMapRoute(req: express.Request, res: express.Response) {
  try {
    const {
      lat,
      lng,
      zoom = 12,
      width = 1280,
      height = 1280,
      style = 'streets-v12',
      retina = true,
      format = 'png',
      markers = [],
      bbox
    } = req.body;

    let mapUrl: string;
    let overlays: string[] = [];

    // Add markers if provided
    if (markers && Array.isArray(markers)) {
      markers.forEach((marker: any) => {
        overlays.push(createMarkerOverlay(marker.lat, marker.lng, marker.options || {}));
      });
    }

    // Generate URL based on input type
    if (bbox) {
      mapUrl = generateMapboxBoundingBoxUrl(bbox, width, height, {
        style: `mapbox/${style}`,
        retina,
        format,
        overlays
      });
    } else if (lat && lng) {
      mapUrl = generateMapboxStaticUrl({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        zoom: parseInt(zoom),
        width: parseInt(width),
        height: parseInt(height),
        style: `mapbox/${style}`,
        retina,
        format,
        overlays
      });
    } else {
      return res.status(400).json({
        error: 'Missing required parameters: lat/lng or bbox'
      });
    }

    // Fetch the image from Mapbox
    const response = await fetch(mapUrl);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Set appropriate headers
    res.set({
      'Content-Type': `image/${format}`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Map-Source': 'Mapbox Static API',
      'X-Image-Dimensions': `${width}x${height}`,
      'X-Retina': retina.toString()
    });

    res.send(buffer);

  } catch (error) {
    console.error('High-res map generation error:', error);
    res.status(500).json({
      error: 'Failed to generate high-resolution map',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Route for generating poster-size maps with custom parameters
 */
export async function generatePosterMapRoute(req: express.Request, res: express.Response) {
  try {
    const {
      lat,
      lng,
      zoom = 12,
      width = 2560,  // Poster size - 2K
      height = 2560,
      dpi = 300,     // Print DPI
      style = 'streets-v12'
    } = req.body;

    // Calculate actual pixel dimensions for print DPI
    const printWidth = Math.round((width / 96) * dpi);
    const printHeight = Math.round((height / 96) * dpi);
    
    // Cap at Mapbox limits (enterprise can go higher)
    const finalWidth = Math.min(printWidth, 1280);
    const finalHeight = Math.min(printHeight, 1280);

    const mapUrl = generateMapboxStaticUrl({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      zoom: parseInt(zoom),
      width: finalWidth,
      height: finalHeight,
      style: `mapbox/${style}`,
      retina: true, // Always use retina for poster quality
      format: 'png'  // PNG for highest quality
    });

    const response = await fetch(mapUrl);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Generate filename with specifications
    const filename = `poster_map_${Date.now()}_${finalWidth}x${finalHeight}_${dpi}DPI.png`;

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'X-Print-DPI': dpi.toString(),
      'X-Print-Dimensions': `${width}x${height}`,
      'X-Actual-Dimensions': `${finalWidth}x${finalHeight}`
    });

    res.send(buffer);

  } catch (error) {
    console.error('Poster map generation error:', error);
    res.status(500).json({
      error: 'Failed to generate poster-size map',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}