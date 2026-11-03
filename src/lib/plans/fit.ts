// Lịch báo giảng tuần vừa đúng 1 trang ngang (để nhà trường kiểm tra trang đầu của file giáo án tuần):
// đo bảng trong một khung ẩn rộng đúng vùng in của trang A4 ngang (lề 2,5 / 2 cm), giảm cỡ chữ đến khi vừa.
// Chỉ chạy trên trình duyệt.

const CM = 96 / 2.54; // px mỗi cm
/** vùng in trang ngang (khớp PAGE_MARGIN_LAND và lề phần trang ngang của file .docx) */
const LAND_W = 29.7 - 2.5 - 2, LAND_H = 21 - 1.5 - 1.5;
/** chừa chỗ cho chênh lệch dàn chữ giữa trình duyệt và Word (đã đối chiếu bản .docx mở bằng LibreOffice):
 *  đầu trang đủ thể thức (cỡ ≥ 11) đo thiếu ~5%; đầu trang gọn 1 dòng (cỡ < 11) đo khớp */
const safe = (f: number) => (f >= 11 ? 0.93 : 1);

/**
 * Dàn chữ giống Word: dòng "đơn" (240) của Times New Roman cao ≈ 1,15 cỡ chữ, dòng 1,15 (276) ≈ 1,32;
 * lề ô 0,05 cm trên/dưới. Dùng cho khung đo và bản xem trước trang ngang.
 */
export const WORD_LAND_CSS = `
.Land { line-height: 1.32; font-family: 'Times New Roman', Tinos, 'Liberation Serif', serif; }
.Land td, .Land th { vertical-align: top; overflow-wrap: anywhere; }
.Land .grid td, .Land .grid th { padding: 0.05cm 0.15cm !important; }
.Land [style$="line-height:1"] { line-height: 1.15 !important; }
.Land [style$="line-height:1.15"] { line-height: 1.32 !important; }
.Land p { margin: 0 0 6pt; }`;
const MEASURE_CSS = `<style>
html, body { margin: 0; padding: 0; background: #fff; }
body { width: ${LAND_W}cm; }
${WORD_LAND_CSS}
</style>`;

/** Cỡ chữ lớn nhất (pt, bước 0,5) để phần trang ngang của văn bản `build(font)` nằm gọn 1 trang (fits = false: cỡ nhỏ nhất vẫn tràn); null nếu không đo được */
export function fitWeekFont(build: (font: number) => string, max = 13, min = 8): { font: number; fits: boolean } | null {
  if (typeof document === 'undefined') return null;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${LAND_W * CM + 40}px;height:${LAND_H * CM}px;visibility:hidden;border:0`;
  document.body.appendChild(frame);
  try {
    const d = frame.contentDocument;
    if (!d) return null;
    for (let f = max; f >= min; f -= 0.5) {
      const html = build(f).replace(/<\/head>/i, `${MEASURE_CSS}</head>`);
      d.open(); d.write(html); d.close();
      const land = d.querySelector<HTMLElement>('.Land') ?? d.body;
      if (land.scrollHeight <= LAND_H * CM * safe(f)) return { font: f, fits: true };
    }
    return { font: min, fits: false };
  } catch {
    return null;
  } finally {
    frame.remove();
  }
}
