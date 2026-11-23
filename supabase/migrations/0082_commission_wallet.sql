-- EduChain Kids 0082: VÍ PHÍ CỘNG TÁC CỦA THẦY CÔ + CHI TRẢ 2 LẦN / NĂM (cuối HK1, cuối HK2). CHỈ THÊM MỚI, chạy lại an toàn.
-- Cần đã chạy 0018, 0074 (phí cộng tác ghi ở payment_requests.commission khi quản trị / SePay xác nhận khoản đóng gói lớp học).
--  • teacher_wallets: tài khoản nhận tiền của cô (ngân hàng, số TK, tên chủ TK, CCCD để khấu trừ thuế) + thời điểm đồng ý điều khoản.
--  • Ví = các khoản phí cộng tác đã xác nhận, chưa vào đợt chi (tự cộng khi phụ huynh lớp cô đóng phí).
--    Cô chỉ thấy TỔNG theo lớp và theo gói (số em, số tiền) — không thấy em nào đã đóng.
--  • payout_batches / payout_items: quản trị tạo đợt chi cuối học kỳ → gom ví từng cô (cô đã khai tài khoản) → tính khấu trừ thuế
--    (khoản ≥ ngưỡng, mặc định 2.000.000đ × 10%) → xuất file chuyển khoản theo lô → đánh dấu đã chi.
--  • Khoản bị huỷ phí cộng tác (hoàn tiền, gian lận) trước khi vào đợt chi: admin_commission_void.
-- Bảng không mở trực tiếp cho trình duyệt; mọi thao tác qua các hàm bên dưới.

alter table public.billing_settings add column if not exists payout_tax_threshold integer not null default 2000000;
alter table public.billing_settings add column if not exists payout_tax_pct smallint not null default 10;

create table if not exists public.teacher_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bank_name text not null check (char_length(bank_name) between 2 and 80),
  account_no text not null check (account_no ~ '^[0-9]{6,20}$'),
  account_name text not null check (char_length(account_name) between 2 and 80),
  id_number text check (id_number is null or id_number ~ '^[0-9]{9,12}$'),
  agreed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teacher_wallets enable row level security;
revoke all on public.teacher_wallets from anon, authenticated;

create table if not exists public.payout_batches (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 2 and 80),
  status text not null default 'cho_chi' check (status in ('cho_chi', 'da_chi')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.payout_batches enable row level security;
revoke all on public.payout_batches from anon, authenticated;

create table if not exists public.payout_items (
  batch_id uuid not null references public.payout_batches(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  gross integer not null check (gross >= 0),
  tax integer not null default 0 check (tax >= 0),
  net integer not null check (net >= 0),
  payments integer not null default 0,
  bank_name text not null, account_no text not null, account_name text not null, id_number text,
  status text not null default 'cho_chi' check (status in ('cho_chi', 'da_chi', 'giu_lai')),
  paid_at timestamptz,
  primary key (batch_id, teacher_id)
);
alter table public.payout_items enable row level security;
revoke all on public.payout_items from anon, authenticated;

alter table public.payment_requests add column if not exists payout_batch uuid references public.payout_batches(id) on delete set null;
alter table public.payment_requests add column if not exists commission_void boolean not null default false;
create index if not exists payment_requests_wallet_idx on public.payment_requests (teacher_id, status) where commission > 0;

-- Khoản phí cộng tác còn trong ví (đã xác nhận, chưa huỷ, chưa vào đợt chi nào hoặc đợt đó đã bị xoá / giữ lại)
create or replace function public.wallet_open(r public.payment_requests) returns boolean
language sql stable set search_path = '' as $$
  select r.status = 'confirmed' and r.commission > 0 and not r.commission_void and r.payout_batch is null;
$$;

-- ---------------------------------------------------------------------------------------------- Giáo viên
-- Ví của tôi: số dư, đang trong đợt chi, đã nhận; tổng theo lớp + gói; lịch sử chi; tài khoản; bảng giá (để khuyên gói năm)
create or replace function public.teacher_wallet()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); s public.billing_settings;
begin
  if v_uid is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into s from public.billing_settings where id = 1;
  return jsonb_build_object(
    'enabled', coalesce(s.enabled, false),
    'pct', coalesce(s.commission_pct, 0), 'priceTerm', s.price_school_term, 'priceYear', s.price_school_year,
    'taxThreshold', coalesce(s.payout_tax_threshold, 2000000), 'taxPct', coalesce(s.payout_tax_pct, 10),
    'balance', coalesce((select sum(r.commission) from public.payment_requests r where r.teacher_id = v_uid and public.wallet_open(r)), 0),
    'inBatch', coalesce((select sum(i.net) from public.payout_items i join public.payout_batches b on b.id = i.batch_id
                         where i.teacher_id = v_uid and i.status = 'cho_chi'), 0),
    'paid', coalesce((select sum(i.net) from public.payout_items i where i.teacher_id = v_uid and i.status = 'da_chi'), 0),
    'byClass', coalesce((
      select jsonb_agg(jsonb_build_object('className', x.class_name, 'term', x.n_term, 'year', x.n_year, 'amount', x.amount) order by x.class_name)
      from (
        select coalesce(c.name, '—') as class_name,
               count(*) filter (where r.plan = 'term')::int as n_term, count(*) filter (where r.plan = 'year')::int as n_year,
               sum(r.commission)::int as amount
        from public.payment_requests r left join public.classes c on c.id = r.class_id
        where r.teacher_id = v_uid and public.wallet_open(r)
        group by coalesce(c.name, '—')
      ) x), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('label', b.label, 'gross', i.gross, 'tax', i.tax, 'net', i.net, 'status', i.status, 'paidAt', i.paid_at)
                       order by b.created_at desc)
      from public.payout_items i join public.payout_batches b on b.id = i.batch_id where i.teacher_id = v_uid), '[]'::jsonb),
    'account', (select jsonb_build_object('bankName', w.bank_name, 'accountNo', w.account_no, 'accountName', w.account_name,
                                          'idNumber', w.id_number, 'agreedAt', w.agreed_at)
                from public.teacher_wallets w where w.user_id = v_uid)
  );
