import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import DocStudio from '@/components/classroom/DocStudio';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Văn bản & in ấn · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Văn bản & in ấn: mẫu văn bản NĐ30, chuẩn hoá văn bản, in bảng Excel. Mọi xử lý trên trình duyệt; quyền: giáo viên của lớp.
export default async function DocStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'van-ban');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Văn bản & in ấn" /></main></>);
  const { data: { user } } = await p.supabase.auth.getUser();
  const { data: me } = user ? await p.supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle() : { data: null };
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <DocStudio teacher={(me?.display_name as string | undefined) ?? ''} className={p.cls.name} />
      </main>
    </>
  );
}
