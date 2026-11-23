# Kế hoạch: Văn phòng ảo 3D trong Quản trị (`/quan-tri/van-phong`)

Ngày: 2026-11-23 · Người lập: kien-truc-su · Trạng thái: **chờ duyệt**

## 0. Nhắc lại yêu cầu

Thêm trang **Văn phòng ảo** trong khu Quản trị, chỉ quản trị hệ thống (system_admin) xem được. Trang dựng một căn phòng 3D gồm
bàn Trưởng phòng, khu Phòng CNTT (6 vị trí) và khu Phòng Marketing (5 vị trí). Bấm vào bàn nào thì camera bay tới gần bàn đó và
mở bảng thông tin: việc làm, quyền hạn, việc gần nhất, nút **Chép lệnh giao việc** để dán vào Claude Code.
Mô hình và bộ dựng 3D lấy từ những thứ app đã có.

**Nói rõ từ đầu:** trang web KHÔNG chạy được agent. Agent chạy trong Claude Code trên máy Trưởng phòng. Trang này chỉ là
bản đồ trực quan cộng với chỗ chép lệnh; không gọi API AI, không có trạng thái "đang làm" theo thời gian thực.

### Câu hỏi còn mơ hồ (kèm đề xuất mặc định)
1. Mục "Việc gần nhất" trên Vercel: các file `docs/` và `.claude/` không có trong bản chạy trên Vercel (xem mục 3.3).
   **Mặc định:** chạy trên máy (`npm run dev`) thì hiện file mới nhất. Trên Vercel thì hiện dòng "Chỉ xem được khi chạy trên máy".
   Giai đoạn 1 không sinh dữ liệu lúc build.
2. Người đứng ở các bàn: **mặc định** Trưởng phòng là người thật (`adult`), kèm Milo trên bàn. Các agent dùng mô hình **rô-bốt**
   (`k-character`) để thể hiện đúng rằng đó là trợ lý AI chứ không phải nhân viên thật.
   Nếu Trưởng phòng muốn tất cả đều là người (`adult` đổi màu áo) thì chỉ cần sửa một dòng.
3. Tên mục trên thanh bên: **mặc định** "Văn phòng ảo", icon `Building2` (lucide), đặt ngay dưới "Xưởng video".

## 1. Mục tiêu & phạm vi

**Làm:**
- Trang `/quan-tri/van-phong`, quyền giống Xưởng video: lớp `layout` kiểm tra đăng nhập, trang kiểm tra `ctx.isAdmin`.
- Dữ liệu vị trí đặt tĩnh trong `src/lib/office/roles.ts`, có script kiểm tra để luôn khớp với `.claude/agents/*.md`.
- Chế độ 3D dùng lại sân khấu `Stage3D` (bài giảng 3D) ở chế độ trình chiếu, cùng các mô hình có sẵn.
- Chế độ 2D (lưới thẻ) dùng cho điện thoại, máy yếu, máy lỗi WebGL và người dùng bàn phím / trình đọc màn hình.
- Bảng thông tin của từng vị trí, có nút chép lệnh giao việc.

**KHÔNG làm:**
- Không gọi API AI, không chạy agent từ web, không có trạng thái thời gian thực.
- Không migration, không bảng mới, không thêm thư viện. KHÔNG dùng react-three-fiber / drei: dự án chưa cài, và nếu cài thì
  sẽ có hai cách dựng 3D song song trong cùng dự án.
- Không sửa `src/lib/lesson3d/engine.ts` ở giai đoạn 1, để tránh làm hỏng Xưởng bài giảng 3D và thao giảng.
- Không cho sửa vai trò từ giao diện. Vai trò sửa trong file `.md`, rồi cập nhật `roles.ts`.

## 2. Khảo sát: app đang dựng 3D bằng gì, dùng lại được gì

