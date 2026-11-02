# Báo cáo phân tích codebase EduChain Kids

## Phạm vi và cách đọc kết quả

- Phân tích source trong `educhain-kids-starter`, chỉ đọc; file được tạo trong lượt này là báo cáo này. Không đọc nội dung `.env.local` hay secret, không cài package, không chạy migration và không thay schema/RLS.
- Đã kiểm kê toàn bộ đường dẫn source/config/migration/test, quét marker và hash file; đã đọc/truy vết các entry point cùng các luồng đại diện. Đây không phải lượt đọc thủ công từng dòng của toàn bộ 425 file TypeScript/TSX, nên không khẳng định đã chứng minh hết mọi lỗi hoặc dead code.
- **VERIFIED** = thấy trực tiếp trong source/config hoặc kết quả lệnh kiểm tra đã chạy. **NOT VERIFIED** = cần cấu hình/dữ liệu Supabase thật hoặc phạm vi source chưa được kiểm chứng toàn diện. **NOT TESTED** = không chạy trong lượt này.

## 1. Tổng quan kiến trúc

**VERIFIED.** README tự mô tả dự án là foundation starter nội bộ cho lớp 1–5, chưa phải sản phẩm production và chưa tích hợp blockchain (`README.md:1-9`). Ứng dụng dùng Next.js App Router, TypeScript strict, React, Supabase Auth/PostgreSQL/RLS; entry point là `src/app/layout.tsx` và `src/app/page.tsx`, còn `src/middleware.ts` chuyển tiếp request tới session middleware (`src/app/layout.tsx:1-34`, `src/app/page.tsx:48`, `src/middleware.ts:1-11`). Không có `pages/` router được thấy trong inventory.

| Hạng mục | Kết quả |
|---|---|
| Phiên bản trong `package.json` | Next `^15.2.4`, React `^19.0.0`, Supabase SSR `^0.6.1`, Supabase JS `^2.49.1`, TypeScript `^5.8.2`, Tailwind `^3.4.19` (`package.json:37-60`). |
| Phiên bản đã khóa | Next 15.5.27, React/React DOM 19.3.0, `@supabase/ssr` 0.6.1, `@supabase/supabase-js` 2.117.3, TypeScript 5.9.3, Tailwind 3.4.19, ESLint 9.39.5, Zod 3.25.76, `chess.js` 1.4.0, `three` 0.160.0 (`package-lock.json`, đã phân tích JSON; không cần mở file môi trường). |
| Kiểm tra TypeScript | `strict: true`, alias `@/*` trỏ `src/*` (`tsconfig.json:3-17`). |
| CSS | Có dependency Tailwind, nhưng `postcss.config.mjs` chỉ bật Autoprefixer và ghi chú Tailwind không còn dùng trong pipeline CSS hiện tại (`postcss.config.mjs:1-8`). |
| Quy mô kiểm kê | 61 `page.tsx`, 13 API route trong `src/app/api`, 16 route handler tổng cộng, 136 file component và 206 file trong `src/lib`; 45 migration và 34 file SQL trong `supabase/tests`. Đây là số lượng file từ inventory, không phải đánh giá độ phức tạp. |

## 2. Bản đồ source

**VERIFIED.** Cấu trúc chính phù hợp với README (`README.md:378-403`):

```text
src/
  app/                 App Router: trang công khai, đăng nhập, học sinh, giáo viên, phụ huynh, quản trị, game, API
  components/          UI theo miền (classroom, parent, achievements, writing, games, ...)
  lib/                 auth, Supabase clients, grading/progress, AI, curriculum/content, game và tiện ích
  middleware.ts        cập nhật phiên Supabase và xử lý một số điều hướng/cookie
supabase/
  migrations/          45 file SQL, schema, policy, RPC và các thay đổi theo phiên bản
  seed/                dữ liệu seed
  tests/               checklist và test SQL/PostgreSQL cục bộ
scripts/               kiểm tra nội dung/chức năng và công cụ import/export
public/                ảnh, font và tài nguyên giao diện
```

Không thấy thư mục `src/hooks`, `src/services` hay `src/store` riêng; logic dùng lại tập trung trong `src/lib`, còn trạng thái UI chủ yếu nằm trong React components. Không có Redux/Zustand/Jotai trong dependencies. `localStorage` được dùng cho tiến độ/chế độ demo, theme và tùy chọn UI, ví dụ `src/lib/progress.ts:25-120`, `src/app/layout.tsx:28`.

## 3. Chức năng và luồng chính

