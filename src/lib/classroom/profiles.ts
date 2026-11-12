// Hồ sơ học sinh (migration 0050): STT theo sổ của trường, ngày sinh, chỗ ở hiện nay.
// Đọc bảng dán từ Excel / vnEdu / Google Sheets: tự nhận cột STT, họ tên, ngày sinh, địa chỉ rồi ghép theo tên học sinh.
import { fold } from '@/lib/classroom/teacher-nav';
import type { XCell, XSheet } from '@/lib/xlsx';
import { XS } from '@/lib/xlsx';

export type Profile = { roll: string; birth: string; address: string };
export const EMPTY_PROFILE: Profile = { roll: '', birth: '', address: '' };
export type ProfileStudent = { id: string; name: string };

const clean = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
const HEADER_RE = /^(stt|tt|số tt|họ và tên|họ tên|tên học sinh|họ và tên học sinh|học sinh|ngày sinh|nữ|giới tính|ghi chú|chỗ ở.*|địa chỉ.*)$/i;
const isName = (s: string) => s.length >= 4 && s.length <= 60 && s.includes(' ') && NAME_RE.test(s) && !HEADER_RE.test(s);

/** "10/5/2020", "10-05-2020", "10.05.2020", "2020-05-10", số ngày kiểu Excel → "dd/mm/yyyy"; không hợp lệ → null */
export function parseBirth(raw: string): string | null {
  const s = clean(raw);
  if (!s) return null;
  let d: number, m: number, y: number;
  let k = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (k) { d = +k[1]; m = +k[2]; y = +k[3]; if (y < 100) y += 2000; }
  else if ((k = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +k[1]; m = +k[2]; d = +k[3]; }
  else if (/^\d{5}$/.test(s)) { // số ngày của Excel (tính từ 30/12/1899)
    const t = new Date(Date.UTC(1899, 11, 30) + +s * 864e5);
    d = t.getUTCDate(); m = t.getUTCMonth() + 1; y = t.getUTCFullYear();
  } else return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d || y < 2005 || y > 2030) return null;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
/** "dd/mm/yyyy" → "yyyy-mm-dd" (gửi database) */
export const birthIso = (b: string) => { const v = parseBirth(b); return v ? v.split('/').reverse().join('-') : null; };
/** "yyyy-mm-dd" (database) → "dd/mm/yyyy" */
export const birthVi = (iso: string | null | undefined) => (iso ? parseBirth(iso) ?? '' : '');
export const isBirthOk = (b: string) => !b.trim() || parseBirth(b) !== null;
export const parseRoll = (r: string) => { const n = Number(r.trim()); return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null; };
export const isRollOk = (r: string) => !r.trim() || parseRoll(r) !== null;

export type PasteRow = { roll: string; name: string; birth: string; address: string };

/**
 * Đọc các dòng chép từ bảng tính (cách nhau bằng Tab). Mỗi cột được "bầu" theo nội dung:
 * cột có nhiều họ tên nhất là Họ và tên, nhiều ngày nhất là Ngày sinh, số nhỏ đứng trước họ tên là STT,
 * cột chữ dài còn lại là Chỗ ở. Bỏ qua dòng tiêu đề và dòng không có họ tên.
 */
export function parseProfilePaste(text: string): PasteRow[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.includes('\t') && l.trim());
  if (!lines.length) return [];
  const rows = lines.map((l) => l.split('\t').map(clean));
  const width = Math.max(...rows.map((r) => r.length));
  const score = (test: (c: string) => boolean) => Array.from({ length: width }, (_, i) => rows.filter((r) => test(r[i] ?? '')).length);
  const best = (v: number[], skip: number[] = []) => {
    let at = -1;
    v.forEach((n, i) => { if (n > 0 && !skip.includes(i) && (at < 0 || n > v[at])) at = i; });
    return at;
  };
  const nameCol = best(score(isName));
  if (nameCol < 0) return [];
  const birthCol = best(score((c) => parseBirth(c) !== null), [nameCol]);
  const rollScore = score((c) => /^\d{1,2}$/.test(c)).map((n, i) => (i < nameCol ? n : 0));
  const rollCol = best(rollScore, [nameCol, birthCol]);
  const addrScore = score((c) => c.length >= 6 && parseBirth(c) === null && !/^\d+$/.test(c) && !HEADER_RE.test(c));
  const addrCol = best(addrScore, [nameCol, birthCol, rollCol]);
  const cell = (r: string[], i: number) => (i >= 0 ? r[i] ?? '' : '');
  return rows
    .filter((r) => isName(cell(r, nameCol)))
    .map((r) => ({
      name: cell(r, nameCol),
      roll: /^\d{1,2}$/.test(cell(r, rollCol)) ? String(+cell(r, rollCol)) : '',
      birth: parseBirth(cell(r, birthCol)) ?? '',
      address: cell(r, addrCol).slice(0, 200),
    }));
}

/** Ghép dòng dán vào với học sinh trong lớp: đúng họ tên trước, rồi họ tên không dấu (chỉ khi duy nhất) */
export function matchPaste(rows: PasteRow[], students: ProfileStudent[]) {
  const exact = new Map<string, ProfileStudent[]>();
  const loose = new Map<string, ProfileStudent[]>();
  for (const s of students) {
    const e = clean(s.name).toLowerCase(), l = fold(s.name);
    exact.set(e, [...(exact.get(e) ?? []), s]);
    loose.set(l, [...(loose.get(l) ?? []), s]);
  }
  const matched: { student: ProfileStudent; row: PasteRow }[] = [];
  const unmatched: string[] = [];
  const used = new Set<string>();
  for (const r of rows) {
    const c = exact.get(r.name.toLowerCase()) ?? loose.get(fold(r.name)) ?? [];
    const s = c.find((x) => !used.has(x.id));
    if (s) {
      used.add(s.id);
      matched.push({ student: s, row: r });
    } else unmatched.push(r.name);
  }
  return { matched, unmatched, missing: students.filter((s) => !used.has(s.id)) };
}

/** Thứ tự hiển thị: theo STT của sổ (em chưa có STT xếp sau, giữ thứ tự sẵn có) */
export function byRoll<T extends { id: string }>(list: T[], prof: Record<string, Profile>): T[] {
  return list
    .map((s, i) => ({ s, i, r: parseRoll(prof[s.id]?.roll ?? '') ?? 1000 }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.s);
}

/** Bảng tính "Danh sách học sinh lớp …" giống mẫu nhà trường: STT · Họ và tên · Ngày sinh · Chỗ ở hiện nay */
export function profileSheet(className: string, students: ProfileStudent[], prof: Record<string, Profile>): XSheet {
  const rows: XCell[][] = [
    [{ v: `DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`, s: XS.title }],
    [],
    [{ v: 'STT', s: XS.header }, { v: 'Họ và tên', s: XS.header }, { v: 'Ngày sinh', s: XS.header }, { v: 'Chỗ ở hiện nay', s: XS.header }],
    ...students.map((s, i): XCell[] => {
      const p = prof[s.id] ?? EMPTY_PROFILE;
      return [{ v: parseRoll(p.roll) ?? i + 1, s: XS.center }, { v: s.name, s: XS.text }, { v: p.birth, s: XS.center }, { v: p.address, s: XS.text }];
    }),
  ];
  return { name: 'Danh sách', rows, merges: ['A1:D1'], cols: [6, 28, 13, 60], freeze: { rows: 3, cols: 0 } };
}
