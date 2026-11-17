// Kiểm tra ĐÚNG KIẾN THỨC (không chỉ đúng cấu trúc): tìm mọi phép tính / phép so sánh viết bằng số trong
//  - "Kiến thức cần nhớ" (ý chính, ví dụ, ghi chú), nhận xét, lời giải của bài soạn sẵn, ngân hàng, bộ sinh câu;
//  - đáp án đúng của câu chọn / điền (thế đáp án vào chỗ trống ? … ___ {} rồi tính lại);
//  - câu Đúng/Sai và bảng Đúng/Sai: phát biểu chấm "Đúng" thì phép tính trong đó phải đúng, chấm "Sai" mà mọi
//    phép tính đều đúng thì ghi cảnh báo để người soạn xem lại.
// Rồi tính lại bằng số hữu tỉ chính xác. Câu có chữ "sai", "nhầm", "không phải"… (cố ý nêu phép tính sai) được bỏ qua.
// Chạy: npm run check:knowledge   (thêm số đề sinh ngẫu nhiên mỗi bài: npm run check:knowledge -- 60)

import { CONTENT } from '../src/lib/content';
import { KNOWLEDGE } from '../src/lib/content/knowledge';
import { BANK } from '../src/lib/content/ngan-hang-lop1';
import { generatePractice, practiceLessons } from '../src/lib/practice';

const SEEDS = Number(process.argv[2] ?? 30);
const errors: string[] = [];
const warns: string[] = [];
const seen = new Set<string>();
const report = (list: string[], where: string, msg: string) => {
  const k = where.replace(/ seed \d+/, '') + '|' + msg;
  if (seen.has(k)) return;
  seen.add(k);
  list.push(`${where}: ${msg}`);
};

