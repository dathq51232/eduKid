'use client';

// "Kho câu hỏi" của giáo viên (trang riêng, mở từ dashboard / thanh công cụ): đề và kiến thức thầy cô tự tạo cho lớp mình,
// KHÔNG qua admin duyệt. Quy trình 4 bước: Nạp file → Tách & sinh câu → Máy kiểm (cảnh báo) → Cô duyệt & dùng.
// Câu đã lưu nằm trong "Ngân hàng của tôi" (teacher_questions) và được trộn vào Phiếu bài tập, Ma trận & đề kiểm tra.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, FileText, FileUp, ShieldCheck, Sparkles } from 'lucide-react';
import { bookLessons } from '@/lib/exams/matrix';
import type { SubjectCode } from '@/lib/types';
import MyBankPanel from './MyBankPanel';
import { useMyBank } from './useMyBank';
import '@/styles/mb.css';

const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const STEPS = [
  { Icon: FileUp, title: 'Nạp', text: 'Word, Excel, PDF có chữ, .txt hoặc dán nội dung' },
  { Icon: Sparkles, title: 'Tách & sinh câu', text: 'App tách từng câu; Toán đổi số tạo câu tương tự, hoặc sinh bằng AI' },
  { Icon: ShieldCheck, title: 'Máy kiểm', text: 'Tính lại đáp án, lời giải, phạm vi số của lớp — chỉ cảnh báo' },
  { Icon: CheckCheck, title: 'Cô duyệt & dùng', text: 'Giữ / sửa / bỏ từng câu, lưu vào kho của lớp mình' },
];

export default function QuestionBankStudio({ classId, grade }: { classId: string; grade: number }) {
  const subjects = useMemo(() => (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => bookLessons(s, grade).length > 0), [grade]);
  const [subject, setSubject] = useState<SubjectCode>(subjects[0] ?? 'toan');
  const lessons = useMemo(() => bookLessons(subject, grade), [subject, grade]);
  const bank = useMyBank(subject, grade);
  const base = `/giao-vien/lop/${classId}`;

  return (
    <div className="qb">
      <header className="qb-head">
        <div>
          <h1>Kho câu hỏi của tôi</h1>
          <p className="dash-muted">Câu hỏi, bài tập thầy cô tự tạo cho lớp mình — không cần chờ duyệt. Máy kiểm giúp phát hiện chỗ sai, thầy cô quyết định giữ hay sửa.</p>
        </div>
        <div className="qb-subj" role="tablist" aria-label="Môn">
          {subjects.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={s === subject} className={s === subject ? 'is-on' : ''} onClick={() => setSubject(s)}>{SUBJECT_NAME[s]}</button>
          ))}
        </div>
      </header>

      <ol className="qb-steps" aria-label="Các bước">
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title}><span className="qb-n">{i + 1}</span><Icon aria-hidden="true" /><b>{title}</b><small>{text}</small></li>
        ))}
      </ol>

      {bank.error && <p className="adm-alert is-error" role="alert">{bank.error}</p>}
      <MyBankPanel key={`${subject}-${grade}`} inline subject={subject} grade={grade} lessons={lessons} defaultLessonId={lessons[0]?.id ?? ''} mine={bank.mine}
        onSaved={bank.add} onDeleted={bank.remove} />

      <p className="qb-use dash-muted">
        <FileText aria-hidden="true" /> Câu đã lưu được chọn tự động khi ra
        <Link href={`${base}/phieu-bai-tap`}>Phiếu bài tập</Link> và <Link href={`${base}/de-kiem-tra`}>Ma trận &amp; đề kiểm tra</Link> của bài tương ứng.
      </p>
    </div>
  );
}
