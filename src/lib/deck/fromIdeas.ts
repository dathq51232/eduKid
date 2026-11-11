// Tạo bài trình chiếu cho một tiết từ: nội dung bài học (ngân hàng nội dung của app) + các gợi ý thầy cô đã chọn.
// Mỗi hoạt động (Khởi động → Vận dụng): trang chia hoạt động (mốc phút) → trang hướng dẫn hoạt động đã chọn
// → (hoạt động thi đua: bảng thi đua tổ) → các trang nội dung bài học của đúng hoạt động đó.
// Trang hướng dẫn gắn công cụ cho màn hình của cô (Slide.tool): hẹn giờ thảo luận / gọi tên.
import { emptyDeck, uid, type Deck, type El, type SceneKind, type Slide } from './types';
import { MASCOTS, bareScene, actCtx, activityPages, badgeEl, boardEls, boardPage, buildPlan, dividerSlide, planSlides, tietOf, type ActCtx, type ActivitySpec, type PhaseId } from './fromLesson';
import { planOf, type LessonIdea, type Pick } from '@/lib/plans/idea-bank';
import { F3D_VI, f3dSrc } from './f3d-catalog';
import { pickScene } from './scenes';
import { shrinkToFit } from './fit';
import { otherWords, vansIn, wordsOf } from '@/lib/plans/van-bank';
import type { ContentLesson } from '@/lib/content/types';

const PER_PHASE: Record<string, number> = { kd: 2, kp: 3, lt: 4, vd: 2 };
/** trò Toán có sẵn cách sinh phép tính theo đúng hình thức trò (dùng specsOf) — chỉ cho số trong phạm vi 10 của lớp 1 */
const MATH_GAME = /ngón tay|xe buýt|domino|tia số|tìm bạn|đi chợ|bingo|vẽ tranh|xếp hàng|so sánh|đếm/;
const text = (x: number, y: number, w: number, h: number, t: string, size: number, color: string, o: Record<string, unknown> = {}): El =>
  ({ id: uid(), kind: 'text', x, y, w, h, rot: 0, text: t, size: shrinkToFit(t, w, h, size, !!o.bg, 28), color, font: 'baloo', align: 'center', bg: '', ...o } as El);

const norm = (t: string) => t.toLowerCase().replace(/\s*-\s*ti[eế]t\s*\d+.*$/i, '').replace(/\s+/g, ' ').trim();
const subjCode = (s: string) => (/to[aá]n/i.test(s) ? 'toan' : /vi[eệ]t/i.test(s) ? 'tieng-viet' : /anh/i.test(s) ? 'tieng-anh' : '');

/** Hoạt động cần công cụ gì trên lớp */
function toolsOf(x: LessonIdea) {
  const all = `${x.t} ${x.d} ${x.s.join(' ')}`;
  return {
    teams: /thi|đội|tiếp sức|bingo|thắng|rung chuông|cộng sao/i.test(all),
    timer: x.g || /thảo luận|đếm ngược|phút/i.test(all) ? Math.max(1, Math.round(x.m)) : 0,
    name: /mời|gọi|lên bảng|trình bày|chia sẻ|đóng vai/i.test(all),
  };
}

// ===== Trang cho HỌC SINH theo từng ý tưởng (hướng dẫn của cô nằm trong ghi chú) =====
type Spec = { q: string; big?: string; cards?: string[]; reveal?: string; group?: [number, number, string]; words?: boolean;
  /** trắc nghiệm bấm chọn */ quiz?: { opts: string[]; a: number };
  /** sắp xếp (đúng thứ tự) */ sort?: string[];
  /** kéo thả: ô nhận (chỉ số vật đúng) + vật kéo được (hình 3D hoặc chữ) */ drop?: { zones: { label: string; ok: number[] }[]; items: { pic?: string; text?: string }[] } };

// emoji → hình 3D có sẵn (public/emoji/f3d)
const EMO: Record<string, string> = { '🚌': 'bus', '🧒': 'boy', '🎁': 'wrapped-gift', '🎡': 'ferris-wheel', '🎣': 'fish', '🔍': 'eyes', '🎤': 'microphone', '🎭': 'performing-arts',
  '🖼️': 'framed-picture', '🚪': 'door', '🪑': 'chair', '🔥': 'fire', '🌳': 'deciduous-tree', '🏠': 'house', '👀': 'eyes', '🙋': 'raised-hand', '🎵': 'musical-notes', '💬': 'speech-balloon',
  '🗣️': 'speaking-head', '❓': 'red-question-mark', '😊': 'grinning-face-with-smiling-eyes', '😐': 'slightly-smiling-face', '😢': 'sleeping-face', '🖐️': 'raised-hand', '⭐': 'star', '🃏': 'books',
  '✊': 'waving-hand', '➜': 'right-arrow', '🍎': 'red-apple', '🍌': 'banana', '🎈': 'balloon', '🧸': 'teddy-bear', '✏️': 'pencil' };
const COUNT_OBJ = ['red-apple', 'duck', 'balloon', 'star', 'butterfly', 'tangerine', 'baby-chick', 'blossom'];

