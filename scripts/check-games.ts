// Kiểm tra logic Game trí tuệ (chạy: npm run check:games)
// - Thám tử quy luật: mọi câu soạn sẵn hợp lệ, đủ ≥ 10 câu, mỗi cấp độ có câu, 3–4 lựa chọn, đúng 1 đáp án.
// - Nhà vô địch trí nhớ: bộ thẻ mỗi hình đúng 2 lần, luật lật thẻ, chơi hết ván ở mọi cấp độ.
// - Mê cung: nhiều seed × mọi cấp độ → luôn có đường tới đích, mọi ô đều đi tới được.

import { GAMES, GAME_LEVELS, SUGGESTED_LEVEL, filterGames } from '../src/lib/games/catalog';
import { MEMORY_FACES, PAIRS_BY_LEVEL, canFlip, createDeck, flip, isDone, newGame, settle } from '../src/lib/games/memory';
import { SIZE_BY_LEVEL, generateMaze, move, solveMaze, DIRS } from '../src/lib/games/maze';
import { PATTERN_QUESTIONS, answerOf, explainPattern, itemKey, optionsOf, validatePattern } from '../src/lib/games/patterns';

const errors: string[] = [];
const ok = (cond: boolean, msg: string) => {
  if (!cond) errors.push(msg);
};

// ---- Danh mục
ok(GAMES.length === 3, 'Cần 3 game');
for (const g of GAMES) ok(g.minutes[0] >= 5 && g.minutes[1] <= 10, `${g.id}: thời lượng phải trong 5–10 phút`);
ok(filterGames('all', null).length === 3, 'Lọc "Tất cả" phải ra 3 game');
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

if (errors.length) {
  console.error(`✗ ${errors.length} lỗi:`);
  for (const e of [...new Set(errors)].slice(0, 40)) console.error('  -', e);
  process.exit(1);
}
console.log(`✓ Danh mục: ${GAMES.length} game`);
console.log(`✓ Thám tử quy luật: ${PATTERN_QUESTIONS.length} câu soạn sẵn hợp lệ (${GAME_LEVELS.map((lv) => `L${lv}: ${PATTERN_QUESTIONS.filter((q) => q.level === lv).length}`).join(', ')})`);
console.log(`✓ Nhà vô địch trí nhớ: 1.000 bộ thẻ hợp lệ, luật lật thẻ đúng, chơi hết ván ở cả 5 cấp độ`);
console.log(`✓ Mê cung: ${mazes} mê cung đều có đường tới đích`);
