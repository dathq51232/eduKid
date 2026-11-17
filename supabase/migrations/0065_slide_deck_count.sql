-- Số trang của bài thao giảng, tính sẵn trong database (cột sinh tự động).
-- Trang Kế hoạch bài dạy / Bài giảng & 3D trước đây phải tải TOÀN BỘ nội dung slide của tới 200 bài chỉ để đếm số trang
-- (có thể vài MB mỗi lần mở trang). Có cột này thì chỉ cần đọc một con số. Chạy lại nhiều lần không sao.
alter table public.slide_decks
  add column if not exists slide_count integer
  generated always as (case when jsonb_typeof(data -> 'slides') = 'array' then jsonb_array_length(data -> 'slides') end) stored;
