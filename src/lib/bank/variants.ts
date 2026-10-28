// "Câu tương tự" cho môn Toán — không dùng AI, không cần mạng:
// giữ nguyên lời văn của câu gốc, thay các số rồi TỰ TÍNH LẠI đáp án theo phép tính trong câu hoặc trong lời giải.
//   Câu: "Mẹ có 6 túi, mỗi túi 5 quả cam. Mẹ biếu bà 8 quả. Hỏi mẹ còn bao nhiêu quả?"
//   Lời giải: "6 x 5 = 30 (quả); 30 - 8 = 22 (quả)"   →   7 túi, 4 quả, biếu 9 → 28 − 9 = 19
// Số mới cùng số chữ số với số cũ; kết quả không âm, chia hết, không vượt phạm vi số của lớp.
import { draftId, type Draft } from './parse';

type Op = '+' | '-' | '*' | '/';
type Ref = { k: 'v'; i: number } | { k: 's'; i: number } | { k: 'c'; v: number };
type Step = { a: Ref; op: Op; b: Ref };
type Plan = { vars: { value: number; tok: number }[]; steps: Step[]; final: number /* chỉ số bước cho đáp án */; direct?: { expr: string } };

const NUM = /\d{1,3}(?:\.\d{3})+(?!\d)|\d+/g; // 1.250 / 37 (dấu chấm ngăn hàng nghìn)
const toNum = (s: string) => Number(s.replace(/[.\s]/g, ''));
const N = String.raw`\d{1,3}(?:\.\d{3})+(?!\d)|\d+`;
const fmt = (v: number) => (v >= 10000 ? v.toLocaleString('vi-VN') : String(v));
const OPS: Record<string, Op> = { '+': '+', '-': '-', '−': '-', '–': '-', x: '*', '×': '*', '*': '*', ':': '/', '÷': '/', '/': '/' };
const apply = (x: number, op: Op, y: number) => (op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y);

/** Phạm vi số theo lớp (theo chương trình Toán tiểu học) */
export const gradeMax = (g: number) => (g <= 1 ? 100 : g === 2 ? 1000 : g === 3 ? 100000 : 1_000_000_000);

type Tok = { start: number; end: number; value: number };
function tokens(s: string): Tok[] {
  const out: Tok[] = [];
  for (const m of s.matchAll(NUM)) {
    const prev = s[(m.index ?? 0) - 1] ?? '';
    const next = s[(m.index ?? 0) + m[0].length] ?? '';
    if (/[,]/.test(prev) && /\d/.test(s[(m.index ?? 0) - 2] ?? '')) continue; // phần thập phân
    if (next === ',' && /\d/.test(s[(m.index ?? 0) + m[0].length + 1] ?? '')) continue; // số thập phân: giữ nguyên
    out.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, value: toNum(m[0]) });
  }
  return out;
}

/** Các bước tính "a op b = c" trong lời giải (có thể nối nhiều phép: 30 - 8 - 2 = 20) */
function stepsOf(text: string): { nums: number[]; ops: Op[]; res: number }[] {
  const out: { nums: number[]; ops: Op[]; res: number }[] = [];
  const re = new RegExp(`((?:${N})(?:\\s*[+\\-−–x×*:÷/]\\s*(?:${N}))+)\\s*=\\s*(${N})`, 'g');
  for (const m of text.matchAll(re)) {
    const parts = m[1].split(/\s*([+\-−–x×*:÷/])\s*/).filter((x) => x !== '');
    const nums: number[] = []; const ops: Op[] = [];
    parts.forEach((p, i) => { if (i % 2 === 0) nums.push(toNum(p.trim())); else ops.push(OPS[p]); });
    if (nums.some((n) => !Number.isFinite(n)) || ops.some((o) => !o)) continue;
    out.push({ nums, ops, res: toNum(m[2]) });
  }
  return out;
}

/** Tính lần lượt trái → phải nhưng nhân/chia trước cộng/trừ */
function evalChain(nums: number[], ops: Op[]): number {
  const n = [...nums]; const o = [...ops];
  for (let i = 0; i < o.length;) { if (o[i] === '*' || o[i] === '/') { n.splice(i, 2, apply(n[i], o[i], n[i + 1])); o.splice(i, 1); } else i++; }
  return n.slice(1).reduce((acc, v, i) => apply(acc, o[i], v), n[0]);
}

