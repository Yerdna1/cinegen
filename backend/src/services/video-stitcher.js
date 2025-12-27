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
   * Create title card video clip with silent audio
   */
  async createTitleCard(text, duration = 3) {
    const outputPath = path.join(this.tempDir, `title_${Date.now()}.mp4`);
    const fontPath = '/System/Library/Fonts/Supplemental/Arial.ttf'; // More universal font

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=c=black:s=1920x1080:d=${duration}`)
        .inputOptions(['-f lavfi'])
        .input(`anullsrc=channel_layout=stereo:sample_rate=44100:duration=${duration}`)
        .inputOptions(['-f lavfi'])
        .outputOptions([
          `-vf drawtext=text='${text.replace(/'/g, "\\'")}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=${fontPath}`,
          '-c:v libx264',
          '-c:a aac',
          '-shortest',
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('[TitleCard] ffmpeg command:', cmd);
        })
        .on('end', () => {
          console.log('[TitleCard] Created successfully');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('[TitleCard] Error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Create credits video clip with silent audio
   */
  async createCredits(text, duration = 5) {
    const outputPath = path.join(this.tempDir, `credits_${Date.now()}.mp4`);
    const fontPath = '/System/Library/Fonts/Supplemental/Arial.ttf';

    // Split credits text into lines and escape quotes
    const creditsText = text.split('\n').join('\\n').replace(/'/g, "\\'");

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(`color=c=black:s=1920x1080:d=${duration}`)
        .inputOptions(['-f lavfi'])
        .input(`anullsrc=channel_layout=stereo:sample_rate=44100:duration=${duration}`)
        .inputOptions(['-f lavfi'])
        .outputOptions([
          `-vf drawtext=text='${creditsText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=${fontPath}`,
          '-c:v libx264',
          '-c:a aac',
          '-shortest',
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('[Credits] ffmpeg command:', cmd);
        })
        .on('end', () => {
          console.log('[Credits] Created successfully');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('[Credits] Error:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Render video using concat demuxer (simple, reliable method)
   */
  async renderVideo(videoPaths, outputPath, settings = {}) {
    const concatFilePath = path.join(this.tempDir, `concat_${Date.now()}.txt`);

    try {
      // Create concat file
      await this.createConcatFile(videoPaths, concatFilePath);
      console.log('[ffmpeg] Created concat file:', concatFilePath);

      return new Promise((resolve, reject) => {
        let command = ffmpeg()
          .input(concatFilePath)
          .inputOptions(['-f concat', '-safe 0']);

        // Add background music if provided
        if (settings.backgroundMusicUrl) {
          command.input(settings.backgroundMusicUrl);

          const dialogueVolume = (settings.dialogueVolume || 100) / 100;
          const musicVolume = (settings.musicVolume || 30) / 100;

          command
            .complexFilter([
              `[0:a]volume=${dialogueVolume}[dialogue]`,
              `[1:a]volume=${musicVolume}[music]`,
              '[dialogue][music]amix=inputs=2:duration=first:dropout_transition=2[aout]'
            ])
            .outputOptions([
              '-map 0:v',
              '-map [aout]'
            ]);
        } else {
          command.outputOptions([
            '-c copy'
          ]);
        }

        command
          .outputOptions([
            '-c:v libx264',
            '-preset medium',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-movflags +faststart'
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('[ffmpeg] Command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log(`[ffmpeg] Progress: ${progress.percent?.toFixed(1)}%`);
          })
          .on('end', async () => {
            console.log('[ffmpeg] Rendering complete');
            // Cleanup concat file
            try {
              await unlink(concatFilePath);
            } catch (err) {
              console.error('[ffmpeg] Failed to cleanup concat file:', err);
            }
            resolve(outputPath);
          })
          .on('error', async (error) => {
            console.error('[ffmpeg] Error:', error);
            // Cleanup concat file
            try {
              await unlink(concatFilePath);
            } catch (err) {
              console.error('[ffmpeg] Failed to cleanup concat file:', err);
            }
            reject(error);
          })
          .run();
      });
    } catch (error) {
      console.error('[renderVideo] Error:', error);
      throw error;
    }
  }

  /**
   * Check if a video has an audio stream
   */
  async hasAudioStream(videoPath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error(`[VideoStitcher] Error probing ${videoPath}:`, err);
          resolve(false);
          return;
        }

        const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
        console.log(`[VideoStitcher] ${videoPath} has audio: ${hasAudio}`);
        resolve(hasAudio);
      });
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
