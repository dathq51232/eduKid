'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, QrCode as QrIcon } from 'lucide-react';
import QrCode from '@/components/billing/QrCode';
import { createClient } from '@/lib/supabase/client';
import { PLAN_NAME, billingError, fmtDay, vietQrPayload, vnd, type BillingPublic, type Plan } from '@/lib/billing';

type Req = { id: string; code: string; plan: Plan; amount: number; created_at: string };

function CopyLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch { window.prompt('Chép:', value); }
  };
  return (
    <div className="pay-line">
      <span>{label}</span>
      <strong className={mono ? 'is-mono' : undefined}>{value}</strong>
      <button type="button" className="mini-btn" onClick={() => void copy()} aria-label={`Chép ${label}`}>{ok ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {ok ? 'Đã chép' : 'Chép'}</button>
    </div>
  );
}

/** Chọn gói -> tạo mã chuyển khoản riêng -> hiện QR VietQR (số tiền, nội dung điền sẵn) + thông tin tài khoản. */
export default function PaymentPanel({ info }: { info: BillingPublic }) {
  const router = useRouter();
  const [req, setReq] = useState<Req | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);
  const [err, setErr] = useState('');
  const ready = Boolean(info.bank_bin && info.account_no);

  const choose = async (plan: Plan) => {
    setBusy(plan);
    setErr('');
    const { data, error } = await createClient().rpc('student_request_payment', { p_plan: plan });
    setBusy(null);
    if (error) return setErr(billingError(error.message));
    setReq(((data ?? []) as Req[])[0] ?? null);
    router.refresh();
  };

  if (!ready) return <p className="adm-alert is-info">Nhà trường chưa cấu hình tài khoản nhận học phí. Bố mẹ liên hệ thầy cô chủ nhiệm nhé.</p>;
  return (
    <div className="pay-panel">
      <div className="pay-plans">
        {(['month', 'year'] as Plan[]).map((p) => (
          <button key={p} type="button" className={`pay-plan${req?.plan === p ? ' is-on' : ''}`} onClick={() => void choose(p)} disabled={busy !== null}>
            <span className="pay-plan-name">{PLAN_NAME[p]}</span>
            <strong>{vnd(p === 'month' ? info.price_month : info.price_year)}</strong>
            <span className="pay-plan-note">{p === 'month' ? 'Học 1 tháng, nối tiếp ngày hết hạn' : `Học đến hết ${fmtDay(info.year_end)}`}</span>
            <span className="pay-plan-cta"><QrIcon aria-hidden="true" /> {busy === p ? 'Đang tạo mã…' : 'Lấy mã chuyển khoản'}</span>
          </button>
        ))}
      </div>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {req && info.bank_bin && info.account_no && (
        <section className="pay-qr" aria-label="Thông tin chuyển khoản">
          <QrCode text={vietQrPayload({ bin: info.bank_bin, account: info.account_no, amount: req.amount, content: req.code })} size={232}
            label={`Mã QR chuyển khoản ${vnd(req.amount)} nội dung ${req.code}`} />
          <div className="pay-info">
            <p className="pay-step">Mở app ngân hàng → <strong>Quét mã QR</strong>. Số tiền và nội dung đã điền sẵn — bố mẹ chỉ cần xác nhận.</p>
            <CopyLine label="Ngân hàng" value={info.bank_name ?? info.bank_bin} />
            <CopyLine label="Số tài khoản" value={info.account_no} mono />
            {info.account_name && <CopyLine label="Chủ tài khoản" value={info.account_name} />}
            <CopyLine label="Số tiền" value={String(req.amount)} mono />
            <CopyLine label="Nội dung" value={req.code} mono />
            <p className="pay-warn">Ghi <strong>đúng nội dung {req.code}</strong> để nhà trường nhận ra khoản đóng của em. Sau khi nhận tiền, quản trị xác nhận và em học tiếp được ngay (trong giờ làm việc).</p>
            {info.note && <p className="dash-muted">{info.note}</p>}
          </div>
        </section>
      )}
    </div>
  );
}
