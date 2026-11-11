---
name: deck-layout
description: Quy tắc bố cục và thẩm mỹ cho trình soạn bài giảng EduChain Kids (DeckStudio / SlideView / bộ sinh slide tự động fromLesson, fromIdeas, theme-sets). Dùng khi thêm hoặc sửa mẫu trang, bộ sinh slide tự động, cảnh nền, bộ chủ đề, hoặc khi người dùng than slide sinh ra bị chồng chữ, lệch, rối, xấu.
---

# Bố cục slide bài giảng — EduChain Kids

Người xem là **học sinh tiểu học (6–11 tuổi) nhìn màn chiếu từ cuối lớp**; người soạn là giáo viên chỉ muốn sửa chữ. Mọi quyết định bố cục phục vụ hai điều: **đọc được từ xa** và **mỗi trang một việc**.

Kết hợp: skill `frontend-design` (gu thẩm mỹ chung, tránh mẫu rập khuôn) và `slides/references/layout-patterns.md` (danh mục bố cục). Skill này là luật riêng của dự án — khi mâu thuẫn, skill này thắng.

## 1. Bản đồ mã (đọc bảng, đừng mở cả file)

| Việc | File | Ghi chú |
|---|---|---|
| Kiểu dữ liệu, khổ trang, nền | `src/lib/deck/types.ts` | `SW = 1600, SH = 900` (toạ độ px tuyệt đối); `El` = text/img/shape/quiz/drop/sort/teams/scene3d; `role` dùng để đổi chủ đề; `BGS`, `darkBg()` |
| Cảnh nền minh hoạ | `src/lib/deck/scenes.ts` | `SCENES`, `SCENE_GROUPS`, `inkOf(sc)` (màu chữ hợp cảnh), `accentOf(sc)`, `pickScene(text)`; mỗi cảnh có 5 góc máy `variants` |
| Bộ sinh từ bài học / giáo án | `src/lib/deck/fromLesson.ts` | helper `T/I/S/A`, `fit()`, `title()`, `editorialHeader`, `bentoGrid`, `qPage`, `coverPage`, `planSlides`, `applyTheme` |
| Bộ sinh từ ý tưởng hoạt động | `src/lib/deck/fromIdeas.ts` | `studentSlide`, `studentLayout`, `activitySlides`, `deckFromIdeas` |
| Bộ mẫu 7 trang theo chủ đề | `src/lib/deck/theme-sets.ts` | `THEME_SETS` (card/edge/title/text/mascots/deco/tape), `STEP_COLOR`, `STEPS` |
| Mẫu trang rời | `src/lib/deck/templates.ts` | |
| Vẽ / trình chiếu | `src/components/deck/SlideView.tsx`, `SceneBg.tsx`, `DeckPlayer.tsx` | |
| Hình 3D | `src/lib/deck/f3d-catalog.ts` → `f3dSrc(name)` | chỉ dùng hình có sẵn trong `public/` (edu-icons → stickers/hd → emoji/f3d) |
| Cỡ chữ vừa khung | `src/lib/deck/fit.ts` | `fit`, `fits`, `shrinkToFit` (helper `T()` tự co chữ), `quizSizes` (khung trắc nghiệm chọn cỡ chữ theo nội dung — SlideView dùng) |
| Bố cục khác (Magic Layout) | `src/lib/deck/relayout.ts` | `relayout(slide, k)` gom vật thành khối, xếp theo 4 bố cục, tự bỏ bố cục làm chữ nhỏ / tràn / chồng; nút "Bố cục khác" trong DeckStudio |
| Kiểm tra bố cục | `scripts/check-deck-layout.ts` → `npm run check:deck-layout` | thêm assert khi thêm mẫu trang mới |
| Kiểm tra toàn ngân hàng | `scripts/check-deck-all.ts` → `npm run check:deck-all` (`--verbose`) | sinh slide cho MỌI bài + 6 bộ chủ đề + mẫu rời + mọi bố cục khác; báo tràn, chồng, chữ < 20/28 px. Phải ra "✓ Không có lỗi bố cục" |

## 2. Lưới và vùng an toàn (khổ 1600 × 900)

