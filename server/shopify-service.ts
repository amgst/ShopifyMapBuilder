import { storage } from "./storage";
import type { InsertShopifyOrder, InsertGeneratedMap } from "@shared/schema";

export interface ShopifyOrderData {
  id: string;
  order_number: string;
  email: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    title: string;
    quantity: number;
    price: string;
  }>;
  created_at: string;
  financial_status: string;
  fulfillment_status?: string;
}

export class ShopifyService {
  
  // Process a new Shopify order and create a record
  async processOrder(userId: string, orderData: ShopifyOrderData): Promise<string> {
    try {
      // Check if order already exists
      const existingOrder = await storage.getShopifyOrderByOrderId(orderData.id);
      if (existingOrder) {
        return existingOrder.id;
      }

      // Create new order record
      const orderRecord: InsertShopifyOrder = {
        userId,
        shopifyOrderId: orderData.id,
        shopifyOrderNumber: orderData.order_number,
        customerEmail: orderData.email,
        customerName: orderData.customer 
          ? `${orderData.customer.first_name} ${orderData.customer.last_name}`
          : undefined,
        orderData: orderData as any,
        status: this.mapOrderStatus(orderData.financial_status, orderData.fulfillment_status)
      };

      const createdOrder = await storage.createShopifyOrder(orderRecord);
      return createdOrder.id;
    } catch (error) {
      console.error('Failed to process Shopify order:', error);
      throw error;
    }
  }

  // Link a generated map to a Shopify order
  async linkMapToOrder(mapId: string, shopifyOrderId: string): Promise<void> {
    try {
      const order = await storage.getShopifyOrderByOrderId(shopifyOrderId);
      if (!order) {
        throw new Error('Shopify order not found');
      }

      await storage.updateGeneratedMap(mapId, {
        shopifyOrderId: order.id
      });

      // Update order status to processing if it's still pending
      if (order.status === 'pending') {
        await storage.updateShopifyOrder(order.id, {
          status: 'processing'
        });
      }
    } catch (error) {
      console.error('Failed to link map to order:', error);
      throw error;
    }
  }

  // Create a generated map record with automatic order linking
  async createGeneratedMapWithOrder(
    userId: string, 
    fileName: string, 
    filePath: string, 
    fileSize: number,
    mapConfigId?: string,
    shopifyOrderId?: string
  ): Promise<string> {
    try {
      const mapRecord: InsertGeneratedMap = {
        userId,
        mapConfigId,
        shopifyOrderId,
        fileName,
        filePath,
        fileSize,
        mimeType: this.getMimeType(fileName),
        downloadCount: 0,
        isPublic: false,
        generationMetadata: {
          generatedAt: new Date().toISOString(),
          method: 'mapbox-static'
        }
      };

      const createdMap = await storage.createGeneratedMap(mapRecord);

      // If we have a Shopify order ID, link it
      if (shopifyOrderId) {
        await this.linkMapToOrder(createdMap.id, shopifyOrderId);
      }

      return createdMap.id;
    } catch (error) {
      console.error('Failed to create generated map:', error);
      throw error;
    }
  }

  // Update order status when map generation is complete
  async completeOrderFulfillment(shopifyOrderId: string): Promise<void> {
    try {
      const order = await storage.getShopifyOrderByOrderId(shopifyOrderId);
      if (!order) {
        return;
      }

      await storage.updateShopifyOrder(order.id, {
        status: 'completed'
      });
    } catch (error) {
      console.error('Failed to complete order fulfillment:', error);
      throw error;
    }
  }

  // Get all maps for a specific order
  async getOrderMaps(shopifyOrderId: string): Promise<any[]> {
    try {
      const order = await storage.getShopifyOrderByOrderId(shopifyOrderId);
      if (!order) {
        return [];
      }

      return await storage.getGeneratedMapsByOrder(order.id);
    } catch (error) {
      console.error('Failed to get order maps:', error);
      return [];
    }
  }

  // Webhook handler for Shopify order updates
  async handleOrderWebhook(orderData: ShopifyOrderData, userId: string): Promise<void> {
    try {
      await this.processOrder(userId, orderData);
      
      // Check if this order contains map products (you'd customize this logic)
      const hasMapProducts = orderData.line_items.some(item => 
        item.title.toLowerCase().includes('map') || 
        item.title.toLowerCase().includes('poster')
      );

      if (hasMapProducts) {
        console.log(`Order ${orderData.order_number} contains map products, ready for processing`);
      }
    } catch (error) {
      console.error('Failed to handle order webhook:', error);
      throw error;
    }
  }

  private mapOrderStatus(financialStatus: string, fulfillmentStatus?: string): string {
    if (financialStatus === 'paid' && fulfillmentStatus === 'fulfilled') {
      return 'completed';
    } else if (financialStatus === 'paid') {
      return 'processing';
    } else if (financialStatus === 'pending') {
      return 'pending';
    } else {
      return 'failed';
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}

export const shopifyService = new ShopifyService();