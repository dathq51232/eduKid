-- EduChain Kids 0018: THU PHÍ HỌC SINH (giáo viên miễn phí).
-- CHỈ THÊM MỚI, chạy lại an toàn. Mặc định CHƯA BẬT thu phí (billing_settings.enabled = false):
-- quản trị điền tài khoản nhận tiền, giá, số ngày học thử rồi mới bật ở trang Quản trị → Thu phí.
--  * Gói tháng (mặc định 300.000đ) và gói năm học (mặc định 2.700.000đ, hiệu lực đến 31/5 của năm học).
--  * Học thử N ngày (mặc định 7) tính từ lúc tạo tài khoản học sinh hoặc lúc bật thu phí (lấy mốc muộn hơn).
--  * Thanh toán: phụ huynh chuyển khoản theo mã QR có nội dung riêng (EDKxxxxxx); quản trị đối chiếu sao kê rồi bấm Xác nhận.
--  * Hết hạn: khoá toàn bộ phần học (máy chủ kiểm tra bằng my_learning_gate); chỉ còn trang của em + trang đóng phí.
-- Không bảng nào cho đọc/ghi thẳng; mọi thao tác qua hàm có kiểm tra quyền.

create table if not exists public.billing_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  enabled_at timestamptz,
  price_month integer not null default 300000 check (price_month between 1000 and 100000000),
  price_year integer not null default 2700000 check (price_year between 1000 and 1000000000),
  trial_days smallint not null default 7 check (trial_days between 0 and 60),
  bank_bin text check (bank_bin is null or bank_bin ~ '^[0-9]{6}$'),
  bank_name text check (bank_name is null or char_length(bank_name) <= 100),
  account_no text check (account_no is null or account_no ~ '^[0-9A-Za-z]{4,19}$'),
  account_name text check (account_name is null or char_length(account_name) <= 100),
  note text check (note is null or char_length(note) <= 300),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.billing_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.student_subscriptions (
  student_id uuid primary key references public.students(id) on delete cascade,
  paid_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^EDK[A-HJ-NP-Z2-9]{6}$'),
  student_id uuid not null references public.students(id) on delete cascade,
  plan text not null check (plan in ('month', 'year')),
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  period_from timestamptz,
  period_to timestamptz,
  note text check (note is null or char_length(note) <= 300)
);
create index if not exists payment_requests_status_idx on public.payment_requests (status, created_at desc);
create index if not exists payment_requests_student_idx on public.payment_requests (student_id, created_at desc);

alter table public.billing_settings enable row level security;
alter table public.student_subscriptions enable row level security;
alter table public.payment_requests enable row level security;
revoke all on table public.billing_settings, public.student_subscriptions, public.payment_requests from anon, authenticated;
grant select, insert, update, delete on table public.billing_settings, public.student_subscriptions, public.payment_requests to service_role;

