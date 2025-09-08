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
  type InsertCloudBackup,
  users,
  mapConfigurations,
  shopifyOrders,
  generatedMaps,
  cloudBackups
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and } from "drizzle-orm";
import pg from "pg";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Map Configuration methods
  getMapConfiguration(id: string): Promise<MapConfiguration | undefined>;
  getAllMapConfigurations(): Promise<MapConfiguration[]>;
  getMapConfigurationsByUser(userId: string): Promise<MapConfiguration[]>;
  createMapConfiguration(config: InsertMapConfiguration): Promise<MapConfiguration>;
  updateMapConfiguration(id: string, config: InsertMapConfiguration): Promise<MapConfiguration | undefined>;
  deleteMapConfiguration(id: string): Promise<boolean>;
  
  // Shopify Order methods
  getShopifyOrder(id: string): Promise<ShopifyOrder | undefined>;
  getShopifyOrderByOrderId(shopifyOrderId: string): Promise<ShopifyOrder | undefined>;
  createShopifyOrder(order: InsertShopifyOrder): Promise<ShopifyOrder>;
  updateShopifyOrder(id: string, order: Partial<InsertShopifyOrder>): Promise<ShopifyOrder | undefined>;
  getOrdersByUser(userId: string): Promise<ShopifyOrder[]>;
  
  // Generated Map methods
  getGeneratedMap(id: string): Promise<GeneratedMap | undefined>;
  createGeneratedMap(map: InsertGeneratedMap): Promise<GeneratedMap>;
  updateGeneratedMap(id: string, map: Partial<InsertGeneratedMap>): Promise<GeneratedMap | undefined>;
  getGeneratedMapsByUser(userId: string): Promise<GeneratedMap[]>;
  getGeneratedMapsByOrder(shopifyOrderId: string): Promise<GeneratedMap[]>;
  getAllGeneratedMaps(): Promise<GeneratedMap[]>;
  incrementDownloadCount(id: string): Promise<void>;
  
  // Cloud Backup methods
  createCloudBackup(backup: InsertCloudBackup): Promise<CloudBackup>;
  updateCloudBackup(id: string, backup: Partial<InsertCloudBackup>): Promise<CloudBackup | undefined>;
  getBackupsByMap(generatedMapId: string): Promise<CloudBackup[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private mapConfigurations: Map<string, MapConfiguration>;

  constructor() {
    this.users = new Map();
    this.mapConfigurations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Map Configuration methods
  async getMapConfiguration(id: string): Promise<MapConfiguration | undefined> {
    return this.mapConfigurations.get(id);
  }

  async getAllMapConfigurations(): Promise<MapConfiguration[]> {
    return Array.from(this.mapConfigurations.values())
      .sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt;
        const bTime = b.updatedAt || b.createdAt;
        return new Date(bTime!).getTime() - new Date(aTime!).getTime();
      });
  }

  async createMapConfiguration(insertConfig: InsertMapConfiguration): Promise<MapConfiguration> {
    const id = randomUUID();
    const now = new Date();
    const config: MapConfiguration = {
      ...insertConfig,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.mapConfigurations.set(id, config);
    return config;
  }

  async updateMapConfiguration(id: string, insertConfig: InsertMapConfiguration): Promise<MapConfiguration | undefined> {
    const existing = this.mapConfigurations.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: MapConfiguration = {
      ...insertConfig,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    
    this.mapConfigurations.set(id, updated);
    return updated;
  }

  async deleteMapConfiguration(id: string): Promise<boolean> {
    return this.mapConfigurations.delete(id);
  }
}

export const storage = new MemStorage();
