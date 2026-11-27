-- 0084: Hoàn thiện luồng xác nhận học phí (11/2026). Cần đã chạy 0018, 0045, 0047, 0049, 0074.
--  1) Đã đóng học phí (quản trị xác nhận) thì LUÔN được học đủ chức năng — kể cả khi gói miễn phí của thầy cô đã hết chỗ
--     (trước: my_learning_gate kiểm "plan_locked" trước học phí nên em đã đóng phí vẫn có thể bị khoá).
--  2) Phụ huynh bấm "Tôi đã chuyển khoản": ghi claimed_at + báo cho quản trị (chuông Quản trị) để xác nhận nhanh.
--  3) Danh sách khoản đóng của quản trị / của em trả thêm claimed_at; quản trị thấy khoản "đã báo chuyển khoản" lên đầu.
-- Không xoá dữ liệu. Hàm đổi kiểu trả về (admin_list_payments, student_my_payments) phải drop rồi tạo lại, giữ nguyên quyền.

-- 1) Cổng học: kiểm học phí trước, "đã đóng" thắng "hết chỗ trong gói của thầy cô"
create or replace function public.my_learning_gate()
returns table (is_student boolean, grade smallint, active boolean, reason text, until timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); v_grade smallint; a record;
begin
  if v_sid is null then return query select false, null::smallint, true, 'not_student'::text, null::timestamptz; return; end if;
  select c.grade into v_grade from public.class_memberships cm join public.classes c on c.id = cm.class_id
   where cm.student_id = v_sid and cm.status = 'active' and c.status = 'active' and c.kind <> 'family' order by c.created_at desc limit 1;
  if v_grade is null then select s.grade into v_grade from public.students s where s.id = v_sid; end if;
  select * into a from public.billing_access(v_sid);
  if a.reason = 'paid' then
    return query select true, v_grade, true, 'paid'::text, a.until; return;
  end if;
  if public.student_plan_locked(v_sid) then
    return query select true, v_grade, false, 'plan_locked'::text, null::timestamptz; return;
  end if;
  return query select true, v_grade, a.active, a.reason, a.until;
end;
$$;
revoke all on function public.my_learning_gate() from public, anon;
grant execute on function public.my_learning_gate() to authenticated;

-- 2) Phụ huynh báo đã chuyển khoản
alter table public.payment_requests add column if not exists claimed_at timestamptz;

create or replace function public.student_claim_payment(p_payment uuid)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id(); r public.payment_requests; v_name text;
begin
  if v_sid is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into r from public.payment_requests where id = p_payment and student_id = v_sid for update;
  if r.id is null then raise exception 'not_found' using errcode = '22023'; end if;
  if r.status <> 'pending' then raise exception 'not_pending' using errcode = '22023'; end if;
  if r.claimed_at is not null then return r.claimed_at; end if; -- bấm lại: không báo trùng
  update public.payment_requests set claimed_at = now() where id = r.id;
  select s.display_name into v_name from public.students s where s.id = v_sid;
  perform public.admin_notify('payment', coalesce(v_name, 'Học sinh') || ' báo đã chuyển khoản',
    r.code || ' · ' || to_char(r.amount, 'FM999G999G999') || 'đ — đối chiếu sao kê rồi Xác nhận', '/quan-tri/thu-phi', null, 'payment_claim');
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason)
  values (auth.uid(), 'student_claim_payment', 'payment', r.id::text, r.code);
  return now();
end;
$$;
revoke all on function public.student_claim_payment(uuid) from public, anon;
grant execute on function public.student_claim_payment(uuid) to authenticated;

-- 3a) Danh sách khoản đóng của quản trị: thêm claimed_at, khoản chờ đã báo chuyển khoản lên đầu
drop function if exists public.admin_list_payments(text, text);
create function public.admin_list_payments(p_status text, p_search text)
returns table (id uuid, code text, plan text, amount integer, status text, created_at timestamptz, confirmed_at timestamptz,
               period_to timestamptz, student_id uuid, student_name text, grade smallint, class_name text, school_name text,
               kind text, teacher_name text, commission integer, claimed_at timestamptz)
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
         r.kind, (select p.display_name from public.profiles p where p.id = r.teacher_id), r.commission, r.claimed_at
  from public.payment_requests r join public.students st on st.id = r.student_id
  where (p_status is null or r.status = p_status)
    and (v_q is null or r.code ilike '%' || v_q || '%' or st.display_name ilike '%' || v_q || '%')
  order by (r.status = 'pending' and r.claimed_at is not null) desc, r.created_at desc
  limit 300;
end;
$$;
revoke all on function public.admin_list_payments(text, text) from public, anon;
grant execute on function public.admin_list_payments(text, text) to authenticated;

-- 3b) Khoản đóng của em (Góc phụ huynh / trang học phí): thêm claimed_at
drop function if exists public.student_my_payments();
create function public.student_my_payments()
returns table (id uuid, code text, plan text, amount integer, status text, created_at timestamptz, confirmed_at timestamptz, period_to timestamptz, claimed_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_sid uuid := public.my_student_id();
begin
  if v_sid is null then return; end if;
  return query select r.id, r.code, r.plan, r.amount, r.status, r.created_at, r.confirmed_at, r.period_to, r.claimed_at
  from public.payment_requests r where r.student_id = v_sid order by r.created_at desc limit 20;
end;
$$;
revoke all on function public.student_my_payments() from public, anon;
grant execute on function public.student_my_payments() to authenticated;
