'use client';

// Ô nhập MÃ PHÒNG THI (6 ký tự cô đọc / viết lên bảng) ở trang của em.
// Quét mã QR cô chiếu (đường dẫn /hoc-sinh?phong=MÃ): điền sẵn mã và tự vào phòng.
import { useCallback, useEffect, useRef, useState } from 'react';
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

  const join = useCallback(async (raw: string) => {
    const c = raw.replace(/\s/g, '').toUpperCase();
    if (c.length !== 6) return setErr('Mã phòng có 6 ký tự.');
    setBusy(true); setErr('');
    const { data, error } = await createClient().rpc('student_join_room', { p_code: c });
    setBusy(false);
    if (error || !data) return setErr(roomError(error?.message ?? ''));
    // nhớ mã vừa nhập (trong phiên) để màn Bắt đầu điền sẵn — máy chủ vẫn kiểm tra mã khi bắt đầu
    try { sessionStorage.setItem(`edukid:phong:${data as string}:code`, c); } catch { /* bỏ qua */ }
    router.push(`/hoc-sinh/phong-thi/${data as string}`);
  }, [router]);
  const go = (e: React.FormEvent) => { e.preventDefault(); void join(code); };
  // vào từ mã QR: chạy một lần, rồi bỏ ?phong khỏi địa chỉ (bấm Quay lại không vào lại)
  const auto = useRef(false);
  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    const c = new URLSearchParams(window.location.search).get('phong')?.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 8) ?? '';
    if (!c) return;
    setCode(c);
    try { window.history.replaceState(null, '', window.location.pathname); } catch { /* bỏ qua */ }
    void join(c);
  }, [join]);

  return (
    <form className="room-join" onSubmit={go}>
      <label htmlFor="room-code"><DoorOpen aria-hidden="true" /> Vào phòng thi</label>
      <input id="room-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} placeholder="Mã phòng"
        autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" aria-describedby={err ? 'room-err' : undefined} />
      <button type="submit" className="btn btn-yellow btn-sm" disabled={busy}>{busy ? 'Đang vào…' : 'Vào phòng'}</button>
      {err && <p id="room-err" className="room-join-err" role="alert">{err}</p>}
    </form>
  );
}
