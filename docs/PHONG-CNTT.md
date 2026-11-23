# Phòng CNTT EduChain Kids — vị trí, quy trình, phân quyền

Trưởng phòng (chủ sản phẩm) **duyệt toàn quyền**. Các vị trí dưới đây là trợ lý AI chuyên trách (Claude Code subagent) —
mỗi vị trí có kinh nghiệm, quy tắc riêng của dự án và **quyền hạn giới hạn**. Định nghĩa ở `.claude/agents/*.md`
(sửa file là đổi “mô tả công việc” của vị trí).

> Lưu ý thật thà: đây là trợ lý AI, không phải người có 10 năm làm việc thật. Chúng làm nhanh, có quy trình, nhưng
> vẫn có thể sai — vì vậy mọi thứ đi qua bước **Trưởng phòng duyệt** trước khi lên sản phẩm thật.

## 1. Các vị trí

| Vị trí | Tên gọi (agent) | Việc chính | Quyền |
|---|---|---|---|
| Trưởng phòng | — (thầy/cô) | Đặt yêu cầu, duyệt kế hoạch, duyệt kết quả, commit / push, chạy migration trên Supabase, đổi biến môi trường Vercel | Toàn quyền |
| Kiến trúc sư / Tech lead | `kien-truc-su` | Phân tích yêu cầu, khảo sát mã, lập kế hoạch kỹ thuật (`docs/ke-hoach/`), chia việc | Đọc; chỉ ghi file trong `docs/ke-hoach/` |
| Lập trình viên full-stack | `lap-trinh-vien` | Viết mã theo kế hoạch đã duyệt; tự chạy tsc, eslint, check:noi-dung | Đọc, sửa mã; không commit / push |
| CSDL & Bảo mật | `csdl-bao-mat` | Duyệt migration, RLS, hàm security definer, Storage, luồng tiền, dữ liệu học sinh; chạy thử trên PGlite | Chỉ đọc + chạy thử |
| Kiểm thử (QA) | `kiem-thu-qa` | Chạy các bộ kiểm, rà kịch bản theo vai, trường hợp biên, giao diện điện thoại | Chỉ đọc + chạy kiểm |
| Nội dung & Sư phạm | `noi-dung-giao-duc` | Duyệt câu hỏi, kiến thức, đề, lời Milo, bản sắc; chạy check:noi-dung | Chỉ đọc + chạy kiểm |
| Vận hành & Triển khai | `van-hanh-trien-khai` | Danh sách phát hành: file nào commit, thứ tự migration, biến môi trường, cách quay lại, commit message | Chỉ đọc |

Không có vị trí nào (trừ Trưởng phòng) được: commit, push, chạy SQL / migration trên Supabase thật, đổi biến môi trường,
xoá dữ liệu, tắt hook kiểm tra. Lệnh `git commit`, `git push`, `supabase db push` luôn **hỏi Trưởng phòng** trước khi chạy
(cài trong `.claude/settings.json`).

Phòng Marketing (bài viết, video, cộng đồng giáo viên, số liệu tăng trưởng): xem `docs/PHONG-MARKETING.md`.

### Tiết kiệm token: chia việc theo cỡ (mặc định)

Mỗi trợ lý riêng bắt đầu từ con số 0 (tự đọc lại mã, kế hoạch) — chạy nhiều trợ lý cho một việc tốn gấp nhiều lần.
Vì vậy quy trình và 2 điểm duyệt giữ nguyên, nhưng **ai chạy** tuỳ cỡ việc:

| Cỡ việc | Cách chạy |
|---|---|
| **Nhỏ** (sửa chữ, CSS, lỗi rõ) | Trợ lý chính làm thẳng; kiểm bằng tsc / eslint / check:*; không lập kế hoạch |
| **Vừa** (đa số việc) | Trợ lý chính **đóng các vai ngay trong phiên** theo danh sách kiểm trong `.claude/agents/*.md`; kế hoạch ≤ 20 dòng viết trong khung chat để duyệt; rà soát gộp một lượt (QA + bảo mật + nội dung) |
| **Lớn** (nhiều phần độc lập, phải đọc rất rộng) | Mới gọi trợ lý riêng; vai chỉ đọc dùng mô hình rẻ (sonnet / haiku, đặt sẵn trong file vai) |

