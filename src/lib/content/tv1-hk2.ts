// TIẾNG VIỆT 1 — HỌC KỲ 2 — bám 8 chủ đề đọc của sách Tiếng Việt 1 tập hai (Kết nối tri thức với cuộc sống)
// và phần Ôn tập cuối năm. Câu hỏi, đoạn văn do EduChain Kids tự viết theo chủ đề — không chép bài đọc của sách.
// Học kì 2 đã học đủ âm, vần của tập một: kiểm tra tự động mọi tiếng trong đáp án, lựa chọn, câu đọc.

import { mc, mt, ord, sc, tf, type ContentLesson } from './types';
import { TV2_THEMES, type ThemeNo } from '../practice/viet-hk2';

const BOOK = 'Kết nối tri thức';
const P4 = { code: 'KNTT.V1.HK2A', title: 'Học kì 2 · Chủ đề 1–4' };
const P5 = { code: 'KNTT.V1.HK2B', title: 'Học kì 2 · Chủ đề 5–8 và ôn tập cuối năm' };
const ALL = { kind: 'viet', lessonNo: 90 } as const;

const C = (no: ThemeNo, questions: ContentLesson['questions']): ContentLesson => ({
  id: `tv1-kntt-c${String(no).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 1,
  semester: 2,
  book: BOOK,
  ref: `Tập hai · Chủ đề ${no}`,
  unit: no <= 4 ? P4 : P5,
  topicCode: 'V1.DOC',
  title: `Chủ đề ${no}. ${TV2_THEMES[no].title}`,
  description: `Bài đọc trong sách: ${TV2_THEMES[no].readings}.`,
  scope: ALL,
  questions,
});

export const TV1_HK2: ContentLesson[] = [
  C(1, [
    sc('Từ nào chỉ hoạt động?', ['cặp sách', 'chạy', 'đỏ'], 'chạy', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: '"Chạy" là việc làm, chỉ hoạt động.' }),
    sc('Chọn dấu câu đặt cuối câu: "Bạn tên là gì …"', ['.', '?'], '?', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 1, e: 'Câu dùng để hỏi: đặt dấu chấm hỏi.' }),
    sc('Khi được bạn cho mượn đồ, em nói:', ['Cảm ơn bạn!', 'Xin lỗi bạn!', 'Tạm biệt!'], 'Cảm ơn bạn!', { o: 'V1.NN.01', f: 'TV.DOCHIEU', l: 2, e: 'Được giúp đỡ thì nói lời cảm ơn.' }),
    sc('Điền ch hay tr: "bạn …ơi" (bạn cùng chơi)', ['ch', 'tr'], 'ch', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết là "bạn chơi".' }),
    mc('Chọn tất cả các từ chỉ tình cảm bạn bè.', ['thân thiết', 'giúp đỡ', 'cãi nhau', 'chia sẻ'], ['thân thiết', 'giúp đỡ', 'chia sẻ'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Bạn tốt thì thân thiết, giúp đỡ, chia sẻ với nhau.',
      s: 'Đọc từng từ, nghĩ xem bạn bè tốt với nhau có làm vậy không: thân thiết, giúp đỡ, chia sẻ là việc tốt; cãi nhau thì không.',
    }),
    tf('Đọc câu: "Hà và Minh cùng chơi nhảy dây." Hai bạn đang đá cầu. Đúng hay sai?', 'Sai', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Câu nói hai bạn chơi nhảy dây, không phải đá cầu.',
      s: 'Đọc kĩ câu: hai bạn "chơi nhảy dây". Câu nói "đang đá cầu" không đúng với câu đã đọc.',
    }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Bạn bè', 'cần', 'giúp đỡ', 'nhau'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Bạn bè cần giúp đỡ nhau.',
      s: 'Từ viết hoa "Bạn bè" đứng đầu câu. Ghép tiếp cho có nghĩa: Bạn bè cần giúp đỡ nhau.',
    }),
    mt('Ghép lời nói với tình huống phù hợp.', [['Bạn tặng quà sinh nhật', 'Cảm ơn bạn!'], ['Em làm rơi bút của bạn', 'Xin lỗi bạn!'], ['Gặp bạn buổi sáng', 'Chào bạn!']], {
      o: 'V1.NN.01', f: 'TV.NOITU', l: 5, e: 'Được tặng quà: cảm ơn; làm phiền bạn: xin lỗi; gặp bạn: chào.',
      s: 'Nghĩ xem trong mỗi tình huống em cần nói lời gì: được giúp, được tặng thì cảm ơn; làm phiền, làm sai thì xin lỗi; gặp nhau thì chào.',
    }),
  ]),
  C(2, [
    sc('Từ nào chỉ người trong gia đình?', ['ông bà', 'cô giáo', 'bác sĩ'], 'ông bà', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: 'Ông bà là người trong gia đình.' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Em … bát sau bữa cơm."', ['rửa', 'vẽ', 'hát'], 'rửa', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: 'Câu đúng: Em rửa bát sau bữa cơm.' }),
    sc('Điền s hay x: "…au bữa cơm, cả nhà quây quần."', ['s', 'x'], 's', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết là "sau".' }),
    mc('Chọn tất cả các việc em có thể làm để giúp bố mẹ.', ['quét nhà', 'tưới cây', 'xếp bát đũa', 'vẽ lên tường'], ['quét nhà', 'tưới cây', 'xếp bát đũa'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Quét nhà, tưới cây, xếp bát đũa là việc nhà vừa sức em.',
      s: 'Việc giúp bố mẹ là việc có ích trong nhà: quét nhà, tưới cây, xếp bát đũa. Vẽ lên tường làm bẩn nhà, không phải giúp đỡ.',
    }),
    tf('Đọc câu: "Bé Lan quạt cho bà ngủ." Bà đang ngủ. Đúng hay sai?', 'Đúng', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Lan quạt cho bà ngủ: bà đang ngủ.', s: 'Câu "Bé Lan quạt cho bà ngủ" cho biết bà đang ngủ và Lan quạt cho bà. Câu đúng.',
    }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Cả nhà', 'em', 'ăn cơm', 'cùng nhau'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Cả nhà em ăn cơm cùng nhau.', s: '"Cả nhà" viết hoa đứng đầu. Câu đúng: Cả nhà em ăn cơm cùng nhau.',
    }),
    mc('Câu "bố em tên là nguyễn văn an" cần viết hoa những chữ nào? Chọn tất cả.', ['bố', 'em', 'nguyễn', 'văn', 'an'], ['bố', 'nguyễn', 'văn', 'an'], {
      o: 'V1.VIET.03', f: 'TV.CHINHTA', l: 4, e: 'Viết hoa chữ đầu câu (Bố) và mỗi tiếng của tên người (Nguyễn Văn An).',
      s: 'Chữ đầu câu phải viết hoa: Bố. Tên người gồm họ, tên đệm, tên; mỗi tiếng đều viết hoa: Nguyễn Văn An. Câu đúng: Bố em tên là Nguyễn Văn An.',
    }),
    mt('Ghép người trong gia đình với việc người đó làm.', [['Mẹ', 'nấu cơm'], ['Bố', 'sửa xe đạp'], ['Em', 'quét nhà']], {
      o: 'V1.DOC.05', f: 'TV.NOITU', l: 5, e: 'Mẹ nấu cơm, bố sửa xe đạp, em quét nhà.', s: 'Đọc từng việc và ghép với người làm việc đó: mẹ nấu cơm, bố sửa xe đạp, em quét nhà.',
    }),
  ]),
  C(3, [
    sc('Từ nào chỉ đồ dùng học tập?', ['bút chì', 'cái nồi', 'quả bóng'], 'bút chì', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: 'Bút chì là đồ dùng học tập.' }),
    sc('Ai dạy em đọc, viết ở trường?', ['Cô giáo', 'Bác sĩ', 'Chú bộ đội'], 'Cô giáo', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Cô giáo dạy em ở trường.' }),
    sc('Điền tr hay ch: "…ống trường"', ['ch', 'tr'], 'tr', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết là "trống trường".' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Giờ ra chơi, sân trường rất …"', ['vui', 'buồn', 'tối'], 'vui', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Giờ ra chơi, sân trường rất vui.' }),
    mc('Chọn tất cả các trò chơi bổ ích giờ ra chơi.', ['nhảy dây', 'đá cầu', 'đọc truyện', 'trèo cây cao'], ['nhảy dây', 'đá cầu', 'đọc truyện'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Trèo cây cao dễ ngã, không an toàn.',
      s: 'Trò chơi bổ ích phải vui và an toàn: nhảy dây, đá cầu, đọc truyện. Trèo cây cao rất nguy hiểm.',
    }),
    tf('Tiếng trống trường báo giờ vào lớp và giờ ra về. Đúng hay sai?', 'Đúng', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Trống trường báo giờ vào lớp, ra chơi, ra về.', s: 'Ở trường, tiếng trống báo cho học sinh biết giờ vào lớp, giờ ra chơi và giờ ra về. Câu đúng.',
    }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Em', 'yêu', 'mái trường', 'của em'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Em yêu mái trường của em.', s: 'Từ viết hoa "Em" đứng đầu: Em yêu mái trường của em.',
    }),
    mt('Ghép đồ vật với nơi để đồ vật ở trường.', [['Cái trống', 'góc sân trường'], ['Quyển truyện', 'thư viện'], ['Cái bảng', 'lớp học']], {
      o: 'V1.DOC.05', f: 'TV.NOITU', l: 5, e: 'Trống ở góc sân, truyện ở thư viện, bảng ở lớp học.', s: 'Nghĩ xem ở trường em thấy mỗi đồ vật ở đâu: trống ở sân trường, truyện ở thư viện, bảng trong lớp học.',
    }),
  ]),
  C(4, [
    sc('Trước khi ăn, em cần làm gì?', ['Rửa tay', 'Đi ngủ', 'Chạy nhảy'], 'Rửa tay', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Rửa tay sạch trước khi ăn.' }),
    sc('Đèn giao thông màu gì thì phải dừng lại?', ['Đèn đỏ', 'Đèn xanh'], 'Đèn đỏ', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Đèn đỏ: dừng lại.' }),
    sc('Khi gặp người lớn, em nên:', ['Chào hỏi lễ phép', 'Quay đi', 'Chạy thật nhanh'], 'Chào hỏi lễ phép', { o: 'V1.NN.01', f: 'TV.DOCHIEU', l: 2, e: 'Gặp người lớn, em chào hỏi lễ phép.' }),
    sc('Điền l hay n: "… ước sạch"', ['l', 'n'], 'n', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết là "nước sạch".' }),
    tf('Ở nhà một mình, có người lạ gõ cửa thì em mở cửa ngay. Đúng hay sai?', 'Sai', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Không mở cửa cho người lạ; gọi điện cho bố mẹ.',
      s: 'Khi ở nhà một mình, em không mở cửa cho người lạ. Em gọi điện cho bố mẹ hoặc người lớn tin cậy. Câu đã cho là sai.',
    }),
    mc('Nếu không may bị lạc, em nên làm gì?', ['Đứng yên ở chỗ dễ thấy', 'Nhờ chú công an giúp', 'Đi theo người lạ', 'Nhớ số điện thoại của bố mẹ'], ['Đứng yên ở chỗ dễ thấy', 'Nhờ chú công an giúp', 'Nhớ số điện thoại của bố mẹ'], {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 4, e: 'Không đi theo người lạ.',
      s: 'Bị lạc: đứng yên ở nơi dễ thấy để bố mẹ tìm, nhờ chú công an hoặc người bán hàng giúp, đọc số điện thoại của bố mẹ. Không đi theo người lạ.',
    }),
    ord('Sắp xếp các việc rửa tay theo đúng thứ tự.', ['Làm ướt tay', 'Xoa xà phòng', 'Rửa sạch bằng nước', 'Lau khô tay'], {
      o: 'V1.DOC.06', f: 'TV.XEPCAU', l: 4, e: 'Làm ướt tay → xoa xà phòng → rửa sạch → lau khô.', s: 'Rửa tay theo thứ tự: làm ướt tay, xoa xà phòng, rửa sạch bằng nước, lau khô tay bằng khăn sạch.',
    }),
    mt('Ghép màu đèn giao thông với việc cần làm.', [['Đèn đỏ', 'Dừng lại'], ['Đèn vàng', 'Đi chậm lại'], ['Đèn xanh', 'Được đi']], {
      o: 'V1.DOC.06', f: 'TV.NOITU', l: 5, e: 'Đỏ dừng, vàng chậm lại, xanh đi.', s: 'Nhớ quy tắc đèn giao thông: đèn đỏ dừng lại, đèn vàng đi chậm lại, đèn xanh được đi.',
    }),
  ]),
  C(5, [
    sc('Con vật nào chăm chỉ tha mồi về tổ?', ['Con kiến', 'Con ve'], 'Con kiến', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Kiến chăm chỉ tha mồi.' }),
    sc('Từ nào chỉ tính nết tốt?', ['chăm chỉ', 'lười biếng', 'nói dối'], 'chăm chỉ', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: 'Chăm chỉ là tính nết tốt.' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Chú bé chăn cừu hay nói …"', ['dối', 'hay', 'to'], 'dối', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Chú bé hay nói dối.' }),
    sc('Điền s hay x: "…ói đến!"', ['s', 'x'], 's', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết là "sói".' }),
    tf('Nói dối nhiều lần thì mọi người sẽ không tin mình nữa. Đúng hay sai?', 'Đúng', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Đây là bài học từ câu chuyện chú bé chăn cừu.', s: 'Khi nói dối nhiều lần, đến lúc nói thật mọi người cũng không tin. Câu đúng.',
    }),
    mc('Chọn tất cả các việc làm tốt.', ['nói thật', 'giúp bạn', 'nói dối', 'chăm học'], ['nói thật', 'giúp bạn', 'chăm học'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Nói dối không phải việc tốt.', s: 'Việc tốt: nói thật, giúp bạn, chăm học. Nói dối là việc không nên làm.',
    }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Em', 'luôn', 'nói', 'lời', 'thật'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Em luôn nói lời thật.', s: 'Từ viết hoa "Em" đứng đầu câu: Em luôn nói lời thật.',
    }),
    mt('Ghép con vật với điều nó dạy em.', [['Con kiến', 'chăm chỉ làm việc'], ['Chú bé chăn cừu', 'không được nói dối'], ['Rễ cây', 'âm thầm giúp cây đứng vững']], {
      o: 'V1.DOC.04', f: 'TV.NOITU', l: 5, e: 'Kiến: chăm chỉ; chú bé: không nói dối; rễ: âm thầm giúp đỡ.', s: 'Nhớ lại các câu chuyện: kiến chăm chỉ, chú bé chăn cừu nói dối nên không ai tin, rễ cây âm thầm giữ cho cây đứng vững.',
    }),
  ]),
  C(6, [
    sc('Cầu vồng có mấy màu?', ['Năm màu', 'Bảy màu', 'Ba màu'], 'Bảy màu', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Cầu vồng có bảy màu.' }),
    sc('Con vật nào được gọi là chúa tể rừng xanh?', ['Sư tử', 'Con thỏ', 'Con gà'], 'Sư tử', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Sư tử được gọi là chúa tể rừng xanh.' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Cành liễu rất …"', ['dẻo', 'cứng', 'nặng'], 'dẻo', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Cành liễu rất dẻo.' }),
    sc('Từ nào chỉ màu sắc?', ['tím', 'bay', 'chim'], 'tím', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Tím là màu sắc.' }),
    mc('Chọn tất cả các con vật sống ở rừng.', ['sư tử', 'voi', 'hổ', 'cá vàng'], ['sư tử', 'voi', 'hổ'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Cá vàng sống trong bể nước.', s: 'Sư tử, voi, hổ sống trong rừng. Cá vàng sống ở bể cá hoặc ao, không sống trong rừng.',
    }),
    tf('Hải âu là loài chim sống ở biển. Đúng hay sai?', 'Đúng', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Hải âu là chim biển.', s: 'Hải âu bay trên biển, kiếm ăn trên biển nên gọi là chim của biển cả. Câu đúng.' }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Sau', 'cơn mưa', 'cầu vồng', 'hiện ra'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Sau cơn mưa cầu vồng hiện ra.', s: 'Từ viết hoa "Sau" đứng đầu: Sau cơn mưa cầu vồng hiện ra.',
    }),
    mt('Ghép con vật với tài năng của nó.', [['Chim sơn ca', 'hót hay'], ['Con thỏ', 'chạy nhanh'], ['Con khỉ', 'leo trèo giỏi']], {
      o: 'V1.DOC.05', f: 'TV.NOITU', l: 5, e: 'Sơn ca hót hay, thỏ chạy nhanh, khỉ leo trèo giỏi.', s: 'Nghĩ về từng con vật: sơn ca có tiếng hót hay, thỏ chạy rất nhanh, khỉ leo trèo giỏi.',
    }),
  ]),
  C(7, [
    sc('Buổi sáng, ai chiếu nắng vàng khắp nơi?', ['Ông mặt trời', 'Chị mây', 'Bác gió'], 'Ông mặt trời', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Mặt trời chiếu nắng.' }),
    sc('Hoa phượng thường nở vào mùa nào?', ['Mùa hè', 'Mùa đông'], 'Mùa hè', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Hoa phượng nở vào mùa hè.' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Chim hót líu lo trên …"', ['cành', 'bàn', 'đường'], 'cành', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Chim hót trên cành cây.' }),
    sc('Điền c hay k: "đàn …ò trắng"', ['c', 'k'], 'c', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước o viết c: "cò".' }),
    mc('Chọn tất cả các từ chỉ cảnh vật buổi sáng.', ['gà gáy', 'nắng sớm', 'chim hót', 'trăng sáng'], ['gà gáy', 'nắng sớm', 'chim hót'], {
      o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Trăng sáng là cảnh buổi tối.', s: 'Buổi sáng có gà gáy, nắng sớm, chim hót. Trăng sáng thường thấy vào buổi tối.',
    }),
    tf('Ve kêu râm ran báo hiệu mùa hè đến. Đúng hay sai?', 'Đúng', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Tiếng ve gắn với mùa hè.', s: 'Mùa hè, ve kêu râm ran trên cành cây, hoa phượng nở. Câu đúng.' }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Đàn cò', 'trắng', 'bay', 'về', 'tổ'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Đàn cò trắng bay về tổ.', s: '"Đàn cò" viết hoa đứng đầu: Đàn cò trắng bay về tổ.',
    }),
    mt('Ghép sự vật với đặc điểm của nó.', [['Hoa phượng', 'đỏ rực'], ['Đàn cò', 'trắng muốt'], ['Nắng sớm', 'vàng tươi']], {
      o: 'V1.VIET.04', f: 'TV.NOITU', l: 5, e: 'Phượng đỏ rực, cò trắng muốt, nắng vàng tươi.', s: 'Nghĩ về màu của từng sự vật: hoa phượng màu đỏ, cò màu trắng, nắng sớm màu vàng.',
    }),
  ]),
  C(8, [
    sc('Ai dập lửa khi có đám cháy?', ['Lính cứu hỏa', 'Bác nông dân', 'Cô giáo'], 'Lính cứu hỏa', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Lính cứu hỏa dập lửa, cứu người.' }),
    sc('Ai chữa bệnh cho mọi người?', ['Bác sĩ', 'Chú thợ xây', 'Bác đưa thư'], 'Bác sĩ', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 1, e: 'Bác sĩ chữa bệnh.' }),
    tf('Tên nước ta viết là "Việt Nam", viết hoa cả hai tiếng. Đúng hay sai?', 'Đúng', { o: 'V1.VIET.03', f: 'TV.CHINHTA', l: 2, e: 'Tên riêng viết hoa chữ cái đầu mỗi tiếng: Việt Nam.' }),
    sc('Chọn từ ngữ điền vào chỗ trống: "Bác nông dân … lúa trên đồng."', ['cấy', 'xây', 'dạy'], 'cấy', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Bác nông dân cấy lúa.' }),
    mt('Ghép nghề với công việc.', [['Thợ xây', 'xây nhà'], ['Bác sĩ', 'chữa bệnh'], ['Cô giáo', 'dạy học']], {
      o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, e: 'Thợ xây xây nhà, bác sĩ chữa bệnh, cô giáo dạy học.', s: 'Đọc tên nghề rồi nghĩ xem người làm nghề đó làm việc gì.',
    }),
    mc('Câu "em đi du lịch ở đà nẵng" cần viết hoa những chữ nào? Chọn tất cả.', ['em', 'đi', 'du', 'lịch', 'đà', 'nẵng'], ['em', 'đà', 'nẵng'], {
      o: 'V1.VIET.03', f: 'TV.CHINHTA', l: 4, e: 'Viết hoa chữ đầu câu (Em) và tên riêng (Đà Nẵng).', s: 'Chữ đầu câu viết hoa: Em. Tên thành phố là tên riêng, viết hoa mỗi tiếng: Đà Nẵng. Câu đúng: Em đi du lịch ở Đà Nẵng.',
    }),
    ord('Sắp xếp các từ ngữ thành câu đúng.', ['Em', 'biết ơn', 'các chú', 'lính cứu hỏa'], {
      o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Em biết ơn các chú lính cứu hỏa.', s: 'Từ viết hoa "Em" đứng đầu: Em biết ơn các chú lính cứu hỏa.',
    }),
    tf('Ruộng bậc thang thường có ở vùng biển. Đúng hay sai?', 'Sai', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 5, e: 'Ruộng bậc thang có ở vùng núi.', s: 'Ruộng bậc thang được làm trên sườn đồi, sườn núi, như ở Sa Pa. Vùng biển không có ruộng bậc thang. Câu sai.',
    }),
  ]),
  {
    id: 'tv1-kntt-c09',
    subject: 'tieng-viet',
    grade: 1,
    semester: 2,
    book: BOOK,
    ref: 'Tập hai · Ôn tập cuối năm',
    unit: P5,
    topicCode: 'V1.DOC',
    title: 'Ôn tập cuối năm',
    description: 'Ôn đọc hiểu, từ ngữ, chính tả, dấu câu của cả 8 chủ đề.',
    scope: ALL,
    questions: [
      sc('Chọn dấu câu đặt cuối câu: "Hôm nay em được cô khen …"', ['.', '?'], '.', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 1, e: 'Câu kể: đặt dấu chấm.' }),
      sc('Từ nào chỉ đặc điểm?', ['ngoan', 'học', 'bàn'], 'ngoan', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: '"Ngoan" chỉ tính nết, là từ chỉ đặc điểm.' }),
      sc('Điền ng hay ngh: "…e lời cô giáo"', ['ng', 'ngh'], 'ngh', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước e viết ngh: "nghe".' }),
      sc('Điền g hay gh: "…ế nhựa"', ['g', 'gh'], 'gh', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước ê viết gh: "ghế".' }),
      mc('Chọn tất cả các câu hỏi (cần dấu chấm hỏi).', ['Bạn đi đâu đấy', 'Em thích đọc truyện', 'Ai đang hát thế', 'Mẹ em là bác sĩ'], ['Bạn đi đâu đấy', 'Ai đang hát thế'], {
        o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 3, e: 'Câu có "đâu", "ai" dùng để hỏi.', s: 'Câu dùng để hỏi thường có các từ ai, gì, đâu, mấy, không. "Bạn đi đâu đấy" và "Ai đang hát thế" là câu hỏi.',
      }),
      tf('Tên riêng "Lê Văn Nam" viết đúng chính tả. Đúng hay sai?', 'Đúng', { o: 'V1.VIET.03', f: 'TV.CHINHTA', l: 3, e: 'Mỗi tiếng của tên người đều viết hoa.', s: 'Lê, Văn, Nam đều viết hoa chữ cái đầu. Câu đúng.' }),
      ord('Sắp xếp các từ ngữ thành câu đúng.', ['Em', 'yêu', 'quê hương', 'Việt Nam'], {
        o: 'V1.DOC.02', f: 'TV.XEPCAU', l: 4, e: 'Em yêu quê hương Việt Nam.', s: 'Từ viết hoa "Em" đứng đầu câu: Em yêu quê hương Việt Nam.',
      }),
      mt('Ghép từ với nhóm của nó.', [['quét nhà', 'hoạt động'], ['quả cam', 'sự vật'], ['đỏ tươi', 'đặc điểm']], {
        o: 'V1.VIET.04', f: 'TV.NOITU', l: 5, e: 'Quét nhà: hoạt động; quả cam: sự vật; đỏ tươi: đặc điểm.', s: 'Việc làm là hoạt động, đồ vật/con vật/cây cối là sự vật, màu sắc/tính nết là đặc điểm.',
      }),
    ],
  },
];
