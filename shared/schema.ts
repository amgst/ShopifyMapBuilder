import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, real, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  role: text("role").notNull().default("customer"), // customer, admin, team_member
  shopifyStoreUrl: text("shopify_store_url"),
  shopifyAccessToken: text("shopify_access_token"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mapConfigurations = pgTable("map_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  location: jsonb("location").$type<{
    lat: number;
    lng: number;
    zoom: number;
    searchQuery?: string;
  }>().notNull(),
  customizations: jsonb("customizations").$type<{
    texts: Array<{
      id: string;
      content: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    }>;
    icons: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      size: number;
    }>;
    compass?: {
      type: string;
      x: number;
      y: number;
      size: number;
    };
  }>().default({ texts: [], icons: [] }),
  productSettings: jsonb("product_settings").$type<{
    shape: 'rectangle' | 'circle' | 'stick' | 'twig';
    size: string;
    material: string;
    aspectRatio: number;
  }>().notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopify orders tracking
export const shopifyOrders = pgTable("shopify_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  shopifyOrderId: text("shopify_order_id").notNull(),
  shopifyOrderNumber: text("shopify_order_number"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  orderData: jsonb("order_data"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated map files
export const generatedMaps = pgTable("generated_maps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mapConfigId: varchar("map_config_id"),
  shopifyOrderId: varchar("shopify_order_id"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  cloudBackupUrl: text("cloud_backup_url"),
  downloadCount: integer("download_count").default(0),
  isPublic: boolean("is_public").default(false),
  generationMetadata: jsonb("generation_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cloud backup logs
export const cloudBackups = pgTable("cloud_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  generatedMapId: varchar("generated_map_id").notNull(),
  provider: text("provider").notNull(), // s3, google_drive, etc
  backupUrl: text("backup_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  shopifyStoreUrl: true,
});

export const insertMapConfigurationSchema = createInsertSchema(mapConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopifyOrderSchema = createInsertSchema(shopifyOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedMapSchema = createInsertSchema(generatedMaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCloudBackupSchema = createInsertSchema(cloudBackups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MapConfiguration = typeof mapConfigurations.$inferSelect;
export type InsertMapConfiguration = z.infer<typeof insertMapConfigurationSchema>;
export type ShopifyOrder = typeof shopifyOrders.$inferSelect;
export type InsertShopifyOrder = z.infer<typeof insertShopifyOrderSchema>;
export type GeneratedMap = typeof generatedMaps.$inferSelect;
export type InsertGeneratedMap = z.infer<typeof insertGeneratedMapSchema>;
export type CloudBackup = typeof cloudBackups.$inferSelect;
export type InsertCloudBackup = z.infer<typeof insertCloudBackupSchema>;