| Thứ có sẵn | File | Dùng lại thế nào |
|---|---|---|
| **three.js 0.160** (không có R3F / drei) | `package.json` | Dùng luôn, không thêm gói |
| **Sân khấu `Stage3D`**: OrbitControls (xoay, cuộn để phóng to), `flyTo(cam, tgt)`, `home()`, `onPick(id)` khi `playScene !== null`, ghim điểm chạm là **nút HTML** (`syncPins` → `button.s3d-pin`, có `aria-label`), `setLite()`, `dispose()` | `src/lib/lesson3d/engine.ts` | **Lõi của chế độ 3D.** Ta đưa vào một `Lesson3D` dựng sẵn (mặt sàn `base: 'desk'`, tối đa 80 đồ vật), đặt `playScene = 0` để bấm vào đồ vật thì gọi `onPick` |
| Cách nhúng Stage3D đơn giản nhất (import động, `new Stage3D`, `setLesson`, `dispose`) | `src/components/deck/Scene3DBox.tsx` | Làm mẫu cho `OfficeStage.tsx` |
| Kiểu dữ liệu `Lesson3D`, `Obj3D` (có `spot.on/title` để tạo ghim) | `src/lib/lesson3d/types.ts` | Tạo dữ liệu văn phòng |
| Đồ vật dựng bằng mã: `adult` (người lớn), `computer`, `pot-plant`, `calendar`, `clock`, `cup`, `sign` (bảng chữ), `label` (nhãn chữ nổi), `cuboid` | `src/lib/lesson3d/assets.ts`, `body.ts`, `nature.ts` | Người, máy tính, cây cảnh, biển tên khu |
| Mô hình .glb CC0: `k-character` (rô-bốt Kenney, 32 KB) | `public/models/kenney/character.glb`, `src/lib/lesson3d/models.ts` | Nhân vật cho các agent. Tải lười, có bộ nhớ đệm |
| Cách đăng ký đồ vật tự tạo vào `ASSET_BY_ID` (tấm tranh có khung từ ảnh) | `src/lib/lesson3d/user-assets.ts` (`registerUserAssets`, `buildBoard`) | Làm theo mẫu này để đăng ký **bàn làm việc** và **bảng biểu tượng** riêng cho văn phòng |
| Hình 3D Fluent (webp): `laptop`, `locked`, `bug`, `books`, `construction-worker`, `light-bulb`, `pencil`, `clapper-board`, `speech-balloon`, `spiral-calendar`, `office-building`, `owl` | `public/emoji/f3d/*.webp`, `src/lib/emoji-3d.ts` | Biểu tượng từng vị trí: dán lên bảng trên bàn trong 3D và dùng trên thẻ 2D |
| Milo (ảnh 2D, không có mô hình 3D) | `public/brand/milo-sm.webp`, `src/components/mascot/MiloMascot.tsx` | Tấm ảnh Milo trên bàn Trưởng phòng; `MiloMascot` dùng trên thẻ 2D |
| `hasWebGL()` | `src/lib/gallery/room.ts` | Kiểm tra trước khi dựng 3D |
| Phòng triển lãm 3D (`GalleryScene`: phòng có tường, đi bằng phím mũi tên, góc nhìn người thứ nhất) | `src/lib/gallery/room.ts`, `src/components/gallery/GalleryView.tsx` | **Không dùng làm lõi.** Lớp này gắn chặt với bố cục tranh treo tường và kiểu đi bộ. Chỉ học cách tạm dừng vòng vẽ khi tab bị ẩn (`onVis`) cho giai đoạn 2 |
| Kho `teacher-assets` (.glb giáo viên tải lên) | `src/lib/assets/client`, `user-assets.ts` | **Không dùng.** Đó là dữ liệu riêng của từng giáo viên, phải ký đường dẫn Supabase, không liên quan đến trang này |

**Phương án đã cân nhắc:**
- A. **Dùng lại Stage3D (chọn).** Ít mã nhất: xoay, bay camera, bấm chọn, ghim nút HTML đều có sẵn. Đánh đổi: mặt sàn cố định
  22 × 16 và không có tường. Vì vậy văn phòng trông như một "sa bàn văn phòng" chứ không phải căn phòng kín. Chấp nhận được.
- B. Dùng lại GalleryScene. Có tường thật, nhưng phải tách bố cục tranh ra và đổi kiểu đi bộ thành kiểu bấm bàn. Tốn hơn, dễ làm hỏng Phòng triển lãm.
- C. Tự viết lớp three.js mới. Linh hoạt nhất nhưng tốn công nhất, và tạo ra bản thứ ba của OrbitControls / chọn đồ vật / bay camera.

## 3. Thiết kế

### 3.1 Bố cục (toạ độ trên sa bàn 22 × 16, x ∈ [-10.5, 10.5], z ∈ [-7.5, 7.5])

