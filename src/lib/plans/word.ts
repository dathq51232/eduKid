// Xuất kế hoạch bài dạy / kế hoạch tuần ra Word (.doc dạng HTML — Word mở trực tiếp, "Lưu thành" .docx để chỉnh theo mẫu trường).
// Không dùng thư viện ngoài, tạo ngay trên trình duyệt.

import { PAGE_MARGIN, PAGE_MARGIN_LAND, WORD_BASE_STYLE, nd30HeaderHtml } from '../doc-style';
import { SUBJECT_NAMES, addDays, viDate, weekdayVi, type LessonPlan } from './generate';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const br = (s: string) => esc(s).replace(/\n/g, '<br/>');

// Thể thức theo NĐ30: Times New Roman, A4, lề trên/dưới 20 mm, trái 30 mm, phải 15 mm; nội dung cỡ 14 (src/lib/doc-style.ts)
const STYLE = `<style>
@page { size: 21cm 29.7cm; margin: ${PAGE_MARGIN}; }
@page land { size: 29.7cm 21cm; margin: ${PAGE_MARGIN_LAND}; }
${WORD_BASE_STYLE}
body { font-size: 14pt; line-height: 1.3; }
td, th { font-size: 13pt; }
h1 { font-size: 14pt; text-align: center; margin: 6pt 0 2pt; } h2 { font-size: 14pt; margin: 10pt 0 4pt; } h3 { font-size: 14pt; margin: 6pt 0 2pt; }
table { border-collapse: collapse; width: 100%; } td, th { vertical-align: top; }
.grid td, .grid th { border: 1px solid #000; padding: 3pt 6pt; } .grid th { background: #eee; }
.meta td { padding: 1pt 6pt 1pt 0; } .c { text-align: center; } .pb { page-break-before: always; } .muted { color: #555; font-size: 11pt; }
.wk { page: land; }
</style>`;

const doc = (title: string, body: string) =>
  `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(title)}</title>${STYLE}</head><body>${body}</body></html>`;

function planBody(p: LessonPlan, school: string): string {
  const when = p.date ? `${weekdayVi(p.date)}, ngày ${viDate(p.date)}` : '………………';
  const acts = p.activities.map((a) => `<tr>
      <td class="c" valign="top">${a.minutes ? `${a.minutes}'` : ''}</td>
      <td valign="top"><b>${esc(a.title)}</b>${a.goal ? `<br/><i>Mục tiêu: ${br(a.goal)}</i>` : ''}<br/>${br(a.teacher)}</td>
      <td valign="top">${br(a.student)}</td></tr>`).join('');
  return `
  ${nd30HeaderHtml({ school, showDate: false })}
  <h1>KẾ HOẠCH BÀI DẠY</h1>
  <p class="c">Lớp: ${esc(p.className || '……')}</p>
  <p class="c"><b>Môn: ${esc(SUBJECT_NAMES[p.subject])} ${p.grade}</b> — <b>${esc(p.title || 'Tên bài: ……………………')}</b></p>
  <p class="c muted">${p.week ? `Tuần ${esc(p.week)} · ` : ''}${when}${p.period ? ` · Tiết ${p.period}` : ''} · Thời lượng: ${p.minutes} phút</p>
  <h2>I. YÊU CẦU CẦN ĐẠT</h2>
  <h3>1. Kiến thức, kĩ năng</h3><p>${br(p.goals.knowledge)}</p>
  <h3>2. Năng lực</h3><p>${br(p.goals.competence)}</p>
  <h3>3. Phẩm chất</h3><p>${br(p.goals.quality)}</p>
  <h2>II. ĐỒ DÙNG DẠY HỌC</h2>
  <p><b>1. Giáo viên:</b> ${br(p.materials.teacher)}</p>
  <p><b>2. Học sinh:</b> ${br(p.materials.student)}</p>
  <h2>III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU</h2>
  <table class="grid" width="100%" border="1" cellspacing="0" cellpadding="4"><tr><th width="8%">Thời gian</th><th width="56%">Hoạt động của giáo viên</th><th>Hoạt động của học sinh</th></tr>${acts}</table>
  <p><b>Đánh giá:</b> ${br(p.assessment)}</p>
  <h2>IV. ĐIỀU CHỈNH SAU BÀI DẠY</h2>
  <p>${p.adjust.trim() ? br(p.adjust) : '……………………………………………………………………………………………<br/>……………………………………………………………………………………………'}</p>`;
}

/** Một hoặc nhiều giáo án (mỗi giáo án sang trang mới) */
export function plansDocument(plans: LessonPlan[], school: string): string {
  const body = plans.map((p, i) => `<div${i ? ' class="pb"' : ''}>${planBody(p, school)}</div>`).join('');
  return doc(plans.length === 1 ? plans[0].title : 'Kế hoạch bài dạy', body);
}

/** Lịch báo giảng tuần (bảng) + các giáo án của tuần phía sau */
export function weekDocument(monday: string, plans: LessonPlan[], school: string, className: string, withPlans: boolean): string {
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  const rows = days.map((d) => {
    const list = plans.filter((p) => p.date === d).sort((a, b) => (a.period || 99) - (b.period || 99));
    if (!list.length) return `<tr><td class="c"><b>${weekdayVi(d)}</b><br/>${viDate(d)}</td><td class="c">—</td><td></td><td></td><td></td></tr>`;
    return list.map((p, i) => `<tr>${i === 0 ? `<td class="c" rowspan="${list.length}"><b>${weekdayVi(d)}</b><br/>${viDate(d)}</td>` : ''}<td class="c">${p.period || ''}</td><td>${esc(SUBJECT_NAMES[p.subject])}</td><td>${esc(p.title)}</td><td>${esc(p.materials.teacher.split(/[.;]/)[0] ?? '')}</td></tr>`).join('');
  }).join('');
  const table = `<div class="wk">
    ${nd30HeaderHtml({ school, showDate: false })}
    <h1>LỊCH BÁO GIẢNG</h1><p class="c">Lớp: ${esc(className || '……')} · Tuần từ ${viDate(days[0])} đến ${viDate(days[4])}</p>
    <table class="grid" width="100%" border="1" cellspacing="0" cellpadding="4"><tr><th width="16%">Thứ / ngày</th><th width="6%">Tiết</th><th width="12%">Môn</th><th>Tên bài dạy</th><th width="26%">Đồ dùng</th></tr>${rows}</table></div>`;
  const rest = withPlans ? [...plans].sort((a, b) => (a.date + String(a.period).padStart(2, '0')).localeCompare(b.date + String(b.period).padStart(2, '0')))
    .map((p) => `<div class="pb">${planBody(p, school)}</div>`).join('') : '';
  return doc(`Lịch báo giảng tuần ${viDate(days[0])}`, table + rest);
}
