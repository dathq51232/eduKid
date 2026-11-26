// Bộ mẫu bài giảng theo khung 5 bước (11/2026, kiểu Canva): một chủ đề thống nhất cho cả bài —
// nền, khung thẻ, màu chữ, bạn cú Milo đổi tư thế từng trang, hình 3D trang trí.
// 7 trang: Bìa · Khởi động · Khám phá · Luyện tập · Vận dụng · Tổng kết · Cảm ơn. Giáo viên chỉ thay chữ.
// “Đổi chủ đề cả bộ” đổi giao diện theo vai trò (role) của vật mà giữ nguyên nội dung đã soạn.
import { f3dSrc as F } from './f3d-catalog';
import { fit, shrinkToFit } from './fit';
import { PHOTO_SRC, animDur, darkBg, uid, type Anim, type El, type FontKey, type Slide } from './types';

export type SetId = 'oli' | 'cosmos' | 'leaf' | 'lab' | 'vui' | 'sotay' | 'lan' | 'caphe' | 'tuyet';
export type ThemeSet = {
  id: SetId; name: string; sub: string; bg: string;
  card: string; edge: string; title: string; text: string;
  /** bảng màu đi cùng bộ (11/2026): bóng thẻ (tông nhạt của viền), màu nhấn (gạch dưới tiêu đề, số thứ tự),
   *  5 màu nhãn bước cùng độ đậm, cùng họ màu với bộ — chữ trắng trên nhãn đạt tương phản ≥ 4,5:1 */
  back: string; accent: string; steps: [string, string, string, string, string];
  /** tư thế Milo cho 7 trang */ mascots: string[];
  /** hình trang trí: bìa, trang nội dung, trang cuối */ deco: [string, string, string];
  /** băng dính giấy dán 2 góc thẻ (kiểu sổ tay / scrapbook) */ tape?: [string, string];
  /** dấu ấn riêng của bộ (không chỉ khác màu): nét viền thẻ, độ nghiêng thẻ (độ), độ dày viền, lớp bóng lệch, font tiêu đề */
  dash?: 'dash' | 'dot'; tilt?: number; sw?: number; noBack?: boolean; titleFont?: FontKey;
};
const M = (n: string) => `/brand/milo${n ? `-${n}` : ''}.webp`;

