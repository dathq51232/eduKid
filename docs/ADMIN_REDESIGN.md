# Thiết kế lại trang Quản trị (`/quan-tri`) — bản demo

> ✅ **Đã làm (11/11/2026): mục 1–6.** Cần chạy `supabase/migrations/0049_admin_insights.sql` trên Supabase (SQL Editor) để có số liệu,
> thông báo và lượt truy cập; chưa chạy thì trang Tổng quan vẫn hiện phần nội dung cũ kèm lời nhắc.
> Mặc định đã chọn: menu bên trái; "Người dùng mới" gồm cả học sinh do giáo viên tạo (lọc được); chưa gửi email/Zalo;
> thẻ Doanh thu chỉ hiện khi bật tính năng thu phí.
> Mục tiêu: admin mở trang là thấy ngay **ai mới đăng ký**, **bao nhiêu người đang vào app**, **việc cần xử lý** (duyệt giáo viên, duyệt bài, thanh toán).

---

## 1. Bố cục tổng thể (máy tính)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ EduChain Kids · Quản trị                [🔍 Tìm người dùng, bài học…]    🔔 12   👤 Admin ▾ │
├───────────────┬──────────────────────────────────────────────────────────────────────────┤
│ ▣ Tổng quan   │  Chào buổi sáng, Admin 👋                       [Hôm nay ▾] [7 ngày] [30 ngày] │
│ 🔔 Thông báo 12│                                                                          │
│ 📈 Truy cập    │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│ 👥 Người dùng  │  │ Đang online│ │ Lượt truy  │ │ Người dùng │ │ Lượt làm   │ │ Doanh thu  ││
│ 🧑‍🏫 Giáo viên 3│  │    ● 47    │ │ cập hôm nay│ │ mới hôm nay│ │ bài hôm nay│ │ tháng này  ││
│ 📚 Bài học     │  │ HS 38 · GV 9│ │   1 284    │ │    23      │ │    612     │ │  4,2 tr ₫  ││
│ 🗂 Chương trình│  │            │ │ ▲ 12% hôm qua│ │ ▲ 5 hôm qua │ │ đúng 78%   │ │ 14 gói mới ││
│ 💳 Thu phí     │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│ 📜 Nhật ký     │                                                                          │
│               │  ┌───────────────────────────────────────────┐ ┌────────────────────────┐ │
│ ───────────── │  │ 📈 Lượt truy cập 7 ngày                     │ │ ⚡ Việc cần xử lý       │ │
│ ⚙ Cài đặt      │  │                                   ▇        │ │                        │ │
│               │  │                         ▅    ▆    █        │ │ 🧑‍🏫 3 giáo viên chờ duyệt│ │
│               │  │               ▃    ▅    █    █    █        │ │        [Duyệt ngay →]  │ │
│               │  │     ▂    ▃    █    █    █    █    █        │ │ 📝 5 bài chờ duyệt      │ │
│               │  │  T2   T3   T4   T5   T6   T7   CN          │ │        [Xem →]         │ │
│               │  │  ━ Lượt xem trang  ━ Người dùng duy nhất   │ │ 💳 2 thanh toán chờ xác │ │
│               │  └───────────────────────────────────────────┘ │    nhận   [Xem →]      │ │
│               │                                                │ ⚠ 1 báo lỗi nội dung    │ │
│               │  ┌───────────────────────────────────────────┐ └────────────────────────┘ │
│               │  │ 🆕 Người dùng mới                 [Xem tất cả]│ ┌────────────────────────┐ │
│               │  │ ● Nguyễn Minh Anh  Học sinh lớp 3   5 phút │ │ 🔥 Trang được xem nhiều │ │
│               │  │ ● Cô Trần Thu Hà   Giáo viên ⏳chờ  18 phút│ │ 1. Chọn bài      38%   │ │
│               │  │ ● Lê Văn Bình      Phụ huynh        1 giờ  │ │ 2. Làm bài       27%   │ │
│               │  │ ● Phạm Gia Huy     Học sinh lớp 1   2 giờ  │ │ 3. Tiếng Anh     11%   │ │
│               │  │ ● Đỗ Thảo My       Học sinh lớp 5   3 giờ  │ │ 4. Trò chơi       9%   │ │
│               │  └───────────────────────────────────────────┘ │ 5. Giáo viên      8%   │ │
│               │                                                └────────────────────────┘ │
└───────────────┴──────────────────────────────────────────────────────────────────────────┘
```

**Thay đổi so với hiện tại**
- Menu chuyển sang **thanh bên trái**, có **số đếm** (🔔 12, 🧑‍🏫 3) để thấy ngay việc chưa làm.
- Thêm 2 mục mới: **Thông báo**, **Truy cập**.
- Thẻ số liệu đầu trang ưu tiên **người dùng & truy cập**. Các số về nội dung (độ phủ, YCCĐ) chuyển sang trang Chương trình.
- Cột phải là **Việc cần xử lý**: bấm một lần là tới đúng chỗ.

---

## 2. Chuông thông báo (bấm 🔔 ở thanh trên)

```
                                         ┌──────────────────────────────────────┐
                                         │ Thông báo            [Đánh dấu đã đọc]│
                                         │ [Tất cả] [Người dùng] [Giáo viên] [Thu phí]│
                                         ├──────────────────────────────────────┤
                                         │ ● 🆕 Nguyễn Minh Anh vừa đăng ký      │
                                         │      Học sinh · Lớp 3 · 5 phút trước  │
                                         │ ● 🧑‍🏫 Cô Trần Thu Hà xin quyền giáo viên│
                                         │      TH Kim Đồng · 18 phút  [Duyệt]   │
                                         │ ● 💳 Gia đình Lê Văn Bình mua gói năm  │
                                         │      990 000 ₫ · 1 giờ trước          │
                                         │ ○ 📝 Bài "Toán 3 – Bài 12" chờ duyệt   │
                                         │      Thầy Nam gửi · hôm qua           │
                                         │ ○ 📈 Truy cập hôm qua tăng 35%         │
                                         │      Cao nhất 20:00–21:00             │
                                         ├──────────────────────────────────────┤
                                         │            Xem tất cả thông báo →     │
                                         └──────────────────────────────────────┘
   ● chưa đọc   ○ đã đọc
