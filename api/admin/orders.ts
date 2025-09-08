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

    // For now, get orders by getting all users and their orders
    // In a real implementation, you'd have a method to get all orders
    const allUsers = await Promise.all([
      storage.getUsersByRole('customer'),
      storage.getUsersByRole('admin')
    ]).then(results => results.flat());

    const allOrders = [];
    for (const user of allUsers) {
      const userOrders = await storage.getOrdersByUser(user.id);
      const enrichedOrders = userOrders.map(order => ({
        ...order,
        userName: user.username
      }));
      allOrders.push(...enrichedOrders);
    }

    // Sort by creation date
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allOrders);
  } catch (error) {
    console.error('Failed to get admin orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}