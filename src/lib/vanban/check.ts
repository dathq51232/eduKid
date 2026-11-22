// Kiểm tra & sửa lỗi trình bày thường gặp trong văn bản hành chính (NĐ30/2020) — chạy hoàn toàn trên máy, không gửi đi đâu.
// Mỗi quy tắc: tìm lỗi trên từng dòng, có thể kèm cách sửa tự động. Quy tắc chỉ báo (không sửa) khi sửa máy móc dễ sai nghĩa.

export type Issue = { line: number; rule: string; msg: string; sample: string; fixable: boolean };
type Rule = { id: string; msg: string; find: RegExp; fix?: (line: string) => string };

const RULES: Rule[] = [
  { id: 'space', msg: 'Nhiều dấu cách liền nhau', find: /\S {2,}\S/, fix: (s) => s.replace(/(\S) {2,}/g, '$1 ') },
  { id: 'trim', msg: 'Dấu cách thừa ở đầu / cuối dòng', find: /^\s+\S|\S\s+$/, fix: (s) => s.trim() },
  { id: 'before-punct', msg: 'Dấu cách trước dấu câu', find: /\S\s+[,.;:!?)](?!\.)/, fix: (s) => s.replace(/(\S)\s+([,;:!?)])/g, '$1$2').replace(/([^\s.])\s+\.(?!\.)/g, '$1.') },
  { id: 'after-punct', msg: 'Thiếu dấu cách sau dấu câu', find: /[,;:]\p{L}|\.\p{Ll}{2}/u, fix: (s) => s.replace(/([,;:])(\p{L})/gu, '$1 $2').replace(/\.(\p{Ll}{2})/gu, '. $1') },
  { id: 'paren', msg: 'Dấu cách thừa trong ngoặc', find: /\(\s+|\s+\)/, fix: (s) => s.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')') },
  { id: 'cap-sentence', msg: 'Chữ đầu câu chưa viết hoa', find: /(?<!v\.v)[.!?]\s+\p{Ll}/u, fix: (s) => s.replace(/(?<!v\.v)([.!?]\s+)(\p{Ll})/gu, (_, a: string, b: string) => a + b.toUpperCase()) },
  { id: 'cap-line', msg: 'Chữ đầu dòng chưa viết hoa', find: /^\s*(?:[-+*•]\s*)?(?![a-zđ]\)\s)\p{Ll}/u, fix: (s) => s.replace(/^(\s*(?:[-+*•]\s*)?)(?![a-zđ]\)\s)(\p{Ll})/u, (_, a: string, b: string) => a + b.toUpperCase()) },
  { id: 'bullet', msg: 'Gạch đầu dòng nên dùng dấu “-”', find: /^\s*[*•+–]\s+/, fix: (s) => s.replace(/^\s*[*•+–]\s+/, '- ') },
  { id: 'motto', msg: 'Tiêu ngữ đúng mẫu: “Độc lập - Tự do - Hạnh phúc”', find: /Độc lập\s*[–—-]?\s*Tự do\s*[–—-]?\s*Hạnh phúc/i, fix: (s) => s.replace(/Độc lập\s*[–—-]?\s*Tự do\s*[–—-]?\s*Hạnh phúc/gi, 'Độc lập - Tự do - Hạnh phúc') },
  { id: 'nation', msg: 'Quốc hiệu đúng mẫu: “CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM”', find: /c[ộo]ng\s+h[òo]à?\s+x[ãa]\s+h[ộo]i\s+ch[ủu]\s+ngh[ĩi]a\s+vi[ệe]t\s+nam/i, fix: (s) => s.replace(/c[ộo]ng\s+h[òo]à?\s+x[ãa]\s+h[ộo]i\s+ch[ủu]\s+ngh[ĩi]a\s+vi[ệe]t\s+nam/gi, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM') },
  { id: 'number', msg: 'Số văn bản đúng mẫu: “Số: 05/TB-…”', find: /^\s*Số\s*:?\s*\d\//i, fix: (s) => s.replace(/^\s*Số\s*:?\s*(\d)\//i, 'Số: 0$1/') },
  { id: 'number-colon', msg: 'Sau chữ “Số” có dấu hai chấm, không cách', find: /^\s*Số\s+:|^\s*Số\s+\d/, fix: (s) => s.replace(/^\s*Số\s*:?\s*/, 'Số: ') },
  { id: 'date', msg: 'Ngày tháng nên ghi “ngày 05 tháng 01 năm 2026” (không viết 5/1/2026)', find: /\bngày\s+\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/i, fix: (s) => s.replace(/\bngày\s+(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/gi, (_, d: string, m: string, y: string) => `ngày ${d.padStart(2, '0')} tháng ${Number(m) < 3 ? m.padStart(2, '0') : Number(m)} năm ${y}`) },
  { id: 'date-pad', msg: 'Ngày dưới 10 và tháng 1, 2 phải thêm số 0 (ngày 05 tháng 01)', find: /ngày\s+\d\s+tháng|tháng\s+[12]\s+năm/i, fix: (s) => s.replace(/ngày\s+(\d)\s+tháng/gi, 'ngày 0$1 tháng').replace(/tháng\s+([12])\s+năm/gi, 'tháng 0$1 năm') },
  { id: 'kinh-gui', msg: 'Viết “Kính gửi:” (chữ K hoa, có dấu hai chấm)', find: /^\s*kính\s*gửi/i, fix: (s) => s.replace(/^\s*kính\s+gửi\s*:?\s*/i, 'Kính gửi: ') },
  { id: 'noi-nhan', msg: 'Viết “Nơi nhận:” (có dấu hai chấm)', find: /^\s*nơi\s*nhận/i, fix: (s) => s.replace(/^\s*nơi\s+nhận\s*:?\s*/i, 'Nơi nhận:') },
];

export const RULE_COUNT = RULES.length;
/** đã viết đúng mẫu thì không báo */
const skipCorrect = (id: string, line: string) =>
  (id === 'kinh-gui' && /^Kính gửi: /.test(line)) || (id === 'noi-nhan' && /^Nơi nhận:/.test(line));

export function checkText(text: string): Issue[] {
  const out: Issue[] = [];
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    for (const r of RULES) {
      const m = r.find.exec(line);
      // quốc hiệu / tiêu ngữ: chỉ báo khi khác mẫu chuẩn
      if (!m) continue;
      if (r.id === 'motto' && /Độc lập - Tự do - Hạnh phúc/.test(line)) continue;
      if (r.id === 'nation' && line.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) continue;
      if (skipCorrect(r.id, line)) continue;
      out.push({ line: i + 1, rule: r.id, msg: r.msg, sample: line.trim().slice(0, 90), fixable: Boolean(r.fix) });
    }
  });
  // nơi nhận: mỗi dòng kết thúc “;”, dòng cuối (Lưu: …) kết thúc “.”
  const lines = text.split('\n');
  const at = lines.findIndex((l) => /^\s*Nơi\s*nhận/i.test(l));
  if (at >= 0) {
    const rec = lines.slice(at + 1).map((l, k) => ({ l: l.trim(), n: at + 2 + k })).filter((x) => /^-/.test(x.l));
    rec.forEach((x, k) => {
      const last = k === rec.length - 1;
      if (last && !/\.$/.test(x.l)) out.push({ line: x.n, rule: 'rec-end', msg: 'Dòng cuối nơi nhận kết thúc bằng dấu chấm (- Lưu: VT.)', sample: x.l, fixable: false });
      if (!last && !/;$/.test(x.l)) out.push({ line: x.n, rule: 'rec-semi', msg: 'Mỗi nơi nhận kết thúc bằng dấu chấm phẩy', sample: x.l, fixable: false });
    });
  }
  return out;
}

/* ---------------------------------------------------------- chữ trong file Word (giữ định dạng) */
// Sửa từng đoạn chữ bên trong HTML của file Word: KHÔNG cắt khoảng trắng đầu/cuối (đoạn chữ đậm/nghiêng nằm cạnh nhau),
// không viết hoa đầu dòng (đoạn chữ có thể nằm giữa câu).
const INLINE_RULES = new Set(['space', 'before-punct', 'after-punct', 'paren', 'cap-sentence', 'motto', 'nation', 'number', 'number-colon', 'date', 'date-pad', 'kinh-gui', 'noi-nhan']);
export function fixInline(s: string): string {
  if (!s.trim()) return s;
  let t = s;
  for (const r of RULES) {
    if (!r.fix || !INLINE_RULES.has(r.id) || !r.find.test(t)) continue;
    if (r.id === 'motto' && /Độc lập - Tự do - Hạnh phúc/.test(t)) continue;
    if (r.id === 'nation' && t.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) continue;
    if (skipCorrect(r.id, t)) continue;
    t = r.fix(t);
  }
  return t;
}

/* ---------------------------------------------------------- ô bảng tính */
const CELL_RULES = new Set(['space', 'trim', 'before-punct', 'after-punct', 'paren', 'bullet', 'motto', 'nation', 'date', 'date-pad']);
/** Viết hoa chữ đầu mỗi tiếng: "nguyễn  văn AN" → "Nguyễn Văn An" */
export const titleCaseVi = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi').replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase('vi'));
/** Cột họ tên: tiêu đề có "họ", "tên", "học sinh", "phụ huynh", "giáo viên", "người" */
export const isNameHeader = (h: string) => /(họ\s*(và|&)?\s*tên|^tên\b|học sinh|phụ huynh|giáo viên|người\s)/i.test(h.trim()) && !/(trường|lớp|môn|bài|đăng nhập|tài khoản)/i.test(h);

/** Chuẩn hoá một ô: dấu cách, dấu câu, ngày "5/1/2026" → "05/01/2026"; cột họ tên viết hoa từng tiếng */
export function fixCell(v: string, name = false): string {
  if (!v || !v.trim()) return v;
  let s = v.replace(/\r\n?/g, '\n').split('\n').map((line) => {
    let t = line;
    for (const r of RULES) if (r.fix && CELL_RULES.has(r.id) && r.find.test(t)) t = r.fix(t);
    return t;
  }).join('\n');
  // ngày đứng riêng trong ô: 5/1/2026, 5-1-2026, 5.1.2026 → 05/01/2026
  s = s.replace(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/, (m, d: string, mo: string, y: string) => (Number(d) <= 31 && Number(mo) <= 12 ? `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${y}` : m));
  if (name && /^[\p{L}\s.'-]+$/u.test(s) && s.trim().split(/\s+/).length <= 6) s = titleCaseVi(s);
  return s;
}

/** Chuẩn hoá cả bảng: tự nhận dòng tiêu đề (dòng đầu có ≥ 2 ô chữ) để biết cột họ tên. changes: [dòng, cột, cũ, mới] */
export function fixRows(rows: string[][]): { rows: string[][]; changes: [number, number, string, string][] } {
  const hi = rows.findIndex((r) => r.filter((c) => c?.trim()).length >= 2);
  const nameCols = new Set<number>();
  if (hi >= 0) rows[hi].forEach((h, c) => { if (h && isNameHeader(h)) nameCols.add(c); });
  const changes: [number, number, string, string][] = [];
  const out = rows.map((r, ri) => r.map((v, ci) => {
    const nv = fixCell(v ?? '', ri > hi && nameCols.has(ci));
    if (nv !== (v ?? '')) changes.push([ri, ci, v ?? '', nv]);
    return nv;
  }));
  return { rows: out, changes };
}

/** Sửa tự động mọi lỗi sửa được; trả về văn bản mới và số chỗ đã sửa */
export function fixText(text: string): { text: string; fixed: number } {
  let fixed = 0;
  const lines = text.replace(/\r\n?/g, '\n').replace(/\t/g, ' ').split('\n').map((line) => {
    if (!line.trim()) return '';
    let s = line;
    for (const r of RULES) {
      if (!r.fix || !r.find.test(s)) continue;
      if (r.id === 'motto' && /Độc lập - Tự do - Hạnh phúc/.test(s)) continue;
      if (r.id === 'nation' && s.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) continue;
      if (skipCorrect(r.id, s)) continue;
      const next = r.fix(s);
      if (next !== s) { fixed++; s = next; }
    }
    return s;
  });
  // bỏ dòng trống liên tiếp
  const out = lines.filter((l, i) => l !== '' || (i > 0 && lines[i - 1] !== ''));
  return { text: out.join('\n').trim(), fixed };
}
