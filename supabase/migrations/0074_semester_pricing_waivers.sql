-- EduChain Kids 0074: GIÁ THEO HỌC KỲ + PHÍ CỘNG TÁC CỦA CÔ + ĐẶC CÁCH HỌC SINH KHÓ KHĂN.
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn. Cần đã chạy 0018 (học phí), 0047 (lớp gia đình), 0049 (thông báo quản trị).
--  * Hai bảng giá, tính THEO TỪNG EM:
--      - Gói lớp học (em ở lớp của cô, vào bằng mã lớp): 129.000đ / học kỳ, 219.000đ / năm học.
--      - Gói gia đình (phụ huynh tự đăng ký, học tại nhà): 599.000đ / học kỳ, năm học = 2 học kỳ giảm 10% = 1.078.200đ.
--    Quản trị đổi được giá ở trang Thu phí. Gói tháng cũ (0018) vẫn đọc được trong lịch sử, không tạo mới nữa.
--  * Học kỳ: HK1 đến hết 15/1, HK2 đến hết 31/5. Mua từ 16/12 (cuối HK1) thì được học luôn hết HK2;
--    mua từ tháng 5 thì tính cho HK1 năm học sau. Gia hạn nối tiếp ngày hết hạn cũ nếu còn hạn.
--  * Phí cộng tác của cô: khoản đóng gói lớp học lưu lại lớp + cô của lớp lúc tạo mã; khi quản trị xác nhận,
--    ghi số tiền cộng tác = số tiền × tỉ lệ (mặc định 30%). Gói gia đình không có phí cộng tác. (Trang chi trả: giai đoạn sau.)
--  * Đặc cách: cô gửi yêu cầu cho em khó khăn (có lý do), quản trị duyệt → em được học hết học kỳ hiện tại, không tính
--    phí cộng tác. Mỗi lớp tối đa N% sĩ số (mặc định 15%, ít nhất 1 suất) gồm cả yêu cầu đang chờ và suất còn hạn.
--    Em được đặc cách hiện y như đã đóng (không ai trong lớp biết).

-- ---------------------------------------------------------------------------------------------- Cột mới
alter table public.billing_settings add column if not exists price_school_term integer not null default 129000;
alter table public.billing_settings add column if not exists price_school_year integer not null default 219000;
alter table public.billing_settings add column if not exists price_family_term integer not null default 599000;
alter table public.billing_settings add column if not exists price_family_year integer not null default 1078200;
alter table public.billing_settings add column if not exists commission_pct smallint not null default 30;
alter table public.billing_settings add column if not exists waiver_pct smallint not null default 15;
do $$ begin
  alter table public.billing_settings add constraint billing_settings_prices_check check (
    price_school_term between 1000 and 100000000 and price_school_year between 1000 and 1000000000
    and price_family_term between 1000 and 100000000 and price_family_year between 1000 and 1000000000
    and commission_pct between 0 and 90 and waiver_pct between 0 and 50);
exception when duplicate_object then null; end $$;

alter table public.payment_requests drop constraint if exists payment_requests_plan_check;
alter table public.payment_requests add constraint payment_requests_plan_check check (plan in ('month', 'term', 'year'));
alter table public.payment_requests add column if not exists kind text not null default 'school';
do $$ begin
  alter table public.payment_requests add constraint payment_requests_kind_check check (kind in ('school', 'family'));
exception when duplicate_object then null; end $$;
alter table public.payment_requests add column if not exists class_id uuid references public.classes(id) on delete set null;
alter table public.payment_requests add column if not exists teacher_id uuid references public.profiles(id) on delete set null;
alter table public.payment_requests add column if not exists commission integer not null default 0;
create index if not exists payment_requests_teacher_idx on public.payment_requests (teacher_id, confirmed_at desc) where teacher_id is not null;

create table if not exists public.fee_waivers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 300),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  period_to timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 300)
);
create unique index if not exists fee_waivers_one_pending on public.fee_waivers (student_id) where status = 'pending';
create index if not exists fee_waivers_class_idx on public.fee_waivers (class_id, created_at desc);
alter table public.fee_waivers enable row level security;
revoke all on table public.fee_waivers from public, anon, authenticated;
grant select, insert, update, delete on table public.fee_waivers to service_role;

