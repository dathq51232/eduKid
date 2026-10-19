import BillingAdmin from '@/components/admin/BillingAdmin';
import { FEATURES } from '@/lib/features';

// Thu phí học sinh (migration 0018) — đang ẩn khỏi menu; bật: NEXT_PUBLIC_FEATURE_THU_PHI=on rồi Redeploy.
export default function BillingPage() {
  if (!FEATURES.billing) {
    return <p className="adm-alert is-info">Thu phí học sinh đang ẩn (mô hình hiện tại: giáo viên miễn phí, nâng giới hạn học sinh ở mục Giáo viên). Muốn dùng lại: đặt NEXT_PUBLIC_FEATURE_THU_PHI=on trên Vercel rồi Redeploy.</p>;
  }
  return <BillingAdmin />;
}
