// TIẾNG ANH 4 (Global Success) — khung từ vựng và mẫu câu theo từng Unit, lấy từ phần Book map của sách
// (chỉ tên unit, từ vựng, mẫu câu — không chép hội thoại, bài hát hay bài tập của sách). Câu mẫu trong `frames`
// do EduChain Kids tự đặt theo đúng khung mẫu câu của unit.
// Dùng cho: kiểm tra "không vượt trước" (scope.ts) và bộ sinh câu Tiếng Anh lớp 4 (practice/ta4g.ts).

import { gs3Learned, type GS3Unit } from './ta3-vocab';

export type GS4Unit = GS3Unit;

export const GS4_UNITS: Record<number, GS4Unit> = {
  1: { title: 'My friends', vi: 'Bạn bè của tớ', sound: 'ia',
    words: [{ w: 'America', vi: 'nước Mỹ' }, { w: 'Australia', vi: 'nước Úc' }, { w: 'Britain', vi: 'nước Anh' }, { w: 'Japan', vi: 'Nhật Bản' }, { w: 'Malaysia', vi: 'Ma-lai-xi-a' }, { w: 'Singapore', vi: 'Xin-ga-po' }, { w: 'Thailand', vi: 'Thái Lan' }, { w: 'Viet Nam', vi: 'Việt Nam' }],
    phrases: ['where', 'are', 'you', 'from', "i'm", 'is', 'he', 'she', "he's", "she's", 'my', 'friend', 'tom', 'mary', 'akio', 'linh'],
    frames: [['Where are you from?', "I'm from Japan.", 'Bạn đến từ đâu? – Tớ đến từ Nhật Bản.', 'Japan'], ['Where is she from?', "She's from Australia.", 'Bạn ấy đến từ đâu? – Bạn ấy đến từ nước Úc.', 'Australia'], ['Where is he from?', "He's from Thailand.", 'Bạn ấy đến từ đâu? – Bạn ấy đến từ Thái Lan.', 'Thailand'], [undefined, "I'm from Viet Nam.", 'Tớ đến từ Việt Nam.', 'Nam']] },
  2: { title: 'Time and daily routines', vi: 'Thời gian và việc hằng ngày', sound: 'ha',
    words: [{ w: 'get up', vi: 'thức dậy', emoji: '⏰' }, { w: 'have breakfast', vi: 'ăn sáng', emoji: '🥞' }, { w: 'go to school', vi: 'đi học' }, { w: 'have lunch', vi: 'ăn trưa', emoji: '🍱' }, { w: 'go home', vi: 'về nhà', emoji: '🏠' }, { w: 'have dinner', vi: 'ăn tối', emoji: '🍽️' }, { w: 'go to bed', vi: 'đi ngủ', emoji: '🛌' }, { w: "o'clock", vi: 'giờ đúng', emoji: '🕖' }],
    phrases: ['what', 'time', 'is', 'it', "it's", 'do', 'you', 'i', 'at', 'six', 'seven', 'eight', 'nine', 'ten'],
    frames: [['What time is it?', "It's seven o'clock.", 'Mấy giờ rồi? – Bảy giờ đúng.', 'seven', '🕖'], ['What time do you get up?', "I get up at six o'clock.", 'Bạn thức dậy lúc mấy giờ? – Tớ thức dậy lúc sáu giờ.', 'six'], ['What time do you go to bed?', "I go to bed at nine o'clock.", 'Bạn đi ngủ lúc mấy giờ? – Tớ đi ngủ lúc chín giờ.', 'nine', '🛌'], [undefined, "I have lunch at eleven o'clock.", 'Tớ ăn trưa lúc mười một giờ.', 'lunch', '🍱']] },
  3: { title: 'My week', vi: 'Tuần của tớ', sound: 'day',
    words: [{ w: 'Monday', vi: 'thứ Hai' }, { w: 'Tuesday', vi: 'thứ Ba' }, { w: 'Wednesday', vi: 'thứ Tư' }, { w: 'Thursday', vi: 'thứ Năm' }, { w: 'Friday', vi: 'thứ Sáu' }, { w: 'Saturday', vi: 'thứ Bảy' }, { w: 'Sunday', vi: 'Chủ nhật' }, { w: 'today', vi: 'hôm nay' }],
    phrases: ['what', 'day', 'is', 'it', "it's", 'do', 'you', 'on', 'i', 'study', 'english', 'watch', 'tv', 'help', 'my', 'parents'],
    frames: [['What day is it today?', "It's Monday.", 'Hôm nay là thứ mấy? – Hôm nay là thứ Hai.', 'Monday'], ['What do you do on Saturdays?', 'I help my parents.', 'Bạn làm gì vào các ngày thứ Bảy? – Tớ giúp đỡ bố mẹ.', 'parents'], ['What do you do on Sundays?', 'I watch TV.', 'Bạn làm gì vào các ngày Chủ nhật? – Tớ xem ti vi.', 'TV', '📺'], [undefined, 'I study English on Fridays.', 'Tớ học Tiếng Anh vào các ngày thứ Sáu.', 'Fridays']] },
  4: { title: 'My birthday party', vi: 'Tiệc sinh nhật của tớ', sound: 'ar',
    words: [{ w: 'January', vi: 'tháng Một' }, { w: 'February', vi: 'tháng Hai' }, { w: 'March', vi: 'tháng Ba' }, { w: 'April', vi: 'tháng Tư' }, { w: 'birthday', vi: 'sinh nhật', emoji: '🎂' }, { w: 'party', vi: 'bữa tiệc', emoji: '🎉' }, { w: 'grapes', vi: 'quả nho', emoji: '🍇' }, { w: 'chips', vi: 'khoai tây chiên', emoji: '🍟' }, { w: 'lemonade', vi: 'nước chanh', emoji: '🍋' }],
    phrases: ["when's", 'your', "it's", 'in', 'the', 'of', 'what', 'would', 'you', 'like', 'to', 'eat', 'drink', "i'd", 'some', 'happy'],
    frames: [["When's your birthday?", "It's in March.", 'Sinh nhật bạn vào khi nào? – Vào tháng Ba.', 'March'], ['What would you like to eat?', "I'd like some grapes.", 'Bạn muốn ăn gì? – Tớ muốn ăn nho.', 'grapes', '🍇'], ['What would you like to drink?', "I'd like some lemonade.", 'Bạn muốn uống gì? – Tớ muốn uống nước chanh.', 'lemonade', '🍋'], [undefined, 'Happy birthday!', 'Chúc mừng sinh nhật!', 'birthday', '🎂']] },
  5: { title: 'Things we can do', vi: 'Những việc chúng mình có thể làm', sound: 'pl',
    words: [{ w: 'cook', vi: 'nấu ăn' }, { w: 'ride a bike', vi: 'đi xe đạp', emoji: '🚲' }, { w: 'roller skate', vi: 'trượt pa-tanh' }, { w: 'play the guitar', vi: 'chơi đàn ghi-ta', emoji: '🎸' }, { w: 'play the piano', vi: 'chơi đàn pi-a-nô', emoji: '🎹' }, { w: 'swim', vi: 'bơi' }, { w: 'sing', vi: 'hát' }, { w: 'draw', vi: 'vẽ' }],
    phrases: ['can', 'you', 'yes', 'i', 'no', "can't", 'what', 'he', 'she', 'well'],
    frames: [['Can you play the guitar?', 'Yes, I can.', 'Bạn có biết chơi đàn ghi-ta không? – Có, tớ biết.', 'guitar', '🎸'], ['Can you ride a bike?', "No, I can't.", 'Bạn có biết đi xe đạp không? – Không, tớ không biết.', 'bike', '🚲'], ['What can you do?', 'I can swim.', 'Bạn có thể làm gì? – Tớ biết bơi.', 'swim'], [undefined, 'She can play the piano.', 'Bạn ấy biết chơi đàn pi-a-nô.', 'piano', '🎹']] },
  6: { title: 'Our school facilities', vi: 'Cơ sở vật chất trường chúng mình', sound: 'ge',
    words: [{ w: 'city', vi: 'thành phố', emoji: '🏙️' }, { w: 'village', vi: 'làng', emoji: '🏘️' }, { w: 'building', vi: 'toà nhà', emoji: '🏢' }, { w: 'garden', vi: 'khu vườn', emoji: '🌷' }, { w: 'mountain', vi: 'núi', emoji: '⛰️' }, { w: 'town', vi: 'thị trấn' }, { w: 'big', vi: 'to, lớn' }, { w: 'small', vi: 'nhỏ' }],
    phrases: ['where', 'is', 'your', 'school', "it's", 'in', 'the', 'my', 'there', 'a', 'at', 'yes', 'it', 'no', "isn't"],
    frames: [['Where is your school?', "It's in the village.", 'Trường bạn ở đâu? – Ở trong làng.', 'village', '🏘️'], ['Is your school in the city?', 'Yes, it is.', 'Trường bạn ở thành phố phải không? – Đúng vậy.', 'city', '🏙️'], [undefined, 'My school is big.', 'Trường tớ to.', 'big'], [undefined, 'There is a garden at my school.', 'Ở trường tớ có một khu vườn.', 'garden', '🌷']] },
  7: { title: 'Our timetables', vi: 'Thời khoá biểu của chúng mình', sound: 'en',
    words: [{ w: 'Art', vi: 'Mĩ thuật' }, { w: 'English', vi: 'Tiếng Anh' }, { w: 'Maths', vi: 'Toán', emoji: '➗' }, { w: 'Music', vi: 'Âm nhạc' }, { w: 'Science', vi: 'Khoa học', emoji: '🔬' }, { w: 'Vietnamese', vi: 'Tiếng Việt' }, { w: 'subject', vi: 'môn học' }, { w: 'timetable', vi: 'thời khoá biểu', emoji: '🗓️' }],
    phrases: ['what', 'subjects', 'do', 'you', 'have', 'today', 'i', 'and', 'when', 'it', 'on'],
    frames: [['What subjects do you have today?', 'I have Maths and English.', 'Hôm nay bạn có những môn gì? – Tớ có Toán và Tiếng Anh.', 'Maths'], ['When do you have Music?', 'I have it on Mondays.', 'Bạn học Âm nhạc vào khi nào? – Tớ học vào các ngày thứ Hai.', 'Mondays'], [undefined, 'I have Science on Fridays.', 'Tớ học Khoa học vào các ngày thứ Sáu.', 'Science', '🔬'], ['When do you have Art?', 'I have it on Wednesdays.', 'Bạn học Mĩ thuật vào khi nào? – Tớ học vào các ngày thứ Tư.', 'Wednesdays']] },
  8: { title: 'My favourite subjects', vi: 'Môn học yêu thích của tớ', sound: 'in',
    words: [{ w: 'IT', vi: 'Tin học' }, { w: 'PE', vi: 'Giáo dục thể chất' }, { w: 'favourite', vi: 'yêu thích', emoji: '⭐' }, { w: 'fun', vi: 'vui' }, { w: 'interesting', vi: 'thú vị' }, { w: 'easy', vi: 'dễ' }, { w: 'because', vi: 'bởi vì' }],
    phrases: ["what's", 'your', "it's", 'why', 'do', 'you', 'like', 'it', 'is', 'i', 'want', 'to', 'be', 'a'],
    frames: [["What's your favourite subject?", "It's IT.", 'Môn học yêu thích của bạn là gì? – Là Tin học.', 'IT'], ['Why do you like PE?', "Because it's fun.", 'Vì sao bạn thích Giáo dục thể chất? – Vì nó vui.', 'fun'], ['Why do you like Maths?', "Because it's interesting.", 'Vì sao bạn thích Toán? – Vì nó thú vị.', 'interesting'], ["What's your favourite subject?", "It's Science.", 'Môn học yêu thích của bạn là gì? – Là Khoa học.', 'Science', '🔬']] },
  9: { title: 'Our sports day', vi: 'Ngày hội thể thao của chúng mình', sound: 'ber',
    words: [{ w: 'May', vi: 'tháng Năm' }, { w: 'June', vi: 'tháng Sáu' }, { w: 'July', vi: 'tháng Bảy' }, { w: 'August', vi: 'tháng Tám' }, { w: 'September', vi: 'tháng Chín' }, { w: 'October', vi: 'tháng Mười' }, { w: 'November', vi: 'tháng Mười Một' }, { w: 'December', vi: 'tháng Mười Hai' }, { w: 'sports day', vi: 'ngày hội thể thao', emoji: '🏅' }],
    phrases: ['when', 'is', 'sports', 'day', "it's", 'in', 'what', 'are', 'you', 'going', 'to', 'do', "i'm", 'play', 'run', 'the', 'race'],
    frames: [['When is your sports day?', "It's in June.", 'Ngày hội thể thao của bạn vào khi nào? – Vào tháng Sáu.', 'June'], ['When is your sports day?', "It's in October.", 'Ngày hội thể thao của bạn vào khi nào? – Vào tháng Mười.', 'October'], ['What are you going to do on sports day?', "I'm going to play basketball.", 'Bạn sẽ làm gì vào ngày hội thể thao? – Tớ sẽ chơi bóng rổ.', 'basketball', '🏀'], [undefined, "I'm going to run the race.", 'Tớ sẽ chạy thi.', 'race', '🏃']] },
  10: { title: 'Our summer holidays', vi: 'Kì nghỉ hè của chúng mình', sound: 'ea',
    words: [{ w: 'beach', vi: 'bãi biển', emoji: '🏖️' }, { w: 'campsite', vi: 'khu cắm trại', emoji: '🏕️' }, { w: 'countryside', vi: 'vùng nông thôn', emoji: '🌾' }, { w: 'sea', vi: 'biển', emoji: '🌊' }, { w: 'summer', vi: 'mùa hè' }, { w: 'holiday', vi: 'kì nghỉ' }, { w: 'last', vi: 'vừa qua, trước' }],
    phrases: ['where', 'were', 'you', 'i', 'was', 'at', 'the', 'in', 'what', 'did', 'do', 'there', 'swam', 'played', 'visited', 'my', 'grandparents'],
    frames: [['Where were you last summer?', 'I was at the beach.', 'Hè năm ngoái bạn ở đâu? – Tớ ở bãi biển.', 'beach', '🏖️'], ['What did you do there?', 'I swam in the sea.', 'Bạn đã làm gì ở đó? – Tớ bơi ở biển.', 'sea', '🌊'], ['Where were you last summer?', 'I was in the countryside.', 'Hè năm ngoái bạn ở đâu? – Tớ ở vùng nông thôn.', 'countryside', '🌾'], [undefined, 'I visited my grandparents.', 'Tớ đã thăm ông bà.', 'grandparents']] },
  11: { title: 'My home', vi: 'Nhà của tớ', sound: 'st',
    words: [{ w: 'road', vi: 'con đường' }, { w: 'street', vi: 'đường phố' }, { w: 'house', vi: 'ngôi nhà', emoji: '🏡' }, { w: 'flat', vi: 'căn hộ' }, { w: 'busy', vi: 'đông đúc' }, { w: 'quiet', vi: 'yên tĩnh' }, { w: 'live', vi: 'sống' }],
    phrases: ['where', 'do', 'you', 'i', 'in', 'a', 'at', 'what', 'is', 'your', 'like', "it's", 'no', 'hoa', 'binh', 'hai', 'ba', 'trung', 'quang', 'trung'],
    frames: [['Where do you live?', 'I live in Hoa Binh Street.', 'Bạn sống ở đâu? – Tớ sống ở phố Hoà Bình.', 'Street'], ['What is your street like?', "It's busy.", 'Đường phố nhà bạn thế nào? – Nó đông đúc.', 'busy'], ['Do you live in a house?', 'No, I live in a flat.', 'Bạn sống trong một ngôi nhà phải không? – Không, tớ sống trong một căn hộ.', 'flat'], ['What is your road like?', "It's quiet.", 'Con đường nhà bạn thế nào? – Nó yên tĩnh.', 'quiet']] },
  12: { title: 'Jobs', vi: 'Nghề nghiệp', sound: 'or',
    words: [{ w: 'actor', vi: 'diễn viên', emoji: '🎭' }, { w: 'office worker', vi: 'nhân viên văn phòng', emoji: '💼' }, { w: 'policeman', vi: 'cảnh sát', emoji: '👮' }, { w: 'factory', vi: 'nhà máy', emoji: '🏭' }, { w: 'farm', vi: 'trang trại', emoji: '🚜' }, { w: 'hospital', vi: 'bệnh viện', emoji: '🏥' }, { w: 'nursing home', vi: 'viện dưỡng lão' }, { w: 'work', vi: 'làm việc' }],
    phrases: ["what's", 'your', "father's", "mother's", 'job', "he's", "she's", 'a', 'an', 'where', 'does', 'he', 'she', 'works', 'at', 'in', 'on'],
    frames: [["What's your father's job?", "He's a policeman.", 'Bố bạn làm nghề gì? – Bố tớ là cảnh sát.', 'policeman', '👮'], ['Where does he work?', 'He works at a hospital.', 'Ông ấy làm việc ở đâu? – Ông ấy làm việc ở bệnh viện.', 'hospital', '🏥'], ['Where does she work?', 'She works in a factory.', 'Bà ấy làm việc ở đâu? – Bà ấy làm việc ở nhà máy.', 'factory', '🏭'], ["What's your mother's job?", "She's an office worker.", 'Mẹ bạn làm nghề gì? – Mẹ tớ là nhân viên văn phòng.', 'worker', '💼']] },
  13: { title: 'Appearance', vi: 'Ngoại hình', sound: 'ou',
    words: [{ w: 'tall', vi: 'cao' }, { w: 'short', vi: 'thấp' }, { w: 'slim', vi: 'mảnh khảnh' }, { w: 'long', vi: 'dài' }, { w: 'round', vi: 'tròn' }, { w: 'eyes', vi: 'đôi mắt', emoji: '👀' }, { w: 'look like', vi: 'trông như' }],
    phrases: ['what', 'does', 'he', 'she', 'your', 'look', 'like', "he's", "she's", 'has', 'and', 'my', 'a', 'big', 'brother', 'mother', 'sister', 'hair', 'face'],
    frames: [['What does he look like?', "He's tall.", 'Anh ấy trông thế nào? – Anh ấy cao.', 'tall'], ['What does she look like?', 'She has long hair.', 'Chị ấy trông thế nào? – Chị ấy có mái tóc dài.', 'long'], [undefined, 'My mother has a round face.', 'Mẹ tớ có khuôn mặt tròn.', 'round'], ['What does your brother look like?', "He's short and slim.", 'Anh trai bạn trông thế nào? – Anh ấy thấp và mảnh khảnh.', 'slim']] },
  14: { title: 'Daily activities', vi: 'Hoạt động hằng ngày', sound: 'oo',
    words: [{ w: 'morning', vi: 'buổi sáng', emoji: '🌅' }, { w: 'afternoon', vi: 'buổi chiều' }, { w: 'evening', vi: 'buổi tối', emoji: '🌙' }, { w: 'clean the floor', vi: 'lau nhà', emoji: '🧹' }, { w: 'wash the clothes', vi: 'giặt quần áo', emoji: '👕' }, { w: 'water the flowers', vi: 'tưới hoa', emoji: '🌻' }, { w: 'cook dinner', vi: 'nấu bữa tối' }],
    phrases: ['what', 'do', 'you', 'in', 'the', 'i', 'does', 'your', 'mother', 'father', 'she', 'he', 'cooks', 'washes', 'cleans', 'waters'],
    frames: [['What do you do in the morning?', 'I clean the floor.', 'Bạn làm gì vào buổi sáng? – Tớ lau nhà.', 'floor', '🧹'], ['What does your mother do in the afternoon?', 'She cooks dinner.', 'Mẹ bạn làm gì vào buổi chiều? – Mẹ nấu bữa tối.', 'dinner'], [undefined, 'I water the flowers in the evening.', 'Tớ tưới hoa vào buổi tối.', 'flowers', '🌻'], ['What does your father do in the morning?', 'He washes the clothes.', 'Bố bạn làm gì vào buổi sáng? – Bố giặt quần áo.', 'clothes', '👕']] },
  15: { title: "My family's weekends", vi: 'Cuối tuần của gia đình tớ', sound: 'ce',
    words: [{ w: 'cinema', vi: 'rạp chiếu phim', emoji: '🎬' }, { w: 'shopping centre', vi: 'trung tâm mua sắm', emoji: '🛍️' }, { w: 'swimming pool', vi: 'bể bơi' }, { w: 'sports centre', vi: 'trung tâm thể thao' }, { w: 'bookshop', vi: 'hiệu sách', emoji: '📚' }, { w: 'weekend', vi: 'cuối tuần' }],
    phrases: ['where', 'do', 'you', 'go', 'at', 'the', 'i', 'to', 'what', 'does', 'your', 'father', 'mother', 'he', 'she', 'goes', 'we', 'on'],
    frames: [['Where do you go at the weekend?', 'I go to the cinema.', 'Cuối tuần bạn đi đâu? – Tớ đi xem phim.', 'cinema', '🎬'], ['What does your father do at the weekend?', 'He goes to the swimming pool.', 'Bố bạn làm gì vào cuối tuần? – Bố đi bể bơi.', 'pool'], [undefined, 'We go to the shopping centre on Sundays.', 'Chúng tớ đi trung tâm mua sắm vào các ngày Chủ nhật.', 'shopping', '🛍️'], ['Where does your mother go at the weekend?', 'She goes to the bookshop.', 'Cuối tuần mẹ bạn đi đâu? – Mẹ đi hiệu sách.', 'bookshop', '📚']] },
  16: { title: 'Weather', vi: 'Thời tiết', sound: 'y',
    words: [{ w: 'cloudy', vi: 'nhiều mây', emoji: '☁️' }, { w: 'rainy', vi: 'có mưa', emoji: '🌧️' }, { w: 'sunny', vi: 'có nắng', emoji: '☀️' }, { w: 'windy', vi: 'có gió', emoji: '🌬️' }, { w: 'stormy', vi: 'có bão', emoji: '⛈️' }, { w: 'bakery', vi: 'tiệm bánh', emoji: '🥐' }, { w: 'weather', vi: 'thời tiết' }],
    phrases: ["what's", 'the', 'like', 'today', "it's", 'where', 'are', 'you', 'going', "i'm", 'to'],
    frames: [["What's the weather like today?", "It's sunny.", 'Hôm nay thời tiết thế nào? – Trời nắng.', 'sunny', '☀️'], ["What's the weather like?", "It's rainy.", 'Thời tiết thế nào? – Trời mưa.', 'rainy', '🌧️'], ['Where are you going?', "I'm going to the bakery.", 'Bạn đang đi đâu? – Tớ đang đi đến tiệm bánh.', 'bakery', '🥐'], ["What's the weather like today?", "It's windy.", 'Hôm nay thời tiết thế nào? – Trời có gió.', 'windy', '🌬️']] },
  17: { title: 'In the city', vi: 'Trong thành phố', sound: 'ur',
    words: [{ w: 'go straight', vi: 'đi thẳng', emoji: '⬆️' }, { w: 'turn left', vi: 'rẽ trái', emoji: '⬅️' }, { w: 'turn right', vi: 'rẽ phải', emoji: '➡️' }, { w: 'bus stop', vi: 'bến xe buýt', emoji: '🚏' }, { w: 'post office', vi: 'bưu điện', emoji: '🏤' }, { w: 'supermarket', vi: 'siêu thị', emoji: '🛒' }, { w: 'zoo', vi: 'sở thú' }],
    phrases: ['where', 'is', 'the', 'and', 'how', 'can', 'i', 'get', 'to', "it's", 'on', 'next'],
    frames: [['Where is the post office?', 'Go straight and turn left.', 'Bưu điện ở đâu? – Đi thẳng rồi rẽ trái.', 'left', '⬅️'], ['Where is the supermarket?', 'Turn right.', 'Siêu thị ở đâu? – Rẽ phải.', 'right', '➡️'], ['How can I get to the zoo?', 'Go straight.', 'Tớ có thể đến sở thú bằng cách nào? – Đi thẳng.', 'straight', '⬆️'], ['Where is the bus stop?', "It's next to the supermarket.", 'Bến xe buýt ở đâu? – Nó ở cạnh siêu thị.', 'next', '🚏']] },
  18: { title: 'At the shopping centre', vi: 'Ở trung tâm mua sắm', sound: 'ee',
    words: [{ w: 'behind', vi: 'phía sau' }, { w: 'between', vi: 'ở giữa' }, { w: 'near', vi: 'gần' }, { w: 'opposite', vi: 'đối diện' }, { w: 'jacket', vi: 'áo khoác', emoji: '🧥' }, { w: 'shoes', vi: 'đôi giày', emoji: '👟' }, { w: 'toy shop', vi: 'cửa hàng đồ chơi', emoji: '🧸' }],
    phrases: ['where', 'is', 'the', "it's", 'and', 'how', 'much', 'are', "they're", 'thousand', 'dong', 'fifty', 'ninety', 'seventy'],
    frames: [['Where is the bookshop?', "It's behind the cinema.", 'Hiệu sách ở đâu? – Nó ở phía sau rạp chiếu phim.', 'behind'], ['Where is the toy shop?', "It's between the bakery and the bookshop.", 'Cửa hàng đồ chơi ở đâu? – Nó ở giữa tiệm bánh và hiệu sách.', 'between', '🧸'], ['How much is the jacket?', "It's ninety thousand dong.", 'Cái áo khoác giá bao nhiêu? – Chín mươi nghìn đồng.', 'jacket', '🧥'], ['How much are the shoes?', "They're seventy thousand dong.", 'Đôi giày giá bao nhiêu? – Bảy mươi nghìn đồng.', 'seventy', '👟']] },
  19: { title: 'The animal world', vi: 'Thế giới động vật', sound: 'ly',
    words: [{ w: 'crocodile', vi: 'cá sấu', emoji: '🐊' }, { w: 'giraffe', vi: 'hươu cao cổ', emoji: '🦒' }, { w: 'hippo', vi: 'hà mã', emoji: '🦛' }, { w: 'lion', vi: 'sư tử', emoji: '🦁' }, { w: 'roar', vi: 'gầm' }, { w: 'loudly', vi: 'to, ầm ĩ' }, { w: 'quickly', vi: 'nhanh' }, { w: 'slowly', vi: 'chậm' }],
    phrases: ['what', 'animal', 'do', 'you', 'want', 'to', 'see', 'i', 'the', 'lions', 'giraffes', 'hippos', 'crocodiles', 'they', 'swim', 'run'],
    frames: [['What animal do you want to see?', 'I want to see the giraffes.', 'Bạn muốn xem con vật nào? – Tớ muốn xem hươu cao cổ.', 'giraffes', '🦒'], ['What do lions do?', 'They roar loudly.', 'Sư tử làm gì? – Chúng gầm to.', 'loudly', '🦁'], [undefined, 'Hippos swim slowly.', 'Hà mã bơi chậm.', 'slowly', '🦛'], ['What do crocodiles do?', 'They swim quickly.', 'Cá sấu làm gì? – Chúng bơi nhanh.', 'quickly', '🐊']] },
  20: { title: 'At summer camp', vi: 'Ở trại hè', sound: 'mp',
    words: [{ w: 'campfire', vi: 'lửa trại', emoji: '🔥' }, { w: 'tent', vi: 'cái lều', emoji: '⛺' }, { w: 'summer camp', vi: 'trại hè' }, { w: 'build', vi: 'xây, dựng' }, { w: 'put up', vi: 'dựng lên' }, { w: 'game', vi: 'trò chơi', emoji: '🎲' }, { w: 'song', vi: 'bài hát', emoji: '🎶' }],
    phrases: ['what', 'are', 'you', 'doing', "i'm", 'building', 'a', 'is', 'he', 'she', "he's", "she's", 'putting', 'up', 'they', "they're", 'singing', 'songs', 'playing', 'games'],
    frames: [['What are you doing?', "I'm building a campfire.", 'Bạn đang làm gì? – Tớ đang đốt lửa trại.', 'campfire', '🔥'], ['What is he doing?', "He's putting up a tent.", 'Bạn ấy đang làm gì? – Bạn ấy đang dựng lều.', 'tent', '⛺'], ['What are they doing?', "They're singing songs.", 'Các bạn ấy đang làm gì? – Các bạn ấy đang hát.', 'songs', '🎶'], ['What is she doing?', "She's playing games.", 'Bạn ấy đang làm gì? – Bạn ấy đang chơi trò chơi.', 'games', '🎲']] },
};

/** Từ đã học: Tiếng Anh 1, 2, 3 + Tiếng Anh 4 đến hết unit (cả từ trong mẫu câu) */
export function gs4Learned(unit: number): Set<string> {
  const out = gs3Learned(20);
  for (const [u, v] of Object.entries(GS4_UNITS)) {
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

/** Các tiếng Việt không dấu xuất hiện trong phần nghĩa — không coi là từ tiếng Anh khi kiểm phạm vi */
export const VI_TOKENS4: Set<string> = new Set(
  Object.values(GS4_UNITS).flatMap((v) => [...v.words.map((w) => w.vi), ...v.frames.map((f) => f[2])])
    .flatMap((t) => t.toLowerCase().split(/[^a-zà-ỹ]+/))
    .filter((t) => /^[a-z]+$/.test(t)),
);
