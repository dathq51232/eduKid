// Danh mục công cụ của giáo viên: dùng chung cho thanh bên trái, thanh tab điện thoại, ô tìm nhanh (Ctrl+K) và mục "Công cụ ghim" ở trang Hôm nay.
// Thứ tự trong ALL = thứ tự hiện trong nhóm.
import { FEATURES } from '@/lib/features';

export type ToolKey =
  | 'so-lop' | 'goi-ten' | 'ke-hoach' | 'giao-bai' | 'phieu-bai-tap' | 'phieu-chinh-ta'
  | 'lo-hong' | 'de-kiem-tra' | 'phong-thi' | 'nhan-xet' | 'ket-qua-truong' | 'phieu-tien-bo' | 'thu-khen' | 'lop'
  | 'nhom' | 'thi-dua' | 'hen-gio' | 'danh-ba' | 'bai-giang-3d' | 'tin-nhan' | 'trien-lam' | 'luyen-chu' | 'bang-trang'
  | 'lich' | 'thu-chi' | 'quy-lop' | 'tieng-anh' | 'kho-cau-hoi' | 'hop-ph' | 'chu-nhiem' | 'van-ban';
export type ToolTone = 'green' | 'yellow' | 'blue' | 'violet' | 'red' | 'coral';
export type Tool = {
  key: ToolKey; label: string; desc: string; group: string; tone: ToolTone; path: string; keywords: string;
  /** không hiện riêng trong menu (là một thẻ của công cụ khác, vd. Danh bạ trong Liên lạc phụ huynh) — vẫn tìm được bằng Ctrl+K */
  hidden?: boolean;
};

