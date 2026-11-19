// Chạy MỌI bước kiểm tra câu hỏi & kiến thức một lượt, in bảng tổng kết, thoát mã 1 nếu có bước lỗi.
// Chạy: npm run check:noi-dung          (đầy đủ — trước khi giao / deploy)
//       npm run check:noi-dung -- nhanh (ít đề sinh ngẫu nhiên hơn — git pre-commit dùng chế độ này)
import { spawnSync } from 'node:child_process';

const fast = process.argv.includes('nhanh');
const STEPS = [
  ['Bài soạn sẵn: cấu trúc, đáp án, YCCĐ, phạm vi', 'check-content.ts', []],
  ['Kiến thức: tính lại mọi phép tính / so sánh', 'check-knowledge.ts', [fast ? '8' : '60']],
  ['Bộ sinh câu luyện tập', 'check-practice.ts', [fast ? '60' : '500']],
  ['Chuyên đề nâng cao (vét cạn đáp án)', 'check-advanced.ts', []],
  ['Chính tả từ ngữ trên phiếu', 'check-spelling.ts', []],
  ['Đếm hình', 'check-count-shapes.ts', []],
  ['Đổi bộ câu hỏi không trùng', 'check-sets.ts', []],
  ['Ma trận & đề kiểm tra', 'check-exams.ts', []],
  ['Trò chơi học tập', 'check-games.ts', []],
  ['Toán song ngữ: bản dịch tiếng Anh', 'check-song-ngu.ts', fast ? ['nhanh'] : []],
];

const rows = [];
let failed = 0;
for (const [name, file, args] of STEPS) {
  const t0 = Date.now();
  const r = spawnSync(`npx tsx scripts/${file} ${args.join(' ')}`, { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const ok = r.status === 0;
  if (!ok) {
    failed++;
    console.log(`\n✗ ${name} (${file}) — trích lỗi:`);
    console.log(((r.stdout ?? '') + (r.stderr ?? '')).split('\n').filter((l) => /✗|lỗi|Error|error/.test(l)).slice(0, 25).join('\n'));
  }
  rows.push({ bước: name, kết_quả: ok ? '✓' : '✗', giây: Math.round((Date.now() - t0) / 1000) });
}
console.table(rows);
if (failed) {
  console.log(`\n${failed} bước có lỗi — sửa rồi chạy lại: npm run check:noi-dung`);
  process.exit(1);
}
console.log('\n✓ Toàn bộ câu hỏi và kiến thức đạt.');
