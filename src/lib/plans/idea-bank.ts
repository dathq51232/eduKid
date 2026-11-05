// Ngân hàng ý tưởng dạy học (không dùng AI). Chọn ý tưởng theo môn + từ khoá trong tên bài.
// Mỗi ý tưởng: [tên, phút, phút chuẩn bị, vận động 0/1, nhóm 0/1, sôi động 1-3, mô tả, các bước "a|b|c", mục tiêu].
// "{x}" được thay bằng nội dung chính lấy từ tên bài (VD "Bài 39: oi ôi ơi - Tiết 2" → "oi ôi ơi").
// Thêm ý tưởng: chỉ cần thêm dòng vào mảng tương ứng.

export type Phase = 'kd' | 'kp' | 'lt' | 'vd';
export type LessonIdea = { t: string; m: number; p: number; mv: number; g: number; e: number; d: string; s: string[]; w: string };
type Raw = [string, number, number, number, number, number, string, string, string];
type Bank = Partial<Record<Phase, Raw[]>>;
type Rule = { test: RegExp; bank: Bank };

const CHUNG: Bank = {
  kd: [
    ['Truyền hộp theo nhạc', 4, 0, 1, 0, 3, 'Cả lớp hát, truyền một chiếc hộp; nhạc dừng ở ai, bạn đó trả lời một câu hỏi ôn bài cũ.', 'GV hát / bật nhạc|HS truyền hộp theo dãy|Dừng nhạc → trả lời câu hỏi trong hộp', 'Ôn bài cũ, tạo hứng thú'],
    ['Đèn giao thông', 3, 0, 0, 0, 1, 'GV giơ thẻ xanh – vàng – đỏ: xanh làm nhanh, vàng làm chậm, đỏ im lặng.', 'GV giơ thẻ màu|HS đọc / làm theo nhịp màu', 'Kéo sự tập trung khi lớp ồn'],
  ],
  lt: [
    ['Rung chuông vàng bảng con', 8, 0, 0, 0, 2, 'GV nêu câu hỏi, HS ghi đáp án lên bảng con và giơ cùng lúc; sai thì ngồi xuống, có câu cứu trợ.', 'Chuẩn bị 8–10 câu dễ đến khó|HS giơ bảng sau 15 giây|Câu cứu trợ cho HS sai quay lại', 'Kiểm tra nhanh cả lớp'],
    ['Tiếp sức lên bảng', 7, 0, 1, 1, 3, 'Hai đội xếp hàng, lần lượt lên bảng làm một câu rồi chuyền phấn cho bạn.', 'Chia 2 đội|Mỗi bạn 1 câu|Đội nhiều câu đúng thắng', 'Luyện tập trong không khí thi đua'],
  ],
  vd: [
    ['Thẻ ra về', 3, 0, 0, 0, 1, 'Cuối tiết mỗi em giơ thẻ mặt cười / mặt mếu cho biết đã hiểu bài chưa, nói 1 điều học được.', 'HS giơ thẻ|GV ghi nhận em cần hỗ trợ', 'Tự đánh giá, GV nắm mức độ hiểu bài'],
    ['Về nhà cùng bố mẹ', 3, 0, 0, 0, 1, 'Giao nhiệm vụ nhỏ liên quan bài học, phụ huynh chụp ảnh gửi lớp qua app.', 'GV nêu nhiệm vụ|Nhắn phụ huynh qua app', 'Kết nối gia đình – nhà trường'],
  ],
};

