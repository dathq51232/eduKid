// Bộ mẫu bài giảng theo khung 5 bước (11/2026, kiểu Canva): một chủ đề thống nhất cho cả bài —
// nền, khung thẻ, màu chữ, bạn cú Milo đổi tư thế từng trang, hình 3D trang trí.
// 7 trang: Bìa · Khởi động · Khám phá · Luyện tập · Vận dụng · Tổng kết · Cảm ơn. Giáo viên chỉ thay chữ.
// “Đổi chủ đề cả bộ” đổi giao diện theo vai trò (role) của vật mà giữ nguyên nội dung đã soạn.
import { uid, type Anim, type El, type Slide } from './types';

export type SetId = 'oli' | 'cosmos' | 'leaf' | 'lab' | 'vui' | 'sotay';
export type ThemeSet = {
  id: SetId; name: string; sub: string; bg: string;
  card: string; edge: string; title: string; text: string;
  /** tư thế Milo cho 7 trang */ mascots: string[];
  /** hình trang trí: bìa, trang nội dung, trang cuối */ deco: [string, string, string];
  /** băng dính giấy dán 2 góc thẻ (kiểu sổ tay / scrapbook) */ tape?: [string, string];
};
const M = (n: string) => `/brand/milo${n ? `-${n}` : ''}.webp`;
const F = (n: string) => `/emoji/f3d/${n}.webp`;

export const THEME_SETS: ThemeSet[] = [
  { id: 'oli', name: 'Lớp học ô li', sub: 'Giấy kẻ ô · nâu kem', bg: 'oli', card: '#ffffff', edge: '#d6a07a', title: '#8b4a26', text: '#4a2b18',
    mascots: ['professor', 'artist', 'robot', 'doctor', 'professor', 'astronaut', ''].map(M), deco: [F('books'), F('pencil'), F('party-popper')] },
  { id: 'cosmos', name: 'Phiêu lưu vũ trụ', sub: 'Trời sao · tím than', bg: 'cosmos', card: '#ffffff', edge: '#8b5cf6', title: '#4338ca', text: '#1e1b4b',
    mascots: ['astronaut', 'robot', 'astronaut', 'professor', 'robot', 'astronaut', ''].map(M), deco: [F('crescent-moon'), F('star'), F('star')] },
  { id: 'leaf', name: 'Khu vườn xanh', sub: 'Lá cây · xanh bạc hà', bg: 'leaf', card: '#ffffff', edge: '#4ade80', title: '#15803d', text: '#14532d',
    mascots: ['artist', '', 'doctor', 'artist', 'professor', 'artist', ''].map(M), deco: [F('seedling'), F('sunflower'), F('tulip')] },
  { id: 'lab', name: 'Phòng thí nghiệm', sub: 'Chấm bi · xanh dương', bg: 'dots', card: '#ffffff', edge: '#38bdf8', title: '#0369a1', text: '#0c4a6e',
    mascots: ['doctor', 'robot', 'professor', 'doctor', 'robot', 'professor', ''].map(M), deco: [F('microscope'), F('light-bulb'), F('star')] },
  // Kiểu template Canva (11/2026): khối màu bo cong tràn mép, hình dán 3D, nền kem ấm
  { id: 'vui', name: 'Vui tươi', sub: 'Khối màu · kem cam', bg: 'blob', card: '#ffffff', edge: '#f08a1c', title: '#1e293b', text: '#334155',
    mascots: ['', 'artist', 'professor', 'robot', 'doctor', 'professor', ''].map(M), deco: [F('red-apple'), F('star'), F('party-popper')] },
  // Kiểu scrapbook: giấy be, thẻ giấy kem, băng dính giấy 2 góc, chữ nâu
  { id: 'sotay', name: 'Sổ tay ấm', sub: 'Giấy be · băng dính', bg: 'kraft', card: '#fdfbf4', edge: '#c9a27e', title: '#6b3d1a', text: '#5b3a1e',
    mascots: ['professor', 'artist', '', 'doctor', 'professor', 'artist', ''].map(M), deco: [F('books'), F('blossom'), F('backpack')], tape: ['#d6a078cc', '#9fd2abcc'] },
];
export const SET_BY_ID = Object.fromEntries(THEME_SETS.map((t) => [t.id, t])) as Record<SetId, ThemeSet>;

/** màu nhãn từng bước của tiết dạy */
export const STEP_COLOR: Record<string, string> = { 'Khởi động': '#f97316', 'Khám phá': '#2563eb', 'Luyện tập': '#16a34a', 'Vận dụng': '#9333ea', 'Tổng kết': '#db2777', 'Củng cố': '#db2777' };
export const STEPS = ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng', 'Tổng kết'] as const;
/** thời gian gợi ý (phút) cho 7 trang — cộng lại 35 phút */
const MINS = [2, 5, 8, 10, 6, 3, 1];

