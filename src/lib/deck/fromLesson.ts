// Dựng bài thao giảng từ một bài học trong ngân hàng nội dung: 5 hoạt động của tiết dạy
// (Khởi động · Khám phá · Luyện tập · Vận dụng · Củng cố) với tình huống, trò chơi và câu hỏi của bài.
// Hàm thuần: không gọi mạng, dùng hình có sẵn trong dự án; mỗi trang là Slide bình thường nên sửa được trong trình soạn.
import type { ContentLesson, ContentQuestion } from '@/lib/content/types';
import type { LessonPlan as GiaoAn } from '@/lib/plans/generate';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { accentOf } from './scenes';
import { f3dSrc as ST } from './f3d-catalog';
import { uid, type Anim, type El, type SceneKind, type Slide, type TextEl } from './types';

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
export type Warmup = 'gift' | 'wheel' | 'quiz';
export const WARMUPS: { id: Warmup; label: string; icon: string }[] = [
  { id: 'gift', label: 'Hộp quà bí mật', icon: '🎁' }, { id: 'wheel', label: 'Vòng quay', icon: '🎡' }, { id: 'quiz', label: 'Ai nhanh hơn?', icon: '⚡' },
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
/** cỡ chữ vừa khung theo độ dài */
const fit = (text: string, w: number, h: number, max = 64, min = 26) => {
  // chữ tự xuống dòng: chọn cỡ lớn nhất mà số dòng (ước lượng) vẫn vừa chiều cao và từ dài nhất vừa chiều ngang
  const lines = text.split('\n'), word = Math.max(...text.split(/\s+/).map((x) => x.length), 1);
  const rows = (s: number) => lines.reduce((n, l) => n + Math.max(1, Math.ceil((l.length * 0.56 * s) / (w * 0.92))), 0);
  let s = max;
  while (s > min && (rows(s) * 1.3 * s > h || word * 0.62 * s > w)) s -= 2;
  return Math.round(Math.max(min, s));
};
const title = (m: Mk, text: string, color = '#1e3a8a') => T(m, text, 340, 38, 920, 88, fit(text, 880, 80, 58, 32), color, { bg: '#ffffffeb', role: 'title' });
const page = (m: Mk, phase: PhaseId, scene: SceneKind, notes = '', sound?: string): Slide => ({ id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'fade', notes, sound, scene, phase: PHASE_LABEL[phase] });

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
      const body = q.type === 'multiple_choice' ? `${q.ask}\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('   ')}` : q.ask;
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

/** Trang bìa: tên bài chữ trang trí (viền trắng, đổ bóng), môn · lớp, "Tiết N", linh vật */
function coverPage(name: string, sub: string, tiet: number | undefined, sc: SceneKind, mascot: string): Slide {
  const m = mk(); const ac = accentOf(sc);
  const t = T(m, name, 140, 200, 1320, 300, fit(name, 1280, 280, 120, 54), ac, { stroke: '#ffffff', strokeW: 14, shadow: true, role: 'divider' });
  T(m, sub, 400, 520, 800, 80, fit(sub, 760, 70, 40, 24), '#ffffff', { font: 'quick', bg: ac, role: 'mode' });
  if (tiet) { const k = T(m, `Tiết ${tiet}`, 680, 620, 240, 90, 56, ac, { bg: '#ffffff', role: 'badge' }); A(m, k, 'pop', 'after', { sound: 'pop' }); }
  const p = I(m, mascot, 1260, 560, 300);
  A(m, t, 'zoom', 'with', { dur: 0.8 }); A(m, p, 'pop', 'after', { sound: 'magic' });
  return page(m, 'bia', sc);
}

/** Trang "Bảng thi đua tổ": khi chiếu hiện điểm tuần này của các tổ (cột mọc lên, tổ nhất có cúp) */
export function boardPage(sc: SceneKind | undefined): Slide {
  const m = mk(); title(m, 'Thi đua tổ', accentOf(sc));
  const b = { id: uid(), kind: 'teams', x: 200, y: 160, w: 1200, h: 680, rot: 0, title: '' } as El;
  m.els.push(b); A(m, b.id, 'fade', 'with', { sound: 'drum' });
  return { id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'zoom', notes: 'Điểm thi đua tổ tuần này (cộng cả điểm trên lớp, bài thao giảng, bài tập). Khen tổ dẫn đầu.', sound: 'clap', scene: sc, phase: PHASE_LABEL.cc };
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
  const take = (f: (q: Q) => boolean) => { const q = qs.find((x) => !used.has(x) && f(x)); if (q) used.add(q); return q; };

  /* Bìa */
  add('bia', 'cover', 'Trang bìa', coverPage(lesson.title, `${subj} ${lesson.grade}${lesson.unit?.title ? ' · ' + lesson.unit.title.replace(/^Chủ đề\s*\d+[.:]?\s*/i, '') : ''}`, o.tiet, sc, M.src));

  /* Khởi động: trò chơi */
  const easy = (q: Q) => q.level <= 2 && short(q.ask, 90) && (q.type === 'single_choice' || q.type === 'fill_blank' || q.type === 'true_false');
  const answerOf = (q: Q) => q.type === 'fill_blank' ? accepted(q) : correct(q);
  const warm = (w: Warmup) => {
    const m = mk();
    if (w === 'gift') {
      title(m, 'Hộp quà bí mật', '#be123c');
      const gs = [take(easy), take(easy), take(easy)].filter(Boolean) as Q[];
      if (gs.length < 2) return null;
      gs.forEach((q, i) => {
        const x = 800 - (gs.length * 470) / 2 + i * 470;
        const g = I(m, ST('wrapped-gift'), x + 100, 250, 270, { name: `Hộp quà ${i + 1}` });
        const n = T(m, String(i + 1), x + 200, 540, 70, 70, 48, '#ffffff', { bg: '#e11d48' });
        const c = S(m, 'bubble', x + 20, 200, 430, 380, '#ffffff', q.ask + (q.type === 'single_choice' ? `\n(${q.options.join(' · ')})` : ''), { stroke: '#f43f5e', sw: 5, size: fit(q.ask, 380, 260, 40, 22) } as Partial<El>);
        A(m, g, 'zoom-out', 'click', { trigger: g, sound: 'magic', dur: 0.5 }); A(m, n, 'fade-out', 'with', { trigger: g }); A(m, c, 'pop', 'after', { trigger: g, sound: 'tada' });
      });
      return { t: 'Hộp quà bí mật', s: page(m, 'kd', sc, 'Mời học sinh chọn hộp quà, cô bấm vào hộp đó để mở câu hỏi.\n' + gs.map((q, i) => `Hộp ${i + 1}: ${answerOf(q)}`).join('\n'), 'drum') };
    }
    if (w === 'wheel') {
      title(m, 'Vòng quay may mắn', '#9a3412');
      const q = take(easy); if (!q) return null;
      const wh = S(m, 'wheel', 240, 180, 480, 480, '#fbbf24', '?', { stroke: '#f59e0b', sw: 6, size: 96, color: '#9a3412' } as Partial<El>);
      const btn = S(m, 'arrow', 760, 290, 230, 110, '#ef4444', 'Quay!', { stroke: '#b91c1c', sw: 5, size: 40, color: '#ffffff', rot: 180 } as Partial<El>);
      const c = S(m, 'bubble', 760, 430, 640, 340, '#ffffff', q.ask, { stroke: '#f97316', sw: 5, size: fit(q.ask, 560, 230, 44, 26) } as Partial<El>);
      A(m, wh, 'spin', 'click', { trigger: btn, dur: 2.4, sound: 'drum' }); A(m, c, 'pop', 'after', { trigger: btn, sound: 'tada' });
      return { t: 'Vòng quay may mắn', s: page(m, 'kd', sc, `Bấm “Quay!”, gọi một bạn trả lời. Đáp án: ${answerOf(q)}`) };
    }
    const q = take((x) => x.type === 'single_choice' && x.level <= 2);
    const got = q && qPage(q, M.src, sc, 'kd', 'Ai nhanh hơn?');
    return got ? { t: 'Ai nhanh hơn?', s: got.slide } : null;
  };
  // chỉ dựng trò đã chọn (đổi trò thì dựng lại), nếu bài thiếu câu dễ thì thử trò khác
  for (const w of [o.warmup, ...(['gift', 'wheel', 'quiz'] as Warmup[]).filter((x) => x !== o.warmup)]) { const g = warm(w); if (g) { add('kd', w, g.t, g.s); break; } }
  // tình huống mở đầu
  shuffle(SITU[sc], r).forEach((tpl, i) => {
    const line = fill(tpl, M.name, Tp);
    const m = mk();
    const p = I(m, M.src, 60, 380, 420);
    const b = S(m, 'bubble', 500, 90, 980, 430, '#ffffff', line, { stroke: '#f59e0b', sw: 6, size: fit(line, 900, 330, 54, 28), color: '#0f172a' } as Partial<El>);
    A(m, p, 'fly-left', 'with', { sound: 'whoosh' }); A(m, b, 'pop', 'after', { sound: 'pop' });
    add('kd', `situ${i}`, `Tình huống: ${line.slice(0, 60)}…`, page(m, 'kd', sc, 'Đọc tình huống, hỏi lớp: “Muốn giúp bạn, chúng ta cần biết điều gì?”'));
  });

  /* Khám phá */
  if (know?.points?.length) {
    const m = mk(); title(m, 'Kiến thức cần nhớ', '#0369a1');
    const pts = know.points.slice(0, 4), h = Math.min(145, 550 / pts.length);
    const cardBgs = ['#eff6ff', '#f0fdf4', '#fefce8', '#fdf2f8'];
    pts.forEach((t, i) => {
      const id = T(m, `${CIRCLED[i] ?? i + 1}  ${t}`, 160, 165 + i * (h + 18), 1140, h, fit(t, 1080, h - 14, 46, 28), '#0f172a', { align: 'left', font: 'quick', bg: cardBgs[i % 4] });
      A(m, id, 'fly-left', 'click', { sound: 'pop' });
    });
    I(m, M.src, 1330, 620, 210, { lock: true });
    add('kp', 'know', 'Kiến thức cần nhớ (hiện từng ý)', page(m, 'kp', sc, 'Bấm “Tiếp” để hiện từng ý, cho học sinh nhắc lại.'));
  }
  if (know?.example) {
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
  if (pass) {
    const m = mk(); title(m, 'Đọc bài', '#7c2d12');
    const txt = pass.length > 620 ? pass.slice(0, 600).replace(/\s\S*$/, '') + ' …' : pass;
    T(m, txt, 220, 150, 1160, 640, fit(txt, 1120, 620, 44, 24), '#1f2937', { align: 'left', font: 'quick', bg: '#fffbeb' });
    add('kp', 'read', 'Đọc bài (bài đọc của câu hỏi)', page(m, 'kp', sc, 'Cô đọc mẫu, học sinh đọc nối tiếp từng câu.'));
  }
  // từ mới (từ câu ghép đôi): bấm miếng che để mở nghĩa
  const mt = qs.find((q) => q.type === 'matching' && (q.left?.length ?? 0) >= 2 && (q.left ?? []).every((t) => short(t, 18)));
  if (mt && lesson.subject !== 'toan') {
    const pairs = key(mt).pairs as Record<string, string>; const left = (mt.left ?? []).slice(0, 4);
    const m = mk(); title(m, lesson.subject === 'tieng-anh' ? 'New words · Từ mới' : 'Từ ngữ', '#6d28d9');
    left.forEach((l, i) => {
      const y = 170 + i * 165;
      T(m, l, 300, y, 440, 140, fit(l, 420, 130, 72, 30), '#1e3a8a', { bg: '#ffffffe6' });
      T(m, pairs[l] ?? '', 860, y, 440, 140, fit(pairs[l] ?? '', 420, 130, 60, 26), '#15803d', { bg: '#dcfce7' });
      cover(m, 860, y, 440, 140);
    });
    used.add(mt);
    add('kp', 'words', 'Từ mới (bấm miếng che để mở nghĩa)', page(m, 'kp', sc, 'Cho học sinh đọc từ, đoán nghĩa rồi mới mở miếng che.'));
  }
  if (lesson.description && short(lesson.description, 260)) {
    const m = mk(); title(m, `Hôm nay chúng ta học`, '#0369a1');
    T(m, Tp, 300, 200, 1000, 160, fit(Tp, 980, 150, 80, 36), '#c2410c', { bg: '#ffffffe6' });
    const d = T(m, lesson.description, 300, 400, 1000, 260, fit(lesson.description, 980, 250, 44, 24), '#1f2937', { font: 'quick', bg: '#ffffffd9' });
    A(m, d, 'fade', 'click');
    I(m, M.src, 40, 560, 280, { lock: true });
    add('kp', 'intro', 'Giới thiệu bài', page(m, 'kp', sc));
  }
  // câu khám phá: hỏi – đáp có miếng che
  for (let i = 0; i < 2; i++) {
    const q = take((x) => (x.type === 'fill_blank' || x.type === 'single_choice') && x.level <= 2 && !x.passage);
    if (!q) break;
    const g = qPage({ ...q, type: 'fill_blank', key: { accepted: [answerOf(q)] } } as Q, M.src, sc, 'kp', 'Cùng tìm hiểu');
    if (g) add('kp', `ask${i}`, g.title, g.slide);
  }

  /* Vận dụng: câu khó + liên hệ thực tế (lấy trước để không bị Luyện tập dùng mất) */
  const hard = take((x) => x.level >= 3 && (x.type === 'fill_blank' || x.type === 'single_choice') && !x.passage) ?? take((x) => x.level >= 3 && !x.passage);
  const vdPages: Cand[] = [];
  if (hard) {
    const g = qPage(hard, M.src, sc, 'vd', `Thử thách của ${M.name}`);
    if (g) vdPages.push({ key: 'vd:hard', phase: 'vd', title: g.title, slide: g.slide });
  }
  (LIENHE[lesson.subject] ?? LIENHE.toan).forEach((t, i) => {
    const line = fill(t, M.name, Tp); const m = mk();
    title(m, 'Liên hệ thực tế', '#be185d');
    I(m, M.src, 80, 300, 380);
    const b = S(m, 'bubble', 500, 170, 960, 420, '#ffffff', line, { stroke: '#ec4899', sw: 6, size: fit(line, 880, 320, 54, 28), color: '#0f172a' } as Partial<El>);
    A(m, b, 'pop', 'with', { sound: 'pop' });
    T(m, '👥 Thảo luận nhóm đôi · 2 phút', 560, 640, 840, 90, 40, '#9d174d', { bg: '#fce7f3' });
    vdPages.push({ key: `vd:lh${i}`, phase: 'vd', title: `Liên hệ: ${line.slice(0, 56)}…`, slide: page(m, 'vd', sc, 'Mời 2–3 nhóm chia sẻ, cô nhận xét và khen.') });
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
  { const m = mk(); title(m, 'Nhiệm vụ về nhà', '#6d28d9');
    const hw = HOMEWORK[lesson.subject] ?? HOMEWORK.toan;
    T(m, hw, 300, 200, 1000, 420, 50, '#1f2937', { align: 'left', font: 'quick', bg: '#ffffffe6' });
    I(m, M.src, 1240, 560, 300, { lock: true });
    add('cc', 'home', 'Nhiệm vụ về nhà', page(m, 'cc', sc, 'Dặn dò, chuẩn bị bài sau.')); }
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

  // tình huống mở đầu
  shuffle(SITU[sc], r).forEach((tpl, i) => {
    const line = fill(tpl, M.name, Tp); const m = mk();
    const p = I(m, M.src, 60, 380, 420);
    const b = S(m, 'bubble', 500, 90, 980, 430, '#ffffff', line, { stroke: '#f59e0b', sw: 6, size: fit(line, 900, 330, 54, 28), color: '#0f172a' } as Partial<El>);
    A(m, p, 'fly-left', 'with', { sound: 'whoosh' }); A(m, b, 'pop', 'after', { sound: 'pop' });
    add('kd', `situ${i}`, `Tình huống: ${line.slice(0, 60)}…`, page(m, 'kd', sc, 'Đọc tình huống, hỏi lớp: “Các em đoán hôm nay chúng ta học gì?”'));
  });

  // mục tiêu (yêu cầu cần đạt)
  const goals = lines(ga.goals.knowledge, 4);
  if (goals.length) {
    const m = mk(); title(m, 'Hôm nay em sẽ', '#0369a1');
    const h = Math.min(150, 560 / goals.length);
    goals.forEach((t, i) => { const id = T(m, `🎯 ${t}`, 260, 170 + i * (h + 20), 1080, h, fit(t, 1040, h - 10, 46, 24), '#0f172a', { align: 'left', font: 'quick', bg: '#ffffffe6' }); A(m, id, 'fly-left', 'click', { sound: 'pop' }); });
    I(m, M.src, 1350, 650, 220, { lock: true });
    add('kp', 'goals', 'Mục tiêu bài học (hiện từng ý)', page(m, 'kp', sc, 'Bấm “Tiếp” để hiện từng mục tiêu.'));
  }

  // mỗi hoạt động của giáo án → trang nhiệm vụ của học sinh (hiện lần lượt)
  for (const a of ga.activities) {
    const ph = ACT_PHASE[a.key] ?? 'kp';
    const tasks = lines(a.student, 5).length ? lines(a.student, 5) : lines(a.teacher, 5);
    if (!tasks.length) continue;
    const m = mk(); title(m, a.title || PHASE_LABEL[ph], PHASES.find((p) => p.id === ph)?.color ?? '#0369a1');
    if (a.goal && short(a.goal, 140)) T(m, a.goal, 300, 150, 1000, 80, fit(a.goal, 980, 70, 36, 22), '#475569', { font: 'quick', italic: true, bg: '#ffffffcc' });
    const top = a.goal ? 250 : 170, h = Math.min(120, (720 - top) / tasks.length - 14);
    tasks.forEach((t, i) => { const id = T(m, `${i + 1}. ${t}`, 300, top + i * (h + 14), 1000, h, fit(t, 960, h - 8, 44, 22), '#0f172a', { align: 'left', font: 'quick', bg: '#ffffffe6' }); A(m, id, 'fade', 'click', { sound: 'pop' }); });
    I(m, M.src, 40, 640, 220, { lock: true });
    add(ph, `act-${a.key}`, `${a.title}: nhiệm vụ của học sinh`, page(m, ph, sc, [a.goal && `Mục tiêu: ${a.goal}`, a.teacher && `GV:\n${a.teacher}`].filter(Boolean).join('\n')));
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
  // liên hệ (Vận dụng)
  LIENHE_OTHER.forEach((t, i) => {
    const line = fill(t, M.name, Tp); const m = mk();
    title(m, 'Liên hệ thực tế', '#be185d');
    I(m, M.src, 80, 300, 380);
    const b = S(m, 'bubble', 500, 170, 960, 420, '#ffffff', line, { stroke: '#ec4899', sw: 6, size: fit(line, 880, 320, 54, 28), color: '#0f172a' } as Partial<El>);
    A(m, b, 'pop', 'with', { sound: 'pop' });
    add('vd', `lh${i}`, `Liên hệ: ${line.slice(0, 56)}…`, page(m, 'vd', sc, 'Mời HS chia sẻ, cô nhận xét và khen.'));
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
  { const m = mk(); title(m, 'Dặn dò', '#6d28d9');
    const va = ga.activities.find((a) => a.key === 'van-dung');
    const hw = lines(va?.teacher, 6).filter((l) => /dặn|về nhà|chuẩn bị|nhận xét/i.test(l));
    const txt = (hw.length ? hw : ['Thực hiện điều đã học ở nhà', 'Chuẩn bị bài sau']).map((l) => `• ${l}`).join('\n');
    T(m, txt, 300, 200, 1000, 420, fit(txt, 960, 400, 50, 26), '#1f2937', { align: 'left', font: 'quick', bg: '#ffffffe6' });
    I(m, M.src, 1240, 560, 300, { lock: true });
    add('cc', 'home', 'Dặn dò', page(m, 'cc', sc)); }
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
export const cardEl = (accent: string): El => ({ id: uid(), kind: 'shape', shape: 'round', x: 36, y: 26, w: 1528, h: 848, rot: 0, fill: '#ffffff', stroke: accent, sw: 7, shadow: true, lock: true, role: 'card' } as El);
export const badgeEl = (n: number, label: string, accent: string): El =>
  ({ id: uid(), kind: 'text', x: 56, y: 42, w: Math.min(360, 110 + label.length * 22), h: 66, rot: 0, text: `${CIRCLED[n - 1] ?? n} ${label}`, size: 34, color: '#ffffff', font: 'baloo', align: 'center', bg: accent, role: 'badge' } as El);
export const modeEl = (mode: WorkMode, accent: string): El =>
  ({ id: uid(), kind: 'text', x: 1180, y: 42, w: 360, h: 66, rot: 0, text: WORK_MODES.find((w) => w.id === mode)?.label ?? '', size: 28, color: accent, font: 'baloo', align: 'center', bg: '#fff7ed', role: 'mode' } as El);
/** Trang chia hoạt động: tên hoạt động chữ thật to trên cảnh nền */
export function dividerSlide(label: string, sc: SceneKind | undefined, mascot = MASCOTS[0].src, sub = ''): Slide {
  const m = mk(); const ac = accentOf(sc);
  const t = T(m, label.toUpperCase(), 120, 250, 1360, 300, fit(label, 1300, 280, 190, 80), ac, { stroke: '#ffffff', strokeW: 16, shadow: true, role: 'divider' });
  if (sub) T(m, sub, 450, 570, 700, 80, fit(sub, 660, 70, 42, 24), '#ffffff', { font: 'quick', bg: ac, role: 'mode' });
  const p = I(m, mascot, 1230, 520, 330);
  A(m, t, 'zoom', 'with', { dur: 0.7, sound: 'magic' }); A(m, p, 'fly-right', 'after');
  return { id: uid(), bg: 'white', els: m.els, anims: m.anims, trans: 'zoom', notes: '', scene: sc, phase: label };
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
export type BuildOpts = { dividers?: boolean; mascot?: string; math?: boolean };

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
    let s: Slide = { ...c.slide, scene: sc, els: [...c.slide.els], anims: [...c.slide.anims] };
    const content = (c.phase === 'kp' || c.phase === 'lt' || c.phase === 'vd') && !c.key.includes('situ') && !s.els.some((e) => e.role === 'card');
    if (content) {
      s.els = [cardEl(ac), ...s.els.map((e) => (e.role === 'title' && e.kind === 'text' ? { ...e, bg: '', color: ac } : e))];
      const lb = c.phase === 'lt' ? labelOf(c.title, !!o.math) : null;
      if (lb) { n++; s.els.push(badgeEl(n, lb[0], ac), modeEl(lb[1], ac)); }
    }
    s = { ...s };
    out.push(s);
  }
  return out;
}

/** Đổi chủ đề cả bài: cảnh nền mọi trang + màu khung / nhãn / chữ trang chia theo chủ đề mới */
export function applyTheme(slides: Slide[], sc: SceneKind): Slide[] {
  const ac = accentOf(sc);
  return slides.map((s) => ({ ...s, scene: sc, els: s.els.map((e) => {
    if (e.role === 'card' && e.kind === 'shape') return { ...e, stroke: ac };
    if (e.role === 'badge' && e.kind === 'text') return { ...e, bg: e.bg === '#ffffff' ? e.bg : ac, color: e.bg === '#ffffff' ? ac : e.color };
    if (e.role === 'mode' && e.kind === 'text') return e.bg === '#fff7ed' ? { ...e, color: ac } : { ...e, bg: ac };
    if ((e.role === 'divider' || e.role === 'title') && e.kind === 'text') return { ...e, color: ac };
    return e;
  }) }));
}
