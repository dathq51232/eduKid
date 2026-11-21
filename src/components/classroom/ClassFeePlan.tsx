'use client';

// HỌC PHÍ CỦA LỚP — cô công bố gói cho phụ huynh lớp mình (migration 0075):
// "Để phụ huynh chọn" (mặc định) | chỉ gói học kỳ | chỉ gói năm học. Trang Học phí của em chỉ hiện đúng khoản cô chọn,
// mã QR đúng số tiền đó. Kèm câu mẫu để cô dán vào nhóm phụ huynh.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FEE_PLAN_NAME, billingError, vnd, type FeePlan } from '@/lib/billing';
import '@/styles/adm.css';
import '@/styles/billing.css';

type Fee = { fee_plan: FeePlan; price_term: number; price_year: number; commission_pct: number; enabled: boolean };

export default function ClassFeePlan({ classId }: { classId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [fee, setFee] = useState<Fee | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('teacher_class_fee', { p_class: classId });
    if (error) return; // chưa chạy migration 0075 → ẩn khung
    setFee(((data ?? []) as Fee[])[0] ?? null);
  }, [supabase, classId]);
  useEffect(() => { void load(); }, [load]);

  if (!fee || !fee.enabled) return null; // chỉ hiện khi quản trị đã bật thu phí
  const choose = async (p: FeePlan) => {
    if (p === fee.fee_plan) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc('teacher_set_fee_plan', { p_class: classId, p_plan: p });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: billingError(error.message) });
    setFee({ ...fee, fee_plan: p });
    setMsg({ kind: 'ok', text: 'Đã lưu. Phụ huynh mở trang Học phí sẽ thấy đúng khoản này.' });
  };
  const notice = fee.fee_plan === 'term' ? `Học phí EduChain Kids của lớp: gói học kỳ ${vnd(fee.price_term)}/em.`
    : fee.fee_plan === 'year' ? `Học phí EduChain Kids của lớp: gói năm học ${vnd(fee.price_year)}/em.`
    : `Học phí EduChain Kids của lớp: gói học kỳ ${vnd(fee.price_term)}/em hoặc gói năm học ${vnd(fee.price_year)}/em (phụ huynh chọn).`;
  const text = `${notice} Phụ huynh đăng nhập tài khoản của con (mã lớp + PIN cô đã gửi) → Trang của em → Học phí, quét mã QR để chuyển khoản trực tiếp cho EduChain Kids. Đóng phí là tự nguyện; em chưa đóng vẫn làm đủ bài cô giao trên lớp.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { window.prompt('Chép tin nhắn:', text); }
  };

  return (
    <section className="dash-section fee-plan no-print" aria-labelledby="fee-h">
      <h2 id="fee-h"><Wallet aria-hidden="true" /> Học phí của lớp</h2>
      <p className="dash-muted">Cô chọn khoản công bố cho phụ huynh lớp mình. Phụ huynh tự chuyển khoản cho app qua mã QR (cô không thu tiền). Cô nhận phí cộng tác {fee.commission_pct}% gói lớp học.</p>
      <div className="fee-plan-opts" role="radiogroup" aria-label="Gói học phí của lớp">
        {(['choice', 'term', 'year'] as FeePlan[]).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={fee.fee_plan === p} className={`fee-plan-opt${fee.fee_plan === p ? ' is-on' : ''}`} disabled={busy} onClick={() => void choose(p)}>
            <b>{FEE_PLAN_NAME[p]}</b>
            <span>{p === 'term' ? `${vnd(fee.price_term)} / em` : p === 'year' ? `${vnd(fee.price_year)} / em` : `${vnd(fee.price_term)} hoặc ${vnd(fee.price_year)}`}</span>
          </button>
        ))}
      </div>
      <div className="fee-plan-msg">
        <p>{text}</p>
        <button type="button" className="mini-btn" onClick={() => void copy()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Đã chép' : 'Chép tin nhắn gửi phụ huynh'}</button>
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}
    </section>
  );
}
