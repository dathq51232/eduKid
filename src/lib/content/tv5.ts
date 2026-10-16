// TIẾNG VIỆT 5 — 35 tuần theo mục lục sách Tiếng Việt 5 (Kết nối tri thức): HK1 tuần 1–18, HK2 tuần 19–35.
// Mỗi tuần: một BÀI ĐỌC DO EDUCHAIN KIDS TỰ VIẾT theo chủ điểm của tuần (không chép bài đọc của sách) kèm 4 câu đọc hiểu,
// và câu luyện từ và câu rút từ bộ sinh câu lớp 5 (practice/tv5g.ts) theo đúng nội dung luyện tập của tuần.

import { makeRng } from '../practice/rng';
import { tv5Pool, type TV5Ctx, type TV5Focus, type TV5Theme } from '../practice/tv5g';
import type { PracticeQuestion } from '../practice/kit';
import { mc, sc, type ContentLesson, type ContentQuestion, type Level } from './types';

const BOOK = 'Kết nối tri thức';
const SCOPE = { kind: 'viet2', grade: 5 } as const;

export const TV5_TOPICS: Record<string, string> = {
  tt: 'Thế giới tuổi thơ', tn: 'Thiên nhiên kì thú', ht: 'Trên con đường học tập', nt: 'Nghệ thuật muôn màu',
  cs: 'Vẻ đẹp cuộc sống', tm: 'Hương sắc trăm miền', co: 'Tiếp bước cha ông', tg: 'Thế giới của chúng ta', on: 'Ôn tập',
};

type Q5 = [prompt: string, options: string[], correct: string | string[], level: Level, explanation: string];
export type TV5Week = { week: number; topic: keyof typeof TV5_TOPICS; bai: string; readings: string; practice: string; ctx: Omit<TV5Ctx, 'week'>; title: string; text: string; qs: Q5[] };
const W = (week: number, topic: TV5Week['topic'], bai: string, readings: string, practice: string, theme: TV5Theme, focus: TV5Focus[], title: string, text: string, qs: Q5[]): TV5Week =>
  ({ week, topic, bai, readings, practice, ctx: { theme, focus }, title, text, qs });

