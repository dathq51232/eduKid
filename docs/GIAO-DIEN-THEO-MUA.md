# Giao diện theo mùa lễ (Noel, Tết, 20/10, 20/11, Trung Thu…)

Tự bật đúng ngày mỗi năm (kể cả ngày âm lịch), không cần sửa mã hay triển khai lại.

## Thành phần
| File | Vai trò |
|---|---|
| `src/lib/seasons.ts` | **Danh sách mùa duy nhất**: khung ngày, độ ưu tiên, hiệu ứng, hình 3D, lời chào của Milo cho học sinh / giáo viên / phụ huynh |
| `src/lib/season-ranges.ts` | (máy chủ) Đổi khung ngày ra ngày dương cụ thể cho vài năm, tạo script gắn `data-season` lên `<html>` trước khi trang hiện |
| `src/lib/use-season.ts` | Hook `useSeason()`, `useSeasonFx()`, `setSeasonFx()` |
| `src/components/season/SeasonLayer.tsx` | Hạt rơi (tuyết, cánh hoa, pháo giấy, đèn lồng) + nút mùa góc trái dưới kèm lời chào |
| `src/styles/ssn.css` | Màu nhấn theo mùa (chỉ đổi `--brand-coral/green/yellow`, không đổi xanh chủ đạo) + hoạt ảnh |
| `KidWorld.tsx` | Thêm đồ vật trôi của mùa vào "Thế giới của em" (giữ chủ đề em đã chọn) |

## Lịch hiện có
20/10 (15–20/10) · 20/11 (10–20/11) · Noel (14–26/12) · Năm mới (30/12–2/1) · Tết (23 tháng Chạp → mùng 10 tháng Giêng âm) · Trung Thu (8–15/8 âm). Trùng ngày: mùa `priority` cao hơn thắng.

## Thêm mùa mới (≈15 phút)
1. Thêm `SeasonId` và một mục vào `SEASONS` (`window.lunar: true` nếu là ngày âm).
2. (Tuỳ chọn) thêm khối `html:root[data-season="<id>"] { … }` trong `ssn.css`.
3. Chọn hình trong `public/emoji/f3d`.
4. Xem trước: `/?mua=<id>` → kiểm tra → `npx tsc --noEmit -p .`, `npx eslint src/lib src/components/season`.

## Điều khiển
- Xem trước / chụp ảnh Marketing: thêm `?mua=<id>` (giữ suốt phiên); `?mua=auto` quay về tự động; `?mua=off` tắt trong phiên.
- Tắt hẳn toàn hệ thống: `NEXT_PUBLIC_SEASON=off` (Vercel → Environment Variables → Redeploy). Ép bật một mùa: `NEXT_PUBLIC_SEASON=noel`.
- Người dùng: bấm nút mùa ở góc → "Tắt hiệu ứng" (lưu trên máy). Máy đặt giảm chuyển động thì mặc định tắt.
- Không vẽ hạt rơi ở màn làm bài, trình chiếu, khi in.

## Lưu ý bản sắc
Lời chào theo giọng Milo (gọi học sinh là “em”). Con giáp chỉ dùng để trang trí Tết, không đặt tên dạng bài theo con giáp.
