// Phát triển kỹ năng (Skill Development Hub) — 6 nhóm kỹ năng cho học sinh tiểu học (6–11 tuổi).
// Nội dung tự soạn, bám các khung tham khảo: CASEL (5 năng lực cảm xúc – xã hội), WHO 2020 (trẻ 5–17 tuổi vận động
// trung bình 60 phút/ngày, hạn chế ngồi trước màn hình), giáo dục tài chính cho trẻ (kiếm – tiết kiệm – tiêu – chia sẻ,
// "cần" và "muốn"), giáo dục an toàn cho học sinh Việt Nam (đuối nước, giao thông, phòng chống xâm hại, số khẩn cấp).
// Kỹ năng đã có trong app thì dẫn tới trang sẵn có (href).

export type Scenario = { q: string; opts: string[]; a: number; why: string };
export type Skill = {
  id: string; name: string; icon: string;
  /** mục tiêu (em sẽ làm được gì) */ goal: string;
  /** 3 ý em cần nhớ */ tips: string[];
  /** tình huống "Em sẽ làm gì?" */ scenarios: Scenario[];
  /** thử thách làm ở nhà / ở lớp trong tuần */ mission: string;
  /** gợi ý cho bố mẹ, thầy cô */ parent: string;
  /** kỹ năng đã có trang luyện trong app */ href?: string; hrefLabel?: string;
};
export type SkillGroup = { id: string; no: string; name: string; en: string; tone: string; icon: string; blurb: string; skills: Skill[] };