export const THEME_SETS: ThemeSet[] = [
  // gỗ – đất nung: nâu kem, nhấn cam đất; nhãn bước tông đất trầm
  { id: 'oli', name: 'Lớp học ô li', sub: 'Giấy kẻ ô · nâu kem', bg: 'oli', card: '#fffdf8', edge: '#d9a679', title: '#7a3e1d', text: '#4a2b18',
    back: '#ecd2b4', accent: '#c8553d', steps: ['#b5452e', '#2f6f86', '#5a7426', '#86497a', '#93611a'],
    mascots: ['professor', 'artist', 'robot', 'doctor', 'professor', 'astronaut', ''].map(M), deco: [F('books'), F('pencil'), F('party-popper')], dash: 'dash', titleFont: 'hand' },
  // đêm sao: thẻ chàm, chữ vàng kem; nhãn bước họ đá quý (hồng – tím – chàm – lam – ngọc)
  { id: 'cosmos', name: 'Phiêu lưu vũ trụ', sub: 'Trời sao · thẻ tối', bg: 'cosmos', card: '#1e1b4bee', edge: '#a78bfa', title: '#fde68a', text: '#e0e7ff', sw: 4,
    back: '#7c3aed59', accent: '#9333ea', steps: ['#be185d', '#7c3aed', '#4f46e5', '#0369a1', '#0f766e'],
    mascots: ['astronaut', 'robot', 'astronaut', 'professor', 'robot', 'astronaut', ''].map(M), deco: [F('crescent-moon'), F('star'), F('star')] },
  // lá non: xanh lá – ngọc – vàng rơm (màu liền kề, một điểm ấm)
  { id: 'leaf', name: 'Khu vườn xanh', sub: 'Lá cây · xanh bạc hà', bg: 'leaf', card: '#ffffff', edge: '#6fcf97', title: '#166534', text: '#14532d',
    back: '#c9efd6', accent: '#15803d', steps: ['#a16207', '#0e7490', '#15803d', '#0f766e', '#4d7c0f'],
    mascots: ['artist', '', 'doctor', 'artist', 'professor', 'artist', ''].map(M), deco: [F('seedling'), F('sunflower'), F('tulip')], sw: 10, noBack: true, titleFont: 'quick' },
  // phòng thí nghiệm: lam – chàm – ngọc (một họ màu lạnh)
  { id: 'lab', name: 'Phòng thí nghiệm', sub: 'Giấy kẻ ô · xanh dương', bg: 'paper', card: '#ffffff', edge: '#7cc4ec', title: '#075985', text: '#0c4a6e',
    back: '#d4ecfa', accent: '#0284c7', steps: ['#0e7490', '#0369a1', '#0f766e', '#4338ca', '#6d28d9'],
    mascots: ['doctor', 'robot', 'professor', 'doctor', 'robot', 'professor', ''].map(M), deco: [F('microscope'), F('light-bulb'), F('star')], dash: 'dot', titleFont: 'quick' },
  // kẹo ngọt: cam – hồng – ngọc – tím cùng độ đậm, nền kem (kiểu template Canva: khối màu bo cong tràn mép)
  { id: 'vui', name: 'Vui tươi', sub: 'Khối màu · kem cam', bg: 'blob', card: '#ffffff', edge: '#f59e5b', title: '#1e293b', text: '#334155',
    back: '#ffe0bf', accent: '#ea580c', steps: ['#c2410c', '#be185d', '#0f766e', '#6d28d9', '#b45309'],
    mascots: ['', 'artist', 'professor', 'robot', 'doctor', 'professor', ''].map(M), deco: [F('red-apple'), F('star'), F('party-popper')] },
  // scrapbook cổ điển: giấy be, băng dính giấy, nhãn màu phai (gạch – xanh xám – rêu – mận – mù tạt)
  { id: 'sotay', name: 'Sổ tay ấm', sub: 'Giấy be · băng dính', bg: 'kraft', card: '#fdfbf4', edge: '#c9a27e', title: '#6b3d1a', text: '#5b3a1e',
    back: '#e8d6bf', accent: '#a3472f', steps: ['#a3472f', '#3d6b74', '#5e7a34', '#7d4e6e', '#8a6a1f'],
    mascots: ['professor', 'artist', '', 'doctor', 'professor', 'artist', ''].map(M), deco: [F('books'), F('blossom'), F('backpack')], tape: ['#d6a078cc', '#9fd2abcc'], tilt: -1.5, titleFont: 'script' },
  // 3 bộ theo công thức 60–30–10 (nền chủ đạo – chữ tương phản – một màu nhấn lặp lại ở bóng thẻ, số thứ tự, gạch tiêu đề)
  // tạp chí hoa lan: nền kem ấm, chữ đen, nhấn hồng lan; viền đen mảnh + bóng lệch hồng (kiểu poster)
  { id: 'lan', name: 'Hoa lan', sub: 'Kem · đen · hồng lan', bg: '#ECE6DC', card: '#fffdf9', edge: '#050505', title: '#050505', text: '#1f1b1b', sw: 3,
    back: '#E65BC4', accent: '#E65BC4', steps: ['#a21caf', '#86198f', '#be185d', '#6b21a8', '#3f3a3a'],
    mascots: ['artist', 'professor', 'artist', 'doctor', 'professor', 'artist', ''].map(M), deco: [F('cherry-blossom'), F('tulip'), F('blossom')] },
  // xưởng rang: nền xanh rêu đậm, thẻ tối, chữ kem, nhấn cam (cặp màu đối nhau trên bánh xe màu)
  { id: 'caphe', name: 'Rang mộc', sub: 'Xanh rêu · kem · cam', bg: '#013230', card: '#024440', edge: '#FF6A1F', title: '#FF8A4C', text: '#F3EBDD', sw: 4, dash: 'dash',
    back: '#FF6A1F59', accent: '#d9480f', steps: ['#c2410c', '#0f766e', '#9a3412', '#115e59', '#b45309'],
    mascots: ['professor', 'robot', 'doctor', 'professor', 'robot', 'artist', ''].map(M), deco: [F('hot-beverage'), F('star'), F('party-popper')] },
  // tuyết mới: nền xanh trời, thẻ trắng như tuyết, chữ xanh navy, nhấn vàng chanh (bóng lệch vàng, số thứ tự vàng chữ navy)
  { id: 'tuyet', name: 'Tuyết mới', sub: 'Xanh trời · navy · vàng', bg: '#62A7EA', card: '#ffffff', edge: '#0C1B48', title: '#0C1B48', text: '#132a63', sw: 5, tilt: -1,
    back: '#F2EA1E', accent: '#F2EA1E', steps: ['#0C1B48', '#1d4ed8', '#1e3a8a', '#0369a1', '#3730a3'],
    mascots: ['astronaut', 'professor', 'robot', 'doctor', 'professor', 'astronaut', ''].map(M), deco: [F('mountain'), F('snowflake'), F('snowman-without-snow')] },
];
/** nền tối: theo mã nền có sẵn hoặc mã màu hex tối */
const isDark = (bg: string) => darkBg(bg) || (!!rgbOf(bg) && lum(rgbOf(bg)!) < 0.2);
/** màu số trong vòng tròn nhấn: trắng nếu đủ tương phản, không thì xanh đen (màu nhấn sáng như vàng) */
const onAccent = (t: ThemeSet) => (contrast('#ffffff', t.accent) >= 3 ? '#ffffff' : '#0f172a');
export const SET_BY_ID = Object.fromEntries(THEME_SETS.map((t) => [t.id, t])) as Record<SetId, ThemeSet>;

