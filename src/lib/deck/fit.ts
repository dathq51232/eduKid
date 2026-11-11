// Ước lượng cỡ chữ vừa khung cho trang bài giảng (dùng chung cho bộ sinh slide, khung trắc nghiệm và bài kiểm tra bố cục).
// Ước lượng thô theo độ rộng trung bình một ký tự (≈0,56 cỡ chữ) — đủ để chọn cỡ chữ và phát hiện tràn.

/** số dòng ước lượng khi chữ tự xuống dòng trong khung rộng w */
export function estRows(text: string, w: number, size: number, k = 0.56): number {
  return text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil((lineEm(l, k) * size) / (w * 0.92))), 0);
}
/** độ rộng một dòng tính theo em: chữ IN HOA rộng hơn chữ thường khoảng 1/4 */
function lineEm(l: string, k: number): number {
  let em = 0;
  for (const ch of l) em += ch !== ch.toLowerCase() ? k * 1.25 : k;
  return em;
}
const longestWord = (text: string) => Math.max(...text.split(/\s+/).map((x) => x.length), 1);

/** chữ cỡ size có vừa khung w × h không (dòng cao 1,3 cỡ chữ, từ dài nhất không bị bẻ) */
export function fits(text: string, w: number, h: number, size: number, lineH = 1.3, k = 0.56): boolean {
  return estRows(text, w, size, k) * lineH * size <= h && longestWord(text) * (k + 0.06) * size <= w;
}

/** cỡ chữ lớn nhất (≤ max, ≥ min) mà chữ vẫn vừa khung (ước lượng sát font Baloo/Quicksand: 0,52 em/ký tự, dòng 1,2) */
export function fit(text: string, w: number, h: number, max = 64, min = 26): number {
  let s = max;
  while (s > min && !fits(text, w, h, s, 1.2, 0.52)) s -= 2;
  return Math.round(Math.max(min, s));
}

export type QuizBox = { w: number; h: number; q: string; opts: string[]; cols: 1 | 2; img?: boolean };

/** cỡ chữ đặt sẵn, tự thu nhỏ nếu chữ tràn khung (khung có nền thì trừ phần đệm) */
export function shrinkToFit(text: string, w: number, h: number, size: number, padded = false, min = 22): number {
  return fit(text, w - (padded ? 52 : 0), h - (padded ? 24 : 0), size, Math.min(size, min));
}

/** chiều cao ước lượng của khung trắc nghiệm ở cỡ câu hỏi qs và cỡ đáp án os (khớp CSS .dk-quiz) */
function quizHeight(b: QuizBox, qs: number, os: number): number {
  // khớp CSS: chữ Baloo đậm ≈ 0,6 em/ký tự, dòng cao 1,2 (đặt trong .dk-quiz-q / .dk-opt)
  const qH = estRows(b.q, b.w - 56, qs, 0.6) * 1.2 * qs + 40;
  const colW = (b.w - (b.cols - 1) * 20) / b.cols;
  const textW = colW - 44 - 1.6 * os - 18 - (b.img ? 100 : 0);
  const rowsOf = (t: string) => Math.max(estRows(t, textW, os, 0.6) * 1.2 * os, 1.6 * os, b.img ? 82 : 0) + 28;
  const nRows = Math.ceil(b.opts.length / b.cols);
  let optsH = 0;
  for (let r = 0; r < nRows; r++) optsH += Math.max(...b.opts.slice(r * b.cols, r * b.cols + b.cols).map(rowsOf));
  return (qH + b.h * 0.03 + optsH + (nRows - 1) * 20) * 1.06; // chừa 6% an toàn (chữ đậm, dấu tiếng Việt)
}

/** cỡ chữ câu hỏi / đáp án theo nội dung: lớn nhất mà cả câu hỏi và mọi đáp án vẫn nằm trong khung */
export function quizSizes(b: QuizBox): { qs: number; os: number; ok: boolean } {
  const cap = Math.min(72, b.w / 15);
  for (let qs = Math.round(cap); qs >= 26; qs -= 2) {
    const os = Math.min(64, Math.round(qs * 0.9));
    if (quizHeight(b, qs, os) <= b.h) return { qs, os, ok: true };
  }
  return { qs: 26, os: 22, ok: quizHeight(b, 26, 22) <= b.h };
}