end;
$$;
revoke all on function public.teacher_wallet() from public, anon;
grant execute on function public.teacher_wallet() to authenticated;

-- Lưu tài khoản nhận tiền (cô phải đồng ý điều khoản cộng tác). Tên chủ tài khoản lưu IN HOA KHÔNG DẤU như ngân hàng.
create or replace function public.teacher_wallet_save(p_bank text, p_account_no text, p_account_name text, p_id_number text, p_agree boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_no text := regexp_replace(coalesce(p_account_no, ''), '\s', '', 'g');
  v_id text := nullif(regexp_replace(coalesce(p_id_number, ''), '\s', '', 'g'), '');
begin
  if v_uid is null or not exists (select 1 from public.user_roles ur where ur.user_id = v_uid and ur.role in ('teacher', 'school_admin')) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not coalesce(p_agree, false) then raise exception 'must_agree'; end if;
  if v_no !~ '^[0-9]{6,20}$' then raise exception 'bad_account'; end if;
  if v_id is not null and v_id !~ '^[0-9]{9,12}$' then raise exception 'bad_id'; end if;
  if char_length(trim(coalesce(p_bank, ''))) < 2 or char_length(trim(coalesce(p_account_name, ''))) < 2 then raise exception 'bad_account'; end if;
  insert into public.teacher_wallets (user_id, bank_name, account_no, account_name, id_number, agreed_at, updated_at)
  values (v_uid, left(trim(p_bank), 80), v_no, left(upper(trim(p_account_name)), 80), v_id, now(), now())
  on conflict (user_id) do update set bank_name = excluded.bank_name, account_no = excluded.account_no, account_name = excluded.account_name,
    id_number = excluded.id_number, agreed_at = excluded.agreed_at, updated_at = now();
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_uid, 'teacher_wallet_save', 'wallet', v_uid::text, null);
end;
$$;
revoke all on function public.teacher_wallet_save(text, text, text, text, boolean) from public, anon;
grant execute on function public.teacher_wallet_save(text, text, text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------------------------- Quản trị
-- Ví của mọi thầy cô (chưa vào đợt chi): số tiền, số khoản, đã khai tài khoản chưa
create or replace function public.admin_wallets()
returns table (teacher_id uuid, teacher_name text, school_name text, balance integer, payments integer, has_account boolean,
               bank_name text, account_no text, account_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
  select r.teacher_id, p.display_name,
         (select sc.name from public.user_roles ur join public.schools sc on sc.id = ur.school_id where ur.user_id = r.teacher_id and ur.role = 'teacher' limit 1),
         sum(r.commission)::int, count(*)::int, w.user_id is not null, w.bank_name, w.account_no, w.account_name
  from public.payment_requests r join public.profiles p on p.id = r.teacher_id
  left join public.teacher_wallets w on w.user_id = r.teacher_id
  where public.wallet_open(r)
  group by r.teacher_id, p.display_name, w.user_id, w.bank_name, w.account_no, w.account_name
  order by sum(r.commission) desc;
end;
$$;
revoke all on function public.admin_wallets() from public, anon;
grant execute on function public.admin_wallets() to authenticated;

-- Tạo đợt chi (cuối HK1 / HK2): gom ví các cô ĐÃ KHAI TÀI KHOẢN và có số dư ≥ p_min; khấu trừ thuế theo ngưỡng. Trả mã đợt.
create or replace function public.admin_payout_create(p_label text, p_min integer default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_id uuid; s public.billing_settings; t record; v_tax integer;
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  select * into s from public.billing_settings where id = 1;
  insert into public.payout_batches (label, created_by) values (left(trim(p_label), 80), v_uid) returning id into v_id;
  for t in
    select r.teacher_id, sum(r.commission)::int as gross, count(*)::int as n, w.bank_name, w.account_no, w.account_name, w.id_number
    from public.payment_requests r join public.teacher_wallets w on w.user_id = r.teacher_id
    where public.wallet_open(r)
    group by r.teacher_id, w.bank_name, w.account_no, w.account_name, w.id_number
    having sum(r.commission) >= greatest(coalesce(p_min, 0), 1)
  loop
    v_tax := case when t.gross >= coalesce(s.payout_tax_threshold, 2000000) then floor(t.gross * coalesce(s.payout_tax_pct, 10) / 100.0)::int else 0 end;
    insert into public.payout_items (batch_id, teacher_id, gross, tax, net, payments, bank_name, account_no, account_name, id_number)
    values (v_id, t.teacher_id, t.gross, v_tax, t.gross - v_tax, t.n, t.bank_name, t.account_no, t.account_name, t.id_number);
    update public.payment_requests r set payout_batch = v_id where r.teacher_id = t.teacher_id and public.wallet_open(r);
  end loop;
  if not exists (select 1 from public.payout_items where batch_id = v_id) then
    delete from public.payout_batches where id = v_id;
    raise exception 'nothing_to_pay';
  end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_uid, 'admin_payout_create', 'payout', v_id::text, p_label);
  return v_id;
end;
$$;
revoke all on function public.admin_payout_create(text, integer) from public, anon;
grant execute on function public.admin_payout_create(text, integer) to authenticated;

-- Danh sách đợt chi + các dòng của từng đợt (để xuất file chuyển khoản theo lô)
create or replace function public.admin_payouts()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', b.id, 'label', b.label, 'status', b.status, 'createdAt', b.created_at, 'paidAt', b.paid_at,
      'items', coalesce((select jsonb_agg(jsonb_build_object(
          'teacherId', i.teacher_id, 'teacherName', (select p.display_name from public.profiles p where p.id = i.teacher_id),
          'gross', i.gross, 'tax', i.tax, 'net', i.net, 'payments', i.payments, 'bankName', i.bank_name, 'accountNo', i.account_no,
          'accountName', i.account_name, 'idNumber', i.id_number, 'status', i.status) order by i.net desc)
        from public.payout_items i where i.batch_id = b.id), '[]'::jsonb)
    ) order by b.created_at desc)
    from public.payout_batches b
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_payouts() from public, anon;
grant execute on function public.admin_payouts() to authenticated;

