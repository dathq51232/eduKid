// Xuất kế hoạch bài dạy / kế hoạch tuần ra Word (.doc dạng HTML — Word mở trực tiếp, "Lưu thành" .docx để chỉnh theo mẫu trường).
// Không dùng thư viện ngoài, tạo ngay trên trình duyệt.

import { PAGE_MARGIN, PAGE_MARGIN_LAND, WORD_BASE_STYLE, nd30HeaderHtml } from '../doc-style';
import { addDays, subjectNameOf, viDate, weekdayVi, type LessonPlan } from './generate';
import { sortSchoolOrder, subjectOf, type ScheduleRow } from './schedule';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const br = (s: string) => esc(s).replace(/\n/g, '<br/>');

// Thể thức theo NĐ30: Times New Roman, A4, lề trên/dưới 20 mm, trái 30 mm, phải 15 mm; nội dung cỡ 14 (src/lib/doc-style.ts)
const STYLE = `<style>
@page { size: 21cm 29.7cm; margin: ${PAGE_MARGIN}; }
@page Land { size: 29.7cm 21cm; mso-page-orientation: landscape; margin: ${PAGE_MARGIN_LAND}; }
@page Port { size: 21cm 29.7cm; margin: ${PAGE_MARGIN}; }
@page Lich { size: 21cm 29.7cm; margin: 10mm 10mm 10mm 15mm; }
div.Land { page: Land; } div.Port { page: Port; } div.Lich { page: Lich; }
.Lich .grid th { background: none; } td[valign="middle"] { vertical-align: middle; }
${WORD_BASE_STYLE}
body { font-size: 14pt; line-height: 1.3; }
td, th { font-size: 13pt; }
h1 { font-size: 14pt; text-align: center; margin: 6pt 0 2pt; } h2 { font-size: 14pt; margin: 10pt 0 4pt; } h3 { font-size: 14pt; margin: 6pt 0 2pt; }
table { border-collapse: collapse; width: 100%; } td, th { vertical-align: top; }
.grid td, .grid th { border: 1px solid #000; padding: 3pt 6pt; } .grid th { background: #eee; }
.meta td { padding: 1pt 6pt 1pt 0; } .c { text-align: center; } .pb { page-break-before: always; } .muted { color: #555; font-size: 11pt; }
</style>`;

/** ngắt trang — dạng Word và LibreOffice đều nhận */
const BREAK = '<p style="page-break-before:always;margin:0">&nbsp;</p>';
const sessionRank = (s?: string) => (/chi/i.test(s ?? '') ? 1 : 0);

const doc = (title: string, body: string) =>
  `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(title)}</title>${STYLE}</head><body>${body}</body></html>`;

