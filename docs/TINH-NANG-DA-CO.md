# Tính năng đã có — đọc TRƯỚC khi tư vấn / đề xuất tính năng mới

Mục đích: mọi phiên (PC, điện thoại, đám mây) biết app đã làm được gì mà không phải lục mã. Mỗi dòng: tính năng → chỗ mã chính.
**Merge tính năng mới thì thêm / sửa một dòng ở đây** (cùng PR). Ngày cập nhật cuối: 2026-11-25 (sau PR #16).
Trạng thái sản phẩm: đang phát triển, **chưa chạy thật với giáo viên** (chưa có số liệu dùng thật).

## Giáo viên (`src/app/giao-vien/lop/[id]/*`, menu `src/lib/classroom/teacher-nav.ts`)
Menu 2 khu: Soạn & dạy · Lớp chủ nhiệm (+ Của tôi); ghim tối đa 6 / ẩn công cụ ở Hôm nay (`tool-prefs.ts`).
- **Trang chủ giáo viên kiểu dashboard** (11/2026): thanh bên xanh đậm (Tổng quan · Giảng dạy · Quản lý lớp · Cộng đồng & cá nhân), thẻ "Tiết học tiếp theo", 4 ô số liệu, Việc hôm nay · Lịch tuần (đổi tuần) · Lớp học của tôi, Công cụ giảng dạy · Không gian cá nhân; chọn xưng hô Thầy/Cô (cookie `gv-xung-ho`, đổi hình minh hoạ + lời chúc); icon ở `public/brand/dash` — `src/app/giao-vien/page.tsx`, `dash-icons.tsx`, `tdy.css`
- **Lịch báo giảng** theo file mẫu thật (TH Trần Hưng Đạo, khối 1): nhập TKB + PPCT Excel, tổ trưởng dựng LBG — `docs/LICH-BAO-GIANG-QUY-TAC.md`, `src/lib/plans/schedule*.ts`, `LbgBuilder.tsx`, `ScheduleImport.tsx`
- **Giáo án (KHBD, CV 2345)**: tự sinh (loại tiết, YCCĐ đúng bài, câu mẫu thật, phân hoá 3 mức, đánh giá từng hoạt động) — `src/lib/plans/generate.ts`, `lessons.ts`; trợ lý soạn + ngân hàng ý tưởng (không AI) — `assistant.ts`, `idea-bank.ts`
- **Kho giáo án cũ** từ Word của trường (tách theo tiết, đổi phông .VnTime/VNI), xuất Word — `src/lib/plans/library.ts`, `word.ts`, `docx-write.ts`
- **Bài giảng / thao giảng** kiểu Canva: tự sinh từ bài/giáo án, bộ chủ đề, chuyển trang Biến hình, hiệu ứng mặc định 2,5–3,5 s (bấm Tiếp = xong ngay) — `src/components/deck/*`, `src/lib/deck/*` (luật: skill `deck-layout`)
- **Ma trận & đề kiểm tra** (đề A/B, chia câu, điểm theo số tiết đã dạy, mở đề Word có sẵn) — `src/components/exams/*`, `src/lib/exams/*`
- Phiếu bài tập, phiếu chính tả, luyện chữ ô li, kho câu hỏi (nạp Word/Excel/PDF, máy kiểm, cô duyệt), giao bài về nhà, lỗ hổng kiến thức, phòng thi lớp (mã phòng, QR, đấu cặp)
- Trên lớp: bảng trắng, gọi tên – dò bài, hẹn giờ, nhóm & chỗ ngồi, thi đua tổ
- **Nhận xét học sinh** (tuần/kỳ/năm, tự gợi ý, vnEdu) — `CommentsBoard.tsx`; kết quả trên trường (TT27) — `src/lib/classroom/school.ts`; phiếu báo tiến bộ, thư khen, sổ lớp, sổ chủ nhiệm
- Phụ huynh: Liên lạc phụ huynh (tin nhắn + danh bạ), họp phụ huynh (thư mời, điểm danh, biên bản), phòng triển lãm 3D
- **Văn bản & in ấn**: soạn văn bản NĐ30, mở file Word/Excel để chuẩn hoá & in, **In theo lớp** (danh sách lớp + Excel có công thức, trộn thư, nhãn vở, thẻ tên), "Sửa trên trang" — `DocStudio.tsx`, `ClassPrint.tsx`, `src/lib/vanban/*`
- Thêm học sinh: dán thẳng từ vnEdu/Excel (kèm ngày sinh, chỗ ở → hồ sơ) — `ClassManager.tsx`; quỹ lớp; Của tôi: lịch âm dương, thu chi cá nhân, Tiếng Anh sư phạm
- Tắt bằng công tắc (`src/lib/features.ts`): Trợ lý AI (khoá API của GV), Cộng đồng giáo viên

## Học sinh / phụ huynh
- Chọn bài, làm bài (694 bài Toán, TV, TA lớp 1–5; L1–L5; câu của cô), kiến thức cần nhớ, trò chơi trí tuệ, cờ, kỹ năng, tiếng Anh phản xạ, luyện chữ, thế giới của em, thành tích/huy hiệu Cú — `src/app/chon-bai`, `lam-bai`, `hoc-sinh`
- Phụ huynh: theo dõi con, tiện ích gia đình, đóng phí (SePay) — `src/app/phu-huynh`, `docs/SEPAY-TICH-HOP.md`

## Quản trị (`src/app/quan-tri`)
Tổng quan, thông báo, **truy cập** (lượt xem theo đường dẫn — `page_views_hourly`, migration 0049), marketing (UTM), người dùng, duyệt giáo viên, bài học, chương trình, xưởng video, thu phí, nhật ký. Học phí theo học kỳ + ví phí cộng tác của GV.

## Công khai / SEO / giao diện
Thư viện bài học `/hoc` (694 trang tĩnh), robots + sitemap + ảnh chia sẻ + JSON-LD, tên miền chính educhainkids.com (`src/lib/site.ts`; chuyển hướng bật bằng `CANONICAL_REDIRECT=on`), giao diện theo mùa lễ (`src/lib/seasons.ts`).
