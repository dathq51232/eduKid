-- Kiểm thử 0024: hình kho giáo án trong Storage chỉ trường mình đọc/ghi; nạp giáo án theo từng phần (p_append).
-- Chạy sau 105. Trên Postgres cục bộ (không có Supabase Storage) tạo giả lập tối giản schema storage trước khi chạy 0024.
\set ON_ERROR_STOP 0
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid default auth.uid());
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
\i ../../migrations/0024_plan_library_images.sql
\echo == GV A ghi hinh vao thu muc truong minh (mong doi: 1 dong), vao truong khac (mong doi: row-level security)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
insert into storage.objects(bucket_id, name) values ('plan-library', '00000000-0000-0000-0000-0000000021a1/' || repeat('a', 40) || '.jpg') returning name; commit;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
insert into storage.objects(bucket_id, name) values ('plan-library', '00000000-0000-0000-0000-0000000023a2/' || repeat('b', 40) || '.jpg'); rollback;
\echo == GV B cung truong doc duoc (1), GV truong khac khong thay (0)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f2';
select count(*) as gv_b from storage.objects where bucket_id = 'plan-library'; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000023f3';
select count(*) as truong_khac from storage.objects where bucket_id = 'plan-library'; rollback;
\echo == Nap theo phan: lan dau 2, them 1 (append), tong 3; nap lai khong append thi con 1
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_import('A.docx', '[{"subject":"toan","grade":1,"title":"Bài 1","plan":{"v":1}},{"subject":"toan","grade":1,"title":"Bài 2","plan":{"v":1}}]'::jsonb, false) as phan1;
select public.library_import('A.docx', '[{"subject":"toan","grade":1,"title":"Bài 3","plan":{"v":1,"orig":{"html":"<p>x</p>"}}}]'::jsonb, true) as phan2;
select count(*) as tong from public.library_list(null) where source = 'A.docx';
select public.library_import('A.docx', '[{"subject":"toan","grade":1,"title":"Bài 1","plan":{"v":1}}]'::jsonb) as nap_lai;
select count(*) as con_lai from public.library_list(null) where source = 'A.docx';
select public.library_delete('A.docx') as don_dep; commit;
\echo == Giao an lon (~600 KB HTML) luu duoc (mong doi: 1)
begin; set local role authenticated; set local request.jwt.claim.sub='00000000-0000-0000-0000-0000000021f1';
select public.library_import('B.docx', jsonb_build_array(jsonb_build_object('subject','toan','grade',1,'title','Lớn','plan', jsonb_build_object('v',1,'orig', jsonb_build_object('html', repeat('<p style="margin:0">Hoạt động của giáo viên</p>', 13000)))))) as lon;
select public.library_delete('B.docx') as don_dep; rollback;
delete from storage.objects where bucket_id = 'plan-library';
