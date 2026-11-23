import Link from 'next/link';
import VirtualOffice from '@/components/office/VirtualOffice';
import { getStaffContext } from '@/lib/auth/staff';
import { OFFICE_ROLES, seatCamera, type OfficeRecent, type OfficeRoleView } from '@/lib/office/roles';

export const metadata = { title: 'Văn phòng ảo — Quản trị EduChain Kids' };
export const dynamic = 'force-dynamic';

/** Việc gần nhất: chỉ đọc file khi chạy trên máy (next dev). Trên Vercel / production không gọi fs:
 *  nhánh này bị loại khỏi bản build nên gói máy chủ không kèm docs/ hay file nào ở thư mục gốc. */
async function recentAll(): Promise<Record<string, OfficeRecent>> {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { readRecentLocal } = await import('@/lib/office/recent-local');
      return await readRecentLocal(OFFICE_ROLES);
    } catch { /* không đọc được: coi như không có */ }
  }
  return {};
}

// Văn phòng ảo: CHỈ quản trị viên. Không đọc / ghi database, không chạy agent.
export default async function VirtualOfficePage() {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  if (!ctx.isAdmin) {
    return (
      <div className="adm-alert is-info" role="status">
        Văn phòng ảo chỉ dành cho quản trị viên. <Link href="/quan-tri">Về trang tổng quan</Link>
      </div>
    );
  }
  const recent = await recentAll();
  const roles: OfficeRoleView[] = OFFICE_ROLES.map((r) => ({
    ...r, ...seatCamera(r.seat),
    recent: recent[r.id] ?? (r.outDirs.length ? { state: 'local-only' } : { state: 'none' }),
  }));
  return <VirtualOffice roles={roles} />;
}