type Mk = { els: El[]; anims: Anim[] };
const txt = (m: Mk, text: string, x: number, y: number, w: number, h: number, size: number, color: string, role: El['role'], o: Partial<Extract<El, { kind: 'text' }>> = {}) => {
  const e = { id: uid(), kind: 'text', x, y, w, h, rot: 0, text, size, color, font: 'baloo', align: 'left', bg: '', role, ...o } as El;
  m.els.push(e); return e.id;
};
const img = (m: Mk, src: string, x: number, y: number, w: number, h: number, role: El['role'], name: string) => {
  const e = { id: uid(), kind: 'img', src, x, y, w, h, rot: 0, role, name } as El;
  m.els.push(e); return e.id;
};
const anim = (m: Mk, el: string, fx: Anim['fx'], start: Anim['start'], o: Partial<Anim> = {}) => { m.anims.push({ id: uid(), el, fx, start, delay: 0, dur: 0.6, ...o }); };
/** khung thẻ bo góc + lớp bóng lệch phía sau (khoá để khỏi kéo nhầm) */
const card = (m: Mk, t: ThemeSet, x: number, y: number, w: number, h: number) => {
  m.els.push({ id: uid(), kind: 'shape', shape: 'round', x: x + 18, y: y + 20, w, h, rot: 0, fill: t.edge, stroke: t.edge, sw: 0, lock: true, role: 'cardback' } as El);
  m.els.push({ id: uid(), kind: 'shape', shape: 'round', x, y, w, h, rot: 0, fill: t.card, stroke: t.edge, sw: 6, lock: true, role: 'card' } as El);
  m.els.push(...tapes(t, x, y, w));
};
/** 2 miếng băng dính giấy chéo ở 2 góc trên của thẻ */
const tapes = (t: ThemeSet, x: number, y: number, w: number): El[] => (t.tape ?? []).map((c, k) => ({ id: uid(), kind: 'shape', shape: 'rect', x: k ? x + w - 150 : x - 40, y: y - 26, w: 190, h: 52, rot: k ? 24 : -26, fill: c, stroke: c, sw: 0, lock: true, role: 'tape' } as El));
const step = (m: Mk, label: string) => txt(m, label, 64, 46, 40 + label.length * 26, 78, 40, '#ffffff', 'step', { bg: STEP_COLOR[label] ?? '#7c3aed', align: 'center' });

export type SetInfo = { title: string; sub: string };

