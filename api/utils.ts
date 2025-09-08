import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../server/db';
import { maps } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { generateMapImage } from '../server/mapbox-static';
import { memoryStorage } from '../server/memory-storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (action) {
      case 'search-locations':
        return await handleSearchLocations(req, res);
      case 'reverse-geocode':
        return await handleReverseGeocode(req, res);
      case 'generate-map-image':
        return await handleGenerateMapImage(req, res);
      case 'save-image-export':
        return await handleSaveImageExport(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Utils API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleSearchLocations(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }

    const encodedQuery = encodeURIComponent(q);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=${limit}&types=place,locality,neighborhood,address`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    const locations = data.features.map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      place_type: feature.place_type,
      properties: feature.properties,
      context: feature.context
    }));

    return res.status(200).json({ locations });
  } catch (error) {
    console.error('Location search error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search locations' });
  }
}

async function handleReverseGeocode(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,locality,neighborhood,address`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return res.status(200).json({
        success: true,
        location: {
          place_name: feature.place_name,
          center: feature.center,
          place_type: feature.place_type,
          properties: feature.properties,
          context: feature.context
        }
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: 'No location found for these coordinates' 
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to reverse geocode' 
    });
  }
}

async function handleGenerateMapImage(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      center, 
      zoom = 12, 
      width = 800, 
      height = 600, 
      style = 'streets-v11',
      markers = [],
      overlays = []
    } = req.body;

    if (!center || !center.lng || !center.lat) {
      return res.status(400).json({ error: 'Center coordinates are required' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }

    const imageUrl = await generateMapImage({
      center,
      zoom,
      width,
      height,
      style,
      markers,
      overlays,
      accessToken: mapboxToken
    });

    return res.status(200).json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('Map image generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate map image' 
    });
  }
}

async function handleSaveImageExport(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      imageData, 
      mapData, 
      userId, 
      title = 'Untitled Map',
      description = ''
    } = req.body;

    if (!imageData || !mapData) {
      return res.status(400).json({ error: 'Image data and map data are required' });
    }

    // Generate a unique ID for the map
    const mapId = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the image data in memory storage
    const imageKey = `${mapId}_image`;
    memoryStorage.set(imageKey, imageData);

    // Save map record to database
    const newMap = {
      id: mapId,
      title,
      description,
      mapData: JSON.stringify(mapData),
      imageUrl: `/api/utils?action=get-image&key=${imageKey}`,
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(maps).values(newMap);

    return res.status(200).json({
      success: true,
      mapId,
      imageUrl: newMap.imageUrl,
      message: 'Map saved successfully'
    });
  } catch (error) {
    console.error('Save image export error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to save map export' 
    });
  }
}