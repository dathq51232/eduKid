// Kiểm thử cờ tướng: số thế cờ chuẩn (perft), luật từng quân, tướng đối mặt, hết nước là thua, chiếu dai,
// máy thấy chiếu bí, trọng tài ván trực tuyến. Chạy: npm run check:xiangqi
import { XqBoard, XqGame, xqPerft, START_FEN, sqIndex, vnNotation } from '../src/lib/xiangqi/engine';
import { xqPickMove } from '../src/lib/xiangqi/bot';
import { decideFlag, decideMove, type GameRow } from '../src/lib/chess/online-rules';

let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('✗', m); } };

for (const [d, n] of [[1, 44], [2, 1920], [3, 79666]] as const) ok(xqPerft(START_FEN, d) === n, `perft khởi đầu độ sâu ${d} = ${n}`);
const P2 = 'r1ba1a3/4kn3/2n1b4/pNp1p1p1p/4c4/6P2/P1P2R2P/1CcC5/9/2BAKAB2 w - - 0 1';
for (const [d, n] of [[1, 38], [2, 1128], [3, 43929]] as const) ok(xqPerft(P2, d) === n, `perft thế giữa ván độ sâu ${d} = ${n}`);

const can = (fen: string, uci: string) => { const g = new XqGame(fen); return Boolean(g.move(uci)); };
// Mã bị cản chân
ok(can(START_FEN, 'b0c2'), 'Mã b0 nhảy c2');
// (tướng Đen đặt ở d9 để hai tướng không đối mặt)
ok(!can('3k5/9/9/9/9/9/9/9/1P7/1N2K4 w - - 0 1', 'b0c2') && can('3k5/9/9/9/9/9/9/9/9/1N2K4 w - - 0 1', 'b0c2'), 'Mã bị cản chân không nhảy được');
// Tượng không qua sông, bị cản mắt
ok(!can('3k5/9/9/9/9/2B6/9/9/9/4K4 w - - 0 1', 'c4e6') && can('3k5/9/9/9/9/2B6/9/9/9/4K4 w - - 0 1', 'c4e2'), 'Tượng không qua sông');
ok(!can('3k5/9/9/9/9/9/9/9/3P5/2B1K4 w - - 0 1', 'c0e2') && can('3k5/9/9/9/9/9/9/9/9/2B1K4 w - - 0 1', 'c0e2'), 'Tượng bị cản mắt');
// Pháo cần đúng 1 ngòi để ăn
ok(can('4k4/9/9/9/4p4/9/4P4/9/4C4/3K5 w - - 0 1', 'e1e5'), 'Pháo ăn qua 1 ngòi');
ok(!can('4k4/9/9/9/4p4/4p4/4P4/9/4C4/3K5 w - - 0 1', 'e1e5'), 'Pháo không ăn qua 2 ngòi');
// Tốt: chưa qua sông chỉ tiến; qua sông được đi ngang; không lùi
ok(!can(START_FEN, 'a3b3') && can(START_FEN, 'a3a4'), 'Tốt chưa qua sông chỉ được tiến');
ok(can('3k5/9/9/9/P8/9/9/9/9/4K4 w - - 0 1', 'a5b5') && !can('3k5/9/9/9/P8/9/9/9/9/4K4 w - - 0 1', 'a5a4'), 'Tốt qua sông đi ngang, không lùi');
// Tướng, Sĩ trong cung
ok(!can('4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1', 'd0c0') && can('4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1', 'd0d1'), 'Tướng không ra khỏi cung');
// Tướng đối mặt
ok(!can('3k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1', 'e0d0'), 'Không được để hai tướng đối mặt');
ok(!can('4k4/9/9/9/9/9/9/9/4R4/4K4 w - - 0 1', 'e1d1'), 'Không rút quân chắn để tướng đối mặt');
// Hết nước đi (không bị chiếu) vẫn là thua
const stale = new XqGame('3k5/4P4/4R4/9/9/9/9/9/9/5K3 b - - 0 1');
ok(stale.result()?.winner === 'w', 'Bị vây hết nước đi → thua');
// Chiếu bí, máy thấy nước chiếu bí
const g1 = new XqGame('3k5/9/9/9/9/9/9/9/9/R3K4 w - - 0 1'); g1.move('a0d0');
ok(g1.result()?.reason === 'checkmate' && g1.result()?.winner === 'w', 'Xe d0 chiếu bí (tướng đối mặt chặn đường chạy)');
ok(xqPickMove('3k5/9/9/9/9/9/9/9/9/R3K4 w - - 0 1', 3) === 'a0d0', 'Máy mức Khó thấy nước chiếu bí');
// Chiếu dai: Đỏ chiếu liên tục làm lặp lại thế cờ → Đỏ thua
const pc = new XqGame('3k5/9/9/9/9/9/9/9/9/R3K4 w - - 0 1');
const cyc = ['a0a9', 'd9d8', 'a9a8', 'd8d9', 'a8a9', 'd9d8', 'a9a8', 'd8d9', 'a8a9'];
let pr = null; for (const m of cyc) { if (!pc.move(m)) { ok(false, `chiếu dai: nước ${m} không hợp lệ`); break; } pr = pc.result(); if (pr) break; }
ok(pr?.reason === 'perpetual_check' && pr.winner === 'b', 'Chiếu dai lặp lại 3 lần → bên chiếu thua');
// Lặp lại không chiếu → hòa
const rp = new XqGame(); let rr = null;
for (const m of ['b0c2', 'b9c7', 'c2b0', 'c7b9', 'b0c2', 'b9c7', 'c2b0', 'c7b9']) { rp.move(m); rr = rp.result(); if (rr) break; }
ok(rr?.reason === 'repetition' && rr.winner === null, 'Lặp lại 3 lần không chiếu → hòa');
// Ghi nước kiểu Việt
const bd = new XqBoard(); ok(vnNotation(bd, { from: sqIndex('h2'), to: sqIndex('e2') }) === 'P2-5', 'Pháo đầu ghi P2-5');
ok(vnNotation(bd, { from: sqIndex('b0'), to: sqIndex('c2') }) === 'M8.7', 'Mã ghi M8.7');
ok(vnNotation(bd, { from: sqIndex('a0'), to: sqIndex('a1') }) === 'X9.1', 'Xe ghi X9.1');