- Lề an toàn: **x 64–1536, y 40–860**. Không đặt chữ ngoài vùng này (máy chiếu cắt mép).
- Lưới 12 cột: cột ≈ 112 px, rãnh 24 px, lề 64 px. Căn mép trái các khối chữ vào cùng một trục (thường x = 92 hoặc 96 như `editorialHeader`, `coverPage`).
- Dải tiêu đề: y 38–170. Dải nội dung: y 165–700. Dải đúc kết / mascot: y 700–860.
- Khoảng cách giữa các khối ≥ 24 px; trong thẻ đệm ≥ 20 px.

### Vùng chữ theo góc máy cảnh nền (`sceneVariant`)

Cảnh vẽ ở phía sau; chữ **không được đè lên hình cảnh**. Chọn góc máy theo bố cục, không ngược lại:

| Góc máy | Hình cảnh nằm ở | Vùng đặt chữ / nội dung | Dùng cho |
|---|---|---|---|
| `cover` | nửa phải + đáy | x 96–940, y 56–600 | Trang bìa |
| `right` | x ≥ 900 | x 92–917 (thẻ note `bentoGrid` 1–3 ý) | Dàn ý ngắn, trang chia |
| `left` | x ≤ 620 | x 640–1520 | Nội dung có hình minh hoạ đặt trái |
| `bottom` | y ≥ 560 và rìa | x 96–1376, y 150–630 | Lưới 2×2, câu hỏi, bảng thi đua |
| `center` | rải rìa bốn góc | khung giữa x 230–1370 | Câu hỏi trắc nghiệm, dẫn nhập |
| `quiet` | chỉ màu nền + 1 hình nhỏ góc phải dưới | cả trang | **Mặc định cho trang nội dung** (planSlides tự đặt khi trang không chọn góc máy) |

Cảnh đầy đủ chỉ dùng cho bìa, trang chia, trang tình huống; trang nội dung dùng `quiet` để chữ nổi bật. Mỗi trang (trừ bìa) có thanh tiến trình 5 bước `progressEls(phase)` ở y 8–20 — không đặt vật ở dải này.

Khi thêm hình vào `variants` của một cảnh: giữ hình trong vùng "hình cảnh" của góc máy đó, rồi chụp kiểm tra cả 5 góc máy.

## 3. Chữ

- Font: `baloo` cho tiêu đề và câu hỏi (tròn, đậm), `quick` cho thân bài và nhãn, `hand` chỉ dùng cho mẫu tập viết. Tối đa 2 font mỗi trang.
- Cỡ chữ (px trên khổ 1600): tiêu đề trang 46–58, tiêu đề bìa 46–92, câu hỏi 40–60, thân bài **≥ 28** (chỉ xuống 22 khi bắt buộc), đáp án lựa chọn ≥ 32. Không bao giờ dưới 20.
- Luôn dùng `fit(text, w, h, max, min)` thay cho cỡ cố định khi chữ do giáo viên / dữ liệu sinh ra; chọn `max` theo vai trò, `min` theo bảng trên.
- Một dòng ≤ ~40 ký tự ở cỡ thân bài; câu hỏi dài > 170 ký tự → tách trang (xem `qPage` dùng `short(q.ask, 170)`).
- Màu chữ lấy từ `inkOf(scene)` hoặc `ThemeSet.title/text`, không tự đặt mã màu lẻ. Nền tối (`darkBg`, cảnh `space`) → chữ sáng và viền tối.
- Chữ đặt trên cảnh có hoạ tiết: thêm `bg` bán trong (`#ffffffd9`, `rgba(255,255,255,0.55)`) hoặc viền chữ `stroke`.

## 4. Mỗi trang một việc — số lượng tối đa

| Thành phần | Tối đa |
|---|---|
| Ý / gạch đầu dòng | 3 trên thẻ note, 4 trên lưới bento — nhiều hơn thì tách trang |
| Lựa chọn trắc nghiệm | 4 (2 cột nếu mọi lựa chọn ≤ 16 ký tự, ngược lại 1 cột); 5–6 chỉ khi ngắn |
| Ô thả / cặp ghép | 4 |
| Thẻ sắp xếp | 8, mỗi thẻ ≤ 26 ký tự |
| Hình trang trí (deco + mascot) | 3, không tính hình cảnh nền |
| Vật trên trang | ≤ 25 (giới hạn cứng `MAX_ELS = 60`) |

