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

export type ShapeKind = 'rect' | 'round' | 'circle' | 'star' | 'heart' | 'arrow' | 'cloud' | 'bubble';
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
  role?: 'card' | 'badge' | 'mode' | 'title' | 'divider';
};
export type TextEl = ElBase & { kind: 'text'; text: string; size: number; color: string; font: FontKey; align: 'left' | 'center' | 'right'; bg: string; italic?: boolean;
  /** viền chữ (chữ tiêu đề kiểu trang trí) và đổ bóng */
  stroke?: string; strokeW?: number; shadow?: boolean };
export type ImgEl = ElBase & { kind: 'img'; src: string; /** ảnh trong Kho của tôi (đường dẫn kho, cần ký khi hiện) */ asset?: boolean; name?: string };
export type ShapeEl = ElBase & { kind: 'shape'; shape: ShapeKind; fill: string; stroke: string; sw: number; text?: string; color?: string; size?: number };
export type QuizEl = ElBase & { kind: 'quiz'; q: string; opts: string[]; a: number; cols: 1 | 2 };
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

export type SceneKind = 'garden' | 'pond' | 'kitchen' | 'class' | 'yard' | 'sea' | 'space' | 'farm' | 'tet';
export type Slide = { id: string; bg: string; els: El[]; anims: Anim[]; trans: Trans; notes: string; sound?: string;
  /** thời gian chuyển trang (giây) */ transDur?: number;
  /** tự sang bước / trang sau ... giây khi trình chiếu (0 = không) */ autoNext?: number;
  /** cảnh nền minh hoạ ghép từ hình có sẵn (vẽ phía sau các vật) */
  scene?: SceneKind;
  /** hoạt động của tiết dạy: Khởi động / Khám phá / Luyện tập / Vận dụng / Củng cố */
  phase?: string };
/** nguồn của bài: tiết trong lịch báo giảng (giáo án) / bài trong ngân hàng nội dung */
export type DeckSrc = { plan?: string; lesson?: string; date?: string; period?: number };
export type Deck = { v: 1; title: string; grade: number; slides: Slide[]; src?: DeckSrc };

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
  { id: 'paper', label: 'Giấy kẻ ô', css: '#fffef7 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Cpath d=%27M40 0H0V40%27 fill=%27none%27 stroke=%27%23c7d2fe%27/%3E%3C/svg%3E")' },
];
export const bgCss = (bg: string) => BGS.find((b) => b.id === bg)?.css ?? (/^#[0-9a-f]{3,8}$/i.test(bg) ? bg : '#ffffff');
export const darkBg = (bg: string) => bg === 'board' || bg === 'night';

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
      scene: typeof s?.scene === 'string' ? s.scene : undefined, phase: typeof s?.phase === 'string' ? s.phase : undefined,
    };
  });
  return {
    v: 1,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : fallbackTitle,
    grade: Number(r.grade) >= 1 && Number(r.grade) <= 5 ? Number(r.grade) : 1,
    slides: slides.length ? slides : emptyDeck(fallbackTitle).slides,
    ...(r.src && typeof r.src === 'object' ? { src: { plan: typeof r.src.plan === 'string' ? r.src.plan : undefined, lesson: typeof r.src.lesson === 'string' ? r.src.lesson : undefined, date: typeof r.src.date === 'string' ? r.src.date : undefined, period: typeof r.src.period === 'number' ? r.src.period : undefined } } : {}),
  };
}

/** Tên ngắn của vật để hiện trong danh sách hiệu ứng */
export function elLabel(e: El): string {
  switch (e.kind) {
    case 'text': return `Chữ “${e.text.split('\n')[0].slice(0, 22) || '…'}”`;
    case 'img': return e.name || 'Hình';
    case 'shape': return e.text ? `Hình “${e.text.slice(0, 18)}”` : ({ rect: 'Hình chữ nhật', round: 'Thẻ bo góc', circle: 'Hình tròn', star: 'Ngôi sao', heart: 'Trái tim', arrow: 'Mũi tên', cloud: 'Đám mây', bubble: 'Bong bóng lời' } as const)[e.shape];
    case 'quiz': return `Câu hỏi “${e.q.slice(0, 20)}”`;
    case 'drop': return `Ô thả “${e.label.slice(0, 16)}”`;
    case 'scene3d': return `Cảnh 3D “${e.title.slice(0, 18)}”`;
    case 'sort': return `Sắp xếp “${e.prompt.slice(0, 18)}”`;
    case 'teams': return 'Bảng thi đua tổ';
  }
}
