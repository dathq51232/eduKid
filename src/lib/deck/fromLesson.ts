// Dựng bài thao giảng từ một bài học trong ngân hàng nội dung: 5 hoạt động của tiết dạy
// (Khởi động · Khám phá · Luyện tập · Vận dụng · Củng cố) với tình huống, trò chơi và câu hỏi của bài.
// Hàm thuần: không gọi mạng, dùng hình có sẵn trong dự án; mỗi trang là Slide bình thường nên sửa được trong trình soạn.
import { fit, shrinkToFit } from './fit';
import { applySet, type SetContent, type SetId } from './theme-sets';
import { formsOf } from '@/lib/curriculum';
import type { ContentLesson, ContentQuestion } from '@/lib/content/types';
import type { LessonPlan as GiaoAn } from '@/lib/plans/generate';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { accentOf, inkOf } from './scenes';
import { f3dSrc as ST } from './f3d-catalog';
import { PHOTO_SRC, uid, type Anim, type El, type SceneKind, type SceneVariant, type Slide, type TextEl } from './types';

export type PhaseId = 'bia' | 'kd' | 'kp' | 'lt' | 'vd' | 'cc';
export const PHASES: { id: PhaseId; label: string; color: string; time: string }[] = [
  { id: 'bia', label: 'Trang bìa', color: '#64748b', time: '' },
  { id: 'kd', label: 'Khởi động', color: '#f59e0b', time: '5 phút' },
  { id: 'kp', label: 'Khám phá', color: '#0ea5e9', time: '12 phút' },
  { id: 'lt', label: 'Luyện tập', color: '#22c55e', time: '12 phút' },
  { id: 'vd', label: 'Vận dụng', color: '#ec4899', time: '4 phút' },
  { id: 'cc', label: 'Củng cố', color: '#8b5cf6', time: '2 phút' },
];
export const PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label])) as Record<PhaseId, string>;

export type MascotId = 'professor' | 'artist' | 'doctor' | 'astronaut' | 'robot';
export const MASCOTS: { id: MascotId; name: string; src: string }[] = [
  { id: 'professor', name: 'Giáo sư Milo', src: '/brand/milo-professor-sm.webp' },
  { id: 'artist', name: 'Hoạ sĩ Milo', src: '/brand/milo-artist-sm.webp' },
  { id: 'doctor', name: 'Bác sĩ Milo', src: '/brand/milo-doctor-sm.webp' },
  { id: 'astronaut', name: 'Phi hành gia Milo', src: '/brand/milo-astronaut-sm.webp' },
  { id: 'robot', name: 'Rô-bốt Milo', src: '/brand/milo-robot-sm.webp' },
];
export type Warmup = 'gift' | 'wheel' | 'puzzle' | 'quiz';
export const WARMUPS: { id: Warmup; label: string; icon: string }[] = [
  { id: 'gift', label: 'Hộp quà bí mật', icon: '🎁' },
  { id: 'wheel', label: 'Vòng quay', icon: '🎡' },
  { id: 'puzzle', label: 'Mảnh ghép bí ẩn', icon: '🧩' },
  { id: 'quiz', label: 'Ai nhanh hơn?', icon: '⚡' },
];

export type GenOpts = { mascot: MascotId; warmup: Warmup; scene: SceneKind; seed: number; /** tiết thứ mấy của bài (ghi trên trang bìa) */ tiet?: number };
export type Cand = { key: string; phase: PhaseId; title: string; slide: Slide };
export type LessonPlan = { cands: Cand[]; defaults: Record<PhaseId, number> };
export type Knowledge = { points: string[]; example?: string } | null | undefined;

const SUBJ: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/* ---------- dựng vật ---------- */
type Mk = { els: El[]; anims: Anim[] };
const mk = (): Mk => ({ els: [], anims: [] });
function T(m: Mk, text: string, x: number, y: number, w: number, h: number, size: number, color = '#1e3a8a', o: Partial<TextEl> = {}) {
  const e: TextEl = { id: uid(), kind: 'text', x, y, w, h, rot: 0, text, size, color, font: 'baloo', align: 'center', bg: '', ...o };
  e.size = shrinkToFit(text, w, h, e.size, !!e.bg); // không để chữ tràn khung
  m.els.push(e); return e.id;
}
function I(m: Mk, src: string, x: number, y: number, s: number, o: Partial<El> = {}) {
  const e = { id: uid(), kind: 'img', src, x, y, w: s, h: s, rot: 0, shadow: true, ...o } as El; m.els.push(e); return e.id;
}
function S(m: Mk, shape: Extract<El, { kind: 'shape' }>['shape'], x: number, y: number, w: number, h: number, fill: string, text = '', o: Partial<El> = {}) {
  const e = { id: uid(), kind: 'shape', shape, x, y, w, h, rot: 0, fill, stroke: '#ffffff', sw: 5, text, color: '#1f2937', size: Math.round(Math.min(w, h) * 0.4), shadow: true, ...o } as El;
  m.els.push(e); return e.id;
}
function A(m: Mk, el: string, fx: Anim['fx'], start: Anim['start'] = 'click', o: Partial<Anim> = {}) { m.anims.push({ id: uid(), el, fx, start, delay: 0, dur: 0.6, ...o }); }
/** miếng che đáp án 3D: bấm vào thẻ bí ẩn thì bung mở, lộ đáp án */
function cover(m: Mk, x: number, y: number, w: number, h: number) {
  const c = S(m, 'mystery', x, y, w, h, '#fbbf24', '?', { stroke: '#d97706', sw: 5, color: '#78350f', size: Math.min(76, Math.round(h * 0.56)) } as Partial<El>);
  A(m, c, 'zoom-out', 'click', { trigger: c, sound: 'ding', dur: 0.45 });
  return c;
}
const title = (m: Mk, text: string, color = '#1e3a8a') => T(m, text, 340, 38, 920, 88, fit(text, 880, 80, 58, 32), color, { bg: '#ffffffd9', role: 'title' });
const page = (m: Mk, phase: PhaseId, scene: SceneKind, notes = '', sound?: string, sceneVariant?: SceneVariant): Slide => ({ id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'fade', notes, sound, scene, sceneVariant, phase: PHASE_LABEL[phase] });

/** Cặp Tiêu đề IN HOA + Phụ đề in đậm nghiêng neo cố định ở góc trái trên (Quy tắc 1 chuẩn Canva Editorial Scrapbook) */
function editorialHeader(m: Mk, heading: string, sub: string, sc?: SceneKind) {
  const ink = inkOf(sc);
  const up = heading.toUpperCase();
  T(m, up, 92, 48, 980, 68, fit(up, 960, 62, 46, 28), ink.title, { align: 'left', font: 'quick', role: 'title' });
  if (sub) {
    T(m, sub, 92, 114, 980, 56, fit(sub, 960, 50, 30, 20), ink.sub, { align: 'left', font: 'baloo', italic: true });
  }
}

/** Dải đúc kết đáy trang (Bottom Takeaway Strip — Quy tắc 3: Bông hoa ✿ + câu ghi nhớ in nghiêng trên thảm cỏ đáy y = 720) */
function takeawayStrip(m: Mk, text: string, sc?: SceneKind) {
  const ink = inkOf(sc);
  S(m, 'flower-bullet', 186, 732, 54, 54, '#ffffff', '', { stroke: '#d97757', sw: 0, lock: true, shadow: false } as Partial<El>);
  T(m, text, 254, 704, 1090, 110, fit(text, 1030, 84, 34, 28), ink.body, { align: 'left', font: 'baloo', italic: true, bg: 'rgba(255,255,255,0.55)' });
}

/** Bảng màu Bento 4 ô chuẩn Canva Kids (nền pastel, viền nổi, màu chữ đậm, hình 3D góc thẻ) */
const BENTO = [
  { bg: '#eff6ff', bd: '#60a5fa', tx: '#1e3a8a', ic: 'star' },
  { bg: '#f0fdf4', bd: '#4ade80', tx: '#14532d', ic: 'seedling' },
  { bg: '#fefce8', bd: '#facc15', tx: '#713f12', ic: 'light-bulb' },
  { bg: '#fdf2f8', bd: '#f472b6', tx: '#831843', ic: 'sunflower' },
] as const;

/** Dàn ý thành Tờ giấy Note dán băng dính Washi + hoa cúc ✿ (1–3 ý, chừa cảnh phải 'right') hoặc Lưới Bento 2×2 (4 ý, cảnh đáy 'bottom') */
function bentoGrid(m: Mk, items: string[], mascotSrc: string, clickEach = true, sc?: SceneKind): SceneVariant {
  const pts = items.slice(0, 4);
  const ink = inkOf(sc);
  if (pts.length <= 3) {
    // Mẫu 1 (Split Washi-Tape Sticky Note — Slide 2, 6, 8): 1 tờ giấy Note kem lớn dán băng dính hồng + 3 dòng gắn hoa ✿
    S(m, 'sticky', 92, 172, 825, 495, '#f9eedb', '', { stroke: '#f2b3a9', sw: 0, lock: true, shadow: true } as Partial<El>);
    const rowH = pts.length <= 2 ? 150 : 122;
    const startY = 236;
    pts.forEach((t, i) => {
      const y = startY + i * (rowH + 14);
      const fl = S(m, 'flower-bullet', 132, y + Math.round((rowH - 52) / 2), 52, 52, '#eebfb8', '', { stroke: '#d97757', sw: 0, lock: true, shadow: false } as Partial<El>);
      const txt = T(m, t, 204, y + 8, 682, rowH - 16, fit(t, 665, rowH - 22, 38, 22), '#1f2937', { align: 'left', font: 'quick' });
      if (clickEach) {
        A(m, fl, 'pop', i === 0 ? 'with' : 'click', { sound: 'pop' });
        A(m, txt, 'fade', 'with');
      }
    });
    takeawayStrip(m, 'Ghi nhớ các ý chính trên sổ tay để vận dụng vào bài tập nhé!', sc);
    void ink;
    return 'right';
  }
  const cols = 2, rows = 2;
  const bw = 620, bh = 250, gapX = 36, gapY = 28, startX = 96, startY = 165;
  void rows;
  pts.forEach((t, i) => {
    const c = BENTO[i % BENTO.length];
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (bw + gapX);
    const y = startY + row * (bh + gapY);
    const box = S(m, 'round', x, y, bw, bh, c.bg, '', { stroke: c.bd, sw: 5, lock: true } as Partial<El>);
    const ic = I(m, ST(c.ic), x + 20, y + 20, 68, { lock: true });
    const txt = T(m, `${CIRCLED[i] ?? i + 1}  ${t}`, x + 98, y + 18, bw - 116, bh - 36, fit(t, bw - 130, bh - 48, 44, 24), c.tx, { align: 'left', font: 'quick' });
    if (clickEach) {
      A(m, box, 'pop', i === 0 ? 'with' : 'click', { sound: 'pop' });
      A(m, ic, 'pop', 'with');
      A(m, txt, 'fade', 'with');
    }
  });
  I(m, mascotSrc, 1370, 635, 190, { lock: true });
  return 'bottom';
}

/** Trang "Chuẩn bị đồ dùng học tập" đầu tiết (kiểu Canva Classroom Check-in) */
function prepPage(subject: string, sc: SceneKind, mascot: string): Slide {
  const m = mk();
  title(m, 'Chuẩn bị vào học', '#0369a1');
  const items: [string, string, string, string][] = subject === 'toan'
    ? [['books', 'Sách Toán', '#dbeafe', '#3b82f6'], ['notebook', 'Bảng con · Vở', '#dcfce7', '#22c55e'], ['pencil', 'Bút chì · Thước', '#fef3c7', '#f59e0b'], ['abacus', 'Đồ dùng học toán', '#fce7f3', '#ec4899']]
    : subject === 'tieng-anh'
    ? [['books', 'Student Book', '#dbeafe', '#3b82f6'], ['notebook', 'Notebook', '#dcfce7', '#22c55e'], ['pencil', 'Pencil & Crayons', '#fef3c7', '#f59e0b'], ['headphone', 'Listen & Speak', '#fce7f3', '#ec4899']]
    : [['open-book', 'Sách Tiếng Việt', '#dbeafe', '#3b82f6'], ['notebook', 'Vở tập viết · Bảng', '#dcfce7', '#22c55e'], ['pencil', 'Bút mực · Bút chì', '#fef3c7', '#f59e0b'], ['star', 'Ngồi ngay ngắn', '#fce7f3', '#ec4899']];
  items.forEach(([pic, lb, bg, bd], i) => {
    const x = 90 + i * 325, y = 210, w = 300, h = 440;
    const card = S(m, 'round', x, y, w, h, bg, '', { stroke: bd, sw: 5, lock: true } as Partial<El>);
    const im = I(m, ST(pic), x + 55, y + 40, 190, { name: lb });
    const tx = T(m, `${CIRCLED[i]} ${lb}`, x + 18, y + 265, w - 36, 130, fit(lb, w - 48, 110, 42, 26), '#0f172a');
    A(m, card, 'pop', i === 0 ? 'with' : 'after', { sound: i === 0 ? 'pop' : undefined });
    A(m, im, 'pop', 'with');
    A(m, tx, 'fade', 'with');
  });
  I(m, mascot, 1365, 650, 195, { lock: true });
  return page(m, 'kd', sc, 'Kiểm tra đồ dùng học tập và tư thế ngồi của cả lớp trước khi vào bài.');
}

