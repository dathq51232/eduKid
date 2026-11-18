// "Bản đồ kiến thức" — Toán 4: các trạm (mắt xích kỹ năng), vùng, đường nối, mẹo của Milo. Tiến độ của em tính riêng (knowledge-map-progress.ts).
import type { T4Topic } from '@/lib/content/toan4-plan';

// Toạ độ x, y theo khung 1000 × 620 (đổi ra % khi vẽ). Phép tính trong ví dụ đã tính lại cho đúng.

export type MapTip = { name: string; how: string; example: string };
export type MapNode = {
  id: string;
  name: string;
  icon: string;
  region: RegionId;
  x: number;
  y: number;
  /** các mảng kiến thức (toan4-plan.ts) thuộc trạm này — để tính tiến độ từ bài em đã làm */
  topics: T4Topic[];
  know: string;
  tips: MapTip[];
};
/** tiến độ của em ở một trạm */
export type NodeState = {
  /** mức cao nhất em đã đạt: 0 = chưa học, 1–5 = L1…L5 */
  level: number;
  /** lần làm gần nhất còn nhầm nhiều */
  weak?: boolean;
  /** bài em đang học */
  current?: boolean;
};
export type MapState = Record<string, NodeState>;
export type RegionId = 'so' | 'ps' | 'hinh' | 'tk';
export type MapRegion = { id: RegionId; name: string; x: number; y: number; w: number; h: number; tone: string };
/** đường nối: from là kiến thức cần biết trước của to; c = điểm uốn (đường cong) nếu cần né trạm khác */
export type MapLink = { from: string; to: string; c?: [number, number] };

export const MAP_W = 1000;
export const MAP_H = 620;

export const LEVEL_NAMES = ['Chưa học', 'Làm quen', 'Cơ bản', 'Vận dụng', 'Thử thách', 'Mở rộng'];

export const REGIONS: MapRegion[] = [
  { id: 'so', name: 'Số và phép tính', x: 16, y: 16, w: 468, h: 288, tone: 'is-blue' },
  { id: 'ps', name: 'Phân số', x: 500, y: 16, w: 484, h: 392, tone: 'is-yellow' },
  { id: 'hinh', name: 'Hình học và đo lường', x: 16, y: 320, w: 468, h: 284, tone: 'is-green' },
  { id: 'tk', name: 'Thống kê và khả năng', x: 500, y: 424, w: 484, h: 180, tone: 'is-coral' },
];

const F = (n: string) => `/emoji/f3d/${n}.webp`;

