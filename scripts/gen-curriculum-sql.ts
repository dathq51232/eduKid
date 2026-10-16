// Sinh phần SQL nạp danh mục chương trình (chủ đề, YCCĐ, dạng bài) của một lớp từ src/lib/curriculum/gradeN.ts.
// Chạy: npx tsx scripts/gen-curriculum-sql.ts [lớp] > supabase/seed/curriculum_gradeN.sql   (mặc định lớp 1)
import { FORMS } from '../src/lib/curriculum/grade1';
import { formsOf, TOPICS_BY_GRADE } from '../src/lib/curriculum';
import type { SubjectCode } from '../src/lib/types';

const GRADE = Number(process.argv[2] ?? 1);
const TOPICS = TOPICS_BY_GRADE[GRADE];
if (!TOPICS) throw new Error(`Chưa có danh mục lớp ${GRADE}`);

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const lines: string[] = [];
lines.push(`-- SINH TỰ ĐỘNG từ src/lib/curriculum/grade${GRADE}.ts — không sửa tay, hãy sửa file nguồn rồi sinh lại.`);
lines.push('-- Chạy lại nhiều lần không sao: dòng đã có (trùng code) được giữ nguyên.');

for (const [subject, topics] of Object.entries(TOPICS)) {
  topics.forEach((t, ti) => {
    lines.push(
      `insert into public.curriculum_topics (subject_id, code, title, description, sort_order, is_core)\n` +
        `select id, ${q(t.code)}, ${q(t.title)}, ${q(t.description)}, ${ti + 1}, ${t.isCore === false ? 'false' : 'true'} from public.subjects where code = ${q(subject + '-' + GRADE)}\n` +
        `on conflict (code) do nothing;`,
    );
    t.outcomes.forEach((o, oi) => {
      lines.push(
        `insert into public.learning_outcomes (topic_id, code, description, stage, sort_order, is_core)\n` +
          `select id, ${q(o.code)}, ${q(o.text)}, ${o.stage}, ${oi + 1}, ${o.isCore === false || t.isCore === false ? 'false' : 'true'} from public.curriculum_topics where code = ${q(t.code)}\n` +
          `on conflict (code) do nothing;`,
      );
    });
  });
}

// Lớp 1: dạng bài của lớp 1 (giữ nguyên như trước). Lớp 2–5: mọi dạng bài đến lớp đó (câu lớp trên dùng lại dạng bài lớp dưới).
const FORMS_OUT = GRADE === 1 ? FORMS : Object.fromEntries((Object.keys(FORMS) as SubjectCode[]).map((s) => [s, formsOf(s)]));
for (const [family, forms] of Object.entries(FORMS_OUT)) {
  forms.forEach((f, i) => {
    lines.push(
      `insert into public.exercise_forms (subject_family, code, name, description, default_question_type, sort_order)\n` +
        `values (${q(family)}, ${q(f.code)}, ${q(f.name)}, ${q(f.description)}, ${q(f.type)}, ${i + 1})\n` +
        `on conflict (code) do nothing;`,
    );
  });
}
console.log(lines.join('\n'));
