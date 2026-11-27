'use client';

// NÚT "THANH TOÁN" ở thẻ học phí (Góc phụ huynh): bấm → khung nổi hiện ngay mã QR VietQR + tài khoản nhận tiền.
// Lớp đã có gói cô công bố → tự lấy mã chuyển khoản luôn (hàm student_request_payment dùng lại mã đang chờ nếu có, không tạo trùng);
// lớp để phụ huynh chọn → chọn Học kỳ / Năm học trong khung rồi hiện mã.
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, QrCode, X } from 'lucide-react';
import PaymentPanel from '@/components/billing/PaymentPanel';
import type { BillingOffer, BillingPublic } from '@/lib/billing';

export default function PayDialog({ info, offer, label = 'Thanh toán' }: { info: BillingPublic; offer: BillingOffer; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-yellow ph-fee-cta" onClick={() => setOpen(true)}>
        <QrCode aria-hidden="true" /> {label} <ArrowRight aria-hidden="true" />
      </button>
      <dialog ref={ref} className="pay-dlg" aria-labelledby="pay-dlg-title" onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="pay-dlg-in">
          <div className="pay-dlg-hd">
            <h2 id="pay-dlg-title"><QrCode aria-hidden="true" /> Thanh toán học phí</h2>
            <button type="button" className="pay-dlg-x" onClick={() => setOpen(false)} aria-label="Đóng"><X aria-hidden="true" /></button>
          </div>
          {open && <PaymentPanel info={info} offer={offer} auto />}
        </div>
      </dialog>
    </>
  );
}
