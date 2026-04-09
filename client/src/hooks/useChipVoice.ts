/**
 * DOGE-LANDSCAPER — useChipVoice hook
 * Design: Spatial Glass Command Deck
 * Wires Web Speech API SpeechSynthesis to give Chip McHaymaker a voice.
 * Iowa corn-belt accent approximation: slow rate, mid pitch, US English voice.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChipVoiceSettings {
  rate: number;      // 0.5 – 1.5 (default 0.82 — slow Iowa drawl)
  pitch: number;     // 0.8 – 1.2 (default 0.92 — slightly low)
  volume: number;    // 0 – 1
  enabled: boolean;
}

const DEFAULT_SETTINGS: ChipVoiceSettings = {
  rate: 0.82,
  pitch: 0.92,
  volume: 1.0,
  enabled: true,
};

// Chip's signature phrases — injected as interjections
const CHIP_INTERJECTIONS = [
  "Well shoot,",
  "By golly,",
  "Yep,",
  "You betcha,",
  "Dontcha know,",
  "Oh for Pete's sake,",
  "Alrighty then,",
  "Hot dog,",
];

function pickInterjection() {
  return CHIP_INTERJECTIONS[Math.floor(Math.random() * CHIP_INTERJECTIONS.length)];
}

// Prefer a US English voice, fall back to any available
function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer en-US male-sounding voices
  const preferred = voices.find(v =>
    v.lang === "en-US" && /samantha|alex|daniel|fred|tom|aaron|noel|zarvox/i.test(v.name)
  );
  const usVoice = voices.find(v => v.lang === "en-US");
  const enVoice = voices.find(v => v.lang.startsWith("en"));
  return preferred || usVoice || enVoice || voices[0] || null;
}

export function useChipVoice() {
  const [settings, setSettings] = useState<ChipVoiceSettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      // Voices may load async
      const loadVoices = () => { voicesLoadedRef.current = true; };
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      // Trigger initial load
      window.speechSynthesis.getVoices();
      return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }
  }, []);

  const speak = useCallback((text: string, addInterjection = true) => {
    if (!isSupported || !settings.enabled) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const fullText = addInterjection
      ? `${pickInterjection()} ${text}`
      : text;

    const utter = new SpeechSynthesisUtterance(fullText);
    utter.rate = settings.rate;
    utter.pitch = settings.pitch;
    utter.volume = settings.volume;

    const voice = pickVoice();
    if (voice) utter.voice = voice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [isSupported, settings]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speakTask = useCallback((taskName: string, chipNote?: string) => {
    const note = chipNote || "Time to get to work!";
    speak(`Current task: ${taskName}. ${note}`);
  }, [speak]);

  const speakWeather = useCallback((condition: string, temp: number, windSpeed: number) => {
    const sprayOk = windSpeed < 10 && temp > 45 && temp < 90;
    const sprayMsg = sprayOk
      ? "Spray conditions are lookin' real good right now."
      : "Might wanna hold off on sprayin' — conditions ain't ideal.";
    speak(`Weather update: ${condition}, ${Math.round(temp)} degrees, wind at ${Math.round(windSpeed)} miles per hour. ${sprayMsg}`, false);
  }, [speak]);

  const speakZone = useCallback((zoneName: string, status: string, product?: string) => {
    const productMsg = product ? `Last treated with ${product}.` : "";
    speak(`${zoneName} is currently ${status}. ${productMsg} Chip's on it!`);
  }, [speak]);

  const updateSettings = useCallback((patch: Partial<ChipVoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  return {
    speak,
    stop,
    speakTask,
    speakWeather,
    speakZone,
    isSpeaking,
    isSupported,
    settings,
    updateSettings,
  };
}
