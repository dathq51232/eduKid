// TIẾNG VIỆT 4 — 35 tuần theo mục lục sách Tiếng Việt 4 (Kết nối tri thức): HK1 tuần 1–18, HK2 tuần 19–35.
// Mỗi tuần: một BÀI ĐỌC DO EDUCHAIN KIDS TỰ VIẾT theo chủ điểm của tuần (không chép bài đọc của sách) kèm 4 câu đọc hiểu,
// và câu luyện từ và câu rút từ bộ sinh câu lớp 4 (practice/tv4g.ts) theo đúng nội dung luyện tập của tuần.

import { makeRng } from '../practice/rng';
import { tv4Pool, type TV4Ctx, type TV4Focus, type TV4Theme } from '../practice/tv4g';
import type { PracticeQuestion } from '../practice/kit';
import { mc, sc, type ContentLesson, type ContentQuestion, type Level } from './types';

const BOOK = 'Kết nối tri thức';
const SCOPE = { kind: 'viet2', grade: 4 } as const;

export const TV4_TOPICS: Record<string, string> = {
  mn: 'Mỗi người một vẻ', tn: 'Trải nghiệm và khám phá', st: 'Niềm vui sáng tạo', um: 'Chắp cánh ước mơ',
  yt: 'Sống để yêu thương', ng: 'Uống nước nhớ nguồn', qh: 'Quê hương trong tôi', by: 'Vì một thế giới bình yên', on: 'Ôn tập',
};

type Q4 = [prompt: string, options: string[], correct: string | string[], level: Level, explanation: string];
export type TV4Week = { week: number; topic: keyof typeof TV4_TOPICS; bai: string; readings: string; practice: string; ctx: Omit<TV4Ctx, 'week'>; title: string; text: string; qs: Q4[] };
const W = (week: number, topic: TV4Week['topic'], bai: string, readings: string, practice: string, theme: TV4Theme, focus: TV4Focus[], title: string, text: string, qs: Q4[]): TV4Week =>
  ({ week, topic, bai, readings, practice, ctx: { theme, focus }, title, text, qs });