// bỏ dấu thanh (giữ â ă ê ô ơ ư) để so vần: "chổi" → "chôi"
const noTone = (t: string) => t.normalize('NFD').replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC').toLowerCase();
/** hình 3D có tên tiếng Việt chứa tiếng mang vần đó (VD "oi" → voi, "ôi" → chổi) */
function picWords(v: string): { pic: string; word: string }[] {
  const nv = noTone(v); const out: { pic: string; word: string }[] = [];
  for (const [pic, vi] of Object.entries(F3D_VI)) {
    const w = vi.split(' ').find((x) => noTone(x).endsWith(nv) && noTone(x) !== nv && /^[^aăâeêioôơuưy]+$/.test(noTone(x).slice(0, -nv.length)));
    if (w) out.push({ pic, word: w });
    if (out.length >= 3) break;
  }
  return out;
}
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

function specsOf(x: LessonIdea, topic: string, math: boolean, minus: boolean, r: () => number, max = 10, vans: string[] = []): Spec[] {
  const T = x.t.toLowerCase();
  const toks = topic.replace(/[“”"]/g, '').split(/[\s,]+/).filter((t) => t && t.length <= 6).slice(0, 6);
  const big = toks.length ? toks.join('   ') : topic;
  const pair = () => { if (minus) { const a = 2 + Math.floor(r() * (max - 1)); return [a, 1 + Math.floor(r() * (a - 1))] as const; } const a = 1 + Math.floor(r() * (max - 2)); return [a, 1 + Math.floor(r() * (max - a))] as const; };
  const op = minus ? '–' : '+', calc = (a: number, b: number) => (minus ? a - b : a + b);
  const many = <V>(n: number, f: () => V): V[] => Array.from({ length: n }, f);
  const shuffle = <V>(a: V[]) => a.map((v) => [r(), v] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const opts4 = (ans: number) => { const o = shuffle([...new Set([ans, ans + 1, Math.max(0, ans - 1), ans + 2])].slice(0, 4)); return { opts: o.map(String), a: o.indexOf(ans) }; };
  if (math) {
    if (/ngón tay/.test(T)) return many(3, () => { const [a, b] = pair(); return { q: 'Cô giơ mấy ngón tay? Nói phép tính!', big: `${'☝️'.repeat(a)}   ${op}   ${'☝️'.repeat(b)}`, reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/xe buýt/.test(T)) return many(2, () => { const [a, b] = pair(); const n = minus ? a : a + b; return { q: minus ? `Có ${a} bạn. ${b} bạn xuống xe. Kéo các bạn còn lại lên xe!` : `Có ${a} bạn, thêm ${b} bạn nữa. Kéo tất cả lên xe buýt!`, drop: { zones: [{ label: '🚌 Xe buýt', ok: Array.from({ length: minus ? a - b : n }, (_, i) => i) }], items: Array.from({ length: n }, (_, i) => ({ pic: i % 2 ? 'girl' : 'boy' })) }, reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/domino/.test(T)) return many(2, () => { const [a, b] = pair(); return { q: 'Đếm hai bên. Viết phép tính!', group: [a, b, 'red-circle'], reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/tia số/.test(T)) return many(2, () => { const [a, b] = pair(); return { q: `Đứng ở số ${a}, nhảy ${minus ? 'lùi' : 'thêm'} ${b} bước. Đến số mấy?`, cards: Array.from({ length: 11 }, (_, i) => String(i)), reveal: `${a} ${op} ${b} = ${calc(a, b)}` }; });
    if (/tìm bạn/.test(T)) return [{ q: 'Tìm bạn để hai số cộng lại bằng 10!', cards: ['1', '9', '3', '7', '4', '6', '2', '8', '5'], reveal: '1 + 9 · 3 + 7 · 4 + 6 · 2 + 8 · 5 + 5' }];
    if (/đi chợ/.test(T)) return [{ q: 'Kéo 2 món con muốn mua vào giỏ. Con phải trả bao nhiêu hạt?', drop: { zones: [{ label: '🧺 Giỏ của con', ok: [0, 1, 2, 3, 4] }], items: [{ text: '🍎 2 hạt' }, { text: '🍌 3 hạt' }, { text: '🎈 4 hạt' }, { text: '🧸 5 hạt' }, { text: '✏️ 1 hạt' }] }, reveal: 'VD: 🍎 + 🎈 → 2 + 4 = 6 hạt' }];
    if (/bingo/.test(T)) { const ps = many(6, () => { const [a, b] = pair(); return `${a} ${op} ${b}`; }); return [{ q: 'BINGO! Khoanh kết quả trên phiếu của con', cards: ps.map((p) => `${p} = ?`), reveal: ps.map((p) => { const [a, , b] = p.split(' '); return `${p} = ${calc(+a, +b)}`; }).join(' · ') }]; }
    if (/vẽ tranh/.test(T)) { const [a, b] = pair(); return [{ q: 'Vẽ tranh cho phép tính này rồi đố bạn bên cạnh!', big: `${a} ${op} ${b} = ?`, group: [a, b, 'blossom'], reveal: `${calc(a, b)}` }]; }
    if (/xếp hàng|so sánh/.test(T)) return many(2, () => { const ns = shuffle([...Array(11).keys()]).slice(0, 5).sort((x, y) => x - y); return { q: 'Xếp các số từ bé đến lớn!', sort: ns.map(String) }; });
    if (/rung chuông/.test(T)) return many(4, () => { const [a, b] = pair(); return { q: `🔔 ${a} ${op} ${b} = ?`, quiz: opts4(calc(a, b)) }; });
    if (/đếm/.test(T)) return [{ q: 'Đếm theo nhịp vỗ tay 👏 — nhanh dần!', big: '1  2  3  4  5  6  7  8  9  10' }];
    if (/bắn tên|rung chuông|bảng con|tiếp sức|ai nhanh|truyền/.test(T)) return many(4, () => { const [a, b] = pair(); return { q: /rung/.test(T) ? 'Rung chuông vàng! Ghi đáp án lên bảng con' : 'Ai nhanh nhất?', big: `${a} ${op} ${b} = ?`, group: r() < 0.5 ? [a, b, COUNT_OBJ[Math.floor(r() * COUNT_OBJ.length)]] : undefined, reveal: `${calc(a, b)}` }; });
  }
  const ws = vans.length ? vans.flatMap((v) => wordsOf(v).slice(0, 3)) : toks.flatMap((v) => picWords(v).map((w) => ({ ...w, v })));
  if (/câu cá|thám tử|săn chữ/.test(T) && ws.length) {
    const vs = [...new Set(ws.map((w) => w.v))].slice(0, 3), mine = ws.filter((w) => vs.includes(w.v)).slice(0, 6);
    const items = shuffle([...mine.map((w) => ({ pic: w.pic, text: w.pic ? undefined : w.word, v: w.v })), ...otherWords(vs, 2, r).map((t) => ({ pic: undefined, text: t, v: '' }))]);
    return [{ q: `Kéo từ có vần ${vs.join(', ')} vào đúng giỏ!`, drop: { zones: vs.map((v) => ({ label: `🧺 ${v}`, ok: items.map((x, i) => (x.v === v ? i : -1)).filter((i) => i >= 0) })), items: items.map((x) => ({ pic: x.pic, text: x.text })) } }];
  }
  if (/rung chuông|ai nhanh/.test(T) && ws.length) return ws.slice(0, 3).map((w) => { const o = shuffle([w.word, ...otherWords(toks, 3, r)]); return { q: `🔔 Tiếng nào có vần “${w.v}”?`, quiz: { opts: o, a: o.indexOf(w.word) } }; });
  if (/nên hay/.test(T)) return [['Bạn mới chuyển đến, con chào và rủ bạn chơi cùng.', 0], ['Giành đồ chơi của bạn.', 1], ['Bạn bị ngã, con đỡ bạn dậy.', 0], ['Trêu chọc khi bạn trả lời sai.', 1]].map(([q, a]) => ({ q: 'Nên hay không nên?', quiz: { opts: ['😊 Nên', '😢 Không nên'], a: a as number }, cards: [q as string] }));
  if (/sắp xếp tranh|kể nối tiếp/.test(T)) return [{ q: 'Sắp xếp các phần của câu chuyện cho đúng thứ tự!', sort: ['🌅 Mở đầu: giới thiệu nhân vật', '⚡ Diễn biến: chuyện gì xảy ra', '🏁 Kết thúc: câu chuyện kết thúc ra sao'] }];
  if (/hộp|truyền|vòng quay/.test(T)) return [{ q: `Đọc một tiếng có: ${toks.join(', ') || topic}`, big: /vòng/.test(T) ? '🎡' : '🎁', cards: toks }, ...(ws.length ? [{ q: 'Đọc to các từ này!', cards: ws.slice(0, 5).map((w) => w.word) }] : []), ...(toks.length ? [{ q: 'Hình gì đây? Tiếng nào có vần của bài?', words: true }] : [])];
  if (/đọc to|đèn giao thông/.test(T)) return [{ q: /đèn/.test(T) ? '🟢 nhanh · 🟡 chậm · 🔴 im lặng' : 'Đọc theo tay cô: to – vừa – thì thầm', big }];
  if (/viết/.test(T)) return [{ q: 'Viết theo cô trên không ✍️', big }, ...(ws.length ? [{ q: 'Viết bảng con các từ:', big: ws.slice(0, 3).map((w) => w.word).join('   ') }] : [])];
  if (/thám tử|săn|câu cá|tìm/.test(T)) return [{ q: `Tìm ${toks.length ? `tiếng có ${toks.join(', ')}` : 'những đồ vật đúng với bài học'}!`, big: /câu cá/.test(T) ? '🎣' : '🔍', cards: toks, words: !!toks.length }];
  if (/bánh xe|ghép/.test(T)) return [{ q: 'Ghép âm đầu với vần — đọc tiếng mới!', big: '🎡', cards: toks }];
  if (/ô chữ/.test(T)) return [{ q: 'Giải ô chữ — tìm từ khoá!', cards: ['1', '2', '3', '4', '5'] }];
  if (/đoán nhân vật/.test(T)) return [{ q: 'Cô đang là nhân vật nào?', big: '🗣️ ❓' }];
  if (/phóng viên/.test(T)) return [{ q: 'Ai? · Ở đâu? · Làm gì?', big: '🎤' }];
  if (/đóng vai|nói theo tranh/.test(T)) return [{ q: 'Đóng vai và nói 1–2 câu với bạn', big: '🎭' }];
  if (/tranh|kể|rối/.test(T)) return [{ q: 'Chuyện gì xảy ra tiếp theo?', big: '🖼️ ➜ ❓' }];
  if (/đọc/.test(T)) return [{ q: 'Đọc nối tiếp theo dãy 📖', cards: ws.length ? ws.slice(0, 6).map((w) => w.word) : undefined, big: ws.length ? undefined : big }];
  if (/gõ cửa/.test(T)) return [{ q: 'Chào bạn! Bạn tên là gì? Bạn thích gì?', big: '🚪 ✊' }];
  if (/nên hay/.test(T)) return [{ q: 'Bạn làm vậy là nên hay không nên?', big: '😊   😢' }];
  if (/bàn tay/.test(T)) return [{ q: 'Mỗi ngón tay — một việc làm tốt', big: '🖐️' }];
  if (/ghế nóng/.test(T)) return [{ q: 'Nói một điều tốt về bạn!', big: '🪑 🔥' }];
  if (/cây/.test(T)) return [{ q: 'Con sẽ làm gì sau bài học hôm nay?', big: '🌳' }];
  if (/thẻ ra về/.test(T)) return [{ q: 'Hôm nay con hiểu bài thế nào?', big: '😊   😐   😢' }];
  if (/simon/.test(T)) return [{ q: 'Simon says…', big: '🙋' }];
  if (/flashcard/.test(T)) return [{ q: 'Read aloud!', big: '🃏' }];
  if (/chant/.test(T)) return [{ q: 'Clap and chant! 👏', big: '🎵' }];
  if (/hỏi – đáp/.test(T)) return [{ q: 'Ask and answer with your friend', big: '💬' }];
  if (/bố mẹ|thử thách/.test(T)) return [{ q: 'Nhiệm vụ về nhà', big: '🏠' }];
  if (/quan sát/.test(T)) return [{ q: 'Quan sát và nói điều con thấy', big: '👀' }];
  return [{ q: x.t, big: '⭐' }];
}

const img0 = (src: string, x: number, y: number, w: number): El => ({ id: uid(), kind: 'img', src, x, y, w, h: w, rot: 0, shadow: true } as El);
const img = (name: string, x: number, y: number, w: number): El => ({ id: uid(), kind: 'img', src: f3dSrc(name), x, y, w, h: w, rot: 0, name, shadow: true } as El);
type Anims = Slide['anims'];
const anim = (anims: Anims, el: El, fx: 'pop' | 'zoom' | 'fly-up' | 'drop', start: 'click' | 'with' | 'after', sound?: string) =>
  anims.push({ id: uid(), el: el.id, fx, start, delay: start === 'after' ? 0.05 : 0, dur: 0.45, ...(sound ? { sound } : {}) });

/** một nhóm đồ vật xếp trên Khay đếm Montessori (5 vật/hàng — chuẩn Subitizing Tiểu học) */
function groupEls(n: number, obj: string, x: number, y: number, w: number, els: El[], anims: Anims, first: boolean) {
  const cols = Math.min(5, Math.max(1, n)), rows = Math.max(1, Math.ceil(n / 5));
  const sz = Math.min(106, Math.floor((w - 56) / cols) - 10);
  const trayH = rows * (sz + 10) + 42;
  els.push({
    id: uid(),
    kind: 'shape',
    shape: 'tray',
    x: x + 12,
    y: y - 20,
    w: w - 24,
    h: trayH,
    rot: 0,
    fill: '#f59e0b',
    stroke: '#b45309',
    sw: 5,
    lock: true,
    shadow: true,
  } as El);
  for (let i = 0; i < n; i++) {
    const e = img(obj, x + (w - cols * (sz + 10)) / 2 + (i % cols) * (sz + 10), y + Math.floor(i / cols) * (sz + 10), sz);
    els.push(e); anim(anims, e, 'pop', i === 0 && !first ? 'click' : 'after', i === 0 ? 'pop' : undefined);
  }
}

const STUDENT_AUTO_BG: Record<SceneKind, string> = {
  garden: 'meadow', pond: 'sea', kitchen: 'sun', class: 'sky', yard: 'mint', sea: 'sea', dino: 'leaf', candy: 'lollipop', family: 'kraft', space: 'cosmos', farm: 'leaf', tet: 'peach',
};
const studentLayout = (seed: number) => {
  const layouts = [
    { q: { x: 120, y: 130, w: 1360, h: 140 }, quiz: { x: 230, y: 220, w: 1140, h: 550 }, sort: { x: 160, y: 300, w: 1280, h: 540 }, drop: { x: 120, y: 300, w: 1360, h: 330 } },
    { q: { x: 160, y: 120, w: 1280, h: 130 }, quiz: { x: 180, y: 220, w: 1240, h: 540 }, sort: { x: 180, y: 300, w: 1240, h: 540 }, drop: { x: 120, y: 300, w: 1360, h: 320 } },
    { q: { x: 140, y: 160, w: 1320, h: 120 }, quiz: { x: 180, y: 220, w: 1240, h: 560 }, sort: { x: 130, y: 300, w: 1340, h: 540 }, drop: { x: 120, y: 300, w: 1360, h: 300 } },
    { q: { x: 100, y: 110, w: 1400, h: 160 }, quiz: { x: 200, y: 220, w: 1200, h: 560 }, sort: { x: 120, y: 300, w: 1360, h: 540 }, drop: { x: 120, y: 300, w: 1360, h: 310 } },
  ] as const;
  return layouts[seed % layouts.length];
};

const PASTEL_CARDS: [string, string][] = [
  ['#dbeafe', '#3b82f6'],
  ['#dcfce7', '#22c55e'],
  ['#fef3c7', '#f59e0b'],
  ['#fce7f3', '#ec4899'],
  ['#ede9fe', '#8b5cf6'],
];

export function studentSlide(sp: Spec, phase: { n: string; c: string }, n: number, topicToks: string[], sc: SceneKind, layoutOffset = 0): Slide {
  const els: El[] = [...boardEls(phase.c), badgeEl(n, phase.n, phase.c)];
  const anims: Anims = [];
  const layout = studentLayout(n + phase.n.length + topicToks.join('').length + layoutOffset);
  const bg = STUDENT_AUTO_BG[sc] ?? 'sky';
  // Quiz đã có vùng câu hỏi riêng. Chỉ giữ dòng dẫn phía trên khi quiz có thẻ tình huống.
  if (!sp.quiz || sp.cards?.length) {
    const q = text(layout.q.x, sp.quiz ? 95 : layout.q.y, layout.q.w, sp.quiz ? 100 : layout.q.h, sp.q, sp.q.length > 50 ? 50 : 64, '#1f2937');
    els.push(q); anim(anims, q, 'zoom', 'with', 'magic');
  }
  if (sp.quiz) { // trắc nghiệm: bấm chọn, đúng/sai có âm thanh (phần tử quiz sẵn có)
    const qq = sp.cards?.[0] ?? sp.q;
    els.push({ id: uid(), kind: 'quiz', x: layout.quiz.x, y: layout.quiz.y, w: layout.quiz.w, h: layout.quiz.h, rot: 0, q: qq, opts: sp.quiz.opts, a: sp.quiz.a, cols: 2 } as El);
    return { id: uid(), bg, trans: 'fade', anims, els, notes: '', phase: phase.n, scene: sc };
  }
  if (sp.sort) { // sắp xếp: học sinh lên bảng kéo đúng thứ tự
    els.push({ id: uid(), kind: 'sort', x: layout.sort.x, y: layout.sort.y, w: layout.sort.w, h: layout.sort.h, rot: 0, prompt: '', items: sp.sort } as El);
    return { id: uid(), bg, trans: 'fade', anims, els, notes: '', phase: phase.n, scene: sc };
  }
  if (sp.drop) { // kéo thả: vật kéo được ở dưới, ô nhận ở trên
    const items = sp.drop.items.map((it, i) => {
      const n = sp.drop!.items.length, w = Math.min(150, Math.floor(1360 / n) - 12), x = 800 - (n * (w + 12)) / 2 + i * (w + 12);
      const [cBg, cBd] = PASTEL_CARDS[i % PASTEL_CARDS.length];
      const e = (it.pic ? { ...img(it.pic, x, 660, w), drag: true } : { id: uid(), kind: 'shape', shape: 'round', x, y: 680, w, h: 110, rot: 0, fill: cBg, stroke: cBd, sw: 5, text: it.text ?? '', color: '#1f2937', size: 30, drag: true, shadow: true }) as El;
      anim(anims, e, 'fly-up', 'after'); return e;
    });
    const zs = sp.drop.zones, gap = 20;
    const zw = zs.length ? Math.min(600, Math.floor((layout.drop.w - gap * (zs.length - 1)) / zs.length)) : 0;
    const totalW = zs.length ? zs.length * zw + (zs.length - 1) * gap : 0;
    const startX = (1600 - totalW) / 2;
    zs.forEach((z, i) => els.push({ id: uid(), kind: 'drop', x: startX + i * (zw + gap), y: layout.drop.y, w: zw, h: layout.drop.h, rot: 0, label: z.label, accept: z.ok.map((k) => items[k]?.id).filter(Boolean), color: phase.c } as El));
    els.push(...items);
    if (sp.reveal) { const r = text(200, 820, 1200, 60, sp.reveal, 38, '#ffffff', { bg: phase.c }); els.push(r); anim(anims, r, 'pop', 'click', 'tada'); }
    return { id: uid(), bg, trans: 'fade', anims, els, notes: '', phase: phase.n, scene: sc };
  }
  let y = 300;
  if (sp.group) { // phép tính bằng đồ vật: nhóm 1 hiện lần lượt, bấm → nhóm 2
    const [a, b, obj] = sp.group;
    groupEls(a, obj, 140, y, 600, els, anims, true);
    els.push(text(740, y + 60, 120, 120, sp.big?.includes('–') ? '–' : '+', 110, phase.c));
    groupEls(b, obj, 860, y, 600, els, anims, false);
    y = 620;
    if (sp.big) { const t = text(400, y, 800, 100, sp.big, 72, phase.c); els.push(t); anim(anims, t, 'fly-up', 'click'); y = 740; }
  } else if (sp.big) {
    const parts = sp.big.split(/\s+/).filter(Boolean);
    if (parts.length && parts.every((p) => EMO[p])) { // emoji → hình 3D to, nảy vào
      const w = Math.min(280, Math.floor(1100 / parts.length));
      parts.forEach((p, i) => { const e = img(EMO[p], 800 - (parts.length * (w + 20)) / 2 + i * (w + 20), y, w); els.push(e); anim(anims, e, 'drop', 'after'); });
      y += w + 20;
    } else { const t = text(120, y, 1360, 240, sp.big, sp.big.length > 24 ? 80 : 140, phase.c, { font: 'hand' }); els.push(t); anim(anims, t, 'pop', 'after'); y += 260; }
  }
  if (sp.words) { // tiếng có vần của bài, kèm hình — Flashcard Bento 2 tầng
    const vs = vansIn(topicToks.join(' '));
    const ws = (vs.length ? vs.flatMap((v) => wordsOf(v).filter((w) => w.pic).map((w) => ({ pic: w.pic!, word: w.word }))) : topicToks.flatMap(picWords)).slice(0, 4);
    const w = 270, gap = 28, x0 = 800 - (ws.length * (w + gap) - gap) / 2, topY = Math.min(y, 470);
    ws.forEach((x, i) => {
      const [cBg, cBd] = PASTEL_CARDS[i % PASTEL_CARDS.length];
      const cx = x0 + i * (w + gap);
      const card = { id: uid(), kind: 'shape', shape: 'round', x: cx, y: topY, w, h: 285, rot: 0, fill: cBg, stroke: cBd, sw: 5, lock: true, shadow: true } as El;
      const e = img(x.pic, cx + (w - 165) / 2, topY + 18, 165);
      const t = text(cx + 14, topY + 195, w - 28, 72, x.word, 46, '#0f172a', { bg: '#ffffffeb' });
      els.push(card, e, t); anim(anims, card, 'pop', 'click', 'pop'); anim(anims, e, 'pop', 'with'); anim(anims, t, 'fly-up', 'with');
    });
    y = topY + 300;
  }
  const cards = sp.words ? [] : sp.cards ?? [];
  if (cards.length) {
    const w = Math.min(270, Math.floor(1320 / cards.length) - 18), cy = Math.min(y, 600), x0 = 800 - (cards.length * (w + 18) - 18) / 2;
    cards.forEach((c, i) => {
      const [cBg, cBd] = PASTEL_CARDS[i % PASTEL_CARDS.length];
      const e = { id: uid(), kind: 'shape', shape: 'round', x: x0 + i * (w + 18), y: cy, w, h: 135, rot: 0, fill: cBg, stroke: cBd, sw: 5, text: c, color: '#0f172a', size: c.length > 6 ? 34 : 56, shadow: true } as El;
      els.push(e); anim(anims, e, 'fly-up', 'after');
    });
  }
  if (sp.reveal) {
    const r = text(200, 760, 1200, 90, sp.reveal, sp.reveal.length > 40 ? 38 : 58, '#ffffff', { bg: phase.c });
    els.push(r); anim(anims, r, 'pop', 'click', 'tada');
  }
  return { id: uid(), bg, trans: 'fade', anims, els, notes: '', phase: phase.n, scene: sc };
}

/** các trang học sinh của một hoạt động; trang đầu mang ghi chú hướng dẫn + công cụ cho cô */
function activitySlides(n: number, phase: { n: string; c: string }, x: LessonIdea, topic: string, math: boolean, minus: boolean, r: () => number, sc: SceneKind): Slide[] {
  const tl = toolsOf(x);
  const toks = topic.replace(/[“”"]/g, '').split(/[\s,]+/).filter((t) => t && t.length <= 6).slice(0, 6);
  const max = Number(/ph[aạ]m vi\s*(\d+)/i.exec(topic)?.[1]) || 10;
  const slides = specsOf(x, topic, math, minus, r, Math.min(100, Math.max(5, max)), vansIn(topic)).slice(0, Math.max(1, Math.ceil(x.m / 2))).map((sp, i) => studentSlide(sp, phase, n, toks, sc, i));
  // linh vật dẫn dắt ở trang đầu hoạt động
  const hasInteraction = slides[0].els.some((e) => e.kind === 'quiz' || e.kind === 'sort' || e.kind === 'drop');
  if (!hasInteraction) {
    const m = img0(MASCOTS[n % MASCOTS.length].src, 1330, 640, 200);
    const b = { id: uid(), kind: 'shape', shape: 'bubble', x: 980, y: 560, w: 380, h: 120, rot: 0, fill: '#fffbeb', stroke: phase.c, sw: 4, text: `Cùng chơi: ${x.t}!`, color: '#1f2937', size: 26 } as El;
    slides[0].els.push(m, b);
    slides[0].anims.unshift({ id: uid(), el: m.id, fx: 'fly-right', start: 'with', delay: 0, dur: 0.6 }, { id: uid(), el: b.id, fx: 'pop', start: 'after', delay: 0.1, dur: 0.4 });
  }
  slides[0] = {
    ...slides[0], mins: x.m,
    notes: [`${x.t} (${x.m} phút${x.p ? `, chuẩn bị trước ${x.p} phút` : ''})`, ...x.s.map((s, j) => `${j + 1}. ${s}`), x.w && `Mục tiêu: ${x.w}`].filter(Boolean).join('\n'),
    tool: { timer: tl.timer || undefined, name: tl.name || undefined, teams: tl.teams || undefined, label: x.t },
  };
  return slides;
}

export async function deckFromIdeas(subject: string, title: string, pick: Pick, grade: number): Promise<Deck> {
  // tìm bài trong ngân hàng nội dung (tải khi cần — file rất lớn)
  const code = subjCode(subject);
  let lessonPlan: ReturnType<typeof buildPlan> | null = null;
  let lessonId: string | undefined;
  let ctx: ActCtx | null = null; // nội dung của bài để dựng từng hoạt động gợi ý
  // tiết "Ôn luyện tuần N": lấy nội dung các bài của tuần N, KHÔNG lấy chữ trong tên tiết làm ngữ liệu
  const wk = /tu[aầ]n\s*(\d+)/i.exec(title)?.[1];
  const review = /[oô]n\s*(luy[eệ]n|t[aậ]p)|tu[aầ]n\s*\d+/i.test(title);
  let srcTitle = review ? '' : title;
  if (code) {
    const [c, k] = await Promise.all([import('@/lib/content'), import('@/lib/content/knowledge')]);
    const want = norm(title);
    const list = (c.CONTENT as ContentLesson[]).filter((l) => l.subject === code);
    const l = list.find((x) => norm(x.title) === want && (x as { grade?: number }).grade === grade) ?? list.find((x) => norm(x.title) === want)
      ?? list.find((x) => want.includes(norm(x.title).replace(/^bài\s*\d+[.:]?\s*/, '')) && norm(x.title).length > 6)
      ?? (wk ? list.find((x) => x.grade === grade && new RegExp(`^Tu[aầ]n ${wk}\\b`, 'i').test(x.ref)) : undefined);
    if (l) {
      srcTitle = l.title;
      lessonId = l.id;
      lessonPlan = buildPlan(l, k.knowledgeFor(l.id), { mascot: MASCOTS[0].id, warmup: 'quiz', scene: 'class', seed: 1, tiet: tietOf(title) });
      ctx = actCtx(l, k.knowledgeFor(l.id), { mascot: MASCOTS[0].id, warmup: 'quiz', scene: pickScene(`${title} ${subject}`, code === 'toan' ? 'garden' : 'class'), seed: 1 });
    }
  }
  const bo = { dividers: false, mascot: MASCOTS[0].src, math: code === 'toan' };
  const contentOf = (ph: PhaseId, max: number) => {
    if (!lessonPlan) return [];
    const keys = lessonPlan.cands.filter((c) => c.phase === ph).slice(0, max).map((c) => c.key);
    return keys.length ? planSlides(lessonPlan, new Set(keys), {}, bo) : [];
  };

  const deck = emptyDeck(title, grade);
  const cover = contentOf('bia', 1);
  if (cover.length) deck.slides = cover;
  else deck.slides[0].els.push(text(360, 600, 880, 70, `${subject} · ${pick.dur} phút`, 40, '#475569', { font: 'quick' }));
  deck.src = { lesson: lessonId ?? title, ...(code ? { subject: code as import('@/lib/types').SubjectCode } : {}) };
  const used = planOf(subject, title, pick).reduce((t, r) => t + r.idea.m, 0);
  if (used < pick.dur) deck.slides[0].notes = `⚠ Mới chọn hoạt động cho ${used}/${pick.dur} phút — còn ${pick.dur - used} phút chưa có hoạt động.${review && !lessonId ? '\n⚠ Chưa tìm thấy nội dung của tuần này trong ngân hàng bài — cô thêm ngữ liệu vào các trang.' : ''}\n${deck.slides[0].notes ?? ''}`.trim();
  deck.mins = pick.dur;

  const topic = srcTitle.replace(/^.*?:\s*/, '').replace(/\s*-\s*ti[eế]t\s*\d+.*$/i, '').trim();
  const minus = /tr[uừ]/i.test(title);
  const rand = rnd(title.length * 7 + pick.dur);
  const sc = pickScene(`${title} ${subject}`, code === 'toan' ? 'garden' : 'class'); // cảnh nền theo bài
  planOf(subject, title, pick).forEach((r, k) => {
    const ph = r.phase.k as PhaseId;
    const tl = toolsOf(r.idea);
    // Toán: các trò đặc thù (ngón tay, xe buýt, tia số…) tự sinh phép tính đúng phạm vi bài theo đúng hình thức trò
    // chỉ hợp với số nhỏ (lớp 1, phạm vi 10); bài số lớn hơn thì dùng câu hỏi của chính bài (Bingo dùng được mọi phạm vi)
    const small = grade === 1 && (Number(/ph[aạ]m vi (\d+)/i.exec(topic)?.[1]) || 10) <= 10;
    const mathGame = code === 'toan' && MATH_GAME.test(r.idea.t.toLowerCase()) && small;
    if (ctx && !mathGame) {
      // gợi ý quyết định HÌNH THỨC, nội dung lấy từ bài; các bước tổ chức của cô nằm trong ghi chú
      const spec: ActivitySpec = { title: r.idea.t, text: `${r.idea.d} ${r.idea.w}`, steps: r.idea.s, phase: ph, mins: r.idea.m };
      const { format, pages } = activityPages(spec, ctx);
      // Khám phá: hoạt động gợi ý không phải trang kiến thức thì vẫn dạy kiến thức mới của bài ngay sau đó
      const more = ph === 'kp' && format !== 'explore' ? activityPages({ ...spec, title: 'Kiến thức mới', steps: [] }, ctx, 'explore').pages : [];
      const cands = [...pages, ...more].map((g, i) => ({ key: `${ph}:idea${k}-${i}`, phase: ph, title: g.title, slide: g.slide }));
      const slides = planSlides({ cands, defaults: { bia: 0, kd: 0, kp: 0, lt: 0, vd: 0, cc: 0 } }, new Set(cands.map((c) => c.key)), {}, bo).map((s) => ({ ...s, phase: r.phase.n }));
      if (slides[0]) slides[0] = { ...slides[0], notes: `⏱ ${r.start}′ – ${r.end}′ · ${slides[0].notes}`, tool: { timer: tl.timer || undefined, name: tl.name || undefined, teams: tl.teams || undefined, label: r.idea.t } };
      deck.slides.push(...slides);
      if (tl.teams && format !== 'race') deck.slides.push({ ...boardPage(sc), phase: r.phase.n });
    } else if (ctx) {
      // trò Toán đặc thù: trang trò tự sinh phép tính; Khám phá thêm kiến thức mới của bài (dùng chung câu với các hoạt động khác)
      const game = activitySlides(k + 1, r.phase, r.idea, topic, true, minus, rand, sc);
      game[0] = { ...game[0], notes: `⏱ ${r.start}′ – ${r.end}′ · ${game[0].notes}` };
      deck.slides.push(...game);
      if (tl.teams) deck.slides.push({ ...boardPage(sc), phase: r.phase.n });
      if (ph === 'kp') {
        const more = activityPages({ title: 'Kiến thức mới', text: '', steps: [], phase: ph, mins: 4 }, ctx, 'explore').pages;
        const cands = more.map((g, i) => ({ key: `${ph}:game${k}-${i}`, phase: ph, title: g.title, slide: g.slide }));
        deck.slides.push(...planSlides({ cands, defaults: { bia: 0, kd: 0, kp: 0, lt: 0, vd: 0, cc: 0 } }, new Set(cands.map((c) => c.key)), {}, bo).map((s) => ({ ...s, phase: r.phase.n })));
      }
    } else {
      // chưa có nội dung bài trong ngân hàng: trang theo trò (cô thêm ngữ liệu)
      deck.slides.push(dividerSlide(r.phase.n, sc, undefined, `${r.start}′ – ${r.end}′`));
      deck.slides.push(...activitySlides(k + 1, r.phase, r.idea, topic, code === 'toan', minus, rand, sc));
      if (tl.teams) deck.slides.push({ ...boardPage(sc), phase: r.phase.n });
      deck.slides.push(...contentOf(ph, PER_PHASE[r.phase.k] ?? 2).map((s) => ({ ...s, phase: r.phase.n })));
    }
    if (r.phase.k === 'kp' && pick.dur >= 30) { // giải lao vận động ~1 phút giữa tiết
      const br = studentSlide({ q: 'Giải lao! Đứng dậy vỗ tay, vươn vai theo cô 👏', big: '🙋 🎵' }, r.phase, k + 1, [], sc);
      deck.slides.push({ ...br, mins: 1, notes: 'Giải lao vận động 1 phút: hát + vỗ tay + vươn vai rồi chuyển sang Luyện tập.', tool: { timer: 1, label: 'Giải lao' } });
    }
  });
  deck.slides.push(...contentOf('cc', 1));
  deck.slides.push(dividerSlide('Hẹn gặp lại', sc, undefined, 'Cả lớp giỏi lắm!'));
  deck.slides = deck.slides.map(bareScene); // nền phong cảnh, không hình dán 3D / con vật sau chữ
  return deck;
}
