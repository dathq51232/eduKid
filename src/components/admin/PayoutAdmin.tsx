'use client';

// Quản trị › Thu phí › CHI TRẢ PHÍ CỘNG TÁC (migration 0082): 2 lần / năm (cuối HK1, cuối HK2).
//  1. Xem ví các thầy cô (số dư, đã khai tài khoản chưa).  2. Tạo đợt chi → gom ví các cô đã khai tài khoản, tự khấu trừ thuế.
//  3. Tải file chuyển khoản theo lô (CSV mở bằng Excel, chép vào mẫu "chuyển khoản hàng loạt" của ngân hàng) → chuyển → đánh dấu đã chi.
//  Cô chưa khai tài khoản: tiền vẫn nằm trong ví, vào đợt sau. "Giữ lại": trả các khoản về ví (nghi vấn, sai tài khoản…).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, HandCoins, PauseCircle } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import { vnd } from '@/lib/billing';
import { payoutLabel, walletError } from '@/lib/wallet';
import '@/styles/vct.css';

type WalletRow = { teacher_id: string; teacher_name: string; school_name: string | null; balance: number; payments: number; has_account: boolean; bank_name: string | null; account_no: string | null; account_name: string | null };
type Item = { teacherId: string; teacherName: string; gross: number; tax: number; net: number; payments: number; bankName: string; accountNo: string; accountName: string; idNumber: string | null; status: 'cho_chi' | 'da_chi' | 'giu_lai' };
type Batch = { id: string; label: string; status: 'cho_chi' | 'da_chi'; createdAt: string; paidAt: string | null; items: Item[] };
const ST: Record<Item['status'], string> = { cho_chi: 'Chờ chuyển', da_chi: 'Đã chuyển', giu_lai: 'Giữ lại (về ví)' };

