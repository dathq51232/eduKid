import { redirect } from 'next/navigation';
import { getStaffContext } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';
import MarketingStudio, { type MPost, type MReport } from '@/components/admin/MarketingStudio';

export const metadata = { title: 'Marketing — Quản trị EduChain Kids' };
export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  if (!ctx.isAdmin) redirect('/quan-tri');
  const supabase = await createClient();
  const [posts, report] = await Promise.all([
    supabase.from('marketing_posts').select('id, title, campaign, link, body, hashtags, variants, posted, created_at').order('created_at', { ascending: false }).limit(60),
    supabase.rpc('admin_campaign_report', { p_days: 90 }),
  ]);
  if (posts.error) {
    return (
      <div className="adm-stack">
        <h1>📣 Marketing</h1>
        <p className="adm-setup">Chưa có bảng dữ liệu: hãy chạy migration <code>supabase/migrations/0053_marketing.sql</code> trên Supabase rồi tải lại trang.</p>
      </div>
    );
  }
  return <MarketingStudio posts={(posts.data ?? []) as MPost[]} report={(report.data ?? []) as MReport[]} />;
}
