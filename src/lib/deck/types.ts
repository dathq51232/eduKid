// Bài thao giảng (11/2026): bài trình chiếu kiểu PowerPoint lưu trong cột data của bảng slide_decks (migration 0046).
// Trang 16:9 kích thước chuẩn SW × SH (đơn vị = px khi trang hiện đúng 1600 px), hiển thị co giãn theo màn hình.

export const SW = 1600, SH = 900;

export type FontKey = 'baloo' | 'quick' | 'script' | 'hand';
export const FONTS: Record<FontKey, { label: string; css: string; weight: number }> = {
  baloo: { label: 'Baloo (tròn, đậm)', css: "PraiseBaloo, 'Baloo 2', var(--font-display), sans-serif", weight: 800 },
  quick: { label: 'Quicksand (gọn)', css: "var(--font-display), Quicksand, Arial, sans-serif", weight: 700 },
  script: { label: 'Chữ viết tay', css: 'PraiseScript, cursive', weight: 600 },
  hand: { label: 'Chữ tập viết (HP001)', css: "'DeckHP4', PraiseScript, cursive", weight: 400 },
};

export type ShapeKind = 'rect' | 'round' | 'circle' | 'star' | 'heart' | 'arrow' | 'cloud' | 'bubble' | 'wheel' | 'mystery' | 'tray' | 'banner' | 'sticky' | 'plaid-card' | 'badge-card' | 'flower-bullet';
export type ElBase = {
  id: string; x: number; y: number; w: number; h: number; rot: number;
  /** khi trình chiếu: kéo được (dùng cho bài kéo thả) */
  drag?: boolean;
  /** bấm vào thì sang trang số mấy (1 = trang đầu) */
  link?: number;
  /** khoá vị trí khi soạn */
  lock?: boolean;
  /** nhóm vật (chọn một vật trong nhóm là chọn cả nhóm) */
  group?: string;
  /** vai trò trong bố cục chủ đề (đổi chủ đề cả bài thì đổi màu theo): khung nội dung, nhãn bài, hình thức làm bài, chữ trang chia */
  role?: 'card' | 'badge' | 'mode' | 'title' | 'divider' | 'cardback' | 'step' | 'body' | 'mascot' | 'deco' | 'tape' | 'photo';
  /** độ trong suốt 0.1–1 (mặc định 1) */
  op?: number;
  /** lật ngang */
  flip?: boolean;
  /** ẩn (không hiện khi trình chiếu; khi soạn hiện mờ) */
  hide?: boolean;
};
export type TextEl = ElBase & { kind: 'text'; text: string; size: number; color: string; font: FontKey; align: 'left' | 'center' | 'right'; bg: string; italic?: boolean;
  /** viền chữ (chữ tiêu đề kiểu trang trí) và đổ bóng */
  stroke?: string; strokeW?: number; shadow?: boolean };
export type ImgEl = ElBase & { kind: 'img'; src: string; /** ảnh trong Kho của tôi (đường dẫn kho, cần ký khi hiện) */ asset?: boolean; name?: string;
  /** bo góc 0–100 (% bán kính tối đa) · đổ bóng mềm */ rad?: number; shadow?: boolean };
export type ShapeEl = ElBase & { kind: 'shape'; shape: ShapeKind; fill: string; stroke: string; sw: number; text?: string; color?: string; size?: number;
  /** bo góc 0–100 (% bán kính tối đa, hình chữ nhật / thẻ) · đổ bóng mềm · kiểu nét viền */ rad?: number; shadow?: boolean; dash?: 'solid' | 'dash' | 'dot' };
