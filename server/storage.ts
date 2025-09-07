import { type User, type InsertUser, type MapConfiguration, type InsertMapConfiguration } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Map Configuration methods
  getMapConfiguration(id: string): Promise<MapConfiguration | undefined>;
  getAllMapConfigurations(): Promise<MapConfiguration[]>;
  createMapConfiguration(config: InsertMapConfiguration): Promise<MapConfiguration>;
  updateMapConfiguration(id: string, config: InsertMapConfiguration): Promise<MapConfiguration | undefined>;
  deleteMapConfiguration(id: string): Promise<boolean>;
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
