// TIẾNG VIỆT 1 — HỌC KỲ 1 — bám trình tự sách Tiếng Việt 1 (Kết nối tri thức với cuộc sống), tập 1.
// Mỗi bài luyện tập ứng với 1 tuần học (4 bài mới + 1 bài ôn tập của sách).
// QUY TẮC: các tiếng trong đáp án, lựa chọn và câu đọc (trong ngoặc ' ') chỉ dùng âm, vần, dấu thanh
// ĐÃ HỌC đến hết tuần đó. scripts/check-content.ts kiểm tra tự động quy tắc này.

import { fb, mc, mt, ord, sc, tf, type ContentLesson } from './types';

const BOOK = 'Kết nối tri thức';
const P1 = { code: 'KNTT.V1.AMCHU', title: 'Phần 1. Âm và chữ (tuần 1–6)' };
const P2 = { code: 'KNTT.V1.VAN', title: 'Phần 2. Vần (tuần 7–16)' };
const P3 = { code: 'KNTT.V1.ONTAP', title: 'Ôn tập cuối học kì 1' };

const W = (
  week: number,
  from: number,
  to: number,
  unit: { code: string; title: string },
  learned: string,
  description: string,
  questions: ContentLesson['questions'],
): ContentLesson => ({
  id: `tv1-kntt-t${String(week).padStart(2, '0')}`,
  subject: 'tieng-viet',
  grade: 1,
  semester: 1,
  book: BOOK,
  ref: `Tuần ${week} (Bài ${from}–${to})`,
  unit,
  topicCode: week <= 6 ? 'V1.AM' : 'V1.DOC',
  title: `Tuần ${week}: ${learned}`,
  description,
  scope: { kind: 'viet', lessonNo: to },
  questions,
});