-- ---------------------------------------------------------------------------------------------- Hàm phụ
-- Hết học kỳ tính từ một mốc (giờ Việt Nam): HK1 → 15/1, HK2 → 31/5 (xem đầu file)
create or replace function public.billing_term_end(p_from timestamptz)
returns timestamptz
language plpgsql stable set search_path = ''
as $$
declare l timestamp := p_from at time zone 'Asia/Ho_Chi_Minh'; m int := extract(month from l)::int; d int := extract(day from l)::int; y int := extract(year from l)::int;
begin
  if m between 1 and 4 then return make_timestamptz(y, 5, 31, 23, 59, 59, 'Asia/Ho_Chi_Minh'); end if;
  if m = 12 and d >= 16 then return make_timestamptz(y + 1, 5, 31, 23, 59, 59, 'Asia/Ho_Chi_Minh'); end if;
  return make_timestamptz(y + 1, 1, 15, 23, 59, 59, 'Asia/Ho_Chi_Minh');
end;
$$;

create or replace function public.billing_year_end(p_from timestamptz)
returns timestamptz
language plpgsql stable set search_path = ''
as $$
declare l timestamp := p_from at time zone 'Asia/Ho_Chi_Minh'; y int := extract(year from l)::int;
begin
  if extract(month from l) >= 5 then y := y + 1; end if;
  return make_timestamptz(y, 5, 31, 23, 59, 59, 'Asia/Ho_Chi_Minh');
end;
$$;

-- Lớp ở trường (có cô) mà em đang học: có → gói lớp học; không → gói gia đình
create or replace function public.billing_school_class(p_student uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.id from public.class_memberships cm join public.classes c on c.id = cm.class_id
  where cm.student_id = p_student and cm.status = 'active' and c.status = 'active' and c.kind = 'school'
  order by cm.joined_at desc limit 1;
$$;
revoke all on function public.billing_term_end(timestamptz), public.billing_year_end(timestamptz), public.billing_school_class(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------- Học sinh / phụ huynh
-- Bảng giá áp cho em đang đăng nhập + mốc hết học kỳ / năm học nếu mua hôm nay (nối tiếp hạn cũ)
create or replace function public.student_billing_offer()
returns table (kind text, price_term integer, price_year integer, term_end timestamptz, year_end timestamptz, class_name text)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); s public.billing_settings; v_cls uuid; v_from timestamptz;
begin
  if v_sid is null then raise exception 'not_student' using errcode = '42501'; end if;
  select * into s from public.billing_settings where id = 1;
  v_cls := public.billing_school_class(v_sid);
  select greatest(now(), coalesce(max(paid_until), now())) into v_from from public.student_subscriptions where student_id = v_sid;
  return query select
    case when v_cls is null then 'family' else 'school' end,
    case when v_cls is null then s.price_family_term else s.price_school_term end,
    case when v_cls is null then s.price_family_year else s.price_school_year end,
    public.billing_term_end(v_from), public.billing_year_end(v_from),
    (select c.name from public.classes c where c.id = v_cls);
end;
$$;

-- Tạo yêu cầu đóng phí: gói học kỳ (term) hoặc năm học (year); giá theo loại gói của em. Đang có yêu cầu chờ cùng gói, cùng giá trong 7 ngày thì dùng lại.
create or replace function public.student_request_payment(p_plan text)
returns table (id uuid, code text, plan text, amount integer, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); s public.billing_settings; v_code text; v_id uuid; v_amount integer; i int;
  v_cls uuid; v_teacher uuid; v_kind text;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if v_sid is null then raise exception 'not_student' using errcode = '42501'; end if;
  if p_plan not in ('term', 'year') then raise exception 'invalid_plan' using errcode = '22023'; end if;
  select * into s from public.billing_settings where billing_settings.id = 1;
  if s.account_no is null or s.bank_bin is null then raise exception 'billing_not_ready' using errcode = '22023'; end if;
  v_cls := public.billing_school_class(v_sid);
  v_kind := case when v_cls is null then 'family' else 'school' end;
  if v_cls is not null then
    select ct.teacher_id into v_teacher from public.class_teachers ct where ct.class_id = v_cls order by ct.created_at limit 1;
  end if;
  v_amount := case when v_kind = 'school' then (case when p_plan = 'term' then s.price_school_term else s.price_school_year end)
                   else (case when p_plan = 'term' then s.price_family_term else s.price_family_year end) end;
  select r.id into v_id from public.payment_requests r
   where r.student_id = v_sid and r.plan = p_plan and r.status = 'pending' and r.amount = v_amount and r.kind = v_kind
     and r.created_at > now() - interval '7 days'
   order by r.created_at desc limit 1;
  if v_id is null then
    if (select count(*) from public.payment_requests r where r.student_id = v_sid and r.created_at > now() - interval '1 day') >= 10 then
      raise exception 'too_many_requests' using errcode = '54000';
    end if;
    loop
      v_code := 'EDK';
      for i in 1..6 loop v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1); end loop;
      exit when not exists (select 1 from public.payment_requests r where r.code = v_code);
    end loop;
    insert into public.payment_requests (code, student_id, plan, amount, requested_by, kind, class_id, teacher_id)
    values (v_code, v_sid, p_plan, v_amount, auth.uid(), v_kind, v_cls, v_teacher) returning payment_requests.id into v_id;
  end if;
  return query select r.id, r.code, r.plan, r.amount, r.created_at from public.payment_requests r where r.id = v_id;
