import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import PaymentPanel from '@/components/billing/PaymentPanel';
import { learningGate } from '@/lib/auth/gate';
import { getViewer } from '@/lib/auth/viewer';
import { PLAN_NAME, fmtDay, vnd, type BillingPublic, type PaymentRow } from '@/lib/billing';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Học phí · EduChain Kids' };
export const dynamic = 'force-dynamic';

const STATUS: Record<PaymentRow['status'], string> = { pending: 'Chờ xác nhận', confirmed: 'Đã nhận', cancelled: 'Đã huỷ' };

// Trang học phí của học sinh (bố mẹ đóng qua chuyển khoản). Giáo viên miễn phí nên không có trang này.
export default async function TuitionPage() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Học phí" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/hoc-sinh/dong-phi');
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');

  const supabase = await createClient();
  const [gate, { data: pub }, { data: pays }] = await Promise.all([
    learningGate(supabase, viewer.userId),
    supabase.rpc('billing_public'),
    supabase.rpc('student_my_payments'),
  ]);
  const info = ((pub ?? []) as BillingPublic[])[0];
  const list = (pays ?? []) as PaymentRow[];
  const state = gate.reason === 'paid' ? { tone: 'is-ok', text: `Em đã đóng học phí, học đến hết ngày ${fmtDay(gate.until)}.` }
    : gate.reason === 'trial' ? { tone: 'is-info', text: `Em đang học thử miễn phí đến ${fmtDay(gate.until)}. Bố mẹ có thể đóng học phí trước để không bị gián đoạn.` }
    : gate.reason === 'expired' ? { tone: 'is-warn', text: 'Thời gian học của em đã hết. Bố mẹ đóng học phí để em học tiếp nhé!' }
    : { tone: 'is-ok', text: 'Hiện em đang học miễn phí.' };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap tuition-page">
        <Link href="/hoc-sinh" className="dash-back"><ArrowLeft aria-hidden="true" /> Trang của em</Link>
        <header className="dash-head">
          <div>
            <p className="dash-kicker">{viewer.displayName}</p>
            <h1><CreditCard aria-hidden="true" /> Học phí</h1>
          </div>
        </header>
        <p className={`adm-alert ${state.tone}`} role="status">{state.text}</p>
        {info && info.enabled ? <PaymentPanel info={info} /> : <p className="dash-muted">Nhà trường chưa bật thu học phí.</p>}
        {list.length > 0 && (
          <section className="dash-section" aria-label="Các lần đóng phí">
            <h2>Các lần đóng phí</h2>
            <div className="table-scroll">
              <table className="roster-table">
                <thead><tr><th>Nội dung CK</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Học đến</th></tr></thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <th scope="row" className="is-mono">{p.code}</th>
                      <td>{PLAN_NAME[p.plan]}</td>
                      <td>{vnd(p.amount)}</td>
                      <td><span className={p.status === 'confirmed' ? 'tag-ok' : p.status === 'pending' ? 'tag-wait' : 'tag-miss'}>{STATUS[p.status]}</span></td>
                      <td>{p.status === 'confirmed' ? fmtDay(p.period_to) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
