// Số liệu trang Quản trị (đọc qua hàm admin_insights / admin_nav_counts ở migration 0049).
// Dùng chung cho trang Tổng quan và trang Truy cập.

export type Period = 1 | 7 | 30 | 365;
export const PERIODS: { k: Period; label: string }[] = [
  { k: 1, label: 'Hôm nay' }, { k: 7, label: '7 ngày' }, { k: 30, label: '30 ngày' }, { k: 365, label: 'Năm' },
];
export const parsePeriod = (v: string | undefined, fallback: Period = 7): Period => {
  const n = Number(v);
  return n === 1 || n === 7 || n === 30 || n === 365 ? n : fallback;
};

export type RoleKey = 'student' | 'teacher' | 'parent' | 'guest' | 'admin';
export type SeriesRow = { k: string } & Partial<Record<RoleKey, number | null>>;
export type RecentUser = { name: string; kind: 'student' | 'teacher' | 'parent' | 'admin'; grade: number | null; at: string; pending: boolean; by: string | null };

export type Insights = {
  days: Period;
  online: Partial<Record<RoleKey, number>>;
  views: number; views_prev: number;
  visitors: number; visitors_prev: number;
  new_users: number; new_users_prev: number;
  attempts: number; accuracy: number | null; study_minutes: number | null;
  revenue_month: number; paid_month: number;
  series: SeriesRow[];
  heat: { d: number; h: number; v: number }[];
  by_grade: Record<string, number>;
  by_device: Partial<Record<'mobile' | 'desktop', number>>;
  by_role: Partial<Record<RoleKey, number>>;
  top_paths: { path: string; v: number }[];
  subjects: { s: string; n: number }[];
  tasks: { teachers_pending: number; lessons_review: number; payments_pending: number };
  recent_users: RecentUser[];
};

export type NavCounts = { unread: number; teachers_pending: number; lessons_review: number; payments_pending: number };

export type AdminNotification = {
  id: number; kind: 'new_user' | 'new_students' | 'teacher_application' | 'payment' | 'lesson_review' | 'traffic';
  title: string; body: string | null; href: string | null; count: number; created_at: string; updated_at: string; read_at: string | null;
};
export const NOTI_GROUPS = [
  { k: '', label: 'Tất cả' }, { k: 'user', label: 'Người dùng' }, { k: 'teacher', label: 'Giáo viên' },
  { k: 'payment', label: 'Thu phí' }, { k: 'content', label: 'Nội dung & truy cập' },
] as const;
export const NOTI_ICON: Record<AdminNotification['kind'], string> = {
  new_user: '🆕', new_students: '🧒', teacher_application: '🎓', payment: '💳', lesson_review: '📝', traffic: '📈',
};

/** Bốn nhóm người xem trên biểu đồ (quản trị gộp vào giáo viên) — thứ tự màu cố định */
export const ROLE_SERIES = [
  { key: 'student', label: 'Học sinh' },
  { key: 'teacher', label: 'Giáo viên' },
  { key: 'parent', label: 'Phụ huynh' },
  { key: 'guest', label: 'Khách (chưa đăng nhập)' },
] as const;
export const roleValue = (r: SeriesRow, key: (typeof ROLE_SERIES)[number]['key']) =>
  key === 'teacher' ? (r.teacher ?? 0) + (r.admin ?? 0) : (r[key] ?? 0);

export const SUBJECT_LABEL: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh', 'nang-cao': 'Chuyên đề nâng cao', khac: 'Khác' };
export const KIND_LABEL: Record<RecentUser['kind'], string> = { student: 'Học sinh', teacher: 'Giáo viên', parent: 'Phụ huynh / người lớn', admin: 'Quản trị' };

export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('vi-VN');
export const money = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr ₫` : `${fmt(n)} ₫`);
/** "▲ 12%" / "▼ 5%" so với kỳ trước; null khi kỳ trước bằng 0 */
export function delta(cur: number, prev: number): { text: string; up: boolean } | null {
  if (!prev) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { text: `${p >= 0 ? '▲' : '▼'} ${Math.abs(p)}%`, up: p >= 0 };
}
export function ago(iso: string | null): string {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
export const isOnline = (iso: string | null) => Boolean(iso && Date.now() - new Date(iso).getTime() < 5 * 60_000);
/** Nhãn trục cho một dòng series: giờ "08h" hoặc ngày "T2 18/11" */
export function seriesLabel(k: string, days: Period): string {
  if (days === 1) return `${k}h`;
  const d = new Date(`${k}T00:00:00`);
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return days === 7 ? `${dow} ${d.getDate()}/${d.getMonth() + 1}` : `${d.getDate()}/${d.getMonth() + 1}`;
}
/** Điền đủ các mốc (ngày/giờ không có lượt xem vẫn hiện cột 0) */
export function fillSeries(rows: SeriesRow[], days: Period): SeriesRow[] {
  const map = new Map(rows.map((r) => [r.k, r]));
  if (days === 1) {
    const now = new Date(Date.now() + 7 * 3600_000).getUTCHours();
    return Array.from({ length: now + 1 }, (_, h) => map.get(String(h).padStart(2, '0')) ?? { k: String(h).padStart(2, '0') });
  }
  const out: SeriesRow[] = [];
  const today = new Date(Date.now() + 7 * 3600_000);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000).toISOString().slice(0, 10);
    out.push(map.get(d) ?? { k: d });
  }
  return days === 365 ? weekly(out) : out;
}
/** Chế độ năm: gộp theo tuần để biểu đồ không quá dày */
function weekly(rows: SeriesRow[]): SeriesRow[] {
  const out: SeriesRow[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    const acc: SeriesRow = { k: chunk[0].k };
    for (const r of chunk) for (const key of ['student', 'teacher', 'parent', 'guest', 'admin'] as RoleKey[]) acc[key] = (acc[key] ?? 0) + (r[key] ?? 0);
    out.push(acc);
  }
  return out;
}
