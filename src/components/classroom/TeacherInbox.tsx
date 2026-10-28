'use client';

// Hộp thư phụ huynh của lớp: xin phép nghỉ, hỏi han… Mỗi tin ghi rõ người gửi (Mẹ Nguyễn Thị Lan) là phụ huynh em nào.
// Cô bấm "Đồng ý" để trả lời và ghi luôn "Vắng có phép" vào Sổ lớp những ngày xin nghỉ; hoặc gõ trả lời ngắn.
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, CheckCheck, MessageSquareReply, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { KIND_ICON, KIND_LABEL, ago, isMissing, leaveRange, senderLabel, type Inbox, type MsgStatus, type TeacherMsg } from '@/lib/classroom/messages';

type Filter = 'all' | 'new' | 'leave';
const ST_LABEL: Record<MsgStatus, string> = { new: 'Mới', read: 'Đã xem', approved: 'Đã đồng ý', declined: 'Không đồng ý', answered: 'Đã trả lời' };

export default function TeacherInbox({ classId, className, initial, missing }: { classId: string; className: string; initial: Inbox; missing: boolean }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [box, setBox] = useState<Inbox>(initial);
  const [filter, setFilter] = useState<Filter>(initial.unread ? 'new' : 'all');
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [keep, setKeep] = useState<Set<string>>(new Set()); // tin đã mở trong lần này: vẫn giữ trong danh sách đang lọc

  const reload = async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc('teacher_messages', { p_class: classId, p_limit: 200 });
    if (data) setBox(data as Inbox);
  };
  const act = async (m: TeacherMsg, status: 'read' | 'answered' | 'approved' | 'declined', diary = false) => {
    if (!supabase) return;
    setBusy(m.id); setNote('');
    const text = (reply[m.id] ?? '').trim() || (status === 'approved' ? 'Cô đã nhận được tin xin phép của gia đình. Cô đồng ý cho cháu nghỉ ạ.' : status === 'declined' ? 'Cô chưa đồng ý được, gia đình liên hệ cô để trao đổi thêm nhé.' : '');
    const { data, error } = await supabase.rpc('teacher_message_update', { p_id: m.id, p_status: status, p_reply: status === 'read' ? null : text || null, p_diary: diary });
    setBusy('');
    if (error) { setNote('Chưa lưu được, thầy cô thử lại nhé.'); return; }
    const days = (data as { diary_days?: number } | null)?.diary_days ?? 0;
    if (status === 'approved' && diary) setNote(days ? `Đã ghi "Vắng có phép" vào Sổ lớp ${days} ngày học cho em ${m.student_name}.` : 'Đã đồng ý (khoảng ngày xin nghỉ không có ngày học nào).');
    else if (status !== 'read') setNote('Đã gửi trả lời cho phụ huynh.');
    setReply((r) => ({ ...r, [m.id]: '' }));
    await reload();
  };
  // Xoá khỏi hộp thư của cô (gia đình vẫn xem được tin đã gửi và lời trả lời) — migration 0041
  const isDone = (m: TeacherMsg) => m.status !== 'new' && !(m.kind === 'leave' && m.status === 'read');
  const done = box.items.filter(isDone);
  const remove = async (ids: string[], ask: string) => {
    if (!supabase || !ids.length || !window.confirm(ask)) return;
    setBusy('xoa'); setNote('');
    const { data, error } = await supabase.rpc('teacher_message_delete', { p_class: classId, p_ids: ids });
    setBusy('');
    if (error) { setNote(isMissing(error.message) ? 'Chưa bật chức năng xoá: chạy migration 0041_parent_messages_delete.sql trên Supabase.' : 'Chưa xoá được, thầy cô thử lại nhé.'); return; }
    setOpen(null);
    setNote(`Đã xoá ${(data as number) ?? ids.length} tin khỏi hộp thư. Gia đình vẫn xem lại được tin đã gửi và lời trả lời của cô.`);
    await reload();
  };
  const toggle = (m: TeacherMsg) => {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next) setKeep((k) => new Set(k).add(m.id));
    if (next && m.status === 'new') void act(m, 'read');
  };

  const items = box.items.filter((m) => filter === 'all' || keep.has(m.id) || (filter === 'new' ? m.status === 'new' : m.kind === 'leave' && (m.status === 'new' || m.status === 'read')));

  return (
    <div className="ct inb">
      <div className="ct-head">
        <div><p className="ct-sub">Lớp {className} · Phụ huynh</p><h1>Tin nhắn phụ huynh</h1></div>
      </div>
      <p className="s3h-lead">Phụ huynh nhắn từ trang Phụ huynh (đăng nhập bằng tài khoản của con). Mỗi tin ghi rõ người gửi và là phụ huynh của em nào. Đồng ý xin phép sẽ tự ghi <b>Vắng có phép</b> vào Sổ lớp.</p>
      {missing && <p className="adm-alert is-warn">Chưa bật: chạy <code>supabase/migrations/0037_parent_messages.sql</code> trên Supabase.</p>}
      {note && <p className="adm-alert is-ok" role="status">{note}</p>}

      <div className="s3h-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={filter === 'new'} onClick={() => setFilter('new')}>Chưa đọc <span>{box.unread}</span></button>
        <button type="button" role="tab" aria-selected={filter === 'leave'} onClick={() => setFilter('leave')}>Xin phép chờ duyệt <span>{box.pending_leave}</span></button>
        <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>Tất cả <span>{box.items.length}</span></button>
        {done.length > 0 && (
          <button type="button" className="inb-clean" disabled={busy === 'xoa'} onClick={() => void remove(done.map((m) => m.id), `Xoá ${done.length} tin đã xem / đã trả lời khỏi hộp thư? Tin mới và tin xin phép chưa duyệt được giữ lại.`)}>
            <Trash2 aria-hidden="true" /> Xoá tin đã xử lý ({done.length})
          </button>
        )}
      </div>

      {items.length === 0 ? <p className="dash-muted inb-empty">{filter === 'new' ? 'Không có tin mới. 🎉' : 'Chưa có tin nhắn nào.'}</p> : (
        <ul className="inb-list">
          {items.map((m) => {
            const isOpen = open === m.id; const pending = m.kind === 'leave' && (m.status === 'new' || m.status === 'read');
            return (
              <li key={m.id} className={`inb-item is-${m.status}${isOpen ? ' is-open' : ''}`}>
                <button type="button" className="inb-sum" onClick={() => toggle(m)} aria-expanded={isOpen}>
                  <span className={`inb-kind is-${m.kind}`} aria-hidden="true">{KIND_ICON[m.kind]}</span>
                  <span className="inb-who">
                    <b>{senderLabel(m)}</b>
                    <small>Phụ huynh em <strong>{m.student_name}</strong> · {KIND_LABEL[m.kind]}{m.kind === 'leave' ? ` · ${leaveRange(m)}` : ''}</small>
                    {!isOpen && <span className="inb-snip">{m.body}</span>}
                  </span>
                  <span className="inb-meta"><span className={`inb-st is-${m.status}`}>{ST_LABEL[m.status]}</span><small>{ago(m.created_at)}</small></span>
                </button>
                {isOpen && (
                  <div className="inb-body">
                    <p className="inb-text">{m.body}</p>
                    {m.reply && <p className="inb-replied"><CheckCheck aria-hidden="true" /> Cô đã trả lời: {m.reply}</p>}
                    <textarea value={reply[m.id] ?? ''} onChange={(e) => setReply((r) => ({ ...r, [m.id]: e.target.value }))} rows={2} maxLength={1000} placeholder={pending ? 'Lời nhắn kèm theo (không bắt buộc)…' : 'Trả lời phụ huynh…'} />
                    <div className="inb-act">
                      {pending ? (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" disabled={busy === m.id} onClick={() => void act(m, 'approved', true)}><Check aria-hidden="true" /> Đồng ý &amp; ghi vắng có phép</button>
                          <button type="button" className="btn btn-outline btn-sm" disabled={busy === m.id} onClick={() => void act(m, 'approved', false)}>Chỉ đồng ý</button>
                          <button type="button" className="btn btn-outline btn-sm is-danger" disabled={busy === m.id} onClick={() => void act(m, 'declined')}><X aria-hidden="true" /> Không đồng ý</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-primary btn-sm" disabled={busy === m.id || !(reply[m.id] ?? '').trim()} onClick={() => void act(m, 'answered')}><MessageSquareReply aria-hidden="true" /> Gửi trả lời</button>
                      )}
                      <Link href={`/giao-vien/lop/${classId}/danh-ba`} className="ct-link">Danh bạ phụ huynh</Link>
                      <button type="button" className="btn btn-outline btn-sm inb-del" disabled={busy === 'xoa'}
                        onClick={() => void remove([m.id], pending ? `Tin xin phép của ${senderLabel(m)} CHƯA được duyệt. Vẫn xoá khỏi hộp thư?` : `Xoá tin của ${senderLabel(m)} khỏi hộp thư?`)}>
                        <Trash2 aria-hidden="true" /> Xoá tin
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
