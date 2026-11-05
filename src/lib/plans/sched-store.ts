// Lịch báo giảng vừa nạp (chưa chắc đã lưu thành giáo án) — giữ trên máy theo lớp,
// để trang Hôm nay vẫn hiện các tiết của ngày dù thầy cô chưa bấm "Lưu giáo án".
export type SchedSlot = { date: string; period: number; session?: string; subject: string; label: string; title: string };
const KEY = (classId: string) => `edukid:lich-bao-giang:${classId}`;
const KEEP_WEEKS = 6;

export function loadSched(classId: string): SchedSlot[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(classId)) ?? '[]') as unknown;
    return Array.isArray(v) ? (v as SchedSlot[]).filter((s) => s && typeof s.date === 'string' && typeof s.title === 'string') : [];
  } catch { return []; }
}

/** Ghi các tiết vừa nạp: thay các ngày có trong lần nạp này, giữ ngày khác (tối đa ~6 tuần gần nhất). */
export function saveSched(classId: string, slots: SchedSlot[]) {
  if (!slots.length) return;
  const days = new Set(slots.map((s) => s.date));
  const cut = new Date(Date.now() - KEEP_WEEKS * 7 * 86400_000).toISOString().slice(0, 10);
  const next = [...loadSched(classId).filter((s) => !days.has(s.date) && s.date >= cut), ...slots];
  try { localStorage.setItem(KEY(classId), JSON.stringify(next)); } catch { /* bỏ qua */ }
}
