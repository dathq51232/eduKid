// Kiểm tra logic Game trí tuệ (chạy: npm run check:games)
// - Thám tử quy luật: mọi câu soạn sẵn hợp lệ, đủ ≥ 10 câu, mỗi cấp độ có câu, 3–4 lựa chọn, đúng 1 đáp án.
// - Nhà vô địch trí nhớ: bộ thẻ mỗi hình đúng 2 lần, luật lật thẻ, chơi hết ván ở mọi cấp độ.
// - Mê cung: nhiều seed × mọi cấp độ → luôn có đường tới đích, mọi ô đều đi tới được.
// - Robot lập trình: mọi màn giải được, lời giải ngắn nhất chạy thắng, giới hạn thẻ đủ; va đá / ra sân / thiếu sao báo đúng.
// - Sudoku mini: mọi đề có ĐÚNG MỘT lời giải, đúng số ô trống, lời giải hợp lệ; gợi ý luôn trỏ đúng ô trống.
// - Cân thăng bằng: cân gợi ý thăng bằng, chỉ đáp án làm cân chính thăng bằng, số trong phạm vi lớp.

import { GAMES, GAME_LEVELS, SUGGESTED_LEVEL, filterGames } from '../src/lib/games/catalog';
import { MEMORY_FACES, PAIRS_BY_LEVEL, canFlip, createDeck, flip, isDone, newGame, settle } from '../src/lib/games/memory';
import { SIZE_BY_LEVEL, generateMaze, move, solveMaze, DIRS } from '../src/lib/games/maze';
import { ROBOT_LEVELS, ROUND_SIZE, generatePuzzle, runProgram, solve, type Puzzle } from '../src/lib/games/robot';
import { SUDOKU_LEVELS, countSolutions, findConflict, findHint, generateSudoku, isSolved } from '../src/lib/games/sudoku';
import { BALANCE_ROUND, makeRound, validateBalance } from '../src/lib/games/balance';
import { PATTERN_QUESTIONS, answerOf, explainPattern, itemKey, optionsOf, validatePattern } from '../src/lib/games/patterns';

const errors: string[] = [];
const ok = (cond: boolean, msg: string) => {
  if (!cond) errors.push(msg);
};

// ---- Danh mục
ok(GAMES.length === 6, 'Cần 6 game');
ok(new Set(GAMES.map((g) => g.slug)).size === GAMES.length, 'Trùng đường dẫn game');
for (const g of GAMES) ok(g.minutes[0] >= 5 && g.minutes[1] <= 10, `${g.id}: thời lượng phải trong 5–10 phút`);
ok(filterGames('all', null).length === 6, 'Lọc "Tất cả" phải ra 6 game');
ok(filterGames('memory', 3).every((g) => g.categories.includes('memory')), 'Lọc Trí nhớ sai');
ok(filterGames('language', null).length === 0, 'Chưa có game Ngôn ngữ (trang hiện trạng thái trống)');
for (const lv of Object.values(SUGGESTED_LEVEL)) ok(GAME_LEVELS.includes(lv), 'Cấp độ gợi ý không hợp lệ');

// ---- Thám tử quy luật
ok(PATTERN_QUESTIONS.length >= 10, 'Cần ít nhất 10 câu quy luật');
ok(new Set(PATTERN_QUESTIONS.map((q) => q.id)).size === PATTERN_QUESTIONS.length, 'Mã câu quy luật bị trùng');
for (const lv of GAME_LEVELS) ok(PATTERN_QUESTIONS.some((q) => q.level === lv), `Cấp độ L${lv} chưa có câu quy luật`);
for (const q of PATTERN_QUESTIONS) {
  errors.push(...validatePattern(q));
  ok(optionsOf(q).some((o) => itemKey(o) === itemKey(answerOf(q))), `${q.id}: đáp án không nằm trong lựa chọn`);
  ok(explainPattern(q).length > 20, `${q.id}: thiếu lời giải thích`);
}
const answerSlots = PATTERN_QUESTIONS.map((q) => optionsOf(q).findIndex((o) => itemKey(o) === itemKey(answerOf(q))));
ok(new Set(answerSlots).size >= 3, 'Đáp án đúng luôn nằm ở cùng một vị trí');

