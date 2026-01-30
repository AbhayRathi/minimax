import { PlanResponse } from './types';

export const MOCK_PLAN: PlanResponse = {
  format: "listicle",
  hooks: [
    "3 mind-blowing facts about space",
    "You won't believe this about space",
    "The dark truth about the universe"
  ],
  chosen_hook: "3 mind-blowing facts about space",
  beats: [
    { t_start: 0.0, t_end: 2.0, text: "Space is completely silent." },
    { t_start: 2.0, t_end: 4.0, text: "A day on Venus is longer than a year." },
    { t_start: 4.0, t_end: 6.5, text: "There are more stars than grains of sand." }
  ],
  voiceover_script: "Space is completely silent. <#0.3#> A day on Venus is longer than a year. <#0.3#> There are more stars than grains of sand.",
  caption: "Space facts that will blow your mind 🤯 #space #science #facts",
  hashtags: ["#space", "#science", "#facts", "#mindblowing"],
  render_spec: "Ken Burns zoom effect with dark overlay"
};

export const getMockPlan = (prompt: string): PlanResponse => {
    // Simple dynamic adjustment
    return {
        ...MOCK_PLAN,
        hooks: [
            `${prompt} - Part 1`,
            `The truth about ${prompt}`,
            `Why ${prompt} matters`
        ],
        chosen_hook: `The truth about ${prompt}`,
        voiceover_script: `Here is the truth about ${prompt}. <#0.3#> It is more complex than you think. <#0.3#> Stay tuned for more.`,
        beats: [
            { t_start: 0.0, t_end: 2.0, text: `Here is the truth about ${prompt}` },
            { t_start: 2.0, t_end: 4.0, text: "It is more complex than you think" },
            { t_start: 4.0, t_end: 6.5, text: "Stay tuned for more" }
        ]
    };
}
