// Thể thức chung cho mọi văn bản app xuất ra (Word .doc, bản in / PDF) — theo Nghị định 30/2020/NĐ-CP:
// phông Times New Roman (bộ mã Unicode), khổ A4, lề trên 20 mm, dưới 20 mm, trái 30 mm, phải 15 mm;
// nội dung cỡ 13–14, giãn dòng từ 1 đến 1,5 dòng, cách đoạn ≥ 6pt, lùi đầu dòng 1–1,27 cm.
// Phần đầu văn bản (khi có): góc trái tên cơ quan (trường), góc phải Quốc hiệu – Tiêu ngữ và địa danh, ngày tháng.

export const DOC_FONT = "'Times New Roman', Times, serif";

/** Lề trang A4 đứng theo NĐ30 (trên, phải, dưới, trái) */
export const PAGE_MARGIN = '20mm 15mm 20mm 30mm';
/** Lề trang A4 ngang (bảng lịch, ma trận lớn) */
export const PAGE_MARGIN_LAND = '20mm 20mm 20mm 25mm';

/** CSS cho file Word dạng HTML: ép Times New Roman ở mọi phần tử (Word không luôn kế thừa phông vào bảng) */
export const WORD_BASE_STYLE = `
body, p, td, th, li, div, span, h1, h2, h3, table { font-family: ${DOC_FONT}; mso-ascii-font-family: 'Times New Roman'; mso-hansi-font-family: 'Times New Roman'; mso-bidi-font-family: 'Times New Roman'; }
p { margin: 0 0 6pt; }
.nd30-head { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
.nd30-head td { border: 0; padding: 0; text-align: center; vertical-align: top; }
.nd30-org { font-size: 13pt; text-transform: uppercase; }
.nd30-org b { font-size: 13pt; }
.nd30-nation { font-size: 12pt; font-weight: bold; }
.nd30-motto { font-size: 13pt; font-weight: bold; }
.nd30-rule { border-collapse: collapse; margin: 1pt auto 4pt; }
.nd30-rule td { border: 0; border-top: 1px solid #000; font-size: 2pt; line-height: 2pt; padding: 0; }
.nd30-place { font-size: 13pt; font-style: italic; }
.nd30-sign td { border: 0; padding: 0; vertical-align: top; }
.nd30-sign .role { font-size: 13pt; font-weight: bold; text-transform: uppercase; text-align: center; }
.nd30-sign .name { font-size: 14pt; font-weight: bold; text-align: center; }
`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Ngày tháng theo thể thức: "ngày 5 tháng 3 năm 2026" (ngày < 10 và tháng 1, 2 thêm số 0 theo NĐ30) */
export function nd30Date(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return 'ngày …… tháng …… năm ……';
  const d = Number(m[3]), mo = Number(m[2]);
  return `ngày ${String(d).padStart(2, '0')} tháng ${mo <= 2 ? String(mo).padStart(2, '0') : mo} năm ${m[1]}`;
}

/** Đường kẻ ngang dưới tên cơ quan / tiêu ngữ (bảng 1 ô có viền trên — Word hiển thị đúng) */
const rule = (pct: number) => `<table class="nd30-rule" align="center" width="${pct}%" cellspacing="0" cellpadding="0"><tr><td style="border-top:1px solid #000;font-size:2pt;line-height:2pt">&nbsp;</td></tr></table>`;

/** Phần đầu văn bản 2 cột: trái tên trường (+ cơ quan chủ quản), phải Quốc hiệu – Tiêu ngữ, địa danh ngày tháng */
export function nd30HeaderHtml(opts: { parent?: string; school: string; place?: string; dateIso?: string; showDate?: boolean }): string {
  const school = opts.school.trim() || 'TRƯỜNG TIỂU HỌC ……………………';
  const place = opts.place?.trim() || '……………';
  const date = opts.showDate === false ? '' : `<div class="nd30-place">${esc(place)}, ${nd30Date(opts.dateIso ?? '')}</div>`;
  return `<table class="nd30-head" width="100%"><tr>
    <td width="42%"><div class="nd30-org">${opts.parent?.trim() ? `${esc(opts.parent.trim().toUpperCase())}<br/>` : ''}<b>${esc(school.toUpperCase())}</b></div>${rule(35)}</td>
    <td width="58%"><div class="nd30-nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="nd30-motto">Độc lập - Tự do - Hạnh phúc</div>${rule(55)}${date}</td>
  </tr></table>`;
}

/** Khối ký: bên phải, chức danh in hoa đậm, để trống chỗ ký, họ tên đậm */
export function nd30SignHtml(role: string, name: string): string {
  return `<table class="nd30-sign" width="100%"><tr><td width="50%"></td><td width="50%"><p class="role">${esc(role || 'GIÁO VIÊN')}</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p class="name">${esc(name || '')}</p></td></tr></table>`;
}
