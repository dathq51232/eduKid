'use client';

// Công cụ Bảng trắng của giáo viên (nhóm Dạy học): tải trình vẽ chỉ ở trình duyệt.
import dynamic from 'next/dynamic';

const Whiteboard = dynamic(() => import('@/components/board/Whiteboard'), { ssr: false, loading: () => <p className="dash-muted" role="status">Đang mở bảng trắng…</p> });

export default function WhiteboardTool({ classId }: { classId: string }) {
  return <Whiteboard classId={classId} />;
}
