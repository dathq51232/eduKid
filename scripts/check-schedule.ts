// Kiểm tra đọc lịch báo giảng Excel → giáo án (dữ liệu demo tự tạo theo file mẫu): npm run check:schedule
import { buildXlsx } from '../src/lib/xlsx';
import { readXlsx } from '../src/lib/xlsx-read';
import { matchLesson, parseSchedule, plansFromSchedule, scheduleTemplate, subjectOf } from '../src/lib/plans/schedule';
import { lessonInfos } from '../src/lib/plans/lessons';

let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) pass++; else { fail++; console.log('✗', m); } };

(async () => {
  // tên môn
  const S: [string, string, boolean][] = [['Toán', 'toan', false], ['Toán (BS)', 'toan', true], ['Tiếng Việt (BS)', 'tieng-viet', true], ['HĐTN1', 'hdtn', false], ['TNXH', 'tnxh', false],
    ['GD thể chất', 'gdtc', false], ['Mĩ thuật', 'mi-thuat', false], ['Âm nhạc', 'am-nhac', false], ['Đạo đức', 'dao-duc', false], ['Tiếng Anh', 'tieng-anh', false], ['LS&ĐL', 'ls-dl', false], ['Khoa học', 'khoa-hoc', false]];
  for (const [l, s, x] of S) { const r = subjectOf(l); ok(r.subject === s && r.extra === x, `môn ${l} → ${r.subject}/${r.extra}`); }
  // ghép bài
  for (const g of [1, 2, 3, 4, 5]) {
    const toan = lessonInfos('toan', g), tv = lessonInfos('tieng-viet', g), ta = lessonInfos('tieng-anh', g);
    ok(matchLesson('toan', `Bài 5: ${toan[4].title} - Tiết 2`, toan)?.id === toan[4].id, `Toán ${g} Bài 5`);
    const m = /Bài\s*(\d+)/.exec(tv[2].ref); if (m) ok(matchLesson('tieng-viet', `Bài ${m[1]}: … - Tiết 1`, tv)?.id === tv[2].id, `TV ${g} Bài ${m[1]}`);
    ok(matchLesson('tieng-anh', 'Unit 3: … - Lesson 1 (1, 2)', ta)?.ref === 'Unit 3', `TA ${g} Unit 3`);
    ok(matchLesson('tieng-anh', 'Review 1', ta)?.ref === 'Review 1', `TA ${g} Review 1`);
  }
  // file mẫu → điền → đọc lại
  const sh = scheduleTemplate(1, '2026-10-05', '5');
  const put = (r: number, mon: string, ppct: number, bai: string, th = '') => { sh.rows[r][3] = mon; sh.rows[r][4] = ppct; sh.rows[r][5] = bai; sh.rows[r][6] = th; };
  put(4, 'HĐTN1', 13, 'Sinh hoạt dưới cờ'); put(5, 'Toán', 13, 'Bài 4: So sánh số - Tiết 4'); put(6, 'Tiếng Việt', 49, 'Bài 16: M m N n - Tiết 1');
  put(8, 'Toán (BS)', 9, 'Ôn tập'); put(11, 'Đạo đức', 5, 'Bài 5: Gia đình của em', 'GDQCN: Quyền trẻ em'); put(25, 'Tiếng Anh', 10, 'Unit 3: At the street market - Lesson 2');
  put(32, 'Tiếng Việt', 59, 'Ôn luyện tuần 5 - Tiết 1');
  const sch = parseSchedule(await readXlsx(buildXlsx([sh])));
  ok(sch.grade === 1 && sch.week === '5' && sch.monday === '2026-10-05', `đầu trang ${sch.grade}/${sch.week}/${sch.monday}`);
  ok(sch.rows.length === 7, `7 tiết (${sch.rows.length})`);
  const d = sch.rows.map((r) => `${r.date} ${r.session} ${r.period}`);
  ok(d[0] === '2026-10-05 Sáng 1' && d[3] === '2026-10-05 Chiều 1' && d[4] === '2026-10-06 Sáng 1' && d[6] === '2026-10-09 Sáng 1', `ngày/buổi/tiết ${d.join(' | ')}`);
  const plans = plansFromSchedule(sch, { grade: 1, className: '1A', lessonsBySubject: { toan: lessonInfos('toan', 1), 'tieng-viet': lessonInfos('tieng-viet', 1), 'tieng-anh': lessonInfos('tieng-anh', 1) } });
  ok(plans.map((p) => p.kind).join(',') === 'khung,app,app,review,khung,app,review', `loại giáo án ${plans.map((p) => p.kind)}`);
  ok(plans[1].lessonId === 'toan1-kntt-b04' && plans[2].lessonId === 'tv1-kntt-t04' && plans[5].lessonId === 'ta1-gs-u03', 'ghép đúng bài app');
  ok(plans[3].lessonId === 'toan1-kntt-b04' && plans[6].lessonId === 'tv1-kntt-t04', 'tiết ôn tập theo bài trọng tâm của tuần');
  ok(plans[4].plan.integration === 'GDQCN: Quyền trẻ em' && plans[4].plan.ppct === '5' && plans[4].plan.subject === 'dao-duc', 'tích hợp, PPCT, môn ngoài app');
  ok(plans.every((p) => p.plan.title.length >= 2 && p.plan.activities.length === 4 && p.plan.date), 'đủ 4 hoạt động, có ngày');
  // khác khối → không ghép bài app
  const other = plansFromSchedule(sch, { grade: 3, className: '3A', lessonsBySubject: { toan: lessonInfos('toan', 3) } });
  ok(other.every((p) => p.kind !== 'app'), 'lịch khối 1 cho lớp 3: không ghép bài app');
  // lỗi file
  let err = '';
  try { parseSchedule({ name: 'x', rows: [['a', 'b']], merges: [] }); } catch (e) { err = String(e); }
  ok(err.includes('tiêu đề'), 'báo lỗi khi thiếu dòng tiêu đề');
  try { await readXlsx(new Uint8Array([1, 2, 3])); err = ''; } catch (e) { err = String(e); }
  ok(err.includes('.xlsx'), 'báo lỗi file không phải .xlsx');
  console.log(`check:schedule ${pass}/${pass + fail}`);
  if (fail) process.exit(1);
})();
