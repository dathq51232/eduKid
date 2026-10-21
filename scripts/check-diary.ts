// Kiểm tra Sổ lớp hằng ngày (phần tính toán): npx tsx scripts/check-diary.ts
import { absentStreaks, alertsOf, isMarked, kindsOf, messageFor, monthSheet, summarize, type Entry } from '../src/lib/classroom/diary';

let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('✗', m); } };
const st = { id: 'a', name: 'Ngô Khánh Linh' };
const E = (x: Partial<Entry>): Entry => ({ status: 'present', tags: [], note: '', ...x });

ok(messageFor(st, undefined, '2026-10-22') === null, 'em không có gì thì không có tin nhắn');
ok(messageFor(st, E({}), '2026-10-22') === null, 'có mặt, không ghi chú thì không có tin nhắn');
const tags = ['★ Phát biểu tốt', '★ Tiến bộ', '★ Giúp bạn', '★ Viết đẹp', '★ Ngoan, lễ phép', 'Quên đồ dùng', 'Chưa làm bài', 'Nói chuyện riêng', 'Đi học muộn'];
for (const status of ['present', 'excused', 'unexcused'] as const) {
  for (let mask = 0; mask < 1 << 4; mask++) {
    const pick = [tags[0], tags[1], tags[5], tags[6]].filter((_, i) => mask & (1 << i));
    for (const note of ['', 'Đọc trơn bài 8.']) {
      const e = E({ status, tags: pick, note });
      const m = messageFor(st, e, '2026-10-22', mask % 2 ? 'thay' : 'co');
      if (!isMarked(e)) { ok(m === null, 'không đánh dấu thì không tin'); continue; }
      ok(!!m && m.startsWith('Kính gửi phụ huynh em Khánh Linh,'), `mở đầu đúng: ${m}`);
      ok(!!m && !/\s[,.]|\.\.|undefined|null|\s{2}/.test(m), `không lỗi dấu câu: ${m}`);
      ok(!!m && !/điểm/.test(m), 'không chứa điểm số');
      if (status === 'unexcused') ok(!!m && m.includes('chưa có xin phép') && m.includes('22/10'), 'vắng không phép có ngày');
      if (status === 'present' && pick.includes('Chưa làm bài')) ok(!!m && m.includes('bài tập về nhà'), 'nhắc chưa làm bài');
      if (mask % 2) ok(!!m && !/\bcô\b/i.test(m.replace('Kính gửi', '')), `xưng thầy không còn "cô": ${m}`);
    }
  }
}
ok(kindsOf(E({ status: 'unexcused', tags: ['★ Tiến bộ', 'Chưa làm bài'] })).join() === 'absent,praise,remind', 'phân loại tin nhắn');

// tổng hợp tháng
const students = [{ id: 'a', name: 'An' }, { id: 'b', name: 'Bình' }];
const days = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06'];
const data = {
  days: days.map((day) => ({ day })),
  entries: [
    { student_id: 'a', day: '2026-10-05', status: 'unexcused' as const, tags: [] },
    { student_id: 'a', day: '2026-10-06', status: 'unexcused' as const, tags: [] },
    { student_id: 'b', day: '2026-10-01', status: 'excused' as const, tags: [] },
    ...days.map((day) => ({ student_id: 'b', day, status: 'present' as const, tags: ['★ Tiến bộ', 'Chưa làm bài'] })).slice(1),
    { student_id: 'b', day: '2026-10-09', status: 'unexcused' as const, tags: [] }, // ngày chưa điểm danh: bỏ qua
  ],
};
const sum = summarize(students, data);
const [a, b] = sum.rows;
ok(a.present === 2 && a.unexcused === 2 && a.excused === 0, 'đếm buổi của An');
ok(b.present === 3 && b.excused === 1 && b.unexcused === 0 && b.praise === 3 && b.remind === 3, 'đếm buổi và nhãn của Bình');
const al = alertsOf(sum.rows);
ok(al.some((x) => x.studentId === 'a' && x.text.includes('2 buổi không phép')), 'cảnh báo vắng không phép');
ok(al.some((x) => x.studentId === 'b' && x.text.includes('chưa làm bài')), 'cảnh báo nhắc lặp lại');
ok(absentStreaks(sum.rows, sum.days).some((x) => x.name === 'An' && x.n === 2), 'vắng liên tiếp 2 buổi');
const sh = monthSheet('1A1', 'Tháng 10/2026', sum.days, sum.rows);
ok(sh.rows.length === 4 + 2 && (sh.rows[3] as unknown[]).length === 2 + 4 + 5, 'bảng Excel đủ dòng, đủ cột');

console.log(fail ? `✗ ${fail} lỗi` : '✓ Sổ lớp: tin nhắn đúng cho mọi tổ hợp vắng/khen/nhắc/ghi chú, không chứa điểm số; tổng hợp tháng và cảnh báo đúng');
process.exit(fail ? 1 : 0);
