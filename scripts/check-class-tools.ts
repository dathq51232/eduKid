// Kiểm tra công cụ trên lớp (phần tính toán): npx tsx scripts/check-class-tools.ts
import {
  addTime, autoSeat, conflictsOf, defaultSeating, fmtClock, formatPhone, groupCount, levelOf, makeGroups, matchStudent, normalizePhone,
  normalizeSeating, shouldTick, groupsFromSeating, groupTitle, normalizeTeams, parseContactPaste, parseTimer, pauseTimer, placeSeat, ranking, relayout, seatCount, seeded, startTimer,
  teamTotals, teamsFromSeating, timerLeft, timerPhase, unseated, weekOf, type Level, type ToolStudent,
} from '../src/lib/classroom/class-tools';

let fail = 0, n = 0;
const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('✗', m); } };
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Võ', 'Đỗ', 'Hoàng', 'Bùi'];
const TEN = ['Minh An', 'Bảo Anh', 'Gia Huy', 'Khánh Linh', 'Tuấn Kiệt', 'Thảo My', 'Nhật Nam', 'Ngọc Hân', 'Quốc Bảo', 'Phương Thảo', 'Đức Duy', 'Mai Chi', 'Hải Đăng', 'Bảo Ngọc', 'Minh Khang', 'Thu Trang'];
const mk = (k: number): ToolStudent[] => Array.from({ length: k }, (_, i) => ({ id: `s${i}`, name: `${HO[i % 8]} ${i >= 16 ? 'Văn ' : ''}${TEN[i % 16]}` }));

/* ---------- chia nhóm */
for (const size of [1, 2, 5, 13, 30, 35, 45]) {
  const st = mk(size);
  const lv: Record<string, Level> = Object.fromEntries(st.map((s, i) => [s.id, (['tot', 'kha', 'hotro', 'chua'] as Level[])[i % 4]]));
  for (const by of ['count', 'size'] as const) for (const k of [1, 2, 3, 4, 6, 8]) for (const mode of ['random', 'balanced'] as const) for (let seed = 1; seed <= 6; seed++) {
    const opts = { by, n: k, mode, leaders: true, skipAbsent: true, desksPer: 2, avoid: [['s0', 's1'], ['s2', 's3']] as [string, string][] };
    const g = makeGroups(st, lv, opts, seeded(seed * 97 + k));
    const all = g.flatMap((x) => x.members);
    ok(all.length === size && new Set(all).size === size, `đủ em, không trùng (${size}/${by}${k}/${mode})`);
    ok(g.length === groupCount(size, opts), `số nhóm đúng (${size}/${by}${k})`);
    const sizes = g.map((x) => x.members.length);
    ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `nhóm chênh nhau tối đa 1 em (${size}/${by}${k}/${mode}: ${sizes})`);
    ok(g.every((x) => x.leader && x.members.includes(x.leader)), 'mỗi nhóm có nhóm trưởng trong nhóm');
    if (g.length >= 2 && size >= 4) ok(conflictsOf(g.map((x) => x.members), opts.avoid).length === 0, `tách cặp không xếp chung (${size}/${by}${k}/${mode}/${seed})`);
    if (mode === 'balanced' && g.length >= 2 && size >= g.length * 4) {
      for (const L of ['tot', 'hotro'] as Level[]) {
        const c = g.map((x) => x.members.filter((id) => lv[id] === L).length);
        ok(Math.max(...c) - Math.min(...c) <= 1, `cân bằng "${L}" giữa các nhóm (${size}/${by}${k}: ${c})`);
      }
    }
  }
}
ok(makeGroups([], {}, { by: 'count', n: 4, mode: 'random', leaders: true, skipAbsent: true, avoid: [], desksPer: 2 }).length === 0, 'lớp trống không lỗi');
{
  const st = mk(10);
  const teams = [['s0', 's1', 's2'], ['s3', 's4'], ['s5', 'x-không-còn']];
  const g = makeGroups(st, {}, { by: 'count', n: 2, mode: 'teams', leaders: false, skipAbsent: true, avoid: [], desksPer: 2 }, seeded(3), teams);
  ok(g.length === 3 && g.flatMap((x) => x.members).length === 10, 'theo tổ: giữ 3 tổ, em chưa có tổ được thêm vào');
  ok(g[0].members.includes('s0') && g[0].members.includes('s2') && !g.flatMap((x) => x.members).includes('x-không-còn'), 'theo tổ: giữ đúng thành viên, bỏ em không còn trong lớp');
  ok(g.every((x) => x.leader === null), 'tắt nhóm trưởng');
}
ok(levelOf(85, 3) === 'tot' && levelOf(60, 1) === 'kha' && levelOf(30, 2) === 'hotro' && levelOf(90, 0) === 'chua' && levelOf(null, 5) === 'chua', 'mức học lực');