function planBody(p: LessonPlan, school: string): string {
  // giáo án lấy từ kho của trường: giữ nguyên bản gốc (chữ, bảng, màu, hình)
  if (p.orig?.html && p.useOrig !== false) return `<div data-orig="1">${p.orig.html}</div>`;
  const when = p.date ? `${weekdayVi(p.date)}, ngày ${viDate(p.date)}` : '………………';
  const acts = p.activities.map((a, i) => `<tr data-sec="act-${i}">
      <td class="c" valign="top">${a.minutes ? `${a.minutes}'` : ''}</td>
      <td valign="top"><b>${esc(a.title)}</b>${a.goal ? `<br/><i>Mục tiêu: ${br(a.goal)}</i>` : ''}<br/>${br(a.teacher)}</td>
      <td valign="top">${br(a.student)}</td></tr>`).join('');
  return `
  <div data-sec="info">${nd30HeaderHtml({ school, showDate: false })}
  <h1>KẾ HOẠCH BÀI DẠY</h1>
  <p class="c">Lớp: ${esc(p.className || '……')}</p>
  <p class="c"><b>Môn: ${esc(subjectNameOf(p))}${p.subjectLabel ? '' : ` ${p.grade}`}</b> — <b>${esc(p.title || 'Tên bài: ……………………')}</b></p>
  <p class="c muted">${p.week ? `Tuần ${esc(p.week)} · ` : ''}${when}${p.session ? ` · Buổi ${esc(p.session.toLowerCase())}` : ''}${p.period ? ` · Tiết ${p.period}` : ''}${p.ppct ? ` · Tiết PPCT: ${esc(p.ppct)}` : ''} · Thời lượng: ${p.minutes} phút</p></div>
  <div data-sec="goals"><h2>I. YÊU CẦU CẦN ĐẠT</h2>
  <h3>1. ${esc(p.goalLabels?.[0] ?? 'Kiến thức, kĩ năng')}</h3><p>${br(p.goals.knowledge)}</p>
  <h3>2. ${esc(p.goalLabels?.[1] ?? 'Năng lực')}</h3><p>${br(p.goals.competence)}</p>
  <h3>3. ${esc(p.goalLabels?.[2] ?? 'Phẩm chất')}</h3><p>${br(p.goals.quality)}</p>
  ${p.integration?.trim() ? `<h3>4. Nội dung tích hợp</h3><p>${br(p.integration)}</p>` : ''}</div>
  <div data-sec="mat"><h2>II. ĐỒ DÙNG DẠY HỌC</h2>
  <p><b>1. Giáo viên:</b> ${br(p.materials.teacher)}</p>
  <p><b>2. Học sinh:</b> ${br(p.materials.student)}</p></div>
  <h2>III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU</h2>
  <table class="grid" width="100%" border="1" cellspacing="0" cellpadding="4"><tr><th width="8%">Thời gian</th><th width="56%">Hoạt động của giáo viên</th><th>Hoạt động của học sinh</th></tr>${acts}</table>
  ${p.assessment.trim() ? `<div data-sec="assess"><p><b>Đánh giá:</b> ${br(p.assessment)}</p></div>` : ''}
  <div data-sec="adjust"><h2>IV. ĐIỀU CHỈNH SAU BÀI DẠY</h2>
  <p>${p.adjust.trim() ? br(p.adjust) : '……………………………………………………………………………………………<br/>……………………………………………………………………………………………'}</p></div>`;
}

/** Một hoặc nhiều giáo án (mỗi giáo án sang trang mới) */
export function plansDocument(plans: LessonPlan[], school: string): string {
  const body = plans.map((p, i) => `${i ? BREAK : ''}${planBody(p, school)}`).join('');
  return doc(plans.length === 1 ? plans[0].title : 'Kế hoạch bài dạy', body);
}

/** Giáo án xếp theo mẫu nhà trường: Tiếng Việt → Toán → Đạo đức → TN&XH → HĐTN → TV tăng cường → Toán tăng cường → môn khác */
export function inSchoolOrder(plans: LessonPlan[]): LessonPlan[] {
  return sortSchoolOrder(plans, (p) => ({ subject: p.subject, extra: subjectOf(p.subjectLabel ?? '').extra, label: subjectNameOf(p), date: p.date, session: p.session, period: p.period }));
}

type TableRow = { date: string; session?: string; period: number; subject: string; ppct?: string; title: string; integration?: string; adjust?: string; red?: boolean };

/** Rút gọn ô "ND tích hợp / ĐDDH" cho lịch báo giảng in 1 trang: giữ tên mảng tích hợp + ý chính đầu tiên (bản đầy đủ vẫn ở giáo án) */
export function shortIntegration(raw: string, max = 60): string {
  const first = raw.split('\n').map((x) => x.trim()).find(Boolean) ?? '';
  const i = first.indexOf(':');
  const head = i > 0 && i < 40 ? first.slice(0, i + 1) : '';
  const body = (head ? first.slice(i + 1) : first).trim()
    .replace(/^qua [^,]*,\s*/i, '').replace(/^giáo dục (cho )?(học sinh|hs)\s+/i, '').split(/[;.]/)[0].trim();
  let out = head ? `${head} ${body}` : body;
  if (out.length > max) out = `${out.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
  return out;
}

/** Các ngày trong tuần và các tiết của từng ngày (đã xếp buổi sáng → chiều, theo tiết) — dùng chung cho Word và Excel */
export function weekEntries(monday: string, plans: LessonPlan[], skipped: ScheduleRow[] = []): { days: string[]; byDay: TableRow[][]; week: string } {
  const entries: TableRow[] = [
    ...plans.map((p) => ({ date: p.date, session: p.session, period: p.period, subject: subjectNameOf(p), ppct: p.ppct, title: p.title, integration: p.integration, adjust: p.adjust })),
    ...skipped.map((r) => ({ date: r.date, session: r.session, period: r.period, subject: r.subjectLabel, ppct: r.ppct, title: r.title, integration: r.integration, adjust: r.adjust, red: true })),
  ];
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  if (entries.some((p) => p.date === addDays(monday, 5))) days.push(addDays(monday, 5));
  const byDay = days.map((d) => entries.filter((p) => p.date === d).sort((x, y) => sessionRank(x.session) - sessionRank(y.session) || (x.period || 99) - (y.period || 99)));
  return { days, byDay, week: plans.find((p) => p.week)?.week ?? '' };
}

/** số tiết liên tiếp cùng buổi bắt đầu từ tiết i (0 = không phải tiết đầu của buổi) */
export const sessionSpan = (list: TableRow[], i: number) => {
  if (i > 0 && (list[i - 1].session ?? '') === (list[i].session ?? '')) return 0;
  let span = 1; while (i + span < list.length && (list[i + span].session ?? '') === (list[i].session ?? '')) span++;
  return span;
};
export const dayName = (d: string) => weekdayVi(d).replace('Thứ ', '').toUpperCase();

/** Bề rộng cột lịch báo giảng theo mẫu của trường (đơn vị ký tự Excel; Word dùng theo tỉ lệ) */
export const SCHOOL_COLS = [11.6, 8, 6.8, 14.5, 7.8, 21.5, 18.8, 8];
export const WEEK_HEAD = ['Thứ,\nngày', 'Buổi', 'Tiết\nTKB', 'Môn học', 'Tiết\nPPCT', 'Tên bài dạy', 'ND tích hợp/ ĐDDH', 'Điều chỉnh KH tuần'];

export type WeekDocOpts = {
  /** cỡ chữ bảng (pt) để lịch vừa đúng 1 trang — tính bằng fitWeek (lib/plans/fit.ts) */
  font?: number;
  /** school: mẫu trường (A4 dọc, 8 cột như file KHDH của trường); land: trang ngang có quốc hiệu */
  layout?: 'school' | 'land';
  /** rút gọn ô ND tích hợp */
  short?: boolean;
  /** chiều cao tối thiểu mỗi hàng (pt) — giãn cho đầy trang khi tuần ít tiết */
  rowPt?: number;
};

/** Lịch báo giảng tuần (bảng) + các giáo án của tuần phía sau. `skipped`: tiết chữ đỏ (tiết trống) — vẫn ghi trong bảng (chữ đỏ), không soạn giáo án */
export function weekDocument(monday: string, plans: LessonPlan[], school: string, className: string, withPlans: boolean, skipped: ScheduleRow[] = [], opts: WeekDocOpts = {}): string {
  const f = opts.font;
  const fs = (h: string) => (f ? `<span style="font-size:${f}pt">${h}</span>` : h);
  const { days, byDay, week } = weekEntries(monday, plans, skipped);
  const integ = (s?: string) => (opts.short && s ? esc(shortIntegration(s)) : br(s ?? ''));
  const school1 = opts.layout === 'school';
  const tr = opts.rowPt ? `<tr style="height:${opts.rowPt}pt">` : '<tr>';
  const rows = days.map((d, di) => {
    const list = byDay[di];
    const dayCell = `<td class="c" valign="middle" rowspan="${Math.max(1, list.length)}">${fs(`<b>${dayName(d)}</b><br/>${viDate(d)}`)}</td>`;
    if (!list.length) return `${tr}${dayCell}<td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    // gộp ô Buổi theo các tiết liên tiếp cùng buổi
    return list.map((p, i) => {
      const span = sessionSpan(list, i);
      const red = (h: string) => fs(p.red ? `<span style="color:#FF0000">${h}</span>` : h);
      const sesCell = span ? `<td class="c" valign="middle" rowspan="${span}">${fs(school1 ? `<b>${esc(p.session ?? '')}</b>` : esc(p.session ?? ''))}</td>` : '';
      const subj = school1 ? `<b>${esc(p.subject)}</b>` : esc(p.subject);
      return `${tr}${i === 0 ? dayCell : ''}${sesCell}<td class="c">${red(String(p.period || ''))}</td><td>${red(subj)}</td><td class="c">${red(esc(p.ppct ?? ''))}</td><td>${red(esc(p.title))}</td><td>${red(integ(p.integration))}</td><td>${red(br(p.adjust ?? ''))}</td></tr>`;
    }).join('');
  }).join('');
  // cỡ chữ đặt ngay trên ô (để cả ô trống, dấu đoạn trong Word cũng nhỏ theo → hàng thấp lại)
  const cellFont = (h: string) => (f ? h.replace(/<(td|th)(?=[\s>])/g, `<$1 style="font-size:${f}pt;line-height:${f < 12 ? 1 : 1.15}"`) : h);
  const red = skipped.length ? `<p class="muted"><span style="color:#FF0000">Chữ đỏ</span>: tiết trống, không soạn giáo án.</p>` : '';
  let table: string;
  if (school1) {
    // mẫu của trường: tiêu đề, dòng Tuần / Từ ngày – Đến ngày, bảng 8 cột
    const tot = SCHOOL_COLS.reduce((a, b) => a + b, 0);
    const hf = f ? Math.min(13, f + 1) : 13, sf = f ?? 12;
    const head = `<p class="c" style="margin:0"><span style="font-size:${hf}pt"><b>KẾ HOẠCH DẠY HỌC LỚP ${esc((className || '……').toUpperCase())}</b></span></p>
    <table width="100%" cellspacing="0" cellpadding="0"><tr><td width="40%"><span style="font-size:${sf}pt"><b>Tuần: ${esc(week || '……')}</b></span></td><td width="60%" align="right" style="text-align:right"><span style="font-size:${sf}pt"><b>Từ ngày: ${viDate(days[0])} &nbsp; Đến ngày: ${viDate(days[days.length - 1])}</b></span></td></tr></table><p style="margin:0 0 2pt;font-size:3pt">&nbsp;</p>`;
    table = `<div class="Lich">${head}
    <table class="grid" width="100%" border="1" cellspacing="0" cellpadding="4">${cellFont(`<tr>${WEEK_HEAD.map((t, i) => `<th width="${((SCHOOL_COLS[i] / tot) * 100).toFixed(1)}%">${f ? `<span style="font-size:${Math.max(7, f - 1)}pt">${esc(t).replace(/\n/g, '<br/>')}</span>` : esc(t).replace(/\n/g, '<br/>')}</th>`).join('')}</tr>${rows.replace(/<td(?![^>]*valign)/g, '<td valign="middle"')}`)}</table>${red}</div>`;
  } else {
    const title = `KẾ HOẠCH DẠY HỌC${week ? ` TUẦN ${esc(week)}` : ''}`, sub = `Lớp: ${esc(className || '……')} · Từ ngày ${viDate(days[0])} đến ngày ${viDate(days[days.length - 1])}`;
    // lịch dài (cỡ chữ < 11): đầu trang gọn 1 dòng để bảng vừa trang đầu
    const head = f && f < 11
      ? `<table width="100%" cellspacing="0" cellpadding="0"><tr><td width="28%"><span style="font-size:11pt"><b>${esc((school.trim() || 'TRƯỜNG TIỂU HỌC ……………').toUpperCase())}</b></span></td><td width="37%" class="c"><span style="font-size:13pt"><b>${title}</b></span></td><td width="35%" align="right" style="text-align:right"><span style="font-size:10.5pt">${sub}</span></td></tr></table><p style="margin:0 0 3pt;font-size:4pt">&nbsp;</p>`
      : `${nd30HeaderHtml({ school, showDate: false })}<h1>${title}</h1><p class="c">${sub}</p>`;
    table = `<div class="Land">
    ${head}
    <table class="grid" width="100%" border="1" cellspacing="0" cellpadding="4">${cellFont(`<tr>${[['8%', 'Thứ,<br/>ngày'], ['6%', 'Buổi'], ['5%', 'Tiết<br/>TKB'], ['10%', 'Môn học'], ['5%', 'Tiết<br/>PPCT'], ['', 'Tên bài dạy'], ['21%', 'ND tích hợp / ĐDDH'], ['9%', 'Điều chỉnh<br/>KH tuần']].map(([w, t]) => `<th${w ? ` width="${w}"` : ''}>${fs(t)}</th>`).join('')}</tr>${rows}`)}</table>${red}</div>`;
  }
  const rest = withPlans ? inSchoolOrder(plans).map((p, i) => `${i ? BREAK : ''}${planBody(p, school)}`).join('') : '';
  return doc(`Kế hoạch dạy học tuần ${viDate(days[0])}`, table + (rest ? `<div class="Port">${rest}</div>` : ''));
}