```
          z = -6   [nhãn "Phòng CNTT"]                 [nhãn "Phòng Marketing"]
          z = -4   kien-truc-su  lap-trinh-vien  csdl   mkt-chien-luoc  mkt-noi-dung  mkt-video
          z =  0   kiem-thu-qa   noi-dung-gd   van-hanh   mkt-cong-dong  mkt-phan-tich  (cây cảnh)
                   x = -8.5      -5.5        -2.5        2.5           5.5          8.5
          z = +5               [Bàn Trưởng phòng — x = 0, to hơn, có Milo + lịch]
```
- Mỗi vị trí gồm một bàn (đồ vật riêng `office-desk`), một `computer` đặt trên bàn, một nhân vật (`k-character`) và một bảng
  biểu tượng f3d nhỏ (`office-icon-<vai>`). Khoảng 4 đồ vật cho mỗi vị trí × 12 vị trí ≈ 48, cộng biển tên khu, cây cảnh, Milo:
  khoảng **55 / 80** (giới hạn `MAX_OBJECTS`).
- Mỗi vị trí có một đồ vật mang `spot: { on: true, title: '<tên vai>' }`, tức 12 ghim. Ghim là nút HTML nên dùng được phím Tab
  và trình đọc màn hình đọc được.
- Màu khu: CNTT xanh dương, Marketing cam. Bàn Trưởng phòng dùng màu thương hiệu (vàng của logo).

### 3.2 Tương tác & camera
- Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to. Đây là OrbitControls có sẵn; giới hạn góc và khoảng cách giữ nguyên.
- Bấm vào bàn, nhân vật hoặc ghim → `onPick(objId)`. Mã đồ vật có dạng `<vai>:desk|bot|pc|icon`, nên tách được tên vai →
  `flyTo(CAM[vai], TGT[vai])`. Toạ độ camera tính sẵn trong `roles.ts` (cách bàn 4–5 đơn vị, nhìn chếch xuống) → mở bảng thông tin.
- Nút "Toàn cảnh" gọi `home()`. Phím Esc đóng bảng và về toàn cảnh.
- React chỉ giữ một state `selected: string | null`, đổi khi bấm. Không có state nào cập nhật theo khung hình. Vị trí ghim do
  engine tự đặt trực tiếp trên DOM.

### 3.3 Bảng thông tin & nguồn dữ liệu

| Trường | Nguồn |
|---|---|
| Tên, mã agent, phòng, biểu tượng | `src/lib/office/roles.ts` |
| Việc chính, quyền hạn | `roles.ts`, chép từ bảng mục 1 của `docs/PHONG-CNTT.md` / `docs/PHONG-MARKETING.md` và `tools:` của từng agent |
| Nộp vào (thư mục) | `roles.ts` (`docs/ke-hoach/`, `docs/marketing/bai-viet/`, …) |
| Lệnh giao việc mẫu (1–3 câu) | `roles.ts`, lấy từ mục 3 "Cách giao việc" của hai tài liệu phòng. Nút **Chép lệnh** dùng `navigator.clipboard.writeText`; nếu không chép được thì bôi đen sẵn ô chữ để người dùng tự Ctrl+C |
| Việc gần nhất | Trang máy chủ (`page.tsx`, `force-dynamic`) thử `fs.readdir` thư mục nộp của vai đó, lấy **tên file** mới nhất cùng ngày sửa. Bọc `try`: không đọc được thì hiện "Chỉ xem được khi chạy trên máy" |

**Vì sao không đọc trực tiếp `.claude/` và `docs/` trên Vercel:**
- Hàm máy chủ trên Vercel chỉ chứa những file mà bước "file tracing" lúc build tìm thấy. `docs/` và `.claude/` không được mã nào
  import nên không có mặt lúc chạy.
- Hiện `.claude/agents/`, `docs/PHONG-*.md` còn **chưa commit** (git status `??`), còn `docs/ke-hoach/` và `docs/marketing/`
  chưa tồn tại.
- Có thể ép đưa vào bằng `outputFileTracingIncludes`, nhưng như vậy là đưa tài liệu nội bộ lên máy chủ. Không cần thiết.

