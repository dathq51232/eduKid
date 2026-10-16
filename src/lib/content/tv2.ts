// TIẾNG VIỆT 2 — 35 tuần theo mục lục sách Tiếng Việt 2 (Kết nối tri thức): HK1 tuần 1–18, HK2 tuần 19–35.
// Mỗi tuần: một BÀI ĐỌC NGẮN DO EDUCHAIN KIDS TỰ VIẾT theo chủ điểm của tuần (không chép bài đọc của sách) kèm câu hỏi
// đọc hiểu, và câu luyện từ – câu – chính tả rút từ bộ sinh câu của tuần (src/lib/practice/tv2g.ts) với hạt giống cố định.
// Nội dung luyện tập (từ chỉ sự vật / hoạt động / đặc điểm, kiểu câu, dấu câu, cặp chính tả) bám tên mục trong mục lục.

import { makeRng } from '../practice/rng';
import { TV2G_POOL, type TVCtx, type TVFocus, type TVTheme } from '../practice/tv2g';
import type { PracticeQuestion } from '../practice/kit';
import { mc, sc, tf, type ContentLesson, type ContentQuestion, type Level } from './types';

const BOOK = 'Kết nối tri thức';
const SCOPE = { kind: 'viet2', grade: 2 } as const;

export const TV2_TOPICS: Record<string, string> = {
  em: 'Em lớn lên từng ngày', hoc: 'Đi học vui sao', tho: 'Niềm vui tuổi thơ', nha: 'Mái ấm gia đình',
  dep: 'Vẻ đẹp quanh em', xanh: 'Hành tinh xanh của em', ket: 'Giao tiếp và kết nối', nguoi: 'Con người Việt Nam', que: 'Việt Nam quê hương em',
  on: 'Ôn tập',
};

type Q4 = [prompt: string, options: string[], correct: string | string[], level: Level, explanation: string];
export type TVWeek = {
  week: number;
  topic: keyof typeof TV2_TOPICS;
  bai: string; // "Bài 1–2"
  readings: string; // tên bài đọc trong sách (để thầy cô đối chiếu)
  practice: string; // nội dung luyện tập (theo mục lục)
  ctx: Omit<TVCtx, 'week'>;
  title: string; // tên bài đọc tự viết
  text: string;
  qs: Q4[];
};

const W = (week: number, topic: TVWeek['topic'], bai: string, readings: string, practice: string, theme: TVTheme, focus: TVFocus[], spell: string[], title: string, text: string, qs: Q4[]): TVWeek =>
  ({ week, topic, bai, readings, practice, ctx: { theme, focus, spell }, title, text, qs });

