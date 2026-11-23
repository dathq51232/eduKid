// Văn phòng ảo (Quản trị › Văn phòng ảo): danh sách vị trí của Phòng CNTT và Phòng Marketing.
// Nguồn: bảng mục 1 và mục 3 "Cách giao việc" của docs/PHONG-CNTT.md, docs/PHONG-MARKETING.md; tools lấy từ .claude/agents/*.md.
// CHỈ import file này ở phía máy chủ (src/app/quan-tri/van-phong/page.tsx) rồi truyền xuống client qua props, để nội dung
// không lọt vào file JS công khai /_next/static. Component client chỉ được `import type` từ đây.
// Sửa agent trong .claude/agents thì sửa luôn file này, rồi chạy `npm run check:office`.

import type { OfficeAccess, OfficeDept } from './labels';

export type { OfficeAccess, OfficeDept } from './labels';

export type OfficeRole = {
  /** tên agent (trùng `name:` trong .claude/agents/<id>.md); Trưởng phòng là 'truong-phong' */
  id: string;
  agent: boolean;
  dept: OfficeDept;
  title: string;
  /** nhãn ngắn trên ghim 3D (≤ 14 ký tự, để ghim không đè nhau ở toàn cảnh); tên đầy đủ ở bảng thông tin */
  short: string;
  /** tên file hình 3D trong public/emoji/f3d (không có .webp) */
  icon: string;
  duties: string[];
  access: OfficeAccess;
  accessText: string;
  /** đúng thứ tự trong frontmatter `tools:` của file agent (Trưởng phòng: rỗng) */
  tools: string[];
  /** thư mục nộp bài (chỉ docs/ke-hoach, docs/marketing được đọc "việc gần nhất") */
  outDirs: string[];
  /** câu giao việc mẫu để dán vào Claude Code */
  commands: string[];
  /** vị trí bàn trên sa bàn 22 × 16 */
  seat: { x: number; z: number };
};