export const TV5_WEEKS: TV5Week[] = [
  // ======================================== HỌC KÌ 1
  W(1, 'tt', 'Bài 1–2', 'Thanh âm của gió; Cánh đồng hoa', 'Luyện tập về danh từ, động từ, tính từ', 'tuoitho', ['tuloai'],
    'Con diều của Bống', 'Chiều hè, gió nam thổi lồng lộng trên con đê làng. Bống cùng ông nội mang chiếc diều giấy ra bãi cỏ. Ông giữ dây, Bống chạy thật nhanh rồi buông tay. Chiếc diều chao đi chao lại mấy vòng, rồi bỗng vút lên cao. Tiếng sáo diều vi vu, trầm bổng như ai đang thổi khúc nhạc giữa trời. Bống ngửa mặt nhìn theo, thấy mình như cũng đang bay cùng cánh diều. Ông bảo: "Diều bay được là nhờ gió, còn cháu lớn lên được là nhờ biết bao người thương yêu."',
    [['Bống cùng ai đi thả diều?', ['ông nội', 'bố', 'các bạn'], 'ông nội', 1, 'Bống cùng ông nội mang diều ra bãi cỏ.'],
      ['Tiếng sáo diều được tả như thế nào?', ['vi vu, trầm bổng như khúc nhạc', 'ồn ào, inh ỏi', 'nhỏ, khó nghe'], 'vi vu, trầm bổng như khúc nhạc', 2, 'Tiếng sáo diều vi vu, trầm bổng như ai đang thổi khúc nhạc.'],
      ['Chọn tất cả động từ trong câu "Bống chạy thật nhanh rồi buông tay."', ['chạy', 'buông', 'nhanh', 'tay'], ['chạy', 'buông'], 3, '"nhanh" là tính từ, "tay" là danh từ.'],
      ['Lời ông nói ở cuối bài có ý nghĩa gì?', ['Mỗi người lớn lên nhờ tình yêu thương của những người xung quanh', 'Diều chỉ bay khi có ông', 'Thả diều giúp cao lớn hơn'], 'Mỗi người lớn lên nhờ tình yêu thương của những người xung quanh', 4, 'Ông so sánh: diều nhờ gió, cháu nhờ tình thương.']]),
  W(2, 'tt', 'Bài 3–4', 'Tuổi Ngựa; Bến sông tuổi thơ', 'Đại từ', 'tuoitho', ['daitu'],
    'Bến sông ngày ấy', 'Bố tôi lớn lên bên một bến sông nhỏ. Bố kể, ngày ấy bến sông là cả một thế giới của bọn trẻ. Sáng sáng, chúng tắm sông, bơi thi xem ai sang bờ bên kia trước. Chiều chiều, chúng ngồi trên bậc đá, câu những chú cá bống nhỏ xíu. Mùa nước lên, cả bọn rủ nhau thả những chiếc thuyền lá trôi theo dòng. Bây giờ bến sông đã có cây cầu bê tông, nhưng mỗi lần về quê, bố vẫn dắt tôi ra đó. Bố bảo: "Chỗ này giữ giùm bố cả một thời thơ ấu."',
    [['Bố của "tôi" lớn lên ở đâu?', ['bên một bến sông nhỏ', 'ở thành phố', 'trên núi'], 'bên một bến sông nhỏ', 1, 'Bố tôi lớn lên bên một bến sông nhỏ.'],
      ['Mùa nước lên, bọn trẻ thường làm gì?', ['thả thuyền lá trôi theo dòng', 'câu cá bống', 'xây cầu'], 'thả thuyền lá trôi theo dòng', 2, 'Mùa nước lên, cả bọn thả thuyền lá.'],
      ['Từ "chúng" trong câu "Sáng sáng, chúng tắm sông" chỉ ai?', ['bọn trẻ', 'những chú cá', 'bố và tôi'], 'bọn trẻ', 3, '"chúng" là đại từ thay cho "bọn trẻ".'],
      ['Câu "Chỗ này giữ giùm bố cả một thời thơ ấu" cho thấy điều gì?', ['Bến sông gắn với nhiều kỉ niệm đẹp của bố', 'Bố muốn bán bến sông', 'Bố không thích cây cầu'], 'Bến sông gắn với nhiều kỉ niệm đẹp của bố', 4, 'Bến sông lưu giữ kỉ niệm tuổi thơ của bố.']]),
  W(3, 'tt', 'Bài 5–6', 'Tiếng hạt nảy mầm; Ngôi sao sân cỏ', 'Luyện tập về đại từ', 'tuoitho', ['daitu'],
    'Cậu thủ môn nhỏ', 'Đội bóng lớp 5C có một thủ môn nhỏ nhất đội tên là Bin. Lúc đầu, nhiều bạn lo Bin không bắt được những cú sút mạnh. Bin không buồn. Cậu tập bật nhảy mỗi sáng, nhờ anh trai sút bóng cho mình bắt. Trận chung kết, đội bạn được hưởng quả phạt đền. Cả sân im phăng phắc. Bin lao người sang trái, ôm gọn quả bóng trong tay. Các bạn ùa vào công kênh cậu. Bin cười: "Tớ không cao, nhưng tớ có cả đội ở phía sau."',
    [['Bin chơi ở vị trí nào trong đội bóng?', ['thủ môn', 'tiền đạo', 'hậu vệ'], 'thủ môn', 1, 'Bin là thủ môn nhỏ nhất đội.'],
      ['Bin đã làm gì để khắc phục chiều cao?', ['tập bật nhảy mỗi sáng, nhờ anh trai sút bóng để bắt', 'bỏ không thi đấu', 'đổi sang đội khác'], 'tập bật nhảy mỗi sáng, nhờ anh trai sút bóng để bắt', 2, 'Bin chăm chỉ luyện tập.'],
      ['Trong câu "Tớ không cao, nhưng tớ có cả đội ở phía sau.", từ "tớ" là đại từ gì?', ['đại từ xưng hô', 'đại từ nghi vấn', 'đại từ thay thế'], 'đại từ xưng hô', 3, '"tớ" dùng để tự xưng.'],
      ['Câu nói cuối của Bin thể hiện điều gì?', ['Bin tự tin và biết ơn sự đoàn kết của đồng đội', 'Bin coi thường đồng đội', 'Bin muốn được khen'], 'Bin tự tin và biết ơn sự đoàn kết của đồng đội', 4, 'Bin hiểu sức mạnh của cả đội.']]),
  W(4, 'tt', 'Bài 7–8', 'Bộ sưu tập độc đáo; Hành tinh kì lạ', 'Luyện tập về đại từ (tiếp theo)', 'tuoitho', ['daitu'],
    'Bộ sưu tập nắp chai', 'Chi có một bộ sưu tập rất lạ: hơn hai trăm chiếc nắp chai đủ màu. Mỗi chiếc nắp đều có câu chuyện riêng. Chiếc nắp xanh nhặt được trong chuyến đi biển. Chiếc nắp đỏ là của chai nước cam mẹ mua hôm Chi được giải vẽ tranh. Chi dùng chúng ghép thành bức tranh con cá voi treo ở lớp. Cô giáo khen bức tranh vừa đẹp vừa nhắc mọi người giữ gìn môi trường. Từ đó, cả lớp cùng góp nắp chai cho Chi.',
    [['Bộ sưu tập của Chi gồm những gì?', ['nắp chai đủ màu', 'tem thư', 'vỏ ốc'], 'nắp chai đủ màu', 1, 'Chi sưu tập nắp chai.'],
      ['Chi dùng những chiếc nắp chai để làm gì?', ['ghép thành bức tranh con cá voi', 'bán lấy tiền', 'làm đồ chơi'], 'ghép thành bức tranh con cá voi', 2, 'Chi ghép thành bức tranh con cá voi.'],
      ['Từ "chúng" trong câu "Chi dùng chúng ghép thành bức tranh" thay thế cho từ ngữ nào?', ['những chiếc nắp chai', 'các bạn', 'bức tranh'], 'những chiếc nắp chai', 3, '"chúng" thay cho những chiếc nắp chai.'],
      ['Vì sao cả lớp cùng góp nắp chai cho Chi?', ['Vì bức tranh đẹp và có ý nghĩa bảo vệ môi trường', 'Vì cô giáo bắt buộc', 'Vì nắp chai đắt tiền'], 'Vì bức tranh đẹp và có ý nghĩa bảo vệ môi trường', 4, 'Bức tranh nhắc mọi người giữ gìn môi trường.']]),
  W(5, 'tn', 'Bài 9–10', 'Trước cổng trời; Kì diệu rừng xanh', 'Từ đồng nghĩa', 'thiennhien', ['dongnghia'],
    'Buổi sáng trên rừng thông', 'Mặt trời vừa nhô lên, rừng thông còn chìm trong làn sương mỏng. Từng giọt sương long lanh đọng trên đầu lá kim. Gió thoảng qua, cả rừng thông khẽ reo lên như sóng biển xa. Một chú sóc nâu nhanh nhẹn chuyền từ cành này sang cành khác. Dưới gốc cây, những cây nấm nhỏ xinh xắn đội chiếc mũ màu nâu đỏ. Hít một hơi thật sâu, tôi nghe mùi nhựa thông thơm dịu lan khắp lồng ngực.',
    [['Khi mặt trời vừa nhô lên, rừng thông thế nào?', ['còn chìm trong làn sương mỏng', 'nắng chói chang', 'mưa tầm tã'], 'còn chìm trong làn sương mỏng', 1, 'Rừng thông còn chìm trong sương mỏng.'],
      ['Tiếng rừng thông reo được so sánh với gì?', ['sóng biển xa', 'tiếng chim hót', 'tiếng sáo'], 'sóng biển xa', 2, 'Rừng thông reo như sóng biển xa.'],
      ['Từ nào đồng nghĩa với "nhanh nhẹn" trong bài?', ['lanh lợi', 'chậm chạp', 'lười biếng'], 'lanh lợi', 3, '"nhanh nhẹn" và "lanh lợi" có nghĩa gần nhau.'],
      ['Bài văn thể hiện tình cảm gì của tác giả?', ['Yêu mến, say mê vẻ đẹp của thiên nhiên', 'Sợ hãi khi vào rừng', 'Buồn chán'], 'Yêu mến, say mê vẻ đẹp của thiên nhiên', 4, 'Tác giả tả cảnh rừng với nhiều cảm xúc yêu mến.']]),
  W(6, 'tn', 'Bài 11–12', 'Hang Sơn Đoòng – những điều kì thú; Những hòn đảo trên vịnh Hạ Long', 'Luyện tập về từ đồng nghĩa', 'thiennhien', ['dongnghia'],
    'Chuyến thám hiểm hang động', 'Đoàn học sinh theo chân chú hướng dẫn viên vào một hang động lớn. Lối vào hẹp, nhưng càng đi sâu, lòng hang càng rộng mênh mông. Những khối thạch nhũ khổng lồ rủ xuống như những chiếc rèm đá. Ánh đèn pin rọi vào, thạch nhũ lấp lánh như dát bạc. Chú hướng dẫn viên kể, phải mất hàng triệu năm nước mới tạo nên những hình thù kì lạ ấy. Ai cũng trầm trồ trước bàn tay kì diệu của thiên nhiên.',
    [['Lòng hang thế nào khi càng đi sâu?', ['càng rộng mênh mông', 'càng hẹp', 'càng tối và nhỏ'], 'càng rộng mênh mông', 1, 'Càng đi sâu, lòng hang càng rộng mênh mông.'],
      ['Thạch nhũ được so sánh với gì?', ['những chiếc rèm đá', 'những cây cột gỗ', 'những đám mây'], 'những chiếc rèm đá', 2, 'Thạch nhũ rủ xuống như những chiếc rèm đá.'],
      ['Từ nào đồng nghĩa với "khổng lồ"?', ['to lớn', 'nhỏ bé', 'xinh xắn'], 'to lớn', 3, '"khổng lồ" và "to lớn" đồng nghĩa.'],
      ['Vì sao mọi người trầm trồ?', ['Vì thiên nhiên mất hàng triệu năm tạo nên vẻ đẹp kì diệu', 'Vì hang quá tối', 'Vì đi bộ mệt'], 'Vì thiên nhiên mất hàng triệu năm tạo nên vẻ đẹp kì diệu', 4, 'Mọi người thán phục bàn tay kì diệu của thiên nhiên.']]),
  W(7, 'tn', 'Bài 13–14', 'Mầm non; Những ngọn núi nóng rẫy', 'Từ đa nghĩa', 'thiennhien', ['danghia'],
    'Ngọn núi lửa ngủ say', 'Ở một hòn đảo xa có ngọn núi lửa đã ngủ hàng trăm năm. Trên miệng núi, nước mưa đọng lại thành một hồ nước trong xanh. Dưới chân núi, đất đỏ màu mỡ, người dân trồng cà phê, hồ tiêu xanh tốt. Các nhà khoa học vẫn đặt máy theo dõi ngọn núi suốt ngày đêm. Họ nói núi lửa có thể "thức giấc" bất cứ lúc nào, nên con người phải luôn cẩn trọng, vừa biết tận dụng vừa biết tôn trọng thiên nhiên.',
    [['Trên miệng núi lửa có gì?', ['một hồ nước trong xanh', 'một ngôi làng', 'một khu rừng'], 'một hồ nước trong xanh', 1, 'Nước mưa đọng lại thành hồ.'],
      ['Người dân dưới chân núi trồng cây gì?', ['cà phê, hồ tiêu', 'lúa, ngô', 'chè, mía'], 'cà phê, hồ tiêu', 2, 'Người dân trồng cà phê, hồ tiêu.'],
      ['Trong cụm từ "chân núi", từ "chân" mang nghĩa gì?', ['nghĩa chuyển', 'nghĩa gốc'], 'nghĩa chuyển', 3, '"chân núi" là phần dưới cùng của núi – nghĩa chuyển của từ "chân".'],
      ['Bài đọc nhắn nhủ điều gì?', ['Con người cần vừa tận dụng vừa tôn trọng thiên nhiên', 'Không nên sống gần núi', 'Núi lửa không nguy hiểm'], 'Con người cần vừa tận dụng vừa tôn trọng thiên nhiên', 4, 'Câu cuối bài nêu ý nhắn nhủ.']]),
  W(8, 'tn', 'Bài 15–16', 'Bài ca về mặt trời; Xin chào, Xa-ha-ra', 'Luyện tập về từ đa nghĩa', 'thiennhien', ['danghia'],
    'Sa mạc về đêm', 'Ban ngày, sa mạc nóng như lò lửa, cát bỏng rát dưới chân. Nhưng khi mặt trời lặn, không khí lạnh đi rất nhanh. Bầu trời sa mạc về đêm trong vắt, hàng nghìn vì sao lấp lánh như ai rắc kim cương. Đoàn lạc đà nằm nghỉ, đầu gối lên những đụn cát mềm. Người dẫn đường đốt lửa, kể chuyện về những ốc đảo xanh mát giữa biển cát mênh mông. Ai cũng thấy sa mạc không chỉ khắc nghiệt mà còn đẹp lạ lùng.',
    [['Ban ngày, sa mạc thế nào?', ['nóng như lò lửa', 'lạnh giá', 'mưa nhiều'], 'nóng như lò lửa', 1, 'Ban ngày sa mạc nóng như lò lửa.'],
      ['Bầu trời sa mạc về đêm được tả ra sao?', ['trong vắt, hàng nghìn vì sao lấp lánh', 'đầy mây đen', 'đỏ rực'], 'trong vắt, hàng nghìn vì sao lấp lánh', 2, 'Bầu trời trong vắt, sao lấp lánh như kim cương.'],
      ['Trong câu "Đoàn lạc đà nằm nghỉ, đầu gối lên những đụn cát mềm", từ "đầu" mang nghĩa gì?', ['nghĩa gốc (bộ phận cơ thể)', 'nghĩa chuyển (phần trước của vật)'], 'nghĩa gốc (bộ phận cơ thể)', 3, '"đầu" của lạc đà là bộ phận cơ thể – nghĩa gốc.'],
      ['Câu cuối bài cho thấy cảm nhận gì về sa mạc?', ['Sa mạc khắc nghiệt nhưng cũng rất đẹp', 'Sa mạc chỉ toàn cát buồn tẻ', 'Không ai nên đến sa mạc'], 'Sa mạc khắc nghiệt nhưng cũng rất đẹp', 4, 'Sa mạc không chỉ khắc nghiệt mà còn đẹp lạ lùng.']]),
  W(9, 'on', 'Ôn tập giữa học kì 1', 'Ôn tập các bài đọc tuần 1–8', 'Ôn danh từ, động từ, tính từ, đại từ, từ đồng nghĩa, từ đa nghĩa', 'thiennhien', ['tuloai', 'daitu', 'dongnghia', 'danghia'],
    'Cây gạo đầu làng', 'Đầu làng tôi có một cây gạo già. Mùa xuân, cây gạo nở hoa đỏ rực như ngàn ngọn đuốc thắp sáng cả một góc trời. Đàn chim sáo, chim chào mào kéo về ríu rít. Chúng hót vang như mở hội. Cuối xuân, hoa gạo rụng đầy mặt đất, bọn trẻ nhặt hoa xâu thành vòng. Đến mùa hè, quả gạo chín, bông trắng bay lả tả như tuyết. Với chúng tôi, cây gạo là người bạn già hiền lành của cả làng.',
    [['Cây gạo nở hoa vào mùa nào?', ['mùa xuân', 'mùa thu', 'mùa đông'], 'mùa xuân', 1, 'Mùa xuân, cây gạo nở hoa đỏ rực.'],
      ['Hoa gạo được so sánh với gì?', ['ngàn ngọn đuốc', 'tuyết trắng', 'ngôi sao'], 'ngàn ngọn đuốc', 2, 'Hoa đỏ rực như ngàn ngọn đuốc.'],
      ['Từ "Chúng" trong câu "Chúng hót vang như mở hội" thay thế cho từ ngữ nào?', ['đàn chim sáo, chim chào mào', 'bọn trẻ', 'hoa gạo'], 'đàn chim sáo, chim chào mào', 3, '"Chúng" là đại từ thay cho đàn chim.'],
      ['Vì sao tác giả gọi cây gạo là "người bạn già hiền lành"?', ['Vì cây gạo gắn bó, mang niềm vui cho cả làng qua nhiều năm', 'Vì cây gạo biết nói', 'Vì cây gạo sắp bị chặt'], 'Vì cây gạo gắn bó, mang niềm vui cho cả làng qua nhiều năm', 4, 'Cây gạo gắn bó với tuổi thơ và cả làng.']]),
  W(10, 'ht', 'Bài 17–18', 'Thư gửi các học sinh; Tấm gương tự học', 'Sử dụng từ điển', 'hoctap', ['tudien'],
    'Ngọn đèn dầu của ông', 'Ông nội em kể, ngày nhỏ nhà ông nghèo, không có điện. Tối nào ông cũng thắp ngọn đèn dầu nhỏ để học bài. Không có tiền mua sách, ông mượn sách của bạn rồi chép lại từng trang. Có hôm ông đọc sách đến khuya, khói đèn ám đen cả đầu mũi. Nhờ tự học chăm chỉ, ông trở thành thầy giáo dạy Toán của trường huyện. Ông vẫn giữ ngọn đèn dầu ấy, đặt trên giá sách để nhắc con cháu: học tập là con đường mở ra tương lai.',
    [['Ngày nhỏ, ông học bài dưới ánh sáng gì?', ['ngọn đèn dầu', 'đèn điện', 'ánh trăng'], 'ngọn đèn dầu', 1, 'Ông thắp đèn dầu để học bài.'],
      ['Không có tiền mua sách, ông đã làm gì?', ['mượn sách của bạn rồi chép lại', 'bỏ học', 'nghe bạn đọc'], 'mượn sách của bạn rồi chép lại', 2, 'Ông mượn sách rồi chép lại từng trang.'],
      ['Nhờ đâu ông trở thành thầy giáo?', ['nhờ tự học chăm chỉ', 'nhờ nhà giàu', 'nhờ may mắn'], 'nhờ tự học chăm chỉ', 3, 'Ông trở thành thầy giáo nhờ tự học.'],
      ['Ông giữ ngọn đèn dầu để nhắc con cháu điều gì?', ['Học tập là con đường mở ra tương lai', 'Phải tiết kiệm dầu', 'Đèn dầu sáng hơn đèn điện'], 'Học tập là con đường mở ra tương lai', 4, 'Câu cuối bài nêu lời nhắc của ông.']]),
  W(11, 'ht', 'Bài 19–20', 'Trải nghiệm để sáng tạo; Khổ luyện thành tài', 'Luyện tập sử dụng từ điển', 'hoctap', ['tudien'],
    'Cây đàn bầu của Tuấn', 'Tuấn mê tiếng đàn bầu từ khi nghe ông ngoại đánh bài "Quê hương". Ông dạy Tuấn cách đặt tay, cách rung dây. Những ngày đầu, ngón tay Tuấn đau rát, tiếng đàn lúc trầm lúc rè. Có lúc Tuấn muốn bỏ cuộc. Ông bảo: "Đàn bầu chỉ có một dây, nhưng người chơi phải kiên nhẫn gấp trăm lần." Tuấn lại cặm cụi tập mỗi tối. Ba năm sau, tiếng đàn của Tuấn vang lên trong hội diễn của tỉnh, ngân nga, tha thiết như lời ru.',
    [['Ai dạy Tuấn đánh đàn bầu?', ['ông ngoại', 'cô giáo', 'bố'], 'ông ngoại', 1, 'Ông ngoại dạy Tuấn.'],
      ['Những ngày đầu tập đàn, Tuấn gặp khó khăn gì?', ['ngón tay đau rát, tiếng đàn lúc trầm lúc rè', 'không có đàn', 'không ai dạy'], 'ngón tay đau rát, tiếng đàn lúc trầm lúc rè', 2, 'Ngón tay đau rát, tiếng đàn chưa hay.'],
      ['Lời ông "người chơi phải kiên nhẫn gấp trăm lần" khuyên Tuấn điều gì?', ['Phải bền bỉ, kiên nhẫn luyện tập', 'Nên đổi sang đàn khác', 'Chỉ cần tập ít'], 'Phải bền bỉ, kiên nhẫn luyện tập', 3, 'Ông khuyên Tuấn kiên nhẫn.'],
      ['Câu chuyện giúp em hiểu điều gì?', ['Có khổ luyện mới thành tài', 'Tài năng là do may mắn', 'Không nên học nhạc cụ'], 'Có khổ luyện mới thành tài', 4, 'Nhờ kiên trì tập luyện, Tuấn đã thành công.']]),
  W(12, 'ht', 'Bài 21–22', 'Thế giới trong trang sách; Từ những câu chuyện ấu thơ', 'Dấu gạch ngang', 'hoctap', ['gachngang'],
    'Chiếc tủ sách của lớp', 'Đầu năm học, lớp 5A lập "Tủ sách bạn bè" ở cuối lớp. Mỗi bạn góp hai cuốn sách mình yêu thích. Tủ sách có đủ loại:\n– truyện cổ tích;\n– sách khoa học;\n– truyện tranh về lịch sử.\nGiờ ra chơi, góc lớp lúc nào cũng đông. Minh – người lớp trưởng ít nói – lại là người mượn sách nhiều nhất. Cuối học kì, cả lớp bình chọn cuốn sách hay nhất và viết cảm nghĩ treo cạnh tủ sách.',
    [['Lớp 5A lập tủ sách ở đâu?', ['ở cuối lớp', 'ở thư viện', 'ở sân trường'], 'ở cuối lớp', 1, 'Tủ sách đặt ở cuối lớp.'],
      ['Mỗi bạn góp bao nhiêu cuốn sách?', ['hai cuốn', 'một cuốn', 'năm cuốn'], 'hai cuốn', 2, 'Mỗi bạn góp hai cuốn sách.'],
      ['Dấu gạch ngang ở đầu các dòng "– truyện cổ tích; – sách khoa học;…" dùng để làm gì?', ['đánh dấu các ý liệt kê', 'đánh dấu lời nói của nhân vật', 'đánh dấu phần chú thích'], 'đánh dấu các ý liệt kê', 3, 'Dấu gạch ngang đầu dòng đánh dấu các ý liệt kê.'],
      ['Phần "người lớp trưởng ít nói" đặt giữa hai dấu gạch ngang có tác dụng gì?', ['chú thích, giải thích thêm về Minh', 'đánh dấu lời nói', 'liệt kê các ý'], 'chú thích, giải thích thêm về Minh', 4, 'Dấu gạch ngang đánh dấu bộ phận chú thích.']]),
  W(13, 'ht', 'Bài 23–24', 'Giới thiệu sách Dế Mèn phiêu lưu kí; Tinh thần học tập của nhà Phi-lít', 'Luyện tập về dấu gạch ngang', 'hoctap', ['gachngang'],
    'Gia đình mê học', 'Nhà bạn Khôi có một thói quen đặc biệt: mỗi tối, cả nhà tắt ti vi một giờ để cùng đọc sách. Bố đọc báo, mẹ đọc sách nấu ăn, còn Khôi và em gái đọc truyện. Đọc xong, mỗi người kể lại cho cả nhà nghe một điều mới. Có hôm, em gái Khôi hỏi:\n– Vì sao cá không bị chết đuối hả anh?\nCả nhà cùng tra sách để tìm câu trả lời. Khôi bảo, nhờ "giờ đọc sách", nhà bạn lúc nào cũng rộn tiếng cười và câu hỏi.',
    [['Mỗi tối, nhà Khôi tắt ti vi bao lâu để đọc sách?', ['một giờ', 'hai giờ', 'nửa giờ'], 'một giờ', 1, 'Cả nhà tắt ti vi một giờ.'],
      ['Đọc xong, mỗi người làm gì?', ['kể lại cho cả nhà một điều mới', 'đi ngủ ngay', 'viết bài văn'], 'kể lại cho cả nhà một điều mới', 2, 'Mỗi người kể lại một điều mới.'],
      ['Dấu gạch ngang ở đầu dòng "– Vì sao cá không bị chết đuối hả anh?" dùng để làm gì?', ['đánh dấu lời nói của nhân vật', 'đánh dấu các ý liệt kê', 'nối các từ trong liên danh'], 'đánh dấu lời nói của nhân vật', 3, 'Dấu gạch ngang đánh dấu lời đối thoại.'],
      ['Thói quen "giờ đọc sách" mang lại điều gì cho gia đình Khôi?', ['Gia đình gắn bó, vui vẻ và ham hiểu biết', 'Cả nhà ít nói chuyện', 'Mọi người bỏ xem ti vi mãi mãi'], 'Gia đình gắn bó, vui vẻ và ham hiểu biết', 4, 'Nhà bạn rộn tiếng cười và câu hỏi.']]),
  W(14, 'nt', 'Bài 25–26', 'Tiếng đàn ba-la-lai-ca trên sông Đà; Trí tưởng tượng phong phú', 'Biện pháp điệp từ, điệp ngữ', 'nghethuat', ['diepngu'],
    'Bức tranh của em', 'Em vẽ một bức tranh về quê ngoại. Em vẽ dòng sông xanh uốn quanh làng. Em vẽ cánh đồng lúa vàng óng dưới nắng. Em vẽ cả bà ngoại đứng bên ngõ, tay vẫy chào. Thầy dạy mĩ thuật bảo bức tranh còn vụng về nét vẽ, nhưng chứa nhiều tình cảm. Thầy treo bức tranh lên bảng tin của trường. Nhìn bức tranh, em như nghe thấy tiếng gió đồng, như ngửi thấy mùi rơm rạ của quê ngoại.',
    [['Em vẽ bức tranh về đâu?', ['quê ngoại', 'thành phố', 'trường học'], 'quê ngoại', 1, 'Em vẽ tranh về quê ngoại.'],
      ['Trong tranh, bà ngoại đang làm gì?', ['đứng bên ngõ, tay vẫy chào', 'đang nấu cơm', 'đang gặt lúa'], 'đứng bên ngõ, tay vẫy chào', 2, 'Bà đứng bên ngõ vẫy chào.'],
      ['Cụm từ nào được lặp lại nhiều lần trong đoạn văn?', ['Em vẽ', 'dòng sông', 'bức tranh'], 'Em vẽ', 3, '"Em vẽ" được lặp lại để nhấn mạnh.'],
      ['Vì sao thầy khen bức tranh dù nét vẽ còn vụng?', ['Vì bức tranh chứa nhiều tình cảm của em với quê ngoại', 'Vì tranh rất to', 'Vì em vẽ nhanh'], 'Vì bức tranh chứa nhiều tình cảm của em với quê ngoại', 4, 'Thầy khen bức tranh chứa nhiều tình cảm.']]),
  W(15, 'nt', 'Bài 27–28', 'Tranh làng Hồ; Tập hát quan họ', 'Luyện tập về điệp từ, điệp ngữ', 'nghethuat', ['diepngu'],
    'Những người làm tranh giấy dó', 'Ở làng nghề ven sông, người ta vẫn làm giấy dó theo cách của ông cha. Vỏ cây dó được ngâm, giã nhuyễn rồi xeo thành từng tờ giấy mỏng. Trên nền giấy xốp, mịn ấy, các nghệ nhân in những bức tranh dân gian: đàn gà, đàn lợn, cảnh đánh vật, cảnh chăn trâu thổi sáo. Màu đỏ lấy từ sỏi son, màu đen lấy từ than lá tre. Mỗi bức tranh như một lời kể về cuộc sống bình dị, vui tươi của làng quê.',
    [['Giấy dó được làm từ gì?', ['vỏ cây dó', 'lá chuối', 'rơm rạ'], 'vỏ cây dó', 1, 'Giấy dó làm từ vỏ cây dó.'],
      ['Màu đen trong tranh được lấy từ đâu?', ['than lá tre', 'sỏi son', 'hoa hoè'], 'than lá tre', 2, 'Màu đen lấy từ than lá tre.'],
      ['Từ "cảnh" được lặp lại trong câu "cảnh đánh vật, cảnh chăn trâu thổi sáo" có tác dụng gì?', ['nhấn mạnh, liệt kê các đề tài phong phú của tranh', 'nối hai câu văn', 'thay thế từ ngữ trước'], 'nhấn mạnh, liệt kê các đề tài phong phú của tranh', 3, 'Từ được lặp lại để nhấn mạnh và liệt kê.'],
      ['Bài đọc giúp em hiểu điều gì về tranh dân gian?', ['Tranh phản ánh cuộc sống bình dị, vui tươi và được làm rất công phu', 'Tranh được vẽ bằng máy', 'Tranh chỉ có một màu'], 'Tranh phản ánh cuộc sống bình dị, vui tươi và được làm rất công phu', 4, 'Câu cuối nêu ý nghĩa của tranh.']]),
  W(16, 'nt', 'Bài 29–30', 'Phim hoạt hình Chú ốc sên bay; Nghệ thuật múa ba lê', 'Kết từ', 'nghethuat', ['kettu'],
    'Xưởng phim nhỏ của lớp', 'Lớp 5B quyết định tự làm một bộ phim hoạt hình ngắn. Các bạn nặn những nhân vật bằng đất sét và dựng cảnh bằng bìa giấy. Mỗi cử động nhỏ, các bạn lại chụp một bức ảnh. Phải chụp hơn ba trăm bức ảnh thì nhân vật chú rùa mới đi được một quãng ngắn. Công việc vất vả nhưng ai cũng háo hức. Ngày chiếu phim, cả trường vỗ tay khi chú rùa đất sét về đích trước thỏ.',
    [['Các bạn nặn nhân vật bằng gì?', ['đất sét', 'gỗ', 'nhựa'], 'đất sét', 1, 'Nhân vật được nặn bằng đất sét.'],
      ['Phải chụp bao nhiêu bức ảnh để chú rùa đi được một quãng ngắn?', ['hơn ba trăm bức', 'mười bức', 'năm mươi bức'], 'hơn ba trăm bức', 2, 'Phải chụp hơn ba trăm bức ảnh.'],
      ['Trong câu "Công việc vất vả nhưng ai cũng háo hức.", kết từ "nhưng" biểu thị quan hệ gì?', ['tương phản', 'nguyên nhân – kết quả', 'điều kiện'], 'tương phản', 3, '"nhưng" nối hai ý trái ngược.'],
      ['Câu chuyện cho thấy điều gì?', ['Sự kiên nhẫn và tinh thần hợp tác giúp tạo nên sản phẩm nghệ thuật', 'Làm phim rất dễ', 'Chỉ người lớn mới làm được phim'], 'Sự kiên nhẫn và tinh thần hợp tác giúp tạo nên sản phẩm nghệ thuật', 4, 'Cả lớp kiên nhẫn, cùng nhau làm phim.']]),
  W(17, 'nt', 'Bài 31–32', 'Một ngôi chùa độc đáo; Sự tích chú Tễu', 'Luyện tập về kết từ', 'nghethuat', ['kettu'],
    'Buổi diễn rối nước', 'Chiều chủ nhật, bố đưa em đi xem múa rối nước. Sân khấu là một mặt ao, phía sau có mái đình nhỏ che rèm tre. Tiếng trống, tiếng sáo vừa nổi lên thì những con rối gỗ lướt ra trên mặt nước. Chú Tễu cười toe toét, giới thiệu từng tiết mục. Có cảnh nông dân cấy lúa, có cảnh đua thuyền và cả cảnh rồng phun nước. Em thắc mắc vì sao con rối cử động được. Bố giải thích rằng các nghệ nhân đứng sau rèm, ngâm mình dưới nước để điều khiển.',
    [['Sân khấu múa rối nước là gì?', ['một mặt ao', 'một sân khấu gỗ', 'một bãi cỏ'], 'một mặt ao', 1, 'Sân khấu là một mặt ao.'],
      ['Ai giới thiệu các tiết mục?', ['chú Tễu', 'bố em', 'người dẫn chương trình'], 'chú Tễu', 2, 'Chú Tễu giới thiệu từng tiết mục.'],
      ['Chọn tất cả kết từ trong câu "Tiếng trống, tiếng sáo vừa nổi lên thì những con rối gỗ lướt ra trên mặt nước."', ['thì', 'trên', 'trống', 'lướt'], ['thì', 'trên'], 3, '"thì", "trên" là kết từ; "trống" là danh từ, "lướt" là động từ.'],
      ['Chi tiết nghệ nhân ngâm mình dưới nước cho thấy điều gì?', ['Nghề múa rối nước rất vất vả, công phu', 'Nghệ nhân thích bơi', 'Con rối tự cử động'], 'Nghề múa rối nước rất vất vả, công phu', 4, 'Để có buổi diễn, nghệ nhân phải chịu nhiều vất vả.']]),
  W(18, 'on', 'Ôn tập cuối học kì 1', 'Ôn tập các bài đọc học kì 1', 'Ôn từ đồng nghĩa, từ đa nghĩa, kết từ, điệp từ, dấu gạch ngang', 'nghethuat', ['dongnghia', 'danghia', 'kettu', 'diepngu', 'gachngang'],
    'Lá thư gửi bạn nhỏ vùng cao', 'Hoa thân mến!\nMình là Mai, học lớp 5A ở thành phố. Lớp mình vừa quyên góp được ba thùng sách và áo ấm gửi lên trường bạn. Mình gửi kèm cuốn truyện mình thích nhất – cuốn "Những tấm lòng cao cả". Mình mong bạn đọc và kể cho mình nghe cảm nghĩ nhé. Mình nghe cô giáo kể ở bản bạn có thác nước đẹp, có ruộng bậc thang vàng óng. Hè này, mình mong được lên thăm bạn.\nThân mến,\nMai',
    [['Mai học ở đâu?', ['ở thành phố', 'ở vùng cao', 'ở nông thôn'], 'ở thành phố', 1, 'Mai học lớp 5A ở thành phố.'],
      ['Lớp Mai quyên góp được những gì?', ['ba thùng sách và áo ấm', 'tiền và gạo', 'đồ chơi'], 'ba thùng sách và áo ấm', 2, 'Lớp quyên góp ba thùng sách và áo ấm.'],
      ['Dấu gạch ngang trong câu "cuốn truyện mình thích nhất – cuốn "Những tấm lòng cao cả"" dùng để làm gì?', ['đánh dấu bộ phận chú thích, giải thích', 'đánh dấu lời đối thoại', 'liệt kê'], 'đánh dấu bộ phận chú thích, giải thích', 3, 'Phần sau dấu gạch ngang giải thích là cuốn truyện nào.'],
      ['Lá thư thể hiện tình cảm gì của Mai?', ['Quan tâm, chia sẻ và mong kết bạn với bạn nhỏ vùng cao', 'Khoe khoang về thành phố', 'Muốn xin sách của Hoa'], 'Quan tâm, chia sẻ và mong kết bạn với bạn nhỏ vùng cao', 4, 'Mai gửi quà, hỏi han và mong được thăm bạn.']]),
  // ======================================== HỌC KÌ 2
  W(19, 'cs', 'Bài 1–2', 'Tiếng hát của người đá; Khúc hát ru những em bé lớn trên lưng mẹ', 'Câu đơn và câu ghép', 'cuocsong', ['caughep'],
    'Lời ru trên nương', 'Ở bản em, các mẹ thường địu con lên nương. Mẹ cuốc đất, em bé ngủ ngon lành trên lưng mẹ. Nắng chiều vàng nhạt, gió thổi qua những ruộng ngô xanh mướt. Mẹ vừa làm vừa hát ru. Lời ru mộc mạc kể về hạt ngô, hạt lúa, về con suối, ngọn đồi. Em bé lớn lên trong tiếng ru ấy, mang theo tình yêu với núi rừng và đôi bàn tay chăm chỉ của mẹ.',
    [['Các mẹ ở bản thường địu con đi đâu?', ['lên nương', 'ra chợ', 'đến trường'], 'lên nương', 1, 'Các mẹ địu con lên nương.'],
      ['Lời ru của mẹ kể về những gì?', ['hạt ngô, hạt lúa, con suối, ngọn đồi', 'thành phố, xe cộ', 'biển cả, thuyền bè'], 'hạt ngô, hạt lúa, con suối, ngọn đồi', 2, 'Lời ru kể về hạt ngô, hạt lúa, suối, đồi.'],
      ['Câu "Mẹ cuốc đất, em bé ngủ ngon lành trên lưng mẹ." là câu gì?', ['câu ghép', 'câu đơn'], 'câu ghép', 3, 'Câu có hai vế: "Mẹ cuốc đất" và "em bé ngủ ngon lành…".'],
      ['Bài đọc ca ngợi điều gì?', ['Tình mẹ và vẻ đẹp lao động của người dân vùng cao', 'Cảnh đẹp thành phố', 'Lễ hội mùa xuân'], 'Tình mẹ và vẻ đẹp lao động của người dân vùng cao', 4, 'Bài ca ngợi người mẹ vùng cao.']]),
  W(20, 'cs', 'Bài 3–4', 'Hạt gạo làng ta; Hộp quà màu thiên thanh', 'Cách nối các vế câu ghép', 'cuocsong', ['noicaughep'],
    'Bát cơm mới', 'Vụ mùa năm nay, nhà bà nội được mùa. Bà đem thóc mới đi xay, nấu nồi cơm đầu tiên thơm phức. Vì hạt gạo làm ra bằng mồ hôi của cả nhà nên ai cũng ăn rất trân trọng. Bà dặn: "Mỗi hạt gạo có nắng, có mưa, có công người cày cấy." Tuy bữa cơm chỉ có rau luộc và cá kho nhưng cả nhà thấy ngon hơn mọi bữa tiệc. Từ đó, em không bao giờ để rơi vãi một hạt cơm.',
    [['Bà nội nấu nồi cơm đầu tiên bằng gì?', ['thóc mới', 'gạo mua ở chợ', 'gạo nếp'], 'thóc mới', 1, 'Bà đem thóc mới đi xay.'],
      ['Bữa cơm có những món gì?', ['rau luộc và cá kho', 'thịt gà và canh cua', 'bánh chưng'], 'rau luộc và cá kho', 2, 'Bữa cơm có rau luộc và cá kho.'],
      ['Các vế trong câu "Vì hạt gạo làm ra bằng mồ hôi của cả nhà nên ai cũng ăn rất trân trọng." được nối bằng gì?', ['cặp kết từ "Vì … nên …"', 'dấu phẩy', 'kết từ "và"'], 'cặp kết từ "Vì … nên …"', 3, 'Hai vế nối bằng cặp kết từ chỉ nguyên nhân – kết quả.'],
      ['Vì sao em không bao giờ để rơi vãi một hạt cơm?', ['Vì hiểu hạt gạo chứa đựng công sức của người lao động', 'Vì sợ bà mắng', 'Vì gạo đắt'], 'Vì hiểu hạt gạo chứa đựng công sức của người lao động', 4, 'Lời dặn của bà giúp em biết quý hạt gạo.']]),
  W(21, 'cs', 'Bài 5–6', 'Giỏ hoa tháng Năm; Thư của bố', 'Cách nối các vế câu ghép (tiếp theo)', 'cuocsong', ['noicaughep'],
    'Lá thư từ đảo xa', 'Bố em là bộ đội hải quân, đóng quân ở một hòn đảo xa. Mỗi tháng, em lại nhận được một lá thư của bố. Bố kể ngoài đảo có nhiều nắng gió, cây bàng vuông trước doanh trại xanh tốt quanh năm. Nếu biển lặng thì các chú tổ chức đá bóng trên bãi cát. Bố hứa Tết này sẽ về thăm nhà. Em cất từng lá thư vào chiếc hộp gỗ, đêm đêm đọc lại, thấy bố như đang ở bên cạnh.',
    [['Bố em làm nghề gì?', ['bộ đội hải quân', 'thầy giáo', 'kĩ sư'], 'bộ đội hải quân', 1, 'Bố em là bộ đội hải quân.'],
      ['Trước doanh trại có cây gì?', ['cây bàng vuông', 'cây dừa', 'cây phượng'], 'cây bàng vuông', 2, 'Có cây bàng vuông xanh tốt.'],
      ['Câu "Nếu biển lặng thì các chú tổ chức đá bóng trên bãi cát." thể hiện quan hệ gì giữa hai vế?', ['điều kiện – kết quả', 'tương phản', 'tăng tiến'], 'điều kiện – kết quả', 3, 'Cặp kết từ "Nếu … thì …" chỉ điều kiện – kết quả.'],
      ['Chi tiết em đọc lại thư mỗi đêm cho thấy điều gì?', ['Em rất yêu thương, nhớ mong bố', 'Em chưa đọc hiểu thư', 'Em thích sưu tầm thư'], 'Em rất yêu thương, nhớ mong bố', 4, 'Em đọc lại thư vì nhớ bố.']]),
  W(22, 'cs', 'Bài 7–8', 'Đoàn thuyền đánh cá; Khu rừng của Mát', 'Luyện tập về câu ghép', 'cuocsong', ['caughep', 'noicaughep'],
    'Mẻ lưới đầu năm', 'Trời còn mờ sáng, đoàn thuyền đã nối đuôi nhau ra khơi. Gió thổi căng cánh buồm, sóng vỗ rì rào hai bên mạn thuyền. Đến trưa, các ngư dân thả lưới. Lưới vừa kéo lên, cá thu, cá nục nhảy lấp lánh như bạc. Mọi người reo hò vui vẻ. Chiều về, đoàn thuyền đầy ắp cá cập bến; trên bãi cát, các mẹ, các chị đã chờ sẵn. Cả làng chài rộn ràng như ngày hội.',
    [['Đoàn thuyền ra khơi vào lúc nào?', ['lúc trời còn mờ sáng', 'lúc trưa', 'lúc tối'], 'lúc trời còn mờ sáng', 1, 'Trời còn mờ sáng, đoàn thuyền đã ra khơi.'],
      ['Cá được kéo lên trông như thế nào?', ['nhảy lấp lánh như bạc', 'nằm im', 'đen sẫm'], 'nhảy lấp lánh như bạc', 2, 'Cá nhảy lấp lánh như bạc.'],
      ['Câu "Gió thổi căng cánh buồm, sóng vỗ rì rào hai bên mạn thuyền." có mấy vế?', ['2 vế', '3 vế', '1 vế'], '2 vế', 3, 'Hai vế: "Gió thổi căng cánh buồm" và "sóng vỗ rì rào…".'],
      ['Không khí làng chài lúc đoàn thuyền về thế nào?', ['rộn ràng như ngày hội', 'buồn bã', 'yên lặng'], 'rộn ràng như ngày hội', 4, 'Cả làng chài rộn ràng như ngày hội.']]),
  W(23, 'tm', 'Bài 9–10', 'Hội thổi cơm thi ở Đồng Vân; Những búp chè trên cây cổ thụ', 'Liên kết câu bằng cách lặp từ ngữ', 'tramien', ['lk_lap'],
    'Hội thi gói bánh', 'Mỗi dịp Tết, làng em tổ chức hội thi gói bánh chưng. Hội thi diễn ra ở sân đình, các đội mang lá dong, gạo nếp, đỗ xanh đến từ sớm. Bánh của đội nào vuông vức, chặt tay, đẹp mắt thì được điểm cao. Bánh chưng sau khi luộc chín được bày lên mâm cỗ để cả làng cùng thưởng thức. Năm nay, đội của bà em giành giải nhất. Bà bảo, giải thưởng quý nhất là được cùng nhau giữ gìn nét đẹp ngày Tết.',
    [['Hội thi gói bánh diễn ra ở đâu?', ['sân đình', 'nhà văn hoá', 'trường học'], 'sân đình', 1, 'Hội thi diễn ra ở sân đình.'],
      ['Bánh như thế nào thì được điểm cao?', ['vuông vức, chặt tay, đẹp mắt', 'to nhất', 'gói nhanh nhất'], 'vuông vức, chặt tay, đẹp mắt', 2, 'Bánh vuông vức, chặt tay, đẹp mắt được điểm cao.'],
      ['Hai câu đầu của bài được liên kết với nhau bằng cách lặp từ ngữ nào?', ['hội thi', 'bánh chưng', 'làng em'], 'hội thi', 3, 'Từ "hội thi" được lặp lại ở câu thứ hai.'],
      ['Theo bà, giải thưởng quý nhất là gì?', ['được cùng nhau giữ gìn nét đẹp ngày Tết', 'được nhận nhiều tiền', 'được ăn nhiều bánh'], 'được cùng nhau giữ gìn nét đẹp ngày Tết', 4, 'Câu cuối nêu lời bà.']]),
  W(24, 'tm', 'Bài 11–12', 'Hương cốm mùa thu; Vũ điệu trên nền thổ cẩm', 'Liên kết câu bằng từ ngữ nối', 'tramien', ['lk_noi'],
    'Tấm khăn thổ cẩm', 'Chị Pàng ở bản trên dệt thổ cẩm rất khéo. Trước tiên, chị se sợi lanh rồi nhuộm màu bằng lá cây rừng. Sau đó, chị ngồi bên khung cửi suốt nhiều ngày để dệt. Những hoa văn hình con chim, bông hoa, ngọn núi dần hiện lên rực rỡ. Tuy công việc tỉ mỉ và vất vả, chị vẫn luôn mỉm cười. Vì thế, mỗi tấm khăn chị dệt như chứa cả niềm vui và sự khéo léo của người phụ nữ vùng cao.',
    [['Chị Pàng nhuộm sợi lanh bằng gì?', ['lá cây rừng', 'phẩm màu mua ở chợ', 'đất đỏ'], 'lá cây rừng', 1, 'Chị nhuộm màu bằng lá cây rừng.'],
      ['Trên tấm khăn có những hoa văn gì?', ['con chim, bông hoa, ngọn núi', 'ngôi sao, mặt trăng', 'con cá, con thuyền'], 'con chim, bông hoa, ngọn núi', 2, 'Hoa văn hình chim, hoa, núi.'],
      ['Từ ngữ nối nào giúp liên kết câu thứ hai và câu thứ ba?', ['Sau đó', 'Trước tiên', 'Vì thế'], 'Sau đó', 3, '"Sau đó" nối câu thứ ba với câu trước, chỉ trình tự.'],
      ['Câu cuối bài ca ngợi điều gì?', ['Sự khéo léo và niềm vui lao động của người phụ nữ vùng cao', 'Giá trị tiền bạc của tấm khăn', 'Khung cửi hiện đại'], 'Sự khéo léo và niềm vui lao động của người phụ nữ vùng cao', 4, 'Tấm khăn chứa niềm vui và sự khéo léo.']]),
  W(25, 'tm', 'Bài 13–14', 'Đàn t\'rưng – tiếng ca đại ngàn; Đường quê Đồng Tháp Mười', 'Liên kết câu bằng từ ngữ thay thế', 'tramien', ['lk_thay'],
    'Con đường mùa nước nổi', 'Ông Sáu sống ở một vùng quê sông nước miền Tây. Ông đã ngoài bảy mươi tuổi nhưng vẫn ngày ngày chèo xuồng đưa học trò qua sông. Mùa nước nổi, đồng ruộng mênh mông như biển. Những con đường đất chìm dưới nước, chỉ còn hàng cây điên điển trổ bông vàng rực. Bọn trẻ gọi ông là "ông lái đò của chữ". Ông cười hiền: "Các cháu được đến trường là ông vui rồi."',
    [['Ông Sáu sống ở đâu?', ['một vùng quê sông nước miền Tây', 'một thành phố lớn', 'vùng núi phía Bắc'], 'một vùng quê sông nước miền Tây', 1, 'Ông sống ở vùng quê sông nước miền Tây.'],
      ['Mùa nước nổi, đồng ruộng được so sánh với gì?', ['biển', 'tấm thảm', 'gương soi'], 'biển', 2, 'Đồng ruộng mênh mông như biển.'],
      ['Trong câu thứ hai, từ "Ông" thay thế cho từ ngữ nào ở câu thứ nhất?', ['Ông Sáu', 'học trò', 'vùng quê'], 'Ông Sáu', 3, '"Ông" thay thế cho "Ông Sáu", liên kết hai câu.'],
      ['Vì sao bọn trẻ gọi ông là "ông lái đò của chữ"?', ['Vì ông chở các bạn qua sông đến trường học chữ', 'Vì ông dạy chữ trên đò', 'Vì ông bán sách'], 'Vì ông chở các bạn qua sông đến trường học chữ', 4, 'Ông đưa học trò qua sông đi học.']]),
  W(26, 'tm', 'Bài 15–16', 'Xuồng ba lá quê tôi; Về thăm Đất Mũi', 'Luyện tập về liên kết câu trong đoạn văn', 'tramien', ['lienket'],
    'Cực Nam Tổ quốc', 'Hè vừa rồi, em được cùng bố mẹ về thăm mũi đất cực Nam của Tổ quốc. Nơi đây, rừng đước xanh ngút ngàn chạy dài ra biển. Những cây đước đứng thẳng tắp, rễ cắm sâu xuống bùn như những chân nến khổng lồ. Chúng giữ đất, lấn biển mỗi năm thêm hàng chục mét. Đứng ở mốc toạ độ, em nhìn ra biển mênh mông. Sau đó, cả nhà chụp một tấm ảnh để nhớ mãi chuyến đi đến tận cùng đất nước.',
    [['Em cùng bố mẹ về thăm nơi nào?', ['mũi đất cực Nam của Tổ quốc', 'đỉnh núi cao nhất', 'thủ đô'], 'mũi đất cực Nam của Tổ quốc', 1, 'Em về thăm mũi đất cực Nam.'],
      ['Rễ cây đước được so sánh với gì?', ['những chân nến khổng lồ', 'những sợi dây thừng', 'những con rắn'], 'những chân nến khổng lồ', 2, 'Rễ đước như những chân nến khổng lồ.'],
      ['Từ "Chúng" trong câu "Chúng giữ đất, lấn biển…" thay thế cho từ ngữ nào?', ['những cây đước', 'bố mẹ', 'mốc toạ độ'], 'những cây đước', 3, '"Chúng" thay thế cho "những cây đước".'],
      ['Rừng đước có vai trò gì với vùng đất này?', ['giữ đất và lấn biển', 'cho gỗ làm nhà', 'làm cảnh đẹp'], 'giữ đất và lấn biển', 4, 'Đước giữ đất, lấn biển mỗi năm.']]),
  W(27, 'on', 'Ôn tập giữa học kì 2', 'Ôn tập các bài đọc tuần 19–26', 'Ôn câu ghép, nối vế câu ghép, liên kết câu', 'tramien', ['caughep', 'noicaughep', 'lienket'],
    'Chợ nổi trên sông', 'Từ tờ mờ sáng, chợ nổi đã họp trên khúc sông rộng. Hàng trăm chiếc ghe xuồng chở đầy trái cây, rau củ. Mỗi ghe treo một cây sào cao, trên đầu sào buộc thứ hàng mà ghe bán. Nhờ vậy, người mua nhìn từ xa đã biết ghe nào bán bí, ghe nào bán khóm. Tiếng mời chào, tiếng cười nói vang cả mặt sông. Mặt trời lên cao, chợ tan dần; những chiếc ghe lại xuôi về các ngả.',
    [['Chợ nổi họp ở đâu?', ['trên khúc sông rộng', 'ở sân đình', 'trong nhà văn hoá'], 'trên khúc sông rộng', 1, 'Chợ họp trên khúc sông rộng.'],
      ['Vì sao người mua nhìn từ xa đã biết ghe bán gì?', ['vì đầu sào buộc thứ hàng ghe bán', 'vì có biển hiệu đèn', 'vì người bán gọi to'], 'vì đầu sào buộc thứ hàng ghe bán', 2, 'Mỗi ghe treo sào buộc hàng mình bán.'],
      ['Câu "Mặt trời lên cao, chợ tan dần; những chiếc ghe lại xuôi về các ngả." là câu gì?', ['câu ghép', 'câu đơn'], 'câu ghép', 3, 'Câu có nhiều vế, mỗi vế có chủ ngữ, vị ngữ.'],
      ['Từ ngữ "Nhờ vậy" trong bài có tác dụng gì?', ['nối câu, chỉ quan hệ nguyên nhân – kết quả với câu trước', 'thay thế cho "ghe xuồng"', 'lặp lại từ ở câu trước'], 'nối câu, chỉ quan hệ nguyên nhân – kết quả với câu trước', 4, '"Nhờ vậy" là từ ngữ nối.']]),
  W(28, 'co', 'Bài 17–18', 'Nghìn năm văn hiến; Người thầy của muôn đời', 'Luyện tập về đại từ và kết từ', 'chaong', ['daitu', 'kettu'],
    'Chuyến thăm Văn Miếu', 'Lớp em đến thăm Văn Miếu – Quốc Tử Giám. Qua cổng lớn, chúng em đi giữa hai hàng cây cổ thụ rợp bóng. Cô hướng dẫn viên kể đây là trường đại học đầu tiên của nước ta. Những tấm bia đá đặt trên lưng rùa ghi tên các vị tiến sĩ. Chúng đã đứng đó hàng trăm năm và nhắc nhở con cháu về truyền thống hiếu học. Trước khi về, mỗi bạn viết một điều ước học tập và cất vào hộp của lớp.',
    [['Lớp em đến thăm nơi nào?', ['Văn Miếu – Quốc Tử Giám', 'Hoàng thành Thăng Long', 'Bảo tàng Lịch sử'], 'Văn Miếu – Quốc Tử Giám', 1, 'Lớp em đến thăm Văn Miếu – Quốc Tử Giám.'],
      ['Bia đá ghi tên những ai?', ['các vị tiến sĩ', 'các vị vua', 'các tướng lĩnh'], 'các vị tiến sĩ', 2, 'Bia đá ghi tên các vị tiến sĩ.'],
      ['Từ "Chúng" trong câu "Chúng đã đứng đó hàng trăm năm…" thay thế cho từ ngữ nào?', ['những tấm bia đá', 'chúng em', 'hàng cây cổ thụ'], 'những tấm bia đá', 3, '"Chúng" là đại từ thay cho những tấm bia đá.'],
      ['Những tấm bia đá nhắc nhở con cháu về điều gì?', ['truyền thống hiếu học', 'cách xây nhà', 'nghề làm đá'], 'truyền thống hiếu học', 4, 'Bia đá nhắc về truyền thống hiếu học.']]),
  W(29, 'co', 'Bài 19–20', 'Danh y Tuệ Tĩnh; Cụ Đồ Chiểu', 'Luyện tập về từ đồng nghĩa và từ đa nghĩa', 'chaong', ['dongnghia', 'danghia'],
    'Vườn thuốc nam của bà', 'Sau nhà bà ngoại có một vườn thuốc nam nhỏ. Bà trồng cây sả, cây gừng, cây ngải cứu, cây tía tô thành từng luống ngay ngắn. Mỗi khi cháu bị cảm, bà lại hái lá xông cho cháu. Bà kể, ông cha ta từ xưa đã biết dùng cây cỏ quanh nhà để chữa bệnh. Bà dặn em: "Thuốc quý ở ngay quanh mình, nhưng phải hiểu biết mới dùng cho đúng." Em thầm hứa sẽ học thật giỏi để mai sau làm bác sĩ.',
    [['Vườn thuốc nam của bà ở đâu?', ['sau nhà bà ngoại', 'ở chợ', 'trên núi'], 'sau nhà bà ngoại', 1, 'Vườn ở sau nhà bà ngoại.'],
      ['Khi cháu bị cảm, bà làm gì?', ['hái lá xông cho cháu', 'đưa cháu đi viện ngay', 'cho cháu ăn kem'], 'hái lá xông cho cháu', 2, 'Bà hái lá xông cho cháu.'],
      ['Từ nào đồng nghĩa với "chữa bệnh"?', ['điều trị', 'gây bệnh', 'mắc bệnh'], 'điều trị', 3, '"chữa bệnh" và "điều trị" đồng nghĩa.'],
      ['Lời dặn của bà có ý nghĩa gì?', ['Phải có hiểu biết mới dùng thuốc đúng cách', 'Cây nào cũng là thuốc', 'Không cần đi khám bệnh'], 'Phải có hiểu biết mới dùng thuốc đúng cách', 4, 'Bà nhắc phải hiểu biết khi dùng thuốc.']]),
  W(30, 'co', 'Bài 21–22', 'Anh hùng Lao động Trần Đại Nghĩa; Bộ đội về làng', 'Luyện tập về câu ghép', 'chaong', ['caughep', 'noicaughep'],
    'Bác kĩ sư làng em', 'Bác Thành là kĩ sư thuỷ lợi của làng em. Ngày bé, bác rất nghèo nhưng học giỏi nổi tiếng cả xã. Lớn lên, bác học ở thành phố rồi trở về quê. Vì làng hay bị hạn hán nên bác cùng mọi người đào mương, làm trạm bơm. Mùa hè năm ấy, nước mát chảy về khắp cánh đồng, lúa xanh tốt bời bời. Người làng quý bác lắm, không chỉ vì bác giỏi mà còn vì bác luôn nghĩ cho quê hương.',
    [['Bác Thành làm nghề gì?', ['kĩ sư thuỷ lợi', 'bác sĩ', 'thầy giáo'], 'kĩ sư thuỷ lợi', 1, 'Bác Thành là kĩ sư thuỷ lợi.'],
      ['Bác cùng mọi người làm gì để chống hạn?', ['đào mương, làm trạm bơm', 'trồng rừng', 'xây chợ'], 'đào mương, làm trạm bơm', 2, 'Bác cùng mọi người đào mương, làm trạm bơm.'],
      ['Câu "Vì làng hay bị hạn hán nên bác cùng mọi người đào mương, làm trạm bơm." nối các vế bằng gì?', ['cặp kết từ "Vì … nên …"', 'dấu chấm phẩy', 'cặp kết từ "Nếu … thì …"'], 'cặp kết từ "Vì … nên …"', 3, 'Hai vế nối bằng cặp kết từ chỉ nguyên nhân – kết quả.'],
      ['Vì sao người làng rất quý bác Thành?', ['Vì bác giỏi và luôn nghĩ cho quê hương', 'Vì bác giàu có', 'Vì bác ở thành phố'], 'Vì bác giỏi và luôn nghĩ cho quê hương', 4, 'Câu cuối bài nêu lí do.']]),
  W(31, 'co', 'Bài 23–24', 'Về ngôi nhà đang xây; Việt Nam quê hương ta', 'Viết hoa danh từ chung để thể hiện sự tôn trọng đặc biệt', 'chaong', ['viethoa'],
    'Ngày hội đọc sách về Bác', 'Nhân dịp sinh nhật Bác Hồ, trường em tổ chức ngày hội đọc sách. Các bạn kể những câu chuyện về Bác: Bác chia kẹo cho các cháu thiếu nhi, Bác trồng cây ở vườn Phủ Chủ tịch, Bác viết thư khuyên các cháu chăm học. Bạn Hà đọc một đoạn thơ ca ngợi Người. Cả hội trường lặng đi xúc động. Cuối buổi, mỗi lớp viết lời hứa chăm ngoan, học giỏi để xứng đáng là cháu ngoan của Bác.',
    [['Ngày hội đọc sách được tổ chức nhân dịp nào?', ['sinh nhật Bác Hồ', 'Tết Trung thu', 'khai giảng'], 'sinh nhật Bác Hồ', 1, 'Ngày hội tổ chức nhân dịp sinh nhật Bác Hồ.'],
      ['Bạn Hà đọc gì?', ['một đoạn thơ ca ngợi Người', 'một bài báo', 'một truyện cổ tích'], 'một đoạn thơ ca ngợi Người', 2, 'Bạn Hà đọc một đoạn thơ ca ngợi Người.'],
      ['Vì sao từ "Người" trong câu "Bạn Hà đọc một đoạn thơ ca ngợi Người." được viết hoa?', ['để thể hiện sự tôn trọng đặc biệt với Bác Hồ', 'vì đứng đầu câu', 'vì là tên một địa danh'], 'để thể hiện sự tôn trọng đặc biệt với Bác Hồ', 3, 'Danh từ chung "Người" chỉ Bác Hồ được viết hoa để tỏ lòng tôn kính.'],
      ['Lời hứa của các lớp thể hiện điều gì?', ['Lòng kính yêu Bác và quyết tâm chăm ngoan, học giỏi', 'Mong được đi chơi', 'Muốn nhận phần thưởng'], 'Lòng kính yêu Bác và quyết tâm chăm ngoan, học giỏi', 4, 'Các lớp hứa chăm ngoan, học giỏi.']]),
  W(32, 'tg', 'Bài 25–26', 'Bài ca Trái Đất; Những con hạc giấy', 'Cách viết tên người và tên địa lí nước ngoài', 'thegioi', ['tennn'],
    'Một nghìn con hạc giấy', 'Lớp em nghe cô kể câu chuyện về một cô bé ở Nhật Bản. Cô bé bị bệnh nặng sau chiến tranh và tin rằng gấp đủ một nghìn con hạc giấy thì điều ước sẽ thành hiện thực. Ước mơ của cô bé là thế giới không còn chiến tranh. Nghe xong, cả lớp quyết định cùng gấp hạc giấy. Mỗi con hạc mang một lời chúc hoà bình bằng nhiều thứ tiếng. Chúng em treo những chuỗi hạc đủ màu sắc ở cửa lớp, như những cánh chim bay về khắp năm châu.',
    [['Cô bé trong câu chuyện ở nước nào?', ['Nhật Bản', 'Pháp', 'Nga'], 'Nhật Bản', 1, 'Cô bé ở Nhật Bản.'],
      ['Cô bé tin rằng gấp bao nhiêu con hạc thì điều ước thành hiện thực?', ['một nghìn con', 'một trăm con', 'mười con'], 'một nghìn con', 2, 'Gấp đủ một nghìn con hạc giấy.'],
      ['Ước mơ của cô bé là gì?', ['thế giới không còn chiến tranh', 'có nhiều đồ chơi', 'được đi du lịch'], 'thế giới không còn chiến tranh', 3, 'Cô bé mơ ước hoà bình.'],
      ['Việc cả lớp gấp hạc giấy thể hiện điều gì?', ['Mong ước hoà bình và tình hữu nghị với bạn bè khắp thế giới', 'Thi xem ai gấp nhanh', 'Trang trí cho đẹp lớp'], 'Mong ước hoà bình và tình hữu nghị với bạn bè khắp thế giới', 4, 'Mỗi con hạc mang lời chúc hoà bình.']]),
  W(33, 'tg', 'Bài 27–28', 'Một người hùng thầm lặng; Giờ Trái Đất', 'Luyện tập về dấu gạch ngang', 'thegioi', ['gachngang'],
    'Một giờ tắt đèn', 'Tối thứ bảy cuối tháng Ba, khu phố em cùng hưởng ứng Giờ Trái Đất. Đúng tám giờ rưỡi, mọi nhà tắt hết đèn và các thiết bị không cần thiết. Cả khu phố chìm trong bóng tối, chỉ còn ánh trăng và ánh nến lung linh. Bọn trẻ ra sân chơi các trò dân gian:\n– bịt mắt bắt dê;\n– rồng rắn lên mây;\n– kéo co.\nMột giờ trôi qua thật nhanh. Bố bảo, tiết kiệm điện là cách nhỏ nhưng thiết thực để bảo vệ hành tinh.',
    [['Khu phố hưởng ứng Giờ Trái Đất vào lúc nào?', ['tối thứ bảy cuối tháng Ba', 'sáng chủ nhật', 'tối giao thừa'], 'tối thứ bảy cuối tháng Ba', 1, 'Tối thứ bảy cuối tháng Ba.'],
      ['Khi tắt đèn, khu phố còn những ánh sáng nào?', ['ánh trăng và ánh nến', 'đèn đường', 'đèn ô tô'], 'ánh trăng và ánh nến', 2, 'Chỉ còn ánh trăng và ánh nến.'],
      ['Các dấu gạch ngang ở đầu dòng "– bịt mắt bắt dê; – rồng rắn lên mây; – kéo co." dùng để làm gì?', ['đánh dấu các ý liệt kê', 'đánh dấu lời nói', 'đánh dấu phần chú thích'], 'đánh dấu các ý liệt kê', 3, 'Dấu gạch ngang đánh dấu các trò chơi được liệt kê.'],
      ['Theo bố, tiết kiệm điện có ý nghĩa gì?', ['là cách nhỏ nhưng thiết thực để bảo vệ hành tinh', 'giúp nhà có nhiều tiền', 'để trẻ em được chơi'], 'là cách nhỏ nhưng thiết thực để bảo vệ hành tinh', 4, 'Câu cuối bài nêu lời bố.']]),
  W(34, 'tg', 'Bài 29–30', 'Điện thoại di động; Thành phố thông minh Mát-xđa', 'Luyện tập về liên kết câu trong đoạn văn', 'thegioi', ['lienket'],
    'Ngôi nhà thông minh', 'Nhà bác Quang vừa lắp hệ thống nhà thông minh. Chỉ cần nói một câu, đèn trong phòng đã tự bật sáng. Rèm cửa tự kéo lên khi trời sáng. Ngoài ra, chiếc máy tưới cây còn tự đo độ ẩm của đất để tưới vừa đủ nước. Tuy vậy, bác Quang vẫn dặn các con phải biết tự làm việc nhà. Bác bảo: "Máy móc giúp ta tiện lợi, nhưng đôi tay chăm chỉ mới giúp ta trưởng thành."',
    [['Nhà bác Quang vừa lắp hệ thống gì?', ['nhà thông minh', 'điện mặt trời', 'máy điều hoà'], 'nhà thông minh', 1, 'Nhà bác lắp hệ thống nhà thông minh.'],
      ['Máy tưới cây làm việc thế nào?', ['tự đo độ ẩm của đất để tưới vừa đủ', 'tưới liên tục cả ngày', 'chỉ tưới khi có người bấm'], 'tự đo độ ẩm của đất để tưới vừa đủ', 2, 'Máy tự đo độ ẩm để tưới vừa đủ.'],
      ['Từ ngữ "Tuy vậy" có tác dụng gì?', ['nối câu, thể hiện ý trái ngược với câu trước', 'thay thế cho "bác Quang"', 'lặp lại từ ngữ'], 'nối câu, thể hiện ý trái ngược với câu trước', 3, '"Tuy vậy" là từ ngữ nối chỉ quan hệ tương phản.'],
      ['Lời bác Quang khuyên các con điều gì?', ['Dù có máy móc vẫn phải chăm chỉ lao động', 'Nên mua thêm nhiều máy', 'Không cần làm việc nhà'], 'Dù có máy móc vẫn phải chăm chỉ lao động', 4, 'Đôi tay chăm chỉ giúp ta trưởng thành.']]),
  W(35, 'on', 'Ôn tập cuối năm', 'Ôn tập các bài đọc học kì 2', 'Ôn đại từ, kết từ, câu ghép, liên kết câu, viết hoa', 'thegioi', ['daitu', 'kettu', 'caughep', 'lienket', 'viethoa', 'tennn'],
    'Lá thư gửi chính mình', 'Ngày cuối cùng của năm học lớp 5, cô giáo phát cho mỗi bạn một tờ giấy và một phong bì. Cô bảo chúng em viết thư cho chính mình của năm năm sau. Em viết về những người bạn thân, về thầy cô, về sân trường có cây bàng già. Em viết cả ước mơ trở thành nhà khoa học nghiên cứu năng lượng sạch. Cô giữ những lá thư lại và hẹn sẽ gửi đến tận tay chúng em. Ra về, ai cũng lưu luyến ngoái nhìn mái trường thân yêu.',
    [['Cô giáo phát cho mỗi bạn những gì?', ['một tờ giấy và một phong bì', 'một cuốn sách', 'một bức ảnh'], 'một tờ giấy và một phong bì', 1, 'Cô phát giấy và phong bì.'],
      ['Các bạn viết thư gửi ai?', ['chính mình của năm năm sau', 'cô giáo', 'bố mẹ'], 'chính mình của năm năm sau', 2, 'Viết thư cho chính mình của năm năm sau.'],
      ['Ước mơ của bạn nhỏ là gì?', ['trở thành nhà khoa học nghiên cứu năng lượng sạch', 'trở thành ca sĩ', 'trở thành cầu thủ'], 'trở thành nhà khoa học nghiên cứu năng lượng sạch', 3, 'Bạn mơ làm nhà khoa học nghiên cứu năng lượng sạch.'],
      ['Chi tiết "ai cũng lưu luyến ngoái nhìn mái trường" thể hiện điều gì?', ['Tình cảm gắn bó, yêu quý mái trường tiểu học', 'Các bạn quên đồ', 'Các bạn sợ về nhà'], 'Tình cảm gắn bó, yêu quý mái trường tiểu học', 4, 'Các bạn lưu luyến khi chia tay mái trường.']]),
];