const ALL: Tool[] = [
  { key: 'ke-hoach', label: 'Kế hoạch bài dạy', desc: 'Giáo án, lịch báo giảng, kho giáo án', group: 'Soạn bài', tone: 'green', path: 'ke-hoach', keywords: 'giao an ke hoach lich bao giang soan bai word tuan day kho giao an tao lich bao giang to truong thoi khoa bieu tkb ppct phan phoi chuong trinh' },
  { key: 'bai-giang-3d', label: 'Bài giảng & 3D', desc: 'Thao giảng, trình chiếu, mô hình 3D, STEM', group: 'Soạn bài', tone: 'coral', path: 'bai-giang-3d', keywords: 'bai giang 3d mo hinh stem thao giang trinh chieu slide canva bai trinh chieu' },
  { key: 'kho-cau-hoi', label: 'Kho câu hỏi', desc: 'Nạp Word, Excel, PDF; máy kiểm, cô duyệt', group: 'Soạn bài', tone: 'blue', path: 'kho-cau-hoi', keywords: 'kho cau hoi ngan hang cua toi nap de word excel pdf tach cau sinh cau tuong tu ai may kiem duyet bai tap' },
  { key: 'phieu-bai-tap', label: 'Phiếu bài tập', desc: 'In kèm đáp án', group: 'Phiếu & đề', tone: 'yellow', path: 'phieu-bai-tap', keywords: 'phieu bai tap in dap an' },
  { key: 'phieu-chinh-ta', label: 'Phiếu chính tả', desc: 'Tranh, tập chép, đáp án', group: 'Phiếu & đề', tone: 'blue', path: 'phieu-chinh-ta', keywords: 'chinh ta tap chep' },
  { key: 'luyen-chu', label: 'Luyện chữ', desc: 'Tô chữ mẫu ô li, chấm điểm', group: 'Phiếu & đề', tone: 'violet', path: 'luyen-chu', keywords: 'luyen chu viet chu dep o li to chu mau tap viet chu hoa' },
  { key: 'de-kiem-tra', label: 'Ma trận & đề kiểm tra', desc: 'Đề A/B, xuất Word', group: 'Phiếu & đề', tone: 'green', path: 'de-kiem-tra', keywords: 'ma tran de kiem tra dinh ky' },
  { key: 'bang-trang', label: 'Bảng trắng', desc: 'Bút, hình, thước, êke, compa', group: 'Trên lớp', tone: 'blue', path: 'bang-trang', keywords: 'bang trang bang den ve hinh but thuoc ke eke compa thuoc do goc hinh khoi chieu bang tuong tac' },
  { key: 'goi-ten', label: 'Gọi tên – Dò bài', desc: 'Vòng quay, bốc thăm, đua thú', group: 'Trên lớp', tone: 'yellow', path: 'goi-ten', keywords: 'goi ten do bai vong quay boc tham dua thu trung no phat bieu' },
  { key: 'hen-gio', label: 'Hẹn giờ', desc: 'Đồng hồ đếm ngược chiếu bảng', group: 'Trên lớp', tone: 'violet', path: 'hen-gio', keywords: 'hen gio dem nguoc dong ho bam gio thao luan' },
  { key: 'phong-thi', label: 'Phòng thi lớp', desc: 'Mã phòng, đề riêng, đấu cặp', group: 'Trên lớp', tone: 'yellow', path: 'phong-thi', keywords: 'phong thi lop ma phong kiem tra truc tuyen ra hoa huy hieu cu dau cap boc tham chia cap loai truc tiep vo dich' },
  { key: 'giao-bai', label: 'Giao bài về nhà', desc: 'Hạn nộp, em nào chưa làm', group: 'Sau giờ học', tone: 'violet', path: 'giao-bai', keywords: 'giao bai ve nha han nop' },
  { key: 'lo-hong', label: 'Lỗ hổng kiến thức', desc: 'Dạng bài lớp hay sai', group: 'Sau giờ học', tone: 'red', path: 'lo-hong', keywords: 'lo hong hay sai kem' },
  { key: 'lop', label: 'Học sinh & mã lớp', desc: 'Thêm em, PIN, thẻ đăng nhập', group: 'Học sinh & sổ', tone: 'blue', path: '', keywords: 'hoc sinh pin ma lop the dang nhap them em quan ly lop' },
  { key: 'so-lop', label: 'Sổ lớp', desc: 'Điểm danh, ghi chú, nhắn phụ huynh', group: 'Học sinh & sổ', tone: 'green', path: 'so-lop', keywords: 'diem danh vang co phep ghi chu tin nhan zalo chuyen can' },
  { key: 'chu-nhiem', label: 'Sổ chủ nhiệm', desc: 'Kế hoạch năm, em cần quan tâm', group: 'Học sinh & sổ', tone: 'green', path: 'chu-nhiem', keywords: 'so chu nhiem ke hoach chu nhiem nam hoc thang theo doi hoc sinh ca biet can quan tam' },
  { key: 'nhom', label: 'Nhóm & chỗ ngồi', desc: 'Chia nhóm, sơ đồ lớp', group: 'Học sinh & sổ', tone: 'blue', path: 'nhom', keywords: 'chia nhom ngau nhien can bang so do cho ngoi xep cho ban doi day' },
  { key: 'thi-dua', label: 'Thi đua tổ', desc: 'Cộng điểm tổ, tổng kết tuần', group: 'Học sinh & sổ', tone: 'coral', path: 'thi-dua', keywords: 'thi dua to diem cong tru co tong ket tuan sinh hoat lop' },
  { key: 'nhan-xet', label: 'Nhận xét học sinh', desc: 'Tuần, học kỳ, cả năm', group: 'Đánh giá & khen', tone: 'blue', path: 'nhan-xet', keywords: 'nhan xet vnedu hoc ky' },
  { key: 'ket-qua-truong', label: 'Kết quả trên trường', desc: 'Điểm định kỳ, khen thưởng', group: 'Đánh giá & khen', tone: 'violet', path: 'ket-qua-truong', keywords: 'ket qua diem dinh ky khen thuong' },
  { key: 'phieu-tien-bo', label: 'Phiếu báo tiến bộ', desc: 'Lời nhắn cho phụ huynh', group: 'Đánh giá & khen', tone: 'coral', path: 'phieu-tien-bo', keywords: 'phieu bao tien bo phu huynh' },
  { key: 'thu-khen', label: 'Thư khen', desc: 'PDF, ảnh PNG, in', group: 'Đánh giá & khen', tone: 'violet', path: 'thu-khen', keywords: 'thu khen giay khen' },
  { key: 'tin-nhan', label: 'Liên lạc phụ huynh', desc: 'Tin nhắn, xin nghỉ, danh bạ', group: 'Phụ huynh', tone: 'coral', path: 'tin-nhan', keywords: 'lien lac danh ba so dien thoai zalo goi tin nhan phu huynh xin phep nghi hoc hoi han tra loi hop thu' },
  { key: 'danh-ba', label: 'Danh bạ phụ huynh', desc: 'Số điện thoại, Zalo', group: 'Phụ huynh', tone: 'green', path: 'danh-ba', hidden: true, keywords: 'danh ba phu huynh so dien thoai zalo goi lien lac' },
  { key: 'hop-ph', label: 'Họp phụ huynh', desc: 'Thư mời, điểm danh, biên bản', group: 'Phụ huynh', tone: 'green', path: 'hop-ph', keywords: 'hop phu huynh thu moi bien ban dau nam cuoi ky diem danh tham du y kien' },
  { key: 'trien-lam', label: 'Phòng triển lãm', desc: 'Phòng 3D: thư khen, tranh, nét chữ', group: 'Phụ huynh', tone: 'blue', path: 'trien-lam', keywords: 'phong trien lam 3d trung bay tac pham tranh ve my thuat net chu luyen chu thu khen phu huynh xem' },
  { key: 'van-ban', label: 'Văn bản & in ấn', desc: 'Mẫu NĐ30, in danh sách, nhãn vở, giấy mời', group: 'Văn phòng lớp', tone: 'blue', path: 'van-ban', keywords: 'nhan vo the ten de ban danh sach lop diem danh thang ky nhan nop tien tron thu giay moi hop phu huynh giay bao phieu lien lac in theo lop van ban hanh chinh nghi dinh 30 nd30 the thuc mau thong bao ke hoach bao cao bien ban giay moi to trinh don xin nghi phep chuan hoa in excel pdf word' },
  { key: 'quy-lop', label: 'Quỹ lớp', desc: 'Khoản thu theo em, chi, tồn quỹ', group: 'Văn phòng lớp', tone: 'coral', path: 'quy-lop', keywords: 'quy lop thu chi tien nop chua nop ton quy cong khai phu huynh' },
  { key: 'lich', label: 'Lịch âm dương', desc: 'Ngày âm, lễ, sinh nhật học sinh', group: 'Của tôi', tone: 'yellow', path: 'lich', keywords: 'lich am duong am lich ngay le tet can chi doi ngay sinh nhat hoang dao' },
  { key: 'thu-chi', label: 'Thu chi cá nhân', desc: 'Sổ tiền riêng, chỉ mình xem', group: 'Của tôi', tone: 'green', path: 'thu-chi', keywords: 'thu chi ca nhan so tien luong chi tieu tiet kiem' },
  { key: 'tieng-anh', label: 'Tiếng Anh sư phạm', desc: 'Lộ trình học, mẫu câu lớp học', group: 'Của tôi', tone: 'blue', path: 'tieng-anh', keywords: 'tieng anh su pham classroom english mau cau lop hoc giao vien luyen noi phat am lo trinh 24 tuan teacher english academy global success' },
];