## 5. Mẫu trang chuẩn theo bước tiết dạy

Thứ tự 5 bước (`STEPS`): Khởi động → Khám phá → Luyện tập → Vận dụng → Tổng kết; màu nhãn bước theo `STEP_COLOR`, không đổi.

- **Bìa**: thông tin trường/lớp nhỏ góc trái trên → tên bài IN HOA lớn có viền → môn + tiết dạng huy hiệu → mascot góc phải dưới. Góc máy `cover`.
- **Trang chia (divider)**: một dòng chữ lớn + mascot, góc máy `right`.
- **Khám phá / kiến thức**: `editorialHeader` + `bentoGrid` (1–3 ý → note + `right`; 4 ý → bento 2×2 + `bottom`) + `takeawayStrip` ghi nhớ ở đáy.
- **Câu hỏi**: khung quiz giữa trang x 230, w 1140; mascot nhỏ góc trái dưới; đáp án tự luận che bằng miếng `mystery`.
- **Kéo thả / ghép**: hàng nhãn trên (y≈170) → hàng ô thả (y≈340) → hàng thẻ kéo dưới (y≈620); ba hàng không chồng nhau.
- **Tổng kết / cảm ơn**: ít chữ, mascot lớn, hiệu ứng vui một lần.

Nhịp trang: xen kẽ trang nhiều chữ với trang hình/tương tác; không để quá 2 trang lý thuyết liền nhau.

## 6. Hiệu ứng

- Mỗi trang **một khoảnh khắc chính** (ví dụ: tiêu đề `zoom`, rồi các ý `pop` theo từng lần bấm). Không gắn hiệu ứng nhấn mạnh lặp mãi cho nhiều vật.
- Ý trong danh sách: ý đầu `with`, các ý sau `click` (cô điều khiển nhịp giảng).
- Âm thanh chỉ dùng tên trong `src/lib/deck/sounds.ts`.
- Hoạt ảnh chỉ dùng `transform`/`opacity` (luật hiệu năng của dự án).

## 7. Lỗi hay gặp (kiểm tra trước khi giao)

1. Chữ đè lên hình cảnh vì chọn sai góc máy → đổi `sceneVariant` hoặc dời khối chữ vào đúng vùng ở mục 2.
2. Hai khối chữ chồng nhau khi câu dài → dùng `fit()` và chừa chiều cao theo trường hợp dài nhất; thêm assert `!intersects` vào `check-deck-layout.ts`.
3. Vật vượt mép trang → assert `inBounds`.
4. Trang có 6–8 ý nhồi nhét → tách trang.
5. Màu chữ tự đặt không hợp nền tối/sáng → dùng `inkOf` / `ThemeSet`.
6. Thẻ nào cũng cùng bo góc, cùng bóng, cùng cỡ → tạo thứ bậc: một khối chính lớn, các khối phụ nhỏ hơn.
7. Đổi chủ đề cả bộ làm mất màu → vật mới phải có `role` đúng (`card`, `cardback`, `title`, `badge`, `step`, `mascot`, `deco`, `tape`). `applySet` tự đổi màu chữ theo tương phản WCAG với nền ngay dưới chữ (4,5:1; chữ ≥ 48 px: 3:1).
8. Trắc nghiệm: không tự đặt cỡ chữ — `quizSizes` chọn theo độ dài câu hỏi/đáp án; CSS `.dk-quiz-q, .dk-opt` dòng cao 1,2 phải khớp `fit.ts`.
9. Bộ chủ đề có dấu ấn riêng (`dash`, `tilt`, `sw`, `noBack`, `titleFont` trong `ThemeSet`) — thêm bộ mới thì chọn ít nhất 1 dấu ấn hình khối, không chỉ đổi màu.

## 8. Quy trình khi sửa bộ sinh slide

