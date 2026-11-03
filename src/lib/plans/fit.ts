// Lịch báo giảng tuần vừa đúng 1 trang (để nhà trường kiểm tra trang đầu của file giáo án tuần):
// đo bảng trong một khung ẩn rộng đúng vùng in của trang, giảm cỡ chữ đến khi vừa; tuần ít tiết thì giãn hàng cho đầy trang.
// Chỉ chạy trên trình duyệt.

const CM = 96 / 2.54; // px mỗi cm
/** vùng in (cm): trang ngang (khớp PAGE_MARGIN_LAND, lề phần trang ngang của .docx) và mẫu trường A4 dọc (lề 1 / 1 / 1 / 1,5 cm) */
const AREA = {
  land: { sel: '.Land', w: 29.7 - 2.5 - 2, h: 21 - 1.5 - 1.5 },
  school: { sel: '.Lich', w: 21 - 1.5 - 1, h: 29.7 - 1 - 1 },
} as const;
export type FitLayout = keyof typeof AREA;
/** chừa chỗ cho chênh lệch dàn chữ giữa trình duyệt và Word (đã đối chiếu bản .docx mở bằng LibreOffice):
 *  trang ngang đủ thể thức (cỡ ≥ 11) đo thiếu ~5%; các trường hợp khác chừa 2% */
const safe = (layout: FitLayout, f: number) => (layout === 'land' ? (f >= 11 ? 0.93 : 1) : 0.98);

/**
 * Dàn chữ giống Word: dòng "đơn" (240) của Times New Roman cao ≈ 1,15 cỡ chữ, dòng 1,15 (276) ≈ 1,32;
 * lề ô 0,05 cm trên/dưới. Dùng cho khung đo và bản xem trước.
 */
export const WORD_LAND_CSS = `
.Land, .Lich { line-height: 1.32; font-family: 'Times New Roman', Tinos, 'Liberation Serif', serif; }
.Land td, .Land th { vertical-align: top; overflow-wrap: anywhere; }
.Lich td, .Lich th { vertical-align: middle; overflow-wrap: break-word; }
.Land .grid td, .Land .grid th, .Lich .grid td, .Lich .grid th { padding: 0.05cm 0.15cm !important; }
.Land [style$="line-height:1"], .Lich [style$="line-height:1"] { line-height: 1.15 !important; }
.Land [style$="line-height:1.15"], .Lich [style$="line-height:1.15"] { line-height: 1.32 !important; }
.Land p, .Lich p { margin: 0 0 6pt; }`;
const measureCss = (w: number) => `<style>
html, body { margin: 0; padding: 0; background: #fff; }
body { width: ${w}cm; }
${WORD_LAND_CSS}
</style>`;

export type FitResult = { font: number; fits: boolean; rowPt?: number };

/**
 * Cỡ chữ lớn nhất (pt, bước 0,5) để phần lịch của văn bản `build(font)` nằm gọn 1 trang (fits = false: cỡ nhỏ nhất vẫn tràn).
 * stretch: nếu vừa ở cỡ lớn nhất mà còn trống, tìm chiều cao hàng (pt) lớn nhất để bảng đầy trang → rowPt.
 * null nếu không đo được.
 */
export function fitWeek(build: (font: number, rowPt?: number) => string, opts: { layout?: FitLayout; max?: number; min?: number; stretch?: boolean } = {}): FitResult | null {
  if (typeof document === 'undefined') return null;
  const layout = opts.layout ?? 'land', A = AREA[layout];
  const max = opts.max ?? (layout === 'school' ? 12 : 13), min = opts.min ?? (layout === 'school' ? 7 : 8);
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${A.w * CM + 40}px;height:${A.h * CM}px;visibility:hidden;border:0`;
  document.body.appendChild(frame);
  try {
    const d = frame.contentDocument;
    if (!d) return null;
    const height = (f: number, rowPt?: number) => {
      d.open(); d.write(build(f, rowPt).replace(/<\/head>/i, `${measureCss(A.w)}</head>`)); d.close();
      return (d.querySelector<HTMLElement>(A.sel) ?? d.body).scrollHeight;
    };
    const room = (f: number) => A.h * CM * safe(layout, f);
    for (let f = max; f >= min; f -= 0.5) {
      if (height(f) > room(f)) continue;
      if (!opts.stretch || f !== max) return { font: f, fits: true };
      // giãn hàng: tăng dần chiều cao tối thiểu mỗi hàng (pt) đến khi chạm cuối trang
      let best: number | undefined;
      for (let h = Math.round(f * 1.5); h <= 60; h += 1) {
        if (height(f, h) > room(f)) break;
        best = h;
      }
      return { font: f, fits: true, rowPt: best };
    }
    return { font: min, fits: false };
  } catch {
    return null;
  } finally {
    frame.remove();
  }
}

/** (giữ cho mã cũ) cỡ chữ để lịch trang ngang vừa 1 trang */
export function fitWeekFont(build: (font: number) => string, max = 13, min = 8): FitResult | null {
  return fitWeek((f) => build(f), { layout: 'land', max, min });
}
