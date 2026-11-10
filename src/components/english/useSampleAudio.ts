'use client';

// Phát câu mẫu tiếng Anh: clip thu sẵn → /api/tts → giọng đọc của trình duyệt.
// Mỗi lần phát có `token` riêng; stop() làm mọi lời hứa đang chờ kết thúc ngay (không treo).

import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaySource = { text: string; clipUrl?: string | null; rate?: number };

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /^en[-_]US$/i.test(v.lang) && /natural|online|google/i.test(v.name)) ??
    voices.find((v) => /^en[-_]US$/i.test(v.lang))
  );
}

export function useSampleAudio() {
  const [speaking, setSpeaking] = useState(false);
  const tokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  const haltMedia = () => {
    tokenRef.current++;
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) audio.pause();
    const abort = abortRef.current;
    abortRef.current = null;
    abort?.();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  };

  const stop = useCallback(() => {
    haltMedia();
    if (mountedRef.current) setSpeaking(false);
  }, []);

  const playUrl = (url: string, rate: number, token: number) =>
    new Promise<boolean>((resolve) => {
      if (token !== tokenRef.current) { resolve(false); return; }
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (audioRef.current === audio) audioRef.current = null;
        if (abortRef.current === abort) abortRef.current = null;
        resolve(ok);
      };
      const abort = () => done(false);
      abortRef.current = abort;
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });

  const speakBrowser = (text: string, token: number) =>
    new Promise<void>((resolve) => {
      if (token !== tokenRef.current || !('speechSynthesis' in window)) { resolve(); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      utterance.pitch = 1.04;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (abortRef.current === done) abortRef.current = null;
        resolve();
      };
      abortRef.current = done;
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    });

  /** Phát một câu. Promise kết thúc khi đọc xong hoặc khi bị stop()/phát câu khác. */
  const play = useCallback(async ({ text, clipUrl, rate = 0.94 }: PlaySource) => {
    haltMedia();
    const token = tokenRef.current;
    setSpeaking(true);
    try {
      if (clipUrl && (await playUrl(clipUrl, rate, token))) return;
      if (token !== tokenRef.current) return;
      if (await playUrl(`/api/tts?lang=en&q=${encodeURIComponent(text)}`, rate, token)) return;
      if (token !== tokenRef.current) return;
      await speakBrowser(text, token);
    } finally {
      if (token === tokenRef.current && mountedRef.current) setSpeaking(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; haltMedia(); };
  }, []);

  return { speaking, play, stop };
}

export type SampleAudio = ReturnType<typeof useSampleAudio>;