```

**Loại thông báo**

| Loại | Khi nào | Bấm vào thì |
|---|---|---|
| 🆕 Người dùng mới | Có tài khoản mới (học sinh / phụ huynh / giáo viên) | Mở hồ sơ người đó |
| 🧑‍🏫 Xin quyền giáo viên | Giáo viên đăng ký, chờ duyệt | Nút **Duyệt / Từ chối** ngay trong thông báo |
| 💳 Thanh toán | Gói mới, gia hạn, thanh toán lỗi | Mở trang Thu phí |
| 📝 Bài chờ duyệt | Giáo viên gửi bài để duyệt | Mở bài |
| 📈 Bất thường | Truy cập tăng hoặc giảm > 30% so với tuần trước | Mở trang Truy cập |

> Số trên chuông tự cập nhật mỗi **60 giây**, chỉ khi tab đang mở (không làm chậm máy).
> Có thể bật thêm **gửi qua email hoặc Zalo** cho admin (giai đoạn sau).

---

## 3. Trang Thông báo (`/quan-tri/thong-bao`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔔 Thông báo                                        [Đánh dấu tất cả đã đọc] │
│ [Tất cả 128] [Chưa đọc 12] [Người dùng] [Giáo viên] [Thu phí] [Nội dung]     │
├──────────────────────────────────────────────────────────────────────────────┤
│ HÔM NAY                                                                      │
│ ● 🆕 Nguyễn Minh Anh — Học sinh lớp 3 — đăng ký bằng mã lớp 3A2   09:12      │
│ ● 🧑‍🏫 Trần Thu Hà — xin quyền giáo viên — TH Kim Đồng  [Duyệt] [Từ chối] 08:55 │
│ ● 💳 Lê Văn Bình — mua Gói gia đình 1 năm — 990 000 ₫              08:01      │
│ HÔM QUA                                                                      │
│ ○ 🆕 5 học sinh mới vào lớp 1A (Cô Lan)                            [Xem 5]   │
│ ○ 📝 "Toán 3 – Bài 12" chờ duyệt — Thầy Nam                        16:40     │
│ …                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Gộp thông báo cùng loại: "5 học sinh mới vào lớp 1A" thay vì 5 dòng riêng.

---

## 4. Trang Truy cập (`/quan-tri/truy-cap`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📈 Truy cập                              [Hôm nay] [7 ngày] [30 ngày] [Năm]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│ │Lượt xem   │ │Người dùng │ │Thời gian  │ │Đang online│ │Thiết bị   │        │
│ │trang      │ │duy nhất   │ │học TB     │ │   ● 47    │ │📱 71%     │        │
│ │  8 930    │ │  1 412    │ │ 14 phút   │ │           │ │💻 29%     │        │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
│                                                                              │
│ Lượt truy cập theo ngày                                                      │
│  1 500 ┤                                              ╭─╮                    │
│  1 000 ┤                 ╭──╮          ╭───╮      ╭───╯ ╰╮                   │
│    500 ┤  ╭──╮   ╭───────╯  ╰──╮  ╭────╯   ╰──────╯      ╰─                  │
│      0 ┼──┴──┴───┴─────────────┴──┴─────────────────────────                 │
│         1/11            8/11             15/11            22/11              │
│   ━ Học sinh   ━ Giáo viên   ━ Phụ huynh   ┈ Khách (chưa đăng nhập)          │
│                                                                              │
│ Giờ cao điểm (7 ngày)                     Theo khối lớp                       │
│      0h  4h  8h  12h 16h 20h              Lớp 1 ████████████ 31%             │
│  T2  ░░  ░░  ▒▒  ▒▒  ▓▓  ██               Lớp 2 ████████     22%             │
│  T3  ░░  ░░  ▒▒  ▒▒  ▓▓  ██               Lớp 3 ██████       17%             │
│  …                                        Lớp 4 █████        15%             │
│  CN  ░░  ░░  ▓▓  ▓▓  ▓▓  ▓▓               Lớp 5 █████        15%             │
│                                                                              │
│ Trang được xem nhiều        Lượt   │  Môn học được học nhiều      Lượt làm bài │
│ /chon-bai                  3 391   │  Toán                         2 840       │
│ /lam-bai                   2 410   │  Tiếng Việt                   1 960       │
│ /tieng-anh                   982   │  Tiếng Anh                    1 310       │
│ /tro-choi                    804   │  Chuyên đề nâng cao  🆕          422       │
│                                    │                       [Xuất Excel ⬇]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Trang Người dùng (làm lại)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 👥 Người dùng (2 413)                                    [+ Thêm] [Xuất CSV] │
│ [🔍 Tên, email, mã HS…]  Vai trò [Tất cả ▾]  Lớp [Tất cả ▾]  [🆕 Mới 7 ngày] │
├────┬──────────────────┬───────────┬──────┬──────────────┬───────────┬────────┤
│    │ Tên              │ Vai trò   │ Lớp  │ Đăng ký      │ Lần cuối  │ Gói    │
├────┼──────────────────┼───────────┼──────┼──────────────┼───────────┼────────┤
│ 🆕 │ Nguyễn Minh Anh  │ Học sinh  │ 3    │ hôm nay 09:12│ ● online  │ Dùng thử│
│ 🆕 │ Trần Thu Hà      │ Giáo viên ⏳│ —   │ hôm nay 08:55│ 20 phút   │ —      │
│    │ Lê Văn Bình      │ Phụ huynh │ —    │ 12/11        │ 1 giờ     │ Năm ✓  │
│    │ …                │           │      │              │           │        │
└────┴──────────────────┴───────────┴──────┴──────────────┴───────────┴────────┘
  Bấm một dòng → khung bên phải: hồ sơ, lớp đang học, bài gần nhất, lịch sử gói, [Khóa] [Đổi vai trò]
```

