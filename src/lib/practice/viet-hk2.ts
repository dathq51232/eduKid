// Ngữ liệu TIẾNG VIỆT 1 — HỌC KÌ 2 (tập hai, sách Kết nối tri thức): 8 chủ đề đọc.
// Đoạn văn, câu và từ ngữ dưới đây do EduChain Kids tự viết theo chủ đề của sách —
// KHÔNG chép bài đọc của sách giáo khoa. Mọi tiếng đều thuộc âm, vần đã học hết tập một (kiểm tra tự động).

export type ThemeNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TV2_THEMES: Record<ThemeNo, { title: string; readings: string }> = {
  1: { title: 'Tôi và các bạn', readings: 'Tôi là học sinh lớp 1, Đôi tai xấu xí, Bạn của gió, Giải thưởng tình bạn, Sinh nhật của voi con' },
  2: { title: 'Mái ấm gia đình', readings: 'Nụ hôn trên bàn tay, Làm anh, Cả nhà đi chơi núi, Quạt cho bà ngủ, Bữa cơm gia đình, Ngôi nhà' },
  3: { title: 'Mái trường mến yêu', readings: 'Tôi đi học, Đi học, Hoa yêu thương, Cây bàng và lớp học, Bác trống trường, Giờ ra chơi' },
  4: { title: 'Điều em cần biết', readings: 'Rửa tay trước khi ăn, Lời chào đi trước, Khi mẹ vắng nhà, Nếu không may bị lạc, Đèn giao thông' },
  5: { title: 'Bài học từ cuộc sống', readings: 'Kiến và chim bồ câu, Câu chuyện của rễ, Câu hỏi của sói, Chú bé chăn cừu, Tiếng vọng của núi' },
  6: { title: 'Thiên nhiên kì thú', readings: 'Loài chim của biển cả, Bảy sắc cầu vồng, Chúa tể rừng xanh, Cuộc thi tài năng rừng xanh, Cây liễu dẻo dai' },
  7: { title: 'Thế giới trong mắt em', readings: 'Tia nắng đi đâu?, Trong giấc mơ buổi sáng, Ngày mới bắt đầu, Hỏi mẹ, Những cánh cò, Buổi trưa hè, Hoa phượng' },
  8: { title: 'Đất nước và con người', readings: 'Cậu bé thông minh, Lính cứu hoả, Lớn lên bạn làm gì?, Ruộng bậc thang ở Sa Pa, Nhớ ơn, Du lịch biển Việt Nam' },
};

/** Câu hỏi đọc hiểu: [câu hỏi, đáp án đúng, các lựa chọn sai] */
export type QA = [string, string, string[]];
export type Passage = { theme: ThemeNo; title: string; text: string; qa: QA[] };

