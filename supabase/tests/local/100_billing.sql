-- Kiểm thử 0018: thu phí học sinh, giáo viên miễn phí. Dữ liệu demo.
\set ON_ERROR_STOP 0
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000018a1','Trường Demo TP');
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000018f1','gvTP@demo.local'),('00000000-0000-0000-0000-0000000018f2','gvKhacTP@demo.local'),('00000000-0000-0000-0000-0000000018ad','adminTP@demo.local');
insert into public.user_roles(user_id, role, school_id) values
  ('00000000-0000-0000-0000-0000000018f1','teacher','00000000-0000-0000-0000-0000000018a1'),
  ('00000000-0000-0000-0000-0000000018f2','teacher','00000000-0000-0000-0000-0000000018a1');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000018ad','system_admin');
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f1';
select public.teacher_create_class('2B', 2::smallint) as c \gset
select count(*) as them from public.teacher_add_students(:'c', array['Demo Một','Demo Hai'], 'v1', true);
commit;
select student_id as s1 from public.class_memberships cm join public.students s on s.id=cm.student_id where cm.class_id=:'c' and s.display_name='Demo Một' \gset
select student_id as s2 from public.class_memberships cm join public.students s on s.id=cm.student_id where cm.class_id=:'c' and s.display_name='Demo Hai' \gset
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000018e1','hsTP1@demo.local'),('00000000-0000-0000-0000-0000000018e2','hsTP2@demo.local');
update public.students set user_id='00000000-0000-0000-0000-0000000018e1' where id=:'s1';
update public.students set user_id='00000000-0000-0000-0000-0000000018e2' where id=:'s2';

\echo == Chua bat thu phi: hoc sinh hoc binh thuong (free), giao vien khong phai hoc sinh
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select is_student, grade, active, reason from public.my_learning_gate(); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f1';
select is_student, active, reason from public.my_learning_gate(); commit;
\echo == Chua co tai khoan nhan tien: hoc sinh tao yeu cau / admin bat thu phi (mong doi: billing_not_ready x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select * from public.student_request_payment('month'); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_save_billing_settings(true, 300000, 2700000, 7::smallint, null, null, null, null, null); rollback;
\echo == Giao vien / hoc sinh doi cai dat (mong doi: not_allowed x2)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f1';
select public.admin_save_billing_settings(false, 1000, 1000, 0::smallint, '970436', 'VCB', '0123456789', 'X', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select public.admin_save_billing_settings(false, 1000, 1000, 0::smallint, '970436', 'VCB', '0123456789', 'X', null); rollback;
\echo == Admin bat thu phi (gia 300.000 / 2.700.000, hoc thu 7 ngay)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_save_billing_settings(true, 300000, 2700000, 7::smallint, '970436', 'Vietcombank', '0123456789', 'Cong ty Demo', 'Ghi chú demo');
select enabled, enabled_at is not null as co_moc, account_name from public.admin_billing_settings(); commit;
\echo == Hoc sinh moi: dang hoc thu (trial), con han ~7 ngay
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select active, reason, round(extract(epoch from until - now()) / 86400) as con_ngay from public.my_learning_gate();
select enabled, price_month, price_year, account_no, to_char(year_end at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY') as het_nam_hoc from public.billing_public(); commit;
\echo == Qua 10 ngay (tai khoan tao truoc, bat thu phi truoc): het han -> khoa
update public.students set created_at = now() - interval '20 days' where id in (:'s1', :'s2');
update public.billing_settings set enabled_at = now() - interval '10 days';
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select active, reason from public.my_learning_gate(); commit;
\echo == Yeu cau dong phi thang: ma EDK + 6 ky tu; yeu cau lai -> cung ma; goi nam -> ma khac
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select id as p1, code as code1 from public.student_request_payment('month') \gset
select code ~ '^EDK[A-HJ-NP-Z2-9]{6}$' as dung_khuon, amount from public.student_request_payment('month');
select (select code from public.student_request_payment('month')) = :'code1' as dung_lai_ma;
select id as p2, code as code2 from public.student_request_payment('year') \gset
select :'code2' <> :'code1' as ma_khac, count(*) as so_yeu_cau from public.student_my_payments(); commit;
\echo == Hoc sinh doc thang bang / tu xac nhan / goi sai (mong doi: permission denied, not_allowed, invalid_plan)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select count(*) from public.payment_requests; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select public.admin_confirm_payment(:'p1', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select * from public.student_request_payment('week'); rollback;
\echo == Admin tim theo ma, xac nhan goi thang -> paid ~1 thang; xac nhan lai -> not_pending
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select code = :'code1' as tim_thay, student_name, class_name, school_name from public.admin_list_payments('pending', :'code1');
select round(extract(epoch from public.admin_confirm_payment(:'p1', 'Đã nhận VCB') - now()) / 86400) as so_ngay_gia_han; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_confirm_payment(:'p1', null); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e1';
select active, reason, round(extract(epoch from until - now()) / 86400) as con_ngay from public.my_learning_gate(); commit;
\echo == Xac nhan goi nam hoc (noi tiep): het han 31/05 nam hoc
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select to_char(public.admin_confirm_payment(:'p2', null) at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI') as het_han;
select pending, month_amount, month_count, paid_students from public.admin_billing_summary(); commit;
\echo == Giao vien xem tinh trang lop (em 1 paid, em 2 expired); giao vien khac (not_allowed)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f1';
select s.display_name, b.active, b.reason from public.teacher_class_billing(:'c') b join public.students s on s.id = b.student_id order by s.display_name; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f2';
select * from public.teacher_class_billing(:'c'); rollback;
\echo == Giao vien luon duoc dung (khong phai hoc sinh)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018f1';
select is_student, active, reason from public.my_learning_gate(); commit;
\echo == Em 2 tao yeu cau, admin huy; huy lai (mong doi: not_pending)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e2';
select id as p3 from public.student_request_payment('month') \gset
commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_cancel_payment(:'p3');
select status from public.admin_list_payments(null, 'Demo Hai'); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_cancel_payment(:'p3'); rollback;
\echo == Tat thu phi: moi em hoc lai binh thuong (free)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018ad';
select public.admin_save_billing_settings(false, 300000, 2700000, 7::smallint, '970436', 'Vietcombank', '0123456789', 'Cong ty Demo', null); commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000018e2';
select active, reason from public.my_learning_gate(); commit;
