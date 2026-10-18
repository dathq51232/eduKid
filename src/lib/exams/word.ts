// Xuất đề kiểm tra ra file Word (.doc dạng HTML — Word mở trực tiếp, "Lưu thành" .docx nếu cần).
// Không dùng thư viện ngoài; tạo ngay trên trình duyệt, không gửi dữ liệu đi đâu.

import { asciiFilename } from '../filename';
import { MUCS, MUC_NAME, partOf, totals, type ExamQuestion, type Matrix, type Muc, type Paper } from './matrix';

export type ExamMeta = {
  school: string; title: string; subjectName: string; grade: number; className: string;
  yearLabel: string; minutes: number;
  /** Phiếu bài tập: không ghi điểm từng câu, không thời gian, không ô điểm; đáp án không có cột điểm */
  worksheet?: boolean;
  /** Phiếu bài tập: nội dung (các bài) in dưới tiêu đề */
  topic?: string;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const br = (s: string) => esc(s).replace(/\n/g, '<br/>');
const LETTERS = 'ABCDEFGH';
const lower = 'abcdefgh';
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ','));
const BLANK = '……………';

function questionHtml(q: ExamQuestion, no: number, pts: number | null): string {
  const head = `<p class="q"><b>Câu ${no}.</b> ${pts == null ? '' : `<i>(${fmt(pts)} điểm)</i> `}`;
  switch (q.type) {
    case 'single_choice':
      return `${head}${br(q.prompt)}</p><p class="hint">Khoanh vào chữ đặt trước câu trả lời đúng:</p>`
        + `<table class="opts"><tr>${q.options.map((o, i) => `<td>${LETTERS[i]}. ${esc(o)}</td>`).join('')}</tr></table>`;
    case 'multiple_choice':
      return `${head}${br(q.prompt)}</p><p class="hint">Khoanh vào chữ đặt trước các câu trả lời đúng (có thể nhiều hơn một):</p>`
        + `<table class="opts"><tr>${q.options.map((o, i) => `<td>${LETTERS[i]}. ${esc(o)}</td>`).join('')}</tr></table>`;
    case 'true_false':
      return `${head}Đúng ghi Đ, sai ghi S vào ô trống:</p><p class="indent">${br(q.prompt)} &nbsp; <span class="box">&nbsp;&nbsp;&nbsp;&nbsp;</span></p>`;
    case 'true_false_table':
      return `${head}${br(q.prompt)}</p>${/ghi Đ/.test(q.prompt) ? '' : '<p class="hint">Đúng ghi Đ, sai ghi S:</p>'}<table class="grid">`
        + (q.statements ?? []).map((st) => `<tr><td>${esc(st)}</td><td class="tf">&nbsp;</td></tr>`).join('') + '</table>';
    case 'fill_blanks':
      return `${head}${br(q.prompt)}</p>` + (q.blanks ?? []).map((l) => `<p class="indent">${esc(l).replace(/\{\}/g, BLANK)}</p>`).join('');
    case 'matching':
      return `${head}${br(q.prompt)}</p><p class="hint">Nối mỗi ý ở cột trái với ý phù hợp ở cột phải:</p><table class="grid">`
        + Array.from({ length: Math.max(q.left?.length ?? 0, q.options.length) }, (_, i) =>
          `<tr><td>${q.left?.[i] != null ? `${i + 1}. ${esc(q.left[i])}` : ''}</td><td class="gap">&nbsp;</td><td>${q.options[i] != null ? `${lower[i]}. ${esc(q.options[i])}` : ''}</td></tr>`).join('')
        + '</table>';
    case 'ordering':
      return `${head}${br(q.prompt)}</p><p class="hint">Sắp xếp theo thứ tự đúng (ghi số thứ tự vào ô):</p>`
        + `<p class="indent">${q.options.map((o) => `<span class="box">&nbsp;&nbsp;&nbsp;</span> ${esc(o)}`).join(' &nbsp;&nbsp; ')}</p>`;
    case 'fill_blank':
    default: {
      const p = q.prompt.includes('___') || q.prompt.includes('…') ? br(q.prompt).replace(/_{3,}/g, BLANK) : br(q.prompt);
      return `${head}${p}</p><p class="indent">Trả lời: ${BLANK}${BLANK}${BLANK}</p>`;
    }
  }
}