export const TV2_WEEKS: TVWeek[] = [
  // ======================================== HỌC KÌ 1
  W(1, 'em', 'Bài 1–2', 'Tôi là học sinh lớp 2; Ngày hôm qua đâu rồi?', 'Từ ngữ chỉ sự vật, hoạt động; câu giới thiệu; bảng chữ cái', 'banthan', ['suvat', 'hoatdong', 'gioithieu', 'chucai'], [],
    'Ngày đầu lên lớp Hai', 'Sáng nay, Minh dậy thật sớm. Cậu mặc bộ đồng phục mới, đeo chiếc cặp màu xanh. Đến trường, Minh thấy lớp học được trang trí bằng những bông hoa giấy rực rỡ. Cô giáo mỉm cười: "Chào các em, các em đã là học sinh lớp Hai rồi đấy!" Minh thấy mình như lớn hơn một chút.',
    [['Minh đeo chiếc cặp màu gì?', ['màu xanh', 'màu đỏ', 'màu vàng'], 'màu xanh', 1, 'Bài đọc viết: "đeo chiếc cặp màu xanh".'],
      ['Lớp học được trang trí bằng gì?', ['hoa giấy', 'bóng bay', 'tranh vẽ'], 'hoa giấy', 1, 'Lớp học được trang trí bằng những bông hoa giấy rực rỡ.'],
      ['Vì sao Minh thấy mình như lớn hơn một chút?', ['Vì Minh đã là học sinh lớp Hai', 'Vì Minh cao lên', 'Vì Minh có cặp mới'], 'Vì Minh đã là học sinh lớp Hai', 3, 'Cô giáo nói các em đã là học sinh lớp Hai nên Minh thấy mình lớn hơn.'],
      ['Chọn tất cả từ chỉ hoạt động có trong bài.', ['mặc', 'đeo', 'cặp', 'mỉm cười'], ['mặc', 'đeo', 'mỉm cười'], 2, '"mặc", "đeo", "mỉm cười" là hoạt động; "cặp" là sự vật.']]),
  W(2, 'em', 'Bài 3–4', 'Niềm vui của Bi và Bống; Làm việc thật là vui', 'Từ ngữ chỉ sự vật, hoạt động; câu nêu hoạt động', 'banthan', ['suvat', 'hoatdong', 'neuhd', 'chucai'], [],
    'Ai cũng làm việc', 'Buổi sáng, gà trống gáy vang gọi mọi người thức dậy. Chú mèo rình bắt chuột trong bếp. Đàn ong chăm chỉ đi lấy mật. Bé Na cũng có việc của mình: bé tưới cây, gấp quần áo và giúp mẹ nhặt rau. Làm xong, bé thấy vui ơi là vui.',
    [['Gà trống làm gì vào buổi sáng?', ['gáy vang gọi mọi người', 'bắt chuột', 'đi lấy mật'], 'gáy vang gọi mọi người', 1, 'Gà trống gáy vang gọi mọi người thức dậy.'],
      ['Con vật nào đi lấy mật?', ['đàn ong', 'chú mèo', 'gà trống'], 'đàn ong', 1, 'Đàn ong chăm chỉ đi lấy mật.'],
      ['Bé Na cảm thấy thế nào khi làm xong việc?', ['rất vui', 'mệt mỏi', 'buồn'], 'rất vui', 2, 'Làm xong, bé thấy "vui ơi là vui".'],
      ['Bài đọc muốn nói điều gì?', ['Ai cũng có việc, làm việc thật vui', 'Chỉ người lớn mới phải làm việc', 'Con vật không biết làm việc'], 'Ai cũng có việc, làm việc thật vui', 3, 'Mọi vật, mọi người đều làm việc, và làm việc mang lại niềm vui.']]),
  W(3, 'em', 'Bài 5–6', 'Em có xinh không?; Một giờ học', 'Từ ngữ chỉ đặc điểm; câu nêu đặc điểm', 'banthan', ['dacdiem', 'neudd', 'chucai'], [],
    'Chiếc gương của Thỏ', 'Thỏ con có bộ lông trắng muốt và đôi mắt hồng. Thỏ hay đứng trước gương hỏi: "Mình có xinh không?" Một hôm, Thỏ giúp bạn Sóc nhặt hạt dẻ bị rơi. Sóc cảm ơn: "Cậu thật tốt bụng!" Thỏ hiểu rằng được bạn quý mến vì việc tốt còn vui hơn được khen xinh.',
    [['Bộ lông của Thỏ con thế nào?', ['trắng muốt', 'đen nhánh', 'vàng óng'], 'trắng muốt', 1, 'Thỏ con có bộ lông trắng muốt.'],
      ['Thỏ đã giúp Sóc việc gì?', ['nhặt hạt dẻ bị rơi', 'tìm đường về nhà', 'xây tổ'], 'nhặt hạt dẻ bị rơi', 1, 'Thỏ giúp Sóc nhặt hạt dẻ bị rơi.'],
      ['Sóc khen Thỏ thế nào?', ['tốt bụng', 'xinh đẹp', 'chạy nhanh'], 'tốt bụng', 2, 'Sóc nói: "Cậu thật tốt bụng!"'],
      ['Câu chuyện khuyên em điều gì?', ['Làm việc tốt đáng quý hơn chỉ đẹp bên ngoài', 'Nên soi gương nhiều', 'Không nên giúp bạn'], 'Làm việc tốt đáng quý hơn chỉ đẹp bên ngoài', 3, 'Thỏ hiểu được bạn quý vì việc tốt còn vui hơn được khen xinh.']]),
  W(4, 'em', 'Bài 7–8', 'Cây xấu hổ; Cầu thủ dự bị', 'Mở rộng vốn từ về hoạt động thể thao, vui chơi; câu nêu hoạt động; viết hoa tên người', 'thethao', ['hoatdong', 'neuhd', 'viethoa'], [],
    'Trận bóng giờ ra chơi', 'Giờ ra chơi, các bạn lớp 2B rủ nhau đá bóng. Nam chuyền bóng cho Hùng, Hùng sút mạnh vào khung thành. Bạn Lan làm thủ môn, nhảy lên bắt gọn quả bóng. Cả sân reo hò. Trận đấu không ai thắng, nhưng bạn nào cũng cười tươi.',
    [['Các bạn lớp 2B chơi gì?', ['đá bóng', 'nhảy dây', 'đá cầu'], 'đá bóng', 1, 'Các bạn rủ nhau đá bóng.'],
      ['Ai làm thủ môn?', ['Lan', 'Nam', 'Hùng'], 'Lan', 1, 'Bạn Lan làm thủ môn.'],
      ['Câu "Nam chuyền bóng cho Hùng." là kiểu câu nào?', ['câu nêu hoạt động', 'câu giới thiệu', 'câu nêu đặc điểm'], 'câu nêu hoạt động', 3, 'Câu cho biết Nam làm gì nên là câu nêu hoạt động.'],
      ['Trận đấu kết thúc thế nào?', ['Không ai thắng, ai cũng vui', 'Lan bị thua', 'Các bạn cãi nhau'], 'Không ai thắng, ai cũng vui', 2, 'Trận đấu không ai thắng, nhưng bạn nào cũng cười tươi.']]),
  W(5, 'hoc', 'Bài 9–10', 'Cô giáo lớp em; Thời khoá biểu', 'Từ ngữ chỉ sự vật, hoạt động; câu nêu hoạt động; phân biệt c/k, ch/tr, v/d', 'truonghoc', ['suvat', 'hoatdong', 'neuhd'], ['c/k', 'ch/tr', 'v/d'],
    'Cô giáo của em', 'Cô giáo lớp em có giọng nói ấm áp. Mỗi sáng, cô đứng ở cửa lớp đón chúng em. Cô dạy chúng em đọc, viết và kể chuyện. Bạn nào chưa hiểu bài, cô kiên nhẫn giảng lại. Cuối tuần, cô thường kể cho cả lớp nghe một câu chuyện hay.',
    [['Giọng nói của cô giáo thế nào?', ['ấm áp', 'to và gắt', 'nhỏ và khàn'], 'ấm áp', 1, 'Cô giáo có giọng nói ấm áp.'],
      ['Mỗi sáng cô giáo làm gì?', ['đứng ở cửa lớp đón học sinh', 'tưới cây', 'quét lớp'], 'đứng ở cửa lớp đón học sinh', 1, 'Mỗi sáng, cô đứng ở cửa lớp đón các em.'],
      ['Khi bạn chưa hiểu bài, cô làm gì?', ['kiên nhẫn giảng lại', 'cho bạn ra ngoài', 'không nói gì'], 'kiên nhẫn giảng lại', 2, 'Cô kiên nhẫn giảng lại.'],
      ['Từ nào nói về tính nết của cô giáo trong bài?', ['kiên nhẫn', 'cửa lớp', 'câu chuyện'], 'kiên nhẫn', 3, '"kiên nhẫn" là từ chỉ đặc điểm (tính nết); hai từ kia chỉ sự vật.']]),
  W(6, 'hoc', 'Bài 11–12', 'Cái trống trường em; Danh sách học sinh', 'Từ ngữ chỉ sự vật, đặc điểm; câu nêu đặc điểm; phân biệt g/gh, s/x, dấu hỏi/dấu ngã', 'truonghoc', ['suvat', 'dacdiem', 'neudd'], ['g/gh', 's/x', 'hỏi/ngã'],
    'Sân trường mùa thu', 'Sân trường em rộng và sạch sẽ. Giữa sân có cây bàng già, tán lá xanh mát như chiếc ô khổng lồ. Mùa thu, lá bàng chuyển sang màu đỏ. Tiếng trống vang lên "tùng, tùng, tùng", các bạn ùa ra sân chơi, cười nói rộn ràng.',
    [['Sân trường em thế nào?', ['rộng và sạch sẽ', 'nhỏ và tối', 'hẹp và bẩn'], 'rộng và sạch sẽ', 1, 'Sân trường em rộng và sạch sẽ.'],
      ['Tán cây bàng được so sánh với gì?', ['chiếc ô khổng lồ', 'cái nón', 'đám mây'], 'chiếc ô khổng lồ', 2, 'Tán lá xanh mát như chiếc ô khổng lồ.'],
      ['Mùa thu, lá bàng có màu gì?', ['màu đỏ', 'màu tím', 'màu trắng'], 'màu đỏ', 1, 'Mùa thu, lá bàng chuyển sang màu đỏ.'],
      ['Câu nào là câu nêu đặc điểm?', ['Sân trường em rộng và sạch sẽ.', 'Các bạn ùa ra sân chơi.', 'Tiếng trống vang lên.'], 'Sân trường em rộng và sạch sẽ.', 3, 'Câu cho biết sân trường thế nào (rộng, sạch sẽ) là câu nêu đặc điểm.']]),
  W(7, 'hoc', 'Bài 13–14', 'Yêu lắm trường ơi!; Em học vẽ', 'Mở rộng vốn từ chỉ đồ dùng học tập; dấu chấm, dấu chấm hỏi; phân biệt ng/ngh, r/d/gi, an/ang', 'dodunghoctap', ['suvat', 'daucau'], ['ng/ngh', 'r/d/gi', 'an/ang'],
    'Hộp bút của Bông', 'Bông có một hộp bút màu hồng. Trong hộp có bút chì, thước kẻ, tẩy và mấy cây bút màu. Bông giữ gìn đồ dùng rất cẩn thận. Hôm nay bạn Tú quên bút, Bông cho Tú mượn một cây bút chì. Tú cảm ơn Bông rồi hỏi: "Ngày mai tớ trả cậu nhé?"',
    [['Hộp bút của Bông màu gì?', ['màu hồng', 'màu xanh', 'màu nâu'], 'màu hồng', 1, 'Bông có một hộp bút màu hồng.'],
      ['Chọn tất cả đồ dùng học tập có trong hộp bút.', ['bút chì', 'thước kẻ', 'tẩy', 'quả bóng'], ['bút chì', 'thước kẻ', 'tẩy'], 2, 'Trong hộp có bút chì, thước kẻ, tẩy và bút màu.'],
      ['Bông đã làm gì khi Tú quên bút?', ['cho Tú mượn bút chì', 'mách cô giáo', 'cười Tú'], 'cho Tú mượn bút chì', 2, 'Bông cho Tú mượn một cây bút chì.'],
      ['Câu "Ngày mai tớ trả cậu nhé" cuối câu đặt dấu gì?', ['dấu chấm hỏi', 'dấu chấm', 'dấu phẩy'], 'dấu chấm hỏi', 3, 'Tú hỏi Bông nên cuối câu đặt dấu chấm hỏi.']]),
  W(8, 'hoc', 'Bài 15–16', 'Cuốn sách của em; Khi trang sách mở ra', 'Từ ngữ chỉ đặc điểm; câu nêu đặc điểm; dấu chấm, dấu chấm hỏi; phân biệt l/n, ăn/ăng', 'sach', ['dacdiem', 'neudd', 'daucau', 'viethoa'], ['l/n', 'ăn/ăng'],
    'Góc thư viện', 'Lớp em có một góc thư viện nhỏ. Trên giá có truyện cổ tích, sách khoa học và những cuốn truyện tranh nhiều màu. Mỗi giờ ra chơi, chúng em được mượn sách. Đọc sách, em biết vì sao trời mưa, vì sao lá cây màu xanh. Em yêu những trang sách lắm.',
    [['Lớp em có góc gì?', ['góc thư viện', 'góc đồ chơi', 'góc vẽ'], 'góc thư viện', 1, 'Lớp em có một góc thư viện nhỏ.'],
      ['Khi nào các em được mượn sách?', ['giờ ra chơi', 'buổi tối', 'ngày chủ nhật'], 'giờ ra chơi', 1, 'Mỗi giờ ra chơi, các em được mượn sách.'],
      ['Đọc sách giúp bạn nhỏ điều gì?', ['biết thêm nhiều điều', 'chạy nhanh hơn', 'cao lớn hơn'], 'biết thêm nhiều điều', 3, 'Đọc sách, bạn biết vì sao trời mưa, vì sao lá cây màu xanh.'],
      ['Đọc câu: "Em yêu những trang sách lắm." Bạn nhỏ không thích đọc sách. Đúng hay sai?', [], 'Sai', 2, 'Bạn nhỏ nói "Em yêu những trang sách lắm" nên bạn rất thích đọc sách.']]),
  W(9, 'on', 'Ôn tập giữa học kì 1', 'Ôn tập các bài đọc tuần 1–8', 'Ôn từ chỉ sự vật, hoạt động, đặc điểm; kiểu câu; dấu câu; chính tả', 'truonghoc', ['suvat', 'hoatdong', 'dacdiem', 'gioithieu', 'neuhd', 'neudd', 'daucau'], ['c/k', 'g/gh', 's/x', 'ng/ngh', 'l/n'],
    'Chú ong nhỏ', 'Chú ong nhỏ bay khắp vườn tìm hoa. Thấy bông hoa bưởi trắng thơm, ong sà xuống hút mật. Gió thổi mạnh, ong nép vào chiếc lá chờ gió lặng. Chiều về, ong mang mật về tổ. Mẹ ong khen: "Con chăm chỉ lắm!"',
    [['Chú ong bay đi đâu?', ['khắp vườn tìm hoa', 'ra bờ sông', 'vào lớp học'], 'khắp vườn tìm hoa', 1, 'Chú ong bay khắp vườn tìm hoa.'],
      ['Khi gió thổi mạnh, ong làm gì?', ['nép vào chiếc lá', 'bay thật cao', 'về tổ ngay'], 'nép vào chiếc lá', 2, 'Ong nép vào chiếc lá chờ gió lặng.'],
      ['Mẹ ong khen chú ong thế nào?', ['chăm chỉ', 'xinh đẹp', 'bay nhanh'], 'chăm chỉ', 2, 'Mẹ ong khen: "Con chăm chỉ lắm!"'],
      ['Chọn tất cả từ chỉ sự vật trong bài.', ['bông hoa', 'chiếc lá', 'thơm', 'tổ'], ['bông hoa', 'chiếc lá', 'tổ'], 3, '"thơm" là từ chỉ đặc điểm; các từ còn lại chỉ sự vật.']]),
  W(10, 'tho', 'Bài 17–18', 'Gọi bạn; Tớ nhớ cậu', 'Mở rộng vốn từ về tình cảm bạn bè; dấu chấm, dấu chấm hỏi, dấu chấm than; phân biệt c/k, iêu/ươu, en/eng', 'banbe', ['daucau'], ['c/k', 'iêu/ươu', 'en/eng'],
    'Hai người bạn nhỏ', 'Hà và Mai ở cạnh nhà nhau. Hai bạn cùng đi học, cùng làm bài và cùng chơi. Một hôm, Mai bị ốm phải nghỉ học. Chiều đó, Hà mang vở sang chép bài giúp Mai và kể cho Mai nghe chuyện ở lớp. Mai cảm động nói: "Cậu là người bạn tốt nhất!"',
    [['Hà và Mai ở đâu?', ['cạnh nhà nhau', 'cùng một nhà', 'ở hai làng xa'], 'cạnh nhà nhau', 1, 'Hà và Mai ở cạnh nhà nhau.'],
      ['Vì sao Mai phải nghỉ học?', ['Mai bị ốm', 'Mai đi chơi', 'Mai quên vở'], 'Mai bị ốm', 1, 'Mai bị ốm phải nghỉ học.'],
      ['Hà đã giúp Mai những gì?', ['chép bài và kể chuyện ở lớp', 'nấu cơm cho Mai', 'mua thuốc cho Mai'], 'chép bài và kể chuyện ở lớp', 2, 'Hà mang vở chép bài giúp Mai và kể chuyện ở lớp.'],
      ['Chọn tất cả từ ngữ nói về tình cảm bạn bè.', ['giúp đỡ', 'chia sẻ', 'cãi nhau', 'thân thiết'], ['giúp đỡ', 'chia sẻ', 'thân thiết'], 3, 'Bạn tốt giúp đỡ, chia sẻ, thân thiết; "cãi nhau" không phải tình cảm tốt.']]),
  W(11, 'tho', 'Bài 19–20', 'Chữ A và những người bạn; Nhím nâu kết bạn', 'Từ ngữ chỉ đặc điểm, hoạt động; câu nêu hoạt động; phân biệt g/gh, iu/ưu, iên/iêng', 'banbe', ['dacdiem', 'hoatdong', 'neuhd'], ['g/gh', 'iu/ưu', 'iên/iêng'],
    'Sóc con làm quen', 'Sóc con mới chuyển đến khu rừng. Sóc rụt rè, chỉ dám ngồi trên cành cây nhìn các bạn chơi. Thỏ trắng thấy vậy liền vẫy tay: "Xuống chơi với chúng mình đi!" Sóc nhảy xuống, cùng các bạn chơi trốn tìm. Từ đó, Sóc có thêm nhiều bạn mới.',
    [['Lúc đầu Sóc con thế nào?', ['rụt rè', 'nghịch ngợm', 'tự tin'], 'rụt rè', 1, 'Sóc rụt rè, chỉ dám ngồi trên cành cây.'],
      ['Ai rủ Sóc xuống chơi?', ['Thỏ trắng', 'Gấu nâu', 'Chim sẻ'], 'Thỏ trắng', 1, 'Thỏ trắng vẫy tay rủ Sóc xuống chơi.'],
      ['Các bạn cùng chơi trò gì?', ['trốn tìm', 'đá bóng', 'kéo co'], 'trốn tìm', 2, 'Sóc cùng các bạn chơi trốn tìm.'],
      ['Câu chuyện cho em biết điều gì?', ['Chủ động làm quen giúp ta có thêm bạn', 'Không nên chơi với bạn mới', 'Ngồi một mình thì vui hơn'], 'Chủ động làm quen giúp ta có thêm bạn', 3, 'Nhờ Thỏ chủ động rủ chơi, Sóc có thêm nhiều bạn mới.']]),
  W(12, 'tho', 'Bài 21–22', 'Thả diều; Tớ là lê-gô', 'Từ ngữ chỉ sự vật, đặc điểm; câu nêu đặc điểm; phân biệt ng/ngh, ch/tr, uôn/uông', 'dochoi', ['suvat', 'dacdiem', 'neudd'], ['ng/ngh', 'ch/tr', 'uôn/uông'],
    'Cánh diều của bố', 'Bố làm cho em một cánh diều bằng giấy màu đỏ. Đuôi diều dài, có mấy dải giấy vàng. Chiều chủ nhật, hai bố con ra bãi cỏ thả diều. Gió nổi lên, cánh diều bay vút lên cao, chao qua chao lại như một chú chim. Em ngửa cổ nhìn theo, sung sướng vô cùng.',
    [['Cánh diều làm bằng gì?', ['giấy màu đỏ', 'vải xanh', 'lá chuối'], 'giấy màu đỏ', 1, 'Cánh diều bằng giấy màu đỏ.'],
      ['Hai bố con thả diều ở đâu?', ['bãi cỏ', 'sân trường', 'bờ biển'], 'bãi cỏ', 1, 'Hai bố con ra bãi cỏ thả diều.'],
      ['Cánh diều bay lên được so sánh với gì?', ['một chú chim', 'chiếc lá', 'đám mây'], 'một chú chim', 2, 'Cánh diều chao qua chao lại như một chú chim.'],
      ['Câu nào là câu nêu đặc điểm?', ['Đuôi diều dài.', 'Bố làm cho em một cánh diều.', 'Hai bố con ra bãi cỏ.'], 'Đuôi diều dài.', 3, '"Đuôi diều dài" cho biết đuôi diều thế nào: câu nêu đặc điểm.']]),
  W(13, 'tho', 'Bài 23–24', 'Rồng rắn lên mây; Nặn đồ chơi', 'Mở rộng vốn từ về đồ chơi; dấu phẩy; phân biệt d/gi, s/x, ươn/ương', 'dochoi', ['dauphay'], ['r/d/gi', 's/x', 'ươn/ương'],
    'Đồ chơi bằng đất nặn', 'Chiều nay, em ngồi nặn đồ chơi. Em nặn một quả cam, một quả chuối, một chú thỏ và một con gà con. Quả cam tròn, màu da cam. Chú thỏ có đôi tai dài. Em xếp đồ chơi lên bàn rồi mời mẹ xem. Mẹ khen em khéo tay.',
    [['Bạn nhỏ nặn đồ chơi bằng gì?', ['đất nặn', 'gỗ', 'giấy'], 'đất nặn', 1, 'Bài nói về đồ chơi bằng đất nặn.'],
      ['Chú thỏ bạn nhỏ nặn có gì đặc biệt?', ['đôi tai dài', 'cái đuôi dài', 'bộ lông đen'], 'đôi tai dài', 1, 'Chú thỏ có đôi tai dài.'],
      ['Mẹ khen bạn nhỏ thế nào?', ['khéo tay', 'chăm học', 'chạy nhanh'], 'khéo tay', 2, 'Mẹ khen em khéo tay.'],
      ['Trong câu "Em nặn một quả cam, một quả chuối, một chú thỏ và một con gà con.", dấu phẩy dùng để làm gì?', ['ngăn cách các sự vật được kể', 'kết thúc câu', 'để hỏi'], 'ngăn cách các sự vật được kể', 3, 'Dấu phẩy ngăn cách những từ cùng loại đứng liền nhau.']]),
  W(14, 'nha', 'Bài 25–26', 'Sự tích hoa tỉ muội; Em mang về yêu thương', 'Mở rộng vốn từ về gia đình, từ ngữ chỉ đặc điểm; câu nêu đặc điểm; phân biệt iên/yên/uyên, r/d/gi, ai/ay', 'giadinh', ['dacdiem', 'neudd'], ['iên/yên/uyên', 'r/d/gi', 'ai/ay'],
    'Em bé nhà em', 'Nhà em vừa có thêm em bé. Em bé có đôi má phúng phính và bàn tay nhỏ xíu. Mỗi khi em bé cười, cả nhà ai cũng vui. Em giúp mẹ lấy khăn, hát ru cho em bé ngủ. Em thương em bé lắm.',
    [['Đôi má của em bé thế nào?', ['phúng phính', 'gầy gò', 'đỏ ửng'], 'phúng phính', 1, 'Em bé có đôi má phúng phính.'],
      ['Bạn nhỏ giúp mẹ làm gì?', ['lấy khăn, hát ru em bé', 'nấu cơm', 'đi chợ'], 'lấy khăn, hát ru em bé', 2, 'Bạn nhỏ giúp mẹ lấy khăn, hát ru cho em bé ngủ.'],
      ['Khi em bé cười, cả nhà thế nào?', ['ai cũng vui', 'ai cũng mệt', 'ai cũng buồn'], 'ai cũng vui', 1, 'Mỗi khi em bé cười, cả nhà ai cũng vui.'],
      ['Tình cảm của bạn nhỏ với em bé là gì?', ['yêu thương em bé', 'không thích em bé', 'sợ em bé'], 'yêu thương em bé', 3, 'Bạn nhỏ chăm em và nói "Em thương em bé lắm".']]),
  W(15, 'nha', 'Bài 27–28', 'Mẹ; Trò chơi của bố', 'Mở rộng vốn từ về tình cảm gia đình; dấu chấm, dấu chấm hỏi, dấu chấm than; viết hoa tên riêng địa lí; phân biệt l/n, ao/au', 'giadinh', ['daucau', 'viethoa', 'diali'], ['l/n', 'ao/au'],
    'Bữa cơm tối', 'Tối nào cả nhà em cũng ăn cơm cùng nhau. Mẹ nấu canh rau ngót, bố rán cá thơm phức. Em xếp bát đũa lên mâm. Trong bữa ăn, ông kể chuyện ngày xưa ở quê Nam Định. Cả nhà cười vui. Em reo lên: "Bữa cơm nhà mình ngon quá!"',
    [['Ai rán cá?', ['bố', 'mẹ', 'ông'], 'bố', 1, 'Bố rán cá thơm phức.'],
      ['Bạn nhỏ làm việc gì?', ['xếp bát đũa lên mâm', 'nấu canh', 'rửa rau'], 'xếp bát đũa lên mâm', 1, 'Em xếp bát đũa lên mâm.'],
      ['Ông kể chuyện về quê ở đâu?', ['Nam Định', 'Hà Nội', 'Huế'], 'Nam Định', 2, 'Ông kể chuyện ngày xưa ở quê Nam Định (tên riêng địa lí viết hoa).'],
      ['Câu "Bữa cơm nhà mình ngon quá" cuối câu nên đặt dấu gì?', ['dấu chấm than', 'dấu chấm hỏi', 'dấu phẩy'], 'dấu chấm than', 3, 'Câu bộc lộ cảm xúc (ngon quá) nên đặt dấu chấm than.']]),
  W(16, 'nha', 'Bài 29–30', 'Cánh cửa nhớ bà; Thương ông', 'Từ ngữ chỉ sự vật, hoạt động; câu nêu hoạt động; phân biệt ch/tr, ac/at', 'giadinh', ['suvat', 'hoatdong', 'neuhd'], ['ch/tr', 'ac/at'],
    'Ông và vườn rau', 'Ông em rất thích làm vườn. Sáng nào ông cũng ra vườn nhổ cỏ, tưới rau. Em cầm chiếc bình tưới nhỏ đi theo ông. Ông chỉ cho em cách bắt sâu, cách vun gốc cho cây. Nhìn luống rau xanh mơn mởn, hai ông cháu cười thật tươi.',
    [['Ông em thích làm gì?', ['làm vườn', 'đọc báo', 'câu cá'], 'làm vườn', 1, 'Ông em rất thích làm vườn.'],
      ['Bạn nhỏ cầm gì đi theo ông?', ['chiếc bình tưới nhỏ', 'cái cuốc', 'cái rổ'], 'chiếc bình tưới nhỏ', 1, 'Em cầm chiếc bình tưới nhỏ đi theo ông.'],
      ['Ông dạy em những việc gì?', ['bắt sâu, vun gốc', 'nấu cơm, rửa bát', 'vẽ tranh, hát'], 'bắt sâu, vun gốc', 2, 'Ông chỉ cách bắt sâu, cách vun gốc cho cây.'],
      ['Chọn tất cả từ chỉ hoạt động của ông trong bài.', ['nhổ cỏ', 'tưới rau', 'luống rau', 'vun gốc'], ['nhổ cỏ', 'tưới rau', 'vun gốc'], 3, '"luống rau" là sự vật; còn lại là hoạt động.']]),
  W(17, 'nha', 'Bài 31–32', 'Ánh sáng của yêu thương; Chơi chong chóng', 'Mở rộng vốn từ về tình cảm gia đình; dấu phẩy; phân biệt iu/ưu, ăc/ăt, ôc/ôt', 'giadinh', ['dauphay'], ['iu/ưu', 'ăc/ăt', 'ôc/ôt'],
    'Chiếc khăn len', 'Trời trở lạnh. Bà ngồi bên cửa sổ, đôi tay thoăn thoắt đan chiếc khăn len màu xanh. Bà bảo: "Bà đan khăn để cháu quàng cho ấm." Mấy hôm sau, chiếc khăn hoàn thành. Em quàng khăn đến lớp, thấy ấm áp như có bà ở bên.',
    [['Bà đan chiếc khăn màu gì?', ['màu xanh', 'màu đỏ', 'màu trắng'], 'màu xanh', 1, 'Bà đan chiếc khăn len màu xanh.'],
      ['Bà đan khăn để làm gì?', ['để cháu quàng cho ấm', 'để bán', 'để tặng hàng xóm'], 'để cháu quàng cho ấm', 1, 'Bà nói đan khăn để cháu quàng cho ấm.'],
      ['Quàng khăn đến lớp, bạn nhỏ cảm thấy thế nào?', ['ấm áp như có bà ở bên', 'nóng bức', 'buồn bã'], 'ấm áp như có bà ở bên', 2, 'Em thấy ấm áp như có bà ở bên.'],
      ['Câu chuyện nói về tình cảm nào?', ['tình yêu thương của bà với cháu', 'tình bạn', 'tình thầy trò'], 'tình yêu thương của bà với cháu', 3, 'Bà đan khăn cho cháu vì thương cháu.']]),
  W(18, 'on', 'Ôn tập cuối học kì 1', 'Ôn tập các bài đọc học kì 1', 'Ôn từ ngữ, kiểu câu, dấu câu, chính tả học kì 1', 'giadinh', ['suvat', 'hoatdong', 'dacdiem', 'gioithieu', 'neuhd', 'neudd', 'daucau', 'dauphay'], ['ch/tr', 'r/d/gi', 'iên/iêng', 'ai/ay'],
    'Cây hoa của lớp', 'Đầu năm học, lớp em trồng một chậu hoa cúc. Mỗi tổ thay nhau tưới nước, nhổ cỏ cho cây. Ít lâu sau, cây trổ những bông hoa vàng tươi. Cô giáo nói: "Cây hoa đẹp vì cả lớp cùng chăm sóc." Chúng em ai cũng thấy tự hào.',
    [['Lớp em trồng cây gì?', ['hoa cúc', 'hoa hồng', 'cây bàng'], 'hoa cúc', 1, 'Lớp em trồng một chậu hoa cúc.'],
      ['Ai chăm sóc cây hoa?', ['các tổ thay nhau', 'chỉ cô giáo', 'bác bảo vệ'], 'các tổ thay nhau', 2, 'Mỗi tổ thay nhau tưới nước, nhổ cỏ.'],
      ['Hoa cúc có màu gì?', ['vàng tươi', 'tím', 'trắng'], 'vàng tươi', 1, 'Cây trổ những bông hoa vàng tươi.'],
      ['Theo cô giáo, vì sao cây hoa đẹp?', ['vì cả lớp cùng chăm sóc', 'vì trời mưa nhiều', 'vì chậu đẹp'], 'vì cả lớp cùng chăm sóc', 3, 'Cô nói: "Cây hoa đẹp vì cả lớp cùng chăm sóc."']]),
  // ======================================== HỌC KÌ 2
  W(19, 'dep', 'Bài 1–2', 'Chuyện bốn mùa; Mùa nước nổi', 'Mở rộng vốn từ về các mùa; dấu chấm, dấu chấm hỏi; phân biệt c/k, ch/tr, ac/at', 'mua', ['daucau'], ['c/k', 'ch/tr', 'ac/at'],
    'Bốn mùa của em', 'Mùa xuân, cây cối đâm chồi nảy lộc. Mùa hè, nắng vàng rực rỡ, em được đi tắm biển. Mùa thu, trời mát mẻ, trăng tròn sáng vằng vặc. Mùa đông, gió lạnh thổi về, cả nhà quây quần bên bếp lửa. Mùa nào em cũng thấy có điều thú vị.',
    [['Mùa nào cây cối đâm chồi nảy lộc?', ['mùa xuân', 'mùa hè', 'mùa đông'], 'mùa xuân', 1, 'Mùa xuân, cây cối đâm chồi nảy lộc.'],
      ['Mùa hè bạn nhỏ được làm gì?', ['đi tắm biển', 'ngắm trăng', 'ngồi bên bếp lửa'], 'đi tắm biển', 1, 'Mùa hè, em được đi tắm biển.'],
      ['Mùa thu trời thế nào?', ['mát mẻ', 'nóng bức', 'giá lạnh'], 'mát mẻ', 2, 'Mùa thu, trời mát mẻ.'],
      ['Nối mỗi mùa với đặc điểm của nó.', [], 'match', 3, 'Xuân: đâm chồi nảy lộc; hè: nắng vàng; thu: mát mẻ; đông: gió lạnh.']]),
  W(20, 'dep', 'Bài 3–4', 'Hoạ mi hót; Tết đến rồi', 'Mở rộng vốn từ về ngày Tết; dấu chấm, dấu chấm hỏi; phân biệt g/gh, s/x, uc/ut', 'tet', ['daucau'], ['g/gh', 's/x', 'uc/ut'],
    'Tết ở nhà bà', 'Tết năm nay, cả nhà em về quê ăn Tết với bà. Bà gói bánh chưng, em ngồi xem bà xếp lá dong vuông vắn. Đêm giao thừa, nồi bánh sôi lục bục trên bếp. Sáng mùng Một, em mặc áo mới, chúc bà mạnh khỏe sống lâu. Bà mừng tuổi cho em một phong bao đỏ.',
    [['Tết năm nay cả nhà em ăn Tết ở đâu?', ['ở quê với bà', 'ở nhà mình', 'ở biển'], 'ở quê với bà', 1, 'Cả nhà về quê ăn Tết với bà.'],
      ['Bà gói bánh gì?', ['bánh chưng', 'bánh mì', 'bánh bao'], 'bánh chưng', 1, 'Bà gói bánh chưng.'],
      ['Sáng mùng Một, bạn nhỏ chúc bà điều gì?', ['mạnh khỏe sống lâu', 'học giỏi', 'đi chơi vui'], 'mạnh khỏe sống lâu', 2, 'Em chúc bà mạnh khỏe sống lâu.'],
      ['Chọn tất cả từ ngữ về ngày Tết.', ['bánh chưng', 'mừng tuổi', 'áo mới', 'cặp sách'], ['bánh chưng', 'mừng tuổi', 'áo mới'], 3, '"cặp sách" không phải từ ngữ về ngày Tết.']]),
  W(21, 'dep', 'Bài 5–6', 'Giọt nước và biển lớn; Mùa vàng', 'Mở rộng vốn từ về cây cối; phân biệt ng/ngh, r/d/gi, uc/ut', 'caycoi', ['suvat', 'dacdiem'], ['ng/ngh', 'r/d/gi', 'ưc/ưt'],
    'Cây xoài sau nhà', 'Sau nhà em có một cây xoài do ông trồng. Thân cây to, vỏ xù xì. Mùa xuân, cây trổ hoa vàng nhạt, ong bướm bay đến rộn ràng. Đến mùa hè, những chùm quả xoài chín vàng, thơm lừng. Mẹ hái xoài chia cho hàng xóm cùng ăn.',
    [['Ai trồng cây xoài?', ['ông', 'bố', 'em'], 'ông', 1, 'Cây xoài do ông trồng.'],
      ['Vỏ cây xoài thế nào?', ['xù xì', 'nhẵn bóng', 'mềm mại'], 'xù xì', 1, 'Thân cây to, vỏ xù xì.'],
      ['Mùa nào quả xoài chín?', ['mùa hè', 'mùa xuân', 'mùa đông'], 'mùa hè', 2, 'Đến mùa hè, những chùm quả xoài chín vàng.'],
      ['Việc mẹ chia xoài cho hàng xóm cho thấy điều gì?', ['gia đình em biết chia sẻ', 'nhà em có quá nhiều xoài', 'mẹ không thích xoài'], 'gia đình em biết chia sẻ', 3, 'Chia quả ngon cho hàng xóm là biết chia sẻ, sống tình nghĩa.']]),
  W(22, 'dep', 'Bài 7–8', 'Hạt thóc; Luỹ tre', 'Mở rộng vốn từ về thiên nhiên; câu nêu đặc điểm; phân biệt uynh/uych, l/n, iêt/iêc', 'thiennhien', ['dacdiem', 'neudd'], ['uynh/uych', 'l/n', 'iêt/iêc'],
    'Buổi sáng trên cánh đồng', 'Buổi sáng, cánh đồng lúa xanh rì trải dài tít tắp. Những hạt sương long lanh đọng trên lá lúa. Xa xa, lũy tre làng rì rào trong gió. Đàn cò trắng bay lượn trên ruộng. Mặt trời lên cao, cánh đồng như được khoác chiếc áo vàng óng.',
    [['Cánh đồng lúa có màu gì vào buổi sáng?', ['xanh rì', 'vàng óng', 'trắng xóa'], 'xanh rì', 1, 'Cánh đồng lúa xanh rì trải dài tít tắp.'],
      ['Con vật nào bay lượn trên ruộng?', ['đàn cò trắng', 'đàn chim sẻ', 'đàn bướm'], 'đàn cò trắng', 1, 'Đàn cò trắng bay lượn trên ruộng.'],
      ['Lũy tre làng thế nào?', ['rì rào trong gió', 'im lặng', 'đổ rạp'], 'rì rào trong gió', 2, 'Lũy tre làng rì rào trong gió.'],
      ['Câu nào là câu nêu đặc điểm?', ['Những hạt sương long lanh.', 'Đàn cò bay lượn trên ruộng.', 'Mặt trời lên cao.'], 'Những hạt sương long lanh.', 3, '"long lanh" cho biết hạt sương thế nào: câu nêu đặc điểm.']]),
  W(23, 'xanh', 'Bài 9–10', 'Vè chim; Khủng long', 'Mở rộng vốn từ về muông thú; dấu chấm, dấu chấm hỏi, dấu chấm than; phân biệt uya/uyu, iêu/ươu, uôt/uôc', 'muongthu', ['daucau'], ['uya/uyu', 'iêu/ươu', 'uôt/uôc'],
    'Một ngày ở vườn thú', 'Chủ nhật, bố đưa em đi vườn thú. Chú voi to lớn đang dùng vòi hút nước phun lên lưng. Hươu cao cổ vươn cổ ăn lá trên cây cao. Bầy khỉ nhảy nhót, chuyền cành rất nhanh. Em kêu lên: "Ôi, chú khỉ này tinh nghịch quá!"',
    [['Chú voi đang làm gì?', ['dùng vòi hút nước phun lên lưng', 'ngủ trưa', 'ăn chuối'], 'dùng vòi hút nước phun lên lưng', 1, 'Chú voi dùng vòi hút nước phun lên lưng.'],
      ['Hươu cao cổ ăn gì?', ['lá trên cây cao', 'cỏ dưới đất', 'quả chuối'], 'lá trên cây cao', 1, 'Hươu cao cổ vươn cổ ăn lá trên cây cao.'],
      ['Bầy khỉ thế nào?', ['nhảy nhót, chuyền cành nhanh', 'nằm im', 'đi chậm chạp'], 'nhảy nhót, chuyền cành nhanh', 2, 'Bầy khỉ nhảy nhót, chuyền cành rất nhanh.'],
      ['Vì sao câu "Ôi, chú khỉ này tinh nghịch quá!" đặt dấu chấm than?', ['vì câu bộc lộ cảm xúc', 'vì câu dùng để hỏi', 'vì câu kể việc'], 'vì câu bộc lộ cảm xúc', 3, 'Câu có "ôi", "quá" bộc lộ cảm xúc nên đặt dấu chấm than.']]),
  W(24, 'xanh', 'Bài 11–12', 'Sự tích cây thì là; Bờ tre đón khách', 'Mở rộng vốn từ về vật nuôi; câu nêu đặc điểm của loài vật; phân biệt d/gi, iu/ưu, ươc/ươt', 'vatnuoi', ['dacdiem', 'neudd'], ['r/d/gi', 'iu/ưu', 'ươc/ươt'],
    'Chú chó Mực', 'Nhà em nuôi một chú chó tên là Mực. Mực có bộ lông đen bóng, đôi tai vểnh lên nghe ngóng. Chiều nào em đi học về, Mực cũng chạy ra cổng vẫy đuôi mừng rỡ. Đêm đến, Mực nằm trước hiên canh nhà. Em coi Mực như một người bạn.',
    [['Chú chó tên là gì?', ['Mực', 'Vàng', 'Bông'], 'Mực', 1, 'Chú chó tên là Mực.'],
      ['Bộ lông của Mực thế nào?', ['đen bóng', 'trắng muốt', 'vàng óng'], 'đen bóng', 1, 'Mực có bộ lông đen bóng.'],
      ['Đêm đến, Mực làm gì?', ['nằm trước hiên canh nhà', 'đi chơi', 'ngủ trong bếp'], 'nằm trước hiên canh nhà', 2, 'Đêm đến, Mực nằm trước hiên canh nhà.'],
      ['Chọn tất cả từ chỉ đặc điểm của chú chó trong bài.', ['đen bóng', 'vểnh', 'mừng rỡ', 'cổng'], ['đen bóng', 'vểnh', 'mừng rỡ'], 3, '"cổng" là từ chỉ sự vật; ba từ còn lại chỉ đặc điểm.']]),
  W(25, 'xanh', 'Bài 13–14', 'Tiếng chổi tre; Cỏ non cười rồi', 'Mở rộng vốn từ về bảo vệ môi trường; dấu phẩy; phân biệt ng/ngh, tr/ch, êt/êch', 'moitruong', ['dauphay'], ['ng/ngh', 'ch/tr', 'êt/êch'],
    'Ngày chủ nhật xanh', 'Sáng chủ nhật, các bạn nhỏ trong khu phố cùng nhau làm vệ sinh. Người nhặt rác, người quét lá, người tưới cây. Bác tổ trưởng phát cho mỗi bạn một đôi găng tay. Chẳng mấy chốc, con đường sạch bong. Mọi người hẹn nhau tháng sau lại cùng làm.',
    [['Các bạn nhỏ làm gì vào sáng chủ nhật?', ['làm vệ sinh khu phố', 'đi xem phim', 'đá bóng'], 'làm vệ sinh khu phố', 1, 'Các bạn cùng nhau làm vệ sinh khu phố.'],
      ['Bác tổ trưởng phát cho mỗi bạn cái gì?', ['đôi găng tay', 'cái chổi', 'túi rác'], 'đôi găng tay', 1, 'Bác phát cho mỗi bạn một đôi găng tay.'],
      ['Sau khi làm xong, con đường thế nào?', ['sạch bong', 'đầy rác', 'ngập nước'], 'sạch bong', 2, 'Con đường sạch bong.'],
      ['Trong câu "Người nhặt rác, người quét lá, người tưới cây.", dấu phẩy ngăn cách gì?', ['các việc làm khác nhau', 'hai câu hỏi', 'tên người'], 'các việc làm khác nhau', 3, 'Dấu phẩy ngăn cách các bộ phận cùng loại (các việc làm) trong câu.']]),
  W(26, 'xanh', 'Bài 15–16', 'Những con sao biển; Tạm biệt cánh cam', 'Mở rộng vốn từ về các loài vật nhỏ bé; dấu chấm, dấu chấm hỏi; phân biệt oanh/oach, s/x, dấu hỏi/dấu ngã', 'convat', ['daucau'], ['oanh/oach', 's/x', 'hỏi/ngã'],
    'Chú dế ở góc vườn', 'Trong góc vườn có một chú dế mèn. Chú có đôi cánh nâu bóng và cặp râu dài. Tối nào chú cũng đứng trước hang kéo đàn "re re". Một lần, em định bắt chú bỏ vào hộp. Mẹ bảo: "Con để dế ở với vườn, dế sẽ vui hơn." Em gật đầu, để chú dế tự do.',
    [['Chú dế có đôi cánh màu gì?', ['nâu bóng', 'xanh lá', 'đỏ'], 'nâu bóng', 1, 'Chú dế có đôi cánh nâu bóng.'],
      ['Tối đến, chú dế làm gì?', ['kéo đàn trước hang', 'đi kiếm ăn xa', 'ngủ say'], 'kéo đàn trước hang', 1, 'Tối nào chú cũng đứng trước hang kéo đàn.'],
      ['Vì sao bạn nhỏ không bắt chú dế nữa?', ['vì nghe lời mẹ, để dế được tự do', 'vì dế cắn', 'vì không có hộp'], 'vì nghe lời mẹ, để dế được tự do', 2, 'Mẹ khuyên để dế ở với vườn, em đồng ý.'],
      ['Bài đọc khuyên em điều gì?', ['Yêu quý và bảo vệ các con vật nhỏ', 'Nên nuôi dế trong hộp', 'Không nên ra vườn'], 'Yêu quý và bảo vệ các con vật nhỏ', 3, 'Để dế sống tự do là biết yêu quý, bảo vệ loài vật nhỏ bé.']]),
  W(27, 'on', 'Ôn tập giữa học kì 2', 'Ôn tập các bài đọc tuần 19–26', 'Ôn mở rộng vốn từ, dấu câu, chính tả', 'thiennhien', ['suvat', 'hoatdong', 'dacdiem', 'neudd', 'daucau', 'dauphay'], ['ng/ngh', 's/x', 'l/n', 'hỏi/ngã'],
    'Mưa xuân', 'Mưa xuân lất phất bay. Những hạt mưa nhỏ như hạt bụi rơi xuống vườn. Cây đào trước ngõ bừng lên những nụ hoa hồng phớt. Đàn gà con nấp dưới cánh mẹ. Mưa tạnh, cả khu vườn như được tắm mát, xanh tươi hơn.',
    [['Hạt mưa xuân được so sánh với gì?', ['hạt bụi', 'hạt đậu', 'viên bi'], 'hạt bụi', 1, 'Những hạt mưa nhỏ như hạt bụi.'],
      ['Cây gì trước ngõ ra nụ hoa?', ['cây đào', 'cây mai', 'cây bàng'], 'cây đào', 1, 'Cây đào trước ngõ bừng lên những nụ hoa.'],
      ['Đàn gà con làm gì khi trời mưa?', ['nấp dưới cánh mẹ', 'chạy ra vườn', 'đi tìm sâu'], 'nấp dưới cánh mẹ', 2, 'Đàn gà con nấp dưới cánh mẹ.'],
      ['Sau cơn mưa, khu vườn thế nào?', ['xanh tươi hơn', 'khô héo', 'ngập nước'], 'xanh tươi hơn', 3, 'Mưa tạnh, khu vườn như được tắm mát, xanh tươi hơn.']]),
  W(28, 'ket', 'Bài 17–18', 'Những cách chào độc đáo; Thư viện biết đi', 'Luyện tập dấu chấm, dấu chấm than, dấu phẩy; phân biệt d/gi, ch/tr, dấu hỏi/dấu ngã', 'giaotiep', ['daucau', 'dauphay'], ['r/d/gi', 'ch/tr', 'hỏi/ngã'],
    'Lời chào', 'Mỗi sáng đến lớp, Nam đều chào bác bảo vệ: "Cháu chào bác ạ!" Gặp cô giáo, Nam khoanh tay chào cô. Gặp bạn, Nam vẫy tay cười thật tươi. Bác bảo vệ hay nói: "Cậu bé này lễ phép quá!" Nam hiểu rằng lời chào giúp mọi người thêm gần nhau.',
    [['Nam chào ai đầu tiên khi đến lớp?', ['bác bảo vệ', 'cô giáo', 'các bạn'], 'bác bảo vệ', 1, 'Mỗi sáng, Nam chào bác bảo vệ.'],
      ['Gặp bạn, Nam chào thế nào?', ['vẫy tay cười thật tươi', 'khoanh tay', 'cúi đầu'], 'vẫy tay cười thật tươi', 1, 'Gặp bạn, Nam vẫy tay cười thật tươi.'],
      ['Bác bảo vệ khen Nam thế nào?', ['lễ phép', 'học giỏi', 'chạy nhanh'], 'lễ phép', 2, 'Bác nói: "Cậu bé này lễ phép quá!"'],
      ['Theo Nam, lời chào có ích gì?', ['giúp mọi người thêm gần nhau', 'giúp học giỏi hơn', 'không có ích'], 'giúp mọi người thêm gần nhau', 3, 'Nam hiểu lời chào giúp mọi người thêm gần nhau.']]),
  W(29, 'ket', 'Bài 19–20', 'Cảm ơn anh hà mã; Từ chú bồ câu đến in-tơ-nét', 'Mở rộng vốn từ về giao tiếp, kết nối; dấu chấm, dấu phẩy; phân biệt eo/oe, l/n, ên/ênh', 'giaotiep', ['daucau', 'dauphay'], ['eo/oe', 'l/n', 'ên/ênh'],
    'Cuộc gọi video', 'Bố của Linh làm việc ở xa. Tối nào Linh cũng gọi video cho bố. Linh kể cho bố nghe chuyện ở lớp, khoe bức tranh mới vẽ. Bố dặn Linh chăm học, nghe lời mẹ. Tắt máy rồi, Linh vẫn thấy bố như đang ở rất gần.',
    [['Vì sao Linh phải gọi video cho bố?', ['vì bố làm việc ở xa', 'vì bố bị ốm', 'vì Linh ở nhà bà'], 'vì bố làm việc ở xa', 1, 'Bố của Linh làm việc ở xa.'],
      ['Linh khoe với bố cái gì?', ['bức tranh mới vẽ', 'cái cặp mới', 'quyển truyện'], 'bức tranh mới vẽ', 1, 'Linh khoe bức tranh mới vẽ.'],
      ['Bố dặn Linh điều gì?', ['chăm học, nghe lời mẹ', 'đi ngủ sớm', 'đi chơi nhiều'], 'chăm học, nghe lời mẹ', 2, 'Bố dặn Linh chăm học, nghe lời mẹ.'],
      ['Nhờ gọi video, Linh cảm thấy thế nào?', ['bố như đang ở rất gần', 'buồn hơn', 'không nhớ bố'], 'bố như đang ở rất gần', 3, 'Cuộc gọi kết nối hai bố con, Linh thấy bố như ở gần.']]),
  W(30, 'nguoi', 'Bài 21–22', 'Mai An Tiêm; Thư gửi bố ngoài đảo', 'Mở rộng vốn từ về nghề nghiệp; phân biệt d/gi, s/x, ip/iêp', 'nghenghiep', ['suvat', 'hoatdong'], ['r/d/gi', 's/x', 'ip/iêp'],
    'Mẹ em là y tá', 'Mẹ em là y tá ở bệnh viện huyện. Mẹ mặc áo trắng, đội mũ trắng. Mỗi ngày, mẹ tiêm thuốc, đo nhiệt độ và chăm sóc người bệnh. Có hôm mẹ về muộn vì phải trực đêm. Em tự hào về mẹ và mong lớn lên cũng giúp được nhiều người như mẹ.',
    [['Mẹ em làm nghề gì?', ['y tá', 'giáo viên', 'nông dân'], 'y tá', 1, 'Mẹ em là y tá.'],
      ['Mẹ làm những việc gì?', ['tiêm thuốc, chăm sóc người bệnh', 'dạy học', 'trồng lúa'], 'tiêm thuốc, chăm sóc người bệnh', 2, 'Mẹ tiêm thuốc, đo nhiệt độ, chăm sóc người bệnh.'],
      ['Vì sao có hôm mẹ về muộn?', ['vì phải trực đêm', 'vì đi chơi', 'vì đi chợ'], 'vì phải trực đêm', 1, 'Có hôm mẹ về muộn vì phải trực đêm.'],
      ['Nối mỗi nghề với công việc.', [], 'match', 3, 'Y tá chăm sóc người bệnh; giáo viên dạy học; nông dân trồng lúa.']]),
  W(31, 'nguoi', 'Bài 23–24', 'Bóp nát quả cam; Chiếc rễ đa tròn', 'Mở rộng vốn từ về Bác Hồ và nhân dân; viết hoa tên người; phân biệt iu/ưu, im/iêm', 'bacho', ['viethoa'], ['iu/ưu', 'im/iêm'],
    'Bác Hồ và các cháu thiếu nhi', 'Bác Hồ rất yêu thương các cháu thiếu nhi. Mỗi dịp Tết Trung thu, Bác thường gửi thư và quà cho các cháu. Bác dặn các cháu chăm học, ngoan ngoãn, biết giúp đỡ mọi người. Các cháu thiếu nhi cả nước luôn nhớ ơn Bác Hồ kính yêu.',
    [['Bác Hồ yêu thương ai?', ['các cháu thiếu nhi', 'chỉ người lớn', 'các con vật'], 'các cháu thiếu nhi', 1, 'Bác Hồ rất yêu thương các cháu thiếu nhi.'],
      ['Dịp nào Bác thường gửi thư và quà cho các cháu?', ['Tết Trung thu', 'ngày sinh nhật Bác', 'ngày khai giảng'], 'Tết Trung thu', 1, 'Mỗi dịp Tết Trung thu, Bác gửi thư và quà.'],
      ['Bác dặn các cháu điều gì?', ['chăm học, ngoan ngoãn, biết giúp đỡ mọi người', 'chơi thật nhiều', 'ăn nhiều kẹo'], 'chăm học, ngoan ngoãn, biết giúp đỡ mọi người', 2, 'Bác dặn các cháu chăm học, ngoan ngoãn, biết giúp đỡ mọi người.'],
      ['Từ nào thể hiện tình cảm của thiếu nhi với Bác?', ['kính yêu', 'tức giận', 'lo sợ'], 'kính yêu', 3, 'Thiếu nhi nhớ ơn "Bác Hồ kính yêu".']]),
  W(32, 'que', 'Bài 25–26', 'Đất nước chúng mình; Trên các miền đất nước', 'Mở rộng vốn từ về sản phẩm truyền thống; câu giới thiệu; viết hoa tên riêng địa lí; phân biệt ch/tr, iu/iêu', 'sanpham', ['gioithieu', 'viethoa', 'diali'], ['ch/tr', 'iu/iêu'],
    'Chiếc nón lá quê em', 'Quê em ở Huế, nơi có những chiếc nón lá thật đẹp. Nón được làm từ lá cọ phơi trắng, khâu bằng những sợi chỉ mảnh. Giữa hai lớp lá, người thợ còn lồng những bức tranh nhỏ. Khi soi lên ánh nắng, em thấy rõ hình cây cầu và dòng sông. Chiếc nón lá là niềm tự hào của quê em.',
    [['Quê bạn nhỏ ở đâu?', ['Huế', 'Hà Nội', 'Cần Thơ'], 'Huế', 1, 'Quê em ở Huế (tên riêng địa lí, viết hoa).'],
      ['Nón lá được làm từ gì?', ['lá cọ', 'lá chuối', 'vải'], 'lá cọ', 1, 'Nón được làm từ lá cọ phơi trắng.'],
      ['Soi nón lên ánh nắng, em thấy gì?', ['hình cây cầu và dòng sông', 'hình con chim', 'không thấy gì'], 'hình cây cầu và dòng sông', 2, 'Em thấy rõ hình cây cầu và dòng sông.'],
      ['Câu nào là câu giới thiệu?', ['Chiếc nón lá là niềm tự hào của quê em.', 'Người thợ lồng tranh vào nón.', 'Lá cọ phơi trắng.'], 'Chiếc nón lá là niềm tự hào của quê em.', 3, 'Câu theo mẫu "Cái gì là gì?" là câu giới thiệu.']]),
  W(33, 'que', 'Bài 27–28', 'Chuyện quả bầu; Khám phá đáy biển ở Trường Sa', 'Mở rộng vốn từ về các loài vật dưới biển; dấu chấm, dấu phẩy; phân biệt it/uyt, ươu/iêu, in/inh', 'bien', ['daucau', 'dauphay'], ['it/uyt', 'ươu/iêu', 'in/inh'],
    'Dưới đáy biển', 'Đáy biển đẹp như một khu vườn. Những rặng san hô đỏ, hồng, vàng đung đưa theo dòng nước. Đàn cá nhỏ sặc sỡ bơi qua bơi lại. Một chú rùa biển chậm rãi bơi tìm thức ăn. Sao biển nằm im trên cát như một ngôi sao rơi xuống.',
    [['Đáy biển được so sánh với gì?', ['một khu vườn', 'một cánh đồng', 'một ngôi nhà'], 'một khu vườn', 1, 'Đáy biển đẹp như một khu vườn.'],
      ['San hô có những màu gì?', ['đỏ, hồng, vàng', 'đen, trắng', 'tím, nâu'], 'đỏ, hồng, vàng', 1, 'Những rặng san hô đỏ, hồng, vàng.'],
      ['Chú rùa biển bơi thế nào?', ['chậm rãi', 'rất nhanh', 'nhảy lên khỏi mặt nước'], 'chậm rãi', 2, 'Một chú rùa biển chậm rãi bơi tìm thức ăn.'],
      ['Chọn tất cả con vật sống dưới biển được nhắc trong bài.', ['san hô', 'rùa biển', 'sao biển', 'con trâu'], ['san hô', 'rùa biển', 'sao biển'], 3, 'Con trâu không sống dưới biển.']]),
  W(34, 'que', 'Bài 29–30', 'Hồ Gươm; Cánh đồng quê em', 'Mở rộng vốn từ về nghề nghiệp; viết hoa tên riêng địa lí; phân biệt r/d/gi, dấu hỏi/dấu ngã', 'nghenghiep', ['viethoa', 'diali', 'gioithieu'], ['r/d/gi', 'hỏi/ngã'],
    'Ghé thăm Hồ Gươm', 'Hè vừa rồi, bố mẹ đưa em đi thăm thủ đô Hà Nội. Em được ngắm Hồ Gươm xanh biếc, giữa hồ có Tháp Rùa cổ kính. Cầu Thê Húc đỏ thắm nối ra đền Ngọc Sơn. Buổi chiều, quanh hồ có nhiều người đi dạo. Em thấy yêu Hà Nội hơn.',
    [['Bạn nhỏ được đi thăm thành phố nào?', ['Hà Nội', 'Huế', 'Đà Nẵng'], 'Hà Nội', 1, 'Bố mẹ đưa em đi thăm thủ đô Hà Nội.'],
      ['Giữa hồ có gì?', ['Tháp Rùa', 'cây cầu sắt', 'con thuyền'], 'Tháp Rùa', 1, 'Giữa hồ có Tháp Rùa cổ kính.'],
      ['Cầu Thê Húc có màu gì?', ['đỏ thắm', 'xanh biếc', 'trắng tinh'], 'đỏ thắm', 2, 'Cầu Thê Húc đỏ thắm.'],
      ['Chọn tất cả tên riêng địa lí trong bài.', ['Hà Nội', 'Hồ Gươm', 'Tháp Rùa', 'buổi chiều'], ['Hà Nội', 'Hồ Gươm', 'Tháp Rùa'], 3, 'Tên riêng địa lí được viết hoa; "buổi chiều" không phải tên riêng.']]),
  W(35, 'on', 'Ôn tập cuối năm', 'Ôn tập các bài đọc học kì 2', 'Ôn tập từ ngữ, câu, dấu câu, chính tả cả năm', 'thiennhien', ['suvat', 'hoatdong', 'dacdiem', 'gioithieu', 'neuhd', 'neudd', 'daucau', 'dauphay', 'viethoa', 'diali'], ['ch/tr', 'r/d/gi', 'l/n', 's/x', 'hỏi/ngã'],
    'Mùa hè đã đến', 'Phượng đỏ rực trên sân trường. Ve kêu râm ran trong tán lá. Năm học đã kết thúc, chúng em chia tay thầy cô và các bạn. Cô dặn: "Hè này các em nhớ đọc sách, giúp đỡ bố mẹ nhé!" Em hứa sẽ có một mùa hè thật vui và bổ ích.',
    [['Hoa gì đỏ rực trên sân trường?', ['hoa phượng', 'hoa đào', 'hoa cúc'], 'hoa phượng', 1, 'Phượng đỏ rực trên sân trường.'],
      ['Tiếng gì kêu râm ran?', ['tiếng ve', 'tiếng chim', 'tiếng trống'], 'tiếng ve', 1, 'Ve kêu râm ran trong tán lá.'],
      ['Cô giáo dặn các bạn điều gì?', ['đọc sách, giúp đỡ bố mẹ', 'chơi điện tử', 'ngủ thật nhiều'], 'đọc sách, giúp đỡ bố mẹ', 2, 'Cô dặn nhớ đọc sách, giúp đỡ bố mẹ.'],
      ['Bài đọc tả thời điểm nào?', ['khi năm học kết thúc, mùa hè đến', 'ngày khai giảng', 'ngày Tết'], 'khi năm học kết thúc, mùa hè đến', 3, 'Phượng nở, ve kêu, năm học kết thúc: mùa hè đã đến.']]),
];

