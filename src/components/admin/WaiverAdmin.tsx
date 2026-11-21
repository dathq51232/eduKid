'use client';

// Quản trị duyệt ĐẶC CÁCH học phí (migration 0074): cô gửi cho em có hoàn cảnh khó khăn; duyệt → em học hết học kỳ hiện tại.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, HeartHandshake, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WAIVER_STATUS, billingError, fmtDay, type Waiver } from '@/lib/billing';
import '@/styles/adm.css';
import '@/styles/auth.css';
import '@/styles/billing.css';

type Row = Waiver & { grade: number; class_name: string; school_name: string | null; teacher_name: string | null };
type Tab = 'pending' | 'approved' | 'rejected' | 'all';
const TABS: Record<Tab, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Không duyệt', all: 'Tất cả' };

export default function WaiverAdmin({ onChanged }: { onChanged: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_waivers', { p_status: tab === 'all' ? null : tab });
    if (error) { setMsg({ kind: 'error', text: billingError(error.message) }); setRows([]); return; }
    setRows((data ?? []) as Row[]);
  }, [supabase, tab]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (w: Row, approve: boolean) => {
    const note = window.prompt(approve
      ? `Duyệt đặc cách cho ${w.student_name} (lớp ${w.class_name})? Em được học hết học kỳ hiện tại.\nGhi chú (không bắt buộc):`
      : `Không duyệt đặc cách cho ${w.student_name}? Ghi lý do để cô biết:`, '');
    if (note === null) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_decide_waiver', { p_waiver: w.id, p_approve: approve, p_note: note });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setMsg({ kind: 'ok', text: approve ? `Đã duyệt: ${w.student_name} học đến hết ${fmtDay(data as string)}.` : `Đã báo không duyệt cho cô của ${w.student_name}.` });
    void load(); onChanged();
  };

  return (
    <section className="adm-card">
      <div className="adm-card-head"><h2><HeartHandshake size={20} aria-hidden="true" /> Đặc cách học phí</h2></div>
      <p className="adm-muted">Cô gửi yêu cầu cho em có hoàn cảnh khó khăn. Duyệt thì em học miễn phí hết học kỳ hiện tại, hiện như đã đóng (không ai trong lớp biết) và không tính phí cộng tác.</p>
      <div className="billing-filter">
        <div className="auth-tabs" role="tablist" aria-label="Trạng thái đặc cách">
          {(Object.keys(TABS) as Tab[]).map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className="auth-tab" onClick={() => setTab(t)}>{TABS[t]}</button>)}
        </div>
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
      {rows === null ? <p className="adm-muted">Đang tải…</p> : rows.length === 0 ? <p className="adm-muted">Không có yêu cầu nào.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Học sinh</th><th>Cô gửi</th><th>Lý do</th><th>Gửi lúc</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <td><strong>{w.student_name}</strong><br /><small>{[`Lớp ${w.class_name}`, w.school_name].filter(Boolean).join(' · ')}</small></td>
                  <td>{w.teacher_name ?? '—'}</td>
                  <td className="waiver-reason">{w.reason}</td>
                  <td>{fmtDay(w.created_at)}</td>
                  <td>{WAIVER_STATUS[w.status]}{w.status === 'approved' && w.period_to ? <><br /><small>Đến {fmtDay(w.period_to)}</small></> : null}{w.admin_note ? <><br /><small>{w.admin_note}</small></> : null}</td>
                  <td className="adm-row-actions">
                    {w.status === 'pending' && <>
                      <button type="button" className="button button-blue" disabled={busy} onClick={() => void decide(w, true)}><Check size={16} aria-hidden="true" /> Duyệt</button>
                      <button type="button" className="button button-white" disabled={busy} onClick={() => void decide(w, false)}><X size={16} aria-hidden="true" /> Không duyệt</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
