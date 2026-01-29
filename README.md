# MiniMax TikTok Generator

A 3-hour MVP to generate viral vertical videos using MiniMax AI models.

## Features

- **Planning**: Uses `MiniMax-M2.1-lightning` to generate viral hooks, scripts, and beats.
- **TTS**: Uses `MiniMax Speech T2A` (speech-01/speech-2.6-turbo) for fast voiceovers.
- **Video**: Uses `MiniMax Video Generation` (Hailuo fast) for image-to-video motion.
  - *Fallback*: Automatically falls back to a Ken Burns effect if video generation fails or times out.
- **Rendering**: Uses FFmpeg to burn captions, scale to 9:16, and mux audio.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file with your MiniMax API key:
   ```env
   MINIMAX_API_KEY=your_api_key_here
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Usage**:
   - Open `http://localhost:3000`.
   - Enter a prompt (e.g., "3 fun facts about cats") and an image URL.
   - Click "Generate Plan".
   - Select one of the 3 generated hooks.
   - Click "Create Video" and wait for the magic!

## Architecture

- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide React.
- **Backend API**:
  - `/api/plan`: OpenAI SDK compatible call to MiniMax LLM.
  - `/api/tts`: Direct HTTP call to MiniMax Speech API.
  - `/api/video`: Async task creation and polling for MiniMax Video API (with FFmpeg fallback).
  - `/api/render`: `fluent-ffmpeg` processing for final composition.

## Notes

- The app uses `/tmp` for temporary file storage, which works in most serverless environments (like Vercel) for the duration of the request.
- Video generation has a hard timeout of ~90s to ensure responsiveness.
