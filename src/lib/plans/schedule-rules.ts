// Bộ quy tắc nhận dạng lịch báo giảng / kế hoạch dạy học tuần của nhiều mẫu khác nhau.
// Mọi mẫu được quy về MỘT mẫu chuẩn của app (Thứ/ngày · Buổi · Tiết TKB · Môn học · Tiết PPCT · Tên bài dạy · ND tích hợp/ĐDDH · Điều chỉnh)
// rồi mới sinh giáo án. Gặp mẫu mới: thêm từ khoá vào các bảng dưới đây (không cần sửa bộ đọc).
// Mọi so khớp dùng chữ đã bỏ dấu, viết thường (hàm fold).

/** Tên trang tính thường chứa lịch báo giảng (ưu tiên khi file có nhiều trang) */
export const SHEET_NAME_HINT = /(bao giang|lbg|khdh|ke hoach day hoc|ke hoach tuan|lich bao)/;
/** Trang tính chắc chắn không phải lịch tuần */
export const SHEET_NAME_SKIP = /(huong dan|ppct|phan phoi|thoi khoa bieu|tkb|lich tuan|danh muc|du lieu|data)/;

/** Tên cột (tiêu đề bảng) → trường của mẫu chuẩn. Thứ tự kiểm tra: từ trên xuống, cột đầu tiên khớp được nhận. */
export const HEADER_RULES: [RegExp, 'ppct' | 'day' | 'session' | 'title' | 'subject' | 'integration' | 'adjust' | 'period'][] = [
  [/ppct|phan phoi/, 'ppct'],
  [/^(thu|ngay)\b|thu\s*,?\s*ngay|ngay\s*thang/, 'day'],
  [/buoi/, 'session'],
  [/tich hop|dddh|do dung|thiet bi/, 'integration'],
  [/ten bai|bai day|dau bai|noi dung|ten chu de|chu de|bai hoc|cong viec/, 'title'],
  [/^mon|mon hoc|phan mon/, 'subject'],
  [/dieu chinh|ghi chu/, 'adjust'],
  [/tiet/, 'period'],
];

/** Dòng ngăn buổi trong bảng (mẫu không có cột Buổi): "BUỔI SÁNG", "Buổi chiều" */
export const SESSION_ROW = /^buoi\s*(sang|chieu|toi)\b/;

/** Dòng kết thúc bảng (chữ kí) */
export const END_ROW = /^(to truong|hieu truong|pho hieu truong|nguoi lap|giao vien|duyet|ky duyet|xac nhan|nhan xet cua)/;

/** Ô lỗi công thức Excel — dòng có ô này ở cột Môn / Tên bài là dòng rác */
export const ERROR_CELL = /^#(n\/a|value!|ref!|name\?|div\/0!|null!|num!)/i;

/** Tên môn viết tắt / biến thể → tên môn chuẩn (để nhận mã môn). Khoá đã bỏ dấu. */
export const SUBJECT_ALIASES: [RegExp, string][] = [
  [/^hd\s*t\.?\s*nghiem|^hd\s*trai\s*nghiem|^hdtn|^h\.?d\.?t\.?n/, 'Hoạt động trải nghiệm'],
  [/^shdc|^chao co|sinh hoat duoi co/, 'Hoạt động trải nghiệm'],
  [/^shl\b|sinh hoat lop/, 'Hoạt động trải nghiệm'],
  [/^tn\s*&?\s*xh|^tn-xh/, 'Tự nhiên và Xã hội'],
  [/^gd\s*tc|^gd\s*t\.?\s*chat|^td\b|^the duc/, 'Giáo dục thể chất'],
  [/^a\.?\s*nhac/, 'Âm nhạc'],
  [/^m\.?\s*thuat/, 'Mĩ thuật'],
];
/** Môn "tăng cường / bổ sung / ôn" không ghi môn chính: lấy môn chính từ tên bài */
export const EXTRA_ONLY = /^(tang cuong|bo sung|bs|on tap|on luyen|luyen tap|tu hoc)$/;

/**
 * Nội dung tích hợp viết ở cuối tên bài sau dấu " - ": "Bài 46: ac ăc âc - Tiết 1 - Quốc phòng và an ninh".
 * Đoạn cuối khớp một trong các mẫu này được tách sang cột ND tích hợp.
 */
export const INTEGRATION_HEAD = /^(tich hop|th\b|th:|qcn|quyen con nguoi|qp\s*-?\s*an|qpan|quoc phong|nls|nang luc so|ai\b|tri tue nhan tao|ltcm|gd\s*ltcm|gdltcm|dd\s*ls|ly tuong|dao duc,? loi song|bvmt|bao ve moi truong|moi truong|atgt|an toan giao thong|kns|ky nang song|ki nang song|gd\s*kns|stem\b|tkntl|tiet kiem nang luong|sd\s*nl|bien doi khi hau|bdkh|phong chong|gd\s*dia phuong|gddp|giao duc dia phuong|bac ho|hoc tap va lam theo|vhgt|van hoa giao thong|ttp|thuc pham|giao duc)/;
/** Viết tắt tích hợp hay gặp → ghi rõ */
export const INTEGRATION_EXPAND: [RegExp, string][] = [
  [/^qcn$/i, 'Quyền con người (QCN)'],
  [/^qpan$|^qp\s*-?\s*an$/i, 'Quốc phòng và an ninh'],
  [/^bvmt$/i, 'Bảo vệ môi trường'],
  [/^atgt$/i, 'An toàn giao thông'],
  [/^kns$/i, 'Kĩ năng sống'],
  [/^nls$/i, 'Năng lực số (NLS)'],
];

/** Số tiết tối đa của buổi sáng; buổi chiều đánh số tiếp (5, 6, 7…) được đổi về 1, 2, 3… */
export const MORNING_SLOTS = 4;

/** Excel lưu ngày dạng số seri (ngày 1 = 1/1/1900): khoảng hợp lệ cho năm 1990–2100 */
export const EXCEL_SERIAL = { min: 32874, max: 73051 };
