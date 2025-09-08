import { 
  type User, 
  type InsertUser, 
  type MapConfiguration, 
  type InsertMapConfiguration,
  type ShopifyOrder,
  type InsertShopifyOrder,
  type GeneratedMap,
  type InsertGeneratedMap,
  type CloudBackup,
  type InsertCloudBackup
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private mapConfigurations: Map<string, MapConfiguration> = new Map();
  private shopifyOrders: Map<string, ShopifyOrder> = new Map();
  private generatedMaps: Map<string, GeneratedMap> = new Map();
  private cloudBackups: Map<string, CloudBackup> = new Map();

  constructor() {
    // Create default admin user with existing Shopify store info from environment
    const shopifyStoreUrl = process.env.SHOPIFY_STORE_NAME ? `${process.env.SHOPIFY_STORE_NAME}.myshopify.com` : "vgpcreatives.myshopify.com";
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    
    console.log('🔧 Memory Storage Init:');
    console.log('  - Store URL:', shopifyStoreUrl);
    console.log('  - Admin Token:', adminToken ? `${adminToken.substring(0, 10)}...` : 'NOT SET');
    
    this.createUser({
      username: "admin",
      password: "admin",
      email: "admin@mapbuilder.com",
      role: "admin",
      shopifyStoreUrl: shopifyStoreUrl,
      // If SHOPIFY_ADMIN_ACCESS_TOKEN is set in environment, use it
      shopifyAccessToken: adminToken || undefined
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      role: insertUser.role || 'customer',
      shopifyStoreUrl: insertUser.shopifyStoreUrl || null,
      shopifyAccessToken: insertUser.shopifyAccessToken || null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Map Configuration methods
  async getMapConfiguration(id: string): Promise<MapConfiguration | undefined> {
    return this.mapConfigurations.get(id);
  }

  async getAllMapConfigurations(): Promise<MapConfiguration[]> {
    return Array.from(this.mapConfigurations.values());
  }

  async getMapConfigurationsByUser(userId: string): Promise<MapConfiguration[]> {
    return Array.from(this.mapConfigurations.values()).filter(config => config.userId === userId);
  }

  async createMapConfiguration(insertConfig: InsertMapConfiguration): Promise<MapConfiguration> {
    const config: MapConfiguration = {
      id: randomUUID(),
      ...insertConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mapConfigurations.set(config.id, config);
    return config;
  }

  async updateMapConfiguration(id: string, insertConfig: InsertMapConfiguration): Promise<MapConfiguration | undefined> {
    const config = this.mapConfigurations.get(id);
    if (!config) return undefined;
    
    const updatedConfig = { ...config, ...insertConfig, updatedAt: new Date() };
    this.mapConfigurations.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteMapConfiguration(id: string): Promise<boolean> {
    return this.mapConfigurations.delete(id);
  }

  // Shopify Order methods
  async getShopifyOrder(id: string): Promise<ShopifyOrder | undefined> {
    return this.shopifyOrders.get(id);
  }

  async getShopifyOrderByOrderId(shopifyOrderId: string): Promise<ShopifyOrder | undefined> {
    for (const order of this.shopifyOrders.values()) {
      if (order.shopifyOrderId === shopifyOrderId) {
        return order;
      }
    }
    return undefined;
  }

  async createShopifyOrder(order: InsertShopifyOrder): Promise<ShopifyOrder> {
    const newOrder: ShopifyOrder = {
      id: randomUUID(),
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.shopifyOrders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateShopifyOrder(id: string, orderUpdate: Partial<InsertShopifyOrder>): Promise<ShopifyOrder | undefined> {
    const order = this.shopifyOrders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderUpdate, updatedAt: new Date() };
    this.shopifyOrders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrdersByUser(userId: string): Promise<ShopifyOrder[]> {
    return Array.from(this.shopifyOrders.values()).filter(order => order.userId === userId);
  }

  // Generated Map methods
  async getGeneratedMap(id: string): Promise<GeneratedMap | undefined> {
    return this.generatedMaps.get(id);
  }

  async createGeneratedMap(map: InsertGeneratedMap): Promise<GeneratedMap> {
    const newMap: GeneratedMap = {
      id: randomUUID(),
      ...map,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.generatedMaps.set(newMap.id, newMap);
    return newMap;
  }

  async updateGeneratedMap(id: string, mapUpdate: Partial<InsertGeneratedMap>): Promise<GeneratedMap | undefined> {
    const map = this.generatedMaps.get(id);
    if (!map) return undefined;
    
    const updatedMap = { ...map, ...mapUpdate, updatedAt: new Date() };
    this.generatedMaps.set(id, updatedMap);
    return updatedMap;
  }

  async getGeneratedMapsByUser(userId: string): Promise<GeneratedMap[]> {
    return Array.from(this.generatedMaps.values()).filter(map => map.userId === userId);
  }

  async getGeneratedMapsByOrder(shopifyOrderId: string): Promise<GeneratedMap[]> {
    return Array.from(this.generatedMaps.values()).filter(map => map.shopifyOrderId === shopifyOrderId);
  }

  async getAllGeneratedMaps(): Promise<GeneratedMap[]> {
    return Array.from(this.generatedMaps.values());
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const map = this.generatedMaps.get(id);
    if (map) {
      map.downloadCount = (map.downloadCount || 0) + 1;
      map.updatedAt = new Date();
      this.generatedMaps.set(id, map);
    }
  }

  // Cloud Backup methods
  async createCloudBackup(backup: InsertCloudBackup): Promise<CloudBackup> {
    const newBackup: CloudBackup = {
      id: randomUUID(),
      ...backup,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.cloudBackups.set(newBackup.id, newBackup);
    return newBackup;
  }

  async updateCloudBackup(id: string, backupUpdate: Partial<InsertCloudBackup>): Promise<CloudBackup | undefined> {
    const backup = this.cloudBackups.get(id);
    if (!backup) return undefined;
    
    const updatedBackup = { ...backup, ...backupUpdate, updatedAt: new Date() };
    this.cloudBackups.set(id, updatedBackup);
    return updatedBackup;
  }

  async getBackupsByMap(generatedMapId: string): Promise<CloudBackup[]> {
    return Array.from(this.cloudBackups.values()).filter(backup => backup.generatedMapId === generatedMapId);
  }
}