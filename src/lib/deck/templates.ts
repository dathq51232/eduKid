// Mẫu trang theo hoạt động cho bài thao giảng: dùng hình dán có sẵn trong dự án (public/emoji, public/edu-icons).
// Giáo viên thêm mẫu vào bài rồi sửa chữ, đổi hình tuỳ ý.
import { f3dSrc } from './f3d-catalog';
import { uid, type Anim, type El, type Slide } from './types';

const ST = f3dSrc;
const EM = f3dSrc;

type Mk = { els: El[]; anims: Anim[] };
const T = (m: Mk, text: string, x: number, y: number, w: number, h: number, size: number, color = '#1d4ed8', o: Partial<Extract<El, { kind: 'text' }>> = {}) => {
  const e: El = { id: uid(), kind: 'text', x, y, w, h, rot: 0, text, size, color, font: 'baloo', align: 'center', bg: '', ...o };
  m.els.push(e); return e.id;
};
const I = (m: Mk, src: string, x: number, y: number, s: number, o: Partial<El> = {}) => {
  const e = { id: uid(), kind: 'img', src, x, y, w: s, h: s, rot: 0, ...o } as El;
  m.els.push(e); return e.id;
};
const S = (m: Mk, shape: Extract<El, { kind: 'shape' }>['shape'], x: number, y: number, w: number, h: number, fill: string, text = '', o: Partial<El> = {}) => {
  const e = { id: uid(), kind: 'shape', shape, x, y, w, h, rot: 0, fill, stroke: '#ffffff', sw: 4, text, color: '#1f2937', size: Math.round(Math.min(w, h) * 0.45), ...o } as El;
  m.els.push(e); return e.id;
};
const A = (m: Mk, el: string, fx: Anim['fx'], start: Anim['start'] = 'click', o: Partial<Anim> = {}) => { m.anims.push({ id: uid(), el, fx, start, delay: 0, dur: 0.6, ...o }); };
const slide = (bg: string, m: Mk, notes = '', sound?: string): Slide => ({ id: uid(), bg, els: m.els, anims: m.anims, trans: 'fade', notes, sound });

export type Tpl = { id: string; title: string; desc: string; bg: string; preview: string[]; make: () => Slide[] };