// ---- Nhà vô địch trí nhớ
let rs = 12345;
const rand = () => {
  rs = (rs * 1103515245 + 12345) % 2147483648;
  return rs / 2147483648;
};
ok(MEMORY_FACES.length >= 10 && new Set(MEMORY_FACES.map((f) => f.shape)).size === MEMORY_FACES.length, 'Cần ≥ 10 hình khác dáng nhau');
const orders = new Set<string>();
for (const lv of GAME_LEVELS) {
  const pairs = PAIRS_BY_LEVEL[lv];
  for (let t = 0; t < 200; t++) {
    const deck = createDeck(pairs, rand);
    ok(deck.length === pairs * 2, `L${lv}: số thẻ sai`);
    const count = new Map<string, number>();
    deck.forEach((c) => count.set(c.face.id, (count.get(c.face.id) ?? 0) + 1));
    ok([...count.values()].every((n) => n === 2) && count.size === pairs, `L${lv}: mỗi hình phải xuất hiện đúng 2 lần`);
    if (lv === 3) orders.add(deck.map((c) => c.face.id).join());
  }
  // Chơi trọn một ván: lật đúng cặp (biết trước) + kiểm tra luật
  let s = newGame(pairs, rand);
  const first = flip(s, 0);
  ok(first.result === 'first', 'Lật thẻ đầu phải hợp lệ');
  ok(flip(first.state, 0).result === 'ignored', 'Không được lật lại chính thẻ vừa lật');
  s = first.state;
  const wrong = s.cards.findIndex((c, i) => i !== 0 && c.face.id !== s.cards[0].face.id);
  const miss = flip(s, wrong);
  ok(miss.result === 'miss' && miss.state.waiting, 'Hai thẻ khác nhau phải chờ úp lại');
  const third = s.cards.findIndex((_, i) => i !== 0 && i !== wrong);
  ok(flip(miss.state, third).result === 'ignored', 'Khi đang chờ úp, không lật thêm thẻ thứ ba');
  ok(!canFlip(miss.state, 0), 'Không lật được thẻ đang mở');
  s = settle(miss.state);
  ok(s.open.length === 0 && !s.waiting, 'settle phải úp hai thẻ xuống');
  for (let i = 0; i < s.cards.length; i++) {
    if (s.matched[i]) continue;
    const j = s.cards.findIndex((c, k) => k !== i && !s.matched[k] && c.face.id === s.cards[i].face.id);
    s = flip(s, i).state;
    const r = flip(s, j);
    ok(r.result === 'match', `L${lv}: lật đúng cặp phải ghép được`);
    s = r.state;
    ok(flip(s, i).result === 'ignored', 'Không lật được thẻ đã ghép');
  }
  ok(isDone(s), `L${lv}: ván chơi phải hoàn thành`);
  ok(s.turns === pairs + 1, `L${lv}: số lượt phải là ${pairs + 1}, đang là ${s.turns}`);
}
ok(orders.size > 150, `Xáo thẻ chưa đủ ngẫu nhiên (chỉ ${orders.size} cách xếp khác nhau / 200 lần)`);

// ---- Mê cung
let mazes = 0;
for (const lv of GAME_LEVELS) {
  const n = SIZE_BY_LEVEL[lv];
  for (let seed = 1; seed <= 300; seed++) {
    const m = generateMaze(n, seed * 7919);
    const { steps, reachable } = solveMaze(m);
    ok(steps !== null && steps >= 2 * (n - 1), `Mê cung L${lv} seed ${seed}: không có đường tới đích`);
    ok(reachable === n * n, `Mê cung L${lv} seed ${seed}: còn ô không đi tới được`);
    // Tường hai phía phải khớp nhau, không đi ra ngoài lưới
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        for (const d of DIRS) {
          const to = move(m, { x, y }, d);
          if (to) ok(to.x >= 0 && to.y >= 0 && to.x < n && to.y < n, 'Đi ra ngoài mê cung');
        }
    mazes++;
  }
}

