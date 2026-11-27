// Tuần học (ước tính) cho trang chủ giáo viên: tuần 1 bắt đầu thứ Hai đầu tiên sau ngày 5/9.
// Ngoài năm học (tháng 6–8) hoặc trước tuần 1 thì trả null (không hiện).

export function schoolWeek(iso: string): number | null {
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7);
  if (m >= 6 && m <= 8) return null;
  const startYear = m >= 9 ? y : y - 1;
  const sep5 = Date.UTC(startYear, 8, 5);
  const dow = new Date(sep5).getUTCDay(); // 0 = CN
  const monday = sep5 + (((8 - dow) % 7) || 7) * 86_400_000;
  const days = Math.floor((Date.parse(`${iso}T00:00:00Z`) - monday) / 86_400_000);
  return days < 0 ? null : Math.floor(days / 7) + 1;
}

/** Cộng n ngày vào ngày ISO (yyyy-mm-dd) */
export function addDaysIso(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Thứ Hai của tuần chứa ngày iso */
export function mondayOf(iso: string): string {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return addDaysIso(iso, -((dow + 6) % 7));
}
