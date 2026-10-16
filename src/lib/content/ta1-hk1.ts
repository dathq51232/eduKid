// TIẾNG ANH 1 — HỌC KỲ 1 — bám trình tự sách Tiếng Anh 1 Global Success (NXB Giáo dục Việt Nam).
// Unit 1–8 + Review 1, Review 2. Mỗi unit: 1 chữ cái trọng tâm + 4 từ.
// QUY TẮC: từ tiếng Anh trong lựa chọn/đáp án chỉ dùng từ của các unit ĐÃ HỌC (kiểm tra tự động).

import { fb, mc, mt, ord, sc, tf, type ContentLesson } from './types';

const BOOK = 'Global Success';
const P1 = { code: 'GS1.P1', title: 'Unit 1–4 và Review 1' };
const P2 = { code: 'GS1.P2', title: 'Unit 5–8 và Review 2' };

// Từ vựng từng unit (dùng cho kiểm tra "không vượt trước")
export const GS1_VOCAB: Record<number, { letter: string; words: string[]; theme: string }> = {
  1: { letter: 'b', words: ['bill', 'ball', 'bike', 'book'], theme: 'In the school playground' },
  2: { letter: 'c', words: ['cake', 'car', 'cat', 'cup'], theme: 'In the dining room' },
  3: { letter: 'a', words: ['apple', 'bag', 'can', 'hat'], theme: 'At the street market' },
  4: { letter: 'd', words: ['desk', 'dog', 'door', 'duck'], theme: 'In the bedroom' },
  5: { letter: 'i', words: ['chicken', 'chips', 'fish', 'milk'], theme: 'At the fish and chip shop' },
  6: { letter: 'e', words: ['bell', 'pen', 'pencil', 'red'], theme: 'In the classroom' },
  7: { letter: 'g', words: ['garden', 'gate', 'girl', 'goat'], theme: 'In the garden' },
  8: { letter: 'h', words: ['hair', 'hand', 'head', 'horse'], theme: 'In the park' },
  // Học kì 2 (Unit 9–16)
  9: { letter: 'o', words: ['clock', 'lock', 'mop', 'pot'], theme: 'In the shop' },
  10: { letter: 'm', words: ['mango', 'monkey', 'mother', 'mouse'], theme: 'At the zoo' },
  11: { letter: 'u', words: ['bus', 'run', 'sun', 'truck'], theme: 'At the bus stop' },
  12: { letter: 'l', words: ['lake', 'leaf', 'lemon'], theme: 'At the lake' },
  13: { letter: 'n', words: ['banana', 'noodles', 'nut'], theme: 'In the school canteen' },
  14: { letter: 't', words: ['teddy bear', 'tiger', 'top', 'turtle'], theme: 'In the toy shop' },
  15: { letter: 'f', words: ['face', 'father', 'foot', 'football'], theme: 'At the football match' },
  16: { letter: 'w', words: ['wash', 'water', 'window'], theme: 'At home' },
};

// Từ trong mẫu câu của từng unit (đã học từ unit đó trở đi) — dùng cho kiểm tra "không vượt trước".
export const GS1_PHRASES: Record<number, string[]> = {
  9: ['how', 'many', 'one', 'two', 'three', 'four', 'five'],
  10: ["that's", 'that'],
  11: ["she's", "he's", 'she', 'he', 'running'],
  12: ['look', 'at', 'the'],
  13: ['having'],
  14: ['teddy', 'bear'],
  15: ['point', 'to', 'your'],
  16: ['six', 'seven', 'eight', 'nine', 'ten', 'washing'],
};

const IRREGULAR_PLURAL: Record<string, string> = { mouse: 'mice', leaf: 'leaves', fish: 'fish', mango: 'mangoes', bus: 'buses', 'teddy bear': 'teddy bears' };
/** Số nhiều của danh từ đã học (clock → clocks, mouse → mice…). */
export const enPlural = (w: string) => IRREGULAR_PLURAL[w] ?? (/(s|sh|ch|x)$/.test(w) ? `${w}es` : `${w}s`);

