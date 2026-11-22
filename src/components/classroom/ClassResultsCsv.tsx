'use client';

// Tải CSV kết quả cả lớp — chỉ hỏi database khi cô bấm (trước đây nhúng sẵn tới 5.000 dòng vào HTML trang lớp).
// Đọc theo trang 1.000 dòng (giới hạn mặc định của Supabase), RLS chỉ trả kết quả học sinh lớp cô dạy.
import { useState } from 'react';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fmtDateTime, percent, subjectLabel, toCsv, type LessonResult } from '@/lib/classroom/progress';
import { asciiFilename } from '@/lib/filename';
import '@/styles/btn.css';

const PAGE = 1000;
const MAX = 20000;
const HEADER = ['Học sinh', 'Bài', 'Môn', 'Số câu đúng', 'Tổng số câu', '% đúng', 'Điểm', 'Thời gian (giây)', 'Lúc làm'];

export default function ClassResultsCsv({ filename, students }: { filename: string; students: { id: string; name: string }[] }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const download = async () => {
    setBusy(true); setErr('');
    const supabase = createClient();
    const ids = students.map((s) => s.id);
    const names = new Map(students.map((s) => [s.id, s.name]));
    const all: LessonResult[] = [];
    for (let from = 0; from < MAX; from += PAGE) {
      const { data, error } = await supabase.from('lesson_results')
        .select('id, student_id, lesson_code, lesson_title, subject_code, grade, muc, score, total, points, duration_ms, created_at')
        .in('student_id', ids).order('created_at', { ascending: false }).range(from, from + PAGE - 1);
      if (error) { setErr('Chưa tải được kết quả. Kiểm tra mạng rồi thử lại.'); setBusy(false); return; }
      all.push(...((data ?? []) as LessonResult[]));
      if (!data || data.length < PAGE) break;
    }
    const rows = all.map((r) => [
      names.get(r.student_id) ?? '', r.lesson_title ?? r.lesson_code, subjectLabel(r.subject_code), r.score, r.total,
      percent(r.score, r.total), r.points, r.duration_ms ? Math.round(r.duration_ms / 1000) : null, fmtDateTime(r.created_at),
    ]);
    const url = URL.createObjectURL(new Blob([toCsv(HEADER, rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = asciiFilename(filename);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBusy(false);
  };

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm no-print" onClick={() => void download()} disabled={busy || students.length === 0}>
        <Download aria-hidden="true" /> {busy ? 'Đang tải…' : 'Tải Excel (CSV)'}
      </button>
      {err && <span className="dash-muted" role="alert">{err}</span>}
    </>
  );
}
