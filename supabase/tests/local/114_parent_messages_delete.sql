-- Kiểm thử 0041: giáo viên xoá tin nhắn phụ huynh khỏi hộp thư lớp; gia đình vẫn thấy tin đã gửi. Chạy sau 112 (dùng lớp, em của 112).
\set ON_ERROR_STOP 0
select c.id as c from public.classes c join public.class_teachers ct on ct.class_id = c.id where ct.teacher_id = '00000000-0000-0000-0000-0000000039f1' limit 1 \gset
\echo == Phụ huynh em An gửi 2 tin (mong doi: 2 id)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.parent_message_send('question', 'Nguyễn Thị Lan', 'Mẹ', 'Cô ơi mai con mang gì ạ?') as m1 \gset
select public.parent_message_send('other', 'Nguyễn Thị Lan', 'Mẹ', 'Cảm ơn cô ạ') as m2 \gset
commit;
\echo == Cô xem hộp thư rồi xoá tin 1 (mong doi: truoc >= 2 | xoa 1 | sau ít hơn 1 tin, không còn m1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select jsonb_array_length(public.teacher_messages(:'c', 200)->'items') as truoc \gset
select public.teacher_message_delete(:'c', array[:'m1']::uuid[]) as xoa;
select jsonb_array_length(public.teacher_messages(:'c', 200)->'items') = :truoc - 1 as bot_1_tin,
       not exists (select 1 from jsonb_array_elements(public.teacher_messages(:'c', 200)->'items') i where i->>'id' = :'m1') as khong_con_m1;
commit;
\echo == Xoá lại lần nữa / id lạ (mong doi: 0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f1';
select public.teacher_message_delete(:'c', array[:'m1', '00000000-0000-0000-0000-000000000000']::uuid[]) as xoa_lai; commit;
\echo == Gia đình vẫn thấy cả 2 tin đã gửi (mong doi: t t)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select exists (select 1 from jsonb_array_elements(public.parent_messages_mine(50)) i where i->>'id' = :'m1') as van_thay_m1,
       exists (select 1 from jsonb_array_elements(public.parent_messages_mine(50)) i where i->>'id' = :'m2') as van_thay_m2; commit;
\echo == Giáo viên khác / học sinh không xoá được (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039f2';
select public.teacher_message_delete(:'c', array[:'m2']::uuid[]); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000039a1';
select public.teacher_message_delete(:'c', array[:'m2']::uuid[]); rollback;
