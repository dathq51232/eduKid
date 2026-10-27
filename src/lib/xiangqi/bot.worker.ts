// Máy đối thủ cờ tướng chạy trong Web Worker để bàn cờ và đồng hồ không bị khựng.
import { xqPickMove } from './bot';
import type { BotLevel } from '@/lib/chess/bot';

self.onmessage = (e: MessageEvent<{ id: number; fen: string; level: BotLevel; ms?: number; history?: string[] }>) => {
  const { id, fen, level, ms, history } = e.data;
  const move = xqPickMove(fen, level, Math.random, { ms, history });
  (self as unknown as Worker).postMessage({ id, move });
};
