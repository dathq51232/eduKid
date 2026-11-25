// In theo lớp: dựng HTML từ danh sách học sinh — danh sách lớp (điểm danh tháng, ký nhận, nộp tiền, tuỳ chọn),
// nhãn vở, thẻ tên để bàn, trộn thư (một mẫu → mỗi em một trang). Thuần hàm, chạy trên trình duyệt; không gửi dữ liệu đi đâu.

export type Pupil = { id: string; name: string };
export type Ctx = { unit: string; className: string; teacher: string; place: string; date: string };
/** Kết quả: HTML phần thân + CSS @page riêng (khổ giấy, lề) */
export type Printable = { html: string; css: string; landscape: boolean };

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BREAK = '<div style="break-before:page;page-break-before:always"></div>';
/** Ngắt trang hiểu được cả khi in lẫn khi xuất Word */
const WORD_BREAK = '<br style="page-break-before:always" />';

export function dateLine(place: string, iso: string) {
  const [y, m, d] = iso.split('-');
  return `${place.trim() || '……………'}, ngày ${d ?? '…'} tháng ${m ?? '…'} năm ${y ?? '……'}`;
}

/** Năm học theo ngày: từ tháng 8 trở đi là năm học mới */
export function schoolYear(iso: string) {
  const [y, m] = iso.split('-').map(Number);
  const start = (m ?? 1) >= 8 ? y : y - 1;
  return `${start} – ${start + 1}`;
}

// ------------------------------------------------------------------ danh sách lớp
export type RosterKind = 'diem-danh' | 'ky-nhan' | 'nop-tien' | 'tuy-chon';
export const ROSTER_KINDS: { id: RosterKind; label: string; hint: string; title: string; cols: string }[] = [
  { id: 'diem-danh', label: 'Điểm danh tháng', hint: 'Ô từng ngày, khổ ngang', title: 'BẢNG ĐIỂM DANH', cols: '' },
  { id: 'ky-nhan', label: 'Ký nhận', hint: 'Sách, đồ dùng, giấy tờ', title: 'DANH SÁCH KÝ NHẬN', cols: 'Nội dung nhận, Phụ huynh ký, Ghi chú' },
  { id: 'nop-tien', label: 'Theo dõi nộp tiền', hint: 'Số tiền, ngày nộp, ký nhận', title: 'DANH SÁCH THEO DÕI NỘP TIỀN', cols: 'Số tiền, Ngày nộp, Người nộp ký, Ghi chú' },
  { id: 'tuy-chon', label: 'Cột tuỳ chọn', hint: 'Tự đặt tên cột', title: 'DANH SÁCH HỌC SINH', cols: 'Ghi chú' },
];

