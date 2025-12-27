/**
 * Storage Service
 *
 * Handles file storage with support for:
 * - Vercel Blob (preferred - always used when token available)
 * - Local file system (fallback when no cloud storage)
 */

const fs = require('fs');
const path = require('path');

// Use Vercel Blob if token is available, regardless of environment
// This ensures files are accessible from both local and production
const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
const useCloudStorage = hasBlobToken;

class StorageService {
  constructor() {
    this.useCloudStorage = useCloudStorage;

    if (!this.useCloudStorage) {
      console.log('[Storage] No BLOB_READ_WRITE_TOKEN found, using local storage');
      // Ensure local upload directories exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const imagesDir = path.join(uploadsDir, 'images');
      const audioDir = path.join(uploadsDir, 'audio');

      [uploadsDir, imagesDir, audioDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    } else {
      console.log('[Storage] Using Vercel Blob cloud storage');
    }
  }

  /**
   * Upload a file (buffer or base64) to storage
   * @param {Buffer|string} data - File data (Buffer or base64 string)
   * @param {string} filename - Desired filename
   * @param {string} folder - Folder path (e.g., 'images', 'audio')
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} Public URL of uploaded file
   */
  async upload(data, filename, folder = 'images', contentType = 'image/jpeg') {
    // Convert base64 to buffer if needed
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');

    if (this.useCloudStorage) {
      return this.uploadToVercelBlob(buffer, filename, folder, contentType);
    } else {
      return this.uploadToLocal(buffer, filename, folder);
    }
  }

  /**
   * Upload to Vercel Blob
   */
  async uploadToVercelBlob(buffer, filename, folder, contentType) {
    const { put } = require('@vercel/blob');

    const pathname = `${folder}/${filename}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false
    });

    return blob.url;
  }

  /**
   * Upload to local file system
   */
  async uploadToLocal(buffer, filename, folder) {
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    const filePath = path.join(uploadsDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);

    // Return relative URL for local development
    return `/uploads/${folder}/${filename}`;
  }

  /**
   * Delete a file from storage
   * @param {string} url - The file URL to delete
   */
  async delete(url) {
    if (this.useCloudStorage) {
      return this.deleteFromVercelBlob(url);
    } else {
      return this.deleteFromLocal(url);
    }
  }

  /**
   * Delete from Vercel Blob
   */
  async deleteFromVercelBlob(url) {
    try {
      const { del } = require('@vercel/blob');
      await del(url);
      return true;
    } catch (error) {
      console.error('Failed to delete from Vercel Blob:', error);
      return false;
    }
  }

  /**
   * Delete from local file system
   */
  async deleteFromLocal(url) {
    try {
      // Convert URL path to file path
      const relativePath = url.replace(/^\//, '');
      const filePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete local file:', error);
      return false;
    }
  }

  /**
   * Get the full public URL for a file
   * @param {string} urlOrPath - The stored URL or path
   * @returns {string} Full public URL
   */
  getPublicUrl(urlOrPath) {
    if (!urlOrPath) return null;

    // Already a full URL
    if (urlOrPath.startsWith('http')) {
      return urlOrPath;
    }

    // Local path - prepend backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}${urlOrPath}`;
  }
}

module.exports = new StorageService();