const RULES: Rule[] = [
  { // Tiếng Việt – ôn tập, kể chuyện
    test: /ti[eế]ng vi[eệ]t.*(k[eể] chuy[eệ]n|[oô]n t[aậ]p|[oô]n ti[eế]ng)/i, bank: {
      kd: [['Đoán nhân vật qua giọng nói', 4, 0, 0, 0, 2, 'GV giả giọng một nhân vật, HS đoán đó là ai và vì sao.', 'GV đổi giọng to/nhỏ/trầm/bổng|HS đoán, giải thích', 'Dẫn vào câu chuyện / bài ôn'],
           ['Vòng quay vần', 5, 5, 0, 0, 3, 'Vòng quay có các vần đã học trong tuần; quay trúng vần nào, HS nói một tiếng chứa vần đó.', 'Chuẩn bị vòng quay giấy hoặc trên TV|Mời 4–5 HS quay|Cả lớp nhắc lại', 'Ôn nhanh nhiều vần']],
      kp: [['Nghe kể bằng rối que', 10, 10, 0, 0, 2, 'GV kể chuyện với rối que, dừng ở đoạn hấp dẫn để HS đoán diễn biến.', 'Làm rối que nhân vật|Kể lần 1 trọn vẹn|Kể lần 2 theo tranh, dừng hỏi “tiếp theo là gì?”', 'Nhớ diễn biến truyện'],
           ['Sắp xếp tranh đúng thứ tự', 8, 5, 1, 1, 3, 'Nhóm nhận bộ tranh truyện bị xáo trộn, thi xếp đúng rồi gắn lên bảng.', 'Phát bộ tranh|3 phút sắp xếp|Nhóm khác nhận xét', 'Nắm trình tự câu chuyện'],
           ['Ô chữ vần', 8, 5, 0, 1, 2, 'Ô chữ hàng ngang, mỗi hàng là một từ chứa vần đã học; giải ra từ khoá.', 'Kẻ ô chữ lên bảng|Nhóm chọn hàng, trả lời', 'Ôn hệ thống vần']],
      lt: [['Phóng viên nhí', 8, 0, 1, 1, 3, 'Một HS cầm micro đồ chơi phỏng vấn bạn: Ai? Ở đâu? Làm gì?', 'Gợi ý câu hỏi|Luân phiên làm phóng viên', 'Trả lời câu hỏi theo truyện / bài'],
           ['Kể nối tiếp theo tranh', 10, 0, 0, 1, 2, 'Mỗi HS trong nhóm kể một tranh, nối thành câu chuyện.', 'Nhóm 4 – 4 tranh|Luyện 4 phút|2 nhóm kể trước lớp', 'Kể lại câu chuyện'],
           ['Đọc cho bạn nghe', 8, 0, 0, 1, 1, 'Cặp đôi đọc cho nhau nghe, bạn nghe đánh dấu chỗ đọc sai.', 'Chia cặp|Đổi vai sau 3 phút', 'Đọc trơn, tự kiểm tra']],
      vd: [['Con thích nhân vật nào?', 4, 0, 0, 0, 1, 'HS giơ thẻ màu chọn nhân vật yêu thích, nói một câu lý do.', 'Mỗi màu = 1 nhân vật|Mời vài em chia sẻ', 'Rút ra bài học']],
    } },
  { // Tiếng Việt – học vần / âm / tập đọc
    test: /ti[eế]ng vi[eệ]t/i, bank: {
      kd: [['Truyền chiếc còi', 4, 0, 1, 0, 3, 'Cả lớp hát, truyền tay một vật; nhạc dừng ở ai, bạn đó đọc một tiếng có {x}.', 'Hát / bật nhạc|Truyền theo dãy|Dừng nhạc → đọc 1 tiếng', 'Ôn nhanh nội dung trọng tâm'],
           ['Chiếc hộp bí mật', 5, 5, 0, 0, 2, 'Rút đồ vật / tranh từ hộp, HS gọi tên và tìm tiếng chứa {x}.', 'Chuẩn bị 5–6 đồ vật / tranh|HS rút, gọi tên|Gắn tranh lên bảng', 'Gắn chữ với đồ vật thật'],
           ['Đọc to – nhỏ – thì thầm', 3, 0, 0, 0, 1, 'GV đọc {x}, HS nhắc theo tay GV: tay cao đọc to, tay thấp thì thầm.', 'GV đổi độ cao tay liên tục', 'Kéo sự tập trung']],
      kp: [['Viết trên không – viết lưng bạn', 8, 0, 1, 1, 2, 'HS viết {x} bằng ngón tay trên không, rồi viết lên lưng bạn để bạn đoán.', 'GV viết mẫu, nói quy trình|Viết trên không 2 lần|Cặp đôi viết lưng bạn|Viết bảng con', 'Nhớ quy trình viết'],
           ['Thám tử tìm chữ', 10, 5, 1, 1, 3, 'Dán thẻ từ quanh lớp, mỗi nhóm đi tìm các thẻ chứa {x} mang về.', 'Dán 15 thẻ (có thẻ gây nhiễu)|2 phút tìm|Nhóm đọc to thẻ tìm được', 'Phân biệt chữ dễ nhầm'],
           ['Bánh xe ghép tiếng', 7, 5, 0, 0, 2, 'Hai vòng giấy xoay: vòng trong âm đầu, vòng ngoài vần; xoay để ghép và đọc tiếng mới.', 'Làm 2 vòng giấy ghim giữa|GV xoay → HS đọc|Tiếng có nghĩa → nói câu', 'Luyện ghép, mở rộng vốn từ']],
      lt: [['Câu cá chữ', 10, 10, 1, 1, 3, 'Cá giấy gắn kẹp ghim ghi từ, cần câu nam châm; nhóm câu cá có {x} và đọc to.', 'Chuẩn bị 20 cá + 4 cần câu|1 phút / lượt|Đọc đúng mới được giữ cá', 'Luyện đọc từ'],
           ['Bảng con nhanh tay', 7, 0, 0, 0, 2, 'GV đọc tiếng / từ có {x}, HS viết nhanh lên bảng con và giơ cùng lúc.', 'GV đọc|Viết trong 15 giây|Giơ bảng, nhận xét', 'Kiểm tra viết đồng loạt'],
           ['Đọc tiếp sức theo dãy', 8, 0, 0, 1, 2, 'Mỗi dãy đọc nối tiếp từng câu của đoạn đọc; dãy đọc trơn được cộng sao.', 'Chia 4 dãy|Mỗi em 1 câu|Thi đọc cả đoạn', 'Đọc trơn đoạn văn']],
      vd: [['Săn chữ trong lớp', 4, 0, 1, 0, 2, 'HS nhìn quanh lớp, tìm đồ vật có tiếng chứa {x}.', 'Đếm ngược 1 phút|HS giơ tay nói tên|GV ghi bảng', 'Liên hệ đồ vật quanh em'],
           ['Nói theo tranh – đóng vai', 6, 0, 1, 1, 3, 'Cặp đôi đóng vai nhân vật trong tranh, nói 1–2 câu có tiếng chứa {x}.', 'Quan sát tranh SGK|Phân vai 2 phút|2–3 cặp trình bày', 'Phát triển kĩ năng nói']],
    } },
  { // Toán – cộng, trừ, tính
    test: /to[aá]n.*(c[oộ]ng|tr[uừ]|nh[aâ]n|chia|t[ií]nh|[oô]n)/i, bank: {
      kd: [['Bắn tên', 4, 0, 0, 0, 3, 'GV nêu phép tính rồi “bắn” tên một HS; em trả lời rồi đố tiếp bạn khác.', 'Bắn tên, bắn tên! – Tên gì, tên gì?|GV: “3 + 4 – bạn An!”|An trả lời rồi đố bạn', 'Ôn bảng tính, khởi động sôi nổi'],
           ['Ngón tay thần kì', 3, 0, 0, 0, 2, 'GV giơ ngón tay hai bàn tay, HS nói nhanh phép tính tương ứng.', 'GV giơ 2 + 5 ngón|HS nói phép tính', 'Trực quan, không cần đồ dùng']],
      kp: [['Chuyến xe buýt', 9, 3, 1, 0, 3, 'Xếp ghế thành xe buýt; đến bến có bạn lên thêm (cộng) hoặc xuống bớt (trừ), lớp lập phép tính.', 'Xếp 10 ghế|Mời HS làm hành khách|Mỗi bến nêu phép tính|Ghi bảng', 'Hiểu ý nghĩa phép tính'],
           ['Domino phép tính', 8, 5, 0, 1, 2, 'Nhóm nhận thẻ domino, đếm chấm hai bên và viết phép tính.', 'Phát 6 thẻ / nhóm|Viết vào phiếu|Kiểm tra chéo', 'Liên kết hình ảnh với phép tính'],
           ['Tia số trên sàn', 8, 5, 1, 0, 3, 'Dán số 0–10 trên sàn, HS nhảy theo phép tính GV đọc.', 'Dán ô số|Đứng ở 3, nhảy thêm 4 → 7', 'Trực quan bằng tia số']],
      lt: [['Tìm bạn cùng đáp số', 7, 3, 1, 0, 3, 'Mỗi HS đeo thẻ phép tính hoặc kết quả, đi tìm bạn ghép đúng cặp.', 'Phát thẻ|Hiệu lệnh “Tìm bạn!”|Cặp đúng đọc to', 'Ghi nhớ kết quả phép tính'],
           ['Bingo phép tính', 9, 5, 0, 0, 2, 'HS có bảng bingo đáp số, GV đọc phép tính, em có đáp số thì khoanh.', 'Phát phiếu bingo|Đọc 12 phép tính|Hô BINGO', 'Luyện tính nhẩm'],
           ['Vẽ tranh phép tính', 8, 0, 0, 0, 1, 'HS vẽ tranh minh hoạ một phép tính rồi đố bạn bên cạnh.', 'Tự chọn phép tính|Vẽ 4 phút|Đố cặp đôi', 'Hợp khi cần lớp yên lặng']],
      vd: [['Đi chợ tí hon', 6, 5, 1, 1, 3, 'Gian hàng đồ chơi gắn giá; HS mua 2 món và tính số tiền phải trả.', 'Bày 6 món, gắn giá|HS chọn 2 món, nói phép tính|Bạn bán hàng kiểm tra', 'Vận dụng vào đời sống'],
           ['Đếm đồ trong cặp', 4, 0, 0, 0, 1, 'HS đếm bút chì, bút màu trong hộp và lập phép tính.', 'Lấy đồ dùng ra bàn|Lập phép tính', 'Liên hệ đồ dùng của em']],
    } },
  { // Toán – hình, đo lường, số
    test: /to[aá]n/i, bank: {
      kd: [['Đếm theo nhịp vỗ tay', 3, 0, 1, 0, 3, 'Cả lớp đếm xuôi / ngược theo nhịp vỗ tay, nhịp nhanh dần.', 'GV giữ nhịp|Tăng tốc dần', 'Khởi động tư duy số']],
      kp: [['Thám tử hình khối', 8, 0, 1, 1, 3, 'Nhóm tìm trong lớp các đồ vật có dạng hình / số đo của bài và ghi lại.', 'Giao nhiệm vụ|3 phút tìm|Nhóm báo cáo', 'Nhận biết qua đồ vật thật'],
           ['Ghép hình bằng que tính', 8, 0, 0, 1, 2, 'Dùng que tính / giấy màu ghép thành hình hoặc số theo yêu cầu.', 'Phát que tính|GV ra yêu cầu|Nhóm trình bày', 'Thao tác trực quan']],
      lt: [['Xếp hàng theo số', 7, 3, 1, 0, 3, 'Mỗi HS cầm một thẻ số, thi xếp hàng từ bé đến lớn (hoặc ngược lại).', 'Phát thẻ|Hiệu lệnh xếp hàng|Lớp kiểm tra', 'So sánh, sắp xếp số'],
           ['Phiếu 3 mức', 9, 5, 0, 0, 1, 'Phiếu xanh – vàng – đỏ theo độ khó, HS tự chọn mức phù hợp.', 'In 3 loại phiếu|HS chọn và làm', 'Phân hoá theo năng lực']],
      vd: [['Toán quanh em', 5, 0, 0, 1, 2, 'Nhóm tìm một tình huống trong lớp / ở nhà có dùng kiến thức bài học.', 'Thảo luận 2 phút|Chia sẻ', 'Liên hệ thực tế']],
    } },
  { // Tiếng Anh
    test: /ti[eế]ng anh|english/i, bank: {
      kd: [['Simon says', 4, 0, 1, 0, 3, 'GV ra lệnh bằng tiếng Anh, HS chỉ làm theo khi có “Simon says”.', 'Stand up, touch your nose…|Ai làm sai thì ngồi', 'Khởi động, nghe hiểu']],
      kp: [['Flashcard chớp nhoáng', 7, 5, 0, 0, 2, 'GV lật flashcard thật nhanh, HS đọc to từ mới.', 'Chuẩn bị flashcard|Lật nhanh dần|Che một phần để đoán', 'Ghi nhớ từ vựng']],
      lt: [['Chant theo nhịp', 6, 0, 1, 0, 3, 'Hát / đọc vè từ mới theo nhịp vỗ tay.', 'GV làm mẫu|Lớp đọc theo nhịp|Chia nhóm thi', 'Luyện phát âm']],
      vd: [['Hỏi – đáp cặp đôi', 6, 0, 0, 1, 2, 'Cặp đôi hỏi – đáp theo mẫu câu của bài.', 'GV làm mẫu|Luyện 3 phút|Mời 2–3 cặp', 'Giao tiếp đơn giản']],
    } },
];