export const SLIDE_TEMPLATES: Tpl[] = [
  {
    id: 'title', title: 'Trang tiêu đề', desc: 'Tên bài, lớp, hình trang trí', bg: 'sun', preview: [ST('sun'), ST('star')],
    make: () => { const m: Mk = { els: [], anims: [] };
      const t = T(m, 'Tên bài học', 160, 300, 1280, 170, 100); T(m, 'Môn · Lớp', 400, 500, 800, 80, 44, '#7c2d12', { font: 'quick' });
      const a = I(m, ST('sun'), 1280, 40, 220); const b = I(m, ST('star'), 120, 80, 130);
      A(m, t, 'zoom', 'with', { dur: 0.8 }); A(m, a, 'spin-in', 'with', { delay: 0.3 }); A(m, b, 'pop', 'after', { sound: 'magic' });
      return [slide('sun', m)]; },
  },
  {
    id: 'content', title: 'Trang nội dung', desc: 'Tiêu đề, hình bên trái, chữ bên phải', bg: 'white', preview: [EM('open-book')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Tiêu đề trang', 80, 50, 1440, 120, 72, '#1d4ed8', { align: 'left' });
      const p = I(m, EM('open-book'), 120, 240, 520);
      const t = T(m, 'Nội dung bài học…\nBấm đúp để sửa chữ.', 720, 280, 780, 420, 48, '#1f2937', { font: 'quick', align: 'left', bg: '#f1f5f9' });
      A(m, p, 'fly-left'); A(m, t, 'fade', 'after');
      return [slide('white', m)]; },
  },
  {
    id: 'split', title: 'Hai cột cân đối', desc: 'Chia nội dung và hình minh hoạ thành hai mảng rõ ràng', bg: 'leaf', preview: [EM('open-book'), ST('sunflower')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Cùng tìm hiểu', 110, 42, 1380, 120, 76, '#166534', { align: 'left' });
      S(m, 'round', 90, 210, 680, 570, '#ffffff', '', { stroke: '#86efac', sw: 5 } as Partial<El>);
      S(m, 'round', 820, 210, 690, 570, '#ffffff', '', { stroke: '#86efac', sw: 5 } as Partial<El>);
      T(m, 'Ý chính\nViết nội dung ở đây…', 150, 300, 560, 360, 54, '#14532d', { font: 'quick' });
      I(m, ST('sunflower'), 960, 270, 400, { name: 'Hình minh hoạ' });
      return [slide('leaf', m)]; },
  },
  {
    id: 'cards', title: 'Ba thẻ ý chính', desc: 'Trình bày ba ý ngắn bằng thẻ màu và hình dán', bg: 'lollipop', preview: [ST('star'), ST('red-apple')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Ba điều em khám phá', 140, 45, 1320, 120, 76, '#7c2d12');
      const cards = [
        { x: 90, color: '#dbeafe', pic: 'open-book', text: 'Ý thứ nhất…' },
        { x: 575, color: '#dcfce7', pic: 'seedling', text: 'Ý thứ hai…' },
        { x: 1060, color: '#fce7f3', pic: 'star', text: 'Ý thứ ba…' },
      ];
      cards.forEach((c, i) => {
        S(m, 'round', c.x, 230, 450, 530, c.color, '', { stroke: '#ffffff', sw: 5, shadow: true } as Partial<El>);
        I(m, ST(c.pic), c.x + 115, 280, 220, { name: `Hình ý ${i + 1}` });
        T(m, c.text, c.x + 35, 560, 380, 120, 48, '#334155', { font: 'quick' });
      });
      return [slide('lollipop', m)]; },
  },
  {
    id: 'quiz-image', title: 'Trắc nghiệm có hình', desc: 'Câu hỏi tương tác với đáp án minh hoạ bằng tranh', bg: 'cosmos', preview: [ST('rabbit'), ST('cat')],
    make: () => { const m: Mk = { els: [], anims: [] };
      const q = { id: uid(), kind: 'quiz', x: 220, y: 120, w: 1160, h: 700, rot: 0, q: 'Con vật nào xuất hiện trong tranh?', opts: [
        { text: 'Thỏ', img: ST('rabbit') }, { text: 'Mèo', img: ST('cat') }, { text: 'Vịt', img: ST('duck') }, { text: 'Cá', img: ST('fish') },
      ], a: 0, cols: 2 } as El;
      m.els.push(q); A(m, q.id, 'pop', 'with', { sound: 'pop' });
      return [slide('cosmos', m, 'Quan sát hình minh hoạ ở các đáp án, rồi chọn đáp án đúng.')]; },
  },
  {
    id: 'gift', title: 'Khởi động: Hộp quà bí mật', desc: 'Bấm vào từng hộp quà để mở câu hỏi', bg: 'peach', preview: [ST('wrapped-gift')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Hộp quà bí mật', 200, 40, 1200, 130, 84, '#be123c');
      const qs = ['Câu hỏi 1: …', 'Câu hỏi 2: …', 'Câu hỏi 3: …'];
      qs.forEach((q, i) => {
        const g = I(m, ST('wrapped-gift'), 170 + i * 470, 260, 300, { name: `Hộp quà ${i + 1}` });
        const n = T(m, String(i + 1), 170 + i * 470 + 115, 560, 70, 70, 48, '#ffffff', { bg: '#e11d48' });
        const c = S(m, 'bubble', 110 + i * 470, 250, 420, 330, '#ffffff', q, { stroke: '#f43f5e', sw: 5, size: 40 } as Partial<El>);
        A(m, g, 'zoom-out', 'click', { trigger: g, sound: 'magic', dur: 0.5 });
        A(m, n, 'fade-out', 'with', { trigger: g });
        A(m, c, 'pop', 'after', { trigger: g, sound: 'tada' });
      });
      return [slide('peach', m, 'Cho các em chọn số hộp quà, cô bấm vào hộp đó để mở câu hỏi.', 'drum')]; },
  },
  {
    id: 'quiz', title: 'Ai nhanh hơn? (4 lựa chọn)', desc: 'Bấm đáp án: đúng có pháo giấy, sai rung lên', bg: 'grape', preview: [EM('light-bulb')],
    make: () => { const m: Mk = { els: [], anims: [] };
      I(m, EM('light-bulb'), 60, 40, 150);
      const q = { id: uid(), kind: 'quiz', x: 220, y: 150, w: 1160, h: 650, rot: 0, q: '2 + 3 = ?', opts: ['4', '5', '6', '7'], a: 1, cols: 2 } as El;
      m.els.push(q); A(m, q.id, 'pop', 'with', { sound: 'pop' });
      return [slide('grape', m, 'Cả lớp giơ tay chọn đáp án, cô bấm vào đáp án được chọn nhiều nhất.')]; },
  },
  {
    id: 'drag', title: 'Kéo thả: Đếm và ghép số', desc: 'Kéo thẻ số vào đúng nhóm hình', bg: 'mint', preview: [ST('red-apple')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Đếm rồi kéo số vào ô', 200, 30, 1200, 110, 66, '#065f46');
      const groups = [[2, 'red-apple'], [3, 'strawberry'], [4, 'banana']] as const;
      const zones: string[] = [];
      groups.forEach(([n, pic], gi) => {
        const x0 = 90 + gi * 500;
        S(m, 'tray', x0 - 15, 145, 330, 325, '#f59e0b', '', { stroke: '#b45309', sw: 5, lock: true, shadow: true } as Partial<El>);
        for (let k = 0; k < n; k++) I(m, ST(pic), x0 + (k % 2) * 150 + (n === 3 && k === 2 ? 75 : 0), 160 + Math.floor(k / 2) * 150, 140, { lock: true });
        const z = { id: uid(), kind: 'drop', x: x0 + 40, y: 500, w: 250, h: 170, rot: 0, label: 'Thả số vào đây', accept: [], color: '#2563eb' } as El;
        m.els.push(z); zones.push(z.id);
      });
      const cards = [4, 2, 3].map((n, i) => {
        const id = S(m, 'round', 420 + i * 270, 720, 150, 150, ['#fde68a', '#bfdbfe', '#fbcfe8'][i], String(n), { drag: true, size: 80 } as Partial<El>);
        return [n, id] as const;
      });
      groups.forEach(([n], gi) => { const z = m.els.find((e) => e.id === zones[gi]); if (z && z.kind === 'drop') z.accept = cards.filter(([c]) => c === n).map(([, id]) => id); });
      return [slide('mint', m, 'Mời từng em lên kéo thẻ số vào ô dưới nhóm hình tương ứng.')]; },
  },
  {
    id: 'sort', title: 'Sắp xếp theo thứ tự', desc: 'Xếp chữ thành câu, số bé → lớn, các bước, tranh theo truyện', bg: 'sky', preview: [EM('baby-chick'), ST('star')],
    make: () => { const m: Mk = { els: [], anims: [] };
      I(m, EM('baby-chick'), 60, 40, 140);
      const a = { id: uid(), kind: 'sort', x: 180, y: 150, w: 1240, h: 600, rot: 0, prompt: 'Xếp các từ thành câu đúng', items: ['Em', 'yêu', 'trường', 'em'] } as El;
      const b = { id: uid(), kind: 'sort', x: 180, y: 150, w: 1240, h: 600, rot: 0, prompt: 'Xếp các số từ bé đến lớn', items: ['2', '5', '7', '9'] } as El;
      m.els.push(a); A(m, a.id, 'fade', 'with');
      const m2: Mk = { els: [b], anims: [] }; A(m2, b.id, 'fade', 'with');
      return [slide('sky', m, 'Mời học sinh bấm lần lượt các thẻ theo thứ tự đúng. Bấm thẻ đã đặt để trả lại.'), slide('mint', m2)]; },
  },
  {
    id: 'scene', title: 'Khám phá 3D', desc: 'Chèn cảnh từ Bài 3D của tôi, xoay khi chiếu', bg: 'sky', preview: [ST('house')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Cùng khám phá', 200, 30, 1200, 110, 72, '#1e3a8a');
      m.els.push({ id: uid(), kind: 'scene3d', x: 200, y: 160, w: 1200, h: 680, rot: 0, lesson: '', title: 'Chọn bài 3D' } as El);
      return [slide('sky', m, 'Chọn ô cảnh 3D rồi bấm "Chọn bài 3D" ở khung bên phải.')]; },
  },
  {
    id: 'word', title: 'Ô chữ bí mật', desc: 'Mở từng chữ khi lớp trả lời đúng', bg: 'grape', preview: [ST('rabbit')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Ô chữ bí mật', 200, 40, 1200, 110, 78, '#4c1d95');
      I(m, ST('rabbit'), 650, 160, 300, { name: 'Gợi ý' });
      const word = ['T', 'H', 'Ỏ'];
      word.forEach((c, i) => {
        S(m, 'mystery', 470 + i * 230, 520, 200, 220, '#7c3aed', '?', { stroke: '#4c1d95', sw: 5, color: '#ffffff', size: 84, lock: true } as Partial<El>);
        const l = S(m, 'round', 470 + i * 230, 520, 200, 220, '#ffffff', c, { stroke: '#7c3aed', sw: 6, size: 130, color: '#4c1d95' } as Partial<El>);
        A(m, l, 'spin-in', 'click', { sound: 'ding' });
      });
      return [slide('grape', m, 'Mỗi lần lớp đoán đúng một chữ, cô bấm "Tiếp" để mở chữ đó.')]; },
  },
  {
    id: 'wheel', title: 'Vòng quay may mắn', desc: 'Bấm mũi tên cho bánh xe quay', bg: 'peach', preview: [ST('star')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Vòng quay may mắn', 200, 30, 1200, 110, 76, '#9a3412');
      const w = S(m, 'wheel', 560, 170, 480, 480, '#fbbf24', '?', { stroke: '#f59e0b', sw: 6, size: 96, color: '#9a3412', shadow: true } as Partial<El>);
      const btn = S(m, 'arrow', 1120, 360, 260, 120, '#ef4444', 'Quay!', { stroke: '#b91c1c', sw: 5, size: 40, color: '#ffffff', rot: 180, shadow: true } as Partial<El>);
      A(m, w, 'spin', 'click', { trigger: btn, dur: 2.4, sound: 'drum' });
      A(m, w, 'pulse', 'after', { trigger: btn, sound: 'tada' });
      return [slide('peach', m, 'Bấm vào mũi tên "Quay!" để bánh xe quay, sau đó gọi một bạn trả lời.')]; },
  },
  {
    id: 'story', title: 'Kể chuyện theo tranh', desc: 'Tranh hiện lần lượt kèm lời', bg: 'sky', preview: [ST('duck'), ST('fish')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Kể chuyện theo tranh', 200, 30, 1200, 110, 72, '#0e7490');
      const pics = [['duck', 'Vịt con ra ao…'], ['fish', 'Gặp bạn cá…'], ['sunflower', 'Cùng chơi bên hoa…']] as const;
      pics.forEach(([p, cap], i) => {
        const a = I(m, ST(p), 130 + i * 470, 200, 340);
        const c = T(m, cap, 80 + i * 470, 580, 440, 110, 40, '#0f172a', { font: 'quick', bg: '#ffffffcc' });
        A(m, a, i === 1 ? 'fly-up' : 'fly-left', 'click', { sound: 'whoosh' }); A(m, c, 'fade', 'after');
      });
      return [slide('sky', m)]; },
  },
  {
    id: 'prep', title: 'Đầu tiết: Chuẩn bị đồ dùng', desc: '4 thẻ Bento nhắc học sinh chuẩn bị sách, vở, bút, bảng con', bg: 'sky', preview: [ST('books'), ST('pencil')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Chuẩn bị vào học', 200, 36, 1200, 100, 72, '#0369a1');
      const items = [
        ['books', '① Sách giáo khoa', '#dbeafe', '#3b82f6'],
        ['notebook', '② Vở ghi · Bảng con', '#dcfce7', '#22c55e'],
        ['pencil', '③ Bút chì · Thước kẻ', '#fef3c7', '#f59e0b'],
        ['star', '④ Ngồi ngay ngắn', '#fce7f3', '#ec4899'],
      ] as const;
      items.forEach(([pic, lb, bg, bd], i) => {
        const x = 80 + i * 365;
        const c = S(m, 'round', x, 190, 340, 540, bg, '', { stroke: bd, sw: 6, shadow: true, lock: true } as Partial<El>);
        const im = I(m, ST(pic), x + 65, 235, 210, { name: lb });
        const tx = T(m, lb, x + 20, 480, 300, 180, 42, '#0f172a', { font: 'baloo' });
        A(m, c, 'pop', i === 0 ? 'with' : 'after', { sound: i === 0 ? 'pop' : undefined });
        A(m, im, 'pop', 'with'); A(m, tx, 'fade', 'with');
      });
      return [slide('sky', m, 'Kiểm tra đồ dùng học tập và tư thế ngồi của cả lớp trước khi vào bài.')]; },
  },
  {
    id: 'puzzle', title: 'Khởi động: Mảnh ghép bí ẩn', desc: 'Trả lời 4 câu hỏi để lật mở bức tranh chủ đề dưới 4 mảnh ghép', bg: 'sun', preview: [ST('sunflower'), ST('star')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Lật mảnh ghép bí ẩn', 200, 32, 1200, 100, 74, '#6d28d9');
      S(m, 'round', 520, 170, 560, 540, '#fef3c7', '', { stroke: '#f59e0b', sw: 6, shadow: true, lock: true } as Partial<El>);
      I(m, ST('sunflower'), 650, 200, 300, { lock: true, name: 'Hình bí mật' });
      T(m, 'Chủ đề bài học!', 545, 520, 510, 140, 48, '#b45309', { bg: '#ffffffeb', lock: true });
      const cols: [string, string][] = [['#fbbf24', '#d97706'], ['#38bdf8', '#0284c7'], ['#4ade80', '#16a34a'], ['#f472b6', '#db2777']];
      [0, 1, 2, 3].forEach((i) => {
        const c = i % 2, r = Math.floor(i / 2);
        S(m, 'round', c === 0 ? 60 : 1110, 180 + r * 270, 430, 240, '#ffffff', `Câu ${i + 1}: … ?`, { stroke: cols[i][1], sw: 5, size: 38, color: '#0f172a', shadow: true } as Partial<El>);
        const p = S(m, 'mystery', 520 + c * 280, 170 + r * 270, 280, 270, cols[i][0], `Mảnh ${i + 1}`, { stroke: cols[i][1], sw: 5, color: '#ffffff', size: 46, shadow: true } as Partial<El>);
        A(m, p, 'zoom-out', 'click', { trigger: p, sound: 'magic', dur: 0.5 });
      });
      return [slide('sun', m, 'Học sinh chọn mảnh ghép và trả lời câu hỏi tương ứng, cô bấm vào mảnh ghép đó để lật mở bức tranh.')]; },
  },
  {
    id: 'stars', title: 'Củng cố: Sao thưởng', desc: 'Tổng kết, khen cả lớp, âm thanh vui', bg: 'sun', preview: [ST('trophy'), ST('star')],
    make: () => { const m: Mk = { els: [], anims: [] };
      const t = T(m, 'Cả lớp giỏi lắm!', 200, 40, 1200, 130, 92, '#b45309');
      const c = I(m, ST('trophy'), 600, 190, 400);
      A(m, t, 'zoom', 'with'); A(m, c, 'drop', 'after', { sound: 'tada', dur: 1.2 });
      [0, 1, 2, 3, 4].forEach((i) => { const s = I(m, ST('star'), 180 + i * 260, 640, 170); A(m, s, 'pop', 'after', { sound: 'star', dur: 0.4 }); });
      return [slide('sun', m, 'Khen ngợi, nhận xét tiết học.', 'clap')]; },
  },
  {
    id: 'exit', title: 'Củng cố: Vé ra về (1–2–3 ngón tay)', desc: 'Học sinh giơ 1, 2 hoặc 3 ngón tay tự đánh giá mức độ hiểu bài', bg: 'mint', preview: [ST('star'), ST('sun')],
    make: () => { const m: Mk = { els: [], anims: [] };
      T(m, 'Hôm nay em hiểu bài thế nào?', 160, 36, 1280, 100, 68, '#065f46');
      const levels = [
        ['grinning-face-with-smiling-eyes', '1 ngón tay ☝️', 'Em hiểu bài rất rõ!', '#dcfce7', '#22c55e'],
        ['slightly-smiling-face', '2 ngón tay ✌️', 'Em cần luyện thêm!', '#fef3c7', '#f59e0b'],
        ['raised-hand', '3 ngón tay 🤟', 'Em muốn hỏi thêm cô!', '#dbeafe', '#3b82f6'],
      ] as const;
      levels.forEach(([pic, f, desc, bg, bd], i) => {
        const x = 100 + i * 480;
        const c = S(m, 'round', x, 185, 440, 560, bg, '', { stroke: bd, sw: 6, shadow: true, lock: true } as Partial<El>);
        const im = I(m, ST(pic), x + 110, 220, 220, { name: desc });
        T(m, f, x + 30, 470, 380, 90, 44, '#0f172a', { bg: '#ffffffd9' });
        T(m, desc, x + 25, 580, 390, 120, 38, '#1e293b', { font: 'quick' });
        A(m, c, 'fly-up', 'after', { delay: i * 0.12 }); A(m, im, 'pop', 'with');
      });
      return [slide('mint', m, 'Cho học sinh giơ 1, 2 hoặc 3 ngón tay để tự đánh giá mức độ hiểu bài hôm nay.')]; },
  },
];

