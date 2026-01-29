import { Beat, PlanResponse } from './types';

// --- SRT Generation ---
export function generateSRT(beats: Beat[]): string {
  if (!beats || beats.length === 0) return '';
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

// --- Ad Risk Analysis ---
export interface AdRiskResult {
  score: number; // 1-10
  reason: string;
  suggestion: string;
}

export function calculateAdRisk(text: string): AdRiskResult {
  const lowerText = text.toLowerCase();
  let score = 1;
  const reasons: string[] = [];

  // Heuristic rules
  if (lowerText.match(/buy now|limited time|order today|shop now|link in bio/)) {
    score += 2;
    reasons.push('Direct sales language');
  }
  if (lowerText.match(/use my code|discount|promo|% off|deal/)) {
    score += 2;
    reasons.push('Promotional offers');
  }
  if (lowerText.match(/best|guaranteed|amazing|perfect|revolutionary/)) {
    score += 1;
    reasons.push('Superlatives');
  }

  score = Math.min(Math.max(score, 1), 10);

  let suggestion = 'Content looks organic.';
  if (score > 3) {
    suggestion = 'Add a personal anecdote and remove direct sales language; use a curiosity CTA.';
  }

  return {
    score,
    reason: reasons.join(', ') || 'Low risk',
    suggestion
  };
}

// --- Style Simulation ---
export type StyleVariant = 'gen_z' | 'storytime' | 'brand_safe' | 'high_energy';

export const STYLES: { id: StyleVariant; label: string; emoji: string }[] = [
  { id: 'gen_z', label: 'Chaotic Gen-Z', emoji: '😈' },
  { id: 'storytime', label: 'Storytime', emoji: '🧠' },
  { id: 'brand_safe', label: 'Brand-safe', emoji: '✅' },
  { id: 'high_energy', label: 'High-energy', emoji: '⚡' },
];

export function simulateStyle(plan: PlanResponse, style: StyleVariant): PlanResponse {
  // Deep copy to avoid mutating original
  const newPlan = JSON.parse(JSON.stringify(plan));
  
  // Apply "rewrite rules" (Client-side simulation)
  switch (style) {
    case 'gen_z':
      newPlan.chosen_hook = newPlan.chosen_hook.replace(/\./g, '').toLowerCase() + " fr fr 💀";
      newPlan.voiceover_script = "Yo check this out. " + newPlan.voiceover_script.replace(/Please/g, "Pls").replace(/you/g, "u");
      newPlan.caption = newPlan.caption + " #fyp #viral";
      break;
    case 'storytime':
      newPlan.chosen_hook = "Here's what happened when " + newPlan.chosen_hook.toLowerCase();
      newPlan.voiceover_script = "So, story time. " + newPlan.voiceover_script;
      newPlan.caption = "Wait for the end... " + newPlan.caption;
      break;
    case 'brand_safe':
      newPlan.chosen_hook = newPlan.chosen_hook.replace(/mind-blowing/i, "interesting").replace(/crazy/i, "notable");
      newPlan.voiceover_script = newPlan.voiceover_script.replace(/!/g, ".");
      newPlan.caption = newPlan.caption.replace(/#/g, ""); // Clean look
      break;
    case 'high_energy':
      newPlan.chosen_hook = "WAIT! " + newPlan.chosen_hook.toUpperCase();
      newPlan.voiceover_script = newPlan.voiceover_script.toUpperCase() + "!!!";
      newPlan.caption = "🚨 " + newPlan.caption + " 🚨";
      break;
  }
  
  return newPlan;
}

export function rewriteAdRisk(plan: PlanResponse): PlanResponse {
  const newPlan = JSON.parse(JSON.stringify(plan));
  // Simple heuristic fix for the "Make it feel less like an ad" button
  newPlan.voiceover_script = newPlan.voiceover_script
    .replace(/buy now/gi, "check it out")
    .replace(/order today/gi, "available now")
    .replace(/use my code/gi, "link in bio");
  newPlan.caption = newPlan.caption.replace(/#ad/gi, "");
  return newPlan;
}
