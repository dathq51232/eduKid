'use client';
// Phần dùng chung của ván cờ trực tuyến (cờ vua, cờ tướng): tải ván, nhận cập nhật realtime, tự tải lại khi mạng
// chập chờn, đồng bộ đồng hồ với máy chủ, gửi thao tác (đi quân, xin hòa…), báo hết giờ.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from 'chess.js';
import { createClient } from '@/lib/supabase/client';
import { ERROR_TEXT, clockAt, type GameRow } from '@/lib/chess/online-rules';
import type { GamePayload } from '@/lib/chess/online';

export function useOnlineGame(id: string, meId: string) {
  const [pl, setPl] = useState<GamePayload | null>(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const offset = useRef(0);
  const flagged = useRef(-1);
  const [, tick] = useState(0);

  const take = useCallback((p: GamePayload) => {
    offset.current = p.now - Date.now();
    // Bỏ qua dữ liệu cũ hơn cái đang có (realtime và tải lại có thể về không theo thứ tự)
    setPl((old) => (old && Date.parse(old.game.updated_at) > Date.parse(p.game.updated_at) ? old : p));
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

  // Realtime: nhận dòng chess_games mới ngay khi đối thủ đi
  useEffect(() => {
    let sb: ReturnType<typeof createClient> | null = null;
    try { sb = createClient(); } catch { return; }
    const ch = sb.channel(`game-${id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chess_games', filter: `id=eq.${id}` }, (msg) => {
      const row = msg.new as GameRow;
      setPl((old) => (old && Date.parse(row.updated_at) >= Date.parse(old.game.updated_at) ? { ...old, game: row } : old));
    }).subscribe();
    return () => { void sb?.removeChannel(ch); };
  }, [id]);

  const g = pl?.game;
  const me: Color | null = pl ? (pl.players.w.id === meId ? 'w' : pl.players.b.id === meId ? 'b' : null) : null;
  const turn: Color = g && g.ply % 2 === 1 ? 'b' : 'w';
  const active = g?.status === 'active';

  // Tải lại định kỳ (dự phòng khi realtime chưa bật): nhanh khi đang chờ đối thủ
  useEffect(() => {
    if (!g || !active) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, turn === me ? 3000 : 2000); // lượt mình vẫn tải lại để thấy lời xin hòa, biểu cảm của bạn
    return () => clearInterval(t);
  }, [g, active, turn, me, load]);

  // Đồng hồ chạy
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(t);
  }, [active]);

  const act = useCallback(async (body: object) => {
    setNote('');
    try {
      const res = await fetch(`/api/co-vua/van/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.game) take(j as GamePayload);
      if (!res.ok && j.error && j.error !== 'not_flagged') setNote(ERROR_TEXT[j.error] ?? 'Chưa gửi được, thử lại nhé.');
      return res.ok;
    } catch { setNote('Mạng chập chờn, đang thử lại…'); void load(); return false; }
  }, [id, take, load]);

  const clock = g ? clockAt(g, Date.now() + offset.current) : { w: 0, b: 0 };
  // Đồng hồ bên đang đi về 0 → báo máy chủ xử (máy chủ tự kiểm tra lại giờ)
  useEffect(() => {
    if (!g || !active) return;
    if (clock[turn] <= 0 && flagged.current !== g.ply) { flagged.current = g.ply; void act({ action: 'flag' }); }
  });

  const serverNow = () => Date.now() + offset.current;
  return { pl, err, note, setNote, load, act, g, me, turn, active, clock, serverNow };
}