// ---------- Số hữu tỉ chính xác (BigInt) ----------
const B0 = BigInt(0), B1 = BigInt(1), B10 = BigInt(10), B100 = BigInt(100);
type R = { n: bigint; d: bigint };
const bgcd = (a: bigint, b: bigint): bigint => { a = a < B0 ? -a : a; b = b < B0 ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const mk = (n: bigint, d: bigint): R => { if (d === B0) throw new Error('chia 0'); if (d < B0) { n = -n; d = -d; } const g = bgcd(n, d) || B1; return { n: n / g, d: d / g }; };
const add = (a: R, b: R) => mk(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: R, b: R) => mk(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: R, b: R) => mk(a.n * b.n, a.d * b.d);
const div = (a: R, b: R) => mk(a.n * b.d, a.d * b.n);
const cmp = (a: R, b: R) => { const x = a.n * b.d - b.n * a.d; return x < B0 ? -1 : x > B0 ? 1 : 0; };
const show = (a: R) => (a.d === B1 ? `${a.n}` : `${a.n}/${a.d}`);
function parseNum(s: string): R {
  // Cách viết Việt Nam: 1 000 hoặc 1.000 (phân cách hàng nghìn), 2,5 (dấu phẩy thập phân)
  const t = s.replace(/[ .\u00a0\u202f\u2009]/g, '');
  const [i, f = ''] = t.split(',');
  return mk(BigInt(i + f), B10 ** BigInt(f.length));
}

// ---------- Tách token ----------
type Tok = { t: 'num'; v: R; raw: string; pct?: boolean } | { t: 'op'; v: string } | { t: 'rel'; v: string } | { t: '(' } | { t: ')' } | { t: 'unit'; v: string } | { t: 'du' } | { t: 'brk'; letter?: boolean };
const UNITS = ['mm', 'cm', 'dm', 'km', 'm', 'kg', 'g', 'yến', 'tạ', 'tấn', 'ml', 'l', 'giờ', 'phút', 'giây', 'ngày', 'tuần', 'tháng', 'năm', 'đồng', 'cm²', 'dm²', 'm²', 'km²', 'ha', 'cm³', 'dm³', 'm³'];
// dấu cách nhóm nghìn: cách thường, cách không ngắt, cách hẹp (U+202F) hoặc dấu chấm
const NUM_RE = /^(?:\d{1,3}(?:[ .\u00a0\u202f\u2009]\d{3})+(?![\d])|\d+)(?:,\d+(?![\d]))?/;
const WORD_RE = /^[\p{L}²³]+/u;

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const rest = s.slice(i);
    if (/[\s\u00a0\u202f\u2009]/.test(c)) { i++; continue; }
    const m = NUM_RE.exec(rest);
    if (m && /\d/.test(c)) {
      // "1 000" chỉ là một số khi sau nhóm 3 chữ số không còn chữ số; "3 + 2 = 5 000" vẫn đọc 5 000
      const v = parseNum(m[0]); i += m[0].length;
      const pm = /^\s?%/.exec(s.slice(i));
      if (pm) i += pm[0].length; // 36% — đọc theo hai cách (36 hoặc 36/100), xem relations()
      out.push({ t: 'num', v, raw: m[0] + (pm ? '%' : ''), pct: !!pm }); continue;
    }
    if ('+−-–'.includes(c)) { out.push({ t: 'op', v: c === '+' ? '+' : '-' }); i++; continue; }
    if ('×*'.includes(c)) { out.push({ t: 'op', v: '×' }); i++; continue; }
    if (c === '÷' || c === '/') { out.push({ t: 'op', v: c === '/' ? '/' : ':' }); i++; continue; }
    if (c === ':') {
      // "8 : 2" hoặc "8:2" là phép chia; "Bài 3: …" (dính trước, cách sau) là dấu hai chấm thường
      const before = s[i - 1], after = s[i + 1];
      const isOp = (before === ' ' && after === ' ') || (/\d/.test(before ?? '') && /\d/.test(after ?? ''));
      out.push(isOp ? { t: 'op', v: ':' } : { t: 'brk' }); i++; continue;
    }
    if (c === '=' && s[i + 1] !== '>') { out.push({ t: 'rel', v: '=' }); i++; continue; }
    if ((c === '<' || c === '>') && s[i + 1] !== '=' && s[i - 1] !== '=' && s[i + 1] !== '-' && s[i - 1] !== '-') { out.push({ t: 'rel', v: c }); i++; continue; }
    if (c === '≤' || c === '≥') { out.push({ t: 'rel', v: c }); i++; continue; }
    if (c === '(') { out.push({ t: '(' }); i++; continue; }
    if (c === ')') { out.push({ t: ')' }); i++; continue; }
    const w = WORD_RE.exec(rest);
    if (w) {
      const word = w[0];
      if (word === 'x' || word === 'X') out.push({ t: 'op', v: '×' });
      else if (UNITS.includes(word)) out.push({ t: 'unit', v: word });
      else if (word === 'dư') out.push({ t: 'du' });
      else if (word === 'và' && out[out.length - 1]?.t === 'num') { /* hỗn số đọc "8 và 3/6" */ }
      else out.push({ t: 'brk', letter: true });
      i += word.length; continue;
    }
    out.push({ t: 'brk' }); i++;
  }
  return out;
}