export const daysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function rosterHtml(o: {
  kind: RosterKind; title: string; cols: string[]; month: number; year: number; students: Pupil[]; ctx: Ctx; weekends?: boolean;
}): Printable {
  const { kind, ctx, students } = o;
  const landscape = kind === 'diem-danh' || o.cols.length > 4;
  const cell = 'border:1px solid #000;padding:3px 4px';
  const th = `${cell};text-align:center;font-weight:bold;background:#f2f2f2;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
  let head: string[];
  let row: (i: number, p: Pupil) => string;
  if (kind === 'diem-danh') {
    const n = daysInMonth(o.month, o.year);
    const days = Array.from({ length: n }, (_, i) => i + 1).filter((d) => o.weekends || ![0, 6].includes(new Date(o.year, o.month - 1, d).getDay()));
    head = ['STT', 'Họ và tên', ...days.map((d) => `${d}<br/><small>${WD[new Date(o.year, o.month - 1, d).getDay()]}</small>`), 'P', 'K'];
    row = (i, p) => `<td style="${cell};text-align:center">${i + 1}</td><td style="${cell};white-space:nowrap">${esc(p.name)}</td>${days.map(() => `<td style="${cell}"></td>`).join('')}<td style="${cell}"></td><td style="${cell}"></td>`;
  } else {
    head = ['STT', 'Họ và tên', ...o.cols.map(esc)];
    row = (i, p) => `<td style="${cell};text-align:center">${i + 1}</td><td style="${cell};white-space:nowrap">${esc(p.name)}</td>${o.cols.map(() => `<td style="${cell}"></td>`).join('')}`;
  }
  const size = kind === 'diem-danh' ? '10pt' : '13pt';
  const pad = kind === 'diem-danh' ? '2px' : '7px';
  const sub = kind === 'diem-danh' ? `Lớp ${esc(ctx.className)} — Tháng ${o.month}/${o.year}` : `Lớp ${esc(ctx.className)} — Năm học ${schoolYear(ctx.date)}`;
  const html = `<div style="font-family:'Times New Roman',serif;font-size:${size}">
<p style="margin:0;font-weight:bold;text-transform:uppercase">${esc(ctx.unit || 'TRƯỜNG ……………………')}</p>
<p style="margin:10pt 0 0;text-align:center;font-weight:bold;font-size:15pt">${esc(o.title.trim() || 'DANH SÁCH HỌC SINH')}</p>
<p style="margin:2pt 0 8pt;text-align:center;font-style:italic">${sub}</p>
<table style="width:100%;border-collapse:collapse"><thead><tr>${head.map((h, i) => `<th style="${th}${i === 1 ? ';min-width:42mm' : ''}">${h}</th>`).join('')}</tr></thead>
<tbody>${students.map((p, i) => `<tr style="height:${pad === '2px' ? '6mm' : '9mm'}">${row(i, p)}</tr>`).join('')}</tbody></table>
<p style="margin:6pt 0 0">Tổng số: ${students.length} học sinh.${kind === 'diem-danh' ? ' Ký hiệu: <b>P</b> vắng có phép, <b>K</b> vắng không phép.' : ''}</p>
<table style="width:100%;margin-top:10pt;border:0"><tr><td style="width:50%"></td><td style="text-align:center"><i>${esc(dateLine(ctx.place, ctx.date))}</i><br/><b>GIÁO VIÊN CHỦ NHIỆM</b><br/><br/><br/><br/><b>${esc(ctx.teacher)}</b></td></tr></table>
</div>`;
  return { html, landscape, css: `@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: ${landscape ? '10mm 10mm' : '15mm 15mm 15mm 20mm'}; }` };
}

// ------------------------------------------------------------------ nhãn vở
export type LabelStyle = 'xanh' | 'hong' | 'vang' | 'den';
export const LABEL_STYLES: { id: LabelStyle; label: string; color: string }[] = [
  { id: 'xanh', label: 'Xanh', color: '#2457c5' },
  { id: 'hong', label: 'Hồng', color: '#e64980' },
  { id: 'vang', label: 'Cam vàng', color: '#e67700' },
  { id: 'den', label: 'Đen trắng (tiết kiệm mực)', color: '#000000' },
];

/** Mỗi trang A4 dọc 10 nhãn (2 cột × 5 hàng, 90 × 52 mm) — in lên giấy decal A4 rồi cắt */
export function labelsHtml(o: { students: Pupil[]; subjects: string[]; copies: number; style: LabelStyle; ctx: Ctx }): Printable {
  const color = LABEL_STYLES.find((s) => s.id === o.style)?.color ?? '#2457c5';
  const items: { name: string; subject: string }[] = [];
  for (const p of o.students) {
    if (o.subjects.length) for (const s of o.subjects) items.push({ name: p.name, subject: s });
    else for (let i = 0; i < Math.max(1, o.copies); i++) items.push({ name: p.name, subject: '' });
  }
  const line = (k: string, v: string) => `<div style="display:flex;gap:2mm;align-items:baseline;margin-top:2.2mm"><span style="flex:none;color:${color};font-weight:bold">${k}</span><span style="flex:1;border-bottom:1px dotted #777;min-height:5mm;font-weight:bold">${esc(v)}</span></div>`;
  const label = (it: { name: string; subject: string }) => `<div style="box-sizing:border-box;height:52mm;padding:4mm 5mm;border:2px solid ${color};border-radius:5mm;break-inside:avoid;page-break-inside:avoid;font-family:'Times New Roman',serif;font-size:13pt;-webkit-print-color-adjust:exact;print-color-adjust:exact">
