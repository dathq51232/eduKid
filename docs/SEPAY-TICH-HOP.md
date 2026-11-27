# Tích hợp SePay — tự xác nhận học phí (kế hoạch, CHƯA LÀM)

> Ghi lại 22/11/2026. Khi bắt đầu làm: đọc file này, **xem lại bảng giá trên sepay.vn** (giá dưới đây có thể đã đổi),
> rồi làm theo mục 4–6. Trạng thái hiện tại của app: phụ huynh chuyển khoản theo mã QR có nội dung `EDKxxxxxx`,
> quản trị đối chiếu sao kê rồi bấm **Xác nhận** tay ở *Quản trị → Thu phí* (từ 0084: phụ huynh bấm "Tôi đã chuyển khoản" để báo quản trị; khoản đã báo lên đầu danh sách).

## 1. Mục tiêu

Phụ huynh quét QR → tiền vào tài khoản ngân hàng → **SePay gọi webhook** → app tự xác nhận khoản đóng
(gia hạn cho em, ghi phí cộng tác của cô) trong vài giây, không cần quản trị đối chiếu tay. Khoản lệch vẫn để quản trị xử lý.

## 2. Chi phí (theo sepay.vn/bang-gia.html — kiểm tra lại trước khi đăng ký)

| Gói | Giá | Giao dịch / tháng | Webhook + API | Ghi chú |
|---|---|---|---|---|
| **FREE** | 0đ | 50 | Có | Chạy thử, vài lớp |
| **STARTUP** | từ 120.000đ / tháng | nhiều bậc: 180 · 350 · 600 · 1.000 · 1.500 … | Có | Giá theo bậc xem trong my.sepay.vn |
| SHOP | 99.000đ / điểm bán | không giới hạn | **Không API** | Không dùng được cho việc này |

- Chỉ tính **giao dịch tiền vào**. Vượt hạn mức vẫn chạy; tính thêm = *giá 1 giao dịch × số giao dịch vượt*, thu cuối kỳ
  (đơn giá vượt không ghi công khai — xem trong my.sepay.vn).
- Đóng theo năm: giảm tới khoảng 20%. Không giới hạn số tài khoản ngân hàng.
- Dữ liệu giao dịch SePay chỉ lưu **tối đa 6 tháng** → app phải tự lưu mã giao dịch SePay.

**Ước tính:** tiền dồn vào 2 đợt (đầu tháng 9 và tháng 1).

| Quy mô | Khoản đóng tháng cao điểm | Gói | Doanh thu học kỳ (gói lớp 129.000đ) |
|---|---|---|---|
| 5 lớp × 32 em, ~50% đóng | ~80 | STARTUP 180 | ~10,3 triệu |
| 30 lớp | ~500 | STARTUP 600 | ~64,5 triệu |

→ Phí SePay **dưới 1% doanh thu**. Tháng vắng có thể hạ về FREE.

## 3. Điều kiện

- Tài khoản nhận tiền thuộc **12 ngân hàng SePay kết nối API**: Vietcombank, BIDV, VietinBank, MB, ACB, VPBank, TPBank,
  Sacombank, MSB, OCB, KienLongBank, Shinhan. Ngân hàng khác đi qua SMS Banking (chậm, kém chắc).
- Nên dùng **tài khoản doanh nghiệp** (hoá đơn, thuế, chi phí cộng tác cho cô). SePay nhận cả tài khoản cá nhân.
- Tài khoản ngân hàng trên SePay **phải trùng** tài khoản đã khai ở *Quản trị → Thu phí* (QR phụ huynh quét).

## 4. Cấu hình phía SePay (quản trị tự làm trên my.sepay.vn)

1. Đăng ký, chọn gói, **liên kết tài khoản ngân hàng** nhận học phí.
2. **Cấu hình mã thanh toán:** tiền tố `EDK`, độ dài phần sau **6 ký tự** (chữ in hoa + số, bỏ I, O, 0, 1 —
   xem `student_request_payment` trong `supabase/migrations/0075_class_fee_plan.sql`).
3. **Tạo webhook:**
   - URL: `https://<tên-miền>/api/sepay/webhook`
   - Sự kiện: chỉ **tiền vào**
   - Xác thực: **API Key** (SePay gửi header `Authorization: Apikey <khoá>`)
   - Bật "chỉ gửi giao dịch có mã thanh toán" nếu có.
4. Trên **Vercel**: thêm biến môi trường `SEPAY_WEBHOOK_KEY=<khoá ở bước 3>` (bí mật, không commit) → Redeploy.
   Khoá do quản trị tự dán, không gửi cho trợ lý AI.

## 5. Phần app cần làm

### 5.1 Migration `00xx_sepay_auto_confirm.sql`
- `payment_requests` thêm: `bank_ref text unique` (mã giao dịch SePay — chống xử lý 2 lần), `paid_amount integer`,
  `confirmed_via text check in ('admin','sepay')`.
