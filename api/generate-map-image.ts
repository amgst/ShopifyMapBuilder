import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}