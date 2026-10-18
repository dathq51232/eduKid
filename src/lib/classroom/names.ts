// Tên học sinh: nhận danh sách dán từ Excel/vnEdu và sắp xếp theo thứ tự sổ sách nhà trường.

const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
const HEADER_RE = /^(stt|tt|số tt|họ và tên|họ tên|tên học sinh|họ và tên học sinh|học sinh|ngày sinh|nữ|ghi chú)$/i;
const clean = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const isName = (s: string) => s.length >= 2 && s.length <= 60 && NAME_RE.test(s) && !HEADER_RE.test(s);

/**
 * Lấy danh sách tên từ chữ dán vào:
 *  - mỗi dòng một tên ("Nguyễn Văn An", "1. Nguyễn Văn An", "1) An"…);
 *  - hoặc các dòng chép thẳng từ Excel/vnEdu (STT, mã định danh, họ và tên, ngày sinh, nữ… cách nhau bằng Tab):
 *    tự tìm cột họ tên (cột có nhiều tên nhất), bỏ qua số thứ tự, mã, ngày sinh, dấu tích, dòng tiêu đề,
 *    và tên người ký ở cuối bảng (nằm ở cột khác).
 * Chỉ giữ họ tên — không lấy mã định danh, ngày sinh, giới tính.
 */
export function parsePastedNames(text: string): string[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const tabbed = lines.filter((l) => l.includes('\t'));
  if (tabbed.length && tabbed.length >= lines.length / 2) {
    const votes = new Map<number, number>();
    for (const l of tabbed) l.split('\t').forEach((c, i) => { if (isName(clean(c))) votes.set(i, (votes.get(i) ?? 0) + 1); });
    const col = [...votes.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
    if (col === undefined) return [];
    return tabbed.map((l) => clean(l.split('\t')[col] ?? '')).filter(isName);
  }
  return lines
    .map((l) => clean(l.replace(/^\s*\d{1,3}\s*[.)\-:]?\s+/, '')))
    .filter(isName);
}

const split = (n: string) => clean(n).split(' ');
const coll = new Intl.Collator('vi', { sensitivity: 'base' });
const collExact = new Intl.Collator('vi');

/** So sánh theo thứ tự sổ sách (như vnEdu): theo TÊN trước (Anh < Ân < Bảo < Băng…), trùng tên thì theo họ và tên đầy đủ. */
export function compareViName(a: string, b: string): number {
  const x = split(a), y = split(b);
  return coll.compare(x[x.length - 1], y[y.length - 1]) || coll.compare(x.join(' '), y.join(' ')) || collExact.compare(a, b);
}
