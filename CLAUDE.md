# EduChain Kids — ghi chú cho trợ lý AI (đọc trước, đỡ phải mở nhiều file)

- Next.js 15 App Router + React 19 + TypeScript, Supabase (RLS, migrations trong `supabase/migrations`), CSS một file `src/app/globals.css` (tiền tố theo khu vực: `dk-`/`cv-` trình soạn bài giảng, `qz-` làm bài, `cb-` chọn bài, `td-` thi đua…). Icon: lucide-react; hình 3D: `public/emoji/f3d` (`src/lib/deck/f3d-catalog.ts`, `src/lib/emoji-3d.ts`).
- Trả lời người dùng bằng tiếng Việt, ngắn gọn; giao diện, chú thích code cũng bằng tiếng Việt.
- Bản đồ nhanh:
  - Học sinh: `src/app/chon-bai`, `src/app/lam-bai` (câu hỏi `src/components/questions/*`), nội dung `src/lib/content/*` (rất lớn — đừng đọc cả file, dùng graphify / grep tên bài), bộ sinh câu `src/lib/practice/*`.
  - Giáo viên: `src/app/giao-vien/lop/[id]/*`; kế hoạch bài dạy `src/components/classroom/LessonPlanner.tsx`, `PlanWorkspace.tsx`, `src/lib/plans/*` (giáo án, lịch báo giảng, xuất Word `src/lib/docx-write.ts`).
  - Bài giảng / thao giảng: `src/components/deck/DeckStudio.tsx` (trình soạn kiểu Canva), `SlideView.tsx` (vẽ trang, kéo/xoay/sửa chữ), `DeckPlayer.tsx` (trình chiếu), dữ liệu `src/lib/deck/types.ts`, bộ mẫu `theme-sets.ts`.
  - Đề / phiếu: `src/components/exams/*`, `src/lib/exams/*`.
- Kiểm tra trước khi giao: `npx tsc --noEmit -p .` và `npx eslint <thư mục đã sửa>`.
- Hiệu năng: không setState theo từng khung hình / mỗi 100–200 ms cho cả trang (gom lại, chỉ cập nhật khi giá trị hiển thị đổi); hoạt ảnh nền chỉ dùng `transform`/`opacity` trên phần tử HTML riêng (không animate phần tử bên trong SVG toàn màn hình).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
