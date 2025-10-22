/**
 * Document Storage Service
 * Handles file uploads for credentialing documents
 * Supports multiple storage backends: Local, Supabase, AWS S3
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Supported file types for credentialing documents
export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Storage backend types
export type StorageBackend = 'local' | 'supabase' | 's3';

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface StorageConfig {
  backend: StorageBackend;
  localPath?: string; // For local storage
  supabaseUrl?: string; // For Supabase storage
  supabaseKey?: string;
  s3Bucket?: string; // For S3 storage
  s3Region?: string;
}

/**
 * Document Storage Service
 * Abstracts file storage operations across different backends
 */
export class DocumentStorageService {
  private config: StorageConfig;
  private uploadsDir: string;

  constructor(config?: Partial<StorageConfig>) {
    // Default to local storage in development, configurable for production
    this.config = {
      backend: (process.env.STORAGE_BACKEND as StorageBackend) || 'local',
      localPath: process.env.UPLOADS_PATH || './uploads',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      s3Bucket: process.env.S3_BUCKET,
      s3Region: process.env.AWS_REGION,
      ...config,
    };

    this.uploadsDir = path.resolve(this.config.localPath || './uploads');
  }

  /**
   * Validate file type and size
   */
  validateFile(file: { mimetype: string; size: number }): { valid: boolean; error?: string } {
    // Check file type
    if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: PDF, JPG, PNG, GIF, DOC, DOCX`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload file to configured storage backend
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    therapistId: string
  ): Promise<UploadResult> {
    switch (this.config.backend) {
      case 'local':
        return this.uploadToLocal(file, fileName, mimeType, therapistId);
      case 'supabase':
        return this.uploadToSupabase(file, fileName, mimeType, therapistId);
      case 's3':
        return this.uploadToS3(file, fileName, mimeType, therapistId);
      default:
        throw new Error(`Unsupported storage backend: ${this.config.backend}`);
    }
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(
    file: Buffer,
    fileName: string,
    mimeType: string,
    therapistId: string
  ): Promise<UploadResult> {
    // Create uploads directory if it doesn't exist
    const therapistDir = path.join(this.uploadsDir, 'credentialing', therapistId);
    await fs.mkdir(therapistDir, { recursive: true });

    // Generate unique filename
    const ext = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || '';
    const uniqueFileName = `${randomUUID()}${ext}`;
    const filePath = path.join(therapistDir, uniqueFileName);

    // Write file to disk
    await fs.writeFile(filePath, file);

    // Return relative URL for serving
    const fileUrl = `/uploads/credentialing/${therapistId}/${uniqueFileName}`;

    return {
      fileUrl,
      fileName: uniqueFileName,
      fileSize: file.length,
      mimeType,
    };
  }

  /**
   * Upload to Supabase Storage
   */
  private async uploadToSupabase(
    file: Buffer,
    fileName: string,
    mimeType: string,
    therapistId: string
  ): Promise<UploadResult> {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
      throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    // TODO: Implement Supabase Storage upload
    // For now, fall back to local storage
    console.warn('Supabase Storage not yet implemented, using local storage');
    return this.uploadToLocal(file, fileName, mimeType, therapistId);

    /*
    // Future implementation:
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);

    const ext = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || '';
    const uniqueFileName = `${randomUUID()}${ext}`;
    const storagePath = `credentialing/${therapistId}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return {
      fileUrl: urlData.publicUrl,
      fileName: uniqueFileName,
      fileSize: file.length,
      mimeType,
    };
    */
  }

  /**
   * Upload to AWS S3
   */
  private async uploadToS3(
    file: Buffer,
    fileName: string,
    mimeType: string,
    therapistId: string
  ): Promise<UploadResult> {
    if (!this.config.s3Bucket || !this.config.s3Region) {
      throw new Error('S3 configuration missing. Set S3_BUCKET and AWS_REGION');
    }

    // TODO: Implement S3 upload
    // For now, fall back to local storage
    console.warn('S3 Storage not yet implemented, using local storage');
    return this.uploadToLocal(file, fileName, mimeType, therapistId);

    /*
    // Future implementation:
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({ region: this.config.s3Region });

    const ext = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || '';
    const uniqueFileName = `${randomUUID()}${ext}`;
    const s3Key = `credentialing/${therapistId}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    const fileUrl = `https://${this.config.s3Bucket}.s3.${this.config.s3Region}.amazonaws.com/${s3Key}`;

    return {
      fileUrl,
      fileName: uniqueFileName,
      fileSize: file.length,
      mimeType,
    };
    */
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string, therapistId: string): Promise<void> {
    switch (this.config.backend) {
      case 'local':
        return this.deleteFromLocal(fileUrl);
      case 'supabase':
        return this.deleteFromSupabase(fileUrl);
      case 's3':
        return this.deleteFromS3(fileUrl);
      default:
        throw new Error(`Unsupported storage backend: ${this.config.backend}`);
    }
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(fileUrl: string): Promise<void> {
    // Convert URL to file path
    // URL format: /uploads/credentialing/{therapistId}/{filename}
    const filePath = path.join(this.uploadsDir, fileUrl.replace('/uploads/', ''));

    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        // Ignore file not found, throw other errors
        throw error;
      }
    }
  }

  /**
   * Delete from Supabase Storage
   */
  private async deleteFromSupabase(fileUrl: string): Promise<void> {
    // TODO: Implement Supabase deletion
    console.warn('Supabase Storage deletion not yet implemented');
  }

  /**
   * Delete from AWS S3
   */
  private async deleteFromS3(fileUrl: string): Promise<void> {
    // TODO: Implement S3 deletion
    console.warn('S3 Storage deletion not yet implemented');
  }

  /**
   * Get file from storage (returns file buffer for download)
   */
  async getFile(fileUrl: string): Promise<Buffer> {
    switch (this.config.backend) {
      case 'local':
        return this.getFromLocal(fileUrl);
      case 'supabase':
        return this.getFromSupabase(fileUrl);
      case 's3':
        return this.getFromS3(fileUrl);
      default:
        throw new Error(`Unsupported storage backend: ${this.config.backend}`);
    }
  }

  /**
   * Get file from local filesystem
   */
  private async getFromLocal(fileUrl: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, fileUrl.replace('/uploads/', ''));
    return fs.readFile(filePath);
  }

  /**
   * Get file from Supabase Storage
   */
  private async getFromSupabase(fileUrl: string): Promise<Buffer> {
    // TODO: Implement Supabase file retrieval
    throw new Error('Supabase Storage retrieval not yet implemented');
  }

  /**
   * Get file from AWS S3
   */
  private async getFromS3(fileUrl: string): Promise<Buffer> {
    // TODO: Implement S3 file retrieval
    throw new Error('S3 Storage retrieval not yet implemented');
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService();