// Môn khác (HĐTN, Đạo đức, TNXH, Âm nhạc…)
const KHAC: Bank = {
  kd: [['Gõ cửa làm quen', 5, 0, 1, 1, 3, 'HS đi lại theo nhạc; nhạc dừng thì “gõ cửa” bạn gần nhất, chào và hỏi một câu liên quan bài.', 'Bật nhạc|Nhạc dừng: cốc cốc – chào bạn|Hỏi 1 câu', 'Tạo không khí gần gũi']],
  kp: [['Tranh: Nên hay không nên?', 8, 0, 1, 0, 3, 'GV chiếu tranh tình huống, HS giơ mặt cười / mếu để đánh giá rồi giải thích.', '4–5 tranh|Giơ thẻ|Nếu là con, con làm gì?', 'Phân biệt đúng – sai'],
       ['Bàn tay yêu thương', 10, 3, 0, 0, 2, 'HS vẽ bàn tay, mỗi ngón ghi / vẽ một việc làm đúng theo bài.', 'Phát giấy A5|Vẽ, ghi|Chia sẻ nhóm', 'HS tự nêu hành vi đúng'],
       ['Quan sát vật thật', 8, 5, 0, 1, 2, 'Nhóm quan sát vật thật / tranh, ghi điều phát hiện được.', 'Phát vật mẫu|Phiếu quan sát|Nhóm báo cáo', 'Học qua trải nghiệm']],
  lt: [['Đóng vai xử lý tình huống', 10, 0, 1, 1, 3, 'Nhóm bốc thăm tình huống và đóng vai cách ứng xử.', 'Chuẩn bị 4 phiếu|Thảo luận 3 phút|Đóng vai, nhận xét', 'Rèn kĩ năng thực tế'],
       ['Chiếc ghế nóng', 8, 0, 0, 0, 2, 'Một HS ngồi “ghế nóng”, các bạn lần lượt nói một điều tốt về bạn.', 'Mời 3–4 em|Mỗi bạn 1 lời khen cụ thể', 'Biết ghi nhận bạn']],
  vd: [['Cây cam kết', 6, 5, 1, 0, 2, 'HS dán “chiếc lá” ghi / vẽ việc mình sẽ làm sau bài học lên cây của lớp.', 'Vẽ thân cây A0|HS dán lá|Treo cả tuần', 'Biến bài học thành hành động'],
       ['Thử thách 1 tuần', 3, 0, 0, 0, 1, 'Mỗi em nhận một thử thách nhỏ thực hiện trong tuần, cuối tuần chia sẻ.', 'GV giao thử thách|Cuối tuần chia sẻ', 'Kéo dài trải nghiệm']],
};

