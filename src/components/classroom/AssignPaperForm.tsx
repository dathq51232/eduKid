'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { assignError, defaultDueInput, type ExamItem } from '@/lib/classroom/assignments';
import type { SubjectCode } from '@/lib/types';

// Giao một đề / phiếu bài tập cho cả lớp làm trực tiếp trên app: học sinh làm, máy chủ chấm, giáo viên xem thống kê từng câu.
export default function AssignPaperForm({ classId, title, subject, items, minutes, label = 'Giao làm trên app' }: {
  classId: string; title: string; subject: SubjectCode; items: ExamItem[]; minutes: number; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState(() => defaultDueInput(3));
  const [mins, setMins] = useState(Math.max(5, Math.min(120, minutes || 30)));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dueAt = new Date(due);
    if (Number.isNaN(dueAt.getTime())) return setMsg({ ok: false, text: 'Chọn hạn nộp.' });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_create_assignment', {
      p_class: classId, p_kind: 'exam', p_title: title.slice(0, 200), p_subject: subject, p_lesson: null, p_muc: null,
      p_questions: items, p_minutes: mins, p_due: dueAt.toISOString(), p_students: null,
    });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: assignError(error.message) });
    setMsg({ ok: true, text: `Đã giao "${title}" (${items.length} câu) cho cả lớp.` });
    setOpen(false);
  };

  return (
    <div className="assign-paper no-print">
      {!open ? (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setOpen(true); setMsg(null); }} disabled={!items.length}>
          <Send aria-hidden="true" /> {label}
        </button>
      ) : (
        <form className="assign-paper-form" onSubmit={submit}>
          <label className="adm-field"><span>Hạn nộp</span>
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} required />
          </label>
          <label className="adm-field"><span>Thời gian làm (phút)</span>
            <input type="number" min={5} max={120} value={mins} onChange={(e) => setMins(Math.max(5, Math.min(120, Number(e.target.value) || 30)))} />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}><Send aria-hidden="true" /> {busy ? 'Đang giao…' : 'Giao cho cả lớp'}</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Huỷ</button>
          <p className="dash-muted">Mỗi em làm một lần, máy chấm ngay (câu đúng hoàn toàn mới có điểm). Học sinh không thấy đáp án.</p>
        </form>
      )}
      {msg && (
        <p className={`adm-alert ${msg.ok ? 'is-ok' : 'is-error'}`} role="status">
          {msg.text} {msg.ok && <Link href={`/giao-vien/lop/${classId}/giao-bai`}>Xem bài đã giao →</Link>}
        </p>
      )}
    </div>
  );
}
