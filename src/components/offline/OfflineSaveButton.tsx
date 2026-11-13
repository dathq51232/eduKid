'use client';

// Nút "Lưu để chiếu offline" (trình soạn bài thao giảng / bài giảng 3D).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CloudDownload, X } from 'lucide-react';
import { getOffline, offlineKey } from '@/lib/offline/store';
import { OFFLINE_PAGE } from '@/lib/offline/save';

type Props = { kind: 'deck' | 'l3d'; id: string; className?: string; run: (progress: (t: string) => void) => Promise<unknown> };

export default function OfflineSaveButton({ kind, id, className = '', run }: Props) {
  const [busy, setBusy] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pop, setPop] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { void getOffline(offlineKey(kind, id)).then((x) => setSavedAt(x?.savedAt ?? null), () => {}); }, [kind, id]);

  const go = async () => {
    if (busy) return;
    if (!navigator.onLine) { setPop({ ok: false, text: 'Máy đang mất mạng. Lưu bài khi còn mạng, lên lớp mới chiếu offline được.' }); return; }
    setPop(null); setBusy('Đang chuẩn bị…');
    try {
      await run(setBusy);
      setSavedAt(Date.now());
      setPop({ ok: true, text: 'Đã lưu bài trên máy này. Khi mất mạng, mở trang Bài đã lưu offline trên chính máy và trình duyệt này để chiếu.' });
    } catch (e) {
      setPop({ ok: false, text: e instanceof Error ? e.message : 'Chưa lưu được. Thử lại nhé.' });
    } finally { setBusy(''); }
  };

  return (
    <span className="ofl-wrap">
      <button type="button" className={`${className} ofl-btn${savedAt ? ' is-saved' : ''}`} onClick={go} disabled={!!busy} aria-busy={!!busy}
        title={savedAt ? `Đã lưu trên máy lúc ${new Date(savedAt).toLocaleString('vi-VN')}. Bấm để cập nhật bản mới nhất.` : 'Lưu bài trên máy để chiếu khi không có mạng'}>
        {savedAt && !busy ? <CheckCircle2 aria-hidden="true" /> : <CloudDownload aria-hidden="true" />}
        <span>{busy || (savedAt ? 'Đã lưu offline' : 'Lưu để chiếu offline')}</span>
      </button>
      {pop && (
        <span className={`ofl-pop${pop.ok ? ' is-ok' : ' is-err'}`} role="status">
          <span>{pop.text}{pop.ok && <> <Link href={OFFLINE_PAGE} target="_blank">Mở Bài đã lưu offline</Link></>}</span>
          <button type="button" onClick={() => setPop(null)} aria-label="Đóng"><X aria-hidden="true" /></button>
        </span>
      )}
    </span>
  );
}
