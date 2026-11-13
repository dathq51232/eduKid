// Tổng quan đầu trang lớp (kiểu bento): lời chào, dải học sinh hôm nay, bài đang giao, tình hình lớp,
// lỗ hổng kiến thức, bài lớp hay sai, tin nhắn phụ huynh, công cụ trên lớp. Chỉ hiển thị + liên kết sang các trang có sẵn.
import Link from 'next/link';
import { ArrowUpRight, BookOpen, ClipboardList, MessageSquare, MonitorPlay, Trophy, NotebookPen } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import { SUBJECT_NAME } from '@/lib/classroom/assignments';
import type { BentoData } from '@/lib/classroom/bento';
import type { SubjectCode } from '@/lib/types';

const TONES = ['#2f6fd6', '#d9472f', '#7c4ddb', '#1f9254', '#d9661c', '#0d8f8c', '#c2347a', '#5865c9'];
const tone = (s: string) => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
const initial = (name: string) => (name.trim().split(/\s+/).slice(-1)[0]?.[0] ?? '?').toUpperCase();
// eslint-disable-next-line @next/next/no-img-element
const F3d = ({ src }: { src: string }) => <img src={src} alt="" width={28} height={28} />;
const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 100)}%`);
// Vị trí cố định cho các nhãn "bài lớp hay sai" (trông như rải ngẫu nhiên nhưng ổn định giữa các lần vẽ)
const SPOTS = [
  { l: 30, t: 52, r: -6 }, { l: -2, t: 40, r: 12 }, { l: 62, t: 34, r: -16 }, { l: 6, t: 70, r: -6 },
  { l: 58, t: 66, r: 9 }, { l: 28, t: 82, r: 4 }, { l: 66, t: 86, r: -11 }, { l: -4, t: 90, r: -13 },
];

export default function ClassBento({ classId, className, teacher, data }: { classId: string; className: string; teacher: string; data: BentoData }) {
  const base = `/giao-vien/lop/${classId}`;
  const [hot, ...rest] = data.tasks;
  const top = Math.max(1, ...data.subjects.map((s) => s.n));
  const busiest = data.subjects.reduce((m, s) => (s.n > m.n ? s : m), data.subjects[0]);
  const todayPct = data.total ? data.activeToday / data.total : 0;

  return (
    <section className="tb" aria-label="Tổng quan lớp">
      <aside className="tb-side">
        <p className="tb-hi">Chào {teacher},</p>
        <h1 className="tb-title">Hôm nay lớp {className} học gì?</h1>
        <nav className="tb-nav" aria-label="Lối tắt">
          <Link href={`${base}/ke-hoach`}><NotebookPen aria-hidden="true" /> Kế hoạch bài dạy</Link>
          <Link href={`${base}/giao-bai`}><ClipboardList aria-hidden="true" /> Giao bài &amp; đề</Link>
          <Link href={`${base}/tin-nhan`}><MessageSquare aria-hidden="true" /> Tin nhắn phụ huynh{data.inbox?.unread ? <b>{data.inbox.unread}</b> : null}</Link>
          <Link href={`${base}/thi-dua`}><Trophy aria-hidden="true" /> Thi đua</Link>
          <Link href={`${base}/so-lop`}><BookOpen aria-hidden="true" /> Sổ lớp</Link>
        </nav>
        <Link href={`${base}/bai-giang-3d`} className="tb-promo">
          <span className="tb-promo-milo" aria-hidden="true"><MiloMascot variant="professor" size={104} /></span>
          <b>Bài giảng &amp; trình chiếu</b>
          <small>Soạn bài kiểu kéo thả, chiếu toàn màn hình có bút laser</small>
          <span className="tb-promo-btn"><MonitorPlay aria-hidden="true" /> Mở bài giảng</span>
        </Link>
      </aside>

      <div className="tb-main">
        {data.kids.length > 0 && (
          <ul className="tb-kids" aria-label={`Hôm nay ${data.activeToday}/${data.total} em đã học`}>
            {data.kids.map((k) => (
              <li key={k.id} className={`tb-kid${k.lift ? ' is-lift' : ''}`}>
                <Link href={`${base}/hoc-sinh/${k.id}`}>
                  <span className="tb-av" style={{ background: tone(k.name) }} aria-hidden="true">{initial(k.name)}</span>
                  <span><b>{k.name}</b><small className={k.tone === 'todo' ? 'is-todo' : ''}>{k.note}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="tb-cols">
          <div className="tb-col">
            <h2 className="tb-h">Bài đang giao</h2>
            {data.tasks.length === 0 ? (
              <Link href={`${base}/giao-bai`} className="tb-empty">
                <ClipboardList aria-hidden="true" />
                <span><b>Chưa giao bài nào</b><small>Giao bài luyện tập hoặc đề kiểm tra, các em làm trên app và cô xem kết quả ngay.</small></span>
                <span className="tb-go" aria-hidden="true"><ArrowUpRight /></span>
              </Link>
            ) : (
              <div className="tb-tasks">
                {[hot, ...rest].map((t, i) => (
                  <Link key={t.id} href={`${base}/giao-bai`} className={`tb-task${i === 0 && t.open ? ' is-hot' : ''}${t.open ? '' : ' is-closed'}`}>
                    <span className="tb-task-sub">{t.subject ? SUBJECT_NAME[t.subject as SubjectCode] : t.exam ? 'Đề' : ''}</span>
                    <b>{t.title}</b>
                    <small>{t.exam ? 'Đề kiểm tra' : 'Luyện tập'}{t.open ? '' : ', đã đóng'}</small>
                    {i === 0 && t.open && t.assigned > 0 && <span className="tb-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (t.done / t.assigned) * 100)}%` }} /></span>}
                    <span className="tb-task-meta">
                      <span>{t.done} / {t.assigned} em đã làm</span>
                      <span className={t.open && t.overdue ? 'is-over' : ''}>Hạn {t.due}{t.open && t.overdue ? ' (quá hạn)' : ''}</span>
                    </span>
                    <span className="tb-go" aria-hidden="true"><ArrowUpRight /></span>
                  </Link>
                ))}
              </div>
            )}

            <div className="tb-row2">
              <div className="tb-cloud">
                <p className="tb-cloud-h">Bài lớp hay sai <small>7 ngày qua</small></p>
                {data.tags.length === 0 ? (
                  <p className="tb-cloud-empty">Chưa có bài nào dưới 85% đúng. Lớp đang làm tốt!</p>
                ) : (
                  <ul>
                    {data.tags.map((t, i) => {
                      const s = SPOTS[i];
                      return (
                        <li key={t.title} className={i === 0 ? 'is-on' : ''} style={{ left: `${s.l}%`, top: `${s.t}%`, transform: `rotate(${s.r}deg)` }} title={`${t.title}: đúng ${pct(t.rate)}`}>
                          {t.title}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="tb-stack">
                {data.inbox && (
                  <Link href={`${base}/tin-nhan`} className="tb-msg">
                    <span className="tb-msg-ic" aria-hidden="true"><MessageSquare /></span>
                    <span>
                      {data.inbox.unread ? <><b>{data.inbox.unread} tin nhắn mới</b> từ phụ huynh{data.inbox.leave ? `, ${data.inbox.leave} đơn xin nghỉ chờ duyệt` : ''}</> : 'Không có tin nhắn mới từ phụ huynh'}
                      {data.inbox.latest && <small>Gần nhất: {data.inbox.latest}</small>}
                    </span>
                  </Link>
                )}
                <Link href={`${base}/thi-dua`} className="tb-yel">
                  <i className="tb-star a" aria-hidden="true" /><i className="tb-star b" aria-hidden="true" />
                  <span>7 ngày qua cả lớp làm<b>{data.weekAttempts} bài</b>luyện tập</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="tb-col">
            <h2 className="tb-h">Tình hình lớp</h2>
            <div className="tb-ov-wrap">
              <div className="tb-ov">
                <div className="tb-ov-top">
                  <div className="tb-chart">
                    <b>Tỉ lệ làm đúng 7 ngày qua</b>
                    <strong className="tb-big">{pct(data.rate)}</strong>
                    <small>{data.delta === null ? 'Chưa đủ số liệu tuần trước' : `${data.delta >= 0 ? '+' : '−'}${Math.abs(Math.round(data.delta * 1000) / 10).toLocaleString('vi-VN')} điểm % so với tuần trước`}</small>
                    <div className="tb-bars">
                      {data.subjects.map((s) => (
                        <span key={s.code} className={s.code === busiest.code && s.n ? 'is-on' : ''} style={{ height: `${Math.max(14, (s.n / top) * 100)}%` }}
                          data-tip={s.n ? `${s.label} ${pct(s.rate)}` : undefined}>
                          <em>{s.label}</em>
                          <span className="sr-only">{s.n} lượt, đúng {pct(s.rate)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {data.gap ? (
                    <Link href={`${base}/lo-hong`} className="tb-gap">
                      <span>Lỗ hổng kiến thức</span>
                      <b>{data.gap.count} em chưa vững <u>{data.gap.title}</u></b>
                      <span className="tb-gap-btn">Xem và giao bài ôn</span>
                    </Link>
                  ) : (
                    <Link href={`${base}/lo-hong`} className="tb-gap is-ok">
                      <span>Lỗ hổng kiến thức</span>
                      <b>Chưa thấy bài nào nhiều em chưa vững</b>
                      <span className="tb-gap-btn">Xem chi tiết</span>
                    </Link>
                  )}
                </div>
                <div className="tb-tools">
                  <Link href={`${base}/goi-ten`}><F3d src="/emoji/f3d/game-die.webp" /> Gọi tên</Link>
                  <Link href={`${base}/hen-gio`}><F3d src="/emoji/f3d/alarm-clock.webp" /> Hẹn giờ</Link>
                  <Link href={`${base}/bang-trang`}><F3d src="/emoji/f3d/framed-picture.webp" /> Bảng trắng</Link>
                </div>
              </div>
              <div className="tb-mini" aria-label={`Hôm nay ${data.activeToday}/${data.total} em đã học`}>
                <Link href={`${base}#class-progress-title`} className="tb-up" aria-label="Xem tiến độ cả lớp"><ArrowUpRight aria-hidden="true" /></Link>
                <span className="tb-today"><b>{data.activeToday}/{data.total}</b><i aria-hidden="true"><i style={{ height: `${Math.round(todayPct * 100)}%` }} /></i>em học hôm nay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
