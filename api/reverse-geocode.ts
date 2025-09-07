import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Use OpenStreetMap Nominatim API for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MapBuilder/1.0 (Custom Map Application)'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    let city = '';
    let country = '';
    
    if (data.address) {
      // Try to get city name from various possible fields
      city = data.address.city || 
             data.address.town || 
             data.address.village || 
             data.address.municipality || 
             data.address.county || '';
      
      country = data.address.country || '';
    }

    // If we couldn't get proper city/country, use display name parts
    if (!city && data.display_name) {
      const parts = data.display_name.split(', ');
      city = parts[0] || '';
      country = parts[parts.length - 1] || '';
    }

    res.json({
      city: city.toUpperCase(),
      country: country.toUpperCase(),
      coordinates: `${latitude.toFixed(3)}°N / ${longitude.toFixed(3)}°E`,
      formattedLocation: {
        city,
        country,
        lat: latitude,
        lng: longitude
      }
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    res.status(500).json({ message: "Failed to get location details" });
  }
}