/** Toàn bộ từ được dùng khi đã học đến hết `unit` (từ vựng + số nhiều + từ trong mẫu câu). */
export function gs1Learned(unit: number): Set<string> {
  const out = new Set<string>();
  for (const [u, v] of Object.entries(GS1_VOCAB)) {
    if (Number(u) > unit) continue;
    for (const w of v.words) {
      out.add(w);
      for (const part of enPlural(w).split(' ')) out.add(part);
    }
  }
  for (const [u, ws] of Object.entries(GS1_PHRASES)) if (Number(u) <= unit) ws.forEach((w) => out.add(w));
  return out;
}

const U = (
  unit: number,
  part: { code: string; title: string },
  questions: ContentLesson['questions'],
): ContentLesson => {
  const v = GS1_VOCAB[unit];
  return {
    id: `ta1-gs-u${String(unit).padStart(2, '0')}`,
    subject: 'tieng-anh',
    grade: 1,
    semester: 1,
    book: BOOK,
    ref: `Unit ${unit}`,
    unit: part,
    topicCode: 'A1.ABC',
    title: `Unit ${unit}. ${v.theme}`,
    description: `Chữ ${v.letter.toUpperCase()} ${v.letter}: ${v.words.join(', ')}.`,
    scope: { kind: 'english', unit },
    questions,
  };
};

const R = (no: number, upTo: number, part: { code: string; title: string }, questions: ContentLesson['questions']): ContentLesson => ({
  id: `ta1-gs-review${no}`,
  subject: 'tieng-anh',
  grade: 1,
  semester: 1,
  book: BOOK,
  ref: `Review ${no}`,
  unit: part,
  topicCode: 'A1.ABC',
  title: `Review ${no}. Ôn tập Unit ${upTo - 3}–${upTo}`,
  description: `Ôn chữ cái và từ vựng Unit ${upTo - 3}–${upTo}.`,
  scope: { kind: 'english', unit: upTo },
  questions,
});

