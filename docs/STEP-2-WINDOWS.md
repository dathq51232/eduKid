# Bước 2 — Hướng dẫn khởi tạo trên Windows

## A. Cài công cụ

1. Cài Node.js LTS và VS Code hoặc Cursor.
2. Mở PowerShell, chạy `node -v` và `npm -v` để kiểm tra.
3. Giải nén project vào một thư mục dễ nhớ, ví dụ `C:\Projects\educhain-kids-starter`.

## B. Khởi chạy giao diện

```powershell
cd C:\Projects\educhain-kids-starter
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Trang chủ dùng dữ liệu minh họa, chưa có đăng nhập thật.

## C. Tạo Supabase development project

1. Tạo project mới, không dùng production.
2. Sao chép Project URL và publishable/anon key vào `.env.local`.
3. Trong SQL Editor, chạy lần lượt `0001_platform_foundation.sql`, `0002_quiz_security_and_onboarding.sql`, `0003_question_types_and_reports.sql` trong `supabase/migrations/`.
4. Kiểm tra RLS và policy bằng `supabase/tests/0001_security_smoke_test.sql`.
5. Tạo hai tài khoản test phụ huynh, hai tài khoản giáo viên và hai trường giả lập để thử truy cập chéo.

## D. Kiểm tra code

```powershell
npm run typecheck
npm run lint
npm run build
```

Nếu có lỗi, sao chép toàn bộ thông báo lỗi vào AI coding assistant và yêu cầu sửa tối thiểu, giải thích file thay đổi, sau đó chạy lại các lệnh.

## E. Không làm ở bước này

- Không kết nối blockchain hoặc ví.
- Không nhập dữ liệu học sinh thật.
- Không đưa service role key vào `.env.local` dưới tên `NEXT_PUBLIC_*`.
- Không bật public access cho bảng học sinh, phụ huynh, câu trả lời hoặc chứng nhận.
