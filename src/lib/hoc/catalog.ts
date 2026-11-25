// Thư viện bài học công khai /hoc (SEO): đường dẫn đẹp cho từng môn – lớp và từng bài, dựng sẵn lúc build từ CONTENT.
//   /hoc                       → chọn lớp, môn
//   /hoc/toan-lop-3            → các bài Toán lớp 3, nhóm theo học kỳ, chủ đề
//   /hoc/toan-lop-3/bai-12-…   → kiến thức cần nhớ + vài câu mẫu có lời giải + nút "Làm bài"
// Chỉ đọc nội dung (không sửa câu hỏi). Chỉ dùng ở máy chủ: CONTENT rất lớn, không đưa vào gói trình duyệt.
import 'server-only';
import { CONTENT, type ContentLesson, type ContentQuestion } from '@/lib/content';
import type { SubjectCode } from '@/lib/types';
import { shuffle } from '@/lib/shuffle';

export const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
export const SUBJECT_ORDER: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];

/** "Bài 12. Nhân với số có một chữ số" → "bai-12-nhan-voi-so-co-mot-chu-so" */
export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '') || 'bai';
}

export type HocLesson = { slug: string; lesson: ContentLesson };
export type HocGroup = { key: string; subject: SubjectCode; grade: number; name: string; lessons: HocLesson[] };

const groupKey = (subject: SubjectCode, grade: number) => `${subject}-lop-${grade}`;

function build(): HocGroup[] {
  const map = new Map<string, HocGroup>();
  for (const l of CONTENT) {
    const key = groupKey(l.subject, l.grade);
    let g = map.get(key);
    if (!g) { g = { key, subject: l.subject, grade: l.grade, name: `${SUBJECT_NAME[l.subject]} lớp ${l.grade}`, lessons: [] }; map.set(key, g); }
    // tên bài trùng nhau trong cùng môn – lớp (vd. "Ôn tập") → thêm số thứ tự để đường dẫn không trùng
    const base = slugify(l.title);
    let slug = base;
    for (let n = 2; g.lessons.some((x) => x.slug === slug); n++) slug = `${base}-${n}`;
    g.lessons.push({ slug, lesson: l });
  }
  return [...map.values()].sort((a, b) => a.grade - b.grade || SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject));
}

export const HOC_GROUPS: HocGroup[] = build();
export const hocGroup = (key: string) => HOC_GROUPS.find((g) => g.key === key);
export const hocLesson = (key: string, slug: string) => hocGroup(key)?.lessons.find((x) => x.slug === slug);
export const hocHref = (g: HocGroup, l?: HocLesson) => `/hoc/${g.key}${l ? `/${l.slug}` : ''}`;

/** Đường dẫn công khai của một bài theo mã bài (để trang khác liên kết tới) */
export function hocHrefOf(lessonId: string): string | null {
  for (const g of HOC_GROUPS) { const l = g.lessons.find((x) => x.lesson.id === lessonId); if (l) return hocHref(g, l); }
  return null;
}

/** Nhóm bài theo học kỳ rồi theo chủ đề / unit (đúng trình tự sách); đề ôn tập để riêng */
export function sections(g: HocGroup) {
  const out: { semester: 1 | 2; units: { title: string; items: HocLesson[] }[] }[] = [];
  const reviews: HocLesson[] = [];
  for (const it of g.lessons) {
    if (it.lesson.kind === 'review') { reviews.push(it); continue; }
    let s = out.find((x) => x.semester === it.lesson.semester);
    if (!s) { s = { semester: it.lesson.semester, units: [] }; out.push(s); }
    const last = s.units[s.units.length - 1];
    if (last && last.title === it.lesson.unit.title) last.items.push(it);
    else s.units.push({ title: it.lesson.unit.title, items: [it] });
  }
  out.sort((a, b) => a.semester - b.semester);
  return { semesters: out, reviews };
}

export type Sample = { prompt: string; options: string[]; answer: string; explanation: string; multi: boolean };

/** Câu không đọc được nếu thiếu hình / âm thanh của trang làm bài thì bỏ qua */
const NEEDS_MEDIA = /(hình (bên|dưới|vẽ)|tranh|nghe|bức ảnh|ảnh bên|quan sát hình)/i;

/** Lựa chọn trong dữ liệu thường để đáp án đúng đứng đầu (trang làm bài tự đảo) → đảo cố định theo câu; giữ nguyên Đúng/Sai và > < = */
const mix = (opts: string[], seed: string) => (opts.length > 2 && !opts.every((o) => ['>', '<', '='].includes(o)) ? shuffle(opts, seed) : opts);

function sampleOf(q: ContentQuestion): Sample | null {
  // "{}" = câu điền nhiều ô (chỉ hiện đúng trên trang làm bài)
  if (NEEDS_MEDIA.test(q.prompt) || q.prompt.includes('{}') || q.prompt.length > 400) return null;
  const k = q.key as Record<string, unknown>;
  if ((q.type === 'single_choice' || q.type === 'true_false') && typeof k.correct === 'string') {
    return { prompt: q.prompt, options: q.type === 'true_false' && !q.options.length ? ['Đúng', 'Sai'] : mix(q.options, q.prompt), answer: k.correct, explanation: q.explanation, multi: false };
  }
  if (q.type === 'multiple_choice' && Array.isArray(k.correct)) {
    return { prompt: q.prompt, options: mix(q.options, q.prompt), answer: (k.correct as string[]).join('; '), explanation: q.explanation, multi: true };
  }
  if (q.type === 'fill_blank' && Array.isArray(k.accepted) && typeof k.accepted[0] === 'string') {
    return { prompt: q.prompt, options: [], answer: k.accepted[0], explanation: q.explanation, multi: false };
  }
  return null;
}

/** Tối đa 3 câu mẫu, lấy rải từ dễ đến khó (câu đầu, giữa, cuối của bài).
 *  Câu đọc hiểu dùng chung một bài đọc (đoạn đầu, cách dòng trống) → tách bài đọc ra hiện một lần. */
export function samples(l: ContentLesson, max = 3): { passage: string | null; items: Sample[] } {
  const all = l.questions.map(sampleOf).filter((x): x is Sample => Boolean(x));
  const picked = all.length <= max ? all : [...new Set([0, Math.floor(all.length / 2), all.length - 1])].map((i) => all[i]).slice(0, max);
  const lead = (q: Sample) => { const i = q.prompt.indexOf('\n\n'); return i > 60 ? q.prompt.slice(0, i) : null; };
  const first = picked[0] ? lead(picked[0]) : null;
  if (first && picked.length > 1 && picked.every((q) => lead(q) === first)) {
    return { passage: first, items: picked.map((q) => ({ ...q, prompt: q.prompt.slice(first.length).trim() })) };
  }
  return { passage: null, items: picked };
}

/** "{}" trong kiến thức / ví dụ là ô trống cần điền → hiện thành □ */
export const blank = (s: string) => s.replace(/\{\}/g, '□');

/** Chữ cái của đáp án đúng ("B. 132") khi câu có lựa chọn */
export function answerLabel(q: Sample): string {
  if (!q.options.length) return q.answer;
  const L = 'ABCDEFGH';
  const parts = q.multi ? q.answer.split('; ') : [q.answer];
  return parts.map((a) => { const i = q.options.indexOf(a); return i >= 0 ? `${L[i]}. ${a}` : a; }).join('; ');
}

/** Đường dẫn làm bài (giống lessonHref ở trang học sinh) */
export const practiceHref = (l: ContentLesson) => `/lam-bai?lessonId=${encodeURIComponent(l.id)}&subject=${l.subject}&grade=${l.grade}`;
