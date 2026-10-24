-- 0030 · Trợ lý AI cho giáo viên — mô hình "tự mang key" (BYOK)
-- Thầy cô tự dán API key OpenAI / Google Gemini của mình trong ứng dụng; key được mã hoá AES-256-GCM
-- ở tầng ứng dụng (biến môi trường AI_KEY_ENCRYPTION_SECRET) trước khi lưu.
-- Hai bảng dưới đây CHỈ máy chủ (service_role) được đọc/ghi: anon/authenticated bị thu toàn bộ quyền,
-- nên key không bao giờ trả về trình duyệt. Trạng thái "đã nối key chưa" lấy qua RPC my_ai_key_status().

-- Key AI của từng giáo viên (1 dòng mỗi tài khoản).
create table if not exists public.teacher_ai_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  openai_key_enc text,          -- key OpenAI đã mã hoá (null = chưa nối)
  openai_model text,            -- model đã chọn khi kiểm tra key (vd gpt-4o-mini)
  gemini_key_enc text,          -- key Gemini đã mã hoá (null = chưa nối)
  gemini_model text,            -- model đã chọn khi kiểm tra key (vd gemini-2.5-flash)
  preferred text not null default 'gemini' check (preferred in ('openai', 'gemini')),
  updated_at timestamptz not null default now()
);
revoke all on public.teacher_ai_keys from anon, authenticated;

-- Nhật ký mỗi lần gọi AI: để đếm hạn mức trong ngày và (sau này) xem trên trang Nhật ký.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,       -- openai | gemini
  model text not null,
  task text not null,           -- chat | ...
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);
revoke all on public.ai_usage from anon, authenticated;
create index if not exists ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);

-- Trạng thái key của chính người đang đăng nhập: chỉ trả có/không và lựa chọn ưu tiên, không trả key.
create or replace function public.my_ai_key_status()
returns table (has_openai boolean, has_gemini boolean, preferred text)
language sql security definer set search_path = public as $$
  select k.openai_key_enc is not null, k.gemini_key_enc is not null, k.preferred
  from public.teacher_ai_keys k
  where k.user_id = auth.uid();
$$;
revoke all on function public.my_ai_key_status() from public, anon;
grant execute on function public.my_ai_key_status() to authenticated;
