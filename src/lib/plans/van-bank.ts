// Kho từ theo vần (Tiếng Việt lớp 1, bộ Kết nối tri thức) — dùng làm ngữ liệu cho slide và trò chơi.
// Thêm vần / từ: chỉ cần thêm vào bảng. Hình minh hoạ tự tìm trong kho hình 3D theo tên tiếng Việt.
import { F3D_VI } from '@/lib/deck/f3d-catalog';

export const VAN: Record<string, string[]> = {
  oi: ['còi', 'voi', 'gói', 'nói', 'mỏi'], 'ôi': ['chổi', 'ổi', 'đồi', 'gối', 'tối'], 'ơi': ['bơi', 'phơi', 'chơi', 'mời', 'lời'],
  ai: ['tai', 'hai', 'chai', 'vai', 'mái'], ay: ['tay', 'máy', 'bay', 'chạy', 'váy'], 'ây': ['mây', 'cây', 'dây', 'giấy', 'đầy'],
  ui: ['núi', 'túi', 'mũi', 'củi', 'vui'], 'ưi': ['gửi', 'ngửi', 'cửi'], 'uôi': ['chuối', 'muối', 'suối', 'tuổi'], 'ươi': ['lưới', 'người', 'mười', 'cười'],
  eo: ['mèo', 'kéo', 'kẹo', 'bèo', 'leo'], ao: ['sao', 'dao', 'táo', 'bão', 'chào'], au: ['rau', 'cau', 'sáu', 'cháu', 'màu'], 'âu': ['trâu', 'sâu', 'cầu', 'đậu', 'câu'],
  iu: ['rìu', 'địu', 'níu'], 'êu': ['kêu', 'sếu', 'phễu', 'lều'], 'ưu': ['cừu', 'hươu', 'lựu'],
  an: ['bàn', 'lan', 'đàn', 'ngan'], 'ăn': ['khăn', 'chăn', 'săn', 'ngắn'], 'ân': ['cân', 'sân', 'chân', 'bận'],
  on: ['con', 'non', 'nón', 'bón'], 'ôn': ['thôn', 'chồn', 'tôn', 'bốn'], 'ơn': ['sơn', 'lợn', 'cơn', 'đơn'],
  en: ['sen', 'kèn', 'đèn', 'chén'], 'ên': ['tên', 'nến', 'bến', 'nhện'], in: ['xin', 'mịn', 'chín', 'vịn'], un: ['giun', 'phun', 'bún', 'cún'],
  am: ['cam', 'tám', 'ham', 'lam'], 'ôm': ['tôm', 'cốm', 'hôm'], 'âm': ['nấm', 'sâm', 'mầm', 'cầm'], em: ['kem', 'tem', 'xem'],
  anh: ['chanh', 'xanh', 'tranh', 'cành', 'bánh'], inh: ['kính', 'xinh', 'tính', 'bình'], ang: ['bàng', 'vàng', 'thang', 'làng'],
  'ông': ['ông', 'công', 'bông', 'sông', 'trống'], ung: ['thùng', 'súng', 'cung', 'nhung'], 'ưng': ['trứng', 'gừng', 'lưng', 'sừng'],
  at: ['hát', 'bát', 'cát', 'mát'], 'ăt': ['mắt', 'bắt', 'cắt', 'mặt'], ot: ['hót', 'ngọt', 'rót'], 'ôt': ['cột', 'bột', 'một'], 'ơt': ['ớt', 'vợt', 'thớt'],
  ac: ['bác', 'nhạc', 'lạc', 'các'], 'ăc': ['mắc', 'sắc', 'mặc'], ach: ['sách', 'khách', 'gạch'], ich: ['lịch', 'xích', 'thích'], oa: ['hoa', 'loa', 'xoa'],
};

const low = (t: string) => t.normalize('NFC').toLowerCase();
/** hình 3D có tên chứa đúng tiếng này (VD "voi" → elephant, "sách" → books) */
const PIC: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [k, vi] of Object.entries(F3D_VI)) for (const w of low(vi).split(' ')) if (!m.has(w)) m.set(w, k);
  return m;
})();
export const picOf = (word: string) => PIC.get(low(word));

/** các vần có trong tên bài, VD "Bài 39: oi ôi ơi - Tiết 2" → ['oi','ôi','ơi'] */
export function vansIn(title: string): string[] {
  const t = low(title.replace(/^.*?:\s*/, '').replace(/\s*-\s*ti[eế]t.*$/i, ''));
  return t.split(/[\s,;]+/).filter((w) => VAN[w]);
}
/** từ có vần v (kèm hình nếu có), từ có hình xếp trước */
export function wordsOf(v: string): { word: string; pic?: string; v: string }[] {
  return (VAN[low(v)] ?? []).map((word) => ({ word, pic: picOf(word), v })).sort((a, b) => Number(!!b.pic) - Number(!!a.pic));
}
/** từ của các vần khác (làm phương án nhiễu) */
export function otherWords(vans: string[], n: number, r: () => number): string[] {
  const pool = Object.entries(VAN).filter(([v]) => !vans.includes(v)).flatMap(([, ws]) => ws);
  return Array.from({ length: n }, () => pool[Math.floor(r() * pool.length)]);
}