// ---------- Phân tích biểu thức (×, :, / ưu tiên hơn +, −) ----------
function evalExpr(toks: Tok[]): R | null {
  let p = 0;
  const atom = (): R | null => {
    const t = toks[p];
    if (!t) return null;
    if (t.t === 'num') {
      p++;
      // phân số a/b gắn chặt hơn × và : (2/3 : 4/5)
      const sl = toks[p], dn = toks[p + 1];
      if (sl?.t === 'op' && sl.v === '/' && dn?.t === 'num' && dn.v.n !== B0) { p += 2; return div(t.v, dn.v); }
      // hỗn số: 8 3/6 (số nguyên đứng liền một phân số)
      const a2 = toks[p], s2 = toks[p + 1], b2 = toks[p + 2];
      if (a2?.t === 'num' && s2?.t === 'op' && s2.v === '/' && b2?.t === 'num' && b2.v.n !== B0) { p += 3; return add(t.v, div(a2.v, b2.v)); }
      return t.v;
    }
    if (t.t === '(') { p++; const v = sum(); if (toks[p]?.t !== ')') return null; p++; return v; }
    return null;
  };
  const prod = (): R | null => {
    let v = atom();
    while (v && toks[p]?.t === 'op' && ['×', ':', '/'].includes((toks[p] as { v: string }).v)) {
      const op = (toks[p] as { v: string }).v; p++;
      const b = atom(); if (!b) return null;
      if (op !== '×' && b.n === B0) return null;
      v = op === '×' ? mul(v, b) : div(v, b);
    }
    return v;
  };
  const sum = (): R | null => {
    let v = prod();
    while (v && toks[p]?.t === 'op' && ['+', '-'].includes((toks[p] as { v: string }).v)) {
      const op = (toks[p] as { v: string }).v; p++;
      const b = prod(); if (!b) return null;
      v = op === '+' ? add(v, b) : sub(v, b);
    }
    return v;
  };
  const v = sum();
  return v && p === toks.length ? v : null;
}

type Rel = { text: string; ok: boolean; detail: string };
/** Tìm các chuỗi quan hệ (a = b, a > b …) trong một đoạn chữ, tính lại từng chuỗi. */
function relations(text: string): Rel[] {
  const toks = tokenize(text);
  const runs: Tok[][] = [];
  let cur: Tok[] = [];
  const afterLetter: boolean[] = [false];
  for (const t of toks) { if (t.t === 'brk') { runs.push(cur); cur = []; afterLetter.push(!!t.letter); } else cur.push(t); }
  runs.push(cur);
  const out: Rel[] = [];
  for (let ri = 0; ri < runs.length; ri++) {
    let run = runs[ri];
    if (!run.some((t) => t.t === 'rel')) continue;
    // đứng sau một chữ (biến a, x…: "20 + a × 3 = …"): phần còn lại không phải phép tính trọn vẹn
    if (ri > 0 && run[0]?.t === 'op') continue; // "… + 2/(25 × 27) = …": chỉ là đoạn cuối của tổng
    // hai đoạn liền nhau không có chữ ngăn ("5 + a" cắt): phía sau nối tiếp bằng dấu phép tính → bỏ
    if (run[run.length - 1]?.t === 'op' && ri + 1 < runs.length && afterLetter[ri + 1]) continue;
    // phép chia có dư: "30 : 9 = 3 dư 3"
    const du = run.findIndex((t) => t.t === 'du');
    if (du >= 0) {
      const eq = run.findIndex((t) => t.t === 'rel');
      const a = evalExpr(run.slice(0, eq)), q = evalExpr(run.slice(eq + 1, du)), r = evalExpr(run.slice(du + 1));
      const lhs = run.slice(0, eq);
      const colon = lhs.findIndex((t) => t.t === 'op' && t.v === ':');
      if (a && q && r && colon > 0) {
        const n = evalExpr(lhs.slice(0, colon)), d = evalExpr(lhs.slice(colon + 1));
        if (n && d) {
          const ok = cmp(add(mul(q, d), r), n) === 0 && cmp(r, d) < 0;
          out.push({ text: `${show(n)} : ${show(d)} = ${show(q)} dư ${show(r)}`, ok, detail: ok ? '' : `${show(q)} × ${show(d)} + ${show(r)} = ${show(add(mul(q, d), r))}${cmp(r, d) < 0 ? '' : ', số dư phải bé hơn số chia'}` });
        }
      }
      continue;
    }
    const units = new Set(run.filter((t) => t.t === 'unit').map((t) => (t as { v: string }).v));
    if (units.size > 1) continue; // đổi đơn vị (1 m = 100 cm), hỗn số đơn vị: bỏ qua
    run = run.filter((t) => t.t !== 'unit');
    while (run[0]?.t === 'op') run = run.slice(1);
    while (run.length && run[run.length - 1].t === 'op') run = run.slice(0, -1);
    // tách theo dấu quan hệ
    const segs: Tok[][] = [[]];
    const rels: string[] = [];
    for (const t of run) { if (t.t === 'rel') { rels.push(t.v); segs.push([]); } else segs[segs.length - 1].push(t); }
    // bỏ đoạn đầu/cuối không phải biểu thức (vd. chữ số thừa đứng trước)
    // % đọc hai cách: như đơn vị (100 − 40 = 60%) hoặc phần trăm (0,36 = 36%); chấp nhận nếu một cách đúng
    const hasPct = run.some((t) => t.t === 'num' && t.pct);
    const asPct = (seg: Tok[]) => seg.map((t) => (t.t === 'num' && t.pct ? { ...t, v: div(t.v, mk(B100, B1)) } : t));
    const tryVals = [segs.map(evalExpr), ...(hasPct ? [segs.map((g) => evalExpr(asPct(g)))] : [])];
    const holds = (vs: (R | null)[]) => rels.every((r, i) => {
      const c = cmp(vs[i]!, vs[i + 1]!);
      return r === '=' ? c === 0 : r === '<' ? c < 0 : r === '>' ? c > 0 : r === '≤' ? c <= 0 : c >= 0;
    });
    const valid = tryVals.filter((vs) => vs.every((v) => v !== null));
    if (!valid.length || segs.length < 2) continue;
    const vals = valid.find(holds) ?? valid[0];
    const hasOp = hasPct || run.some((t) => t.t === 'op') || rels.some((r) => r !== '=');
    if (!hasOp) continue; // "5 = 5" hay số đứng riêng: không có gì để kiểm
    const raw = run.map((t) => (t.t === 'num' ? t.raw : t.t === 'op' || t.t === 'rel' ? ` ${t.v} ` : t.t)).join('').replace(/\s+/g, ' ').trim();
    let ok = true;
    let detail = '';
    rels.forEach((r, i) => {
      const c = cmp(vals[i]!, vals[i + 1]!);
      const good = r === '=' ? c === 0 : r === '<' ? c < 0 : r === '>' ? c > 0 : r === '≤' ? c <= 0 : c >= 0;
      if (!good) { ok = false; detail = `${show(vals[i]!)} ${r} ${show(vals[i + 1]!)} là sai`; }
    });
    out.push({ text: raw, ok, detail });
  }
  return out;
}

