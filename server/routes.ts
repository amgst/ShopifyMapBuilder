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

  // Generate map image endpoint - provides metadata for image generation
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
        orderId: z.string().optional(),
      });

      const validatedData = schema.parse(req.body);
      
      // Generate metadata for the image export
      const timestamp = new Date().toISOString();
      const orderId = validatedData.orderId || `Order${Date.now()}`;
      const filename = `${orderId}_Map_${timestamp.replace(/[:.]/g, '-')}.jpeg`;
      
      // Calculate expected dimensions based on 300 DPI and product settings
      const baseDPI = 300;
      const sizeMapping = {
        'standard': { width: 12, height: 8 }, // 12" × 8"
        'large': { width: 16, height: 10 },   // 16" × 10"
        'compact': { width: 8, height: 6 }    // 8" × 6"
      };
      
      const physicalSize = sizeMapping[validatedData.productSettings.size as keyof typeof sizeMapping] || sizeMapping.standard;
      const pixelWidth = Math.round(physicalSize.width * baseDPI);
      const pixelHeight = Math.round(physicalSize.height * baseDPI);
      
      res.json({
        success: true,
        metadata: {
          filename,
          orderId,
          expectedDimensions: {
            width: pixelWidth,
            height: pixelHeight,
            dpi: baseDPI
          },
          targetFileSize: {
            min: 8, // MB
            target: 15, // MB
            max: 30 // MB
          },
          location: validatedData.location,
          customizations: validatedData.customizations,
          productSettings: validatedData.productSettings,
          timestamp
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating map image metadata:", error);
      res.status(500).json({ message: "Failed to generate map image metadata" });
    }
  });

  // Save exported image metadata (for order tracking)
  app.post("/api/save-image-export", async (req, res) => {
    try {
      const schema = z.object({
        orderId: z.string(),
        filename: z.string(),
        fileSizeMB: z.number(),
        dimensions: z.object({
          width: z.number(),
          height: z.number(),
          dpi: z.number()
        }),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
          zoom: z.number(),
          searchQuery: z.string().optional()
        }),
        customizations: z.object({
          texts: z.array(z.any()),
          icons: z.array(z.any()),
          compass: z.any().optional(),
        }),
        exportedAt: z.string()
      });

      const validatedData = schema.parse(req.body);
      
      // In a real application, this would:
      // 1. Save the export record to database
      // 2. Trigger email notification to company
      // 3. Integrate with Shopify order system
      
      console.log('Image export completed:', {
        orderId: validatedData.orderId,
        filename: validatedData.filename,
        size: `${validatedData.fileSizeMB.toFixed(1)}MB`,
        dimensions: `${validatedData.dimensions.width}x${validatedData.dimensions.height}`,
        location: validatedData.location
      });

      res.json({
        success: true,
        message: "Export recorded successfully",
        orderId: validatedData.orderId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving image export:", error);
      res.status(500).json({ message: "Failed to save image export" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