// Trọng tài trực tuyến cho cờ tướng
const T0 = Date.parse('2026-10-27T03:00:00Z');
const row = (over: Partial<GameRow> = {}): GameRow => ({ id: 'g', school_id: 's', white: 'A', black: 'B', base: 300, inc: 3, moves: [], ply: 0, fen: START_FEN, white_ms: 300000, black_ms: 300000, turn_at: new Date(T0).toISOString(), status: 'active', result: null, reason: null, draw_offer: null, emote: null, rated: false, created_at: '', updated_at: '', finished_at: null, variant: 'xiangqi', ...over });
let d = decideMove(row(), 'w', 'h2e2', 0, T0 + 5000); ok(d.ok && d.patch.ply === 1 && d.patch.white_ms === 298000, 'Đi Pháo đầu: trừ 5 giây, cộng 3 giây');
ok(!decideMove(row(), 'w', 'h2h7', 0, T0).ok && decideMove(row(), 'w', 'h2h9', 0, T0).ok, 'Pháo không ăn khi không có ngòi, có ngòi thì ăn được');
ok(!decideMove(row(), 'w', 'e2e4', 0, T0).ok, 'Nước sai luật bị từ chối');
d = decideFlag(row({ moves: ['h2e2'], ply: 1, black_ms: 1000 }), T0 + 2000); ok(d.ok && d.patch.result === '1-0' && d.patch.reason === 'timeout', 'Đen hết giờ → Đỏ thắng');

console.log(fail ? `${fail} lỗi` : 'Cờ tướng: mọi kiểm thử đều đạt');
process.exit(fail ? 1 : 0);
