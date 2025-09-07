import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertMapConfigurationSchema } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { generateHighResMapRoute, generatePosterMapRoute } from './mapbox-static';

// Shopify configuration schema
const shopifyConfigSchema = z.object({
  storeName: z.string().min(1),
  storefrontAccessToken: z.string().min(1),
  productVariantId: z.string().min(1),
});

// Custom map data schema
const customMapDataSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    zoom: z.number(),
    searchQuery: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.string(),
  }),
  productSettings: z.object({
    shape: z.string(),
    size: z.string(),
    material: z.string(),
    aspectRatio: z.number(),
  }),
  customizations: z.object({
    texts: z.array(z.any()),
    icons: z.array(z.any()),
    compass: z.any().optional(),
  }),
  price: z.number(),
});

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

  // Reverse geocoding endpoint to get location details from coordinates
  app.get("/api/reverse-geocode", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      // Use OpenStreetMap Nominatim API for reverse geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'MapBuilder/1.0 (Custom Map Application)'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      let city = '';
      let country = '';
      
      if (data.address) {
        // Try to get city name from various possible fields
        city = data.address.city || 
               data.address.town || 
               data.address.village || 
               data.address.municipality || 
               data.address.county || '';
        
        country = data.address.country || '';
      }

      // If we couldn't get proper city/country, use display name parts
      if (!city && data.display_name) {
        const parts = data.display_name.split(', ');
        city = parts[0] || '';
        country = parts[parts.length - 1] || '';
      }

      res.json({
        city: city.toUpperCase(),
        country: country.toUpperCase(),
        coordinates: `${latitude.toFixed(3)}°N / ${longitude.toFixed(3)}°E`,
        formattedLocation: {
          city,
          country,
          lat: latitude,
          lng: longitude
        }
      });
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      res.status(500).json({ message: "Failed to get location details" });
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
      const orderId = validatedData.orderId || `Order${Date.now()}`;
      const filename = `${orderId}_Map.jpeg`; // Exact specification format: Order12345_Map.jpeg
      
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
          timestamp: new Date().toISOString()
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

  // Save image to server and get URL
  app.post("/api/save-image", async (req, res) => {
    try {
      const { imageData, filename, orderId } = req.body;
      
      if (!imageData || !filename) {
        return res.status(400).json({ message: "Image data and filename are required" });
      }
      
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create public/images directory if it doesn't exist
      const fs = require('fs');
      const path = require('path');
      
      const publicDir = path.join(process.cwd(), 'public');
      const imagesDir = path.join(publicDir, 'images');
      
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Save file to public/images
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      // Return public URL
      const imageUrl = `/images/${filename}`;
      
      console.log(`Image saved: ${filename} for order: ${orderId}`);
      
      res.json({
        success: true,
        imageUrl,
        filename,
        message: "Image saved successfully"
      });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ message: "Failed to save image" });
    }
  });
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

  // High-Resolution Map Generation Routes
  // Generate high-resolution maps using Mapbox Static Images API
  app.post("/api/generate-high-res-map", generateHighResMapRoute);
  
  // Generate poster-size maps for print
  app.post("/api/generate-poster-map", generatePosterMapRoute);
  
  // Alternative endpoint with bounding box support
  app.post("/api/generate-map-bbox", async (req, res) => {
    try {
      const schema = z.object({
        bbox: z.object({
          north: z.number(),
          south: z.number(),
          east: z.number(),
          west: z.number()
        }),
        width: z.number().default(1280),
        height: z.number().default(1280),
        style: z.string().default('streets-v12'),
        format: z.enum(['png', 'jpg', 'webp']).default('png'),
        retina: z.boolean().default(true)
      });
      
      const { bbox, width, height, style, format, retina } = schema.parse(req.body);
      
      // Set request body for the Mapbox route handler
      req.body = {
        bbox,
        width,
        height,
        style,
        format,
        retina
      };
      
      // Call the existing handler
      await generateHighResMapRoute(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating bounding box map:", error);
      res.status(500).json({ message: "Failed to generate map with bounding box" });
    }
  });

  // Shopify API Proxy Endpoints
  // Test Shopify connection
  app.post("/api/shopify/test-connection", async (req, res) => {
    try {
      const config = shopifyConfigSchema.parse(req.body);
      
      const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
      
      const query = `
        query testProductVariant($variantId: ID!) {
          node(id: $variantId) {
            ... on ProductVariant {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              product {
                id
                title
              }
            }
          }
        }
      `;
      
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
        },
        body: JSON.stringify({ 
          query, 
          variables: { variantId: config.productVariantId } 
        })
      });
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      if (data.errors) {
        return res.status(400).json({
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        });
      }
      
      if (!data.data.node) {
        return res.status(404).json({
          success: false,
          error: 'Product variant not found. Please check the variant ID.'
        });
      }
      
      const variant = data.data.node;
      if (!variant.availableForSale) {
        return res.status(400).json({
          success: false,
          error: 'Product variant is not available for sale.'
        });
      }
      
      res.json({
        success: true,
        variant: {
          id: variant.id,
          title: variant.title,
          price: variant.price,
          product: variant.product
        }
      });
    } catch (error) {
      console.error('Error testing Shopify connection:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Find products in Shopify store
  app.post("/api/shopify/find-products", async (req, res) => {
    try {
      const config = shopifyConfigSchema.parse(req.body);
      
      const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
      
      const query = `
        query getProducts {
          products(first: 20) {
            edges {
              node {
                id
                title
                handle
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      availableForSale
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      if (data.errors) {
        return res.status(400).json({
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        });
      }
      
      const products = data.data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        variants: edge.node.variants.edges.map((variantEdge: any) => ({
          id: variantEdge.node.id,
          title: variantEdge.node.title,
          price: variantEdge.node.price,
          availableForSale: variantEdge.node.availableForSale
        }))
      }));
      
      res.json({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error finding Shopify products:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Add to Shopify cart with automatic image generation
  app.post("/api/shopify/add-to-cart", async (req, res) => {
    try {
      const schema = z.object({
        config: shopifyConfigSchema,
        mapData: customMapDataSchema,
        cartId: z.string().optional(),
        // Image data from client for backend processing
        imageData: z.string().optional() // base64 image data
      });
      
      const { config, mapData, cartId, imageData } = schema.parse(req.body);
      
      let imageUrl = '';
      let imageFilename = '';
      let imageSizeMB = 0;
      
      // Process image if provided
      if (imageData) {
        try {
          console.log('Processing image data for cart...');
          
          // Generate filename with Shopify order number format (Order12345_Map.jpeg)
          // For now, use timestamp-based ID; in production, this would be the actual Shopify order number
          const orderId = `Order${Date.now()}`;
          imageFilename = `${orderId}_Map.jpeg`; // Exact specification format
          
          // Convert base64 to buffer
          const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Create public/images directory if it doesn't exist
          
          const publicDir = path.join(process.cwd(), 'public');
          const imagesDir = path.join(publicDir, 'images');
          
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
          }
          
          // Save file to public/images
          const filePath = path.join(imagesDir, imageFilename);
          fs.writeFileSync(filePath, buffer);
          
          // Set image URL and size
          imageUrl = `/images/${imageFilename}`;
          imageSizeMB = buffer.length / (1024 * 1024);
          
          console.log(`Image saved: ${imageFilename} (${imageSizeMB.toFixed(1)}MB)`);
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          // Continue with cart creation even if image fails
        }
      }
      
      const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
      
      // Create line item attributes with map data and image
      const attributes = [
        { key: "Map Location", value: mapData.location.searchQuery },
        { key: "Coordinates", value: mapData.location.coordinates },
        { key: "City", value: mapData.location.city },
        { key: "Country", value: mapData.location.country },
        { key: "Zoom Level", value: mapData.location.zoom.toString() },
        { key: "Product Shape", value: mapData.productSettings.shape },
        { key: "Product Size", value: mapData.productSettings.size },
        { key: "Material", value: mapData.productSettings.material },
        { key: "Price", value: `$${mapData.price.toFixed(2)}` },
        { key: "Custom Text Count", value: mapData.customizations.texts.length.toString() },
        ...mapData.customizations.texts.map((text, index) => ({
          key: `Text ${index + 1}`,
          value: `"${text.content}" (${text.fontSize}px ${text.fontFamily}, ${text.color})`
        })),
        { key: "Custom Icon Count", value: mapData.customizations.icons.length.toString() },
        ...mapData.customizations.icons.map((icon, index) => ({
          key: `Icon ${index + 1}`,
          value: `${icon.type} (size: ${icon.size})`
        })),
        ...(mapData.customizations.compass ? [{
          key: "Compass",
          value: `${mapData.customizations.compass.type} (size: ${mapData.customizations.compass.size})`
        }] : []),
        // Include image information if available
        ...(imageUrl ? [
          { key: "Generated Image", value: imageUrl },
          { key: "Image Filename", value: imageFilename },
          { key: "Image Size", value: `${imageSizeMB.toFixed(1)}MB` }
        ] : []),
        { key: "_map_config_json", value: JSON.stringify(mapData) },
        { key: "_generated_timestamp", value: new Date().toISOString() }
      ].filter(attr => attr.value && attr.value.trim() !== "");
      
      const mutation = cartId ? 
        // Add to existing cart
        `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              id
              checkoutUrl
              totalQuantity
              lines(first: 10) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                    attributes {
                      key
                      value
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }` :
        // Create new cart
        `mutation cartCreate($input: CartInput) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
              totalQuantity
              lines(first: 10) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                    attributes {
                      key
                      value
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }`;
      
      const variables = cartId ? 
        {
          cartId,
          lines: [{
            quantity: 1,
            merchandiseId: config.productVariantId,
            attributes
          }]
        } :
        {
          input: {
            lines: [{
              quantity: 1,
              merchandiseId: config.productVariantId,
              attributes
            }]
          }
        };
      
      console.log('Shopify API Request:', {
        url: shopifyUrl,
        cartId: cartId || 'new cart',
        productVariantId: config.productVariantId,
        attributesCount: attributes.length
      });
      
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
        },
        body: JSON.stringify({ query: mutation, variables })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify API Error:', errorText);
        return res.status(response.status).json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        });
      }
      
      const data = await response.json();
      console.log('Shopify API Response:', data);
      
      if (data.errors) {
        console.error('GraphQL Errors:', data.errors);
        return res.status(400).json({
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        });
      }
      
      const result = cartId ? data.data?.cartLinesAdd : data.data?.cartCreate;
      
      if (!result) {
        return res.status(500).json({
          success: false,
          error: 'No result data received from Shopify API'
        });
      }
      
      if (result.userErrors && result.userErrors.length > 0) {
        console.error('Shopify User Errors:', result.userErrors);
        return res.status(400).json({
          success: false,
          error: `Shopify validation errors: ${result.userErrors.map((error: any) => `${error.field}: ${error.message}`).join(', ')}`
        });
      }
      
      res.json({
        success: true,
        cart: result.cart,
        checkoutUrl: result.cart.checkoutUrl
      });
    } catch (error) {
      console.error('Error adding to Shopify cart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Get cart status (for debugging and cart persistence)
  app.post("/api/shopify/get-cart", async (req, res) => {
    try {
      const schema = z.object({
        config: shopifyConfigSchema,
        cartId: z.string()
      });
      
      const { config, cartId } = schema.parse(req.body);
      
      const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
      
      const query = `
        query getCart($cartId: ID!) {
          cart(id: $cartId) {
            id
            checkoutUrl
            totalQuantity
            lines(first: 50) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                  attributes {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
        },
        body: JSON.stringify({ query, variables: { cartId } })
      });
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      }
      
      const data = await response.json();
      
      if (data.errors) {
        return res.status(400).json({
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        });
      }
      
      res.json({
        success: true,
        cart: data.data.cart
      });
    } catch (error) {
      console.error('Error getting Shopify cart:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Comprehensive health check for Shopify integration
  app.post("/api/shopify/health-check", async (req, res) => {
    try {
      const config = shopifyConfigSchema.parse(req.body);
      
      const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
      
      const results = {
        storeAccess: false,
        tokenValid: false,
        productExists: false,
        productAvailable: false,
        cartCreation: false,
        errors: [] as string[]
      };
      
      // Test 1: Basic store access
      try {
        const basicQuery = `{ shop { id name } }`;
        const response = await fetch(shopifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
          },
          body: JSON.stringify({ query: basicQuery })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (!data.errors && data.data?.shop) {
            results.storeAccess = true;
            results.tokenValid = true;
          } else if (data.errors) {
            results.errors.push(`Store access failed: ${data.errors.map((e: any) => e.message).join(', ')}`);
          }
        } else {
          results.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        results.errors.push(`Store access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 2: Product variant check
      if (results.tokenValid) {
        try {
          const productQuery = `
            query testProductVariant($variantId: ID!) {
              node(id: $variantId) {
                ... on ProductVariant {
                  id
                  title
                  availableForSale
                  product { id title }
                }
              }
            }
          `;
          
          const response = await fetch(shopifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
            },
            body: JSON.stringify({ 
              query: productQuery, 
              variables: { variantId: config.productVariantId } 
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (!data.errors && data.data?.node) {
              results.productExists = true;
              results.productAvailable = data.data.node.availableForSale;
            }
          }
        } catch (error) {
          results.errors.push(`Product check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      const allTestsPassed = results.storeAccess && results.tokenValid && results.productExists && results.productAvailable;
      
      res.json({
        success: allTestsPassed,
        results,
        summary: {
          ready: allTestsPassed,
          message: allTestsPassed ? 'All systems ready for add to cart!' : 'Some issues need to be resolved'
        }
      });
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
