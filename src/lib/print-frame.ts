'use client';

// In / lưu PDF trong một khung ẩn chỉ chứa văn bản — tách hẳn khỏi giao diện app (nền tối, lưới nền, CSS của trang)
// để lề giấy luôn trắng, chữ không tràn ra ngoài khổ giấy, ngắt trang kiểu Word vẫn được tôn trọng.

/** CSS gốc cho bản in: nền trắng, chữ đen, Times New Roman, bảng không tràn, chuỗi chấm dài vẫn xuống dòng */
const BASE = `
html, body { margin: 0; padding: 0; background: #fff !important; color: #000; color-scheme: light; }
body { font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.25; overflow-wrap: break-word; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
img, table { max-width: 100%; }
table { border-collapse: collapse; }
thead { display: table-header-group; }
tr, img { break-inside: avoid; }
img { height: auto; }
p { orphans: 2; widows: 2; }
.vb-sheet h2 { margin: 0 0 8px; text-align: center; font-size: 1.35em; text-transform: uppercase; }
.vb-sheet table { width: 100%; border-collapse: collapse; }
.vb-sheet th, .vb-sheet td { padding: 3px 5px; vertical-align: middle; text-align: left; }
.vb-sheet th { font-weight: bold; text-align: center; background: #f2f2f2; }
.vb-sheet td.n { text-align: right; white-space: nowrap; }
.vb-sheet.is-grid th, .vb-sheet.is-grid td { border: 1px solid #555; }
.pf-break { break-before: page; page-break-before: always; height: 0; margin: 0; }
[contenteditable] { outline: none; }
`;

/** <br style="page-break-before:always"> (kiểu Word) không ngắt trang khi in trên trình duyệt → đổi thành khối ngắt trang */
export const blockBreaks = (html: string) =>
  html.replace(/<br\b[^>]*page-break-before:\s*always[^>]*\/?>/gi, '<div class="pf-break"></div>');

/** In nội dung (phần thân) với CSS @page cho trước. Trả về sau khi đã mở hộp thoại In. */
export function printInFrame(bodyHtml: string, pageCss: string, title = 'Ban in') {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = title;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  const d = frame.contentDocument;
  if (!w || !d) { frame.remove(); return; }
  d.open();
  d.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${title.replace(/</g, '')}</title><style>${BASE}\n${pageCss}</style></head><body>${blockBreaks(bodyHtml)}</body></html>`);
  d.close();
  let done = false;
  const cleanup = () => { if (done) return; done = true; window.setTimeout(() => frame.remove(), 500); };
  w.addEventListener('afterprint', cleanup);
  // chờ hình tải xong rồi mới in (hình chưa tải = trang trắng chỗ hình)
  const imgs = [...d.images].filter((i) => !i.complete);
  const go = () => { w.focus(); w.print(); window.setTimeout(cleanup, 60_000); };
  if (!imgs.length) window.setTimeout(go, 50);
  else Promise.all(imgs.map((i) => new Promise((r) => { i.onload = r; i.onerror = r; }))).then(go);
}
