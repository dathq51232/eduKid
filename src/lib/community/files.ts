// File trong Cộng đồng (kho riêng tư "community-files", migration 0080/0081): kiểm loại / cỡ, đặt tên an toàn, tải lên,
// mở bằng link ký (lưu tạm trên máy người xem), và liên kết ngoài cho file lớn (> 20 MB để ở Drive / OneDrive của thầy cô).
//   chat/<mã cuộc trò chuyện>/<tên>  — file gửi trong tin nhắn (chỉ thành viên mở được)
//   tai-lieu/<mã người đăng>/<tên>   — tài liệu, ảnh / âm thanh của bài giảng đăng lên Kho chia sẻ
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
  if (f.size > MAX_FILE_BYTES) return `File “${f.name}” lớn hơn 20 MB: thầy cô để file trên Google Drive / OneDrive của mình rồi dán liên kết (bật quyền “Người có liên kết được xem”).`;
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

/* ---------- lưu tạm trên máy người xem (Cache Storage): mở lại file đã xem không phải tải lại ---------- */
const CACHE = 'cdg-files-v1';
/** Mở file: lần đầu tải qua link ký rồi cất vào bộ nhớ đệm của trình duyệt; lần sau mở thẳng từ máy */
export async function openFile(sb: SupabaseClient, f: FileMeta): Promise<boolean> {
  // PDF, ảnh, .txt: xem ngay trong tab mới; Word / Excel / PowerPoint: tải về đúng tên file (trình duyệt không xem được)
  const viewable = f.mime === 'application/pdf' || f.mime === 'text/plain' || isImage(f.mime);
  const win = viewable ? window.open('', '_blank') : null; // mở tab ngay khi bấm (trình duyệt chặn tab mở sau khi chờ mạng)
  try {
    const blob = await cachedBlob(sb, f);
    if (!blob) { win?.close(); return false; }
    const url = URL.createObjectURL(blob);
    if (viewable) { if (win) win.location.href = url; else window.open(url, '_blank', 'noopener'); }
    else {
      const a = document.createElement('a');
      a.href = url; a.download = f.name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch { win?.close(); return false; }
}
/** Ảnh trong tin nhắn: dùng bản trên máy nếu có */
export async function cachedObjectUrl(sb: SupabaseClient, f: FileMeta): Promise<string | null> {
  const blob = await cachedBlob(sb, f).catch(() => null);
  return blob ? URL.createObjectURL(blob) : null;
}
async function cachedBlob(sb: SupabaseClient, f: FileMeta): Promise<Blob | null> {
  const key = `/__cdg/${encodeURIComponent(f.path)}`;
  const store = typeof caches !== 'undefined' ? await caches.open(CACHE).catch(() => null) : null;
  const hit = await store?.match(key);
  if (hit) return withType(await hit.blob(), f.mime);
  const url = await fileUrl(sb, f.path);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = withType(await res.blob(), f.mime);
  // file trong kho không đổi nội dung (mỗi lần tải lên một tên mới) nên giữ được lâu; trình duyệt tự dọn khi đầy
  await store?.put(key, new Response(blob, { headers: { 'content-type': blob.type } })).catch(() => {});
  return blob;
}
const withType = (b: Blob, mime: string) => (mime && b.type !== mime ? new Blob([b], { type: mime }) : b);

/* ---------- liên kết ngoài (file lớn để trên Drive / OneDrive / YouTube / Canva của thầy cô) ---------- */
const LINK_SOURCES: [RegExp, string][] = [
  [/(^|\.)docs\.google\.com$/, 'Google Tài liệu'], [/(^|\.)drive\.google\.com$/, 'Google Drive'], [/(^|\.)google\.com$/, 'Google'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'], [/(^|\.)(1drv\.ms|onedrive\.live\.com|sharepoint\.com)$/, 'OneDrive'],
  [/(^|\.)(canva\.com|canva\.link)$/, 'Canva'],
];
export type LinkInfo = { url: string; host: string; source: string };
/** Liên kết hợp lệ (https, thuộc các tên miền được phép) → thông tin hiển thị; ngược lại null */
export function linkInfo(raw: string): LinkInfo | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    const hit = LINK_SOURCES.find(([re]) => re.test(host));
    return hit ? { url: u.href, host, source: hit[1] } : null;
  } catch { return null; }
}
/** Tách chữ thành các đoạn chữ thường / liên kết (để hiện liên kết bấm được trong tin nhắn) */
export function splitLinks(text: string): ({ text: string } | { link: LinkInfo; text: string })[] {
  const out: ({ text: string } | { link: LinkInfo; text: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(/https:\/\/[^\s<>"']+/g)) {
    const raw = m[0].replace(/[.,;:!?)]+$/, '');
    const info = linkInfo(raw);
    if (!info) continue;
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ link: info, text: raw });
    last = m.index! + raw.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export const isImage = (mime: string) => mime.startsWith('image/');
export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
