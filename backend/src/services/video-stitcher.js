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
    const tempFiles = [];

    try {
      console.log(`[VideoStitcher] Starting render job: ${jobId}`);
      console.log(`[VideoStitcher] Scenes to stitch: ${scenes.length}`);
      console.log(`[VideoStitcher] Settings:`, settings);

      // 1. Create title card if requested
      if (settings.addTitleCard && settings.titleText) {
        console.log(`[VideoStitcher] Creating title card...`);
        const titlePath = await this.createTitleCard(settings.titleText, 3);
        downloadedVideos.push(titlePath);
        tempFiles.push(titlePath);
      }

      // 2. Download all scene videos
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (!scene.videoUrl) {
          throw new Error(`Scene ${scene.sequenceNumber} has no video URL`);
        }

        console.log(`[VideoStitcher] Downloading scene ${scene.sequenceNumber}...`);
        const filename = `${jobId}_scene_${scene.sequenceNumber}.mp4`;
        const localPath = await this.downloadVideo(scene.videoUrl, filename);
        downloadedVideos.push(localPath);
        tempFiles.push(localPath);
      }

      // 3. Create end credits if requested
      if (settings.addCredits && settings.creditsText) {
        console.log(`[VideoStitcher] Creating end credits...`);
        const creditsPath = await this.createCredits(settings.creditsText, 5);
        downloadedVideos.push(creditsPath);
        tempFiles.push(creditsPath);
      }

      // 4. Render final video using ffmpeg with transitions
      const outputFilename = `${jobId}_final.mp4`;
      const outputPath = path.join(this.tempDir, outputFilename);

      console.log(`[VideoStitcher] Rendering with ${settings.transition || 'no'} transitions...`);
      await this.renderVideo(downloadedVideos, outputPath, settings);
      console.log(`[VideoStitcher] Video rendered: ${outputPath}`);
      tempFiles.push(outputPath);

      // 5. Upload to storage
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

      // 6. Cleanup temp files
      await this.cleanup(tempFiles);

      return videoUrl;

    } catch (error) {
      console.error('[VideoStitcher] Error:', error);
      // Cleanup on error
      await this.cleanup(tempFiles);
      throw error;
    }
  }

  /**
   * Create title card video clip
   */
  async createTitleCard(text, duration = 3) {
    const outputPath = path.join(this.tempDir, `title_${Date.now()}.mp4`);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=c=black:s=1920x1080:d=${duration}`)
        .inputOptions(['-f lavfi'])
        .outputOptions([
          `-vf drawtext=text='${text.replace(/'/g, "\\'")}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Helvetica.ttc`,
          '-c:v libx264',
          '-t', `${duration}`,
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => {
          console.error('[TitleCard] Error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Create credits video clip
   */
  async createCredits(text, duration = 5) {
    const outputPath = path.join(this.tempDir, `credits_${Date.now()}.mp4`);

    // Split credits text into lines and escape quotes
    const creditsText = text.split('\n').join('\\n').replace(/'/g, "\\'");

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=c=black:s=1920x1080:d=${duration}`)
        .inputOptions(['-f lavfi'])
        .outputOptions([
          `-vf drawtext=text='${creditsText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Helvetica.ttc`,
          '-c:v libx264',
          '-t', `${duration}`,
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error) => {
          console.error('[Credits] Error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Render video using ffmpeg with transitions support
   */
  async renderVideo(videoPaths, outputPath, settings = {}) {
    const transition = settings.transition || 'none';
    const transitionDuration = 0.5; // 0.5 seconds

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add all video inputs
      videoPaths.forEach(videoPath => {
        command.input(videoPath);
      });

      // Build filter complex for transitions
      let filterComplex = [];
      let lastOutput = '[0:v]';

      if (transition !== 'none' && videoPaths.length > 1) {
        // Build xfade filter chain for transitions
        for (let i = 0; i < videoPaths.length - 1; i++) {
          const nextInput = `[${i + 1}:v]`;
          const outputLabel = i === videoPaths.length - 2 ? '[outv]' : `[v${i}]`;

          // Calculate offset (each video is ~6 seconds, subtract transition duration)
          const offset = (i + 1) * 6 - transitionDuration;

          const transitionType = transition === 'fade' ? 'fade' : 'dissolve';
          filterComplex.push(
            `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`
          );

          lastOutput = outputLabel;
        }
      } else {
        // No transitions - just concatenate
        const inputs = videoPaths.map((_, i) => `[${i}:v]`).join('');
        filterComplex.push(`${inputs}concat=n=${videoPaths.length}:v=1:a=0[outv]`);
      }

      // Audio handling
      const audioInputs = videoPaths.map((_, i) => `[${i}:a]`).join('');
      filterComplex.push(`${audioInputs}concat=n=${videoPaths.length}:v=0:a=1[outa]`);

      // Add background music if provided
      if (settings.backgroundMusicUrl) {
        command.input(settings.backgroundMusicUrl);
        const musicIndex = videoPaths.length;

        filterComplex.push(
          `[outa]volume=${(settings.dialogueVolume || 100) / 100}[dialogue]`,
          `[${musicIndex}:a]volume=${(settings.musicVolume || 30) / 100}[music]`,
          '[dialogue][music]amix=inputs=2:duration=first[aout]'
        );
      } else {
        filterComplex.push('[outa]volume=1[aout]');
      }

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map [outv]',
          '-map [aout]',
          '-c:v libx264',
          '-preset medium',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
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