export const PASSAGES: Passage[] = [
  // 1. Tôi và các bạn
  { theme: 1, title: 'Bạn mới', text: 'Lớp em có bạn mới tên là Hà. Hà còn rụt rè, chưa dám nói chuyện. Giờ ra chơi, Minh rủ Hà chơi nhảy dây. Hà cười thật tươi. Từ đó, hai bạn chơi rất thân.', qa: [
    ['Bạn mới của lớp tên là gì?', 'Hà', ['Minh', 'Lan']],
    ['Minh rủ Hà chơi gì?', 'Nhảy dây', ['Đá bóng', 'Đá cầu']],
    ['Khi được rủ chơi, Hà thế nào?', 'Hà cười thật tươi', ['Hà khóc', 'Hà đi về nhà']],
  ] },
  { theme: 1, title: 'Chiếc bút chì', text: 'Nam quên bút chì ở nhà. Nam buồn lắm. Bạn Mai ngồi bên cạnh liền cho Nam mượn một chiếc bút. Nam nói: “Cảm ơn bạn!”. Mai mỉm cười.', qa: [
    ['Nam quên gì ở nhà?', 'Bút chì', ['Quyển vở', 'Cặp sách']],
    ['Ai cho Nam mượn bút?', 'Bạn Mai', ['Cô giáo', 'Bạn Hà']],
    ['Nam nói gì với Mai?', 'Cảm ơn bạn!', ['Chào bạn!', 'Xin lỗi bạn!']],
  ] },
  { theme: 1, title: 'Sinh nhật của Thỏ', text: 'Hôm nay là sinh nhật Thỏ con. Sóc mang tặng Thỏ một giỏ hạt dẻ. Nhím tặng một bông hoa đỏ. Thỏ vui lắm, mời các bạn ăn bánh và cùng hát.', qa: [
    ['Hôm nay là sinh nhật của ai?', 'Thỏ con', ['Sóc', 'Nhím']],
    ['Sóc tặng Thỏ món quà gì?', 'Một giỏ hạt dẻ', ['Một bông hoa đỏ', 'Một chiếc bánh']],
    ['Nhím tặng Thỏ món quà gì?', 'Một bông hoa đỏ', ['Một giỏ hạt dẻ', 'Một quả táo']],
  ] },
  // 2. Mái ấm gia đình
  { theme: 2, title: 'Bữa tối', text: 'Tối nào cả nhà em cũng ăn cơm cùng nhau. Mẹ nấu canh cua, bố rán cá. Em xếp bát đũa lên mâm. Cả nhà vừa ăn vừa kể chuyện vui.', qa: [
    ['Mẹ nấu món gì?', 'Canh cua', ['Cá rán', 'Thịt kho']],
    ['Em làm gì để giúp bố mẹ?', 'Xếp bát đũa lên mâm', ['Rán cá', 'Rửa rau']],
    ['Cả nhà vừa ăn vừa làm gì?', 'Kể chuyện vui', ['Xem ti vi', 'Hát']],
  ] },
  { theme: 2, title: 'Quạt cho bà', text: 'Trưa hè, trời oi bức. Bà nằm nghỉ trên chiếc giường tre. Bé Lan ngồi bên cạnh, cầm quạt quạt cho bà. Bà ngủ ngon. Lan đi nhẹ ra ngoài sân.', qa: [
    ['Bà nằm nghỉ ở đâu?', 'Trên chiếc giường tre', ['Trên ghế', 'Ngoài sân']],
    ['Lan làm gì cho bà?', 'Quạt cho bà', ['Nấu cơm cho bà', 'Đọc truyện cho bà']],
    ['Khi bà ngủ, Lan làm gì?', 'Đi nhẹ ra ngoài sân', ['Hát to', 'Chạy nhảy']],
  ] },
  { theme: 2, title: 'Anh trai', text: 'Em có một anh trai học lớp 4. Sáng nào anh cũng đưa em đến lớp. Khi em ngã, anh đỡ em dậy và dỗ em nín khóc. Em rất yêu anh.', qa: [
    ['Anh trai học lớp mấy?', 'Lớp 4', ['Lớp 1', 'Lớp 2']],
    ['Sáng nào anh cũng làm gì?', 'Đưa em đến lớp', ['Nấu cơm', 'Tưới cây']],
    ['Khi em ngã, anh làm gì?', 'Đỡ em dậy và dỗ em', ['Cười em', 'Đi chơi']],
  ] },
  // 3. Mái trường mến yêu
  { theme: 3, title: 'Cây bàng sân trường', text: 'Giữa sân trường có một cây bàng to. Mùa hè, lá bàng xanh mát. Giờ ra chơi, chúng em ngồi dưới gốc cây đọc truyện. Cây bàng như một người bạn của lớp em.', qa: [
    ['Giữa sân trường có cây gì?', 'Cây bàng', ['Cây phượng', 'Cây xoài']],
    ['Mùa hè, lá bàng thế nào?', 'Xanh mát', ['Vàng úa', 'Đỏ thắm']],
    ['Giờ ra chơi, các bạn làm gì dưới gốc cây?', 'Đọc truyện', ['Ăn cơm', 'Ngủ trưa']],
  ] },
  { theme: 3, title: 'Bác trống', text: 'Bác trống nằm ở góc sân trường. Mỗi sáng, bác trống gọi các bạn vào lớp: “Tùng! Tùng! Tùng!”. Hết giờ học, bác lại báo cho các bạn về nhà.', qa: [
    ['Bác trống nằm ở đâu?', 'Ở góc sân trường', ['Trong lớp học', 'Ngoài cổng']],
    ['Mỗi sáng, bác trống làm gì?', 'Gọi các bạn vào lớp', ['Hát một bài', 'Quét sân']],
    ['Tiếng trống kêu thế nào?', 'Tùng! Tùng! Tùng!', ['Bùm! Bùm!', 'Tích tắc!']],
  ] },
  { theme: 3, title: 'Giờ ra chơi', text: 'Tiếng trống ra chơi vang lên. Các bạn nam đá cầu. Các bạn nữ nhảy dây. Có bạn ngồi đọc sách ở thư viện. Sân trường rộn rã tiếng cười.', qa: [
    ['Các bạn nam chơi gì?', 'Đá cầu', ['Nhảy dây', 'Đọc sách']],
    ['Các bạn nữ chơi gì?', 'Nhảy dây', ['Đá cầu', 'Đá bóng']],
    ['Có bạn đọc sách ở đâu?', 'Ở thư viện', ['Ở nhà', 'Ở vườn']],
  ] },
  // 4. Điều em cần biết
  { theme: 4, title: 'Rửa tay', text: 'Trước khi ăn, em luôn rửa tay bằng xà phòng. Em xoa đều hai bàn tay, rửa sạch các kẽ ngón tay. Sau đó, em lau tay bằng khăn sạch. Đôi tay sạch giúp em khỏe mạnh.', qa: [
    ['Em rửa tay khi nào?', 'Trước khi ăn', ['Sau khi ngủ dậy', 'Khi đi học về']],
    ['Em rửa tay bằng gì?', 'Bằng xà phòng', ['Bằng cát', 'Bằng lá cây']],
    ['Em lau tay bằng gì?', 'Khăn sạch', ['Áo', 'Giấy báo']],
  ] },
  { theme: 4, title: 'Qua đường', text: 'Đèn đỏ thì dừng lại. Đèn vàng thì đi chậm lại. Đèn xanh thì mới được đi. Khi qua đường, em nắm tay người lớn và đi trên vạch dành cho người đi bộ.', qa: [
    ['Đèn đỏ thì phải làm gì?', 'Dừng lại', ['Đi nhanh', 'Đi chậm lại']],
    ['Đèn xanh thì thế nào?', 'Được đi', ['Phải dừng lại', 'Đứng chờ mãi']],
    ['Khi qua đường, em nắm tay ai?', 'Người lớn', ['Bạn nhỏ', 'Không nắm tay ai']],
  ] },
  { theme: 4, title: 'Khi ở nhà một mình', text: 'Mẹ đi chợ, dặn Nam ở nhà khóa cửa cẩn thận. Có người lạ gõ cửa, Nam không mở. Nam gọi điện cho mẹ. Mẹ khen Nam rất ngoan.', qa: [
    ['Mẹ đi đâu?', 'Đi chợ', ['Đi làm', 'Đi học']],
    ['Có người lạ gõ cửa, Nam làm gì?', 'Không mở cửa', ['Mở cửa ngay', 'Chạy ra ngoài']],
    ['Mẹ khen Nam thế nào?', 'Rất ngoan', ['Rất nhanh', 'Rất cao']],
  ] },
  // 5. Bài học từ cuộc sống
  { theme: 5, title: 'Kiến và ve', text: 'Mùa hè, kiến chăm chỉ tha mồi về tổ. Ve chỉ mải ca hát. Mùa đông đến, kiến có nhiều thức ăn. Ve thì đói và lạnh. Ve hiểu rằng phải chăm làm.', qa: [
    ['Mùa hè, kiến làm gì?', 'Tha mồi về tổ', ['Ca hát', 'Đi chơi']],
    ['Mùa hè, ve làm gì?', 'Mải ca hát', ['Tha mồi', 'Xây tổ']],
    ['Ve hiểu ra điều gì?', 'Phải chăm làm', ['Phải hát hay', 'Phải ngủ nhiều']],
  ] },
  { theme: 5, title: 'Cậu bé nói dối', text: 'Có một cậu bé chăn cừu hay nói dối. Cậu kêu “Sói đến!” để trêu mọi người. Một hôm, sói đến thật. Cậu kêu cứu nhưng không ai tin nữa.', qa: [
    ['Cậu bé chăn con gì?', 'Cừu', ['Bò', 'Gà']],
    ['Vì sao cậu kêu "Sói đến!"?', 'Để trêu mọi người', ['Vì sói đến thật', 'Để gọi bạn']],
    ['Khi sói đến thật, mọi người thế nào?', 'Không ai tin nữa', ['Chạy đến giúp', 'Cười vui']],
  ] },
  { theme: 5, title: 'Tiếng vọng', text: 'Bé hét to vào vách núi: “Tớ ghét cậu!”. Núi vọng lại: “Tớ ghét cậu!”. Mẹ bảo bé nói: “Tớ yêu cậu!”. Núi cũng đáp lại lời yêu thương. Bé hiểu: mình nói gì, sẽ nhận lại điều đó.', qa: [
    ['Bé hét vào đâu?', 'Vào vách núi', ['Vào giếng', 'Vào rừng']],
    ['Mẹ bảo bé nói câu gì?', 'Tớ yêu cậu!', ['Tớ ghét cậu!', 'Chào cậu!']],
    ['Bé hiểu ra điều gì?', 'Mình nói gì, sẽ nhận lại điều đó', ['Núi rất cao', 'Phải hét thật to']],
  ] },
  // 6. Thiên nhiên kì thú
  { theme: 6, title: 'Cầu vồng', text: 'Mưa vừa tạnh, trên trời hiện ra cầu vồng. Cầu vồng có bảy màu: đỏ, cam, vàng, lục, lam, chàm, tím. Bé Na ngước nhìn, thích thú reo lên.', qa: [
    ['Cầu vồng hiện ra khi nào?', 'Khi mưa vừa tạnh', ['Khi trời tối', 'Khi có gió to']],
    ['Cầu vồng có mấy màu?', 'Bảy màu', ['Năm màu', 'Ba màu']],
    ['Bé Na làm gì khi thấy cầu vồng?', 'Thích thú reo lên', ['Chạy vào nhà', 'Khóc to']],
  ] },
  { theme: 6, title: 'Chim hải âu', text: 'Hải âu là loài chim của biển. Chim bay rất xa, có khi bay qua cả đại dương. Khi trời sắp có bão, hải âu bay thành đàn vào bờ.', qa: [
    ['Hải âu là loài chim của đâu?', 'Của biển', ['Của rừng', 'Của núi']],
    ['Hải âu bay thế nào?', 'Bay rất xa', ['Bay rất thấp', 'Không biết bay']],
    ['Khi sắp có bão, hải âu làm gì?', 'Bay thành đàn vào bờ', ['Bay ra biển', 'Lặn xuống nước']],
  ] },
  { theme: 6, title: 'Cây liễu', text: 'Bên hồ có một cây liễu. Thân cây không to nhưng cành rất dẻo. Gió to thổi mạnh, cành liễu chỉ nghiêng theo gió mà không gãy.', qa: [
    ['Cây liễu mọc ở đâu?', 'Bên hồ', ['Trên núi', 'Giữa sân']],
    ['Cành liễu thế nào?', 'Rất dẻo', ['Rất to', 'Rất cứng']],
    ['Khi gió to, cành liễu thế nào?', 'Nghiêng theo gió mà không gãy', ['Gãy ngay', 'Rụng hết lá']],
  ] },
  // 7. Thế giới trong mắt em
  { theme: 7, title: 'Buổi sáng', text: 'Ông mặt trời thức dậy, chiếu nắng vàng khắp vườn. Gà trống gáy vang. Chim hót líu lo trên cành. Bé dậy sớm, tập thể dục cùng ông.', qa: [
    ['Ai thức dậy chiếu nắng vàng khắp vườn?', 'Ông mặt trời', ['Gà trống', 'Bé']],
    ['Chim hót ở đâu?', 'Trên cành', ['Trong nhà', 'Dưới ao']],
    ['Bé tập thể dục cùng ai?', 'Cùng ông', ['Cùng mẹ', 'Cùng bạn']],
  ] },
  { theme: 7, title: 'Hoa phượng', text: 'Hè về, cây phượng ở sân trường nở hoa đỏ rực. Ve kêu râm ran trên cành. Nhìn hoa phượng, các bạn biết năm học sắp kết thúc.', qa: [
    ['Hoa phượng có màu gì?', 'Đỏ rực', ['Trắng tinh', 'Vàng tươi']],
    ['Con gì kêu râm ran trên cành?', 'Con ve', ['Con gà', 'Con chó']],
    ['Hoa phượng nở báo hiệu điều gì?', 'Năm học sắp kết thúc', ['Tết sắp đến', 'Trời sắp mưa']],
  ] },
  { theme: 7, title: 'Cánh cò', text: 'Chiều chiều, đàn cò trắng bay về cánh đồng. Cò lội ruộng tìm mồi. Khi trời tối, đàn cò lại bay về tổ trên rặng tre.', qa: [
    ['Đàn cò có màu gì?', 'Trắng', ['Đen', 'Xám']],
    ['Cò lội ruộng để làm gì?', 'Tìm mồi', ['Tắm mát', 'Chơi đùa']],
    ['Khi trời tối, cò bay về đâu?', 'Về tổ trên rặng tre', ['Về biển', 'Về núi']],
  ] },
  // 8. Đất nước và con người
  { theme: 8, title: 'Chú lính cứu hỏa', text: 'Chú Tâm là lính cứu hỏa. Khi có đám cháy, chú cùng đồng đội lái xe đến thật nhanh. Các chú dập lửa và cứu người. Ai cũng biết ơn các chú.', qa: [
    ['Chú Tâm làm nghề gì?', 'Lính cứu hỏa', ['Bác sĩ', 'Thợ mộc']],
    ['Khi có đám cháy, các chú làm gì?', 'Dập lửa và cứu người', ['Đi ngủ', 'Đi chợ']],
    ['Mọi người thấy thế nào với các chú?', 'Biết ơn các chú', ['Sợ các chú', 'Không để ý']],
  ] },
  { theme: 8, title: 'Ruộng bậc thang', text: 'Ở vùng núi phía bắc có những thửa ruộng bậc thang. Ruộng nối nhau từ chân đồi lên đỉnh đồi. Mùa lúa chín, cả sườn đồi vàng óng.', qa: [
    ['Ruộng bậc thang ở vùng nào?', 'Vùng núi phía bắc', ['Vùng biển', 'Giữa thành phố']],
    ['Ruộng nối nhau từ đâu đến đâu?', 'Từ chân đồi lên đỉnh đồi', ['Từ sông ra biển', 'Từ nhà ra ngõ']],
    ['Mùa lúa chín, sườn đồi thế nào?', 'Vàng óng', ['Xanh mướt', 'Trắng xóa']],
  ] },
  { theme: 8, title: 'Biển Việt Nam', text: 'Nước ta có bờ biển dài và đẹp. Mùa hè, nhiều gia đình đi tắm biển. Bé thích nhặt vỏ ốc trên bãi cát và ngắm sóng vỗ vào bờ.', qa: [
    ['Bờ biển nước ta thế nào?', 'Dài và đẹp', ['Ngắn và nhỏ', 'Rất lạnh']],
    ['Mùa hè, nhiều gia đình làm gì?', 'Đi tắm biển', ['Đi trồng lúa', 'Đi học bơi ở hồ']],
    ['Bé thích nhặt gì trên bãi cát?', 'Vỏ ốc', ['Lá cây', 'Hòn đá to']],
  ] },
];