export const TOOLS: Tool[] = ALL.filter((t) => FEATURES.teacherRecords || (t.key !== 'nhan-xet' && t.key !== 'ket-qua-truong'));
/**
 * Hai khu theo hai "vai" của thầy cô: SOẠN & DẠY (chuẩn bị, lên lớp) và LỚP CHỦ NHIỆM (quản lý, đánh giá, phụ huynh, giấy tờ);
 * mỗi khu 4 nhóm nhỏ. "Của tôi": việc riêng của thầy cô (không thuộc lớp) — nằm cuối cột trái.
 */
export type KhuKey = 'day' | 'cn' | 'me';
export const KHU: { key: KhuKey; label: string; short: string }[] = [
  { key: 'day', label: 'Soạn & dạy', short: 'Soạn & dạy' },
  { key: 'cn', label: 'Lớp chủ nhiệm', short: 'Chủ nhiệm' },
  { key: 'me', label: 'Của tôi', short: 'Của tôi' },
];
/** Nhóm công cụ: cột trái hiện các nhóm theo khu, công cụ trong nhóm hiện thành hàng tab ngang ở đầu trang */
export type ToolGroup = { key: string; label: string; short: string; tone: ToolTone; khu: KhuKey };
export const GROUPS: ToolGroup[] = [
  { key: 'Soạn bài', label: 'Soạn bài', short: 'Soạn bài', tone: 'violet', khu: 'day' },
  { key: 'Phiếu & đề', label: 'Phiếu & đề', short: 'Phiếu & đề', tone: 'yellow', khu: 'day' },
  { key: 'Trên lớp', label: 'Trên lớp', short: 'Trên lớp', tone: 'green', khu: 'day' },
  { key: 'Sau giờ học', label: 'Sau giờ học', short: 'Sau giờ', tone: 'blue', khu: 'day' },
  { key: 'Học sinh & sổ', label: 'Học sinh & sổ', short: 'Học sinh', tone: 'blue', khu: 'cn' },
  { key: 'Đánh giá & khen', label: 'Đánh giá & khen', short: 'Đánh giá', tone: 'red', khu: 'cn' },
  { key: 'Phụ huynh', label: 'Phụ huynh', short: 'Phụ huynh', tone: 'coral', khu: 'cn' },
  { key: 'Văn phòng lớp', label: 'Văn phòng lớp', short: 'Văn phòng', tone: 'green', khu: 'cn' },
  { key: 'Của tôi', label: 'Của tôi', short: 'Của tôi', tone: 'yellow', khu: 'me' },
];
export const TOOL_GROUPS = GROUPS.map((g) => g.key);
export const groupsOfKhu = (k: KhuKey) => GROUPS.filter((g) => g.khu === k);
export const khuOfGroup = (g: string | null) => GROUPS.find((x) => x.key === g)?.khu ?? null;
/** Công cụ hiện trong menu của nhóm (bỏ công cụ là thẻ con của công cụ khác) */
export const toolsOfGroup = (g: string) => TOOLS.filter((t) => t.group === g && !t.hidden);
export const groupOfTool = (k: ToolKey | null) => (k ? TOOLS.find((t) => t.key === k)?.group ?? null : null);
const LAST_KEY = 'gv-nhom-cuoi';
/** Công cụ mở gần nhất trong nhóm (trên máy này) — bấm nhóm ở cột trái thì mở công cụ đó */
export function lastToolOf(g: string): Tool {
  const list = toolsOfGroup(g);
  try {
    const k = (JSON.parse(localStorage.getItem(LAST_KEY) ?? '{}') as Record<string, string>)[g];
    return list.find((t) => t.key === k) ?? list[0];
  } catch { return list[0]; }
}
export function rememberTool(k: ToolKey) {
  const g = groupOfTool(k); if (!g) return;
  try {
    const m = JSON.parse(localStorage.getItem(LAST_KEY) ?? '{}') as Record<string, string>;
    m[g] = k; localStorage.setItem(LAST_KEY, JSON.stringify(m));
  } catch { /* bỏ qua */ }
}
export const toolHref = (t: Tool, classId: string) => `/giao-vien/lop/${classId}${t.path ? `/${t.path}` : ''}`;
/** Công cụ ứng với đường dẫn đang mở (để tô sáng và đếm số lần dùng) */
export function toolOfPath(pathname: string): ToolKey | null {
  const m = pathname.match(/^\/giao-vien\/lop\/[^/]+(?:\/([^/?#]+))?/);
  if (!m) return null;
  const seg = m[1] ?? '';
  if (seg === 'hoc-sinh' || seg === '') return 'lop';
  if (seg === 'danh-ba') return 'tin-nhan'; // Danh bạ là thẻ thứ hai của Liên lạc phụ huynh
  return TOOLS.find((t) => t.path === seg)?.key ?? null;
}
export const classIdOfPath = (pathname: string) => pathname.match(/^\/giao-vien\/lop\/([0-9a-f-]{36})/i)?.[1] ?? null;

/** Bỏ dấu tiếng Việt để tìm kiếm ("gia huy" khớp "Gia Huy", "Lê Gia Huy") */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export const DEFAULT_QUICK: ToolKey[] = ['so-lop', 'ke-hoach', 'goi-ten', 'giao-bai', 'phieu-bai-tap', 'nhan-xet'];
/** "Dùng nhanh": 6 công cụ mở nhiều nhất trên máy này; chưa đủ dữ liệu thì theo thứ tự mặc định */
export function quickTools(counts: Record<string, number>, n = 6): ToolKey[] {
  const keys = TOOLS.filter((t) => !t.hidden && t.key !== 'lop').map((t) => t.key);
  const order = new Map(DEFAULT_QUICK.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || (order.get(a) ?? 99) - (order.get(b) ?? 99)).slice(0, n);
}