- Bảng `bank_transactions` (service_role): `id`, `sepay_id bigint unique`, `amount`, `content`, `account_no`, `ref_code`,
  `received_at`, `code` (EDK… tách được), `payment_id` (nếu khớp), `status` (`matched` | `unmatched` | `underpaid` | `duplicate` | `ignored`), `raw jsonb`.
  Lưu mọi giao dịch nhận được (SePay chỉ giữ 6 tháng).
- Hàm `system_confirm_payment(p_code text, p_amount integer, p_bank_ref text)` — **chỉ service_role**:
  - tìm `payment_requests` theo `code`, khoá dòng (`for update`);
  - đã `confirmed` → trả `duplicate` (không gia hạn lần nữa);
  - `p_amount < amount` → trả `underpaid` (không xác nhận);
  - còn lại: dùng cùng logic gia hạn + phí cộng tác như `admin_confirm_payment` (0074) —
    nên tách logic dùng chung thành hàm nội bộ `billing_apply_payment(r, v_by uuid, via text)` để hai đường không lệch nhau;
  - ghi `audit_logs` (actor null, action `sepay_confirm_payment`).
- Nếu payment đang `cancelled` mà tiền vẫn về: **không** tự xác nhận, để `unmatched` cho quản trị.

### 5.2 API route `src/app/api/sepay/webhook/route.ts`
- `POST` · kiểm `Authorization === 'Apikey ' + process.env.SEPAY_WEBHOOK_KEY` (so sánh an toàn thời gian); sai → 401.
- Chỉ xử lý `transferType === 'in'`. Trường SePay gửi (kiểm lại docs.sepay.vn khi làm): `id`, `gateway`, `transactionDate`,
  `accountNumber`, `code`, `content`, `transferType`, `transferAmount`, `referenceCode`.
- Lấy mã: ưu tiên `code`; không có thì tìm `/EDK[A-HJ-NP-Z2-9]{6}/` trong `content` (viết hoa trước khi tìm).
- `accountNumber` phải trùng `billing_settings.account_no`, không trùng → `ignored`.
- Gọi `system_confirm_payment` bằng `createAdminClient()`; lưu `bank_transactions`.
- **Luôn trả 200 `{ success: true }`** khi đã ghi nhận (kể cả lệch) để SePay không gửi lại mãi; chỉ trả lỗi khi sai khoá
  hoặc lỗi máy chủ thật (SePay sẽ gửi lại).
- Khoản lệch → `admin_notify('payment', 'Chuyển khoản cần xem — …')`.
- Không cần `rateLimit` theo người dùng, nhưng giới hạn kích thước body.

### 5.3 Giao diện
- *Quản trị → Thu phí*:
  - khoản tự xác nhận hiện nhãn **“SePay”** (cột Trạng thái), CSV thêm cột “Xác nhận bởi”;
  - thẻ mới **“Chuyển khoản cần xem”**: giao dịch `unmatched` / `underpaid` (số tiền, nội dung, thời điểm) + nút
    “Gắn vào khoản …” (chọn mã EDK) / “Bỏ qua”;
  - dòng trạng thái webhook: lần nhận gần nhất (để biết SePay còn gọi).
- Trang *Học phí* của em: khi đang hiện QR, hỏi lại trạng thái mỗi ~10 giây (chỉ khi tab đang mở, tối đa vài phút) →
  “Đã nhận học phí 🎉” ngay khi webhook xác nhận. Không setState liên tục (CLAUDE.md: hiệu năng).
- Lời nhắn ở trang Học phí: bỏ câu “quản trị xác nhận trong giờ làm việc” khi đã bật SePay (cờ `billing_settings.auto_confirm boolean`).

### 5.4 Kiểm thử
- Dùng chức năng **gửi webhook thử** của SePay (hoặc `curl` với khoá thử ở máy) cho các ca:
  đúng mã đủ tiền · đủ tiền gửi 2 lần (duplicate) · thiếu tiền · mã không tồn tại · mã đã huỷ · sai tài khoản · sai khoá (401).
- Chuyển thật 1 khoản nhỏ (đặt giá thử 2.000đ cho một tài khoản test) trước khi bật cho phụ huynh.
- `npx tsc --noEmit -p .`, `npx eslint src/app/api/sepay src/components/admin`, `graphify update .`.

## 6. Thứ tự triển khai

1. Quản trị: mở tài khoản SePay + liên kết ngân hàng (mục 3–4, bước 1–2).
2. Code: migration + webhook + giao diện (mục 5) → chạy migration trên Supabase → deploy.
3. Quản trị: tạo webhook (mục 4, bước 3) + `SEPAY_WEBHOOK_KEY` trên Vercel → Redeploy.
4. Thử với khoản 2.000đ → xem trang Thu phí → bật `auto_confirm`.
5. Theo dõi tuần đầu: mục “Chuyển khoản cần xem” và số giao dịch so với hạn mức gói SePay.

## Nguồn

- Bảng giá: https://sepay.vn/bang-gia.html
- Gói dịch vụ, cách tính phí vượt: https://docs.sepay.vn/goi-dich-vu.html
- Danh sách ngân hàng kết nối API: https://sepay.vn/api-ngan-hang.html
- Tài liệu webhook (đọc khi làm): https://docs.sepay.vn
