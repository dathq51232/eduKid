'use client';

// Trang "Bài đã lưu offline" (/chieu-offline): danh sách bài thao giảng / bài giảng 3D đã lưu trên máy và chiếu không cần mạng.
// ?id=<khoá>            : chiếu bài (màn hình của cô)
// ?id=<khoá>&man=chieu  : màn hình chiếu (cửa sổ thứ hai, đồng bộ với máy cô qua BroadcastChannel — chạy được khi mất mạng)
// ?warm=<khoá>          : dựng bài một lần trong khung ẩn khi vừa lưu, để bộ nhớ đệm giữ sẵn mã chạy, mô hình 3D, hình
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, MonitorPlay, Presentation, Trash2, Wifi, WifiOff } from 'lucide-react';
import { deleteOffline, getOffline, listOffline, type OfflineItem, type OfflineSummary } from '@/lib/offline/store';
import { setLocalSoundResolver } from '@/lib/deck/sounds';
import type { TeacherAsset } from '@/lib/assets/client';

const DeckPlayer = dynamic(() => import('@/components/deck/DeckPlayer'), { ssr: false });
const Lesson3DStudio = dynamic(() => import('@/components/lesson3d/Lesson3DStudio'), { ssr: false });

const PAGE = '/chieu-offline';
const fmtMB = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`);
const fmtWhen = (t: number) => new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const f = () => setOn(navigator.onLine); f();
    addEventListener('online', f); addEventListener('offline', f);
    return () => { removeEventListener('online', f); removeEventListener('offline', f); };
  }, []);
  return on;
}

function Player({ item, audience, start, warm }: { item: OfflineItem; audience: boolean; start: number; warm: boolean }) {
  // Blob → đường dẫn tạm trong trình duyệt (thu hồi khi rời trang)
  const urls = useMemo(() => new Map(Object.entries(item.blobs).map(([p, b]) => [p, URL.createObjectURL(b)])), [item]);
  useEffect(() => () => { urls.forEach((u) => URL.revokeObjectURL(u)); }, [urls]);
  useEffect(() => { setLocalSoundResolver((p) => urls.get(p)); return () => setLocalSoundResolver(null); }, [urls]);
  useEffect(() => {
    if (!warm) return;
    const t = setTimeout(() => { try { window.parent.postMessage(`edk-warm:${item.key}`, location.origin); } catch { /* bỏ qua */ } }, item.kind === 'l3d' ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [warm, item]);

  if (item.kind === 'deck') {
    return (
      <main className="dp-page">
        <DeckPlayer classId={item.classId} deckId={item.id} deck={item.deck} students={item.students} start={start} audience={audience}
          offline={{ urls, exitHref: PAGE, audienceHref: (pg) => `${PAGE}?id=${encodeURIComponent(item.key)}&man=chieu&trang=${pg}` }} />
      </main>
    );
  }
  const assets: TeacherAsset[] = item.assets.map((a) => ({ ...a, url: urls.get(a.path) ?? null, thumb: null }));
  return (
    <main className="s3d-page">
      <Lesson3DStudio classId={item.classId} lessonId={item.id} initial={item.lesson} offline={{ assets, exitHref: PAGE }} />
    </main>
  );
}

export default function OfflineShows() {
  const online = useOnline();
  const [q, setQ] = useState<{ id: string | null; warm: string | null; audience: boolean; start: number } | null>(null);
  const [list, setList] = useState<OfflineSummary[] | null>(null);
  const [item, setItem] = useState<OfflineItem | null | 'missing'>(null);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    setQ({ id: sp.get('id'), warm: sp.get('warm'), audience: sp.get('man') === 'chieu', start: Math.max(0, (Number(sp.get('trang')) || 1) - 1) });
  }, []);
  useEffect(() => {
    if (!q) return;
    const key = q.warm ?? q.id;
    if (key) { void getOffline(key).then((x) => setItem(x ?? 'missing'), (e: Error) => { setErr(e.message); setItem('missing'); }); return; }
    void listOffline().then(setList, (e: Error) => { setErr(e.message); setList([]); });
  }, [q]);

  const remove = async (key: string) => {
    await deleteOffline(key).catch(() => {});
    setConfirmDel(null);
    setList((l) => (l ?? []).filter((x) => x.key !== key));
  };

  if (!q) return null;
  if (q.id || q.warm) {
    if (item === null) return <main className="ofl wrap"><p className="ofl-muted">Đang mở bài…</p></main>;
    if (item === 'missing') return (
      <main className="ofl wrap">
        <h1>Không tìm thấy bài trên máy này</h1>
        <p className="ofl-muted">{err || 'Bài có thể đã bị xoá, hoặc được lưu trên máy / trình duyệt khác.'}</p>
        <a className="btn btn-primary" href={PAGE}>Về danh sách bài đã lưu</a>
      </main>
    );
    return <Player item={item} audience={q.audience} start={q.start} warm={!!q.warm} />;
  }

  return (
    <main className="ofl wrap">
      <div className="ofl-head">
        <div>
          <h1>Bài đã lưu offline</h1>
          <p className="ofl-muted">Các bài thao giảng và bài giảng 3D đã lưu trên máy và trình duyệt này. Chiếu được cả khi không có mạng.</p>
        </div>
        <span className={`ofl-net${online ? ' is-on' : ''}`}>{online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />} {online ? 'Đang có mạng' : 'Đang mất mạng'}</span>
      </div>
      {err && <p className="adm-alert is-warn">{err}</p>}
      {list === null ? <p className="ofl-muted">Đang đọc kho trên máy…</p> : list.length === 0 ? (
        <div className="ofl-empty">
          <b>Chưa có bài nào được lưu trên máy này.</b>
          <p>Khi còn mạng, mở bài thao giảng hoặc bài giảng 3D trong Góc thầy cô, bấm <b>Lưu để chiếu offline</b>. Lên lớp mất mạng, mở lại trang này trên đúng máy và trình duyệt đó để chiếu.</p>
        </div>
      ) : (
        <ul className="ofl-list">
          {list.map((x) => (
            <li key={x.key} className="ofl-card">
              <span className={`ofl-ic is-${x.kind}`} aria-hidden="true">{x.kind === 'deck' ? <Presentation /> : <Box />}</span>
              <div className="ofl-info">
                <b>{x.title}</b>
                <small>{x.kind === 'deck' ? 'Bài thao giảng' : 'Bài giảng 3D'}{x.className ? `, lớp ${x.className}` : ''}. Lưu lúc {fmtWhen(x.savedAt)}, {fmtMB(x.bytes)}</small>
              </div>
              <div className="ofl-act">
                <a className="btn btn-primary btn-sm" href={`${PAGE}?id=${encodeURIComponent(x.key)}`}><MonitorPlay aria-hidden="true" /> Chiếu</a>
                {confirmDel === x.key ? (
                  <>
                    <button type="button" className="btn btn-sm ofl-del" onClick={() => void remove(x.key)}>Xoá khỏi máy</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDel(null)}>Thôi</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDel(x.key)} aria-label={`Xoá bài ${x.title} khỏi máy`}><Trash2 aria-hidden="true" /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="ofl-tip">Mẹo: lưu dấu trang (Ctrl + D) địa chỉ này. Khi sửa bài, bấm <b>Lưu để chiếu offline</b> lần nữa để cập nhật bản trên máy.</p>
    </main>
  );
}
