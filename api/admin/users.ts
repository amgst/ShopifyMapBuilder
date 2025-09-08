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

    // Get all users (customers and admins)
    const [customers, admins] = await Promise.all([
      storage.getUsersByRole('customer'),
      storage.getUsersByRole('admin')
    ]);

    const allUsers = [...customers, ...admins].map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      shopifyStoreUrl: user.shopifyStoreUrl,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));

    res.json(allUsers);
  } catch (error) {
    console.error('Failed to get admin users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}