-- Kiểm thử 0044: ngân hàng câu hỏi riêng của giáo viên. Chạy sau 112 (dùng giáo viên, học sinh của 112).
\set ON_ERROR_STOP 0
\echo == Giáo viên lưu câu (mong doi: 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_questions (subject, grade, lesson_id, lesson_title, muc, type, prompt, options, answer, source)
values ('toan', 3, 'toan3-kntt-b01', 'Ôn tập', 1, 'single_choice', '6 x 7 = ?', array['36','42','48','54'], '{"correct":"42"}', 'de.docx');
select count(*) as so_cau from public.teacher_questions; commit;
\echo == Học sinh lưu / sai môn / sai dạng (mong doi: loi x3)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
insert into public.teacher_questions (subject, grade, muc, type, prompt) values ('toan', 3, 1, 'fill_blank', 'x'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_questions (subject, grade, muc, type, prompt) values ('hoa-hoc', 3, 1, 'fill_blank', 'x'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
insert into public.teacher_questions (subject, grade, muc, type, prompt) values ('toan', 3, 1, 'matching', 'x'); rollback;
\echo == Giáo viên khác không thấy, không xoá được (mong doi: 0 | DELETE 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select count(*) as gv_khac from public.teacher_questions; delete from public.teacher_questions; commit;
\echo == Chủ xoá (mong doi: DELETE 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
delete from public.teacher_questions where prompt = '6 x 7 = ?'; commit;