export type QuizOpt = { text: string; img?: string; imageAsset?: boolean; accent?: string };
export type QuizMode = 'single' | 'tf' | 'fill';
export type QuizEl = ElBase & { kind: 'quiz'; q: string; opts: Array<string | QuizOpt>; a: number; cols: 1 | 2; mode?: QuizMode };
export const quizText = (o: string | QuizOpt): string => (typeof o === 'string' ? o : o.text);
export const quizImage = (o: string | QuizOpt): string | undefined => (typeof o === 'string' ? undefined : o.img);
export type DropEl = ElBase & { kind: 'drop'; label: string; /** id các vật kéo đúng vào ô này */ accept: string[]; color: string };
export type SceneEl = ElBase & { kind: 'scene3d'; lesson: string; title: string };
/** Trò chơi Sắp xếp: items là thứ tự ĐÚNG; khi chiếu các thẻ bị xáo, học sinh bấm / kéo thẻ vào ô theo thứ tự */
export type SortEl = ElBase & { kind: 'sort'; prompt: string; items: string[] };
/** Bảng thi đua tổ: khi trình chiếu lấy điểm tuần này của các tổ trong lớp (Thi đua tổ) */
export type TeamsEl = ElBase & { kind: 'teams'; title: string };
export type El = TextEl | ImgEl | ShapeEl | QuizEl | DropEl | SceneEl | SortEl | TeamsEl;

export type FxGroup = 'in' | 'em' | 'out';
export type Fx =
  | 'fade' | 'fly-left' | 'fly-right' | 'fly-up' | 'fly-down' | 'pop' | 'zoom' | 'spin-in' | 'drop'
  | 'pulse' | 'shake' | 'wiggle' | 'blink' | 'grow' | 'spin' | 'jump'
  | 'fade-out' | 'fly-out' | 'zoom-out';
export const FX: { id: Fx; group: FxGroup; icon: string; label: string }[] = [
  { id: 'fade', group: 'in', icon: '✨', label: 'Hiện dần' }, { id: 'fly-left', group: 'in', icon: '⇢', label: 'Bay từ trái' },
  { id: 'fly-right', group: 'in', icon: '⇠', label: 'Bay từ phải' }, { id: 'fly-up', group: 'in', icon: '⇡', label: 'Bay từ dưới' },
  { id: 'fly-down', group: 'in', icon: '⇣', label: 'Rơi xuống' }, { id: 'pop', group: 'in', icon: '⤒', label: 'Nảy lên' },
  { id: 'zoom', group: 'in', icon: '🔍', label: 'Phóng to' }, { id: 'spin-in', group: 'in', icon: '⟲', label: 'Xoay vòng' },
  { id: 'drop', group: 'in', icon: '🎈', label: 'Thả bóng' },
  { id: 'pulse', group: 'em', icon: '💓', label: 'Đập nhịp' }, { id: 'shake', group: 'em', icon: '〰', label: 'Rung' },
  { id: 'wiggle', group: 'em', icon: '🙃', label: 'Lắc lư' }, { id: 'blink', group: 'em', icon: '💡', label: 'Nhấp nháy' },
  { id: 'grow', group: 'em', icon: '⬆', label: 'Lớn lên' }, { id: 'spin', group: 'em', icon: '🔄', label: 'Quay tròn' },
  { id: 'jump', group: 'em', icon: '🦘', label: 'Nhảy' },
  { id: 'fade-out', group: 'out', icon: '💨', label: 'Mờ dần' }, { id: 'fly-out', group: 'out', icon: '🫧', label: 'Bay ra' },
  { id: 'zoom-out', group: 'out', icon: '⤓', label: 'Thu nhỏ' },
];
export const FX_BY_ID = Object.fromEntries(FX.map((f) => [f.id, f])) as Record<Fx, (typeof FX)[number]>;

export type Start = 'click' | 'with' | 'after';
export const START_LABEL: Record<Start, string> = { click: 'Khi bấm', with: 'Cùng lúc với trước', after: 'Sau hiệu ứng trước' };
/** kiểu chuyển động của hiệu ứng (auto: theo từng hiệu ứng) */
export type Ease = 'auto' | 'linear' | 'smooth' | 'bounce' | 'elastic';
export const EASE_LABEL: Record<Ease, string> = { auto: 'Tự nhiên', linear: 'Đều', smooth: 'Êm', bounce: 'Nảy', elastic: 'Đàn hồi' };
export type Anim = {
  id: string; el: string; fx: Fx; start: Start; delay: number; dur: number;
  ease?: Ease;
  /** số lần chạy (1–5); 0 = lặp mãi (chỉ hiệu ứng nhấn mạnh) */
  rep?: number;
  /** âm thanh đi kèm: tên âm có sẵn hoặc "asset:<đường dẫn kho>" */
  sound?: string;
  /** chỉ chạy khi bấm vào vật này (kích hoạt — trigger) */
  trigger?: string;
};

