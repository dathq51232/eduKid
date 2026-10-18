// Xuất "Bảng tổng hợp kết quả đánh giá giáo dục" theo mẫu vnEdu (giữa/cuối học kỳ I, giữa học kỳ II, cuối năm).
// Cột và thứ tự học sinh giống file vnEdu (STT, mã, họ tên, ngày sinh, nữ, các môn, năng lực, phẩm chất…)
// để thầy cô chép nguyên khối mức/điểm sang vnEdu. Mã định danh, ngày sinh, giới tính KHÔNG lưu trên
// EduChain Kids nên để trống — lấy theo hồ sơ vnEdu.
// Trang thứ hai: nhận xét đã lưu của kỳ (mỗi môn một cột).

import { range, XS, type XCell, type XSheet } from '../xlsx';
import { compareViName } from './names';
import {
  KQGD_NAME, QUALITY_GROUP_NAME, SCHOOL_SUBJECT_NAME, isScored, kqgdOf, qualitiesFor, requiredSubjects,
  type Award, type ExamCode, type Kqgd, type QualityLevel, type SchoolSubject, type SubjectLevel,
} from './school';

export type VneduInput = {
  className: string;
  grade: number;
  year: number; // năm bắt đầu năm học
  exam: ExamCode;
  students: { id: string; name: string }[];
  scores: { student_id: string; subject: string; score: number | null; level: SubjectLevel | null }[];
  qualities: { student_id: string; item: string; level: QualityLevel | null }[];
  awards?: Award[];
  comments?: { student_id: string; subject: string; comment: string }[];
};

const TITLE: Record<ExamCode, string> = { gk1: 'GIỮA HỌC KỲ I', ck1: 'CUỐI HỌC KỲ I', gk2: 'GIỮA HỌC KỲ II', ck2: 'CUỐI NĂM HỌC' };
const SHEET: Record<ExamCode, string> = { gk1: 'Gk1', ck1: 'Hk1', gk2: 'Gk2', ck2: 'Hk2' };
const VN_SUBJECT: Partial<Record<SchoolSubject, string>> = { tnxh: 'TN-XH', 'tieng-anh': 'Tiếng Anh', 'lich-su-dia-li': 'Lịch sử và Địa lí', 'tin-hoc-cong-nghe': 'Tin học và Công nghệ' };
const QL = (l: QualityLevel | null | undefined) => (l === 'D' ? 'Đ' : l ?? '');
const h = (v: string): XCell => ({ v, s: XS.header });
const c = (v: string | number | null | undefined): XCell => ({ v: v ?? '', s: XS.center });
const t = (v: string | null | undefined): XCell => ({ v: v ?? '', s: XS.text });

type Col = { kind: 'level' | 'score'; subject: SchoolSubject } | { kind: 'quality'; item: string } | { kind: 'kq'; k: Kqgd } | { kind: 'award'; which: 'year' | 'other' } | { kind: 'up' } | { kind: 'note' };

