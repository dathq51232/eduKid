'use client';

// Nạp bài soạn sẵn + bộ sinh câu của đúng khối lớp trước khi hiện công cụ (ra đề, phiếu bài tập...).
// Mỗi khối là một gói mã riêng: trang chỉ tải khối của lớp đang dạy thay vì cả 5 khối.
import { useEffect, useState } from 'react';
import { contentVersion } from '@/lib/content/store';
import { gradeLoaded, loadGrade } from '@/lib/grade-loader';

/** Trả về số phiên bản kho bài: đổi khi khối vừa nạp xong (dùng làm phụ thuộc cho useMemo) */
export function useGradeContent(grade: number): { ready: boolean; failed: boolean; version: number } {
  const [state, setState] = useState(() => ({ ready: gradeLoaded(grade), failed: false, version: contentVersion() }));
  useEffect(() => {
    let live = true;
    if (gradeLoaded(grade)) { setState({ ready: true, failed: false, version: contentVersion() }); return; }
    setState((s) => ({ ...s, ready: false, failed: false }));
    loadGrade(grade).then(
      () => { if (live) setState({ ready: true, failed: false, version: contentVersion() }); },
      () => { if (live) setState((s) => ({ ...s, failed: true })); },
    );
    return () => { live = false; };
  }, [grade]);
  return state;
}

export default function GradeReady({ grade, children }: { grade: number; children: React.ReactNode }) {
  const { ready, failed } = useGradeContent(grade);
  if (ready) return <>{children}</>;
  if (failed) return <p className="adm-alert is-error" role="alert">Chưa tải được ngân hàng bài lớp {grade} (mạng chập chờn?). <button type="button" className="mini-btn" onClick={() => window.location.reload()}>Thử lại</button></p>;
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-dot" aria-hidden="true" /><span className="page-loading-dot" aria-hidden="true" /><span className="page-loading-dot" aria-hidden="true" />
      <span className="sr-only">Đang tải ngân hàng bài lớp {grade}…</span>
    </div>
  );
}