/** màu nhãn từng bước của tiết dạy */
export const STEP_COLOR: Record<string, string> = { 'Khởi động': '#f97316', 'Khám phá': '#2563eb', 'Luyện tập': '#16a34a', 'Vận dụng': '#9333ea', 'Tổng kết': '#db2777', 'Củng cố': '#db2777' };
export const STEPS = ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng', 'Tổng kết'] as const;
/** thời gian gợi ý (phút) cho 7 trang — cộng lại 35 phút */
const MINS = [2, 5, 8, 10, 6, 3, 1];

type Mk = { els: El[]; anims: Anim[] };
const txt = (m: Mk, text: string, x: number, y: number, w: number, h: number, size: number, color: string, role: El['role'], o: Partial<Extract<El, { kind: 'text' }>> = {}) => {
  const e = { id: uid(), kind: 'text', x, y, w, h, rot: 0, text, size, color, font: 'baloo', align: 'left', bg: '', role, ...o } as El;
  if (e.kind === 'text') e.size = shrinkToFit(text, w, h, e.size, !!e.bg);
  m.els.push(e); return e.id;
};
const img = (m: Mk, src: string, x: number, y: number, w: number, h: number, role: El['role'], name: string) => {
  const e = { id: uid(), kind: 'img', src, x, y, w, h, rot: 0, role, name } as El;
  m.els.push(e); return e.id;
};
const shape = (m: Mk, kind: 'round' | 'circle', x: number, y: number, w: number, h: number, fill: string, role: El['role'], o: Record<string, unknown> = {}) => {
  const e = { id: uid(), kind: 'shape', shape: kind, x, y, w, h, rot: 0, fill, stroke: fill, sw: 0, lock: true, role, ...o } as El;
  m.els.push(e); return e.id;
};
const anim = (m: Mk, el: string, fx: Anim['fx'], start: Anim['start'], o: Partial<Anim> = {}) => { m.anims.push({ id: uid(), el, fx, start, delay: 0, dur: animDur(fx), ...o }); };
/** khung thẻ bo góc + lớp bóng lệch phía sau (khoá để khỏi kéo nhầm) */
const card = (m: Mk, t: ThemeSet, x: number, y: number, w: number, h: number) => {
  if (!t.noBack) m.els.push({ id: uid(), kind: 'shape', shape: 'round', x: x + 16, y: y + 18, w, h, rot: t.tilt ?? 0, fill: t.back, stroke: t.back, sw: 0, lock: true, role: 'cardback' } as El);
  m.els.push({ id: uid(), kind: 'shape', shape: 'round', x, y, w, h, rot: t.tilt ?? 0, fill: t.card, stroke: t.edge, sw: t.sw ?? 6, dash: t.dash, lock: true, role: 'card' } as El);
  m.els.push(...tapes(t, x, y, w));
};
/** 2 miếng băng dính giấy chéo ở 2 góc trên của thẻ */
const tapes = (t: ThemeSet, x: number, y: number, w: number): El[] => (t.tape ?? []).map((c, k) => ({ id: uid(), kind: 'shape', shape: 'rect', x: k ? x + w - 150 : x - 40, y: y - 26, w: 190, h: 52, rot: k ? 24 : -26, fill: c, stroke: c, sw: 0, lock: true, role: 'tape' } as El));
/** màu nhãn bước theo bộ (cùng họ màu); nhãn lạ thì dùng màu chung */
const stepColor = (t: ThemeSet, label: string) => t.steps[STEPS.indexOf((label === 'Củng cố' ? 'Tổng kết' : label) as (typeof STEPS)[number])] ?? STEP_COLOR[label] ?? t.accent;
const step = (m: Mk, t: ThemeSet, label: string) => txt(m, label, 64, 46, 80 + label.length * 26, 78, 40, '#ffffff', 'step', { bg: stepColor(t, label), align: 'center' });

