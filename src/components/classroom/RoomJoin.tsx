'use client';

// Ô nhập MÃ PHÒNG THI (6 ký tự cô đọc / viết lên bảng) ở trang của em.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { roomError } from '@/lib/classroom/rooms';
import '@/styles/room.css';

export default function RoomJoin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.replace(/\s/g, '').toUpperCase();
    if (c.length !== 6) return setErr('Mã phòng có 6 ký tự.');
    setBusy(true); setErr('');
    const { data, error } = await createClient().rpc('student_join_room', { p_code: c });
    setBusy(false);
    if (error || !data) return setErr(roomError(error?.message ?? ''));
    router.push(`/hoc-sinh/phong-thi/${data as string}`);
  };

  return (
    <form className="room-join" onSubmit={go}>
      <label htmlFor="room-code"><DoorOpen aria-hidden="true" /> Vào phòng thi</label>
      <input id="room-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} placeholder="Mã 6 ký tự"
        autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" aria-describedby={err ? 'room-err' : undefined} />
      <button type="submit" className="btn btn-yellow btn-sm" disabled={busy}>{busy ? 'Đang vào…' : 'Vào phòng'}</button>
      {err && <p id="room-err" className="room-join-err" role="alert">{err}</p>}
    </form>
  );
}
