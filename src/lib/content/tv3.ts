// TIẾNG VIỆT 3 — 35 tuần theo mục lục sách Tiếng Việt 3 (Kết nối tri thức): HK1 tuần 1–18, HK2 tuần 19–35.
// Mỗi tuần: một BÀI ĐỌC DO EDUCHAIN KIDS TỰ VIẾT theo chủ điểm của tuần (không chép bài đọc của sách) kèm 4 câu đọc hiểu
// (chi tiết → ý chính → suy luận → liên hệ), và câu luyện từ – câu – chính tả rút từ bộ sinh câu lớp 3 (practice/tv3g.ts).

import { makeRng } from '../practice/rng';
import { tv3Pool, type TV3Ctx, type TV3Focus, type TV3Theme } from '../practice/tv3g';
import type { PracticeQuestion } from '../practice/kit';
import { mc, sc, tf, type ContentLesson, type ContentQuestion, type Level } from './types';

const BOOK = 'Kết nối tri thức';
const SCOPE = { kind: 'viet2', grade: 3 } as const;

export const TV3_TOPICS: Record<string, string> = {
  tn: 'Những trải nghiệm thú vị', ct: 'Cổng trường rộng mở', mn: 'Mái nhà yêu thương', cd: 'Cộng đồng gắn bó',
  sm: 'Những sắc màu thiên nhiên', bh: 'Bài học từ cuộc sống', dn: 'Đất nước ngàn năm', td: 'Trái Đất của chúng mình', on: 'Ôn tập',
};

type Q4 = [prompt: string, options: string[], correct: string | string[], level: Level, explanation: string];
export type TV3Week = {
  week: number; topic: keyof typeof TV3_TOPICS; bai: string; readings: string; practice: string;
  ctx: Omit<TV3Ctx, 'week'>; title: string; text: string; qs: Q4[];
};
const W = (week: number, topic: TV3Week['topic'], bai: string, readings: string, practice: string, theme: TV3Theme, focus: TV3Focus[], spell: string[], title: string, text: string, qs: Q4[]): TV3Week =>
  ({ week, topic, bai, readings, practice, ctx: { theme, focus, spell }, title, text, qs });

