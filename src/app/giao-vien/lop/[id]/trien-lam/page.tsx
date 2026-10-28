import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GalleryManager from '@/components/gallery/GalleryManager';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Phòng triển lãm · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Phòng triển lãm của lớp (migration 0039) — giáo viên dạy lớp treo / duyệt / quản lý tác phẩm; quyền kiểm tra trong database.
export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'trien-lam');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phòng triển lãm" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <GalleryManager classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
