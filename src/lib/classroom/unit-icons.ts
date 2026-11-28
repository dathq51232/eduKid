// Hình 3D cho thẻ chủ đề ở Phòng thi lớp (bộ public/emoji/f3d + hd — Fluent Emoji 3D, MIT).
// Chọn theo từ khoá trong tên chủ đề (không dấu); không khớp thì lấy hình của môn.
import { fold } from '@/lib/classroom/teacher-nav';
import type { SubjectCode } from '@/lib/types';

const F = (n: string) => `/emoji/f3d/${n}.webp`;
const RULES: [RegExp, string][] = [
  [/nang cao|tu duy|thu thach/, F('light-bulb')],
  [/on tap cuoi nam|cuoi nam/, F('notebook')],
  [/on tap/, '/emoji/hd/trophy.webp'],
  [/hinh khoi/, F('package')],
  [/hinh/, F('triangular-ruler')],
  [/do dai|xang-?ti-?met|met\b|do do/, F('straight-ruler')],
  [/thoi gian|gio\b|lich|ngay|tuan/, F('alarm-clock')],
  [/khoi luong|ki-?lo-?gam|can\b/, F('balance-scale')],
  [/dung tich|lit\b/, F('droplet')],
  [/tien|dong\b/, F('purse')],
  [/phep nhan|phep chia|bang nhan|bang chia/, F('divide')],
  [/phep cong|phep tru|cong|tru/, F('abacus')],
  [/so\b|cac so|den 10|den 100|den 1000/, '/emoji/hd/glowing-star.webp'],
  [/chu cai|am|van\b|tieng/, F('books')],
  [/doc|truyen|tho\b/, F('open-book')],
  [/viet|chinh ta|tap lam van/, F('writing-hand')],
  [/noi|nghe|giao tiep/, F('speech-balloon')],
  [/gia dinh|family/, F('house-with-garden')],
  [/truong|lop|school/, F('school')],
  [/dong vat|animal/, F('cat')],
  [/mau|color/, F('artist-palette')],
];
const BY_SUBJECT: Record<string, string> = { toan: F('abacus'), 'tieng-viet': F('open-book'), 'tieng-anh': F('speaking-head') };

export function unitIcon(title: string, subject: SubjectCode): string {
  // tên gộp nhiều chủ đề (“Chủ đề 1. …, Chủ đề 2. …”) → lấy hình theo chủ đề đầu
  const t = fold(title).split(/,\s*chu de /)[0].replace(/^chu de \d+\.?\s*/, '');
  for (const [re, src] of RULES) if (re.test(t)) return src;
  return BY_SUBJECT[subject] ?? F('books');
}