const read = (w: TV5Week, q: string) => `Đọc bài "${w.title}":\n${w.text}\n\n${q}`;
const outcomeFor = (lv: Level) => (lv >= 4 ? 'V5.DOC.03' : lv >= 3 ? 'V5.DOC.02' : 'V5.DOC.01');

function readingQs(w: TV5Week): ContentQuestion[] {
  return w.qs.map(([prompt, options, correct, level, e]) => {
    const m = { o: outcomeFor(level), f: 'TV.DOCHIEU', l: level, e, s: level >= 3 ? e : undefined };
    if (Array.isArray(correct)) return mc(read(w, prompt), options, correct, { ...m, o: 'V5.TU.06', f: 'TV.TUNGU' });
    return sc(read(w, prompt), options, correct, m);
  });
}

function practiceQs(w: TV5Week): ContentQuestion[] {
  const ctx: TV5Ctx = { ...w.ctx, week: w.week };
  const pool = tv5Pool(ctx.focus);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  ([1, 2, 4, 5] as Level[]).forEach((lv, slot) => {
    const r = makeRng(w.week * 6029 + slot * 7937 + 50);
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

const lesson = (w: TV5Week): ContentLesson => ({
  id: `tv5-kntt-t${String(w.week).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 5,
  semester: w.week <= 18 ? 1 : 2,
  book: BOOK,
  ref: `Tuần ${w.week} · ${w.bai}`,
  unit: { code: `KNTT.V5.${w.topic}`, title: w.topic === 'on' ? 'Ôn tập' : `Chủ điểm: ${TV5_TOPICS[w.topic]}` },
  topicCode: 'V5.DOC',
  title: `Tuần ${w.week}. ${w.topic === 'on' ? w.bai : w.title}`,
  description: `Sách: ${w.readings}. Luyện từ và câu: ${w.practice}.`,
  scope: SCOPE,
  questions: [...readingQs(w), ...practiceQs(w)].sort((a, b) => a.level - b.level),
});

export const TV5_HK1: ContentLesson[] = TV5_WEEKS.filter((w) => w.week <= 18).map(lesson);
export const TV5_HK2: ContentLesson[] = TV5_WEEKS.filter((w) => w.week > 18).map(lesson);
export const tv5Ctx = (week: number): TV5Ctx => {
  const w = TV5_WEEKS.find((x) => x.week === week)!;
  return { ...w.ctx, week };
};
export const tv5WeekPool = (week: number) => tv5Pool(tv5Ctx(week).focus);
