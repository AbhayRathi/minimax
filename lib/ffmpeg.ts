import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

let validPath = ffmpegStatic;

console.log('Initial ffmpeg-static path:', validPath);

// Robust path detection
if (!validPath || !fs.existsSync(validPath)) {
    console.warn('Initial FFmpeg path not found or invalid. Attempting manual resolution...');
    
    // Common locations
    const candidates = [
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'), // macOS/Linux
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'), // Windows
        path.join(process.cwd(), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg'), // Monorepo parent
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            validPath = candidate;
            console.log('Found FFmpeg at:', validPath);
            break;
        }
    }
}

if (validPath && fs.existsSync(validPath)) {
    ffmpeg.setFfmpegPath(validPath);
    console.log('FFmpeg path set to:', validPath);
} else {
    console.error('CRITICAL: FFmpeg binary not found in any standard location!');
    // Fallback: assume it's in PATH
    // ffmpeg.setFfmpegPath('ffmpeg');
}

export default ffmpeg;
