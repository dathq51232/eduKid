'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { asciiFilename } from '@/lib/filename';
import type { Award, ExamCode, QualityLevel, SubjectLevel } from '@/lib/classroom/school';

// Tải "Bảng tổng hợp kết quả đánh giá giáo dục" theo mẫu vnEdu (.xlsx) + trang nhận xét của kỳ.
// Lấy dữ liệu đã LƯU (mức, điểm, phẩm chất – năng lực, khen thưởng, nhận xét); tạo file ngay trên trình duyệt.
export default function VneduExportButton({ classId, className, grade, year, exam, students, disabled }: {
  classId: string; className: string; grade: number; year: number; exam: ExamCode;
  students: { id: string; name: string }[]; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      const sb = createClient();
      const period = `${exam}-${year}`;
      const [sc, ql, aw, cm] = await Promise.all([
        sb.rpc('teacher_get_scores', { p_class: classId, p_period: period }),
        sb.rpc('teacher_get_qualities', { p_class: classId, p_period: period }),
        sb.rpc('teacher_list_awards', { p_class: classId }),
        sb.rpc('teacher_get_comments', { p_class: classId, p_period: period }),
      ]);
      if (sc.error || ql.error) { setErr('Chưa tải được sổ theo dõi (cần chạy migration 0016 trên Supabase).'); return; }
      const [{ vneduSheets, vneduFilename }, { downloadXlsx }] = await Promise.all([import('@/lib/classroom/vnedu'), import('@/lib/xlsx')]);
      const sheets = vneduSheets({
        className, grade, year, exam, students,
        scores: (sc.data ?? []) as { student_id: string; subject: string; score: number | null; level: SubjectLevel | null }[],
        qualities: (ql.data ?? []) as { student_id: string; item: string; level: QualityLevel | null }[],
        awards: aw.error ? [] : (aw.data ?? []) as Award[],
        comments: cm.error ? [] : (cm.data ?? []) as { student_id: string; subject: string; comment: string }[],
      });
      downloadXlsx(asciiFilename(vneduFilename(className, exam)), sheets);
    } catch {
      setErr('Chưa tạo được file. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="vnedu-export no-print">
      <button type="button" className="btn btn-outline btn-sm" onClick={run} disabled={busy || disabled || !students.length}
        title={disabled ? 'Lưu thay đổi trước khi xuất' : 'Bảng tổng hợp theo mẫu vnEdu, kèm trang nhận xét'}>
        <FileSpreadsheet aria-hidden="true" /> {busy ? 'Đang tạo file…' : 'Xuất mẫu vnEdu (.xlsx)'}
      </button>
      {err && <span className="adm-alert is-error">{err}</span>}
    </span>
  );
}