-- ---------------------------------------------------------------------------------------------- Quyền học
-- Trạng thái học của một em: free (chưa bật thu phí) | paid | trial | expired
create or replace function public.billing_access(p_student uuid)
returns table (active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare s public.billing_settings; v_paid timestamptz; v_created timestamptz; v_trial timestamptz;
begin
  select * into s from public.billing_settings where id = 1;
  if s.id is null or not s.enabled then return query select true, 'free'::text, null::timestamptz; return; end if;
  select paid_until into v_paid from public.student_subscriptions where student_id = p_student;
  if v_paid is not null and v_paid > now() then return query select true, 'paid'::text, v_paid; return; end if;
  select created_at into v_created from public.students where id = p_student;
  v_trial := greatest(coalesce(v_created, now()), coalesce(s.enabled_at, now())) + make_interval(days => s.trial_days);
  if v_trial > now() then return query select true, 'trial'::text, v_trial; return; end if;
  return query select false, 'expired'::text, greatest(v_paid, v_trial);
end;
$$;
revoke all on function public.billing_access(uuid) from public, anon, authenticated;
grant execute on function public.billing_access(uuid) to service_role;

-- Cổng vào phần học của người đang đăng nhập (dùng ở middleware + API): có phải học sinh không, khối, còn được học không.
-- Không phải học sinh (giáo viên, quản trị…) -> is_student = false, luôn được dùng (giáo viên miễn phí).
create or replace function public.my_learning_gate()
returns table (is_student boolean, grade smallint, active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_grade smallint; a record;
begin
  if v_sid is null then return query select false, null::smallint, true, 'not_student'::text, null::timestamptz; return; end if;
  select c.grade into v_grade from public.class_memberships cm join public.classes c on c.id = cm.class_id
   where cm.student_id = v_sid and cm.status = 'active' and c.status = 'active' order by c.created_at desc limit 1;
  if v_grade is null then select s.grade into v_grade from public.students s where s.id = v_sid; end if;
  select * into a from public.billing_access(v_sid);
  return query select true, v_grade, a.active, a.reason, a.until;
end;
$$;

-- Thông tin đóng phí (giá, tài khoản nhận) — ai đăng nhập cũng xem được để chuyển khoản
create or replace function public.billing_public()
returns table (enabled boolean, price_month integer, price_year integer, trial_days smallint,
               bank_bin text, bank_name text, account_no text, account_name text, note text, year_end timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_y int := extract(year from (now() at time zone 'Asia/Ho_Chi_Minh'))::int;
begin
  if extract(month from (now() at time zone 'Asia/Ho_Chi_Minh')) >= 5 then v_y := v_y + 1; end if;
  return query select s.enabled, s.price_month, s.price_year, s.trial_days, s.bank_bin, s.bank_name, s.account_no, s.account_name, s.note,
    make_timestamptz(v_y, 5, 31, 23, 59, 59, 'Asia/Ho_Chi_Minh')
  from public.billing_settings s where s.id = 1;
end;
$$;

-- ---------------------------------------------------------------------------------------------- Học sinh
-- Tạo yêu cầu đóng phí (mã chuyển khoản riêng). Đã có yêu cầu đang chờ cùng gói trong 7 ngày thì dùng lại.
create or replace function public.student_request_payment(p_plan text)
returns table (id uuid, code text, plan text, amount integer, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); s public.billing_settings; v_code text; v_id uuid; v_amount integer; i int;
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if v_sid is null then raise exception 'not_student' using errcode = '42501'; end if;
  if p_plan not in ('month', 'year') then raise exception 'invalid_plan' using errcode = '22023'; end if;
  select * into s from public.billing_settings where billing_settings.id = 1;
  if s.account_no is null or s.bank_bin is null then raise exception 'billing_not_ready' using errcode = '22023'; end if;
  v_amount := case when p_plan = 'month' then s.price_month else s.price_year end;
  select r.id into v_id from public.payment_requests r
   where r.student_id = v_sid and r.plan = p_plan and r.status = 'pending' and r.amount = v_amount and r.created_at > now() - interval '7 days'
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
    insert into public.payment_requests (code, student_id, plan, amount, requested_by)
    values (v_code, v_sid, p_plan, v_amount, auth.uid()) returning payment_requests.id into v_id;
  end if;
  return query select r.id, r.code, r.plan, r.amount, r.created_at from public.payment_requests r where r.id = v_id;
end;
$$;

create or replace function public.student_my_payments()
returns table (id uuid, code text, plan text, amount integer, status text, created_at timestamptz, confirmed_at timestamptz, period_to timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id();
begin
  if v_sid is null then return; end if;
  return query select r.id, r.code, r.plan, r.amount, r.status, r.created_at, r.confirmed_at, r.period_to
  from public.payment_requests r where r.student_id = v_sid order by r.created_at desc limit 20;
end;
$$;

-- ---------------------------------------------------------------------------------------------- Giáo viên (miễn phí) — xem tình trạng học phí của lớp mình
create or replace function public.teacher_class_billing(p_class uuid)
returns table (student_id uuid, active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query select cm.student_id, a.active, a.reason, a.until
  from public.class_memberships cm cross join lateral public.billing_access(cm.student_id) a
  where cm.class_id = p_class and cm.status = 'active';
end;
$$;

-- ---------------------------------------------------------------------------------------------- Quản trị hệ thống
create or replace function public.admin_save_billing_settings(
  p_enabled boolean, p_price_month integer, p_price_year integer, p_trial_days smallint,
  p_bank_bin text, p_bank_name text, p_account_no text, p_account_name text, p_note text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_enabled and (nullif(trim(coalesce(p_account_no, '')), '') is null or nullif(trim(coalesce(p_bank_bin, '')), '') is null) then
    raise exception 'billing_not_ready' using errcode = '22023';
  end if;
  update public.billing_settings set
    enabled = p_enabled,
    enabled_at = case when p_enabled and enabled_at is null then now() else enabled_at end,
    price_month = p_price_month, price_year = p_price_year, trial_days = p_trial_days,
    bank_bin = nullif(trim(coalesce(p_bank_bin, '')), ''), bank_name = nullif(trim(coalesce(p_bank_name, '')), ''),
    account_no = nullif(trim(coalesce(p_account_no, '')), ''), account_name = nullif(upper(trim(coalesce(p_account_name, ''))), ''),
    note = nullif(trim(coalesce(p_note, '')), ''), updated_by = v_uid, updated_at = now()
  where id = 1;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_save_billing_settings', 'billing', '1', case when p_enabled then 'bật thu phí' else 'tắt thu phí' end);
end;
$$;

create or replace function public.admin_billing_settings()
returns setof public.billing_settings
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select * from public.billing_settings where id = 1;
end;
$$;

create or replace function public.admin_list_payments(p_status text, p_search text)
returns table (id uuid, code text, plan text, amount integer, status text, created_at timestamptz, confirmed_at timestamptz,
               period_to timestamptz, student_id uuid, student_name text, grade smallint, class_name text, school_name text)
language plpgsql stable security definer set search_path = ''
as $$
declare v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  select r.id, r.code, r.plan, r.amount, r.status, r.created_at, r.confirmed_at, r.period_to, st.id, st.display_name, st.grade,
         (select c.name from public.class_memberships cm join public.classes c on c.id = cm.class_id
           where cm.student_id = st.id and cm.status = 'active' order by c.created_at desc limit 1),
         (select sc.name from public.schools sc where sc.id = st.school_id)
  from public.payment_requests r join public.students st on st.id = r.student_id
  where (p_status is null or r.status = p_status)
    and (v_q is null or r.code ilike '%' || v_q || '%' or st.display_name ilike '%' || v_q || '%')
  order by r.created_at desc
  limit 300;
end;
$$;

-- Xác nhận đã nhận tiền -> gia hạn: gói tháng +1 tháng; gói năm học đến 31/5 (mua từ tháng 5 trở đi tính năm học sau).
-- Gia hạn nối tiếp ngày hết hạn cũ nếu còn hạn.
create or replace function public.admin_confirm_payment(p_payment uuid, p_note text)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); r public.payment_requests; v_from timestamptz; v_to timestamptz; v_y int;
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into r from public.payment_requests where id = p_payment for update;
  if r.id is null then raise exception 'not_found' using errcode = '22023'; end if;
  if r.status <> 'pending' then raise exception 'not_pending' using errcode = '22023'; end if;
  select greatest(now(), coalesce(max(paid_until), now())) into v_from from public.student_subscriptions where student_id = r.student_id;
  if r.plan = 'month' then
    v_to := v_from + interval '1 month';
  else
    v_y := extract(year from (v_from at time zone 'Asia/Ho_Chi_Minh'))::int;
    if extract(month from (v_from at time zone 'Asia/Ho_Chi_Minh')) >= 5 then v_y := v_y + 1; end if;
    v_to := make_timestamptz(v_y, 5, 31, 23, 59, 59, 'Asia/Ho_Chi_Minh');
  end if;
  insert into public.student_subscriptions (student_id, paid_until) values (r.student_id, v_to)
  on conflict (student_id) do update set paid_until = excluded.paid_until, updated_at = now();
  update public.payment_requests set status = 'confirmed', confirmed_by = v_uid, confirmed_at = now(),
    period_from = v_from, period_to = v_to, note = nullif(trim(coalesce(p_note, '')), '')
  where id = r.id;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_confirm_payment', 'payment', r.id::text, r.code || ' ' || r.amount || 'đ');
  return v_to;
end;
$$;

create or replace function public.admin_cancel_payment(p_payment uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.payment_requests set status = 'cancelled' where id = p_payment and status = 'pending';
  if not found then raise exception 'not_pending' using errcode = '22023'; end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (v_uid, 'admin_cancel_payment', 'payment', p_payment::text, null);
end;
$$;

create or replace function public.admin_billing_summary()
returns table (pending integer, pending_amount bigint, month_amount bigint, month_count integer, paid_students integer)
language plpgsql stable security definer set search_path = ''
as $$
declare v_month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select
    (select count(*)::integer from public.payment_requests where status = 'pending'),
    (select coalesce(sum(amount), 0)::bigint from public.payment_requests where status = 'pending'),
    (select coalesce(sum(amount), 0)::bigint from public.payment_requests where status = 'confirmed' and confirmed_at >= v_month_start),
    (select count(*)::integer from public.payment_requests where status = 'confirmed' and confirmed_at >= v_month_start),
    (select count(*)::integer from public.student_subscriptions where paid_until > now());
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.my_learning_gate()',
    'public.billing_public()',
    'public.student_request_payment(text)',
    'public.student_my_payments()',
    'public.teacher_class_billing(uuid)',
    'public.admin_save_billing_settings(boolean, integer, integer, smallint, text, text, text, text, text)',
    'public.admin_billing_settings()',
    'public.admin_list_payments(text, text)',
    'public.admin_confirm_payment(uuid, text)',
    'public.admin_cancel_payment(uuid)',
    'public.admin_billing_summary()'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
