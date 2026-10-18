-- Kiểm thử 0010: mã lớp của mọi giáo viên không trùng nhau, luôn có, không sửa được.
-- Chạy sau 00_supabase_shim.sql + migration 0001 → 0010 trên PostgreSQL cục bộ (dữ liệu demo).
\set ON_ERROR_STOP 0
insert into auth.users(id,email) select ('00000000-0000-0000-0000-000000007'||lpad(i::text,3,'0'))::uuid, 'gv'||i||'@demo.local' from generate_series(1,800) i;
insert into public.profiles(id) select u.id from auth.users u where u.email like 'gv%@demo.local' and not exists (select 1 from public.profiles p where p.id=u.id);
insert into public.schools(id,name) values ('00000000-0000-0000-0000-0000000007a1','Trường Demo A'),('00000000-0000-0000-0000-0000000007a2','Trường Demo B');
insert into public.user_roles(user_id, role, school_id)
select ('00000000-0000-0000-0000-000000007'||lpad(i::text,3,'0'))::uuid, 'teacher',
       case when i % 2 = 0 then '00000000-0000-0000-0000-0000000007a1'::uuid else '00000000-0000-0000-0000-0000000007a2'::uuid end
from generate_series(1,800) i;

\echo == 800 giao vien, moi nguoi tao 1 lop qua teacher_create_class (800 lop; tu 0016 moi giao vien chi 1 lop)
do $$ declare i int; k int; begin
  for i in 1..800 loop
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000007'||lpad(i::text,3,'0'), true);
    k := 1;
    perform public.teacher_create_class('Lớp '||i||'-'||k, ((i % 5) + 1)::smallint);
  end loop;
end $$;
select count(*) as so_lop, count(distinct join_code) as so_ma_khac_nhau, count(*) filter (where join_code is null) as thieu_ma,
       count(*) filter (where join_code !~ '^[A-HJ-NP-Z]{3}-[0-9]{3}$') as sai_dinh_dang
from public.classes;

\echo == Quan tri chen lop truc tiep, tu dat ma trung lop khac (mong doi: he thong tu cap ma moi, khong trung)
insert into public.classes(school_id,name,grade,created_by,join_code)
select '00000000-0000-0000-0000-0000000007a1','Lớp chèn tay',3,'00000000-0000-0000-0000-000000007002', (select join_code from public.classes order by created_at limit 1);
select (select join_code from public.classes where name='Lớp chèn tay') <> (select join_code from public.classes order by created_at limit 1) as khong_trung;

\echo == Doi ma lop sang ma cua lop khac (mong doi: ma giu nguyen)
update public.classes set join_code = (select join_code from public.classes where name='Lớp 1-1') where name='Lớp 2-1';
select count(distinct join_code) = count(*) as van_khong_trung from public.classes;

\echo == Xoa ma lop (mong doi: ma giu nguyen, khong null)
update public.classes set join_code = null where name='Lớp 3-1';
select join_code is not null as van_co_ma from public.classes where name='Lớp 3-1';

\echo == Chen ma trung thang vao chi muc (mong doi: duplicate key / bi trigger thay)
alter table public.classes disable trigger classes_guard_join_code;
insert into public.classes(school_id,name,grade,created_by,join_code)
select '00000000-0000-0000-0000-0000000007a1','Lớp trùng',3,'00000000-0000-0000-0000-000000007002', (select join_code from public.classes where name='Lớp 1-1');
alter table public.classes enable trigger classes_guard_join_code;
