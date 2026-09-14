import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getRecognition(): SpeechRecognitionType | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
};

export function useSpeechToText(lang: string, onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const supported = !!getRecognition();

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = LANG_MAP[lang] ?? 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalText = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) onResultRef.current(finalText + interim);
    };

    recognition.onend = () => {
      if (finalText) onResultRef.current(finalText);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { listening, start, stop, supported };
}

export function useTextToSpeech(lang: string) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text: string) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[lang] ?? 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { speaking, speak, stop, supported };
}