---

## 6. Trên điện thoại

```
┌──────────────────────────┐
│ ☰  Quản trị       🔔 12  │
├──────────────────────────┤
│ ● 47 đang online          │
│ ┌──────────┐┌──────────┐ │
│ │Truy cập  ││Người mới │ │
│ │ 1 284    ││   23     │ │
│ │▲12%      ││▲5        │ │
│ └──────────┘└──────────┘ │
│ ┌──────────┐┌──────────┐ │
│ │Làm bài   ││Doanh thu │ │
│ │  612     ││ 4,2 tr   │ │
│ └──────────┘└──────────┘ │
│ ⚡ Việc cần xử lý         │
│ 🧑‍🏫 3 GV chờ duyệt   →   │
│ 📝 5 bài chờ duyệt   →   │
│ 🆕 Người dùng mới         │
│ ● Minh Anh · HS lớp 3    │
│ ● Cô Thu Hà · GV ⏳      │
│ [Xem tất cả]             │
└──────────────────────────┘
```

---

## 7. Dữ liệu cần thêm (để duyệt kỹ thuật)

| Phần | Lấy từ đâu | Ghi chú |
|---|---|---|
| Người dùng mới | Có sẵn: `profiles.created_at` + `user_roles` + `students` | Không cần bảng mới |
| GV chờ duyệt, bài chờ duyệt | Có sẵn (trang Giáo viên, Bài học) | Chỉ đếm và đưa lên |
| Thanh toán | Có sẵn (Thu phí) | |
| **Thông báo** | **Bảng mới** `admin_notifications` (loại, nội dung, đường dẫn, đã đọc) | Ghi tự động bằng trigger khi có người dùng mới / GV xin quyền / thanh toán |
| **Lượt truy cập** | **Bảng mới** `page_views_daily` (ngày, giờ, trang, vai trò, khối, thiết bị, số lượt) | **Gộp theo giờ, không lưu IP hay tên** → nhẹ, đúng quy định bảo vệ dữ liệu trẻ em |
| Người dùng duy nhất | Mã ẩn danh đổi mỗi ngày (băm), chỉ để đếm | Không truy ngược được người dùng |
| Đang online | Đếm phiên có hoạt động trong 5 phút gần nhất | Cập nhật mỗi 60 giây |

