'use client';

// CHUÔNG THÔNG BÁO trên đầu trang chủ giáo viên: tin nhắn phụ huynh chưa xem + sinh nhật học sinh (hôm nay / sắp tới).
// Có việc cần chú ý → chuông đổi màu, lắc nhẹ và có vòng sáng lan ra (chỉ animate transform / opacity) để giáo viên nhận ra ngay.
// Bấm chuông → khung danh sách; bấm ra ngoài hoặc Esc để đóng.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Cake, ChevronRight, MessageCircle, X } from 'lucide-react';

export type BellMsg = { id: string; who: string; student: string; kind: string; icon: string; text: string; at: string };
export type BellBirthday = { id: string; name: string; inDays: number; age: number; date: string };

/** "vừa xong" / "15 phút trước" / "3 giờ trước" / "2 ngày trước" */
function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}
const when = (d: number) => (d === 0 ? 'Hôm nay' : d === 1 ? 'Ngày mai' : `${d} ngày nữa`);

export default function TeacherBell({ base, unread, msgs, births }: { base: string; unread: number; msgs: BellMsg[]; births: BellBirthday[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false); // đã mở xem trong lần này → thôi lắc
  const box = useRef<HTMLDivElement>(null);
  const today = births.filter((b) => b.inDays === 0).length;
  const count = unread + today;
  const hot = count > 0 && !seen;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const label = count
    ? `${unread ? `${unread} tin nhắn phụ huynh chưa xem` : ''}${unread && today ? ', ' : ''}${today ? `${today} em sinh nhật hôm nay` : ''}`
    : 'Thông báo';

  return (
    <div className="tdy-bell-wrap" ref={box}>
      <button type="button" className={`tdy-bell${count ? ' has-new' : ''}${hot ? ' is-hot' : ''}`} aria-label={label} aria-expanded={open} aria-haspopup="dialog"
        onClick={() => { setOpen((v) => !v); setSeen(true); }}>
        <Bell aria-hidden="true" />
        {count > 0 && <span>{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="tdy-bell-pop" role="dialog" aria-label="Thông báo">
          <div className="tdy-bell-hd">
            <b>Thông báo</b>
            <button type="button" className="tdy-bell-x" onClick={() => setOpen(false)} aria-label="Đóng"><X aria-hidden="true" /></button>
          </div>

          {births.length > 0 && (
            <section>
              <h3><Cake aria-hidden="true" /> Sinh nhật</h3>
              <ul>
                {births.map((b) => (
                  <li key={b.id} className={b.inDays === 0 ? 'is-today' : undefined}>
                    <Link href={`${base}/thu-khen`} onClick={() => setOpen(false)}>
                      <span className="tdy-bell-ic is-cake" aria-hidden="true">🎂</span>
                      <span className="tdy-bell-txt">
                        <b>{b.name}</b>
                        <small>{when(b.inDays)} ({b.date}) · tròn {b.age} tuổi</small>
                      </span>
                      {b.inDays === 0 && <em>Gửi thư khen</em>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3><MessageCircle aria-hidden="true" /> Tin nhắn phụ huynh {unread > 0 && <span className="tdy-bell-n">{unread} chưa xem</span>}</h3>
            {msgs.length ? (
              <ul>
                {msgs.map((m) => (
                  <li key={m.id} className="is-new">
                    <Link href={`${base}/tin-nhan`} onClick={() => setOpen(false)}>
                      <span className="tdy-bell-ic" aria-hidden="true">{m.icon}</span>
                      <span className="tdy-bell-txt">
                        <b>{m.who} <i>· {m.student}</i></b>
                        <small>{m.kind}: {m.text}</small>
                        <small className="tdy-bell-at">{ago(m.at)}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="tdy-bell-empty">Chưa có tin nhắn mới.</p>}
          </section>

          <Link href={`${base}/tin-nhan`} className="tdy-bell-all" onClick={() => setOpen(false)}>Xem tất cả tin nhắn <ChevronRight aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}
