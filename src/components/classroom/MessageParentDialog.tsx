'use client';

// Cô nhắn riêng phụ huynh một em ngay trong app (migration 0059). Phụ huynh xem ở trang Phụ huynh khi đăng nhập
// bằng tài khoản của con, trả lời được bằng "Nhắn cô". Có số Zalo thì thêm nút chép tin & mở Zalo.
import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Clock, MessageCircle, Send, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { zaloHref } from '@/lib/classroom/class-tools';
import { ago, senderLabel, teacherSendError, type Inbox, type TeacherMsg } from '@/lib/classroom/messages';

const callName = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

export default function MessageParentDialog({ classId, student, zalo, onClose, onSent }: {
  classId: string; student: { id: string; name: string }; zalo?: string | null; onClose: () => void; onSent?: (msg: string) => void;
}) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [history, setHistory] = useState<TeacherMsg[] | null>(null);
  const name = callName(student.name);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.rpc('teacher_messages', { p_class: classId, p_limit: 200 }).then(({ data }) => {
      if (alive) setHistory(((data as Inbox | null)?.items ?? []).filter((m) => m.student_id === student.id).slice(0, 6));
    });
    return () => { alive = false; };
  }, [supabase, classId, student.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const send = async () => {
    if (!supabase || !body.trim()) return;
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('teacher_message_send', { p_class: classId, p_student: student.id, p_body: body.trim() });
    setBusy(false);
    if (error) { setErr(teacherSendError(error.message)); return; }
    onSent?.(`Đã gửi tin cho phụ huynh em ${student.name}. Phụ huynh xem ở trang Phụ huynh (đăng nhập bằng tài khoản của con).`);
    onClose();
  };
  const openZalo = () => { if (body.trim()) void navigator.clipboard?.writeText(body.trim()).catch(() => undefined); };

  const quick = [
    `Kính gửi phụ huynh em ${name}, hôm nay con học tập rất tích cực, cô khen con ạ.`,
    `Kính gửi phụ huynh em ${name}, gia đình nhắc con hoàn thành bài tập về nhà giúp cô nhé.`,
    `Kính gửi phụ huynh em ${name}, cô muốn trao đổi thêm với gia đình về việc học của con. Gia đình sắp xếp thời gian liên hệ cô ạ.`,
  ];

  return (
    <div className="ct-modal-bg" onClick={onClose}>
      <div className="ct-modal mp" role="dialog" aria-modal="true" aria-label={`Nhắn phụ huynh em ${student.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-head"><h2>💬 Nhắn phụ huynh em {student.name}</h2><button type="button" className="ct-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        <p className="dash-muted">Tin gửi ngay trong app, chỉ gia đình em {name} xem được ở trang Phụ huynh. Phụ huynh trả lời sẽ hiện ở mục Tin nhắn phụ huynh.</p>

        {history && history.length > 0 && (
          <ul className="mp-hist" aria-label="Tin nhắn gần đây">
            {history.slice().reverse().map((m) => (
              <li key={m.id} className={m.from_teacher ? 'is-me' : ''}>
                <small>{m.from_teacher ? 'Cô' : senderLabel(m)} · {ago(m.created_at)}</small>
                <p>{m.body}</p>
                {m.reply && <p className="mp-reply"><b>Cô trả lời:</b> {m.reply}</p>}
                {m.from_teacher && <span className={`mp-seen${m.parent_read_at ? ' is-seen' : ''}`}>{m.parent_read_at ? <><CheckCheck aria-hidden="true" /> Phụ huynh đã xem</> : <><Clock aria-hidden="true" /> Chưa xem</>}</span>}
              </li>
            ))}
          </ul>
        )}

        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={1000} autoFocus placeholder={`Kính gửi phụ huynh em ${name}, …`} aria-label="Nội dung tin nhắn" />
        <div className="pm-quick">{quick.map((q) => <button key={q} type="button" onClick={() => setBody(q)}>{q}</button>)}</div>
        {err && <p className="adm-alert is-error" role="alert">{err}</p>}
        <div className="ct-modal-foot">
          {zalo && <a className="btn btn-outline" href={zaloHref(zalo)} target="_blank" rel="noopener noreferrer" onClick={openZalo} title="Chép tin nhắn rồi mở Zalo của phụ huynh"><MessageCircle aria-hidden="true" /> Chép & mở Zalo</a>}
          <button type="button" className="btn btn-outline" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" disabled={busy || !body.trim()} onClick={() => void send()}><Send aria-hidden="true" /> {busy ? 'Đang gửi…' : 'Gửi trong app'}</button>
        </div>
      </div>
    </div>
  );
}
