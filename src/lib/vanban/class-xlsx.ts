// In theo lớp › Danh sách lớp → file Excel để thầy cô điền và tính toán ngay trên máy.
// Bố cục giống bản in (tên trường, tiêu đề, bảng, ký tên) nhưng có sẵn công thức:
//   - Điểm danh tháng: cột P / K đếm số buổi nghỉ của từng em (COUNTIF), dòng cuối đếm số em vắng mỗi ngày;
//   - cột tiền / số lượng (vd "Số tiền"): định dạng #,##0, dòng "Tổng cộng" (SUM) và số em đã nộp (COUNT).
// Thuần hàm, chạy trên trình duyệt; không gửi dữ liệu đi đâu.
import { XS, colName, range, type XCell, type XSheet } from '@/lib/xlsx';
import { dateLine, daysInMonth, schoolYear, type Ctx, type Pupil, type RosterKind } from './class-print';

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
/** Cột cần cộng tổng: tên có "tiền", "số lượng", "SL", "điểm", "số …" (trừ "số điện thoại", "số báo danh") */
export const isSumCol = (name: string) => /tiền|số lượng|\bsl\b|điểm|^số\s/i.test(name.trim()) && !/điện thoại|báo danh|ngày|\bsđt\b/i.test(name);
/** Độ rộng cột (ký tự) theo tên cột */
const widthOf = (name: string) => (isSumCol(name) ? 14 : /ngày/i.test(name) ? 12 : /ký/i.test(name) ? 18 : /ghi chú|nội dung/i.test(name) ? 24 : 16);

