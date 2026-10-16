// TIẾNG ANH 1 — HỌC KỲ 2 — bám trình tự sách Tiếng Anh 1 Global Success (Unit 9–16, Review 3, Review 4).
// Câu hỏi do nhóm soạn mới theo từ vựng và mẫu câu của từng unit; không chép bài tập trong sách.
// QUY TẮC: từ tiếng Anh chỉ dùng từ của các unit ĐÃ HỌC (kiểm tra tự động bằng gs1Learned).

import { GS1_VOCAB } from './ta1-hk1';
import { fb, mc, mt, ord, sc, tf, type ContentLesson } from './types';

const BOOK = 'Global Success';
const P3 = { code: 'GS1.P3', title: 'Học kì 2 · Unit 9–12 và Review 3' };
const P4 = { code: 'GS1.P4', title: 'Học kì 2 · Unit 13–16 và Review 4' };

const U = (unit: number, part: { code: string; title: string }, questions: ContentLesson['questions']): ContentLesson => {
  const v = GS1_VOCAB[unit];
  return {
    id: `ta1-gs-u${String(unit).padStart(2, '0')}`,
    subject: 'tieng-anh',
    grade: 1,
    semester: 2,
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
  semester: 2,
  book: BOOK,
  ref: `Review ${no}`,
  unit: part,
  topicCode: 'A1.ABC',
  title: `Review ${no}. Ôn tập Unit ${upTo - 3}–${upTo}`,
  description: `Ôn chữ cái, từ vựng và mẫu câu Unit ${upTo - 3}–${upTo}.`,
  scope: { kind: 'english', unit: upTo },
  questions,
});