const PHASES: Phase[] = ['kd', 'kp', 'lt', 'vd'];

function topic(title: string) {
  const t = title.replace(/^.*?:\s*/, '').replace(/\s*-\s*ti[eế]t\s*\d+.*$/i, '').trim();
  return t && t.length <= 40 ? `“${t}”` : 'nội dung bài';
}

export function ideasFor(subject: string, title: string): { goal: string; ideas: Record<Phase, LessonIdea[]> } {
  const key = `${subject} ${title}`;
  const rule = RULES.find((r) => r.test.test(key));
  const x = topic(title);
  const out = {} as Record<Phase, LessonIdea[]>;
  for (const p of PHASES) {
    const raw = [...((rule ? rule.bank : KHAC)[p] ?? []), ...(CHUNG[p] ?? [])].slice(0, 5);
    out[p] = raw.map(([t, m, pr, mv, g, e, d, s, w]) => ({ t, m, p: pr, mv, g, e, d: d.split('{x}').join(x), s: s.split('|'), w }));
  }
  return { goal: '', ideas: out };
}

// ===== Lựa chọn của thầy cô (nhớ trên máy) và tiến trình tiết =====
export const PHASE_INFO: { k: Phase; n: string; r: number; c: string }[] = [
  { k: 'kd', n: 'Khởi động', r: 0.14, c: '#ff9f43' },
  { k: 'kp', n: 'Khám phá', r: 0.34, c: '#5b8cff' },
  { k: 'lt', n: 'Luyện tập', r: 0.34, c: '#3ecf8e' },
  { k: 'vd', n: 'Vận dụng', r: 0.18, c: '#c56cf0' },
];
export type Pick = { dur: number; sel: Partial<Record<Phase, number>> };
export const PICK_EVENT = 'li:pick'; // detail: { subject, title, open?: boolean }
const pickKey = (subject: string, title: string) => `li-sel:${subject}|${title}`.toLowerCase();

export function loadPick(subject: string, title: string): Pick | null {
  try { const v = localStorage.getItem(pickKey(subject, title)); return v ? JSON.parse(v) as Pick : null; } catch { return null; }
}
export function savePick(subject: string, title: string, pick: Pick) {
  try {
    if (Object.values(pick.sel).some((v) => v != null)) localStorage.setItem(pickKey(subject, title), JSON.stringify(pick));
    else localStorage.removeItem(pickKey(subject, title));
  } catch { /* bỏ qua */ }
}
export function planOf(subject: string, title: string, pick: Pick) {
  const ideas = ideasFor(subject, title).ideas;
  let t = 0;
  return PHASE_INFO.flatMap((p) => {
    const i = pick.sel[p.k];
    const idea = i != null ? ideas[p.k][i] : undefined;
    if (!idea) return [];
    const row = { phase: p, idea, start: t, end: t + idea.m };
    t += idea.m;
    return [row];
  });
}
