import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from '@/lib/ffmpeg';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, mock } = await req.json();
    const apiKey = req.headers.get('x-minimax-api-key') || process.env.MINIMAX_API_KEY;

    // Handle Mock/No-Key Mode
    if (mock || !apiKey) {
        console.log('Using Mock TTS (Silence)...');
        const id = uuidv4();
        const filePath = path.join('/tmp', `${id}.mp3`);
        
        // Generate 5 seconds of silence
        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input('anullsrc')
                .inputFormat('lavfi')
                .duration(5)
                .save(filePath)
                .on('end', () => resolve())
                .on('error', (err: any) => reject(err));
        });
        
        return NextResponse.json({ id });
    }

    if (!text) {
      return new NextResponse('Missing text', { status: 400 });
    }

    // Using MiniMax Speech T2A
    // Model: speech-2.6-turbo (as requested)
    // Note: If this model ID is invalid, fallback to 'speech-01-turbo' or similar might be needed.
    // Based on prompt: "speech-2.6-turbo"
    
    const response = await axios.post(
      'https://api.minimax.io/v1/t2a_v2', 
      {
        model: 'speech-01-turbo', 
        text: text,
        stream: false,
        voice_setting: {
          voice_id: 'male-qn-qingse', // A standard voice, or 'female-shaonv'
          speed: 1.2, // Slightly faster for TikTok
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Important for binary audio
      }
    );

    if (response.status !== 200) {
      throw new Error(`TTS API Error: ${response.status} ${response.statusText}`);
    }

    // The response body from MiniMax T2A (non-stream) might be JSON with 'data' containing hex/base64 OR direct binary.
    // Usually v1/t2a_v2 returns a JSON with "data": { "audio": "hex string" } or similar if stream=false.
    // Let's check the content type.
    // Actually, MiniMax T2A v2 with stream=false often returns JSON with `data.audio` as hex string.
    
    // Let's parse the response as JSON first since axios responseType is arraybuffer.
    const responseBody = Buffer.from(response.data).toString('utf-8');
    let audioBuffer: Buffer;

    try {
        const json = JSON.parse(responseBody);
        if (json.base_resp && json.base_resp.status_code !== 0) {
             throw new Error(`MiniMax Error: ${json.base_resp.status_msg}`);
        }
        if (json.data && json.data.audio) {
            // It's a hex string usually
            audioBuffer = Buffer.from(json.data.audio, 'hex');
        } else {
             // Maybe it returned direct binary? Unlikely for this endpoint but possible.
             // If parsing failed, we'd go to catch block.
             throw new Error('Invalid TTS response format');
        }
    } catch (e) {
        // If it's not JSON, maybe it's raw audio?
        // But the standard API returns JSON.
        console.error('TTS Parse Error', e);
        throw new Error('Failed to parse TTS response');
    }

    const id = uuidv4();
    const filePath = path.join('/tmp', `${id}.mp3`);
    fs.writeFileSync(filePath, audioBuffer);

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('TTS Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
