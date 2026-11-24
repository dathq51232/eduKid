// Giao diện theo mùa lễ (Noel, Tết, 20/10, 20/11…): MỘT danh sách duy nhất — thêm mùa mới = thêm một mục ở đây
// (+ nếu muốn đổi màu: một khối trong src/styles/ssn.css). Ngày bật/tắt tự tính mỗi năm (kể cả âm lịch) ở season-ranges.ts.
// Hook trình duyệt: src/lib/use-season.ts. Điều khiển: NEXT_PUBLIC_SEASON=off (tắt hẳn) | =<id> (ép bật một mùa) rồi Redeploy; xem trước: thêm ?mua=<id> vào đường dẫn
// (giữ trong phiên trình duyệt; ?mua=auto quay về tự động, ?mua=off tắt). Học sinh / thầy cô tự tắt hiệu ứng bằng nút góc màn hình.
import type { Floater } from '@/lib/kid-theme';

export type SeasonId = 'phu-nu' | 'nha-giao' | 'noel' | 'tet-duong' | 'tet' | 'trung-thu';
export type SeasonEffect = 'snow' | 'petals' | 'confetti' | 'lanterns' | 'none';
export type SeasonAudience = 'hs' | 'gv' | 'ph';

/** [ngày, tháng] — dương lịch, hoặc âm lịch khi lunar = true. to < from nghĩa là sang năm sau. */
export type SeasonWindow = { from: [number, number]; to: [number, number]; lunar?: boolean };

export type Season = {
  id: SeasonId;
  name: string;
  window: SeasonWindow;
  /** Trùng ngày thì mùa có priority cao hơn được hiện */
  priority: number;
  /** Hình 3D đại diện (nút góc màn hình) */
  icon: string;
  effect: SeasonEffect;
  /** Hình hạt rơi (tuyết, cánh hoa…) — để trống thì vẽ bằng CSS */
  particles?: string[];
  /** Đồ vật trôi thêm vào cảnh "Thế giới của em" (không thay chủ đề em đã chọn) */
  floaters: Floater[];
  /** Lời chào của Milo theo người xem: học sinh / giáo viên / phụ huynh */
  greet: Record<SeasonAudience, string>;
};

const f3d = (n: string) => `/emoji/f3d/${n}.webp`;