Quy tắc chung: kiểm bằng lệnh máy trước, chỉ đọc mã ở chỗ rủi ro (quyền, tiền, dữ liệu học sinh); chỉ `npm run build`
khi sửa `next.config.ts` hoặc route đọc file; báo cáo ≤ 15 dòng, kế hoạch ≤ 40 dòng. Hạn mức tuần đã dùng trên 70%: bật `/tiet-kiem-token`.
Muốn ép dùng trợ lý riêng cho một việc: nói rõ “gọi <tên vai>”.

## 2. Quy trình một việc (từ yêu cầu đến sản phẩm)

```
① Trưởng phòng nêu yêu cầu
② kien-truc-su  → kế hoạch docs/ke-hoach/<ngày>-<tên>.md         ── DUYỆT 1: Trưởng phòng duyệt kế hoạch
③ lap-trinh-vien → viết mã, tự kiểm tsc / eslint / check
④ Rà soát song song (tuỳ việc):
     csdl-bao-mat       — có migration, quyền, tiền, dữ liệu học sinh
     noi-dung-giao-duc  — có nội dung, chữ cho học sinh / phụ huynh
     kiem-thu-qa        — mọi thay đổi
   → lỗi: quay lại ③
⑤ van-hanh-trien-khai → danh sách phát hành                       ── DUYỆT 2: Trưởng phòng xem trên trình duyệt + duyệt phát hành
⑥ Trưởng phòng: chạy migration trên Supabase → commit → push → kiểm sau phát hành
```

Việc nhỏ (sửa chữ, sửa CSS, lỗi rõ ràng): bỏ ②, chỉ cần ③ → kiem-thu-qa → DUYỆT 2.

## 3. Cách giao việc (gõ trong Claude Code)

- “**Dùng kien-truc-su** lập kế hoạch cho: phụ huynh xem bảng xếp hạng tuần của con.”
- “Kế hoạch `docs/ke-hoach/2026-11-24-xep-hang.md` **đã duyệt**, giao **lap-trinh-vien** làm.”
- “Cho **csdl-bao-mat** và **kiem-thu-qa** rà song song phần vừa làm.”
- “**van-hanh-trien-khai** soạn danh sách phát hành.”
- Hoặc gọn: “Chạy quy trình phòng CNTT cho việc X” — trợ lý chính sẽ điều phối đúng thứ tự trên và **dừng ở 2 điểm duyệt**.

## 4. Mẫu báo cáo Trưởng phòng nhận

- **Kế hoạch**: mục tiêu, phạm vi, dữ liệu / migration, màn hình, rủi ro, cách kiểm, ước lượng S/M/L.
- **Rà soát**: bảng lỗi theo mức (Chặn / Nên sửa / Góp ý), kết luận Đạt / Chưa đạt.
- **Phát hành**: các bước đánh số Trưởng phòng làm theo, commit message đề xuất, cách quay lại.

## 5. Nhịp làm việc gợi ý cho người làm một mình

- Mỗi ngày: 1 việc lớn hoặc 2–3 việc nhỏ đi hết quy trình; không mở việc mới khi việc cũ chưa qua DUYỆT 2.
- Mỗi tuần: kiem-thu-qa chạy `npm run check:noi-dung` đầy đủ + `check:deck-all`; csdl-bao-mat rà lại các migration trong tuần.
- Trước mỗi đợt quan trọng (đầu học kỳ, đợt chi trả phí cộng tác 16–31/1 và 1–15/6): van-hanh-trien-khai soạn danh sách kiểm tra riêng.
