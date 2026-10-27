// Kiểm thử cờ vua: bộ sinh nước của máy (perft khớp số chuẩn), máy thấy nước chiếu hết, trọng tài ván trực tuyến.
// Chạy: npm run check:chess
import { Chess } from 'chess.js';
import { perft, pickMove } from '../src/lib/chess/bot';
import { timeoutResult } from '../src/lib/chess/game';
import { decideAbort, decideDraw, decideEmote, decideFlag, decideMove, decideResign, type GameRow } from '../src/lib/chess/online-rules';

let fail = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fail++; console.log('✗', msg); } };

const PERFT: [string, number, number][] = [
  ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 3, 8902],
  ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', 3, 97862],
  ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 4, 43238],
  ['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', 3, 9467],
  ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', 3, 62379],
];
for (const [fen, d, n] of PERFT) ok(perft(fen, d) === n, `perft ${fen} d${d}`);
for (const lv of [2, 3] as const) { const m = pickMove('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', lv); ok(m?.from === 'a1' && m.to === 'a8', `máy mức ${lv} thấy chiếu hết Xa8`); }

const T0 = Date.parse('2026-10-27T03:00:00Z');
const base = (over: Partial<GameRow> = {}): GameRow => ({
  id: 'g', school_id: 's', white: 'A', black: 'B', base: 300, inc: 3, moves: [], ply: 0,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', white_ms: 300000, black_ms: 300000,
  turn_at: new Date(T0).toISOString(), status: 'active', result: null, reason: null, draw_offer: null, emote: null, rated: false,
  created_at: '', updated_at: '', finished_at: null, ...over,
});
const apply = (r: GameRow, p: object): GameRow => ({ ...r, ...p } as GameRow);

// Đi đúng lượt, trừ giờ + cộng giây
let r = base();
let d = decideMove(r, 'w', 'e2e4', 0, T0 + 10_000);
ok(d.ok && d.patch.white_ms === 300000 - 10000 + 3000 && d.patch.ply === 1, 'đi e4: trừ 10 giây, cộng 3 giây');
if (d.ok) r = apply(r, d.patch);
ok(!decideMove(r, 'w', 'd2d4', 1, T0 + 11_000).ok, 'không đi hai nước liền');
ok(!decideMove(r, 'b', 'e7e5', 0, T0 + 11_000).ok, 'ply cũ bị từ chối');
ok(!decideMove(r, 'b', 'e7e4', 1, T0 + 11_000).ok, 'nước sai luật bị từ chối');
// Chiếu hết kiểu "học trò" → Trắng thắng
for (const [m, side] of [['e7e5', 'b'], ['d1h5', 'w'], ['b8c6', 'b'], ['f1c4', 'w'], ['g8f6', 'b']] as const) { d = decideMove(r, side, m, r.ply, T0 + 12_000); ok(d.ok, `đi ${m}`); if (d.ok) r = apply(r, d.patch); }
d = decideMove(r, 'w', 'h5f7', r.ply, T0 + 13_000);
ok(d.ok && d.finished && d.patch.result === '1-0' && d.patch.reason === 'checkmate', 'Hxf7# → 1-0 chiếu hết');
// Hết giờ
r = base({ moves: ['e2e4'], ply: 1, black_ms: 5000, turn_at: new Date(T0).toISOString() });
ok(!decideFlag(r, T0 + 4000).ok, 'chưa hết giờ thì không xử thua');
d = decideFlag(r, T0 + 6000);
ok(d.ok && d.patch.result === '1-0' && d.patch.reason === 'timeout', 'Đen hết giờ → Trắng thắng');
d = decideMove(r, 'b', 'e7e5', 1, T0 + 6000);
ok(d.ok && d.patch.reason === 'timeout', 'đi quân khi đã hết giờ → xử thua');
// Hết giờ nhưng đối thủ chỉ còn vua → hòa (luật FIDE 6.9)
ok(timeoutResult(new Chess('8/8/8/4k3/8/8/4P3/4K3 b - - 0 1'), 'w').winner === 'b' ? false : timeoutResult(new Chess('8/8/8/4k3/8/8/4P3/4K3 b - - 0 1'), 'w').reason === 'timeout_vs_material', 'Trắng hết giờ, Đen chỉ còn vua → hòa');
ok(timeoutResult(new Chess('8/8/8/4k3/8/8/4P3/4K3 w - - 0 1'), 'b').winner === 'w', 'Đen hết giờ, Trắng còn tốt → Trắng thắng');
// Xin hòa
r = base({ moves: ['e2e4', 'e7e5'], ply: 2 });
d = decideDraw(r, 'w', 'offer', T0); ok(d.ok && d.patch.draw_offer === 'w', 'Trắng xin hòa');
if (d.ok) r = apply(r, d.patch);
ok(!decideDraw(r, 'w', 'accept', T0).ok, 'không tự đồng ý lời xin hòa của mình');
d = decideDraw(r, 'b', 'accept', T0); ok(d.ok && d.patch.result === '1/2-1/2' && d.patch.reason === 'agreement', 'Đen đồng ý → hòa');
d = decideMove(r, 'w', 'g1f3', 2, T0); ok(d.ok && d.patch.draw_offer === 'w', 'đi quân vẫn giữ lời xin hòa của mình');
r = apply(base({ moves: ['e2e4'], ply: 1 }), { draw_offer: 'w' });
d = decideMove(r, 'b', 'e7e5', 1, T0); ok(d.ok && d.patch.draw_offer === null, 'đối thủ đi quân = từ chối hòa');
// Xin thua, hủy ván, biểu cảm
d = decideResign(base({ ply: 4, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'] }), 'b', T0); ok(d.ok && d.patch.result === '1-0' && d.patch.reason === 'resign', 'Đen xin thua → 1-0');
ok(decideAbort(base({ ply: 1, moves: ['e2e4'] }), T0).ok, 'hủy ván khi mới 1 nước');
ok(!decideAbort(base({ ply: 2, moves: ['e2e4', 'e7e5'] }), T0).ok, 'không hủy khi đã đi 2 nước');
ok(decideEmote(base(), 'w', 'gg', T0).ok && !decideEmote(base(), 'w', 'xin chào', T0).ok, 'chỉ biểu cảm soạn sẵn');
// Lặp lại thế cờ 3 lần
r = base();
const rep = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'];
let last: ReturnType<typeof decideMove> | null = null;
for (let i = 0; i < rep.length; i++) { last = decideMove(r, i % 2 ? 'b' : 'w', rep[i], r.ply, T0 + i); if (last.ok) r = apply(r, last.patch); }
ok(Boolean(last?.ok && last.patch.reason === 'repetition'), 'lặp lại thế cờ 3 lần → hòa');

console.log(fail ? `${fail} lỗi` : 'Cờ vua: mọi kiểm thử đều đạt');
process.exit(fail ? 1 : 0);
