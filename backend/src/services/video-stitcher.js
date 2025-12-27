/**
 * Video Stitching Service
 *
 * Uses ffmpeg to concatenate scene videos into final rendered video
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const fetch = require('node-fetch');
const storage = require('./storage');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

class VideoStitcher {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Download a video file from URL to local temp directory
   */
  async downloadVideo(url, filename) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${url}`);
    }

    const buffer = await response.buffer();
    const filePath = path.join(this.tempDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Create ffmpeg concat demuxer file
   */
  async createConcatFile(videoPaths, concatFilePath) {
    const content = videoPaths
      .map(videoPath => `file '${videoPath}'`)
      .join('\n');
    await writeFile(concatFilePath, content);
    return concatFilePath;
  }

  /**
   * Stitch multiple videos together
   * @param {Array} scenes - Array of scene objects with videoUrl
   * @param {Object} settings - Rendering settings (music, transitions, etc.)
   * @param {String} projectName - Name of the project
   * @returns {String} - URL of the final stitched video
   */
  async stitchVideos(scenes, settings = {}, projectName = 'project') {
    const jobId = `render_${Date.now()}`;
    const downloadedVideos = [];

    try {
      console.log(`[VideoStitcher] Starting render job: ${jobId}`);
      console.log(`[VideoStitcher] Scenes to stitch: ${scenes.length}`);

      // 1. Download all scene videos
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (!scene.videoUrl) {
          throw new Error(`Scene ${scene.sequenceNumber} has no video URL`);
        }

        console.log(`[VideoStitcher] Downloading scene ${scene.sequenceNumber}...`);
        const filename = `${jobId}_scene_${scene.sequenceNumber}.mp4`;
        const localPath = await this.downloadVideo(scene.videoUrl, filename);
        downloadedVideos.push(localPath);
      }

      // 2. Create concat demuxer file
      const concatFilePath = path.join(this.tempDir, `${jobId}_concat.txt`);
      await this.createConcatFile(downloadedVideos, concatFilePath);
      console.log(`[VideoStitcher] Concat file created: ${concatFilePath}`);

      // 3. Render final video using ffmpeg
      const outputFilename = `${jobId}_final.mp4`;
      const outputPath = path.join(this.tempDir, outputFilename);

      await this.renderVideo(concatFilePath, outputPath, settings);
      console.log(`[VideoStitcher] Video rendered: ${outputPath}`);

      // 4. Upload to storage
      console.log(`[VideoStitcher] Uploading to storage...`);
      const videoBuffer = fs.readFileSync(outputPath);
      const base64Video = videoBuffer.toString('base64');
      const finalFilename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_final_${Date.now()}.mp4`;

      const videoUrl = await storage.upload(
        base64Video,
        finalFilename,
        'videos',
        'video/mp4'
      );

      console.log(`[VideoStitcher] Upload complete: ${videoUrl}`);

      // 5. Cleanup temp files
      await this.cleanup([...downloadedVideos, concatFilePath, outputPath]);

      return videoUrl;

    } catch (error) {
      console.error('[VideoStitcher] Error:', error);
      // Cleanup on error
      await this.cleanup([...downloadedVideos]);
      throw error;
    }
  }

  /**
   * Render video using ffmpeg
   */
  renderVideo(concatFilePath, outputPath, settings = {}) {
    return new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',        // H.264 codec
          '-preset medium',      // Encoding speed/quality balance
          '-crf 23',             // Quality (lower = better, 18-28 range)
          '-c:a aac',            // AAC audio codec
          '-b:a 128k',           // Audio bitrate
          '-movflags +faststart' // Enable streaming
        ]);

      // Add background music if provided
      if (settings.backgroundMusicUrl) {
        command
          .input(settings.backgroundMusicUrl)
          .complexFilter([
            // Mix dialogue and music with volume levels
            `[0:a]volume=${(settings.dialogueVolume || 100) / 100}[dialogue]`,
            `[1:a]volume=${(settings.musicVolume || 30) / 100}[music]`,
            '[dialogue][music]amix=inputs=2:duration=first[aout]'
          ])
          .outputOptions(['-map 0:v', '-map [aout]']);
      }

      command
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('[ffmpeg] Command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`[ffmpeg] Progress: ${progress.percent?.toFixed(1)}%`);
        })
        .on('end', () => {
          console.log('[ffmpeg] Rendering complete');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('[ffmpeg] Error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
          console.log(`[VideoStitcher] Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.error(`[VideoStitcher] Failed to cleanup ${filePath}:`, error);
      }
    }
  }

  /**
   * Check if ffmpeg is available
   */
  async checkFfmpeg() {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.error('[VideoStitcher] ffmpeg not available:', err);
          resolve(false);
        } else {
          console.log('[VideoStitcher] ffmpeg is available');
          resolve(true);
        }
      });
    });
  }
}

module.exports = new VideoStitcher();
