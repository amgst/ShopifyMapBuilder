import type { Request, Response } from "express";
import { storage } from "../../server/storage";

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check admin access
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all generated maps with user information
    const allMaps = await storage.getAllGeneratedMaps();
    
    // Enrich with user data
    const enrichedMaps = await Promise.all(
      allMaps.map(async (map) => {
        const mapUser = await storage.getUser(map.userId);
        return {
          ...map,
          userName: mapUser?.username || map.userId,
          customerEmail: mapUser?.email
        };
      })
    );

    res.json(enrichedMaps);
  } catch (error) {
    console.error('Failed to get admin maps:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}