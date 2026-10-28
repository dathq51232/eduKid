'use client';

// Chờ nạp bài của đúng khối (lớp 1–5) trước khi hiện trang học: mỗi khối là một gói mã riêng, tải lần đầu rồi trình duyệt nhớ.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import { lessonGradeFromId, parseGrade } from '@/lib/basics';
import { gradeLoaded, loadGrade } from '@/lib/grade-loader';

export default function GradeGate({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const grade = lessonGradeFromId(sp.get('lessonId')) ?? parseGrade(sp.get('grade'));
  const [ready, setReady] = useState(() => gradeLoaded(grade));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    if (gradeLoaded(grade)) { setReady(true); return; }
    setReady(false); setFailed(false);
    loadGrade(grade).then(() => { if (live) setReady(true); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [grade]);
  if (ready) return <>{children}</>;
  return (
    <>
      <LearnHeader />
      <main className="wrap">
        {failed ? (
          <p className="adm-alert is-error" role="alert">Chưa tải được bài học (mạng chập chờn?). <button type="button" className="mini-btn" onClick={() => window.location.reload()}>Thử lại</button></p>
        ) : (
          <div className="page-loading" role="status" aria-live="polite">
            <span className="page-loading-dot" aria-hidden="true" /><span className="page-loading-dot" aria-hidden="true" /><span className="page-loading-dot" aria-hidden="true" />
            <span className="sr-only">Đang tải bài học lớp {grade}…</span>
          </div>
        )}
      </main>
    </>
  );
}
