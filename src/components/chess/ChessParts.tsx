'use client';
// Mảnh giao diện dùng chung cho các trang cờ: tab chế độ, đồng hồ, nút âm thanh, thanh lượt đi, thông báo trên bàn.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { CHESS_SOUND_MODES, clockSoundFor, setChessSound, sfx, useChessSound } from '@/lib/chess/sound-pref';

export type ChessTab = 'bot' | 'online' | 'cup';
export function ChessTabs({ active, base = '/co/vua' }: { active: ChessTab; base?: string }) {
  return (
    <nav className="chs-tabs" aria-label="Chế độ chơi">
      {active === 'bot' ? <span aria-current="page">Chơi với máy</span> : <Link href={base}>Chơi với máy</Link>}
      {active === 'online' ? <span aria-current="page">Đấu với bạn</span> : <Link href={`${base}/ban`}>Đấu với bạn</Link>}
      <span className="is-soon">Giải đấu <em>sắp có</em></span>
    </nav>
  );
}

/**
 * Đồng hồ tự chạy: chỉ thành phần này vẽ lại theo nhịp, không kéo cả bàn cờ vẽ lại theo.
 * left = thời gian còn lại (ms) tại mốc since (Date.now() của máy này); running = đang trừ giờ.
 * sound = phát tiếng tích tắc / chuông sắp hết giờ (chỉ bật cho đồng hồ của chính em).
 */
export function LiveClock({ left, since, running, fmt, sound = false }: { left: number; since: number; running: boolean; fmt: (ms: number) => string; sound?: boolean }) {
  const [, tick] = useState(0);
  const mode = useChessSound();
  const lastSec = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [running]);
  const ms = running ? left - (Date.now() - since) : left;
  const sec = Math.ceil(ms / 1000);
  useEffect(() => {
    if (!running || !sound) { lastSec.current = null; return; }
    if (lastSec.current !== null && sec !== lastSec.current) { const s = clockSoundFor(sec, mode); if (s) sfx(s); }
    lastSec.current = sec;
  });
  return <span className={`chs-clock${running ? ' is-on' : ''}${ms < 20000 ? ' is-low' : ''}${running && ms < 10000 ? ' is-urgent' : ''}`}>{fmt(ms)}</span>;
}

/** Nút âm thanh: Báo sắp hết giờ → Tích tắc → Tắt tiếng (bấm để chuyển) */
export function SoundButton({ compact = false }: { compact?: boolean }) {
  const mode = useChessSound();
  const i = CHESS_SOUND_MODES.findIndex((m) => m.id === mode);
  const next = CHESS_SOUND_MODES[(i + 1) % CHESS_SOUND_MODES.length];
  const Icon = mode === 'off' ? VolumeX : mode === 'every' ? Volume2 : Volume1;
  const cur = CHESS_SOUND_MODES[i];
  return (
    <button type="button" className={`chs-sound${mode === 'off' ? ' is-off' : ''}${compact ? ' is-compact' : ''}`} onClick={() => { setChessSound(next.id); if (next.id !== 'off') sfx('tickSoft'); }} title={`${cur.label}: ${cur.hint}. Bấm để chuyển sang "${next.label}"`} aria-label={`Âm thanh: ${cur.label}. Bấm để chuyển sang ${next.label}`}>
      <Icon aria-hidden="true" />{!compact && <span>{cur.label}</span>}
    </button>
  );
}

/** Thanh báo lượt đi nằm ngay trên bàn cờ (điện thoại cũng thấy ngay) */
export function TurnBar({ tone, title, sub }: { tone: 'me' | 'wait' | 'check' | 'end'; title: string; sub?: string }) {
  return (
    <div className={`chs-turn is-${tone}`} role="status" aria-live="polite">
      <span className="chs-turn-dot" aria-hidden="true" />
      <div><b>{title}</b>{sub && <small>{sub}</small>}</div>
      <SoundButton compact />
    </div>
  );
}

/**
 * Thông báo nổi trên bàn cờ: "CHIẾU!" thật to khi có nước chiếu, và thẻ nhỏ "Bạn vừa đi …" sau mỗi nước.
 * Mỗi thông báo hiện khi khóa (moveKey / checkKey) đổi, tự ẩn sau vài giây.
 */
export function BoardAlerts({ moveKey, moveText, checkKey, checkTitle, checkSub }: { moveKey: string | number; moveText: string | null; checkKey: string | number | null; checkTitle: string; checkSub?: string }) {
  const [showMove, setShowMove] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // không hiện lại khi vừa mở trang
    if (!moveText) return;
    setShowMove(true);
    const t = setTimeout(() => setShowMove(false), 2200);
    return () => clearTimeout(t);
  }, [moveKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (checkKey === null) { setShowCheck(false); return; }
    setShowCheck(true);
    const t = setTimeout(() => setShowCheck(false), 1900);
    return () => clearTimeout(t);
  }, [checkKey]);
  return (
    <>
      {showMove && moveText && <div className="chs-toast" key={`m${moveKey}`} aria-hidden="true">{moveText}</div>}
      {showCheck && <div className="chs-checkban" key={`c${checkKey}`} role="alert"><b>{checkTitle}</b>{checkSub && <small>{checkSub}</small>}</div>}
    </>
  );
}
