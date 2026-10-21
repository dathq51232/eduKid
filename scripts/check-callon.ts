// Kiểm tra phần tính toán của "Gọi tên – Dò bài": npx tsx scripts/check-callon.ts
import { DURATIONS, candidatesOf, emptyState, lotHops, lotsFor, raceLineup, raceFor, racePos, restoreState, rng, sliceAt, spinEase, wheelAngle, type Student } from '../src/lib/classroom/callon';

let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('✗', m); } };
const S: Student[] = Array.from({ length: 28 }, (_, i) => ({ id: `s${i}`, name: `Em ${i}` }));

// 1. Không gọi lại: gọi hết cả lớp có mặt, mỗi em đúng một lần, rồi mới sang vòng mới
for (let trial = 0; trial < 200; trial++) {
  const st = { ...emptyState(), absent: ['s3', 's7'] };
  const r = rng(trial + 1);
  const seen: string[] = [];
  for (let k = 0; k < 26; k++) {
    const { list, newRound } = candidatesOf(S, st);
    ok(!newRound, 'chưa hết lớp thì chưa sang vòng mới');
    const p = list[Math.floor(r() * list.length)];
    ok(!st.absent.includes(p.id), 'không gọi em vắng');
    seen.push(p.id); st.called = [...st.called, p.id];
  }
  ok(new Set(seen).size === 26, 'mỗi em có mặt được gọi đúng một lần');
  ok(candidatesOf(S, st).newRound, 'gọi hết thì báo vòng mới');
}
// 2. Vòng quay: kim ở đỉnh luôn chỉ đúng ô của em được chọn
for (let n = 2; n <= 40; n++) for (let i = 0; i < n; i++) {
  const cur = (n * 37 + i * 101) % 3000;
  const a = wheelAngle(i, n, cur);
  const atTop = (((-a) % 360) + 360) % 360; // góc (theo chiều kim đồng hồ, từ đỉnh) của điểm đang nằm dưới kim
  const slice = Math.floor(atTop / (360 / n));
  ok(slice === i, `vòng quay n=${n} i=${i} chỉ vào ô ${slice}`);
  ok(a - cur >= 5 * 360, 'quay ít nhất 5 vòng');
}
// 2b. Quay êm: góc tăng dần, chậm dần về cuối, dừng đúng ô (sliceAt dùng khi vẽ từng khung hình)
for (const n of [5, 23, 32]) for (let i = 0; i < n; i++) {
  const to = wheelAngle(i, n, 1234, 8);
  ok(sliceAt(1234 + (to - 1234) * spinEase(1), n) === i, `quay êm dừng đúng ô n=${n} i=${i}`);
}
const v1 = spinEase(0.1) - spinEase(0.05), v2 = spinEase(0.95) - spinEase(0.9);
ok(v1 > v2 * 10, 'đầu nhanh, cuối rất chậm');
// 2c. Bốc thăm: đèn chạy dừng đúng lá, khoảng cách giữa hai bước dài dần, đúng tổng thời gian
for (const sec of [3, 6, 10, 20]) {
  const h = lotHops([0, 2, 4, 6, 8], 4, sec, rng(sec));
  ok(h[h.length - 1][0] === 4 && h[h.length - 1][1] === sec * 1000, `bốc thăm ${sec}s dừng đúng lá, đúng giờ`);
  const gaps = h.slice(1, -1).map((x, k) => x[1] - h[k][1]);
  ok(gaps.every((g, k) => k === 0 || g >= gaps[k - 1] - 1), 'đèn chạy chậm dần');
  ok(h.slice(0, -1).every(([k]) => [0, 2, 4, 6, 8].includes(k)), 'đèn chỉ chạy qua lá chưa bốc');
}
// 3. Đua thú: em được gọi về đích trước, đủ 6 làn, không trùng em
for (let t = 1; t <= 300; t++) {
  const r = rng(t);
  const w = S[t % 28];
  const lanes = raceFor(w, S, r, 6, 2 + (t % 15));
  ok(lanes.length === 6 && new Set(lanes.map((l) => l.student.id)).size === 6, 'đủ 6 em khác nhau');
  const first = [...lanes].sort((a, b) => a.finish - b.finish)[0];
  ok(first.student.id === w.id, 'em được gọi về đích đầu tiên');
  const wl = lanes.find((l) => l.student.id === w.id)!;
  ok(lanes.every((l) => l === wl || racePos(wl.finish - 0.01, l.finish, l.wobble) < 1), 'không ai chạm đích trước em được gọi');
}
ok(raceFor(S[0], [S[0], S[1]]).length === 2, 'lớp 2 em: đua 2 làn');
ok(Math.abs(raceFor(S[0], S, rng(9), 6, 10).find((l) => l.student.id === S[0].id)!.finish - 10) <= 1, 'đua theo thời gian đã chọn');
// 3b. Xếp vị trí ngẫu nhiên: 6 làn khác nhau, ưu tiên em chưa gọi; đua giữ đúng thứ tự làn, em được gọi về trước
for (let t = 1; t <= 200; t++) {
  const r = rng(t * 13);
  const cands = S.slice(0, t % 9);
  const lu = raceLineup(cands, S, r);
  ok(lu.length === 6 && new Set(lu.map((l) => l.student.id)).size === 6, 'xếp đủ 6 làn khác nhau');
  ok(cands.slice(0, 6).length === lu.filter((l) => cands.some((c) => c.id === l.student.id)).length, 'ưu tiên em chưa được gọi');
  const inLane = lu.filter((l) => cands.some((c) => c.id === l.student.id));
  if (inLane.length) {
    const w = inLane[0].student;
    const race = raceFor(w, S, r, 6, 3 + (t % 38), lu);
    ok(race.map((l) => l.student.id).join() === lu.map((l) => l.student.id).join() && race.map((l) => l.animal).join() === lu.map((l) => l.animal).join(), 'đua giữ đúng vị trí đã xếp');
    ok([...race].sort((a, b) => a.finish - b.finish)[0].student.id === w.id, 'em được gọi về trước khi đã xếp vị trí');
  }
}
ok(Math.max(...DURATIONS) === 40, 'thời gian chọn được tối đa 40 giây');
const m0 = lotsFor(S, { absent: [], round: 1, mix: 0 }, 42).map((x) => x.id).join();
ok(m0 !== lotsFor(S, { absent: [], round: 1, mix: 1 }, 42).map((x) => x.id).join(), 'trộn thăm đổi số lá');
// 4. Lá thăm: cùng vòng thì giữ số, vòng mới xáo lại
const a1 = lotsFor(S, { absent: [], round: 1 }, 42).map((x) => x.id).join();
ok(a1 === lotsFor(S, { absent: [], round: 1 }, 42).map((x) => x.id).join(), 'cùng vòng giữ số lá');
ok(a1 !== lotsFor(S, { absent: [], round: 2 }, 42).map((x) => x.id).join(), 'vòng mới xáo lại');
// 5. Sang ngày mới: xoá vắng / đã gọi, giữ điểm và cài đặt
const old = JSON.stringify({ ...emptyState(), day: '2020-01-01', absent: ['s1'], called: ['s2'], tally: { s2: { ok: 1, no: 0, star: 2 } }, mode: 'race' });
const r5 = restoreState(old);
ok(r5.absent.length === 0 && r5.called.length === 0 && r5.tally.s2.star === 2 && r5.mode === 'race', 'sang ngày mới giữ điểm, xoá vắng');
ok(restoreState('{hỏng').mode === 'wheel', 'dữ liệu hỏng thì bắt đầu lại');

console.log(fail ? `✗ ${fail} lỗi` : '✓ Gọi tên – Dò bài: không gọi lặp, kim vòng quay đúng em, em được gọi luôn về đích trước, lá thăm giữ số trong vòng, sang ngày mới đúng');
process.exit(fail ? 1 : 0);
