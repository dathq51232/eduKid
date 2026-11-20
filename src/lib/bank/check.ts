// Máy kiểm câu hỏi trong "Kho câu hỏi" của giáo viên — dùng CÙNG bộ máy với trang Quản trị và kho soạn sẵn
// (src/lib/content/verify-math.ts, rules.ts). Kết quả chỉ là CẢNH BÁO: kho riêng của thầy cô, thầy cô quyết định giữ hay sửa.
//  - tính lại phép tính trong đáp án (thế vào chỗ trống), nhận xét / lời giải; câu Đúng/Sai chấm ngược; "đáp án là X" khớp đáp án
//  - phép tính "… = ?" trong đề khác đáp án (checkMath, môn Toán)
//  - số vượt phạm vi của lớp (môn Toán)
//  - bản sắc: không dùng tên khoa cử
import { questionMathIssues, type MathQ } from '@/lib/content/verify-math';
import { identityIssues } from '@/lib/content/rules';
import type { Muc } from '@/lib/exams/matrix';
import type { SubjectCode } from '@/lib/types';
import { answerOf, checkMath, type Draft } from './parse';
import { gradeMax } from './variants';

/** Mức 1–3 (Thông tư 27, dùng khi ra đề) ↔ mức L1–L5 của app (src/lib/levels.ts) */
export const MUC_LEVEL: Record<Muc, string> = { 1: 'L1–L2', 2: 'L3', 3: 'L4–L5' };

const PART: Record<string, string> = { 'nhận xét': 'Lời giải', 'lời giải': 'Lời giải', 'đáp án': 'Đáp án', 'đúng/sai': 'Câu Đúng/Sai', 'điền': 'Điền', 'cấu trúc': 'Cấu trúc' };
const NUM = /\d{1,3}(?:[.\s]\d{3})+(?![\d])|\d+/g;

// lời giải giáo viên hay ghi đơn vị trong ngoặc: "6 x 5 = 30 (quả)" — bỏ phần ngoặc chữ để máy đọc được phép tính
const unitParen = (s: string) => s.replace(/\(\s*[\p{L}\s.²³]+\)/gu, ' ');

function toMathQ(d: Draft): MathQ {
  return { type: d.type, prompt: d.prompt, options: d.options.map((o) => o.trim()).filter(Boolean), key: answerOf(d), explanation: unitParen(d.explanation) };
}

/** Các cảnh báo của máy cho một câu (rỗng = đạt) */
export function draftIssues(d: Draft, subject: SubjectCode, grade: number): string[] {
  const out: string[] = [];
  if (subject === 'toan') {
    const issues = questionMathIssues(toMathQ(d));
    for (const i of issues) out.push(`${PART[i.part] ?? i.part}: ${i.msg}`);
    const m = issues.some((i) => i.part === 'đáp án') ? undefined : checkMath(d); // tránh báo hai lần cùng một lỗi đáp án
    if (m) out.push(m);
    const max = gradeMax(grade);
    const big = [...`${d.prompt} ${d.options.join(' ')}`.matchAll(NUM)].map((x) => Number(x[0].replace(/[.\s]/g, ''))).filter((v) => v > max);
    if (big.length) out.push(`Số ${big[0].toLocaleString('vi-VN')} lớn hơn phạm vi số của lớp ${grade} (đến ${max.toLocaleString('vi-VN')}) — kiểm tra có vượt chương trình không.`);
  } else {
    // môn khác: vẫn kiểm "đáp án là X" trong lời giải khớp đáp án đúng
    for (const i of questionMathIssues({ ...toMathQ(d), type: d.type === 'single_choice' ? 'single_choice' : 'other' })) if (i.msg.startsWith('nhận xét chỉ')) out.push(`Lời giải: ${i.msg}`);
  }
  for (const t of [d.prompt, d.explanation, ...d.options]) out.push(...identityIssues(t));
  return [...new Set(out)];
}
