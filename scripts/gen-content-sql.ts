// Sinh SQL nạp bộ bài tập soạn sẵn (src/lib/content) vào Supabase.
// Chạy: npx tsx scripts/gen-content-sql.ts > supabase/seed/content_grade1_hk1.sql            (lớp 1, như trước)
//       npx tsx scripts/gen-content-sql.ts 3 1 > supabase/seed/content_grade3_hk1.sql       (lớp 3, học kì 1)
// Bài được tạo ở trạng thái "Chờ duyệt" (review), người tạo = tài khoản system_admin đầu tiên.
// Admin mở /quan-tri/bai-hoc để xem lại rồi bấm Xuất bản. Chạy lại file nhiều lần không tạo trùng.
import { CONTENT } from '../src/lib/content';
import { defaultTimeLimit } from '../src/lib/levels';
import { shuffle } from '../src/lib/shuffle';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const GRADE = Number(process.argv[2] ?? 1);
const SEMESTER = process.argv[3] ? Number(process.argv[3]) : undefined; // tuỳ chọn: chỉ một học kì (file nhỏ hơn, dễ dán vào SQL Editor)

const out: string[] = GRADE === 1 ? [
  '-- SINH TỰ ĐỘNG từ src/lib/content — không sửa tay. Sửa nội dung trong file nguồn rồi sinh lại.',
  '-- Nạp bài tập Lớp 1: Học kì 1 (Toán, Tiếng Việt: Kết nối tri thức; Tiếng Anh: Global Success) và Toán Học kì 2 (Bài 21–41)',
  '-- và 12 đề ôn tập theo cấp độ L1–L5 (ngân hàng câu hỏi EduChain Kids, src/lib/content/ngan-hang-lop1.ts).',
  '-- Yêu cầu: đã chạy migration 0001 → 0006 và đã có ít nhất 1 tài khoản system_admin.',
  '-- Bài đã nạp từ lần trước (cùng seed_id) được bỏ qua, chỉ thêm bài mới.',
  '',
] : [
  '-- SINH TỰ ĐỘNG từ src/lib/content — không sửa tay. Sửa nội dung trong file nguồn rồi sinh lại.',
  `-- Nạp bài tập Lớp ${GRADE}${SEMESTER ? `, Học kì ${SEMESTER}` : ''} (Toán, Tiếng Việt: Kết nối tri thức; Tiếng Anh: Global Success) — câu soạn sẵn của từng bài.`,
  `-- Yêu cầu: đã chạy migration 0001 → 0008, đã có ít nhất 1 tài khoản system_admin và ĐÃ NẠP supabase/seed/curriculum_grade${GRADE}.sql.`,
  '-- Bài đã nạp từ lần trước (cùng seed_id) được bỏ qua, chỉ thêm bài mới.',
  '',
];

const subjectCode = (s: string) => `${s}-${GRADE}`;

// Lớp 1 giữ nguyên nội dung file như trước; lớp 2–5 sinh theo tham số (môn 'toan-N'… đã có sẵn từ migration 0002).
CONTENT.filter((l) => l.grade === GRADE).map((lesson, li) => [lesson, li] as const).filter(([l]) => !SEMESTER || l.semester === SEMESTER).forEach(([lesson, li]) => {
  const outcomes = [...new Set(lesson.questions.map((x) => x.outcome))];
  out.push(`-- ${lesson.ref} · ${lesson.title} (${lesson.questions.length} câu)`);
  out.push('do $$');
  out.push('declare v_admin uuid; v_lesson uuid; v_q uuid;');
  out.push('begin');
  out.push("  select user_id into v_admin from public.user_roles where role = 'system_admin' order by created_at limit 1;");
  out.push("  if v_admin is null then raise exception 'Cần có ít nhất 1 tài khoản system_admin trước khi nạp bài tập'; end if;");
  out.push(`  if exists (select 1 from public.lessons where content ->> 'seed_id' = ${q(lesson.id)}) then return; end if;`);
  out.push('  insert into public.lessons (subject_id, title, content, status, created_by, book_series, semester, sort_order, topic_id)');
  out.push(
    `  select s.id, ${q(lesson.title)}, ${j({ seed_id: lesson.id, kind: lesson.kind ?? 'book', book: lesson.book, ref: lesson.ref, unit_code: lesson.unit.code, unit_title: lesson.unit.title, description: lesson.description })}, 'review', v_admin, ${q(lesson.book)}, ${lesson.semester}, ${li + 1},` +
      ` (select id from public.curriculum_topics where code = ${q(lesson.topicCode)})`,
  );
  out.push(`  from public.subjects s where s.code = ${q(subjectCode(lesson.subject))} returning id into v_lesson;`);
  out.push(`  insert into public.lesson_outcomes (lesson_id, outcome_id) select v_lesson, id from public.learning_outcomes where code in (${outcomes.map(q).join(', ')});`);

  lesson.questions.forEach((x, qi) => {
    const qid = `${lesson.id}-q${qi + 1}`;
    let options: string[] = x.options;
    let prompt: Record<string, unknown> = { text: x.prompt };
    if (x.type === 'ordering') options = shuffle(x.options, qid); // không lộ thứ tự đúng
    if (x.type === 'matching') {
      options = shuffle(x.options, `${qid}-r`);
      prompt = { text: x.prompt, left: shuffle(x.left ?? [], `${qid}-l`) };
    }
    if (x.type === 'true_false' || x.type === 'fill_blank') options = [];
    out.push(
      '  insert into public.questions (lesson_id, question_type, prompt, options, skill_code, difficulty, time_limit_sec, sort_order, status, form_id, outcome_id)' +
        ` values (v_lesson, ${q(x.type)}, ${j(prompt)}, ${j(options)}, ${x.skill ? q(x.skill) : 'null'}, ${x.level}, ${x.timeLimit ?? defaultTimeLimit(x.type, x.level, x.prompt)}, ${qi + 1}, 'draft',` +
        ` (select id from public.exercise_forms where code = ${q(x.form)}), (select id from public.learning_outcomes where code = ${q(x.outcome)})) returning id into v_q;`,
    );
    out.push(
      `  insert into public.question_keys (question_id, answer_key, explanation, solution) values (v_q, ${j(x.key)}, ${j({ text: x.explanation })}, ${j(x.solution ? { text: x.solution } : {})});`,
    );
  });
  out.push("  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_admin, 'seed_lesson', 'lesson', v_lesson::text, " + q(lesson.id) + ');');
  out.push('end $$;');
  out.push('');
});

out.push('-- Kiểm tra sau khi nạp: mọi đáp án phải đúng định dạng (kết quả mong đợi: 0)');
out.push("select count(*) as dap_an_sai_dinh_dang from public.questions qq join public.question_keys k on k.question_id = qq.id join public.lessons l on l.id = qq.lesson_id where l.content ? 'seed_id' and not public.answer_key_is_valid(qq.question_type, k.answer_key);");
console.log(out.join('\n'));