/* ---------- sơ đồ chỗ ngồi */
{
  const st = mk(30);
  const s0 = defaultSeating(30);
  ok(s0.cols === 4 && seatCount(s0) >= 30, `mặc định đủ chỗ (${seatCount(s0)})`);
  const s1 = autoSeat(s0, st.map((x) => x.id), seeded(7));
  ok(s1.seats.filter(Boolean).length === 30 && unseated(s1, st).length === 0, 'xếp ngẫu nhiên đủ 30 em');
  ok(s1.seats.slice(0, 24).every(Boolean), 'chỗ trống dồn về cuối lớp');
  const s2 = placeSeat(s1, s1.seats[0]!, 5);
  ok(s2.seats[5] === s1.seats[0] && s2.seats[0] === s1.seats[5], 'kéo vào ghế có người thì đổi chỗ');
  const s3 = placeSeat(s1, s1.seats[0]!, 31);
  ok(s3.seats[31] === s1.seats[0] && s3.seats[0] === null, 'kéo vào ghế trống thì ghế cũ trống');
  const small = relayout(s1, { cols: 3, rows: 4, desk: 'double' });
  ok(seatCount(small) === 24 && small.seats.filter(Boolean).length === 24 && unseated(small, st).length === 6, 'thu nhỏ lớp: 6 em sang "chưa xếp chỗ"');
  const norm = normalizeSeating({ cols: 99, rows: 2, desk: 'group4', seats: ['s1', 's1', 'xx', 's2'] }, st);
  ok(norm.cols === 8 && norm.seats.length === 64 && norm.seats.filter(Boolean).length === 2, 'dữ liệu lạ được làm sạch (trùng, em không còn, quá cỡ)');
  const t = teamsFromSeating(s1);
  ok(t.teams.length === 4 && t.teams.flatMap((x) => x.members).length === 30, 'tổ theo dãy bàn');
  ok(t.teams.every((x, c) => x.members.every((id) => s1.seats.indexOf(id) % 8 >= c * 2 && s1.seats.indexOf(id) % 8 < c * 2 + 2)), 'mỗi tổ đúng dãy');
  const nt = normalizeTeams({ teams: [{ name: 'A', emoji: '🚀', members: ['s1', 's1', 'zz'], leader: 'zz' }, { name: '', emoji: '', members: ['s1'], leader: null }] }, st);
  ok(nt.teams[0].members.length === 1 && nt.teams[1].members.length === 0 && nt.teams[0].leader === null && nt.teams[1].name === 'Tổ 2', 'làm sạch danh sách tổ');
}