export const TV4_WEEKS: TV4Week[] = [
  // ======================================== HỌC KÌ 1
  W(1, 'mn', 'Bài 1–2', 'Điều kì diệu; Thi nhạc', 'Danh từ', 'moinguoi', ['danhtu'],
    'Những giọng hát khác nhau', 'Lớp 4A chuẩn bị cho buổi văn nghệ. Cô giáo cho mỗi bạn hát thử một đoạn. Giọng Lan trong veo như tiếng suối. Giọng Hùng trầm ấm. Giọng Mai cao vút, còn Tuấn hát hơi run vì ngại. Cô mỉm cười: "Mỗi em một giọng, nhưng khi hoà vào nhau sẽ thành một dàn đồng ca thật đẹp." Cả lớp tập luyện suốt hai tuần. Đến ngày biểu diễn, tiếng hát của cả lớp vang lên hài hoà, ai nghe cũng vỗ tay. Tuấn không còn run nữa, cậu hát to và tự tin.',
    [['Giọng hát của Lan được so sánh với gì?', ['tiếng suối', 'tiếng sáo', 'tiếng chim'], 'tiếng suối', 1, 'Giọng Lan trong veo như tiếng suối.'],
      ['Vì sao lúc đầu Tuấn hát hơi run?', ['vì ngại', 'vì bị ốm', 'vì quên lời'], 'vì ngại', 2, 'Tuấn hát hơi run vì ngại.'],
      ['Theo cô giáo, vì sao những giọng hát khác nhau vẫn tạo thành dàn đồng ca đẹp?', ['Vì khi hoà vào nhau, mỗi giọng góp một vẻ riêng', 'Vì các bạn hát giống hệt nhau', 'Vì có đàn đệm'], 'Vì khi hoà vào nhau, mỗi giọng góp một vẻ riêng', 3, 'Mỗi người một vẻ, cùng nhau tạo nên sự hài hoà.'],
      ['Câu chuyện muốn nói điều gì?', ['Mỗi người có nét riêng, cùng nhau sẽ làm nên điều tốt đẹp', 'Chỉ người hát hay mới được biểu diễn', 'Không nên hát khi còn ngại'], 'Mỗi người có nét riêng, cùng nhau sẽ làm nên điều tốt đẹp', 4, 'Sự khác biệt của mỗi người làm tập thể thêm phong phú.']]),
  W(2, 'mn', 'Bài 3–4', 'Anh em sinh đôi; Công chúa và người dẫn chuyện', 'Danh từ chung, danh từ riêng', 'moinguoi', ['danhtu', 'dtrieng'],
    'Hai anh em sinh đôi', 'Nam và Việt là anh em sinh đôi, giống nhau như hai giọt nước. Thầy cô thường gọi nhầm tên hai bạn. Nhưng tính nết hai anh em lại khác hẳn. Nam thích đọc sách, ít nói, hay ngồi vẽ bản đồ. Việt hiếu động, mê đá bóng và rất giỏi kể chuyện cười. Có lần trường tổ chức thi tìm hiểu về Hà Nội, Nam lo phần kiến thức, Việt lo thuyết trình. Đội của hai anh em giành giải nhất. Từ đó, cả lớp không còn chỉ nhìn khuôn mặt để phân biệt hai bạn nữa.',
    [['Nam và Việt giống nhau ở điểm nào?', ['khuôn mặt', 'tính nết', 'sở thích'], 'khuôn mặt', 1, 'Hai anh em giống nhau như hai giọt nước về hình dáng.'],
      ['Việt có tính nết thế nào?', ['hiếu động, mê đá bóng, giỏi kể chuyện cười', 'ít nói, thích đọc sách', 'nhút nhát'], 'hiếu động, mê đá bóng, giỏi kể chuyện cười', 2, 'Việt hiếu động, mê đá bóng và giỏi kể chuyện cười.'],
      ['Chọn tất cả danh từ riêng có trong bài.', ['Nam', 'Việt', 'Hà Nội', 'bản đồ'], ['Nam', 'Việt', 'Hà Nội'], 3, '"bản đồ" là danh từ chung; tên người, tên địa danh là danh từ riêng.'],
      ['Vì sao đội của hai anh em giành giải nhất?', ['Vì mỗi người phát huy điểm mạnh riêng của mình', 'Vì hai bạn giống nhau', 'Vì cô giáo giúp'], 'Vì mỗi người phát huy điểm mạnh riêng của mình', 4, 'Nam lo kiến thức, Việt lo thuyết trình: mỗi người một thế mạnh.']]),
  W(3, 'mn', 'Bài 5–6', 'Thằn lằn xanh và tắc kè; Nghệ sĩ trống', 'Luyện tập về danh từ', 'moinguoi', ['danhtu', 'dtrieng'],
    'Cô bé đánh trống', 'Thảo là cô bé nhỏ nhất đội nghi thức của trường. Nhiều người nghĩ em không thể đánh trống. Thảo không nản. Chiều nào em cũng ở lại sân trường tập gõ nhịp lên mặt ghế. Đôi tay em có lúc mỏi nhừ nhưng em vẫn kiên trì. Đến lễ khai giảng, tiếng trống của Thảo vang lên rộn rã, đều tay. Thầy hiệu trưởng khen: "Em nhỏ người nhưng có trái tim của một nghệ sĩ thực thụ!"',
    [['Thảo là ai trong đội nghi thức?', ['cô bé nhỏ nhất đội', 'đội trưởng', 'người lớn tuổi nhất'], 'cô bé nhỏ nhất đội', 1, 'Thảo là cô bé nhỏ nhất đội nghi thức.'],
      ['Thảo tập luyện như thế nào?', ['chiều nào cũng ở lại tập gõ nhịp', 'chỉ tập vào ngày lễ', 'không tập'], 'chiều nào cũng ở lại tập gõ nhịp', 2, 'Chiều nào em cũng ở lại sân trường tập.'],
      ['Chọn tất cả danh từ có trong câu "Đôi tay em có lúc mỏi nhừ."', ['tay', 'mỏi nhừ', 'có'], ['tay'], 3, '"tay" là danh từ; "mỏi nhừ" là tính từ; "có" là động từ.'],
      ['Câu khen của thầy hiệu trưởng cho thấy điều gì?', ['Sự kiên trì giúp Thảo vượt qua giới hạn của bản thân', 'Thảo cao lớn nhất đội', 'Thảo không cần tập'], 'Sự kiên trì giúp Thảo vượt qua giới hạn của bản thân', 4, 'Nhỏ người nhưng nhờ kiên trì, Thảo đánh trống rất hay.']]),
  W(4, 'mn', 'Bài 7–8', 'Những bức chân dung; Đò ngang', 'Quy tắc viết tên cơ quan, tổ chức', 'moinguoi', ['coquan', 'dtrieng'],
    'Chuyến thăm Thư viện Quốc gia', 'Thứ bảy vừa rồi, lớp em được đến thăm Thư viện Quốc gia Việt Nam. Cô thủ thư dẫn chúng em đi qua những giá sách cao tới trần nhà. Cô kể thư viện lưu giữ hàng triệu cuốn sách, báo, có những cuốn đã hơn trăm năm tuổi. Chúng em được xem phòng đọc dành cho thiếu nhi và học cách tra cứu sách bằng máy tính. Lúc ra về, ai cũng mong được quay lại để đọc thật nhiều sách hay.',
    [['Lớp em đến thăm nơi nào?', ['Thư viện Quốc gia Việt Nam', 'Bảo tàng Lịch sử', 'Nhà văn hoá Thiếu nhi'], 'Thư viện Quốc gia Việt Nam', 1, 'Lớp em đến thăm Thư viện Quốc gia Việt Nam.'],
      ['Thư viện lưu giữ những gì?', ['hàng triệu cuốn sách, báo', 'đồ cổ', 'tranh vẽ'], 'hàng triệu cuốn sách, báo', 2, 'Thư viện lưu giữ hàng triệu cuốn sách, báo.'],
      ['Vì sao "Thư viện Quốc gia Việt Nam" được viết hoa các chữ cái đầu?', ['Vì đó là tên một cơ quan', 'Vì đứng đầu câu', 'Vì là từ chỉ đồ vật'], 'Vì đó là tên một cơ quan', 3, 'Tên cơ quan, tổ chức viết hoa chữ cái đầu của mỗi bộ phận tạo thành tên.'],
      ['Chuyến tham quan giúp các bạn điều gì?', ['Thêm yêu sách và biết cách tra cứu', 'Biết cách làm giá sách', 'Không còn thích đọc sách'], 'Thêm yêu sách và biết cách tra cứu', 4, 'Ai cũng mong quay lại đọc sách, lại học được cách tra cứu.']]),
  W(5, 'tn', 'Bài 9–10', 'Bầu trời trong quả trứng; Tiếng nói của cỏ cây', 'Động từ', 'trainghiem', ['dongtu'],
    'Quả trứng nở', 'Bà cho Minh xem ổ trứng gà sắp nở. Minh hồi hộp ngồi canh suốt buổi sáng. Bỗng một quả trứng khẽ rung. Từ bên trong, chiếc mỏ nhỏ xíu mổ "cốc, cốc" vào vỏ. Vỏ trứng nứt dần. Rồi một chú gà con ướt lông chui ra, run run đứng dậy. Chỉ một lúc sau, lông chú khô, xù lên như cục bông vàng. Chú kêu "chiếp chiếp", lạch bạch chạy theo gà mẹ. Minh reo lên: "Bà ơi, cả một thế giới vừa mở ra trong quả trứng!"',
    [['Minh ngồi canh ổ trứng vào lúc nào?', ['buổi sáng', 'buổi tối', 'buổi trưa'], 'buổi sáng', 1, 'Minh ngồi canh suốt buổi sáng.'],
      ['Chú gà con mổ vào vỏ trứng bằng gì?', ['chiếc mỏ nhỏ xíu', 'đôi chân', 'đôi cánh'], 'chiếc mỏ nhỏ xíu', 2, 'Chiếc mỏ nhỏ xíu mổ "cốc, cốc" vào vỏ.'],
      ['Chọn tất cả động từ tả hoạt động của chú gà con.', ['chui ra', 'đứng dậy', 'chạy', 'vàng'], ['chui ra', 'đứng dậy', 'chạy'], 3, '"vàng" là tính từ; các từ còn lại chỉ hoạt động.'],
      ['Câu nói cuối của Minh thể hiện điều gì?', ['Sự ngạc nhiên, thích thú khi khám phá điều kì diệu của tự nhiên', 'Minh sợ gà con', 'Minh muốn ăn trứng'], 'Sự ngạc nhiên, thích thú khi khám phá điều kì diệu của tự nhiên', 4, 'Minh thấy cả một thế giới sự sống mở ra.']]),
  W(6, 'tn', 'Bài 11–12', 'Tập làm văn; Nhà phát minh 6 tuổi', 'Luyện tập về động từ', 'trainghiem', ['dongtu'],
    'Chiếc máy tưới cây của Bin', 'Bin rất thích các chậu hoa trên ban công nhưng hay quên tưới nước. Một hôm, Bin nghĩ ra cách: lấy chai nhựa cũ, đục mấy lỗ nhỏ ở nắp rồi cắm ngược chai đầy nước xuống chậu. Nước rỉ ra từng giọt, thấm dần vào đất. Mấy ngày sau, hoa vẫn tươi tốt. Bố khen Bin là "nhà phát minh nhí". Bin còn hướng dẫn các bạn trong lớp làm theo để tưới cây ở vườn trường.',
    [['Bin hay quên làm việc gì?', ['tưới nước cho cây', 'làm bài tập', 'dọn phòng'], 'tưới nước cho cây', 1, 'Bin hay quên tưới nước cho các chậu hoa.'],
      ['Bin làm máy tưới cây từ vật liệu gì?', ['chai nhựa cũ', 'ống tre', 'vỏ hộp sữa'], 'chai nhựa cũ', 2, 'Bin dùng chai nhựa cũ.'],
      ['Chọn tất cả động từ trong câu "Bin đục mấy lỗ nhỏ rồi cắm ngược chai xuống chậu."', ['đục', 'cắm', 'nhỏ', 'chậu'], ['đục', 'cắm'], 3, '"nhỏ" là tính từ, "chậu" là danh từ.'],
      ['Việc Bin hướng dẫn các bạn làm theo cho thấy điều gì?', ['Bin biết chia sẻ sáng kiến có ích', 'Bin muốn khoe khoang', 'Bin không thích làm một mình'], 'Bin biết chia sẻ sáng kiến có ích', 4, 'Bin chia sẻ cách làm để cùng tưới cây vườn trường.']]),
  W(7, 'tn', 'Bài 13–14', 'Con vẹt xanh; Chân trời cuối phố', 'Luyện tập về động từ', 'trainghiem', ['dongtu', 'tuloai'],
    'Đi tìm cuối con phố', 'Nhà Khang ở đầu một con phố dài. Khang thắc mắc: "Cuối phố có gì nhỉ?" Một sáng chủ nhật, bố dẫn Khang đi bộ đến tận cuối phố. Hai bố con đi qua tiệm bánh thơm phức, qua công viên có bầy chim bồ câu, qua cây cầu nhỏ bắc qua kênh. Cuối phố là một khu chợ hoa rực rỡ sắc màu. Khang hiểu ra: mỗi con đường đều cất giấu những điều thú vị, chỉ cần mình chịu khó khám phá.',
    [['Khang thắc mắc điều gì?', ['Cuối phố có gì', 'Tiệm bánh ở đâu', 'Vì sao chim bay'], 'Cuối phố có gì', 1, 'Khang thắc mắc: "Cuối phố có gì nhỉ?"'],
      ['Cuối phố có gì?', ['một khu chợ hoa', 'một trường học', 'một bến xe'], 'một khu chợ hoa', 2, 'Cuối phố là một khu chợ hoa rực rỡ.'],
      ['Từ nào trong bài là động từ?', ['khám phá', 'rực rỡ', 'tiệm bánh'], 'khám phá', 3, '"khám phá" chỉ hoạt động.'],
      ['Khang rút ra được điều gì?', ['Chịu khó khám phá sẽ thấy nhiều điều thú vị', 'Không nên đi xa nhà', 'Cuối phố chẳng có gì'], 'Chịu khó khám phá sẽ thấy nhiều điều thú vị', 4, 'Mỗi con đường đều cất giấu điều thú vị.']]),
  W(8, 'tn', 'Bài 15–16', 'Gặt chữ trên non; Trước ngày xa quê', 'Cách dùng và công dụng của từ điển', 'trainghiem', ['tudien'],
    'Cuốn từ điển của ông', 'Ông nội có một cuốn từ điển dày, bìa đã sờn. Một hôm, Hà gặp từ "kiên định" mà không hiểu nghĩa. Ông bảo Hà tự tra. Hà lật đến phần chữ K, rồi tìm theo thứ tự chữ cái tiếp theo: "ki", "kiê", "kiên"... Cuối cùng em tìm thấy: kiên định nghĩa là giữ vững ý định, không thay đổi. Ông cười: "Từ điển là người thầy không bao giờ mệt. Cháu càng tra nhiều, vốn từ càng giàu."',
    [['Hà gặp từ nào mà không hiểu nghĩa?', ['kiên định', 'kiên nhẫn', 'quyết tâm'], 'kiên định', 1, 'Hà gặp từ "kiên định".'],
      ['Để tìm từ, Hà lật đến phần chữ cái nào?', ['K', 'Đ', 'I'], 'K', 2, '"kiên định" bắt đầu bằng chữ K.'],
      ['Từ điển xếp các từ theo thứ tự nào?', ['thứ tự bảng chữ cái', 'từ ngắn đến dài', 'theo chủ đề'], 'thứ tự bảng chữ cái', 3, 'Hà tìm theo thứ tự chữ cái tiếp theo.'],
      ['Ông muốn khuyên Hà điều gì?', ['Chăm tra từ điển để giàu vốn từ', 'Không nên dùng từ điển', 'Hỏi ông mọi từ'], 'Chăm tra từ điển để giàu vốn từ', 4, '"Cháu càng tra nhiều, vốn từ càng giàu."']]),
  W(9, 'on', 'Ôn tập giữa học kì 1', 'Ôn tập các bài đọc tuần 1–8', 'Ôn danh từ, động từ, viết hoa tên cơ quan, từ điển', 'trainghiem', ['danhtu', 'dtrieng', 'dongtu', 'coquan', 'tudien'],
    'Hội chợ khoa học', 'Trường em tổ chức Hội chợ khoa học. Mỗi lớp mang đến một sản phẩm tự làm. Lớp 4B trưng bày mô hình ngôi nhà dùng pin mặt trời. Lớp 4C làm chiếc xe chạy bằng sức gió từ quả bóng bay. Các bạn say sưa giải thích cách hoạt động cho khách tham quan. Bác đại diện Hội Khuyến học của phường khen các bạn rất sáng tạo và trao phần thưởng cho tất cả các lớp.',
    [['Lớp 4B trưng bày sản phẩm gì?', ['mô hình ngôi nhà dùng pin mặt trời', 'xe chạy bằng sức gió', 'robot nhặt rác'], 'mô hình ngôi nhà dùng pin mặt trời', 1, 'Lớp 4B trưng bày mô hình ngôi nhà dùng pin mặt trời.'],
      ['Chiếc xe của lớp 4C chạy bằng gì?', ['sức gió từ quả bóng bay', 'pin', 'xăng'], 'sức gió từ quả bóng bay', 2, 'Xe chạy bằng sức gió từ quả bóng bay.'],
      ['"Hội Khuyến học" được viết hoa vì sao?', ['Vì là tên một tổ chức', 'Vì đứng đầu câu', 'Vì là danh từ chung'], 'Vì là tên một tổ chức', 3, 'Tên cơ quan, tổ chức viết hoa chữ cái đầu mỗi bộ phận.'],
      ['Hội chợ khoa học mang lại điều gì cho học sinh?', ['Khuyến khích tìm tòi, sáng tạo', 'Chỉ để vui chơi', 'Để bán hàng'], 'Khuyến khích tìm tòi, sáng tạo', 4, 'Các bạn tự làm sản phẩm và được khen sáng tạo.']]),
  W(10, 'st', 'Bài 17–18', 'Vẽ màu; Đồng cỏ nở hoa', 'Biện pháp nhân hoá', 'sangtao', ['nhanhoa'],
    'Hộp màu biết nói', 'Mai có một hộp bút màu mới. Đêm ấy, Mai mơ thấy các bút màu trò chuyện. Chị Xanh Lá khoe: "Tớ tô cho cánh đồng mượt mà." Anh Vàng tự hào: "Tớ làm cho ông mặt trời rạng rỡ." Bé Đỏ thì thầm: "Tớ nhuộm hồng đôi má em bé." Bác Đen lặng lẽ nói: "Thiếu tớ, bức tranh đêm chẳng có sao lấp lánh." Sáng hôm sau, Mai vẽ một bức tranh có đủ mọi màu. Mai hiểu rằng màu nào cũng đáng quý.',
    [['Chị Xanh Lá tô cho cái gì?', ['cánh đồng', 'mặt trời', 'đôi má em bé'], 'cánh đồng', 1, 'Chị Xanh Lá tô cho cánh đồng mượt mà.'],
      ['Trong giấc mơ, các bút màu làm gì?', ['trò chuyện với nhau', 'đánh nhau', 'bay đi'], 'trò chuyện với nhau', 2, 'Mai mơ thấy các bút màu trò chuyện.'],
      ['Các bút màu được nhân hoá bằng cách nào?', ['Được gọi bằng chị, anh, bé, bác và biết nói như người', 'Được tả màu sắc', 'Được so sánh với cây'], 'Được gọi bằng chị, anh, bé, bác và biết nói như người', 3, 'Gọi sự vật bằng từ chỉ người và cho chúng biết nói là nhân hoá.'],
      ['Mai hiểu ra điều gì?', ['Màu nào cũng đáng quý, mỗi màu góp một phần cho bức tranh', 'Chỉ màu đỏ là đẹp', 'Không cần màu đen'], 'Màu nào cũng đáng quý, mỗi màu góp một phần cho bức tranh', 4, 'Mai vẽ bức tranh có đủ mọi màu.']]),
  W(11, 'st', 'Bài 19–20', 'Thanh âm của núi; Bầu trời mùa thu', 'Luyện tập về biện pháp nhân hoá', 'sangtao', ['nhanhoa'],
    'Bầu trời mùa thu', 'Mùa thu, bầu trời như cao hơn, xanh hơn. Những đám mây trắng thong thả dạo chơi. Gió thu nhè nhẹ vuốt ve từng ngọn cây. Mấy chiếc lá vàng xoay tròn, nhảy múa rồi khẽ đáp xuống mặt hồ. Mặt hồ phẳng lặng soi bóng bầu trời như chiếc gương khổng lồ. Chiều về, ông mặt trời đỏ ửng, chậm rãi lặn sau rặng tre.',
    [['Mùa thu, bầu trời thế nào?', ['cao hơn, xanh hơn', 'thấp và xám', 'đầy mây đen'], 'cao hơn, xanh hơn', 1, 'Bầu trời như cao hơn, xanh hơn.'],
      ['Mặt hồ được so sánh với gì?', ['chiếc gương khổng lồ', 'tấm thảm xanh', 'đĩa bạc'], 'chiếc gương khổng lồ', 2, 'Mặt hồ soi bóng bầu trời như chiếc gương khổng lồ.'],
      ['Chọn tất cả hình ảnh nhân hoá trong bài.', ['mây thong thả dạo chơi', 'gió vuốt ve ngọn cây', 'lá vàng nhảy múa', 'mặt hồ phẳng lặng'], ['mây thong thả dạo chơi', 'gió vuốt ve ngọn cây', 'lá vàng nhảy múa'], 3, '"phẳng lặng" chỉ tả đặc điểm, không nhân hoá.'],
      ['Biện pháp nhân hoá giúp đoạn văn thế nào?', ['Cảnh vật sinh động, gần gũi như con người', 'Câu văn ngắn hơn', 'Dễ đếm số câu'], 'Cảnh vật sinh động, gần gũi như con người', 4, 'Nhân hoá làm sự vật có hoạt động, cảm xúc như người.']]),
  W(12, 'st', 'Bài 21–22', 'Làm thỏ con bằng giấy; Bức tường có nhiều phép lạ', 'Tính từ', 'sangtao', ['tinhtu'],
    'Bức tranh tường của lớp', 'Bức tường sau lớp học vốn cũ kĩ, loang lổ. Cô giáo gợi ý cả lớp cùng vẽ tranh lên tường. Các bạn chia nhau từng mảng: bầu trời xanh ngắt, cánh đồng vàng óng, dòng sông uốn lượn và những ngôi nhà nhỏ xinh. Ba tuần sau, bức tường trở nên rực rỡ, tươi vui. Ai đi qua cũng dừng lại ngắm. Các bạn thấy lớp học như rộng hơn, sáng hơn.',
    [['Lúc đầu bức tường thế nào?', ['cũ kĩ, loang lổ', 'mới tinh', 'trắng tinh'], 'cũ kĩ, loang lổ', 1, 'Bức tường vốn cũ kĩ, loang lổ.'],
      ['Các bạn vẽ những gì lên tường?', ['bầu trời, cánh đồng, dòng sông, ngôi nhà', 'con vật trong rừng', 'chân dung thầy cô'], 'bầu trời, cánh đồng, dòng sông, ngôi nhà', 2, 'Các bạn vẽ bầu trời, cánh đồng, dòng sông, ngôi nhà.'],
      ['Chọn tất cả tính từ có trong bài.', ['xanh ngắt', 'vàng óng', 'rực rỡ', 'bức tường'], ['xanh ngắt', 'vàng óng', 'rực rỡ'], 3, '"bức tường" là danh từ.'],
      ['Vì sao lớp học "như rộng hơn, sáng hơn"?', ['Vì bức tranh tường tươi vui làm không gian đẹp hơn', 'Vì lớp được xây thêm', 'Vì bật thêm đèn'], 'Vì bức tranh tường tươi vui làm không gian đẹp hơn', 4, 'Bức tranh rực rỡ làm lớp học sáng sủa, dễ chịu.']]),
  W(13, 'st', 'Bài 23–24', 'Bét-tô-ven và bản xô-nát Ánh trăng; Người tìm đường lên các vì sao', 'Luyện tập về tính từ', 'sangtao', ['tinhtu', 'tuloai'],
    'Ước mơ chế tạo tên lửa', 'Từ nhỏ, cậu bé Khoa đã mê bầu trời đầy sao. Cậu hay hỏi: "Làm sao để bay lên các vì sao?" Khoa đọc rất nhiều sách về thiên văn, tự làm những chiếc tên lửa bằng giấy, bằng ống nhựa. Nhiều lần tên lửa rơi ngay khi vừa bay lên. Khoa không nản, kiên trì sửa từng chi tiết. Cuối cùng, chiếc tên lửa nước của cậu bay cao hơn mái nhà. Khoa thầm hứa sẽ học thật giỏi để thực hiện ước mơ lớn.',
    [['Khoa mê điều gì từ nhỏ?', ['bầu trời đầy sao', 'đá bóng', 'trồng cây'], 'bầu trời đầy sao', 1, 'Khoa mê bầu trời đầy sao.'],
      ['Khoa làm tên lửa bằng những gì?', ['giấy, ống nhựa', 'gỗ, sắt', 'đất sét'], 'giấy, ống nhựa', 2, 'Khoa làm tên lửa bằng giấy, ống nhựa.'],
      ['Từ nào là tính từ chỉ tính nết của Khoa?', ['kiên trì', 'tên lửa', 'bay'], 'kiên trì', 3, '"kiên trì" chỉ tính chất, là tính từ.'],
      ['Câu chuyện khuyên em điều gì?', ['Kiên trì, không nản khi thất bại để theo đuổi ước mơ', 'Không nên mơ ước cao xa', 'Chỉ đọc sách là đủ'], 'Kiên trì, không nản khi thất bại để theo đuổi ước mơ', 4, 'Nhờ kiên trì sửa lỗi, tên lửa của Khoa đã bay cao.']]),
  W(14, 'um', 'Bài 25–26', 'Bay cùng ước mơ; Con trai người làm vườn', 'Luyện tập về tính từ', 'uocmo', ['tinhtu'],
    'Ước mơ làm phi công', 'Mỗi lần nghe tiếng máy bay, Duy lại chạy ra sân ngước nhìn. Duy mơ ước trở thành phi công, lái những chiếc máy bay to lớn bay qua nhiều đất nước. Bố bảo muốn làm phi công phải có sức khoẻ tốt, học giỏi và bình tĩnh. Từ đó, sáng nào Duy cũng dậy sớm chạy bộ, chăm chỉ học Toán và Tiếng Anh. Duy tin rằng ước mơ sẽ thành hiện thực nếu mình nỗ lực từng ngày.',
    [['Duy mơ ước làm nghề gì?', ['phi công', 'bác sĩ', 'kĩ sư'], 'phi công', 1, 'Duy mơ ước trở thành phi công.'],
      ['Theo bố, muốn làm phi công cần những gì?', ['sức khoẻ tốt, học giỏi, bình tĩnh', 'chỉ cần cao lớn', 'có nhiều tiền'], 'sức khoẻ tốt, học giỏi, bình tĩnh', 2, 'Bố bảo cần sức khoẻ tốt, học giỏi và bình tĩnh.'],
      ['Chọn tất cả tính từ trong câu "Muốn làm phi công phải có sức khoẻ tốt, học giỏi và bình tĩnh."', ['tốt', 'giỏi', 'bình tĩnh', 'phi công'], ['tốt', 'giỏi', 'bình tĩnh'], 3, '"phi công" là danh từ.'],
      ['Duy đã làm gì để theo đuổi ước mơ?', ['Dậy sớm chạy bộ, chăm học Toán và Tiếng Anh', 'Chỉ ngồi xem máy bay', 'Bỏ học để chơi'], 'Dậy sớm chạy bộ, chăm học Toán và Tiếng Anh', 4, 'Duy nỗ lực từng ngày.']]),
  W(15, 'um', 'Bài 27–28', 'Nếu em có một khu vườn; Bốn mùa mơ ước', 'Dấu gạch ngang', 'uocmo', ['gachngang'],
    'Khu vườn mơ ước', 'Cô giáo hỏi:\n– Nếu có một khu vườn, các em sẽ trồng gì?\nLan nhanh nhảu:\n– Em sẽ trồng thật nhiều hoa hồng để tặng mẹ.\nTùng đáp:\n– Em trồng cây ăn quả để cả nhà cùng hái.\nCòn Ngọc nói nhỏ:\n– Em muốn trồng một cây bàng thật to để các bạn ngồi đọc sách dưới bóng mát.\nCô mỉm cười: mỗi khu vườn mơ ước đều chứa đựng một tấm lòng.',
    [['Lan muốn trồng gì?', ['hoa hồng', 'cây ăn quả', 'cây bàng'], 'hoa hồng', 1, 'Lan sẽ trồng nhiều hoa hồng để tặng mẹ.'],
      ['Ngọc muốn trồng cây bàng để làm gì?', ['để các bạn ngồi đọc sách dưới bóng mát', 'để lấy quả', 'để bán'], 'để các bạn ngồi đọc sách dưới bóng mát', 2, 'Ngọc muốn các bạn ngồi đọc sách dưới bóng mát.'],
      ['Dấu gạch ngang ở đầu các dòng trong bài dùng để làm gì?', ['đánh dấu lời nói của nhân vật', 'liệt kê đồ vật', 'nối tên địa danh'], 'đánh dấu lời nói của nhân vật', 3, 'Dấu gạch ngang đầu dòng đánh dấu lời đối thoại.'],
      ['Câu "mỗi khu vườn mơ ước đều chứa đựng một tấm lòng" có ý nghĩa gì?', ['Ước mơ của mỗi bạn đều thể hiện tình cảm với người khác', 'Khu vườn nào cũng giống nhau', 'Không nên mơ ước'], 'Ước mơ của mỗi bạn đều thể hiện tình cảm với người khác', 4, 'Các bạn mơ trồng cây để tặng mẹ, cho cả nhà, cho các bạn.']]),
  W(16, 'um', 'Bài 29–30', 'Ở Vương quốc Tương Lai; Cánh chim nhỏ', 'Luyện tập về dấu gạch ngang', 'uocmo', ['gachngang', 'daucau'],
    'Lá thư gửi năm 2050', 'Lớp 4C viết thư gửi chính mình của năm 2050. Phương viết: "Chào Phương của tương lai! Tớ mong cậu đã trở thành bác sĩ, chữa bệnh cho trẻ em vùng cao." Hải viết về ước mơ làm kĩ sư, xây những cây cầu nối các làng ven sông. Cô giáo cất những lá thư vào một chiếc hộp, hẹn hai mươi năm sau cả lớp sẽ cùng mở. Ai cũng háo hức nghĩ về chuyến hành trình – từ hôm nay đến tương lai.',
    [['Lớp 4C viết thư gửi ai?', ['chính mình của năm 2050', 'các bạn lớp khác', 'thầy hiệu trưởng'], 'chính mình của năm 2050', 1, 'Các bạn viết thư gửi chính mình của năm 2050.'],
      ['Hải mơ ước làm nghề gì?', ['kĩ sư xây cầu', 'bác sĩ', 'giáo viên'], 'kĩ sư xây cầu', 2, 'Hải mơ làm kĩ sư, xây những cây cầu.'],
      ['Dấu gạch ngang trong "chuyến hành trình – từ hôm nay đến tương lai" dùng để làm gì?', ['đánh dấu phần giải thích', 'đánh dấu lời nói', 'kết thúc câu'], 'đánh dấu phần giải thích', 3, 'Phần sau dấu gạch ngang giải thích cho "chuyến hành trình".'],
      ['Việc cất thư vào hộp hai mươi năm sau mới mở có ý nghĩa gì?', ['Nhắc các bạn nỗ lực thực hiện ước mơ', 'Để thư không bị mất', 'Vì cô giáo không đọc được'], 'Nhắc các bạn nỗ lực thực hiện ước mơ', 4, 'Lá thư là lời hẹn với ước mơ của chính mình.']]),
  W(17, 'um', 'Bài 31–32', 'Nếu chúng mình có phép lạ; Anh Ba', 'Luyện tập về danh từ, động từ, tính từ', 'uocmo', ['tuloai'],
    'Nếu tớ có phép lạ', 'Giờ ra chơi, nhóm bạn ngồi dưới gốc phượng kể về điều sẽ làm nếu có phép lạ. Hưng muốn những hạt giống nảy mầm thành rừng xanh trên đồi trọc. Vy muốn mọi bạn nhỏ đều được đến trường. Bảo muốn chế ra chiếc máy biến rác thành đồ chơi. Cuối cùng, cả nhóm nhận ra: có những điều không cần phép lạ, chỉ cần mình chăm chỉ học tập và chung tay làm từ hôm nay.',
    [['Nhóm bạn ngồi ở đâu?', ['dưới gốc phượng', 'trong thư viện', 'ngoài cổng trường'], 'dưới gốc phượng', 1, 'Nhóm bạn ngồi dưới gốc phượng.'],
      ['Vy mong muốn điều gì?', ['mọi bạn nhỏ đều được đến trường', 'có nhiều đồ chơi', 'đi du lịch'], 'mọi bạn nhỏ đều được đến trường', 2, 'Vy muốn mọi bạn nhỏ đều được đến trường.'],
      ['Chọn tất cả danh từ trong câu "Hưng muốn những hạt giống nảy mầm thành rừng xanh."', ['hạt giống', 'rừng', 'nảy mầm', 'xanh'], ['hạt giống', 'rừng'], 3, '"nảy mầm" là động từ, "xanh" là tính từ.'],
      ['Cả nhóm nhận ra điều gì?', ['Nhiều điều tốt đẹp có thể làm được nhờ chăm chỉ và chung tay', 'Phải có phép lạ mới làm được việc tốt', 'Không nên mơ ước'], 'Nhiều điều tốt đẹp có thể làm được nhờ chăm chỉ và chung tay', 4, 'Chỉ cần chăm chỉ học tập và chung tay làm từ hôm nay.']]),
  W(18, 'on', 'Ôn tập cuối học kì 1', 'Ôn tập các bài đọc học kì 1', 'Ôn danh từ, động từ, tính từ, nhân hoá, dấu gạch ngang', 'uocmo', ['tuloai', 'nhanhoa', 'gachngang', 'coquan'],
    'Cây bút chì nhỏ', 'Trong hộp bút của Nam có một cây bút chì đã mòn chỉ còn ngắn bằng ngón tay. Các bạn bút mới chê nó: "Cậu xấu xí quá!" Bút chì nhỏ buồn lắm. Nhưng Nam vẫn giữ nó cẩn thận. Nam bảo: "Cây bút này đã cùng tớ viết những bài văn đầu tiên, vẽ những bức tranh đầu tiên." Nghe vậy, bút chì nhỏ thấy ấm lòng. Nó hiểu giá trị của mình nằm ở những điều đã làm được.',
    [['Cây bút chì của Nam thế nào?', ['đã mòn, chỉ còn ngắn bằng ngón tay', 'mới tinh', 'gãy đôi'], 'đã mòn, chỉ còn ngắn bằng ngón tay', 1, 'Bút chì đã mòn chỉ còn ngắn bằng ngón tay.'],
      ['Vì sao Nam vẫn giữ cây bút cẩn thận?', ['Vì bút đã cùng Nam viết bài văn, vẽ tranh đầu tiên', 'Vì bút rất đắt', 'Vì Nam không có bút khác'], 'Vì bút đã cùng Nam viết bài văn, vẽ tranh đầu tiên', 2, 'Cây bút gắn với những kỉ niệm đầu tiên của Nam.'],
      ['Bút chì nhỏ được nhân hoá qua những từ ngữ nào?', ['buồn, thấy ấm lòng, hiểu', 'mòn, ngắn', 'hộp bút'], 'buồn, thấy ấm lòng, hiểu', 3, 'Bút chì có cảm xúc, suy nghĩ như con người.'],
      ['Câu chuyện muốn nói điều gì?', ['Giá trị của mỗi người nằm ở những việc có ích đã làm', 'Đồ cũ nên vứt đi', 'Bút mới luôn tốt hơn'], 'Giá trị của mỗi người nằm ở những việc có ích đã làm', 4, 'Bút chì hiểu giá trị của mình nằm ở những điều đã làm được.']]),
  // ======================================== HỌC KÌ 2
  W(19, 'yt', 'Bài 1–2', 'Hải Thượng Lãn Ông; Vệt phấn trên mặt bàn', 'Câu', 'yeuthuong', ['cau'],
    'Người bác sĩ làng', 'Bác sĩ Tâm về làm việc ở trạm y tế xã đã hai mươi năm. Ngày cũng như đêm, hễ có người ốm là bác đến ngay. Có đêm mưa lớn, bác lội qua con suối đang dâng nước để kịp cấp cứu cho một em bé. Với những gia đình khó khăn, bác thường khám bệnh và cho thuốc không lấy tiền. Người dân trong xã gọi bác là "người thầy thuốc như mẹ hiền".',
    [['Bác sĩ Tâm làm việc ở đâu?', ['trạm y tế xã', 'bệnh viện tỉnh', 'nhà thuốc'], 'trạm y tế xã', 1, 'Bác sĩ Tâm làm việc ở trạm y tế xã.'],
      ['Đêm mưa lớn, bác Tâm đã làm gì?', ['lội qua suối để cấp cứu em bé', 'ở nhà nghỉ ngơi', 'gọi điện hỏi thăm'], 'lội qua suối để cấp cứu em bé', 2, 'Bác lội qua con suối để kịp cấp cứu.'],
      ['Dòng nào là một câu?', ['Bác sĩ Tâm về làm việc ở trạm y tế xã đã hai mươi năm.', 'Với những gia đình khó khăn', 'Ngày cũng như đêm'], 'Bác sĩ Tâm về làm việc ở trạm y tế xã đã hai mươi năm.', 3, 'Câu diễn đạt một ý trọn vẹn, có đủ chủ ngữ và vị ngữ.'],
      ['Vì sao người dân gọi bác là "người thầy thuốc như mẹ hiền"?', ['Vì bác tận tuỵ, thương yêu người bệnh', 'Vì bác là phụ nữ', 'Vì bác lớn tuổi'], 'Vì bác tận tuỵ, thương yêu người bệnh', 4, 'Bác chăm lo người bệnh như mẹ chăm con.']]),
  W(20, 'yt', 'Bài 3–4', 'Ông Bụt đã đến; Quả ngọt cuối mùa', 'Hai thành phần chính của câu', 'yeuthuong', ['chungu', 'vingu'],
    'Ông Bụt của bé Na', 'Nhà bé Na nghèo, Tết năm ấy không có tiền mua quần áo mới. Na buồn lắm. Sáng mùng Một, trước cửa nhà có một gói quà. Trong gói có chiếc áo đỏ và tấm thiệp: "Chúc bé Na một năm mới vui vẻ." Na reo lên: "Ông Bụt đã đến!" Mãi về sau Na mới biết người gửi quà là cô hàng xóm. Cô đã thức mấy đêm liền để may chiếc áo cho Na.',
    [['Vì sao Tết năm ấy Na buồn?', ['vì không có quần áo mới', 'vì bị ốm', 'vì không được đi chơi'], 'vì không có quần áo mới', 1, 'Nhà nghèo, Na không có quần áo mới.'],
      ['Ai là người gửi quà cho Na?', ['cô hàng xóm', 'ông Bụt', 'bố mẹ Na'], 'cô hàng xóm', 2, 'Người gửi quà là cô hàng xóm.'],
      ['Chủ ngữ của câu "Cô đã thức mấy đêm liền để may chiếc áo cho Na." là:', ['Cô', 'đã thức mấy đêm liền', 'chiếc áo'], 'Cô', 3, 'Chủ ngữ trả lời câu hỏi "Ai?": Cô.'],
      ['Câu chuyện ca ngợi điều gì?', ['Tấm lòng yêu thương, sẻ chia thầm lặng', 'Phép màu của ông Bụt', 'Chiếc áo đỏ đẹp'], 'Tấm lòng yêu thương, sẻ chia thầm lặng', 4, 'Cô hàng xóm âm thầm giúp đỡ Na.']]),
  W(21, 'yt', 'Bài 5–6', 'Tờ báo tường của tôi; Tiếng ru', 'Luyện tập về chủ ngữ', 'yeuthuong', ['chungu'],
    'Tờ báo tường tặng thầy', 'Gần đến ngày 20 tháng 11, lớp em quyết định làm một tờ báo tường thật đẹp. Bạn Linh viết bài thơ về thầy chủ nhiệm. Bạn Quân vẽ tranh ngôi trường. Cả lớp góp những lời cảm ơn viết trên giấy màu hình bông hoa. Tờ báo hoàn thành rực rỡ như một khu vườn. Thầy đọc từng dòng, đôi mắt rưng rưng. Thầy nói đó là món quà ý nghĩa nhất thầy từng nhận.',
    [['Lớp em làm báo tường nhân dịp nào?', ['ngày 20 tháng 11', 'Tết Trung thu', 'ngày khai giảng'], 'ngày 20 tháng 11', 1, 'Gần đến ngày 20 tháng 11.'],
      ['Bạn Quân góp gì cho tờ báo?', ['vẽ tranh ngôi trường', 'viết bài thơ', 'trang trí hoa'], 'vẽ tranh ngôi trường', 2, 'Bạn Quân vẽ tranh ngôi trường.'],
      ['Chủ ngữ của câu "Tờ báo hoàn thành rực rỡ như một khu vườn." là:', ['Tờ báo', 'hoàn thành rực rỡ', 'một khu vườn'], 'Tờ báo', 3, 'Chủ ngữ trả lời câu hỏi "Cái gì?": Tờ báo.'],
      ['Vì sao thầy xúc động?', ['Vì cảm nhận được tình cảm, lòng biết ơn của học sinh', 'Vì tờ báo quá to', 'Vì thầy bị đau mắt'], 'Vì cảm nhận được tình cảm, lòng biết ơn của học sinh', 4, 'Món quà chứa đựng tình cảm của cả lớp.']]),
  W(22, 'yt', 'Bài 7–8', 'Con muốn làm một cái cây; Trên khóm tre đầu ngõ', 'Luyện tập về vị ngữ', 'yeuthuong', ['vingu'],
    'Khóm tre đầu ngõ', 'Đầu ngõ nhà em có một khóm tre xanh. Mùa hè, khóm tre toả bóng mát cho người qua đường nghỉ chân. Chiều chiều, chim sẻ, chim chào mào về ríu rít trên ngọn tre. Một năm nọ, cặp cò trắng làm tổ trên khóm tre. Cả xóm dặn nhau không ai được làm kinh động. Mấy tuần sau, những chú cò con chui ra khỏi vỏ trứng. Khóm tre như một ngôi nhà chung bình yên.',
    [['Mùa hè, khóm tre làm gì cho người qua đường?', ['toả bóng mát', 'chắn gió', 'cho măng'], 'toả bóng mát', 1, 'Khóm tre toả bóng mát cho người qua đường nghỉ chân.'],
      ['Con vật nào làm tổ trên khóm tre?', ['cặp cò trắng', 'chim sẻ', 'sóc'], 'cặp cò trắng', 2, 'Cặp cò trắng làm tổ trên khóm tre.'],
      ['Vị ngữ của câu "Cả xóm dặn nhau không ai được làm kinh động." là:', ['dặn nhau không ai được làm kinh động', 'Cả xóm', 'không ai'], 'dặn nhau không ai được làm kinh động', 3, 'Vị ngữ trả lời câu hỏi "Làm gì?".'],
      ['Việc cả xóm bảo vệ tổ cò cho thấy điều gì?', ['Mọi người yêu thương, bảo vệ loài vật', 'Mọi người sợ cò', 'Cò làm hỏng tre'], 'Mọi người yêu thương, bảo vệ loài vật', 4, 'Cả xóm giữ yên tĩnh để cò con nở an toàn.']]),
  W(23, 'ng', 'Bài 9–10', 'Sự tích con Rồng cháu Tiên; Cảm xúc Trường Sa', 'Luyện tập về hai thành phần chính của câu', 'nguon', ['chungu', 'vingu'],
    'Thư gửi chú lính đảo', 'Lớp em viết thư gửi các chú bộ đội đang làm nhiệm vụ ở quần đảo Trường Sa. Trong thư, chúng em kể về trường lớp, về những bài học về biển đảo quê hương. Mấy tuần sau, lớp nhận được thư trả lời. Chú Hùng viết rằng ngoài đảo nắng gió nhiều, nước ngọt quý như vàng, nhưng các chú luôn vững vàng canh giữ biển trời Tổ quốc. Cả lớp đọc thư mà ai cũng thấy tự hào.',
    [['Lớp em gửi thư cho ai?', ['các chú bộ đội ở Trường Sa', 'các bạn lớp khác', 'thầy cô cũ'], 'các chú bộ đội ở Trường Sa', 1, 'Lớp em viết thư gửi các chú bộ đội ở quần đảo Trường Sa.'],
      ['Theo chú Hùng, ở ngoài đảo điều gì quý như vàng?', ['nước ngọt', 'gạo', 'sách báo'], 'nước ngọt', 2, 'Nước ngọt quý như vàng.'],
      ['Vị ngữ của câu "Các chú luôn vững vàng canh giữ biển trời Tổ quốc." là:', ['luôn vững vàng canh giữ biển trời Tổ quốc', 'Các chú', 'biển trời Tổ quốc'], 'luôn vững vàng canh giữ biển trời Tổ quốc', 3, 'Vị ngữ cho biết chủ ngữ làm gì.'],
      ['Vì sao cả lớp thấy tự hào?', ['Vì các chú vượt khó khăn, kiên cường bảo vệ biển đảo', 'Vì nhận được quà', 'Vì được đi Trường Sa'], 'Vì các chú vượt khó khăn, kiên cường bảo vệ biển đảo', 4, 'Các chú vẫn vững vàng dù nắng gió, thiếu nước ngọt.']]),
  W(24, 'ng', 'Bài 11–12', 'Sáng tháng Năm; Chàng trai làng Phù Ủng', 'Trạng ngữ', 'nguon', ['trangngu', 'tn_tg', 'tn_nc'],
    'Thăm làng Sen', 'Sáng tháng Năm, lớp em về thăm làng Sen, quê nội của Bác Hồ. Trên đường làng, hàng râm bụt nở đỏ. Trong ngôi nhà tranh đơn sơ, chúng em được xem chiếc giường tre, chiếc võng gai gắn với tuổi thơ của Bác. Ngoài vườn, đầm sen đang mùa nở hoa, hương thơm ngào ngạt. Cô hướng dẫn viên kể nhiều câu chuyện về Bác. Lúc ra về, ai cũng thầm hứa học thật giỏi.',
    [['Lớp em về thăm nơi nào?', ['làng Sen, quê nội của Bác Hồ', 'Hà Nội', 'Trường Sa'], 'làng Sen, quê nội của Bác Hồ', 1, 'Lớp em về thăm làng Sen, quê nội của Bác Hồ.'],
      ['Trong ngôi nhà tranh có những gì?', ['chiếc giường tre, chiếc võng gai', 'tủ sách lớn', 'đồ chơi'], 'chiếc giường tre, chiếc võng gai', 2, 'Chiếc giường tre, chiếc võng gai gắn với tuổi thơ của Bác.'],
      ['Trạng ngữ trong câu "Ngoài vườn, đầm sen đang mùa nở hoa." là:', ['Ngoài vườn', 'đầm sen', 'đang mùa nở hoa'], 'Ngoài vườn', 3, 'Trạng ngữ đứng đầu câu, chỉ nơi chốn: "Ngoài vườn".'],
      ['Chuyến thăm giúp các bạn điều gì?', ['Thêm hiểu, kính yêu Bác và quyết tâm học giỏi', 'Biết cách trồng sen', 'Được nghỉ học'], 'Thêm hiểu, kính yêu Bác và quyết tâm học giỏi', 4, 'Ai cũng thầm hứa học thật giỏi.']]),
  W(25, 'ng', 'Bài 13–14', 'Vườn của ông tôi; Trong lời mẹ hát', 'Trạng ngữ chỉ thời gian, nơi chốn', 'nguon', ['tn_tg', 'tn_nc'],
    'Vườn cây của ông', 'Ở cuối làng, ông tôi có một khu vườn rộng. Ngày còn trẻ, ông tự tay trồng từng gốc nhãn, gốc vải. Mùa hè, quả chín sai trĩu cành. Mỗi lần con cháu về, ông lại dắt đi khắp vườn, kể cây nào trồng năm nào. Ông bảo: "Cây cũng như người, phải chăm sóc mới lớn." Bây giờ, chúng tôi thay ông chăm vườn, để khu vườn mãi xanh tươi như tấm lòng của ông.',
    [['Khu vườn của ông ở đâu?', ['ở cuối làng', 'ở giữa phố', 'trên đồi'], 'ở cuối làng', 1, 'Ở cuối làng, ông có một khu vườn rộng.'],
      ['Ông trồng những cây gì?', ['nhãn, vải', 'cam, bưởi', 'xoài, mít'], 'nhãn, vải', 2, 'Ông trồng từng gốc nhãn, gốc vải.'],
      ['Trạng ngữ "Ngày còn trẻ" trong bài chỉ gì?', ['thời gian', 'nơi chốn', 'nguyên nhân'], 'thời gian', 3, '"Ngày còn trẻ" cho biết thời gian.'],
      ['Việc con cháu thay ông chăm vườn thể hiện điều gì?', ['Biết ơn, tiếp nối công sức của ông', 'Muốn bán vườn', 'Không thích cây'], 'Biết ơn, tiếp nối công sức của ông', 4, 'Con cháu giữ gìn khu vườn ông trồng.']]),
  W(26, 'ng', 'Bài 15–16', 'Người thầy đầu tiên của bố tôi; Ngựa biên phòng', 'Trạng ngữ chỉ nguyên nhân, mục đích', 'nguon', ['tn_nn', 'tn_md'],
    'Thầy giáo của bố', 'Nhân ngày Nhà giáo, bố dẫn tôi đến thăm thầy giáo cũ của bố. Thầy đã già, tóc bạc trắng. Vừa thấy thầy, bố vội vàng bỏ mũ, kính cẩn chào. Bố kể: "Nhờ thầy dạy dỗ, bố mới nên người." Thầy cười hiền, nhắc lại chuyện ngày xưa bố hay trốn học đi bắt dế. Để giữ lời hứa với thầy, bố đã chăm chỉ học và trở thành kĩ sư. Tôi hiểu thêm về lòng biết ơn thầy cô.',
    [['Bố dẫn "tôi" đến thăm ai?', ['thầy giáo cũ của bố', 'ông bà nội', 'bạn của bố'], 'thầy giáo cũ của bố', 1, 'Bố dẫn tôi đến thăm thầy giáo cũ.'],
      ['Khi gặp thầy, bố đã làm gì?', ['bỏ mũ, kính cẩn chào', 'bắt tay', 'vẫy tay'], 'bỏ mũ, kính cẩn chào', 2, 'Bố vội vàng bỏ mũ, kính cẩn chào.'],
      ['Trạng ngữ "Nhờ thầy dạy dỗ" chỉ gì?', ['nguyên nhân', 'mục đích', 'thời gian'], 'nguyên nhân', 3, '"Nhờ thầy dạy dỗ" cho biết nguyên nhân bố nên người.'],
      ['Câu chuyện nói về truyền thống nào?', ['Tôn sư trọng đạo, biết ơn thầy cô', 'Lễ hội đầu xuân', 'Hiếu học'], 'Tôn sư trọng đạo, biết ơn thầy cô', 4, 'Dù đã thành đạt, bố vẫn kính trọng, biết ơn thầy.']]),
  W(27, 'on', 'Ôn tập giữa học kì 2', 'Ôn tập các bài đọc tuần 19–26', 'Ôn câu, chủ ngữ, vị ngữ, trạng ngữ', 'nguon', ['chungu', 'vingu', 'trangngu'],
    'Chiếc khăn quàng đỏ', 'Ngày Minh được kết nạp Đội, mẹ là ngực áo cho Minh thật phẳng. Ông nội trao cho Minh chiếc khăn quàng đỏ cũ mà ông đã giữ từ thời còn là đội viên. Ông dặn: "Khăn quàng là một phần lá cờ Tổ quốc. Cháu phải học giỏi, ngoan ngoãn để xứng đáng với màu đỏ ấy." Trong buổi lễ, Minh đứng thẳng, giơ tay chào. Lòng cậu rộn ràng niềm tự hào.',
    [['Ai trao khăn quàng đỏ cho Minh?', ['ông nội', 'cô giáo', 'mẹ'], 'ông nội', 1, 'Ông nội trao chiếc khăn quàng cũ.'],
      ['Theo ông, khăn quàng đỏ là gì?', ['một phần lá cờ Tổ quốc', 'món quà sinh nhật', 'đồ trang trí'], 'một phần lá cờ Tổ quốc', 2, 'Ông nói khăn quàng là một phần lá cờ Tổ quốc.'],
      ['Trạng ngữ trong câu "Trong buổi lễ, Minh đứng thẳng, giơ tay chào." là:', ['Trong buổi lễ', 'Minh', 'giơ tay chào'], 'Trong buổi lễ', 3, 'Bộ phận đứng đầu câu, ngăn cách bằng dấu phẩy là trạng ngữ.'],
      ['Lời dặn của ông có ý nghĩa gì?', ['Phải cố gắng để xứng đáng là đội viên', 'Khăn quàng rất đắt', 'Không được làm bẩn khăn'], 'Phải cố gắng để xứng đáng là đội viên', 4, 'Ông dặn học giỏi, ngoan ngoãn để xứng đáng.']]),
  W(28, 'qh', 'Bài 17–18', 'Cây đa quê hương; Bước mùa xuân', 'Trạng ngữ chỉ phương tiện', 'quehuong', ['tn_pt'],
    'Cây đa đầu làng', 'Cây đa đầu làng đã mấy trăm tuổi. Thân cây to, rễ buông xuống như những bộ râu dài của ông cụ. Bằng tán lá xum xuê, cây che mát cả một khoảng sân rộng. Buổi trưa, các bác nông dân nghỉ chân dưới gốc đa. Chiều chiều, lũ trẻ chúng tôi thả trâu, thả diều quanh đó. Đi xa, mỗi lần nhớ quê, tôi lại nhớ cây đa đầu làng.',
    [['Cây đa đã bao nhiêu tuổi?', ['mấy trăm tuổi', 'mười tuổi', 'vài năm'], 'mấy trăm tuổi', 1, 'Cây đa đã mấy trăm tuổi.'],
      ['Rễ đa được so sánh với gì?', ['những bộ râu dài của ông cụ', 'những sợi dây thừng', 'những con rắn'], 'những bộ râu dài của ông cụ', 2, 'Rễ buông xuống như những bộ râu dài của ông cụ.'],
      ['Trạng ngữ "Bằng tán lá xum xuê" chỉ gì?', ['phương tiện', 'thời gian', 'nơi chốn'], 'phương tiện', 3, 'Trạng ngữ bắt đầu bằng "bằng" chỉ phương tiện.'],
      ['Tình cảm của tác giả với cây đa thế nào?', ['gắn bó, nhớ thương như nhớ quê hương', 'không quan tâm', 'sợ hãi'], 'gắn bó, nhớ thương như nhớ quê hương', 4, 'Nhớ quê, tác giả lại nhớ cây đa.']]),
  W(29, 'qh', 'Bài 19–20', 'Đi hội chùa Hương; Chiều ngoại ô', 'Dấu ngoặc kép', 'quehuong', ['ngoackep'],
    'Chuyến đò về quê ngoại', 'Hè này, Mai theo mẹ về quê ngoại bằng chuyến đò dọc. Hai bên sông, những bãi ngô xanh mướt trải dài. Bác lái đò vừa chèo vừa hát câu hò quen thuộc. Mẹ bảo đó là điệu "hò mái đẩy" của quê mình. Mai thích thú lắng nghe. Lúc đò cập bến, bà ngoại đã đứng chờ dưới gốc gạo. Bà ôm Mai vào lòng: "Cháu bà lớn quá rồi!"',
    [['Mai về quê ngoại bằng phương tiện gì?', ['đò', 'ô tô', 'tàu hoả'], 'đò', 1, 'Mai về quê ngoại bằng chuyến đò dọc.'],
      ['Hai bên sông có gì?', ['những bãi ngô xanh mướt', 'nhà cao tầng', 'rừng thông'], 'những bãi ngô xanh mướt', 2, 'Hai bên sông là những bãi ngô xanh mướt.'],
      ['Dấu ngoặc kép trong "hò mái đẩy" dùng để làm gì?', ['đánh dấu tên một điệu hò', 'đánh dấu lời nói', 'đánh dấu chú thích'], 'đánh dấu tên một điệu hò', 3, 'Dấu ngoặc kép đánh dấu tên riêng của điệu hò.'],
      ['Câu bà nói thể hiện điều gì?', ['Bà vui mừng, yêu thương cháu', 'Bà trách cháu', 'Bà không nhận ra cháu'], 'Bà vui mừng, yêu thương cháu', 4, 'Bà ôm Mai vào lòng, khen cháu lớn.']]),
  W(30, 'qh', 'Bài 21–22', 'Những cánh buồm; Cái cầu', 'Dấu ngoặc đơn', 'quehuong', ['ngoacdon'],
    'Cây cầu mới', 'Ngày trước, muốn sang bên kia sông (nơi có trường cấp hai), lũ trẻ trong xóm phải đi đò. Mùa lũ, nhiều hôm đò không chạy được. Năm ngoái, cây cầu bê tông được xây xong. Hôm khánh thành, cả xóm kéo nhau ra xem. Ông Tư (người chở đò lâu năm nhất) đứng ngắm cầu rất lâu. Ông bảo: "Từ nay các cháu đi học chẳng còn lo mưa lũ nữa."',
    [['Trước đây lũ trẻ sang sông bằng gì?', ['đi đò', 'đi cầu', 'bơi qua'], 'đi đò', 1, 'Lũ trẻ phải đi đò.'],
      ['Mùa lũ có khó khăn gì?', ['nhiều hôm đò không chạy được', 'cầu bị sập', 'đường bị tắc'], 'nhiều hôm đò không chạy được', 2, 'Mùa lũ, nhiều hôm đò không chạy được.'],
      ['Phần trong dấu ngoặc đơn "(người chở đò lâu năm nhất)" có tác dụng gì?', ['giải thích thêm về ông Tư', 'đánh dấu lời nói', 'nêu tên bài hát'], 'giải thích thêm về ông Tư', 3, 'Dấu ngoặc đơn đánh dấu phần chú thích, giải thích.'],
      ['Vì sao ông Tư ngắm cầu rất lâu?', ['Vì ông xúc động, vui mừng cho các cháu', 'Vì ông sợ mất việc', 'Vì cầu quá xấu'], 'Vì ông xúc động, vui mừng cho các cháu', 4, 'Ông mừng vì các cháu đi học không còn lo mưa lũ.']]),
  W(31, 'qh', 'Bài 23–24', 'Đường đi Sa Pa; Quê ngoại', 'Luyện tập viết tên cơ quan, tổ chức', 'quehuong', ['coquan', 'dtrieng'],
    'Chuyến đi Sa Pa', 'Đội Thiếu niên Tiền phong của trường tổ chức cho chúng em đi Sa Pa. Xe leo dốc quanh co, mây trắng bay vờn ngang cửa kính. Hai bên đường, những thửa ruộng bậc thang như những bậc thang khổng lồ dẫn lên trời. Chúng em ghé thăm Trường Tiểu học Bản Hồ, tặng các bạn nhỏ vùng cao sách vở và áo ấm. Các bạn tặng lại chúng em những chiếc túi thổ cẩm xinh xắn.',
    [['Ai tổ chức chuyến đi Sa Pa?', ['Đội Thiếu niên Tiền phong của trường', 'gia đình em', 'công ty du lịch'], 'Đội Thiếu niên Tiền phong của trường', 1, 'Đội Thiếu niên Tiền phong tổ chức chuyến đi.'],
      ['Ruộng bậc thang được so sánh với gì?', ['những bậc thang khổng lồ dẫn lên trời', 'tấm thảm', 'chiếc gương'], 'những bậc thang khổng lồ dẫn lên trời', 2, 'Những thửa ruộng bậc thang như những bậc thang khổng lồ.'],
      ['Tên nào là tên một cơ quan, tổ chức?', ['Trường Tiểu học Bản Hồ', 'Sa Pa', 'ruộng bậc thang'], 'Trường Tiểu học Bản Hồ', 3, 'Trường Tiểu học Bản Hồ là tên một cơ quan.'],
      ['Việc trao đổi quà giữa các bạn cho thấy điều gì?', ['Tình bạn, sự sẻ chia giữa các vùng miền', 'Các bạn muốn mua bán', 'Không có ý nghĩa'], 'Tình bạn, sự sẻ chia giữa các vùng miền', 4, 'Các bạn tặng nhau sách vở, áo ấm, túi thổ cẩm.']]),
  W(32, 'by', 'Bài 25–26', 'Khu bảo tồn động vật hoang dã Ngô-rông-gô-rô; Ngôi nhà của yêu thương', 'Lựa chọn từ ngữ', 'binhyen', ['luachon'],
    'Khu rừng của voọc', 'Ở Vườn quốc gia Cúc Phương có một trung tâm cứu hộ những chú voọc bị thương. Các cô chú nhân viên chăm sóc chúng tận tình như chăm con nhỏ. Khi voọc khoẻ lại, các cô chú đưa chúng trở về rừng. Lần đầu được thả, chú voọc nhỏ ngập ngừng, rồi nhanh nhẹn chuyền cành, mất hút giữa tán lá xanh. Nhìn theo, cô Hằng mỉm cười hạnh phúc.',
    [['Trung tâm cứu hộ ở đâu?', ['Vườn quốc gia Cúc Phương', 'sở thú thành phố', 'trên đảo'], 'Vườn quốc gia Cúc Phương', 1, 'Trung tâm ở Vườn quốc gia Cúc Phương.'],
      ['Khi voọc khoẻ lại, các cô chú làm gì?', ['đưa chúng trở về rừng', 'nhốt vào chuồng', 'bán đi'], 'đưa chúng trở về rừng', 2, 'Các cô chú đưa voọc trở về rừng.'],
      ['Từ nào thay được cho "tận tình" trong câu "chăm sóc chúng tận tình"?', ['chu đáo', 'qua loa', 'vội vàng'], 'chu đáo', 3, '"tận tình" và "chu đáo" có nghĩa gần nhau.'],
      ['Vì sao cô Hằng mỉm cười hạnh phúc?', ['Vì chú voọc đã khoẻ và được trở về với thiên nhiên', 'Vì được nghỉ làm', 'Vì voọc rời đi'], 'Vì chú voọc đã khoẻ và được trở về với thiên nhiên', 4, 'Công sức chăm sóc giúp voọc trở về rừng.']]),
  W(33, 'by', 'Bài 27–28', 'Băng tan; Chuyến du lịch thú vị', 'Luyện tập lựa chọn từ ngữ', 'binhyen', ['luachon'],
    'Nhà của chú gấu Bắc Cực', 'Gấu trắng sống ở vùng Bắc Cực lạnh giá. Chúng săn mồi trên những tảng băng lớn. Nhưng Trái Đất đang nóng lên, băng tan dần. Nhiều chú gấu phải bơi rất xa mới tìm được chỗ nghỉ chân. Các nhà khoa học kêu gọi mọi người tiết kiệm điện, trồng thêm cây xanh, hạn chế xả rác để giảm khí thải. Những việc nhỏ của chúng ta có thể giữ lại ngôi nhà băng cho gấu trắng.',
    [['Gấu trắng sống ở đâu?', ['vùng Bắc Cực', 'rừng nhiệt đới', 'sa mạc'], 'vùng Bắc Cực', 1, 'Gấu trắng sống ở vùng Bắc Cực.'],
      ['Vì sao băng tan dần?', ['vì Trái Đất đang nóng lên', 'vì gấu đập vỡ', 'vì mưa nhiều'], 'vì Trái Đất đang nóng lên', 2, 'Trái Đất đang nóng lên, băng tan dần.'],
      ['Chọn từ phù hợp nhất: "Chúng ta cần … điện để bảo vệ môi trường."', ['tiết kiệm', 'lãng phí', 'bỏ quên'], 'tiết kiệm', 3, 'Tiết kiệm điện giúp giảm khí thải.'],
      ['Bài đọc kêu gọi điều gì?', ['Mỗi người làm việc nhỏ để bảo vệ Trái Đất', 'Đến Bắc Cực săn gấu', 'Không cần lo về môi trường'], 'Mỗi người làm việc nhỏ để bảo vệ Trái Đất', 4, 'Những việc nhỏ giữ lại ngôi nhà băng cho gấu trắng.']]),
  W(34, 'by', 'Bài 29–30', 'Lễ hội ở Nhật Bản; Ngày hội', 'Luyện tập về dấu câu', 'binhyen', ['daucau', 'ngoackep', 'gachngang'],
    'Ngày hội hữu nghị', 'Trường em tổ chức "Ngày hội hữu nghị" với các bạn học sinh đến từ nhiều nước. Bạn Yu-ki (Nhật Bản) hướng dẫn chúng em gấp hạc giấy. Bạn An-na (Nga) dạy cả lớp một điệu múa vòng tròn. Chúng em giới thiệu với các bạn món bánh chưng và trò chơi kéo co. Cuối ngày, mọi người cùng hát vang:\n– Trái Đất này là của chúng mình!\nTiếng hát vang xa như một lời chúc hoà bình.',
    [['Bạn Yu-ki hướng dẫn các bạn làm gì?', ['gấp hạc giấy', 'múa vòng tròn', 'gói bánh chưng'], 'gấp hạc giấy', 1, 'Bạn Yu-ki hướng dẫn gấp hạc giấy.'],
      ['Các bạn Việt Nam giới thiệu những gì?', ['bánh chưng và trò chơi kéo co', 'hạc giấy', 'điệu múa vòng tròn'], 'bánh chưng và trò chơi kéo co', 2, 'Chúng em giới thiệu bánh chưng và kéo co.'],
      ['Phần trong dấu ngoặc đơn "(Nhật Bản)" dùng để làm gì?', ['chú thích bạn Yu-ki đến từ nước nào', 'đánh dấu lời nói', 'nêu tên bài hát'], 'chú thích bạn Yu-ki đến từ nước nào', 3, 'Dấu ngoặc đơn đánh dấu phần chú thích.'],
      ['Ngày hội mang ý nghĩa gì?', ['Tình hữu nghị, mong ước hoà bình giữa các dân tộc', 'Chỉ để vui chơi', 'Thi đấu giữa các nước'], 'Tình hữu nghị, mong ước hoà bình giữa các dân tộc', 4, 'Mọi người cùng hát vang lời chúc hoà bình.']]),
  W(35, 'on', 'Ôn tập cuối năm', 'Ôn tập các bài đọc học kì 2', 'Ôn tập từ loại, câu, trạng ngữ, dấu câu, lựa chọn từ ngữ', 'binhyen', ['tuloai', 'chungu', 'vingu', 'trangngu', 'ngoackep', 'ngoacdon', 'luachon'],
    'Mùa hè ý nghĩa', 'Năm học kết thúc, lớp 4A bàn nhau làm một việc có ích trong mùa hè. Cả lớp quyết định mở "Tủ sách yêu thương" ở nhà văn hoá thôn. Mỗi bạn góp năm cuốn sách đã đọc. Chủ nhật hằng tuần, các bạn thay nhau trông tủ sách, đọc truyện cho các em nhỏ nghe. Cuối hè, tủ sách đã có hơn ba trăm cuốn. Các bạn hiểu rằng niềm vui lớn nhất là được sẻ chia.',
    [['Lớp 4A mở tủ sách ở đâu?', ['nhà văn hoá thôn', 'trường học', 'thư viện tỉnh'], 'nhà văn hoá thôn', 1, 'Các bạn mở tủ sách ở nhà văn hoá thôn.'],
      ['Mỗi bạn góp bao nhiêu cuốn sách?', ['năm cuốn', 'một cuốn', 'mười cuốn'], 'năm cuốn', 2, 'Mỗi bạn góp năm cuốn sách đã đọc.'],
      ['Trạng ngữ trong câu "Chủ nhật hằng tuần, các bạn thay nhau trông tủ sách." chỉ gì?', ['thời gian', 'nơi chốn', 'mục đích'], 'thời gian', 3, '"Chủ nhật hằng tuần" chỉ thời gian.'],
      ['Các bạn hiểu ra điều gì?', ['Niềm vui lớn nhất là được sẻ chia', 'Đọc sách một mình là vui nhất', 'Không nên cho sách'], 'Niềm vui lớn nhất là được sẻ chia', 4, 'Câu cuối bài nêu bài học.']]),
];