export type Trans = 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
export const TRANS_LABEL: Record<Trans, string> = { none: 'Không', fade: 'Mờ dần', slide: 'Trượt sang', zoom: 'Phóng to', flip: 'Lật trang' };

export type SceneKind = 'garden' | 'pond' | 'kitchen' | 'class' | 'yard' | 'sea' | 'space' | 'farm' | 'tet' | 'dino' | 'candy' | 'family';
/** quiet: nền dịu cho trang nội dung — chỉ màu nền của cảnh + một hình nhỏ ở góc, để chữ và câu hỏi nổi bật */
export type SceneVariant = 'cover' | 'center' | 'right' | 'left' | 'bottom' | 'quiet';
export type Slide = { id: string; bg: string; els: El[]; anims: Anim[]; trans: Trans; notes: string; sound?: string;
  /** thời gian chuyển trang (giây) */ transDur?: number;
  /** tự sang bước / trang sau ... giây khi trình chiếu (0 = không) */ autoNext?: number;
  /** cảnh nền minh hoạ ghép từ hình có sẵn (vẽ phía sau các vật) */
  scene?: SceneKind;
  /** góc máy của cảnh nền (5 kiểu chuẩn Canva: bìa, giữa, cảnh phải, cảnh trái, cảnh đáy) */
  sceneVariant?: SceneVariant;
  /** hoạt động của tiết dạy: Khởi động / Khám phá / Luyện tập / Vận dụng / Củng cố */
  phase?: string;
  /** thời gian dự kiến cho trang (phút) — hiện ở xem lưới và màn hình của cô */
  mins?: number;
  /** công cụ gợi ý cho trang (màn hình của cô hiện nút bấm nhanh): hẹn giờ thảo luận / gọi tên / thi đua tổ */
  tool?: { timer?: number; name?: boolean; teams?: boolean; label?: string } };
/** nguồn của bài: tiết trong lịch báo giảng (giáo án) / bài trong ngân hàng nội dung */
export type DeckSrc = { plan?: string; lesson?: string; date?: string; period?: number; subject?: import('@/lib/types').SubjectCode };
export type Deck = { v: 1; title: string; grade: number; slides: Slide[]; src?: DeckSrc;
  /** hẹn giờ cả tiết (phút); màn hình của cô đếm ngược */ mins?: number };

