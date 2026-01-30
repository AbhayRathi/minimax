import { NextResponse } from 'next/server';
import ffmpeg from '@/lib/ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Beat } from '@/lib/types';

export const maxDuration = 300;

function generateSRT(beats: Beat[]): string {
  return beats.map((beat, index) => {
    const start = formatTime(beat.t_start);
    const end = formatTime(beat.t_end);
    return `${index + 1}\n${start} --> ${end}\n${beat.text}\n`;
  }).join('\n');
}

function formatTime(seconds: number): string {
  const date = new Date(0);
  date.setMilliseconds(seconds * 1000);
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

export async function POST(req: Request) {
  try {
    const { beats, videoId, audioId } = await req.json();

    if (!beats || !videoId || !audioId) {
      return new NextResponse('Missing requirements', { status: 400 });
    }

    const videoPath = path.join('/tmp', `${videoId}.mp4`);
    const audioPath = path.join('/tmp', `${audioId}.mp3`);
    
    if (!fs.existsSync(videoPath) || !fs.existsSync(audioPath)) {
      return new NextResponse('Assets not found', { status: 404 });
    }

    const id = uuidv4();
    const srtPath = path.join('/tmp', `${id}.srt`);
    const outputPath = path.join('/tmp', `${id}_final.mp4`);

    // 1. Write SRT
    const srtContent = generateSRT(beats);
    fs.writeFileSync(srtPath, srtContent);

    // 2. FFmpeg Processing
    // Complex filter:
    // - Scale and Crop to 1080x1920 (Vertical)
    // - Burn subtitles
    
    // We need to escape the path for the subtitles filter
    // On Windows/Linux/Mac paths can be tricky in ffmpeg filters.
    // Simplest is to use relative path if CWD is set, but we are in /tmp.
    // Let's try absolute path with forward slashes and escaped colons.
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .inputOptions(['-stream_loop', '-1']) // Loop video
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-shortest', // Stop when shortest stream ends (audio, since video is looped)
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-pix_fmt', 'yuv420p' // Ensure compatibility
        ])
        .complexFilter([
          `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vscaled]`,
          `[vscaled]subtitles='${escapedSrtPath}':force_style='Fontname=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=1,Shadow=0,MarginV=60'[vfinal]`
        ], 'vfinal')
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => {
          console.error('FFmpeg Error:', err);
          reject(err);
        });
    });

    // 3. Return the file
    const fileBuffer = fs.readFileSync(outputPath);
    
    // Cleanup (Optional, but good practice)
    // fs.unlinkSync(videoPath);
    // fs.unlinkSync(audioPath);
    // fs.unlinkSync(srtPath);
    // fs.unlinkSync(outputPath); // We read it into buffer, so we can delete it. 
    // Actually, keep them for debugging if needed, or rely on OS temp cleanup.

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="tiktok_${id}.mp4"`,
      },
    });

  } catch (error: any) {
    console.error('Render API Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
