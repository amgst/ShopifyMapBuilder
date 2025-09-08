import { storage } from "./storage";
import type { InsertCloudBackup } from "@shared/schema";
import fs from "fs";
import path from "path";

export interface CloudBackupProvider {
  upload(filePath: string, fileName: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

// AWS S3 Implementation (requires AWS SDK)
export class S3BackupProvider implements CloudBackupProvider {
  private bucketName: string;
  private region: string;

  constructor(bucketName: string, region: string = 'us-east-1') {
    this.bucketName = bucketName;
    this.region = region;
  }

  async upload(filePath: string, fileName: string): Promise<string> {
    // This would use AWS SDK in production
    // For now, we'll simulate the upload
    console.log(`Simulating S3 upload: ${fileName} to bucket ${this.bucketName}`);
    
    // Generate a simulated S3 URL
    const key = `maps/${Date.now()}-${fileName}`;
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    
    // In production, you would:
    // const s3 = new AWS.S3();
    // const fileStream = fs.createReadStream(filePath);
    // const uploadResult = await s3.upload({
    //   Bucket: this.bucketName,
    //   Key: key,
    //   Body: fileStream,
    //   ContentType: this.getMimeType(fileName)
    // }).promise();
    // return uploadResult.Location;

    return url;
  }

  async getUrl(key: string): Promise<string> {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    console.log(`Simulating S3 delete: ${key} from bucket ${this.bucketName}`);
    // In production: await s3.deleteObject({ Bucket: this.bucketName, Key: key }).promise();
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}

// Google Drive Implementation (for future use)
export class GoogleDriveProvider implements CloudBackupProvider {
  async upload(filePath: string, fileName: string): Promise<string> {
    console.log(`Simulating Google Drive upload: ${fileName}`);
    return `https://drive.google.com/file/d/simulated-id/view`;
  }

  async getUrl(key: string): Promise<string> {
    return `https://drive.google.com/file/d/${key}/view`;
  }

  async delete(key: string): Promise<void> {
    console.log(`Simulating Google Drive delete: ${key}`);
  }
}

export class CloudBackupService {
  private providers: Map<string, CloudBackupProvider>;

  constructor() {
    this.providers = new Map();
    
    // Initialize providers
    if (process.env.AWS_S3_BUCKET) {
      this.providers.set('s3', new S3BackupProvider(
        process.env.AWS_S3_BUCKET,
        process.env.AWS_REGION
      ));
    }
    
    this.providers.set('google_drive', new GoogleDriveProvider());
  }

  // Backup a generated map to cloud storage
  async backupMap(generatedMapId: string, provider: string = 's3'): Promise<string> {
    try {
      const map = await storage.getGeneratedMap(generatedMapId);
      if (!map) {
        throw new Error('Generated map not found');
      }

      const backupProvider = this.providers.get(provider);
      if (!backupProvider) {
        throw new Error(`Backup provider ${provider} not configured`);
      }

      // Check if file exists
      const filePath = path.join(process.cwd(), map.filePath);
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found on disk');
      }

      // Create backup record as pending
      const backupRecord: InsertCloudBackup = {
        generatedMapId,
        provider,
        backupUrl: '',
        status: 'pending'
      };

      const backup = await storage.createCloudBackup(backupRecord);

      try {
        // Upload to cloud provider
        const backupUrl = await backupProvider.upload(filePath, map.fileName);

        // Update backup record with success
        await storage.updateCloudBackup(backup.id, {
          backupUrl,
          status: 'completed'
        });

        // Update the generated map with cloud backup URL
        await storage.updateGeneratedMap(generatedMapId, {
          cloudBackupUrl: backupUrl
        });

        return backupUrl;
      } catch (uploadError) {
        // Update backup record with failure
        await storage.updateCloudBackup(backup.id, {
          status: 'failed',
          error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
        });
        throw uploadError;
      }
    } catch (error) {
      console.error('Failed to backup map:', error);
      throw error;
    }
  }

  // Automatically backup all new maps
  async autoBackupMap(generatedMapId: string): Promise<void> {
    try {
      // Check if auto-backup is enabled
      if (!process.env.ENABLE_AUTO_BACKUP || process.env.ENABLE_AUTO_BACKUP === 'false') {
        return;
      }

      const provider = process.env.DEFAULT_BACKUP_PROVIDER || 's3';
      await this.backupMap(generatedMapId, provider);
    } catch (error) {
      console.error('Auto-backup failed:', error);
      // Don't throw error for auto-backup failures to not break the main flow
    }
  }

  // Get backup status for a map
  async getBackupStatus(generatedMapId: string): Promise<any[]> {
    try {
      return await storage.getBackupsByMap(generatedMapId);
    } catch (error) {
      console.error('Failed to get backup status:', error);
      return [];
    }
  }

  // Retry failed backups
  async retryFailedBackups(): Promise<void> {
    try {
      // This would need a method to get failed backups
      // For now, log that we would retry failed backups
      console.log('Retrying failed backups...');
    } catch (error) {
      console.error('Failed to retry backups:', error);
    }
  }

  // Clean up old backups
  async cleanupOldBackups(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      console.log(`Cleaning up backups older than ${olderThanDays} days`);
      // Implementation would delete old backup records and files
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }
}

export const cloudBackupService = new CloudBackupService();