import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PlanResponse } from '@/lib/types';

export const maxDuration = 60; // Allow longer timeout for planning

export async function POST(req: Request) {
  try {
    const { prompt, imageUrl, format } = await req.json();
    const apiKey = req.headers.get('x-minimax-api-key') || process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return new NextResponse('Missing API Key', { status: 401 });
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.minimax.io/v1',
    });

    const systemPrompt = `You are a TikTok viral video expert. Create a detailed plan for a 6-9 second vertical video based on the user's prompt and image.
    
    You MUST output strict JSON matching this schema:
    {
      "format": "string (listicle, pov, myth_fact, etc)",
      "hooks": ["string", "string", "string"],
      "chosen_hook": "string (the best one)",
      "beats": [{"t_start": float, "t_end": float, "text": "string"}],
      "voiceover_script": "string (include <#0.4#> pause markers)",
      "caption": "string",
      "hashtags": ["string"],
      "render_spec": "string (instructions)"
    }

    The video length is strictly 6-9 seconds. 
    The voiceover should be fast-paced. 
    The beats should correspond to subtitles/captions that will be burned onto the video.
    Ensure 'voiceover_script' includes pause markers like <#0.3#> for natural phrasing.
    `;

    const userContent = `Topic: ${prompt}
    Image: ${imageUrl}
    Format preference: ${format}
    `;

    const response = await client.chat.completions.create({
      model: 'MiniMax-M2.1-lightning', // Use the specific model requested
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content from MiniMax');

    const plan: PlanResponse = JSON.parse(content);
    
    // Basic validation
    if (!plan.voiceover_script || !plan.beats) {
       throw new Error('Invalid plan generated');
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Plan API Error:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
