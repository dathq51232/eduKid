'use client';

// Trang Luyện chữ của giáo viên: tạo trang vở A4 để in / giao bài, luyện trên màn hình (chiếu bảng làm mẫu)
// và Bảng trắng (bút nét thanh nhọn, hình, khối, đồ dùng Toán, thước, êke, compa).
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MonitorSmartphone, NotebookPen, Presentation } from 'lucide-react';
import HandwritingPractice from './HandwritingPractice';
import WritingSheetBuilder from './WritingSheetBuilder';
import { ToolIcon } from '@/components/classroom/tool-icons';

const Whiteboard = dynamic(() => import('@/components/board/Whiteboard'), { ssr: false, loading: () => <p className="dash-muted" role="status">Đang mở bảng trắng…</p> });

export default function TeacherWriting({ classId, className, grade }: { classId: string; className: string; grade: number }) {
  const [tab, setTab] = useState<'vo' | 'man-hinh' | 'bang'>('vo');
  return (
    <div className="tw">
      <nav className="gm-tabs" role="tablist" aria-label="Luyện chữ">
        <button type="button" role="tab" aria-selected={tab === 'vo'} className={tab === 'vo' ? 'is-on' : ''} onClick={() => setTab('vo')}><NotebookPen aria-hidden="true" /> Trang vở in (A4)</button>
        <button type="button" role="tab" aria-selected={tab === 'man-hinh'} className={tab === 'man-hinh' ? 'is-on' : ''} onClick={() => setTab('man-hinh')}><MonitorSmartphone aria-hidden="true" /> Luyện trên màn hình</button>
        <button type="button" role="tab" aria-selected={tab === 'bang'} className={tab === 'bang' ? 'is-on' : ''} onClick={() => setTab('bang')}><Presentation aria-hidden="true" /> Bảng trắng</button>
      </nav>
      {tab === 'vo' ? (
        <>
          <header className="tw-head"><h1><ToolIcon k="luyen-chu" /> Trang vở luyện chữ — lớp {className}</h1>
            <p className="dash-muted">Nhập câu thơ, ca dao hoặc chọn trong kho câu mẫu; chọn font tập viết, vở 4 hay 5 ô li, màu đường kẻ, hoạ tiết góc vở rồi in cho các em viết.</p></header>
          <WritingSheetBuilder classId={classId} className={className} grade={grade} />
        </>
      ) : tab === 'bang' ? <Whiteboard classId={classId} /> : <HandwritingPractice grade={grade} />}
    </div>
  );
}