**Cách giữ đồng bộ:**
- Thêm `scripts/check-office-roles.ts` và lệnh `npm run check:office`. Script đọc frontmatter (`name`, `tools`) của mọi
  `.claude/agents/*.md` và báo lỗi khi:
  - có agent chưa có trong `roles.ts`, hoặc `roles.ts` có vai không còn file;
  - `tools` có `Edit` / `Write` mà phần quyền hạn trong `roles.ts` ghi là "chỉ đọc", hoặc ngược lại.
- Không gắn script vào pre-commit để hook không chậm thêm. Chạy tay mỗi khi sửa agent.

**Bảo mật dữ liệu:**
- `roles.ts` chỉ được import trong **server component** `page.tsx`, rồi truyền xuống component client qua props. Như vậy nội dung
  nằm trong phản hồi RSC của từng lượt tải (chỉ quản trị nhận được), không nằm trong file JS tĩnh công khai `/_next/static`.
  Lưu ý: mọi thứ import trong component client đều tải được công khai, kể cả khi trang đã chặn quyền.
- Mục "Việc gần nhất" chỉ hiện **tên file và ngày**, không đọc nội dung. Lý do: `docs/marketing/` có thể chứa phản hồi hoặc số
  liệu giáo viên.

### 3.4 Hiệu năng & khả năng dùng
- **Tải lười:** `OfficeStage` gọi `import('@/lib/lesson3d/engine')` bên trong `useEffect`, giống Scene3DBox, nên three.js chỉ tải
  ở trang này và dùng chung chunk với bài giảng 3D. Chế độ 2D không tải three.js.
- **Giới hạn:** khoảng 55 đồ vật, 1 loại .glb (rô-bốt 32 KB, tải một lần rồi dùng lại từ bộ nhớ), 12 ảnh f3d 256 px.
  Bàn tự dựng bằng `BoxGeometry` (vài chục tam giác). Ước tính dưới 150 nghìn tam giác, gồm cả `adult` dựng bằng mặt cầu 24 × 16.
- **Máy yếu:** `navigator.hardwareConcurrency <= 4` hoặc `deviceMemory <= 4` → `setLite(true)` (tắt bóng đổ, pixel ratio 1).
- **`prefers-reduced-motion`:** không gắn hiệu ứng `fx` nào cho đồ vật, và khi bấm bàn thì **không gọi `flyTo`** (chỉ mở bảng).
  Đồ vật sẵn đã đứng yên vì rô-bốt Kenney không có động tác.
- **Chế độ 2D (lưới thẻ):** mặc định cho màn hình < 720 px, khi `hasWebGL()` sai, hoặc khi dựng 3D ném lỗi (giống `onFail` của
  GalleryView). Có nút chuyển "3D / Dạng thẻ", lựa chọn lưu ở `localStorage`. Lưới thẻ là `<ul>` các `<button>` theo hai nhóm
  `<h2>`, dùng chung component bảng thông tin với chế độ 3D.
- **Bàn phím & trình đọc màn hình:**
  - Khung canvas có `aria-hidden`; người dùng thao tác qua các ghim là nút HTML.
  - Có liên kết "Xem dạng danh sách" ở đầu trang.
  - Bảng thông tin là `role="dialog"` có `aria-labelledby`; khi mở thì đưa focus vào bảng, khi đóng thì trả focus về nút đã bấm.

### 3.5 Vị trí trong Quản trị, quyền, migration
- `src/components/admin/AdminNav.tsx`: thêm `{ href: '/quan-tri/van-phong', label: 'Văn phòng ảo', icon: Building2, show: isAdmin }` dưới Xưởng video.
- `page.tsx` làm theo mẫu `src/app/quan-tri/xuong-video/page.tsx`: `getStaffContext()`, giáo viên thì thấy thông báo
  "chỉ dành cho quản trị viên". `layout.tsx` đã chặn người chưa đăng nhập.
- **Không cần migration** vì không đọc hay ghi database.
- **Không cần công tắc tính năng:** trang chỉ quản trị thấy, nếu muốn ẩn thì bỏ dòng trong menu. Nếu Trưởng phòng muốn có công tắc
  thì thêm `FEATURES.office` (mặc định bật), mất khoảng 5 phút.

## 4. File sẽ tạo / sửa