export const SEASONS: Season[] = [
  {
    id: 'phu-nu', name: 'Ngày Phụ nữ Việt Nam 20/10', window: { from: [15, 10], to: [20, 10] }, priority: 2,
    icon: f3d('bouquet'), effect: 'petals', particles: [f3d('tulip'), f3d('rose'), f3d('cherry-blossom')],
    floaters: [{ src: f3d('bouquet'), x: 5, y: 26, s: 84, d: 7 }, { src: f3d('tulip'), x: 92, y: 62, s: 64, d: 6 }],
    greet: {
      hs: 'Milo nhắc em: 20/10 nhớ tặng mẹ và cô một lời yêu thương nhé!',
      gv: 'Chúc các cô luôn vui tươi, rạng rỡ nhân ngày Phụ nữ Việt Nam 20/10!',
      ph: 'Chúc các mẹ một ngày 20/10 thật nhiều niềm vui bên con!',
    },
  },
  {
    id: 'nha-giao', name: 'Ngày Nhà giáo Việt Nam 20/11', window: { from: [10, 11], to: [20, 11] }, priority: 2,
    icon: f3d('teacher'), effect: 'petals', particles: [f3d('cherry-blossom'), f3d('blossom'), f3d('tulip')],
    floaters: [{ src: f3d('bouquet'), x: 5, y: 26, s: 84, d: 7 }, { src: f3d('woman-teacher'), x: 91, y: 60, s: 80, d: 8 }],
    greet: {
      hs: 'Sắp đến 20/11 rồi! Em đã nghĩ lời cảm ơn gửi thầy cô chưa?',
      gv: 'EduChain Kids và Milo kính chúc thầy cô ngày 20/11 thật ý nghĩa!',
      ph: 'Cùng con gửi lời tri ân thầy cô nhân ngày Nhà giáo Việt Nam 20/11.',
    },
  },
  {
    id: 'noel', name: 'Giáng sinh', window: { from: [14, 12], to: [26, 12] }, priority: 2,
    icon: f3d('evergreen-tree'), effect: 'snow', particles: [f3d('snowflake')],
    floaters: [
      { src: f3d('snowman-without-snow'), x: 5, y: 30, s: 88, d: 8 },
      { src: f3d('wrapped-gift'), x: 92, y: 58, s: 70, d: 6 },
      { src: f3d('bell'), x: 90, y: 20, s: 54, d: 5 },
    ],
    greet: {
      hs: 'Giáng sinh vui vẻ! Mỗi bài em làm là một món quà nhỏ đó!',
      gv: 'Chúc thầy cô một mùa Giáng sinh ấm áp, an lành!',
      ph: 'Chúc gia đình mình một mùa Giáng sinh ấm áp bên con!',
    },
  },
  {
    id: 'tet-duong', name: 'Năm mới', window: { from: [30, 12], to: [2, 1] }, priority: 3,
    icon: f3d('party-popper'), effect: 'confetti',
    floaters: [{ src: f3d('fireworks'), x: 6, y: 22, s: 80, d: 6 }, { src: f3d('balloon'), x: 92, y: 60, s: 70, d: 7 }],
    greet: {
      hs: 'Chúc mừng năm mới! Năm nay mình cùng học thật vui nhé!',
      gv: 'Chúc thầy cô năm mới mạnh khỏe, nhiều niềm vui với lớp!',
      ph: 'Chúc gia đình năm mới an khang, con học hành tiến bộ!',
    },
  },
  {
    // 23 tháng Chạp (ông Công ông Táo) → mùng 10 tháng Giêng âm lịch
    id: 'tet', name: 'Tết Nguyên Đán', window: { from: [23, 12], to: [10, 1], lunar: true }, priority: 3,
    icon: f3d('red-envelope'), effect: 'petals', particles: [f3d('cherry-blossom'), f3d('blossom')],
    floaters: [
      { src: f3d('red-paper-lantern'), x: 6, y: 18, s: 78, d: 6 },
      { src: f3d('red-envelope'), x: 91, y: 56, s: 70, d: 7 },
      { src: f3d('fireworks'), x: 90, y: 18, s: 60, d: 5 },
    ],
    greet: {
      hs: 'Tết đến rồi! Milo chúc em năm mới chăm ngoan, học giỏi!',
      gv: 'Chúc thầy cô năm mới an khang, vạn sự như ý!',
      ph: 'Chúc gia đình năm mới sum vầy, an khang thịnh vượng!',
    },
  },
  {
    id: 'trung-thu', name: 'Tết Trung Thu', window: { from: [8, 8], to: [15, 8], lunar: true }, priority: 2,
    icon: f3d('red-paper-lantern'), effect: 'lanterns', particles: [f3d('red-paper-lantern')],
    floaters: [{ src: f3d('red-paper-lantern'), x: 6, y: 20, s: 76, d: 6 }, { src: f3d('crescent-moon'), x: 92, y: 18, s: 64, d: 8 }],
    greet: {
      hs: 'Trung Thu vui vẻ! Rước đèn cùng Milo nào!',
      gv: 'Chúc thầy cô và các con một mùa Trung Thu thật vui!',
      ph: 'Chúc gia đình một đêm Trung Thu sum vầy bên con!',
    },
  },
];

export const SEASON_IDS = SEASONS.map((s) => s.id);
export const seasonOf = (id: string | null | undefined): Season | null => SEASONS.find((s) => s.id === id) ?? null;

/** Trang không vẽ hiệu ứng (trình chiếu, xem trước slide) — làm bài chỉ giữ nút nhỏ, không hạt rơi */
export const SEASON_QUIET_PATHS = ['/lam-bai', '/chieu-offline', '/dev-slide-preview'];
export const SEASON_HIDDEN_PATHS = ['/trinh-chieu', '/chieu-offline', '/dev-slide-preview'];

export const audienceOf = (path: string): SeasonAudience =>
  path.startsWith('/giao-vien') || path.startsWith('/quan-tri') ? 'gv' : path.startsWith('/phu-huynh') ? 'ph' : 'hs';