1. `graphify query "<hàm cần sửa>"` → đọc đúng hàm (`grep -n`), không đọc cả `fromLesson.ts`.
2. Phác bố cục bằng toạ độ trên lưới mục 2 trước khi viết mã; ghi góc máy cảnh dự kiến.
3. Viết mã bằng helper có sẵn (`T/I/S/A`, `fit`, `title`, `editorialHeader`, `bentoGrid`, `cover`).
4. Thêm assert cho mẫu mới vào `scripts/check-deck-layout.ts` (trong khung, không chồng nhau).
5. Chạy: `npm run check:deck-all`, `npm run check:deck-layout`, `npx tsc --noEmit -p .`, `npx eslint src/lib/deck src/components/deck`.
6. Chụp màn hình thật (trình soạn hoặc trang xem trước tạm, xoá trước khi commit) với chữ ngắn **và** chữ dài nhất, trên ít nhất 2 cảnh nền (một sáng, một tối như `space`). Nhìn ảnh rồi mới báo xong.

## 9. Bài sinh theo GỢI Ý: gợi ý = hình thức, bài học = nội dung
- Gợi ý dạy (`src/lib/plans/idea-bank.ts`) và hoạt động trong giáo án (`src/lib/plans/generate.ts`) **không được in nguyên văn lên trang**. Chúng chỉ quyết định HÌNH THỨC trang; nội dung (câu hỏi, kiến thức, bài đọc, từ ngữ) lấy từ chính bài trong ngân hàng.
- Bộ máy chung ở cuối `fromLesson.ts`: `formatOf(spec)` (tên/mô tả hoạt động → `bell | box | wheel | puzzle | race | sort | match | role | read | write | explore | reflect | home`, có lọc theo bước tiết dạy) → `activityPages(spec, actCtx(...))`.
- Các bước tổ chức của cô, thời gian, đáp án → `notes` của trang đầu hoạt động (màn hình của cô). Trên trang chỉ có tên trò (vd “Ai nhanh – Ai đúng”) + nội dung bài.
- Câu đã dùng không lặp (dùng chung `used` + `qs` giữa các bộ dựng; câu cùng đề coi như đã dùng); bài đọc chỉ chiếu một lần (`ctx.readDone`).
- Giáo án giao "các dạng bài: + …" → ưu tiên câu đúng dạng (`formsInText` + `formNamesOf`).
- Trò Toán đặc thù (ngón tay, xe buýt, domino, tia số…) chỉ dùng cho số trong phạm vi 10 của lớp 1; bài số lớn dùng câu của bài.
- Thêm hình thức mới: thêm luật vào `FORMAT_RULES`, khai báo bước hợp lệ ở `PHASE_OK`, viết hàm dựng trả `{ title, slide }[]` (trả `[]` khi bài thiếu nội dung để chuyển hình thức gần nhất) và thêm vào `BUILDERS`.
- `npm run check:deck-all` kiểm cả bài theo gợi ý và theo giáo án của mọi bài: báo "chép nguyên gợi ý lên trang", "lời GV/HS trên trang", "câu hỏi lặp trong bài".

## 10. Nền: hoạ tiết, không hình dán cảnh sau chữ
- Bài tự sinh **không dùng cảnh hình dán** (`slide.scene`) — hình vẽ sau chữ dễ đè, làm mờ chữ. `planSlides` / `deckFromIdeas` gọi `toPattern`: cảnh → nền hoạ tiết cùng tông (`SCENE_PATTERN` trong `scenes.ts`, nền ở `PATTERN_BGS` trong `types.ts`); chữ giữ màu `inkOf(scene)`.
- Chỗ trống mà cảnh từng chiếm (bìa, trang `right`, `left`) → khung `photoEl` "Ảnh minh hoạ" (`role: 'photo'`, `hide: true`, ảnh `/deck/anh-minh-hoa.svg`): ẩn khi chiếu; cô chọn khung → tự bật "Thay hình" → tải ảnh bài tập / SGK của cô lên là lấp vào khung (`hide: false`). Không tự chèn ảnh SGK (bản quyền) — ngân hàng nội dung không có ảnh.
- Hình dán / Milo: cô tự thêm sau trong trình soạn. Bài cũ còn cảnh: nút "🎨 Dùng nền hoạ tiết cho cả bài" ở bảng Nền.
- Thêm nền mới: thêm vào `PATTERN_BGS` (SVG lặp lại, độ đậm ≤ 0,4, nền sáng; nền tối phải thêm vào `darkBg`). `check:deck-all` báo "hình dán cảnh vẽ sau chữ" nếu bài tự sinh còn `scene`.