// ---- Robot lập trình
let robots = 0;
const histBest: Record<number, number[]> = {};
for (const lv of GAME_LEVELS) {
  const cfg = ROBOT_LEVELS[lv];
  histBest[lv] = [];
  for (let seed = 1; seed <= 300; seed++) {
    const p = generatePuzzle(lv, seed * 104729);
    const sol = solve(p);
    ok(!!sol, `Robot L${lv} seed ${seed}: không giải được`);
    if (!sol) continue;
    ok(sol.length === p.best && p.best <= p.limit, `Robot L${lv} seed ${seed}: giới hạn thẻ (${p.limit}) nhỏ hơn lời giải ngắn nhất (${p.best})`);
    ok(runProgram(p, sol).result === 'win', `Robot L${lv} seed ${seed}: lời giải ngắn nhất không thắng`);
    ok(sol.every((c) => (cfg.mode === 'relative' ? c.kind !== 'move' : c.kind === 'move') && (c.kind !== 'move' || cfg.mode === 'counted' || c.n === 1)), `Robot L${lv}: lời giải dùng sai loại thẻ`);
    const cells = new Set([p.start, ...p.stars, ...p.rocks].map((q) => `${q.x},${q.y}`));
    ok(cells.size === 1 + p.stars.length + p.rocks.length, `Robot L${lv} seed ${seed}: robot / sao / đá chồng lên nhau`);
    ok(p.stars.length === cfg.stars && p.size === cfg.size, `Robot L${lv}: sai cấu hình`);
    // bỏ lệnh cuối → chưa thắng (lời giải ngắn nhất không thừa lệnh)
    ok(runProgram(p, sol.slice(0, -1)).result !== 'win', `Robot L${lv} seed ${seed}: lời giải có lệnh thừa`);
    histBest[lv].push(p.best);
    robots++;
  }
  ok(new Set(histBest[lv]).size >= 2, `Robot L${lv}: màn chơi quá giống nhau`);
}
{
  // Tình huống cố định: va đá, ra ngoài sân, thiếu sao, quay tại chỗ
  const p: Puzzle = { size: 4, mode: 'arrows', start: { x: 0, y: 0 }, facing: 1, stars: [{ x: 3, y: 0 }], rocks: [{ x: 1, y: 0 }], best: 0, limit: 14, seed: 1 };
  const crash = runProgram(p, [{ kind: 'move', dir: 1, n: 1 }]);
  ok(crash.result === 'crash' && !crash.blocked?.out && crash.failAt === 0, 'Robot: phải báo va đá ở lệnh 1');
  const out = runProgram(p, [{ kind: 'move', dir: 0, n: 1 }]);
  ok(out.result === 'crash' && !!out.blocked?.out, 'Robot: phải báo ra ngoài sân');
  ok(runProgram(p, [{ kind: 'move', dir: 2, n: 1 }]).result === 'short', 'Robot: hết lệnh còn sao phải báo thiếu sao');
  ok(solve(p)?.length === 5, `Robot: đường vòng qua đá phải là 5 bước, đang là ${solve(p)?.length}`);
  const r: Puzzle = { ...p, mode: 'relative', facing: 2, rocks: [] };
  ok(runProgram(r, [{ kind: 'turn', side: 'L' }, { kind: 'fwd', n: 3 }]).result === 'win', 'Robot: đang nhìn xuống, quay trái thì phải nhìn sang phải');
  ok(runProgram(r, [{ kind: 'fwd', n: 1 }]).frames[1].y === 1, 'Robot: Tiến khi nhìn xuống phải đi xuống');
  ok(solve(r)?.length === 2, 'Robot: lời giải ngắn nhất kiểu hướng nhìn phải là 2 thẻ');
}