// Câu ghép cặp riêng (đánh dấu 'match' trong bảng trên)
const MATCH: Record<number, [string, string][]> = {
  19: [['mùa xuân', 'đâm chồi nảy lộc'], ['mùa hè', 'nắng vàng rực rỡ'], ['mùa thu', 'trời mát mẻ'], ['mùa đông', 'gió lạnh thổi về']],
  30: [['y tá', 'chăm sóc người bệnh'], ['giáo viên', 'dạy học'], ['nông dân', 'trồng lúa']],
};

const read = (w: TVWeek, q: string) => `Đọc bài "${w.title}":\n${w.text}\n\n${q}`;
const outcomeFor = (lv: Level) => (lv >= 3 ? 'V2.DOC.02' : 'V2.DOC.01');

function readingQs(w: TVWeek): ContentQuestion[] {
  return w.qs.map(([prompt, options, correct, level, e]) => {
    const m = { o: outcomeFor(level), f: 'TV.DOCHIEU', l: level, e, s: level >= 3 ? e : undefined };
    if (correct === 'match') {
      const pairs = MATCH[w.week];
      return { type: 'matching', prompt: read(w, prompt), left: pairs.map((p) => p[0]), options: pairs.map((p) => p[1]), key: { pairs: Object.fromEntries(pairs) }, explanation: e, solution: m.s, level, outcome: 'V2.TU.04', form: 'TV.NOITU' } as ContentQuestion;
    }
    if (Array.isArray(correct)) return mc(read(w, prompt), options, correct, { ...m, o: 'V2.TU.04', f: 'TV.TUNGU' });
    if (!options.length) return tf(read(w, prompt), correct as 'Đúng' | 'Sai', m);
    return sc(read(w, prompt), options, correct, m);
  });
}