export const NODES: MapNode[] = [
  {
    id: 'so-lon', name: 'Số đến lớp triệu', icon: F('abacus'), region: 'so', x: 100, y: 115, topics: ['num100k', 'num1m', 'placeClass', 'numMillion', 'roundBig', 'cmpBig', 'naturalSeq', 'evenOdd'],
    know: 'Mỗi lớp có 3 hàng: đơn vị, chục, trăm. Lớp đơn vị → lớp nghìn → lớp triệu.',
    tips: [{ name: 'Tách lớp', how: 'Đếm 3 chữ số một, từ phải sang trái, rồi đọc từng lớp.', example: '25 308 417 → 25 triệu 308 nghìn 417' }],
  },
  {
    id: 'cong-tru', name: 'Cộng, trừ', icon: F('shopping-cart'), region: 'so', x: 240, y: 115, topics: ['ops100k', 'letterExpr', 'threeStep', 'addBig', 'subBig', 'addProps'],
    know: 'Đặt tính thẳng hàng, tính từ phải sang trái, nhớ sang hàng bên trái.',
    tips: [
      { name: 'Thử lại bằng phép ngược', how: 'Làm trừ xong, lấy hiệu cộng số trừ. Ra số bị trừ là đúng.', example: '52 380 − 17 465 = 34 915; thử: 34 915 + 17 465 = 52 380 ✓' },
      { name: 'Làm tròn để ước lượng', how: 'Làm tròn trước để biết kết quả khoảng bao nhiêu.', example: '498 + 297 ≈ 500 + 300 = 800 (đúng là 795)' },
    ],
  },
  {
    id: 'nhan-chia', name: 'Nhân, chia', icon: F('divide'), region: 'so', x: 380, y: 115, topics: ['mul1', 'div1', 'mulProps', 'mulPow10', 'distributive', 'mul2', 'div2', 'estimate', 'unitRate'],
    know: 'Chia từ trái sang phải. Mỗi lượt: chia, nhân, trừ, rồi hạ chữ số tiếp theo.',
    tips: [
      { name: 'Che bớt để ước lượng thương', how: 'Che chữ số cuối của số bị chia và số chia, chia nhẩm để đoán chữ số thương.', example: '672 : 21 → nghĩ 67 : 2 ≈ 3, rồi được 32; thử: 21 × 32 = 672 ✓' },
      { name: 'Nhân nhẩm với 11', how: 'Số có 2 chữ số (tổng hai chữ số bé hơn 10) nhân 11: viết chữ số đầu, tổng hai chữ số ở giữa, chữ số cuối.', example: '34 × 11 → 3 | 3 + 4 | 4 = 374' },
    ],
  },
  {
    id: 'tong-hieu', name: 'Tìm hai số (tổng – hiệu)', icon: F('balance-scale'), region: 'so', x: 170, y: 235, topics: ['sumDiff'],
    know: 'Số lớn = (Tổng + Hiệu) : 2. Số bé = Tổng − Số lớn.',
    tips: [{ name: 'Vẽ sơ đồ đoạn thẳng', how: 'Vẽ đoạn ngắn cho số bé, đoạn dài hơn cho số lớn, đánh dấu phần hơn.', example: 'Tổng 50, hiệu 10 → số lớn (50 + 10) : 2 = 30, số bé 20' }],
  },
  {
    id: 'tbc', name: 'Trung bình cộng', icon: F('basket'), region: 'so', x: 330, y: 235, topics: ['average'],
    know: 'Trung bình cộng = Tổng các số : Số các số hạng.',
    tips: [{ name: 'San cho đều', how: 'Tưởng tượng gom hết vào một rổ rồi chia đều cho mỗi bạn.', example: '(36 + 42 + 57) : 3 = 135 : 3 = 45' }],
  },

  {
    id: 'ps-y-nghia', name: 'Phân số là gì?', icon: F('pizza'), region: 'ps', x: 580, y: 115, topics: ['fracConcept', 'fracDivision'],
    know: 'Mẫu số: chia thành mấy phần bằng nhau. Tử số: lấy mấy phần.',
    tips: [{ name: 'Nghĩ tới chiếc bánh', how: 'Mẫu số là số miếng bánh cắt ra, tử số là số miếng em lấy.', example: 'Bánh cắt 8 miếng, em ăn 3 miếng → em ăn 3/8 cái bánh' }],
  },
  {
    id: 'ps-bang-nhau', name: 'Phân số bằng nhau', icon: F('shortcake'), region: 'ps', x: 730, y: 115, topics: ['fracProperty'],
    know: 'Nhân (hoặc chia) cả tử số và mẫu số với cùng một số khác 0 thì được phân số bằng nó.',
    tips: [{ name: 'Nhân cả trên lẫn dưới', how: 'Tử nhân mấy thì mẫu cũng nhân bấy nhiêu.', example: '2/3 = 4/6 = 8/12' }],
  },
  {
    id: 'rut-gon', name: 'Rút gọn phân số', icon: F('scissors'), region: 'ps', x: 900, y: 115, topics: ['fracReduce'],
    know: 'Chia cả tử số và mẫu số cho cùng một số lớn hơn 1, đến khi không chia được nữa.',
    tips: [{ name: 'Chia từng bước nhỏ', how: 'Thử chia cho 2, rồi 3, rồi 5… đến khi không chia tiếp được.', example: '18/24 = 9/12 = 3/4 (chia 2, rồi chia 3)' }],
  },
  {
    id: 'so-sanh-ps', name: 'So sánh phân số', icon: F('watermelon'), region: 'ps', x: 650, y: 235, topics: ['fracCompare'],
    know: 'Cùng mẫu số: tử số lớn hơn thì phân số lớn hơn. Khác mẫu: quy đồng rồi so sánh.',
    tips: [{ name: 'Cùng tử số', how: 'Cùng số miếng, bánh cắt càng ít miếng thì mỗi miếng càng to.', example: '3/5 > 3/7' }],
  },
  {
    id: 'quy-dong', name: 'Quy đồng mẫu số', icon: F('puzzle-piece'), region: 'ps', x: 790, y: 235, topics: ['fracCommon'],
    know: 'Đưa hai phân số về cùng mẫu số mà giá trị không đổi.',
    tips: [{ name: 'Mẫu này chia hết cho mẫu kia', how: 'Chỉ cần đổi phân số có mẫu bé, giữ nguyên phân số còn lại.', example: '1/2 và 3/8 → 4/8 và 3/8' }],
  },
  {
    id: 'cong-tru-ps', name: 'Cộng, trừ phân số', icon: F('birthday-cake'), region: 'ps', x: 730, y: 345, topics: ['fracAdd', 'fracSub'],
    know: 'Cùng mẫu số: cộng (trừ) tử số, giữ nguyên mẫu số. Khác mẫu: quy đồng trước.',
    tips: [{ name: 'Quy đồng trước, cộng sau', how: 'Mẫu khác nhau thì đổi về cùng mẫu rồi mới cộng tử số.', example: '1/2 + 1/4 = 2/4 + 1/4 = 3/4' }],
  },
  {
    id: 'nhan-chia-ps', name: 'Nhân, chia phân số', icon: F('bento-box'), region: 'ps', x: 900, y: 345, topics: ['fracMul', 'fracDiv', 'fracOf'],
    know: 'Nhân: tử nhân tử, mẫu nhân mẫu. Chia: nhân với phân số đảo ngược.',
    tips: [
      { name: 'Nhân xong nhớ rút gọn', how: 'Nhân tử với tử, mẫu với mẫu, rồi rút gọn kết quả.', example: '2/3 × 3/5 = 6/15 = 2/5' },
      { name: 'Chia là lật rồi nhân', how: 'Đảo ngược phân số thứ hai rồi nhân.', example: '3/4 : 1/2 = 3/4 × 2/1 = 6/4 = 3/2' },
    ],
  },

  {
    id: 'goc', name: 'Góc nhọn, tù, bẹt', icon: F('triangular-ruler'), region: 'hinh', x: 100, y: 425, topics: ['angleMeasure', 'angleKind'],
    know: 'Góc nhọn bé hơn góc vuông. Góc tù lớn hơn góc vuông, bé hơn góc bẹt.',
    tips: [{ name: 'Đặt góc tờ giấy vào', how: 'Góc tờ giấy là góc vuông. Đặt vào để so: nhỏ hơn là nhọn, to hơn là tù.', example: 'Kim đồng hồ lúc 2 giờ tạo góc nhọn' }],
  },
  {
    id: 'vuong-song', name: 'Vuông góc, song song', icon: F('straight-ruler'), region: 'hinh', x: 240, y: 425, topics: ['perpendicular', 'parallel'],
    know: 'Hai đường thẳng vuông góc tạo 4 góc vuông. Hai đường song song không bao giờ cắt nhau.',
    tips: [{ name: 'Đường ray tàu hỏa', how: 'Hai thanh ray luôn cách đều nhau: đó là song song.', example: 'Hai cạnh đối của quyển vở song song với nhau' }],
  },
  {
    id: 'hbh-thoi', name: 'Hình bình hành, hình thoi', icon: F('large-orange-diamond'), region: 'hinh', x: 380, y: 425, topics: ['parallelogram'],
    know: 'Hình bình hành có hai cặp cạnh đối song song và bằng nhau. Hình thoi còn có 4 cạnh bằng nhau.',
    tips: [{ name: 'Đo 4 cạnh', how: 'Hình bình hành có 4 cạnh bằng nhau thì đó là hình thoi.', example: 'Cạnh 3 cm, 3 cm, 3 cm, 3 cm và hai cặp cạnh song song → hình thoi' }],
  },
  {
    id: 'khoi-luong', name: 'Yến, tạ, tấn', icon: F('package'), region: 'hinh', x: 100, y: 545, topics: ['mass'],
    know: '1 yến = 10 kg; 1 tạ = 10 yến = 100 kg; 1 tấn = 10 tạ = 1 000 kg.',
    tips: [{ name: 'Bậc thang gấp 10', how: 'Hai đơn vị khối lượng liền nhau hơn kém nhau 10 lần.', example: '1 tấn = 10 tạ = 100 yến = 1 000 kg' }],
  },
  {
    id: 'dien-tich', name: 'm², dm², mm²', icon: F('framed-picture'), region: 'hinh', x: 240, y: 545, topics: ['areaUnit'],
    know: '1 m² = 100 dm²; 1 dm² = 100 cm²; 1 cm² = 100 mm².',
    tips: [{ name: 'Bậc thang gấp 100', how: 'Đơn vị diện tích liền nhau hơn kém nhau 100 lần, không phải 10.', example: '3 m² = 300 dm²' }],
  },
  {
    id: 'thoi-gian', name: 'Giây, thế kỉ', icon: F('mantelpiece-clock'), region: 'hinh', x: 380, y: 545, topics: ['timeUnit'],
    know: '1 phút = 60 giây. 1 thế kỉ = 100 năm.',
    tips: [{ name: 'Tìm thế kỉ nhanh', how: 'Năm 2001 đến năm 2100 thuộc thế kỉ XXI.', example: 'Năm 2026 thuộc thế kỉ XXI' }],
  },

  {
    id: 'kha-nang', name: 'Kiểm đếm khả năng', icon: F('game-die'), region: 'tk', x: 640, y: 520, topics: ['eventCount'],
    know: 'Ghi lại mỗi lần một khả năng xảy ra, rồi đếm xem khả năng nào xuất hiện nhiều hơn.',
    tips: [{ name: 'Gạch theo bó 5', how: 'Gạch 4 vạch đứng, vạch thứ 5 gạch ngang: đếm từng bó 5 cho nhanh.', example: 'Tung đồng xu 10 lần: 6 lần mặt sấp → 1 bó 5 và 1 vạch' }],
  },
  {
    id: 'bieu-do', name: 'Biểu đồ cột', icon: F('cityscape'), region: 'tk', x: 840, y: 520, topics: ['barChart', 'dataSeq'],
    know: 'Cột càng cao thì số liệu càng lớn. Đọc số ở trục đứng.',
    tips: [{ name: 'Kẻ thước ngang', how: 'Đặt thước ngang từ đỉnh cột sang trục số để đọc cho chính xác.', example: 'Cột lớp 4A chạm vạch 32 → lớp 4A có 32 bạn' }],
  },
];

