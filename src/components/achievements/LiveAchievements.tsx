'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Medal, RefreshCw } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { AchievementsPayload, BoardRow } from '@/lib/achievements';

const REFRESH_MS = 30_000;

function timeVi(iso: string) {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return ''; }
}

/** Lấy dữ liệu thật từ /api/thanh-tich, tự làm mới mỗi 30 giây và ngay khi em quay lại tab. */
function useAchievements(classId?: string) {
  const [data, setData] = useState<AchievementsPayload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);

  const load = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/thanh-tich${classId ? `?lop=${classId}` : ''}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error === 'not_allowed' ? 'Em không có quyền xem bảng điểm lớp này.' : json.error === 'signed_out' ? 'Em cần đăng nhập để xem thành tích.' : 'Chưa tải được thành tích. Đang thử lại…');
        return;
      }
      setError('');
      setData(json as AchievementsPayload);
    } catch {
      setError('Mất kết nối. Đang thử lại…');
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }, [classId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible); };
  }, [load]);

  return { data, error, busy, reload: load };
}

function Board({ title, rows, empty }: { title: string; rows: BoardRow[]; empty: string }) {
  return (
    <section className="lb-card" aria-label={title}>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="lb-empty">{empty}</p>
      ) : (
        <ol className="lb-list">
          {rows.map((r) => (
            <li key={`${r.rank}-${r.display_name}`} className={`lb-row${r.is_me ? ' is-me' : ''}${r.rank <= 3 ? ` top-${r.rank}` : ''}`}>
              <span className="lb-rank" aria-label={`Hạng ${r.rank}`}>{r.rank <= 3 ? <Medal aria-hidden="true" /> : r.rank}</span>
              <span className="lb-name">{r.display_name}{r.is_me && <em> (em)</em>}</span>
              <span className="lb-meta">{r.lessons} bài</span>
              <strong className="lb-points">{r.points.toLocaleString('vi-VN')}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function UpdatedLine({ at, busy, onReload }: { at?: string; busy: boolean; onReload: () => void }) {
  return (
    <p className="lb-updated">
      {at ? <>Cập nhật lúc {timeVi(at)} · tự làm mới mỗi 30 giây</> : 'Đang tải…'}
      <button type="button" className="mini-btn" onClick={onReload} disabled={busy} aria-label="Làm mới ngay">
        <RefreshCw aria-hidden="true" className={busy ? 'spin' : undefined} /> Làm mới
      </button>
    </p>
  );
}

/** Bảng "bạn điểm cao nhất" tuần/tháng của một lớp (dùng ở trang Quản lý lớp của thầy cô). */
export function ClassLeaderboard({ classId }: { classId: string }) {
  const { data, error, busy, reload } = useAchievements(classId);
  return (
    <section className="dash-section lb-section" aria-labelledby="lb-class-title">
      <h2 id="lb-class-title">Bạn điểm cao nhất</h2>
      {error && <p className="adm-alert is-warn" role="status">{error}</p>}
      <div className="lb-grid">
        <Board title="Tuần này" rows={data?.week ?? []} empty="Tuần này chưa bạn nào có điểm." />
        <Board title="Tháng này" rows={data?.month ?? []} empty="Tháng này chưa bạn nào có điểm." />
      </div>
      <UpdatedLine at={data?.at} busy={busy} onReload={() => void reload()} />
    </section>
  );
}

/** Trang Thành tích của học sinh đang đăng nhập — dữ liệu thật từ máy chủ. */
export default function LiveAchievements() {
  const { data, error, busy, reload } = useAchievements();
  const me = data?.me;
  return (
    <>
      <header className="ach-hero">
        <MiloMascot mood="cheer" size={104} />
        <div>
          <h1>Thành tích của {me?.display_name ?? 'em'}</h1>
          <p>{me?.class_name ? <>Lớp <strong>{me.class_name}</strong>. </> : null}Điểm mỗi bài tính theo lần làm tốt nhất; làm lại cùng một bài không cộng dồn.</p>
        </div>
      </header>

      {error && <p className="adm-alert is-warn" role="status">{error}</p>}

      <section aria-labelledby="ach-summary" className="ach-section">
        <h2 id="ach-summary" className="sr-only">Tổng quan</h2>
        <dl className="ach-stats ach-stats-6">
          <div><dt>Tổng điểm</dt><dd>{me ? me.total_points.toLocaleString('vi-VN') : '…'}</dd></div>
          <div><dt>Điểm tuần này</dt><dd>{me ? me.week_points.toLocaleString('vi-VN') : '…'}</dd></div>
          <div><dt>Điểm tháng này</dt><dd>{me ? me.month_points.toLocaleString('vi-VN') : '…'}</dd></div>
          <div><dt>Bài đã làm</dt><dd>{me?.lessons_done ?? '…'}</dd></div>
          <div><dt>Bài đúng hết</dt><dd>{me?.perfect_lessons ?? '…'}</dd></div>
          <div><dt>Lượt chơi game</dt><dd>{me?.games_played ?? '…'}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="lb-title" className="ach-section lb-section">
        <h2 id="lb-title">Bạn điểm cao nhất lớp {me?.class_name ?? ''}</h2>
        {data && !data.classId ? (
          <p className="lb-empty">Em chưa ở trong lớp nào đang hoạt động, nên chưa có bảng điểm lớp.</p>
        ) : (
          <div className="lb-grid">
            <Board title="Tuần này" rows={data?.week ?? []} empty="Tuần này chưa bạn nào có điểm. Làm một bài để mở màn nhé!" />
            <Board title="Tháng này" rows={data?.month ?? []} empty="Tháng này chưa bạn nào có điểm." />
          </div>
        )}
        <UpdatedLine at={data?.at} busy={busy} onReload={() => void reload()} />
      </section>

      <p className="lb-cta"><Link href="/chon-bai" className="btn btn-yellow">Làm thêm bài để tăng điểm</Link></p>
    </>
  );
}