export function rosterXlsx(o: {
  kind: RosterKind; title: string; cols: string[]; month: number; year: number; students: Pupil[]; ctx: Ctx; weekends?: boolean;
}): XSheet {
  const { kind, ctx, students } = o;
  const n = students.length;
  const rows: XCell[][] = [];
  const merges: string[] = [];
  const heights: Record<number, number> = {};

  // cột của bảng
  let heads: string[];
  let widths: number[];
  let days: number[] = [];
  if (kind === 'diem-danh') {
    const dim = daysInMonth(o.month, o.year);
    days = Array.from({ length: dim }, (_, i) => i + 1).filter((d) => o.weekends || ![0, 6].includes(new Date(o.year, o.month - 1, d).getDay()));
    heads = ['STT', 'Họ và tên', ...days.map((d) => `${d}\n${WD[new Date(o.year, o.month - 1, d).getDay()]}`), 'P', 'K'];
    widths = [4.5, 24, ...days.map(() => 3.6), 4.5, 4.5];
  } else {
    heads = ['STT', 'Họ và tên', ...o.cols];
    widths = [5, 26, ...o.cols.map(widthOf)];
  }
  const last = heads.length - 1;
  const full = (r: number) => merges.push(range(r, 0, r, last));

  // đầu trang: tên trường, tiêu đề, dòng phụ
  rows.push([{ v: (ctx.unit || 'TRƯỜNG ……………………').toUpperCase(), s: XS.boldLeft }]); merges.push(range(0, 0, 0, Math.min(last, kind === 'diem-danh' ? 12 : 2)));
  heights[rows.length] = 8; rows.push([]);
  rows.push([{ v: (o.title.trim() || 'DANH SÁCH HỌC SINH').toUpperCase(), s: XS.title }]); full(2); heights[2] = 22;
  rows.push([{ v: kind === 'diem-danh' ? `Lớp ${ctx.className} — Tháng ${o.month}/${o.year}` : `Lớp ${ctx.className} — Năm học ${schoolYear(ctx.date)}`, s: XS.italic }]); full(3);
  heights[rows.length] = 8; rows.push([]);

  // bảng
  const H = rows.length; // dòng tiêu đề cột
  rows.push(heads.map((h) => ({ v: h, s: XS.headFill })));
  heights[H] = kind === 'diem-danh' ? 28 : 24;
  const first = H + 1;
  const end = H + n; // dòng học sinh cuối (0-based)
  const sumCols = kind === 'diem-danh' ? [] : o.cols.map((c, i) => (isSumCol(c) ? i + 2 : -1)).filter((i) => i >= 0);
  students.forEach((p, i) => {
    const r = first + i;
    const cells: XCell[] = [{ v: i + 1, s: XS.center }, { v: p.name, s: XS.text }];
    if (kind === 'diem-danh') {
      days.forEach(() => cells.push({ v: '', s: XS.center }));
      const dayRange = `${colName(2)}${r + 1}:${colName(1 + days.length)}${r + 1}`;
      cells.push({ f: `IF(COUNTIF(${dayRange},"P")=0,"",COUNTIF(${dayRange},"P"))`, s: XS.center });
      cells.push({ f: `IF(COUNTIF(${dayRange},"K")=0,"",COUNTIF(${dayRange},"K"))`, s: XS.center });
    } else {
      o.cols.forEach((c, k) => cells.push({ v: '', s: sumCols.includes(k + 2) ? XS.money : XS.text }));
    }
    rows.push(cells);
    heights[r] = kind === 'diem-danh' ? 17 : 18;
  });

  // dòng tổng
  if (n && kind === 'diem-danh') {
    const r = rows.length;
    const col = (c: number) => `${colName(c)}${first + 1}:${colName(c)}${end + 1}`;
    rows.push([
      { v: 'Số em vắng', s: XS.boldText }, { v: '', s: XS.boldText },
      ...days.map((_, k) => ({ f: `IF(COUNTA(${col(2 + k)})=0,"",COUNTA(${col(2 + k)}))`, s: XS.centerBold })),
      { f: `IF(SUM(${col(2 + days.length)})=0,"",SUM(${col(2 + days.length)}))`, s: XS.centerBold },
      { f: `IF(SUM(${col(3 + days.length)})=0,"",SUM(${col(3 + days.length)}))`, s: XS.centerBold },
    ]);
    merges.push(range(r, 0, r, 1));
    heights[r] = 18;
  } else if (n && sumCols.length) {
    const r = rows.length;
    const col = (c: number) => `${colName(c)}${first + 1}:${colName(c)}${end + 1}`;
    rows.push(heads.map((_, c): XCell => (c === 0 ? { v: 'Tổng cộng', s: XS.boldText }
      : c === 1 ? { v: '', s: XS.boldText }
        : sumCols.includes(c) ? { f: `IF(COUNT(${col(c)})=0,"",SUM(${col(c)}))`, s: XS.moneyBold } : { v: '', s: XS.text })));
    merges.push(range(r, 0, r, 1));
    heights[r] = 19;
  }

  // ghi chú dưới bảng
  heights[rows.length] = 8; rows.push([]);
  const note = rows.length;
  if (kind === 'diem-danh') {
    rows.push([{ v: `Tổng số: ${n} học sinh. Ghi vào ô ngày: P = vắng có phép, K = vắng không phép (cột P, K và dòng "Số em vắng" tự tính).`, s: XS.note }]);
  } else if (sumCols.length) {
    const c = sumCols[0];
    rows.push([{ f: `"Tổng số: ${n} học sinh. Đã nộp: "&COUNT(${colName(c)}${first + 1}:${colName(c)}${end + 1})&"/${n} em."`, s: XS.note }]);
  } else {
    rows.push([{ v: `Tổng số: ${n} học sinh.`, s: XS.note }]);
  }
  merges.push(range(note, 0, note, last));

  // ký tên (nửa phải)
  const signFrom = Math.max(2, Math.ceil((last + 1) / 2));
  const sign = (v: string, s: (typeof XS)[keyof typeof XS]) => {
    const r = rows.length;
    const row: XCell[] = [];
    row[signFrom] = { v, s };
    rows.push(row);
    merges.push(range(r, signFrom, r, last));
  };
  sign(dateLine(ctx.place, ctx.date), XS.italic);
  sign('GIÁO VIÊN CHỦ NHIỆM', XS.bold);
  // chỗ ký: 2 dòng cao (đủ chữ ký, không đẩy tên người ký sang trang sau)
  heights[rows.length] = 22; rows.push([]);
  heights[rows.length] = 22; rows.push([]);
  sign(ctx.teacher || '', XS.bold);

  return {
    name: kind === 'diem-danh' ? `Điểm danh T${o.month}-${o.year}` : (o.title.trim() || 'Danh sách').slice(0, 31),
    rows, merges, heights, cols: widths,
    freeze: { rows: H + 1, cols: 2 },
    printTitleRows: [H, H],
    landscape: kind === 'diem-danh' || o.cols.length > 4,
    margins: [0.4, 0.4, 0.4, 0.5],
    center: true,
  };
}
