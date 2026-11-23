// Văn phòng ảo — "Việc gần nhất" khi chạy trên máy (next dev): TÊN file mới sửa nhất trong thư mục nộp, không đọc nội dung.
// Chỉ được nạp bằng import động trong nhánh NODE_ENV !== 'production' của trang, nên bản build production không chứa file này
// (bước "file tracing" không gom docs/ hay thư mục gốc vào gói máy chủ). Chỉ import từ phía máy chủ.
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { OfficeRecent, OfficeRole } from './roles';

const ALLOWED = /^docs\/(ke-hoach|marketing)(\/[a-z0-9-]+)*$/;
const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

async function isDir(p: string) {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
}

/** Đọc việc gần nhất cho mọi vị trí; lỗi bất kỳ → "Chỉ xem được khi chạy trên máy", không làm vỡ trang */
export async function readRecentLocal(roles: OfficeRole[]): Promise<Record<string, OfficeRecent>> {
  const root = process.cwd();
  const docsHere = await isDir(join(root, 'docs'));
  const out: Record<string, OfficeRecent> = {};
  for (const r of roles) {
    if (!r.outDirs.length) { out[r.id] = { state: 'none' }; continue; }
    if (!docsHere) { out[r.id] = { state: 'local-only' }; continue; }
    let best: { file: string; dir: string; t: number } | null = null;
    for (const dir of r.outDirs) {
      if (!ALLOWED.test(dir)) continue;
      const abs = join(root, ...dir.split('/'));
      try {
        for (const name of await readdir(abs)) {
          if (name.startsWith('.')) continue;
          try {
            const s = await stat(join(abs, name));
            if (s.isFile() && (!best || s.mtimeMs > best.t)) best = { file: name, dir, t: s.mtimeMs };
          } catch { /* file vừa bị xoá: bỏ qua */ }
        }
      } catch { /* thư mục chưa có: bỏ qua */ }
    }
    out[r.id] = best ? { state: 'ok', file: best.file, dir: best.dir, date: fmt(new Date(best.t)) } : { state: 'empty' };
  }
  return out;
}
