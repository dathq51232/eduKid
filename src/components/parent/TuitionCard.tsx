// THẺ HỌC PHÍ ở Góc Phụ huynh — thông báo CHÍNH THỨC từ EduChain Kids (không phải từ cô), nổi bật ngay dưới phần chào.
// Học phí là việc của ba mẹ nên chỉ hiện ở đây; trang của em chỉ nhắc nhẹ "nhờ ba mẹ xem Góc Phụ huynh".
// Giọng theo docs/BAN-SAC-EDUCHAINKIDS.md: gọi "ba mẹ", không so sánh với bạn khác, không gây áp lực.
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { fmtDay, vnd, type BillingOffer, type Gate } from '@/lib/billing';
import type { Recap } from '@/lib/parent/recap';

/** Số ngày của một học kỳ (để quy ra "mỗi ngày") */
const TERM_DAYS = 135;
const perDay = (price: number) => {
  const d = price / TERM_DAYS;
  return d < 1000 ? 'chưa tới 1.000đ' : `khoảng ${vnd(Math.ceil(d / 500) * 500)}`;
};

export default function TuitionCard({ gate, offer, childName, recap }: { gate: Gate; offer: BillingOffer | null; childName: string; recap?: Recap | null }) {
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

  // Bố cục gọn (11/2026): băng ngang 2 cột — trái: lời nhắn + tóm tắt 1 dòng; phải: giá + nút. Không còn dòng "Cô … đã công bố gói".
  return (
    <section className={`ph-fee is-compact${expired ? ' is-expired' : ''}`} id="hoc-phi" aria-labelledby="ph-fee-title">
      <div className="ph-fee-main">
        <div className="ph-fee-from">
          <Image src="/brand/logo-mark-sm.webp" alt="" width={22} height={22} />
          <span>Thông báo từ <b>EduChain Kids</b></span>
          <em className="ph-fee-badge">{expired ? <><Lock aria-hidden="true" /> Đã hết học thử</> : <><Clock aria-hidden="true" /> Còn {daysLeft} ngày học thử</>}</em>
        </div>
        <h2 id="ph-fee-title">
          {expired ? `Đừng để ${name} dừng lại giữa chừng` : `Giữ nhịp học mỗi ngày cho ${name}`}
        </h2>
        <p className="ph-fee-lead">
          {expired
            ? <>{name} vẫn làm đủ bài cô giao và phòng thi lớp. Mở gói học để con tiếp tục luyện tập theo lộ trình riêng, chuyên đề nâng cao và trò chơi trí tuệ.</>
            : <>Học thử miễn phí đến <b>{fmtDay(gate.until)}</b>. Mở gói trước hạn để con không bị gián đoạn.</>}
        </p>
        {recap && <RecapLine recap={recap} name={name} />}
      </div>
      <div className="ph-fee-side">
        {offer && price && (
          <p className="ph-fee-price">
            <b>{vnd(price)}</b><span>/ {fixed === 'year' ? 'năm học' : 'học kỳ'}</span>
            <small>{perDay(fixed === 'year' ? price / 2 : price)} mỗi ngày{!fixed && offer.price_term * 2 > offer.price_year ? ` · năm học ${vnd(offer.price_year)}` : ''}</small>
          </p>
        )}
        <Link href="/hoc-sinh/dong-phi" className="btn btn-yellow ph-fee-cta">
          <QrCode aria-hidden="true" /> {expired ? 'Mở gói học cho con' : 'Đồng hành cùng con'} <ArrowRight aria-hidden="true" />
        </Link>
        <p className="ph-fee-safe"><ShieldCheck aria-hidden="true" /> Chuyển thẳng cho EduChain Kids · tự nguyện</p>
      </div>
    </section>
  );
}

/** Milo tóm tắt N ngày học của con — gọn trong 1 dòng */
function RecapLine({ recap: r, name }: { recap: Recap; name: string }) {
  if (!r.total) return <p className="ph-recap-line">📋 {r.days} ngày qua {name} chưa luyện bài nào — ba mẹ ngồi cùng con 10 phút mở bài đầu tiên nhé.</p>;
  return (
    <p className="ph-recap-line">
      📋 {r.days} ngày qua: <b>{r.activeDays}</b> ngày có học · <b>{r.lessons}</b> bài · đúng <b>{r.avg === null ? '—' : `${r.avg}%`}</b>
      {r.weak.length > 0 ? <> · 🌱 cần luyện: {r.weak.slice(0, 2).join(', ')}</> : r.strong.length > 0 ? <> · ⭐ vững: {r.strong.slice(0, 2).join(', ')}</> : null}
    </p>
  );
}