/** Câu có chỗ trống để chọn từ ngữ: [câu có "…", từ đúng, từ sai, chủ đề] */
export const FILL_WORDS: [string, string, string[], ThemeNo][] = [
  ['Nam rất … khi được cô khen.', 'vui', ['buồn', 'giận'], 1],
  ['Hai bạn chơi với nhau rất …', 'thân', ['xa', 'buồn'], 1],
  ['Em … bạn mượn bút.', 'cho', ['bán', 'lấy'], 1],
  ['Mẹ … cho em trước khi đi ngủ.', 'kể chuyện', ['nấu cơm', 'đi chợ'], 2],
  ['Em giúp bà … nhà.', 'quét', ['vẽ', 'hát'], 2],
  ['Bố em … xe máy đi làm.', 'đi', ['ăn', 'ngủ'], 2],
  ['Cô giáo … bài cho cả lớp.', 'giảng', ['nấu', 'trồng'], 3],
  ['Giờ ra chơi, em … dây với bạn.', 'nhảy', ['đọc', 'viết'], 3],
  ['Sân trường có nhiều cây … mát.', 'xanh', ['đỏ', 'tím'], 3],
  ['Trước khi ăn, em phải … tay.', 'rửa', ['vẽ', 'đánh'], 4],
  ['Đèn … thì phải dừng lại.', 'đỏ', ['xanh', 'tím'], 4],
  ['Khi gặp người lớn, em … hỏi.', 'chào', ['cãi', 'chạy'], 4],
  ['Kiến … mồi về tổ.', 'tha', ['hát', 'bơi'], 5],
  ['Chú bé hay nói …', 'dối', ['hay', 'nhỏ'], 5],
  ['Rễ cây … sâu dưới đất.', 'mọc', ['bay', 'chạy'], 5],
  ['Sau cơn mưa, trên trời có cầu …', 'vồng', ['thang', 'trượt'], 6],
  ['Sư tử là chúa tể rừng …', 'xanh', ['đỏ', 'trắng'], 6],
  ['Chim hải âu bay trên …', 'biển', ['ao', 'giếng'], 6],
  ['Ông mặt trời chiếu nắng … khắp vườn.', 'vàng', ['đen', 'tím'], 7],
  ['Hoa phượng nở đỏ … sân trường.', 'rực', ['nhạt', 'mờ'], 7],
  ['Đàn cò trắng bay về … đồng.', 'cánh', ['bàn', 'quả'], 7],
  ['Chú lính cứu hỏa … lửa rất nhanh.', 'dập', ['thổi', 'nấu'], 8],
  ['Lớn lên, em muốn làm … sĩ.', 'bác', ['ông', 'cô'], 8],
  ['Ruộng bậc thang ở vùng … phía bắc.', 'núi', ['biển', 'sông'], 8],
];

