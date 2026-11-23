// File trong Cộng đồng (kho riêng tư "community-files", migration 0080): kiểm loại / cỡ, đặt tên an toàn, tải lên, mở bằng link ký.
//   chat/<mã cuộc trò chuyện>/<tên>  — file gửi trong tin nhắn (chỉ thành viên mở được)
//   tai-lieu/<mã người đăng>/<tên>   — tài liệu đăng lên Kho chia sẻ
import type { SupabaseClient } from '@supabase/supabase-js';

export const FILE_BUCKET = 'community-files';
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.txt';
const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', txt: 'text/plain',
};

export type FileMeta = { path: string; name: string; size: number; mime: string };

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
/** Loại file theo đuôi (trình duyệt đôi khi báo sai / để trống loại của file Office) */
export const mimeOf = (f: File) => MIME_BY_EXT[extOf(f.name)] ?? '';

/** Lỗi (câu tiếng Việt) nếu file không gửi được, null nếu được */
export function fileProblem(f: File): string | null {
  if (!mimeOf(f)) return 'Chỉ gửi được Word, Excel, PowerPoint, PDF, ảnh hoặc file .txt.';
  if (f.size > MAX_FILE_BYTES) return `File “${f.name}” lớn hơn 20 MB.`;
  return null;
}

/** Tên file an toàn cho đường dẫn: bỏ dấu, chỉ giữ chữ, số, gạch */
export function safeName(name: string): string {
  const ext = extOf(name);
  const base = name.slice(0, name.length - (ext ? ext.length + 1 : 0))
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'tep';
  return `${Date.now().toString(36)}-${base}${ext ? `.${ext}` : ''}`;
}

export async function uploadFile(sb: SupabaseClient, folder: string, f: File): Promise<FileMeta> {
  const path = `${folder}/${safeName(f.name)}`;
  const mime = mimeOf(f);
  const { error } = await sb.storage.from(FILE_BUCKET).upload(path, f, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  return { path, name: f.name.slice(0, 160), size: f.size, mime };
}

/** Link mở / tải file (hết hạn sau 10 phút) */
export async function fileUrl(sb: SupabaseClient, path: string, download?: string): Promise<string | null> {
  const { data } = await sb.storage.from(FILE_BUCKET).createSignedUrl(path, 600, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}

export const isImage = (mime: string) => mime.startsWith('image/');
export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
