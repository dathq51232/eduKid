'use client';

// Trang Luyện chữ của giáo viên: tạo trang vở A4 để in / giao bài, hoặc luyện trên màn hình (chiếu bảng làm mẫu).
import { useState } from 'react';
import { MonitorSmartphone, NotebookPen } from 'lucide-react';
import HandwritingPractice from './HandwritingPractice';
import WritingSheetBuilder from './WritingSheetBuilder';

export default function TeacherWriting({ classId, className, grade }: { classId: string; className: string; grade: number }) {
  const [tab, setTab] = useState<'vo' | 'man-hinh'>('vo');
  return (
    <div className="tw">
      <nav className="gm-tabs" role="tablist" aria-label="Luyện chữ">
        <button type="button" role="tab" aria-selected={tab === 'vo'} className={tab === 'vo' ? 'is-on' : ''} onClick={() => setTab('vo')}><NotebookPen aria-hidden="true" /> Trang vở in (A4)</button>
        <button type="button" role="tab" aria-selected={tab === 'man-hinh'} className={tab === 'man-hinh' ? 'is-on' : ''} onClick={() => setTab('man-hinh')}><MonitorSmartphone aria-hidden="true" /> Luyện trên màn hình</button>
      </nav>
      {tab === 'vo' ? (
        <>
          <header className="tw-head"><h1><NotebookPen aria-hidden="true" /> Trang vở luyện chữ — lớp {className}</h1>
            <p className="dash-muted">Nhập câu thơ, ca dao hoặc chọn trong kho câu mẫu; chọn font tập viết, vở 4 hay 5 ô li, màu đường kẻ, hoạ tiết góc vở rồi in cho các em viết.</p></header>
          <WritingSheetBuilder classId={classId} className={className} grade={grade} />
        </>
      ) : <HandwritingPractice grade={grade} />}
    </div>
  );
}