export const OFFICE_ROLES: OfficeRole[] = [
  {
    id: 'truong-phong', agent: false, dept: 'lanh-dao', title: 'Trưởng phòng', short: 'Trưởng phòng', icon: 'owl',
    duties: ['Đặt yêu cầu, duyệt kế hoạch và duyệt kết quả', 'Commit / push, chạy migration trên Supabase', 'Đổi biến môi trường Vercel, tự đăng bài và gửi tin'],
    access: 'toan-quyen', accessText: 'Toàn quyền. Là người duy nhất được commit, push, chạy SQL trên Supabase thật và đổi biến môi trường.',
    tools: [], outDirs: [],
    commands: ['Chạy quy trình phòng CNTT cho việc: …', 'Chạy quy trình phòng Marketing cho chiến dịch: …'],
    seat: { x: 0, z: 4.6 },
  },
  // ---------- Phòng CNTT ----------
  {
    id: 'kien-truc-su', agent: true, dept: 'cntt', title: 'Kiến trúc sư / Tech lead', short: 'Kiến trúc sư', icon: 'construction-worker',
    duties: ['Phân tích yêu cầu, khảo sát mã', 'Lập kế hoạch kỹ thuật (bảng, migration, màn hình, rủi ro, cách kiểm)', 'Chia việc cho các vị trí'],
    access: 'ghi-tai-lieu', accessText: 'Đọc mã; chỉ ghi file kế hoạch trong docs/ke-hoach/. Không viết mã sản phẩm.',
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'Write'], outDirs: ['docs/ke-hoach'],
    commands: ['Dùng kien-truc-su lập kế hoạch cho: …'],
    seat: { x: -9.3, z: -4.8 },
  },
  {
    id: 'lap-trinh-vien', agent: true, dept: 'cntt', title: 'Lập trình viên full-stack', short: 'Lập trình viên', icon: 'laptop',
    duties: ['Viết mã theo kế hoạch đã duyệt: component, trang, hàm, migration, CSS', 'Tự chạy tsc, eslint, check:noi-dung trước khi báo xong'],
    access: 'sua-ma', accessText: 'Đọc và sửa mã. Không commit, không push, không chạy migration trên Supabase thật.',
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write'], outDirs: [],
    commands: ['Kế hoạch docs/ke-hoach/<tên file>.md đã duyệt, giao lap-trinh-vien làm.'],
    seat: { x: -6, z: -4.8 },
  },
  {
    id: 'csdl-bao-mat', agent: true, dept: 'cntt', title: 'CSDL & Bảo mật', short: 'CSDL & Bảo mật', icon: 'locked',
    duties: ['Duyệt migration, RLS, hàm security definer, Storage / Realtime', 'Rà luồng tiền và dữ liệu học sinh; chạy thử trên PGlite'],
    access: 'chi-doc', accessText: 'Chỉ đọc và chạy thử. Không sửa mã, không chạy SQL trên Supabase thật.',
    tools: ['Read', 'Grep', 'Glob', 'Bash'], outDirs: [],
    commands: ['Cho csdl-bao-mat rà migration và quyền của phần vừa làm.'],
    seat: { x: -2.7, z: -4.8 },
  },
  {
    id: 'kiem-thu-qa', agent: true, dept: 'cntt', title: 'Kiểm thử (QA)', short: 'Kiểm thử QA', icon: 'bug',
    duties: ['Chạy các bộ kiểm (tsc, eslint, check:…)', 'Rà kịch bản theo vai, trường hợp biên, giao diện điện thoại'],
    access: 'chi-doc', accessText: 'Chỉ đọc và chạy kiểm. Tìm lỗi và báo cáo, không sửa mã.',
    tools: ['Read', 'Grep', 'Glob', 'Bash'], outDirs: [],
    commands: ['Cho kiem-thu-qa rà phần vừa làm theo kế hoạch docs/ke-hoach/<tên file>.md.'],
    seat: { x: -9.3, z: -0.6 },
  },
  {
    id: 'noi-dung-giao-duc', agent: true, dept: 'cntt', title: 'Nội dung & Sư phạm', short: 'Nội dung & SP', icon: 'books',
    duties: ['Duyệt câu hỏi, kiến thức, đề, phiếu, lời Milo', 'Giữ đúng bản sắc và lứa tuổi; chạy check:noi-dung'],
    access: 'chi-doc', accessText: 'Chỉ đọc và chạy kiểm. Đưa câu sửa cụ thể, không sửa mã.',
    tools: ['Read', 'Grep', 'Glob', 'Bash'], outDirs: [],
    commands: ['Cho noi-dung-giao-duc rà nội dung và chữ cho học sinh của phần vừa làm.'],
    seat: { x: -6, z: -0.6 },
  },
  {
    id: 'van-hanh-trien-khai', agent: true, dept: 'cntt', title: 'Vận hành & Triển khai', short: 'Vận hành', icon: 'spiral-calendar',
    duties: ['Soạn danh sách phát hành: file commit, thứ tự migration, biến môi trường', 'Cách quay lại, commit message đề xuất, theo dõi sau phát hành'],
    access: 'chi-doc', accessText: 'Chỉ đọc (chạy lệnh xem). Không tự push, không chạy SQL trên Supabase.',
    tools: ['Read', 'Grep', 'Glob', 'Bash'], outDirs: [],
    commands: ['van-hanh-trien-khai soạn danh sách phát hành cho phần vừa làm.'],
    seat: { x: -2.7, z: -0.6 },
  },
  // ---------- Phòng Marketing ----------
  {
    id: 'mkt-chien-luoc', agent: true, dept: 'marketing', title: 'Chiến lược Marketing', short: 'Chiến lược', icon: 'light-bulb',
    duties: ['Đặt mục tiêu, chọn mồi, thông điệp, kênh, lịch đăng, ngân sách', 'Viết kế hoạch chiến dịch và chia việc'],
    access: 'ghi-tai-lieu', accessText: 'Đọc, ghi bản nháp kế hoạch chiến dịch. Không đăng bài, không gửi tin.',
    tools: ['Read', 'Grep', 'Glob', 'Write'], outDirs: ['docs/marketing'],
    commands: ['mkt-chien-luoc lập kế hoạch chiến dịch …, mục tiêu …'],
    seat: { x: 2.7, z: -4.8 },
  },
  {
    id: 'mkt-noi-dung', agent: true, dept: 'marketing', title: 'Nội dung Marketing', short: 'Nội dung MKT', icon: 'pencil',
    duties: ['Viết bài Facebook / Zalo / mô tả TikTok, 3 phiên bản', 'Đúng giọng Milo, có link UTM'],
    access: 'ghi-tai-lieu', accessText: 'Đọc, ghi bản nháp bài viết. Trưởng phòng duyệt và tự đăng.',
    tools: ['Read', 'Grep', 'Glob', 'Write'], outDirs: ['docs/marketing/bai-viet'],
    commands: ['Kế hoạch đã duyệt. mkt-noi-dung viết 3 bài tuần 1.'],
    seat: { x: 6, z: -4.8 },
  },
  {
    id: 'mkt-video', agent: true, dept: 'marketing', title: 'Video ngắn', short: 'Video ngắn', icon: 'clapper-board',
    duties: ['Kịch bản video thao tác (quay màn hình 15–30 giây)', 'Kịch bản video bài học cho Xưởng video (9:16), lời đọc, phụ đề'],
    access: 'ghi-tai-lieu', accessText: 'Đọc, ghi bản nháp kịch bản. Không tự dựng hay đăng video.',
    tools: ['Read', 'Grep', 'Glob', 'Write'], outDirs: ['docs/marketing/video'],
    commands: ['mkt-video viết 2 kịch bản video thao tác cho chiến dịch …'],
    seat: { x: 9.3, z: -4.8 },
  },
  {
    id: 'mkt-cong-dong', agent: true, dept: 'marketing', title: 'Cộng đồng & Chăm sóc giáo viên', short: 'Cộng đồng GV', icon: 'speech-balloon',
    duties: ['Chuỗi tin đón giáo viên mới, giữ chân, đại sứ', 'Trả lời câu hỏi thường gặp, gom phản hồi'],
    access: 'ghi-tai-lieu', accessText: 'Đọc, ghi bản nháp tin nhắn. Không tự gửi.',
    tools: ['Read', 'Grep', 'Glob', 'Write'], outDirs: ['docs/marketing/cong-dong', 'docs/marketing/phan-hoi'],
    commands: ['mkt-cong-dong soạn chuỗi tin đón giáo viên mới cho chiến dịch …'],
    seat: { x: 2.7, z: -0.6 },
  },
  {
    id: 'mkt-phan-tich', agent: true, dept: 'marketing', title: 'Phân tích tăng trưởng', short: 'Phân tích', icon: 'abacus',
    duties: ['Báo cáo tuần từ số liệu Trưởng phòng xuất ra', 'Chỉ ra kênh / mồi hiệu quả, phễu rơi ở đâu'],
    access: 'ghi-tai-lieu', accessText: 'Đọc số liệu đã xuất, ghi bản nháp báo cáo. Không truy cập cơ sở dữ liệu thật.',
    tools: ['Read', 'Grep', 'Glob', 'Write'], outDirs: ['docs/marketing/bao-cao'],
    commands: ['mkt-phan-tich đọc docs/marketing/so-lieu/<ngày>.csv và báo cáo tuần.'],
    seat: { x: 6, z: -0.6 },
  },
];

/** Góc camera khi bay tới một bàn: trước bàn, cao 5,8, lùi 6,4, lệch 1,6 về phía giữa phòng, nhìn chếch xuống
 *  (thấy cả bàn, nhân vật đứng sau bàn và bảng biểu tượng ở góc bàn; màn hình máy tính ở góc trái không che nhân vật) */
export function seatCamera(seat: { x: number; z: number }) {
  const dx = seat.x > 0 ? -1.6 : 1.6;
  return { cam: [seat.x + dx, 5.8, seat.z + 6.4], tgt: [seat.x, 1.4, seat.z - 0.4] };
}

/** "Việc gần nhất": chỉ tên file + ngày sửa, không đọc nội dung */
export type OfficeRecent =
  | { state: 'ok'; file: string; dir: string; date: string }
  | { state: 'empty' }
  /** chạy trên Vercel (không có thư mục docs/) */
  | { state: 'local-only' }
  /** vị trí không nộp file (làm thẳng trong mã / báo cáo trong Claude Code) */
  | { state: 'none' };

/** Phần truyền xuống client (props từ server component) */
export type OfficeRoleView = OfficeRole & { cam: number[]; tgt: number[]; recent: OfficeRecent };