export const LINKS: MapLink[] = [
  { from: 'so-lon', to: 'cong-tru' },
  { from: 'cong-tru', to: 'nhan-chia' },
  { from: 'cong-tru', to: 'tong-hieu' },
  { from: 'nhan-chia', to: 'tbc' },
  { from: 'nhan-chia', to: 'ps-bang-nhau', c: [555, 250] },
  { from: 'ps-y-nghia', to: 'ps-bang-nhau' },
  { from: 'ps-bang-nhau', to: 'rut-gon' },
  { from: 'ps-bang-nhau', to: 'quy-dong' },
  { from: 'quy-dong', to: 'so-sanh-ps' },
  { from: 'quy-dong', to: 'cong-tru-ps' },
  { from: 'rut-gon', to: 'nhan-chia-ps' },
  { from: 'goc', to: 'vuong-song' },
  { from: 'vuong-song', to: 'hbh-thoi' },
  { from: 'khoi-luong', to: 'dien-tich' },
  { from: 'kha-nang', to: 'bieu-do' },
];

/** tiến độ mẫu cho trang demo */
export const DEMO_STATE: MapState = {
  'so-lon': { level: 5 },
  'cong-tru': { level: 4 },
  'nhan-chia': { level: 2, weak: true },
  'tong-hieu': { level: 3 },
  'tbc': { level: 1 },
  'ps-y-nghia': { level: 4 },
  'ps-bang-nhau': { level: 2, current: true },
  'rut-gon': { level: 0 },
  'so-sanh-ps': { level: 0 },
  'quy-dong': { level: 0 },
  'cong-tru-ps': { level: 0 },
  'nhan-chia-ps': { level: 0 },
  'goc': { level: 5 },
  'vuong-song': { level: 4 },
  'hbh-thoi': { level: 3 },
  'khoi-luong': { level: 4 },
  'dien-tich': { level: 2 },
  'thoi-gian': { level: 3 },
  'kha-nang': { level: 3 },
  'bieu-do': { level: 4 },
};
