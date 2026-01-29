'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Play, CheckCircle2, AlertCircle, Film, Music, Wand2, Key, Download, Zap, ShieldAlert, Sparkles, FileText, RefreshCw, X } from 'lucide-react';
import { PlanResponse } from '@/lib/types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateSRT, calculateAdRisk, AdRiskResult, simulateStyle, StyleVariant, STYLES, rewriteAdRisk } from '@/lib/helpers';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const DEMO_CHIPS = [
  "3 mind-blowing facts about space",
  "Why you should never visit the Pyramids",
  "The secret history of coffee",
  "5 signs you are a genius"
];

export default function Home() {
  // Config
  const [apiKey, setApiKey] = useState('');
  
  // Inputs
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState<StyleVariant>('gen_z');
  const [fastMode, setFastMode] = useState(false);
  
  // State
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'planning' | 'hook_selection' | 'generating' | 'complete'>('input');
  const [stage, setStage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Data
  const [basePlan, setBasePlan] = useState<PlanResponse | null>(null); // Original from API
  const [plan, setPlan] = useState<PlanResponse | null>(null); // Currently displayed/edited
  const [selectedHook, setSelectedHook] = useState<string>('');
  const [adRisk, setAdRisk] = useState<AdRiskResult | null>(null);
  
  // Outputs
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  // Re-run ad risk when script changes
  useEffect(() => {
    if (plan?.voiceover_script) {
      setAdRisk(calculateAdRisk(plan.voiceover_script));
    }
  }, [plan?.voiceover_script]);

  const handlePlan = async () => {
    if (!prompt || !imageUrl) return;
    setLoading(true);
    setError(null);
    setLogs([]);
    setPlan(null);
    setBasePlan(null);
    setVideoUrl(null);
    setSrtContent('');
    setStep('planning');

    try {
      setStage('Planning content...');
      addLog('Calling MiniMax-M2.1-lightning for planning...');
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-minimax-api-key': apiKey 
        },
        body: JSON.stringify({ prompt, imageUrl, format: 'auto' }), // Always auto, we simulate styles locally
      });
      if (!planRes.ok) throw new Error(await planRes.text());
      const planData: PlanResponse = await planRes.json();
      
      setBasePlan(planData);
      
      // Apply initial style
      const styledPlan = simulateStyle(planData, style);
      setPlan(styledPlan);
      setSelectedHook(styledPlan.chosen_hook);
      
      addLog('Plan created. Please select a hook.');
      setStep('hook_selection');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Planning failed');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (newStyle: StyleVariant) => {
    setStyle(newStyle);
    if (basePlan) {
      const styledPlan = simulateStyle(basePlan, newStyle);
      setPlan(styledPlan);
      // Try to preserve hook selection index if possible, otherwise reset
      const hookIndex = plan?.hooks.indexOf(selectedHook!) ?? -1;
      if (hookIndex !== -1 && hookIndex < styledPlan.hooks.length) {
          setSelectedHook(styledPlan.hooks[hookIndex]);
      } else {
          setSelectedHook(styledPlan.chosen_hook);
      }
    }
  };

  const handleFixAdRisk = () => {
    if (!plan) return;
    const fixedPlan = rewriteAdRisk(plan);
    setPlan(fixedPlan);
    addLog('Applied Ad Risk fixes.');
  };

  const handleGenerate = async () => {
    if (!plan) return;
    setLoading(true);
    setStep('generating');
    
    try {
      const videoPrompt = `${selectedHook} ${plan.format}`.substring(0, 500);

      // 2. Parallel Video & TTS
      setStage('Generating assets...');
      addLog(`Starting generation with hook: "${selectedHook}"`);
      addLog(fastMode ? 'FAST MODE: Skipping Hailuo, using Ken Burns fallback.' : 'Sending to Hailuo Video-01...');
      
      const ttsPromise = fetch('/api/tts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-minimax-api-key': apiKey 
        },
        body: JSON.stringify({ text: plan.voiceover_script }), 
      }).then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        addLog('TTS generated successfully.');
        return data; // { id: string }
      });

      const videoPromise = fetch('/api/video', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-minimax-api-key': apiKey 
        },
        body: JSON.stringify({ 
          imageUrl, 
          prompt: videoPrompt,
          fastMode
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        addLog('Video generated successfully.');
        return data; // { id: string }
      });

      const [ttsResult, videoResult] = await Promise.all([ttsPromise, videoPromise]);

      // 3. Render
      setStage('Rendering final video...');
      addLog('Compositing video, audio, and captions...');
      const renderRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beats: plan.beats,
          videoId: videoResult.id,
          audioId: ttsResult.id,
        }),
      });

      if (!renderRes.ok) throw new Error(await renderRes.text());
      
      const blob = await renderRes.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      
      // Generate SRT for export
      const srt = generateSRT(plan.beats);
      setSrtContent(srt);

      setStage('Done!');
      addLog('Final video rendered successfully!');
      setStep('complete');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Generation failed');
      setStep('hook_selection'); // Go back so they can try again
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `minimax-tiktok-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadSRT = () => {
    if (srtContent) {
      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captions-${Date.now()}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-violet-500/30 flex flex-col">
      
      {/* HEADER */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center font-bold text-white">M</div>
            <h1 className="font-bold text-lg tracking-tight">MiniMax <span className="text-neutral-500 font-normal">Creator Studio</span></h1>
          </div>

          <div className="flex items-center gap-4">
             {/* API Key Input */}
             <div className="bg-black/50 border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2 w-64">
                <Key className="w-3.5 h-3.5 text-neutral-500" />
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="MiniMax API Key"
                  className="bg-transparent border-none text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none flex-1"
                />
              </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-neutral-800">
        
        {/* LEFT COLUMN: Configuration & "Before" */}
        <div className="p-6 lg:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          
          {/* SECTION: INPUTS */}
          <section className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>1. Concept & Vibe</span>
                {plan && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Plan Ready</span>}
              </label>
              
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What video do you want to create?"
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 h-28 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all resize-none text-sm placeholder:text-neutral-600"
                />
                
                {/* Demo Chips */}
                <div className="flex flex-wrap gap-2">
                  {DEMO_CHIPS.map(chip => (
                    <button 
                      key={chip}
                      onClick={() => setPrompt(chip)}
                      className="text-xs bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-400 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL (https://...)"
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all text-sm"
                  />
                  
                  {/* Fast Mode Toggle */}
                  <button
                    onClick={() => setFastMode(!fastMode)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                      fastMode 
                        ? "bg-amber-900/20 border-amber-500/50 text-amber-200" 
                        : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-4 h-4", fastMode ? "fill-amber-500 text-amber-500" : "text-neutral-500")} />
                      <span>Fast Mode</span>
                    </div>
                    <span className="text-[10px] uppercase opacity-60">{fastMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Style Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block">Vibe Check</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStyleChange(s.id)}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1.5",
                        style === s.id
                          ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800"
                      )}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {!plan && (
                <button
                  onClick={handlePlan}
                  disabled={loading || !prompt || !imageUrl}
                  className="w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-4"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                  Generate Plan
                </button>
              )}
            </div>
          </section>

          {/* SECTION: PLAN EDITOR (BEFORE) */}
          {plan && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="h-px bg-neutral-800 w-full" />
               
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span>2. Review & Refine</span>
              </label>

              {/* Hook Selection */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-400">Select a Hook:</span>
                <div className="space-y-2">
                  {plan.hooks.map((hook, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedHook(hook)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all text-sm",
                        selectedHook === hook 
                          ? "bg-violet-900/20 border-violet-500 text-white" 
                          : "bg-black/20 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                      )}
                    >
                      {hook}
                    </div>
                  ))}
                </div>
              </div>

              {/* Script Editor */}
              <div className="space-y-2">
                 <span className="text-xs text-neutral-400">Script:</span>
                 <textarea
                    value={plan.voiceover_script}
                    onChange={(e) => setPlan({...plan, voiceover_script: e.target.value})}
                    className="w-full bg-black/40 border border-neutral-700 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all resize-y text-sm leading-relaxed"
                  />
              </div>

              {/* Ad Risk Analysis */}
              {adRisk && (
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col gap-3",
                  adRisk.score > 3 ? "bg-red-900/10 border-red-900/30" : "bg-emerald-900/10 border-emerald-900/30"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={cn("w-5 h-5", adRisk.score > 3 ? "text-red-400" : "text-emerald-400")} />
                      <span className={cn("font-bold text-sm", adRisk.score > 3 ? "text-red-200" : "text-emerald-200")}>
                        Ad Risk Score: {adRisk.score}/10
                      </span>
                    </div>
                    {adRisk.score > 3 && (
                      <button 
                        onClick={handleFixAdRisk}
                        className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Fix it
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">{adRisk.reason}</p>
                  <p className="text-xs italic opacity-70 border-t border-white/5 pt-2 mt-1">{adRisk.suggestion}</p>
                </div>
              )}

              {/* Generate Button */}
              {step !== 'complete' && step !== 'generating' && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Film className="w-5 h-5" />}
                  Generate Video
                </button>
              )}

              {/* Logs */}
              {(loading || logs.length > 0) && (
                <div className="bg-black rounded-xl p-4 border border-neutral-800 font-mono text-[10px] text-neutral-400 max-h-32 overflow-y-auto">
                   {logs.map((log, i) => (
                     <div key={i} className="mb-1 border-l-2 border-neutral-800 pl-2">
                       {log}
                     </div>
                   ))}
                   {loading && <div className="text-violet-400 animate-pulse mt-2">Processing: {stage}</div>}
                </div>
              )}
               
               {error && (
                <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-start gap-3 text-red-200 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5 w-4 h-4" />
                  <p>{error}</p>
                </div>
              )}

            </section>
          )}

        </div>

        {/* RIGHT COLUMN: Output & "After" */}
        <div className="bg-neutral-950/50 lg:bg-black/20 p-6 lg:p-8 flex flex-col gap-6">
           <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
             3. Final Output
           </label>

           <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
             {/* Phone Preview */}
             <div className="relative w-full max-w-[320px] aspect-[9/16] bg-neutral-900 rounded-[2.5rem] border-4 border-neutral-800 shadow-2xl overflow-hidden flex items-center justify-center group">
               {/* Notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-20 pointer-events-none" />
               
               {videoUrl ? (
                 <video 
                   src={videoUrl} 
                   controls 
                   autoPlay 
                   loop 
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="text-center p-8 text-neutral-600 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin text-violet-500" /> : <Play className="w-6 h-6 opacity-20" fill="currentColor" />}
                    </div>
                    <p className="text-sm font-medium">
                      {loading ? stage : "Preview will appear here"}
                    </p>
                 </div>
               )}

               {/* TikTok UI Overlay Mockup */}
               <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10 p-4 flex flex-col justify-end">
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="w-24 h-3 bg-white/20 rounded-full" />
                    <div className="w-40 h-3 bg-white/20 rounded-full" />
                  </div>
               </div>
             </div>
           </div>

           {/* Export Tools */}
           {step === 'complete' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {/* SRT Export */}
               <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-200">Captions (.srt)</span>
                    </div>
                    <button 
                      onClick={handleDownloadSRT}
                      className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors" 
                      title="Download SRT"
                    >
                      <Download className="w-4 h-4 text-neutral-400" />
                    </button>
                 </div>
                 <textarea 
                   readOnly 
                   value={srtContent} 
                   className="w-full h-24 bg-black/40 rounded-lg p-2 text-[10px] font-mono text-neutral-500 resize-none focus:outline-none"
                 />
               </div>

               {/* Video Export */}
               <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 justify-between">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-200">Video (.mp4)</span>
                    </div>
                    <p className="text-xs text-neutral-500">1080x1920 • 30fps • H.264</p>
                 </div>
                 <button 
                    onClick={handleDownloadVideo}
                    className="w-full py-2 bg-neutral-100 hover:bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 text-xs transition-all"
                 >
                   <Download className="w-3.5 h-3.5" />
                   Download Video
                 </button>
               </div>

             </div>
           )}

        </div>
      </div>
    </main>
  );
}
