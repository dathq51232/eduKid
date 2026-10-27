'use client';
// Phần dùng chung của ván cờ trực tuyến (cờ vua, cờ tướng): tải ván, nhận cập nhật tức thời, đồng bộ đồng hồ
// với máy chủ, gửi thao tác (đi quân, xin hòa…), báo hết giờ.
//
// Để hai máy thấy nước đi gần như ngay lập tức:
//  1. Người vừa đi gửi luôn dòng ván mới (máy chủ đã xác nhận) qua kênh Broadcast của Supabase Realtime → đối thủ nhận sau ~0,1 giây.
//  2. Dự phòng: thay đổi dòng chess_games (postgres_changes) và tải lại định kỳ (thưa khi kênh realtime đã kết nối).
//  Máy chủ vẫn là trọng tài: dữ liệu nhận qua kênh chỉ được dùng nếu mới hơn, và lần tải lại sau đó sẽ sửa nếu có sai lệch.
// Hook KHÔNG tự vẽ lại theo nhịp đồng hồ — đồng hồ là thành phần LiveClock riêng, nên bàn cờ không bị vẽ lại liên tục.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from 'chess.js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ERROR_TEXT, clockAt, type GameRow } from '@/lib/chess/online-rules';
import type { GamePayload } from '@/lib/chess/online';

type Light = { game: GameRow; now: number; players?: GamePayload['players'] };
const newer = (a: GameRow, b: GameRow) => Date.parse(a.updated_at) > Date.parse(b.updated_at) || a.ply > b.ply;

export function useOnlineGame(id: string, meId: string) {
  const [pl, setPl] = useState<GamePayload | null>(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [live, setLive] = useState(false); // kênh realtime đã kết nối
  const offset = useRef(0); // giờ máy chủ − giờ máy này
  const chan = useRef<RealtimeChannel | null>(null);

  /** Nhận dữ liệu ván (đầy đủ hoặc chỉ dòng ván): giữ tên người chơi cũ, bỏ qua dữ liệu cũ hơn */
  const take = useCallback((p: Light) => {
    offset.current = p.now - Date.now();
    setPl((old) => {
      if (old && newer(old.game, p.game)) return old;
      const players = p.players ?? old?.players;
      return players ? { game: p.game, players, now: p.now } : old;
    });
  }, []);
  const takeRow = useCallback((row: GameRow) => {
    setPl((old) => (old && !newer(old.game, row) ? { ...old, game: row } : old));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/co-vua/van/${id}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? 'server'); return; }
      setErr(''); take(j as GamePayload);
    } catch { /* mạng chập chờn: lần sau thử lại */ }
  }, [id, take]);

  useEffect(() => { void load(); }, [load]);

  // Realtime: Broadcast (nhanh nhất) + thay đổi dòng chess_games (dự phòng)
  useEffect(() => {
    let sb: ReturnType<typeof createClient> | null = null;
    try { sb = createClient(); } catch { return; }
    const ch = sb.channel(`game-${id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'row' }, (msg) => { const row = (msg.payload as { row?: GameRow }).row; if (row && row.id === id) takeRow(row); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chess_games', filter: `id=eq.${id}` }, (msg) => takeRow(msg.new as GameRow))
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    chan.current = ch;
    return () => { chan.current = null; void sb?.removeChannel(ch); };
  }, [id, takeRow]);

  const g = pl?.game;
  const me: Color | null = pl ? (pl.players.w.id === meId ? 'w' : pl.players.b.id === meId ? 'b' : null) : null;
  const turn: Color = g && g.ply % 2 === 1 ? 'b' : 'w';
  const active = g?.status === 'active';

  // Tải lại định kỳ: dày khi realtime chưa kết nối, thưa khi đã có kênh (chỉ để tự sửa nếu lỡ mất tin)
  useEffect(() => {
    if (!g || !active) return;
    const ms = live ? 8000 : turn === me ? 3000 : 1500;
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, ms);
    return () => clearInterval(t);
  }, [g, active, turn, me, load, live]);
  // Quay lại tab / mở lại màn hình điện thoại → tải lại ngay
  useEffect(() => {
    const on = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', on); window.addEventListener('online', on);
    return () => { document.removeEventListener('visibilitychange', on); window.removeEventListener('online', on); };
  }, [load]);

  const act = useCallback(async (body: object) => {
    setNote('');
    try {
      const res = await fetch(`/api/co-vua/van/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.game) {
        take(j as Light);
        // Báo ngay cho đối thủ (dòng ván đã được máy chủ xác nhận)
        if (res.ok) void chan.current?.send({ type: 'broadcast', event: 'row', payload: { row: j.game } });
      }
      if (!res.ok && j.error && j.error !== 'not_flagged') setNote(ERROR_TEXT[j.error] ?? 'Chưa gửi được, thử lại nhé.');
      if ((j as { finished?: boolean }).finished) void load(); // lấy điểm Elo mới
      return res.ok;
    } catch { setNote('Mạng chập chờn, đang thử lại…'); void load(); return false; }
  }, [id, take, load]);

  // Hẹn giờ báo hết giờ đúng lúc đồng hồ bên đang đi về 0 (không cần nhịp vẽ lại liên tục)
  const flagged = useRef(-1);
  useEffect(() => {
    if (!g || !active) return;
    const left = clockAt(g, Date.now() + offset.current)[turn];
    const t = setTimeout(() => { if (flagged.current !== g.ply) { flagged.current = g.ply; void act({ action: 'flag' }); } }, Math.max(0, left) + 250);
    return () => clearTimeout(t);
  }, [g, active, turn, act]);

  const serverNow = () => Date.now() + offset.current;
  /** Đồng hồ hai bên dạng cho LiveClock: thời gian còn lại tại mốc `since` (giờ máy này) và bên nào đang chạy */
  const clockFor = (side: Color) => {
    if (!g) return { left: 0, since: Date.now(), running: false };
    const ms = side === 'w' ? g.white_ms : g.black_ms;
    const running = active && turn === side;
    return { left: ms, since: Date.parse(g.turn_at) - offset.current, running };
  };
  return { pl, err, note, setNote, load, act, g, me, turn, active, clockFor, serverNow, live };
}
