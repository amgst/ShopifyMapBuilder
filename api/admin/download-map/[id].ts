import type { Request, Response } from "express";
import { storage } from "../../../server/storage";
import fs from "fs";
import path from "path";

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check admin access
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const mapId = req.params?.id as string;
    if (!mapId) {
      return res.status(400).json({ message: 'Map ID required' });
    }

    // Get the generated map record
    const generatedMap = await storage.getGeneratedMap(mapId);
    if (!generatedMap) {
      return res.status(404).json({ message: 'Map not found' });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), generatedMap.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Increment download count
    await storage.incrementDownloadCount(mapId);

    // Set headers for file download
    res.setHeader('Content-Type', generatedMap.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${generatedMap.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Failed to download map:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}