export const TV3_WEEKS: TV3Week[] = [
  // ======================================== HỌC KÌ 1
  W(1, 'tn', 'Bài 1–2', 'Ngày gặp lại; Về thăm quê', 'Từ ngữ chỉ sự vật, hoạt động; câu giới thiệu, câu nêu hoạt động; phân biệt c/k', 'muahe', ['suvat', 'hoatdong', 'gioithieu', 'neuhd'], ['c/k'],
    'Chuyến về quê ngoại', 'Hè năm nay, Khôi được bố mẹ cho về quê ngoại. Ngay buổi sáng đầu tiên, Khôi theo ông ra vườn hái na. Những quả na mở mắt, thơm lừng. Buổi chiều, Khôi cùng mấy bạn trong xóm ra bờ đê thả diều. Gió lồng lộng, cánh diều no gió bay vút lên trời xanh. Tối đến, cả nhà ngồi ngoài sân nghe bà kể chuyện ngày xưa. Khôi thầm nghĩ: "Quê ngoại thật nhiều điều thú vị!"',
    [['Buổi sáng đầu tiên, Khôi cùng ông làm gì?', ['ra vườn hái na', 'ra đồng gặt lúa', 'đi chợ phiên'], 'ra vườn hái na', 1, 'Khôi theo ông ra vườn hái na.'],
      ['Khôi thả diều ở đâu?', ['trên bờ đê', 'trên sân thượng', 'ngoài bãi biển'], 'trên bờ đê', 2, 'Khôi cùng các bạn ra bờ đê thả diều.'],
      ['Câu nào cho thấy Khôi rất thích quê ngoại?', ['Quê ngoại thật nhiều điều thú vị!', 'Gió lồng lộng.', 'Những quả na mở mắt.'], 'Quê ngoại thật nhiều điều thú vị!', 3, 'Lời Khôi tự nghĩ thể hiện niềm vui, sự yêu thích.'],
      ['Nếu được về quê, em nên làm gì để chuyến đi thêm ý nghĩa?', ['Giúp ông bà việc nhà và tìm hiểu cuộc sống ở quê', 'Chỉ ở trong nhà xem điện thoại', 'Đòi về thành phố ngay'], 'Giúp ông bà việc nhà và tìm hiểu cuộc sống ở quê', 4, 'Như Khôi, em có thể cùng ông bà làm việc, trải nghiệm cuộc sống ở quê.']]),
  W(2, 'tn', 'Bài 3–4', 'Cánh rừng trong nắng; Lần đầu ra biển', 'Từ ngữ chỉ đặc điểm; câu nêu đặc điểm; phân biệt g/gh', 'muahe', ['dacdiem', 'neudd'], ['g/gh'],
    'Lần đầu thấy biển', 'Vừa xuống xe, Na đã nghe tiếng sóng rì rào. Trước mắt em là biển xanh mênh mông, nối liền với bầu trời. Bãi cát trắng mịn, mát lạnh dưới chân. Những con sóng nhỏ nối đuôi nhau xô vào bờ, tung bọt trắng xoá. Na nhặt được một vỏ ốc nhỏ xíu, có những đường vân tím nhạt. Em áp vỏ ốc vào tai và tưởng như nghe thấy biển đang hát.',
    [['Bãi cát được tả như thế nào?', ['trắng mịn, mát lạnh', 'vàng óng, nóng bỏng', 'đen sẫm, ẩm ướt'], 'trắng mịn, mát lạnh', 1, 'Bài viết: "Bãi cát trắng mịn, mát lạnh dưới chân."'],
      ['Na nhặt được gì?', ['một vỏ ốc nhỏ xíu', 'một con sao biển', 'một viên sỏi'], 'một vỏ ốc nhỏ xíu', 1, 'Na nhặt được một vỏ ốc nhỏ xíu có vân tím nhạt.'],
      ['Chọn tất cả từ chỉ đặc điểm có trong bài.', ['mênh mông', 'trắng mịn', 'vỏ ốc', 'nhỏ xíu'], ['mênh mông', 'trắng mịn', 'nhỏ xíu'], 3, '"vỏ ốc" là từ chỉ sự vật; các từ còn lại chỉ đặc điểm.'],
      ['Vì sao Na "tưởng như nghe thấy biển đang hát"?', ['Vì Na rất yêu biển, áp vỏ ốc vào tai nghe tiếng như sóng', 'Vì có người đang hát trên bãi biển', 'Vì Na đang nghe nhạc'], 'Vì Na rất yêu biển, áp vỏ ốc vào tai nghe tiếng như sóng', 4, 'Tiếng ù ù trong vỏ ốc khiến Na tưởng tượng là tiếng biển hát — Na rất thích biển.']]),
  W(3, 'tn', 'Bài 5–6', 'Nhật kí tập bơi; Tập nấu ăn', 'Từ ngữ chỉ hoạt động; câu nêu hoạt động; phân biệt ng/ngh', 'muahe', ['hoatdong', 'neuhd'], ['ng/ngh'],
    'Món trứng rán đầu tiên', 'Chủ nhật, Mai xin mẹ cho tự làm món trứng rán. Mẹ hướng dẫn: "Con đập trứng vào bát, thêm chút muối rồi đánh thật đều." Mai cẩn thận làm theo. Khi chảo nóng, mẹ đổ dầu, Mai nhẹ nhàng đổ trứng vào. Trứng sôi xèo xèo, vàng ươm. Mai lật trứng hơi vụng nên miếng trứng bị gãy đôi. Bố vẫn khen: "Món trứng ngon nhất bố từng ăn!" Mai sung sướng, hẹn tuần sau sẽ nấu món canh.',
    [['Mai tự làm món gì?', ['trứng rán', 'canh rau', 'cơm rang'], 'trứng rán', 1, 'Mai xin mẹ cho tự làm món trứng rán.'],
      ['Sắp xếp các bước Mai đã làm.', [], 'order', 2, 'Đập trứng vào bát → thêm muối, đánh đều → đổ trứng vào chảo → lật trứng.'],
      ['Vì sao bố vẫn khen dù miếng trứng bị gãy?', ['Vì bố muốn động viên Mai tự làm việc nhà', 'Vì bố không nhìn thấy', 'Vì miếng trứng rất đẹp'], 'Vì bố muốn động viên Mai tự làm việc nhà', 3, 'Lời khen giúp Mai vui và muốn tiếp tục tập nấu ăn.'],
      ['Câu "Mai nhẹ nhàng đổ trứng vào." là kiểu câu nào?', ['câu nêu hoạt động', 'câu giới thiệu', 'câu nêu đặc điểm'], 'câu nêu hoạt động', 4, 'Câu cho biết Mai làm gì nên là câu nêu hoạt động.']]),
  W(4, 'tn', 'Bài 7–8', 'Mùa hè lấp lánh; Tạm biệt mùa hè', 'Mở rộng vốn từ về mùa hè; dấu chấm, dấu hai chấm; phân biệt ch/tr, v/d', 'muahe', ['haicham', 'daucau'], ['ch/tr', 'v/d'],
    'Mùa hè của bé Thảo', 'Mùa hè đến, sân nhà Thảo rực đỏ hoa phượng. Thảo có nhiều niềm vui: đọc truyện, tập bơi, chăm sóc mấy chậu hoa của mẹ. Buổi trưa, tiếng ve kêu râm ran như một dàn đồng ca. Chiều chiều, em cùng anh trai đạp xe quanh hồ. Khi những ngày hè sắp hết, Thảo xếp sách vở gọn gàng, tự nhủ: "Năm học mới, mình sẽ cố gắng hơn!"',
    [['Sân nhà Thảo có hoa gì?', ['hoa phượng', 'hoa đào', 'hoa sữa'], 'hoa phượng', 1, 'Sân nhà Thảo rực đỏ hoa phượng.'],
      ['Tiếng ve được so sánh với gì?', ['một dàn đồng ca', 'tiếng trống trường', 'tiếng mưa rơi'], 'một dàn đồng ca', 2, 'Tiếng ve kêu râm ran như một dàn đồng ca.'],
      ['Trong câu "Thảo có nhiều niềm vui: đọc truyện, tập bơi, chăm sóc mấy chậu hoa của mẹ.", dấu hai chấm dùng để làm gì?', ['báo hiệu phần liệt kê các niềm vui', 'kết thúc câu', 'để hỏi'], 'báo hiệu phần liệt kê các niềm vui', 3, 'Sau dấu hai chấm là các niềm vui được kể ra.'],
      ['Việc Thảo xếp sách vở và tự hứa cố gắng cho thấy điều gì?', ['Thảo đã sẵn sàng, háo hức đón năm học mới', 'Thảo không muốn đi học', 'Thảo sắp đi du lịch'], 'Thảo đã sẵn sàng, háo hức đón năm học mới', 4, 'Thảo chuẩn bị chu đáo và tự hứa cố gắng.']]),
  W(5, 'ct', 'Bài 9–10', 'Đi học vui sao; Con đường đến trường', 'Từ ngữ chỉ đặc điểm; câu nêu đặc điểm; phân biệt s/x, dấu hỏi/dấu ngã', 'truong', ['dacdiem', 'neudd'], ['s/x', 'hỏi/ngã'],
    'Con đường đến lớp', 'Nhà Hưng ở cuối làng, cách trường gần hai cây số. Con đường đến lớp quanh co, hai bên là ruộng lúa xanh mướt. Mùa mưa, đường lầy lội, Hưng phải xắn quần, xách dép. Mùa khô, bụi đỏ bám đầy gấu áo. Dù vậy, chưa buổi nào Hưng đi học muộn. Em bảo: "Đường xa nhưng có các bạn cùng đi, vui lắm!" Mỗi sáng, tiếng cười nói của nhóm bạn làm con đường như ngắn lại.',
    [['Hai bên đường đến lớp của Hưng có gì?', ['ruộng lúa xanh mướt', 'nhà cao tầng', 'rừng thông'], 'ruộng lúa xanh mướt', 1, 'Hai bên đường là ruộng lúa xanh mướt.'],
      ['Mùa mưa, con đường thế nào?', ['lầy lội', 'bụi đỏ', 'khô ráo'], 'lầy lội', 2, 'Mùa mưa, đường lầy lội.'],
      ['Vì sao con đường xa mà Hưng vẫn thấy vui?', ['Vì có các bạn cùng đi, cười nói rộn ràng', 'Vì Hưng đi xe ô tô', 'Vì đường được trải nhựa'], 'Vì có các bạn cùng đi, cười nói rộn ràng', 3, 'Hưng nói: "Đường xa nhưng có các bạn cùng đi, vui lắm!"'],
      ['Từ nào nói đúng nhất về Hưng?', ['chăm chỉ, chịu khó', 'lười biếng', 'hay đi muộn'], 'chăm chỉ, chịu khó', 4, 'Đường xa, khó đi nhưng Hưng chưa buổi nào đi muộn.']]),
  W(6, 'ct', 'Bài 11–12', 'Lời giải toán đặc biệt; Bài tập làm văn', 'Mở rộng vốn từ về nhà trường; câu hỏi; phân biệt r/d/gi, an/ang', 'truong', ['kieucau4'], ['r/d/gi', 'an/ang'],
    'Bài toán khó', 'Giờ toán, cô giáo cho cả lớp một bài toán đố. Vy nghĩ mãi chưa ra. Bạn Tâm ngồi cạnh định nhắc bài, nhưng Vy lắc đầu: "Để tớ tự nghĩ thêm đã!" Vy vẽ hình ra nháp, thử từng cách. Cuối giờ, Vy giơ tay xin trả lời. Cô giáo mỉm cười: "Em làm đúng rồi! Cách giải của em rất sáng tạo." Vy hiểu rằng tự mình tìm ra lời giải thì vui gấp nhiều lần.',
    [['Khi Tâm định nhắc bài, Vy làm gì?', ['lắc đầu, muốn tự nghĩ thêm', 'chép bài của Tâm', 'bỏ không làm nữa'], 'lắc đầu, muốn tự nghĩ thêm', 1, 'Vy nói: "Để tớ tự nghĩ thêm đã!"'],
      ['Vy đã làm gì để tìm lời giải?', ['vẽ hình ra nháp, thử từng cách', 'hỏi cô giáo', 'xem sách giải'], 'vẽ hình ra nháp, thử từng cách', 2, 'Vy vẽ hình ra nháp, thử từng cách.'],
      ['Câu nào trong bài là câu hỏi?', ['Không có câu hỏi trong bài', 'Để tớ tự nghĩ thêm đã!', 'Em làm đúng rồi!'], 'Không có câu hỏi trong bài', 3, 'Các câu trong bài đều không kết thúc bằng dấu chấm hỏi.'],
      ['Câu chuyện khuyên em điều gì?', ['Kiên trì tự suy nghĩ khi học bài', 'Nên chép bài của bạn cho nhanh', 'Không cần làm bài khó'], 'Kiên trì tự suy nghĩ khi học bài', 4, 'Tự tìm ra lời giải mang lại niềm vui và giúp em giỏi hơn.']]),
  W(7, 'ct', 'Bài 13–14', 'Bàn tay cô giáo; Cuộc họp của chữ viết', 'Câu kể; các dấu kết thúc câu; phân biệt l/n, ăn/ăng', 'truong', ['kieucau4', 'daucau'], ['l/n', 'ăn/ăng'],
    'Đôi bàn tay khéo léo', 'Cô giáo lớp em có đôi bàn tay thật khéo. Chỉ với vài tờ giấy màu, cô gấp được những con hạc, bông hoa, chiếc thuyền xinh xắn. Cô dạy chúng em cắt dán bức tranh "Ngôi trường em yêu". Bạn nào làm chưa khéo, cô cầm tay chỉ từng nét. Cuối buổi, bức tranh của cả lớp được treo lên bảng. Ôi, đẹp quá! Chúng em reo lên sung sướng.',
    [['Cô giáo gấp được những gì từ giấy màu?', ['con hạc, bông hoa, chiếc thuyền', 'quyển sách, cái bút', 'ngôi nhà, cái cây'], 'con hạc, bông hoa, chiếc thuyền', 1, 'Cô gấp được những con hạc, bông hoa, chiếc thuyền.'],
      ['Bạn nào làm chưa khéo, cô giáo làm gì?', ['cầm tay chỉ từng nét', 'cho bạn ra ngoài', 'làm thay bạn'], 'cầm tay chỉ từng nét', 2, 'Cô cầm tay chỉ từng nét.'],
      ['Câu "Ôi, đẹp quá!" là kiểu câu gì?', ['câu cảm', 'câu kể', 'câu hỏi'], 'câu cảm', 3, 'Câu bộc lộ cảm xúc ("ôi", "quá") là câu cảm.'],
      ['Bài đọc cho thấy tình cảm của học sinh với cô giáo thế nào?', ['quý mến, khâm phục cô', 'sợ cô', 'không thích cô'], 'quý mến, khâm phục cô', 4, 'Các bạn khen đôi bàn tay khéo léo của cô và vui khi được cô dạy.']]),
  W(8, 'ct', 'Bài 15–16', 'Thư viện; Ngày em vào Đội', 'Mở rộng vốn từ về thư viện; câu cảm; phân biệt ch/tr, ân/âng', 'thuvien', ['kieucau4'], ['ch/tr', 'ân/âng'],
    'Góc sách của lớp 3B', 'Lớp 3B có một góc sách nhỏ do các bạn tự góp. Mỗi bạn mang đến một cuốn sách mình yêu thích. Bạn Đức được bầu làm thủ thư. Đức ghi tên sách vào sổ, dán nhãn cẩn thận. Ai mượn sách, Đức nhắc: "Cậu nhớ giữ sách sạch đẹp và trả đúng hẹn nhé!" Nhờ góc sách, giờ ra chơi lớp 3B lúc nào cũng có bạn ngồi say sưa đọc.',
    [['Sách ở góc sách của lớp 3B từ đâu mà có?', ['do các bạn tự góp', 'do nhà trường mua', 'do thư viện cho mượn'], 'do các bạn tự góp', 1, 'Góc sách do các bạn tự góp.'],
      ['Ai được bầu làm thủ thư?', ['bạn Đức', 'cô giáo', 'lớp trưởng'], 'bạn Đức', 1, 'Bạn Đức được bầu làm thủ thư.'],
      ['Câu Đức nhắc bạn mượn sách là kiểu câu gì?', ['câu khiến', 'câu kể', 'câu hỏi'], 'câu khiến', 3, 'Câu dùng để nhắc nhở, đề nghị ("nhớ… nhé") là câu khiến.'],
      ['Góc sách mang lại điều gì cho lớp 3B?', ['Các bạn thích đọc sách hơn', 'Lớp học ồn ào hơn', 'Các bạn không ra chơi nữa'], 'Các bạn thích đọc sách hơn', 4, 'Giờ ra chơi lúc nào cũng có bạn say sưa đọc sách.']]),
  W(9, 'on', 'Ôn tập giữa học kì 1', 'Ôn tập các bài đọc tuần 1–8', 'Ôn từ ngữ, kiểu câu, dấu câu, chính tả', 'truong', ['suvat', 'hoatdong', 'dacdiem', 'kieucau4', 'haicham'], ['c/k', 'g/gh', 'ng/ngh', 's/x', 'l/n'],
    'Cây bàng sân trường', 'Giữa sân trường em có một cây bàng già. Mùa xuân, cây đâm chồi non xanh biếc. Mùa hè, tán lá xoè rộng như chiếc ô che mát cả góc sân. Mùa thu, lá bàng đỏ như ngọn lửa. Mùa đông, cây trụi lá, chỉ còn những cành khẳng khiu. Chúng em yêu cây bàng vì cây như một người bạn lớn, lặng lẽ chứng kiến bao kỉ niệm tuổi học trò.',
    [['Mùa hè, tán bàng được so sánh với gì?', ['chiếc ô', 'ngọn lửa', 'người bạn nhỏ'], 'chiếc ô', 1, 'Tán lá xoè rộng như chiếc ô.'],
      ['Mùa thu, lá bàng có màu gì?', ['đỏ', 'xanh biếc', 'vàng nhạt'], 'đỏ', 2, 'Mùa thu, lá bàng đỏ như ngọn lửa.'],
      ['Bài văn tả cây bàng theo trình tự nào?', ['theo bốn mùa trong năm', 'từ gốc lên ngọn', 'từ sáng đến tối'], 'theo bốn mùa trong năm', 3, 'Tác giả tả cây bàng vào mùa xuân, hạ, thu, đông.'],
      ['Vì sao các bạn coi cây bàng "như một người bạn lớn"?', ['Vì cây gắn bó, chứng kiến kỉ niệm tuổi học trò', 'Vì cây biết nói chuyện', 'Vì cây cao nhất làng'], 'Vì cây gắn bó, chứng kiến kỉ niệm tuổi học trò', 4, 'Cây bàng gắn bó lâu năm với các bạn.']]),
  W(10, 'mn', 'Bài 17–18', 'Ngưỡng cửa; Món quà đặc biệt', 'Từ ngữ chỉ đặc điểm; câu khiến; phân biệt iêu/ươu, en/eng', 'nguoithan', ['dacdiem', 'kieucau4'], ['iêu/ươu', 'en/eng'],
    'Tấm thiệp tự làm', 'Sắp đến sinh nhật bố, hai chị em Hà bàn nhau làm một món quà. Chị Hà vẽ một ngôi nhà nhỏ có bốn người đang cười. Bé Bin tô màu và dán thêm mấy bông hoa giấy. Bin còn viết nắn nót: "Chúc bố luôn khoẻ!" Tối sinh nhật, bố mở tấm thiệp, mắt rưng rưng. Bố bảo đây là món quà quý nhất bố từng nhận.',
    [['Hai chị em làm món quà gì tặng bố?', ['một tấm thiệp tự làm', 'một chiếc bánh', 'một bó hoa tươi'], 'một tấm thiệp tự làm', 1, 'Hai chị em tự làm tấm thiệp.'],
      ['Bé Bin đã làm gì cho tấm thiệp?', ['tô màu, dán hoa giấy, viết lời chúc', 'vẽ ngôi nhà', 'mua thiệp ở cửa hàng'], 'tô màu, dán hoa giấy, viết lời chúc', 2, 'Bin tô màu, dán hoa giấy và viết lời chúc.'],
      ['Vì sao bố coi tấm thiệp là món quà quý nhất?', ['Vì tấm thiệp chứa đựng tình yêu thương của các con', 'Vì tấm thiệp rất đắt', 'Vì bố thích màu đỏ'], 'Vì tấm thiệp chứa đựng tình yêu thương của các con', 3, 'Món quà tự tay làm thể hiện tình cảm của hai chị em.'],
      ['Đọc câu: "Bin viết nắn nót." Từ "nắn nót" cho thấy Bin viết thế nào?', ['cẩn thận, đẹp', 'nhanh, vội vàng', 'to, đậm'], 'cẩn thận, đẹp', 4, '"Nắn nót" nghĩa là viết cẩn thận từng nét cho đẹp.']]),
  W(11, 'mn', 'Bài 19–20', 'Tia nắng bé nhỏ; Khi cả nhà bé tí', 'Phân biệt s/x, uôn/uông; iu/ưu, iên/iêng', 'nguoithan', ['dacdiem', 'hoatdong'], ['s/x', 'uôn/uông', 'iu/ưu', 'iên/iêng'],
    'Chiếc gương của bà', 'Bà nội bị đau chân nên ít khi ra vườn. Bé Nga thương bà lắm. Một buổi sáng, Nga lấy chiếc gương nhỏ, hứng ánh nắng rồi chiếu vào phòng bà. Vệt nắng vàng nhảy nhót trên tường, trên tấm chăn. Bà cười móm mém: "Cháu bà mang cả mùa xuân vào nhà rồi!" Từ đó, sáng nào Nga cũng làm "người đưa nắng" cho bà.',
    [['Vì sao bà ít ra vườn?', ['vì bà bị đau chân', 'vì trời mưa', 'vì bà bận việc'], 'vì bà bị đau chân', 1, 'Bà nội bị đau chân.'],
      ['Nga làm cách nào để mang nắng vào phòng bà?', ['dùng gương hứng nắng chiếu vào phòng', 'mở toang cửa sổ', 'bật đèn sáng'], 'dùng gương hứng nắng chiếu vào phòng', 2, 'Nga lấy gương hứng ánh nắng rồi chiếu vào phòng bà.'],
      ['Bà nói "Cháu bà mang cả mùa xuân vào nhà rồi!" ý bà muốn nói gì?', ['Bà rất vui, thấy ấm áp nhờ việc làm của cháu', 'Mùa xuân đã đến thật', 'Bà muốn ra vườn'], 'Bà rất vui, thấy ấm áp nhờ việc làm của cháu', 3, 'Vệt nắng và tình cảm của Nga làm bà vui, ấm áp.'],
      ['Em có thể làm gì để người thân bị ốm vui hơn?', ['Hỏi han, kể chuyện vui, giúp đỡ việc nhỏ', 'Chơi ồn ào cạnh giường', 'Không quan tâm'], 'Hỏi han, kể chuyện vui, giúp đỡ việc nhỏ', 4, 'Những việc làm nhỏ thể hiện sự quan tâm như Nga.']]),
  W(12, 'mn', 'Bài 21–22', 'Trò chuyện cùng mẹ; Để cháu nắm tay ông', 'Mở rộng vốn từ về người thân; dấu hai chấm; từ ngữ chỉ hoạt động, đặc điểm; câu kể', 'nguoithan', ['haicham', 'hoatdong', 'dacdiem', 'kieucau4'], ['r/d/gi'],
    'Buổi tối ở nhà Bảo', 'Tối nào nhà Bảo cũng có "giờ trò chuyện". Cả nhà tắt ti vi, ngồi quanh ấm trà của ông. Mỗi người kể một chuyện trong ngày: mẹ kể chuyện ở bệnh viện, bố kể chuyện công trường, Bảo kể chuyện lớp học. Ông thường dặn: "Có chuyện vui thì cùng cười, có chuyện buồn thì cùng chia sẻ." Bảo thích giờ trò chuyện nhất trong ngày.',
    [['Trong "giờ trò chuyện", cả nhà Bảo làm gì?', ['tắt ti vi, ngồi kể chuyện trong ngày', 'cùng xem phim', 'mỗi người làm việc riêng'], 'tắt ti vi, ngồi kể chuyện trong ngày', 1, 'Cả nhà tắt ti vi, ngồi kể chuyện trong ngày.'],
      ['Mẹ Bảo có lẽ làm nghề gì?', ['làm việc ở bệnh viện', 'làm ở công trường', 'dạy học'], 'làm việc ở bệnh viện', 2, 'Mẹ kể chuyện ở bệnh viện.'],
      ['Dấu hai chấm trong câu "Mỗi người kể một chuyện trong ngày: mẹ kể…, bố kể…, Bảo kể…" dùng để làm gì?', ['báo hiệu phần kể ra các chuyện', 'báo hiệu lời nói của ông', 'kết thúc câu'], 'báo hiệu phần kể ra các chuyện', 3, 'Sau dấu hai chấm là phần liệt kê.'],
      ['Lời dặn của ông muốn nói điều gì?', ['Người trong gia đình luôn sẻ chia vui buồn với nhau', 'Không được kể chuyện buồn', 'Chỉ ông được nói chuyện'], 'Người trong gia đình luôn sẻ chia vui buồn với nhau', 4, 'Ông dặn cùng cười khi vui, cùng chia sẻ khi buồn.']]),
  W(13, 'mn', 'Bài 23–24', 'Tôi yêu em tôi; Bạn nhỏ trong nhà', 'Mở rộng vốn từ về bạn trong nhà; biện pháp so sánh; phân biệt r/d/gi, ươn/ương', 'dovat', ['sosanh'], ['r/d/gi', 'ươn/ương'],
    'Chiếc đồng hồ báo thức', 'Trên bàn học của em có chiếc đồng hồ báo thức màu xanh. Mặt đồng hồ tròn như chiếc bánh quy. Hai cây kim chạy đều như hai anh em đuổi nhau không biết mệt. Sáng nào, đúng sáu giờ, đồng hồ cũng reo vang "reng reng" gọi em dậy. Nhờ đồng hồ, em chưa bao giờ đi học muộn. Em coi nó như một người bạn nhỏ chăm chỉ.',
    [['Chiếc đồng hồ màu gì?', ['màu xanh', 'màu đỏ', 'màu trắng'], 'màu xanh', 1, 'Đồng hồ báo thức màu xanh.'],
      ['Mặt đồng hồ được so sánh với gì?', ['chiếc bánh quy', 'mặt trăng', 'cái đĩa'], 'chiếc bánh quy', 2, 'Mặt đồng hồ tròn như chiếc bánh quy.'],
      ['Câu nào có hình ảnh so sánh?', ['Hai cây kim chạy đều như hai anh em đuổi nhau.', 'Đồng hồ reo vang gọi em dậy.', 'Em chưa bao giờ đi học muộn.'], 'Hai cây kim chạy đều như hai anh em đuổi nhau.', 3, 'Câu dùng từ "như" để so sánh hai cây kim với hai anh em.'],
      ['Vì sao bạn nhỏ coi đồng hồ là "người bạn nhỏ chăm chỉ"?', ['Vì đồng hồ ngày nào cũng đúng giờ gọi bạn dậy', 'Vì đồng hồ biết nói', 'Vì đồng hồ rất đắt'], 'Vì đồng hồ ngày nào cũng đúng giờ gọi bạn dậy', 4, 'Đồng hồ làm việc đều đặn, giúp bạn không đi học muộn.']]),
  W(14, 'cd', 'Bài 25–26', 'Những bậc đá chạm mây; Đi tìm mặt trời', 'Từ có nghĩa trái ngược nhau; câu khiến; phân biệt ch/tr, ăn/ăng', 'congdong', ['trainghia', 'kieucau4'], ['ch/tr', 'ăn/ăng'],
    'Cây cầu tre của bản', 'Bản Pác Bó nằm bên kia con suối. Mùa lũ, nước dâng cao, các bạn nhỏ không sang trường được. Ông Lý rủ mọi người cùng làm cầu. Người chặt tre, người buộc lạt, người khiêng đá kê chân cầu. Chỉ sau ba ngày, cây cầu tre chắc chắn đã bắc qua suối. Ông Lý dặn các cháu: "Các cháu hãy đi cẩn thận và giữ gìn cây cầu nhé!"',
    [['Vì sao mùa lũ các bạn nhỏ không sang trường được?', ['vì nước suối dâng cao', 'vì trường đóng cửa', 'vì đường bị sạt lở'], 'vì nước suối dâng cao', 1, 'Mùa lũ, nước dâng cao.'],
      ['Ai rủ mọi người cùng làm cầu?', ['ông Lý', 'thầy giáo', 'các bạn nhỏ'], 'ông Lý', 2, 'Ông Lý rủ mọi người cùng làm cầu.'],
      ['Câu ông Lý dặn các cháu là kiểu câu gì?', ['câu khiến', 'câu kể', 'câu cảm'], 'câu khiến', 3, 'Câu có "hãy… nhé" dùng để dặn dò là câu khiến.'],
      ['Câu chuyện ca ngợi điều gì?', ['Tinh thần đoàn kết, giúp đỡ nhau của người dân trong bản', 'Sự giàu có của bản', 'Con suối đẹp'], 'Tinh thần đoàn kết, giúp đỡ nhau của người dân trong bản', 4, 'Cả bản cùng góp sức làm cầu cho các cháu đi học.']]),
  W(15, 'cd', 'Bài 27–28', 'Những chiếc áo ấm; Con đường của bé', 'Mở rộng vốn từ về nghề nghiệp; câu hỏi; phân biệt l/n, dấu hỏi/dấu ngã', 'nghenghiep', ['kieucau4'], ['l/n', 'hỏi/ngã'],
    'Cô thợ may đầu ngõ', 'Đầu ngõ nhà em có tiệm may nhỏ của cô Hạnh. Cô đo, cắt, khâu nhanh thoăn thoắt. Những tấm vải qua tay cô trở thành chiếc áo, chiếc váy vừa vặn. Mùa đông năm ngoái, cô may hai mươi chiếc áo ấm tặng các bạn nhỏ vùng cao. Em hỏi: "Sao cô làm nhiều áo thế?" Cô cười: "Để các bạn ấy đến lớp không bị lạnh, cháu ạ."',
    [['Cô Hạnh làm nghề gì?', ['thợ may', 'giáo viên', 'bác sĩ'], 'thợ may', 1, 'Cô Hạnh có tiệm may nhỏ.'],
      ['Mùa đông năm ngoái, cô Hạnh làm gì đặc biệt?', ['may áo ấm tặng các bạn nhỏ vùng cao', 'đi du lịch', 'mở thêm tiệm mới'], 'may áo ấm tặng các bạn nhỏ vùng cao', 2, 'Cô may hai mươi chiếc áo ấm tặng các bạn vùng cao.'],
      ['Câu "Sao cô làm nhiều áo thế?" là kiểu câu gì?', ['câu hỏi', 'câu kể', 'câu khiến'], 'câu hỏi', 3, 'Câu dùng để hỏi, cuối câu có dấu chấm hỏi.'],
      ['Từ nào nói đúng về cô Hạnh?', ['khéo tay, tốt bụng', 'lười biếng, ích kỉ', 'nóng tính'], 'khéo tay, tốt bụng', 4, 'Cô may nhanh, đẹp và may áo tặng các bạn vùng cao.']]),
  W(16, 'cd', 'Bài 29–30', 'Ngôi nhà trong cỏ; Những ngọn hải đăng', 'Từ ngữ chỉ sự vật, hoạt động; hỏi – đáp về sự vật, hoạt động; phân biệt s/x, ao/au', 'congdong', ['suvat', 'hoatdong', 'kieucau4'], ['s/x', 'ao/au'],
    'Người canh ngọn đèn', 'Trên hòn đảo nhỏ giữa biển có một ngọn hải đăng. Chú Toàn là người canh đèn ở đó. Đêm nào chú cũng lên đỉnh tháp kiểm tra, lau sạch mặt kính. Ánh đèn quét một vòng sáng trên mặt biển, chỉ đường cho tàu thuyền. Có đêm giông bão, chú thức trắng để giữ cho đèn luôn sáng. Ngư dân gọi ngọn hải đăng là "người bạn của biển đêm".',
    [['Ngọn hải đăng ở đâu?', ['trên hòn đảo nhỏ giữa biển', 'trên đỉnh núi', 'giữa thành phố'], 'trên hòn đảo nhỏ giữa biển', 1, 'Ngọn hải đăng ở trên hòn đảo nhỏ giữa biển.'],
      ['Ánh đèn hải đăng có tác dụng gì?', ['chỉ đường cho tàu thuyền', 'chiếu sáng cho đảo', 'trang trí'], 'chỉ đường cho tàu thuyền', 2, 'Ánh đèn chỉ đường cho tàu thuyền.'],
      ['Vì sao đêm giông bão chú Toàn thức trắng?', ['Để đèn luôn sáng, giúp tàu thuyền an toàn', 'Vì chú sợ bão', 'Vì chú xem phim'], 'Để đèn luôn sáng, giúp tàu thuyền an toàn', 3, 'Đêm bão tàu thuyền càng cần đèn chỉ đường.'],
      ['Công việc của chú Toàn cho thấy chú là người thế nào?', ['tận tuỵ, có trách nhiệm', 'nhút nhát', 'vô tâm'], 'tận tuỵ, có trách nhiệm', 4, 'Chú chăm sóc đèn mỗi đêm, kể cả lúc giông bão.']]),
  W(17, 'cd', 'Bài 31–32', 'Người làm đồ chơi; Cây bút thần', 'Mở rộng vốn từ về thành thị, nông thôn; biện pháp so sánh', 'thanhthi', ['sosanh'], ['ch/tr'],
    'Phố và làng', 'An sống ở thành phố, nghỉ hè được về làng chơi với Bình. Ở phố có nhà cao tầng, xe cộ đông đúc, đèn điện sáng như sao sa. Ở làng có cánh đồng rộng, luỹ tre xanh, buổi tối nghe rõ tiếng ếch kêu. An dạy Bình chơi cờ vua, Bình dạy An bắt cá, thả diều. Lúc chia tay, hai bạn hẹn hè sau Bình sẽ lên phố chơi.',
    [['Ở phố có những gì?', ['nhà cao tầng, xe cộ đông đúc', 'cánh đồng, luỹ tre', 'đồi núi, rừng cây'], 'nhà cao tầng, xe cộ đông đúc', 1, 'Ở phố có nhà cao tầng, xe cộ đông đúc.'],
      ['Đèn điện ở phố được so sánh với gì?', ['sao sa', 'mặt trời', 'đom đóm'], 'sao sa', 2, 'Đèn điện sáng như sao sa.'],
      ['Hai bạn đã học được gì của nhau?', ['An dạy chơi cờ vua, Bình dạy bắt cá, thả diều', 'Cả hai cùng học bơi', 'Hai bạn không chơi với nhau'], 'An dạy chơi cờ vua, Bình dạy bắt cá, thả diều', 3, 'Mỗi bạn chia sẻ điều mình biết.'],
      ['Câu chuyện muốn nói điều gì?', ['Thành thị và nông thôn đều có nét đẹp; bạn bè học hỏi lẫn nhau', 'Thành phố tốt hơn làng quê', 'Làng quê buồn tẻ'], 'Thành thị và nông thôn đều có nét đẹp; bạn bè học hỏi lẫn nhau', 4, 'Mỗi nơi có nét riêng, hai bạn vui vẻ học hỏi nhau.']]),
  W(18, 'on', 'Ôn tập cuối học kì 1', 'Ôn tập các bài đọc học kì 1', 'Ôn từ ngữ, kiểu câu, dấu câu, so sánh, chính tả học kì 1', 'congdong', ['suvat', 'dacdiem', 'kieucau4', 'haicham', 'sosanh', 'trainghia'], ['ch/tr', 'r/d/gi', 'l/n', 's/x'],
    'Ngày hội đọc sách', 'Trường em tổ chức Ngày hội đọc sách. Sân trường rực rỡ cờ hoa. Mỗi lớp có một gian sách trang trí thật đẹp. Lớp em dựng gian sách hình con thuyền, trên cánh buồm ghi: "Sách là người bạn lớn". Các bạn thi kể chuyện, vẽ tranh về nhân vật yêu thích. Bạn Hoa kể chuyện "Cây bút thần" hay đến nỗi cả sân trường vỗ tay rộn rã.',
    [['Gian sách của lớp em có hình gì?', ['con thuyền', 'ngôi nhà', 'cái cây'], 'con thuyền', 1, 'Lớp em dựng gian sách hình con thuyền.'],
      ['Các bạn tham gia những hoạt động nào?', ['thi kể chuyện, vẽ tranh về nhân vật', 'thi chạy, nhảy xa', 'thi hát, múa'], 'thi kể chuyện, vẽ tranh về nhân vật', 2, 'Các bạn thi kể chuyện, vẽ tranh về nhân vật yêu thích.'],
      ['Dấu ngoặc kép trong "Cây bút thần" dùng để làm gì?', ['đánh dấu tên câu chuyện', 'đánh dấu lời nói', 'kết thúc câu'], 'đánh dấu tên câu chuyện', 3, 'Tên truyện được đặt trong dấu ngoặc kép.'],
      ['Ngày hội đọc sách mang lại lợi ích gì?', ['Giúp học sinh yêu sách và thích đọc hơn', 'Giúp học sinh nghỉ học', 'Để bán sách'], 'Giúp học sinh yêu sách và thích đọc hơn', 4, 'Các hoạt động sôi nổi làm các bạn thêm yêu sách.']]),
  // ======================================== HỌC KÌ 2
  W(19, 'sm', 'Bài 1–2', 'Bầu trời; Mưa', 'Mở rộng vốn từ về các hiện tượng tự nhiên; câu cảm, câu khiến; phân biệt ch/tr, ac/at', 'tunhien', ['kieucau4'], ['ch/tr', 'ac/at'],
    'Cơn mưa rào', 'Đang trưa, trời bỗng tối sầm. Gió thổi mạnh, cây cối nghiêng ngả. Một tia chớp loé sáng, rồi tiếng sấm ầm ầm. Mưa rào trút xuống, hạt mưa to như hạt ngô, gõ lộp độp trên mái tôn. Chỉ một lúc sau, mưa tạnh. Ông mặt trời ló ra, một chiếc cầu vồng bảy sắc vắt ngang bầu trời. Bé Lan reo lên: "Ôi, cầu vồng đẹp quá!"',
    [['Trước cơn mưa, trời thế nào?', ['tối sầm, gió thổi mạnh', 'nắng chói chang', 'mát mẻ, êm dịu'], 'tối sầm, gió thổi mạnh', 1, 'Trời tối sầm, gió thổi mạnh.'],
      ['Hạt mưa được so sánh với gì?', ['hạt ngô', 'hạt cát', 'hạt ngọc'], 'hạt ngô', 2, 'Hạt mưa to như hạt ngô.'],
      ['Chọn tất cả từ ngữ chỉ hiện tượng tự nhiên trong bài.', ['tia chớp', 'sấm', 'cầu vồng', 'mái tôn'], ['tia chớp', 'sấm', 'cầu vồng'], 3, '"mái tôn" là đồ vật, không phải hiện tượng tự nhiên.'],
      ['Câu "Ôi, cầu vồng đẹp quá!" là kiểu câu gì?', ['câu cảm', 'câu khiến', 'câu hỏi'], 'câu cảm', 4, 'Câu bộc lộ cảm xúc ngạc nhiên, thích thú.']]),
  W(20, 'sm', 'Bài 3–4', 'Cóc kiện Trời; Những cái tên đáng yêu', 'Từ ngữ có nghĩa giống nhau; đặt và trả lời câu hỏi Khi nào?; phân biệt s/x, ăt/ăc', 'tunhien', ['giongnghia', 'khinao'], ['s/x', 'ăc/ăt'],
    'Giếng nước của làng', 'Năm ấy, trời nắng hạn suốt ba tháng. Ruộng nứt nẻ, cây cối héo khô. Dân làng lo lắng vì giếng sắp cạn. Một buổi sáng, các cụ già họp bàn cùng dân làng. Mọi người quyết định đào thêm một cái giếng mới ở chân đồi. Trai làng đào, gái làng gánh đất, trẻ con mang nước uống. Đến chiều tối, dòng nước mát lành đã trào lên. Cả làng mừng rỡ.',
    [['Năm ấy, làng gặp chuyện gì?', ['nắng hạn kéo dài', 'lũ lụt', 'bão lớn'], 'nắng hạn kéo dài', 1, 'Trời nắng hạn suốt ba tháng.'],
      ['Trong câu "Một buổi sáng, các cụ già họp bàn cùng dân làng.", bộ phận nào trả lời câu hỏi Khi nào?', ['Một buổi sáng', 'các cụ già', 'cùng dân làng'], 'Một buổi sáng', 2, '"Một buổi sáng" chỉ thời gian.'],
      ['Mọi người cùng làm gì để có nước?', ['đào giếng mới ở chân đồi', 'chờ trời mưa', 'chuyển đi nơi khác'], 'đào giếng mới ở chân đồi', 3, 'Dân làng đào thêm giếng mới ở chân đồi.'],
      ['Từ nào có nghĩa giống "mừng rỡ"?', ['vui mừng', 'lo lắng', 'buồn bã'], 'vui mừng', 4, '"mừng rỡ" và "vui mừng" có nghĩa giống nhau.']]),
  W(21, 'sm', 'Bài 5–6', 'Ngày hội rừng xanh; Cây gạo', 'Biện pháp so sánh; đặt và trả lời câu hỏi Ở đâu?; viết hoa tên riêng địa lí; phân biệt iêu/ươu, ôt/ôc', 'nuirung', ['sosanh', 'odau', 'diali'], ['iêu/ươu', 'ôc/ôt'],
    'Cây gạo đầu làng', 'Ở đầu làng em có một cây gạo cổ thụ. Thân cây to, mấy người ôm không xuể. Tháng ba, cây trổ hoa đỏ rực như những ngọn đuốc. Đàn chim sáo, chim chào mào kéo về ríu rít trên cành. Hoa gạo rụng đỏ cả mặt đường. Mỗi lần đi học về, chúng em thường nhặt hoa gạo xâu thành chuỗi. Cây gạo như người lính gác, ngày đêm đứng canh cho làng.',
    [['Hoa gạo nở vào tháng mấy?', ['tháng ba', 'tháng chín', 'tháng mười hai'], 'tháng ba', 1, 'Tháng ba, cây trổ hoa đỏ rực.'],
      ['Hoa gạo được so sánh với gì?', ['những ngọn đuốc', 'những ngôi sao', 'những chiếc ô'], 'những ngọn đuốc', 2, 'Hoa đỏ rực như những ngọn đuốc.'],
      ['Trong câu "Đàn chim sáo kéo về ríu rít trên cành.", bộ phận nào trả lời câu hỏi Ở đâu?', ['trên cành', 'đàn chim sáo', 'ríu rít'], 'trên cành', 3, '"trên cành" chỉ nơi chốn.'],
      ['Vì sao cây gạo được ví như "người lính gác"?', ['Vì cây đứng ở đầu làng, gắn bó, như canh giữ cho làng', 'Vì cây biết đi tuần', 'Vì cây có súng'], 'Vì cây đứng ở đầu làng, gắn bó, như canh giữ cho làng', 4, 'Cây gạo đứng sừng sững ở đầu làng qua bao năm tháng.']]),
  W(22, 'sm', 'Bài 7–8', 'Mặt trời xanh của tôi; Bầy voi rừng Trường Sơn', 'Mở rộng vốn từ về núi rừng; đặt và trả lời câu hỏi Ở đâu?, Khi nào?; phân biệt r/d/gi, in/inh', 'nuirung', ['odau', 'khinao'], ['r/d/gi', 'in/inh'],
    'Thác nước trong rừng', 'Sâu trong rừng có một ngọn thác cao. Từ xa đã nghe tiếng nước đổ ào ào. Dòng nước trắng xoá từ vách đá lao xuống, tung bọt như mây bay. Dưới chân thác là một hồ nước trong xanh. Buổi sớm, sương mù bao phủ, ngọn thác như dải lụa mờ ảo. Buổi trưa, nắng chiếu vào bụi nước tạo thành cầu vồng nhỏ. Ai đến đây cũng không muốn về.',
    [['Dưới chân thác có gì?', ['một hồ nước trong xanh', 'một ngôi làng', 'một cánh đồng'], 'một hồ nước trong xanh', 1, 'Dưới chân thác là một hồ nước trong xanh.'],
      ['Trong câu "Buổi sớm, sương mù bao phủ.", bộ phận nào trả lời câu hỏi Khi nào?', ['Buổi sớm', 'sương mù', 'bao phủ'], 'Buổi sớm', 2, '"Buổi sớm" chỉ thời gian.'],
      ['Vì sao buổi trưa ở thác lại có cầu vồng nhỏ?', ['Vì nắng chiếu vào bụi nước', 'Vì trời mưa', 'Vì có người thắp đèn'], 'Vì nắng chiếu vào bụi nước', 3, 'Nắng chiếu vào bụi nước tạo thành cầu vồng.'],
      ['Tác giả cảm thấy thế nào về ngọn thác?', ['Rất yêu thích, say mê vẻ đẹp của thác', 'Sợ hãi', 'Không quan tâm'], 'Rất yêu thích, say mê vẻ đẹp của thác', 4, '"Ai đến đây cũng không muốn về."']]),
  W(23, 'bh', 'Bài 9–10', 'Lời kêu gọi toàn dân tập thể dục; Quả hồng của thỏ con', 'Từ ngữ có nghĩa giống nhau; dấu gạch ngang; phân biệt l/n, dấu hỏi/dấu ngã', 'congdong', ['giongnghia', 'gachngang'], ['l/n', 'hỏi/ngã'],
    'Quả táo chia đôi', 'Sóc Nâu tìm được một quả táo đỏ. Sóc định ăn ngay thì thấy Nhím Con ngồi buồn bên gốc cây.\n– Sao cậu buồn thế? – Sóc hỏi.\n– Tớ đi tìm thức ăn cả buổi mà chưa thấy gì – Nhím đáp.\nSóc nghĩ một lát rồi bẻ đôi quả táo, đưa cho Nhím một nửa. Hai bạn vừa ăn vừa cười. Sóc thấy nửa quả táo ngon hơn cả quả táo nguyên vẹn.',
    [['Sóc Nâu tìm được gì?', ['một quả táo đỏ', 'một hạt dẻ', 'một quả hồng'], 'một quả táo đỏ', 1, 'Sóc Nâu tìm được một quả táo đỏ.'],
      ['Vì sao Nhím Con buồn?', ['vì đi tìm thức ăn cả buổi mà chưa thấy gì', 'vì bị lạc đường', 'vì cãi nhau với bạn'], 'vì đi tìm thức ăn cả buổi mà chưa thấy gì', 2, 'Nhím đáp: "Tớ đi tìm thức ăn cả buổi mà chưa thấy gì."'],
      ['Dấu gạch ngang ở đầu dòng trong bài dùng để làm gì?', ['đánh dấu lời nói của nhân vật', 'liệt kê đồ vật', 'nối các từ'], 'đánh dấu lời nói của nhân vật', 3, 'Dấu gạch ngang đầu dòng đánh dấu lời đối thoại.'],
      ['Vì sao Sóc thấy nửa quả táo ngon hơn cả quả nguyên vẹn?', ['Vì Sóc vui khi được chia sẻ với bạn', 'Vì nửa quả ngọt hơn', 'Vì Sóc không đói'], 'Vì Sóc vui khi được chia sẻ với bạn', 4, 'Niềm vui chia sẻ làm món ăn ngon hơn.']]),
  W(24, 'bh', 'Bài 11–12', 'Chuyện bên cửa sổ; Tay trái và tay phải', 'Dấu ngoặc kép; đặt và trả lời câu hỏi Bằng gì?; phân biệt iu/ưu, im/iêm', 'congdong', ['ngoackep', 'banggi'], ['iu/ưu', 'im/iêm'],
    'Đôi tay cùng làm', 'Tay Phải hay khoe: "Tớ cầm bút viết, cầm thìa ăn cơm, việc gì cũng giỏi!" Tay Trái im lặng. Một hôm, Tay Phải bị đau, phải băng lại. Tay Trái cố gắng cầm thìa, cầm bút bằng những ngón tay còn vụng. Lúc buộc dây giày, Tay Trái loay hoay mãi mới xong. Tay Phải hiểu ra: "Thì ra bạn cũng vất vả lắm. Từ nay chúng mình cùng làm nhé!"',
    [['Tay Phải hay khoe điều gì?', ['mình làm việc gì cũng giỏi', 'mình đẹp nhất', 'mình khoẻ nhất'], 'mình làm việc gì cũng giỏi', 1, 'Tay Phải khoe làm việc gì cũng giỏi.'],
      ['Khi Tay Phải bị đau, Tay Trái làm gì?', ['cố gắng cầm thìa, cầm bút', 'nằm nghỉ', 'cười chê Tay Phải'], 'cố gắng cầm thìa, cầm bút', 2, 'Tay Trái cố gắng làm thay Tay Phải.'],
      ['Trong câu "Tay Trái cầm bút bằng những ngón tay còn vụng.", bộ phận nào trả lời câu hỏi Bằng gì?', ['bằng những ngón tay còn vụng', 'Tay Trái', 'cầm bút'], 'bằng những ngón tay còn vụng', 3, 'Bộ phận bắt đầu bằng "bằng" trả lời câu hỏi Bằng gì?'],
      ['Câu chuyện khuyên em điều gì?', ['Không nên khoe khoang; cần biết hợp tác, giúp đỡ nhau', 'Chỉ nên dùng tay phải', 'Không cần làm việc'], 'Không nên khoe khoang; cần biết hợp tác, giúp đỡ nhau', 4, 'Hai bàn tay cùng làm thì việc gì cũng xong.']]),
  W(25, 'bh', 'Bài 13–14', 'Mèo đi câu cá; Học nghề', 'Dấu gạch ngang, dấu ngoặc kép; phân biệt s/x, v/d', 'nghenghiep', ['gachngang', 'ngoackep'], ['s/x', 'v/d'],
    'Cậu bé học làm gốm', 'Tèo theo ông nội học làm gốm. Lần đầu nặn bình, chiếc bình cứ méo xệch. Tèo nản lòng muốn bỏ. Ông bảo:\n– Ông cũng nặn hỏng cả trăm cái mới làm được bình đẹp đấy.\nTèo lại kiên nhẫn ngồi bên bàn xoay. Một tháng sau, Tèo nặn được chiếc bình nhỏ xinh. Ông khắc lên đáy bình dòng chữ "Tác phẩm đầu tay".',
    [['Tèo theo ông học nghề gì?', ['làm gốm', 'làm mộc', 'đan lát'], 'làm gốm', 1, 'Tèo theo ông nội học làm gốm.'],
      ['Lần đầu nặn bình, chuyện gì xảy ra?', ['chiếc bình bị méo', 'chiếc bình rất đẹp', 'Tèo làm vỡ bàn xoay'], 'chiếc bình bị méo', 2, 'Chiếc bình cứ méo xệch.'],
      ['Dấu ngoặc kép trong "Tác phẩm đầu tay" dùng để làm gì?', ['đánh dấu dòng chữ được khắc', 'đánh dấu câu hỏi', 'liệt kê'], 'đánh dấu dòng chữ được khắc', 3, 'Dấu ngoặc kép đánh dấu dòng chữ trích ra.'],
      ['Lời ông nói giúp Tèo hiểu điều gì?', ['Phải kiên trì, không nản khi thất bại', 'Làm gốm rất dễ', 'Nên bỏ cuộc sớm'], 'Phải kiên trì, không nản khi thất bại', 4, 'Ông cũng phải làm hỏng nhiều lần mới thành công.']]),
  W(26, 'bh', 'Bài 15–16', 'Ngày như thế nào là đẹp?; A lô, tớ đây', 'Mở rộng vốn từ về giao tiếp; câu kể, câu hỏi; phân biệt r/d/gi, dấu hỏi/dấu ngã', 'giaotiep', ['kieucau4'], ['r/d/gi', 'hỏi/ngã'],
    'Cuộc gọi cho bà', 'Bà ngoại ở xa, lâu lắm Minh chưa được gặp. Chủ nhật, Minh xin mẹ gọi điện cho bà. Minh chào: "Cháu chào bà ạ! Bà có khoẻ không ạ?" Bà mừng rỡ hỏi han đủ chuyện. Minh kể về điểm mười môn Toán, về chú mèo mới đẻ. Trước khi tắt máy, Minh dặn: "Bà nhớ giữ gìn sức khoẻ nhé!" Bà cười, bảo nghe giọng cháu là thấy khoẻ hẳn ra.',
    [['Minh gọi điện cho ai?', ['bà ngoại', 'bố', 'cô giáo'], 'bà ngoại', 1, 'Minh xin mẹ gọi điện cho bà ngoại.'],
      ['Minh kể cho bà nghe những chuyện gì?', ['điểm mười môn Toán, chú mèo mới đẻ', 'chuyến du lịch', 'bộ phim mới'], 'điểm mười môn Toán, chú mèo mới đẻ', 2, 'Minh kể về điểm mười và chú mèo.'],
      ['Câu "Bà có khoẻ không ạ?" là kiểu câu gì?', ['câu hỏi', 'câu kể', 'câu cảm'], 'câu hỏi', 3, 'Câu dùng để hỏi, có dấu chấm hỏi.'],
      ['Cách nói chuyện của Minh cho thấy điều gì?', ['Minh lễ phép, quan tâm đến bà', 'Minh nói chuyện cộc lốc', 'Minh không thích nói chuyện'], 'Minh lễ phép, quan tâm đến bà', 4, 'Minh chào hỏi lễ phép, dặn bà giữ sức khoẻ.']]),
  W(27, 'on', 'Ôn tập giữa học kì 2', 'Ôn tập các bài đọc tuần 19–26', 'Ôn từ cùng nghĩa, so sánh, dấu câu, câu hỏi Khi nào? Ở đâu? Bằng gì?', 'tunhien', ['giongnghia', 'sosanh', 'gachngang', 'ngoackep', 'khinao', 'odau', 'banggi'], ['s/x', 'r/d/gi', 'l/n', 'hỏi/ngã'],
    'Vườn rau của lớp', 'Đầu xuân, lớp 3C được nhận một mảnh vườn nhỏ sau trường. Các bạn chia nhau cuốc đất, gieo hạt, tưới nước bằng những chiếc bình nhỏ. Mấy hôm sau, mầm rau nhú lên xanh mướt như những chiếc kim. Giờ ra chơi, cả lớp lại ra thăm vườn. Cuối tháng, rau cải đã lớn. Lớp mang rau tặng bếp ăn của trường. Cô giáo khen: "Các em thật giỏi!"',
    [['Lớp 3C được nhận mảnh vườn khi nào?', ['đầu xuân', 'cuối hè', 'giữa đông'], 'đầu xuân', 1, '"Đầu xuân" chỉ thời gian.'],
      ['Mầm rau được so sánh với gì?', ['những chiếc kim', 'những ngôi sao', 'những chiếc lá'], 'những chiếc kim', 2, 'Mầm rau nhú lên xanh mướt như những chiếc kim.'],
      ['Các bạn tưới nước bằng gì?', ['những chiếc bình nhỏ', 'vòi phun', 'xô lớn'], 'những chiếc bình nhỏ', 3, 'Bộ phận "bằng những chiếc bình nhỏ" trả lời câu hỏi Bằng gì?'],
      ['Việc mang rau tặng bếp ăn cho thấy điều gì?', ['Các bạn biết chia sẻ thành quả lao động', 'Các bạn không thích rau', 'Rau bị hỏng'], 'Các bạn biết chia sẻ thành quả lao động', 4, 'Các bạn trồng rau rồi tặng bếp ăn chung của trường.']]),
  W(28, 'dn', 'Bài 17–18', 'Đất nước là gì?; Núi quê tôi', 'Từ ngữ có nghĩa giống nhau; biện pháp so sánh; phân biệt ch/tr, ươc/ươt', 'datnuoc', ['giongnghia', 'sosanh'], ['ch/tr', 'ươc/ươt'],
    'Dải đất hình chữ S', 'Trên bản đồ, nước ta có hình chữ S, uốn mình bên bờ biển xanh. Phía bắc có những dãy núi cao, mùa đông sương giá. Miền Trung có những đèo cao, bãi biển dài cát trắng. Phía nam có những cánh đồng lúa mênh mông và dòng sông Cửu Long chín nhánh. Đi đâu cũng gặp những con người cần cù, hiếu khách. Em yêu biết bao Tổ quốc mình!',
    [['Trên bản đồ, nước ta có hình gì?', ['hình chữ S', 'hình tròn', 'hình vuông'], 'hình chữ S', 1, 'Nước ta có hình chữ S.'],
      ['Miền nào có những cánh đồng lúa mênh mông và sông Cửu Long?', ['miền Nam', 'miền Bắc', 'miền Trung'], 'miền Nam', 2, 'Phía nam có cánh đồng lúa mênh mông và sông Cửu Long.'],
      ['Từ nào có nghĩa giống "Tổ quốc"?', ['đất nước', 'quê nhà', 'làng xóm'], 'đất nước', 3, '"Tổ quốc" và "đất nước" có nghĩa giống nhau.'],
      ['Câu cuối bài thể hiện tình cảm gì của bạn nhỏ?', ['tình yêu, niềm tự hào về đất nước', 'nỗi buồn', 'sự sợ hãi'], 'tình yêu, niềm tự hào về đất nước', 4, '"Em yêu biết bao Tổ quốc mình!" là câu cảm thể hiện tình yêu đất nước.']]),
  W(29, 'dn', 'Bài 19–20', 'Sông Hương; Tiếng nước mình', 'Mở rộng vốn từ về đất nước; câu cảm, câu khiến; viết hoa tên riêng địa lí', 'datnuoc', ['kieucau4', 'diali'], ['s/x'],
    'Chợ nổi trên sông', 'Hè rồi, bố đưa Ngân về Cần Thơ thăm chợ nổi Cái Răng. Từ sáng sớm, hàng trăm chiếc ghe, chiếc xuồng đã tụ về trên sông. Ghe nào cũng chất đầy dưa hấu, xoài, khóm, bưởi. Người bán treo hàng lên cây sào cao để khách nhìn từ xa. Tiếng chào mời, tiếng cười nói rộn ràng cả khúc sông. Ngân thích thú: "Chợ trên sông vui quá bố ơi!"',
    [['Ngân được bố đưa đi thăm chợ nổi ở đâu?', ['Cần Thơ', 'Hà Nội', 'Đà Nẵng'], 'Cần Thơ', 1, 'Bố đưa Ngân về Cần Thơ thăm chợ nổi Cái Răng.'],
      ['Người bán treo hàng lên cây sào để làm gì?', ['để khách nhìn từ xa biết ghe bán gì', 'để phơi khô', 'để trang trí'], 'để khách nhìn từ xa biết ghe bán gì', 2, 'Treo hàng lên cao để khách nhìn từ xa.'],
      ['Chọn tất cả tên riêng địa lí có trong bài.', ['Cần Thơ', 'Cái Răng', 'dưa hấu', 'Ngân'], ['Cần Thơ', 'Cái Răng'], 3, 'Cần Thơ, Cái Răng là tên địa lí; Ngân là tên người.'],
      ['Chợ nổi cho thấy nét đặc biệt nào của miền sông nước?', ['Người dân mua bán trên ghe, xuồng ngay trên sông', 'Chợ họp trong nhà lớn', 'Không có ai mua bán'], 'Người dân mua bán trên ghe, xuồng ngay trên sông', 4, 'Miền Tây sông nước có chợ họp ngay trên sông.']]),
  W(30, 'dn', 'Bài 21–22', 'Nhà rông; Sự tích ông Đùng, bà Đùng', 'Dấu ngoặc kép, dấu gạch ngang; phân biệt s/x, dấu hỏi/dấu ngã', 'datnuoc', ['ngoackep', 'gachngang'], ['s/x', 'hỏi/ngã'],
    'Ngôi nhà chung của buôn', 'Giữa buôn làng Tây Nguyên có một ngôi nhà rông cao vút. Mái nhà nhọn như lưỡi rìu dựng ngược lên trời. Nhà rông là nơi dân làng họp bàn việc chung, tổ chức lễ hội. Tối tối, các cụ già kể cho con cháu nghe sự tích của buôn. Già làng thường nói: "Nhà rông là trái tim của buôn làng." Ai đi xa trở về cũng ghé nhà rông đầu tiên.',
    [['Nhà rông ở vùng nào?', ['Tây Nguyên', 'đồng bằng Bắc Bộ', 'ven biển'], 'Tây Nguyên', 1, 'Nhà rông ở buôn làng Tây Nguyên.'],
      ['Mái nhà rông được so sánh với gì?', ['lưỡi rìu dựng ngược', 'cánh chim', 'chiếc nón'], 'lưỡi rìu dựng ngược', 2, 'Mái nhà nhọn như lưỡi rìu dựng ngược.'],
      ['Dấu ngoặc kép trong câu già làng nói dùng để làm gì?', ['đánh dấu lời nói trực tiếp của già làng', 'đánh dấu tên bài hát', 'liệt kê'], 'đánh dấu lời nói trực tiếp của già làng', 3, 'Lời nói trực tiếp đặt trong dấu ngoặc kép.'],
      ['Vì sao già làng gọi nhà rông là "trái tim của buôn làng"?', ['Vì đó là nơi sinh hoạt chung, gắn kết mọi người', 'Vì nhà rông hình trái tim', 'Vì nhà rông màu đỏ'], 'Vì đó là nơi sinh hoạt chung, gắn kết mọi người', 4, 'Mọi việc chung của buôn đều diễn ra ở nhà rông.']]),
  W(31, 'dn', 'Bài 23–24', 'Hai Bà Trưng; Cùng Bác qua suối', 'Mở rộng vốn từ về lễ hội; dấu ngoặc kép, dấu gạch ngang; phân biệt ch/tr, ai/ay', 'lehoi', ['ngoackep', 'gachngang'], ['ch/tr', 'ai/ay'],
    'Hội đua thuyền', 'Mùa xuân, làng em mở hội đua thuyền trên sông. Từ sáng sớm, hai bên bờ đã chật kín người xem. Mỗi đội có một chiếc thuyền dài, sơn đủ màu sắc. Tiếng trống thúc giục "tùng, tùng, tùng". Các tay chèo đều tăm tắp, thuyền lướt nhanh như tên bắn. Tiếng hò reo vang dậy cả khúc sông. Đội thắng cuộc được trao lá cờ đỏ thắm.',
    [['Hội đua thuyền được tổ chức vào mùa nào?', ['mùa xuân', 'mùa hè', 'mùa đông'], 'mùa xuân', 1, 'Mùa xuân, làng em mở hội đua thuyền.'],
      ['Thuyền lướt nhanh được so sánh với gì?', ['tên bắn', 'gió thổi', 'chim bay'], 'tên bắn', 2, 'Thuyền lướt nhanh như tên bắn.'],
      ['Chọn tất cả từ ngữ về lễ hội có trong bài.', ['đua thuyền', 'tiếng trống', 'hò reo', 'bàn học'], ['đua thuyền', 'tiếng trống', 'hò reo'], 3, '"bàn học" không liên quan đến lễ hội.'],
      ['Hội đua thuyền thể hiện điều gì?', ['Tinh thần đoàn kết, niềm vui chung của cả làng', 'Sự buồn bã', 'Việc học tập'], 'Tinh thần đoàn kết, niềm vui chung của cả làng', 4, 'Các tay chèo đồng lòng, cả làng cùng hò reo cổ vũ.']]),
  W(32, 'td', 'Bài 25–26', 'Ngọn lửa Ô-lim-pích; Rô-bốt ở quanh ta', 'Viết hoa tên riêng nước ngoài; dấu hai chấm, dấu phẩy; đặt và trả lời câu hỏi Để làm gì?', 'traidat', ['nuocngoai', 'haicham', 'dauphay', 'delamgi'], [],
    'Chú rô-bốt nhặt rác', 'Ở công viên gần nhà Huy mới có một chú rô-bốt nhặt rác. Chú cao bằng một bạn lớp ba, có hai tay kẹp và một cái thùng trên lưng. Chú đi chầm chậm, nhặt vỏ chai, túi ni lông bỏ vào thùng. Huy hỏi bố: "Người ta làm rô-bốt để làm gì hả bố?" Bố đáp: "Để giúp con người làm việc và giữ môi trường sạch đẹp." Huy tự nhủ: mình cũng sẽ không vứt rác bừa bãi.',
    [['Chú rô-bốt làm việc gì?', ['nhặt rác trong công viên', 'tưới cây', 'bán hàng'], 'nhặt rác trong công viên', 1, 'Chú rô-bốt nhặt rác ở công viên.'],
      ['Chú rô-bốt có những bộ phận nào?', ['hai tay kẹp và một cái thùng trên lưng', 'bốn bánh xe và cái loa', 'đôi cánh'], 'hai tay kẹp và một cái thùng trên lưng', 2, 'Chú có hai tay kẹp và một cái thùng trên lưng.'],
      ['Theo bố, người ta làm rô-bốt để làm gì?', ['để giúp con người làm việc, giữ môi trường sạch đẹp', 'để làm đồ chơi', 'để trang trí'], 'để giúp con người làm việc, giữ môi trường sạch đẹp', 3, 'Câu trả lời của bố trả lời câu hỏi "Để làm gì?".'],
      ['Huy học được điều gì?', ['Tự mình giữ gìn vệ sinh, không vứt rác bừa bãi', 'Để rô-bốt làm hết mọi việc', 'Vứt rác đâu cũng được'], 'Tự mình giữ gìn vệ sinh, không vứt rác bừa bãi', 4, 'Huy tự nhủ sẽ không vứt rác bừa bãi.']]),
  W(33, 'td', 'Bài 27–28', 'Thư của ông Trái Đất gửi các bạn nhỏ; Những điều nhỏ tớ làm cho Trái Đất', 'Ôn tập các dấu câu, các kiểu câu đã học; phân biệt r/d/gi, dấu hỏi/dấu ngã', 'traidat', ['kieucau4', 'haicham', 'daucau'], ['r/d/gi', 'hỏi/ngã'],
    'Những việc nhỏ của Mai', 'Mai muốn bảo vệ Trái Đất bằng những việc nhỏ. Đánh răng xong, Mai khoá vòi nước ngay. Ra khỏi phòng, Mai tắt đèn, tắt quạt. Đi chợ với mẹ, Mai mang theo làn nhựa thay cho túi ni lông. Mai còn rủ các bạn trồng cây xanh ở góc sân trường. Mai bảo: "Mỗi người một việc nhỏ, Trái Đất sẽ xanh hơn!"',
    [['Đánh răng xong, Mai làm gì?', ['khoá vòi nước ngay', 'để nước chảy', 'đi ngủ'], 'khoá vòi nước ngay', 1, 'Mai khoá vòi nước ngay.'],
      ['Đi chợ, Mai mang theo gì?', ['làn nhựa thay cho túi ni lông', 'nhiều túi ni lông', 'xe đạp'], 'làn nhựa thay cho túi ni lông', 2, 'Mai mang làn nhựa thay cho túi ni lông.'],
      ['Chọn tất cả việc làm tiết kiệm năng lượng, bảo vệ môi trường của Mai.', ['khoá vòi nước', 'tắt đèn khi ra khỏi phòng', 'trồng cây xanh', 'xem ti vi suốt ngày'], ['khoá vòi nước', 'tắt đèn khi ra khỏi phòng', 'trồng cây xanh'], 3, 'Xem ti vi suốt ngày không phải việc làm của Mai.'],
      ['Câu Mai nói muốn nhắn nhủ điều gì?', ['Ai cũng có thể góp phần bảo vệ Trái Đất bằng việc nhỏ', 'Chỉ người lớn mới bảo vệ được môi trường', 'Việc nhỏ không có ích'], 'Ai cũng có thể góp phần bảo vệ Trái Đất bằng việc nhỏ', 4, '"Mỗi người một việc nhỏ, Trái Đất sẽ xanh hơn!"']]),
  W(34, 'td', 'Bài 29–30', 'Bác sĩ Y-éc-xanh; Một mái nhà chung', 'Viết hoa tên riêng nước ngoài; mở rộng vốn từ về Trái Đất; ôn các kiểu câu', 'traidat', ['nuocngoai', 'kieucau4'], [],
    'Người bạn đến từ xa', 'Lớp em đón một vị khách đặc biệt: cô Ma-ri-a đến từ nước Ý. Cô là nhà khoa học nghiên cứu về các loài chim. Cô kể rằng có những loài chim bay hàng nghìn ki-lô-mét qua nhiều nước để tránh rét. Cô nói: "Bầu trời không có biên giới. Trái Đất là mái nhà chung của muôn loài." Cả lớp vỗ tay. Em mơ ước lớn lên cũng sẽ đi khắp nơi tìm hiểu thiên nhiên.',
    [['Cô Ma-ri-a đến từ nước nào?', ['nước Ý', 'nước Pháp', 'nước Nhật'], 'nước Ý', 1, 'Cô Ma-ri-a đến từ nước Ý.'],
      ['Cô Ma-ri-a nghiên cứu về gì?', ['các loài chim', 'các loài cá', 'các loại cây'], 'các loài chim', 2, 'Cô nghiên cứu về các loài chim.'],
      ['Tên "Ma-ri-a" được viết như thế nào?', ['viết hoa chữ đầu, các tiếng nối bằng gạch nối', 'viết thường toàn bộ', 'viết liền không gạch nối'], 'viết hoa chữ đầu, các tiếng nối bằng gạch nối', 3, 'Tên riêng nước ngoài phiên âm: viết hoa chữ cái đầu, các tiếng nối bằng gạch nối.'],
      ['Câu "Trái Đất là mái nhà chung của muôn loài." có ý nghĩa gì?', ['Mọi người, mọi loài cùng sống chung nên phải cùng bảo vệ Trái Đất', 'Trái Đất có mái nhà', 'Chỉ con người sống trên Trái Đất'], 'Mọi người, mọi loài cùng sống chung nên phải cùng bảo vệ Trái Đất', 4, 'Trái Đất là nơi sống chung của muôn loài.']]),
  W(35, 'on', 'Ôn tập cuối năm', 'Ôn tập các bài đọc học kì 2', 'Ôn tập từ ngữ, câu, dấu câu, biện pháp so sánh, chính tả cả năm', 'traidat', ['kieucau4', 'sosanh', 'giongnghia', 'trainghia', 'ngoackep', 'gachngang', 'khinao', 'odau', 'banggi', 'delamgi'], ['ch/tr', 'r/d/gi', 's/x', 'l/n', 'hỏi/ngã'],
    'Lá thư gửi lớp Ba', 'Ngày cuối năm học, cô giáo đọc cho cả lớp nghe lá thư của bạn Nhật, người đã chuyển trường. Nhật viết: "Tớ nhớ các cậu lắm! Nhớ những giờ ra chơi đá cầu, những buổi trồng cây ở vườn trường." Cả lớp lặng đi. Rồi lớp trưởng đề nghị: "Chúng mình cùng viết thư trả lời Nhật nhé!" Mỗi bạn viết một dòng. Lá thư dài như một dải lụa nhiều màu sắc.',
    [['Ai viết thư gửi cả lớp?', ['bạn Nhật', 'cô giáo', 'lớp trưởng'], 'bạn Nhật', 1, 'Bạn Nhật, người đã chuyển trường, viết thư.'],
      ['Trong thư, Nhật nhớ những gì?', ['giờ ra chơi đá cầu, buổi trồng cây ở vườn trường', 'các bài kiểm tra', 'bữa ăn ở nhà'], 'giờ ra chơi đá cầu, buổi trồng cây ở vườn trường', 2, 'Nhật nhớ giờ ra chơi đá cầu, những buổi trồng cây.'],
      ['Lá thư trả lời được so sánh với gì?', ['một dải lụa nhiều màu sắc', 'một con đường', 'một bông hoa'], 'một dải lụa nhiều màu sắc', 3, 'Lá thư dài như một dải lụa nhiều màu sắc.'],
      ['Việc cả lớp cùng viết thư trả lời cho thấy điều gì?', ['Tình bạn gắn bó, các bạn luôn nhớ đến nhau', 'Các bạn đã quên Nhật', 'Cô giáo bắt các bạn viết'], 'Tình bạn gắn bó, các bạn luôn nhớ đến nhau', 4, 'Mỗi bạn góp một dòng thể hiện tình cảm với Nhật.']]),
];

