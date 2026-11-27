# Tính năng đã có — đọc TRƯỚC khi tư vấn / đề xuất tính năng mới

Mục đích: mọi phiên (PC, điện thoại, đám mây) biết app đã làm được gì mà không phải lục mã. Mỗi dòng: tính năng → chỗ mã chính.
**Merge tính năng mới thì thêm / sửa một dòng ở đây** (cùng PR). Ngày cập nhật cuối: 2026-11-27 (trang chủ bố cục mới).
Trạng thái sản phẩm: đang phát triển, **chưa chạy thật với giáo viên** (chưa có số liệu dùng thật).

## Giáo viên (`src/app/giao-vien/lop/[id]/*`, menu `src/lib/classroom/teacher-nav.ts`)
Menu 2 khu: Soạn & dạy · Lớp chủ nhiệm (+ Của tôi); ghim tối đa 6 / ẩn công cụ ở Hôm nay (`tool-prefs.ts`).
- **Trang chủ giáo viên kiểu dashboard** (11/2026): thanh bên xanh đậm (Tổng quan · Giảng dạy · Quản lý lớp · Cộng đồng & cá nhân), thẻ "Tiết học tiếp theo", 4 ô số liệu, Việc hôm nay · Lịch tuần (đổi tuần) · Lớp học của tôi, Công cụ giảng dạy · Không gian cá nhân; chọn xưng hô Thầy/Cô (cookie `gv-xung-ho`, đổi hình minh hoạ + lời chúc); icon ở `public/brand/dash` — `src/app/giao-vien/page.tsx`, `dash-icons.tsx`, `tdy.css`
- **Thanh trên trang chủ giáo viên** (11/2026): Chia sẻ app; chuông thông báo (tin phụ huynh chưa xem + sinh nhật học sinh trong 3 ngày, có việc mới thì đổi màu, lắc nhẹ) — `TeacherBell.tsx`; bấm ảnh đại diện → **Thông tin cá nhân** `/giao-vien/ca-nhan` (họ tên, xưng hô, điện thoại / ngày sinh / công việc lưu ở user_metadata, hồ sơ chuyên môn Cộng đồng; thêm / sửa / xoá) — `TeacherProfileForm.tsx`, `cn.css`
- **Lịch báo giảng** theo file mẫu thật (TH Trần Hưng Đạo, khối 1): nhập TKB + PPCT Excel, tổ trưởng dựng LBG — `docs/LICH-BAO-GIANG-QUY-TAC.md`, `src/lib/plans/schedule*.ts`, `LbgBuilder.tsx`, `ScheduleImport.tsx`
- **Giáo án (KHBD, CV 2345)**: tự sinh (loại tiết, YCCĐ đúng bài, câu mẫu thật, phân hoá 3 mức, đánh giá từng hoạt động) — `src/lib/plans/generate.ts`, `lessons.ts`; trợ lý soạn + ngân hàng ý tưởng (không AI) — `assistant.ts`, `idea-bank.ts`
- **Kho giáo án cũ** từ Word của trường (tách theo tiết, đổi phông .VnTime/VNI), xuất Word — `src/lib/plans/library.ts`, `word.ts`, `docx-write.ts`
- **Bài giảng / thao giảng** kiểu Canva: tự sinh từ bài/giáo án, bộ chủ đề, chuyển trang Biến hình, hiệu ứng mặc định 2,5–3,5 s (bấm Tiếp = xong ngay) — `src/components/deck/*`, `src/lib/deck/*` (luật: skill `deck-layout`)
- **Ma trận & đề kiểm tra** (đề A/B, chia câu, điểm theo số tiết đã dạy, mở đề Word có sẵn) — `src/components/exams/*`, `src/lib/exams/*`
- Phiếu bài tập, phiếu chính tả, luyện chữ ô li, kho câu hỏi (nạp Word/Excel/PDF, máy kiểm, cô duyệt), giao bài về nhà, lỗ hổng kiến thức, phòng thi lớp (mã phòng, QR, đấu cặp; tuỳ chọn **xếp đề theo dạng, dễ → khó** — chọn → điền → nối → xếp nhóm ~60/15/15/10%, mặc định bật cho Tiếng Việt — `matrix.layout = 'dang'`, xem `docs/PHAN-TICH-DE-TRANG-NGUYEN.md`)
- Trên lớp: bảng trắng, gọi tên – dò bài, hẹn giờ, nhóm & chỗ ngồi, thi đua tổ
- **Nhận xét học sinh** (tuần/kỳ/năm, tự gợi ý, vnEdu) — `CommentsBoard.tsx`; kết quả trên trường (TT27) — `src/lib/classroom/school.ts`; phiếu báo tiến bộ, thư khen, sổ lớp, sổ chủ nhiệm
- Phụ huynh: Liên lạc phụ huynh (tin nhắn + danh bạ), họp phụ huynh (thư mời, điểm danh, biên bản), phòng triển lãm 3D
- **Văn bản & in ấn**: soạn văn bản NĐ30, mở file Word/Excel để chuẩn hoá & in, **In theo lớp** (danh sách lớp + Excel có công thức, trộn thư, nhãn vở, thẻ tên), "Sửa trên trang" — `DocStudio.tsx`, `ClassPrint.tsx`, `src/lib/vanban/*`
- Thêm học sinh: dán thẳng từ vnEdu/Excel (kèm ngày sinh, chỗ ở → hồ sơ) — `ClassManager.tsx`; quỹ lớp; Của tôi: lịch âm dương, thu chi cá nhân, Tiếng Anh sư phạm
- Tắt bằng công tắc (`src/lib/features.ts`): Trợ lý AI (khoá API của GV), Cộng đồng giáo viên