/** 7 trang của bộ mẫu (chữ mẫu để cô thay) */
export function makeSet(id: SetId, info: SetInfo): Slide[] {
  const t = SET_BY_ID[id];
  const page = (i: number, phase: string | undefined, build: (m: Mk) => void, notes: string): Slide => {
    const m: Mk = { els: [], anims: [] }; build(m);
    return { id: uid(), bg: t.bg, els: m.els, anims: m.anims, trans: 'fade', notes, phase, mins: MINS[i] };
  };
  const content = (i: number, label: string, title: string, body: (m: Mk, L: number) => void, notes: string) => page(i, label, (m) => {
    card(m, t, 130, 130, 1340, 640);
    const right = i % 2 === 1;
    const L = right ? 220 : 470;
    const tt = txt(m, title, L, 190, 940, 110, 86, t.title, 'title');
    body(m, L);
    const mm = img(m, t.mascots[i], right ? 1180 : 30, 460, 380, 420, 'mascot', 'Bạn cú Milo');
    const dd = img(m, t.deco[1], 1360, 50, 140, 140, 'deco', 'Hình trang trí');
    step(m, label);
    anim(m, tt, 'fade', 'with', { dur: 0.5 }); anim(m, mm, 'pop', 'after', { delay: 0.2 }); anim(m, dd, 'spin-in', 'with');
  }, notes);
  const bullets = (m: Mk, L: number, lines: string[], icon: string, size = 64, gap = 112) => lines.forEach((x, j) => {
    img(m, icon, L + 10, 340 + j * gap, size, size, undefined, 'Ngôi sao');
    txt(m, x, L + size + 34, 330 + j * gap, 820, size + 20, Math.round(size * 0.92), t.text, 'body');
  });
  return [
    page(0, undefined, (m) => {
      card(m, t, 220, 170, 1220, 520);
      const mm = img(m, t.mascots[0], 80, 150, 560, 620, 'mascot', 'Bạn cú Milo');
      const tt = txt(m, info.title || 'Tên bài học', 640, 260, 760, 230, 120, t.title, 'title', { size: info.title.length > 18 ? 92 : 120 });
      txt(m, info.sub, 646, 500, 760, 80, 46, t.text, 'body', { font: 'quick' });
      img(m, t.deco[0], 1330, 90, 170, 170, 'deco', 'Hình trang trí');
      anim(m, tt, 'zoom', 'with', { dur: 0.8 }); anim(m, mm, 'fly-left', 'with', { delay: 0.2 });
    }, 'Giới thiệu tên bài. Hỏi: “Hôm nay chúng ta sẽ học gì nhỉ?”'),
    content(1, 'Khởi động', 'Ai nhanh hơn?', (m, L) => bullets(m, L, ['Câu hỏi 1 …', 'Câu hỏi 2 …', 'Câu hỏi 3 …'], F('star')), 'Trò chơi khởi động 2–3 phút: cô đọc câu hỏi, tổ nào giơ tay nhanh và đúng được cộng điểm thi đua.'),
    content(2, 'Khám phá', 'Cùng khám phá', (m, L) => {
      txt(m, 'Quan sát tranh và trả lời:\n… ?', L, 330, 900, 180, 58, t.text, 'body');
      [0, 1, 2, 3, 4].forEach((k) => img(m, F('red-apple'), L + 10 + k * 120, 540, 100, 100, undefined, 'Hình minh hoạ'));
    }, 'Cho học sinh quan sát, nêu nhận xét. Rút ra kiến thức mới, ghi bảng.'),
    content(3, 'Luyện tập', 'Bài 1. …', (m, L) => {
      ['a) …', 'b) …', 'c) …'].forEach((x, j) => txt(m, x, L + 20, 340 + j * 110, 400, 90, 64, t.text, 'body'));
      ['d) …', 'e) …', 'g) …'].forEach((x, j) => txt(m, x, L + 440, 340 + j * 110, 400, 90, 64, t.text, 'body'));
    }, 'Học sinh làm cá nhân vào vở / bảng con. Gọi 3 em chữa bài, cả lớp nhận xét.'),
    content(4, 'Vận dụng', 'Giải toán', (m, L) => {
      txt(m, 'Đề bài: …\nHỏi: … ?', L, 330, 900, 180, 56, t.text, 'body');
      [0, 1, 2, 3].forEach((k) => img(m, F('pencil'), L + 20 + k * 160, 540, 120, 120, undefined, 'Hình minh hoạ'));
    }, 'Thảo luận nhóm đôi, trình bày bài giải. Liên hệ thực tế.'),
    content(5, 'Tổng kết', 'Hôm nay em học được', (m, L) => bullets(m, L, ['Điều thứ nhất …', 'Điều thứ hai …', 'Điều thứ ba …'], F('star'), 58, 100), 'Hỏi lại ý chính của bài. Khen các tổ, tổng kết điểm thi đua.'),
    page(6, undefined, (m) => {
      card(m, t, 220, 170, 1220, 520);
      const mm = img(m, t.mascots[6], 80, 150, 560, 620, 'mascot', 'Bạn cú Milo');
      const tt = txt(m, 'Cảm ơn các em!', 640, 290, 760, 140, 100, t.title, 'title');
      txt(m, 'Về nhà: …', 646, 450, 760, 80, 46, t.text, 'body', { font: 'quick' });
      const d = img(m, t.deco[2], 1250, 520, 150, 150, 'deco', 'Hình trang trí');
      anim(m, tt, 'pop', 'with'); anim(m, mm, 'fly-left', 'with', { delay: 0.2 }); anim(m, d, 'jump', 'after', { sound: 'tada' });
    }, 'Dặn dò bài về nhà, chuẩn bị bài sau.'),
  ];
}

/** đổi chủ đề cả bộ: nền, khung, màu chữ, tư thế Milo, hình trang trí — giữ nguyên nội dung */
export function applySet(slides: Slide[], id: SetId): Slide[] {
  const t = SET_BY_ID[id];
  return slides.map((s, i) => {
    let mi = 0;
    const cardEl = s.els.find((e) => e.role === 'card');
    const els = s.els.filter((e) => e.role !== 'tape');
    if (cardEl) els.splice(els.indexOf(cardEl) + 1, 0, ...tapes(t, cardEl.x, cardEl.y, cardEl.w));
    return { ...s, bg: t.bg, scene: undefined, els: els.map((e) => {
      if (e.role === 'card' && e.kind === 'shape') return { ...e, fill: t.card, stroke: t.edge };
      if (e.role === 'cardback' && e.kind === 'shape') return { ...e, fill: t.edge, stroke: t.edge };
      if ((e.role === 'title' || e.role === 'divider') && e.kind === 'text') return { ...e, color: t.title };
      if (e.role === 'body' && e.kind === 'text') return { ...e, color: t.text };
      if (e.role === 'mascot' && e.kind === 'img') { const k = i === 0 ? 0 : i === slides.length - 1 ? 6 : 1 + ((i - 1 + mi++) % 5); return { ...e, src: t.mascots[k] }; }
      if (e.role === 'deco' && e.kind === 'img') return { ...e, src: t.deco[i === 0 ? 0 : i === slides.length - 1 ? 2 : 1] };
      return e;
    }) };
  });
}

/** bài còn trống (1 trang mới tạo, ít vật) — thêm bộ mẫu thì thay luôn */
export const isBlankDeck = (slides: Slide[]) => slides.length === 1 && slides[0].els.length <= 2 && !slides[0].anims.length;