export function vneduSheets(inp: VneduInput): XSheet[] {
  const { grade, exam } = inp;
  const students = [...inp.students].sort((a, b) => compareViName(a.name, b.name));
  const subjects = requiredSubjects(grade);
  const quals = qualitiesFor(grade);
  const nlChung = quals.filter((q) => q.group === 'nl-chung');
  const nlDacThu = quals.filter((q) => q.group === 'nl-dac-thu');
  const phamChat = quals.filter((q) => q.group === 'pham-chat');
  const score = new Map(inp.scores.map((r) => [`${r.student_id}:${r.subject}`, r]));
  const qual = new Map(inp.qualities.map((r) => [`${r.student_id}:${r.item}`, r.level]));

  // ---------- cột
  const FIRST = 6; // A STT, B mã, C–D họ tên, E ngày sinh, F nữ
  const cols: Col[] = [];
  for (const s of subjects) {
    cols.push({ kind: 'level', subject: s });
    if (isScored(grade, exam, s)) cols.push({ kind: 'score', subject: s });
  }
  for (const q of [...nlChung, ...nlDacThu, ...phamChat]) cols.push({ kind: 'quality', item: q.item });
  if (exam === 'ck2') {
    for (const k of ['HTXS', 'HTT', 'HT', 'CHT'] as Kqgd[]) cols.push({ kind: 'kq', k });
    cols.push({ kind: 'award', which: 'year' }, { kind: 'award', which: 'other' }, { kind: 'up' });
  }
  cols.push({ kind: 'note' });
  const ncol = FIRST + cols.length;
  const last = ncol - 1;
  const colOf = (pred: (x: Col) => boolean) => FIRST + cols.findIndex(pred);

  const rows: XCell[][] = [];
  const merges: string[] = [];
  const blank = () => Array<XCell>(ncol).fill(null);
  const put = (r: number, col: number, v: XCell) => { while (rows.length <= r) rows.push(blank()); rows[r][col] = v; };
  const box = (r1: number, c1: number, r2: number, c2: number, v: string) => {
    for (let r = r1; r <= r2; r++) for (let k = c1; k <= c2; k++) put(r, k, h(r === r1 && k === c1 ? v : ''));
    if (r1 !== r2 || c1 !== c2) merges.push(range(r1, c1, r2, c2));
  };

  // ---------- tiêu đề
  put(0, 0, { v: 'ỦY BAN NHÂN DÂN …………………………', s: XS.boldLeft });
  put(1, 0, { v: 'TRƯỜNG …………………………………………', s: XS.boldLeft });
  put(2, 0, { v: `BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ GIÁO DỤC ${TITLE[exam]}`, s: XS.title });
  put(3, 0, { v: `Năm học: ${inp.year} - ${inp.year + 1}`, s: XS.bold });
  put(4, 0, { v: `Lớp: ${inp.className}`, s: XS.bold });
  for (const r of [2, 3, 4]) merges.push(range(r, 0, r, last));

  // ---------- 4 dòng tiêu đề bảng (6–9 trong Excel)
  const H0 = 5, H3 = 8;
  box(H0, 0, H3, 0, 'STT');
  box(H0, 1, H3, 1, 'Mã định danh');
  box(H0, 2, H3, 3, 'HỌ VÀ TÊN HỌC SINH');
  box(H0, 4, H3, 4, 'Ngày,\ntháng,\nnăm sinh');
  box(H0, 5, H3, 5, 'Nữ');
  const subjStart = FIRST;
  const subjEnd = colOf((x) => x.kind === 'quality') - 1;
  box(H0, subjStart, H0, subjEnd, 'Môn học và hoạt động giáo dục');
  for (const s of subjects) {
    const c1 = colOf((x) => x.kind === 'level' && x.subject === s);
    const scored = isScored(grade, exam, s);
    const c2 = scored ? c1 + 1 : c1;
    if (s === 'am-nhac' || s === 'mi-thuat') {
      if (s === 'am-nhac') {
        const mt = colOf((x) => x.kind === 'level' && x.subject === 'mi-thuat');
        const mtEnd = isScored(grade, exam, 'mi-thuat') ? mt + 1 : mt;
        box(H0 + 1, c1, H0 + 1, mtEnd, 'Nghệ thuật');
      }
      box(H0 + 2, c1, H0 + 2, c2, SCHOOL_SUBJECT_NAME[s]);
    } else {
      box(H0 + 1, c1, H0 + 2, c2, VN_SUBJECT[s] ?? SCHOOL_SUBJECT_NAME[s]);
    }
    box(H3, c1, H3, c1, 'Mức đạt được');
    if (scored) box(H3, c1 + 1, H3, c1 + 1, 'Điểm KTĐK');
  }
  const nlStart = colOf((x) => x.kind === 'quality');
  const nlEnd = nlStart + nlChung.length + nlDacThu.length - 1;
  box(H0, nlStart, H0, nlEnd, 'Năng lực cốt lõi');
  box(H0 + 1, nlStart, H0 + 1, nlStart + nlChung.length - 1, QUALITY_GROUP_NAME['nl-chung']);
  box(H0 + 1, nlStart + nlChung.length, H0 + 1, nlEnd, QUALITY_GROUP_NAME['nl-dac-thu']);
  const SHORT: Record<string, string> = { 'nl-gqvd': 'GQVĐ và sáng tạo' };
  [...nlChung, ...nlDacThu].forEach((q, i) => box(H0 + 2, nlStart + i, H3, nlStart + i, SHORT[q.item] ?? q.name));
  const pcStart = nlEnd + 1;
  box(H0, pcStart, H0, pcStart + phamChat.length - 1, 'Phẩm chất chủ yếu');
  phamChat.forEach((q, i) => box(H0 + 1, pcStart + i, H3, pcStart + i, q.name));
  if (exam === 'ck2') {
    const kq = colOf((x) => x.kind === 'kq');
    box(H0, kq, H0, kq + 3, 'Đánh giá KQGD');
    (['HTXS', 'HTT', 'HT', 'CHT'] as Kqgd[]).forEach((k, i) => box(H0 + 1, kq + i, H3, kq + i, KQGD_NAME[k]));
    const aw = colOf((x) => x.kind === 'award');
    box(H0, aw, H0, aw + 1, 'Khen thưởng');
    box(H0 + 1, aw, H3, aw, 'Cuối năm');
    box(H0 + 1, aw + 1, H3, aw + 1, 'Đột xuất');
    const up = colOf((x) => x.kind === 'up');
    box(H0, up, H3, up, 'Lên lớp');
  }
  const note = colOf((x) => x.kind === 'note');
  box(H0, note, H3, note, 'Ghi chú');

  // ---------- dữ liệu
  const yearFrom = `${inp.year}-08-01`, yearTo = `${inp.year + 1}-07-31`;
  const awardsOf = (sid: string) => (inp.awards ?? []).filter((a) => a.student_id === sid && a.awarded_on >= yearFrom && a.awarded_on <= yearTo);
  let missingKq = 0;
  students.forEach((st, i) => {
    const r = H3 + 1 + i;
    put(r, 0, c(i + 1)); put(r, 1, c('')); put(r, 2, t(st.name)); put(r, 3, t('')); put(r, 4, c('')); put(r, 5, c(''));
    merges.push(range(r, 2, r, 3));
    let kq: Kqgd | null = null;
    if (exam === 'ck2') {
      kq = kqgdOf(
        subjects.map((s) => score.get(`${st.id}:${s}`)?.level ?? null),
        subjects.filter((s) => isScored(grade, exam, s)).map((s) => score.get(`${st.id}:${s}`)?.score ?? null),
        quals.map((q) => qual.get(`${st.id}:${q.item}`) ?? null),
      );
      if (!kq) missingKq++;
    }
    cols.forEach((col, k) => {
      const at = FIRST + k;
      switch (col.kind) {
        case 'level': put(r, at, c(score.get(`${st.id}:${col.subject}`)?.level ?? '')); break;
        case 'score': { const v = score.get(`${st.id}:${col.subject}`)?.score; put(r, at, c(v == null ? '' : Number(v))); break; }
        case 'quality': put(r, at, c(QL(qual.get(`${st.id}:${col.item}`)))); break;
        case 'kq': put(r, at, c(kq === col.k ? 'x' : '')); break;
        case 'award':
          put(r, at, col.which === 'year'
            ? t(kq === 'HTXS' ? 'Học sinh Xuất sắc' : '')
            : t(awardsOf(st.id).map((a) => a.title).join('; ')));
          break;
        case 'up': put(r, at, c(kq && kq !== 'CHT' ? 'x' : '')); break;
        case 'note': put(r, at, t('')); break;
      }
    });
  });

  // ---------- chữ ký
  const end = H3 + students.length + 2;
  const gv = Math.min(FIRST + 1, last), ht = Math.max(last - 5, gv + 3);
  put(end, ht, { v: '…………, ngày …… tháng …… năm ……', s: XS.italic });
  put(end + 1, gv, { v: 'Giáo viên chủ nhiệm', s: XS.bold });
  put(end + 1, ht, { v: 'Hiệu trưởng', s: XS.bold });
  put(end + 2, gv, { v: '(Ký, ghi rõ họ tên)', s: XS.italic });
  put(end + 2, ht, { v: '(Ký, ghi rõ họ tên, đóng dấu)', s: XS.italic });
  for (const r of [end, end + 1, end + 2]) {
    merges.push(range(r, ht, r, Math.min(ht + 5, last)));
    if (r > end) merges.push(range(r, gv, r, Math.min(gv + 5, ht - 1)));
  }
  const tips = [
    'Ghi chú: mức môn học T = Hoàn thành tốt, H = Hoàn thành, C = Chưa hoàn thành; phẩm chất, năng lực T = Tốt, Đ = Đạt, C = Cần cố gắng.',
    'Cột mã định danh, ngày sinh, nữ để trống (EduChain Kids không lưu) — dùng theo hồ sơ vnEdu. Thứ tự học sinh xếp theo tên như vnEdu.',
  ];
  if (exam === 'ck2') tips.push(`Đánh giá KQGD, khen thưởng cuối năm, lên lớp là GỢI Ý theo Thông tư 27 từ mức và điểm đã nhập; học sinh tiêu biểu do tập thể lớp đề nghị nên để thầy cô điền.${missingKq ? ` Còn ${missingKq} em thiếu mức hoặc điểm nên chưa xếp loại.` : ''}`);
  tips.forEach((tip, i) => { put(end + 8 + i, 0, { v: tip, s: XS.note }); merges.push(range(end + 8 + i, 0, end + 8 + i, last)); });

  const widths = [5, 13, 20, 6, 11, 4, ...cols.map((x) => (x.kind === 'award' ? 18 : x.kind === 'note' ? 12 : x.kind === 'quality' ? 9 : 8))];
  const main: XSheet = {
    name: `Lớp_${inp.className}-${SHEET[exam]}`,
    rows,
    merges,
    cols: widths,
    heights: { [H0]: 22, [H0 + 1]: 30, [H0 + 2]: 30, [H3]: 48 },
    freeze: { rows: H3 + 1, cols: 4 },
    landscape: true,
  };

  // ---------- trang nhận xét
  const cm = new Map((inp.comments ?? []).filter((x) => x.comment?.trim()).map((x) => [`${x.student_id}:${x.subject}`, x.comment.trim()]));
  const order: [string, string][] = [
    ...subjects.map((s): [string, string] => [s, SCHOOL_SUBJECT_NAME[s]]),
    ...(grade < 3 ? [['tieng-anh', 'Tiếng Anh (tự chọn)'] as [string, string]] : []),
    ['nang-luc', 'Năng lực'], ['pham-chat', 'Phẩm chất'], ['chung', 'Nhận xét chung'],
  ];
  const used = order.filter(([k]) => students.some((st) => cm.has(`${st.id}:${k}`)));
  const cRows: XCell[][] = [
    [{ v: `NHẬN XÉT HỌC SINH — ${TITLE[exam]} — NĂM HỌC ${inp.year} - ${inp.year + 1} — LỚP ${inp.className}`, s: XS.title }],
    [],
    [h('STT'), h('Họ và tên học sinh'), ...used.map(([, n]) => h(n))],
    ...students.map((st, i): XCell[] => [c(i + 1), t(st.name), ...used.map(([k]) => t(cm.get(`${st.id}:${k}`) ?? ''))]),
  ];
  if (!used.length) cRows.push([{ v: 'Chưa có nhận xét đã lưu cho kỳ này — vào trang Nhận xét, bấm tạo nhận xét rồi Lưu.', s: XS.note }]);
  const comments: XSheet = {
    name: `Nhận xét-${SHEET[exam]}`,
    rows: cRows,
    merges: [range(0, 0, 0, Math.max(1, used.length + 1))],
    cols: [5, 24, ...used.map(() => 48)],
    freeze: { rows: 3, cols: 2 },
    landscape: true,
  };
  return [main, comments];
}

export const vneduFilename = (className: string, exam: ExamCode) => `so_diem_tong_ket_lop_${className}_${SHEET[exam].toLowerCase()}.xlsx`;