| File | Việc |
|---|---|
| `src/app/quan-tri/van-phong/page.tsx` (mới) | Server: kiểm quyền, đọc `roles.ts`, thử đọc "việc gần nhất" bằng `fs`, truyền props |
| `src/components/office/VirtualOffice.tsx` (mới, client) | Chuyển 3D / 2D, state `selected`, nút Toàn cảnh, phím Esc |
| `src/components/office/OfficeStage.tsx` (mới, client) | Nhúng Stage3D (theo mẫu Scene3DBox), `playScene = 0`, `onPick`, `flyTo`, lite, xử lý lỗi WebGL |
| `src/components/office/OfficeGrid.tsx` (mới) | Lưới thẻ 2D |
| `src/components/office/RolePanel.tsx` (mới) | Bảng thông tin và nút chép lệnh |
| `src/lib/office/roles.ts` (mới) | 12 vai: id, phòng, tên, biểu tượng f3d, việc chính, quyền, thư mục nộp, lệnh mẫu, vị trí bàn, camera |
| `src/lib/office/scene.ts` (mới) | Đăng ký đồ vật `office-desk`, `office-icon-*` vào `ASSET_BY_ID` (theo mẫu user-assets) và dựng `Lesson3D` văn phòng từ `roles.ts` |
| `src/styles/vpo.css` (mới) | Tiền tố **`vpo-`** (văn phòng ảo). Đã kiểm tra: chưa có file `vpo.css` và chưa có lớp `vpo-` nào trong `src` |
| `src/components/admin/AdminNav.tsx` (sửa 1 dòng + import icon) | Mục menu |
| `scripts/check-office-roles.ts` (mới), `package.json` (thêm `check:office`) | Kiểm tra đồng bộ với `.claude/agents` |

Không đụng `src/lib/content|practice|exams|curriculum`, nên không bắt buộc chạy `check:noi-dung`.

## 5. Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| `roles.ts` lệch với `.claude/agents` sau khi sửa agent | Trung bình | `npm run check:office`. Ghi nhắc vào `docs/PHONG-CNTT.md` mục 5 (Trưởng phòng tự sửa) |
| Nội dung vai lọt vào JS công khai | Thấp | Chỉ import `roles.ts` ở server; QA dùng grep trong `.next/static` để kiểm |
| Tưởng nhầm là agent "đang chạy" | Thấp | Dòng chú thích cố định trên trang: "Các trợ lý chạy trong Claude Code trên máy của bạn; trang này chỉ để xem và chép lệnh." |
| Đăng ký đồ vật vào `ASSET_BY_ID` dùng chung, có thể làm thư viện bài giảng 3D hiện thêm đồ vật lạ | Thấp | Mã `office-*` không nằm trong `LIB_ASSETS` (danh sách lọc lúc nạp module). Chỉ đăng ký khi mở trang văn phòng |
| Sửa nhầm `engine.ts` làm hỏng bài giảng 3D / thao giảng | Trung bình | Giai đoạn 1 cấm sửa engine. Nếu buộc phải sửa thì QA chạy lại kịch bản Xưởng bài giảng 3D |
| Vòng vẽ của Stage3D chạy liên tục, tốn GPU khi để tab mở | Thấp | Trình duyệt tự giảm `requestAnimationFrame` ở tab ẩn. Chế độ lite cho máy yếu. Giai đoạn 2 mới thêm tạm dừng |
| Dữ liệu học sinh / pháp lý | Không có | Trang không đọc dữ liệu người dùng nào |

## 6. Kiểm thử
- `npx tsc --noEmit -p .`
- `npx eslint src/app/quan-tri/van-phong src/components/office src/lib/office src/components/admin scripts/check-office-roles.ts`
- `npm run check:office`: đủ 11 agent + Trưởng phòng. Thử đổi tên một file agent thì script phải báo lỗi.
- `npm run build`, sau đó grep `.next/static` không thấy chuỗi lệnh mẫu.
- Kịch bản trên trình duyệt:
  1. Tài khoản system_admin: menu có "Văn phòng ảo", 3D tải được, bấm từng bàn thì camera bay tới và hiện đúng vai, nút Chép lệnh hoạt động.
  2. Tài khoản giáo viên vào thẳng URL: thấy thông báo chặn, menu không có mục. Chưa đăng nhập: chuyển tới `/dang-nhap`.
  3. Điện thoại (DevTools 390 px): mặc định dạng thẻ; chuyển sang 3D vẫn chạm và xoay được.
  4. Tắt WebGL (Chrome `--disable-webgl`): tự về dạng thẻ, không có màn trắng.
  5. DevTools → Rendering → `prefers-reduced-motion: reduce`: camera không bay.
  6. Chỉ dùng bàn phím: Tab qua các ghim / thẻ, Enter mở bảng, Esc đóng bảng và focus quay về chỗ cũ. Chạy NVDA đọc thử tên vai.
  7. Chạy trên máy: "Việc gần nhất" hiện tên file. Bản preview Vercel: hiện "Chỉ xem được khi chạy trên máy".
  8. Mở Xưởng bài giảng 3D sau khi đã vào văn phòng: thư viện đồ vật không có `office-*`.
