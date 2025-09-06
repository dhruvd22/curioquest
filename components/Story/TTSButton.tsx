"use client";
import { useRef, useState } from "react";

export default function TTSButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const start = () => {
    if (!text) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.onend = () => setSpeaking(false);
    utteranceRef.current = u;
    speechSynthesis.speak(u);
    setSpeaking(true);
  };
  const pause = () => speechSynthesis.pause();
  const resume = () => speechSynthesis.resume();
  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); };

  return (
    <div className="flex gap-2">
      <button className="px-3 py-1 border rounded" onClick={start} aria-label="Read">Read</button>
      <button className="px-3 py-1 border rounded" onClick={pause}>Pause</button>
      <button className="px-3 py-1 border rounded" onClick={resume}>Resume</button>
      <button className="px-3 py-1 border rounded" onClick={stop}>Stop</button>
      <span className="text-xs opacity-60">{speaking ? "Speaking…" : ""}</span>
    </div>
  );
}
