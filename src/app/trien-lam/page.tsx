import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import FamilyGallery, { type FamilyClass } from '@/components/gallery/FamilyGallery';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Phòng triển lãm của lớp · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Phòng triển lãm cho gia đình: học sinh (phụ huynh dùng tài khoản của con) hoặc tài khoản phụ huynh đã liên kết.
// Chỉ thấy lớp của con mình (gallery_my_classes / gallery_list kiểm tra trong database).
export default async function FamilyGalleryPage({ searchParams }: { searchParams: Promise<{ lop?: string; em?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phòng triển lãm" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/trien-lam');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('gallery_my_classes');
  const list = (error ? [] : (data as FamilyClass[] | null) ?? []);
  const cls = list.find((c) => c.class_id === sp.lop && (!sp.em || c.student_id === sp.em)) ?? list.find((c) => c.student_id === viewer.studentId) ?? list[0];
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        {list.length > 1 && (
          <nav className="gm-kids" aria-label="Chọn con / lớp">
            {list.map((c) => (
              <Link key={`${c.class_id}-${c.student_id}`} href={`/trien-lam?lop=${c.class_id}&em=${c.student_id}`} className={`mini-btn${c === cls ? ' is-on' : ''}`} aria-current={c === cls ? 'page' : undefined}>
                {c.student_name} · lớp {c.class_name}
              </Link>
            ))}
          </nav>
        )}
        {cls ? (
          <FamilyGallery key={`${cls.class_id}-${cls.student_id}`} cls={cls} canSubmit={viewer.isStudent && viewer.studentId === cls.student_id} />
        ) : (
          <section className="dash-section">
            <h1>Phòng triển lãm của lớp</h1>
            <p className="dash-muted">{error ? 'Máy chủ chưa có Phòng triển lãm (cần chạy migration 0039).' : 'Tài khoản này chưa thuộc lớp nào. Đăng nhập bằng tài khoản của con (mã lớp + mã PIN cô gửi) để vào xem phòng triển lãm của lớp.'}</p>
          </section>
        )}
      </main>
    </>
  );
}