end;
$$;

-- ---------------------------------------------------------------------------------------------- Quản trị: giá + xác nhận
create or replace function public.admin_save_pricing(
  p_school_term integer, p_school_year integer, p_family_term integer, p_family_year integer, p_commission_pct smallint, p_waiver_pct smallint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.billing_settings set price_school_term = p_school_term, price_school_year = p_school_year,
    price_family_term = p_family_term, price_family_year = p_family_year, commission_pct = p_commission_pct, waiver_pct = p_waiver_pct,
    updated_by = v_uid, updated_at = now()
  where id = 1;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_save_pricing', 'billing', '1',
    format('lớp %s/%s · gia đình %s/%s · cộng tác %s%% · đặc cách %s%%', p_school_term, p_school_year, p_family_term, p_family_year, p_commission_pct, p_waiver_pct));
end;
$$;

-- Xác nhận đã nhận tiền → gia hạn (tháng: +1 tháng; học kỳ: hết học kỳ; năm: 31/5) + ghi phí cộng tác của cô (gói lớp học)
create or replace function public.admin_confirm_payment(p_payment uuid, p_note text)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); r public.payment_requests; v_from timestamptz; v_to timestamptz; v_pct smallint;
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into r from public.payment_requests where id = p_payment for update;
  if r.id is null then raise exception 'not_found' using errcode = '22023'; end if;
  if r.status <> 'pending' then raise exception 'not_pending' using errcode = '22023'; end if;
  select greatest(now(), coalesce(max(paid_until), now())) into v_from from public.student_subscriptions where student_id = r.student_id;
  v_to := case r.plan when 'month' then v_from + interval '1 month'
                      when 'term' then public.billing_term_end(v_from)
                      else public.billing_year_end(v_from) end;
  select commission_pct into v_pct from public.billing_settings where id = 1;
  insert into public.student_subscriptions (student_id, paid_until) values (r.student_id, v_to)
  on conflict (student_id) do update set paid_until = excluded.paid_until, updated_at = now();
  update public.payment_requests set status = 'confirmed', confirmed_by = v_uid, confirmed_at = now(),
    period_from = v_from, period_to = v_to, note = nullif(trim(coalesce(p_note, '')), ''),
    commission = case when r.kind = 'school' and r.teacher_id is not null then floor(r.amount * coalesce(v_pct, 0) / 100.0)::integer else 0 end
  where id = r.id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_confirm_payment', 'payment', r.id::text, r.code || ' ' || r.amount || 'đ');
  return v_to;
end;
$$;

