import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Correct endpoint per official docs (https://docs.dev.runwayml.com/)
const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { imageUrl, prompt, durationSeconds = 5, source = 'unknown' } = await req.json();
    
    // Get key from env or header (for flexibility)
    const apiKey = process.env.RUNWAY_API_KEY || req.headers.get('x-runway-api-key');

    if (!apiKey) {
      // If no key, return failure immediately so we fall back
      return NextResponse.json({ success: false, reason: 'Missing RUNWAY_API_KEY' }, { status: 200 });
    }

    console.log(`Using Runway Key: ${apiKey.substring(0, 4)}... (Length: ${apiKey.length})`);

    if (!imageUrl || !prompt) {
      return NextResponse.json({ success: false, reason: 'Missing image or prompt' }, { status: 400 });
    }

    console.log('Starting Runway generation...', { 
      promptLength: prompt.length, 
      source, 
      promptSnippet: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      durationSeconds 
    });

    // 1. Initiate Generation
    // Using gen3a_turbo for speed/quality balance. 768:1280 is the supported vertical resolution.
    const createRes = await axios.post(
      `${RUNWAY_API_BASE}/image_to_video`,
      {
        model: 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: prompt,
        ratio: '768:1280',
        duration: 5, // Runway usually supports 5 or 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Runway-Version': RUNWAY_VERSION,
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    const taskId = createRes.data.id;
    if (!taskId) throw new Error('No task ID returned from Runway');
    console.log('Runway Task ID:', taskId);

    // 2. Poll Status (Max 60s)
    let videoUrl = '';
    const startTime = Date.now();
    const TIMEOUT_MS = 60000;

    while (Date.now() - startTime < TIMEOUT_MS) {
      await sleep(2000); // Poll every 2s

      const statusRes = await axios.get(
        `${RUNWAY_API_BASE}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Runway-Version': RUNWAY_VERSION,
          },
        }
      );

      const status = statusRes.data.status; // PENDING, RUNNING, SUCCEEDED, FAILED
      console.log('Runway Status:', status);

      if (status === 'SUCCEEDED') {
        videoUrl = statusRes.data.output?.[0];
        break;
      } else if (status === 'FAILED') {
        throw new Error(`Runway task failed: ${statusRes.data.failureCode || 'Unknown'}`);
      }
    }

    if (!videoUrl) {
      throw new Error('Runway generation timed out (60s)');
    }

    // 3. Download Video
    const id = uuidv4();
    const videoStream = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const filePath = path.join('/tmp', `${id}.mp4`);
    fs.writeFileSync(filePath, videoStream.data);

    return NextResponse.json({ success: true, id, videoPath: filePath });

  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    console.error('Runway API Error:', errorData);
    
    // Return success: false to trigger fallback in frontend
    return NextResponse.json({ 
      success: false, 
      reason: errorData?.error || error.message || 'Unknown error' 
    });
  }
}