| Luồng | Thành phần đã xác minh | Tóm tắt |
|---|---|---|
| Đăng nhập và phân quyền | `src/lib/auth/viewer.ts:32-84`; `src/lib/auth/staff.ts:13-38`; `src/app/quan-tri/layout.tsx:24-49`; `src/lib/supabase/middleware.ts:16-50` | Session Supabase từ cookie; role/profile/student/application đọc từ database. Trang dùng `getViewer`; API quyền cao dùng `getVerifiedViewer` gọi `auth.getUser()`. Guard nhân sự kiểm tra role teacher/admin. Middleware chủ yếu làm mới session/cookie; trang/API tự kiểm tra quyền. |
| Đăng nhập học sinh bằng mã lớp + PIN | `src/app/api/hoc-sinh/dang-nhap/route.ts:10-91`; `supabase/migrations/0027_pin_attempt_atomic.sql:5-31` | Kiểm tra mã lớp/hội viên, giữ chỗ lượt thử nguyên tử qua `student_pin_attempt`, rồi xác thực Supabase Auth. Có fallback đọc–thử–ghi khi RPC lỗi (xem phát hiện). |
| Giáo viên và lớp | `src/app/giao-vien/page.tsx:26-97`; `src/app/giao-vien/layout.tsx:1-24`; `src/components/classroom/ClassManager.tsx` | Dashboard nạp danh sách lớp/giáo án/giao bài/sổ lớp qua RPC; component quản lý lớp gọi RPC theo thao tác. Phạm vi bản ghi cuối cùng dựa vào policy/RPC trong DB. |
| Học sinh, bài tập và giao bài | `src/app/hoc-sinh/page.tsx:25-39`; `src/components/classroom/AssignmentsBoard.tsx`; `src/app/api/hoc-sinh/bai-giao/[id]/route.ts:12-43`; `supabase/migrations/0017_assignments.sql:66-99,221-282` | Trang học sinh đọc bài giao; API nộp đề xác minh viewer học sinh, kiểm tra đích giao bằng `assignment_targets`, trạng thái đề, chấm ở server và ghi submission; lỗi unique được trả thành trạng thái đã nộp. |
| Chấm bài và tiến độ | `src/app/api/tien-do/route.ts:10-46`; `src/lib/progress-server/grade.ts:39-80`; `src/app/hoc-sinh/page.tsx:31-39` | API xác thực học sinh, kiểm tra quyền học/khối, chấm lại câu trả lời ở server rồi ghi `lesson_results` bằng service role. Kết quả được đọc ở dashboard. |
| Phụ huynh – giáo viên | `src/app/phu-huynh/page.tsx:47-123,231-238`; `docs/AUTH-SETUP.md:5-11,49-55`; `supabase/migrations/0031_parent_hub.sql`, `0033_parent_family.sql`, `0037*` | Dashboard gọi các RPC tổng quan, nhật ký, liên hệ và tin nhắn; phụ huynh liên kết học sinh bằng mã mời theo hướng dẫn. **NOT VERIFIED:** quyền/luồng đang hoạt động trên database thật. |
| Huy hiệu, thư khen, chứng nhận | `src/app/thanh-tich/page.tsx:18-21,44-111`; `src/app/api/thanh-tich/route.ts:10-42`; `src/app/giao-vien/lop/[id]/thu-khen/page.tsx`; `src/components/classroom/PraiseLetters.tsx` | Trang thành tích hiển thị dữ liệu minh họa khi chưa có session và có API live cho thành tích/bảng xếp hạng; giáo viên có công cụ thư khen. Schema có bảng `certificates` và policy theo phạm vi (`supabase/migrations/0001_platform_foundation.sql:159,281,416-445`), nhưng không tìm thấy luồng cấp/xác minh chứng nhận trong `src` (**NOT VERIFIED** như một tính năng app hoàn chỉnh). README ghi kết quả game là luyện tập, không phải kết quả đáng tin cậy (`README.md:144,358`). |
| Trợ lý AI | `src/app/api/ai/chat/route.ts:11-80`; `src/app/api/ai/keys/route.ts`; `src/lib/ai/crypto.ts:1-34`; `src/lib/ai/teacher-keys.ts:24-65`; `supabase/migrations/0030_ai_assistant_byok.sql:8-42` | API giới hạn role teacher/admin, key BYOK mã hóa AES-256-GCM ở server, lưu qua service role; nội dung hội thoại giữ phía trình duyệt theo chú thích route. Có hạn mức ngày và throttling, nhưng phần đếm/throttle có giới hạn nêu dưới. |

## 4. Luồng dữ liệu frontend → API → Supabase

