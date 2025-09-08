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

    // Get all data to calculate stats
    const [allUsers, allMaps, allOrders] = await Promise.all([
      storage.getUsersByRole('customer'),
      storage.getAllGeneratedMaps(),
      storage.getOrdersByUser(''), // This would need to be updated to get all orders
    ]);

    // Calculate total downloads
    const totalDownloads = allMaps.reduce((sum, map) => sum + (map.downloadCount || 0), 0);

    const stats = {
      totalUsers: allUsers.length,
      totalMaps: allMaps.length,
      totalOrders: allOrders.length,
      totalDownloads
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}