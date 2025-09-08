import type { Request, Response } from "express";
import { storage } from "../../server/storage";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Validate credentials
    if (username !== 'admin' || password !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Create or get admin user
    let adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      adminUser = await storage.createUser({
        username: 'admin',
        password: 'admin', // In production, this should be hashed
        email: 'admin@mapbuilder.com',
        role: 'admin'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        username: adminUser.username, 
        role: adminUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        email: adminUser.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}