import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}