-- Đánh dấu một dòng: 'da_chi' (đã chuyển) | 'giu_lai' (chưa chi, trả các khoản về ví để kỳ sau) | 'cho_chi'
create or replace function public.admin_payout_mark(p_batch uuid, p_teacher uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_status not in ('cho_chi', 'da_chi', 'giu_lai') then raise exception 'bad_status'; end if;
  if exists (select 1 from public.payout_items where batch_id = p_batch and teacher_id = p_teacher and status = 'da_chi') and p_status <> 'da_chi' then
    raise exception 'already_paid';
  end if;
  -- dòng đã "giữ lại" thì các khoản đã về ví (sẽ vào đợt sau) — không đổi lại được, tránh chi hai lần
  if exists (select 1 from public.payout_items where batch_id = p_batch and teacher_id = p_teacher and status = 'giu_lai') then
    raise exception 'held';
  end if;
  update public.payout_items set status = p_status, paid_at = case when p_status = 'da_chi' then now() end
  where batch_id = p_batch and teacher_id = p_teacher;
  if not found then raise exception 'not_found'; end if;
  -- giữ lại: các khoản quay về ví (vào đợt chi sau)
  if p_status = 'giu_lai' then
    update public.payment_requests set payout_batch = null where payout_batch = p_batch and teacher_id = p_teacher;
  end if;
  update public.payout_batches b set status = case when exists (select 1 from public.payout_items i where i.batch_id = b.id and i.status = 'cho_chi') then 'cho_chi' else 'da_chi' end,
    paid_at = case when exists (select 1 from public.payout_items i where i.batch_id = b.id and i.status = 'cho_chi') then null else now() end
  where b.id = p_batch;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_uid, 'admin_payout_mark', 'payout', p_batch::text, p_teacher::text || ' ' || p_status);
end;
$$;
revoke all on function public.admin_payout_mark(uuid, uuid, text) from public, anon;
grant execute on function public.admin_payout_mark(uuid, uuid, text) to authenticated;

-- Huỷ phí cộng tác của một khoản (hoàn tiền cho phụ huynh, nghi gian lận) — chỉ khi khoản đó chưa vào đợt chi
create or replace function public.admin_commission_void(p_payment uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role('system_admin', null) then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.payment_requests set commission_void = true where id = p_payment and status = 'confirmed' and payout_batch is null and commission > 0;
  if not found then raise exception 'not_voidable'; end if;
  insert into public.audit_logs (actor_id, action, target_type, target_id, reason) values (v_uid, 'admin_commission_void', 'payment', p_payment::text, left(coalesce(p_reason, ''), 300));
end;
$$;
revoke all on function public.admin_commission_void(uuid, text) from public, anon;
grant execute on function public.admin_commission_void(uuid, text) to authenticated;
