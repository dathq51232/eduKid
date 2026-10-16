// TIẾNG ANH 2 (Global Success) — khung từ vựng và mẫu câu theo từng Unit, lấy từ phần Book map của sách
// (chỉ tên unit, âm/chữ cái, từ vựng, mẫu câu — không chép bài hội thoại, bài hát hay bài tập của sách).
// Dùng cho: kiểm tra "không vượt trước" (scope.ts) và bộ sinh câu Tiếng Anh lớp 2 (practice/ta2.ts).

import { gs1Learned } from './ta1-hk1';

export type GS2Word = { w: string; vi: string; emoji?: string };
export type GS2Unit = {
  title: string; // tên unit (tiếng Anh, giữ nguyên tên trong sách)
  vi: string; // tên tiếng Việt
  sound: string; // âm/chữ cái học trong unit
  words: GS2Word[];
  phrases: string[]; // từ trong mẫu câu của unit (để kiểm phạm vi)
  pattern: { q?: string; a: string[] }; // mẫu câu (tự diễn đạt theo Book map)
};

export const GS2_UNITS: Record<number, GS2Unit> = {
  1: { title: 'At my birthday party', vi: 'Tiệc sinh nhật của tớ', sound: 'p',
    words: [{ w: 'pasta', vi: 'mì Ý', emoji: '🍝' }, { w: 'popcorn', vi: 'bỏng ngô', emoji: '🍿' }, { w: 'pizza', vi: 'bánh pizza', emoji: '🍕' }],
    phrases: ['like', 'some', 'birthday', 'party'], pattern: { a: ['I like pizza.', 'I like popcorn.'] } },
  2: { title: 'In the backyard', vi: 'Ở sân sau nhà', sound: 'k',
    words: [{ w: 'kite', vi: 'con diều', emoji: '🪁' }, { w: 'bike', vi: 'xe đạp', emoji: '🚲' }, { w: 'kitten', vi: 'mèo con', emoji: '🐈' }],
    phrases: ['she', 'he', 'flying', 'riding', 'is', "isn't", 'yes', 'no', 'backyard'], pattern: { q: 'Is she flying a kite?', a: ['Yes, she is.', "No, she isn't."] } },
  3: { title: 'At the seaside', vi: 'Ở bờ biển', sound: 's',
    words: [{ w: 'sail', vi: 'cánh buồm', emoji: '⛵' }, { w: 'sand', vi: 'cát', emoji: '🏖️' }, { w: 'sea', vi: 'biển', emoji: '🌊' }],
    phrases: ["let's", 'look', 'at', 'the', 'seaside'], pattern: { a: ["Let's look at the sea!", "Let's look at the sand!"] } },
  4: { title: 'In the countryside', vi: 'Ở miền quê', sound: 'r',
    words: [{ w: 'rainbow', vi: 'cầu vồng', emoji: '🌈' }, { w: 'river', vi: 'dòng sông', emoji: '🏞️' }, { w: 'road', vi: 'con đường', emoji: '🛣️' }],
    phrases: ['what', 'can', 'you', 'see', 'i', 'countryside'], pattern: { q: 'What can you see?', a: ['I can see a rainbow.'] } },
  5: { title: 'In the classroom', vi: 'Trong lớp học', sound: 'q',
    words: [{ w: 'question', vi: 'câu hỏi', emoji: '❓' }, { w: 'square', vi: 'hình vuông', emoji: '🟥' }, { w: 'quiz', vi: 'câu đố', emoji: '🧩' }],
    phrases: ["what's", 'doing', "he's", "she's", 'drawing', 'classroom'], pattern: { q: "What's he doing?", a: ["He's doing a quiz."] } },
  6: { title: 'On the farm', vi: 'Ở trang trại', sound: 'x',
    words: [{ w: 'box', vi: 'cái hộp', emoji: '📦' }, { w: 'fox', vi: 'con cáo', emoji: '🦊' }, { w: 'ox', vi: 'con bò đực', emoji: '🐂' }],
    phrases: ['there', 'is', "isn't", 'farm', 'an'], pattern: { q: 'Is there a fox?', a: ['Yes, there is.', "No, there isn't."] } },
  7: { title: 'In the kitchen', vi: 'Trong nhà bếp', sound: 'j',
    words: [{ w: 'juice', vi: 'nước ép', emoji: '🧃' }, { w: 'jelly', vi: 'thạch', emoji: '🍮' }, { w: 'jam', vi: 'mứt', emoji: '🍯' }],
    phrases: ['pass', 'me', 'the', 'please', 'here', 'you', 'are', 'kitchen'], pattern: { q: 'Pass me the jam, please.', a: ['Here you are.'] } },
  8: { title: 'In the village', vi: 'Ở làng quê', sound: 'v',
    words: [{ w: 'village', vi: 'ngôi làng', emoji: '🏘️' }, { w: 'van', vi: 'xe tải nhỏ', emoji: '🚐' }, { w: 'volleyball', vi: 'bóng chuyền', emoji: '🏐' }],
    phrases: ['can', 'you', 'draw', 'play', 'i', "can't", 'yes', 'no'], pattern: { q: 'Can you draw a van?', a: ['Yes, I can.', "No, I can't."] } },
  9: { title: 'In the grocery store', vi: 'Ở cửa hàng tạp hoá', sound: 'y',
    words: [{ w: 'yogurt', vi: 'sữa chua', emoji: '🥛' }, { w: 'yams', vi: 'khoai mỡ', emoji: '🍠' }, { w: 'yo-yos', vi: 'con quay yo-yo', emoji: '🪀' }],
    phrases: ['what', 'do', 'you', 'want', 'i', 'some', 'store', 'grocery'], pattern: { q: 'What do you want?', a: ['I want some yams.'] } },
  10: { title: 'At the zoo', vi: 'Ở vườn thú', sound: 'z',
    words: [{ w: 'zoo', vi: 'vườn thú', emoji: '🦁' }, { w: 'zebu', vi: 'con bò u', emoji: '🐃' }, { w: 'zebra', vi: 'con ngựa vằn', emoji: '🦓' }],
    phrases: ['do', 'you', 'like', 'the', 'yes', 'no', 'i', "don't"], pattern: { q: 'Do you like the zoo?', a: ['Yes, I do.', "No, I don't."] } },
  11: { title: 'In the playground', vi: 'Ở sân chơi', sound: 'ing',
    words: [{ w: 'sliding', vi: 'trượt cầu trượt', emoji: '🛝' }, { w: 'riding', vi: 'đạp xe', emoji: '🚴' }, { w: 'driving', vi: 'lái xe', emoji: '🚗' }],
    phrases: ["they're", 'they', 'cars', 'bikes', 'playground'], pattern: { a: ["They're driving cars.", "They're riding bikes."] } },
  12: { title: 'At the café', vi: 'Ở quán cà phê', sound: 'a_e',
    words: [{ w: 'grapes', vi: 'quả nho', emoji: '🍇' }, { w: 'cake', vi: 'bánh ngọt', emoji: '🎂' }, { w: 'table', vi: 'cái bàn', emoji: '🪑' }],
    phrases: ['the', 'is', 'are', 'on', 'café'], pattern: { a: ['The cake is on the table.', 'The grapes are on the table.'] } },
  13: { title: 'In the maths class', vi: 'Trong giờ học toán', sound: 'teen',
    words: [{ w: 'eleven', vi: 'số 11' }, { w: 'twelve', vi: 'số 12' }, { w: 'thirteen', vi: 'số 13' }, { w: 'fourteen', vi: 'số 14' }, { w: 'fifteen', vi: 'số 15' }],
    phrases: ['what', 'number', 'is', 'it', "it's", 'maths', 'class'], pattern: { q: 'What number is it?', a: ["It's eleven."] } },
  14: { title: 'At home', vi: 'Ở nhà', sound: 'er',
    words: [{ w: 'brother', vi: 'anh/em trai', emoji: '👦' }, { w: 'sister', vi: 'chị/em gái', emoji: '👧' }, { w: 'grandmother', vi: 'bà', emoji: '👵' }, { w: 'grandfather', vi: 'ông', emoji: '👴' }],
    phrases: ['how', 'old', 'is', 'your', "he's", "she's", 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'home'], pattern: { q: 'How old is your brother?', a: ["He's nineteen."] } },
  15: { title: 'In the clothes shop', vi: 'Ở cửa hàng quần áo', sound: 'sh',
    words: [{ w: 'shirts', vi: 'áo sơ mi', emoji: '👕' }, { w: 'shoes', vi: 'đôi giày', emoji: '👟' }, { w: 'shorts', vi: 'quần soóc', emoji: '🩳' }],
    phrases: ['where', 'are', 'the', 'over', 'there', 'clothes', 'shop'], pattern: { q: 'Where are the shoes?', a: ['Over there.'] } },
  16: { title: 'At the campsite', vi: 'Ở khu cắm trại', sound: 't',
    words: [{ w: 'tent', vi: 'cái lều', emoji: '⛺' }, { w: 'teapot', vi: 'ấm trà', emoji: '🫖' }, { w: 'blanket', vi: 'cái chăn', emoji: '🛏️' }],
    phrases: ['is', 'the', 'near', 'in', "isn't", 'no', 'yes', "it's", 'it', 'campsite'], pattern: { q: 'Is the blanket near the tent?', a: ["No, it isn't. It's in the tent."] } },
};

/** Từ đã học: toàn bộ Tiếng Anh 1 + Tiếng Anh 2 đến hết unit (cả từ trong mẫu câu) */
export function gs2Learned(unit: number): Set<string> {
  const out = gs1Learned(16);
  for (const [u, v] of Object.entries(GS2_UNITS)) {
    if (Number(u) > unit) continue;
    for (const w of v.words) for (const part of w.w.toLowerCase().split(/[\s-]+/)) { out.add(part); out.add(w.w.toLowerCase()); }
    for (const p of v.phrases) out.add(p);
  }
  return out;
}
