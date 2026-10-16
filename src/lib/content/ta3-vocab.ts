// TIẾNG ANH 3 (Global Success) — khung từ vựng và mẫu câu theo từng Unit, lấy từ phần Book map của sách
// (chỉ tên unit, từ vựng, mẫu câu — không chép hội thoại, bài hát hay bài tập của sách). Câu mẫu trong `frames`
// do EduChain Kids tự đặt theo đúng khung mẫu câu của unit.
// Dùng cho: kiểm tra "không vượt trước" (scope.ts) và bộ sinh câu Tiếng Anh lớp 3 (practice/ta3g.ts).

import { gs2Learned } from './ta2-vocab';

export type GS3Word = { w: string; vi: string; emoji?: string };
/** [câu hỏi (nếu có), câu trả lời/câu nói, nghĩa tiếng Việt, từ khoá trong câu, tranh] */
export type GS3Frame = [q: string | undefined, a: string, vi: string, key: string, emoji?: string];
export type GS3Unit = { title: string; vi: string; sound: string; words: GS3Word[]; phrases: string[]; frames: GS3Frame[] };

export const GS3_UNITS: Record<number, GS3Unit> = {
  1: { title: 'Hello', vi: 'Xin chào', sound: 'h',
    words: [{ w: 'hello', vi: 'xin chào', emoji: '👋' }, { w: 'goodbye', vi: 'tạm biệt' }, { w: 'fine', vi: 'khoẻ' }, { w: 'thank you', vi: 'cảm ơn' }, { w: 'how', vi: 'thế nào' }],
    phrases: ['hello', 'hi', "i'm", 'how', 'are', 'you', 'fine', 'thank', 'goodbye', 'bye', 'ben', 'lucy', 'mai', 'minh'],
    frames: [[undefined, "Hello. I'm Mai.", 'Xin chào. Tớ là Mai.', 'Mai'], ['How are you?', 'Fine, thank you.', 'Bạn khoẻ không? – Tớ khoẻ, cảm ơn bạn.', 'fine'], [undefined, 'Goodbye, Ben.', 'Tạm biệt Ben.', 'Goodbye']] },
  2: { title: 'Our names', vi: 'Tên của chúng mình', sound: 'n',
    words: [{ w: 'name', vi: 'tên' }, { w: 'old', vi: 'tuổi' }, { w: 'my', vi: 'của tớ' }, { w: 'your', vi: 'của bạn' }, { w: 'what', vi: 'gì, cái gì' }],
    phrases: ["what's", 'your', 'name', 'my', "name's", 'how', 'old', 'are', 'you', "i'm", 'years', 'bill', 'linh', 'mary', 'nam', 'eight', 'nine'],
    frames: [["What's your name?", "My name's Linh.", 'Bạn tên là gì? – Tớ tên là Linh.', 'name'], ['How old are you?', "I'm eight years old.", 'Bạn bao nhiêu tuổi? – Tớ tám tuổi.', 'eight'], ['How old are you?', "I'm nine years old.", 'Bạn bao nhiêu tuổi? – Tớ chín tuổi.', 'nine']] },
  3: { title: 'Our friends', vi: 'Bạn của chúng mình', sound: 'th',
    words: [{ w: 'friend', vi: 'bạn' }, { w: 'teacher', vi: 'giáo viên', emoji: '🧑‍🏫' }, { w: 'this', vi: 'đây' }, { w: 'that', vi: 'đó, kia' }, { w: 'yes', vi: 'vâng, có' }, { w: 'no', vi: 'không' }],
    phrases: ['this', 'is', 'that', "that's", 'it', "it's", 'isn\'t', 'yes', 'no', 'friend', 'teacher', 'mr', 'ms', 'long', 'hoa', 'my'],
    frames: [[undefined, 'This is my friend Nam.', 'Đây là bạn tớ, Nam.', 'friend'], ['Is that Ms Hoa?', 'Yes, it is.', 'Kia có phải cô Hoa không? – Đúng vậy.', 'Hoa'], ['Is this Mr Long?', "No, it isn't.", 'Đây có phải thầy Long không? – Không phải.', 'Long']] },
  4: { title: 'Our bodies', vi: 'Cơ thể chúng mình', sound: 'ea',
    words: [{ w: 'ear', vi: 'tai', emoji: '👂' }, { w: 'eye', vi: 'mắt', emoji: '👁️' }, { w: 'face', vi: 'khuôn mặt', emoji: '🙂' }, { w: 'hair', vi: 'tóc', emoji: '💇' }, { w: 'hand', vi: 'bàn tay', emoji: '✋' }, { w: 'mouth', vi: 'miệng', emoji: '👄' }, { w: 'nose', vi: 'mũi', emoji: '👃' }],
    phrases: ["what's", 'this', "it's", 'a', 'an', 'touch', 'open', 'your', 'ears', 'eyes', 'hands'],
    frames: [["What's this?", "It's a nose.", 'Đây là cái gì? – Đó là cái mũi.', 'nose', '👃'], [undefined, 'Touch your hair!', 'Hãy chạm vào tóc của bạn!', 'hair', '💇'], [undefined, 'Open your mouth!', 'Hãy mở miệng ra!', 'mouth', '👄'], ["What's this?", "It's an ear.", 'Đây là cái gì? – Đó là cái tai.', 'ear', '👂']] },
  5: { title: 'My hobbies', vi: 'Sở thích của tớ', sound: 'ing',
    words: [{ w: 'cooking', vi: 'nấu ăn', emoji: '🍳' }, { w: 'dancing', vi: 'nhảy múa', emoji: '💃' }, { w: 'drawing', vi: 'vẽ', emoji: '✏️' }, { w: 'painting', vi: 'tô màu, vẽ tranh', emoji: '🎨' }, { w: 'running', vi: 'chạy', emoji: '🏃' }, { w: 'singing', vi: 'hát', emoji: '🎤' }, { w: 'swimming', vi: 'bơi', emoji: '🏊' }, { w: 'walking', vi: 'đi bộ', emoji: '🚶' }],
    phrases: ["what's", 'your', 'hobby', "it's", 'i', 'like'],
    frames: [["What's your hobby?", "It's singing.", 'Sở thích của bạn là gì? – Đó là ca hát.', 'singing', '🎤'], [undefined, 'I like swimming.', 'Tớ thích bơi.', 'swimming', '🏊'], ["What's your hobby?", "It's cooking.", 'Sở thích của bạn là gì? – Đó là nấu ăn.', 'cooking', '🍳'], [undefined, 'I like dancing.', 'Tớ thích nhảy múa.', 'dancing', '💃']] },
  6: { title: 'Our school', vi: 'Trường của chúng mình', sound: 'oo',
    words: [{ w: 'art room', vi: 'phòng mĩ thuật', emoji: '🎨' }, { w: 'classroom', vi: 'lớp học', emoji: '🏫' }, { w: 'computer room', vi: 'phòng máy tính', emoji: '💻' }, { w: 'gym', vi: 'phòng thể dục', emoji: '🤸' }, { w: 'library', vi: 'thư viện', emoji: '📚' }, { w: 'music room', vi: 'phòng âm nhạc', emoji: '🎵' }, { w: 'playground', vi: 'sân chơi', emoji: '🛝' }, { w: 'school', vi: 'trường học' }],
    phrases: ['is', 'this', 'our', 'yes', 'it', 'no', "isn't", "let's", 'go', 'to', 'the', 'ok'],
    frames: [['Is this our library?', 'Yes, it is.', 'Đây có phải thư viện của chúng mình không? – Đúng vậy.', 'library', '📚'], [undefined, "Let's go to the gym.", 'Chúng mình cùng đến phòng thể dục nhé.', 'gym', '🤸'], ['Is this our classroom?', "No, it isn't.", 'Đây có phải lớp học của chúng mình không? – Không phải.', 'classroom', '🏫'], [undefined, "Let's go to the playground.", 'Chúng mình cùng ra sân chơi nhé.', 'playground', '🛝']] },
  7: { title: 'Classroom instructions', vi: 'Lời yêu cầu trong lớp', sound: 'st',
    words: [{ w: 'close', vi: 'đóng', emoji: '📕' }, { w: 'come in', vi: 'đi vào', emoji: '🚪' }, { w: 'go out', vi: 'đi ra ngoài' }, { w: 'open', vi: 'mở', emoji: '📖' }, { w: 'sit down', vi: 'ngồi xuống', emoji: '🪑' }, { w: 'stand up', vi: 'đứng lên', emoji: '🧍' }, { w: 'speak', vi: 'nói', emoji: '🗣️' }],
    phrases: ['please', 'may', 'i', 'yes', 'you', 'can', "can't", 'no', 'your', 'book', 'english'],
    frames: [[undefined, 'Stand up, please!', 'Hãy đứng lên!', 'Stand', '🧍'], ['May I go out?', 'Yes, you can.', 'Em có thể ra ngoài không ạ? – Được, em có thể ra.', 'out'], ['May I come in?', "No, you can't.", 'Em có thể vào không ạ? – Không, em không thể vào.', 'in'], [undefined, 'Sit down, please!', 'Hãy ngồi xuống!', 'Sit', '🪑']] },
  8: { title: 'My school things', vi: 'Đồ dùng học tập của tớ', sound: 'er',
    words: [{ w: 'book', vi: 'quyển sách', emoji: '📘' }, { w: 'eraser', vi: 'cục tẩy', emoji: '🧽' }, { w: 'notebook', vi: 'quyển vở', emoji: '📓' }, { w: 'pen', vi: 'bút mực', emoji: '🖊️' }, { w: 'pencil', vi: 'bút chì', emoji: '✏️' }, { w: 'pencil case', vi: 'hộp bút' }, { w: 'ruler', vi: 'thước kẻ', emoji: '📏' }, { w: 'school bag', vi: 'cặp sách', emoji: '🎒' }],
    phrases: ['i', 'have', 'a', 'an', 'do', 'you', 'yes', 'no', "don't"],
    frames: [[undefined, 'I have a ruler.', 'Tớ có một cái thước kẻ.', 'ruler', '📏'], ['Do you have a pen?', 'Yes, I do.', 'Bạn có bút mực không? – Có.', 'pen', '🖊️'], ['Do you have an eraser?', "No, I don't.", 'Bạn có cục tẩy không? – Không.', 'eraser', '🧽'], [undefined, 'I have a notebook.', 'Tớ có một quyển vở.', 'notebook', '📓']] },
  9: { title: 'Colours', vi: 'Màu sắc', sound: 'bl',
    words: [{ w: 'black', vi: 'màu đen', emoji: '⚫' }, { w: 'blue', vi: 'màu xanh dương', emoji: '🔵' }, { w: 'brown', vi: 'màu nâu', emoji: '🟤' }, { w: 'green', vi: 'màu xanh lá', emoji: '🟢' }, { w: 'orange', vi: 'màu cam', emoji: '🟠' }, { w: 'red', vi: 'màu đỏ', emoji: '🔴' }, { w: 'white', vi: 'màu trắng', emoji: '⚪' }, { w: 'yellow', vi: 'màu vàng', emoji: '🟡' }],
    phrases: ['what', 'colour', 'is', 'it', "it's", 'are', 'they', "they're"],
    frames: [['What colour is it?', "It's red.", 'Nó màu gì? – Nó màu đỏ.', 'red', '🔴'], ['What colour are they?', "They're blue.", 'Chúng màu gì? – Chúng màu xanh dương.', 'blue', '🔵'], ['What colour is it?', "It's yellow.", 'Nó màu gì? – Nó màu vàng.', 'yellow', '🟡'], ['What colour are they?', "They're green.", 'Chúng màu gì? – Chúng màu xanh lá.', 'green', '🟢']] },
  10: { title: 'Break time activities', vi: 'Hoạt động giờ ra chơi', sound: 'ball',
    words: [{ w: 'chat', vi: 'trò chuyện', emoji: '💬' }, { w: 'football', vi: 'bóng đá', emoji: '⚽' }, { w: 'volleyball', vi: 'bóng chuyền', emoji: '🏐' }, { w: 'badminton', vi: 'cầu lông', emoji: '🏸' }, { w: 'basketball', vi: 'bóng rổ', emoji: '🏀' }, { w: 'chess', vi: 'cờ vua', emoji: '♟️' }, { w: 'table tennis', vi: 'bóng bàn', emoji: '🏓' }, { w: 'word puzzles', vi: 'trò chơi ô chữ', emoji: '🧩' }],
    phrases: ['i', 'play', 'at', 'break', 'time', 'what', 'do', 'you'],
    frames: [[undefined, 'I play football at break time.', 'Tớ chơi bóng đá vào giờ ra chơi.', 'football', '⚽'], ['What do you do at break time?', 'I play chess.', 'Bạn làm gì vào giờ ra chơi? – Tớ chơi cờ vua.', 'chess', '♟️'], ['What do you do at break time?', 'I play badminton.', 'Bạn làm gì vào giờ ra chơi? – Tớ chơi cầu lông.', 'badminton', '🏸'], [undefined, 'I play basketball at break time.', 'Tớ chơi bóng rổ vào giờ ra chơi.', 'basketball', '🏀']] },
  11: { title: 'My family', vi: 'Gia đình tớ', sound: 'th',
    words: [{ w: 'brother', vi: 'anh/em trai', emoji: '👦' }, { w: 'father', vi: 'bố', emoji: '👨' }, { w: 'mother', vi: 'mẹ', emoji: '👩' }, { w: 'sister', vi: 'chị/em gái', emoji: '👧' }],
    phrases: ["who's", 'this', 'that', "it's", 'my', 'how', 'old', 'is', 'he', 'she', "he's", "she's", 'sure', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
    frames: [["Who's this?", "It's my father.", 'Đây là ai? – Đó là bố tớ.', 'father', '👨'], ["Who's that?", "It's my sister.", 'Kia là ai? – Đó là chị gái tớ.', 'sister', '👧'], ['How old is he?', "He's twelve.", 'Anh ấy bao nhiêu tuổi? – Anh ấy mười hai tuổi.', 'twelve'], ['How old is she?', "She's fifteen.", 'Chị ấy bao nhiêu tuổi? – Chị ấy mười lăm tuổi.', 'fifteen']] },
  12: { title: 'Jobs', vi: 'Nghề nghiệp', sound: 'er',
    words: [{ w: 'cook', vi: 'đầu bếp', emoji: '🧑‍🍳' }, { w: 'doctor', vi: 'bác sĩ', emoji: '🩺' }, { w: 'driver', vi: 'tài xế', emoji: '🚕' }, { w: 'farmer', vi: 'nông dân', emoji: '🧑‍🌾' }, { w: 'nurse', vi: 'y tá' }, { w: 'singer', vi: 'ca sĩ', emoji: '🎤' }, { w: 'teacher', vi: 'giáo viên', emoji: '🧑‍🏫' }, { w: 'worker', vi: 'công nhân', emoji: '👷' }, { w: 'job', vi: 'nghề nghiệp' }],
    phrases: ["what's", 'his', 'her', 'job', "he's", "she's", 'a', 'is', 'he', 'she', 'yes', 'no', "isn't"],
    frames: [["What's his job?", "He's a doctor.", 'Nghề của anh ấy là gì? – Anh ấy là bác sĩ.', 'doctor', '🩺'], ['Is she a nurse?', 'Yes, she is.', 'Cô ấy có phải y tá không? – Đúng vậy.', 'nurse'], ["What's her job?", "She's a singer.", 'Nghề của cô ấy là gì? – Cô ấy là ca sĩ.', 'singer', '🎤'], ['Is he a farmer?', "No, he isn't.", 'Ông ấy có phải nông dân không? – Không phải.', 'farmer', '🧑‍🌾']] },
  13: { title: 'My house', vi: 'Ngôi nhà của tớ', sound: 'ou',
    words: [{ w: 'bathroom', vi: 'phòng tắm', emoji: '🛁' }, { w: 'bedroom', vi: 'phòng ngủ', emoji: '🛏️' }, { w: 'chair', vi: 'cái ghế', emoji: '🪑' }, { w: 'house', vi: 'ngôi nhà', emoji: '🏠' }, { w: 'kitchen', vi: 'nhà bếp', emoji: '🍳' }, { w: 'lamp', vi: 'cái đèn', emoji: '💡' }, { w: 'living room', vi: 'phòng khách', emoji: '🛋️' }, { w: 'table', vi: 'cái bàn' }],
    phrases: ["where's", 'where', 'the', 'are', "it's", 'here', 'there', "they're", 'in', 'on', 'chairs', 'lamps'],
    frames: [["Where's the lamp?", "It's here.", 'Cái đèn ở đâu? – Nó ở đây.', 'lamp', '💡'], ['Where are the chairs?', "They're in the kitchen.", 'Những cái ghế ở đâu? – Chúng ở trong bếp.', 'kitchen', '🍳'], ["Where's the table?", "It's there.", 'Cái bàn ở đâu? – Nó ở đằng kia.', 'table'], ['Where are the lamps?', "They're in the living room.", 'Những cái đèn ở đâu? – Chúng ở phòng khách.', 'living room', '🛋️']] },
  14: { title: 'My bedroom', vi: 'Phòng ngủ của tớ', sound: 'oo',
    words: [{ w: 'bed', vi: 'cái giường', emoji: '🛏️' }, { w: 'big', vi: 'to' }, { w: 'desk', vi: 'bàn học' }, { w: 'door', vi: 'cửa ra vào', emoji: '🚪' }, { w: 'new', vi: 'mới' }, { w: 'old', vi: 'cũ' }, { w: 'room', vi: 'căn phòng' }, { w: 'small', vi: 'nhỏ' }, { w: 'window', vi: 'cửa sổ', emoji: '🪟' }],
    phrases: ["there's", 'there', 'are', 'a', 'two', 'in', 'the', 'is', 'windows', 'doors'],
    frames: [[undefined, "There's a bed in the room.", 'Có một cái giường trong phòng.', 'bed', '🛏️'], [undefined, 'There are two windows in the room.', 'Có hai cửa sổ trong phòng.', 'windows', '🪟'], [undefined, 'The door is big.', 'Cái cửa thì to.', 'big', '🚪'], [undefined, 'The desk is new.', 'Cái bàn học thì mới.', 'new']] },
  15: { title: 'At the dining table', vi: 'Bên bàn ăn', sound: 'ea',
    words: [{ w: 'bean', vi: 'hạt đậu', emoji: '🫘' }, { w: 'bread', vi: 'bánh mì', emoji: '🍞' }, { w: 'chicken', vi: 'thịt gà', emoji: '🍗' }, { w: 'egg', vi: 'quả trứng', emoji: '🥚' }, { w: 'fish', vi: 'cá', emoji: '🐟' }, { w: 'juice', vi: 'nước ép', emoji: '🧃' }, { w: 'meat', vi: 'thịt', emoji: '🥩' }, { w: 'milk', vi: 'sữa', emoji: '🥛' }, { w: 'rice', vi: 'cơm', emoji: '🍚' }, { w: 'water', vi: 'nước', emoji: '💧' }],
    phrases: ['would', 'you', 'like', 'some', 'yes', 'please', 'no', 'thanks', 'what', 'to', 'eat', 'drink', "i'd", 'beans'],
    frames: [['Would you like some milk?', 'Yes, please.', 'Bạn có muốn uống sữa không? – Có, cảm ơn.', 'milk', '🥛'], ['Would you like some fish?', 'No, thanks.', 'Bạn có muốn ăn cá không? – Không, cảm ơn.', 'fish', '🐟'], ['What would you like to eat?', "I'd like some rice, please.", 'Bạn muốn ăn gì? – Cho tớ ít cơm nhé.', 'rice', '🍚'], ['What would you like to drink?', "I'd like some juice, please.", 'Bạn muốn uống gì? – Cho tớ ít nước ép nhé.', 'juice', '🧃']] },
  16: { title: 'My pets', vi: 'Thú cưng của tớ', sound: 'og',
    words: [{ w: 'bird', vi: 'con chim', emoji: '🐦' }, { w: 'cat', vi: 'con mèo', emoji: '🐱' }, { w: 'dog', vi: 'con chó', emoji: '🐶' }, { w: 'goldfish', vi: 'cá vàng', emoji: '🐠' }, { w: 'parrot', vi: 'con vẹt', emoji: '🦜' }, { w: 'rabbit', vi: 'con thỏ', emoji: '🐰' }],
    phrases: ['do', 'you', 'have', 'any', 'yes', 'i', 'no', "don't", 'how', 'many', 'some', 'two', 'three', 'dogs', 'cats', 'birds', 'rabbits', 'parrots'],
    frames: [['Do you have any dogs?', 'Yes, I do.', 'Bạn có con chó nào không? – Có.', 'dogs', '🐶'], ['Do you have any rabbits?', "No, I don't.", 'Bạn có con thỏ nào không? – Không.', 'rabbits', '🐰'], ['How many cats do you have?', 'I have two cats.', 'Bạn có bao nhiêu con mèo? – Tớ có hai con mèo.', 'cats', '🐱'], ['How many birds do you have?', 'I have three birds.', 'Bạn có bao nhiêu con chim? – Tớ có ba con chim.', 'birds', '🐦']] },
  17: { title: 'Our toys', vi: 'Đồ chơi của chúng mình', sound: 'oy',
    words: [{ w: 'bus', vi: 'xe buýt', emoji: '🚌' }, { w: 'car', vi: 'ô tô', emoji: '🚗' }, { w: 'kite', vi: 'con diều', emoji: '🪁' }, { w: 'plane', vi: 'máy bay', emoji: '✈️' }, { w: 'ship', vi: 'con tàu thuỷ', emoji: '🚢' }, { w: 'teddy bear', vi: 'gấu bông', emoji: '🧸' }, { w: 'toy', vi: 'đồ chơi' }, { w: 'train', vi: 'tàu hoả', emoji: '🚆' }, { w: 'truck', vi: 'xe tải', emoji: '🚚' }],
    phrases: ['he', 'she', 'has', 'a', 'they', 'have', 'two', 'three', 'planes', 'cars', 'ships', 'trucks'],
    frames: [[undefined, 'She has a kite.', 'Bạn ấy có một con diều.', 'kite', '🪁'], [undefined, 'He has a teddy bear.', 'Bạn ấy có một con gấu bông.', 'teddy bear', '🧸'], [undefined, 'They have two planes.', 'Các bạn ấy có hai chiếc máy bay.', 'planes', '✈️'], [undefined, 'They have three cars.', 'Các bạn ấy có ba chiếc ô tô.', 'cars', '🚗']] },
  18: { title: 'Playing and doing', vi: 'Vui chơi và làm việc', sound: 'ing',
    words: [{ w: 'dancing', vi: 'nhảy múa', emoji: '💃' }, { w: 'drawing a picture', vi: 'vẽ tranh', emoji: '🖍️' }, { w: 'listening to music', vi: 'nghe nhạc', emoji: '🎧' }, { w: 'singing', vi: 'hát', emoji: '🎤' }, { w: 'playing basketball', vi: 'chơi bóng rổ', emoji: '🏀' }, { w: 'reading', vi: 'đọc', emoji: '📖' }, { w: 'watching TV', vi: 'xem ti vi', emoji: '📺' }, { w: 'writing', vi: 'viết', emoji: '✍️' }],
    phrases: ["i'm", 'what', 'are', 'you', 'doing', 'a', 'picture', 'to', 'music', 'tv', 'playing'],
    frames: [['What are you doing?', "I'm reading.", 'Bạn đang làm gì? – Tớ đang đọc sách.', 'reading', '📖'], ['What are you doing?', "I'm listening to music.", 'Bạn đang làm gì? – Tớ đang nghe nhạc.', 'listening', '🎧'], [undefined, "I'm watching TV.", 'Tớ đang xem ti vi.', 'watching', '📺'], ['What are you doing?', "I'm writing.", 'Bạn đang làm gì? – Tớ đang viết.', 'writing', '✍️']] },
  19: { title: 'Outdoor activities', vi: 'Hoạt động ngoài trời', sound: 'sk',
    words: [{ w: 'cycling', vi: 'đạp xe', emoji: '🚴' }, { w: 'flying a kite', vi: 'thả diều', emoji: '🪁' }, { w: 'painting', vi: 'vẽ tranh', emoji: '🎨' }, { w: 'playing badminton', vi: 'chơi cầu lông', emoji: '🏸' }, { w: 'running', vi: 'chạy', emoji: '🏃' }, { w: 'skating', vi: 'trượt pa-tanh', emoji: '⛸️' }, { w: 'skipping', vi: 'nhảy dây' }, { w: 'walking', vi: 'đi bộ', emoji: '🚶' }],
    phrases: ["he's", "she's", "what's", 'he', 'she', 'doing', 'flying', 'a', 'kite', 'playing'],
    frames: [["What's she doing?", "She's skating.", 'Bạn ấy đang làm gì? – Bạn ấy đang trượt pa-tanh.', 'skating', '⛸️'], ["What's he doing?", "He's cycling.", 'Bạn ấy đang làm gì? – Bạn ấy đang đạp xe.', 'cycling', '🚴'], [undefined, "She's flying a kite.", 'Bạn ấy đang thả diều.', 'kite', '🪁'], [undefined, "He's running.", 'Bạn ấy đang chạy.', 'running', '🏃']] },
  20: { title: 'At the zoo', vi: 'Ở vườn thú', sound: 'ey',
    words: [{ w: 'elephant', vi: 'con voi', emoji: '🐘' }, { w: 'horse', vi: 'con ngựa', emoji: '🐎' }, { w: 'monkey', vi: 'con khỉ', emoji: '🐒' }, { w: 'peacock', vi: 'con công', emoji: '🦚' }, { w: 'tiger', vi: 'con hổ', emoji: '🐅' }, { w: 'climbing', vi: 'leo trèo' }, { w: 'counting', vi: 'đếm' }, { w: 'swinging', vi: 'đu đưa' }],
    phrases: ['what', 'can', 'you', 'see', 'i', 'a', 'an', "what's", 'the', 'doing', "it's", 'zoo'],
    frames: [['What can you see?', 'I can see a tiger.', 'Bạn nhìn thấy gì? – Tớ nhìn thấy một con hổ.', 'tiger', '🐅'], ["What's the monkey doing?", "It's swinging.", 'Con khỉ đang làm gì? – Nó đang đu đưa.', 'swinging', '🐒'], ['What can you see?', 'I can see an elephant.', 'Bạn nhìn thấy gì? – Tớ nhìn thấy một con voi.', 'elephant', '🐘'], ["What's the peacock doing?", "It's dancing.", 'Con công đang làm gì? – Nó đang múa.', 'dancing', '🦚']] },
};

/** Từ đã học: Tiếng Anh 1, 2 + Tiếng Anh 3 đến hết unit (cả từ trong mẫu câu) */
export function gs3Learned(unit: number): Set<string> {
  const out = gs2Learned(16);
  for (const [u, v] of Object.entries(GS3_UNITS)) {
    if (Number(u) > unit) continue;
    for (const w of v.words) {
      out.add(w.w.toLowerCase());
      for (const part of w.w.toLowerCase().split(/[\s-]+/)) out.add(part);
    }
    for (const p of v.phrases) out.add(p);
    for (const [q, a] of v.frames) for (const t of `${q ?? ''} ${a}`.toLowerCase().split(/[^a-z']+/)) if (t) out.add(t);
  }
  return out;
}

/** Các tiếng Việt không dấu xuất hiện trong phần nghĩa (vd. "con chim", "xem ti vi") — không coi là từ tiếng Anh khi kiểm phạm vi */
export const VI_TOKENS3: Set<string> = new Set(
  Object.values(GS3_UNITS).flatMap((v) => [...v.words.map((w) => w.vi), ...v.frames.map((f) => f[2])])
    .flatMap((t) => t.toLowerCase().split(/[^a-zà-ỹ]+/))
    .filter((t) => /^[a-z]+$/.test(t)),
);