/** Trang "Vé ra về · Tự đánh giá" cuối tiết (kiểu Mẫu 3 Canva: 3 Thẻ Badge-Card Icon nhô 50% mép trên + Dải đúc kết đáy trang) */
function exitTicketPage(sc: SceneKind, mascot: string): Slide {
  const m = mk();
  editorialHeader(m, 'HÔM NAY EM HIỂU BÀI THẾ NÀO?', 'Cùng tự đánh giá hành trình học tập hôm nay nhé', sc);
  const levels: [string, string, string][] = [
    ['1 ngón tay ☝️', 'Em hiểu bài\nrất rõ!', '#ecc978'],
    ['2 ngón tay ✌️', 'Em cần luyện\nthêm một chút!', '#f4a261'],
    ['3 ngón tay 🤟', 'Em muốn hỏi\nthêm cô giáo!', '#8ecae6'],
  ];
  levels.forEach(([finger, desc, sunCol], i) => {
    const x = 140 + i * 465, y = 188, w = 390, h = 445;
    const c = S(m, 'badge-card', x, y, w, h, '#faeedb', '', { stroke: sunCol, sw: 0, lock: true, shadow: true } as Partial<El>);
    T(m, finger, x + 24, y + 195, w - 48, 70, 38, '#111827', { font: 'baloo' });
    T(m, desc, x + 24, y + 275, w - 48, 125, 34, '#1f2937', { font: 'quick' });
    A(m, c, 'fly-up', 'after', { delay: i * 0.12 });
  });
  takeawayStrip(m, 'Điều quan trọng không phải là làm đúng ngay từ đầu, mà là chúng ta luôn cố gắng và tiến bộ mỗi ngày.', sc);
  I(m, mascot, 1380, 665, 185, { lock: true });
  return page(m, 'cc', sc, 'Cho học sinh giơ 1, 2 hoặc 3 ngón tay để tự đánh giá mức độ hiểu bài hôm nay.', undefined, 'bottom');
}