drop function if exists public.admin_list_payments(text, text);
create function public.admin_list_payments(p_status text, p_search text)
returns table (id uuid, code text, plan text, amount integer, status text, created_at timestamptz, confirmed_at timestamptz,
               period_to timestamptz, student_id uuid, student_name text, grade smallint, class_name text, school_name text,
               kind text, teacher_name text, commission integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  select r.id, r.code, r.plan, r.amount, r.status, r.created_at, r.confirmed_at, r.period_to, st.id, st.display_name, st.grade,
         coalesce((select c.name from public.classes c where c.id = r.class_id),
                  (select c.name from public.class_memberships cm join public.classes c on c.id = cm.class_id
                    where cm.student_id = st.id and cm.status = 'active' order by c.created_at desc limit 1)),
         (select sc.name from public.schools sc where sc.id = st.school_id),
         r.kind, (select p.display_name from public.profiles p where p.id = r.teacher_id), r.commission
  from public.payment_requests r join public.students st on st.id = r.student_id
  where (p_status is null or r.status = p_status)
    and (v_q is null or r.code ilike '%' || v_q || '%' or st.display_name ilike '%' || v_q || '%')
  order by r.created_at desc
  limit 300;
end;
$$;

-- Thông báo quản trị khi có yêu cầu thanh toán: ghi đúng tên gói
create or replace function public.notify_payment_request()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_student text;
begin
  select display_name into v_student from public.students where id = new.student_id;
  perform public.admin_notify('payment', 'Yêu cầu thanh toán '
      || case new.plan when 'year' then 'gói năm học' when 'term' then 'gói học kỳ' else 'gói tháng' end
      || case when new.kind = 'family' then ' (gia đình)' else ' (lớp học)' end
      || ' — ' || replace(to_char(new.amount, 'FM999,999,999'), ',', '.') || ' ₫',
    'Học sinh ' || coalesce(v_student, '') || ' · mã ' || new.code, '/quan-tri/thu-phi', new.requested_by, null);
  return new;
exception when others then return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------- Đặc cách
-- Số suất đặc cách của lớp: tối đa = ceil(sĩ số × waiver_pct%), ít nhất 1; đã dùng = đang chờ + đã duyệt còn hạn
create or replace function public.teacher_waiver_quota(p_class uuid)
returns table (quota integer, used integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_pct smallint; v_n int;
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select waiver_pct into v_pct from public.billing_settings where id = 1;
  select count(*) into v_n from public.class_memberships where class_id = p_class and status = 'active';
  return query select
    case when coalesce(v_pct, 0) = 0 then 0 else greatest(1, ceil(v_n * v_pct / 100.0))::integer end,
    (select count(*)::integer from public.fee_waivers w
      where w.class_id = p_class and (w.status = 'pending' or (w.status = 'approved' and w.period_to > now())));
end;
$$;

create or replace function public.teacher_class_waivers(p_class uuid)
returns table (id uuid, student_id uuid, student_name text, reason text, status text, created_at timestamptz, decided_at timestamptz,
               period_to timestamptz, admin_note text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select w.id, w.student_id, s.display_name, w.reason, w.status, w.created_at, w.decided_at, w.period_to, w.admin_note
  from public.fee_waivers w join public.students s on s.id = w.student_id
  where w.class_id = p_class order by w.created_at desc limit 100;
end;
$$;

create or replace function public.teacher_request_waiver(p_class uuid, p_student uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_id uuid; q record; v_reason text := trim(coalesce(p_reason, '')); v_name text; v_cls text;
begin
  if v_uid is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.class_memberships cm join public.classes c on c.id = cm.class_id
                 where cm.class_id = p_class and cm.student_id = p_student and cm.status = 'active' and c.kind = 'school') then
    raise exception 'not_in_class' using errcode = '22023';
  end if;
  if char_length(v_reason) < 5 or char_length(v_reason) > 300 then raise exception 'bad_reason' using errcode = '22023'; end if;
  if exists (select 1 from public.fee_waivers w where w.student_id = p_student and w.status = 'pending') then
    raise exception 'waiver_pending' using errcode = '22023';
  end if;
  if exists (select 1 from public.fee_waivers w where w.student_id = p_student and w.status = 'approved' and w.period_to > now()) then
    raise exception 'waiver_active' using errcode = '22023';
  end if;
  select * into q from public.teacher_waiver_quota(p_class);
  if q.used >= q.quota then raise exception 'waiver_quota' using errcode = '54000'; end if;
  insert into public.fee_waivers (student_id, class_id, teacher_id, reason) values (p_student, p_class, v_uid, v_reason) returning id into v_id;
  select display_name into v_name from public.students where id = p_student;
  select name into v_cls from public.classes where id = p_class;
  begin
    perform public.admin_notify('payment', 'Xin đặc cách học phí — ' || coalesce(v_name, ''), 'Lớp ' || coalesce(v_cls, '') || ' · ' || left(v_reason, 120),
      '/quan-tri/thu-phi', v_uid, null);
  exception when others then null;
  end;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_uid, 'teacher_request_waiver', 'student', p_student::text, left(v_reason, 200));
  return v_id;
end;
$$;

create or replace function public.teacher_cancel_waiver(p_waiver uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_cls uuid;
begin
  select class_id into v_cls from public.fee_waivers where id = p_waiver and status = 'pending';
  if v_cls is null then raise exception 'not_pending' using errcode = '22023'; end if;
  if auth.uid() is null or not public.teaches_class(v_cls) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.fee_waivers set status = 'cancelled', decided_at = now(), decided_by = auth.uid() where id = p_waiver;
end;
$$;

create or replace function public.admin_list_waivers(p_status text)
returns table (id uuid, student_id uuid, student_name text, grade smallint, class_name text, school_name text, teacher_name text,
               reason text, status text, created_at timestamptz, decided_at timestamptz, period_to timestamptz, admin_note text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select w.id, w.student_id, s.display_name, s.grade, c.name, sc.name, p.display_name,
    w.reason, w.status, w.created_at, w.decided_at, w.period_to, w.admin_note
  from public.fee_waivers w
  join public.students s on s.id = w.student_id
  join public.classes c on c.id = w.class_id
  left join public.schools sc on sc.id = c.school_id
  left join public.profiles p on p.id = w.teacher_id
  where p_status is null or w.status = p_status
  order by w.created_at desc limit 300;
end;
$$;

-- Duyệt: em học đến hết học kỳ hiện tại (nối tiếp hạn cũ nếu còn). Từ chối: ghi lý do cho cô xem.
create or replace function public.admin_decide_waiver(p_waiver uuid, p_approve boolean, p_note text)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); w public.fee_waivers; v_from timestamptz; v_to timestamptz;
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into w from public.fee_waivers where id = p_waiver for update;
  if w.id is null or w.status <> 'pending' then raise exception 'not_pending' using errcode = '22023'; end if;
  if p_approve then
    select greatest(now(), coalesce(max(paid_until), now())) into v_from from public.student_subscriptions where student_id = w.student_id;
    v_to := public.billing_term_end(v_from);
    insert into public.student_subscriptions (student_id, paid_until) values (w.student_id, v_to)
    on conflict (student_id) do update set paid_until = excluded.paid_until, updated_at = now();
  end if;
  update public.fee_waivers set status = case when p_approve then 'approved' else 'rejected' end, decided_by = v_uid, decided_at = now(),
    period_to = v_to, admin_note = nullif(left(trim(coalesce(p_note, '')), 300), '')
  where id = w.id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, case when p_approve then 'admin_approve_waiver' else 'admin_reject_waiver' end, 'student', w.student_id::text, nullif(trim(coalesce(p_note, '')), ''));
  return v_to;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.student_billing_offer()',
    'public.student_request_payment(text)',
    'public.admin_save_pricing(integer, integer, integer, integer, smallint, smallint)',
    'public.admin_confirm_payment(uuid, text)',
    'public.admin_list_payments(text, text)',
    'public.teacher_waiver_quota(uuid)',
    'public.teacher_class_waivers(uuid)',
    'public.teacher_request_waiver(uuid, uuid, text)',
    'public.teacher_cancel_waiver(uuid)',
    'public.admin_list_waivers(text)',
    'public.admin_decide_waiver(uuid, boolean, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