<div style="text-align:center;font-weight:bold;font-size:15pt;color:${color};letter-spacing:.5pt">${it.subject ? `VỞ ${esc(it.subject.toUpperCase())}` : 'NHÃN VỞ'}</div>
${line('Họ và tên:', it.name)}${line('Lớp:', o.ctx.className)}${line('Trường:', o.ctx.unit.replace(/^TRƯỜNG\s+/i, ''))}${it.subject ? '' : line('Vở:', '')}
</div>`;
  const pages: string[] = [];
  for (let i = 0; i < items.length; i += 10) {
    pages.push(`<div style="display:grid;grid-template-columns:90mm 90mm;grid-auto-rows:52mm;gap:3mm 6mm;justify-content:center">${items.slice(i, i + 10).map(label).join('')}</div>`);
  }
  return { html: pages.join(BREAK), landscape: false, css: '@page { size: A4 portrait; margin: 10mm 8mm; }' };
}

// ------------------------------------------------------------------ thẻ tên để bàn
/** Mỗi em một tờ A4 ngang: gấp đôi theo đường giữa thành thẻ dựng trên bàn; nửa trên in ngược để nhìn từ hai phía */
export function tentHtml(o: { students: Pupil[]; ctx: Ctx; style: LabelStyle }): Printable {
  const color = LABEL_STYLES.find((s) => s.id === o.style)?.color ?? '#2457c5';
  const half = (p: Pupil, flip: boolean) => {
    const size = p.name.length > 24 ? 40 : p.name.length > 16 ? 52 : 64;
    return `<div style="height:96mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4mm;${flip ? 'transform:rotate(180deg);border-top:1px dashed #999;' : ''}">