export const TA1_HK1: ContentLesson[] = [
  U(1, P1, [
    sc('⚽ Đây là gì?', ['ball', 'bike', 'book'], 'ball', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"ball" là quả bóng.' }),
    sc('🚲 Đây là gì?', ['bike', 'ball', 'book'], 'bike', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"bike" là xe đạp.' }),
    sc('📖 Đây là gì?', ['book', 'ball', 'bike'], 'book', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"book" là quyển sách.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['ball', 'quả bóng'], ['bike', 'xe đạp'], ['book', 'quyển sách']], { o: 'A1.SCHOOL.01', f: 'TA.NOINGHIA', l: 2, e: 'ball – quả bóng; bike – xe đạp; book – quyển sách.' }),
    sc('Từ "ball" bắt đầu bằng chữ cái nào?', ['b', 'd', 'p'], 'b', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: '"ball" bắt đầu bằng chữ b, đọc là /b/.' }),
    fb('Điền chữ cái còn thiếu: _ook (📖 quyển sách)', ['b', 'book'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'b + ook = book.' }),
    sc('Buổi sáng gặp bạn, em chào thế nào?', ['Hello!', 'Goodbye!'], 'Hello!', { o: 'A1.HELLO.01', f: 'TA.MAUCAU', l: 2, e: 'Gặp nhau nói "Hello!", chia tay nói "Goodbye!".' }),
    sc('Bạn nhỏ nói: "Hello, I\'m Bill." Bạn ấy tên là gì?', ['Bill', 'Ball', 'Bike'], 'Bill', {
      o: 'A1.HELLO.01', f: 'TA.MAUCAU', l: 3, e: '"I\'m Bill" nghĩa là "Mình là Bill".',
      s: '"Hello" là lời chào. "I\'m" nghĩa là "mình là". Từ đứng sau "I\'m" là tên: Bill.',
    }),
  ]),

  U(2, P1, [
    sc('🐱 Đây là gì?', ['cat', 'car', 'cup'], 'cat', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"cat" là con mèo.' }),
    sc('🚗 Đây là gì?', ['car', 'cake', 'cat'], 'car', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"car" là ô tô.' }),
    sc('🎂 Đây là gì?', ['cake', 'cup', 'book'], 'cake', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"cake" là bánh ngọt.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['cup', 'cái cốc'], ['cake', 'bánh ngọt'], ['cat', 'con mèo']], { o: 'A1.EXTRA.02', f: 'TA.NOINGHIA', l: 2, e: 'cup – cái cốc; cake – bánh ngọt; cat – con mèo.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ c', ['cat', 'ball', 'cup', 'bike', 'car'], ['cat', 'cup', 'car'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'cat, cup, car bắt đầu bằng c; ball, bike bắt đầu bằng b.' }),
    fb('Điền chữ cái còn thiếu: _at (🐱 con mèo)', ['c', 'cat'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'c + at = cat.' }),
    tf('"cup" nghĩa là cái cốc. Đúng hay sai?', 'Đúng', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: 'Đúng, "cup" là cái cốc.' }),
    sc('Con vật nào kêu "meo meo"?', ['cat', 'car', 'cup'], 'cat', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 3, s: 'Con mèo kêu meo meo. Con mèo tiếng Anh là "cat". "car" là ô tô, "cup" là cái cốc.', e: 'Con mèo kêu meo meo, tiếng Anh là "cat".' }),
  ]),

  U(3, P1, [
    sc('🍎 Đây là gì?', ['apple', 'bag', 'hat'], 'apple', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"apple" là quả táo.' }),
    sc('🎒 Đây là gì?', ['bag', 'hat', 'can'], 'bag', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"bag" là cái cặp, cái túi.' }),
    sc('🧢 Đây là gì?', ['hat', 'bag', 'cat'], 'hat', { o: 'A1.ABC.02', f: 'TA.TUVUNG', l: 1, e: '"hat" là cái mũ.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['apple', 'quả táo'], ['bag', 'cái cặp'], ['can', 'cái lon']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'apple – quả táo; bag – cái cặp; can – cái lon.' }),
    mc('Chọn TẤT CẢ các từ có chữ a', ['bag', 'cat', 'hat', 'book', 'cup'], ['bag', 'cat', 'hat'], { o: 'A1.ABC.01', f: 'TA.NHOMTU', l: 2, e: 'bag, cat, hat đều có chữ a ở giữa.' }),
    fb('Điền chữ cái còn thiếu: h_t (🧢 cái mũ)', ['a', 'hat'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'h + a + t = hat.' }),
    sc('"I have a bag." nghĩa là gì?', ['Em có một cái cặp.', 'Em có một quả táo.', 'Em có một cái mũ.'], 'Em có một cái cặp.', {
      o: 'A1.SCHOOL.01', f: 'TA.MAUCAU', l: 3, e: '"I have a ..." là "Em có một ...", "bag" là cái cặp.',
      s: 'Tách câu: "I" = em, "have" = có, "a" = một, "bag" = cái cặp. Ghép lại: Em có một cái cặp.',
    }),
    tf('"apple" nghĩa là quả táo. Đúng hay sai?', 'Đúng', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: 'Đúng.' }),
  ]),

  U(4, P1, [
    sc('🐶 Đây là gì?', ['dog', 'duck', 'desk'], 'dog', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"dog" là con chó.' }),
    sc('🦆 Đây là gì?', ['duck', 'dog', 'door'], 'duck', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"duck" là con vịt.' }),
    sc('🚪 Đây là gì?', ['door', 'desk', 'dog'], 'door', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"door" là cái cửa.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['desk', 'cái bàn'], ['door', 'cái cửa'], ['dog', 'con chó']], { o: 'A1.SCHOOL.01', f: 'TA.NOINGHIA', l: 2, e: 'desk – cái bàn; door – cái cửa; dog – con chó.' }),
    sc('Chữ nào là chữ d thường?', ['d', 'b', 'p'], 'd', {
      o: 'A1.ABC.01', f: 'TA.CHUCAI', l: 2, e: 'Chữ d có bụng tròn ở bên TRÁI nét thẳng.',
      s: 'Mẹo phân biệt b và d: chữ b có bụng tròn ở bên phải, chữ d có bụng tròn ở bên trái.',
    }),
    fb('Điền chữ cái còn thiếu: _uck (🦆 con vịt)', ['d', 'duck'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'd + uck = duck.' }),
    mc('Chọn TẤT CẢ các con vật', ['dog', 'desk', 'duck', 'cat', 'door'], ['dog', 'duck', 'cat'], { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 2, e: 'dog, duck, cat là con vật; desk, door là đồ vật.' }),
    sc('🐶 Cô hỏi: "Can you see a dog?" Em trả lời:', ['Yes.', 'No.'], 'Yes.', { o: 'A1.HELLO.02', f: 'TA.MAUCAU', l: 3, s: '"Can you see a dog?" nghĩa là "Em có nhìn thấy con chó không?". Trong tranh có con chó nên trả lời "Yes." (Có).', e: 'Trong tranh có con chó, nên trả lời "Yes."' }),
  ]),

  R(1, 4, P1, [
    mt('Ghép hình với từ đúng', [['🚲', 'bike'], ['🐱', 'cat'], ['🍎', 'apple'], ['🦆', 'duck']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'bike, cat, apple, duck.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ d', ['dog', 'bag', 'desk', 'door', 'cup'], ['dog', 'desk', 'door'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'dog, desk, door bắt đầu bằng d.' }),
    sc('Chữ cái đầu của từ "cake" là:', ['c', 'a', 'b'], 'c', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: '"cake" bắt đầu bằng c.' }),
    sc('Bạn chỉ vào cái cặp của mình và nói:', ['This is my bag.', 'This is my cat.', 'This is my door.'], 'This is my bag.', {
      o: 'A1.SCHOOL.01', f: 'TA.MAUCAU', l: 3, s: '"This is my ..." nghĩa là "Đây là ... của mình". Cái cặp là "bag", nên nói "This is my bag."', e: '"This is my bag." = Đây là cái cặp của mình.',
    }),
    fb('Điền chữ cái còn thiếu: c_p (cái cốc)', ['u', 'cup'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'c + u + p = cup.' }),
    ord('Sắp xếp các từ thành câu đúng', ['This', 'is', 'my', 'book.'], { o: 'A1.SCHOOL.01', f: 'TA.MAUCAU', l: 3, s: 'Mẫu câu: This (Đây) – is (là) – my (của mình) – book (quyển sách). Từ có dấu chấm đứng cuối câu.', e: 'This is my book. = Đây là quyển sách của mình.' }),
    tf('"door" nghĩa là cái bàn. Đúng hay sai?', 'Sai', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 2, e: '"door" là cái cửa; cái bàn là "desk".' }),
    sc('Từ nào KHÔNG phải con vật?', ['cat', 'dog', 'book', 'duck'], 'book', { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 2, e: '"book" là quyển sách, không phải con vật.' }),
  ]),

  U(5, P2, [
    sc('🐟 Đây là gì?', ['fish', 'milk', 'chips'], 'fish', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"fish" là con cá (cũng là món cá).' }),
    sc('🥛 Đây là gì?', ['milk', 'fish', 'chicken'], 'milk', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"milk" là sữa.' }),
    sc('🍟 Đây là gì?', ['chips', 'chicken', 'milk'], 'chips', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"chips" là khoai tây chiên.' }),
    sc('🍗 Đây là gì?', ['chicken', 'fish', 'chips'], 'chicken', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"chicken" là thịt gà.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['milk', 'sữa'], ['fish', 'cá'], ['chips', 'khoai tây chiên']], { o: 'A1.EXTRA.02', f: 'TA.NOINGHIA', l: 2, e: 'milk – sữa; fish – cá; chips – khoai tây chiên.' }),
    fb('Điền chữ cái còn thiếu: f_sh (🐟)', ['i', 'fish'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'f + i + sh = fish.' }),
    mc('Chọn TẤT CẢ đồ ăn, đồ uống', ['milk', 'chips', 'desk', 'chicken', 'door'], ['milk', 'chips', 'chicken'], { o: 'A1.EXTRA.02', f: 'TA.NHOMTU', l: 2, e: 'milk, chips, chicken là đồ ăn uống.' }),
    sc('Em muốn uống sữa. Em nói:', ['Milk, please!', 'Fish, please!', 'Chips, please!'], 'Milk, please!', {
      o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: '"Milk, please!" = Cho em sữa ạ!',
      s: '"please" là lời nói lịch sự (làm ơn). Muốn sữa thì nói tên món "milk" rồi thêm "please": Milk, please!',
    }),
  ]),

  U(6, P2, [
    sc('🔔 Đây là gì?', ['bell', 'pen', 'red'], 'bell', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"bell" là cái chuông.' }),
    sc('✏️ Đây là gì?', ['pencil', 'pen', 'bell'], 'pencil', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"pencil" là bút chì.' }),
    sc('🖊️ Đây là gì?', ['pen', 'pencil', 'bag'], 'pen', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 1, e: '"pen" là bút bi.' }),
    sc('🔴 Màu này tiếng Anh là gì?', ['red', 'pen', 'bell'], 'red', { o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 1, e: '"red" là màu đỏ.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['pen', 'bút bi'], ['pencil', 'bút chì'], ['bell', 'cái chuông']], { o: 'A1.SCHOOL.01', f: 'TA.NOINGHIA', l: 2, e: 'pen – bút bi; pencil – bút chì; bell – cái chuông.' }),
    fb('Điền chữ cái còn thiếu: p_n (🖊️)', ['e', 'pen'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'p + e + n = pen.' }),
    mc('Chọn TẤT CẢ đồ dùng học tập', ['pen', 'pencil', 'duck', 'book', 'cake'], ['pen', 'pencil', 'book'], { o: 'A1.SCHOOL.01', f: 'TA.NHOMTU', l: 2, e: 'pen, pencil, book là đồ dùng học tập.' }),
    sc('"a red pen" nghĩa là gì?', ['một cái bút bi màu đỏ', 'một cái chuông', 'một quyển sách đỏ'], 'một cái bút bi màu đỏ', {
      o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 3, e: '"red" = màu đỏ, "pen" = bút bi.',
      s: 'Trong tiếng Anh, từ chỉ màu đứng TRƯỚC đồ vật: "red pen". Tiếng Việt nói ngược lại: "bút bi màu đỏ".',
    }),
  ]),

  U(7, P2, [
    sc('🐐 Đây là gì?', ['goat', 'girl', 'gate'], 'goat', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"goat" là con dê.' }),
    sc('👧 Đây là ai?', ['girl', 'goat', 'garden'], 'girl', { o: 'A1.FAMILY.01', f: 'TA.TUVUNG', l: 1, e: '"girl" là bé gái.' }),
    sc('🌷🌳🌻 Nơi trồng hoa, trồng cây là gì?', ['garden', 'gate', 'goat'], 'garden', { o: 'A1.ABC.02', f: 'TA.TUVUNG', l: 1, e: '"garden" là khu vườn.' }),
    sc('"gate" nghĩa là gì?', ['cái cổng', 'khu vườn', 'con dê'], 'cái cổng', { o: 'A1.ABC.02', f: 'TA.TUVUNG', l: 2, e: '"gate" là cái cổng.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['goat', 'con dê'], ['girl', 'bé gái'], ['garden', 'khu vườn']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'goat – con dê; girl – bé gái; garden – khu vườn.' }),
    fb('Điền chữ cái còn thiếu: _oat (🐐 con dê)', ['g', 'goat'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'g + oat = goat.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ g', ['girl', 'gate', 'cake', 'goat', 'dog'], ['girl', 'gate', 'goat'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'girl, gate, goat bắt đầu bằng g.' }),
    tf('Từ "dog" bắt đầu bằng chữ g. Đúng hay sai?', 'Sai', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 3, e: '"dog" bắt đầu bằng d; chữ g nằm ở CUỐI từ.', s: 'Đọc từng chữ: d – o – g. Chữ ĐẦU là d, chữ g đứng cuối. Vậy câu nói sai.' }),
  ]),

  U(8, P2, [
    sc('🐴 Đây là gì?', ['horse', 'hand', 'hair'], 'horse', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"horse" là con ngựa.' }),
    sc('✋ Đây là gì?', ['hand', 'head', 'hat'], 'hand', { o: 'A1.EXTRA.03', f: 'TA.TUVUNG', l: 1, e: '"hand" là bàn tay.' }),
    sc('"head" là bộ phận nào?', ['cái đầu', 'bàn tay', 'mái tóc'], 'cái đầu', { o: 'A1.EXTRA.03', f: 'TA.TUVUNG', l: 1, e: '"head" là cái đầu.' }),
    sc('"hair" nghĩa là gì?', ['mái tóc', 'cái đầu', 'con ngựa'], 'mái tóc', { o: 'A1.EXTRA.03', f: 'TA.TUVUNG', l: 1, e: '"hair" là tóc.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['hand', 'bàn tay'], ['head', 'cái đầu'], ['horse', 'con ngựa']], { o: 'A1.EXTRA.03', f: 'TA.NOINGHIA', l: 2, e: 'hand – bàn tay; head – cái đầu; horse – con ngựa.' }),
    fb('Điền chữ cái còn thiếu: _and (✋ bàn tay)', ['h', 'hand'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'h + and = hand.' }),
    mc('Chọn TẤT CẢ các bộ phận cơ thể', ['hair', 'hand', 'horse', 'head', 'hat'], ['hair', 'hand', 'head'], { o: 'A1.EXTRA.03', f: 'TA.NHOMTU', l: 2, e: 'hair, hand, head là bộ phận cơ thể; horse là con ngựa, hat là cái mũ.' }),
    sc('Cô chỉ vào đầu và hỏi: "What is it?" Em trả lời:', ['Head.', 'Hand.', 'Hat.'], 'Head.', { o: 'A1.EXTRA.03', f: 'TA.MAUCAU', l: 3, s: '"What is it?" nghĩa là "Đây là cái gì?". Cô chỉ vào đầu, cái đầu là "head". Trả lời: "Head."', e: 'Cô chỉ vào đầu, đầu là "head".' }),
  ]),

  R(2, 8, P2, [
    mt('Ghép hình với từ đúng', [['🐐', 'goat'], ['🔔', 'bell'], ['🥛', 'milk'], ['🐴', 'horse']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'goat, bell, milk, horse.' }),
    mc('Chọn TẤT CẢ các con vật', ['fish', 'goat', 'pen', 'horse', 'milk'], ['fish', 'goat', 'horse'], { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 2, e: 'fish, goat, horse là con vật.' }),
    sc('Từ nào bắt đầu bằng chữ h?', ['hand', 'bell', 'girl'], 'hand', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: '"hand" bắt đầu bằng h.' }),
    fb('Điền chữ cái còn thiếu: m_lk (🥛 sữa)', ['i', 'milk'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'm + i + lk = milk.' }),
    ord('Sắp xếp các từ thành câu đúng', ['This', 'is', 'my', 'pencil.'], { o: 'A1.SCHOOL.01', f: 'TA.MAUCAU', l: 3, s: 'Giống mẫu câu đã học: This – is – my – pencil. Từ có dấu chấm (pencil.) đứng cuối câu.', e: 'This is my pencil. = Đây là bút chì của mình.' }),
    sc('"a red bell" nghĩa là gì?', ['một cái chuông màu đỏ', 'một bé gái', 'một con ngựa'], 'một cái chuông màu đỏ', { o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 2, e: 'red = đỏ, bell = cái chuông.' }),
    tf('"girl" nghĩa là bé gái. Đúng hay sai?', 'Đúng', { o: 'A1.FAMILY.01', f: 'TA.TUVUNG', l: 1, e: 'Đúng.' }),
    sc('Em muốn ăn gà rán. Em nói:', ['Chicken, please!', 'Goat, please!', 'Gate, please!'], 'Chicken, please!', { o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, s: 'Gà rán là thịt gà, tiếng Anh là "chicken". Thêm "please" cho lịch sự: "Chicken, please!"', e: '"chicken" là thịt gà.' }),
  ]),
];