// Số là "hằng số" (quan hệ đơn vị) — giữ nguyên khi tạo câu tương tự
const CONSTS: RegExp[] = [
  /tuần(?:\s*lễ)?\D{0,15}?(7)\s*ngày/gi, /giờ\D{0,12}?(60)\s*phút/gi, /phút\D{0,12}?(60)\s*giây/gi, /ngày\D{0,12}?(24)\s*giờ/gi,
  /năm\D{0,12}?(12)\s*tháng/gi, /năm\D{0,12}?(365|366)\s*ngày/gi, /\bm\b\D{0,8}?(100)\s*cm/gi, /\bm\b\D{0,8}?(10)\s*dm/gi, /\bdm\b\D{0,8}?(10)\s*cm/gi,
  /\bcm\b\D{0,8}?(10)\s*mm/gi, /km\D{0,8}?(1\.?000)\s*m\b/gi, /kg\D{0,8}?(1\.?000)\s*g\b/gi, /\bl\b\D{0,8}?(1\.?000)\s*ml/gi, /tá\D{0,6}?(12)/gi, /chục\D{0,6}?(10)\b/gi,
  /thế kỉ\D{0,8}?(100)\s*năm/gi, /hình (?:tam giác|vuông|chữ nhật)\s*có\s*(3|4)\s*(?:cạnh|góc|đỉnh)/gi,
];
/** Vị trí các số nên giữ nguyên (quan hệ đơn vị: 1 tuần có 7 ngày, 1 giờ có 60 phút…) */
export function autoLocked(prompt: string): number[] {
  const toks = tokens(prompt);
  const out = new Set<number>();
  for (const re of CONSTS) for (const m of prompt.matchAll(re)) {
    const pos = (m.index ?? 0) + m[0].lastIndexOf(m[1]);
    const k = toks.findIndex((t) => t.start === pos);
    if (k >= 0) out.add(k);
  }
  return [...out];
}
/** Các số trong đề (để giáo viên chọn số cố định) */
export const promptNumbers = (prompt: string) => tokens(prompt).map((t) => t.value);