<div style="font-size:${size}pt;font-weight:bold;color:${color};text-align:center;line-height:1.1;-webkit-print-color-adjust:exact;print-color-adjust:exact">${esc(p.name)}</div>
<div style="font-size:18pt;color:#333">Lớp ${esc(o.ctx.className)}</div></div>`;
  };
  const html = o.students.map((p) => `<div style="font-family:'Times New Roman',serif;break-inside:avoid">${half(p, true)}${half(p, false)}</div>`).join(BREAK);
  return { html, landscape: true, css: '@page { size: A4 landscape; margin: 9mm 10mm; }' };
}

// ------------------------------------------------------------------ trộn thư
export const MERGE_FIELDS: { key: string; label: string }[] = [
  { key: 'ten', label: 'Họ tên học sinh' },
  { key: 'stt', label: 'Số thứ tự' },
  { key: 'lop', label: 'Lớp' },
  { key: 'gvcn', label: 'Giáo viên chủ nhiệm' },
  { key: 'truong', label: 'Trường' },
  { key: 'ngay', label: 'Ngày, tháng (dòng ký)' },
];

export type MergePreset = { id: string; label: string; title: string; body: string };
export const MERGE_PRESETS: MergePreset[] = [
  {
    id: 'moi-hop', label: 'Giấy mời họp phụ huynh', title: 'GIẤY MỜI',
    body: 'Kính gửi: Phụ huynh em {ten} — lớp {lop}.\nGiáo viên chủ nhiệm lớp {lop} trân trọng kính mời quý phụ huynh đến dự buổi họp phụ huynh học sinh.\nThời gian: [giờ], ngày [ngày/tháng/năm].\nĐịa điểm: phòng học lớp {lop}.\nNội dung: thông báo kết quả học tập, rèn luyện của học sinh và trao đổi kế hoạch thời gian tới.\nRất mong quý phụ huynh đến dự đầy đủ, đúng giờ.',
  },
  {
    id: 'nop-tien', label: 'Giấy báo nộp tiền', title: 'GIẤY BÁO',
    body: 'Kính gửi: Phụ huynh em {ten} — lớp {lop}.\nGiáo viên chủ nhiệm xin thông báo khoản cần nộp:\n- Nội dung: [tên khoản].\n- Số tiền: [số tiền] đồng.\n- Hạn nộp: trước ngày [ngày/tháng].\nQuý phụ huynh vui lòng nộp cho giáo viên chủ nhiệm hoặc chuyển khoản theo thông tin đã thông báo. Trân trọng cảm ơn!',
  },
  {
    id: 'lien-lac', label: 'Phiếu liên lạc', title: 'PHIẾU LIÊN LẠC',
    body: 'Học sinh: {ten} — lớp {lop}.\nNhận xét của giáo viên:\n……………………………………………………………………………\n……………………………………………………………………………\nÝ kiến của phụ huynh:\n……………………………………………………………………………\n……………………………………………………………………………',
  },
];

export function fillFields(text: string, p: Pupil, i: number, ctx: Ctx) {
  const v: Record<string, string> = {
    ten: p.name, stt: String(i + 1), lop: ctx.className, gvcn: ctx.teacher, truong: ctx.unit || '……………', ngay: dateLine(ctx.place, ctx.date),
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
}

/** Một mẫu → mỗi em một phiếu. perPage 2 = hai phiếu A5 trên một tờ A4 (đường cắt ở giữa) để tiết kiệm giấy. forWord: ngắt trang kiểu Word */
export function mergeHtml(o: { title: string; body: string; students: Pupil[]; ctx: Ctx; perPage: 1 | 2; forWord?: boolean }): Printable {
  const small = o.perPage === 2;
  const one = (p: Pupil, i: number) => {
    const paras = fillFields(o.body, p, i, o.ctx).split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => `<p style="margin:${small ? '3pt' : '6pt'} 0 0;text-align:justify${/^[-–•]/.test(l) ? ';text-indent:0' : ';text-indent:1cm'}">${esc(l)}</p>`).join('');
    return `<div style="font-family:'Times New Roman',serif;font-size:${small ? '12.5pt' : '14pt'};line-height:1.3;${small && !o.forWord ? 'box-sizing:border-box;height:128mm;overflow:hidden;' : ''}">
<table style="width:100%;border:0"><tr><td style="width:45%;text-align:center;vertical-align:top"><b style="text-transform:uppercase">${esc(o.ctx.unit || 'TRƯỜNG ……')}</b><br/>Lớp ${esc(o.ctx.className)}</td><td style="text-align:center;vertical-align:top"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/><b>Độc lập - Tự do - Hạnh phúc</b></td></tr></table>
<p style="margin:${small ? '6pt' : '12pt'} 0 0;text-align:center;font-weight:bold;font-size:${small ? '14pt' : '15pt'}">${esc(o.title.trim() || 'GIẤY BÁO')}</p>
${paras}
<table style="width:100%;margin-top:${small ? '4pt' : '10pt'};border:0"><tr><td style="width:50%"></td><td style="text-align:center"><i>${esc(dateLine(o.ctx.place, o.ctx.date))}</i><br/><b>GIÁO VIÊN CHỦ NHIỆM</b><br/>${small ? '<br/><br/>' : '<br/><br/><br/>'}<b>${esc(o.ctx.teacher)}</b></td></tr></table></div>`;
  };
  const brk = o.forWord ? WORD_BREAK : BREAK;
  const cut = '<div style="height:6mm;margin:3mm 0;border-top:1px dashed #888"></div>';
  const blocks = o.students.map(one);
  const html = o.perPage === 2
    ? Array.from({ length: Math.ceil(blocks.length / 2) }, (_, k) => blocks.slice(k * 2, k * 2 + 2).join(cut)).join(brk)
    : blocks.join(brk);
  return { html, landscape: false, css: `@page { size: A4 portrait; margin: ${small ? '10mm 15mm 8mm 20mm' : '20mm 15mm 20mm 30mm'}; }` };
}
