-- EduChain Kids 0075: CÔ CÔNG BỐ GÓI HỌC PHÍ CỦA LỚP + EM CHƯA ĐÓNG PHÍ VẪN LÀM BÀI CÔ GIAO.
-- CHỈ THÊM MỚI / THAY HÀM, chạy lại an toàn. Cần đã chạy 0017 (giao bài), 0018 (học phí), 0074 (giá theo học kỳ).
--  * classes.fee_plan: 'choice' (phụ huynh tự chọn học kỳ / năm học — mặc định) | 'term' (chỉ gói học kỳ) | 'year' (chỉ gói năm học).
--    Cô đổi ở trang lớp; trang Học phí của em chỉ hiện đúng khoản cô đã công bố, máy chủ không tạo mã cho gói khác.
--    Lớp gia đình (phụ huynh tự đăng ký) không dùng cột này: luôn cho chọn học kỳ / năm học theo giá gói gia đình.
--  * student_assigned_lesson: em hết hạn học phí vẫn làm được bài cô giao (bài học đang mở); phần luyện tập tự do mới bị khoá.
--    (Đề cô giao và phòng thi lớp không khoá theo học phí — xử lý ở API.)

alter table public.classes add column if not exists fee_plan text not null default 'choice';
do $$ begin
  alter table public.classes add constraint classes_fee_plan_check check (fee_plan in ('choice', 'term', 'year'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------------------------- Cô
create or replace function public.teacher_class_fee(p_class uuid)
returns table (fee_plan text, price_term integer, price_year integer, commission_pct smallint, enabled boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query select c.fee_plan, s.price_school_term, s.price_school_year, s.commission_pct, s.enabled
  from public.classes c cross join public.billing_settings s where c.id = p_class and s.id = 1;
end;
$$;

create or replace function public.teacher_set_fee_plan(p_class uuid, p_plan text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.teaches_class(p_class) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_plan not in ('choice', 'term', 'year') then raise exception 'invalid_plan' using errcode = '22023'; end if;
  update public.classes set fee_plan = p_plan where id = p_class and kind = 'school';
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (auth.uid(), 'teacher_set_fee_plan', 'class', p_class::text, p_plan);
end;
$$;

-- ---------------------------------------------------------------------------------------------- Học sinh / phụ huynh
-- Bảng giá của em + gói cô đã công bố (fee_plan) + tên cô
drop function if exists public.student_billing_offer();
create function public.student_billing_offer()
returns table (kind text, price_term integer, price_year integer, term_end timestamptz, year_end timestamptz, class_name text,
               fee_plan text, teacher_name text)
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
    (select c.name from public.classes c where c.id = v_cls),
    coalesce((select c.fee_plan from public.classes c where c.id = v_cls), 'choice'),
    (select p.display_name from public.class_teachers ct join public.profiles p on p.id = ct.teacher_id
      where ct.class_id = v_cls order by ct.created_at limit 1);
end;
$$;

-- Tạo yêu cầu đóng phí — như 0074, thêm: lớp chỉ mở một gói thì không tạo mã cho gói kia
create or replace function public.student_request_payment(p_plan text)
returns table (id uuid, code text, plan text, amount integer, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); s public.billing_settings; v_code text; v_id uuid; v_amount integer; i int;
  v_cls uuid; v_teacher uuid; v_kind text; v_fee text;
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
    select c.fee_plan into v_fee from public.classes c where c.id = v_cls;
    if v_fee in ('term', 'year') and v_fee <> p_plan then raise exception 'plan_not_offered' using errcode = '22023'; end if;
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

-- Bài học này có đang được cô giao cho em không (bài đang mở, giao cả lớp hoặc riêng em)
create or replace function public.student_assigned_lesson(p_lesson text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.class_assignments a
    join public.class_memberships cm on cm.class_id = a.class_id and cm.student_id = public.my_student_id() and cm.status = 'active'
    where a.kind = 'lesson' and a.lesson_code = p_lesson and a.status = 'open'
      and (a.student_ids is null or public.my_student_id() = any (a.student_ids))
  );
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.teacher_class_fee(uuid)',
    'public.teacher_set_fee_plan(uuid, text)',
    'public.student_billing_offer()',
    'public.student_request_payment(text)',
    'public.student_assigned_lesson(text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