export function answerText(q: ExamQuestion): string {
  const k = q.answer as Record<string, unknown>;
  if (q.type === 'single_choice' && typeof k.correct === 'string') {
    const i = q.options.indexOf(k.correct as string);
    return i >= 0 ? `${LETTERS[i]}. ${k.correct}` : String(k.correct);
  }
  if (q.type === 'multiple_choice' && Array.isArray(k.correct)) {
    return (k.correct as string[]).map((c) => ({ c, i: q.options.indexOf(c) })).sort((a, b) => a.i - b.i)
      .map(({ c, i }) => (i >= 0 ? `${LETTERS[i]}. ${c}` : c)).join('; ');
  }
  if (q.type === 'true_false' && typeof k.correct === 'string') return k.correct === 'Đúng' ? 'Đ' : 'S';
  if (Array.isArray(k.accepted)) return (k.accepted as string[]).slice(0, 3).join(' hoặc ');
  if (Array.isArray(k.order)) return (k.order as string[]).join(' → ');
  if (k.pairs && typeof k.pairs === 'object') {
    const pairs = k.pairs as Record<string, string>;
    return (q.left ?? Object.keys(pairs)).map((l, i) => { const j = q.options.indexOf(pairs[l]); return `${i + 1}–${j >= 0 ? lower[j] : '?'}`; }).join(', ');
  }
  if (Array.isArray(k.answers)) return ((k.answers as string[][])[0] ?? []).join('; ');
  if (Array.isArray(k.truth)) return (k.truth as string[]).map((t, i) => `${i + 1}: ${t === 'Đúng' ? 'Đ' : 'S'}`).join(', ');
  return '';
}

const STYLE = `<style>
@page { size: 21cm 29.7cm; margin: 2cm 2cm 2cm 2.5cm; }
body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; }
h1 { font-size: 14pt; text-align: center; margin: 4pt 0; } h2 { font-size: 13pt; margin: 10pt 0 4pt; }
table { border-collapse: collapse; } .head td { vertical-align: top; padding: 2pt 6pt; }
.grid td, .grid th, .mx td, .mx th { border: 1px solid #000; padding: 3pt 6pt; } .mx th { background: #eee; }
.mx td.n { text-align: center; } .opts td { padding: 2pt 18pt 2pt 0; } .gap { width: 60pt; border: 0 !important; }
.q { margin: 8pt 0 2pt; } .hint { margin: 0 0 2pt 18pt; font-style: italic; } .indent { margin: 2pt 0 2pt 18pt; }
.box { border: 1px solid #000; } .tf { width: 40pt; } .score td { border: 1px solid #000; height: 48pt; padding: 4pt; vertical-align: top; }
.pb { page-break-before: always; } .muted { color: #555; font-size: 11pt; }
</style>`;