/** Từ chỉ sự vật / hoạt động / đặc điểm (để chọn từ đúng nhóm) */
export const WORD_KINDS: Record<'su_vat' | 'hoat_dong' | 'dac_diem', string[]> = {
  su_vat: ['bàn', 'ghế', 'quyển vở', 'cái cặp', 'con mèo', 'con chó', 'cây bàng', 'bông hoa', 'quả cam', 'ngôi nhà', 'cái trống', 'cánh đồng', 'dòng sông', 'ông mặt trời'],
  hoat_dong: ['chạy', 'nhảy', 'đọc', 'viết', 'hát', 'quét nhà', 'tưới cây', 'nấu cơm', 'rửa tay', 'bơi', 'ngủ', 'đá bóng', 'vẽ tranh', 'học bài'],
  dac_diem: ['đỏ', 'xanh', 'vàng', 'cao', 'thấp', 'to', 'nhỏ', 'đẹp', 'chăm chỉ', 'ngoan', 'thơm', 'mát', 'nhanh', 'hiền'],
};
export const KIND_NAME = { su_vat: 'sự vật', hoat_dong: 'hoạt động', dac_diem: 'đặc điểm' } as const;

/** Câu kể (dấu chấm) và câu hỏi (dấu chấm hỏi) — viết KHÔNG có dấu cuối câu */
export const PUNCT_SENTENCES: [string, '.' | '?'][] = [
  ['Em tên là gì', '?'], ['Bạn học lớp mấy', '?'], ['Nhà bạn ở đâu', '?'], ['Ai đang hát thế', '?'], ['Hôm nay là thứ mấy', '?'],
  ['Con mèo đang ngủ ở đâu', '?'], ['Bạn có thích đọc truyện không', '?'], ['Vì sao lá cây màu xanh', '?'],
  ['Em là học sinh lớp 1', '.'], ['Mẹ em đi chợ', '.'], ['Sân trường có cây bàng to', '.'], ['Bé tưới cây cho ông', '.'],
  ['Đàn cò bay về tổ', '.'], ['Trời hôm nay rất đẹp', '.'], ['Em rửa tay trước khi ăn', '.'], ['Bố đọc báo bên cửa sổ', '.'],
];

