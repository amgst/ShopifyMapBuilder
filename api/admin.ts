import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../server/db';
import { users, maps, orders } from '../shared/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { shopifyService } from '../server/shopify-service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('Invalid token');
  }
  
  return decoded;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'check-access':
        return await handleCheckAccess(req, res);
      case 'users':
        return await handleUsers(req, res);
      case 'maps':
        return await handleMaps(req, res);
      case 'orders':
        return await handleOrders(req, res);
      case 'stats':
        return await handleStats(req, res);
      case 'store-analytics':
        return await handleStoreAnalytics(req, res);
      case 'shopify-settings':
        return await handleShopifySettings(req, res);
      case 'download-map':
        return await handleDownloadMap(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user[0].id, username: user[0].username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ 
      success: true, 
      token,
      user: { id: user[0].id, username: user[0].username }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function handleCheckAccess(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = requireAuth(req);
    return res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ valid: false, error: error.message });
  }
}

async function handleUsers(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));
    
    return res.status(200).json(allUsers);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleMaps(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    const allMaps = await db.select().from(maps).orderBy(desc(maps.createdAt));
    return res.status(200).json(allMaps);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleOrders(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return res.status(200).json(allOrders);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleStats(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [mapCount] = await db.select({ count: count() }).from(maps);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    
    const recentMaps = await db.select().from(maps)
      .orderBy(desc(maps.createdAt))
      .limit(5);
    
    const recentOrders = await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return res.status(200).json({
      users: userCount.count,
      maps: mapCount.count,
      orders: orderCount.count,
      recentMaps,
      recentOrders
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleStoreAnalytics(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    try {
      const analytics = await shopifyService.getStoreAnalytics();
      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Store analytics error:', error);
      return res.status(500).json({ error: 'Failed to fetch store analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleShopifySettings(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    return res.status(200).json({
      shopName: process.env.SHOPIFY_SHOP_NAME,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2023-10',
      connected: !!(process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_SHOP_NAME)
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleDownloadMap(req: NextApiRequest, res: NextApiResponse) {
  requireAuth(req);

  if (req.method === 'GET') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Map ID required' });
    }

    try {
      const map = await db.select().from(maps).where(eq(maps.id, id as string)).limit(1);
      
      if (map.length === 0) {
        return res.status(404).json({ error: 'Map not found' });
      }

      return res.status(200).json(map[0]);
    } catch (error) {
      console.error('Download map error:', error);
      return res.status(500).json({ error: 'Failed to download map' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}