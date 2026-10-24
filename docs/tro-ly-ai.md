# Trợ lý AI cho giáo viên — mô hình "tự mang key" (BYOK)

Thầy cô dán API key của riêng mình (Google Gemini — miễn phí, hoặc OpenAI GPT — tính phí) vào ô Cài đặt API trong khung giáo viên. Key được máy chủ **mã hoá AES-256-GCM** rồi lưu; không bao giờ trả về trình duyệt. Mỗi lượt hỏi, máy chủ giải mã key, gọi nhà cung cấp, rồi trả lời — chi phí và hạn mức thuộc về API key của chính thầy cô, hệ thống không trung gian tính tiền.

## Bật tính năng cần làm gì

1. **Chạy migration `supabase/migrations/0030_ai_assistant_byok.sql`** trong SQL Editor của Supabase (tạo bảng `teacher_ai_keys`, `ai_usage` và hàm `my_ai_key_status()`).
2. **Đặt biến môi trường máy chủ** (Vercel → Settings → Environment Variables, hoặc `.env.local` khi dev):
   - `AI_KEY_ENCRYPTION_SECRET` — chuỗi bí mật ngẫu nhiên ≥ 32 ký tự (ví dụ sinh bằng `openssl rand -hex 32`). Đổi chuỗi này = các key đã lưu hết hiệu lực, thầy cô phải dán lại.
   - Không cần key AI nào của hệ thống — mỗi thầy cô dùng key của mình.
3. **Redeploy.** Nút Trợ lý AI (✨) xuất hiện góc phải trên khung giáo viên, phía trên ô Hẹn giờ.
4. Muốn tắt toàn bộ: `NEXT_PUBLIC_FEATURE_TRO_LY_AI=off` rồi Redeploy.

## Thầy cô dùng thế nào

1. Bấm nút ✨ góc phải → lần đầu mở, phần **Cài đặt API** tự mở ra.
2. Lấy key Gemini miễn phí tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Create API key → copy). Dán vào ô Gemini → **Lưu & kiểm tra key**. Máy chủ gọi danh sách model của Google để xác thực và chọn model flash phù hợp (ưu tiên `gemini-2.5-flash`).
3. Muốn dùng GPT: lấy key tại [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (tài khoản phải có credit), dán vào ô OpenAI. Máy chủ ưu tiên `gpt-4o-mini`.
4. Có thể nối cả hai và chọn **Dùng mặc định**; đổi nhà cung cấp nhanh bằng nút Gemini / GPT ở thanh tiêu đề.
5. Hỏi tự do: soạn giáo án, ra câu hỏi, viết nhận xét, gợi ý trò chơi… Nút khoá 🔑 mở lại phần cài đặt để gỡ key (Trash) bất cứ lúc nào.

## Bảo mật & hạn mức

- Key nằm trong bảng `teacher_ai_keys`, **chỉ service_role đọc được** (anon/authenticated bị `revoke all`). Trình duyệt chỉ biết "đã nối / chưa nối" qua RPC `my_ai_key_status()`.
- Lưu mã hoá AES-256-GCM với khóa suy ra từ `AI_KEY_ENCRYPTION_SECRET` (`src/lib/ai/crypto.ts`, định dạng `v1:iv:tag:cipher`).
- Chat không lưu nội dung hội thoại trên máy chủ — các lượt gần nhất do trình duyệt thầy cô giữ.
- Nhật ký gọi AI (`ai_usage`): mỗi lượt thành công ghi 1 dòng, dùng để chặn vượt **150 lượt/ngày/giáo viên** và giới hạn 12 câu / 5 phút (`src/lib/rate-limit.ts`).
- Route chỉ cho giáo viên/admin đã đăng nhập (`getViewer()`); trả lời của AI mang tính gợi ý, hệ thống luôn nhắc thầy cô rà soát trước khi dùng chính thức.

## Kiến trúc

| Thành phần | File | Vai trò |
|---|---|---|
| Migration | `supabase/migrations/0030_ai_assistant_byok.sql` | Bảng key + nhật ký + RPC trạng thái |
| Mã hoá | `src/lib/ai/crypto.ts` | AES-256-GCM encrypt/decrypt |
| Gọi model | `src/lib/ai/providers.ts` | REST Gemini + OpenAI: kiểm tra key, chọn model, chat |
| Key theo giáo viên | `src/lib/ai/teacher-keys.ts` | Nạp/lưu/gỡ key, đếm hạn mức ngày |
| Prompt | `src/lib/ai/prompt.ts` | System prompt bám GDPT 2018 + nguyên tắc "không vượt trước" |
| API | `src/app/api/ai/keys/route.ts`, `src/app/api/ai/chat/route.ts` | Lưu/kiểm tra/gỡ key; hội thoại |
| Giao diện | `src/components/classroom/AiAssistant.tsx` + CSS `.aiw*` trong `globals.css` | Nút nổi, bảng chat, form 2 ô key |
| Cờ tính năng | `src/lib/features.ts` → `FEATURES.ai` | Bật/tắt bằng `NEXT_PUBLIC_FEATURE_TRO_LY_AI` |

## Hạn chế đã biết & bước kế tiếp

- Chưa stream từng chữ (đổi đáp án sau 5–30 giây); nên thêm streaming khi tích hợp sâu hơn.
- Trợ lý chưa đọc được dữ liệu lớp (điểm, lỗ hổng) — bước kế tiếp: gắn ngữ cảnh lớp qua RPC có sẵn, rồi thêm nút "Viết bằng AI" trong Nhận xét học sinh và Soạn giáo án.
- Model "miễn phí" của Gemini có hạn mức số lượt mỗi phút/ngày của Google — gặp lỗi 429 thì đợi chút rồi hỏi tiếp (thông báo đã có sẵn).
