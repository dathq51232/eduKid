import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import DeckReview from '@/components/deck/DeckReview';
import { getViewer } from '@/lib/auth/viewer';
import '@/styles/dash.css';
import '@/styles/rvw.css';

export const metadata: Metadata = { title: 'Góp ý bài thao giảng · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Đồng nghiệp trong tổ chuyên môn mở link góp ý (migration 0061): xem từng trang (chỉ xem) và góp ý theo trang.
export default async function DeckReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const v = await getViewer();
  if (v.state === 'signed_out') redirect(`/dang-nhap?next=/gop-y/${token}`);
  const teacher = v.state === 'ok' && (v.isTeacher || v.isAdmin);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap rvw-page">
        {teacher ? <DeckReview token={token} /> : (
          <section className="dash-card"><h1>Góp ý bài thao giảng</h1><p className="dash-muted">Link góp ý chỉ mở được bằng tài khoản giáo viên. Thầy cô đăng nhập tài khoản giáo viên rồi mở lại link.</p></section>
        )}
      </main>
    </>
  );
}