/** Câu luyện từ – câu – chính tả của tuần, rút từ bộ sinh câu (chỉ dạng hiển thị được không cần tranh) */
function practiceQs(w: TVWeek): ContentQuestion[] {
  const ctx = { ...w.ctx, week: w.week };
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  ([1, 2, 4, 5] as Level[]).forEach((lv, slot) => {
    const r = makeRng(w.week * 6007 + slot * 7919);
    for (let i = 0; i < 200; i++) {
      const q: PracticeQuestion | null = r.pick(TV2G_POOL[lv])(r, ctx, lv);
      if (!q || q.figure || q.type === 'fill_blanks' || q.type === 'true_false_table' || seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(q);
      return;
    }
  });
  return out;
}

const lesson = (w: TVWeek): ContentLesson => ({
  id: `tv2-kntt-t${String(w.week).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 2,
  semester: w.week <= 18 ? 1 : 2,
  book: BOOK,
  ref: `Tuần ${w.week} · ${w.bai}`,
  unit: { code: `KNTT.V2.${w.topic}`, title: w.topic === 'on' ? 'Ôn tập' : `Chủ điểm: ${TV2_TOPICS[w.topic]}` },
  topicCode: 'V2.DOC',
  title: `Tuần ${w.week}. ${w.topic === 'on' ? w.bai : w.title}`,
  description: `Sách: ${w.readings}. Luyện tập: ${w.practice}.`,
  scope: SCOPE,
  questions: [...readingQs(w), ...practiceQs(w)].sort((a, b) => a.level - b.level),
});

export const TV2_HK1: ContentLesson[] = TV2_WEEKS.filter((w) => w.week <= 18).map(lesson);
export const TV2_HK2: ContentLesson[] = TV2_WEEKS.filter((w) => w.week > 18).map(lesson);
export const tv2Ctx = (week: number): TVCtx => {
  const w = TV2_WEEKS.find((x) => x.week === week)!;
  return { ...w.ctx, week };
};