/** Dựng "kế hoạch tính": số nào trong đề là biến, đáp án tính ra sao */
function planOf(d: Pick<Draft, 'prompt' | 'explanation' | 'correct'>, locked: Set<number> = new Set()): Plan | null {
  const toks = tokens(d.prompt);
  if (!toks.length) return null;
  const used = new Set<number>();
  const vars: Plan['vars'] = [];
  const varOf = (v: number): Ref | null => {
    const exist = vars.findIndex((x) => x.value === v && !used.has(x.tok));
    if (exist >= 0) return { k: 'v', i: exist };
    const t = toks.findIndex((x, i) => x.value === v && !vars.some((y) => y.tok === i));
    if (t < 0 || locked.has(t)) return null; // số cố định: coi là hằng số
    vars.push({ value: v, tok: t });
    return { k: 'v', i: vars.length - 1 };
  };
  // 1) theo lời giải
  const st = stepsOf(d.explanation);
  if (st.length) {
    const steps: Step[] = [];
    const results: number[] = [];
    for (const s of st) {
      if (Math.abs(evalChain(s.nums, s.ops) - s.res) > 1e-9) return null; // lời giải tính sai: không dám sinh
      // đổi chuỗi a op b op c thành các bước 2 ngôi (nhân/chia trước)
      const refs: Ref[] = s.nums.map((v) => {
        const r = results.lastIndexOf(v);
        if (r >= 0) return { k: 's', i: r } as Ref;
        return varOf(v) ?? ({ k: 'c', v } as Ref);
      });
      const ops = [...s.ops];
      const vals = [...s.nums];
      for (let i = 0; i < ops.length;) {
        if (ops[i] === '*' || ops[i] === '/') {
          steps.push({ a: refs[i], op: ops[i], b: refs[i + 1] }); const v = apply(vals[i], ops[i], vals[i + 1]); results.push(v);
          refs.splice(i, 2, { k: 's', i: results.length - 1 }); vals.splice(i, 2, v); ops.splice(i, 1);
        } else i++;
      }
      while (ops.length) {
        steps.push({ a: refs[0], op: ops[0], b: refs[1] }); const v = apply(vals[0], ops[0], vals[1]); results.push(v);
        refs.splice(0, 2, { k: 's', i: results.length - 1 }); vals.splice(0, 2, v); ops.shift();
      }
      if (!s.ops.length) continue;
    }
    if (!steps.length || !vars.length) return null;
    // đáp án = bước có kết quả bằng số trong đáp án; không thấy thì bước cuối
    const ans = toNum((d.correct[0] ?? '').match(new RegExp(N))?.[0] ?? 'x');
    let final = results.length - 1;
    if (Number.isFinite(ans)) { const k = results.lastIndexOf(ans); if (k >= 0) final = k; }
    return { vars, steps, final };
  }
  // 2) phép tính ngay trong đề: "125 + 37 = ?", "Kết quả của 6 x 7 là:" — lấy biểu thức có giá trị bằng đáp án (hoặc biểu thức đứng trước "= ?")
  const ansN = toNum((d.correct[0] ?? '').match(new RegExp(N))?.[0] ?? 'x');
  const exprs = [...d.prompt.matchAll(new RegExp(`((?:${N})(?:\\s*[+\\-−–x×*:÷/]\\s*(?:${N}))+)(\\s*=\\s*(?:\\?|…|\\.{2,}|_{2,}|$))?`, 'gm'))];
  for (const m of exprs) {
    const s0 = stepsOf(`${m[1]} = 0`)[0];
    if (!s0) continue;
    const v = evalChain(s0.nums, s0.ops);
    if (!m[2] && !(Number.isFinite(ansN) && Math.abs(v - ansN) < 1e-9)) continue;
    const p = planOf({ prompt: d.prompt, explanation: `${m[1]} = ${v}`, correct: d.correct }, locked);
    if (p) { p.direct = { expr: m[1] }; return p; }
  }
  // 3) bài toán có lời văn không ghi lời giải: tìm phép tính DUY NHẤT giữa 2–3 số trong đề cho ra đáp án (7 ngày × 4 tuần = 28)
  if (Number.isFinite(ansN)) {
    const vals = toks.map((t) => t.value);
    const ops: Op[] = ['+', '-', '*', '/'];
    const sym: Record<Op, string> = { '+': '+', '-': '-', '*': 'x', '/': ':' };
    const found: string[] = [];
    for (let i = 0; i < vals.length; i++) for (let j = 0; j < vals.length; j++) {
      if (i === j) continue;
      for (const o of ops) {
        const v = apply(vals[i], o, vals[j]);
        if (Math.abs(v - ansN) < 1e-9 && Number.isInteger(v)) found.push(`${vals[i]} ${sym[o]} ${vals[j]}`);
      }
    }
    // a op b và b op a cho cùng kết quả với + và x: coi là một cách
    const uniq = [...new Set(found.map((f) => f.split(' ').sort().join(' ')))];
    if (uniq.length === 1) {
      const p = planOf({ prompt: d.prompt, explanation: `${found[0]} = ${ansN}`, correct: d.correct }, locked);
      if (p) return p;
    }
  }
  return null;
}

function run(p: Plan, vals: number[]): number[] | null {
  const res: number[] = [];
  const get = (r: Ref) => (r.k === 'v' ? vals[r.i] : r.k === 's' ? res[r.i] : r.v);
  for (const s of p.steps) {
    const a = get(s.a), b = get(s.b);
    if (s.op === '/' && (b === 0 || a % b !== 0)) return null;
    const v = apply(a, s.op, b);
    if (v < 0 || !Number.isInteger(v)) return null;
    res.push(v);
  }
  return res;
}

function rangeOf(v: number, inMul: boolean): [number, number] {
  if (v === 0) return [0, 0];
  if (inMul && v <= 10) return [2, 9]; // bảng nhân / chia
  const d = String(v).length;
  return d === 1 ? [1, 9] : [10 ** (d - 1), 10 ** d - 1];
}