export const BGS: { id: string; label: string; css: string }[] = [
  { id: 'white', label: 'Trắng', css: '#ffffff' },
  { id: 'sky', label: 'Bầu trời', css: 'linear-gradient(180deg,#bfe3ff 0%,#eaf6ff 60%)' },
  { id: 'meadow', label: 'Đồng cỏ', css: 'linear-gradient(180deg,#bfe3ff 0%,#e8f6ff 55%,#a7e08f 55%,#7cc865 100%)' },
  { id: 'sun', label: 'Nắng vàng', css: 'linear-gradient(135deg,#fef3c7,#fde68a 45%,#fbcfe8)' },
  { id: 'mint', label: 'Bạc hà', css: 'linear-gradient(135deg,#d1fae5,#bfdbfe)' },
  { id: 'grape', label: 'Tím nho', css: 'linear-gradient(135deg,#ede9fe,#c7d2fe)' },
  { id: 'peach', label: 'Đào', css: 'linear-gradient(135deg,#ffedd5,#fecaca)' },
  { id: 'sea', label: 'Biển', css: 'linear-gradient(180deg,#a5f3fc 0%,#38bdf8 70%,#0ea5e9)' },
  { id: 'board', label: 'Bảng xanh', css: 'linear-gradient(180deg,#1f4d3a,#163a2c)' },
  { id: 'night', label: 'Trời đêm', css: 'radial-gradient(circle at 30% 20%,#26346a,#0b1026 70%)' },
  { id: 'oli', label: 'Ô li kem', css: 'linear-gradient(90deg,#ffffff 7px,transparent 7px) 0 0/104px 104px, linear-gradient(#ffffff 7px,transparent 7px) 0 0/104px 104px, #f6e3c9' },
  { id: 'cosmos', label: 'Vũ trụ', css: 'radial-gradient(circle,#ffffffd9 0 3px,transparent 4px) 0 0/190px 170px, radial-gradient(circle,#ffffff80 0 2px,transparent 3px) 70px 90px/130px 150px, radial-gradient(circle at 20% 15%,#3b3f99,#151a46 60%,#0b0f2e)' },
  { id: 'leaf', label: 'Lá non', css: 'linear-gradient(160deg,#dcfce7,#bbf7d0 55%,#a7f3d0)' },
  { id: 'dots', label: 'Chấm bi', css: 'radial-gradient(circle,#bae6fd 0 6px,transparent 7px) 0 0/56px 56px, #e0f2fe' },
  { id: 'blob', label: 'Khối màu vui', css: 'radial-gradient(ellipse 560px 520px at 88% 12%,#ffd88a 98%,transparent 100%), radial-gradient(ellipse 380px 300px at 4% 100%,#bfe3ff 98%,transparent 100%), radial-gradient(circle,#f08a1c55 0 5px,transparent 6px) 140px 120px/1600px 900px, #fff8ec' },
  { id: 'kraft', label: 'Giấy sổ tay', css: 'radial-gradient(circle at 20% 25%,#ffffff80,transparent 40%), radial-gradient(circle at 85% 85%,#a0784624,transparent 45%), #f3e7cf' },
  { id: 'paper', label: 'Giấy kẻ ô', css: '#fffef7 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Cpath d=%27M40 0H0V40%27 fill=%27none%27 stroke=%27%23c7d2fe%27/%3E%3C/svg%3E")' },
  { id: 'aurora', label: 'Cực quang', css: 'radial-gradient(ellipse at 16% 12%,#34d399bb,transparent 34%), radial-gradient(ellipse at 82% 18%,#818cf8cc,transparent 38%), radial-gradient(ellipse at 55% 88%,#ec4899aa,transparent 45%), linear-gradient(145deg,#172554,#312e81 58%,#111827)' },
  { id: 'flowers', label: 'Vườn hoa', css: 'radial-gradient(circle at 12% 18%,#f9a8d4 0 12px,transparent 13px), radial-gradient(circle at 88% 24%,#c4b5fd 0 16px,transparent 17px), radial-gradient(circle at 78% 82%,#fda4af 0 14px,transparent 15px), radial-gradient(circle at 22% 78%,#a7f3d0 0 16px,transparent 17px), linear-gradient(135deg,#fff7ed,#fdf2f8 55%,#eff6ff)' },
  { id: 'lollipop', label: 'Cầu vồng kẹo', css: 'radial-gradient(ellipse at 12% 8%,#fbcfe8 0 20%,transparent 20.5%), radial-gradient(ellipse at 92% 92%,#bae6fd 0 25%,transparent 25.5%), linear-gradient(135deg,#fff7ed,#fef3c7 45%,#dcfce7)' },
  { id: 'chalk', label: 'Bảng phấn', css: 'radial-gradient(circle at 18% 22%,#ffffff14 0 2px,transparent 3px) 0 0/74px 68px, linear-gradient(135deg,#164e3b,#14532d 58%,#0f3d2e)' },
];
/* Nền hoạ tiết (11/2026): đơn giản, nhẹ màu để chữ luôn nổi — thay cho hình dán cảnh vẽ sau chữ. Hoạ tiết là SVG lặp lại, độ đậm thấp. */
const svg = (w: number, h: number, body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;
const LEAF = (x: number, y: number, r: number, c: string) => `<g transform='translate(${x} ${y}) rotate(${r})'><path d='M0 0C0-18 16-28 30-26C28-10 16 2 0 0Z' fill='${c}'/><path d='M2-2C10-10 18-18 26-24' stroke='white' stroke-opacity='.6' stroke-width='1.6' fill='none'/></g>`;
const FLOWER = (x: number, y: number, s: number, petal: string, mid: string) => `<g transform='translate(${x} ${y}) scale(${s})'>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx='0' cy='-9' rx='6' ry='9' fill='${petal}' transform='rotate(${a})'/>`).join('')}<circle r='5' fill='${mid}'/></g>`;
const STAR4 = (x: number, y: number, s: number) => `<path transform='translate(${x} ${y}) scale(${s})' d='M0-10L2.5-2.5L10 0L2.5 2.5L0 10L-2.5 2.5L-10 0L-2.5-2.5Z' fill='#fde68a'/>`;
export const PATTERN_BGS: { id: string; label: string; css: string }[] = [
  { id: 'leafy', label: 'Lá non (hoạ tiết)', css: `${svg(150, 150, `<g opacity='.22'>${LEAF(24, 46, -20, '#22c55e')}${LEAF(100, 110, 30, '#16a34a')}${LEAF(110, 30, 70, '#4ade80')}${LEAF(36, 128, 150, '#22c55e')}</g>`)} 0 0/150px 150px, linear-gradient(160deg,#f0fdf4,#dcfce7 60%,#d1fae5)` },
  { id: 'waves', label: 'Sóng biển (hoạ tiết)', css: `${svg(180, 60, `<path d='M0 30C30 10 60 10 90 30S150 50 180 30' fill='none' stroke='#06b6d4' stroke-opacity='.22' stroke-width='4' stroke-linecap='round'/>`)} 0 0/180px 60px, linear-gradient(180deg,#ecfeff,#cffafe 70%,#a5f3fc)` },
  { id: 'starry', label: 'Trời sao (hoạ tiết)', css: `${svg(160, 160, `<g opacity='.7'>${STAR4(30, 34, 0.9)}${STAR4(118, 96, 0.6)}${STAR4(64, 132, 0.5)}</g><g fill='white' opacity='.45'><circle cx='96' cy='26' r='1.8'/><circle cx='18' cy='98' r='1.4'/><circle cx='142' cy='148' r='1.6'/><circle cx='78' cy='76' r='1.2'/></g>`)} 0 0/160px 160px, radial-gradient(circle at 18% 12%,#3730a3,#1e1b4b 58%,#0f0d2e)` },
  { id: 'confetti', label: 'Hoa giấy (hoạ tiết)', css: `${svg(170, 170, `<g opacity='.35'><circle cx='22' cy='30' r='6' fill='#f472b6'/><rect x='110' y='22' width='12' height='12' rx='3' fill='#60a5fa' transform='rotate(20 116 28)'/><path d='M70 120l10-16 10 16z' fill='#facc15'/><path d='M130 120c6-8 14-8 20 0' stroke='#34d399' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='48' cy='150' r='4' fill='#a78bfa'/><circle cx='150' cy='70' r='4' fill='#fb923c'/></g>`)} 0 0/170px 170px, linear-gradient(135deg,#fffbeb,#fff7ed)` },
  { id: 'blossom', label: 'Hoa nhí (hoạ tiết)', css: `${svg(120, 120, `<g opacity='.4'>${FLOWER(28, 30, 0.9, '#f9a8d4', '#fbbf24')}${FLOWER(88, 88, 0.7, '#c4b5fd', '#fde68a')}</g>`)} 0 0/120px 120px, linear-gradient(135deg,#fff1f2,#fdf2f8 60%,#faf5ff)` },
  { id: 'gingham', label: 'Caro dã ngoại', css: 'repeating-linear-gradient(0deg,rgba(134,239,172,.2) 0 24px,transparent 24px 48px), repeating-linear-gradient(90deg,rgba(134,239,172,.2) 0 24px,transparent 24px 48px), #fffdf5' },
  { id: 'gingham-warm', label: 'Caro nắng ấm', css: 'repeating-linear-gradient(0deg,rgba(253,186,116,.2) 0 24px,transparent 24px 48px), repeating-linear-gradient(90deg,rgba(253,186,116,.2) 0 24px,transparent 24px 48px), #fffaf3' },
  { id: 'notebook', label: 'Vở kẻ ngang', css: 'linear-gradient(90deg,transparent 118px,rgba(248,113,113,.35) 118px 121px,transparent 121px), repeating-linear-gradient(180deg,transparent 0 50px,rgba(147,197,253,.4) 50px 52px), #fffef8' },
  { id: 'sunny', label: 'Nắng sớm', css: 'radial-gradient(circle at 94% 6%,rgba(253,224,71,.55) 0 110px,transparent 112px), repeating-conic-gradient(from 0deg at 94% 6%,rgba(253,224,71,.14) 0 6deg,transparent 6deg 18deg), linear-gradient(180deg,#fffbeb,#fef3c7)' },
  { id: 'bubbles', label: 'Bong bóng', css: `${svg(200, 200, `<g fill='none' stroke='#38bdf8' stroke-opacity='.28' stroke-width='3'><circle cx='40' cy='50' r='22'/><circle cx='150' cy='40' r='12'/><circle cx='120' cy='140' r='28'/><circle cx='30' cy='160' r='9'/></g>`)} 0 0/200px 200px, linear-gradient(180deg,#eff6ff,#e0f2fe)` },
  { id: 'tet-flower', label: 'Hoa mai Tết', css: `${svg(140, 140, `<g opacity='.38'>${FLOWER(34, 36, 1, '#facc15', '#ea580c')}${FLOWER(104, 100, 0.75, '#fde047', '#dc2626')}</g><g fill='#ef4444' opacity='.25'><circle cx='112' cy='26' r='3'/><circle cx='22' cy='112' r='3'/></g>`)} 0 0/140px 140px, linear-gradient(135deg,#fff7ed,#ffe4e6)` },
  { id: 'candy-stripe', label: 'Sọc kẹo', css: 'repeating-linear-gradient(135deg,rgba(244,114,182,.12) 0 28px,transparent 28px 56px), linear-gradient(135deg,#fdf2f8,#fff1f2)' },
];
BGS.push(...PATTERN_BGS);
export const bgCss = (bg: string) => BGS.find((b) => b.id === bg)?.css ?? (/^#[0-9a-f]{3,8}$/i.test(bg) ? bg : '#ffffff');
export const darkBg = (bg: string) => bg === 'board' || bg === 'night' || bg === 'cosmos' || bg === 'aurora' || bg === 'chalk' || bg === 'starry';

/** khung "Ảnh minh hoạ" giữ chỗ trong bài tự sinh (ẩn khi trình chiếu đến khi cô chèn ảnh) */
export const PHOTO_SRC = '/deck/anh-minh-hoa.svg';
export const uid = () => Math.random().toString(36).slice(2, 9);
export const MAX_SLIDES = 80, MAX_ELS = 60;

export function newSlide(bg = 'white'): Slide { return { id: uid(), bg, els: [], anims: [], trans: 'fade', notes: '' }; }
export function emptyDeck(title = 'Bài thao giảng mới', grade = 1): Deck {
  const s = newSlide('sun');
  s.els.push(
    { id: uid(), kind: 'text', x: 160, y: 300, w: 1280, h: 170, rot: 0, text: title, size: 96, color: '#1d4ed8', font: 'baloo', align: 'center', bg: '' },
    { id: uid(), kind: 'text', x: 360, y: 500, w: 880, h: 80, rot: 0, text: `Lớp ${grade}`, size: 44, color: '#7c2d12', font: 'quick', align: 'center', bg: '' },
  );
  return { v: 1, title, grade, slides: [s] };
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
/** Chuẩn hoá dữ liệu đọc từ database (bài cũ thiếu trường mới vẫn mở được) */
export function normalizeDeck(raw: unknown, fallbackTitle = 'Bài thao giảng'): Deck {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Deck>;
  const slides = (Array.isArray(r.slides) ? r.slides : []).slice(0, MAX_SLIDES).map((s): Slide => {
    const els = (Array.isArray(s?.els) ? s.els : []).filter((e) => e && typeof e.id === 'string' && typeof e.kind === 'string').slice(0, MAX_ELS)
      .map((e) => ({ ...e, x: num(e.x, 100), y: num(e.y, 100), w: num(e.w, 200), h: num(e.h, 120), rot: num(e.rot, 0) }) as El);
    const ids = new Set(els.map((e) => e.id));
    return {
      id: typeof s?.id === 'string' ? s.id : uid(), bg: typeof s?.bg === 'string' ? s.bg : 'white', els,
      anims: (Array.isArray(s?.anims) ? s.anims : []).filter((a) => a && ids.has(a.el) && FX_BY_ID[a.fx as Fx])
        .map((a) => ({ ...a, delay: Math.min(30, Math.max(0, num(a.delay, 0))), dur: Math.min(10, Math.max(0.2, num(a.dur, 0.6))), ease: (Object.keys(EASE_LABEL) as Ease[]).includes(a.ease as Ease) ? a.ease : undefined, rep: typeof a.rep === 'number' ? Math.min(5, Math.max(0, Math.round(a.rep))) : undefined, start: (['click', 'with', 'after'] as const).includes(a.start) ? a.start : 'click', trigger: a.trigger && ids.has(a.trigger) ? a.trigger : undefined })),
      trans: (Object.keys(TRANS_LABEL) as Trans[]).includes(s?.trans as Trans) ? (s.trans as Trans) : 'fade',
      notes: typeof s?.notes === 'string' ? s.notes : '', sound: typeof s?.sound === 'string' ? s.sound : undefined,
      ...(typeof s?.transDur === 'number' ? { transDur: Math.min(3, Math.max(0.1, s.transDur)) } : {}),
      ...(typeof s?.autoNext === 'number' && s.autoNext > 0 ? { autoNext: Math.min(120, Math.max(1, s.autoNext)) } : {}),
      scene: typeof s?.scene === 'string' ? s.scene : undefined,
      sceneVariant: (['cover', 'center', 'right', 'left', 'bottom', 'quiet'] as const).includes(s?.sceneVariant as SceneVariant) ? (s.sceneVariant as SceneVariant) : undefined,
      phase: typeof s?.phase === 'string' ? s.phase : undefined,
      ...(typeof s?.mins === 'number' && s.mins > 0 ? { mins: Math.min(90, Math.max(0.5, s.mins)) } : {}),
      ...(s?.tool && typeof s.tool === 'object' ? { tool: {
        timer: typeof s.tool.timer === 'number' && s.tool.timer > 0 ? Math.min(30, s.tool.timer) : undefined,
        name: s.tool.name === true || undefined, teams: s.tool.teams === true || undefined,
        label: typeof s.tool.label === 'string' ? s.tool.label.slice(0, 80) : undefined } } : {}),
    };
  });
  return {
    v: 1,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : fallbackTitle,
    grade: Number(r.grade) >= 1 && Number(r.grade) <= 5 ? Number(r.grade) : 1,
    slides: slides.length ? slides : emptyDeck(fallbackTitle).slides,
    ...(typeof r.mins === 'number' && r.mins > 0 ? { mins: Math.min(180, Math.max(1, Math.round(r.mins))) } : {}),
    ...(r.src && typeof r.src === 'object' ? { src: { plan: typeof r.src.plan === 'string' ? r.src.plan : undefined, lesson: typeof r.src.lesson === 'string' ? r.src.lesson : undefined, date: typeof r.src.date === 'string' ? r.src.date : undefined, period: typeof r.src.period === 'number' ? r.src.period : undefined,
      subject: (['toan', 'tieng-viet', 'tieng-anh'] as const).includes(r.src.subject as import('@/lib/types').SubjectCode) ? r.src.subject : undefined } } : {}),
  };
}

/** Tên ngắn của vật để hiện trong danh sách hiệu ứng */
export function elLabel(e: El): string {
  switch (e.kind) {
    case 'text': return `Chữ “${e.text.split('\n')[0].slice(0, 22) || '…'}”`;
    case 'img': return e.name || 'Hình';
    case 'shape': return e.text ? `Hình “${e.text.slice(0, 18)}”` : ({ rect: 'Hình chữ nhật', round: 'Thẻ bo góc', circle: 'Hình tròn', star: 'Ngôi sao', heart: 'Trái tim', arrow: 'Mũi tên', cloud: 'Đám mây', bubble: 'Bong bóng lời', wheel: 'Vòng quay', mystery: 'Thẻ bí ẩn', tray: 'Khay đếm', banner: 'Băng rôn', sticky: 'Giấy note', 'plaid-card': 'Thẻ bước', 'badge-card': 'Thẻ mặt trời', 'flower-bullet': 'Hoa đầu dòng' } as const)[e.shape];
    case 'quiz': return `Câu hỏi “${e.q.slice(0, 20)}”`;
    case 'drop': return `Ô thả “${e.label.slice(0, 16)}”`;
    case 'scene3d': return `Cảnh 3D “${e.title.slice(0, 18)}”`;
    case 'sort': return `Sắp xếp “${e.prompt.slice(0, 18)}”`;
    case 'teams': return 'Bảng thi đua tổ';
  }
}