export const TA1_HK2: ContentLesson[] = [
  U(9, P3, [
    sc('🕰️ Đây là gì?', ['clock', 'lock', 'pot'], 'clock', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"clock" là đồng hồ.' }),
    sc('🔒 Đây là gì?', ['lock', 'clock', 'mop'], 'lock', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"lock" là ổ khóa.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['mop', 'cây lau nhà'], ['pot', 'cái nồi'], ['lock', 'ổ khóa']], { o: 'A1.EXTRA.01', f: 'TA.NOINGHIA', l: 2, e: 'mop – cây lau nhà; pot – cái nồi; lock – ổ khóa.' }),
    fb('Điền chữ cái còn thiếu: p_t (cái nồi)', ['o', 'pot'], { o: 'A1.ABC.01', f: 'TA.CHUCAI', l: 2, e: 'p + o + t = pot. Chữ o đọc là /ɒ/.' }),
    mc('Chọn TẤT CẢ các từ có chữ o', ['clock', 'mop', 'cat', 'pot', 'bag'], ['clock', 'mop', 'pot'], { o: 'A1.ABC.01', f: 'TA.NHOMTU', l: 2, e: 'clock, mop, pot có chữ o; cat, bag có chữ a.' }),
    sc('🔒🔒🔒 How many locks?', ['Three.', 'Two.', 'Four.'], 'Three.', {
      o: 'A1.NUM.02', f: 'TA.MAUCAU', l: 2, e: 'Có 3 ổ khóa: three.',
      s: '"How many locks?" nghĩa là "Có mấy ổ khóa?". Đếm: 1, 2, 3. Số 3 là "three".',
    }),
    ord('Sắp xếp các số từ bé đến lớn', ['one', 'two', 'three', 'four', 'five'], { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 3, e: 'one (1), two (2), three (3), four (4), five (5).', s: 'Nhớ nghĩa từng số: one = 1, two = 2, three = 3, four = 4, five = 5 rồi xếp từ bé đến lớn.' }),
    tf('"two" là số 2. Đúng hay sai?', 'Đúng', { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 1, e: 'Đúng, two = 2.' }),
  ]),

  U(10, P3, [
    sc('🐒 Đây là con gì?', ['monkey', 'mouse', 'mango'], 'monkey', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"monkey" là con khỉ.' }),
    sc('🐭 Đây là con gì?', ['mouse', 'monkey', 'mother'], 'mouse', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"mouse" là con chuột.' }),
    sc('🥭 Đây là quả gì?', ['mango', 'apple', 'monkey'], 'mango', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"mango" là quả xoài.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['mother', 'mẹ'], ['mouse', 'con chuột'], ['mango', 'quả xoài']], { o: 'A1.FAMILY.01', f: 'TA.NOINGHIA', l: 2, e: 'mother – mẹ; mouse – con chuột; mango – quả xoài.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ m', ['monkey', 'lock', 'mouse', 'mango', 'pot'], ['monkey', 'mouse', 'mango'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'monkey, mouse, mango bắt đầu bằng m.' }),
    fb('Điền chữ cái còn thiếu: _ouse (🐭 con chuột)', ['m', 'mouse'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'm + ouse = mouse.' }),
    sc('🐒 Ở vườn thú, em chỉ vào con khỉ và nói:', ["That's a monkey.", "That's a mouse.", "That's a mango."], "That's a monkey.", {
      o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 3, e: '"That\'s a monkey." = Đó là một con khỉ.',
      s: '"That\'s a …" nghĩa là "Đó là một …". Con khỉ là "monkey", nên nói: That\'s a monkey.',
    }),
    sc('Con vật nào thích ăn chuối và leo cây giỏi?', ['monkey', 'mouse', 'duck'], 'monkey', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 3, e: 'Con khỉ (monkey) leo cây giỏi.', s: 'Con khỉ leo trèo giỏi và thích ăn chuối. Con khỉ tiếng Anh là "monkey".' }),
  ]),

  U(11, P3, [
    sc('🚌 Đây là gì?', ['bus', 'truck', 'car'], 'bus', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"bus" là xe buýt.' }),
    sc('🚚 Đây là gì?', ['truck', 'bus', 'sun'], 'truck', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"truck" là xe tải.' }),
    sc('☀️ Đây là gì?', ['sun', 'bus', 'run'], 'sun', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"sun" là mặt trời.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['run', 'chạy'], ['sun', 'mặt trời'], ['truck', 'xe tải']], { o: 'A1.EXTRA.02', f: 'TA.NOINGHIA', l: 2, e: 'run – chạy; sun – mặt trời; truck – xe tải.' }),
    fb('Điền chữ cái còn thiếu: b_s (🚌 xe buýt)', ['u', 'bus'], { o: 'A1.ABC.01', f: 'TA.CHUCAI', l: 2, e: 'b + u + s = bus. Chữ u đọc là /ʌ/.' }),
    mc('Chọn TẤT CẢ các từ có chữ u', ['bus', 'sun', 'pot', 'run', 'pen'], ['bus', 'sun', 'run'], { o: 'A1.ABC.01', f: 'TA.NHOMTU', l: 2, e: 'bus, sun, run có chữ u.' }),
    sc('👧🏃 Bạn gái đang chạy. Câu nào đúng?', ["She's running.", "He's running."], "She's running.", {
      o: 'A1.HELLO.02', f: 'TA.MAUCAU', l: 3, e: 'Bạn gái dùng "She": She\'s running.',
      s: '"She" dùng cho bạn gái, "He" dùng cho bạn trai. "running" là đang chạy. Vậy: She\'s running.',
    }),
    tf('"truck" nghĩa là xe buýt. Đúng hay sai?', 'Sai', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 2, e: 'Sai. "truck" là xe tải, xe buýt là "bus".' }),
  ]),

  U(12, P3, [
    sc('🍋 Đây là quả gì?', ['lemon', 'mango', 'apple'], 'lemon', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"lemon" là quả chanh.' }),
    sc('🍃 Đây là gì?', ['leaf', 'lake', 'lock'], 'leaf', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"leaf" là chiếc lá.' }),
    sc('"lake" nghĩa là gì?', ['hồ nước', 'chiếc lá', 'ổ khóa'], 'hồ nước', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"lake" là hồ nước.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ l', ['lake', 'leaf', 'bus', 'lemon', 'mouse'], ['lake', 'leaf', 'lemon'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'lake, leaf, lemon bắt đầu bằng l.' }),
    fb('Điền chữ cái còn thiếu: _eaf (🍃 chiếc lá)', ['l', 'leaf'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'l + eaf = leaf.' }),
    sc('"Look at the lemons." nghĩa là gì?', ['Hãy nhìn những quả chanh kìa.', 'Hãy nhìn những chiếc lá kìa.', 'Hãy nhìn những con khỉ kìa.'], 'Hãy nhìn những quả chanh kìa.', {
      o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: '"Look at the …" = Hãy nhìn …; lemons = những quả chanh.',
      s: '"Look at" nghĩa là "nhìn vào". "lemons" là nhiều quả chanh. Vậy câu nghĩa là: Hãy nhìn những quả chanh kìa.',
    }),
    ord('Sắp xếp các từ thành câu đúng', ['Look', 'at', 'the', 'leaves.'], { o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: 'Look at the leaves. = Hãy nhìn những chiếc lá kìa.', s: 'Từ viết hoa "Look" đứng đầu, rồi "at the", từ có dấu chấm "leaves." đứng cuối.' }),
    tf('"lemon" bắt đầu bằng chữ l. Đúng hay sai?', 'Đúng', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: 'Đúng: l – e – m – o – n.' }),
  ]),

  R(3, 12, P3, [
    mt('Ghép hình với từ đúng', [['🕰️', 'clock'], ['🐒', 'monkey'], ['🚌', 'bus'], ['🍋', 'lemon']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'clock, monkey, bus, lemon.' }),
    mc('Chọn TẤT CẢ các con vật', ['mouse', 'truck', 'monkey', 'duck', 'lock'], ['mouse', 'monkey', 'duck'], { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 2, e: 'mouse, monkey, duck là con vật.' }),
    sc('Từ nào bắt đầu bằng chữ l?', ['lake', 'mop', 'sun'], 'lake', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: '"lake" bắt đầu bằng l.' }),
    sc('🥭🥭🥭🥭 How many mangoes?', ['Four.', 'Five.', 'Three.'], 'Four.', { o: 'A1.NUM.02', f: 'TA.MAUCAU', l: 2, e: 'Có 4 quả xoài: four.', s: 'Đếm: 1, 2, 3, 4. Số 4 tiếng Anh là "four".' }),
    fb('Điền chữ cái còn thiếu: tr_ck (🚚 xe tải)', ['u', 'truck'], { o: 'A1.ABC.01', f: 'TA.CHUCAI', l: 2, e: 'tr + u + ck = truck.' }),
    sc('👦🏃 Bạn trai đang chạy. Em nói:', ["He's running.", "She's running.", "That's a bus."], "He's running.", { o: 'A1.HELLO.02', f: 'TA.MAUCAU', l: 3, e: 'Bạn trai dùng "He".', s: 'Bạn trai dùng "He", bạn gái dùng "She". Bạn trai đang chạy: He\'s running.' }),
    ord('Sắp xếp các từ thành câu đúng', ["That's", 'a', 'mouse.'], { o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 3, e: "That's a mouse. = Đó là một con chuột.", s: 'Mẫu câu: That\'s – a – … . Từ có dấu chấm "mouse." đứng cuối.' }),
    tf('"mother" nghĩa là mẹ. Đúng hay sai?', 'Đúng', { o: 'A1.FAMILY.01', f: 'TA.TUVUNG', l: 1, e: 'Đúng.' }),
  ]),

  U(13, P4, [
    sc('🍌 Đây là quả gì?', ['banana', 'lemon', 'mango'], 'banana', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"banana" là quả chuối.' }),
    sc('🍜 Đây là món gì?', ['noodles', 'chips', 'milk'], 'noodles', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"noodles" là mì sợi.' }),
    sc('🥜 Đây là gì?', ['nut', 'pot', 'sun'], 'nut', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"nut" là hạt (hạt lạc, hạt dẻ…).' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['banana', 'quả chuối'], ['noodles', 'mì sợi'], ['nut', 'hạt lạc']], { o: 'A1.EXTRA.02', f: 'TA.NOINGHIA', l: 2, e: 'banana – quả chuối; noodles – mì sợi; nut – hạt lạc.' }),
    mc('Chọn TẤT CẢ các từ có chữ n', ['banana', 'nut', 'bus', 'noodles', 'cup'], ['banana', 'nut', 'noodles'], { o: 'A1.ABC.01', f: 'TA.NHOMTU', l: 2, e: 'banana, nut, noodles có chữ n.' }),
    fb('Điền chữ cái còn thiếu: _ut (🥜 hạt lạc)', ['n', 'nut'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'n + ut = nut.' }),
    sc('👧🍜 Ở căng tin, bạn gái đang ăn mì. Câu nào đúng?', ["She's having noodles.", "She's having milk.", "She's having a banana."], "She's having noodles.", {
      o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: '"She\'s having noodles." = Bạn ấy đang ăn mì.',
      s: '"She\'s having …" nghĩa là "Bạn ấy đang ăn/uống …". Mì là "noodles". Vậy: She\'s having noodles.',
    }),
    ord('Sắp xếp các từ thành câu đúng', ["He's", 'having', 'a', 'banana.'], { o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: "He's having a banana. = Bạn ấy đang ăn một quả chuối.", s: 'Câu bắt đầu bằng "He\'s", tiếp theo "having a", cuối câu là "banana."' }),
  ]),

  U(14, P4, [
    sc('🐯 Đây là con gì?', ['tiger', 'turtle', 'monkey'], 'tiger', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"tiger" là con hổ.' }),
    sc('🐢 Đây là con gì?', ['turtle', 'tiger', 'duck'], 'turtle', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: '"turtle" là con rùa.' }),
    sc('🧸 Đây là gì?', ['teddy bear', 'top', 'turtle'], 'teddy bear', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"teddy bear" là gấu bông.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['top', 'con quay'], ['tiger', 'con hổ'], ['turtle', 'con rùa']], { o: 'A1.EXTRA.01', f: 'TA.NOINGHIA', l: 2, e: 'top – con quay; tiger – con hổ; turtle – con rùa.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ t', ['tiger', 'top', 'nut', 'turtle', 'lake'], ['tiger', 'top', 'turtle'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'tiger, top, turtle bắt đầu bằng t.' }),
    fb('Điền chữ cái còn thiếu: _op (con quay)', ['t', 'top'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 't + op = top.' }),
    sc('🐢 Ở cửa hàng đồ chơi, em nói:', ['I can see a turtle.', 'I can see a tiger.', 'I can see a top.'], 'I can see a turtle.', {
      o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 3, e: '"I can see a turtle." = Em nhìn thấy một con rùa.',
      s: '"I can see a …" nghĩa là "Em nhìn thấy một …". Tranh là con rùa (turtle).',
    }),
    tf('Từ "nut" bắt đầu bằng chữ t. Đúng hay sai?', 'Sai', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 3, e: '"nut" bắt đầu bằng n; chữ t đứng cuối.', s: 'Đọc từng chữ: n – u – t. Chữ ĐẦU là n, nên câu nói sai.' }),
  ]),

  U(15, P4, [
    sc('🦶 Đây là gì?', ['foot', 'face', 'hand'], 'foot', { o: 'A1.EXTRA.03', f: 'TA.TUVUNG', l: 1, e: '"foot" là bàn chân.' }),
    sc('🙂 Đây là gì?', ['face', 'foot', 'head'], 'face', { o: 'A1.EXTRA.03', f: 'TA.TUVUNG', l: 1, e: '"face" là khuôn mặt.' }),
    sc('👨 Đây là ai?', ['father', 'mother', 'girl'], 'father', { o: 'A1.FAMILY.01', f: 'TA.TUVUNG', l: 1, e: '"father" là bố.' }),
    mt('Ghép từ tiếng Anh với nghĩa', [['football', 'quả bóng đá'], ['father', 'bố'], ['face', 'khuôn mặt']], { o: 'A1.FAMILY.01', f: 'TA.NOINGHIA', l: 2, e: 'football – quả bóng đá; father – bố; face – khuôn mặt.' }),
    mc('Chọn TẤT CẢ các bộ phận cơ thể', ['face', 'foot', 'father', 'hand', 'football'], ['face', 'foot', 'hand'], { o: 'A1.EXTRA.03', f: 'TA.NHOMTU', l: 2, e: 'face, foot, hand là bộ phận cơ thể.' }),
    fb('Điền chữ cái còn thiếu: _ace (🙂 khuôn mặt)', ['f', 'face'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'f + ace = face.' }),
    sc('Cô nói: "Point to your foot." Em chỉ vào đâu?', ['🦶 bàn chân', '🙂 khuôn mặt', '✋ bàn tay'], '🦶 bàn chân', {
      o: 'A1.EXTRA.03', f: 'TA.MAUCAU', l: 3, e: '"Point to your foot." = Hãy chỉ vào bàn chân của em.',
      s: '"Point to your …" nghĩa là "Hãy chỉ vào … của em". "foot" là bàn chân.',
    }),
    ord('Sắp xếp các từ thành câu đúng', ['Point', 'to', 'your', 'face.'], { o: 'A1.EXTRA.03', f: 'TA.MAUCAU', l: 3, e: 'Point to your face. = Hãy chỉ vào khuôn mặt của em.', s: 'Câu bắt đầu bằng "Point" (viết hoa), rồi "to your", cuối câu là "face."' }),
  ]),

  U(16, P4, [
    sc('🪟 Đây là gì?', ['window', 'water', 'door'], 'window', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: '"window" là cửa sổ.' }),
    sc('💧 Đây là gì?', ['water', 'wash', 'window'], 'water', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: '"water" là nước.' }),
    sc('"wash" nghĩa là gì?', ['rửa, giặt', 'cửa sổ', 'nước'], 'rửa, giặt', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 2, e: '"wash" là rửa, giặt.' }),
    mc('Chọn TẤT CẢ các từ bắt đầu bằng chữ w', ['wash', 'water', 'face', 'window', 'tiger'], ['wash', 'water', 'window'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 2, e: 'wash, water, window bắt đầu bằng w.' }),
    sc('Số 8 tiếng Anh là gì?', ['eight', 'six', 'ten'], 'eight', { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 1, e: '8 = eight.' }),
    sc('🪟🪟🪟🪟🪟🪟 How many windows can you see?', ['I can see six.', 'I can see five.', 'I can see seven.'], 'I can see six.', {
      o: 'A1.NUM.02', f: 'TA.MAUCAU', l: 3, e: 'Có 6 cửa sổ: I can see six.',
      s: 'Đếm cửa sổ: 1, 2, 3, 4, 5, 6. Số 6 là "six". Trả lời: I can see six.',
    }),
    ord('Sắp xếp các số từ bé đến lớn', ['six', 'seven', 'eight', 'nine', 'ten'], { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 3, e: 'six (6), seven (7), eight (8), nine (9), ten (10).', s: 'six = 6, seven = 7, eight = 8, nine = 9, ten = 10. Xếp từ bé đến lớn.' }),
    tf('"ten" là số 10. Đúng hay sai?', 'Đúng', { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 1, e: 'Đúng, ten = 10.' }),
  ]),

  R(4, 16, P4, [
    mt('Ghép hình với từ đúng', [['🍌', 'banana'], ['🐯', 'tiger'], ['🦶', 'foot'], ['🪟', 'window']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 2, e: 'banana, tiger, foot, window.' }),
    mc('Chọn TẤT CẢ các món ăn', ['noodles', 'banana', 'top', 'nut', 'window'], ['noodles', 'banana', 'nut'], { o: 'A1.EXTRA.02', f: 'TA.NHOMTU', l: 2, e: 'noodles, banana, nut là đồ ăn; top là con quay, window là cửa sổ.' }),
    sc('Từ nào bắt đầu bằng chữ f?', ['father', 'tiger', 'water'], 'father', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: '"father" bắt đầu bằng f.' }),
    sc('"nine" là số mấy?', ['9', '6', '10'], '9', { o: 'A1.NUM.01', f: 'TA.TUVUNG', l: 1, e: 'nine = 9.' }),
    fb('Điền chữ cái còn thiếu: wi_dow (🪟 cửa sổ)', ['n', 'window'], { o: 'A1.ABC.01', f: 'TA.CHUCAI', l: 2, e: 'wi + n + dow = window.' }),
    sc('👦🥜 Bạn trai đang ăn hạt lạc. Câu nào đúng?', ["He's having nuts.", "She's having nuts.", "He's having noodles."], "He's having nuts.", { o: 'A1.EXTRA.02', f: 'TA.MAUCAU', l: 3, e: "He's having nuts. = Bạn ấy đang ăn hạt lạc.", s: 'Bạn trai dùng "He". Hạt lạc là "nuts". Vậy: He\'s having nuts.' }),
    sc('🐢🐢🐢🐢🐢🐢🐢 How many turtles?', ['Seven.', 'Six.', 'Eight.'], 'Seven.', { o: 'A1.NUM.02', f: 'TA.MAUCAU', l: 3, e: 'Có 7 con rùa: seven.', s: 'Đếm từng con rùa: 1, 2, 3, 4, 5, 6, 7. Số 7 là "seven".' }),
    ord('Sắp xếp các từ thành câu đúng', ['I', 'can', 'see', 'a', 'tiger.'], { o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 3, e: 'I can see a tiger. = Em nhìn thấy một con hổ.', s: 'Câu bắt đầu bằng "I", rồi "can see a", cuối câu "tiger."' }),
  ]),
];