export default function PayoutAdmin() {
  const sb = useMemo(() => createClient(), []);
  const [wallets, setWallets] = useState<WalletRow[] | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [label, setLabel] = useState(() => payoutLabel());
  const [min, setMin] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const [w, b] = await Promise.all([sb.rpc('admin_wallets'), sb.rpc('admin_payouts')]);
    if (w.error) { if (/could not find the function|PGRST202/i.test(w.error.message)) setMissing(true); return; }
    setWallets((w.data ?? []) as WalletRow[]);
    setBatches((b.data ?? []) as Batch[]);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  if (missing) return <section className="adm-card"><div className="adm-card-head"><h2>Chi trả phí cộng tác</h2></div><p className="adm-setup">Chưa bật ví phí cộng tác: chạy migration <code>supabase/migrations/0082_commission_wallet.sql</code> trên Supabase rồi tải lại trang.</p></section>;
  if (!wallets) return null;

  const ready = wallets.filter((w) => w.has_account && w.balance >= Math.max(min, 1));
  const noAcc = wallets.filter((w) => !w.has_account);
  const create = async () => {
    if (!window.confirm(`Tạo đợt chi “${label}” cho ${ready.length} thầy cô, tổng ${vnd(ready.reduce((s, w) => s + w.balance, 0))} (trước thuế)?`)) return;
    setBusy(true); setMsg(null);
    const { error } = await sb.rpc('admin_payout_create', { p_label: label, p_min: min });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: walletError(error.message) });
    setMsg({ kind: 'ok', text: 'Đã tạo đợt chi. Tải file chuyển khoản, chuyển xong thì bấm “Đã chuyển”.' });
    void load();
  };
  const mark = async (b: Batch, it: Item | null, status: Item['status']) => {
    if (status === 'giu_lai' && !window.confirm(`Giữ lại khoản của ${it?.teacherName}? Tiền quay về ví của cô, vào đợt chi sau.`)) return;
    setBusy(true); setMsg(null);
    const targets = it ? [it] : b.items.filter((x) => x.status === 'cho_chi');
    for (const x of targets) {
      const { error } = await sb.rpc('admin_payout_mark', { p_batch: b.id, p_teacher: x.teacherId, p_status: status });
      if (error) { setBusy(false); setMsg({ kind: 'error', text: walletError(error.message) }); void load(); return; }
    }
    setBusy(false);
    void load();
  };
  const csv = (b: Batch) => b.items.filter((x) => x.status !== 'giu_lai').map((x, i) => [i + 1, x.accountNo, x.accountName, x.bankName, x.net, `EduChain Kids phi cong tac ${b.label}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd'), x.teacherName, x.gross, x.tax, x.idNumber ?? '']);

  return (
    <section className="adm-card">
      <div className="adm-card-head"><h2><HandCoins aria-hidden="true" /> Chi trả phí cộng tác</h2></div>
      <p className="adm-muted">Phí cộng tác tự cộng vào ví của cô khi khoản đóng gói lớp học được xác nhận. Chi 2 lần mỗi năm: cuối học kỳ 1 (sau 15/1) và cuối học kỳ 2 (sau 31/5). Khoản ≥ ngưỡng thuế được khấu trừ thuế TNCN tự động.</p>

      <h3>Ví đang tích luỹ ({wallets.length} thầy cô · {vnd(wallets.reduce((s, w) => s + w.balance, 0))})</h3>
      {wallets.length === 0 ? <p className="adm-muted">Chưa có phí cộng tác nào đang chờ chi.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Thầy cô</th><th>Trường</th><th>Số khoản</th><th>Số dư</th><th>Tài khoản nhận</th></tr></thead>
            <tbody>{wallets.map((w) => (
              <tr key={w.teacher_id}><td>{w.teacher_name}</td><td>{w.school_name ?? ''}</td><td>{w.payments}</td><td><b>{vnd(w.balance)}</b></td>
                <td>{w.has_account ? `${w.bank_name} · ${w.account_no} · ${w.account_name}` : <span className="vct-adm-warn">Chưa khai — nhắc cô vào Thu chi cá nhân</span>}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {noAcc.length > 0 && <p className="adm-muted">{noAcc.length} thầy cô chưa khai tài khoản: tiền vẫn trong ví, vào đợt chi sau khi khai.</p>}

      <div className="vct-adm-row">
        <label>Tên đợt chi<input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} /></label>
        <label>Chỉ chi khi số dư từ (đ)<input type="number" min={0} step={10000} value={min} onChange={(e) => setMin(Math.max(0, Number(e.target.value) || 0))} /></label>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !ready.length || label.trim().length < 2} onClick={() => void create()}>Tạo đợt chi ({ready.length} thầy cô)</button>
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}

      {batches.map((b) => (
        <div key={b.id} className="vct-adm-batch">
          <h3>{b.label} <span className={`vct-adm-st is-${b.status}`}>{b.status === 'da_chi' ? 'Đã chi xong' : 'Đang chi'}</span>
            <small>{new Date(b.createdAt).toLocaleDateString('vi-VN')} · {b.items.length} thầy cô · thực chuyển {vnd(b.items.filter((x) => x.status !== 'giu_lai').reduce((s, x) => s + x.net, 0))}</small></h3>
          <div className="vct-adm-row">
            <CsvButton filename={`chi-tra-cong-tac-${b.label.replace(/\s+/g, '-')}.csv`} label="Tải file chuyển khoản (Excel)"
              header={['STT', 'Số tài khoản', 'Tên chủ tài khoản', 'Ngân hàng', 'Số tiền', 'Nội dung', 'Thầy cô', 'Trước thuế', 'Thuế TNCN', 'CCCD']} rows={csv(b)} />
            {b.status === 'cho_chi' && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => { if (window.confirm('Đánh dấu TẤT CẢ dòng đang chờ là đã chuyển khoản?')) void mark(b, null, 'da_chi'); }}><Check aria-hidden="true" /> Đã chuyển tất cả</button>}
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Thầy cô</th><th>Tài khoản</th><th>Trước thuế</th><th>Thuế</th><th>Thực nhận</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>{b.items.map((x) => (
                <tr key={x.teacherId}><td>{x.teacherName}<br /><small>{x.payments} khoản</small></td><td>{x.bankName} · {x.accountNo}<br /><small>{x.accountName}</small></td>
                  <td>{vnd(x.gross)}</td><td>{x.tax ? vnd(x.tax) : '—'}</td><td><b>{vnd(x.net)}</b></td>
                  <td><span className={`vct-adm-st is-${x.status}`}>{ST[x.status]}</span></td>
                  <td>{x.status === 'cho_chi' && <>
                    <button type="button" className="mini-btn" disabled={busy} onClick={() => void mark(b, x, 'da_chi')} title="Đã chuyển khoản"><Check aria-hidden="true" /> Đã chuyển</button>
                    <button type="button" className="mini-btn" disabled={busy} onClick={() => void mark(b, x, 'giu_lai')} title="Giữ lại, trả về ví"><PauseCircle aria-hidden="true" /> Giữ lại</button>
                  </>}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
