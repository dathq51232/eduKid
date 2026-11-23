'use client';

// VÍ PHÍ CỘNG TÁC trong Thu chi cá nhân của thầy cô (migration 0082).
// Phụ huynh lớp cô đóng gói lớp học → khoản được xác nhận → phí cộng tác tự cộng vào ví. Quản trị chi trả 2 lần / năm
// (cuối HK1, cuối HK2) vào tài khoản cô khai ở đây. Cô chỉ thấy tổng theo lớp, không thấy em nào đã đóng.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Landmark, Pencil, PiggyBank, Sparkles, Wallet as WalletIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BANKS, vnd } from '@/lib/billing';
import { bankName, maskAccount, nextPayout, walletError, type Wallet } from '@/lib/wallet';
import '@/styles/vct.css';

export default function CommissionWallet({ classId }: { classId: string }) {
  const sb = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [w, setW] = useState<Wallet | null>(null);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ bank: '', no: '', name: '', id: '', agree: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.rpc('teacher_wallet');
    if (error) return; // chưa chạy migration 0082 → ẩn khung
    setW(data as Wallet);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  if (!w) return null;
  // chưa bật thu phí và chưa từng có phí cộng tác → chưa cần ví
  if (!w.enabled && !w.balance && !w.history.length) return null;

  const pay = nextPayout();
  const perYear = Math.floor((w.priceYear * w.pct) / 100);
  const perTerm = Math.floor((w.priceTerm * w.pct) / 100);
  const save = 2 * w.priceTerm - w.priceYear;
  const openEdit = () => {
    setF({ bank: w.account?.bankName ?? '', no: w.account?.accountNo ?? '', name: w.account?.accountName ?? '', id: w.account?.idNumber ?? '', agree: false });
    setEdit(true); setMsg(null);
  };
  const submit = async () => {
    if (!sb || busy) return;
    setBusy(true); setMsg(null);
    const { error } = await sb.rpc('teacher_wallet_save', { p_bank: f.bank, p_account_no: f.no, p_account_name: f.name, p_id_number: f.id, p_agree: f.agree });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: walletError(error.message) });
    setEdit(false); setMsg({ kind: 'ok', text: 'Đã lưu tài khoản nhận tiền.' });
    void load();
  };

  return (
    <section className="dash-section vct" aria-labelledby="vct-h">
      <div className="vct-head">
        <h2 id="vct-h"><WalletIcon aria-hidden="true" /> Ví phí cộng tác</h2>
        <p className="dash-muted">Phụ huynh lớp thầy cô đóng gói lớp học → {w.pct}% tự cộng vào ví. Chi trả 2 lần mỗi năm: cuối học kỳ 1 và cuối học kỳ 2.</p>
      </div>

      <div className="vct-stats">
        <div className="vct-stat is-main"><small>Đang tích luỹ</small><b>{vnd(w.balance)}</b><span>Chi ở đợt {pay.label}</span></div>
        <div className="vct-stat"><small>Đang chuyển khoản</small><b>{vnd(w.inBatch)}</b><span>Đã vào đợt chi, chờ ngân hàng</span></div>
        <div className="vct-stat"><small>Đã nhận</small><b>{vnd(w.paid)}</b><span>Tổng các đợt đã chi</span></div>
      </div>
      <p className="vct-next"><CalendarClock aria-hidden="true" /><span>Đợt chi tới: <b>{pay.label}</b>, chuyển khoản từ {pay.from} đến {pay.to}.
        Khoản từ {vnd(w.taxThreshold)} trở lên được khấu trừ {w.taxPct}% thuế thu nhập cá nhân theo quy định.</span></p>

      {w.byClass.length > 0 && (
        <table className="vct-table">
          <caption className="sr-only">Phí cộng tác đang tích luỹ theo lớp</caption>
          <thead><tr><th>Lớp</th><th>Gói năm học</th><th>Gói học kỳ</th><th>Phí cộng tác</th></tr></thead>
          <tbody>{w.byClass.map((c) => (
            <tr key={c.className}><td>{c.className}</td><td>{c.year} em</td><td>{c.term} em</td><td><b>{vnd(c.amount)}</b></td></tr>
          ))}</tbody>
        </table>
      )}

      {w.enabled && (
        <div className="vct-tip">
          <Sparkles aria-hidden="true" />
          <div>
            <b>Khuyến khích lớp đóng gói năm học</b>
            <p>Phụ huynh tiết kiệm {vnd(save)}/em ({vnd(w.priceYear)} thay vì 2 × {vnd(w.priceTerm)}), con học liền mạch cả năm.
              Thầy cô nhận {vnd(perYear)}/em ngay ở đợt chi cuối học kỳ 1 (gói học kỳ: {vnd(perTerm)}/em mỗi kỳ, tuỳ phụ huynh đóng tiếp).</p>
            <Link href={`/giao-vien/lop/${classId}#fee-h`}>Chọn gói học phí của lớp →</Link>
          </div>
        </div>
      )}

      <div className="vct-account">
        <h3><Landmark aria-hidden="true" /> Tài khoản nhận tiền</h3>
        {!edit && w.account && (
          <p className="vct-acc">
            <span><b>{w.account.bankName}</b> · {maskAccount(w.account.accountNo)} · {w.account.accountName}</span>
            <button type="button" className="mini-btn" onClick={openEdit}><Pencil aria-hidden="true" /> Sửa</button>
          </p>
        )}
        {!edit && !w.account && (
          <div className="vct-empty">
            <PiggyBank aria-hidden="true" />
            <p>{w.balance > 0 ? `Ví đang có ${vnd(w.balance)} — ` : ''}Khai tài khoản ngân hàng đứng tên thầy cô để nhận tiền ở đợt chi tới.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={openEdit}>Khai tài khoản</button>
          </div>
        )}
        {edit && (
          <form className="vct-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <label>Ngân hàng
              <select value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} required>
                <option value="">— Chọn ngân hàng —</option>
                {BANKS.map((b) => <option key={b.bin} value={b.name}>{b.name}</option>)}
                {f.bank && !BANKS.some((b) => b.name === f.bank) && <option value={f.bank}>{f.bank}</option>}
              </select>
            </label>
            <label>Số tài khoản<input value={f.no} onChange={(e) => setF({ ...f, no: e.target.value.replace(/[^0-9\s]/g, '') })} inputMode="numeric" maxLength={24} required /></label>
            <label>Tên chủ tài khoản<input value={f.name} onChange={(e) => setF({ ...f, name: bankName(e.target.value) })} maxLength={80} placeholder="NGUYEN THI AN" required /></label>
            <label>Số CCCD <small>(dùng khi khấu trừ thuế)</small><input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" maxLength={12} /></label>
            <label className="vct-agree"><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} />
              <span>Tôi đồng ý nhận phí cộng tác theo điều khoản cộng tác của EduChain Kids: tài khoản đứng tên tôi; khoản từ {vnd(w.taxThreshold)} trở lên được khấu trừ {w.taxPct}% thuế thu nhập cá nhân; tôi không yêu cầu phụ huynh bắt buộc mua gói.</span></label>
            <div className="vct-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEdit(false)} disabled={busy}>Huỷ</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !f.agree}>Lưu tài khoản</button>
            </div>
          </form>
        )}
      </div>

      {w.history.length > 0 && (
        <details className="vct-history">
          <summary>Lịch sử chi trả ({w.history.length})</summary>
          <ul>{w.history.map((h, i) => (
            <li key={i}><b>{h.label}</b><span>{vnd(h.net)}{h.tax ? ` (đã khấu trừ thuế ${vnd(h.tax)})` : ''}</span>
              <em className={`is-${h.status}`}>{h.status === 'da_chi' ? `Đã chuyển${h.paidAt ? ` ${new Date(h.paidAt).toLocaleDateString('vi-VN')}` : ''}` : h.status === 'giu_lai' ? 'Chuyển sang đợt sau' : 'Đang chuyển'}</em></li>
          ))}</ul>
        </details>
      )}
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
    </section>
  );
}
