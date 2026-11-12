// Tiền Việt cho sổ thu chi: đọc số gõ nhanh ("50k", "1tr2", "1,5 triệu", "200.000"), in "1.200.000đ", danh mục, bảng Excel.
import { XS, type XCell, type XSheet } from '@/lib/xlsx';

/** "50k" → 50000 · "1tr2" → 1200000 · "1,5tr" / "1.5 triệu" → 1500000 · "200.000" → 200000 · không hợp lệ → null */
export function parseMoney(raw: string): number | null {
  const s = raw.toLowerCase().replace(/\s+/g, '').replace(/đ|vnd|vnđ|dong|đồng/g, '');
  if (!s) return null;
  let m = s.match(/^(\d+)(?:[.,](\d+))?(k|ng|nghìn|ngàn|tr|triệu|trieu|m|tỷ|ty)(\d*)$/);
  if (m) {
    const unit = /^(k|ng|nghìn|ngàn)$/.test(m[3]) ? 1e3 : /^(tỷ|ty)$/.test(m[3]) ? 1e9 : 1e6;
    const whole = Number(`${m[1]}.${m[2] ?? '0'}`) * unit;
    // "1tr2" = 1 triệu 2 trăm nghìn; "2k5" = 2.500
    const tail = m[4] ? Number(`0.${m[4]}`) * unit : 0;
    const v = Math.round(whole + tail);
    return v > 0 ? v : null;
  }
  m = s.match(/^\d{1,3}([.,]\d{3})+$/) ?? s.match(/^\d+$/);
  if (m) { const v = Number(s.replace(/[.,]/g, '')); return v > 0 ? v : null; }
  return null;
}

export const fmtMoney = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`;
/** Gọn cho ô nhỏ: 1.250.000 → "1,25tr"; 50.000 → "50k" */
export function shortMoney(n: number): string {
  const a = Math.abs(n), sign = n < 0 ? '-' : '';
  if (a >= 1e9) return `${sign}${+(a / 1e9).toFixed(2)}tỷ`.replace('.', ',');
  if (a >= 1e6) return `${sign}${+(a / 1e6).toFixed(2)}tr`.replace('.', ',');
  if (a >= 1e3) return `${sign}${+(a / 1e3).toFixed(1)}k`.replace('.', ',');
  return `${sign}${a}đ`;
}

export type Kind = 'thu' | 'chi';
export type MoneyCat = { name: string; icon: string };
export const PERSONAL_CATS: Record<Kind, MoneyCat[]> = {
  chi: [
    { name: 'Ăn uống', icon: '🍜' }, { name: 'Đi lại', icon: '🛵' }, { name: 'Nhà cửa', icon: '🏠' }, { name: 'Điện nước, mạng', icon: '💡' },
    { name: 'Con cái', icon: '🧒' }, { name: 'Dạy học', icon: '📚' }, { name: 'Sức khoẻ', icon: '💊' }, { name: 'Hiếu hỉ', icon: '💐' },
    { name: 'Mua sắm', icon: '🛍️' }, { name: 'Tiết kiệm', icon: '🐷' }, { name: 'Khác', icon: '📦' },
  ],
  thu: [
    { name: 'Lương', icon: '💼' }, { name: 'Phụ cấp', icon: '🧾' }, { name: 'Dạy thêm', icon: '✏️' }, { name: 'Thưởng', icon: '🎁' }, { name: 'Khác', icon: '💰' },
  ],
};
export const catIcon = (kind: Kind, name: string) => PERSONAL_CATS[kind].find((c) => c.name === name)?.icon ?? (kind === 'thu' ? '💰' : '📦');
/** Gợi ý nội dung chi quỹ lớp hay gặp */
export const FUND_HINTS = ['Mua phần thưởng', 'Liên hoan cuối kỳ', 'Trang trí lớp', 'Photo tài liệu', 'Nước uống', 'Thăm hỏi học sinh', 'Văn phòng phẩm', 'Hoa 20/11'];

export type MoneyRow = { id: string; day: string; kind: Kind; amount: number; category?: string; content?: string; note: string };
export const viDay = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
export const todayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

/** Sổ thu chi dạng bảng Excel: Ngày · Nội dung · Thu · Chi · Tồn (cộng dồn theo ngày) */
export function ledgerSheet(title: string, rows: MoneyRow[], label: (r: MoneyRow) => string, opening = 0): XSheet {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));
  let bal = opening;
  const body: XCell[][] = sorted.map((r) => {
    bal += r.kind === 'thu' ? r.amount : -r.amount;
    return [{ v: viDay(r.day), s: XS.center }, { v: label(r), s: XS.text }, { v: r.kind === 'thu' ? r.amount : null, s: XS.text }, { v: r.kind === 'chi' ? r.amount : null, s: XS.text }, { v: bal, s: XS.text }, { v: r.note, s: XS.text }];
  });
  const thu = rows.filter((r) => r.kind === 'thu').reduce((a, r) => a + r.amount, 0);
  const chi = rows.filter((r) => r.kind === 'chi').reduce((a, r) => a + r.amount, 0);
  return {
    name: 'Sổ thu chi',
    rows: [
      [{ v: title.toUpperCase(), s: XS.title }],
      [],
      ['Ngày', 'Nội dung', 'Thu (đ)', 'Chi (đ)', 'Tồn (đ)', 'Ghi chú'].map((v) => ({ v, s: XS.header })),
      ...body,
      [{ v: '', s: XS.text }, { v: 'Cộng', s: XS.boldText }, { v: thu, s: XS.boldText }, { v: chi, s: XS.boldText }, { v: opening + thu - chi, s: XS.boldText }, { v: '', s: XS.text }],
    ],
    merges: ['A1:F1'], cols: [12, 36, 14, 14, 14, 28], freeze: { rows: 3, cols: 0 },
  };
}