const F = (n: string) => `/emoji/f3d/${n}.webp`;

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'ngon-ngu', no: '01', name: 'Ngôn ngữ & giao tiếp', en: 'Language & Communication', tone: '#2457c5', icon: F('speech-balloon'),
    blurb: 'Nghe – nói – đọc – viết tự tin bằng tiếng Việt và tiếng Anh, kể chuyện hấp dẫn, nói trước lớp không run.',
    skills: [
      {
        id: 'english-reflex', name: 'English Thinking & Reflex', icon: F('blue-book'), href: '/tieng-anh', hrefLabel: 'Vào English Journey',
        goal: 'Nghe và đáp lại bằng tiếng Anh thật nhanh, nghĩ bằng tiếng Anh thay vì dịch từng từ.',
        tips: ['Nói cả câu ngắn, không chỉ một từ: “It’s a cat.”', 'Nghe mẫu rồi nói đuổi theo, giữ đúng ngữ điệu.', 'Sai cũng không sao — nói lại câu đúng một lần nữa.'],
        scenarios: [
          { q: 'Bạn hỏi “How are you?”. Em đáp thế nào cho tự nhiên?', opts: ['I’m fine, thank you. And you?', 'Yes.', 'My name is An.'], a: 0, why: 'Câu hỏi thăm sức khoẻ → đáp “I’m fine…” và hỏi lại bạn cho lịch sự.' },
          { q: 'Em chưa nghe rõ câu cô hỏi bằng tiếng Anh. Em nói gì?', opts: ['Im lặng', 'Sorry, can you say it again, please?', 'No!'], a: 1, why: 'Xin cô nói lại một cách lịch sự là cách học rất tốt.' },
          { q: 'Muốn mượn bút của bạn bằng tiếng Anh, em nói:', opts: ['Give me pen.', 'Can I borrow your pen, please?', 'Pen, pen!'], a: 1, why: '“Can I …, please?” là mẫu câu xin phép lịch sự.' },
        ],
        mission: 'Mỗi ngày nói với bố mẹ 3 câu tiếng Anh về việc em đã làm hôm nay (I played…, I ate…).',
        parent: 'Hỏi con bằng 1–2 câu tiếng Anh đơn giản mỗi ngày; khen khi con trả lời cả câu.',
      },
      {
        id: 'tieng-viet', name: 'Tiếng Việt', icon: F('open-book'), href: '/chon-bai?subject=tieng-viet', hrefLabel: 'Học bài Tiếng Việt',
        goal: 'Đọc trôi chảy, hiểu ý chính, viết câu đúng chính tả và dùng từ phù hợp.',
        tips: ['Đọc to, ngắt nghỉ đúng dấu chấm, dấu phẩy.', 'Đọc xong tự hỏi: bài nói về ai? làm gì? vì sao?', 'Viết xong đọc lại để soát lỗi chính tả.'],
        scenarios: [
          { q: 'Đọc một bài dài, em làm gì để nhớ ý chính?', opts: ['Đọc thật nhanh một lần', 'Gạch chân từ quan trọng, kể lại bằng lời của mình', 'Chỉ nhìn tranh'], a: 1, why: 'Kể lại bằng lời của mình giúp em hiểu và nhớ lâu.' },
          { q: 'Em không chắc viết “dành dụm” hay “giành dụm”. Em làm gì?', opts: ['Viết đại', 'Tra từ điển hoặc hỏi cô', 'Bỏ trống'], a: 1, why: 'Tra cứu là thói quen tốt; “dành dụm” là để dành.' },
          { q: 'Câu nào viết đúng?', opts: ['hôm nay em đi học', 'Hôm nay, em đi học.', 'Hôm nay em đi học'], a: 1, why: 'Đầu câu viết hoa, cuối câu có dấu chấm.' },
        ],
        mission: 'Đọc to một đoạn văn ngắn cho bố mẹ nghe và kể lại ý chính trong 3 câu.',
        parent: 'Cùng con đọc 10–15 phút mỗi tối; hỏi “Con thích nhân vật nào? Vì sao?”.',
      },
      {
        id: 'ke-chuyen', name: 'Kể chuyện', icon: F('framed-picture'),
        goal: 'Kể một câu chuyện có mở đầu – diễn biến – kết thúc, giọng kể có cảm xúc.',
        tips: ['Mở đầu: giới thiệu ai, ở đâu, khi nào.', 'Diễn biến: chuyện gì xảy ra, nhân vật làm gì.', 'Kết thúc: chuyện kết thúc ra sao, em rút ra điều gì.'],
        scenarios: [
          { q: 'Câu mở đầu nào hay nhất cho chuyện về chú mèo?', opts: ['Hết.', 'Ngày xưa, ở một xóm nhỏ, có chú mèo mướp rất tò mò.', 'Mèo ăn cá.'], a: 1, why: 'Câu mở đầu tốt giới thiệu nhân vật, nơi chốn và gợi tò mò.' },
          { q: 'Kể đến đoạn nhân vật buồn, giọng em nên:', opts: ['Thật to, thật nhanh', 'Chậm và nhỏ lại một chút', 'Giữ y như cũ'], a: 1, why: 'Thay đổi giọng theo cảm xúc giúp người nghe “thấy” câu chuyện.' },
          { q: 'Bạn nghe xong hỏi “Rồi sao nữa?”. Điều đó cho thấy:', opts: ['Chuyện em đang hấp dẫn', 'Bạn không nghe', 'Em kể sai'], a: 0, why: 'Người nghe tò mò là dấu hiệu em kể cuốn hút.' },
        ],
        mission: 'Vẽ 3 bức tranh (mở đầu – diễn biến – kết thúc) rồi kể chuyện theo tranh cho cả nhà.',
        parent: 'Mỗi tối để con kể lại một chuyện trong ngày theo 3 phần; hỏi thêm “Lúc đó con thấy thế nào?”.',
      },
      {
        id: 'thuyet-trinh', name: 'Thuyết trình', icon: F('microphone'),
        goal: 'Nói trước lớp rõ ràng, nhìn người nghe, trình bày ý theo thứ tự.',
        tips: ['Chuẩn bị 3 ý chính, mỗi ý một câu.', 'Đứng thẳng, nhìn các bạn, nói đủ to.', 'Kết thúc bằng câu cảm ơn và mời các bạn hỏi.'],
        scenarios: [
          { q: 'Trước khi lên trình bày em thấy hồi hộp. Em làm gì?', opts: ['Xin không lên', 'Hít sâu 3 lần, nhẩm lại 3 ý chính', 'Nói thật nhanh cho xong'], a: 1, why: 'Hít thở chậm làm em bình tĩnh; nhớ dàn ý giúp em tự tin.' },
          { q: 'Khi trình bày, mắt em nên nhìn:', opts: ['Xuống sàn', 'Các bạn và cô', 'Ra cửa sổ'], a: 1, why: 'Nhìn người nghe giúp họ chú ý và thấy em tự tin.' },
          { q: 'Bạn hỏi một câu em chưa biết trả lời. Em nói:', opts: ['Câu đó dở quá', 'Cảm ơn bạn, mình sẽ tìm hiểu thêm và trả lời sau nhé', 'Im lặng'], a: 1, why: 'Trung thực, lịch sự và hẹn tìm hiểu thêm là cách trả lời rất tốt.' },
        ],
        mission: 'Giới thiệu “đồ vật em yêu thích” trong 1 phút trước gia đình: nó là gì, vì sao em thích, em giữ gìn thế nào.',
        parent: 'Làm khán giả nhiệt tình; khen một điểm tốt và góp một điểm cần sửa (khen trước, góp sau).',
      },
    ],
  },
  {
    id: 'tu-duy', no: '02', name: 'Tư duy & trí tuệ', en: 'Thinking & Intelligence', tone: '#7c4ddf', icon: F('light-bulb'),
    blurb: 'Tìm quy luật, suy luận “nếu… thì…”, đặt câu hỏi “vì sao?” và giải quyết vấn đề từng bước.',
    skills: [
      {
        id: 'logic', name: 'Logic', icon: F('puzzle-piece'), href: '/tro-choi', hrefLabel: 'Chơi game trí tuệ',
        goal: 'Tìm quy luật, sắp xếp, suy luận đúng từ những điều đã biết.',
        tips: ['Tìm điểm giống và khác nhau trước.', '“Nếu… thì…”: nếu điều đầu đúng thì điều sau đúng.', 'Thử từng khả năng rồi loại trừ cái sai.'],
        scenarios: [
          { q: 'Dãy: 2, 4, 6, 8, … Số tiếp theo là?', opts: ['9', '10', '12'], a: 1, why: 'Mỗi số hơn số trước 2 đơn vị: 8 + 2 = 10.' },
          { q: 'Mọi con chim đều có cánh. Chích bông là chim. Vậy:', opts: ['Chích bông có cánh', 'Chích bông biết bơi', 'Không biết được'], a: 0, why: 'Suy luận từ điều chung (mọi con chim) sang trường hợp riêng.' },
          { q: 'An cao hơn Bình, Bình cao hơn Chi. Ai thấp nhất?', opts: ['An', 'Bình', 'Chi'], a: 2, why: 'An > Bình > Chi nên Chi thấp nhất.' },
        ],
        mission: 'Tự nghĩ một dãy hình hoặc dãy số có quy luật và đố bố mẹ tìm phần tiếp theo.',
        parent: 'Chơi cờ, ghép hình, Sudoku cùng con; hỏi “Sao con chọn nước đi đó?”.',
      },
      {
        id: 'toan-tu-duy', name: 'Toán tư duy', icon: F('abacus'), href: '/chon-bai?subject=toan&nc=1', hrefLabel: 'Chuyên đề Toán nâng cao',
        goal: 'Giải toán bằng nhiều cách: vẽ sơ đồ, tính nhanh, thử – kiểm tra.',
        tips: ['Đọc đề 2 lần, gạch chân cái đã cho và cái phải tìm.', 'Vẽ sơ đồ đoạn thẳng hoặc hình để “nhìn thấy” bài toán.', 'Làm xong thử lại kết quả.'],
        scenarios: [
          { q: 'Tính nhanh 25 + 37 + 75. Cách khéo nhất là:', opts: ['Cộng lần lượt từ trái sang phải', 'Ghép 25 + 75 = 100 rồi cộng 37', 'Đếm ngón tay'], a: 1, why: 'Ghép các số tròn trăm trước: 100 + 37 = 137.' },
          { q: 'Gặp bài toán khó, bước đầu tiên nên là:', opts: ['Đoán đáp số', 'Đọc kĩ đề, tìm cái đã cho và cái cần tìm', 'Bỏ qua'], a: 1, why: 'Hiểu đề là nửa đường đến lời giải.' },
          { q: 'Làm xong 48 − 19 = 29. Em kiểm tra bằng cách:', opts: ['29 + 19 = 48', 'Hỏi bạn', 'Không cần kiểm tra'], a: 0, why: 'Lấy hiệu cộng số trừ phải được số bị trừ.' },
        ],
        mission: 'Đi chợ cùng bố mẹ, nhẩm tổng tiền 3 món hàng trước khi thu ngân tính.',
        parent: 'Khen cách nghĩ của con, không chỉ khen đáp số đúng; hỏi “Còn cách nào khác không?”.',
      },
      {
        id: 'phan-bien', name: 'Phản biện', icon: F('eyes'),
        goal: 'Phân biệt sự thật và ý kiến, hỏi “vì sao?”, kiểm tra thông tin trước khi tin.',
        tips: ['Sự thật thì kiểm chứng được; ý kiến là cảm nghĩ của mỗi người.', 'Hỏi: Ai nói? Có bằng chứng không?', 'Lắng nghe ý khác, rồi mới nói ý mình.'],
        scenarios: [
          { q: 'Câu nào là SỰ THẬT?', opts: ['Kem dâu ngon nhất', 'Nước sôi ở 100 °C (ở mặt biển)', 'Mèo dễ thương hơn chó'], a: 1, why: 'Nhiệt độ sôi của nước kiểm chứng được; các câu kia là ý kiến.' },
          { q: 'Trên mạng có tin “Ăn kẹo giúp thông minh hơn”. Em nên:', opts: ['Tin ngay và chia sẻ', 'Hỏi người lớn, xem nguồn tin có đáng tin không', 'Ăn thật nhiều kẹo'], a: 1, why: 'Kiểm tra nguồn trước khi tin và chia sẻ.' },
          { q: 'Bạn có ý kiến khác em. Em làm gì?', opts: ['Cãi to hơn', 'Nghe bạn nói hết, hỏi lí do, rồi nêu lí do của mình', 'Giận bạn'], a: 1, why: 'Tranh luận tốt là đưa ra lí do, không phải nói to hơn.' },
        ],
        mission: 'Mỗi ngày tìm 1 câu “sự thật” và 1 câu “ý kiến” trong sách báo, đọc cho bố mẹ đoán.',
        parent: 'Khi con hỏi “Tại sao?”, hỏi lại “Con nghĩ sao?” trước khi giải thích.',
      },
      {
        id: 'giai-quyet-van-de', name: 'Giải quyết vấn đề', icon: F('hammer'),
        goal: 'Giải quyết vấn đề theo 4 bước: Hiểu – Nghĩ cách – Làm – Xem lại.',
        tips: ['Hiểu: vấn đề là gì?', 'Nghĩ cách: nghĩ ít nhất 2 cách, chọn cách tốt nhất.', 'Làm rồi xem lại: được chưa? lần sau làm khác gì?'],
        scenarios: [
          { q: 'Sáng nào em cũng quên mang khăn quàng. Cách hay nhất:', opts: ['Mặc kệ', 'Chuẩn bị cặp và khăn từ tối hôm trước, để cạnh cửa', 'Mượn bạn mỗi ngày'], a: 1, why: 'Tìm đúng nguyên nhân (vội buổi sáng) và thay đổi cách làm.' },
          { q: 'Hai bạn cùng muốn chơi một quả bóng. Em gợi ý:', opts: ['Ai mạnh hơn được chơi', 'Chia lượt, mỗi bạn 10 phút', 'Cất bóng đi'], a: 1, why: 'Một giải pháp công bằng cho cả hai.' },
          { q: 'Làm mô hình bị đổ. Em nên:', opts: ['Vứt đi', 'Xem chỗ nào yếu, làm chân đế chắc hơn rồi thử lại', 'Khóc'], a: 1, why: 'Thất bại cho em biết cần sửa chỗ nào — đó là bước “Xem lại”.' },
        ],
        mission: 'Chọn một việc nhỏ trong nhà chưa ổn (bàn học bừa, quên đồ…) và giải quyết theo 4 bước.',
        parent: 'Khi con gặp khó, hỏi “Con thử cách nào rồi? Còn cách nào nữa?” thay vì làm hộ ngay.',
      },
    ],
  },
  {
    id: 'cam-xuc', no: '03', name: 'Cảm xúc & xã hội', en: 'Emotional & Social', tone: '#e11d48', icon: F('red-heart'),
    blurb: 'Hiểu cảm xúc của mình, đặt mình vào vị trí người khác, hợp tác và giữ bình tĩnh.',
    skills: [
      {
        id: 'eq', name: 'EQ – Hiểu cảm xúc', icon: F('grinning-face-with-smiling-eyes'),
        goal: 'Gọi đúng tên cảm xúc của mình: vui, buồn, giận, sợ, lo lắng, tự hào…',
        tips: ['Cảm xúc nào cũng bình thường; quan trọng là em làm gì với nó.', 'Nói “Em đang thấy … vì …”.', 'Cơ thể báo hiệu cảm xúc: tim đập nhanh, mặt nóng, muốn khóc.'],
        scenarios: [
          { q: 'Em được điểm 10 bài kiểm tra khó. Cảm xúc của em có thể là:', opts: ['Tự hào', 'Sợ hãi', 'Buồn chán'], a: 0, why: 'Cố gắng và đạt kết quả tốt khiến em tự hào.' },
          { q: 'Bạn lấy đồ chơi của em không hỏi. Em thấy giận. Em nên nói:', opts: ['Đồ xấu!', 'Mình thấy giận vì bạn lấy mà không hỏi', 'Giật lại thật mạnh'], a: 1, why: 'Nói rõ cảm xúc và lí do giúp bạn hiểu mà không làm to chuyện.' },
          { q: 'Ngày mai kiểm tra, tối nay em trằn trọc. Đó là cảm giác:', opts: ['Lo lắng', 'Vui vẻ', 'Đói bụng'], a: 0, why: 'Lo lắng trước việc quan trọng là bình thường — hãy kể với bố mẹ.' },
        ],
        mission: 'Mỗi tối chọn 1 biểu tượng cảm xúc cho ngày hôm nay và kể cho bố mẹ vì sao.',
        parent: 'Gọi tên cảm xúc giúp con (“Con đang buồn vì…”), không nói “Có gì đâu mà khóc”.',
      },
      {
        id: 'dong-cam', name: 'Đồng cảm', icon: F('pink-heart'),
        goal: 'Đặt mình vào vị trí người khác, nhận ra bạn đang buồn và biết an ủi.',
        tips: ['Nhìn nét mặt, nghe giọng nói để đoán cảm xúc của bạn.', 'Hỏi “Bạn có sao không?” và lắng nghe.', 'Không chê cười khi bạn gặp chuyện buồn.'],
        scenarios: [
          { q: 'Bạn mới chuyển đến ngồi một mình giờ ra chơi. Em làm gì?', opts: ['Kệ bạn', 'Rủ bạn chơi cùng nhóm mình', 'Nhìn rồi cười'], a: 1, why: 'Rủ bạn chơi giúp bạn bớt lạc lõng — đó là đồng cảm.' },
          { q: 'Bạn bị điểm kém và khóc. Em nói:', opts: ['Dễ thế mà cũng sai', 'Lần sau mình cùng ôn nhé, bạn sẽ làm được', 'Chẳng liên quan đến mình'], a: 1, why: 'Lời động viên và giúp đỡ làm bạn thấy được chia sẻ.' },
          { q: 'Em làm vỡ bút của bạn. Bạn rất buồn. Em nên:', opts: ['Xin lỗi, hỏi cách đền hoặc cho bạn mượn bút của em', 'Giấu đi', 'Đổ cho bạn khác'], a: 0, why: 'Hiểu bạn buồn, xin lỗi và sửa sai.' },
        ],
        mission: 'Trong tuần làm 3 việc tốt nhỏ cho người khác (giúp em bé, hỏi thăm bạn ốm…) và ghi lại.',
        parent: 'Khi đọc truyện, hỏi “Nếu con là nhân vật này, con thấy thế nào?”.',
      },
      {
        id: 'hop-tac', name: 'Hợp tác', icon: F('waving-hand'),
        goal: 'Làm việc nhóm: chia việc, lắng nghe, giúp nhau hoàn thành mục tiêu chung.',
        tips: ['Mỗi bạn một việc phù hợp, ai cũng có phần.', 'Lắng nghe ý kiến của mọi người trước khi quyết định.', 'Thành công là của cả nhóm.'],
        scenarios: [
          { q: 'Nhóm em làm báo tường. Cách chia việc tốt là:', opts: ['Một bạn làm hết', 'Bạn vẽ, bạn viết, bạn trang trí theo sở trường', 'Ai thích thì làm'], a: 1, why: 'Chia việc theo điểm mạnh giúp cả nhóm làm tốt và nhanh.' },
          { q: 'Một bạn trong nhóm chưa nói ý kiến nào. Em:', opts: ['Hỏi “Bạn nghĩ sao?”', 'Bỏ qua bạn', 'Chê bạn lười'], a: 0, why: 'Mời bạn nói giúp mọi người đều được tham gia.' },
          { q: 'Nhóm em thua trò chơi. Em nói:', opts: ['Tại bạn A hết', 'Cả nhóm đã cố gắng, lần sau mình tập thêm', 'Không chơi nữa'], a: 1, why: 'Không đổ lỗi, cùng nhau rút kinh nghiệm.' },
        ],
        mission: 'Cùng cả nhà làm một bữa cơm hoặc dọn nhà: em nhận một phần việc và làm đến cùng.',
        parent: 'Giao con việc nhóm trong nhà và cho con tự chia việc với anh chị em.',
      },
      {
        id: 'quan-ly-cam-xuc', name: 'Quản lý cảm xúc', icon: F('sleeping-face'),
        goal: 'Bình tĩnh khi giận hay buồn: dừng lại, hít thở, chọn cách phản ứng tốt.',
        tips: ['Dừng lại – đếm chậm đến 10.', 'Thở hộp: hít vào 4 nhịp – giữ 4 – thở ra 4.', 'Bình tĩnh rồi mới nói hoặc làm.'],
        scenarios: [
          { q: 'Em giận vì thua cờ. Việc đầu tiên nên làm:', opts: ['Hất bàn cờ', 'Dừng lại, hít thở chậm vài lần', 'La hét'], a: 1, why: 'Hít thở chậm giúp cơn giận lắng xuống trước khi em hành động.' },
          { q: 'Sau khi bình tĩnh, em có thể:', opts: ['Chúc mừng bạn và xin chơi ván nữa', 'Không nói chuyện với bạn', 'Kể xấu bạn'], a: 0, why: 'Thua cũng là cơ hội học hỏi; chơi đẹp khiến bạn quý em.' },
          { q: 'Em buồn mà không biết vì sao. Em có thể:', opts: ['Giấu đi', 'Kể với người lớn em tin tưởng hoặc vẽ ra cảm xúc', 'Đập phá đồ'], a: 1, why: 'Chia sẻ hoặc vẽ ra giúp em hiểu và nhẹ lòng hơn.' },
        ],
        mission: 'Tập thở hộp 3 lần mỗi tối trước khi ngủ, và dùng nó khi thấy giận trong tuần.',
        parent: 'Làm gương: khi bố mẹ giận, nói “Bố/mẹ cần bình tĩnh một chút” rồi hít thở.',
      },
    ],
  },
  {
    id: 'sang-tao', no: '04', name: 'Sáng tạo & nghệ thuật', en: 'Creativity & Arts', tone: '#ea580c', icon: F('artist-palette'),
    blurb: 'Vẽ, hát, tưởng tượng và nghĩ ra cách mới — không có câu trả lời “sai” trong sáng tạo.',
    skills: [
      {
        id: 'hoi-hoa', name: 'Hội họa', icon: F('paintbrush'),
        goal: 'Quan sát kĩ, phối màu, vẽ để kể chuyện và thể hiện cảm xúc.',
        tips: ['Quan sát hình dạng lớn trước, chi tiết sau.', 'Màu nóng (đỏ, cam, vàng) thấy ấm áp; màu lạnh (xanh, tím) thấy mát dịu.', 'Tranh của em là duy nhất — không cần giống bạn.'],
        scenarios: [
          { q: 'Em muốn vẽ buổi trưa hè nắng chói. Nên dùng nhiều màu:', opts: ['Vàng, cam', 'Xám, đen', 'Tím đậm'], a: 0, why: 'Màu nóng gợi cảm giác nắng, ấm.' },
          { q: 'Bạn vẽ con mèo màu xanh lá. Em nghĩ:', opts: ['Sai rồi, mèo không màu xanh', 'Thú vị! Hỏi bạn ý tưởng của bạn', 'Cười bạn'], a: 1, why: 'Trong nghệ thuật, màu sắc tưởng tượng là sáng tạo.' },
          { q: 'Vẽ một cái cây, bước đầu tiên nên:', opts: ['Vẽ từng chiếc lá', 'Phác thân và tán cây lớn', 'Tô màu nền'], a: 1, why: 'Hình lớn trước, chi tiết sau giúp bố cục cân đối.' },
        ],
        mission: 'Vẽ “cảm xúc hôm nay” bằng màu sắc và kể cho bố mẹ vì sao em chọn màu đó.',
        parent: 'Khen cụ thể (“Con phối màu bầu trời đẹp quá”) thay vì chỉ “Đẹp lắm”.',
      },
      {
        id: 'am-nhac', name: 'Âm nhạc', icon: F('musical-notes'),
        goal: 'Cảm nhận nhịp, cao – thấp, nhanh – chậm; hát và gõ đệm theo bài hát.',
        tips: ['Vỗ tay theo nhịp đều của bài hát.', 'Âm cao như tiếng chim hót, âm thấp như tiếng trống.', 'Hát vừa đủ nghe, rõ lời, vui tươi.'],
        scenarios: [
          { q: 'Tiếng chim hót thường là âm:', opts: ['Cao', 'Thấp', 'Không có âm'], a: 0, why: 'Tiếng chim trong và cao.' },
          { q: 'Bài hát ru em bé ngủ thường có nhịp:', opts: ['Nhanh, mạnh', 'Chậm, nhẹ nhàng', 'Lúc to lúc hét'], a: 1, why: 'Nhịp chậm, êm giúp em bé dễ ngủ.' },
          { q: 'Không có nhạc cụ, em vẫn gõ đệm được bằng:', opts: ['Vỗ tay, gõ thước, lắc hộp bút', 'Không thể', 'Hét to'], a: 0, why: 'Đồ vật quanh em đều có thể thành nhạc cụ.' },
        ],
        mission: 'Tự làm một nhạc cụ (chai nhựa đựng gạo, hộp giấy làm trống) và gõ đệm một bài hát.',
        parent: 'Hát cùng con, cho con nghe nhiều thể loại nhạc thiếu nhi và dân ca.',
      },
      {
        id: 'tuong-tuong', name: 'Tưởng tượng', icon: F('rainbow'),
        goal: 'Nghĩ ra thế giới, nhân vật, câu chuyện mới từ những điều quen thuộc.',
        tips: ['Hỏi “Nếu … thì sao?”.', 'Biến đồ vật quen thành thứ khác: hộp giấy thành tàu vũ trụ.', 'Ý tưởng lạ cũng đáng nói ra.'],
        scenarios: [
          { q: '“Nếu con mèo biết nói…” Em sẽ:', opts: ['Bảo không thể', 'Nghĩ xem mèo sẽ kể chuyện gì về ngôi nhà', 'Bỏ qua'], a: 1, why: 'Câu hỏi “Nếu… thì sao?” mở ra cả một câu chuyện.' },
          { q: 'Một chiếc hộp giấy rỗng có thể thành:', opts: ['Chỉ là hộp giấy', 'Ngôi nhà búp bê, ô tô, tàu vũ trụ…', 'Rác'], a: 1, why: 'Tưởng tượng giúp một vật có nhiều công dụng mới.' },
          { q: 'Bạn kể ý tưởng rất lạ. Em nên:', opts: ['Chê vô lí', 'Thêm ý vào cho câu chuyện hay hơn', 'Bỏ đi'], a: 1, why: 'Cùng nhau phát triển ý tưởng là cách sáng tạo vui nhất.' },
        ],
        mission: 'Sáng tác một nhân vật mới (tên, tài năng, nơi ở) và vẽ nhân vật đó.',
        parent: 'Chơi “Nếu… thì sao?” khi đi đường; tránh nói “Vô lí” với ý tưởng của con.',
      },
      {
        id: 'sang-tao', name: 'Sáng tạo', icon: F('scissors'),
        goal: 'Tạo ra sản phẩm mới bằng cách thay đổi, kết hợp, dùng lại đồ vật.',
        tips: ['Thay đổi: đổi màu, đổi cỡ, đổi chất liệu.', 'Kết hợp: ghép hai thứ thành một.', 'Dùng lại: tái chế đồ cũ thành đồ hữu ích.'],
        scenarios: [
          { q: 'Chai nhựa đã dùng có thể tái chế thành:', opts: ['Chậu trồng cây nhỏ', 'Không làm gì được', 'Đồ ăn'], a: 0, why: 'Dùng lại đồ cũ vừa sáng tạo vừa bảo vệ môi trường.' },
          { q: 'Muốn cái bút “đặc biệt hơn”, em có thể:', opts: ['Trang trí, gắn thêm tẩy hoặc thước nhỏ', 'Bẻ đôi', 'Vứt đi'], a: 0, why: 'Kết hợp thêm công dụng là một cách sáng tạo.' },
          { q: 'Sản phẩm đầu tiên chưa đẹp. Em:', opts: ['Bỏ cuộc', 'Sửa lại, thử cách khác', 'Giấu đi'], a: 1, why: 'Nhà sáng tạo nào cũng thử nhiều lần.' },
        ],
        mission: 'Làm một món đồ dùng học tập từ vật liệu tái chế (ống bút, kẹp sách…).',
        parent: 'Để sẵn “hộp sáng tạo” gồm giấy màu, hộp, nắp chai cho con tự làm.',
      },
    ],
  },
  {
    id: 'tu-lap', no: '05', name: 'Tự lập & kỹ năng sống', en: 'Independence & Life Skills', tone: '#0f766e', icon: F('backpack'),
    blurb: 'Tự phục vụ, giữ an toàn cho mình, dùng thời gian hợp lí và biết tiêu – để dành tiền.',
    skills: [
      {
        id: 'tu-phuc-vu', name: 'Tự phục vụ', icon: F('t-shirt'),
        goal: 'Tự làm việc của mình: soạn cặp, gấp quần áo, dọn bàn học, giúp việc nhà vừa sức.',
        tips: ['Tối soạn cặp theo thời khoá biểu.', 'Đồ dùng xong để lại đúng chỗ.', 'Mỗi ngày nhận một việc nhà nhỏ.'],
        scenarios: [
          { q: 'Tối nay em nên soạn cặp theo:', opts: ['Thời khoá biểu ngày mai', 'Cảm tính', 'Mang hết sách'], a: 0, why: 'Theo thời khoá biểu giúp không thiếu, không nặng cặp.' },
          { q: 'Ăn xong em nên:', opts: ['Bỏ bát tại chỗ', 'Mang bát vào bồn rửa, lau bàn', 'Đi chơi ngay'], a: 1, why: 'Tự dọn phần của mình là bước đầu tự lập.' },
          { q: 'Áo khoác mặc xong em:', opts: ['Vứt lên ghế', 'Treo lên móc hoặc gấp gọn', 'Để dưới sàn'], a: 1, why: 'Gọn gàng giúp lần sau dễ tìm.' },
        ],
        mission: 'Trong một tuần tự soạn cặp mỗi tối và tự gấp quần áo của mình.',
        parent: 'Giao việc vừa sức, hướng dẫn một lần rồi để con tự làm; chấp nhận lúc đầu chưa hoàn hảo.',
      },
      {
        id: 'an-toan', name: 'An toàn', icon: F('police-officer'),
        goal: 'Tự bảo vệ mình: an toàn giao thông, phòng đuối nước, phòng chống xâm hại, biết số khẩn cấp.',
        tips: ['Ngồi xe máy, xe đạp điện luôn đội mũ bảo hiểm cài quai; đi bộ trên vỉa hè, sang đường ở vạch kẻ, nhìn trái – phải.', 'Không tự xuống ao, hồ, sông khi không có người lớn; thấy bạn đuối nước: hô to gọi người lớn, ném phao hoặc vật nổi, không nhảy xuống cứu.', 'Vùng riêng tư trên cơ thể không ai được chạm; bị chạm hay đe doạ: nói “Không!”, chạy đi, kể ngay với người tin cậy. Số khẩn cấp: 111 (bảo vệ trẻ em), 113 (công an), 114 (cứu hoả), 115 (cấp cứu).'],
        scenarios: [
          { q: 'Bạn rủ em đi tắm sông khi không có người lớn. Em:', opts: ['Đi ngay', 'Từ chối và rủ bạn chơi trò khác, báo người lớn', 'Chỉ lội ở mép'], a: 1, why: 'Không tắm sông, hồ khi không có người lớn trông.' },
          { q: 'Người lạ cho kẹo và rủ đi cùng. Em:', opts: ['Đi theo', 'Nói “Không!”, chạy về chỗ đông người, kể với bố mẹ', 'Nhận kẹo rồi ở lại'], a: 1, why: 'Không đi theo, không nhận quà của người lạ.' },
          { q: 'Thấy khói và lửa trong nhà, em gọi số:', opts: ['113', '114', '115'], a: 1, why: '114 là số cứu hoả; em cũng cần ra ngoài ngay, cúi thấp người tránh khói.' },
        ],
        mission: 'Cùng bố mẹ vẽ “bàn tay tin cậy” (5 ngón = 5 người em tin để kể chuyện) và học thuộc 4 số khẩn cấp.',
        parent: 'Tập tình huống bằng trò chơi đóng vai; nhắc con quy tắc đội mũ bảo hiểm mỗi lần ngồi xe.',
      },
      {
        id: 'quan-ly-thoi-gian', name: 'Quản lý thời gian', icon: F('alarm-clock'),
        goal: 'Lập thời gian biểu, làm việc quan trọng trước, cân bằng học – chơi – nghỉ.',
        tips: ['Viết thời gian biểu, dán ở bàn học.', 'Làm bài tập trước, chơi sau.', 'Đặt hẹn giờ: học 25 phút, nghỉ 5 phút.'],
        scenarios: [
          { q: 'Chiều về có bài tập và muốn xem hoạt hình. Em:', opts: ['Xem hoạt hình đến tối', 'Làm bài tập xong rồi xem một tập', 'Bỏ bài tập'], a: 1, why: 'Việc quan trọng trước, phần thưởng sau.' },
          { q: 'Học lâu thấy mệt, em nên:', opts: ['Cố học tiếp 2 tiếng', 'Nghỉ 5 phút, vươn vai, uống nước', 'Ngủ luôn'], a: 1, why: 'Nghỉ ngắn giúp đầu óc tỉnh táo hơn.' },
          { q: 'Thứ Sáu nộp bài vẽ. Hôm nay thứ Hai. Em:', opts: ['Để tối thứ Năm mới làm', 'Chia mỗi ngày làm một phần', 'Quên luôn'], a: 1, why: 'Chia nhỏ việc lớn giúp không vội và làm tốt hơn.' },
        ],
        mission: 'Tự lập thời gian biểu buổi chiều – tối và làm theo trong 5 ngày; tick vào ô mỗi ngày đã làm đúng.',
        parent: 'Cùng con lập thời gian biểu; dùng đồng hồ hẹn giờ thay vì nhắc liên tục.',
      },
      {
        id: 'tai-chinh', name: 'Tài chính cơ bản', icon: F('purse'),
        goal: 'Phân biệt “cần” và “muốn”, để dành tiền cho mục tiêu, biết chia sẻ.',
        tips: ['“Cần” là thứ phải có (sách vở, đồ ăn); “muốn” là thứ thích có (đồ chơi mới).', 'Ba hũ: Tiêu – Tiết kiệm – Chia sẻ.', 'So sánh giá trước khi mua.'],
        scenarios: [
          { q: 'Thứ nào là “cần”?', opts: ['Vở viết cho năm học', 'Thẻ hình siêu nhân thứ 20', 'Kẹo bông'], a: 0, why: 'Vở là đồ dùng học tập cần thiết.' },
          { q: 'Em muốn mua bộ xếp hình 100 nghìn, đang có 40 nghìn. Em:', opts: ['Đòi bố mẹ mua ngay', 'Để dành tiền mỗi tuần cho đến khi đủ', 'Mượn bạn'], a: 1, why: 'Để dành cho mục tiêu giúp em kiên nhẫn và trân trọng món đồ.' },
          { q: 'Có 10 nghìn tiền thưởng, chia vào 3 hũ hợp lí là:', opts: ['Tiêu hết', 'Tiêu 5, tiết kiệm 4, chia sẻ 1', 'Chia sẻ hết'], a: 1, why: 'Chia vào cả ba hũ để vừa dùng, vừa để dành, vừa giúp người khác.' },
        ],
        mission: 'Làm 3 hũ (Tiêu – Tiết kiệm – Chia sẻ), đặt một mục tiêu để dành và ghi số tiền mỗi tuần.',
        parent: 'Cho con tiền tiêu vặt nhỏ, đều đặn; để con tự quyết và tự chịu kết quả khi tiêu.',
      },
    ],
  },
  {
    id: 'the-chat', no: '06', name: 'Thể chất & sức khỏe', en: 'Physical & Health', tone: '#16a34a', icon: F('person-running'),
    blurb: 'Vận động mỗi ngày, ăn uống đủ chất, giữ vệ sinh và ngủ đủ giấc để khoẻ mạnh, học tốt.',
    skills: [
      {
        id: 'van-dong', name: 'Vận động', icon: F('soccer-ball'),
        goal: 'Vận động ít nhất 60 phút mỗi ngày (cộng dồn), ít ngồi trước màn hình.',
        tips: ['60 phút có thể chia nhỏ: đi bộ, đá bóng, nhảy dây, đạp xe.', 'Mỗi tuần vài buổi chơi vận động mạnh (chạy, bơi có người lớn).', 'Ngồi lâu thì đứng dậy vươn vai, đi lại.'],
        scenarios: [
          { q: 'Mỗi ngày em nên vận động khoảng:', opts: ['5 phút', '60 phút (chia nhiều lần cũng được)', 'Không cần'], a: 1, why: 'Tổ chức Y tế Thế giới khuyên trẻ 5–17 tuổi vận động trung bình 60 phút mỗi ngày.' },
          { q: 'Xem màn hình đã lâu, em nên:', opts: ['Xem tiếp', 'Tắt máy, ra chơi vận động', 'Đổi sang trò khác trên máy'], a: 1, why: 'Giảm thời gian ngồi trước màn hình, tăng vận động.' },
          { q: 'Trước khi chạy, đá bóng, em nên:', opts: ['Khởi động tay chân vài phút', 'Chạy ngay thật nhanh', 'Ăn thật no'], a: 0, why: 'Khởi động giúp tránh chấn thương.' },
        ],
        mission: 'Ghi “nhật kí vận động” 7 ngày: hôm nay em vận động gì, bao nhiêu phút.',
        parent: 'Cùng con vận động cuối tuần (đi bộ, đạp xe); đặt giờ dùng máy rõ ràng.',
      },
      {
        id: 'dinh-duong', name: 'Dinh dưỡng', icon: F('red-apple'),
        goal: 'Ăn đa dạng các nhóm chất, nhiều rau quả, uống đủ nước, hạn chế đồ ngọt.',
        tips: ['Mỗi bữa có cơm/tinh bột, đạm (thịt, cá, trứng, đậu), rau và quả.', 'Uống nước lọc thay nước ngọt.', 'Ăn sáng đầy đủ trước khi đi học.'],
        scenarios: [
          { q: 'Bữa sáng tốt nhất trước khi đi học:', opts: ['Bỏ bữa', 'Bánh mì trứng và sữa', 'Chỉ một gói kẹo'], a: 1, why: 'Đủ tinh bột và đạm giúp em tỉnh táo cả buổi sáng.' },
          { q: 'Khát nước, em nên chọn:', opts: ['Nước lọc', 'Nước ngọt có ga', 'Trà sữa nhiều đường'], a: 0, why: 'Nước lọc tốt nhất; đồ uống nhiều đường không tốt cho răng và cân nặng.' },
          { q: 'Đĩa ăn cân đối có:', opts: ['Chỉ thịt', 'Cơm, thịt/cá, rau xanh và trái cây', 'Chỉ đồ chiên'], a: 1, why: 'Ăn đủ các nhóm chất giúp cơ thể lớn khoẻ.' },
        ],
        mission: 'Trong tuần ăn ít nhất 5 loại rau, củ, quả khác màu nhau và đánh dấu vào bảng.',
        parent: 'Cho con cùng đi chợ, chọn rau quả; hạn chế để sẵn bánh kẹo, nước ngọt trong nhà.',
      },
      {
        id: 've-sinh', name: 'Vệ sinh', icon: F('soap'),
        goal: 'Rửa tay đúng cách, đánh răng, tắm gội, giữ gìn đồ dùng cá nhân sạch sẽ.',
        tips: ['Rửa tay bằng xà phòng: xoa lòng, mu bàn tay, kẽ ngón, đầu ngón, ngón cái, cổ tay — ít nhất 20 giây — rồi xả sạch.', 'Đánh răng 2 lần mỗi ngày, mỗi lần khoảng 2 phút.', 'Rửa tay trước khi ăn, sau khi đi vệ sinh, sau khi chơi.'],
        scenarios: [
          { q: 'Khi nào em cần rửa tay bằng xà phòng?', opts: ['Trước khi ăn và sau khi đi vệ sinh', 'Mỗi tuần một lần', 'Khi tay trông bẩn thôi'], a: 0, why: 'Vi khuẩn không nhìn thấy được, nên rửa tay vào các thời điểm quan trọng.' },
          { q: 'Rửa tay đúng cách cần xoa xà phòng ít nhất:', opts: ['2 giây', '20 giây', 'Không cần xà phòng'], a: 1, why: 'Khoảng 20 giây (hát hết bài “Chúc mừng sinh nhật” hai lần) giúp sạch vi khuẩn.' },
          { q: 'Hắt hơi khi đông người, em:', opts: ['Che bằng khăn giấy hoặc khuỷu tay', 'Hắt thẳng ra ngoài', 'Che bằng lòng bàn tay rồi cầm đồ chơi chung'], a: 0, why: 'Che bằng khuỷu tay/khăn giấy để không lây bệnh cho người khác.' },
        ],
        mission: 'Dán bảng “6 bước rửa tay” ở bồn rửa và tự đánh dấu mỗi lần rửa tay đúng trong một ngày.',
        parent: 'Rửa tay cùng con vài lần đầu; dùng bài hát để con rửa đủ thời gian.',
      },
      {
        id: 'thoi-quen', name: 'Thói quen lành mạnh', icon: F('sleeping-face'),
        goal: 'Ngủ đủ giấc, dậy đúng giờ, ngồi đúng tư thế, giữ thói quen tốt mỗi ngày.',
        tips: ['Trẻ tiểu học cần ngủ khoảng 9–12 tiếng mỗi đêm.', 'Tắt màn hình ít nhất 1 tiếng trước khi ngủ.', 'Ngồi học lưng thẳng, mắt cách vở khoảng 25–30 cm.'],
        scenarios: [
          { q: 'Mai đi học sớm, tối nay em nên:', opts: ['Thức xem phim khuya', 'Đi ngủ đúng giờ', 'Chơi điện tử đến khuya'], a: 1, why: 'Ngủ đủ giúp em khoẻ và tập trung học tốt.' },
          { q: 'Trước khi ngủ em nên:', opts: ['Chơi điện thoại trên giường', 'Đánh răng, đọc sách giấy một chút', 'Ăn kẹo'], a: 1, why: 'Ánh sáng màn hình làm khó ngủ; đọc sách giúp thư giãn.' },
          { q: 'Ngồi viết bài, tư thế đúng là:', opts: ['Cúi sát mặt vào vở', 'Lưng thẳng, mắt cách vở một gang tay rưỡi', 'Nằm bò ra bàn'], a: 1, why: 'Ngồi đúng tư thế bảo vệ mắt và cột sống.' },
        ],
        mission: 'Trong 7 ngày đi ngủ và thức dậy đúng giờ đã hẹn; đánh dấu vào lịch mỗi ngày làm được.',
        parent: 'Giữ giờ ngủ cố định cả nhà; cất thiết bị điện tử ra khỏi phòng ngủ của con.',
      },
    ],
  },
];

export const groupById = (id: string) => SKILL_GROUPS.find((g) => g.id === id);
export const skillById = (gid: string, sid: string) => groupById(gid)?.skills.find((s) => s.id === sid);