/** Nhiễu cho trắc nghiệm: ±1, ±10, đảo chữ số, gấp đôi… */
function distractors(ans: number, n: number): number[] {
  const c = new Set<number>();
  const cand = [ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans - 2, Number(String(ans).split('').reverse().join('')), ans + 100, ans - 100, ans * 2, Math.round(ans / 2)];
  for (const x of cand) if (x >= 0 && x !== ans && Number.isInteger(x)) c.add(x);
  return [...c].slice(0, n);
}

const replaceTokens = (s: string, toks: Tok[], map: Map<number, number>) => {
  let out = ''; let last = 0;
  toks.forEach((t, i) => { if (map.has(i)) { out += s.slice(last, t.start) + fmt(map.get(i)!); last = t.end; } });
  return out + s.slice(last);
};

export type VariantResult = { drafts: Draft[]; reason?: string };

/** Sinh tối đa n câu tương tự từ một câu Toán */
export function makeVariants(d: Draft, n: number, grade: number, lockedTok?: number[]): VariantResult {
  const p = planOf(d, new Set(lockedTok ?? autoLocked(d.prompt)));
  if (!p) return { drafts: [], reason: 'Câu chưa có phép tính trong đề hoặc lời giải dạng “6 x 5 = 30” để máy tính lại.' };
  const toks = tokens(d.prompt);
  const max = gradeMax(grade);
  const inMul = p.vars.map((_, i) => p.steps.some((s) => (s.op === '*' || s.op === '/') && ((s.a.k === 'v' && s.a.i === i) || (s.b.k === 'v' && s.b.i === i))));
  const orig = run(p, p.vars.map((v) => v.value));
  if (!orig) return { drafts: [], reason: 'Không tính lại được câu gốc.' };
  const ansOld = orig[p.final];
  const seen = new Set<string>([p.vars.map((v) => v.value).join(',')]);
  const out: Draft[] = [];
  for (let tries = 0; tries < 400 && out.length < n; tries++) {
    const vals = p.vars.map((v, i) => { const [lo, hi] = rangeOf(v.value, inMul[i]); return lo + Math.floor(Math.random() * (hi - lo + 1)); });
    const key = vals.join(',');
    if (seen.has(key)) continue;
    const res = run(p, vals);
    if (!res || res.some((x) => x > max) || vals.some((x) => x > max)) continue;
    const ans = res[p.final];
    if (ans === 0 && ansOld !== 0) continue;
    seen.add(key);
    // thay số trong đề
    const map = new Map<number, number>(); p.vars.forEach((v, i) => map.set(v.tok, vals[i]));
    const prompt = replaceTokens(d.prompt, toks, map);
    // lời giải: viết lại theo các bước mới
    const name = (r: Ref) => fmt(r.k === 'v' ? vals[r.i] : r.k === 's' ? res[r.i] : r.v);
    const sym: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': ':' };
    const explanation = d.explanation.trim() ? p.steps.map((s, i) => `${name(s.a)} ${sym[s.op]} ${name(s.b)} = ${fmt(res[i])}`).join('; ') : '';
    const nd: Draft = { ...d, id: draftId(), prompt, explanation, source: 'Câu tương tự', include: true, warn: undefined };
    if (d.type === 'single_choice' || d.type === 'multiple_choice') {
      const right = d.correct[0] ?? '';
      const unitOf = (o: string) => o.replace(new RegExp(N), '#');
      const unit = unitOf(right).includes('#') ? unitOf(right) : '#';
      const wrong = distractors(ans, Math.max(1, d.options.length - 1));
      const opts = [ans, ...wrong].map((v) => unit.replace('#', fmt(v)));
      for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      nd.type = 'single_choice'; nd.options = opts; nd.correct = [unit.replace('#', fmt(ans))];
    } else if (d.type === 'fill_blank') {
      const a0 = d.correct[0] ?? '';
      nd.correct = [/\d/.test(a0) ? a0.replace(new RegExp(N), fmt(ans)) : fmt(ans)];
    } else continue; // Đúng/Sai: không sinh tự động
    out.push(nd);
  }
  return { drafts: out, reason: out.length ? undefined : 'Không tìm được bộ số mới hợp lệ (kết quả âm, chia không hết hoặc vượt phạm vi lớp).' };
}
