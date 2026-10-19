'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import QrCode from '@/components/billing/QrCode';
import { createClient } from '@/lib/supabase/client';
import { BANKS, PLAN_NAME, billingError, fmtDay, vietQrPayload, vnd, type Plan } from '@/lib/billing';
import { useAdminUser } from './AdminContext';

type Settings = {
  enabled: boolean; enabled_at: string | null; price_month: number; price_year: number; trial_days: number;
  bank_bin: string | null; bank_name: string | null; account_no: string | null; account_name: string | null; note: string | null;
};
type Pay = {
  id: string; code: string; plan: Plan; amount: number; status: 'pending' | 'confirmed' | 'cancelled'; created_at: string; confirmed_at: string | null;
  period_to: string | null; student_id: string; student_name: string; grade: number; class_name: string | null; school_name: string | null;
};
type Summary = { pending: number; pending_amount: number; month_amount: number; month_count: number; paid_students: number };
type Tab = 'pending' | 'confirmed' | 'cancelled' | 'all';
const TAB_NAME: Record<Tab, string> = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ', all: 'Tất cả' };
const fmtTime = (s: string | null) => { if (!s) return '—'; const d = new Date(s); return `${fmtDay(s)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// Quản trị hệ thống: cài đặt thu phí học sinh (giáo viên miễn phí) và xác nhận các khoản chuyển khoản theo mã EDKxxxxxx.
export default function BillingAdmin() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [st, setSt] = useState<Settings | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Pay[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    const [{ data, error }, { data: s }] = await Promise.all([supabase.rpc('admin_billing_settings'), supabase.rpc('admin_billing_summary')]);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setSt(((data ?? []) as Settings[])[0] ?? null);
    setSum(((s ?? []) as Summary[])[0] ?? null);
  }, [supabase]);
  const loadRows = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_payments', { p_status: tab === 'all' ? null : tab, p_search: q.trim() || null });
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setRows((data ?? []) as Pay[]);
  }, [supabase, tab, q]);
  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => { const t = setTimeout(() => { void loadRows(); }, 250); return () => clearTimeout(t); }, [loadRows]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!st) return;
    if (st.enabled && !window.confirm('BẬT thu phí: học sinh hết thời gian học thử mà chưa đóng phí sẽ bị khoá phần học. Tiếp tục?')) return;
    setBusy(true);
    const bank = BANKS.find((b) => b.bin === st.bank_bin);
    const { error } = await supabase.rpc('admin_save_billing_settings', {
      p_enabled: st.enabled, p_price_month: st.price_month, p_price_year: st.price_year, p_trial_days: st.trial_days,
      p_bank_bin: st.bank_bin, p_bank_name: bank?.name ?? st.bank_name, p_account_no: st.account_no, p_account_name: st.account_name, p_note: st.note,
    });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) === BILLING_NOT_READY ? 'Chọn ngân hàng và nhập số tài khoản trước khi bật thu phí.' : billingError(error.message) });
    setMsg({ kind: 'ok', text: st.enabled ? 'Đã lưu — thu phí đang BẬT.' : 'Đã lưu — thu phí đang tắt (học sinh học miễn phí).' });
    void loadSettings();
  };

  const confirm = async (p: Pay) => {
    const note = window.prompt(`Xác nhận ĐÃ NHẬN ${vnd(p.amount)} — nội dung ${p.code} — ${p.student_name}?\nGhi chú (không bắt buộc, ví dụ: đã đối chiếu sao kê VCB 19/10):`, '');
    if (note === null) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_confirm_payment', { p_payment: p.id, p_note: note });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setMsg({ kind: 'ok', text: `Đã xác nhận ${p.code}: ${p.student_name} học đến hết ${fmtDay(data as string)}.` });
    void loadRows(); void loadSettings();
  };
  const cancel = async (p: Pay) => {
    if (!window.confirm(`Huỷ yêu cầu ${p.code} của ${p.student_name}?`)) return;
    const { error } = await supabase.rpc('admin_cancel_payment', { p_payment: p.id });
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    void loadRows(); void loadSettings();
  };

  if (!me.isAdmin) return <p className="adm-alert is-warn">Chỉ quản trị hệ thống quản lý thu phí.</p>;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSt((s) => (s ? { ...s, [k]: v } : s));
  const preview = st?.bank_bin && st.account_no ? vietQrPayload({ bin: st.bank_bin, account: st.account_no, amount: st.price_month, content: 'EDKTHU123' }) : null;
  const csvRows = rows.map((r) => [r.code, r.student_name, r.class_name ?? '', r.school_name ?? '', PLAN_NAME[r.plan], r.amount, TAB_NAME[r.status as Tab] ?? r.status, fmtTime(r.created_at), fmtTime(r.confirmed_at), fmtDay(r.period_to)]);

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Thu phí học sinh</h1>
          <p>Học sinh đóng theo tháng hoặc theo năm học bằng chuyển khoản (mã QR có nội dung riêng). Giáo viên dùng miễn phí.</p>
        </div>
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}

      {sum && (
        <div className="adm-stats">
          <div className="adm-stat"><span className="adm-stat-label">Chờ xác nhận</span><strong className="adm-stat-value">{sum.pending}</strong><span className="adm-stat-note">{vnd(Number(sum.pending_amount))}</span></div>
          <div className="adm-stat"><span className="adm-stat-label">Đã thu tháng này</span><strong className="adm-stat-value">{vnd(Number(sum.month_amount))}</strong><span className="adm-stat-note">{sum.month_count} khoản</span></div>
          <div className="adm-stat"><span className="adm-stat-label">Học sinh còn hạn (đã đóng)</span><strong className="adm-stat-value">{sum.paid_students}</strong></div>
        </div>
      )}

      {st && (
        <section className="adm-card">
          <div className="adm-card-head"><h2>Cài đặt</h2></div>
          <form className="billing-form" onSubmit={save}>
            <label className="billing-switch">
              <input type="checkbox" checked={st.enabled} onChange={(e) => set('enabled', e.target.checked)} />
              <span><strong>Bật thu phí</strong> — hết {st.trial_days} ngày học thử mà chưa đóng thì khoá phần học{st.enabled_at ? ` (bật lần đầu ${fmtDay(st.enabled_at)})` : ''}</span>
            </label>
            <label className="adm-field"><span>Giá gói tháng (đ)</span>
              <input type="number" min={1000} step={1000} value={st.price_month} onChange={(e) => set('price_month', Number(e.target.value) || 0)} />
            </label>
            <label className="adm-field"><span>Giá gói năm học (đ) — học đến 31/5</span>
              <input type="number" min={1000} step={1000} value={st.price_year} onChange={(e) => set('price_year', Number(e.target.value) || 0)} />
            </label>
            <label className="adm-field"><span>Số ngày học thử</span>
              <input type="number" min={0} max={60} value={st.trial_days} onChange={(e) => set('trial_days', Math.max(0, Math.min(60, Number(e.target.value) || 0)))} />
            </label>
            <label className="adm-field"><span>Ngân hàng nhận tiền</span>
              <select value={st.bank_bin ?? ''} onChange={(e) => set('bank_bin', e.target.value || null)}>
                <option value="">— Chọn ngân hàng —</option>
                {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
              </select>
            </label>
            <label className="adm-field"><span>Số tài khoản</span>
              <input inputMode="numeric" maxLength={19} value={st.account_no ?? ''} onChange={(e) => set('account_no', e.target.value.replace(/[^0-9A-Za-z]/g, '') || null)} />
            </label>
            <label className="adm-field"><span>Tên chủ tài khoản</span>
              <input maxLength={100} value={st.account_name ?? ''} onChange={(e) => set('account_name', e.target.value || null)} placeholder="CONG TY …" />
            </label>
            <label className="adm-field billing-note"><span>Ghi chú hiện cho phụ huynh (không bắt buộc)</span>
              <input maxLength={300} value={st.note ?? ''} onChange={(e) => set('note', e.target.value || null)} placeholder="Ví dụ: Cần hoá đơn, liên hệ 09xx…" />
            </label>
            <div className="billing-actions"><button type="submit" className="button button-blue" disabled={busy}>Lưu cài đặt</button></div>
          </form>
          {preview && (
            <div className="billing-preview">
              <QrCode text={preview} size={160} label="Mã QR thử" />
              <p className="adm-muted">Mã QR thử ({vnd(st.price_month)}, nội dung EDKTHU123). Mở app ngân hàng quét thử: phải hiện đúng tên chủ tài khoản và số tiền — <strong>không cần chuyển</strong>. Quét đúng rồi mới bật thu phí.</p>
            </div>
          )}
        </section>
      )}

      <section className="adm-card">
        <div className="adm-card-head"><h2>Các khoản đóng phí</h2><CsvButton filename="thu-phi.csv" header={['Mã CK', 'Học sinh', 'Lớp', 'Trường', 'Gói', 'Số tiền', 'Trạng thái', 'Tạo lúc', 'Xác nhận lúc', 'Học đến']} rows={csvRows} /></div>
        <div className="billing-filter">
          <div className="auth-tabs" role="tablist" aria-label="Trạng thái">
            {(Object.keys(TAB_NAME) as Tab[]).map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className="auth-tab" onClick={() => setTab(t)}>{TAB_NAME[t]}</button>)}
          </div>
          <label className="billing-search"><Search aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã CK (EDK…) hoặc tên học sinh" aria-label="Tìm" /></label>
        </div>
        <p className="adm-muted">Đối chiếu sao kê ngân hàng: tìm đúng <strong>nội dung chuyển khoản</strong> và <strong>số tiền</strong> rồi bấm Xác nhận. Học sinh được gia hạn ngay.</p>
        {rows.length === 0 ? <p className="adm-muted">Không có khoản nào.</p> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Mã CK</th><th>Học sinh</th><th>Gói</th><th>Số tiền</th><th>Tạo lúc</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="is-mono"><strong>{r.code}</strong></td>
                    <td><strong>{r.student_name}</strong><br /><small>{[r.class_name ? `Lớp ${r.class_name}` : `Khối ${r.grade}`, r.school_name].filter(Boolean).join(' · ')}</small></td>
                    <td>{PLAN_NAME[r.plan]}</td>
                    <td>{vnd(r.amount)}</td>
                    <td>{fmtTime(r.created_at)}</td>
                    <td>{r.status === 'confirmed' ? <>Đã nhận {fmtTime(r.confirmed_at)}<br /><small>Học đến {fmtDay(r.period_to)}</small></> : TAB_NAME[r.status as Tab]}</td>
                    <td className="adm-row-actions">
                      {r.status === 'pending' && <>
                        <button type="button" className="button button-blue" disabled={busy} onClick={() => void confirm(r)}><Check size={16} aria-hidden="true" /> Xác nhận</button>
                        <button type="button" className="button button-white" disabled={busy} onClick={() => void cancel(r)}><X size={16} aria-hidden="true" /> Huỷ</button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const BILLING_NOT_READY = billingError('billing_not_ready');