/** Câu để sắp xếp từ (mỗi phần cách nhau bằng " | ") */
export const ORDER_SENTENCES: [string, ThemeNo][] = [
  ['Em | là | học sinh | lớp 1', 1], ['Hà | và | Minh | là | bạn thân', 1], ['Bạn | cho | em | mượn | bút', 1],
  ['Mẹ | nấu | cơm | cho | cả nhà', 2], ['Em | quạt | cho | bà | ngủ', 2], ['Bố | đưa | em | đi học', 2],
  ['Cô giáo | dạy | em | đọc | viết', 3], ['Sân trường | có | cây | bàng | to', 3], ['Chúng em | chơi | nhảy dây', 3],
  ['Em | rửa tay | trước khi | ăn', 4], ['Đèn đỏ | thì | dừng | lại', 4], ['Em | chào | ông bà | khi | đi học', 4],
  ['Kiến | chăm chỉ | tha | mồi', 5], ['Chú bé | không | nên | nói dối', 5], ['Rễ | giúp | cây | đứng | vững', 5],
  ['Cầu vồng | có | bảy | màu', 6], ['Hải âu | bay | trên | biển', 6], ['Cành liễu | rất | dẻo', 6],
  ['Ông mặt trời | chiếu | nắng | vàng', 7], ['Hoa phượng | nở | đỏ rực', 7], ['Đàn cò | bay | về | tổ', 7],
  ['Chú lính | dập | tắt | đám cháy', 8], ['Ruộng | bậc thang | vàng óng', 8], ['Biển | nước ta | rất | đẹp', 8],
];

/** Chính tả âm đầu dễ lẫn: [từ có "_", chữ đúng, chữ còn lại] */
export const SPELL_PAIRS: [string, string, string][] = [
  ['_e đạp', 'x', 's'], ['quyển _ách', 's', 'x'], ['_ôi gấc', 'x', 's'], ['ngôi _ao', 's', 'x'], ['màu _anh', 'x', 's'], ['dòng _ông', 's', 'x'],
  ['con _im', 'ch', 'tr'], ['ông _ăng', 'tr', 'ch'], ['cái _ống', 'tr', 'ch'], ['quả _uối', 'ch', 'tr'], ['con _âu', 'tr', 'ch'], ['đi _ợ', 'ch', 'tr'],
  ['_á cây', 'l', 'n'], ['cái _ón', 'n', 'l'], ['ngọn _ửa', 'l', 'n'], ['trời _ắng', 'n', 'l'], ['cây _úa', 'l', 'n'], ['nồi _ước', 'n', 'l'],
];