/* ---------- chia nhóm theo sơ đồ chỗ ngồi */
{
  const st = mk(30);
  const s1 = autoSeat(defaultSeating(30), st.map((x) => x.id), seeded(11)); // 4 dãy × 4 bàn đôi, 2 ghế trống cuối
  const ids = st.map((x) => x.id);
  for (const k of [1, 2, 3, 4]) {
    const g = groupsFromSeating(s1, ids, k, {}, true, seeded(k));
    const all = g.flatMap((x) => x.members);
    ok(all.length === 30 && new Set(all).size === 30, `theo sơ đồ (${k} bàn/nhóm): đủ 30 em, không trùng`);
    ok(g.every((x) => x.members.length >= 2 || k === 1), `theo sơ đồ (${k} bàn): không có nhóm 1 em`);
    // cùng nhóm thì cùng dãy và các bàn liền nhau
    ok(g.every((x) => new Set(x.members.map((id) => Math.floor(s1.seats.indexOf(id) / 2) % 4)).size === 1), `theo sơ đồ (${k} bàn): mỗi nhóm cùng một dãy`);
  }
  const g2 = groupsFromSeating(s1, ids, 2, {}, false);
  ok(g2.length === 8 && g2.filter((x) => x.members.length === 4).length >= 6, `2 bàn/nhóm: 8 nhóm khoảng 4 em (${g2.map((x) => x.members.length)})`);
  ok(g2.every((x) => x.leader === null), 'tắt nhóm trưởng');
  const absent = new Set(ids.slice(0, 5));
  const g3 = groupsFromSeating(s1, ids.filter((x) => !absent.has(x)), 2, {}, true);
  ok(g3.flatMap((x) => x.members).length === 25 && !g3.some((x) => x.members.some((id) => absent.has(id))), 'bỏ em vắng');
  const half = autoSeat(defaultSeating(30), ids.slice(0, 20), seeded(2));
  const g4 = groupsFromSeating(half, ids, 2, {}, false);
  ok(g4.flatMap((x) => x.members).length === 30, 'em chưa có chỗ ngồi vẫn được xếp vào nhóm');
  ok(groupTitle({ members: [], leader: null, name: ' Nhóm Sao ' }, 0) === 'Nhóm Sao' && groupTitle({ members: [], leader: null }, 1) === 'Nhóm Cá heo', 'tên nhóm tự đặt / mặc định');
  ok(normalizeSeating({ tdesk: 'right' } as never, st).tdesk === 'right' && normalizeSeating({ tdesk: 'xx' } as never, st).tdesk === 'left', 'vị trí bàn giáo viên');
}

/* ---------- thi đua */
{
  const w = weekOf('2026-10-22');
  ok(w.from === '2026-10-19' && w.to === '2026-10-25' && w.days.length === 6 && w.days[5] === '2026-10-24', `tuần T2–CN: ${w.from}–${w.to}`);
  ok(weekOf('2026-10-25').from === '2026-10-19' && weekOf('2026-10-19').from === '2026-10-19', 'Chủ nhật / thứ Hai cùng tuần');
  const pts = [
    { id: 1, team: 1, delta: 1, reason: null, at: '2026-10-21T01:00:00Z' },
    { id: 2, team: 1, delta: 1, reason: null, at: '2026-10-21T17:30:00Z' }, // 0:30 sáng 22/10 giờ VN
    { id: 3, team: 2, delta: -1, reason: null, at: '2026-10-22T02:00:00Z' },
    { id: 4, team: 9, delta: 5, reason: null, at: '2026-10-22T02:00:00Z' },
  ];
  const t = teamTotals(pts, 3);
  ok(t.total.join() === '2,-1,0', `tổng điểm (${t.total})`);
  ok(t.byDay['2026-10-21']?.[0] === 1 && t.byDay['2026-10-22']?.[0] === 1, 'tính ngày theo giờ Việt Nam');
  const r = ranking([5, 9, 5, 2]);
  ok(r[0].team === 1 && r[0].rank === 1 && r[1].rank === 2 && r[2].rank === 2 && r[3].rank === 4, `xếp hạng đồng hạng (${JSON.stringify(r)})`);
}

