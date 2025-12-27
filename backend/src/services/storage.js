/**
 * Storage Service
 *
 * Handles file storage with support for:
 * - Local file system (development)
 * - Vercel Blob (production)
 */

const fs = require('fs');
const path = require('path');

// Check if we're in production (Vercel)
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

class StorageService {
  constructor() {
    this.isProduction = isProduction;

    if (!this.isProduction) {
      // Ensure local upload directories exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const imagesDir = path.join(uploadsDir, 'images');
      const audioDir = path.join(uploadsDir, 'audio');

      [uploadsDir, imagesDir, audioDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
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

    if (this.isProduction) {
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
    if (this.isProduction) {
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