**VERIFIED.** Browser client tạo qua `@supabase/ssr` (`src/lib/supabase/client.ts:1-7`); Server Component/Route dùng server client chia sẻ cookie (`src/lib/supabase/server.ts:1-20`). Admin client được đánh dấu `server-only`, lấy khóa service role chỉ ở server (`src/lib/supabase/admin.ts:1-16`). Luồng điển hình:

```text
Server/Client Component
  → Supabase SSR client theo cookie hoặc fetch API Route
  → viewer/role guard (API nhạy cảm xác minh lại Auth)
  → query/RPC qua session để đọc hoặc thực hiện thao tác được phân quyền
  → API server chấm/kiểm tra input khi cần
  → service_role chỉ ở server cho các bảng không cho client ghi trực tiếp
  → PostgreSQL constraints, RPC và RLS/policy
```

State không có thư viện global store; components phối hợp `useState`/`useEffect`, các thao tác dùng Supabase RPC trực tiếp, và dữ liệu demo/tùy chọn được lưu local. Lỗi thường trả status/error rõ ở API quan trọng (ví dụ `src/app/api/tien-do/route.ts:16-46`), nhưng chưa có một lớp service/error chuẩn hóa dùng chung rõ rệt; một số nơi bỏ qua `error` của query, ví dụ `src/lib/auth/viewer.ts:53-55` và `src/lib/ai/teacher-keys.ts:24-30,61-65`.

## 5. Kiểm tra kỹ thuật và vấn đề

### Bảo mật và RLS

- **VERIFIED (static scan):** trong 45 migration, bộ đếm SQL tìm thấy 61 khai báo `CREATE TABLE`, 59 bảng được bật RLS, 103 `CREATE POLICY`, và 189 khai báo `SECURITY DEFINER`. Bộ quét tĩnh phát hiện cả 189 function có `SET search_path` tường minh; đây là kiểm tra regex source, không chứng minh ngữ nghĩa/hiệu lực sau khi chạy migration.
- **VERIFIED:** hai bảng không bật RLS là `teacher_ai_keys` và `ai_usage`. Migration `0030` thu hồi toàn bộ quyền của `anon` và `authenticated`; thao tác ứng dụng dùng service role (`supabase/migrations/0030_ai_assistant_byok.sql:8-30`). Đây không tự động đồng nghĩa dữ liệu đang công khai, nhưng ACL và default privileges trên Supabase đang chạy **NOT VERIFIED**.
- **VERIFIED:** checklist `supabase/tests/0001_security_smoke_test.sql:1-36` là checklist thủ công, tự nói việc liệt kê policy không chứng minh RLS đúng và yêu cầu kiểm thử bằng JWT. `supabase/tests/local/README.md:1-30` mô tả test trên PostgreSQL shim cho một phần migration, không thay thế test Supabase thật.
- **NOT VERIFIED:** chưa có kết nối database/catalog hoặc JWT staging trong lượt này; không thể xác nhận migration production đã chạy đúng thứ tự, grant/ACL thực tế, RLS effective, bucket storage policies hay quyền theo từng vai trò.

### Phát hiện cần ưu tiên

| Mức | Trạng thái | Bằng chứng | Nhận định / hướng xử lý |
|---|---|---|---|
| **MEDIUM** | **VERIFIED** | `src/app/api/hoc-sinh/dang-nhap/route.ts:43-46,61-91` | Bất kỳ lỗi nào từ RPC `student_pin_attempt` đều rơi vào fallback đọc–thử–ghi, không phân biệt lỗi do migration chưa chạy với lỗi DB/quyền/tạm thời. Fallback không nguyên tử nên mất bảo đảm chống thử song song của migration 0027. Chỉ fallback với lỗi cụ thể thể hiện RPC chưa tồn tại; với lỗi khác trả lỗi server và log. |
| **MEDIUM** | **VERIFIED** | `src/lib/rate-limit.ts:3-19`; các caller ở `src/app/api/ai/chat/route.ts:18-26`, `src/app/api/hoc-sinh/dang-nhap/route.ts:10-16`; `src/lib/ai/teacher-keys.ts:61-65` | Rate limit là `Map` trong memory của một process, nên không phải hạn mức dùng chung qua nhiều instance/cold start. Bộ đếm AI còn trả `0` khi `count` null, không kiểm tra `error`, khiến quota có thể fail-open nếu truy vấn đếm lỗi. Dùng counter/storage dùng chung và xử lý lỗi truy vấn quota theo hướng fail-closed; cân nhắc cập nhật quota nguyên tử để tránh race. PIN có thêm guard DB nguyên tử khi RPC hoạt động. |
| **MEDIUM** | **VERIFIED** | `docs/AUTH-SETUP.md:6-11`; migration mới nhất trong inventory là `supabase/migrations/0045_teacher_trial.sql`; các feature refs ở `src/app/phu-huynh/page.tsx:82-87` và `src/app/api/ai/chat/route.ts` | Hướng dẫn setup liệt kê chuỗi migration dừng ở `0020`, trong khi source có migration đến `0045` và tính năng phụ huynh/AI phụ thuộc migration mới hơn. README còn các ghi chú về trang học sinh/dữ liệu demo và chấm trên trình duyệt (`README.md:91,353-358`) cần đối chiếu với API chấm/lưu server hiện tại (`src/app/api/tien-do/route.ts:10-46`). Cập nhật lại hướng dẫn triển khai và phân biệt rõ luồng demo với luồng đã nối DB. |
| **LOW** | **VERIFIED** | `src/lib/auth/viewer.ts:53-55`; `src/lib/ai/teacher-keys.ts:24-30` | Một số truy vấn chỉ lấy `data`, bỏ lỗi Supabase; role rỗng hiện fail-closed nhưng nguyên nhân lỗi khó chẩn đoán. Trả/ghi log lỗi có cấu trúc ở ranh giới phù hợp, không đưa dữ liệu nhạy cảm vào log. |

