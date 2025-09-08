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
import { eq, desc, and, sql } from "drizzle-orm";
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

export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(pool);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set({ ...userUpdate, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, role));
  }

  // Map Configuration methods
  async getMapConfiguration(id: string): Promise<MapConfiguration | undefined> {
    const result = await this.db.select().from(mapConfigurations).where(eq(mapConfigurations.id, id)).limit(1);
    return result[0];
  }

  async getAllMapConfigurations(): Promise<MapConfiguration[]> {
    return await this.db.select().from(mapConfigurations).orderBy(desc(mapConfigurations.updatedAt));
  }

  async getMapConfigurationsByUser(userId: string): Promise<MapConfiguration[]> {
    return await this.db.select().from(mapConfigurations).where(eq(mapConfigurations.userId, userId)).orderBy(desc(mapConfigurations.updatedAt));
  }

  async createMapConfiguration(insertConfig: InsertMapConfiguration): Promise<MapConfiguration> {
    const result = await this.db.insert(mapConfigurations).values(insertConfig).returning();
    return result[0];
  }

  async updateMapConfiguration(id: string, insertConfig: InsertMapConfiguration): Promise<MapConfiguration | undefined> {
    const result = await this.db.update(mapConfigurations).set({ ...insertConfig, updatedAt: new Date() }).where(eq(mapConfigurations.id, id)).returning();
    return result[0];
  }

  async deleteMapConfiguration(id: string): Promise<boolean> {
    const result = await this.db.delete(mapConfigurations).where(eq(mapConfigurations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shopify Order methods
  async getShopifyOrder(id: string): Promise<ShopifyOrder | undefined> {
    const result = await this.db.select().from(shopifyOrders).where(eq(shopifyOrders.id, id)).limit(1);
    return result[0];
  }

  async getShopifyOrderByOrderId(shopifyOrderId: string): Promise<ShopifyOrder | undefined> {
    const result = await this.db.select().from(shopifyOrders).where(eq(shopifyOrders.shopifyOrderId, shopifyOrderId)).limit(1);
    return result[0];
  }

  async createShopifyOrder(order: InsertShopifyOrder): Promise<ShopifyOrder> {
    const result = await this.db.insert(shopifyOrders).values(order).returning();
    return result[0];
  }

  async updateShopifyOrder(id: string, orderUpdate: Partial<InsertShopifyOrder>): Promise<ShopifyOrder | undefined> {
    const result = await this.db.update(shopifyOrders).set({ ...orderUpdate, updatedAt: new Date() }).where(eq(shopifyOrders.id, id)).returning();
    return result[0];
  }

  async getOrdersByUser(userId: string): Promise<ShopifyOrder[]> {
    return await this.db.select().from(shopifyOrders).where(eq(shopifyOrders.userId, userId)).orderBy(desc(shopifyOrders.createdAt));
  }

  // Generated Map methods
  async getGeneratedMap(id: string): Promise<GeneratedMap | undefined> {
    const result = await this.db.select().from(generatedMaps).where(eq(generatedMaps.id, id)).limit(1);
    return result[0];
  }

  async createGeneratedMap(map: InsertGeneratedMap): Promise<GeneratedMap> {
    const result = await this.db.insert(generatedMaps).values(map).returning();
    return result[0];
  }

  async updateGeneratedMap(id: string, mapUpdate: Partial<InsertGeneratedMap>): Promise<GeneratedMap | undefined> {
    const result = await this.db.update(generatedMaps).set({ ...mapUpdate, updatedAt: new Date() }).where(eq(generatedMaps.id, id)).returning();
    return result[0];
  }

  async getGeneratedMapsByUser(userId: string): Promise<GeneratedMap[]> {
    return await this.db.select().from(generatedMaps).where(eq(generatedMaps.userId, userId)).orderBy(desc(generatedMaps.createdAt));
  }

  async getGeneratedMapsByOrder(shopifyOrderId: string): Promise<GeneratedMap[]> {
    return await this.db.select().from(generatedMaps).where(eq(generatedMaps.shopifyOrderId, shopifyOrderId)).orderBy(desc(generatedMaps.createdAt));
  }

  async getAllGeneratedMaps(): Promise<GeneratedMap[]> {
    return await this.db.select().from(generatedMaps).orderBy(desc(generatedMaps.createdAt));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await this.db.update(generatedMaps).set({ downloadCount: sql`${generatedMaps.downloadCount} + 1`, updatedAt: new Date() }).where(eq(generatedMaps.id, id));
  }

  // Cloud Backup methods
  async createCloudBackup(backup: InsertCloudBackup): Promise<CloudBackup> {
    const result = await this.db.insert(cloudBackups).values(backup).returning();
    return result[0];
  }

  async updateCloudBackup(id: string, backupUpdate: Partial<InsertCloudBackup>): Promise<CloudBackup | undefined> {
    const result = await this.db.update(cloudBackups).set({ ...backupUpdate, updatedAt: new Date() }).where(eq(cloudBackups.id, id)).returning();
    return result[0];
  }

  async getBackupsByMap(generatedMapId: string): Promise<CloudBackup[]> {
    return await this.db.select().from(cloudBackups).where(eq(cloudBackups.generatedMapId, generatedMapId)).orderBy(desc(cloudBackups.createdAt));
  }
}

export const storage = new PostgreSQLStorage();
