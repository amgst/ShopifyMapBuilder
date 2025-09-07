import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Placeholder implementation - in a real app, this would integrate with a geocoding service
    const mockResults = [
      { name: `${q} - Result 1`, lat: 48.8566, lng: 2.3522 },
      { name: `${q} - Result 2`, lat: 48.8606, lng: 2.3376 },
      { name: `${q} - Result 3`, lat: 48.8534, lng: 2.3488 },
    ];

    res.json(mockResults);
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({ message: "Failed to search locations" });
  }
}