### Trùng lặp, TODO và code chưa dùng

- **VERIFIED:** quét SHA-256 tìm thấy cặp file trùng byte `src/app/loading.tsx` và `src/app/giao-vien/loading.tsx`. Hai loading state có thể là bản sao có chủ ý theo route; không có bằng chứng đây là bug.
- **VERIFIED:** quét marker dạng từ độc lập `TODO|FIXME|HACK|XXX` không tìm thấy marker công việc thực trong `src`, `scripts`, `supabase`; các match còn lại là tên biến/trạng thái `todo` hoặc dữ liệu kiểm thử `Hack`.
- **NOT VERIFIED:** chưa chạy công cụ phân tích dead-code chuyên dụng; không kết luận file/hàm không dùng chỉ dựa vào tìm kiếm văn bản.
- **VERIFIED:** không có filename generated Supabase database types trong `src` theo inventory/search; một số query dùng type assertion thủ công (ví dụ `src/lib/auth/viewer.ts:53-55`, `src/lib/ai/teacher-keys.ts:27-30`). **NOT VERIFIED:** chưa có báo cáo coverage/bundle trong phạm vi rà soát. Nên cân nhắc generated Supabase types và dead-code tooling trong đợt bảo trì riêng, không phải bằng chứng lỗi runtime.

## 6. Kiểm tra đã chạy và phần chưa thể xác minh

| Kiểm tra | Kết quả |
|---|---|
| `npm exec -- tsc --noEmit --incremental false` | **VERIFIED — đạt**, exit code 0; không bật incremental để tránh ghi metadata build. |
| `npm run lint` | **VERIFIED — đạt**, ESLint exit code 0. |
| `npm run check:content` | **VERIFIED — đạt**, báo “Không có lỗi”. |
| `npm run build`, các script `check:*`, E2E | **NOT TESTED** trong lượt này. |
| Migration SQL, local PostgreSQL tests, RLS/security smoke tests, staging Supabase với JWT | **NOT TESTED**; không chạy migration/test phụ thuộc DB theo giới hạn nhiệm vụ. |
| Secret/API key và giá trị `.env.local` | **NOT READ**. |

## 7. Đề xuất theo thứ tự ưu tiên

1. Sửa fallback PIN để chỉ dùng đường cũ khi xác nhận migration/RPC chưa tồn tại; mọi lỗi khác phải dừng và báo lỗi an toàn.
2. Thay rate limit/quota theo process bằng cơ chế dùng chung phù hợp deployment; xử lý lỗi đếm quota fail-closed và chống cập nhật vượt hạn mức đồng thời.
3. Cập nhật `docs/AUTH-SETUP.md` cùng các ghi chú trạng thái trong README theo đủ migration hiện hành; ghi rõ migration nào bắt buộc cho từng tính năng.
4. Trước khi dùng dữ liệu học sinh thật, chạy toàn bộ migration trên staging và test RLS bằng JWT của student/teacher/parent/admin; xác nhận ACL hai bảng AI và policies storage trên chính database đó.
5. Trong đợt bảo trì riêng, bổ sung typing Supabase sinh từ schema, kiểm tra dead code và xác định có nên hợp nhất hai loading file giống byte hay giữ theo convention route.

