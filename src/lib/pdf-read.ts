// Đọc chữ trong file PDF ngay trên trình duyệt (pdf.js) — chỉ tải thư viện khi thầy cô nạp file PDF.
// Chạy "worker" ngay trên luồng chính (đặt globalThis.pdfjsWorker) để khỏi cấu hình file worker riêng cho Next.
// Trả về từng dòng chữ theo thứ tự đọc (trên → dưới, trái → phải). PDF chụp/scan không có lớp chữ → mảng rỗng.

type Item = { str: string; x: number; y: number; w: number; h: number };

export async function readPdfLines(buf: ArrayBuffer, maxPages = 40): Promise<string[]> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs' as string)]);
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = worker;
  const task = pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true });
  const doc = await task.promise;
  const lines: string[] = [];
  try {
    for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      const items: Item[] = [];
      for (const it of tc.items) {
        if (!('str' in it) || !it.str.trim()) continue;
        items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: Math.abs(it.transform[3]) || 10 });
      }
      // gom các mẩu chữ cùng hàng (lệch y nhỏ hơn nửa cỡ chữ) thành một dòng
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      const rows: Item[][] = [];
      for (const it of items) {
        const row = rows[rows.length - 1];
        if (row && Math.abs(row[0].y - it.y) < Math.max(2, Math.min(row[0].h, it.h) * 0.5)) row.push(it);
        else rows.push([it]);
      }
      for (const row of rows) {
        row.sort((a, b) => a.x - b.x);
        let s = '';
        let end = -Infinity;
        for (const it of row) {
          // có khoảng trống giữa hai mẩu chữ (giữa các từ, giữa cột phương án A. B. C. D.) → chèn dấu cách
          if (s && it.x - end > it.h * 0.15 && !/\s$/.test(s) && !/^\s/.test(it.str)) s += ' ';
          s += it.str;
          end = it.x + it.w;
        }
        const c = s.replace(/\s+/g, ' ').trim();
        if (c) lines.push(c);
      }
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
  return lines;
}
