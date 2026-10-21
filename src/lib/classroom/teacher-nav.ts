// Danh mục công cụ của giáo viên: dùng chung cho thanh bên trái, thanh tab điện thoại, ô tìm nhanh (Ctrl+K) và mục "Dùng nhanh".
import { FEATURES } from '@/lib/features';

export type ToolKey =
  | 'so-lop' | 'goi-ten' | 'ke-hoach' | 'giao-bai' | 'phieu-bai-tap' | 'phieu-chinh-ta'
  | 'lo-hong' | 'de-kiem-tra' | 'nhan-xet' | 'ket-qua-truong' | 'phieu-tien-bo' | 'thu-khen' | 'lop';
export type ToolTone = 'green' | 'yellow' | 'blue' | 'violet' | 'red' | 'coral';
export type Tool = { key: ToolKey; label: string; desc: string; group: string; tone: ToolTone; path: string; keywords: string };

const ALL: Tool[] = [
  { key: 'so-lop', label: 'Sổ lớp', desc: 'Điểm danh, ghi chú, nhắn phụ huynh', group: 'Trên lớp', tone: 'green', path: 'so-lop', keywords: 'diem danh vang co phep ghi chu tin nhan zalo chuyen can' },
  { key: 'goi-ten', label: 'Gọi tên – Dò bài', desc: 'Vòng quay, bốc thăm, đua thú', group: 'Trên lớp', tone: 'yellow', path: 'goi-ten', keywords: 'goi ten do bai vong quay boc tham dua thu trung no phat bieu' },
  { key: 'ke-hoach', label: 'Kế hoạch bài dạy', desc: 'Giáo án, lịch báo giảng', group: 'Dạy học', tone: 'green', path: 'ke-hoach', keywords: 'giao an ke hoach lich bao giang soan bai word' },
  { key: 'giao-bai', label: 'Giao bài về nhà', desc: 'Hạn nộp, em nào chưa làm', group: 'Dạy học', tone: 'violet', path: 'giao-bai', keywords: 'giao bai ve nha han nop' },
  { key: 'phieu-bai-tap', label: 'Phiếu bài tập', desc: 'In kèm đáp án', group: 'Dạy học', tone: 'yellow', path: 'phieu-bai-tap', keywords: 'phieu bai tap in dap an' },
  { key: 'phieu-chinh-ta', label: 'Phiếu chính tả', desc: 'Tranh, tập chép, đáp án', group: 'Dạy học', tone: 'blue', path: 'phieu-chinh-ta', keywords: 'chinh ta tap chep' },
  { key: 'lo-hong', label: 'Lỗ hổng kiến thức', desc: 'Dạng bài lớp hay sai', group: 'Đánh giá', tone: 'red', path: 'lo-hong', keywords: 'lo hong hay sai kem' },
  { key: 'de-kiem-tra', label: 'Ma trận & đề kiểm tra', desc: 'Đề A/B, xuất Word', group: 'Đánh giá', tone: 'green', path: 'de-kiem-tra', keywords: 'ma tran de kiem tra dinh ky' },
  { key: 'nhan-xet', label: 'Nhận xét học sinh', desc: 'Tuần, học kỳ, cả năm', group: 'Đánh giá', tone: 'blue', path: 'nhan-xet', keywords: 'nhan xet vnedu hoc ky' },
  { key: 'ket-qua-truong', label: 'Kết quả trên trường', desc: 'Điểm định kỳ, khen thưởng', group: 'Đánh giá', tone: 'violet', path: 'ket-qua-truong', keywords: 'ket qua diem dinh ky khen thuong' },
  { key: 'phieu-tien-bo', label: 'Phiếu báo tiến bộ', desc: 'Lời nhắn cho phụ huynh', group: 'Phụ huynh', tone: 'coral', path: 'phieu-tien-bo', keywords: 'phieu bao tien bo phu huynh' },
  { key: 'thu-khen', label: 'Thư khen', desc: 'PDF, ảnh PNG, in', group: 'Phụ huynh', tone: 'violet', path: 'thu-khen', keywords: 'thu khen giay khen' },
  { key: 'lop', label: 'Học sinh & mã lớp', desc: 'Thêm em, PIN, thẻ đăng nhập', group: 'Lớp', tone: 'blue', path: '', keywords: 'hoc sinh pin ma lop the dang nhap them em quan ly lop' },
];

export const TOOLS: Tool[] = ALL.filter((t) => FEATURES.teacherRecords || (t.key !== 'nhan-xet' && t.key !== 'ket-qua-truong'));
export const TOOL_GROUPS = ['Trên lớp', 'Dạy học', 'Đánh giá', 'Phụ huynh', 'Lớp'];
export const toolHref = (t: Tool, classId: string) => `/giao-vien/lop/${classId}${t.path ? `/${t.path}` : ''}`;
/** Công cụ ứng với đường dẫn đang mở (để tô sáng và đếm số lần dùng) */
export function toolOfPath(pathname: string): ToolKey | null {
  const m = pathname.match(/^\/giao-vien\/lop\/[^/]+(?:\/([^/?#]+))?/);
  if (!m) return null;
  const seg = m[1] ?? '';
  if (seg === 'hoc-sinh' || seg === '') return 'lop';
  return TOOLS.find((t) => t.path === seg)?.key ?? null;
}
export const classIdOfPath = (pathname: string) => pathname.match(/^\/giao-vien\/lop\/([0-9a-f-]{36})/i)?.[1] ?? null;

/** Bỏ dấu tiếng Việt để tìm kiếm ("gia huy" khớp "Gia Huy", "Lê Gia Huy") */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export const DEFAULT_QUICK: ToolKey[] = ['so-lop', 'goi-ten', 'ke-hoach', 'giao-bai', 'phieu-bai-tap', 'lo-hong'];
/** "Dùng nhanh": 6 công cụ mở nhiều nhất trên máy này; chưa đủ dữ liệu thì theo thứ tự mặc định */
export function quickTools(counts: Record<string, number>, n = 6): ToolKey[] {
  const keys = TOOLS.map((t) => t.key);
  const order = new Map(DEFAULT_QUICK.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || (order.get(a) ?? 99) - (order.get(b) ?? 99)).slice(0, n);
}
