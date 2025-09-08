import type { Request, Response } from "express";
import { storage } from "../server/storage";

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create test admin user
    const adminUser = await storage.createUser({
      username: "admin",
      password: "admin123", // In production, this would be hashed
      email: "admin@mapbuilder.com",
      role: "admin"
    });

    // Create test customer
    const customerUser = await storage.createUser({
      username: "customer1",
      password: "customer123",
      email: "customer@example.com",
      role: "customer",
      shopifyStoreUrl: "test-store.myshopify.com"
    });

    // Create test order
    const testOrder = await storage.createShopifyOrder({
      userId: customerUser.id,
      shopifyOrderId: "test-order-123",
      shopifyOrderNumber: "#1001",
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      orderData: {
        id: "test-order-123",
        total_price: "29.99",
        line_items: [
          {
            id: "item-1",
            title: "Custom Map Poster",
            quantity: 1,
            price: "29.99"
          }
        ]
      },
      status: "pending"
    });

    // Create test generated map
    const testMap = await storage.createGeneratedMap({
      userId: customerUser.id,
      shopifyOrderId: testOrder.id,
      fileName: "custom-map-paris.jpg",
      filePath: "public/images/Order1757243418385_Map_2025-09-07T11-10-18-385Z.jpeg",
      fileSize: 2048576, // 2MB
      mimeType: "image/jpeg",
      downloadCount: 5,
      isPublic: false,
      generationMetadata: {
        location: "Paris, France",
        style: "vintage",
        generatedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: "Test data created successfully",
      data: {
        adminUserId: adminUser.id,
        customerUserId: customerUser.id,
        orderId: testOrder.id,
        mapId: testMap.id
      }
    });
  } catch (error) {
    console.error('Failed to create test data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}