// THẺ HỌC PHÍ ở Góc Phụ huynh — thông báo CHÍNH THỨC từ EduChain Kids (không phải từ cô), nổi bật ngay dưới phần chào.
// Học phí là việc của ba mẹ nên chỉ hiện ở đây; trang của em chỉ nhắc nhẹ "nhờ ba mẹ xem Góc Phụ huynh".
// Giọng theo docs/BAN-SAC-EDUCHAINKIDS.md: gọi "ba mẹ", không so sánh với bạn khác, không gây áp lực.
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { PLAN_NAME, fmtDay, vnd, type BillingOffer, type Gate } from '@/lib/billing';

/** Số ngày của một học kỳ (để quy ra "mỗi ngày") */
const TERM_DAYS = 135;
const perDay = (price: number) => {
  const d = price / TERM_DAYS;
  return d < 1000 ? 'chưa tới 1.000đ' : `khoảng ${vnd(Math.ceil(d / 500) * 500)}`;
};

export default function TuitionCard({ gate, offer, childName }: { gate: Gate; offer: BillingOffer | null; childName: string }) {
  if (gate.reason === 'free' || gate.reason === 'not_student') return null;
  const name = childName.trim().split(/\s+/).slice(-1)[0] || 'con';

  if (gate.reason === 'paid') {
    return (
      <p className="ph-fee-paid" id="hoc-phi">
        <ShieldCheck aria-hidden="true" /> <span>EduChain Kids: {name} đã có gói học, học đến hết <b>{fmtDay(gate.until)}</b>. Cảm ơn ba mẹ đã đồng hành!</span>
        <Link href="/hoc-sinh/dong-phi">Gia hạn</Link>
      </p>
    );
  }
  if (gate.reason === 'plan_locked') return null; // khoá vì gói của thầy cô — trang của em đã có hướng dẫn

  const expired = gate.reason === 'expired';
  const daysLeft = !expired && gate.until ? Math.max(0, Math.ceil((Date.parse(gate.until) - Date.now()) / 86_400_000)) : 0;
  const fixed = offer && offer.kind === 'school' && (offer.fee_plan === 'term' || offer.fee_plan === 'year') ? offer.fee_plan : null;
  const price = offer ? (fixed === 'year' ? offer.price_year : offer.price_term) : null;
  const ctaPrice = price ? `${vnd(price)}/${fixed === 'year' ? 'năm học' : 'học kỳ'}` : '';
  const announced = fixed && offer ? `${offer.teacher_name ? `Cô ${offer.teacher_name}` : 'Thầy cô'} đã công bố ${PLAN_NAME[fixed].toLowerCase()}${offer.class_name ? ` cho lớp ${offer.class_name}` : ''}.` : null;

  return (
    <section className={`ph-fee${expired ? ' is-expired' : ''}`} id="hoc-phi" aria-labelledby="ph-fee-title">
      <div className="ph-fee-from">
        <Image src="/brand/logo-mark-sm.webp" alt="" width={28} height={28} />
        <span>Thông báo từ <b>EduChain Kids</b></span>
        <em className="ph-fee-badge">{expired ? <><Lock aria-hidden="true" /> Đã hết học thử</> : <><Clock aria-hidden="true" /> Còn {daysLeft} ngày học thử</>}</em>
      </div>
      <h2 id="ph-fee-title">
        {expired ? `Đừng để ${name} dừng lại giữa chừng` : `Giữ nhịp học mỗi ngày cho ${name}`}
      </h2>
      <p className="ph-fee-lead">
        {expired
          ? <>{name} vẫn làm đủ bài cô giao và phòng thi lớp. Mở gói học để con tiếp tục <b>luyện tập theo lộ trình riêng</b>, chuyên đề nâng cao, English Journey và trò chơi trí tuệ.</>
          : <>{name} đang học thử miễn phí đến <b>{fmtDay(gate.until)}</b>. Mở gói học trước hạn để con không bị gián đoạn — ba mẹ theo dõi tiến bộ của con ngay tại đây.</>}
      </p>
      {offer && price && (
        <p className="ph-fee-price">
          <b>{vnd(price)}</b> / {fixed === 'year' ? 'năm học' : 'học kỳ'} · {perDay(fixed === 'year' ? price / 2 : price)} mỗi ngày
          {!fixed && offer.price_term * 2 > offer.price_year && <span> · Gói năm học {vnd(offer.price_year)} (tiết kiệm {vnd(offer.price_term * 2 - offer.price_year)})</span>}
        </p>
      )}
      {announced && <p className="ph-fee-note">{announced}</p>}
      <div className="ph-fee-actions">
        <Link href="/hoc-sinh/dong-phi" className="btn btn-yellow ph-fee-cta">
          <QrCode aria-hidden="true" /> {expired ? 'Mở gói học cho con' : 'Đồng hành cùng con'}{ctaPrice ? ` · ${ctaPrice}` : ''} <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <p className="ph-fee-safe"><ShieldCheck aria-hidden="true" /> Quét mã QR ngân hàng, tiền chuyển thẳng cho EduChain Kids — thầy cô không thu hộ. Đóng phí là tự nguyện.</p>
    </section>
  );
}