/* ---------- danh bạ */
{
  ok(normalizePhone('0912 345 678') === '0912345678' && normalizePhone('+84 912.345.678') === '0912345678' && normalizePhone('84912345678') === '0912345678', 'chuẩn hóa số');
  ok(normalizePhone('12ab') === null && normalizePhone('091234') === null && normalizePhone('Nguyễn Văn A') === null, 'loại số sai');
  ok(formatPhone('0912345678') === '0912 345 678', 'định dạng số');
  const st = [{ id: 'a', name: 'Nguyễn Minh An' }, { id: 'b', name: 'Trần Minh An' }, { id: 'c', name: 'Lê Gia Huy' }, { id: 'd', name: 'Phạm Khánh Linh' }];
  ok(matchStudent('le gia huy', st)?.id === 'c' && matchStudent('Gia Huy', st)?.id === 'c' && matchStudent('Huy', st)?.id === 'c', 'tìm em theo tên không dấu / tên gọi');
  ok(matchStudent('Minh An', st) === null && matchStudent('Trần Minh An', st)?.id === 'b', 'trùng tên gọi thì phải gõ đủ họ tên');
  const rows = parseContactPaste(['STT\tHọ và tên\tPhụ huynh\tSĐT', '1\tLê Gia Huy\tLê Thị Hoa\tBà\t0903 556 778\tỞ cùng bà', 'Phạm Khánh Linh;0935220991;Bố;Phạm Quốc Tuấn', 'Minh An\t0911111111', 'Em Lạ\t0900000000', 'Lê Gia Huy\tkhông có số'].join('\n'), st);
  ok(rows.length === 5, `bỏ dòng tiêu đề (${rows.length})`);
  ok(rows[0].student?.id === 'c' && rows[0].phone === '0903556778' && rows[0].relation === 'Bà' && rows[0].name === 'Lê Thị Hoa' && rows[0].note === 'Ở cùng bà' && !rows[0].problem, `dòng Excel: ${JSON.stringify(rows[0])}`);
  ok(rows[1].student?.id === 'd' && rows[1].relation === 'Bố' && rows[1].name === 'Phạm Quốc Tuấn', 'dòng cách bằng dấu chấm phẩy, cột đảo thứ tự');
  ok(!!rows[2].problem && !!rows[3].problem && !!rows[4].problem, 'báo lỗi: trùng tên, em lạ, thiếu số');
  ok(/Có 2 em/.test(rows[2].problem ?? '') && /Không tìm thấy/.test(rows[3].problem ?? '') && /số điện thoại/.test(rows[4].problem ?? ''), `nội dung lỗi rõ ràng: ${rows.slice(2).map((r) => r.problem)}`);
}

/* ---------- hẹn giờ */
{
  const t0 = parseTimer(null);
  ok(t0.total === 300 && !t0.endsAt, 'mặc định 5 phút');
  ok(parseTimer('{"total":-5,"look":"xx","bell":1}').total === 5 && parseTimer('{bad').total === 300, 'dữ liệu hỏng không lỗi');
  const run = startTimer(t0, 1_000_000);
  ok(timerLeft(run, 1_000_000 + 75_000) === 225, 'đếm đúng sau 75 giây');
  const p = pauseTimer(run, 1_000_000 + 75_000);
  ok(p.left === 225 && p.endsAt === null && timerLeft(p, 9e12) === 225, 'tạm dừng giữ nguyên số giây');
  const r2 = startTimer(p, 2_000_000);
  ok(r2.endsAt === 2_000_000 + 225_000, 'chạy tiếp từ chỗ dừng');
  const plus = addTime(r2, 60, 2_000_000);
  ok(timerLeft(plus, 2_000_000) === 285, '+1 phút khi đang chạy');
  const done = startTimer({ ...p, left: 0 }, 0);
  ok(done.endsAt === t0.total * 1000, 'hết giờ bấm chạy lại = chạy từ đầu');
  ok(fmtClock(125.2) === '02:06' && fmtClock(0.2) === '00:01' && fmtClock(0) === '00:00' && fmtClock(600) === '10:00', 'hiển thị mm:ss');
  ok(t0.tickMode === 'every' && !t0.muted, 'mặc định: tiếng mỗi giây, không tắt âm');
  ok(parseTimer('{"tick":true}').tickMode === 'last10' && parseTimer('{"tick":false}').tickMode === 'off' && parseTimer('{"tickMode":"xx"}').tickMode === 'every', 'đọc được cài đặt cũ');
  ok(shouldTick({ tickMode: 'every', muted: false }, 200) && !shouldTick({ tickMode: 'every', muted: true }, 200) && !shouldTick({ tickMode: 'last10', muted: false }, 30)
    && shouldTick({ tickMode: 'last10', muted: false }, 9) && !shouldTick({ tickMode: 'off', muted: false }, 5) && !shouldTick({ tickMode: 'every', muted: false }, 0), 'khi nào phát tiếng giây');
  ok(timerPhase(200, 300) === 'calm' && timerPhase(50, 300) === 'warn' && timerPhase(8, 300) === 'last' && timerPhase(0, 300) === 'done' && timerPhase(14, 60) === 'warn' && timerPhase(20, 60) === 'calm', 'giai đoạn màu');
}

console.log(fail ? `${fail}/${n} lỗi` : `Công cụ trên lớp: ${n} kiểm tra đều đúng`);
process.exit(fail ? 1 : 0);
