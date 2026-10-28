// Phòng triển lãm của lớp: kiểu dữ liệu, nhãn, chủ đề trang trí (migration 0039).

export type GalleryKind = 'praise' | 'art' | 'writing';
export type GalleryStatus = 'shown' | 'pending' | 'hidden';
export type HeartEmoji = 'heart' | 'star' | 'clap' | 'wow';
export type ThemeKey = 'nang' | 'bien' | 'rung' | 'nha-giao' | 'tet' | 'cuoi-ky';
export type NameMode = 'full' | 'given';
/** Cỡ khung cả bức tường (1 = mặc định; nhỏ hơn thì treo được nhiều em hơn) */
export type WallSizes = Partial<Record<GalleryKind, number>>;
export const SIZE_PRESETS: { k: number; label: string }[] = [{ k: 0.55, label: 'Rất nhỏ' }, { k: 0.7, label: 'Nhỏ' }, { k: 0.85, label: 'Vừa' }, { k: 1, label: 'Lớn' }];

export type GalleryItem = {
  id: string;
  student_id: string | null;
  student_name: string | null;
  kind: GalleryKind;
  title: string;
  note: string;
  path: string;
  w: number;
  h: number;
  audio_path: string | null;
  status: GalleryStatus;
  taken_on: string;
  created_at: string;
  hearts: number;
  my_heart: HeartEmoji | null;
  /** thứ tự trên tường, cỡ khung riêng (migration 0040; chưa chạy thì không có) */
  pos?: number | null;
  scale?: number;
  /** đường dẫn ảnh / tiếng đã ký (gắn ở trình duyệt) */
  url?: string;
  audio_url?: string;
  /** tác phẩm mẫu (phòng mẫu khi lớp chưa có gì) */
  sample?: boolean;
};

export type GalleryData = {
  teacher: boolean;
  mine: string[];
  class: { id: string; name: string; grade: number } | null;
  settings: { name_mode: NameMode; theme: ThemeKey; sizes?: WallSizes };
  items: GalleryItem[];
};

export const KIND_LABEL: Record<GalleryKind, string> = { praise: 'Thư khen', art: 'Mỹ thuật', writing: 'Nét chữ' };
export const WALL_LABEL: Record<GalleryKind, string> = { praise: 'Tường thành tích', art: 'Tranh mỹ thuật', writing: 'Nét chữ đẹp' };
export const HEARTS: { key: HeartEmoji; label: string; emoji: string }[] = [
  { key: 'heart', label: 'Thương', emoji: '❤️' },
  { key: 'star', label: 'Giỏi quá', emoji: '⭐' },
  { key: 'clap', label: 'Vỗ tay', emoji: '👏' },
  { key: 'wow', label: 'Tuyệt vời', emoji: '🤩' },
];

/** Trang trí phòng theo chủ đề: màu tường, viền khung, dây cờ, đèn lồng */
export type RoomTheme = { label: string; wall: string; wall2: string; floor: string; frame: string; accent: string; flags: string[]; lanterns?: boolean; sky: string };
export const THEMES: Record<ThemeKey, RoomTheme> = {
  nang: { label: 'Nắng mai', wall: '#fff7e8', wall2: '#ffe9c2', floor: '#c98d55', frame: '#b7791f', accent: '#f59e0b', flags: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'], sky: '#fef3c7' },
  bien: { label: 'Biển xanh', wall: '#eef8ff', wall2: '#cfe9fb', floor: '#d8b98c', frame: '#1d4e89', accent: '#0ea5e9', flags: ['#0ea5e9', '#ffffff', '#22d3ee', '#2563eb'], sky: '#e0f2fe' },
  rung: { label: 'Khu rừng', wall: '#f1f8ec', wall2: '#d6ecc9', floor: '#9b6b43', frame: '#3f6212', accent: '#16a34a', flags: ['#16a34a', '#facc15', '#84cc16', '#f97316'], sky: '#ecfccb' },
  'nha-giao': { label: '20/11 Nhà giáo', wall: '#fff1f5', wall2: '#ffd9e5', floor: '#c48b5c', frame: '#9d174d', accent: '#db2777', flags: ['#db2777', '#f472b6', '#facc15', '#ffffff'], sky: '#fce7f3' },
  tet: { label: 'Tết sum vầy', wall: '#fff4e6', wall2: '#ffd8a8', floor: '#a0522d', frame: '#b91c1c', accent: '#dc2626', flags: ['#dc2626', '#facc15', '#dc2626', '#f59e0b'], lanterns: true, sky: '#fee2e2' },
  'cuoi-ky': { label: 'Triển lãm cuối kỳ', wall: '#f5f3ff', wall2: '#e4dcff', floor: '#b88a5e', frame: '#4c1d95', accent: '#7c3aed', flags: ['#7c3aed', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444'], sky: '#ede9fe' },
};

export const isUuid = (s: string | null | undefined) => !!s && /^[0-9a-f-]{36}$/i.test(s);
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${Number(d)}/${Number(m)}/${y}` : iso;
};

/** Lần cuối gia đình mở phòng triển lãm (localStorage, theo lớp) — để báo "tác phẩm mới" */
export const SEEN_KEY = 'edukid:trien-lam-seen';

/** Sắp thứ tự trên tường: theo pos (cô xếp) rồi mới nhất trước */
export function wallOrder(a: GalleryItem, b: GalleryItem) {
  const pa = a.pos ?? 1e9, pb = b.pos ?? 1e9;
  return pa - pb || b.taken_on.localeCompare(a.taken_on) || b.created_at.localeCompare(a.created_at);
}

/** Cỡ khung tự chọn theo số tác phẩm khi cô chưa chỉnh: nhiều em thì khung nhỏ lại, treo nhiều hàng */
export const autoSize = (n: number) => (n <= 4 ? 1 : n <= 10 ? 0.85 : n <= 20 ? 0.7 : 0.55);
