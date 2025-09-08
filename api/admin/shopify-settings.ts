import { Request, Response } from "express";
import { storage } from "../../server/storage";

export async function handler(req: Request, res: Response) {
  try {
    // Get admin user
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    if (req.method === 'GET') {
      // Return current Shopify settings (without exposing the full access token)
      return res.json({
        storeUrl: adminUser.shopifyStoreUrl || '',
        accessToken: adminUser.shopifyAccessToken ? '***masked***' : ''
      });
    }

    if (req.method === 'POST') {
      const { storeUrl, accessToken } = req.body;

      if (!storeUrl || !accessToken) {
        return res.status(400).json({ error: 'Store URL and access token are required' });
      }

      // Clean up store URL (remove protocol and trailing slash)
      const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Update admin user with Shopify credentials
      const updatedUser = await storage.updateUser(adminUser.id, {
        shopifyStoreUrl: cleanStoreUrl,
        shopifyAccessToken: accessToken
      });

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update Shopify settings' });
      }

      return res.json({ 
        success: true, 
        message: 'Shopify settings updated successfully',
        storeUrl: cleanStoreUrl
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Shopify settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;