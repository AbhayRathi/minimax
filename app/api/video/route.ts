import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic as string);

const API_BASE = 'https://api.minimax.io/v1';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fallback: Generate Ken Burns video from image using FFmpeg
async function generateFallbackVideo(imageUrl: string, id: string): Promise<void> {
  console.log('Starting fallback video generation...');
  const imagePath = path.join('/tmp', `${id}_source.jpg`);
  const outputPath = path.join('/tmp', `${id}.mp4`);

  // 1. Download Image
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(imagePath, response.data);

  // 2. Generate Video
  // Simple zoom in effect (Ken Burns)
  // Duration: 6 seconds (standard TikTok short)
  // FPS: 30
  // Size: 1080x1920
  
  return new Promise((resolve, reject) => {
    ffmpeg(imagePath)
      .inputOptions(['-loop 1', '-t 6']) // Loop image for 6 seconds
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-t 6',
        '-r 30'
      ])
      .complexFilter([
        // Scale to sufficient size then zoom and crop to 1080x1920
        // Zoom from 1.0 to 1.1 over the duration
        // Centered
        `scale=-2:1920,zoompan=z='min(zoom+0.0015,1.5)':d=180:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`
      ])
      .save(outputPath)
      .on('end', () => {
        console.log('Fallback video generated');
        // Cleanup source
        // fs.unlinkSync(imagePath);
        resolve();
      })
      .on('error', (err) => {
        console.error('Fallback generation error:', err);
        reject(err);
      });
  });
}

export async function POST(req: Request) {
  try {
    const { imageUrl, prompt, fastMode } = await req.json();
    const apiKey = req.headers.get('x-minimax-api-key') || process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return new NextResponse('Missing API Key', { status: 401 });
    }

    if (!imageUrl || !prompt) {
      return new NextResponse('Missing image or prompt', { status: 400 });
    }
    
    const id = uuidv4();
    let useFallback = !!fastMode;

    // 1. Try MiniMax Video Generation (unless fastMode is true)
    if (!useFallback) {
      try {
        console.log('Attempting MiniMax Video Generation...');
        
        const createRes = await axios.post(
          `${API_BASE}/video_generation`,
          {
            model: 'video-01',
            prompt: prompt,
            first_frame_image: imageUrl,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000 // 10s timeout for creation request
          }
        );

        if (createRes.status !== 200) {
          throw new Error(`Video Task Creation Failed: ${createRes.statusText}`);
        }

        const taskId = createRes.data.task_id;
        if (!taskId) throw new Error('No task_id returned');

        // 2. Poll Status
        let fileId = '';
        let attempts = 0;
        const maxAttempts = 45; // ~90s (2s interval)
        
        while (attempts < maxAttempts) {
          await sleep(2000);
          
          const statusRes = await axios.get(
            `${API_BASE}/query/video_generation?task_id=${taskId}`,
            {
              headers: { 'Authorization': `Bearer ${process.env.MINIMAX_API_KEY || apiKey}` },
            }
          );

          const status = statusRes.data.status;
          
          if (status === 'Success') {
            fileId = statusRes.data.file_id;
            break;
          } else if (status === 'Fail') {
            throw new Error('Video generation failed at provider');
          }
          
          attempts++;
        }

        if (!fileId) throw new Error('Video generation timed out');

        // 3. Download Video
        const fileRes = await axios.get(`${API_BASE}/files/retrieve?file_id=${fileId}`, {
             headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        const downloadUrl = fileRes.data.file?.download_url;
        if (!downloadUrl) throw new Error('No download URL');

        const videoStream = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const filePath = path.join('/tmp', `${id}.mp4`);
        fs.writeFileSync(filePath, videoStream.data);

        return NextResponse.json({ id });

      } catch (apiError) {
        console.warn('MiniMax Video Generation failed, switching to fallback:', apiError);
        useFallback = true;
      }
    }

    // FALLBACK: Generate Ken Burns video locally
    if (useFallback) {
      try {
        await generateFallbackVideo(imageUrl, id);
        return NextResponse.json({ id });
      } catch (fallbackError) {
        console.error('Fallback failed too:', fallbackError);
        throw new Error('Video generation and fallback failed');
      }
    }

    return new NextResponse('Unknown error', { status: 500 });

  } catch (error: any) {
    console.error('Video API Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