const NEGATED = /\b(sai|nhầm|không phải|không đúng|chưa đúng|chưa đúng|bẫy|lỗi|≠|vô lí|vô lý)\b|≠/iu;
/** Phát biểu luôn phải đúng (kiến thức, nhận xét, lời giải, đáp án đúng). */
function mustBeTrue(where: string, text: string | undefined) {
  if (!text) return;
  for (const clause of text.split(/\n|;|(?<=[.!?])\s+(?=\p{Lu})/u)) {
    if (NEGATED.test(clause)) continue;
    for (const r of relations(clause)) if (!r.ok) report(errors, where, `"${r.text}" — ${r.detail}  ⟵ «${clause.trim().slice(0, 140)}»`);
  }
}

const PH = /\?|…|\.\.\.+|_{2,}|□|\{\}/g;
/** Thế đáp án vào chỗ trống (một chỗ) rồi kiểm phép tính. */
function substituted(where: string, prompt: string, answer: string) {
  const holes = prompt.match(PH) ?? [];
  if (holes.length !== 1 || !/^[\d\s.,/<>=+\-−×:]+$/.test(answer.trim())) return;
  const filled = prompt.replace(PH, ` ${answer.trim()} `);
  for (const clause of filled.split(/\n|;|(?<=[.!?])\s+(?=\p{Lu})/u)) {
    if (!clause.includes(answer.trim())) continue;
    for (const r of relations(clause)) if (!r.ok) report(errors, where, `thế đáp án "${answer}" vào đề: "${r.text}" — ${r.detail}`);
  }
}