export const TV1_HK1: ContentLesson[] = [
  // ======================= PHẦN 1: ÂM VÀ CHỮ =======================
  W(1, 1, 5, P1, 'a, b, c, e, ê', 'Bài 1–5: A a, B b (dấu huyền), C c (dấu sắc), E e, Ê ê.', [
    sc("Tiếng 'bà' bắt đầu bằng chữ nào?", ['b', 'c', 'a'], 'b', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "Tiếng 'bà' gồm b và a, dấu huyền. Chữ đầu là b." }),
    sc('Tiếng nào có dấu huyền?', ['bá', 'bà', 'ba'], 'bà', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "Dấu huyền là nét xiên từ trái xuống phải ( ` ), như trong 'bà'." }),
    sc('Tiếng nào có dấu sắc?', ['cà', 'ca', 'cá'], 'cá', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "Dấu sắc là nét xiên từ phải xuống trái ( ´ ), như trong 'cá'." }),
    mc('Chọn TẤT CẢ các tiếng bắt đầu bằng chữ b', ['ba', 'cà', 'bé', 'cá', 'bê'], ['ba', 'bé', 'bê'], { o: 'V1.AM.01', f: 'TV.AMCHU', l: 2, e: "'ba', 'bé', 'bê' bắt đầu bằng b; 'cà', 'cá' bắt đầu bằng c." }),
    fb('Ghép âm b với âm a, không có dấu thanh. Được tiếng gì?', ['ba'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'b – a – ba.', s: 'Đọc âm đầu "bờ", rồi đọc âm "a", ghép nhanh lại: bờ – a – ba.' }),
    sc("Tiếng 'bê' có âm nào đứng sau âm b?", ['e', 'ê', 'a'], 'ê', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 2, e: "'bê' gồm b và ê. Chữ ê có dấu mũ." }),
    ord("Xếp các chữ để được tiếng 'cá'", ['c', 'á'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'Âm đầu c đứng trước, rồi đến á.' }),
    mt('Ghép tiếng với hình đúng', [['cá', '🐟'], ['bà', '👵'], ['bé', '👶']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'cá – con cá; bà – bà; bé – em bé.' }),
    sc('Con gì sống dưới nước, bơi bằng vây? Chọn tiếng đúng.', ['cá', 'bà', 'bê'], 'cá', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Đọc từng tiếng: cá, bà, bê. Con sống dưới nước, có vây để bơi là con cá.', e: 'Con cá sống dưới nước.' }),
    tf("Tiếng 'cà' có dấu huyền. Đúng hay sai?", 'Đúng', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "'cà' có dấu huyền ở trên chữ a." }),
  ]),

  W(2, 6, 10, P1, 'o, ô, ơ, d, đ', 'Bài 6–10: O o (dấu hỏi), Ô ô (dấu nặng), D d, Đ đ, Ơ ơ (dấu ngã).', [
    sc('Tiếng nào có dấu hỏi?', ['cỏ', 'cò', 'có'], 'cỏ', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "Dấu hỏi trông như cái móc nhỏ ( ̉ ), như trong 'cỏ'." }),
    sc('Tiếng nào có dấu nặng?', ['bộ', 'bố', 'bổ'], 'bộ', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "Dấu nặng là dấu chấm đặt DƯỚI chữ, như trong 'bộ'." }),
    sc('Tiếng nào có dấu ngã?', ['đỗ', 'đổ', 'đồ'], 'đỗ', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "Dấu ngã là nét lượn sóng ( ~ ), như trong 'đỗ'." }),
    sc("Tiếng 'đỏ' bắt đầu bằng chữ nào?", ['d', 'đ', 'b'], 'đ', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "Chữ đ có thêm nét gạch ngang, khác chữ d." }),
    mc('Chọn TẤT CẢ các tiếng có âm ô', ['cô', 'co', 'bố', 'bơ', 'đồ'], ['cô', 'bố', 'đồ'], { o: 'V1.AM.01', f: 'TV.AMCHU', l: 2, e: "'cô', 'bố', 'đồ' có ô (chữ o đội mũ). 'co' là o, 'bơ' là ơ." }),
    mt('Ghép tiếng với hình đúng', [['bò', '🐄'], ['dê', '🐐'], ['cờ', '🚩']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'bò – con bò; dê – con dê; cờ – lá cờ.' }),
    fb('Ghép âm d với âm ê. Được tiếng gì?', ['dê'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'd – ê – dê (con dê).' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'có', 'bơ'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé có bơ.' }),
    sc("Đọc câu: 'Bò có cỏ.' Bò có gì?", ['cỏ', 'cò', 'cờ'], 'cỏ', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: "Câu nói bò có cỏ.", s: "Đọc chậm từng tiếng: Bò – có – cỏ. Tiếng đứng sau 'có' là 'cỏ' (dấu hỏi). Bò có cỏ." }),
    tf("Tiếng 'dễ' có dấu ngã. Đúng hay sai?", 'Đúng', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: "'dễ' có dấu ngã trên chữ ê." }),
  ]),

  W(3, 11, 15, P1, 'i, k, h, l, u, ư, ch, kh', 'Bài 11–15: I i, K k, H h, L l, U u, Ư ư, Ch ch, Kh kh.', [
    sc("Tiếng 'khế' bắt đầu bằng âm nào?", ['kh', 'ch', 'k'], 'kh', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "'khế' bắt đầu bằng kh (hai chữ k và h)." }),
    sc('Điền c hay k: thước ...ẻ', ['c', 'k'], 'k', {
      o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Đứng trước e, ê, i ta viết k: thước kẻ.',
      s: 'Ghi nhớ: âm "cờ" đứng trước e, ê, i thì viết bằng chữ k (kẻ, kê, kì). Đứng trước các âm khác thì viết c (cá, cô, cũ).',
    }),
    mc('Chọn TẤT CẢ các tiếng viết ĐÚNG chính tả', ['kế', 'cá', 'kì', 'cê', 'kô'], ['kế', 'cá', 'kì'], {
      o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, s: 'Nhớ quy tắc: k đứng trước e, ê, i; c đứng trước các âm còn lại. \'kế\', \'kì\', \'cá\' viết đúng. \'cê\' phải viết là \'kê\', \'kô\' phải viết là \'cô\'.', e: "k đi với e, ê, i (kế, kì); c đi với a, o, ô... (cá). 'cê', 'kô' viết sai.",
    }),
    mt('Ghép tiếng với hình đúng', [['chó', '🐕'], ['khỉ', '🐒'], ['lá', '🍃']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'chó – con chó; khỉ – con khỉ; lá – chiếc lá.' }),
    fb('Ghép âm h với âm ô và dấu huyền. Được tiếng gì?', ['hồ'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'h – ô – hô – huyền – hồ.' }),
    sc('Tiếng nào có âm ư?', ['củ', 'cử', 'cô'], 'cử', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "Chữ ư là chữ u có thêm cái râu: 'cử'." }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'đi', 'đò'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé đi đò.' }),
    sc("Đọc câu: 'Chị Kha có lê.' Chị Kha có gì?", ['lê', 'khế', 'lá'], 'lê', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Đọc chậm: Chị – Kha – có – lê. Tiếng đứng sau \'có\' cho biết chị Kha có gì: lê.', e: 'Chị Kha có lê.' }),
    tf("Viết 'kì' là đúng chính tả (k đứng trước i). Đúng hay sai?", 'Đúng', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước i viết k: kì.' }),
    sc('Con gì hay leo trèo, thích ăn chuối? Chọn tiếng đúng.', ['khỉ', 'chó', 'dê'], 'khỉ', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Con khỉ leo trèo giỏi, thích ăn chuối.' }),
  ]),

  W(4, 16, 20, P1, 'm, n, g, gi, gh, nh, ng, ngh', 'Bài 16–20: M m, N n, G g, Gi gi, Gh gh, Nh nh, Ng ng, Ngh ngh.', [
    sc('Điền g hay gh: cái ...ế', ['g', 'gh'], 'gh', {
      o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước e, ê, i viết gh: cái ghế.',
      s: 'Âm "gờ" đứng trước e, ê, i thì viết gh (ghế, ghi, ghe). Đứng trước a, o, ô, ơ, u, ư thì viết g (gà, gỗ, gù).',
    }),
    sc('Điền ng hay ngh: bắp ...ô', ['ng', 'ngh'], 'ng', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước ô viết ng: ngô. Chỉ trước e, ê, i mới viết ngh.' }),
    mc('Chọn TẤT CẢ các tiếng viết ĐÚNG chính tả', ['ghế', 'gế', 'nghé', 'ngé', 'gà'], ['ghế', 'nghé', 'gà'], { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, s: 'Trước e, ê, i viết gh và ngh: \'ghế\', \'nghé\' đúng; \'gế\', \'ngé\' sai. Trước a viết g: \'gà\' đúng.', e: "Trước e, ê viết gh, ngh: ghế, nghé. Trước a viết g: gà." }),
    mt('Ghép tiếng với hình đúng', [['nhà', '🏠'], ['gà', '🐔'], ['mũ', '🧢']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'nhà – ngôi nhà; gà – con gà; mũ – cái mũ.' }),
    sc("Tiếng 'giỏ' bắt đầu bằng âm nào?", ['g', 'gi', 'gh'], 'gi', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "'giỏ' bắt đầu bằng gi." }),
    fb('Ghép âm nh với âm o và dấu hỏi. Được tiếng gì?', ['nhỏ'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'nh – o – no – hỏi – nhỏ.' }),
    ord('Sắp xếp các tiếng thành câu', ['Mẹ', 'đi', 'chợ'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Mẹ đi chợ.' }),
    sc("Đọc câu: 'Nhà bà có ghế gỗ.' Ghế làm bằng gì?", ['gỗ', 'đá', 'nhà'], 'gỗ', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Đọc chậm: Nhà – bà – có – ghế – gỗ. \'Ghế gỗ\' là ghế làm bằng gỗ.', e: 'Ghế gỗ là ghế làm bằng gỗ.' }),
    tf("Viết 'nghỉ' là đúng chính tả. Đúng hay sai?", 'Đúng', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước i viết ngh: nghỉ.' }),
    sc('Con của con trâu gọi là con gì?', ['nghé', 'bê', 'dê'], 'nghé', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Con non của mỗi con vật có tên riêng: trâu con là nghé, bò con là bê. Vì vậy chọn \'nghé\'.', e: 'Con trâu con gọi là con nghé; con bò con gọi là con bê.' }),
  ]),

  W(5, 21, 25, P1, 'r, s, t, tr, th, ia, ua, ưa', 'Bài 21–25: R r, S s, T t, Tr tr, Th th, ia, ua, ưa.', [
    sc("Tiếng 'rùa' có vần gì?", ['ua', 'ưa', 'ia'], 'ua', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'rùa' gồm r và ua, dấu huyền." }),
    sc('Điền ia, ua hay ưa: cây m...', ['ia', 'ua', 'ưa'], 'ia', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'cây mía.' }),
    mc('Chọn TẤT CẢ các tiếng có vần ưa', ['mưa', 'mua', 'dưa', 'cửa', 'cua'], ['mưa', 'dưa', 'cửa'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'mưa', 'dưa', 'cửa' có ưa; 'mua', 'cua' có ua." }),
    mt('Ghép tiếng với hình đúng', [['thỏ', '🐇'], ['rùa', '🐢'], ['cua', '🦀']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'thỏ, rùa, cua.' }),
    sc('Tiếng nào bắt đầu bằng tr?', ['tre', 'te', 'che'], 'tre', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "'tre' bắt đầu bằng tr." }),
    fb('Ghép âm s với vần ưa và dấu ngã. Được tiếng gì?', ['sữa'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 's – ưa – sưa – ngã – sữa.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'thả', 'cá', 'rô'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé thả cá rô.' }),
    sc("Đọc câu: 'Mẹ mua cá, bé mua dưa.' Bé mua gì?", ['dưa', 'cá', 'mía'], 'dưa', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Mẹ mua cá, còn bé mua dưa.', s: 'Câu có hai phần, ngăn bằng dấu phẩy. Phần sau nói về bé: "bé mua dưa". Vậy bé mua dưa.' }),
    tf("Tiếng 'thỏ' bắt đầu bằng âm th. Đúng hay sai?", 'Đúng', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "'thỏ' = th + o + dấu hỏi." }),
    sc('Con gì có mai cứng, bò rất chậm?', ['rùa', 'thỏ', 'sẻ'], 'rùa', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Rùa có cái mai cứng trên lưng và bò rất chậm. Thỏ chạy nhanh, sẻ là con chim. Chọn \'rùa\'.', e: 'Con rùa có mai cứng và bò chậm.' }),
  ]),

  W(6, 26, 30, P1, 'ph, qu, v, x, y', 'Bài 26–30: Ph ph, Qu qu, V v, X x, Y y, luyện tập chính tả.', [
    sc("Tiếng 'phố' bắt đầu bằng âm nào?", ['ph', 'qu', 'v'], 'ph', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: "'phố' bắt đầu bằng ph." }),
    sc('Điền chữ còn thiếu: ...ả na', ['qu', 'ph', 'x'], 'qu', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: 'quả na — âm qu luôn viết q và u đi liền.' }),
    mt('Ghép tiếng với hình đúng', [['xe', '🚲'], ['vở', '📒'], ['y tá', '👩‍⚕️']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'xe, vở, y tá.' }),
    mc('Chọn TẤT CẢ các tiếng viết ĐÚNG chính tả', ['kẻ', 'cẻ', 'ghe', 'ge', 'ngô'], ['kẻ', 'ghe', 'ngô'], { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, s: 'Trước e viết k và gh: \'kẻ\', \'ghe\' đúng; \'cẻ\', \'ge\' sai. Trước ô viết ng: \'ngô\' đúng.', e: 'Trước e viết k, gh: kẻ, ghe. Trước ô viết ng: ngô.' }),
    fb('Điền c hoặc k: con ...á', ['c', 'cá'], { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước a viết c: con cá.' }),
    sc('Điền g hay gh: ...i nhớ', ['g', 'gh'], 'gh', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước i viết gh: ghi nhớ.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'vẽ', 'xe', 'đỏ'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé vẽ xe đỏ.' }),
    sc("Đọc câu: 'Bố đưa bé về quê.' Bố đưa bé đi đâu?", ['về quê', 'ra phố', 'đi chợ'], 'về quê', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Đọc chậm: Bố – đưa – bé – về – quê. Hai tiếng \'về quê\' cho biết bố đưa bé đi đâu.', e: 'Bố đưa bé về quê.' }),
    tf("Viết 'ngỉ' là đúng chính tả. Đúng hay sai?", 'Sai', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Trước i phải viết ngh: nghỉ.' }),
    sc('Người chăm sóc người ốm ở bệnh viện là ai?', ['y tá', 'xe', 'phố'], 'y tá', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Cô y tá chăm sóc người ốm.' }),
  ]),

  // ======================= PHẦN 2: VẦN =======================
  W(7, 31, 35, P2, 'an, ăn, ân, on, ôn, ơn, en, ên, in, un, am, ăm, âm', 'Bài 31–35: các vần có n và m ở cuối.', [
    sc("Tiếng 'khăn' có vần gì?", ['ăn', 'an', 'ân'], 'ăn', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'khăn' = kh + ăn." }),
    sc('Điền vần: cái đ... (cái đèn)', ['en', 'ên', 'in'], 'en', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'cái đèn: vần en, dấu huyền.' }),
    mc('Chọn TẤT CẢ các tiếng có vần am', ['cam', 'căm', 'nam', 'nấm', 'tám'], ['cam', 'nam', 'tám'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'cam', 'nam', 'tám' có vần am; 'căm' là ăm; 'nấm' là âm." }),
    mt('Ghép từ với hình đúng', [['đèn', '💡'], ['nấm', '🍄'], ['nhện', '🕷️']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'đèn, nấm, nhện.' }),
    fb('Ghép âm ch với vần ăn. Được tiếng gì?', ['chăn'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'ch – ăn – chăn.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bạn', 'Lan', 'có', 'khăn', 'đỏ'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bạn Lan có khăn đỏ.' }),
    mc("Đọc câu: 'Mẹ mua cam, mua nhãn.' Mẹ mua những quả gì?", ['cam', 'nhãn', 'dưa', 'na'], ['cam', 'nhãn'], { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu có hai lần \'mua\': mua cam, mua nhãn. Vậy mẹ mua cam và nhãn. Dưa và na không có trong câu.', e: 'Mẹ mua cam và nhãn.' }),
    tf("Tiếng 'giun' có vần un. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'giun' = gi + un." }),
    sc('Con vật có 8 chân, hay giăng tơ là con gì?', ['con nhện', 'con tằm', 'con chồn'], 'con nhện', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Con nhện có 8 chân và nhả tơ giăng lưới. Con tằm cũng nhả tơ nhưng không có 8 chân. Chọn \'con nhện\'.', e: 'Con nhện có 8 chân và giăng tơ.' }),
    sc('Tiếng nào có vần ơn?', ['sơn', 'sân', 'son'], 'sơn', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'sơn' có vần ơn." }),
  ]),

  W(8, 36, 40, P2, 'om, ôm, ơm, em, êm, im, um, ai, ay, ây, oi, ôi, ơi', 'Bài 36–40: vần có m, i, y ở cuối.', [
    sc("Tiếng 'tôm' có vần gì?", ['ôm', 'om', 'ơm'], 'ôm', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'tôm' = t + ôm." }),
    sc('Điền ai hay ay: bàn t... (bàn tay)', ['ai', 'ay'], 'ay', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'bàn tay: vần ay.' }),
    mc('Chọn TẤT CẢ các tiếng có vần oi', ['voi', 'vôi', 'còi', 'cơi', 'đồi'], ['voi', 'còi'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'voi', 'còi' có oi; 'vôi', 'đồi' có ôi; 'cơi' có ơi." }),
    mt('Ghép từ với hình đúng', [['voi', '🐘'], ['chim', '🐦'], ['mây', '☁️']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'voi, chim, mây.' }),
    fb('Ghép âm c với vần ơm. Được tiếng gì?', ['cơm'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'c – ơm – cơm.' }),
    ord('Sắp xếp các tiếng thành câu', ['Đàn', 'cá', 'bơi', 'lội'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Đàn cá bơi lội.' }),
    sc("Đọc câu: 'Hai chú voi đi ăn mía.' Có mấy chú voi?", ['hai', 'ba', 'bốn'], 'hai', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Đọc tiếng đầu câu: \'Hai chú voi\'. Tiếng \'Hai\' cho biết có hai chú voi.', e: 'Câu nói "Hai chú voi".' }),
    tf("Tiếng 'kem' có vần em. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'kem' = k + em." }),
    sc('Từ nào chỉ đồ ăn?', ['cơm', 'mây', 'ghim'], 'cơm', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Cơm là đồ ăn.' }),
    sc('Ban ... trời tối, có trăng sao.', ['đêm', 'kem', 'tem'], 'đêm', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Lúc trời tối, có trăng sao là ban đêm. \'kem\', \'tem\' không chỉ thời gian. Chọn \'đêm\'.', e: 'Ban đêm trời tối.' }),
  ]),

  W(9, 41, 45, P2, 'ui, ưi, ao, eo, au, âu, êu, iu, ưu', 'Bài 41–45: vần có i, o, u ở cuối.', [
    sc("Tiếng 'mèo' có vần gì?", ['eo', 'ao', 'êu'], 'eo', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'mèo' = m + eo, dấu huyền." }),
    sc('Điền au hay âu: con tr...', ['au', 'âu'], 'âu', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'con trâu: vần âu.' }),
    mc('Chọn TẤT CẢ các tiếng có vần ui', ['túi', 'núi', 'gửi', 'tai', 'đồi'], ['túi', 'núi'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'túi', 'núi' có ui; 'gửi' có ưi." }),
    mt('Ghép từ với hình đúng', [['mèo', '🐈'], ['cừu', '🐑'], ['kéo', '✂️']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'mèo, cừu, kéo.' }),
    fb('Ghép âm s với vần ao. Được tiếng gì?', ['sao'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 's – ao – sao.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'hái', 'rau', 'cải'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé hái rau cải.' }),
    sc("Đọc câu: 'Con mèo trèo cây cau.' Mèo trèo cây gì?", ['cây cau', 'cây lựu', 'cây tre'], 'cây cau', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Đọc chậm: Con – mèo – trèo – cây – cau. Hai tiếng cuối \'cây cau\' là cây mèo trèo lên.', e: 'Mèo trèo cây cau.' }),
    tf("Tiếng 'cừu' có vần ưu. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'cừu' = c + ưu, dấu huyền." }),
    sc("Con gì kêu 'meo meo'?", ['con mèo', 'con cừu', 'con trâu'], 'con mèo', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Con mèo kêu meo meo.' }),
    mc('Chọn TẤT CẢ các từ chỉ con vật', ['trâu', 'rau', 'cừu', 'túi', 'sâu'], ['trâu', 'cừu', 'sâu'], { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'trâu, cừu, sâu là con vật; rau, túi không phải.' }),
  ]),

  W(10, 46, 50, P2, 'ac, ăc, âc, oc, ôc, uc, ưc, at, ăt, ât, ot, ôt, ơt', 'Bài 46–50: vần có c, t ở cuối.', [
    sc("Tiếng 'cốc' có vần gì?", ['ôc', 'oc', 'uc'], 'ôc', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'cốc' = c + ôc, dấu sắc." }),
    sc('Điền at, ăt hay ât: m... trời', ['at', 'ăt', 'ât'], 'ăt', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'mặt trời: vần ăt, dấu nặng.' }),
    mc('Chọn TẤT CẢ các tiếng có vần ot', ['ngọt', 'một', 'rót', 'vợt', 'hót'], ['ngọt', 'rót', 'hót'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'ngọt', 'rót', 'hót' có ot; 'một' có ôt; 'vợt' có ơt." }),
    mt('Ghép từ với hình đúng', [['cúc', '🌼'], ['mực', '🦑'], ['vợt', '🏸']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'hoa cúc, con mực, cái vợt.' }),
    fb('Ghép âm h với vần oc và dấu nặng. Được tiếng gì?', ['học'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'h – oc – hoc – nặng – học.' }),
    ord('Sắp xếp các tiếng thành câu', ['Chị', 'Hà', 'hát', 'hay'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Chị Hà hát hay.' }),
    sc("Đọc câu: 'Quả gấc chín đỏ. Mẹ đồ xôi gấc.' Mẹ nấu món gì?", ['xôi gấc', 'cơm', 'chè'], 'xôi gấc', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu thứ hai nói mẹ làm gì: \'Mẹ đồ xôi gấc.\' \'Đồ xôi\' là nấu xôi. Vậy mẹ nấu xôi gấc.', e: 'Mẹ đồ xôi gấc.' }),
    tf("Tiếng 'đất' có vần ât. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'đất' = đ + ât, dấu sắc." }),
    sc('Chọn tiếng chỉ vị của kẹo', ['ngọt', 'cột', 'hát'], 'ngọt', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Kẹo có vị ngọt.' }),
    sc('Điền oc hay ôc: con ... sên', ['oc', 'ôc'], 'ôc', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'con ốc sên: vần ôc.' }),
  ]),

  W(11, 51, 55, P2, 'et, êt, it, ut, ưt, ap, ăp, âp, op, ôp, ơp', 'Bài 51–55: vần có t, p ở cuối.', [
    sc("Tiếng 'bút' có vần gì?", ['ut', 'ưt', 'uc'], 'ut', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'bút' = b + ut." }),
    sc('Điền et hay êt: ngày T...', ['et', 'êt', 'it'], 'êt', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'ngày Tết: vần êt.' }),
    mc('Chọn TẤT CẢ các tiếng có vần ap', ['đạp', 'tháp', 'cặp', 'sạp', 'lớp'], ['đạp', 'tháp', 'sạp'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'đạp', 'tháp', 'sạp' có ap; 'cặp' có ăp; 'lớp' có ơp." }),
    mt('Ghép từ với hình đúng', [['vẹt', '🦜'], ['mít', '🍈'], ['hộp quà', '🎁']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'con vẹt, quả mít, hộp quà.' }),
    fb('Ghép âm l với vần ơp và dấu sắc. Được tiếng gì?', ['lớp'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'l – ơp – lơp – sắc – lớp.' }),
    ord('Sắp xếp các tiếng thành câu', ['Em', 'đi', 'học', 'ở', 'lớp', 'một'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 3, s: 'Câu bắt đầu bằng chữ viết hoa \'Em\'. Tiếp theo là việc làm \'đi học\', rồi nơi học \'ở lớp một\'.', e: 'Câu đúng: Em đi học ở lớp một.' }),
    mc("Đọc câu: 'Tết đến, mẹ mua mứt và hộp kẹo.' Mẹ mua những gì?", ['mứt', 'kẹo', 'bút', 'cặp'], ['mứt', 'kẹo'], { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Tìm các tiếng đứng sau \'mua\': \'mứt\' và \'hộp kẹo\'. Vậy mẹ mua mứt và kẹo.', e: 'Mẹ mua mứt và kẹo.' }),
    tf("Tiếng 'cặp' có vần ăp. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'cặp' = c + ăp, dấu nặng." }),
    sc('Con chim nào biết nói theo người?', ['con vẹt', 'con cò', 'con sẻ'], 'con vẹt', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Vẹt là loài chim bắt chước được tiếng người. Cò và sẻ không làm được. Chọn \'con vẹt\'.', e: 'Con vẹt bắt chước được tiếng người.' }),
    sc('Đồ dùng để viết là cái gì?', ['cái bút', 'cái hộp', 'cái cặp'], 'cái bút', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 1, e: 'Cái bút dùng để viết.' }),
  ]),

  W(12, 56, 60, P2, 'ep, êp, ip, up, anh, ênh, inh, ach, êch, ich, ang, ăng, âng', 'Bài 56–60: vần có p, nh, ch, ng ở cuối.', [
    sc("Tiếng 'sách' có vần gì?", ['ach', 'ich', 'anh'], 'ach', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'sách' = s + ach." }),
    sc('Điền ang, ăng hay âng: v... trăng', ['ang', 'ăng', 'âng'], 'âng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'vầng trăng: vần âng.' }),
    mc('Chọn TẤT CẢ các tiếng có vần inh', ['kính', 'xinh', 'canh', 'bình', 'kênh'], ['kính', 'xinh', 'bình'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'kính', 'xinh', 'bình' có inh." }),
    mt('Ghép từ với hình đúng', [['ếch', '🐸'], ['dép', '🩴'], ['bánh', '🍰']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'con ếch, đôi dép, cái bánh.' }),
    fb('Ghép âm b với vần êp và dấu sắc. Được tiếng gì?', ['bếp'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'b – êp – bêp – sắc – bếp.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'đọc', 'sách', 'tranh'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Bé đọc sách tranh.' }),
    sc("Đọc câu: 'Đêm rằm, trăng sáng. Bé ngắm trăng.' Trăng đêm rằm thế nào?", ['sáng', 'tối', 'nhỏ'], 'sáng', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu đầu: \'Đêm rằm, trăng sáng.\' Tiếng \'sáng\' nói về trăng.', e: 'Câu nói "trăng sáng".' }),
    tf("Tiếng 'búp' có vần up. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'búp' = b + up." }),
    sc("Con gì kêu 'ộp ộp'?", ['con ếch', 'con mèo', 'con dê'], 'con ếch', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Con ếch kêu ộp ộp.' }),
    sc('Điền ich hay êch: tờ l...', ['ich', 'êch', 'ach'], 'ich', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'tờ lịch: vần ich.' }),
  ]),

  W(13, 61, 65, P2, 'ong, ông, ung, ưng, iêc, iên, iêp, iêng, iêm, yên, iêt, iêu, yêu', 'Bài 61–65: vần ong… và các vần có iê, yê.', [
    sc("Tiếng 'diều' có vần gì?", ['iêu', 'yêu', 'iu'], 'iêu', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'diều' = d + iêu." }),
    sc('Điền iên hay yên: ... xe đạp (cái yên xe)', ['iên', 'yên'], 'yên', {
      o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Tiếng không có âm đầu thì viết yên.',
      s: 'Khi có âm đầu ta viết iê (tiên, kiến). Khi KHÔNG có âm đầu ta viết yê (yên, yêu). "Yên xe" không có âm đầu nên viết yên.',
    }),
    mc('Chọn TẤT CẢ các tiếng có vần ong', ['bóng', 'ông', 'trong', 'sung', 'cong'], ['bóng', 'trong', 'cong'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'bóng', 'trong', 'cong' có ong; 'ông' có ông; 'sung' có ung." }),
    mt('Ghép từ với hình đúng', [['diều', '🪁'], ['ông', '👴'], ['bóng', '⚽']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'cánh diều, ông, quả bóng.' }),
    fb('Ghép âm t với vần iên. Được tiếng gì?', ['tiên'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 't – iên – tiên.' }),
    ord('Sắp xếp các tiếng thành câu', ['Em', 'yêu', 'ông', 'bà'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Em yêu ông bà.' }),
    sc("Đọc câu: 'Chủ nhật, bố đưa bé đi xem xiếc.' Bé đi xem gì?", ['xiếc', 'phim', 'bóng'], 'xiếc', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Tìm tiếng đứng sau \'đi xem\': \'xiếc\'. Vậy bé đi xem xiếc.', e: 'Bé đi xem xiếc.' }),
    tf("Viết 'yêu' (không có âm đầu) là đúng chính tả. Đúng hay sai?", 'Đúng', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Không có âm đầu thì viết yê: yêu.' }),
    sc('Bé thả gì bay cao trên trời?', ['cánh diều', 'quả bóng', 'con chim'], 'cánh diều', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Bé thả diều.' }),
    sc('Tiếng nào có vần ưng?', ['gừng', 'gầng', 'gồng'], 'gừng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'gừng' có vần ưng." }),
  ]),

  W(14, 66, 70, P2, 'uôi, uôm, uôc, uôt, uôn, uông, ươi, ươu', 'Bài 66–70: vần có uô, ươ.', [
    sc("Tiếng 'chuột' có vần gì?", ['uôt', 'uôc', 'uôn'], 'uôt', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'chuột' = ch + uôt, dấu nặng." }),
    sc('Điền uôi hay ươi: quả b...', ['uôi', 'ươi'], 'ươi', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'quả bưởi: vần ươi.' }),
    mc('Chọn TẤT CẢ các tiếng có vần uông', ['chuông', 'xuồng', 'cuộn', 'luống', 'muốn'], ['chuông', 'xuồng', 'luống'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'chuông', 'xuồng', 'luống' có uông; 'cuộn', 'muốn' có uôn." }),
    mt('Ghép từ với hình đúng', [['chuối', '🍌'], ['chuột', '🐭'], ['chuông', '🔔']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'quả chuối, con chuột, cái chuông.' }),
    fb('Ghép âm h với vần ươu. Được tiếng gì?', ['hươu'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'h – ươu – hươu.' }),
    ord('Sắp xếp các tiếng thành câu', ['Bé', 'có', 'mười', 'quả', 'chuối'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 3, s: 'Câu bắt đầu bằng \'Bé\' viết hoa. Bé làm gì? \'có\'. Có gì? \'mười quả chuối\'.', e: 'Câu đúng: Bé có mười quả chuối.' }),
    mc("Đọc câu: 'Nhà bà có cây bưởi và cây chuối.' Nhà bà có những cây gì?", ['bưởi', 'chuối', 'cam'], ['bưởi', 'chuối'], { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu nói \'cây bưởi và cây chuối\'. Cam không có trong câu.', e: 'Nhà bà có cây bưởi và cây chuối.' }),
    tf("Tiếng 'buồm' có vần uôm. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'buồm' = b + uôm, dấu huyền." }),
    sc('Con gì có cổ dài, sừng có nhánh, sống trong rừng?', ['con hươu', 'con chuột', 'con cuốc'], 'con hươu', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Hươu có cổ dài, sừng chia nhánh, sống trong rừng. Chuột và cuốc không có sừng. Chọn \'con hươu\'.', e: 'Con hươu có sừng nhánh.' }),
    sc('Số 10 đọc là gì?', ['mười', 'mươi', 'muối'], 'mười', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Số 10 đọc là "mười" (vần ươi, dấu huyền).' }),
  ]),

  W(15, 71, 75, P2, 'ươc, ươt, ươm, ươp, ươn, ương, oa, oe', 'Bài 71–75: vần có ươ, oa, oe.', [
    sc("Tiếng 'bướm' có vần gì?", ['ươm', 'ươp', 'uôm'], 'ươm', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'bướm' = b + ươm, dấu sắc." }),
    sc('Điền oa hay oe: chim công x... đuôi', ['oa', 'oe'], 'oe', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'chim công xòe đuôi: vần oe.' }),
    mc('Chọn TẤT CẢ các tiếng có vần ương', ['gương', 'vườn', 'đường', 'sương', 'lươn'], ['gương', 'đường', 'sương'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'gương', 'đường', 'sương' có ương; 'vườn', 'lươn' có ươn." }),
    mt('Ghép từ với hình đúng', [['bướm', '🦋'], ['hoa', '🌸'], ['thước', '📏']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'con bướm, bông hoa, cái thước.' }),
    fb('Ghép âm m với vần ươp và dấu sắc. Được tiếng gì?', ['mướp'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'm – ươp – mươp – sắc – mướp.' }),
    ord('Sắp xếp các tiếng thành câu', ['Vườn', 'nhà', 'em', 'có', 'hoa'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Vườn nhà em có hoa.' }),
    sc("Đọc câu: 'Sáng sớm, bé ra vườn tưới hoa.' Bé làm gì?", ['tưới hoa', 'hái quả', 'xem bướm'], 'tưới hoa', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu nói \'bé ra vườn tưới hoa\'. Hai tiếng \'tưới hoa\' cho biết bé làm gì.', e: 'Bé ra vườn tưới hoa.' }),
    tf("Tiếng 'thước' có vần ươc. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'thước' = th + ươc, dấu sắc." }),
    sc('Bé soi vào đâu để thấy mặt mình?', ['cái gương', 'cái thước', 'cái loa'], 'cái gương', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Soi gương thì thấy mặt mình.' }),
    mc('Chọn TẤT CẢ các từ chỉ con vật', ['bướm', 'lươn', 'mướp', 'hoa', 'vượn'], ['bướm', 'lươn', 'vượn'], { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'bướm, lươn, vượn là con vật; mướp, hoa là cây, hoa.' }),
  ]),

  W(16, 76, 80, P2, 'oan, oăn, oat, oăt, oai, uê, uy, uân, uât, uyên, uyêt', 'Bài 76–80: vần có oa, uâ, uyê.', [
    sc("Tiếng 'xoài' có vần gì?", ['oai', 'oa', 'ai'], 'oai', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'xoài' = x + oai, dấu huyền." }),
    sc('Điền uân hay uât: mùa x...', ['uân', 'uât'], 'uân', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: 'mùa xuân: vần uân.' }),
    mc('Chọn TẤT CẢ các tiếng có vần uyên', ['thuyền', 'chuyện', 'khuyết', 'truyện', 'tuyết'], ['thuyền', 'chuyện', 'truyện'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 2, e: "'thuyền', 'chuyện', 'truyện' có uyên; 'khuyết', 'tuyết' có uyêt." }),
    mt('Ghép từ với hình đúng', [['xoài', '🥭'], ['thuyền', '⛵'], ['tuyết', '❄️']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: 'quả xoài, con thuyền, bông tuyết.' }),
    fb('Ghép âm x với vần oăn. Được tiếng gì?', ['xoăn'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'x – oăn – xoăn.' }),
    ord('Sắp xếp các tiếng thành câu', ['Mùa', 'xuân', 'hoa', 'nở'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Mùa xuân hoa nở.' }),
    sc("Đọc câu: 'Bé có mái tóc xoăn. Mẹ buộc tóc cho bé.' Tóc của bé thế nào?", ['xoăn', 'thẳng', 'dài'], 'xoăn', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu đầu: \'Bé có mái tóc xoăn.\' Tiếng \'xoăn\' cho biết tóc bé thế nào.', e: 'Bé có mái tóc xoăn.' }),
    tf("Tiếng 'khoan' có vần oan. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'khoan' = kh + oan." }),
    sc('Mùa nào có hoa đào nở và có Tết?', ['mùa xuân', 'mùa thu', 'mùa đông'], 'mùa xuân', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 3, s: 'Tết Nguyên đán đến vào mùa xuân, khi hoa đào nở. Chọn \'mùa xuân\'.', e: 'Tết đến vào mùa xuân, hoa đào nở.' }),
    sc('Cái gì đi trên mặt nước?', ['thuyền', 'xe', 'ngựa'], 'thuyền', { o: 'V1.VIET.04', f: 'TV.NOITU', l: 1, e: 'Thuyền đi trên mặt nước.' }),
  ]),

  // ======================= ÔN TẬP =======================
  W(17, 81, 83, P3, 'Ôn tập cuối học kì 1', 'Bài 81–83: ôn âm, vần, chính tả, đọc hiểu.', [
    mc('Chọn TẤT CẢ các tiếng viết ĐÚNG chính tả', ['kính', 'cính', 'ghế', 'gế', 'nghỉ'], ['kính', 'ghế', 'nghỉ'], {
      o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, e: 'Trước e, ê, i viết k, gh, ngh: kính, ghế, nghỉ.',
      s: 'Ba cặp cần nhớ: c/k, g/gh, ng/ngh. Đứng trước e, ê, i thì dùng k, gh, ngh. Vì vậy viết đúng là: kính, ghế, nghỉ.',
    }),
    sc("Tiếng 'thuyền' có vần gì?", ['uyên', 'iên', 'uyêt'], 'uyên', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: "'thuyền' = th + uyên." }),
    sc('Câu "Em đi học" cuối câu cần dấu gì?', ['.', '?'], '.', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 2, e: 'Câu kể kết thúc bằng dấu chấm.' }),
    sc('Câu "Bạn tên là gì" cuối câu cần dấu gì?', ['.', '?'], '?', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 2, e: 'Câu hỏi kết thúc bằng dấu chấm hỏi.' }),
    ord('Sắp xếp các tiếng thành câu', ['Em', 'chăm', 'chỉ', 'học', 'bài'], { o: 'V1.DOC.01', f: 'TV.XEPCAU', l: 2, e: 'Câu đúng: Em chăm chỉ học bài.' }),
    mt('Ghép từ với hình đúng', [['ngựa', '🐎'], ['quạt', '🪭'], ['nhà', '🏠']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 1, e: 'con ngựa, cái quạt, ngôi nhà.' }),
    sc("Đọc đoạn: 'Nhà Hà có vườn rau. Mẹ trồng rau cải, rau muống. Hà giúp mẹ tưới rau.' Hà giúp mẹ làm gì?", ['tưới rau', 'trồng rau', 'nấu cơm'], 'tưới rau', {
      o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Câu cuối: "Hà giúp mẹ tưới rau."',
      s: 'Tìm câu có tên Hà: "Hà giúp mẹ tưới rau." Vậy Hà giúp mẹ tưới rau. (Việc trồng rau là mẹ làm.)',
    }),
    mc("Đọc lại đoạn trên. Mẹ trồng những loại rau gì?", ['rau cải', 'rau muống', 'rau ngót'], ['rau cải', 'rau muống'], { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, s: 'Câu thứ hai: \'Mẹ trồng rau cải, rau muống.\' Có hai loại: rau cải và rau muống. Rau ngót không có trong đoạn.', e: 'Mẹ trồng rau cải, rau muống.' }),
    fb('Ghép âm qu với vần ang. Được tiếng gì?', ['quang'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'qu – ang – quang.' }),
    tf("Tiếng 'quạt' gồm âm qu và vần at, dấu nặng. Đúng hay sai?", 'Đúng', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 3, s: 'Đánh vần: qu – at – quat – nặng – quạt. Âm đầu qu, vần at, dấu nặng. Câu nói đúng.', e: "qu – at – quat – nặng – quạt." }),
  ]),
];
