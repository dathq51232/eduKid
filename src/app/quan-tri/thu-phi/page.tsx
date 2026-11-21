import BillingAdmin from '@/components/admin/BillingAdmin';
import { FEATURES } from '@/lib/features';
import '@/styles/adm.css';

// Thu phí học sinh (migration 0018, 0074) — mặc định hiện; ẩn: NEXT_PUBLIC_FEATURE_THU_PHI=off rồi Redeploy.
export default function BillingPage() {
  if (!FEATURES.billing) {
    return <p className="adm-alert is-info">Thu phí học sinh đang ẩn (mô hình hiện tại: giáo viên miễn phí, nâng giới hạn học sinh ở mục Giáo viên). Muốn dùng lại: xoá biến NEXT_PUBLIC_FEATURE_THU_PHI (hoặc đặt khác off) trên Vercel rồi Redeploy.</p>;
  }
  return <BillingAdmin />;
}