export type SetInfo = { title: string; sub: string };
/** nội dung của bài học điền vào bộ mẫu (lấy từ ngân hàng bài — xem setContentOf trong fromLesson.ts); không có thì để chữ mẫu */
export type SetContent = {
  warm: string[]; warmAns: string[];
  explore: string; exploreAns: string;
  practice: string[]; practiceAns: string[];
  apply: string; applyAns: string; math: boolean;
  summary: string[]; home: string;
};
const ansNote = (label: string, qs: string[], as: string[]) => qs.length ? `\n${label}:\n${qs.map((q, i) => `${i + 1}. ${q} → ${as[i] ?? ''}`).join('\n')}` : '';

/** 7 trang của bộ mẫu: có nội dung bài (ct) thì điền nội dung bài học, không thì chữ mẫu để cô thay */
export function makeSet(id: SetId, info: SetInfo, ct?: SetContent | null): Slide[] {
  const t = SET_BY_ID[id];
  const page = (i: number, phase: string | undefined, build: (m: Mk) => void, notes: string): Slide => {
    const m: Mk = { els: [], anims: [] }; build(m);
    if (t.titleFont) m.els.forEach((e) => { if (e.role === 'title' && e.kind === 'text') e.font = t.titleFont!; });
    return { id: uid(), bg: t.bg, els: m.els, anims: m.anims, trans: i === 0 ? 'fade' : 'morph', notes, phase, mins: MINS[i] };
  };
  const content = (i: number, label: string, title: string, body: (m: Mk, L: number) => void, notes: string) => page(i, label, (m) => {
    card(m, t, 130, 130, 1340, 640);
    // trục chữ cố định x 220 ở mọi trang, Milo luôn đứng góc phải dưới → chuyển trang mắt không phải tìm lại chỗ đọc
    const L = 220;
    const tt = txt(m, title, L, 186, 940, 104, fit(title, 940, 104, 80, 48), t.title, 'title');
    const bar = shape(m, 'round', L + 4, 298, 132, 12, t.accent, 'accent');
    body(m, L);
    const mm = img(m, t.mascots[i] || t.mascots[0], 1180, 460, 380, 420, 'mascot', 'Bạn cú Milo');
    const dd = img(m, t.deco[1], 1360, 50, 140, 140, 'deco', 'Hình trang trí');
    step(m, t, label);
    anim(m, tt, 'float', 'with', {}); anim(m, bar, 'fade', 'with', { delay: 0.15 }); anim(m, mm, 'float', 'with', { delay: 0.25 }); anim(m, dd, 'fade', 'with', { delay: 0.3 });
  }, notes);
  /** danh sách ý: số thứ tự trong vòng tròn màu nhấn (thay ngôi sao lặp lại) */
  const bullets = (m: Mk, L: number, lines: string[], size = 64, gap = 112) => {
    // câu dài (nội dung bài thật): dòng cao hơn, cùng một cỡ chữ cho cả danh sách (≥ 34 px)
    const long = lines.some((x) => x.length > 34);
    const g = long ? Math.min(140, Math.floor(420 / Math.max(1, lines.length))) : gap, h = long ? g - 14 : size + 20;
    const fs = long ? Math.min(...lines.map((x) => fit(x, 820, h, 52, 34))) : Math.round(size * 0.92);
    lines.forEach((x, j) => {
      shape(m, 'circle', L + 10, 336 + j * g, size, size, t.accent, 'accent', { text: String(j + 1), color: onAccent(t), size: Math.round(size * 0.56) });
      txt(m, x, L + size + 34, 330 + j * g, 820, h, fs, t.text, 'body');
    });
  };
  return [
    page(0, undefined, (m) => {
      card(m, t, 220, 170, 1220, 520);
      const mm = img(m, t.mascots[0], 80, 150, 560, 620, 'mascot', 'Bạn cú Milo');
      const name = info.title || 'Tên bài học';
      const tt = txt(m, name, 640, 230, 760, 270, fit(name, 760, 270, 110, 52), t.title, 'title');
      txt(m, info.sub, 646, 510, 760, 80, fit(info.sub, 760, 80, 46, 30), t.text, 'body', { font: 'quick' });
      img(m, t.deco[0], 1330, 90, 170, 170, 'deco', 'Hình trang trí');
      anim(m, tt, 'float', 'with', {}); anim(m, mm, 'float', 'with', { delay: 0.25 });
    }, 'Giới thiệu tên bài. Hỏi: “Hôm nay chúng ta sẽ học gì nhỉ?”'),
    content(1, 'Khởi động', 'Ai nhanh hơn?', (m, L) => bullets(m, L, ct?.warm.length ? ct.warm : ['Câu hỏi 1 …', 'Câu hỏi 2 …', 'Câu hỏi 3 …']),
      'Trò chơi khởi động 2–3 phút: cô đọc câu hỏi, tổ nào giơ tay nhanh và đúng được cộng điểm thi đua.' + ansNote('Đáp án', ct?.warm ?? [], ct?.warmAns ?? [])),
    content(2, 'Khám phá', 'Cùng khám phá', (m, L) => {
      if (ct?.explore) {
        // câu hỏi khám phá của bài + khung ảnh minh hoạ (ẩn khi chiếu đến khi cô chèn ảnh bài / SGK)
        txt(m, ct.explore, L, 320, 900, 200, 56, t.text, 'body');
        m.els.push({ id: uid(), kind: 'img', src: PHOTO_SRC, x: L, y: 535, w: 300, h: 220, rot: 0, rad: 10, hide: true, role: 'photo', name: 'Ảnh minh hoạ' } as El);
        return;
      }
      txt(m, 'Quan sát tranh và trả lời:\n… ?', L, 320, 900, 170, 56, t.text, 'body');
      m.els.push({ id: uid(), kind: 'shape', shape: 'tray', x: L, y: 515, w: 630, h: 150, rot: 0, fill: '#f59e0b', stroke: '#b45309', sw: 5, lock: true, shadow: true } as El);
      [0, 1, 2, 3, 4].forEach((k) => img(m, F('red-apple'), L + 22 + k * 120, 540, 100, 100, undefined, 'Hình minh hoạ'));
    }, 'Cho học sinh quan sát, nêu nhận xét. Rút ra kiến thức mới, ghi bảng.' + (ct?.explore ? `\nĐáp án: ${ct.exploreAns}` : '')),
    content(3, 'Luyện tập', ct?.practice.length ? (ct.math ? 'Tính' : 'Bài tập') : 'Bài 1. …', (m, L) => {
      const raw = ct?.practice.length ? ct.practice.map((x, j) => `${'abcdeg'[j]}) ${x}`) : ['a) …', 'b) …', 'c) …', 'd) …', 'e) …', 'g) …'];
      // bài ngắn (phép tính): 2 cột; bài dài (câu chữ): 1 cột, tối đa 4 bài, chữ cùng cỡ
      const two = raw.length > 3 && raw.every((x) => x.length <= 24);
      const items = two ? raw : raw.slice(0, 4);
      const half = Math.ceil(items.length / 2);
      const rh = two ? 110 : Math.min(130, Math.floor(420 / items.length)), w = two ? 400 : 860;
      const fs = Math.min(...items.map((x) => fit(x, w, rh - 12, 64, 34)));
      items.forEach((x, j) => {
        const col = two && j >= half ? 1 : 0, row = two ? j % half : j;
        txt(m, x, L + 20 + col * 440, 330 + row * rh, w, rh - 12, fs, t.text, 'body');
      });
    }, 'Học sinh làm cá nhân vào vở / bảng con. Gọi 3 em chữa bài, cả lớp nhận xét.' + ansNote('Đáp án', ct?.practice ?? [], ct?.practiceAns ?? [])),
    content(4, 'Vận dụng', ct && !ct.math ? 'Vận dụng' : 'Giải toán', (m, L) => {
      if (ct?.apply) { txt(m, ct.apply, L, 320, 900, 300, 56, t.text, 'body'); return; }
      txt(m, 'Đề bài: …\nHỏi: … ?', L, 330, 900, 180, 56, t.text, 'body');
      [0, 1, 2, 3].forEach((k) => img(m, F('pencil'), L + 20 + k * 160, 540, 120, 120, undefined, 'Hình minh hoạ'));
    }, 'Thảo luận nhóm đôi, trình bày bài giải. Liên hệ thực tế.' + (ct?.apply ? `\nĐáp án: ${ct.applyAns}` : '')),
    content(5, 'Tổng kết', 'Hôm nay em học được', (m, L) => bullets(m, L, ct?.summary.length ? ct.summary : ['Điều thứ nhất …', 'Điều thứ hai …', 'Điều thứ ba …'], 58, 100), 'Hỏi lại ý chính của bài. Khen các tổ, tổng kết điểm thi đua.'),
    page(6, undefined, (m) => {
      card(m, t, 220, 170, 1220, 520);
      const mm = img(m, t.mascots[6], 80, 150, 560, 620, 'mascot', 'Bạn cú Milo');
      const tt = txt(m, 'Cảm ơn các em!', 640, 250, 760, 190, fit('Cảm ơn các em!', 760, 190, 100, 56), t.title, 'title');
      const home = ct?.home ? `Về nhà: ${ct.home}` : 'Về nhà: …';
      txt(m, home, 646, 450, 760, 120, 46, t.text, 'body', { font: 'quick' });
      const d = img(m, t.deco[2], 1250, 520, 150, 150, 'deco', 'Hình trang trí');
      anim(m, tt, 'pop', 'with', {}); anim(m, mm, 'float', 'with', { delay: 0.25 }); anim(m, d, 'jump', 'after', { sound: 'tada' });
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
    const mapped = els.map((e): El => {
      if (e.role === 'card' && e.kind === 'shape') return { ...e, fill: t.card, stroke: t.edge, sw: t.sw ?? 6, dash: t.dash, rot: t.tilt ?? 0, op: 1 };
      if (e.role === 'cardback' && e.kind === 'shape') return { ...e, fill: t.back, stroke: t.back, rot: t.tilt ?? 0, hide: t.noBack || undefined };
      if (e.role === 'accent' && e.kind === 'shape') return { ...e, fill: t.accent, stroke: t.accent, ...(e.text ? { color: onAccent(t) } : {}) };
      if (e.role === 'step' && e.kind === 'text') return { ...e, bg: stepColor(t, e.text.trim()) };
      if (e.role === 'title' && e.kind === 'text') return { ...e, color: t.title, font: t.titleFont ?? e.font };
      if (e.role === 'divider' && e.kind === 'text') return { ...e, color: t.title, stroke: isDark(t.bg) ? '#0f172a' : e.stroke };
      if (e.role === 'body' && e.kind === 'text') return { ...e, color: t.text };
      if (e.role === 'mascot' && e.kind === 'img') { const k = i === 0 ? 0 : i === slides.length - 1 ? 6 : 1 + ((i - 1 + mi++) % 5); return { ...e, src: t.mascots[k] }; }
      if (e.role === 'deco' && e.kind === 'img') return { ...e, src: t.deco[i === 0 ? 0 : i === slides.length - 1 ? 2 : 1] };
      return e;
    });
    // màu chữ phải đọc được trên nền ngay phía dưới (nền chữ → hình khối bên dưới → thẻ / nền trang)
    const pageBg = rgbOf(t.bg) ? t.bg : darkBg(t.bg) ? '#151a46' : '#ffffff';
    return { ...s, bg: t.bg, scene: undefined, els: mapped.map((e, k) => {
      if (e.kind !== 'text' || !e.text.trim()) return e;
      const under = e.bg && rgbOf(e.bg) ? e.bg : backdropOf(mapped, k) ?? pageBg;
      if (contrast(e.color, under) >= (e.size >= 48 ? 3 : 4.5)) return e; // chuẩn WCAG: chữ lớn 3:1, chữ thường 4,5:1
      const best = [t.title, t.text, '#1e293b', '#f8fafc'].sort((a, b) => contrast(b, under) - contrast(a, under))[0];
      return { ...e, color: best };
    }) };
  });
}

/** màu của hình khối nằm dưới tâm chữ (vẽ trước chữ) — null nếu chữ nằm thẳng trên nền trang */
function backdropOf(els: El[], k: number): string | null {
  const e = els[k], cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  for (let j = k - 1; j >= 0; j--) {
    const b = els[j];
    if (b.kind !== 'shape' || b.hide || b.shape === 'flower-bullet' || !rgbOf(b.fill)) continue;
    if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) return b.fill;
  }
  return null;
}
type RGB = [number, number, number];
/** đọc màu #rgb / #rrggbb(aa) / rgb(a)(); màu quá trong suốt (alpha < 0,35) coi như không có */
function rgbOf(c?: string): RGB | null {
  const s = (c ?? '').trim();
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16)) as RGB;
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
  if (m) return m[2] && parseInt(m[2], 16) / 255 < 0.35 ? null : ([0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as RGB);
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return (p[3] ?? 1) < 0.35 ? null : [p[0], p[1], p[2]]; }
  return null;
}
const lum = ([r, g, b]: RGB) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
/** tỉ lệ tương phản WCAG giữa hai màu (không đọc được màu thì coi là đủ tương phản) */
function contrast(a: string, b: string): number {
  const x = rgbOf(a), y = rgbOf(b);
  if (!x || !y) return 21;
  const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** bài còn trống (1 trang mới tạo, ít vật) — thêm bộ mẫu thì thay luôn */
export const isBlankDeck = (slides: Slide[]) => slides.length === 1 && slides[0].els.length <= 2 && !slides[0].anims.length;