const ORDER: Record<number, string[]> = { 3: ['Đập trứng vào bát', 'Thêm muối, đánh đều', 'Đổ trứng vào chảo', 'Lật trứng'] };

const read = (w: TV3Week, q: string) => `Đọc bài "${w.title}":\n${w.text}\n\n${q}`;
const outcomeFor = (lv: Level) => (lv >= 4 ? 'V3.DOC.03' : lv >= 3 ? 'V3.DOC.02' : 'V3.DOC.01');

function readingQs(w: TV3Week): ContentQuestion[] {
  return w.qs.map(([prompt, options, correct, level, e]) => {
    const m = { o: outcomeFor(level), f: 'TV.DOCHIEU', l: level, e, s: level >= 3 ? e : undefined };
    if (correct === 'order') {
      const order = ORDER[w.week];
      return { type: 'ordering', prompt: read(w, prompt), options: [...order], key: { order }, explanation: e, solution: m.s, level, outcome: 'V3.DOC.01', form: 'TV.DOCHIEU' } as ContentQuestion;
    }
    if (Array.isArray(correct)) return mc(read(w, prompt), options, correct, { ...m, o: 'V3.TU.04', f: 'TV.TUNGU' });
    if (!options.length) return tf(read(w, prompt), correct as 'Đúng' | 'Sai', m);
    return sc(read(w, prompt), options, correct, m);
  });
}

