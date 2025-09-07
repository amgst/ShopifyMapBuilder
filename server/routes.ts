import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMapConfigurationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Map Configuration Routes
  app.get("/api/map-configurations", async (req, res) => {
    try {
      const configurations = await storage.getAllMapConfigurations();
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching map configurations:", error);
      res.status(500).json({ message: "Failed to fetch map configurations" });
    }
  });

  app.get("/api/map-configurations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const configuration = await storage.getMapConfiguration(id);
      
      if (!configuration) {
        return res.status(404).json({ message: "Map configuration not found" });
      }
      
      res.json(configuration);
    } catch (error) {
      console.error("Error fetching map configuration:", error);
      res.status(500).json({ message: "Failed to fetch map configuration" });
    }
  });

  app.post("/api/map-configurations", async (req, res) => {
    try {
      const validatedData = insertMapConfigurationSchema.parse(req.body);
      const configuration = await storage.createMapConfiguration(validatedData);
      res.status(201).json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating map configuration:", error);
      res.status(500).json({ message: "Failed to create map configuration" });
    }
  });

  app.put("/api/map-configurations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMapConfigurationSchema.parse(req.body);
      const configuration = await storage.updateMapConfiguration(id, validatedData);
      
      if (!configuration) {
        return res.status(404).json({ message: "Map configuration not found" });
      }
      
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating map configuration:", error);
      res.status(500).json({ message: "Failed to update map configuration" });
    }
  });

  app.delete("/api/map-configurations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMapConfiguration(id);
      
      if (!success) {
        return res.status(404).json({ message: "Map configuration not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting map configuration:", error);
      res.status(500).json({ message: "Failed to delete map configuration" });
    }
  });

  // Location search endpoint (placeholder for geocoding service)
  app.get("/api/search/locations", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Placeholder implementation - in a real app, this would integrate with a geocoding service
      const mockResults = [
        { name: `${q} - Result 1`, lat: 48.8566, lng: 2.3522 },
        { name: `${q} - Result 2`, lat: 48.8606, lng: 2.3376 },
        { name: `${q} - Result 3`, lat: 48.8534, lng: 2.3488 },
      ];

      res.json(mockResults);
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({ message: "Failed to search locations" });
    }
  });

  // Generate map image endpoint (placeholder for map tile generation)
  app.post("/api/generate-map-image", async (req, res) => {
    try {
      const schema = z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number(),
          zoom: z.number(),
        }),
        customizations: z.object({
          texts: z.array(z.any()),
          icons: z.array(z.any()),
          compass: z.any().optional(),
        }),
        productSettings: z.object({
          shape: z.enum(['rectangle', 'circle', 'stick', 'twig']),
          size: z.string(),
          material: z.string(),
          aspectRatio: z.number(),
        }),
      });

      const validatedData = schema.parse(req.body);
      
      // Placeholder implementation - in a real app, this would generate the actual map image
      const imageUrl = `https://via.placeholder.com/800x400/f0f0f0/333333?text=Map+${validatedData.location.lat},${validatedData.location.lng}`;
      
      res.json({ imageUrl });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating map image:", error);
      res.status(500).json({ message: "Failed to generate map image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
