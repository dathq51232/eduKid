// Cộng đồng giáo viên (EduChainKids Community) — kiểu dữ liệu, giấy phép, nhãn hiển thị.
// Bảng & hàm ở supabase/migrations/0079_community_core.sql. Đọc dữ liệu phía máy chủ: src/lib/community/data.ts.

export type ResourceKind = 'bai_giang' | 'giao_an' | 'de_kiem_tra' | 'phieu' | 'cau_hoi' | 'tai_lieu';
export type License = 'xem' | 'dung' | 'sua' | 'bao_luu';
export type Visibility = 'truong' | 'giao_vien';
export type ResourceStatus = 'hien' | 'an' | 'go';
export type CommunityTab = 'kho' | 'da_dang' | 'da_luu';

export type ResourceCard = {
  id: string;
  kind: ResourceKind;
  title: string;
  summary: string;
  subject: string;
  grade: number | null;
  book: string;
  lessonRef: string;
  license: License;
  visibility: Visibility;
  status: ResourceStatus;
  saves: number;
  copies: number;
  createdAt: string;
  remixedFrom: string | null;
  /** tài liệu dạng file (loại tai_lieu, migration 0080) */
  file?: { path: string; name: string; size: number; mime: string } | null;
  mine: boolean;
  saved: boolean;
  author: { id: string; name: string; school: string | null };
};

export const KIND_LABEL: Record<ResourceKind, string> = {
  bai_giang: 'Bài giảng',
  giao_an: 'Giáo án',
  de_kiem_tra: 'Đề kiểm tra',
  phieu: 'Phiếu bài tập',
  cau_hoi: 'Bộ câu hỏi',
  tai_lieu: 'Tài liệu',
};

/** Giấy phép tác giả chọn khi đăng — quyết định người khác được làm gì với tài nguyên */
export const LICENSE_INFO: Record<License, { label: string; short: string; desc: string; canCopy: boolean }> = {
  xem: { label: 'Chỉ xem', short: 'Chỉ xem', desc: 'Đồng nghiệp xem để tham khảo, không tải, không sao chép.', canCopy: false },
  dung: { label: 'Dùng, ghi tên tác giả', short: 'Dùng · ghi tên', desc: 'Được dùng trong lớp, phải ghi tên tác giả, không bán.', canCopy: false },
  sua: { label: 'Được sao chép về sửa', short: 'Được sửa', desc: 'Được chép về chỉnh sửa; bản sửa ghi tác giả gốc và giữ giấy phép này.', canCopy: true },
  bao_luu: { label: 'Bảo lưu mọi quyền', short: 'Bảo lưu', desc: 'Chỉ xem; muốn dùng phải xin phép tác giả.', canCopy: false },
};

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  truong: 'Giáo viên cùng trường',
  giao_vien: 'Mọi giáo viên EduChain',
};

export const TAB_LABEL: Record<CommunityTab, string> = { kho: 'Kho chia sẻ', da_dang: 'Đã đăng', da_luu: 'Đã lưu' };
