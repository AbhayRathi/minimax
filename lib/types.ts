export interface Beat {
  t_start: number;
  t_end: number;
  text: string;
}

export interface PlanResponse {
  format: string;
  hooks: string[];
  chosen_hook: string;
  beats: Beat[];
  voiceover_script: string;
  caption: string;
  hashtags: string[];
  render_spec: string;
}

export interface VideoStatus {
  status: 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail';
  file_id?: string;
  download_url?: string;
}

export interface GenerateRequest {
  prompt: string;
  imageUrl: string;
  format?: 'auto' | 'listicle' | 'pov' | 'myth_fact';
}
