import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import PersonalMoney from '@/components/classroom/PersonalMoney';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Thu chi cá nhân · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Thu chi cá nhân (0052): dữ liệu riêng của giáo viên, không gắn với lớp (đặt dưới lớp để dùng chung thanh công cụ).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'thu-chi');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Thu chi cá nhân" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <PersonalMoney />
      </main>
    </>
  );
}