- Xong việc chạy `graphify update .`.

## 7. Giai đoạn & ước lượng

**Giai đoạn 1 — tối thiểu dùng được (M, khoảng 1–1,5 ngày làm cùng trợ lý)**
1. `roles.ts` + `check-office-roles.ts` (S)
2. `page.tsx` + mục menu + `RolePanel` + `OfficeGrid` (dạng thẻ chạy được độc lập) (S)
3. `scene.ts` + `OfficeStage` (3D bằng Stage3D, chọn bàn, bay camera, lite, các phương án dự phòng) (M)
4. "Việc gần nhất" khi chạy trên máy (S)

Nếu muốn làm nhỏ hơn nữa: dừng sau bước 2 là đã có văn phòng dạng thẻ, dùng được ngay (S); 3D làm sau.

**Giai đoạn 2 — tuỳ chọn (S–M)**
- Sửa nhỏ trong engine, có QA chạy lại bài giảng 3D:
  - `flyTo` đi thẳng không hoạt ảnh khi bật reduced-motion;
  - tạm dừng vòng vẽ khi tab ẩn (theo mẫu `room.ts`).
- Sinh `src/lib/office/recent.json` lúc build (`prebuild`) để Vercel cũng hiện việc gần nhất.
  Đánh đổi: phải commit `docs/`, và dữ liệu chỉ mới đến lần deploy gần nhất.
- Thẻ "Quy trình" vẽ sơ đồ ① → ⑥ của hai phòng ngay trong trang.

**Không đề xuất:** trạng thái agent theo thời gian thực (hook Claude Code ghi vào Supabase). Cách này cần migration, bảng mới,
khoá bí mật trên máy, và đổi lại được rất ít cho một người làm một mình.

## 8. Chia việc

| Vị trí | Việc |
|---|---|
| lap-trinh-vien | Làm bước 1 → 4 giai đoạn 1, đúng danh sách file ở mục 4. Không sửa `engine.ts`. Tự chạy tsc / eslint / `check:office` |
| kiem-thu-qa | Kịch bản 1–8 ở mục 6; kiểm `.next/static` không lộ nội dung vai; xem trên điện thoại |
| van-hanh-trien-khai | Danh sách phát hành: các file mới, `package.json`, không có migration, không có biến môi trường. Nhắc rằng `.claude/agents` và `docs/PHONG-*.md` có commit hay không là do Trưởng phòng quyết định, trang không phụ thuộc vào việc đó |
| csdl-bao-mat | Không cần (không có database). Chỉ rà nhanh mục 3.3 nếu Trưởng phòng muốn |
| noi-dung-giao-duc | Không cần (trang nội bộ, không có nội dung cho học sinh). Tên và giọng chữ theo tài liệu bản sắc ở mức cơ bản |

---

**Chờ Trưởng phòng duyệt kế hoạch.**

Tóm tắt:
1. 3D dùng lại `Stage3D` (three.js 0.160, không R3F) ở chế độ trình chiếu: xoay, bay camera, bấm chọn và ghim nút HTML đều có sẵn.
2. Đồ vật dùng lại: `adult`, `computer`, `pot-plant`, `sign` / `label`, rô-bốt `k-character`, biểu tượng f3d, ảnh Milo; bàn tự dựng.
3. Dữ liệu tĩnh `src/lib/office/roles.ts`, `check:office` đối chiếu `.claude/agents`; không migration, không gọi AI.
4. Có dạng thẻ 2D cho điện thoại / lỗi WebGL / bàn phím; tôn trọng reduced-motion; three.js chỉ tải ở trang này.
5. Giai đoạn 1 cỡ M (dạng thẻ riêng cỡ S), chỉ quản trị thấy, mục "Văn phòng ảo" trong menu, CSS tiền tố `vpo-`.
