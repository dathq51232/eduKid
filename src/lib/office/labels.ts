// Văn phòng ảo — nhãn hiển thị dùng được ở cả client (không chứa nội dung vị trí; nội dung ở roles.ts, chỉ phía máy chủ).

export type OfficeDept = 'lanh-dao' | 'cntt' | 'marketing';
/** toan-quyen: Trưởng phòng; sua-ma: đọc + sửa mã; ghi-tai-lieu: đọc + ghi file nháp / kế hoạch; chi-doc: đọc (+ chạy kiểm) */
export type OfficeAccess = 'toan-quyen' | 'sua-ma' | 'ghi-tai-lieu' | 'chi-doc';

export const DEPT_LABEL: Record<OfficeDept, string> = { 'lanh-dao': 'Trưởng phòng', cntt: 'Phòng CNTT', marketing: 'Phòng Marketing' };
export const ACCESS_LABEL: Record<OfficeAccess, string> = { 'toan-quyen': 'Toàn quyền', 'sua-ma': 'Đọc và sửa mã', 'ghi-tai-lieu': 'Đọc, ghi bản nháp', 'chi-doc': 'Chỉ đọc' };

/** Góc toàn cảnh của văn phòng: cao, nhìn chính diện từ phía trước, cân hai khu (thay cho home() mặc định của Stage3D) */
export const OFFICE_HOME = { cam: [0, 17, 14], tgt: [0, 0, -1] };
