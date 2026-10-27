// Chạy máy đối thủ trong Web Worker để bàn cờ và đồng hồ không bị khựng khi máy đang nghĩ.
import { pickMove, type BotLevel } from './bot';

self.onmessage = (e: MessageEvent<{ id: number; fen: string; level: BotLevel; ms?: number }>) => {
  const { id, fen, level, ms } = e.data;
  const move = pickMove(fen, level, Math.random, ms ? { ms } : undefined);
  (self as unknown as Worker).postMessage({ id, move });
};