const read = (w: TV4Week, q: string) => `Đọc bài "${w.title}":\n${w.text}\n\n${q}`;
const outcomeFor = (lv: Level) => (lv >= 4 ? 'V4.DOC.03' : lv >= 3 ? 'V4.DOC.02' : 'V4.DOC.01');

function readingQs(w: TV4Week): ContentQuestion[] {
  return w.qs.map(([prompt, options, correct, level, e]) => {
    const m = { o: outcomeFor(level), f: 'TV.DOCHIEU', l: level, e, s: level >= 3 ? e : undefined };
    if (Array.isArray(correct)) return mc(read(w, prompt), options, correct, { ...m, o: 'V4.TU.04', f: 'TV.TUNGU' });
    return sc(read(w, prompt), options, correct, m);
  });
}

function practiceQs(w: TV4Week): ContentQuestion[] {
  const ctx: TV4Ctx = { ...w.ctx, week: w.week };
  const pool = tv4Pool(ctx.focus);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  ([1, 2, 4, 5] as Level[]).forEach((lv, slot) => {
    const r = makeRng(w.week * 6029 + slot * 7937 + 40);
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

const lesson = (w: TV4Week): ContentLesson => ({
  id: `tv4-kntt-t${String(w.week).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 4,
  semester: w.week <= 18 ? 1 : 2,
  book: BOOK,
  ref: `Tuần ${w.week} · ${w.bai}`,
  unit: { code: `KNTT.V4.${w.topic}`, title: w.topic === 'on' ? 'Ôn tập' : `Chủ điểm: ${TV4_TOPICS[w.topic]}` },
  topicCode: 'V4.DOC',
  title: `Tuần ${w.week}. ${w.topic === 'on' ? w.bai : w.title}`,
  description: `Sách: ${w.readings}. Luyện từ và câu: ${w.practice}.`,
  scope: SCOPE,
  questions: [...readingQs(w), ...practiceQs(w)].sort((a, b) => a.level - b.level),
});

export const TV4_HK1: ContentLesson[] = TV4_WEEKS.filter((w) => w.week <= 18).map(lesson);
export const TV4_HK2: ContentLesson[] = TV4_WEEKS.filter((w) => w.week > 18).map(lesson);
export const tv4Ctx = (week: number): TV4Ctx => {
  const w = TV4_WEEKS.find((x) => x.week === week)!;
  return { ...w.ctx, week };
};
export const tv4WeekPool = (week: number) => tv4Pool(tv4Ctx(week).focus);
