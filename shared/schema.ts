import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMapConfigurationSchema = createInsertSchema(mapConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MapConfiguration = typeof mapConfigurations.$inferSelect;
export type InsertMapConfiguration = z.infer<typeof insertMapConfigurationSchema>;