/** Câu luyện từ – câu – chính tả của tuần, rút từ bộ sinh câu (chỉ dạng hiển thị được không cần tranh) */
function practiceQs(w: TV3Week): ContentQuestion[] {
  const ctx: TV3Ctx = { ...w.ctx, week: w.week };
  const pool = tv3Pool(ctx.focus);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  ([1, 2, 4, 5] as Level[]).forEach((lv, slot) => {
    const r = makeRng(w.week * 6011 + slot * 7927 + 30);
    for (let i = 0; i < 200; i++) {
      const q: PracticeQuestion | null = r.pick(pool[lv])(r, ctx, lv);
      if (!q || q.figure || q.type === 'fill_blanks' || q.type === 'true_false_table' || seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(q);
      return;
    }
  });
  return out;
}

const lesson = (w: TV3Week): ContentLesson => ({
  id: `tv3-kntt-t${String(w.week).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 3,
  semester: w.week <= 18 ? 1 : 2,
  book: BOOK,
  ref: `Tuần ${w.week} · ${w.bai}`,
  unit: { code: `KNTT.V3.${w.topic}`, title: w.topic === 'on' ? 'Ôn tập' : `Chủ điểm: ${TV3_TOPICS[w.topic]}` },
  topicCode: 'V3.DOC',
  title: `Tuần ${w.week}. ${w.topic === 'on' ? w.bai : w.title}`,
  description: `Sách: ${w.readings}. Luyện tập: ${w.practice}.`,
  scope: SCOPE,
  questions: [...readingQs(w), ...practiceQs(w)].sort((a, b) => a.level - b.level),
});

export const TV3_HK1: ContentLesson[] = TV3_WEEKS.filter((w) => w.week <= 18).map(lesson);
export const TV3_HK2: ContentLesson[] = TV3_WEEKS.filter((w) => w.week > 18).map(lesson);
export const tv3Ctx = (week: number): TV3Ctx => {
  const w = TV3_WEEKS.find((x) => x.week === week)!;
  return { ...w.ctx, week };
};
export const tv3WeekPool = (week: number) => tv3Pool(tv3Ctx(week).focus);