- Ghi lượt truy cập: mỗi lần **đổi trang** gửi 1 tín hiệu nhỏ (gộp, không gửi liên tục). Không dùng dịch vụ theo dõi của bên ngoài.
- RLS: chỉ **admin** đọc được hai bảng mới.

---

## 8. Kế hoạch làm (đề xuất)

| Giai đoạn | Nội dung | Ước lượng |
|---|---|---|
| 1 | Bố cục mới (thanh bên, thẻ số liệu, Việc cần xử lý, Người dùng mới), dùng dữ liệu có sẵn | 1 lượt |
| 2 | Bảng `admin_notifications` + chuông 🔔 + trang Thông báo | 1 lượt |
| 3 | Ghi lượt truy cập ẩn danh + trang Truy cập (biểu đồ, giờ cao điểm, xuất Excel) | 1–2 lượt |
| 4 | (Tuỳ chọn) Gửi thông báo qua email hoặc Zalo, báo cáo tuần tự động | sau |

---

## 9. Cần bạn chọn

1. Thanh menu: **bên trái** (như bản vẽ) hay giữ **thanh ngang** như hiện tại?
2. "Người dùng mới" có tính **học sinh do giáo viên tạo trong lớp** không, hay chỉ tài khoản tự đăng ký?
3. Có cần **thông báo qua email / Zalo** cho admin không?
4. Thẻ **Doanh thu** có hiện ở trang Tổng quan không (hay chỉ ở trang Thu phí)?
