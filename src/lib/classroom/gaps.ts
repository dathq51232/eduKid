// "Lớp đang hổng chỗ nào": gom đúng/sai TỪNG CÂU trong các bài các em đã làm trên app (lesson_results.answers)
// theo bài + dạng bài, tìm dạng nhiều em sai nhất và những em cần kèm. Chỉ chạy ở máy chủ (cần ngân hàng câu hỏi).
import { CONTENT } from '../content';
import { findOutcomeAny, formsOf } from '../curriculum';
import { questionById } from '../practice';
import type { SubjectCode } from '../types';

export type ResultRow = {
  student_id: string; lesson_code: string; lesson_title: string | null; subject_code: string | null;
  score: number; total: number; answers: { q: string; ok: boolean }[] | null; created_at: string;
};
type Meta = { form: string; outcome: string };

const metaCache = new Map<string, Meta | null>();
/** Dạng bài + mục tiêu của một câu theo mã câu (câu sinh tự động: sinh lại từ mã; câu soạn sẵn: tra theo số thứ tự) */
export function questionMeta(qid: string): Meta | null {
  if (metaCache.has(qid)) return metaCache.get(qid)!;
  let meta: Meta | null = null;
  if (qid.startsWith('lt-')) {
    const g = questionById(qid);
    if (g) meta = { form: g.form, outcome: g.outcome };
  } else {
    const m = /^(.+)-q(\d+)$/.exec(qid);
    const q = m ? CONTENT.find((l) => l.id === m[1])?.questions[Number(m[2]) - 1] : undefined;
    if (q) meta = { form: q.form, outcome: q.outcome };
  }
  if (metaCache.size > 50_000) metaCache.clear();
  metaCache.set(qid, meta);
  return meta;
}

export type StudentRef = { id: string; name: string };
export type Gap = {
  key: string; lessonCode: string; lessonTitle: string; subject: SubjectCode; formName: string; outcome: string;
  n: number; ok: number; rate: number; studentCount: number; weak: { id: string; name: string; n: number; ok: number }[];
};
export type StudentStat = { id: string; name: string; n: number; ok: number; rate: number | null; lessons: number; lastAt: string | null };
export type SubjectStat = { subject: SubjectCode; n: number; ok: number; rate: number; students: number };

const SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];
const asSubject = (s: string | null | undefined): SubjectCode | null => (SUBJECTS.includes(s as SubjectCode) ? (s as SubjectCode) : null);

export function computeGaps(rows: ResultRow[], students: StudentRef[], opts: { minAnswers?: number; maxGaps?: number } = {}) {
  const minAnswers = opts.minAnswers ?? 6;
  const names = new Map(students.map((s) => [s.id, s.name]));
  const lessonInfo = new Map(CONTENT.map((l) => [l.id, l]));
  type Acc = { lessonCode: string; subject: SubjectCode; form: string; outcome: string; title: string; n: number; ok: number; per: Map<string, { n: number; ok: number }> };
  const skills = new Map<string, Acc>();
  const perStudent = new Map<string, { n: number; ok: number; lessons: Set<string>; lastAt: string | null }>();
  const perSubject = new Map<SubjectCode, { n: number; ok: number; students: Set<string> }>();

  for (const r of rows) {
    if (!names.has(r.student_id)) continue;
    const lesson = lessonInfo.get(r.lesson_code);
    const subject = asSubject(r.subject_code) ?? lesson?.subject ?? null;
    const st = perStudent.get(r.student_id) ?? { n: 0, ok: 0, lessons: new Set<string>(), lastAt: null };
    st.lessons.add(r.lesson_code);
    if (!st.lastAt || r.created_at > st.lastAt) st.lastAt = r.created_at;
    perStudent.set(r.student_id, st);
    for (const a of r.answers ?? []) {
      if (!a || typeof a.q !== 'string') continue;
      st.n++; if (a.ok) st.ok++;
      if (subject) {
        const sj = perSubject.get(subject) ?? { n: 0, ok: 0, students: new Set<string>() };
        sj.n++; if (a.ok) sj.ok++; sj.students.add(r.student_id);
        perSubject.set(subject, sj);
      }
      const meta = questionMeta(a.q);
      if (!meta || !subject) continue;
      const key = `${r.lesson_code}|${meta.form}`;
      const acc = skills.get(key) ?? { lessonCode: r.lesson_code, subject, form: meta.form, outcome: meta.outcome, title: lesson?.title ?? r.lesson_title ?? r.lesson_code, n: 0, ok: 0, per: new Map() };
      acc.n++; if (a.ok) acc.ok++;
      const p = acc.per.get(r.student_id) ?? { n: 0, ok: 0 };
      p.n++; if (a.ok) p.ok++;
      acc.per.set(r.student_id, p);
      skills.set(key, acc);
    }
  }

  const formName = (subject: SubjectCode, code: string) => formsOf(subject).find((f) => f.code === code)?.name ?? code;
  const gaps: Gap[] = [...skills.entries()]
    .map(([key, s]) => ({
      key, lessonCode: s.lessonCode, lessonTitle: s.title, subject: s.subject, formName: formName(s.subject, s.form),
      outcome: findOutcomeAny(s.subject, s.outcome)?.outcome.text ?? '',
      n: s.n, ok: s.ok, rate: s.ok / s.n, studentCount: s.per.size,
      weak: [...s.per.entries()].filter(([, p]) => p.n >= 2 && p.ok / p.n < 0.6)
        .map(([id, p]) => ({ id, name: names.get(id) ?? '', n: p.n, ok: p.ok }))
        .sort((a, b) => a.ok / a.n - b.ok / b.n || a.name.localeCompare(b.name, 'vi')),
    }))
    .filter((g) => g.n >= minAnswers && g.studentCount >= 2 && g.rate < 0.8)
    .sort((a, b) => a.rate - b.rate || b.n - a.n)
    .slice(0, opts.maxGaps ?? 12);

  const studentStats: StudentStat[] = students.map((s) => {
    const p = perStudent.get(s.id);
    return { id: s.id, name: s.name, n: p?.n ?? 0, ok: p?.ok ?? 0, rate: p && p.n ? p.ok / p.n : null, lessons: p?.lessons.size ?? 0, lastAt: p?.lastAt ?? null };
  });
  const subjects: SubjectStat[] = SUBJECTS.filter((s) => perSubject.has(s)).map((s) => {
    const v = perSubject.get(s)!;
    return { subject: s, n: v.n, ok: v.ok, rate: v.ok / v.n, students: v.students.size };
  });
  return { gaps, students: studentStats, subjects, answers: studentStats.reduce((a, s) => a + s.n, 0) };
}