## Học sinh / phụ huynh
- Chọn bài, làm bài (694 bài Toán, TV, TA lớp 1–5; L1–L5; câu của cô), kiến thức cần nhớ, trò chơi trí tuệ, cờ, kỹ năng, tiếng Anh phản xạ, luyện chữ, thế giới của em, thành tích/huy hiệu Cú — `src/app/chon-bai`, `lam-bai`, `hoc-sinh`
- Phụ huynh: theo dõi con, tiện ích gia đình, đóng phí (SePay) — `src/app/phu-huynh`, `docs/SEPAY-TICH-HOP.md`
- **Trang phụ huynh kiểu dashboard** (11/2026): thanh bên xanh đậm (Tổng quan, Tiến độ, Bài cô giao, Lịch, Thành tích, Tin nhắn, Nhắn cô, Gia đình; điện thoại dùng thanh trên), lời chào + tranh, thẻ con + 4 số liệu, Tiến độ học tập (theo môn + biểu đồ tuần), Đề xuất cho con (theo quy tắc, không AI), Lịch tuần, Bài cô giao (Chưa làm / Quá hạn / Đã làm), Tin nhắn từ cô, Thành tích (lời khen ★ của cô); các hàng thẻ cao bằng nhau, thanh menu có nút thu gọn (nhớ trên máy), Thanh toán mở khung QR — `src/app/phu-huynh/page.tsx`, `src/styles/phx.css`, `SideToggle.tsx`, `PayDialog.tsx`
- **Gói gia đình tối đa 4 con** (11/2026): phụ huynh tự thêm tối đa 4 con học tại nhà (con ở lớp trường liên kết bằng mã mời không tính), trần chung 6 liên kết — `supabase/migrations/0083_family_max_4_children.sql`, `FamilyPanel.tsx`, `api/hoc-sinh/gia-dinh`
- **Xác nhận học phí** (11/2026): phụ huynh lấy mã QR → chuyển khoản → bấm "Tôi đã chuyển khoản" (báo chuông Quản trị); quản trị đối chiếu sao kê, bấm Xác nhận ở *Quản trị → Thu phí* (khoản đã báo chuyển khoản lên đầu) → em học đủ chức năng ngay, kể cả khi gói miễn phí của cô hết chỗ; Góc phụ huynh hiện "đang chờ xác nhận" / "đã nhận học phí" — `supabase/migrations/0084_payment_confirm_flow.sql`, `PaymentPanel.tsx`, `TuitionCard.tsx`, `BillingAdmin.tsx`

## Quản trị (`src/app/quan-tri`)
Tổng quan, thông báo, **truy cập** (lượt xem theo đường dẫn — `page_views_hourly`, migration 0049), marketing (UTM), người dùng, duyệt giáo viên, bài học, chương trình, xưởng video, thu phí, nhật ký. Học phí theo học kỳ + ví phí cộng tác của GV.

## Công khai / SEO / giao diện
- **Trang chủ công khai bố cục mới** (11/2026): hero 2 cột (Milo gốc + 2 bạn nhỏ), thẻ môn màu lớn có nhân vật, trò chơi thẻ ngang pastel, Hệ sinh thái 3 vai (thầy cô · học sinh · phụ huynh), báo cáo tiến độ *ví dụ minh hoạ*, dải CTA vàng; nhân vật vẽ lại bằng Canva AI, nền trong suốt ở `public/brand/home` — `src/app/page.tsx`, `src/styles/hm.css`
Thư viện bài học `/hoc` (694 trang tĩnh), robots + sitemap + ảnh chia sẻ + JSON-LD, tên miền chính educhainkids.com (`src/lib/site.ts`; chuyển hướng bật bằng `CANONICAL_REDIRECT=on`), giao diện theo mùa lễ (`src/lib/seasons.ts`).