// ---- Sudoku mini
let sudokus = 0;
for (const lv of GAME_LEVELS) {
  const cfg = SUDOKU_LEVELS[lv];
  const seen = new Set<string>();
  for (let seed = 1; seed <= 120; seed++) {
    const s = generateSudoku(lv, seed * 7919);
    const blanks = s.puzzle.flat().filter((v) => !v).length;
    ok(blanks === cfg.blanks, `Sudoku L${lv} seed ${seed}: ${blanks} ô trống, cần ${cfg.blanks}`);
    ok(countSolutions(s.puzzle, s.br, s.bc, 2) === 1, `Sudoku L${lv} seed ${seed}: đề không có đúng một lời giải`);
    ok(isSolved(s, s.solution) && !isSolved(s, s.puzzle), `Sudoku L${lv}: kiểm tra hoàn thành sai`);
    for (let r = 0; r < s.n; r++)
      for (let c = 0; c < s.n; c++) {
        ok(!findConflict(s.solution, s.br, s.bc, r, c, s.solution[r][c]), `Sudoku L${lv} seed ${seed}: lời giải lặp số`);
        if (s.puzzle[r][c]) ok(s.puzzle[r][c] === s.solution[r][c], `Sudoku L${lv}: ô có sẵn khác lời giải`);
      }
    const h = findHint(s, s.puzzle);
    ok(!!h && !s.puzzle[h.r][h.c] && h.value === s.solution[h.r][h.c], `Sudoku L${lv} seed ${seed}: gợi ý sai`);
    // giải lần lượt chỉ bằng gợi ý → luôn đi tới hết
    const g = s.puzzle.map((row) => [...row]);
    for (let k = 0; k < blanks; k++) {
      const hk = findHint(s, g);
      if (!hk) break;
      g[hk.r][hk.c] = hk.value;
    }
    ok(isSolved(s, g), `Sudoku L${lv} seed ${seed}: làm theo gợi ý không giải xong`);
    seen.add(s.puzzle.flat().join(''));
    sudokus++;
  }
  ok(seen.size >= 100, `Sudoku L${lv}: đề lặp lại nhiều (${seen.size}/120 đề khác nhau)`);
}

// ---- Cân thăng bằng
let balances = 0;
for (const lv of GAME_LEVELS) {
  const slots = new Set<number>();
  for (let seed = 1; seed <= 300; seed++) {
    const round = makeRound(lv, seed);
    ok(round.length === BALANCE_ROUND, `Cân L${lv} seed ${seed}: thiếu câu`);
    ok(new Set(round.map((q) => q.id)).size === round.length, `Cân L${lv}: trùng mã câu`);
    for (const q of round) {
      errors.push(...validateBalance(q));
      slots.add(q.options.indexOf(q.answer));
      balances++;
    }
  }
  ok(slots.size >= 3, `Cân L${lv}: đáp án luôn ở cùng một vị trí`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} lỗi:`);
  for (const e of [...new Set(errors)].slice(0, 40)) console.error('  -', e);
  process.exit(1);
}
console.log(`✓ Danh mục: ${GAMES.length} game`);
console.log(`✓ Thám tử quy luật: ${PATTERN_QUESTIONS.length} câu soạn sẵn hợp lệ (${GAME_LEVELS.map((lv) => `L${lv}: ${PATTERN_QUESTIONS.filter((q) => q.level === lv).length}`).join(', ')})`);
console.log(`✓ Nhà vô địch trí nhớ: 1.000 bộ thẻ hợp lệ, luật lật thẻ đúng, chơi hết ván ở cả 5 cấp độ`);
console.log(`✓ Mê cung: ${mazes} mê cung đều có đường tới đích`);
console.log(`✓ Robot lập trình: ${robots} màn đều giải được trong giới hạn thẻ (lời giải ngắn nhất ${GAME_LEVELS.map((lv) => `L${lv}: ${Math.min(...histBest[lv])}–${Math.max(...histBest[lv])} thẻ`).join(', ')}); ${ROUND_SIZE} màn / lượt`);
console.log(`✓ Sudoku mini: ${sudokus} đề đều có đúng một lời giải, làm theo gợi ý đều giải xong`);
console.log(`✓ Cân thăng bằng: ${balances} câu hợp lệ (chỉ đáp án làm cân thăng bằng)`);