function doc(title: string, body: string) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(title)}</title>${STYLE}</head><body>${body}</body></html>`;
}

function matrixHtml(m: Matrix): string {
  const t = totals(m);
  const rows = m.rows.filter((r) => MUCS.some((k) => r.counts[k] > 0));
  const cell = (n: number, k: Muc) => (n ? `${n} câu<br/>${fmt(n * m.points[k])} đ` : '');
  return `<table class="mx" width="100%"><tr><th rowspan="2">TT</th><th rowspan="2">Chủ đề / mạch kiến thức</th>${MUCS.map((k) => `<th>${MUC_NAME[k]}</th>`).join('')}<th rowspan="2">Tổng</th></tr>`
    + `<tr>${MUCS.map((k) => `<th class="muted">${fmt(m.points[k])} đ/câu</th>`).join('')}</tr>`
    + rows.map((r, i) => {
      const n = MUCS.reduce((a, k) => a + r.counts[k], 0);
      const sc = MUCS.reduce((a, k) => a + r.counts[k] * m.points[k], 0);
      return `<tr><td class="n">${i + 1}</td><td>${esc(r.unitTitle)}</td>${MUCS.map((k) => `<td class="n">${cell(r.counts[k], k)}</td>`).join('')}<td class="n">${n} câu<br/>${fmt(sc)} đ</td></tr>`;
    }).join('')
    + `<tr><th colspan="2">Tổng</th>${MUCS.map((k) => `<th>${t.byMuc[k]} câu<br/>${fmt(t.byMuc[k] * m.points[k])} đ</th>`).join('')}<th>${t.questions} câu<br/>${fmt(t.score)} đ</th></tr>`
    + `<tr><th colspan="2">Tỉ lệ</th>${MUCS.map((k) => `<th>${t.score ? Math.round((t.byMuc[k] * m.points[k] * 100) / t.score) : 0}%</th>`).join('')}<th>100%</th></tr></table>`;
}

function specHtml(m: Matrix, paper: Paper, lessonTitles: Map<string, string>): string {
  // Bản đặc tả: chủ đề -> bài đã học -> câu số mấy ở mức nào
  const numbers = new Map<string, number[]>();
  paper.slots.forEach((s, i) => { const k = `${s.row}:${s.muc}`; numbers.set(k, [...(numbers.get(k) ?? []), i + 1]); });
  return `<table class="mx" width="100%"><tr><th>Chủ đề</th><th>Nội dung (bài đã học)</th>${MUCS.map((k) => `<th>${MUC_NAME[k]}<br/><span class="muted">câu số</span></th>`).join('')}</tr>`
    + m.rows.map((r, ri) => MUCS.some((k) => r.counts[k] > 0)
      ? `<tr><td>${esc(r.unitTitle)}</td><td>${r.lessonIds.map((id) => esc(lessonTitles.get(id) ?? id)).join('; ')}</td>${MUCS.map((k) => `<td class="n">${(numbers.get(`${ri}:${k}`) ?? []).join(', ')}</td>`).join('')}</tr>`
      : '').join('') + '</table>';
}

function paperHtml(meta: ExamMeta, m: Matrix, paper: Paper): string {
  if (meta.worksheet) return worksheetHtml(meta, paper);
  const head = `<table class="head" width="100%"><tr><td width="45%"><b>${esc(meta.school || 'TRƯỜNG TIỂU HỌC ……………')}</b><br/>Lớp: ${esc(meta.className)}</td>`
    + `<td align="center"><b>${esc(meta.title.toUpperCase())}</b><br/>NĂM HỌC ${esc(meta.yearLabel)}<br/>Môn: ${esc(meta.subjectName)} – Lớp ${meta.grade}<br/><i>Thời gian: ${meta.minutes} phút</i>${paper.code ? `<br/><b>ĐỀ ${esc(paper.code)}</b>` : ''}</td></tr></table>`
    + `<p>Họ và tên: ………………………………………………… Lớp: ……………</p>`
    + `<table class="score" width="100%"><tr><td width="22%"><b>Điểm</b></td><td><b>Nhận xét của giáo viên</b></td></tr></table>`;
  const p1 = paper.slots.map((s, i) => ({ s, i })).filter(({ s }) => partOf(s.q.type) === 1);
  const p2 = paper.slots.map((s, i) => ({ s, i })).filter(({ s }) => partOf(s.q.type) === 2);
  const part = (title: string, list: typeof p1) => (list.length ? `<h2>${title}</h2>` + list.map(({ s, i }) => questionHtml(s.q, i + 1, m.points[s.muc])).join('') : '');
  return head + part(`PHẦN I. TRẮC NGHIỆM`, p1) + part(`PHẦN ${p1.length ? 'II' : 'I'}. TỰ LUẬN`, p2);
}

function worksheetHtml(meta: ExamMeta, paper: Paper): string {
  const head = `<table class="head" width="100%"><tr><td width="40%"><b>${esc(meta.school || 'TRƯỜNG TIỂU HỌC ……………')}</b><br/>Lớp: ${esc(meta.className)}</td>`
    + `<td align="center"><b>${esc(meta.title.toUpperCase())}</b><br/>Môn: ${esc(meta.subjectName)} – Lớp ${meta.grade}${paper.code ? ` · <b>PHIẾU ${esc(paper.code)}</b>` : ''}`
    + `${meta.topic ? `<br/><i>${esc(meta.topic)}</i>` : ''}</td></tr></table>`
    + `<p>Họ và tên: ………………………………………………… Ngày: ……/……/………</p>`;
  return head + paper.slots.map((s, i) => questionHtml(s.q, i + 1, null)).join('')
    + `<p class="muted">Em làm đúng: ……… / ${paper.slots.length} câu.</p>`;
}

function keyHtml(meta: ExamMeta, m: Matrix, paper: Paper): string {
  if (meta.worksheet) {
    return `<h1>ĐÁP ÁN – ${esc(meta.title.toUpperCase())}${paper.code ? ` – PHIẾU ${esc(paper.code)}` : ''}</h1><p align="center">Môn ${esc(meta.subjectName)} lớp ${meta.grade}${meta.topic ? ` · ${esc(meta.topic)}` : ''}</p>`
      + `<table class="grid" width="100%"><tr><th>Câu</th><th>Mức</th><th>Đáp án</th></tr>`
      + paper.slots.map((s, i) => `<tr><td align="center">${i + 1}</td><td align="center">M${s.muc}</td><td>${esc(answerText(s.q))}${s.q.explanation ? `<br/><span class="muted">${esc(s.q.explanation)}</span>` : ''}</td></tr>`).join('')
      + '</table>';
  }
  return `<h1>ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM${paper.code ? ` – ĐỀ ${esc(paper.code)}` : ''}</h1><p align="center">${esc(meta.title)} – Môn ${esc(meta.subjectName)} lớp ${meta.grade}</p>`
    + `<table class="grid" width="100%"><tr><th>Câu</th><th>Mức</th><th>Đáp án</th><th>Điểm</th></tr>`
    + paper.slots.map((s, i) => `<tr><td align="center">${i + 1}</td><td align="center">M${s.muc}</td><td>${esc(answerText(s.q))}${s.q.explanation ? `<br/><span class="muted">${esc(s.q.explanation)}</span>` : ''}</td><td align="center">${fmt(m.points[s.muc])}</td></tr>`).join('')
    + `<tr><th colspan="3" align="right">Tổng</th><th>${fmt(totals(m).score)}</th></tr></table>`
    + `<p class="muted">Câu có nhiều ý: chấm theo từng ý đúng, chia đều số điểm của câu. Điểm toàn bài theo thang 10; làm tròn thành số nguyên theo quy định đánh giá học sinh tiểu học hiện hành và hướng dẫn của nhà trường.</p>`;
}

/** Tạo nội dung file Word: ma trận + đặc tả + đề (A, B…) + đáp án */
export function examDocument(meta: ExamMeta, m: Matrix, papers: Paper[], lessonTitles: Map<string, string>, parts: { matrix: boolean; papers: boolean; keys: boolean }): string {
  const blocks: string[] = [];
  if (parts.matrix) {
    blocks.push(`<h1>MA TRẬN ${esc(meta.title.toUpperCase())}</h1><p align="center">Môn ${esc(meta.subjectName)} – Lớp ${meta.grade} – Năm học ${esc(meta.yearLabel)}</p>` + matrixHtml(m));
    if (papers[0]) blocks.push(`<h2>BẢN ĐẶC TẢ${papers[0].code ? ` (ĐỀ ${esc(papers[0].code)})` : ''}</h2>` + specHtml(m, papers[0], lessonTitles));
  }
  if (parts.papers) for (const p of papers) blocks.push(paperHtml(meta, m, p));
  if (parts.keys) for (const p of papers) blocks.push(keyHtml(meta, m, p));
  return doc(meta.title, blocks.map((b, i) => (i ? `<div class="pb">${b}</div>` : `<div>${b}</div>`)).join(''));
}

export function downloadDoc(filename: string, html: string) {
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = asciiFilename(filename);
  a.download = name.endsWith('.doc') ? name : `${name}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
