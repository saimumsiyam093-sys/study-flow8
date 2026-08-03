import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

/** Microphone dictation using the browser Web Speech API. */
export function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handlerRef = useRef(onText);
  handlerRef.current = onText;

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? "").join(" ");
      if (text.trim()) handlerRef.current(text.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  return { listening, supported, toggle };
}

/** Text-to-speech for AI answers. */
export function useSpeaker() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (speakingId === id) {
        stop();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_>|]/g, "").slice(0, 4000));
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    },
    [speakingId, stop],
  );

  useEffect(() => stop, [stop]);

  return { speak, stop, speakingId, supported };
}
