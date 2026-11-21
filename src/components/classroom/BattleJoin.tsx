'use client';

// Ô nhập MÃ PHÒNG ĐẤU CẶP (6 ký tự cô đọc / chiếu lên bảng) ở trang của em.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { battleError } from '@/lib/classroom/battle';
import '@/styles/room.css';

export default function BattleJoin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.replace(/\s/g, '').toUpperCase();
    if (c.length !== 6) return setErr('Mã phòng có 6 ký tự.');
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/hoc-sinh/dau-cap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }) });
      const d = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !d.id) { setErr(battleError(d.error ?? '')); return; }
      router.push(`/hoc-sinh/dau-cap/${d.id}`);
    } catch { setErr('Mất kết nối, thử lại nhé.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="room-join" onSubmit={go}>
      <label htmlFor="battle-code"><Swords aria-hidden="true" /> Vào Đấu cặp</label>
      <input id="battle-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} placeholder="Mã phòng đấu"
        autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-describedby={err ? 'battle-err' : undefined} />
      <button type="submit" className="btn btn-yellow btn-sm" disabled={busy}>{busy ? 'Đang vào…' : 'Vào phòng'}</button>
      {err && <p id="battle-err" className="room-join-err" role="alert">{err}</p>}
    </form>
  );
}