type Q = {
  type: string; prompt: string; options: string[]; key: unknown; explanation: string; solution?: string;
  blanks?: string[]; statements?: string[];
};
let checked = 0;
function checkQ(where: string, q: Q) {
  checked++;
  const k = q.key as Record<string, unknown>;
  mustBeTrue(`${where} [nhận xét]`, q.explanation);
  mustBeTrue(`${where} [lời giải]`, q.solution);
  if ((q.type === 'single_choice' || q.type === 'fill_blank') && !/sai\b/i.test(q.prompt)) {
    const ans = q.type === 'single_choice' ? String(k.correct) : ((k.accepted as string[]) ?? [])[0] ?? '';
    // đáp án tự nó là một phép tính / so sánh ("7 > 5") thì phải đúng — trừ câu hỏi "phép tính nào SAI"
    mustBeTrue(`${where} [đáp án]`, ans);
    substituted(`${where} [đáp án]`, q.prompt, ans);
  }
  if (q.type === 'multiple_choice' && !/sai\b/i.test(q.prompt)) for (const c of (k.correct as string[]) ?? []) mustBeTrue(`${where} [đáp án]`, c);
  if (q.type === 'fill_blanks' && q.blanks) {
    const ans = ((k.answers as string[][]) ?? [])[0] ?? [];
    let j = 0;
    for (const b of q.blanks) {
      const filled = b.replace(/\{\}/g, () => ` ${ans[j++] ?? ''} `);
      if (!/sai\b/i.test(q.prompt)) for (const r of relations(filled)) if (!r.ok) report(errors, `${where} [điền]`, `"${r.text}" — ${r.detail}`);
    }
  }
  // nhận xét nói "đáp án là X" / "chọn X" thì X phải là đáp án đúng (mọi môn)
  if (q.type === 'single_choice') {
    const norm = (x: string) => x.normalize('NFC').toLowerCase().replace(/[“”"'‘’.«»]/g, '').trim();
    const said = /(?:đáp án(?: đúng)?(?: là|:)|chọn(?: đáp án)?|the answer is)\s*[“"'‘]?([^”"'’.,;:!?()\n]{1,60})/giu;
    const correct = norm(String(k.correct));
    for (const m of (q.explanation + ' ' + (q.solution ?? '')).matchAll(said)) {
      const x = norm(m[1]);
      const other = q.options.find((o) => norm(o) !== correct && norm(o) === x);
      if (other) report(errors, `${where} [nhận xét]`, `nhận xét chỉ "${other}" nhưng đáp án đúng là "${k.correct}"`);
    }
  }
  // cấu trúc: số ô trống khớp số đáp án; xếp hộp có ít nhất hai hộp được dùng
  if (q.type === 'fill_blanks' && q.blanks) {
    const holes = q.blanks.join(' ').match(/\{\}/g)?.length ?? 0;
    const ans = (k.answers as string[][]) ?? [];
    if (!ans.length || ans.some((a) => a.length !== holes || a.some((x) => !String(x).trim()))) report(errors, `${where} [cấu trúc]`, `${holes} ô trống nhưng đáp án có ${ans.map((a) => a.length).join('/')} giá trị`);
  }
  if (q.type === 'true_false_table' && (q.statements?.length ?? 0) !== ((k.truth as string[]) ?? []).length) report(errors, `${where} [cấu trúc]`, 'số ý Đúng/Sai không khớp đáp án');
  if (q.type === 'grouping') {
    const vals = Object.values((k.pairs as Record<string, string>) ?? {});
    if (vals.some((v) => !q.options.includes(v))) report(errors, `${where} [cấu trúc]`, 'xếp vào hộp không có');
  }
  const tf = (stmt: string, truth: string, at: string) => {
    const rs = relations(stmt);
    if (!rs.length) return;
    if (truth === 'Đúng' && rs.some((r) => !r.ok)) report(errors, at, `chấm "Đúng" nhưng "${rs.find((r) => !r.ok)!.text}" sai — ${rs.find((r) => !r.ok)!.detail}`);
    // phát biểu chỉ gồm phép tính mà đều đúng, lại chấm "Sai"
    const bare = stmt.replace(/[\d\s.,+\-−–×x:÷/=<>≤≥()]/g, '');
    if (truth === 'Sai' && rs.every((r) => r.ok) && bare.length < 3) report(errors, at, `chấm "Sai" nhưng "${rs[0].text}" đúng`);
  };
  if (q.type === 'true_false') tf(q.prompt.replace(/^.*?:\s*(?=[\d(])/, ''), String(k.correct), `${where} [đúng/sai]`);
  if (q.type === 'true_false_table' && q.statements) q.statements.forEach((s, i) => tf(s, ((k.truth as string[]) ?? [])[i], `${where} [bảng Đ/S ý ${i + 1}]`));
}

// 0) Tự kiểm: bộ kiểm tra phải bắt được lỗi cố ý cài vào và không báo nhầm câu đúng
{
  const bad = ['7 + 5 = 13', '19,85 × 0,001 = 0,0199', '2/3 : 4/5 = 8/15', '30 : 9 = 3 dư 4', '1 213 × 3 = 3 649', '9 068 > 9 968', '0,36 = 3,6%'];
  const good = ['7 + 5 = 12', '19,85 × 0,001 = 0,01985', '2/3 : 4/5 = 2/3 × 5/4 = 10/12 = 5/6', '30 : 9 = 3 dư 3', '1 213 × 3 = 3 639   ·   1 825 × 4 = 7 300',
    '9 068 < 9 968', '9 : 25 = 0,36 = 36%', '100 − 40 − 20 − 10 = 30%', '51/6 = 8 và 3/6', 'Bài 3: 5 + 2 = 7', 'Với a = 5, ta có 20 + a × 3 = 20 + 5 × 3 = 35', '1 kg = 1 000 g', '(60 + 5) × 4 = 260'];
  for (const b of bad) if (!relations(b).some((r) => !r.ok)) errors.push(`[tự kiểm] không bắt được lỗi trong "${b}"`);
  for (const g of good) { const r = relations(g).find((x) => !x.ok); if (r) errors.push(`[tự kiểm] báo nhầm "${g}": ${r.detail}`); }
}

// 1) Kiến thức cần nhớ
for (const [id, kn] of Object.entries(KNOWLEDGE)) {
  kn.points.forEach((p, i) => mustBeTrue(`${id} [kiến thức ý ${i + 1}]`, p));
  mustBeTrue(`${id} [kiến thức ví dụ]`, kn.example);
  mustBeTrue(`${id} [kiến thức ghi chú]`, kn.note);
}
// 2) Bài soạn sẵn
for (const l of CONTENT) l.questions.forEach((q, i) => checkQ(`${l.id} #${i + 1}`, q as Q));
// 3) Ngân hàng lớp 1
for (const b of BANK) checkQ(b.id, b.q as Q);
// 4) Bộ sinh câu luyện tập (mẫu ngẫu nhiên)
for (const l of practiceLessons()) for (let s = 1; s <= SEEDS; s++) for (const q of generatePractice(l.id, s)) checkQ(`${l.id} seed ${s}`, q as Q);

console.log(`Đã kiểm ${Object.keys(KNOWLEDGE).length} bài kiến thức, ${checked} câu hỏi (soạn sẵn + ngân hàng + ${SEEDS} đề sinh mỗi bài).`);
warns.forEach((w) => console.log('! ' + w));
if (errors.length) {
  errors.slice(0, 200).forEach((e) => console.log('✗ ' + e));
  console.log(`\n${errors.length} lỗi kiến thức`);
  process.exit(1);
}
console.log('✓ Mọi phép tính, phép so sánh trong kiến thức, đáp án, nhận xét, lời giải đều đúng.');