/** Bài mới từ một mẫu (trang tiêu đề + trang mẫu) */
export function deckFromTemplate(id: string, title: string): Slide[] {
  const t = SLIDE_TEMPLATES.find((x) => x.id === id);
  const first = SLIDE_TEMPLATES[0].make();
  const tt = first[0].els.find((e) => e.kind === 'text');
  if (tt && tt.kind === 'text') tt.text = title;
  return t && t.id !== 'title' ? [...first, ...t.make()] : first;
}

/** Hình dán 3D sắc nét có sẵn trong dự án để chèn vào trang */
const uniq = (a: string[]) => [...new Set(a)];
export const STICKER_SETS: { label: string; items: string[] }[] = [
  { label: 'Thú vật', items: uniq(['rabbit', 'cat', 'dog', 'duck', 'fish', 'butterfly', 'lady-beetle', 'bear', 'fox', 'lion', 'tiger', 'monkey', 'owl', 'horse', 'pig', 'rooster', 'baby-chick', 'dolphin', 'elephant', 'giraffe', 'penguin', 'frog', 'turtle', 'snail', 'ant', 'crab', 'deer', 'ewe', 't-rex', 'snake', 'chameleon', 'squirrel', 'whale'].map(ST)) },
  { label: 'Trái cây · rau', items: uniq(['red-apple', 'banana', 'strawberry', 'carrot', 'grapes', 'pear', 'mango', 'tangerine', 'tomato', 'lemon', 'kiwi-fruit', 'cucumber', 'eggplant', 'broccoli', 'mushroom', 'peanuts', 'ear-of-corn', 'watermelon', 'pineapple', 'cherries', 'peach', 'pumpkin', 'potato', 'blueberry', 'dragonfruit', 'cabbage', 'garlic', 'onion', 'pepper'].map(ST)) },
  { label: 'Đồ dùng', items: uniq(['pencil', 'open-book', 'books', 'scissors', 'straight-ruler', 'paintbrush', 'bell', 'drum', 'trumpet', 'guitar', 'headphone', 'glasses', 'balance-scale', 'chair', 'bucket', 'broom', 'teapot', 'spoon', 'candle', 'light-bulb', 'envelope', 'bicycle', 'bus', 'delivery-truck', 'sailboat', 'car', 'rocket', 'pliers', 'saw', 'tape-measure', 'shovel'].map(ST)) },
  { label: 'Thiên nhiên · khác', items: uniq(['sun', 'sunflower', 'deciduous-tree', 'house', 'balloon', 'star', 'crown', 'trophy', 'wrapped-gift', 'rainbow', 'crescent-moon', 'cloud', 'droplet', 'fire', 'blossom', 'mountain', 'school', 'planet', 'cactus', 'icecream', 'kite'].map(ST)) },
];