/* ---------- ngẫu nhiên theo hạt giống ---------- */
function rng(seed: number) { let h = (seed * 2654435761) >>> 0 || 7; return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
function shuffle<T>(a: T[], r: () => number) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/* ---------- đọc câu hỏi ---------- */
type Q = ContentQuestion & { passage?: string; ask: string };
/** Tách bài đọc dài khỏi câu hỏi: "Đọc bài "…":\n<bài>\n<câu hỏi>" */
function splitQ(q: ContentQuestion): Q {
  const m = /^(Đọc (?:bài|đoạn|đoạn văn|đoạn thơ|câu chuyện)[^\n]*?):?\n([\s\S]+)\n([^\n]+)$/.exec(q.prompt);
  return m ? { ...q, passage: m[2].trim(), ask: m[3].trim() } : { ...q, ask: q.prompt.trim() };
}
const key = (q: ContentQuestion) => q.key as Record<string, unknown>;
const correct = (q: ContentQuestion) => String(key(q).correct ?? '');
const accepted = (q: ContentQuestion) => ((key(q).accepted as string[] | undefined) ?? [])[0] ?? '';
const short = (s: string, n: number) => s.length <= n;

/** Câu hỏi → trang Luyện tập (null nếu không hợp trình chiếu) */
function qPage(q: Q, mascot: string, scene: SceneKind, phase: PhaseId, head?: string): { title: string; slide: Slide } | null {
  if (!short(q.ask, 170)) return null;
  const m = mk();
  const notes = [q.explanation, q.solution].filter(Boolean).join('\n');
  const pic = () => I(m, mascot, 24, 700, 180, { lock: true });
  switch (q.type) {
    case 'single_choice': {
      const opts = q.options; if (opts.length < 2 || opts.length > 6 || !opts.every((o) => short(o, 48))) return null;
      const a = opts.indexOf(correct(q)); if (a < 0) return null;
      const cols = opts.length <= 4 && opts.every((o) => short(o, 16)) ? 2 : 1;
      const qe = { id: uid(), kind: 'quiz', x: 230, y: head ? 150 : 60, w: 1140, h: head ? 630 : 720, rot: 0, q: q.ask, opts, a, cols } as El;
      if (head) title(m, head); m.els.push(qe); A(m, qe.id, 'pop', 'with', { sound: 'pop' }); pic();
      return { title: `Chọn đáp án: ${q.ask.replace(/\n/g, ' ')}`, slide: page(m, phase, scene, notes) };
    }
    case 'true_false': {
      const qe = { id: uid(), kind: 'quiz', x: 230, y: 60, w: 1140, h: 710, rot: 0, q: q.ask, opts: ['✔ Đúng', '✘ Sai'], a: correct(q) === 'Đúng' ? 0 : 1, cols: 2 } as El;
      m.els.push(qe); A(m, qe.id, 'pop', 'with', { sound: 'pop' }); pic();
      return { title: `Đúng hay sai: ${q.ask.replace(/\n/g, ' ')}`, slide: page(m, phase, scene, notes) };
    }
    case 'ordering': {
      const items = (key(q).order as string[] | undefined) ?? [];
      if (items.length < 2 || items.length > 8 || !items.every((t) => short(t, 26))) return null;
      const se = { id: uid(), kind: 'sort', x: 160, y: 120, w: 1280, h: 640, rot: 0, prompt: q.ask, items } as El;
      m.els.push(se); A(m, se.id, 'fade', 'with'); pic();
      return { title: `Sắp xếp: ${q.ask.replace(/\n/g, ' ')}`, slide: page(m, phase, scene, notes || `Thứ tự đúng: ${items.join(' → ')}`) };
    }
    case 'matching': {
      const left = q.left ?? [], pairs = (key(q).pairs as Record<string, string> | undefined) ?? {};
      if (left.length < 2 || left.length > 4 || !left.every((t) => short(t, 18) && short(pairs[t] ?? '', 18) && pairs[t])) return null;
      title(m, q.ask);
      const n = left.length, cw = Math.min(300, 1200 / n - 30), gap = (1280 - n * cw) / (n + 1);
      const zones: string[] = [];
      left.forEach((l, i) => {
        const x = 160 + gap + i * (cw + gap);
        T(m, l, x, 170, cw, 150, fit(l, cw - 20, 130, 72, 30), '#0f172a', { bg: '#ffffffe6', lock: true });
        const z = { id: uid(), kind: 'drop', x, y: 340, w: cw, h: 170, rot: 0, label: 'Thả vào đây', accept: [], color: '#2563eb' } as El;
        m.els.push(z); zones.push(z.id);
      });
      const right = shuffle(left.map((l) => pairs[l]), rng(q.prompt.length + n));
      const colors = ['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0'];
      const ids = right.map((t, i) => [t, S(m, 'round', 160 + gap + i * (cw + gap) + (cw - Math.min(cw, 260)) / 2, 620, Math.min(cw, 260), 130, colors[i % 4], t, { drag: true, size: fit(t, Math.min(cw, 260) - 20, 110, 56, 24) } as Partial<El>)] as const);
      left.forEach((l, i) => { const z = m.els.find((e) => e.id === zones[i]); if (z?.kind === 'drop') z.accept = ids.filter(([t]) => t === pairs[l]).map(([, id]) => id); });
      return { title: `Ghép đôi: ${q.ask}`, slide: page(m, phase, scene, notes || 'Mời học sinh lên kéo thẻ vào đúng ô.') };
    }
    case 'fill_blank':
    case 'multiple_choice': {
      const ans = q.type === 'fill_blank' ? accepted(q) : ((key(q).correct as string[] | undefined) ?? []).join(', ');
      if (!ans || !short(ans, 60)) return null;
      const body = q.type === 'multiple_choice' ? `${q.ask}\n${optionLines(q.options)}` : q.ask;
      if (head) title(m, head);
      S(m, 'bubble', 230, head ? 150 : 60, 1140, 420, '#ffffff', '', { stroke: '#38bdf8', sw: 5, lock: true } as Partial<El>);
      T(m, body, 280, head ? 175 : 85, 1040, 300, fit(body, 1020, 290, 60, 28), '#0f172a', { font: 'baloo' });
      T(m, 'Đáp án:', 420, 640, 260, 110, 50, '#7c2d12', { bg: '#fff7ed' });
      T(m, ans, 700, 630, 480, 130, fit(ans, 460, 120, 70, 30), '#15803d', { bg: '#dcfce7' });
      cover(m, 700, 630, 480, 130); pic();
      return { title: `Hỏi – đáp (miếng che): ${q.ask.replace(/\n/g, ' ')}`, slide: page(m, phase, scene, (notes ? notes + '\n' : '') + 'Bấm miếng che “?” để mở đáp án.') };
    }
  }
  return null;
}

/** Trang bìa chuẩn Canva Scenic Storybook: thông tin lớp 2 cột góc trái trên, tên bài lớn căn trái trên khoảng trời thoáng, cảnh minh hoạ đảo/nhân vật ở góc phải */
function coverPage(name: string, sub: string, tiet: number | undefined, sc: SceneKind, mascot: string): Slide {
  const m = mk();
  const ink = inkOf(sc);
  const strokeCol = sc === 'space' ? '#0f172a' : '#ffffff';
  T(m, 'Trường Tiểu học EduChain\nLớp học vui vẻ', 96, 48, 420, 86, 28, ink.body, { align: 'left', font: 'quick' });
  const head = sub.length > 26 ? sub.split(' · ')[0] : sub; // tên chủ đề dài đã có ở dòng dưới tên bài
  T(m, `${head}${tiet ? `\nTiết ${tiet}` : ''}`, 530, 48, 430, 86, 28, ink.body, { align: 'left', font: 'quick' });
  const up = name.toUpperCase();
  const t = T(m, up, 96, 178, 840, 260, fit(up, 820, 245, 92, 46), ink.title, { align: 'left', stroke: strokeCol, strokeW: 10, shadow: true, role: 'divider' });
  const st = sub.toUpperCase();
  T(m, st, 100, 448, 820, 76, fit(st, 800, 70, 36, 28), ink.sub, { align: 'left', font: 'baloo' });
  if (tiet) {
    const k = T(m, `Tiết ${tiet}`, 100, 530, 210, 68, 36, '#ffffff', { bg: ink.title, role: 'badge' });
    A(m, k, 'pop', 'after', { sound: 'pop' });
  }
  const p = I(m, mascot, 1345, 625, 220);
  A(m, t, 'zoom', 'with', { dur: 0.8 });
  A(m, p, 'pop', 'after', { sound: 'magic' });
  return page(m, 'bia', sc, '', undefined, 'cover');
}

/** Trang "Bảng thi đua tổ": khi chiếu hiện điểm tuần này của các tổ (cột mọc lên, tổ nhất có cúp) */
export function boardPage(sc: SceneKind | undefined): Slide {
  const m = mk(); title(m, 'Thi đua tổ', accentOf(sc));
  const b = { id: uid(), kind: 'teams', x: 200, y: 160, w: 1200, h: 680, rot: 0, title: '' } as El;
  m.els.push(b); A(m, b.id, 'fade', 'with', { sound: 'drum' });
  return { id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'zoom', notes: 'Điểm thi đua tổ tuần này (cộng cả điểm trên lớp, bài thao giảng, bài tập). Khen tổ dẫn đầu.', sound: 'clap', scene: sc, sceneVariant: 'bottom', phase: PHASE_LABEL.cc };
}

/** các lựa chọn A. B. C. … xuống dòng gọn: lựa chọn ngắn xếp 2 cái một dòng, dài thì mỗi cái một dòng */
function optionLines(opts: string[]): string {
  const lab = opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`);
  if (!lab.every((x) => x.length <= 18)) return lab.join('\n');
  const rows: string[] = [];
  for (let i = 0; i < lab.length; i += 2) rows.push(lab.slice(i, i + 2).join('        '));
  return rows.join('\n');
}
/** tách bài đọc thành các đoạn ≤ ~330 ký tự theo ranh giới câu (tối đa 3 trang) */
function readingChunks(pass: string): string[] {
  const sents = pass.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]+["”»]?\s*|[^.!?…]+$/g) ?? [pass];
  const out: string[] = [];
  let cur = '';
  for (const x of sents) {
    if (cur && (cur + x).length > 330) { out.push(cur.trim()); cur = ''; }
    cur += x;
  }
  if (cur.trim()) out.push(cur.trim());
  if (out.length > 3) { const tail = out.slice(2).join(' '); return [out[0], out[1], tail.length > 360 ? tail.slice(0, 340).replace(/\s\S*$/, '') + ' …' : tail]; }
  return out;
}

/* ---------- tình huống theo cảnh ---------- */
const SITU: Record<SceneKind, string[]> = {
  garden: ['{M} đang dạo chơi trong vườn. Khu vườn giấu nhiều câu đố về “{T}”. Các bạn giúp {M} giải đố nhé!', 'Sáng nay {M} ra vườn tưới cây và gặp một thử thách: “{T}”. Cả lớp cùng {M} tìm hiểu nào!'],
  pond: ['{M} ngồi bên bờ ao ngắm cá bơi. Bạn cá đố {M} một câu về “{T}”. Mình cùng giúp {M} nhé!', 'Đàn vịt rủ {M} chơi trò thi tài “{T}”. Lớp mình có muốn tham gia không?'],
  kitchen: ['{M} vào bếp phụ mẹ nấu ăn. Mẹ đố {M} một câu về “{T}”. Các bạn cùng nghĩ nhé!', 'Giờ ăn sáng, {M} phát hiện nhiều điều thú vị về “{T}” ngay trên bàn ăn!'],
  class: ['Hôm nay {M} đến lớp sớm. Trên bảng có một câu đố về “{T}”. Ai giúp {M} được nào?', 'Cô giáo giao cho {M} nhiệm vụ: tìm hiểu “{T}”. Cả lớp cùng {M} hoàn thành nhé!'],
  yard: ['Ngoài sân nhà, {M} và các bạn đang chơi. Bỗng có một thử thách: “{T}”. Mình cùng vượt qua nhé!', 'Chủ nhật, {M} chơi ở sân và nghĩ ra trò chơi về “{T}”. Các bạn chơi cùng {M} nhé!'],
  farm: ['{M} về thăm trang trại của ông bà. Bác nông dân đố {M} về “{T}”. Lớp mình giúp {M} nhé!', 'Đàn gà con lạc nhau! Muốn đưa gà về chuồng, {M} phải giải câu đố về “{T}”.'],
  sea: ['{M} đi biển cùng gia đình. Bạn cua đố {M} một câu về “{T}”. Cả lớp cùng giải nhé!', 'Con tàu của {M} chỉ ra khơi khi giải xong thử thách “{T}”. Các bạn giúp {M} nào!'],
  dino: ['{M} bước vào khu rừng tiền sử. Bạn khủng long cổ dài đố {M} một câu về “{T}”. Cả lớp cùng giải nhé!', 'Trứng khủng long sắp nở rồi! Muốn giúp khủng long con, {M} cần vượt qua thử thách “{T}”.'],
  candy: ['{M} lạc vào vương quốc kẹo ngọt. Lâu đài kem đố {M} một câu về “{T}”. Các bạn giúp {M} nhé!', 'Xe kẹo bông chỉ mở cửa khi {M} giải xong thử thách “{T}”. Cả lớp cùng khám phá nào!'],
  family: ['Cuối tuần, gia đình {M} đi cắm trại trên đồi cỏ. Bố mẹ đố {M} một điều thú vị về “{T}”. Cả lớp cùng khám phá nhé!', 'Bên thảm hoa rực rỡ, {M} mở cuốn sổ tay nhỏ ghi lại bài học “{T}”. Mình cùng đọc với {M} nào!'],
  tet: ['Tết đến rồi! {M} cùng gia đình gói bánh chưng và gặp một câu đố về “{T}”. Cả lớp giúp {M} nhé!', 'Ông bà lì xì cho {M} một phong bao đỏ, bên trong là thử thách về “{T}”!'],
  space: ['Tàu vũ trụ của {M} cần mật mã để bay lên. Mật mã nằm trong bài “{T}”. Cả lớp cùng tìm nhé!', '{M} hạ cánh xuống một hành tinh lạ. Người hành tinh đố {M} về “{T}”!'],
};
const LIENHE: Record<string, string[]> = {
  toan: ['Ở nhà, em đã gặp “{T}” khi nào? Kể cho bạn bên cạnh nghe nhé!', 'Em hãy tìm quanh lớp học những đồ vật giúp em luyện “{T}”.'],
  'tieng-viet': ['Em hãy nói một câu về người thân hoặc bạn bè, có dùng điều vừa học trong bài “{T}”.', 'Kể cho bạn bên cạnh nghe: điều em thích nhất trong bài “{T}” là gì?'],
  'tieng-anh': ['Hỏi và trả lời với bạn bên cạnh bằng mẫu câu vừa học trong “{T}”.', 'Chỉ vào đồ vật trong lớp và nói tên tiếng Anh của chúng nhé!'],
};
const HOMEWORK: Record<string, string> = {
  toan: '• Làm bài trong vở bài tập\n• Tìm 3 ví dụ ở nhà liên quan đến bài học\n• Luyện thêm trên EduChain Kids',
  'tieng-viet': '• Đọc lại bài cho bố mẹ nghe\n• Viết 1–2 câu có dùng từ ngữ vừa học\n• Luyện thêm trên EduChain Kids',
  'tieng-anh': '• Đọc to các từ mới 3 lần\n• Nói mẫu câu với người thân\n• Luyện thêm trên EduChain Kids',
};
const fill = (s: string, M: string, Tp: string) => s.replace(/\{M\}/g, M).replace(/\{T\}/g, Tp);
/** Tên bài gọn (bỏ "Bài 1." / "Tuần 1." / "Unit 1.") */
export const topicOf = (l: ContentLesson) => l.title.replace(/^(Bài|Tuần|Unit|Tiết|Review)\s*[\dIVX]*[.:]?\s*/i, '').trim() || l.title;

/* ---------- dựng kế hoạch ---------- */
export function buildPlan(lesson: ContentLesson, know: Knowledge, o: GenOpts, ga?: GiaoAn | null): LessonPlan {
  const r = rng(o.seed + lesson.id.length * 31);
  const M = MASCOTS.find((x) => x.id === o.mascot) ?? MASCOTS[0];
  const Tp = topicOf(lesson), sc = o.scene;
  const subj = SUBJ[lesson.subject] ?? '';
  const cands: Cand[] = [];
  const add = (phase: PhaseId, k: string, t: string, s: Slide) => cands.push({ key: `${phase}:${k}`, phase, title: t, slide: s });
  const qs = shuffle(lesson.questions.map(splitQ), r);
  const used = new Set<ContentQuestion>();
  // câu cùng đề (ngân hàng có thể có bản trùng) coi như đã dùng
  const take = (f: (q: Q) => boolean) => { const q = qs.find((x) => !used.has(x) && f(x)); if (q) qs.forEach((x) => { if (x.ask === q.ask) used.add(x); }); return q; };

  /* Bìa */
  add('bia', 'cover', 'Trang bìa', coverPage(lesson.title, `${subj} ${lesson.grade}${lesson.unit?.title ? ' · ' + lesson.unit.title.replace(/^Chủ đề\s*\d+[.:]?\s*/i, '') : ''}`, o.tiet, sc, M.src));

  /* Hoạt động theo giáo án (nếu tạo từ lịch báo giảng): mỗi hoạt động của giáo án → trang đúng hình thức, nội dung của bài */
  const ctx = actCtx(lesson, know, o, formNamesOf(lesson.subject), used, qs);
  const gaFormats = new Set<ActFormat>();
  if (ga) {
    for (const a of ga.activities) {
      const ph = ACT_PHASE[a.key] ?? 'kp';
      const spec: ActivitySpec = { title: activityName(a.title, a.teacher, ph), text: [a.goal, a.teacher, a.student].filter(Boolean).join('\n'), steps: lines(a.teacher, 8), phase: ph, mins: a.minutes, forms: formsInText(a.teacher) };
      const got = activityPages(spec, ctx);
      gaFormats.add(got.format);
      got.pages.forEach((g, i) => add(ph, `ga-${a.key}-${i}`, g.title, g.slide));
    }
  }
  /* Khởi động: trò chơi đã chọn (đổi trò thì dựng lại), bài thiếu câu dễ thì thử trò khác */
  const WARM: Record<Warmup, [ActFormat, string]> = { gift: ['box', 'Hộp quà bí mật'], wheel: ['wheel', 'Vòng quay may mắn'], puzzle: ['puzzle', 'Lật mảnh ghép bí ẩn'], quiz: ['bell', 'Ai nhanh hơn?'] };
  for (const w of [o.warmup, ...(['gift', 'wheel', 'puzzle', 'quiz'] as Warmup[]).filter((x) => x !== o.warmup)]) {
    const [f, t] = WARM[w];
    const g = BUILDERS[f]({ title: t, text: '', steps: [], phase: 'kd', mins: 4 }, ctx)[0];
    // trò khởi động mặc định: ghi chú chỉ cần đáp án (bỏ dòng tên hoạt động)
    if (g) { add('kd', w, t, { ...g.slide, notes: g.slide.notes.split('\n').slice(1).join('\n') }); break; }
  }
  // tình huống mở đầu (góc máy 'center': chữ ở khoảng trống giữa cảnh)
  shuffle(SITU[sc], r).forEach((tpl, i) => {
    const line = fill(tpl, M.name, Tp);
    const m = mk();
    const ink = inkOf(sc);
    const p = I(m, M.src, 80, 460, 320);
    const b = S(m, 'bubble', 360, 140, 1020, 410, ink.pill, line, { stroke: ink.pillBorder, sw: 6, size: fit(line, 920, 320, 50, 28), color: ink.body } as Partial<El>);
    A(m, p, 'fly-left', 'with', { sound: 'whoosh' }); A(m, b, 'pop', 'after', { sound: 'pop' });
    add('kd', `situ${i}`, `Tình huống: ${line.slice(0, 60)}…`, page(m, 'kd', sc, 'Đọc tình huống, hỏi lớp: “Muốn giúp bạn, chúng ta cần biết điều gì?”', undefined, 'center'));
  });
  add('kd', 'prep', 'Chuẩn bị đồ dùng học tập', prepPage(lesson.subject, sc, M.src));

  /* Khám phá */
  // theo giáo án đã có trang kiến thức (hình thức khám phá) thì không thêm bản trùng
  if (know?.points?.length && !gaFormats.has('explore')) {
    const m = mk();
    const ink = inkOf(sc);
    const vr = bentoGrid(m, know.points, M.src, true, sc);
    if (vr === 'right') {
      editorialHeader(m, 'KIẾN THỨC CẦN NHỚ', 'Những điểm quan trọng giúp em làm tốt bài học hôm nay', sc);
    } else {
      title(m, 'Kiến thức cần nhớ', ink.title);
    }
    add('kp', 'know', 'Kiến thức cần nhớ (Cảnh + Thẻ Pill/Bento)', page(m, 'kp', sc, 'Bấm “Tiếp” để hiện từng thẻ kiến thức, cho học sinh nhắc lại.', undefined, vr));
  }
  if (know?.example && !gaFormats.has('explore')) {
    const m = mk(); title(m, 'Cùng làm ví dụ', '#0369a1');
    const parts = know.example.split('→').map((s) => s.trim()).filter(Boolean);
    const n = parts.length, w = Math.min(520, 1240 / n - 30);
    parts.forEach((t, i) => {
      const x = 180 + i * (w + 40);
      const id = T(m, t, x, 330, w, 220, fit(t, w - 20, 200, 64, 28), i === n - 1 ? '#15803d' : '#0f172a', { bg: '#ffffffe6' });
      if (i > 0 && i < n - 1) A(m, id, 'fade', 'click', { sound: 'pop' });
      if (i < n - 1) T(m, '➜', x + w, 400, 40, 80, 50, '#f59e0b');
      if (i === n - 1 && n > 1) cover(m, x, 330, w, 220);
    });
    add('kp', 'example', 'Ví dụ (miếng che đáp án)', page(m, 'kp', sc, 'Cùng học sinh làm từng bước, bấm miếng che để mở kết quả.'));
  }
  // bài đọc (Tiếng Việt)
  const pass = qs.find((q) => q.passage)?.passage;
  if (pass && !ctx.readDone) { // hoạt động giáo án đã chiếu bài đọc thì không thêm bản trùng
    // bài dài: tách theo câu thành nhiều trang (chữ ≥ 32 px để cả lớp đọc được từ cuối lớp)
    readingChunks(pass).forEach((txt, i, all) => {
      const m = mk(); title(m, all.length > 1 ? `Đọc bài (${i + 1}/${all.length})` : 'Đọc bài', '#7c2d12');
      T(m, txt, 200, 150, 1200, 640, fit(txt, 1140, 600, 52, 32), '#1f2937', { align: 'left', font: 'quick', bg: '#fffbeb' });
      add('kp', i ? `read${i + 1}` : 'read', all.length > 1 ? `Đọc bài – đoạn ${i + 1}/${all.length}` : 'Đọc bài (bài đọc của câu hỏi)', page(m, 'kp', sc, 'Cô đọc mẫu, học sinh đọc nối tiếp từng câu.'));
    });
  }
  // từ mới (từ câu ghép đôi): Lưới Bento Flashcard 2×2 — bấm miếng che để mở nghĩa
  const mt = qs.find((q) => q.type === 'matching' && (q.left?.length ?? 0) >= 2 && (q.left ?? []).every((t) => short(t, 18)));
  if (mt && lesson.subject !== 'toan') {
    const pairs = key(mt).pairs as Record<string, string>; const left = (mt.left ?? []).slice(0, 4);
    const m = mk(); title(m, lesson.subject === 'tieng-anh' ? 'New words · Từ mới' : 'Từ ngữ cần nhớ', '#6d28d9');
    left.forEach((l, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 92 + col * 708, by = 175 + row * 285;
      const c = BENTO[i % BENTO.length];
      S(m, 'round', bx, by, 676, 245, c.bg, '', { stroke: c.bd, sw: 5, lock: true } as Partial<El>);
      T(m, l, bx + 20, by + 28, 300, 188, fit(l, 280, 170, 64, 28), c.tx, { bg: '#ffffffeb' });
      T(m, pairs[l] ?? '', bx + 340, by + 28, 316, 188, fit(pairs[l] ?? '', 296, 170, 56, 26), '#15803d', { bg: '#dcfce7' });
      cover(m, bx + 340, by + 28, 316, 188);
    });
    used.add(mt);
    add('kp', 'words', 'Từ mới (Flashcard Bento · bấm mở nghĩa)', page(m, 'kp', sc, 'Cho học sinh đọc từ ở nửa trái thẻ, đoán nghĩa rồi bấm mở thẻ bí ẩn ở nửa phải.'));
  }
  if (lesson.description && short(lesson.description, 260)) {
    const m = mk();
    const ink = inkOf(sc);
    T(m, 'HÔM NAY CHÚNG TA HỌC GÌ?', 660, 120, 840, 84, 52, ink.title, { align: 'left', role: 'title' });
    T(m, Tp, 660, 215, 840, 130, fit(Tp, 820, 120, 64, 34), ink.sub, { align: 'left', bg: ink.pill });
    // phần mô tả bài là ghi chú phạm vi cho cô → đổi thành các mục "hôm nay em sẽ…" (mỗi mục hiện khi bấm)
    const items = learnItems(lesson.description);
    const ih = Math.min(100, Math.floor(450 / Math.max(1, items.length)) - 12);
    items.forEach((it, i) => {
      const d = T(m, it, 660, 362 + i * (ih + 12), 660, ih, fit(it, 610, ih - 20, 36, 28), ink.body, { align: 'left', font: 'quick', bg: ink.pill });
      A(m, d, 'fade', 'click');
    });
    I(m, M.src, 1340, 635, 210, { lock: true });
    add('kp', 'intro', 'Giới thiệu bài', page(m, 'kp', sc, '', undefined, 'left'));
  }
  // câu khám phá: hỏi – đáp có miếng che
  for (let i = 0; i < 2; i++) {
    const q = take((x) => (x.type === 'fill_blank' || x.type === 'single_choice') && x.level <= 2 && !x.passage);
    if (!q) break;
    const g = qPage({ ...q, type: 'fill_blank', key: { accepted: [answerOfQ(q)] } } as Q, M.src, sc, 'kp', 'Cùng tìm hiểu');
    if (g) add('kp', `ask${i}`, g.title, g.slide);
  }

  /* Vận dụng: câu khó + liên hệ thực tế (lấy trước để không bị Luyện tập dùng mất) */
  const hard = take((x) => x.level >= 3 && (x.type === 'fill_blank' || x.type === 'single_choice') && !x.passage) ?? take((x) => x.level >= 3 && !x.passage);
  const vdPages: Cand[] = [];
  if (hard) {
    const g = qPage(hard, M.src, sc, 'vd', `Thử thách của ${M.name}`);
    if (g) vdPages.push({ key: 'vd:hard', phase: 'vd', title: g.title, slide: g.slide });
  }
  // theo giáo án đã có trang đóng vai / hỏi – đáp thì trang liên hệ dùng câu chưa dùng
  (LIENHE[lesson.subject] ?? LIENHE.toan).slice(gaFormats.has('role') ? ctx.talk : 0).forEach((t, i) => {
    const line = fill(t, M.name, Tp); const m = mk();
    const ink = inkOf(sc);
    T(m, 'LIÊN HỆ THỰC TẾ', 640, 100, 860, 82, 52, ink.title, { align: 'left', role: 'title' });
    const b = S(m, 'bubble', 640, 195, 860, 390, ink.pill, line, { stroke: ink.pillBorder, sw: 6, size: fit(line, 780, 300, 48, 26), color: ink.body } as Partial<El>);
    A(m, b, 'pop', 'with', { sound: 'pop' });
    T(m, '👥 Thảo luận nhóm đôi · 2 phút', 640, 615, 620, 82, 36, '#ffffff', { bg: ink.title });
    I(m, M.src, 1310, 585, 230);
    vdPages.push({ key: `vd:lh${i}`, phase: 'vd', title: `Liên hệ: ${line.slice(0, 56)}…`, slide: page(m, 'vd', sc, 'Mời 2–3 nhóm chia sẻ, cô nhận xét và khen.', undefined, 'left') });
  });

  /* Luyện tập: mọi câu còn lại hợp trình chiếu, ưu tiên đa dạng dạng câu */
  // "Số ?" / Trả lời nhanh: 2–4 câu ngắn, mỗi lần bấm "Tiếp" ô "?" mờ đi và hiện đáp án
  for (let round = 0; round < 2; round++) {
    const rows: Q[] = [];
    for (const q of qs) {
      if (rows.length >= 4) break;
      if (used.has(q) || q.passage || !short(q.ask.replace(/\n/g, ' '), 64)) continue;
      const ans = q.type === 'fill_blank' ? accepted(q) : q.type === 'single_choice' ? correct(q) : '';
      if (!ans || !short(ans, 14)) continue;
      rows.push(q);
    }
    if (rows.length < 2) break;
    rows.forEach((q) => used.add(q));
    const math = lesson.subject === 'toan';
    const m = mk(); title(m, math ? 'Số ?' : 'Trả lời nhanh', '#1e3a8a');
    const h = Math.min(150, 600 / rows.length - 16);
    rows.forEach((q, i) => {
      const y = 170 + i * (h + 16), ans = q.type === 'fill_blank' ? accepted(q) : correct(q);
      const ask = q.ask.replace(/\n/g, ' ').replace(/\s*(\.\.\.|…|_{2,})\s*/g, ' ? ').trim();
      T(m, ask, 200, y, 860, h, fit(ask, 840, h - 10, 60, 26), '#0f172a', { align: 'left', bg: '#f8fafc' });
      const a = T(m, ans, 1100, y, 260, h, fit(ans, 240, h - 10, 72, 30), '#dc2626', { bg: '#fff7ed' });
      const c = S(m, 'mystery', 1100, y, 260, h, '#fde68a', '?', { stroke: '#f59e0b', sw: 5, color: '#92400e', size: Math.min(76, Math.round(h * 0.56)) } as Partial<El>);
      A(m, c, 'zoom-out', 'click', { sound: 'pop', dur: 0.35 }); A(m, a, 'pop', 'with');
      void a;
    });
    I(m, M.src, 24, 700, 180, { lock: true });
    add('lt', `quick${round}`, `${math ? 'Số ?' : 'Trả lời nhanh'}: ${rows.length} câu, bấm “Tiếp” hiện lần lượt`, page(m, 'lt', sc, rows.map((q, i) => `${i + 1}. ${q.ask.replace(/\n/g, ' ')} → ${q.type === 'fill_blank' ? accepted(q) : correct(q)}`).join('\n')));
  }
  const byType = new Map<string, Q[]>();
  for (const q of qs) if (!used.has(q)) byType.set(q.type, [...(byType.get(q.type) ?? []), q]);
  const prio = ['ordering', 'matching', 'single_choice', 'true_false', 'fill_blank', 'multiple_choice'];
  let k = 0, guard = 0;
  while (guard++ < 200) {
    const left = prio.filter((t) => byType.get(t)?.length);
    if (!left.length) break;
    for (const t of left) {
      const q = byType.get(t)!.shift()!;
      const g = qPage(q, M.src, sc, 'lt');
      if (g) add('lt', `q${k++}`, g.title, g.slide);
    }
  }
  cands.push(...vdPages);

  /* Củng cố */
  { const m = mk();
    const t = T(m, 'Cả lớp giỏi lắm!', 300, 40, 1000, 130, 88, '#b45309', { bg: '#ffffffd9' });
    T(m, `Hôm nay em đã học: ${Tp}`, 260, 190, 1080, 100, fit(Tp, 900, 90, 52, 28), '#1e3a8a', { bg: '#ffffffe6' });
    const c = I(m, ST('trophy'), 640, 300, 320);
    A(m, t, 'zoom', 'with'); A(m, c, 'drop', 'after', { sound: 'tada', dur: 1.2 });
    [0, 1, 2, 3, 4].forEach((i) => { const s = I(m, ST('star'), 220 + i * 240, 660, 160); A(m, s, 'pop', 'click', { sound: 'star', dur: 0.4 }); });
    I(m, M.src, 1300, 330, 260, { lock: true });
    add('cc', 'stars', 'Sao thưởng · tổng kết', page(m, 'cc', sc, 'Mỗi lần bấm “Tiếp” hiện một ngôi sao: khen tổ / nhóm học tốt.', 'clap')); }
  { const m = mk();
    editorialHeader(m, 'NHIỆM VỤ VỀ NHÀ', 'Hành trình rèn luyện mỗi ngày của em:', sc);
    const hw = (HOMEWORK[lesson.subject] ?? HOMEWORK.toan).split('\n').map((s) => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean).slice(0, 3);
    hw.forEach((item, i) => {
      const x = 92 + i * 485, y = 245, w = 445, h = 290;
      const note = S(m, 'sticky', x, y, w, h, '#f5c76b', '', { stroke: '#3f7d7a', sw: 0, lock: true, shadow: true } as Partial<El>);
      const tx = T(m, item, x + 28, y + 62, w - 56, h - 96, fit(item, w - 70, h - 110, 38, 24), '#111827', { font: 'baloo', italic: true });
      A(m, note, 'pop', i === 0 ? 'with' : 'after', { delay: i * 0.12 });
      A(m, tx, 'fade', 'with');
    });
    I(m, M.src, 1350, 620, 210, { lock: true });
    add('cc', 'home', 'Nhiệm vụ về nhà (3 Giấy Note vàng)', page(m, 'cc', sc, 'Dặn dò, chuẩn bị bài sau.', undefined, 'bottom')); }
  add('cc', 'exit', 'Vé ra về · Tự đánh giá mức độ hiểu bài', exitTicketPage(sc, M.src));
  add('cc', 'board', 'Bảng thi đua tổ (điểm tuần của các tổ)', boardPage(sc));

  if (ga) addPlanNotes(cands, ga);
  return finish(cands);
}

/** Ghép hoạt động của giáo án (GV / HS) vào ghi chú của cô ở các trang cùng hoạt động */
const ACT_PHASE: Record<string, PhaseId> = { 'khoi-dong': 'kd', 'kham-pha': 'kp', 'luyen-tap': 'lt', 'van-dung': 'vd' };
function addPlanNotes(cands: Cand[], ga: GiaoAn) {
  const seen = new Set<PhaseId>();
  for (const c of cands) {
    const a = ga.activities.find((x) => ACT_PHASE[x.key] === c.phase);
    if (!a || seen.has(c.phase)) continue;
    seen.add(c.phase); // chỉ trang đầu mỗi hoạt động, tránh lặp
    const txt = [`📄 Giáo án – ${a.title}${a.minutes ? ` (${a.minutes} phút)` : ''}`, a.goal && `Mục tiêu: ${a.goal}`, a.teacher && `GV:\n${a.teacher}`, a.student && `HS:\n${a.student}`].filter(Boolean).join('\n');
    c.slide = { ...c.slide, notes: [c.slide.notes, txt].filter(Boolean).join('\n\n') };
  }
}

/** Các dòng gạch đầu dòng của giáo án (bỏ dòng hướng dẫn trong ngoặc) */
function lines(text: string | undefined, max = 6): string[] {
  return (text ?? '').split(/\n+/).map((l) => l.replace(/^\s*[-•+*–]\s*/, '').trim()).filter((l) => l && !l.startsWith('(')).slice(0, max);
}
const LIENHE_OTHER = ['Ở nhà hoặc ở lớp, em đã làm được điều gì giống như trong bài “{T}”? Kể cho bạn nghe nhé!', 'Từ hôm nay, em sẽ làm gì để thực hiện điều vừa học trong bài “{T}”?'];

/** Dựng kịch bản từ giáo án (môn chưa có ngân hàng câu hỏi, hoặc tiết chưa khớp bài trong ngân hàng) */
export function buildPlanFromGiaoAn(ga: GiaoAn, o: GenOpts): LessonPlan {
  const r = rng(o.seed + ga.title.length * 17);
  const M = MASCOTS.find((x) => x.id === o.mascot) ?? MASCOTS[0];
  const sc = o.scene, Tp = ga.title.replace(/^(Bài|Tiết|Chủ đề)\s*\d*[.:]?\s*/i, '').trim() || ga.title;
  const subj = ga.subjectLabel?.trim() || SUBJECT_NAMES[ga.subject] || 'Môn học';
  const cands: Cand[] = [];
  const add = (phase: PhaseId, k: string, t: string, s: Slide) => cands.push({ key: `${phase}:${k}`, phase, title: t, slide: s });

  add('bia', 'cover', 'Trang bìa', coverPage(ga.title.replace(/\s*\(tiết\s*\d+\)/i, ''), `${subj} · Lớp ${ga.grade}${ga.className ? ' ' + ga.className : ''}`, o.tiet ?? tietOf(ga.title), sc, M.src));

  // tình huống mở đầu (góc máy 'center')
  shuffle(SITU[sc], r).forEach((tpl, i) => {
    const line = fill(tpl, M.name, Tp); const m = mk();
    const ink = inkOf(sc);
    const p = I(m, M.src, 80, 460, 320);
    const b = S(m, 'bubble', 360, 140, 1020, 410, ink.pill, line, { stroke: ink.pillBorder, sw: 6, size: fit(line, 920, 320, 50, 28), color: ink.body } as Partial<El>);
    A(m, p, 'fly-left', 'with', { sound: 'whoosh' }); A(m, b, 'pop', 'after', { sound: 'pop' });
    add('kd', `situ${i}`, `Tình huống: ${line.slice(0, 60)}…`, page(m, 'kd', sc, 'Đọc tình huống, hỏi lớp: “Các em đoán hôm nay chúng ta học gì?”', undefined, 'center'));
  });
  add('kd', 'prep', 'Chuẩn bị đồ dùng học tập', prepPage(ga.subject, sc, M.src));

  // mục tiêu (yêu cầu cần đạt) — trình bày dạng Sổ tay dán băng dính (cảnh phải) hoặc Lưới Bento 2×2 kiểu Canva
  const goals = lines(ga.goals.knowledge, 4);
  if (goals.length) {
    const m = mk();
    const ink = inkOf(sc);
    const vr = bentoGrid(m, goals, M.src, true, sc);
    if (vr === 'right') {
      editorialHeader(m, 'MỤC TIÊU BÀI HỌC', 'Sau tiết học hôm nay, các em sẽ nắm vững:', sc);
    } else {
      title(m, 'Mục tiêu bài học', ink.title);
    }
    add('kp', 'goals', 'Mục tiêu bài học (Sổ tay / Bento)', page(m, 'kp', sc, 'Bấm “Tiếp” để hiện từng mục tiêu.', undefined, vr));
  }

  // mỗi hoạt động của giáo án → trang nhiệm vụ của học sinh (hiện lần lượt)
  for (const a of ga.activities) {
    const ph = ACT_PHASE[a.key] ?? 'kp';
    // bài không có trong ngân hàng nội dung: nhiệm vụ viết lại thành lời nói với học sinh (không chép nguyên câu "GV…/HS…")
    const tasks = (lines(a.student, 5).length ? lines(a.student, 5) : lines(a.teacher, 5)).map(studentVoice).filter(Boolean);
    if (!tasks.length) continue;
    const m = mk();
    const ink = inkOf(sc);
    let vr: SceneVariant = 'bottom';
    if (tasks.length === 3) {
      // Mẫu 4 (3-Step Torn-Plaid Header Cards — Slide 7: Bước 1 · Bước 2 · Bước 3)
      editorialHeader(m, a.title || PHASE_LABEL[ph], a.goal && short(a.goal, 120) ? a.goal : 'Các bước thực hành của lớp chúng mình', sc);
      tasks.forEach((t, i) => {
        const x = 92 + i * 485, y = 200, w = 445, h = 465;
        const card = S(m, 'plaid-card', x, y, w, h, '#faeedb', '', { stroke: '#c5d6b3', sw: 0, lock: true, shadow: true } as Partial<El>);
        T(m, `Bước ${i + 1}`, x + 55, y + 14, w - 110, 74, 34, '#111827', { font: 'baloo' });
        const tx = T(m, `✔ ${t}`, x + 32, y + 130, w - 64, h - 160, fit(t, w - 76, h - 175, 36, 22), '#1f2937', { align: 'left', font: 'quick' });
        A(m, card, 'fly-up', i === 0 ? 'with' : 'click', { sound: 'pop' });
        A(m, tx, 'fade', 'with');
      });
      takeawayStrip(m, 'Mỗi bước thực hành trên lớp đều giúp các em tự tin và hiểu bài sâu hơn!', sc);
      vr = 'bottom';
    } else if (tasks.length <= 4 && !a.goal) {
      vr = bentoGrid(m, tasks, M.src, true, sc);
      if (vr === 'right') {
        editorialHeader(m, a.title || PHASE_LABEL[ph], 'Cùng thực hiện các hoạt động trong tiết học nhé', sc);
      } else {
        title(m, a.title || PHASE_LABEL[ph], ink.title);
      }
    } else {
      title(m, a.title || PHASE_LABEL[ph], PHASES.find((p) => p.id === ph)?.color ?? ink.title);
      if (a.goal && short(a.goal, 140)) T(m, a.goal, 260, 145, 1080, 76, fit(a.goal, 1040, 68, 36, 22), '#475569', { font: 'quick', italic: true, bg: '#ffffffcc' });
      const top = a.goal ? 238 : 165, h = Math.min(118, (720 - top) / tasks.length - 14);
      tasks.forEach((t, i) => {
        const c = BENTO[i % BENTO.length];
        const id = T(m, `${CIRCLED[i] ?? i + 1}  ${t}`, 260, top + i * (h + 14), 1060, h, fit(t, 1020, h - 10, 42, 22), c.tx, { align: 'left', font: 'quick', bg: c.bg });
        A(m, id, 'fade', 'click', { sound: 'pop' });
      });
      I(m, M.src, 40, 640, 210, { lock: true });
    }
    add(ph, `act-${a.key}`, `${a.title}: nhiệm vụ của học sinh`, page(m, ph, sc, [a.goal && `Mục tiêu: ${a.goal}`, a.teacher && `GV:\n${a.teacher}`].filter(Boolean).join('\n'), undefined, vr));
    // các bước làm (3–6 bước ngắn) → trò Sắp xếp các bước (trang gợi ý, mặc định chưa chọn)
    const steps = lines(a.teacher, 6).filter((x) => short(x, 26));
    if (ph !== 'kd' && steps.length >= 3) {
      const m2 = mk(); const se = { id: uid(), kind: 'sort', x: 160, y: 120, w: 1280, h: 640, rot: 0, prompt: `Sắp xếp các bước: ${a.title}`, items: steps } as El;
      m2.els.push(se); A(m2, se.id, 'fade', 'with'); I(m2, M.src, 24, 700, 180, { lock: true });
      add(ph, `sort-${a.key}`, `Sắp xếp các bước: ${a.title}`, page(m2, ph, sc, `Thứ tự đúng: ${steps.join(' → ')}`));
    }
  }
  // thảo luận nhóm (Luyện tập)
  { const m = mk(); title(m, 'Thảo luận nhóm', '#15803d');
    const q = `Cùng bạn trong nhóm trao đổi: điều em học được trong bài “${Tp}” là gì?`;
    I(m, M.src, 80, 300, 360);
    const b = S(m, 'bubble', 480, 170, 980, 400, '#ffffff', q, { stroke: '#22c55e', sw: 6, size: fit(q, 900, 300, 52, 28), color: '#0f172a' } as Partial<El>);
    A(m, b, 'pop', 'with', { sound: 'pop' });
    T(m, '👥 Nhóm 4 · 3 phút', 640, 630, 680, 90, 42, '#166534', { bg: '#dcfce7' });
    add('lt', 'group', 'Thảo luận nhóm', page(m, 'lt', sc, 'Mời 2–3 nhóm trình bày, các nhóm khác nhận xét.')); }
  // liên hệ (Vận dụng — góc máy 'left': cảnh bên trái, chữ bên phải)
  LIENHE_OTHER.forEach((t, i) => {
    const line = fill(t, M.name, Tp); const m = mk();
    const ink = inkOf(sc);
    T(m, 'LIÊN HỆ THỰC TẾ', 640, 110, 860, 82, 52, ink.title, { align: 'left', role: 'title' });
    const b = S(m, 'bubble', 640, 210, 860, 410, ink.pill, line, { stroke: ink.pillBorder, sw: 6, size: fit(line, 780, 320, 48, 26), color: ink.body } as Partial<El>);
    A(m, b, 'pop', 'with', { sound: 'pop' });
    I(m, M.src, 1310, 585, 230);
    add('vd', `lh${i}`, `Liên hệ: ${line.slice(0, 56)}…`, page(m, 'vd', sc, 'Mời HS chia sẻ, cô nhận xét và khen.', undefined, 'left'));
  });
  // củng cố
  { const m = mk();
    const t = T(m, 'Cả lớp giỏi lắm!', 300, 40, 1000, 130, 88, '#b45309', { bg: '#ffffffd9' });
    T(m, `Hôm nay em đã học: ${Tp}`, 260, 190, 1080, 100, fit(Tp, 900, 90, 52, 28), '#1e3a8a', { bg: '#ffffffe6' });
    const c = I(m, ST('trophy'), 640, 300, 320);
    A(m, t, 'zoom', 'with'); A(m, c, 'drop', 'after', { sound: 'tada', dur: 1.2 });
    [0, 1, 2, 3, 4].forEach((i) => { const s2 = I(m, ST('star'), 220 + i * 240, 660, 160); A(m, s2, 'pop', 'click', { sound: 'star', dur: 0.4 }); });
    I(m, M.src, 1300, 330, 260, { lock: true });
    add('cc', 'stars', 'Sao thưởng · tổng kết', page(m, 'cc', sc, ga.assessment || 'Khen ngợi, nhận xét tiết học.', 'clap')); }
  { const m = mk();
    editorialHeader(m, 'DẶN DÒ CUỐI TIẾT', 'Cùng ghi nhớ và thực hiện ở nhà nhé:', sc);
    const va = ga.activities.find((a) => a.key === 'van-dung');
    const hw = lines(va?.teacher, 6).filter((l) => /dặn|về nhà|chuẩn bị|nhận xét/i.test(l));
    const list = (hw.length ? hw : ['Ôn lại bài đã học hôm nay', 'Vận dụng điều đã học ở nhà', 'Chuẩn bị đồ dùng cho bài sau']).slice(0, 3);
    list.forEach((item, i) => {
      const x = 92 + i * 485, y = 245, w = 445, h = 290;
      const note = S(m, 'sticky', x, y, w, h, '#f5c76b', '', { stroke: '#3f7d7a', sw: 0, lock: true, shadow: true } as Partial<El>);
      const tx = T(m, item, x + 28, y + 62, w - 56, h - 96, fit(item, w - 70, h - 110, 38, 24), '#111827', { font: 'baloo', italic: true });
      A(m, note, 'pop', i === 0 ? 'with' : 'after', { delay: i * 0.12 });
      A(m, tx, 'fade', 'with');
    });
    I(m, M.src, 1350, 620, 210, { lock: true });
    add('cc', 'home', 'Dặn dò (3 Giấy Note vàng)', page(m, 'cc', sc, '', undefined, 'bottom')); }
  add('cc', 'exit', 'Vé ra về · Tự đánh giá mức độ hiểu bài', exitTicketPage(sc, M.src));
  add('cc', 'board', 'Bảng thi đua tổ (điểm tuần của các tổ)', boardPage(sc));
  addPlanNotes(cands.filter((c) => c.key.startsWith('kd:situ')), ga);
  const P = finish(cands);
  // trang Sắp xếp các bước là gợi ý thêm: xếp cuối hoạt động, mặc định không chọn
  P.cands = [...P.cands.filter((c) => !c.key.includes(':sort-') && c.key !== 'kd:situ1'), ...P.cands.filter((c) => c.key.includes(':sort-') || c.key === 'kd:situ1')];
  P.cands = PHASES.flatMap((p) => P.cands.filter((c) => c.phase === p.id));
  for (const p of PHASES) P.defaults[p.id] = Math.min(P.defaults[p.id], P.cands.filter((c) => c.phase === p.id && !c.key.includes(':sort-')).length);
  return P;
}

function finish(cands: Cand[]): LessonPlan {
  const has = (p: PhaseId) => cands.filter((c) => c.phase === p).length;
  const defaults: Record<PhaseId, number> = { bia: 1, kd: Math.min(2, has('kd')), kp: Math.min(3, has('kp')), lt: Math.min(4, has('lt')), vd: Math.min(2, has('vd')), cc: Math.min(3, has('cc')) };
  // tình huống luôn là trang thứ 2 của Khởi động: đưa trang tình huống đầu lên vị trí số 2
  const kd = cands.filter((c) => c.phase === 'kd'); const si = kd.findIndex((c) => c.key.startsWith('kd:situ'));
  if (si > 1) { const [s] = kd.splice(si, 1); kd.splice(1, 0, s); }
  const rest = cands.filter((c) => c.phase !== 'kd');
  const all = [...rest.filter((c) => c.phase === 'bia'), ...kd, ...rest.filter((c) => c.phase !== 'bia')];
  return { cands: PHASES.flatMap((p) => all.filter((c) => c.phase === p.id)), defaults };
}

/** "Bài 10 (tiết 2)" → 2 */
export const tietOf = (t: string) => { const m = /tiết\s*(\d+)/i.exec(t); return m ? Number(m[1]) : undefined; };

/* ---------- bố cục chủ đề: khung nội dung, nhãn bài, hình thức làm bài, trang chia hoạt động ---------- */
export type WorkMode = 'ca-nhan' | 'nhom-2' | 'nhom-4' | 'ca-lop';
export const WORK_MODES: { id: WorkMode; label: string }[] = [
  { id: 'ca-nhan', label: '👤 Làm việc cá nhân' }, { id: 'nhom-2', label: '👥 Làm việc nhóm 2' }, { id: 'nhom-4', label: '👨‍👩‍👧‍👦 Thảo luận nhóm 4' }, { id: 'ca-lop', label: '🏫 Cả lớp' },
];
export const cardBackEl = (accent: string): El => ({ id: uid(), kind: 'shape', shape: 'round', x: 50, y: 40, w: 1524, h: 780, rot: 0, fill: accent, stroke: accent, sw: 0, op: 0.2, lock: true, role: 'cardback' } as El);
export const cardEl = (accent: string): El => ({ id: uid(), kind: 'shape', shape: 'round', x: 36, y: 26, w: 1524, h: 780, rot: 0, fill: 'rgba(255,255,255,0.78)', stroke: accent, sw: 6, shadow: true, lock: true, role: 'card' } as El);
export const boardEls = (accent: string): El[] => [cardBackEl(accent), cardEl(accent)];
export const badgeEl = (n: number, label: string, accent: string): El =>
  ({ id: uid(), kind: 'text', x: 56, y: 42, w: Math.min(360, 110 + label.length * 22), h: 66, rot: 0, text: `${CIRCLED[n - 1] ?? n} ${label}`, size: 34, color: '#ffffff', font: 'baloo', align: 'center', bg: accent, role: 'badge' } as El);
export const modeEl = (mode: WorkMode, accent: string): El =>
  ({ id: uid(), kind: 'text', x: 1180, y: 42, w: 360, h: 66, rot: 0, text: WORK_MODES.find((w) => w.id === mode)?.label ?? '', size: 28, color: accent, font: 'baloo', align: 'center', bg: '#fff7ed', role: 'mode' } as El);
/** Trang chia hoạt động: chữ tiêu đề căn trái trên khoảng trời thoáng + cảnh nền bên phải (góc máy 'cover') */
export function dividerSlide(label: string, sc: SceneKind | undefined, mascot = MASCOTS[0].src, sub = ''): Slide {
  const m = mk();
  const ink = inkOf(sc);
  const strokeCol = sc === 'space' ? '#0f172a' : '#ffffff';
  const t = T(m, label.toUpperCase(), 96, 210, 860, 240, fit(label, 840, 220, 140, 64), ink.title, { align: 'left', stroke: strokeCol, strokeW: 12, shadow: true, role: 'divider' });
  if (sub) T(m, sub, 100, 470, 420, 74, fit(sub, 380, 64, 38, 24), '#ffffff', { font: 'quick', bg: ink.title, role: 'mode' });
  const p = I(m, mascot, 1320, 580, 250);
  A(m, t, 'zoom', 'with', { dur: 0.7, sound: 'magic' }); A(m, p, 'fly-right', 'after');
  return { id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'zoom', notes: '', scene: sc, sceneVariant: 'cover', phase: label };
}
/** nhãn bài + hình thức làm bài mặc định theo dạng trang */
function labelOf(title: string, math: boolean): [string, WorkMode] | null {
  if (title.startsWith('Số ?') || title.startsWith('Trả lời nhanh')) return [math ? 'Số ?' : 'Trả lời', 'ca-nhan'];
  if (title.startsWith('Chọn đáp án')) return ['Chọn', 'ca-lop'];
  if (title.startsWith('Đúng hay sai')) return ['Đúng/Sai', 'ca-lop'];
  if (title.startsWith('Sắp xếp')) return ['Sắp xếp', 'nhom-2'];
  if (title.startsWith('Ghép đôi')) return ['Nối', 'nhom-2'];
  if (title.startsWith('Hỏi – đáp')) return [math ? 'Tính' : 'Trả lời', 'ca-nhan'];
  return null;
}
/** set: áp bộ chủ đề (nền, khung, màu chữ, font tiêu đề) lên cả bài thay cho cảnh minh hoạ */
export type BuildOpts = { dividers?: boolean; mascot?: string; math?: boolean; set?: SetId };

/** Các trang đã chọn (theo thứ tự hoạt động), lắp bố cục chủ đề: khung nội dung, nhãn ①②③, hình thức làm bài, trang chia hoạt động */
export function planSlides(plan: LessonPlan, on: Set<string>, scenes: Record<string, SceneKind | ''>, o: BuildOpts = {}): Slide[] {
  const out: Slide[] = []; let n = 0; let lastPhase: PhaseId | null = null;
  for (const c of plan.cands) {
    if (!on.has(c.key)) continue;
    const sc = scenes[c.key] === undefined ? c.slide.scene : (scenes[c.key] || undefined);
    const ac = accentOf(sc);
    if (o.dividers && c.phase !== 'bia' && c.phase !== lastPhase) {
      const ph = PHASES.find((p) => p.id === c.phase)!;
      out.push(dividerSlide(c.phase === 'cc' ? 'Củng cố' : ph.label, sc, o.mascot, ph.time));
    }
    lastPhase = c.phase;
    const s: Slide = { ...c.slide, scene: sc, els: [...c.slide.els], anims: [...c.slide.anims] };
    const isScenicLayout = s.sceneVariant === 'cover' || s.sceneVariant === 'center' || s.sceneVariant === 'right' || s.sceneVariant === 'left';
    const content = (c.phase === 'kp' || c.phase === 'lt' || c.phase === 'vd') && !c.key.includes('situ') && !isScenicLayout && !s.els.some((e) => e.role === 'card');
    if (content) {
      s.els = [...boardEls(ac), ...s.els.map((e) => (e.role === 'title' && e.kind === 'text' ? { ...e, bg: '', color: ac } : e))];
      const lb = c.phase === 'lt' ? labelOf(c.title, !!o.math) : null;
      if (lb) {
        // nhãn dạng bài / hình thức làm việc chỉ gắn khi không đè lên chữ hay trò chơi của trang
        const be = badgeEl(n + 1, lb[0], ac), me = modeEl(lb[1], ac);
        const clear = (b: El) => !s.els.some((e) => ((e.kind === 'text' && !!e.text.trim()) || e.kind === 'quiz' || e.kind === 'sort' || e.kind === 'drop') && e.x < b.x + b.w && e.x + e.w > b.x && e.y < b.y + b.h && e.y + e.h > b.y);
        if (clear(be) && clear(me)) { n++; s.els.push(be, me); }
      }
    }
    // trang nội dung không đặt góc máy riêng → nền dịu (cảnh đầy đủ chỉ ở bìa, trang chia, tình huống)
    if (sc && !s.sceneVariant && c.phase !== 'bia') s.sceneVariant = 'bottom'; // phong cảnh ở đáy trang, chữ ở phần trời thoáng
    if (c.phase !== 'bia') s.els.push(...progressEls(c.phase));
    out.push(s);
  }
  // nền = phong cảnh của cảnh minh hoạ, bỏ hình dán 3D / con vật (cô tự chèn sau trong trình soạn)
  const pat = out.map(bareScene);
  return o.set ? applySet(pat, o.set) : pat;
}

/** thanh tiến trình 5 bước của tiết dạy ở mép trên trang: bước hiện tại đậm, bước đã qua nhạt, bước sau xám */
const STEP_IDS: PhaseId[] = ['kd', 'kp', 'lt', 'vd', 'cc'];
export function progressEls(phase: PhaseId): El[] {
  const cur = STEP_IDS.indexOf(phase), w = 92, gap = 10, x0 = (1600 - (5 * w + 4 * gap)) / 2;
  return STEP_IDS.map((id, i) => {
    const col = PHASES.find((p) => p.id === id)!.color;
    return { id: uid(), kind: 'shape', shape: 'round', x: x0 + i * (w + gap), y: 8, w, h: 12, rot: 0, rad: 100,
      fill: i <= cur ? col : '#cbd5e1', stroke: 'transparent', sw: 0, op: i === cur ? 1 : i < cur ? 0.5 : 0.7, lock: true, shadow: false, group: 'tien-trinh' } as El;
  });
}

/** Đổi chủ đề cả bài: cảnh nền mọi trang + màu khung / nhãn / chữ trang chia theo chủ đề mới */
export function applyTheme(slides: Slide[], sc: SceneKind): Slide[] {
  const ac = accentOf(sc);
  const ink = inkOf(sc);
  return slides.map((s) => ({ ...s, scene: sc, els: s.els.map((e) => {
    if (e.role === 'card' && e.kind === 'shape') return { ...e, stroke: ac };
    if (e.role === 'cardback' && e.kind === 'shape') return { ...e, fill: ac, stroke: ac };
    if (e.role === 'badge' && e.kind === 'text') return { ...e, bg: e.bg === '#ffffff' ? e.bg : ac, color: e.bg === '#ffffff' ? ac : e.color };
    if (e.role === 'mode' && e.kind === 'text') return e.bg === '#fff7ed' ? { ...e, color: ac } : { ...e, bg: ac };
    if ((e.role === 'divider' || e.role === 'title') && e.kind === 'text') return { ...e, color: ink.title };
    return e;
  }) }));
}


/* ================= Hoạt động theo gợi ý dạy =================
 * Gợi ý (hoạt động trong giáo án / ngân hàng ý tưởng) quyết định HÌNH THỨC trang (rung chuông, hộp quà, tiếp sức, đóng vai…);
 * NỘI DUNG lấy từ chính bài học (câu hỏi, kiến thức, bài đọc, từ ngữ). Các bước tổ chức của cô nằm trong ghi chú, không in lên trang. */
export type ActivitySpec = { title: string; text: string; steps: string[]; phase: PhaseId; mins: number; /** tên dạng bài giáo án giao (ưu tiên câu đúng dạng) */ forms?: string[] };
export type ActFormat = 'bell' | 'box' | 'wheel' | 'puzzle' | 'race' | 'sort' | 'match' | 'role' | 'read' | 'write' | 'explore' | 'reflect' | 'home';
const FORMAT_RULES: [ActFormat, RegExp][] = [
  ['reflect', /thẻ ra về|tự đánh giá|ghế nóng|bàn tay|cây ước/],
  ['wheel', /vòng quay/],
  ['puzzle', /mảnh ghép|ô chữ/],
  ['box', /hộp|truyền|quà|bốc thăm|hái hoa/],
  ['race', /tiếp sức|hai đội|đội nào|thi đua|bingo/],
  ['sort', /sắp xếp|xếp hàng|thứ tự|kể nối tiếp/],
  ['match', /ghép|nối từ|nối cột|tìm bạn|domino|slap|câu cá|săn chữ|thám tử/],
  ['bell', /rung chuông|bảng con|ai nhanh|bắn tên|trả lời nhanh|đố vui/],
  ['role', /đóng vai|phóng viên|hỏi – đáp|hỏi đáp|phỏng vấn|gõ cửa|nói theo|nói 1–2 câu|kể chuyện|bài toán gắn/],
  ['read', /đọc|flashcard|chant|hát/],
  ['write', /viết|chính tả/],
  ['explore', /quan sát|khám phá|tìm hiểu|thám tử|nhận xét|rút ra|hình thành|giới thiệu/],
  ['home', /về nhà|bố mẹ|phụ huynh/],
];
/** hình thức hợp với từng bước tiết dạy (gợi ý chọn hình thức không hợp bước thì dùng mặc định của bước) */
const PHASE_OK: Record<PhaseId, ActFormat[]> = {
  bia: ['explore'], kd: ['bell', 'box', 'wheel', 'puzzle', 'race', 'match', 'sort', 'role'],
  kp: ['explore', 'read', 'write', 'role', 'sort', 'match', 'bell'], lt: ['bell', 'race', 'sort', 'match', 'box', 'wheel', 'puzzle', 'write', 'read'],
  vd: ['role', 'race', 'bell', 'write', 'home', 'reflect'], cc: ['reflect', 'home', 'bell'],
};
const PHASE_FORMAT: Record<PhaseId, ActFormat> = { bia: 'explore', kd: 'box', kp: 'explore', lt: 'bell', vd: 'role', cc: 'reflect' };
export function formatOf(a: ActivitySpec): ActFormat {
  // tên hoạt động quyết định trước, rồi đến mô tả / các bước
  for (const src of [a.title, `${a.text} ${a.steps.join(' ')}`]) {
    const t = src.toLowerCase();
    for (const [f, re] of FORMAT_RULES) if (re.test(t)) return PHASE_OK[a.phase].includes(f) ? f : PHASE_FORMAT[a.phase];
  }
  return PHASE_FORMAT[a.phase];
}

export type ActCtx = {
  take: (f: (q: Q) => boolean) => Q | undefined;
  M: (typeof MASCOTS)[number]; sc: SceneKind; Tp: string; subject: string; know: Knowledge;
  passage?: string; pairs: [string, string][]; formCode: (name: string) => string | undefined;
  /** số lần đã dùng câu gợi ý nói (đóng vai hết câu hỏi) — mỗi lần một câu khác */ talk: number;
  /** bài đọc đã trình chiếu */ readDone: boolean;
};
/** bối cảnh nội dung của một bài để dựng các hoạt động (câu đã dùng không lặp lại) */
export function actCtx(lesson: ContentLesson, know: Knowledge, o: GenOpts, formNames: Record<string, string> = {}, used = new Set<ContentQuestion>(), shared?: Q[]): ActCtx {
  // shared: dùng chung danh sách câu với bộ dựng khác để câu đã dùng không lặp lại
  const qs = shared ?? shuffle(lesson.questions.map(splitQ), rng(o.seed + lesson.id.length * 13));
  const mt = qs.find((q) => q.type === 'matching' && (q.left?.length ?? 0) >= 2);
  const mp = (mt ? key(mt).pairs : undefined) as Record<string, string> | undefined;
  const pairs = mt && mp ? (mt.left ?? []).map((l) => [l, String(mp[l] ?? '')] as [string, string]).filter(([, v]) => v) : [];
  return {
    take: (f) => { const q = qs.find((x) => !used.has(x) && f(x)); if (q) qs.forEach((x) => { if (x.ask === q.ask) used.add(x); }); return q; },
    talk: 0, readDone: false,
    M: MASCOTS.find((x) => x.id === o.mascot) ?? MASCOTS[0], sc: o.scene, Tp: topicOf(lesson), subject: lesson.subject, know,
    passage: qs.find((q) => q.passage)?.passage, pairs,
    formCode: (name) => formNames[name.trim().toLowerCase()],
  };
}

const LEVEL_OK: Record<PhaseId, (l: number) => boolean> = { bia: () => true, kd: (l) => l <= 2, kp: (l) => l <= 2, lt: (l) => l >= 2 && l <= 3, vd: (l) => l >= 3, cc: () => true };
const answerOfQ = (q: Q) => (q.type === 'fill_blank' ? accepted(q) : correct(q));
const shortQ = (q: Q) => !q.passage && short(q.ask.replace(/\n/g, ' '), 90) && (q.type === 'single_choice' || q.type === 'fill_blank' || q.type === 'true_false') && !!answerOfQ(q);
/** lấy câu hợp bước tiết dạy, ưu tiên đúng dạng bài gợi ý giao; thiếu thì nới dần */
function pickQ(c: ActCtx, a: ActivitySpec, f: (q: Q) => boolean): Q | undefined {
  const codes = new Set((a.forms ?? []).map(c.formCode).filter(Boolean));
  const lv = LEVEL_OK[a.phase];
  return (codes.size ? c.take((q) => f(q) && codes.has(q.form) && lv(q.level)) ?? c.take((q) => f(q) && codes.has(q.form)) : undefined)
    ?? c.take((q) => f(q) && lv(q.level)) ?? c.take(f);
}
/** ghi chú cho cô: tên hoạt động, thời gian, các bước tổ chức (+ đáp án) */
const teachNotes = (a: ActivitySpec, extra = '') => [`${a.title} (${a.mins} phút)`, ...a.steps.map((s, i) => `${i + 1}. ${s}`), extra].filter(Boolean).join('\n');
type Built = { title: string; slide: Slide };

function bellPages(a: ActivitySpec, c: ActCtx): Built[] {
  const n = Math.max(1, Math.min(4, Math.round(a.mins / (a.phase === 'lt' ? 3 : 2.5))));
  const out: Built[] = [];
  for (let i = 0; i < n; i++) {
    const q = pickQ(c, a, (x) => !x.passage && short(x.ask, 170) && x.type !== 'matching');
    if (!q) break;
    const g = qPage(q, c.M.src, c.sc, a.phase, a.title);
    if (g) out.push(g);
  }
  return out;
}
function boxPage(a: ActivitySpec, c: ActCtx): Built[] {
  const boxBody = (q: Q) => q.ask + (q.type === 'single_choice' ? `\n(${q.options.join(' · ')})` : '');
  const gs = [0, 1, 2].map(() => pickQ(c, a, (q) => shortQ(q) && fit(boxBody(q), 380, 260, 40, 24) >= 28)).filter(Boolean) as Q[];
  if (gs.length < 2) return [];
  const m = mk(); title(m, a.title, '#be123c');
  gs.forEach((q, i) => {
    const x = 800 - (gs.length * 470) / 2 + i * 470;
    const g = I(m, ST('wrapped-gift'), x + 100, 250, 270, { name: `Hộp quà ${i + 1}` });
    const n = T(m, String(i + 1), x + 200, 540, 70, 70, 48, '#ffffff', { bg: '#e11d48' });
    const body = q.ask + (q.type === 'single_choice' ? `\n(${q.options.join(' · ')})` : '');
    const cd = S(m, 'bubble', x + 20, 200, 430, 380, '#ffffff', body, { stroke: '#f43f5e', sw: 5, size: fit(body, 380, 260, 40, 24) } as Partial<El>);
    A(m, g, 'zoom-out', 'click', { trigger: g, sound: 'magic', dur: 0.5 }); A(m, n, 'fade-out', 'with', { trigger: g }); A(m, cd, 'pop', 'after', { trigger: g, sound: 'tada' });
  });
  return [{ title: `${a.title}: ${gs.length} hộp câu hỏi của bài`, slide: page(m, a.phase, c.sc, teachNotes(a, gs.map((q, i) => `Hộp ${i + 1}: ${answerOfQ(q)}`).join('\n')), 'drum') }];
}
function wheelPage(a: ActivitySpec, c: ActCtx): Built[] {
  const q = pickQ(c, a, shortQ); if (!q) return [];
  const m = mk(); title(m, a.title, '#9a3412');
  const wh = S(m, 'wheel', 240, 180, 480, 480, '#fbbf24', '?', { stroke: '#f59e0b', sw: 6, size: 96, color: '#9a3412' } as Partial<El>);
  const btn = S(m, 'arrow', 760, 290, 230, 110, '#ef4444', 'Quay', { stroke: '#b91c1c', sw: 5, size: 40, color: '#ffffff', rot: 180 } as Partial<El>);
  const cd = S(m, 'bubble', 760, 430, 640, 340, '#ffffff', q.ask, { stroke: '#f97316', sw: 5, size: fit(q.ask, 560, 230, 44, 28) } as Partial<El>);
  A(m, wh, 'spin', 'click', { trigger: btn, dur: 2.4, sound: 'drum' }); A(m, cd, 'pop', 'after', { trigger: btn, sound: 'tada' });
  return [{ title: `${a.title}: câu hỏi của bài`, slide: page(m, a.phase, c.sc, teachNotes(a, `Đáp án: ${answerOfQ(q)}`)) }];
}
function puzzlePage(a: ActivitySpec, c: ActCtx): Built[] {
  const ps = [0, 1, 2, 3].map(() => pickQ(c, a, (q) => shortQ(q) && fit(q.ask, 390, 195, 34, 24) >= 28)).filter(Boolean) as Q[];
  if (ps.length < 2) return [];
  const m = mk(); title(m, a.title, '#6d28d9');
  S(m, 'round', 520, 175, 560, 520, '#fef3c7', '', { stroke: '#f59e0b', sw: 6, lock: true } as Partial<El>);
  I(m, ST(c.subject === 'toan' ? 'abacus' : c.subject === 'tieng-anh' ? 'open-book' : 'sunflower'), 660, 205, 280, { lock: true, name: c.Tp });
  T(m, c.Tp, 545, 505, 510, 160, fit(c.Tp, 480, 145, 48, 28), '#b45309', { bg: '#ffffffeb', lock: true });
  const col: [string, string][] = [['#fbbf24', '#d97706'], ['#38bdf8', '#0284c7'], ['#4ade80', '#16a34a'], ['#f472b6', '#db2777']];
  ps.forEach((q, i) => {
    const cx = i % 2, row = Math.floor(i / 2);
    S(m, 'round', cx === 0 ? 64 : 1106, 185 + row * 265, 430, 235, '#ffffff', `${CIRCLED[i]} ${q.ask}`, { stroke: col[i][1], sw: 5, size: fit(q.ask, 390, 195, 34, 24), color: '#0f172a' } as Partial<El>);
    const piece = S(m, 'mystery', 520 + cx * 280, 175 + row * 260, 280, 260, col[i][0], `Mảnh ${i + 1}`, { stroke: col[i][1], sw: 5, color: '#ffffff', size: 44 } as Partial<El>);
    A(m, piece, 'zoom-out', 'click', { trigger: piece, sound: 'magic', dur: 0.5 });
  });
  return [{ title: `${a.title}: ${ps.length} câu mở mảnh ghép`, slide: page(m, a.phase, c.sc, teachNotes(a, ps.map((q, i) => `Mảnh ${i + 1}: ${answerOfQ(q)}`).join('\n')), 'drum') }];
}
/** tiếp sức hai đội: mỗi đội cùng số câu của bài, đáp án che, bấm để mở */
function racePage(a: ActivitySpec, c: ActCtx): Built[] {
  const ok = (q: Q) => shortQ(q) && short(q.ask.replace(/\n/g, ' '), 64) && short(answerOfQ(q), 14);
  const qs = [0, 1, 2, 3, 4, 5].map(() => pickQ(c, a, ok)).filter(Boolean) as Q[];
  if (qs.length < 4) return [];
  const per = Math.floor(qs.length / 2);
  const m = mk(); title(m, a.title, '#0f172a');
  const teams: [string, string, string][] = [['🔴 Đội Đỏ', '#ef4444', '#fef2f2'], ['🔵 Đội Xanh', '#2563eb', '#eff6ff']];
  teams.forEach(([name, colr, bg], t) => {
    const x = t ? 820 : 100;
    T(m, name, x, 145, 680, 70, 40, '#ffffff', { bg: colr });
    qs.slice(t * per, t * per + per).forEach((q, i) => {
      const y = 235 + i * 185, ask = q.ask.replace(/\n/g, ' ').replace(/\s*(\.\.\.|…|_{2,})\s*/g, ' ? ').trim(), ans = answerOfQ(q);
      T(m, ask, x, y, 470, 160, fit(ask, 430, 140, 44, 28), '#0f172a', { align: 'left', bg });
      T(m, ans, x + 490, y, 190, 160, fit(ans, 170, 140, 60, 28), colr, { bg: '#ffffff' });
      const cv = S(m, 'mystery', x + 490, y, 190, 160, '#fde68a', '?', { stroke: '#f59e0b', sw: 5, color: '#92400e', size: 70 } as Partial<El>);
      A(m, cv, 'zoom-out', 'click', { trigger: cv, sound: 'pop', dur: 0.35 });
    });
  });
  const notes = teachNotes(a, qs.slice(0, per * 2).map((q, i) => `${i < per ? 'Đỏ' : 'Xanh'} ${(i % per) + 1}: ${answerOfQ(q)}`).join('\n'));
  return [{ title: `${a.title}: hai đội, ${per * 2} câu của bài`, slide: { ...page(m, a.phase, c.sc, notes), tool: { teams: true, label: a.title } } }];
}
function typedPage(a: ActivitySpec, c: ActCtx, type: 'ordering' | 'matching'): Built[] {
  for (let k = 0; k < 3; k++) {
    const q = pickQ(c, a, (x) => x.type === type && !x.passage);
    if (!q) return [];
    const g = qPage(q, c.M.src, c.sc, a.phase);
    if (g) return [g];
  }
  return [];
}
/** đóng vai / hỏi – đáp: hai bạn nói với nhau bằng nội dung của bài */
function rolePage(a: ActivitySpec, c: ActCtx): Built[] {
  const m = mk(); title(m, a.title, '#7c3aed');
  I(m, ST('boy'), 60, 480, 280, { lock: true }); I(m, ST('girl'), 1260, 480, 280, { lock: true });
  const q = pickQ(c, a, (x) => shortQ(x) || (!x.passage && x.type === 'fill_blank' && short(x.ask, 150) && !!accepted(x)));
  if (q) {
    const ask = q.ask, ans = answerOfQ(q);
    const b1 = S(m, 'bubble', 300, 160, 900, 300, '#ffffff', ask, { stroke: '#8b5cf6', sw: 5, size: fit(ask, 820, 220, 46, 28) } as Partial<El>);
    S(m, 'bubble', 560, 490, 660, 230, '#f5f3ff', ans, { stroke: '#8b5cf6', sw: 5, size: fit(ans, 580, 150, 56, 30), flip: true } as Partial<El>);
    const cv = S(m, 'mystery', 560, 490, 660, 230, '#fde68a', '?', { stroke: '#f59e0b', sw: 5, color: '#92400e', size: 90 } as Partial<El>);
    A(m, b1, 'pop', 'with', { sound: 'pop' }); A(m, cv, 'zoom-out', 'click', { trigger: cv, sound: 'tada' });
    return [{ title: `${a.title}: hỏi – đáp bằng câu của bài`, slide: page(m, a.phase, c.sc, teachNotes(a, `Bạn A hỏi, bạn B trả lời. Đáp án: ${ans}`), undefined, 'bottom') }];
  }
  // hết câu hỏi: nói với bạn, dùng từ ngữ của bài
  const words = c.pairs.map(([l]) => l).filter((w) => w.length <= 14).slice(0, 4);
  const talks = LIENHE[c.subject] ?? LIENHE.toan;
  const line = fill(talks[c.talk++ % talks.length], c.M.name, c.Tp);
  S(m, 'bubble', 300, 160, 1000, 300, '#ffffff', line, { stroke: '#8b5cf6', sw: 5, size: fit(line, 900, 220, 46, 28) } as Partial<El>);
  words.forEach((w, i) => T(m, w, 380 + i * 220, 520, 200, 90, fit(w, 180, 70, 44, 28), '#5b21b6', { bg: '#ede9fe' }));
  return [{ title: `${a.title}: nói với bạn bằng từ ngữ của bài`, slide: page(m, a.phase, c.sc, teachNotes(a), undefined, 'bottom') }];
}
/** đọc: bài đọc của bài (tách trang) hoặc thẻ từ mới có miếng che nghĩa */
function readPages(a: ActivitySpec, c: ActCtx): Built[] {
  if (c.passage && !c.readDone) {
    c.readDone = true; // bài đọc chỉ trình chiếu một lần trong bài
    return readingChunks(c.passage).map((txt, i, all) => {
      const m = mk(); title(m, all.length > 1 ? `${a.title} (${i + 1}/${all.length})` : a.title, '#7c2d12');
      T(m, txt, 200, 150, 1200, 640, fit(txt, 1140, 600, 52, 32), '#1f2937', { align: 'left', font: 'quick', bg: '#fffbeb' });
      return { title: `${a.title}: bài đọc ${i + 1}/${all.length}`, slide: page(m, a.phase, c.sc, i ? '' : teachNotes(a)) };
    });
  }
  if (c.pairs.length >= 2) {
    const m = mk(); title(m, a.title, '#6d28d9');
    c.pairs.slice(0, 4).forEach(([l, rr], i) => {
      const bx = 92 + (i % 2) * 708, by = 175 + Math.floor(i / 2) * 285, bc = BENTO[i % BENTO.length];
      S(m, 'round', bx, by, 676, 245, bc.bg, '', { stroke: bc.bd, sw: 5, lock: true } as Partial<El>);
      T(m, l, bx + 20, by + 28, 300, 188, fit(l, 280, 170, 64, 28), bc.tx, { bg: '#ffffffeb' });
      T(m, rr, bx + 340, by + 28, 316, 188, fit(rr, 296, 170, 56, 28), '#15803d', { bg: '#dcfce7' });
      cover(m, bx + 340, by + 28, 316, 188);
    });
    return [{ title: `${a.title}: thẻ từ của bài`, slide: page(m, a.phase, c.sc, teachNotes(a)) }];
  }
  return [];
}
/** viết: từ ngữ / kết quả của bài viết to bằng chữ tập viết để học sinh viết bảng con */
function writePage(a: ActivitySpec, c: ActCtx): Built[] {
  const words = c.pairs.map(([l]) => l);
  for (let k = 0; words.length < 4 && k < 6; k++) { const q = pickQ(c, a, (x) => x.type === 'fill_blank' && !!accepted(x) && short(accepted(x), 14)); if (q) words.push(accepted(q)); }
  const ws = [...new Set(words)].slice(0, 4);
  if (!ws.length) return [];
  const m = mk(); title(m, a.title, '#0f766e');
  ws.forEach((w, i) => {
    const y = 170 + i * 165;
    S(m, 'round', 160, y, 1280, 145, '#ffffff', '', { stroke: '#99f6e4', sw: 4, lock: true, dash: 'dash' } as Partial<El>);
    const t = T(m, w, 200, y + 8, 1200, 130, fit(w, 1180, 120, 92, 40), '#0f172a', { font: 'hand' });
    A(m, t, 'fade', i ? 'click' : 'with');
  });
  return [{ title: `${a.title}: ${ws.length} từ của bài`, slide: page(m, a.phase, c.sc, teachNotes(a, 'Học sinh viết vào bảng con, giơ bảng, cô nhận xét.')) }];
}
/** khám phá: kiến thức cần nhớ của bài (hiện lần lượt) + ví dụ có miếng che */
function explorePages(a: ActivitySpec, c: ActCtx): Built[] {
  const out: Built[] = [];
  if (!c.know?.points?.length && c.passage && !c.readDone) out.push(...readPages({ ...a, title: 'Đọc bài' }, c));
  if (c.know?.points?.length) {
    const m = mk(); const ink = inkOf(c.sc);
    const vr = bentoGrid(m, c.know.points, c.M.src, true, c.sc);
    if (vr === 'right') editorialHeader(m, 'KIẾN THỨC CẦN NHỚ', 'Những điểm quan trọng giúp em làm tốt bài học hôm nay', c.sc); else title(m, 'Kiến thức cần nhớ', ink.title);
    out.push({ title: 'Kiến thức cần nhớ của bài', slide: page(m, a.phase, c.sc, teachNotes(a), undefined, vr) });
  }
  if (c.know?.example) {
    const m = mk(); title(m, 'Cùng làm ví dụ', '#0369a1');
    const parts = c.know.example.split('→').map((s) => s.trim()).filter(Boolean), n = parts.length, w = Math.min(520, 1240 / n - 30);
    parts.forEach((t, i) => {
      const x = 180 + i * (w + 40);
      const id = T(m, t, x, 330, w, 220, fit(t, w - 20, 200, 64, 28), i === n - 1 ? '#15803d' : '#0f172a', { bg: '#ffffffe6' });
      if (i > 0 && i < n - 1) A(m, id, 'fade', 'click', { sound: 'pop' });
      if (i < n - 1) T(m, '➜', x + w, 400, 40, 80, 50, '#f59e0b');
      if (i === n - 1 && n > 1) cover(m, x, 330, w, 220);
    });
    out.push({ title: 'Ví dụ của bài (miếng che đáp án)', slide: page(m, a.phase, c.sc, out.length ? '' : teachNotes(a)) });
  }
  if (out.length < 2) {
    const q = pickQ(c, a, (x) => (x.type === 'fill_blank' || x.type === 'single_choice') && !x.passage && short(x.ask, 170) && !!answerOfQ(x));
    const g = q && qPage({ ...q, type: 'fill_blank', key: { accepted: [answerOfQ(q)] } } as Q, c.M.src, c.sc, a.phase, 'Cùng tìm hiểu');
    if (g) out.push(g);
  }
  return out;
}
function homePage(a: ActivitySpec, c: ActCtx): Built[] {
  const m = mk(); editorialHeader(m, 'NHIỆM VỤ VỀ NHÀ', `Luyện thêm bài “${c.Tp}” cùng bố mẹ`, c.sc);
  (HOMEWORK[c.subject] ?? HOMEWORK.toan).split('\n').map((x) => x.replace(/^•\s*/, '')).slice(0, 3).forEach((item, i) => {
    const x = 92 + i * 485, y = 245, w = 445, h = 290;
    const note = S(m, 'sticky', x, y, w, h, '#f5c76b', '', { stroke: '#3f7d7a', sw: 0, lock: true, shadow: true } as Partial<El>);
    const tx = T(m, item, x + 28, y + 62, w - 56, h - 96, fit(item, w - 70, h - 110, 40, 28), '#111827', { font: 'baloo', italic: true });
    A(m, note, 'pop', i === 0 ? 'with' : 'after', { delay: i * 0.12 }); A(m, tx, 'fade', 'with');
  });
  return [{ title: `${a.title}: nhiệm vụ về nhà`, slide: page(m, a.phase, c.sc, teachNotes(a), undefined, 'bottom') }];
}
const BUILDERS: Record<ActFormat, (a: ActivitySpec, c: ActCtx) => Built[]> = {
  bell: bellPages, box: boxPage, wheel: wheelPage, puzzle: puzzlePage, race: racePage,
  sort: (a, c) => typedPage(a, c, 'ordering'), match: (a, c) => typedPage(a, c, 'matching'),
  role: rolePage, read: readPages, write: writePage, explore: explorePages, home: homePage,
  reflect: (a, c) => [{ title: 'Vé ra về · tự đánh giá', slide: exitTicketPage(c.sc, c.M.src) }],
};
/** các trang của một hoạt động: đúng hình thức gợi ý, nội dung của bài; bài thiếu nội dung cho hình thức đó thì dùng hình thức gần nhất */
export function activityPages(a: ActivitySpec, c: ActCtx, fmt: ActFormat = formatOf(a)): { format: ActFormat; pages: Built[] } {
  for (const f of [...new Set([fmt, PHASE_FORMAT[a.phase], 'bell'] as ActFormat[])]) {
    const pages = BUILDERS[f](a, c);
    if (!pages.length) continue;
    // ghi chú hướng dẫn tổ chức luôn ở trang đầu của hoạt động; số phút để màn hình của cô đếm giờ
    const first = pages[0].slide;
    const notes = first.notes.startsWith(`${a.title} (`) ? first.notes : teachNotes(a, first.notes);
    pages[0] = { ...pages[0], slide: { ...first, notes, mins: a.mins } };
    return { format: f, pages };
  }
  return { format: fmt, pages: [] };
}

/** tên dạng bài (chữ thường) → mã dạng bài của môn — để hoạt động giáo án "giao các dạng bài" chọn đúng câu */
function formNamesOf(subject: string): Record<string, string> {
  if (subject !== 'toan' && subject !== 'tieng-viet' && subject !== 'tieng-anh') return {};
  return Object.fromEntries(formsOf(subject).map((f) => [f.name.trim().toLowerCase(), f.code]));
}
/** các dòng "+ tên dạng bài" trong phần việc của giáo viên */
function formsInText(t: string): string[] {
  return t.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('+')).map((l) => l.slice(1).trim());
}
/** mô tả bài ("Sách: A; B. Luyện tập: X; Y.") → các mục cho học sinh: 📖 Đọc bài…, ✏️ …, 💬 Mẫu câu… */
export function learnItems(desc: string): string[] {
  const out: string[] = [];
  for (const seg of desc.split(/\.\s+(?=\S)/)) {
    const m = /^(Sách|Đọc|Luyện tập|Luyện từ và câu|Mẫu câu|Viết|Nói và nghe)\s*:\s*(.*)$/i.exec(seg.trim());
    const label = m?.[1].toLowerCase(), body = (m ? m[2] : seg).replace(/\.\s*$/, '').trim();
    if (!body) continue;
    if (label === 'sách' || label === 'đọc') out.push(`📖 Đọc bài: ${body.split(/;\s*/).join(', ')}`);
    else if (label === 'mẫu câu') out.push(`💬 Mẫu câu: ${body}`);
    else body.split(/;\s*/).filter(Boolean).forEach((x) => out.push(`✏️ ${x.charAt(0).toUpperCase()}${x.slice(1)}`));
  }
  // mục dài (danh sách từ vựng…) cắt gọn để chữ đủ to
  return out.slice(0, 4).map((x) => (x.length > 58 ? x.slice(0, 55).replace(/[,;\s]+[^,;\s]*$/, '') + ', …' : x));
}
/** câu trong giáo án → lời nói với học sinh: bỏ "GV cho/yêu cầu HS…", "HS" → "em", viết hoa đầu câu */
export function studentVoice(t: string): string {
  const s = t.replace(/^(GV|Giáo viên)\s+(cho|yêu cầu|hướng dẫn|tổ chức cho|mời|gọi)?\s*(HS|học sinh)?\s*/i, '')
    .replace(/^(HS|Học sinh)\s+/i, '')
    .replace(/\b(HS|học sinh)\b/g, 'em')
    .replace(/\.$/, '')
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
/** tên hoạt động trên trang: tên trò trong ngoặc kép của giáo án (“Ai nhanh – Ai đúng”) hoặc tên bước, bỏ số thứ tự đầu dòng */
function activityName(title: string, teacher: string, ph: PhaseId): string {
  const game = /(?:trò chơi|chơi)\s*[“"]([^”"]{3,40})[”"]/i.exec(teacher)?.[1];
  if (game) return game;
  return (title || PHASE_LABEL[ph]).replace(/^\s*\d+\s*[.)]\s*/, '').trim() || PHASE_LABEL[ph];
}

/* ================= Cảnh nền chỉ phong cảnh + khung ảnh minh hoạ =================
 * Bài tự sinh không vẽ hình dán 3D / con vật sau chữ (dễ đè, làm mờ chữ): giữ phong cảnh của cảnh (trời, mây, đồi, biển…).
 * Chỗ trống mà cảnh từng chiếm → khung "Ảnh minh hoạ" (ẩn khi trình chiếu) để cô chèn ảnh bài tập / SGK của mình. */
export const photoEl = (x: number, y: number, w: number, h: number): El =>
  ({ id: uid(), kind: 'img', src: PHOTO_SRC, x, y, w, h, rot: 0, rad: 10, shadow: true, hide: true, role: 'photo', name: 'Ảnh minh hoạ' } as El);
const PHOTO_ZONE: Partial<Record<SceneVariant, { x: number; y: number; w: number; h: number }>> = {
  cover: { x: 1000, y: 150, w: 520, h: 400 },
  right: { x: 990, y: 200, w: 520, h: 400 },
  left: { x: 90, y: 200, w: 500, h: 385 },
};
/** cảnh minh hoạ → chỉ giữ phong cảnh (trời, mây, đồi, biển…), bỏ hình dán 3D / con vật; chỗ trống của cảnh → khung "Ảnh minh hoạ" */
export function bareScene(s: Slide): Slide {
  if (!s.scene || s.sceneBare) return s;
  const zone = s.sceneVariant ? PHOTO_ZONE[s.sceneVariant] : undefined;
  const els = [...s.els];
  const blocks = (z: { x: number; y: number; w: number; h: number }) => els.some((e) => !e.hide && e.role !== 'card' && e.role !== 'cardback' && e.group !== 'tien-trinh'
    && e.x < z.x + z.w && e.x + e.w > z.x && e.y < z.y + z.h && e.y + e.h > z.y);
  if (zone && !els.some((e) => e.role === 'photo') && !blocks(zone)) els.push(photoEl(zone.x, zone.y, zone.w, zone.h));
  return { ...s, sceneBare: true, els };
}

/** nội dung bài học cho Bộ chủ đề 5 bước (theme-sets): câu khởi động, câu khám phá, bài luyện tập, bài vận dụng, ý chính, dặn dò */
export function setContentOf(lesson: ContentLesson, know: Knowledge): SetContent {
  const used = new Set<ContentQuestion>();
  const qs = shuffle(lesson.questions.map(splitQ), rng(lesson.id.length * 7 + 3));
  const take = (f: (q: Q) => boolean) => { const q = qs.find((x) => !used.has(x) && f(x)); if (q) qs.forEach((x) => { if (x.ask === q.ask) used.add(x); }); return q; };
  const pairsOf = (q: Q) => (key(q).pairs as Record<string, string> | undefined) ?? {};
  const ans = (q: Q) => (q.type === 'fill_blank' ? accepted(q)
    : q.type === 'multiple_choice' ? ((key(q).correct as string[] | undefined) ?? []).join(', ')
    : q.type === 'matching' ? (q.left ?? []).map((l) => `${l} – ${pairsOf(q)[l] ?? ''}`).join('; ')
    : correct(q));
  const line = (q: Q) => q.ask.replace(/\n/g, ' ').replace(/\s*(\.\.\.|…|_{2,})\s*/g, ' ? ').trim();
  // trắc nghiệm: kèm lựa chọn; đúng / sai: hỏi rõ; nối: hai vế (vế phải đảo thứ tự)
  const say = (q: Q) => (q.type === 'single_choice' || q.type === 'multiple_choice' ? `${line(q)} (${q.options.join(' · ')})`
    : q.type === 'true_false' ? `${line(q)} Đúng hay sai?`
    : q.type === 'matching' ? `${line(q).replace(/[.:]\s*$/, '')}: ${(q.left ?? []).join(', ')} ↔ ${shuffle((q.left ?? []).map((l) => pairsOf(q)[l] ?? ''), rng(q.ask.length)).join(', ')}`
    : line(q));
  const ok = (q: Q, n: number) => !q.passage && !!ans(q) && q.type !== 'ordering' && short(say(q), n);
  const many = (n: number, f: (q: Q) => boolean) => Array.from({ length: n }, () => take(f)).filter(Boolean) as Q[];
  // chia câu: Luyện tập trước (trọng tâm tiết học), rồi Khởi động, Vận dụng, Khám phá — mỗi bài chỉ có khoảng 8 câu
  const prac0 = many(6, (q) => ok(q, 40) && q.level <= 3);
  const practice = prac0.length >= 3 ? prac0 : [...prac0, ...many(3 - prac0.length, (q) => ok(q, 90))];
  const warm = many(3, (q) => ok(q, 90) && q.level <= 2);
  const app = take((q) => ok(q, 170) && q.level >= 3) ?? take((q) => ok(q, 170));
  const exp = take((q) => ok(q, 140) && q.level <= 2) ?? take((q) => ok(q, 140));
  if (!warm.length) warm.push(...many(2, (q) => ok(q, 90)));
  if (!warm.length && practice.length >= 4) warm.push(...practice.splice(0, 2)); // bài ít câu: chia bớt cho Khởi động
  // bài đọc (mọi câu gắn với bài đọc): khởi động bằng đoán nội dung qua tên bài đọc
  const readTitle = /^Đọc (?:bài|đoạn|câu chuyện)[^"“]*["“]([^"”]+)["”]/.exec(lesson.questions.find((q) => /^Đọc /.test(q.prompt))?.prompt ?? '')?.[1];
  const warmText = warm.map(say);
  const warmAns = warm.map(ans);
  if (!warmText.length && readTitle) { warmText.push(`Bài đọc hôm nay tên là “${readTitle}”. Em đoán bài nói về điều gì?`); warmAns.push('Học sinh nêu dự đoán, cô ghi nhận rồi dẫn vào bài đọc.'); }
  const summary = know?.points?.length ? know.points.slice(0, 3) : learnItems(lesson.description).map((x) => x.replace(/^\S+\s/, '')).slice(0, 3);
  return {
    warm: warmText, warmAns,
    // thiếu câu khám phá: dùng ví dụ của bài (cô làm mẫu cùng lớp)
    explore: exp ? say(exp) : know?.example ? `Cùng làm ví dụ: ${know.example.split('→')[0].trim()}` : readTitle ? `Đọc bài “${readTitle}”. Bài đọc nói về điều gì? Em thích chi tiết nào nhất?` : '',
    exploreAns: exp ? ans(exp) : know?.example ? know.example.split('→').slice(1).join(' → ').trim() : readTitle ? 'Học sinh đọc bài, nêu nội dung chính và chi tiết em thích.' : '',
    practice: practice.map(say), practiceAns: practice.map(ans),
    // thiếu bài vận dụng: nhiệm vụ nói / liên hệ với từ ngữ, nội dung của bài
    apply: app ? say(app) : fill((LIENHE[lesson.subject] ?? LIENHE.toan)[0], '', topicOf(lesson)),
    applyAns: app ? ans(app) : 'Học sinh trình bày, các bạn nhận xét, cô khen.', math: lesson.subject === 'toan',
    summary, home: (HOMEWORK[lesson.subject] ?? HOMEWORK.toan).split('\n')[0].replace(/^•\s*/, ''),
  };
}
