// Teacher English Academy — lộ trình 24 tuần luyện tiếng Anh sư phạm cho giáo viên tiếng Anh tiểu học.
// Nguồn: tài liệu "Teacher English Academy – Lộ trình 24 tuần" (6 giai đoạn × 4 tuần).
// Mỗi bài (1 tuần) có cấu trúc thống nhất: Objectives → Warm-up → Vocabulary → Useful Expressions →
// Listening → Speaking (kèm AI role-play) → Teaching Challenge → Review. Mọi nội dung đều song ngữ [Anh, Việt].

/** Cặp song ngữ: [tiếng Anh, tiếng Việt] */
export type Bi = readonly [en: string, vi: string];
export type VocabItem = { word: string; vi: string; ipa?: string };
export type DialogueLine = { who: string; en: string; vi: string };
export type Lesson = {
  id: string; // 'w01'…'w24'
  week: number;
  stage: number; // 1…6
  title: Bi;
  objectives: Bi[];
  warmUp: Bi;
  vocabulary: VocabItem[];
  expressions: Bi[];
  listening: { scene: Bi; lines: DialogueLine[] };
  speaking: Bi[];
  /** Tình huống đóng vai với AI (ghép vào câu lệnh mẫu) */
  rolePlay: Bi;
  challenge: Bi;
  review: Bi[];
  /** Mốc đánh giá của tuần (nếu có) */
  milestone?: Bi;
};
export type Stage = { no: number; title: Bi; goal: Bi; outcome: Bi; tone: 'blue' | 'green' | 'violet' | 'yellow' | 'coral' | 'red' };

/** Các phần của một bài — dùng để đánh dấu tiến độ */
export const SECTIONS = [
  { key: 'objectives', en: 'Learning Objectives', vi: 'Mục tiêu bài học' },
  { key: 'warmup', en: 'Warm-up', vi: 'Khởi động' },
  { key: 'vocabulary', en: 'Vocabulary', vi: 'Từ vựng trọng tâm' },
  { key: 'expressions', en: 'Useful Expressions', vi: 'Mẫu câu cần nhớ' },
  { key: 'listening', en: 'Listening', vi: 'Nghe hội thoại mẫu' },
  { key: 'speaking', en: 'Speaking & AI Role-play', vi: 'Luyện nói, đóng vai với AI' },
  { key: 'challenge', en: 'Teaching Challenge', vi: 'Thử thách giảng dạy' },
  { key: 'review', en: 'Review & Self-assessment', vi: 'Ôn tập, tự đánh giá' },
] as const;
export type SectionKey = (typeof SECTIONS)[number]['key'];

export const STAGES: Stage[] = [
  { no: 1, tone: 'blue', title: ['Pronunciation & Reflexes', 'Nền tảng phát âm và phản xạ'],
    goal: ['Strengthen pronunciation and build the habit of listen – repeat – respond in English.', 'Củng cố phát âm, hình thành thói quen nghe – nhắc lại – phản hồi bằng tiếng Anh.'],
    outcome: ['Introduce yourself, ask and answer short questions, and read sentences clearly.', 'Giới thiệu bản thân, hỏi đáp ngắn và đọc câu rõ ràng, dễ hiểu.'] },
  { no: 2, tone: 'green', title: ['Everyday Communication', 'Giao tiếp tiếng Anh thông dụng'],
    goal: ['Grow your vocabulary and keep conversations going on familiar topics.', 'Tăng vốn từ và khả năng duy trì hội thoại về các chủ đề quen thuộc.'],
    outcome: ['Hold a 3–5 minute conversation on a familiar topic with follow-up questions.', 'Hội thoại khoảng 3–5 phút về chủ đề quen thuộc, hỏi và trả lời câu hỏi mở rộng.'] },
  { no: 3, tone: 'violet', title: ['Classroom English', 'Tiếng Anh trong lớp học'],
    goal: ['Use English to manage and organise classroom activities.', 'Sử dụng tiếng Anh trong các hoạt động quản lý và tổ chức lớp học.'],
    outcome: ['Run basic classroom routines in English.', 'Điều hành được các hoạt động lớp học cơ bản bằng tiếng Anh.'] },
  { no: 4, tone: 'yellow', title: ['Primary Topics', 'Tiếng Anh theo chủ đề tiểu học'],
    goal: ['Teach and exploit language through topics close to Grade 1–5 pupils.', 'Dạy và khai thác ngôn ngữ theo các chủ đề gần gũi với học sinh lớp 1–5.'],
    outcome: ['Present, practise and check topic vocabulary and patterns in English.', 'Giới thiệu, luyện tập và kiểm tra từ vựng – mẫu câu theo chủ đề bằng tiếng Anh.'] },
  { no: 5, tone: 'coral', title: ['Teaching Methods in English', 'Phương pháp giảng dạy bằng tiếng Anh'],
    goal: ['Combine language skills with active teaching techniques.', 'Kết hợp năng lực ngôn ngữ với kỹ thuật tổ chức hoạt động học tập tích cực.'],
    outcome: ['Design and run a lively activity with a clear language aim.', 'Thiết kế và tổ chức một hoạt động dạy học sinh động, có mục tiêu ngôn ngữ rõ ràng.'] },
  { no: 6, tone: 'red', title: ['Practice & Assessment', 'Thực hành và đánh giá'],
    goal: ['Integrate all skills and show you can teach in English.', 'Tích hợp các kỹ năng và chứng minh khả năng sử dụng tiếng Anh trong lớp học.'],
    outcome: ['A 15–20 minute demo lesson with a short plan and a competence checklist.', 'Một buổi dạy thử 15–20 phút, kèm giáo án ngắn và phiếu đánh giá năng lực.'] },
];

/** Lịch học hằng ngày đề xuất: 60 phút/ngày, 5 ngày/tuần */
export const DAILY_PLAN: { minutes: number; title: Bi; how: Bi }[] = [
  { minutes: 10, title: ['Pronunciation', 'Phát âm'], how: ['Sounds, word stress and intonation', 'Luyện âm, trọng âm và ngữ điệu'] },
  { minutes: 15, title: ['Listening & reflexes', 'Nghe và phản xạ'], how: ['Listen to short clips and answer at once in English', 'Nghe đoạn ngắn, trả lời ngay bằng tiếng Anh'] },
  { minutes: 10, title: ['Useful expressions', 'Học mẫu câu'], how: ['Learn 5–10 sentences for one situation', 'Học 5–10 câu theo một tình huống'] },
  { minutes: 15, title: ['Conversation practice', 'Thực hành hội thoại'], how: ['Role-play, Q&A or practise with AI', 'Đóng vai, hỏi đáp hoặc luyện với AI'] },
  { minutes: 10, title: ['Teaching practice', 'Thực hành giảng dạy'], how: ['Simulate one classroom activity', 'Giả lập một hoạt động lớp học'] },
];
export const WEEK_PLAN: Bi[] = [
  ['Monday: new topic, vocabulary and patterns', 'Thứ Hai: học chủ đề mới, từ vựng và mẫu câu'],
  ['Tuesday: listening and pronunciation', 'Thứ Ba: nghe hiểu và luyện phát âm'],
  ['Wednesday: conversation and reflexes', 'Thứ Tư: hội thoại và phản xạ'],
  ['Thursday: Classroom English or teaching methods', 'Thứ Năm: Classroom English hoặc phương pháp dạy học'],
  ['Friday: integrated practice, recording and self-assessment', 'Thứ Sáu: thực hành tổng hợp, ghi âm và tự đánh giá'],
];
/** Thang đánh giá thực hành 1–4 */
export const RATING_SCALE: { level: 1 | 2 | 3 | 4; title: Bi; desc: Bi }[] = [
  { level: 1, title: ['Needs a lot of support', 'Cần hỗ trợ nhiều'], desc: ['Cannot do the task without frequent prompts.', 'Chưa thể thực hiện nhiệm vụ nếu không có gợi ý thường xuyên.'] },
  { level: 2, title: ['Developing', 'Đang phát triển'], desc: ['Does part of the task; still hesitant or makes errors that block understanding.', 'Thực hiện được một phần, còn ngập ngừng hoặc mắc lỗi gây khó hiểu.'] },
  { level: 3, title: ['Meets expectations', 'Đạt yêu cầu'], desc: ['Completes the task; expresses ideas fairly clearly and appropriately.', 'Hoàn thành nhiệm vụ, diễn đạt tương đối rõ và phù hợp.'] },
  { level: 4, title: ['Good', 'Tốt'], desc: ['Natural and flexible; adapts language to the pupils.', 'Diễn đạt tự nhiên, linh hoạt, biết điều chỉnh ngôn ngữ theo học sinh.'] },
];
/** Trọng số đánh giá năng lực */
export const WEIGHTS: { title: Bi; pct: number }[] = [
  { title: ['Pronunciation & intonation', 'Phát âm và ngữ điệu'], pct: 20 },
  { title: ['Listening comprehension', 'Nghe hiểu'], pct: 15 },
  { title: ['Communicative reflexes', 'Phản xạ giao tiếp'], pct: 20 },
  { title: ['Vocabulary & expressions', 'Vốn từ và mẫu câu'], pct: 15 },
  { title: ['Classroom English', 'Tiếng Anh trong lớp học'], pct: 15 },
  { title: ['Teaching skills', 'Kỹ năng giảng dạy'], pct: 15 },
];
/** Nguyên tắc cốt lõi */
export const PRINCIPLES: Bi[] = [
  ['Learn to use: link every item to a real situation or teaching task.', 'Học để sử dụng: mỗi kiến thức gắn với một tình huống giao tiếp hoặc nhiệm vụ giảng dạy.'],
  ['Listen first, speak next, practise constantly.', 'Nghe trước, nói sau, thực hành liên tục.'],
  ['Learn by situation: the language you really need in class.', 'Học theo tình huống: ưu tiên ngôn ngữ thực sự cần khi đứng lớp.'],
  ['Purposeful repetition in many contexts.', 'Lặp lại có chủ đích trong nhiều ngữ cảnh.'],
  ['Specific feedback: what is wrong, how to fix it, say it again.', 'Phản hồi cụ thể: chỉ rõ lỗi, cách sửa và cơ hội nói lại.'],
  ['Keep it short, clear, positive and age-appropriate.', 'Ngắn gọn, rõ ràng, tích cực, phù hợp lứa tuổi.'],
];
/** Công cụ hỗ trợ (chỉ gợi ý, không gắn liên kết ngoài) */
export const TOOLS_HINT: { name: string; role: Bi }[] = [
  { name: 'AI voice chat', role: ['Plays a pupil, parent or colleague; corrects you gently.', 'Đóng vai học sinh, phụ huynh, đồng nghiệp; sửa lỗi nhẹ nhàng.'] },
  { name: 'Pronunciation apps', role: ['Feedback on individual sounds and stress.', 'Phản hồi về âm và trọng âm.'] },
  { name: 'YouGlish', role: ['Hear words and phrases in real contexts.', 'Nghe từ, cụm từ trong ngữ cảnh thực tế.'] },
  { name: 'BBC Learning English', role: ['Graded listening practice.', 'Luyện nghe theo cấp độ.'] },
  { name: 'Flashcards (Quizlet…)', role: ['Review words and classroom expressions.', 'Ôn từ vựng và mẫu câu.'] },
];

const L = (lesson: Lesson) => lesson;

export const LESSONS: Lesson[] = [
  // ───────────── Giai đoạn 1 — Phát âm và phản xạ ─────────────
  L({
    id: 'w01', week: 1, stage: 1, title: ['The sounds of English & IPA', 'Âm tiếng Anh và bảng phiên âm IPA'],
    milestone: ['Entry check: pronunciation, listening, speaking and vocabulary.', 'Kiểm tra đầu vào: phát âm, nghe, nói và vốn từ.'],
    objectives: [
      ['Read basic IPA symbols in a dictionary entry.', 'Đọc được các ký hiệu IPA cơ bản trong từ điển.'],
      ['Tell short and long vowels apart (ship / sheep).', 'Phân biệt nguyên âm ngắn và dài (ship / sheep).'],
      ['Check pronunciation with an audio dictionary.', 'Tự kiểm tra phát âm bằng từ điển có âm thanh.'],
    ],
    warmUp: ['Say five classroom words you use every day. Which one is hardest to pronounce?', 'Nói 5 từ bạn dùng hằng ngày trên lớp. Từ nào khó phát âm nhất?'],
    vocabulary: [
      { word: 'ship', vi: 'con tàu', ipa: '/ʃɪp/' }, { word: 'sheep', vi: 'con cừu', ipa: '/ʃiːp/' },
      { word: 'full', vi: 'đầy, no', ipa: '/fʊl/' }, { word: 'fool', vi: 'kẻ ngốc', ipa: '/fuːl/' },
      { word: 'cat', vi: 'con mèo', ipa: '/kæt/' }, { word: 'cut', vi: 'cắt', ipa: '/kʌt/' },
      { word: 'pen', vi: 'bút mực', ipa: '/pen/' }, { word: 'pan', vi: 'cái chảo', ipa: '/pæn/' },
    ],
    expressions: [
      ['How do you pronounce this word?', 'Từ này phát âm thế nào?'],
      ['Can you say that again, please?', 'Bạn nói lại được không?'],
      ['Listen and repeat.', 'Nghe và nhắc lại.'],
      ['Is it a long or a short sound?', 'Đó là âm dài hay âm ngắn?'],
      ['Let me check the dictionary.', 'Để tôi tra từ điển.'],
    ],
    listening: { scene: ['Two teachers practise vowels in the staff room.', 'Hai giáo viên luyện nguyên âm ở phòng giáo viên.'], lines: [
      { who: 'A', en: 'Is this word "ship" or "sheep"?', vi: 'Từ này là "ship" hay "sheep"?' },
      { who: 'B', en: 'It is "sheep". The vowel is long: /iː/.', vi: 'Là "sheep". Nguyên âm dài: /iː/.' },
      { who: 'A', en: 'Sheep, sheep. Is that right?', vi: 'Sheep, sheep. Như vậy đúng chưa?' },
      { who: 'B', en: 'Yes, perfect! Now try "ship" with a short sound.', vi: 'Đúng rồi! Giờ thử "ship" với âm ngắn nhé.' },
    ] },
    speaking: [
      ['Read the minimal pairs aloud: ship – sheep, full – fool, cat – cut.', 'Đọc to các cặp âm tối thiểu: ship – sheep, full – fool, cat – cut.'],
      ['Record yourself reading 10 words, then compare with the audio dictionary.', 'Ghi âm 10 từ rồi so với từ điển có âm thanh.'],
    ],
    rolePlay: ['You are a pupil who mixes up "ship" and "sheep". I will help you say them correctly.', 'Bạn là học sinh hay nhầm "ship" và "sheep". Tôi sẽ giúp bạn nói đúng.'],
    challenge: ['Plan a 3-minute "Sound game" for Grade 3: pupils stand up for a long sound and sit down for a short sound.', 'Thiết kế trò chơi âm 3 phút cho lớp 3: học sinh đứng lên khi nghe âm dài, ngồi xuống khi nghe âm ngắn.'],
    review: [
      ['Which word has a long vowel: "bit" or "beat"?', 'Từ nào có nguyên âm dài: "bit" hay "beat"?'],
      ['Write the IPA for one word you often mispronounce.', 'Viết phiên âm IPA của một từ bạn hay phát âm sai.'],
      ['Which sound do you need to practise most this week?', 'Tuần này bạn cần luyện âm nào nhất?'],
    ],
  }),
  L({
    id: 'w02', week: 2, stage: 1, title: ['Tricky consonants & ending sounds', 'Phụ âm dễ nhầm và âm cuối'],
    objectives: [
      ['Pronounce final /s/, /z/, /t/, /d/ clearly.', 'Phát âm rõ âm cuối /s/, /z/, /t/, /d/.'],
      ['Use the three endings of plural -s and past -ed.', 'Dùng đúng ba cách đọc đuôi -s số nhiều và -ed quá khứ.'],
      ['Distinguish /θ/ – /s/, /ʃ/ – /s/, /v/ – /b/.', 'Phân biệt /θ/ – /s/, /ʃ/ – /s/, /v/ – /b/.'],
    ],
    warmUp: ['Count the objects on your desk aloud: one book, two books… Do you hear the final sound?', 'Đếm to đồ vật trên bàn: one book, two books… Bạn có nghe rõ âm cuối không?'],
    vocabulary: [
      { word: 'books', vi: 'những quyển sách', ipa: '/bʊks/' }, { word: 'pens', vi: 'những cây bút', ipa: '/penz/' },
      { word: 'boxes', vi: 'những cái hộp', ipa: '/ˈbɒksɪz/' }, { word: 'played', vi: 'đã chơi', ipa: '/pleɪd/' },
      { word: 'watched', vi: 'đã xem', ipa: '/wɒtʃt/' }, { word: 'wanted', vi: 'đã muốn', ipa: '/ˈwɒntɪd/' },
      { word: 'three', vi: 'số ba', ipa: '/θriː/' }, { word: 'very', vi: 'rất', ipa: '/ˈveri/' },
    ],
    expressions: [
      ['Don\'t forget the ending sound.', 'Đừng quên âm cuối nhé.'],
      ['Say it slowly, then say it fast.', 'Nói chậm trước, rồi nói nhanh.'],
      ['Put your tongue between your teeth: /θ/.', 'Đặt lưỡi giữa hai hàm răng: /θ/.'],
      ['Bite your bottom lip gently: /v/.', 'Cắn nhẹ môi dưới: /v/.'],
      ['Can you hear the difference?', 'Các em có nghe ra sự khác nhau không?'],
    ],
    listening: { scene: ['A teacher helps a pupil with plural endings.', 'Giáo viên giúp học sinh đọc đuôi số nhiều.'], lines: [
      { who: 'T', en: 'How many pencils do you have?', vi: 'Em có bao nhiêu cây bút chì?' },
      { who: 'S', en: 'I have three pencil.', vi: 'Em có ba cây bút chì.' },
      { who: 'T', en: 'Three pencil-s. Listen: pencils /z/. Say it again.', vi: 'Three pencil-s. Nghe nhé: pencils /z/. Em nói lại nào.' },
      { who: 'S', en: 'I have three pencils.', vi: 'Em có ba cây bút chì.' },
      { who: 'T', en: 'Great ending sound! Well done.', vi: 'Âm cuối rất tốt! Giỏi lắm.' },
    ] },
    speaking: [
      ['Sort these into /s/, /z/, /ɪz/: cats, dogs, buses, maps, toys, watches.', 'Xếp vào /s/, /z/, /ɪz/: cats, dogs, buses, maps, toys, watches.'],
      ['Tell a partner three things you did yesterday using -ed verbs.', 'Kể với bạn ba việc hôm qua đã làm, dùng động từ đuôi -ed.'],
    ],
    rolePlay: ['You are a Grade 4 pupil telling me about your weekend. You often drop ending sounds; I will correct you gently.', 'Bạn là học sinh lớp 4 kể về cuối tuần, hay bỏ âm cuối; tôi sẽ sửa nhẹ nhàng.'],
    challenge: ['Prepare a "Sound basket" activity: three baskets labelled /s/, /z/, /ɪz/; pupils throw picture cards into the right basket.', 'Chuẩn bị hoạt động "Giỏ âm": ba giỏ /s/, /z/, /ɪz/; học sinh ném thẻ tranh vào đúng giỏ.'],
    review: [
      ['How do you pronounce the -ed in "wanted", "played", "watched"?', 'Đuôi -ed trong "wanted", "played", "watched" đọc thế nào?'],
      ['Say "three" and "tree". What changes in your mouth?', 'Nói "three" và "tree". Khẩu hình thay đổi ra sao?'],
      ['Note one ending sound you still drop.', 'Ghi lại một âm cuối bạn vẫn hay bỏ.'],
    ],
  }),
  L({
    id: 'w03', week: 3, stage: 1, title: ['Word stress, rhythm & intonation', 'Trọng âm, nhịp điệu và ngữ điệu'],
    objectives: [
      ['Put stress on the right syllable in common classroom words.', 'Nhấn đúng trọng âm các từ thường dùng trên lớp.'],
      ['Use rising intonation for Yes/No questions and falling for Wh- questions.', 'Lên giọng ở câu hỏi Yes/No, xuống giọng ở câu hỏi Wh-.'],
      ['Link words naturally: "Pick it up", "Look at it".', 'Nối âm tự nhiên: "Pick it up", "Look at it".'],
    ],
    warmUp: ['Clap the syllables of your pupils\' favourite words: ba-NA-na, ELE-phant, comPUter.', 'Vỗ tay theo âm tiết các từ học sinh thích: ba-NA-na, ELE-phant, comPUter.'],
    vocabulary: [
      { word: 'banana', vi: 'quả chuối', ipa: '/bəˈnɑːnə/' }, { word: 'elephant', vi: 'con voi', ipa: '/ˈelɪfənt/' },
      { word: 'computer', vi: 'máy tính', ipa: '/kəmˈpjuːtə/' }, { word: 'activity', vi: 'hoạt động', ipa: '/ækˈtɪvəti/' },
      { word: 'exercise', vi: 'bài tập', ipa: '/ˈeksəsaɪz/' }, { word: 'understand', vi: 'hiểu', ipa: '/ˌʌndəˈstænd/' },
      { word: 'favourite', vi: 'yêu thích nhất', ipa: '/ˈfeɪvərɪt/' }, { word: 'together', vi: 'cùng nhau', ipa: '/təˈɡeðə/' },
    ],
    expressions: [
      ['Do you like bananas? ↗', 'Em có thích chuối không? (lên giọng)'],
      ['What\'s your favourite colour? ↘', 'Màu em thích nhất là gì? (xuống giọng)'],
      ['Pick it up, please.', 'Em nhặt nó lên nhé.'],
      ['Look at it carefully.', 'Nhìn kỹ nó nhé.'],
      ['Let\'s say it together.', 'Chúng ta cùng nói nào.'],
    ],
    listening: { scene: ['A teacher drills a question with the class.', 'Giáo viên luyện câu hỏi với cả lớp.'], lines: [
      { who: 'T', en: 'Listen: Do you like elephants?', vi: 'Nghe nhé: Em có thích voi không?' },
      { who: 'Class', en: 'Do you like elephants?', vi: 'Em có thích voi không?' },
      { who: 'T', en: 'Good. My voice goes up at the end. Again!', vi: 'Tốt. Giọng cô lên ở cuối câu. Lần nữa nào!' },
      { who: 'Class', en: 'Do you like elephants?', vi: 'Em có thích voi không?' },
      { who: 'T', en: 'Excellent! Now answer: Yes, I do.', vi: 'Xuất sắc! Giờ trả lời: Yes, I do.' },
    ] },
    speaking: [
      ['Mark the stress of 10 words from your textbook unit, then read them aloud.', 'Đánh dấu trọng âm 10 từ trong bài sách giáo khoa rồi đọc to.'],
      ['Ask a partner five questions: two Yes/No (↗) and three Wh- (↘).', 'Hỏi bạn năm câu: hai câu Yes/No (↗) và ba câu Wh- (↘).'],
    ],
    rolePlay: ['You are a Grade 3 pupil. Ask me "Do you like…?" questions and I will answer; tell me if my intonation sounds natural.', 'Bạn là học sinh lớp 3. Hỏi tôi "Do you like…?" và tôi trả lời; hãy nhận xét ngữ điệu của tôi.'],
    challenge: ['Teach a chant with clear stress: "Ap-ple, ap-ple, red and round" — use claps to show the beat.', 'Dạy một bài vè có trọng âm rõ: "Ap-ple, ap-ple, red and round" — vỗ tay theo nhịp.'],
    review: [
      ['Where is the stress in "computer" and "elephant"?', 'Trọng âm của "computer" và "elephant" ở đâu?'],
      ['Does your voice go up or down in "What\'s your name?"', 'Câu "What\'s your name?" lên hay xuống giọng?'],
      ['Record one chant and listen for the beat.', 'Ghi âm một bài vè và nghe lại nhịp.'],
    ],
  }),
  L({
    id: 'w04', week: 4, stage: 1, title: ['Introducing yourself & quick replies', 'Giới thiệu bản thân và phản xạ nhanh'],
    milestone: ['Checkpoint: pronunciation and basic communication.', 'Mốc đánh giá: phát âm và giao tiếp cơ bản.'],
    objectives: [
      ['Introduce yourself in 1 minute: name, school, job, hobbies.', 'Giới thiệu bản thân trong 1 phút: tên, trường, công việc, sở thích.'],
      ['Answer short personal questions without translating word by word.', 'Trả lời câu hỏi cá nhân ngắn mà không dịch từng từ.'],
      ['Respond quickly with natural fillers: "Well…", "Let me think…".', 'Phản hồi nhanh với từ đệm tự nhiên: "Well…", "Let me think…".'],
    ],
    warmUp: ['Tell yourself three facts about you in English in 20 seconds.', 'Nói ba điều về bản thân bằng tiếng Anh trong 20 giây.'],
    vocabulary: [
      { word: 'primary school', vi: 'trường tiểu học' }, { word: 'homeroom teacher', vi: 'giáo viên chủ nhiệm' },
      { word: 'colleague', vi: 'đồng nghiệp' }, { word: 'experience', vi: 'kinh nghiệm' },
      { word: 'hobby', vi: 'sở thích' }, { word: 'hometown', vi: 'quê nhà' },
      { word: 'grade', vi: 'khối lớp' }, { word: 'subject', vi: 'môn học' },
    ],
    expressions: [
      ['Hi, I\'m… I teach English at… Primary School.', 'Xin chào, tôi là… Tôi dạy tiếng Anh ở trường Tiểu học…'],
      ['I\'ve been teaching for… years.', 'Tôi đã dạy được… năm.'],
      ['I teach Grades 3 to 5.', 'Tôi dạy các khối 3 đến 5.'],
      ['In my free time, I like…', 'Lúc rảnh, tôi thích…'],
      ['Nice to meet you. And you?', 'Rất vui được gặp bạn. Còn bạn thì sao?'],
    ],
    listening: { scene: ['Two teachers meet at a training workshop.', 'Hai giáo viên gặp nhau ở buổi tập huấn.'], lines: [
      { who: 'A', en: 'Hi, I\'m Lan. I teach English at Hoa Sen Primary School.', vi: 'Chào bạn, mình là Lan. Mình dạy tiếng Anh ở trường Tiểu học Hoa Sen.' },
      { who: 'B', en: 'Nice to meet you, Lan. I\'m Minh. Which grades do you teach?', vi: 'Rất vui được gặp bạn, Lan. Mình là Minh. Bạn dạy khối nào?' },
      { who: 'A', en: 'Grades 3 and 4. How about you?', vi: 'Khối 3 và 4. Còn bạn?' },
      { who: 'B', en: 'I teach Grade 1. The children are very lively!', vi: 'Mình dạy lớp 1. Các bé rất hiếu động!' },
    ] },
    speaking: [
      ['Record a 1-minute self-introduction and listen for clarity.', 'Ghi âm phần giới thiệu bản thân 1 phút và nghe lại độ rõ ràng.'],
      ['Answer 10 rapid questions from a partner (name, school, hobbies…) in under 3 seconds each.', 'Trả lời 10 câu hỏi nhanh của bạn (tên, trường, sở thích…), mỗi câu dưới 3 giây.'],
    ],
    rolePlay: ['You are a new colleague from another school. Ask me about my job and my class.', 'Bạn là đồng nghiệp mới ở trường khác. Hãy hỏi tôi về công việc và lớp tôi dạy.'],
    challenge: ['Introduce yourself to a Grade 1 class in 30 seconds using very simple words and gestures.', 'Tự giới thiệu với lớp 1 trong 30 giây, dùng từ rất đơn giản và cử chỉ.'],
    review: [
      ['Which question was hardest to answer quickly?', 'Câu hỏi nào bạn khó trả lời nhanh nhất?'],
      ['Change one sentence of your introduction for a Grade 1 audience.', 'Đổi một câu trong phần giới thiệu cho phù hợp học sinh lớp 1.'],
      ['Rate your stage 1 pronunciation on the 1–4 scale.', 'Tự chấm phát âm giai đoạn 1 theo thang 1–4.'],
    ],
  }),
  // ───────────── Giai đoạn 2 — Giao tiếp thông dụng ─────────────
  L({
    id: 'w05', week: 5, stage: 2, title: ['Family, school & work', 'Gia đình, trường học và công việc'],
    objectives: [
      ['Talk about your family, school and job for 2 minutes.', 'Nói về gia đình, trường và công việc trong 2 phút.'],
      ['Use present simple accurately (he teaches, she works).', 'Dùng đúng thì hiện tại đơn (he teaches, she works).'],
      ['Ask follow-up questions to show interest.', 'Đặt câu hỏi nối tiếp để thể hiện sự quan tâm.'],
    ],
    warmUp: ['Draw a quick family tree and name each person in English.', 'Vẽ nhanh cây gia đình và gọi tên từng người bằng tiếng Anh.'],
    vocabulary: [
      { word: 'parents', vi: 'bố mẹ' }, { word: 'siblings', vi: 'anh chị em ruột' }, { word: 'principal', vi: 'hiệu trưởng' },
      { word: 'staff room', vi: 'phòng giáo viên' }, { word: 'timetable', vi: 'thời khoá biểu' }, { word: 'workload', vi: 'khối lượng công việc' },
      { word: 'meeting', vi: 'cuộc họp' }, { word: 'lesson plan', vi: 'giáo án' },
    ],
    expressions: [
      ['There are four people in my family.', 'Gia đình tôi có bốn người.'],
      ['My husband / wife works as a…', 'Chồng / vợ tôi làm nghề…'],
      ['My school has about 800 pupils.', 'Trường tôi có khoảng 800 học sinh.'],
      ['I usually teach five lessons a day.', 'Tôi thường dạy năm tiết một ngày.'],
      ['Really? Tell me more about it.', 'Thật à? Kể thêm cho tôi nghe đi.'],
    ],
    listening: { scene: ['Colleagues chat during break time.', 'Đồng nghiệp trò chuyện giờ ra chơi.'], lines: [
      { who: 'A', en: 'How many classes do you teach this year?', vi: 'Năm nay bạn dạy bao nhiêu lớp?' },
      { who: 'B', en: 'Eight classes. It\'s a heavy workload, but I love it.', vi: 'Tám lớp. Công việc khá nặng nhưng mình thích.' },
      { who: 'A', en: 'Does your school have an English club?', vi: 'Trường bạn có câu lạc bộ tiếng Anh không?' },
      { who: 'B', en: 'Yes, it meets every Friday afternoon.', vi: 'Có, sinh hoạt vào chiều thứ Sáu hằng tuần.' },
    ] },
    speaking: [
      ['Describe your school in 6 sentences: size, rooms, pupils, teachers, clubs, what you like.', 'Tả trường bạn trong 6 câu: quy mô, phòng học, học sinh, giáo viên, câu lạc bộ, điều bạn thích.'],
      ['Interview a partner about their family and ask two follow-up questions.', 'Phỏng vấn bạn về gia đình và hỏi thêm hai câu nối tiếp.'],
    ],
    rolePlay: ['You are a parent at a school open day. Ask me about the school and the English programme.', 'Bạn là phụ huynh ngày hội trường. Hãy hỏi tôi về trường và chương trình tiếng Anh.'],
    challenge: ['Show your own family photo to Grade 3 and model: "This is my mother. She\'s a nurse."', 'Cho lớp 3 xem ảnh gia đình bạn và làm mẫu: "This is my mother. She\'s a nurse."'],
    review: [
      ['Correct: "My father work in a bank."', 'Sửa câu: "My father work in a bank."'],
      ['Write two follow-up questions you can use often.', 'Viết hai câu hỏi nối tiếp bạn có thể dùng thường xuyên.'],
      ['Which new word will you use with pupils?', 'Từ mới nào bạn sẽ dùng với học sinh?'],
    ],
  }),
  L({
    id: 'w06', week: 6, stage: 2, title: ['Daily routines, time & weekends', 'Thói quen hằng ngày, thời gian và cuối tuần'],
    objectives: [
      ['Tell the time and describe your daily routine.', 'Nói giờ và mô tả thói quen hằng ngày.'],
      ['Use adverbs of frequency: always, usually, sometimes, never.', 'Dùng trạng từ tần suất: always, usually, sometimes, never.'],
      ['Talk about past weekends with simple past.', 'Kể về cuối tuần đã qua bằng thì quá khứ đơn.'],
    ],
    warmUp: ['Say what you were doing at 6 a.m., 9 a.m. and 9 p.m. yesterday.', 'Nói hôm qua bạn làm gì lúc 6 giờ sáng, 9 giờ sáng và 9 giờ tối.'],
    vocabulary: [
      { word: 'get up', vi: 'thức dậy' }, { word: 'have breakfast', vi: 'ăn sáng' }, { word: 'go to work', vi: 'đi làm' },
      { word: 'mark homework', vi: 'chấm bài' }, { word: 'quarter past', vi: 'hơn mười lăm phút' }, { word: 'half past', vi: 'rưỡi' },
      { word: 'usually', vi: 'thường thường' }, { word: 'weekend', vi: 'cuối tuần' },
    ],
    expressions: [
      ['What time do you usually get up?', 'Bạn thường dậy lúc mấy giờ?'],
      ['I always arrive at school at a quarter to seven.', 'Tôi luôn đến trường lúc 6 giờ 45.'],
      ['I sometimes mark homework in the evening.', 'Thỉnh thoảng tôi chấm bài vào buổi tối.'],
      ['What did you do last weekend?', 'Cuối tuần trước bạn làm gì?'],
      ['I visited my parents in my hometown.', 'Tôi về thăm bố mẹ ở quê.'],
    ],
    listening: { scene: ['A teacher asks pupils about their routine.', 'Giáo viên hỏi học sinh về thói quen hằng ngày.'], lines: [
      { who: 'T', en: 'What time do you go to bed, Nam?', vi: 'Nam đi ngủ lúc mấy giờ?' },
      { who: 'S', en: 'At nine o\'clock.', vi: 'Lúc chín giờ ạ.' },
      { who: 'T', en: 'Great. Do you always brush your teeth before bed?', vi: 'Tốt lắm. Em có luôn đánh răng trước khi ngủ không?' },
      { who: 'S', en: 'Yes, I always do!', vi: 'Có ạ, em luôn đánh răng!' },
    ] },
    speaking: [
      ['Describe a typical school day from morning to night (8–10 sentences).', 'Tả một ngày đi dạy điển hình từ sáng đến tối (8–10 câu).'],
      ['Tell a partner about last weekend; partner asks "And then?" after each sentence.', 'Kể với bạn về cuối tuần trước; bạn hỏi "And then?" sau mỗi câu.'],
    ],
    rolePlay: ['You are a Grade 4 pupil. I ask about your day; answer with simple sentences and ask me one question back.', 'Bạn là học sinh lớp 4. Tôi hỏi về một ngày của bạn; trả lời câu đơn giản và hỏi lại tôi một câu.'],
    challenge: ['Use a toy clock to teach "What time is it? It\'s … o\'clock." and play "What\'s the time, Mr Wolf?".', 'Dùng đồng hồ đồ chơi dạy "What time is it? It\'s … o\'clock." và chơi "What\'s the time, Mr Wolf?".'],
    review: [
      ['Put in order: never – usually – always – sometimes.', 'Sắp xếp: never – usually – always – sometimes.'],
      ['Say 7:15, 7:30 and 7:45 in two ways.', 'Nói 7:15, 7:30 và 7:45 theo hai cách.'],
      ['Which past verb did you get wrong?', 'Động từ quá khứ nào bạn dùng sai?'],
    ],
  }),
  L({
    id: 'w07', week: 7, stage: 2, title: ['Describing people, things & places', 'Mô tả người, đồ vật và địa điểm'],
    objectives: [
      ['Describe appearance and personality.', 'Mô tả ngoại hình và tính cách.'],
      ['Describe objects by size, colour, shape and use.', 'Mô tả đồ vật theo kích thước, màu, hình dạng, công dụng.'],
      ['Describe places with "There is / There are" and prepositions.', 'Mô tả địa điểm với "There is / There are" và giới từ.'],
    ],
    warmUp: ['Look around the room. Describe one object without naming it; can a partner guess?', 'Nhìn quanh phòng. Tả một đồ vật mà không nói tên; bạn có đoán được không?'],
    vocabulary: [
      { word: 'tall / short', vi: 'cao / thấp' }, { word: 'curly hair', vi: 'tóc xoăn' }, { word: 'friendly', vi: 'thân thiện' },
      { word: 'round', vi: 'tròn' }, { word: 'square', vi: 'vuông' }, { word: 'next to', vi: 'bên cạnh' },
      { word: 'in front of', vi: 'phía trước' }, { word: 'behind', vi: 'phía sau' },
    ],
    expressions: [
      ['She\'s tall and she has long black hair.', 'Cô ấy cao và có mái tóc đen dài.'],
      ['He\'s kind and very funny.', 'Anh ấy tốt bụng và rất vui tính.'],
      ['It\'s small, round and red. You can eat it.', 'Nó nhỏ, tròn, màu đỏ. Bạn có thể ăn được.'],
      ['There\'s a library next to the playground.', 'Có một thư viện cạnh sân chơi.'],
      ['What does it look like?', 'Nó trông như thế nào?'],
    ],
    listening: { scene: ['Pupils play "Guess who?" with the teacher.', 'Học sinh chơi "Đoán xem là ai?" với giáo viên.'], lines: [
      { who: 'T', en: 'This person is short. She has curly hair. She\'s wearing a pink dress.', vi: 'Người này thấp. Bạn ấy có tóc xoăn. Bạn ấy mặc váy hồng.' },
      { who: 'S', en: 'Is it Mai?', vi: 'Có phải bạn Mai không ạ?' },
      { who: 'T', en: 'No, it isn\'t. She\'s sitting next to the window.', vi: 'Không phải. Bạn ấy ngồi cạnh cửa sổ.' },
      { who: 'S', en: 'It\'s Linh!', vi: 'Là bạn Linh!' },
      { who: 'T', en: 'Yes! Well done.', vi: 'Đúng rồi! Giỏi lắm.' },
    ] },
    speaking: [
      ['Describe your classroom in 6 sentences with There is / There are.', 'Tả lớp học của bạn trong 6 câu với There is / There are.'],
      ['Describe a colleague (appearance + personality) for a partner to guess.', 'Tả một đồng nghiệp (ngoại hình + tính cách) để bạn đoán.'],
    ],
    rolePlay: ['You are a Grade 5 pupil who lost a school bag. Answer my questions so I can find it.', 'Bạn là học sinh lớp 5 bị mất cặp. Trả lời câu hỏi của tôi để tôi tìm giúp.'],
    challenge: ['Plan a "Mystery bag" game: pupils touch an object in a bag and describe it before guessing.', 'Thiết kế trò "Túi bí ẩn": học sinh sờ đồ vật trong túi, mô tả rồi đoán.'],
    review: [
      ['Order the adjectives: a (red / big / round) ball.', 'Sắp xếp tính từ: a (red / big / round) ball.'],
      ['Write three prepositions of place with an example each.', 'Viết ba giới từ chỉ vị trí, mỗi từ một ví dụ.'],
      ['Which describing word is new to you?', 'Từ miêu tả nào mới với bạn?'],
    ],
  }),
  L({
    id: 'w08', week: 8, stage: 2, title: ['Questions & keeping a conversation going', 'Đặt câu hỏi và duy trì hội thoại'],
    milestone: ['Checkpoint: a 3–5 minute conversation on a familiar topic.', 'Mốc đánh giá: hội thoại 3–5 phút theo chủ đề quen thuộc.'],
    objectives: [
      ['Form Wh- and Yes/No questions correctly.', 'Đặt đúng câu hỏi Wh- và Yes/No.'],
      ['Ask for repetition and clarification politely.', 'Lịch sự đề nghị nhắc lại và làm rõ.'],
      ['Keep a conversation going for 3–5 minutes.', 'Duy trì hội thoại 3–5 phút.'],
    ],
    warmUp: ['Make as many questions as you can about a photo in 1 minute.', 'Đặt càng nhiều câu hỏi càng tốt về một bức ảnh trong 1 phút.'],
    vocabulary: [
      { word: 'clarify', vi: 'làm rõ' }, { word: 'repeat', vi: 'nhắc lại' }, { word: 'confirm', vi: 'xác nhận' },
      { word: 'follow-up question', vi: 'câu hỏi nối tiếp' }, { word: 'actually', vi: 'thật ra' }, { word: 'by the way', vi: 'nhân tiện' },
      { word: 'exactly', vi: 'chính xác' }, { word: 'I see', vi: 'tôi hiểu rồi' },
    ],
    expressions: [
      ['Sorry, could you say that again?', 'Xin lỗi, bạn nói lại được không?'],
      ['Do you mean…?', 'Ý bạn là… phải không?'],
      ['So you\'re saying that…, right?', 'Vậy ý bạn là…, đúng không?'],
      ['That\'s interesting. Why do you think so?', 'Thú vị đấy. Sao bạn nghĩ vậy?'],
      ['What about you?', 'Còn bạn thì sao?'],
    ],
    listening: { scene: ['Two teachers plan a school event.', 'Hai giáo viên lên kế hoạch cho sự kiện của trường.'], lines: [
      { who: 'A', en: 'When is the English festival?', vi: 'Ngày hội tiếng Anh tổ chức khi nào?' },
      { who: 'B', en: 'On the twenty-third.', vi: 'Ngày hai mươi ba.' },
      { who: 'A', en: 'Sorry, do you mean the thirteenth or the thirtieth?', vi: 'Xin lỗi, ý bạn là ngày mười ba hay ba mươi?' },
      { who: 'B', en: 'Neither — the twenty-third, next Friday.', vi: 'Không phải — ngày hai mươi ba, thứ Sáu tuần sau.' },
      { who: 'A', en: 'I see. What will Grade 5 perform?', vi: 'Mình hiểu rồi. Khối 5 sẽ biểu diễn gì?' },
    ] },
    speaking: [
      ['Talk for 4 minutes with a partner about hobbies; each of you must ask 3 follow-up questions.', 'Nói 4 phút với bạn về sở thích; mỗi người phải hỏi 3 câu nối tiếp.'],
      ['Turn statements into questions: "She lives in Hue." → "Where does she live?"', 'Chuyển câu kể thành câu hỏi: "She lives in Hue." → "Where does she live?"'],
    ],
    rolePlay: ['You are a foreign visitor at my school. Talk with me for 4 minutes; speak a little fast so I practise asking for clarification.', 'Bạn là khách nước ngoài thăm trường. Nói chuyện 4 phút, nói hơi nhanh để tôi luyện hỏi lại.'],
    challenge: ['Model a "Find someone who…" survey for Grade 5 with Yes/No questions.', 'Làm mẫu hoạt động khảo sát "Find someone who…" cho lớp 5 với câu hỏi Yes/No.'],
    review: [
      ['Correct: "Where you live?"', 'Sửa câu: "Where you live?"'],
      ['List three ways to ask for repetition.', 'Liệt kê ba cách đề nghị nhắc lại.'],
      ['How long could you keep talking without stopping?', 'Bạn duy trì được hội thoại bao lâu mà không ngắt?'],
    ],
  }),
  // ───────────── Giai đoạn 3 — Classroom English ─────────────
  L({
    id: 'w09', week: 9, stage: 3, title: ['Starting the lesson: greetings, register & settling', 'Mở đầu tiết học: chào, điểm danh, ổn định'],
    objectives: [
      ['Greet the class and take the register in English.', 'Chào lớp và điểm danh bằng tiếng Anh.'],
      ['Settle the class calmly with short commands.', 'Ổn định lớp bình tĩnh bằng câu lệnh ngắn.'],
      ['Signal a change of activity clearly.', 'Báo hiệu chuyển hoạt động rõ ràng.'],
    ],
    warmUp: ['Write down the first five things you say at the start of every lesson. Can you say them in English?', 'Ghi năm câu đầu tiên bạn nói mỗi tiết học. Bạn nói được bằng tiếng Anh chưa?'],
    vocabulary: [
      { word: 'register', vi: 'sổ điểm danh' }, { word: 'present', vi: 'có mặt' }, { word: 'absent', vi: 'vắng mặt' },
      { word: 'settle down', vi: 'ổn định trật tự' }, { word: 'quiet', vi: 'yên lặng' }, { word: 'ready', vi: 'sẵn sàng' },
      { word: 'today\'s lesson', vi: 'bài học hôm nay' }, { word: 'next', vi: 'tiếp theo' },
    ],
    expressions: [
      ['Good morning, everyone! How are you today?', 'Chào buổi sáng cả lớp! Hôm nay các em thế nào?'],
      ['Who\'s absent today?', 'Hôm nay ai vắng?'],
      ['Please sit down and be quiet.', 'Các em ngồi xuống và giữ trật tự nhé.'],
      ['Are you ready? Let\'s get started!', 'Các em sẵn sàng chưa? Chúng ta bắt đầu nhé!'],
      ['Now, let\'s move on to the next activity.', 'Bây giờ chúng ta chuyển sang hoạt động tiếp theo.'],
    ],
    listening: { scene: ['The first two minutes of a Grade 3 lesson.', 'Hai phút đầu tiên của một tiết lớp 3.'], lines: [
      { who: 'T', en: 'Good morning, class!', vi: 'Chào cả lớp!' },
      { who: 'Class', en: 'Good morning, teacher!', vi: 'Chúng em chào cô ạ!' },
      { who: 'T', en: 'How are you today?', vi: 'Hôm nay các em thế nào?' },
      { who: 'Class', en: 'We\'re fine, thank you. And you?', vi: 'Chúng em khoẻ, cảm ơn cô. Còn cô ạ?' },
      { who: 'T', en: 'I\'m very well, thanks. Sit down, please. Is anyone absent today?', vi: 'Cô rất khoẻ, cảm ơn. Các em ngồi xuống nhé. Hôm nay có ai vắng không?' },
    ] },
    speaking: [
      ['Record your full lesson opening (greeting, register, settling, lead-in) in under 2 minutes.', 'Ghi âm phần mở đầu tiết học (chào, điểm danh, ổn định, dẫn dắt) dưới 2 phút.'],
      ['Practise three different greetings for morning, afternoon and after a holiday.', 'Luyện ba cách chào: buổi sáng, buổi chiều và sau kỳ nghỉ.'],
    ],
    rolePlay: ['You are a noisy Grade 2 class at the start of the lesson. I will greet you and settle you down in English.', 'Bạn là lớp 2 đang ồn đầu giờ. Tôi sẽ chào và ổn định lớp bằng tiếng Anh.'],
    challenge: ['Create a 1-minute "hello routine" (song or chant) for your class and use it every lesson this week.', 'Tạo một "nghi thức chào" 1 phút (bài hát hoặc vè) và dùng mỗi tiết trong tuần này.'],
    review: [
      ['How do you ask who is absent?', 'Hỏi ai vắng mặt thế nào?'],
      ['Give two ways to get pupils\' attention without shouting.', 'Nêu hai cách thu hút sự chú ý mà không cần quát.'],
      ['Which opening sentence felt most natural?', 'Câu mở đầu nào bạn thấy tự nhiên nhất?'],
    ],
  }),
  L({
    id: 'w10', week: 10, stage: 3, title: ['Instructions step by step & checking understanding', 'Giao nhiệm vụ từng bước và kiểm tra hiểu'],
    objectives: [
      ['Give instructions in short steps with a demonstration.', 'Giao nhiệm vụ theo bước ngắn kèm làm mẫu.'],
      ['Use instruction-checking questions (ICQs) instead of "Do you understand?".', 'Dùng câu hỏi kiểm tra hướng dẫn (ICQ) thay cho "Do you understand?".'],
      ['Grade your language for young learners.', 'Điều chỉnh ngôn ngữ phù hợp học sinh nhỏ.'],
    ],
    warmUp: ['Explain how to make a paper plane in 4 short steps. Count your words.', 'Hướng dẫn gấp máy bay giấy trong 4 bước ngắn. Đếm số từ bạn dùng.'],
    vocabulary: [
      { word: 'step', vi: 'bước' }, { word: 'first / then / finally', vi: 'trước tiên / sau đó / cuối cùng' }, { word: 'match', vi: 'nối' },
      { word: 'circle', vi: 'khoanh tròn' }, { word: 'tick', vi: 'đánh dấu ✓' }, { word: 'fill in', vi: 'điền vào' },
      { word: 'demonstrate', vi: 'làm mẫu' }, { word: 'check', vi: 'kiểm tra' },
    ],
    expressions: [
      ['Open your books at page 20.', 'Các em mở sách trang 20.'],
      ['First, look at the pictures. Then, listen and point.', 'Trước tiên, nhìn tranh. Sau đó, nghe và chỉ.'],
      ['Watch me. I\'ll do the first one.', 'Nhìn cô nhé. Cô làm câu đầu tiên.'],
      ['Are you going to write or draw?', 'Các em sẽ viết hay vẽ?'],
      ['How many minutes do you have?', 'Các em có mấy phút?'],
    ],
    listening: { scene: ['Giving instructions for a matching activity.', 'Giao nhiệm vụ cho bài tập nối.'], lines: [
      { who: 'T', en: 'Open your books at page 32. Look at the words and the pictures.', vi: 'Các em mở sách trang 32. Nhìn các từ và tranh.' },
      { who: 'T', en: 'Match the words to the pictures. Watch me: "cat" — number 3.', vi: 'Nối từ với tranh. Nhìn cô: "cat" — số 3.' },
      { who: 'T', en: 'Are you going to draw or match?', vi: 'Các em sẽ vẽ hay nối?' },
      { who: 'Class', en: 'Match!', vi: 'Nối ạ!' },
      { who: 'T', en: 'Good. You have three minutes. Go!', vi: 'Tốt. Các em có ba phút. Bắt đầu!' },
    ] },
    speaking: [
      ['Rewrite a long instruction from your textbook into 3 short steps, then say it aloud with gestures.', 'Viết lại một hướng dẫn dài trong sách thành 3 bước ngắn rồi nói to kèm cử chỉ.'],
      ['Write two ICQs for each of three activities (listen and tick, pair interview, colouring).', 'Viết hai câu ICQ cho mỗi hoạt động: nghe và đánh dấu, phỏng vấn cặp, tô màu.'],
    ],
    rolePlay: ['You are a Grade 4 pupil who did not understand my instructions. Ask me questions until it is clear.', 'Bạn là học sinh lớp 4 chưa hiểu hướng dẫn. Hãy hỏi đến khi rõ.'],
    challenge: ['Give instructions for a pair activity using only 15 words or fewer plus a demonstration.', 'Giao nhiệm vụ cho hoạt động cặp chỉ với tối đa 15 từ, kèm làm mẫu.'],
    review: [
      ['Why is "Do you understand?" not a good checking question?', 'Vì sao "Do you understand?" không phải câu kiểm tra tốt?'],
      ['Write one ICQ for "Work in pairs and ask three questions".', 'Viết một ICQ cho "Work in pairs and ask three questions".'],
      ['Note one instruction you will shorten.', 'Ghi một hướng dẫn bạn sẽ rút gọn.'],
    ],
  }),
  L({
    id: 'w11', week: 11, stage: 3, title: ['Pair work, group work & individual work', 'Làm việc cặp, nhóm và cá nhân'],
    objectives: [
      ['Put pupils into pairs and groups quickly in English.', 'Chia cặp, chia nhóm nhanh bằng tiếng Anh.'],
      ['Assign roles: leader, writer, timekeeper, reporter.', 'Giao vai trò: nhóm trưởng, thư ký, bấm giờ, báo cáo.'],
      ['Monitor groups and ask them to report back.', 'Theo dõi nhóm và yêu cầu báo cáo kết quả.'],
    ],
    warmUp: ['Think of three quick ways to make groups (numbers, colours, birthdays…).', 'Nghĩ ba cách chia nhóm nhanh (đếm số, màu, tháng sinh…).'],
    vocabulary: [
      { word: 'partner', vi: 'bạn cùng cặp' }, { word: 'group leader', vi: 'nhóm trưởng' }, { word: 'reporter', vi: 'người báo cáo' },
      { word: 'take turns', vi: 'lần lượt' }, { word: 'swap', vi: 'đổi' }, { word: 'share', vi: 'chia sẻ' },
      { word: 'on your own', vi: 'tự làm một mình' }, { word: 'report back', vi: 'báo cáo lại' },
    ],
    expressions: [
      ['Work with your partner.', 'Làm việc với bạn bên cạnh.'],
      ['Work in groups of four.', 'Làm việc theo nhóm bốn người.'],
      ['Number one, you\'re the leader. Number two, you write.', 'Số một làm nhóm trưởng. Số hai làm thư ký.'],
      ['Take turns. Now swap roles.', 'Lần lượt nhé. Giờ đổi vai.'],
      ['Which group is ready to share?', 'Nhóm nào sẵn sàng chia sẻ?'],
    ],
    listening: { scene: ['Organising a group poster task.', 'Tổ chức nhiệm vụ làm áp phích theo nhóm.'], lines: [
      { who: 'T', en: 'Turn around and make groups of four, please.', vi: 'Các em quay lại, tạo nhóm bốn người nhé.' },
      { who: 'T', en: 'In each group: one leader, one writer, one artist and one reporter.', vi: 'Mỗi nhóm: một nhóm trưởng, một thư ký, một hoạ sĩ, một người báo cáo.' },
      { who: 'S', en: 'Teacher, can I be the artist?', vi: 'Cô ơi, em làm hoạ sĩ được không ạ?' },
      { who: 'T', en: 'Sure! Decide together. You have five minutes.', vi: 'Được chứ! Cả nhóm cùng quyết định. Các em có năm phút.' },
    ] },
    speaking: [
      ['Give full instructions for a group activity including roles, time and reporting.', 'Giao nhiệm vụ đầy đủ cho hoạt động nhóm: vai trò, thời gian, báo cáo.'],
      ['Practise monitoring language: "How\'s it going?", "What have you got so far?"', 'Luyện câu khi đi quan sát: "How\'s it going?", "What have you got so far?"'],
    ],
    rolePlay: ['You are a group of Grade 5 pupils; one of you does not want to join. I will organise the group in English.', 'Bạn là nhóm học sinh lớp 5, một bạn không muốn tham gia. Tôi sẽ tổ chức nhóm bằng tiếng Anh.'],
    challenge: ['Design a 5-minute pair interview based on your current textbook unit, with a model dialogue on the board.', 'Thiết kế hoạt động phỏng vấn cặp 5 phút theo bài đang học, có hội thoại mẫu trên bảng.'],
    review: [
      ['Name four group roles in English.', 'Kể tên bốn vai trò trong nhóm bằng tiếng Anh.'],
      ['How do you ask a group to report back?', 'Bạn yêu cầu nhóm báo cáo thế nào?'],
      ['What went wrong last time you did group work?', 'Lần làm nhóm gần nhất có vấn đề gì?'],
    ],
  }),
  L({
    id: 'w12', week: 12, stage: 3, title: ['Praise, encouragement, correction & behaviour', 'Khen, động viên, sửa lỗi và nhắc nhở'],
    milestone: ['Checkpoint: simulated classroom management.', 'Mốc đánh giá: mô phỏng điều hành lớp học.'],
    objectives: [
      ['Praise specifically, not just "Good".', 'Khen cụ thể, không chỉ "Good".'],
      ['Correct errors gently (recasts, prompting).', 'Sửa lỗi nhẹ nhàng (nhắc lại câu đúng, gợi ý).'],
      ['Handle off-task behaviour calmly.', 'Xử lý học sinh mất tập trung một cách bình tĩnh.'],
    ],
    warmUp: ['List ten ways to say "Good job!" in English.', 'Liệt kê mười cách nói "Làm tốt lắm!" bằng tiếng Anh.'],
    vocabulary: [
      { word: 'excellent', vi: 'xuất sắc' }, { word: 'brilliant', vi: 'tuyệt vời' }, { word: 'almost', vi: 'gần đúng rồi' },
      { word: 'mistake', vi: 'lỗi' }, { word: 'pay attention', vi: 'chú ý' }, { word: 'rule', vi: 'nội quy' },
      { word: 'behave', vi: 'cư xử ngoan' }, { word: 'effort', vi: 'sự cố gắng' },
    ],
    expressions: [
      ['Excellent! I love your pronunciation.', 'Xuất sắc! Cô rất thích cách em phát âm.'],
      ['Don\'t worry. You can do it!', 'Đừng lo. Em làm được mà!'],
      ['Almost! Try again.', 'Gần đúng rồi! Thử lại nhé.'],
      ['Listen: "She goes", not "she go".', 'Nghe nhé: "She goes", không phải "she go".'],
      ['Eyes on me, please. Thank you.', 'Các em nhìn cô nhé. Cảm ơn các em.'],
    ],
    listening: { scene: ['A teacher corrects and praises a pupil.', 'Giáo viên sửa lỗi và khen học sinh.'], lines: [
      { who: 'S', en: 'Yesterday I go to the zoo.', vi: 'Hôm qua em đi sở thú.' },
      { who: 'T', en: 'Oh, you went to the zoo yesterday? Say "went".', vi: 'À, hôm qua em đã đi sở thú à? Em nói "went" nhé.' },
      { who: 'S', en: 'Yesterday I went to the zoo.', vi: 'Hôm qua em đã đi sở thú.' },
      { who: 'T', en: 'Perfect! What did you see there?', vi: 'Hoàn hảo! Em đã thấy gì ở đó?' },
      { who: 'S', en: 'I saw a big elephant!', vi: 'Em thấy một con voi to!' },
    ] },
    speaking: [
      ['Respond to 6 pupil errors with a recast, then a prompt ("Can you say it again?").', 'Phản hồi 6 lỗi của học sinh: nhắc lại câu đúng, rồi gợi ý ("Can you say it again?").'],
      ['Practise calm behaviour language: "Nam, are you ready?", "Show me your best sitting."', 'Luyện câu nhắc nhở bình tĩnh: "Nam, are you ready?", "Show me your best sitting."'],
    ],
    rolePlay: ['You are a Grade 3 pupil who is chatting and not listening. I will manage the situation in English.', 'Bạn là học sinh lớp 3 đang nói chuyện riêng. Tôi sẽ xử lý tình huống bằng tiếng Anh.'],
    challenge: ['Run a 10-minute mock lesson segment: open, instruct, group, praise, correct and close — all in English.', 'Dạy mô phỏng 10 phút: mở đầu, giao nhiệm vụ, chia nhóm, khen, sửa lỗi, kết thúc — toàn bộ bằng tiếng Anh.'],
    review: [
      ['Turn "Good" into specific praise for a drawing.', 'Biến "Good" thành lời khen cụ thể cho một bức tranh.'],
      ['How do you correct "He have a dog" without saying "Wrong!"?', 'Sửa "He have a dog" thế nào mà không nói "Sai!"?'],
      ['Rate your Classroom English on the 1–4 scale.', 'Tự chấm Classroom English theo thang 1–4.'],
    ],
  }),
  // ───────────── Giai đoạn 4 — Chủ đề tiểu học ─────────────
  L({
    id: 'w13', week: 13, stage: 4, title: ['Colours & numbers; school & classroom objects', 'Màu sắc, số đếm; đồ dùng học tập'],
    objectives: [
      ['Present colours, numbers and school things with pictures and realia.', 'Giới thiệu màu, số, đồ dùng học tập bằng tranh và vật thật.'],
      ['Drill "What colour is it?", "How many…?", "Is this your…?".', 'Luyện mẫu "What colour is it?", "How many…?", "Is this your…?".'],
      ['Check vocabulary with quick games.', 'Kiểm tra từ vựng bằng trò chơi nhanh.'],
    ],
    warmUp: ['Find ten things in your bag. Say their colour and how many there are.', 'Tìm mười đồ vật trong túi. Nói màu và số lượng.'],
    vocabulary: [
      { word: 'pencil case', vi: 'hộp bút' }, { word: 'ruler', vi: 'thước kẻ' }, { word: 'rubber / eraser', vi: 'cục tẩy' },
      { word: 'school bag', vi: 'cặp sách' }, { word: 'crayon', vi: 'bút sáp màu' }, { word: 'purple', vi: 'màu tím' },
      { word: 'orange', vi: 'màu cam' }, { word: 'twenty', vi: 'hai mươi' },
    ],
    expressions: [
      ['What colour is your ruler? — It\'s blue.', 'Thước của em màu gì? — Màu xanh dương ạ.'],
      ['How many pencils are there? — There are five.', 'Có bao nhiêu bút chì? — Có năm cái ạ.'],
      ['Is this your rubber? — Yes, it is. / No, it isn\'t.', 'Đây có phải tẩy của em không? — Vâng, phải ạ. / Không phải ạ.'],
      ['Show me something red!', 'Cho cô xem một thứ màu đỏ nào!'],
      ['Let\'s count from one to ten.', 'Chúng ta đếm từ một đến mười nhé.'],
    ],
    listening: { scene: ['A Grade 3 lesson on school things.', 'Tiết lớp 3 về đồ dùng học tập.'], lines: [
      { who: 'T', en: 'Look! What is it?', vi: 'Nhìn này! Đây là cái gì?' },
      { who: 'Class', en: 'It\'s a pencil case!', vi: 'Là hộp bút ạ!' },
      { who: 'T', en: 'Yes! What colour is it?', vi: 'Đúng! Nó màu gì?' },
      { who: 'Class', en: 'It\'s green.', vi: 'Màu xanh lá ạ.' },
      { who: 'T', en: 'Great. Now hold up your pencil case. How many pens are in it?', vi: 'Tốt lắm. Giờ giơ hộp bút lên. Trong đó có mấy cây bút?' },
    ] },
    speaking: [
      ['Present 6 school objects using realia, then drill with chorus → groups → individuals.', 'Giới thiệu 6 đồ dùng học tập bằng vật thật, luyện cả lớp → nhóm → cá nhân.'],
      ['Ask "How many…?" about pictures in your textbook unit.', 'Hỏi "How many…?" về tranh trong bài sách giáo khoa.'],
    ],
    rolePlay: ['You are a Grade 3 pupil. I teach you school things; answer my questions and sometimes make a mistake.', 'Bạn là học sinh lớp 3. Tôi dạy đồ dùng học tập; trả lời và thỉnh thoảng nói sai.'],
    challenge: ['Plan "Colour touch": call a colour, pupils touch something of that colour in 5 seconds.', 'Thiết kế trò "Chạm màu": gọi một màu, học sinh chạm vào đồ vật màu đó trong 5 giây.'],
    review: [
      ['Which technique did you use to present new words?', 'Bạn dùng kỹ thuật nào để giới thiệu từ mới?'],
      ['Write a checking question for "ruler".', 'Viết một câu hỏi kiểm tra cho từ "ruler".'],
      ['Which numbers are tricky for pupils (13/30, 14/40…)?', 'Số nào học sinh hay nhầm (13/30, 14/40…)?'],
    ],
  }),
  L({
    id: 'w14', week: 14, stage: 4, title: ['Family & friends; animals & pets; food & drinks', 'Gia đình, bạn bè; con vật; đồ ăn, thức uống'],
    objectives: [
      ['Teach family words with photos and a family tree.', 'Dạy từ về gia đình bằng ảnh và cây gia đình.'],
      ['Teach animals with mime and sounds.', 'Dạy con vật bằng điệu bộ và tiếng kêu.'],
      ['Practise likes and requests: "I like…", "Would you like…?"', 'Luyện thích – mời: "I like…", "Would you like…?"'],
    ],
    warmUp: ['Mime three animals. Can a partner name them in English?', 'Diễn tả ba con vật bằng điệu bộ. Bạn có gọi đúng tên tiếng Anh không?'],
    vocabulary: [
      { word: 'grandparents', vi: 'ông bà' }, { word: 'cousin', vi: 'anh chị em họ' }, { word: 'best friend', vi: 'bạn thân' },
      { word: 'rabbit', vi: 'con thỏ' }, { word: 'parrot', vi: 'con vẹt' }, { word: 'goldfish', vi: 'cá vàng' },
      { word: 'noodles', vi: 'mì' }, { word: 'orange juice', vi: 'nước cam' },
    ],
    expressions: [
      ['Who\'s this? — It\'s my grandmother.', 'Đây là ai? — Đây là bà em ạ.'],
      ['Do you have a pet? — Yes, I have a rabbit.', 'Em có thú cưng không? — Có, em có một con thỏ.'],
      ['What animal is it? It can fly and it can talk!', 'Đó là con gì? Nó biết bay và biết nói!'],
      ['What\'s your favourite food? — It\'s noodles.', 'Món em thích nhất là gì? — Là mì ạ.'],
      ['Would you like some milk? — Yes, please. / No, thanks.', 'Em có muốn uống sữa không? — Có ạ. / Không ạ, cảm ơn.'],
    ],
    listening: { scene: ['Role-play at a "class café".', 'Đóng vai ở "quán ăn lớp học".'], lines: [
      { who: 'T', en: 'Hello! What would you like to eat?', vi: 'Xin chào! Em muốn ăn gì?' },
      { who: 'S', en: 'I\'d like some chicken and rice, please.', vi: 'Cho em cơm gà ạ.' },
      { who: 'T', en: 'And what would you like to drink?', vi: 'Còn em muốn uống gì?' },
      { who: 'S', en: 'Orange juice, please.', vi: 'Nước cam ạ.' },
      { who: 'T', en: 'Here you are. Enjoy!', vi: 'Của em đây. Chúc ngon miệng!' },
    ] },
    speaking: [
      ['Present your family tree to the class with 6 sentences.', 'Giới thiệu cây gia đình trước lớp với 6 câu.'],
      ['Run a "class café" role-play script for Grade 4 using food and drinks.', 'Dựng kịch bản đóng vai "quán ăn lớp học" cho lớp 4 với đồ ăn, thức uống.'],
    ],
    rolePlay: ['You are a Grade 4 pupil at a class café. I am the waiter; order food and drinks.', 'Bạn là học sinh lớp 4 ở quán ăn lớp học. Tôi là người phục vụ; hãy gọi món.'],
    challenge: ['Plan "Animal charades": a pupil mimes, the class asks "Is it a…?" and the pupil answers.', 'Thiết kế trò "Đoán con vật": một em diễn, cả lớp hỏi "Is it a…?" và em trả lời.'],
    review: [
      ['Write a guessing riddle for "parrot".', 'Viết một câu đố về "parrot".'],
      ['What is the polite answer to "Would you like…?"', 'Câu trả lời lịch sự cho "Would you like…?" là gì?'],
      ['Which topic suits which grade in your textbook?', 'Chủ đề nào ứng với khối nào trong sách giáo khoa?'],
    ],
  }),
  L({
    id: 'w15', week: 15, stage: 4, title: ['Clothes & toys; weather & seasons; daily routines', 'Quần áo, đồ chơi; thời tiết, mùa; sinh hoạt hằng ngày'],
    objectives: [
      ['Teach clothes and toys with a "dress-up box".', 'Dạy quần áo, đồ chơi với "hộp hoá trang".'],
      ['Talk about the weather every lesson as a routine.', 'Hỏi thời tiết mỗi tiết như một nề nếp.'],
      ['Sequence daily routines with picture cards.', 'Sắp xếp hoạt động hằng ngày bằng thẻ tranh.'],
    ],
    warmUp: ['Describe what you are wearing today and what the weather is like.', 'Tả hôm nay bạn mặc gì và thời tiết thế nào.'],
    vocabulary: [
      { word: 'T-shirt', vi: 'áo phông' }, { word: 'jacket', vi: 'áo khoác' }, { word: 'teddy bear', vi: 'gấu bông' },
      { word: 'kite', vi: 'con diều' }, { word: 'sunny', vi: 'nắng' }, { word: 'rainy', vi: 'mưa' },
      { word: 'windy', vi: 'có gió' }, { word: 'brush my teeth', vi: 'đánh răng' },
    ],
    expressions: [
      ['What\'s the weather like today? — It\'s sunny.', 'Hôm nay thời tiết thế nào? — Trời nắng ạ.'],
      ['What are you wearing? — I\'m wearing a red T-shirt.', 'Em đang mặc gì? — Em mặc áo phông đỏ.'],
      ['Whose kite is this? — It\'s Nam\'s.', 'Con diều này của ai? — Của bạn Nam ạ.'],
      ['What do you do in the morning? — I get up and brush my teeth.', 'Buổi sáng em làm gì? — Em dậy và đánh răng.'],
      ['Put the pictures in order.', 'Các em xếp tranh theo thứ tự.'],
    ],
    listening: { scene: ['A weather routine at the start of class.', 'Nề nếp hỏi thời tiết đầu giờ.'], lines: [
      { who: 'T', en: 'Let\'s look out of the window. What\'s the weather like?', vi: 'Các em nhìn ra cửa sổ. Thời tiết thế nào?' },
      { who: 'Class', en: 'It\'s rainy!', vi: 'Trời mưa ạ!' },
      { who: 'T', en: 'Yes, it\'s rainy and cold. What do you wear when it\'s cold?', vi: 'Đúng, trời mưa và lạnh. Khi lạnh em mặc gì?' },
      { who: 'S', en: 'I wear a jacket.', vi: 'Em mặc áo khoác.' },
    ] },
    speaking: [
      ['Make a weather chart and practise the 1-minute weather routine.', 'Làm bảng thời tiết và luyện nề nếp hỏi thời tiết 1 phút.'],
      ['Tell your morning routine with picture cards, then ask a pupil to retell it.', 'Kể hoạt động buổi sáng bằng thẻ tranh rồi mời học sinh kể lại.'],
    ],
    rolePlay: ['You are a Grade 2 pupil. We play "dress up": I ask what you are wearing and you answer.', 'Bạn là học sinh lớp 2. Chơi "hoá trang": tôi hỏi bạn mặc gì và bạn trả lời.'],
    challenge: ['Plan a "Weather dance": each weather word has an action; pupils act when they hear it.', 'Thiết kế "Điệu nhảy thời tiết": mỗi từ thời tiết một động tác; nghe từ nào làm động tác đó.'],
    review: [
      ['Give an action for "windy" and "snowy".', 'Nghĩ động tác cho "windy" và "snowy".'],
      ['Which routine verbs need "-es" with he/she?', 'Động từ nào cần thêm "-es" với he/she?'],
      ['How will you recycle these words next week?', 'Tuần sau bạn sẽ ôn lại các từ này thế nào?'],
    ],
  }),
  L({
    id: 'w16', week: 16, stage: 4, title: ['Sports & hobbies; places & directions', 'Thể thao, sở thích; địa điểm, chỉ đường'],
    milestone: ['Checkpoint: teach one primary vocabulary topic.', 'Mốc đánh giá: dạy một chủ đề từ vựng tiểu học.'],
    objectives: [
      ['Teach "can / can\'t" and hobbies with actions.', 'Dạy "can / can\'t" và sở thích bằng hành động.'],
      ['Give simple directions with a map.', 'Chỉ đường đơn giản với bản đồ.'],
      ['Teach a full vocabulary mini-lesson (present – practise – produce).', 'Dạy trọn một tiết từ vựng nhỏ (giới thiệu – luyện tập – vận dụng).'],
    ],
    warmUp: ['Say five things you can do and two things you can\'t do.', 'Nói năm việc bạn làm được và hai việc bạn không làm được.'],
    vocabulary: [
      { word: 'ride a bike', vi: 'đi xe đạp' }, { word: 'skip', vi: 'nhảy dây' }, { word: 'badminton', vi: 'cầu lông' },
      { word: 'swim', vi: 'bơi' }, { word: 'turn left', vi: 'rẽ trái' }, { word: 'go straight', vi: 'đi thẳng' },
      { word: 'opposite', vi: 'đối diện' }, { word: 'post office', vi: 'bưu điện' },
    ],
    expressions: [
      ['Can you swim? — Yes, I can. / No, I can\'t.', 'Em biết bơi không? — Có ạ. / Không ạ.'],
      ['What\'s your hobby? — I like playing badminton.', 'Sở thích của em là gì? — Em thích chơi cầu lông.'],
      ['Where\'s the post office? — It\'s opposite the park.', 'Bưu điện ở đâu? — Ở đối diện công viên.'],
      ['Go straight and turn left.', 'Đi thẳng rồi rẽ trái.'],
      ['Stand up if you can ride a bike!', 'Em nào biết đi xe đạp thì đứng lên!'],
    ],
    listening: { scene: ['Pupils give directions on a class map.', 'Học sinh chỉ đường trên bản đồ của lớp.'], lines: [
      { who: 'S1', en: 'Excuse me, where\'s the zoo?', vi: 'Xin lỗi, sở thú ở đâu?' },
      { who: 'S2', en: 'Go straight. Turn right at the school.', vi: 'Đi thẳng. Đến trường thì rẽ phải.' },
      { who: 'S1', en: 'Is it next to the cinema?', vi: 'Nó ở cạnh rạp chiếu phim phải không?' },
      { who: 'S2', en: 'No, it\'s opposite the cinema.', vi: 'Không, nó ở đối diện rạp chiếu phim.' },
      { who: 'T', en: 'Well done, both of you! Clear directions.', vi: 'Hai em giỏi lắm! Chỉ đường rất rõ.' },
    ] },
    speaking: [
      ['Teach a 10-minute vocabulary mini-lesson from your textbook unit and record it.', 'Dạy một tiết từ vựng nhỏ 10 phút theo bài sách giáo khoa và ghi hình.'],
      ['Give directions from your school gate to three places nearby.', 'Chỉ đường từ cổng trường đến ba địa điểm gần đó.'],
    ],
    rolePlay: ['You are a tourist in my town. Ask me for directions to three places.', 'Bạn là khách du lịch ở thị trấn tôi. Hãy hỏi đường đến ba nơi.'],
    challenge: ['Plan "Robot directions": a blindfolded pupil follows classmates\' directions to reach a picture card.', 'Thiết kế trò "Rô-bốt": một em bịt mắt đi theo chỉ dẫn của bạn để đến thẻ tranh.'],
    review: [
      ['What are the three stages of your mini-lesson?', 'Tiết từ vựng nhỏ của bạn gồm ba bước nào?'],
      ['Write two "can" questions for Grade 4 Unit 5 (Things we can do).', 'Viết hai câu hỏi "can" cho Unit 5 lớp 4 (Things we can do).'],
      ['Rate your topic teaching on the 1–4 scale.', 'Tự chấm phần dạy theo chủ đề theo thang 1–4.'],
    ],
  }),
  // ───────────── Giai đoạn 5 — Phương pháp ─────────────
  L({
    id: 'w17', week: 17, stage: 5, title: ['Teaching vocabulary & sentence patterns', 'Dạy từ vựng và mẫu câu'],
    objectives: [
      ['Present words with pictures, realia, gestures and context.', 'Giới thiệu từ bằng tranh, vật thật, cử chỉ và ngữ cảnh.'],
      ['Elicit before you tell.', 'Gợi mở trước khi giảng.'],
      ['Teach a pattern through a situation, not a rule.', 'Dạy mẫu câu qua tình huống, không qua quy tắc.'],
    ],
    warmUp: ['Choose one word. Show its meaning in three ways without translating.', 'Chọn một từ. Thể hiện nghĩa theo ba cách mà không dịch.'],
    vocabulary: [
      { word: 'elicit', vi: 'gợi mở' }, { word: 'realia', vi: 'vật thật' }, { word: 'flashcard', vi: 'thẻ hình' },
      { word: 'mime', vi: 'diễn tả bằng điệu bộ' }, { word: 'drill', vi: 'luyện lặp' }, { word: 'chorus', vi: 'đồng thanh' },
      { word: 'model', vi: 'làm mẫu' }, { word: 'context', vi: 'ngữ cảnh' },
    ],
    expressions: [
      ['What\'s this in English? Who knows?', 'Cái này tiếng Anh là gì? Em nào biết?'],
      ['Listen and repeat: "dolphin".', 'Nghe và nhắc lại: "dolphin".'],
      ['Everybody… now this half… now just the girls.', 'Cả lớp… giờ nửa lớp này… giờ chỉ các bạn nữ.'],
      ['Look at the picture. What is the boy doing?', 'Nhìn tranh. Bạn nam đang làm gì?'],
      ['Who can make a sentence with "like"?', 'Em nào đặt được câu với "like"?'],
    ],
    listening: { scene: ['Eliciting a new word with a flashcard.', 'Gợi mở từ mới bằng thẻ hình.'], lines: [
      { who: 'T', en: '(shows part of a picture) What\'s this? It lives in the sea. It\'s grey and very clever.', vi: '(che một phần tranh) Đây là gì? Nó sống ở biển. Nó màu xám và rất thông minh.' },
      { who: 'S', en: 'Fish?', vi: 'Con cá ạ?' },
      { who: 'T', en: 'Good guess! It\'s not a fish… It\'s a dolphin. Listen: DOL-phin.', vi: 'Đoán hay lắm! Không phải cá… Đó là cá heo. Nghe nhé: DOL-phin.' },
      { who: 'Class', en: 'DOL-phin!', vi: 'DOL-phin!' },
    ] },
    speaking: [
      ['Present 5 new words from your unit using a different technique for each.', 'Giới thiệu 5 từ mới trong bài, mỗi từ một kỹ thuật khác nhau.'],
      ['Set up a situation that makes pupils need the new pattern, then model it.', 'Tạo tình huống khiến học sinh cần mẫu câu mới, rồi làm mẫu.'],
    ],
    rolePlay: ['You are a Grade 5 class. I present the pattern "What would you like to be in the future?"; respond and ask questions.', 'Bạn là lớp 5. Tôi giới thiệu mẫu "What would you like to be in the future?"; hãy trả lời và đặt câu hỏi.'],
    challenge: ['Plan a 7-minute presentation stage: lead-in → elicit → model → drill → check, for one textbook unit.', 'Thiết kế bước giới thiệu 7 phút: dẫn dắt → gợi mở → làm mẫu → luyện → kiểm tra, cho một bài sách giáo khoa.'],
    review: [
      ['Name four ways to show meaning without translation.', 'Kể bốn cách thể hiện nghĩa mà không dịch.'],
      ['What is the order: model, drill, elicit?', 'Thứ tự đúng: làm mẫu, luyện, gợi mở?'],
      ['Which technique worked best with your pupils?', 'Kỹ thuật nào hiệu quả nhất với học sinh của bạn?'],
    ],
  }),
  L({
    id: 'w18', week: 18, stage: 5, title: ['Storytelling, songs & chants', 'Kể chuyện, bài hát và vè'],
    objectives: [
      ['Tell a story with short sentences, voices and pictures.', 'Kể chuyện bằng câu ngắn, giọng nhân vật và tranh.'],
      ['Ask prediction and comprehension questions.', 'Đặt câu hỏi dự đoán và hiểu nội dung.'],
      ['Teach a song or chant with actions.', 'Dạy bài hát hoặc vè kèm động tác.'],
    ],
    warmUp: ['Tell "The Three Little Pigs" in 6 sentences.', 'Kể "Ba chú heo con" trong 6 câu.'],
    vocabulary: [
      { word: 'once upon a time', vi: 'ngày xửa ngày xưa' }, { word: 'suddenly', vi: 'bỗng nhiên' }, { word: 'in the end', vi: 'cuối cùng' },
      { word: 'character', vi: 'nhân vật' }, { word: 'predict', vi: 'dự đoán' }, { word: 'chant', vi: 'bài vè' },
      { word: 'rhyme', vi: 'vần' }, { word: 'clap', vi: 'vỗ tay' },
    ],
    expressions: [
      ['Look at the cover. What do you think the story is about?', 'Nhìn bìa sách. Các em đoán câu chuyện về gì?'],
      ['What happens next?', 'Chuyện gì xảy ra tiếp theo?'],
      ['How does the wolf feel?', 'Chó sói cảm thấy thế nào?'],
      ['Let\'s sing it together and do the actions.', 'Cùng hát và làm động tác nhé.'],
      ['Louder! Now whisper!', 'To hơn nào! Giờ hát thầm thôi!'],
    ],
    listening: { scene: ['Storytelling with a Grade 2 class.', 'Kể chuyện cho lớp 2.'], lines: [
      { who: 'T', en: 'Once upon a time, there was a little rabbit. He was very hungry.', vi: 'Ngày xửa ngày xưa, có một chú thỏ con. Chú rất đói.' },
      { who: 'T', en: 'He saw a big orange carrot. What do you think he did?', vi: 'Chú thấy một củ cà rốt to màu cam. Các em đoán chú làm gì?' },
      { who: 'S', en: 'He ate it!', vi: 'Chú ăn nó ạ!' },
      { who: 'T', en: 'Let\'s see… He pulled and pulled, but it didn\'t come out!', vi: 'Xem nào… Chú kéo mãi, kéo mãi nhưng củ cà rốt không lên!' },
    ] },
    speaking: [
      ['Record yourself telling a 2-minute story with different voices.', 'Ghi âm bạn kể một câu chuyện 2 phút với nhiều giọng nhân vật.'],
      ['Turn a textbook dialogue into a chant with a clear beat.', 'Biến một hội thoại trong sách thành bài vè có nhịp rõ.'],
    ],
    rolePlay: ['You are a Grade 2 pupil listening to my story. Answer my prediction questions and react with simple words.', 'Bạn là học sinh lớp 2 nghe tôi kể chuyện. Trả lời câu hỏi dự đoán và phản ứng bằng từ đơn giản.'],
    challenge: ['Plan pre-, while- and post-story activities for Grade 5 Unit 17 (Stories for children).', 'Thiết kế hoạt động trước, trong, sau khi kể cho Unit 17 lớp 5 (Stories for children).'],
    review: [
      ['Write two prediction questions for any story.', 'Viết hai câu hỏi dự đoán cho một câu chuyện bất kỳ.'],
      ['Why add actions to songs for young learners?', 'Vì sao nên thêm động tác khi dạy bài hát cho học sinh nhỏ?'],
      ['Which part of your storytelling needs more expression?', 'Phần nào trong cách kể của bạn cần biểu cảm hơn?'],
    ],
  }),
  L({
    id: 'w19', week: 19, stage: 5, title: ['Games & role-play', 'Trò chơi và đóng vai'],
    objectives: [
      ['Explain game rules clearly in English.', 'Giải thích luật chơi rõ ràng bằng tiếng Anh.'],
      ['Choose games with a clear language aim.', 'Chọn trò chơi có mục tiêu ngôn ngữ rõ ràng.'],
      ['Set up a role-play with roles, cards and a model.', 'Dựng hoạt động đóng vai với vai, thẻ và mẫu.'],
    ],
    warmUp: ['Name five classroom games and the language each practises.', 'Kể năm trò chơi trên lớp và ngôn ngữ mỗi trò luyện.'],
    vocabulary: [
      { word: 'team', vi: 'đội' }, { word: 'point', vi: 'điểm' }, { word: 'winner', vi: 'người thắng' },
      { word: 'turn', vi: 'lượt' }, { word: 'role card', vi: 'thẻ vai' }, { word: 'shopkeeper', vi: 'người bán hàng' },
      { word: 'customer', vi: 'khách hàng' }, { word: 'fair play', vi: 'chơi đẹp' },
    ],
    expressions: [
      ['Let\'s play a game! Make two teams.', 'Cùng chơi trò chơi nào! Chia hai đội.'],
      ['Here are the rules. Listen carefully.', 'Đây là luật chơi. Nghe kỹ nhé.'],
      ['It\'s Team A\'s turn. One point for Team B!', 'Đến lượt đội A. Một điểm cho đội B!'],
      ['You are the shopkeeper and you are the customer.', 'Em làm người bán hàng, em làm khách hàng.'],
      ['Good game, everyone! Let\'s clap for both teams.', 'Cả lớp chơi hay lắm! Vỗ tay cho cả hai đội nào.'],
    ],
    listening: { scene: ['Explaining "Slap the board".', 'Giải thích trò "Đập bảng".'], lines: [
      { who: 'T', en: 'Two teams. One player from each team comes to the board.', vi: 'Hai đội. Mỗi đội cử một bạn lên bảng.' },
      { who: 'T', en: 'I say a word. You slap the right picture first and say the word.', vi: 'Cô nói một từ. Em nào đập đúng tranh trước và nói lại từ đó.' },
      { who: 'T', en: 'Ready? "Kite!"', vi: 'Sẵn sàng chưa? "Kite!"' },
      { who: 'S', en: 'Kite!', vi: 'Kite!' },
      { who: 'T', en: 'One point for Team A! Next players, please.', vi: 'Một điểm cho đội A! Mời hai bạn tiếp theo.' },
    ] },
    speaking: [
      ['Explain the rules of three games in under 30 seconds each, with a demo.', 'Giải thích luật ba trò chơi, mỗi trò dưới 30 giây, kèm làm mẫu.'],
      ['Write a 6-line role-play for Grade 4 Unit 18 (At the shopping centre) and perform it.', 'Viết đoạn đóng vai 6 câu cho Unit 18 lớp 4 (At the shopping centre) và diễn thử.'],
    ],
    rolePlay: ['You are a Grade 4 pupil playing a shopping role-play. I am the shopkeeper.', 'Bạn là học sinh lớp 4 đóng vai đi mua sắm. Tôi là người bán hàng.'],
    challenge: ['Adapt one game so that every pupil speaks at least three times.', 'Điều chỉnh một trò chơi để mỗi học sinh được nói ít nhất ba lần.'],
    review: [
      ['What language does "Simon says" practise?', 'Trò "Simon says" luyện ngôn ngữ gì?'],
      ['How do you keep a game calm and fair?', 'Làm sao giữ trò chơi trật tự và công bằng?'],
      ['Which game will you use next week?', 'Tuần sau bạn dùng trò chơi nào?'],
    ],
  }),
  L({
    id: 'w20', week: 20, stage: 5, title: ['Pair & group tasks and scaffolding', 'Nhiệm vụ cặp, nhóm và hỗ trợ theo trình độ'],
    milestone: ['Checkpoint: run a complete learning activity.', 'Mốc đánh giá: tổ chức một hoạt động học tập hoàn chỉnh.'],
    objectives: [
      ['Design tasks with a clear outcome (poster, survey, report).', 'Thiết kế nhiệm vụ có sản phẩm rõ (áp phích, khảo sát, báo cáo).'],
      ['Scaffold with sentence frames, word banks and models.', 'Hỗ trợ bằng khung câu, ngân hàng từ và mẫu.'],
      ['Differentiate for stronger and weaker pupils.', 'Phân hoá cho học sinh khá và học sinh cần hỗ trợ.'],
    ],
    warmUp: ['Think of one pupil who finds English hard. What support would help them?', 'Nghĩ đến một em gặp khó với tiếng Anh. Em ấy cần hỗ trợ gì?'],
    vocabulary: [
      { word: 'scaffolding', vi: 'giàn giáo hỗ trợ' }, { word: 'sentence frame', vi: 'khung câu' }, { word: 'word bank', vi: 'ngân hàng từ' },
      { word: 'challenge card', vi: 'thẻ thử thách' }, { word: 'survey', vi: 'khảo sát' }, { word: 'outcome', vi: 'sản phẩm đầu ra' },
      { word: 'mixed-ability', vi: 'nhiều trình độ' }, { word: 'support', vi: 'hỗ trợ' },
    ],
    expressions: [
      ['Use the sentence on the board to help you.', 'Dùng câu trên bảng để giúp em nhé.'],
      ['If you finish early, try the challenge card.', 'Em nào xong sớm thì làm thẻ thử thách.'],
      ['Start with "I think…".', 'Bắt đầu bằng "I think…".'],
      ['Can you help your partner?', 'Em giúp bạn được không?'],
      ['Let\'s look at your group\'s poster.', 'Cùng xem áp phích của nhóm em nào.'],
    ],
    listening: { scene: ['Supporting a weaker pupil during a survey.', 'Hỗ trợ một học sinh yếu trong hoạt động khảo sát.'], lines: [
      { who: 'S', en: 'Teacher… I don\'t know… how to ask.', vi: 'Cô ơi… em không biết… hỏi thế nào.' },
      { who: 'T', en: 'Look at the frame: "Do you like…?" Choose a word from the word bank.', vi: 'Nhìn khung câu: "Do you like…?" Chọn một từ trong ngân hàng từ.' },
      { who: 'S', en: 'Do you like… swimming?', vi: 'Bạn có thích… bơi không?' },
      { who: 'T', en: 'Perfect! Now ask three friends and tick the table.', vi: 'Hoàn hảo! Giờ hỏi ba bạn và đánh dấu vào bảng.' },
    ] },
    speaking: [
      ['Explain a group survey task with frames for weaker pupils and an extension for stronger ones.', 'Giao nhiệm vụ khảo sát nhóm có khung câu cho em cần hỗ trợ và phần mở rộng cho em khá.'],
      ['Practise feedback language for group products.', 'Luyện câu nhận xét sản phẩm nhóm.'],
    ],
    rolePlay: ['You are two pupils: one strong and one shy. I will support both during a pair task.', 'Bạn đóng hai học sinh: một em giỏi, một em rụt rè. Tôi hỗ trợ cả hai trong hoạt động cặp.'],
    challenge: ['Design a 15-minute activity with three support levels for one unit you are teaching.', 'Thiết kế hoạt động 15 phút với ba mức hỗ trợ cho một bài bạn đang dạy.'],
    review: [
      ['List three kinds of scaffolding.', 'Kể ba hình thức hỗ trợ.'],
      ['What does a "challenge card" do?', '"Thẻ thử thách" dùng để làm gì?'],
      ['Rate your activity design on the 1–4 scale.', 'Tự chấm phần thiết kế hoạt động theo thang 1–4.'],
    ],
  }),
  // ───────────── Giai đoạn 6 — Thực hành và đánh giá ─────────────
  L({
    id: 'w21', week: 21, stage: 6, title: ['Teacher–pupil dialogues & classroom situations', 'Hội thoại thầy – trò và xử lý tình huống lớp học'],
    objectives: [
      ['Respond naturally to unexpected pupil questions.', 'Phản hồi tự nhiên trước câu hỏi bất ngờ của học sinh.'],
      ['Handle common problems: not understanding, fighting, not joining in.', 'Xử lý tình huống thường gặp: không hiểu, cãi nhau, không tham gia.'],
      ['Stay in English while staying kind and firm.', 'Duy trì tiếng Anh mà vẫn ân cần và dứt khoát.'],
    ],
    warmUp: ['Recall a difficult classroom moment. What did you say? What could you say in English?', 'Nhớ lại một tình huống khó trên lớp. Bạn đã nói gì? Bằng tiếng Anh bạn có thể nói gì?'],
    vocabulary: [
      { word: 'upset', vi: 'buồn, khó chịu' }, { word: 'argue', vi: 'cãi nhau' }, { word: 'share', vi: 'chia sẻ' },
      { word: 'feel sick', vi: 'thấy mệt' }, { word: 'toilet', vi: 'nhà vệ sinh' }, { word: 'forget', vi: 'quên' },
      { word: 'calm down', vi: 'bình tĩnh lại' }, { word: 'sorry', vi: 'xin lỗi' },
    ],
    expressions: [
      ['What\'s the matter? Are you OK?', 'Có chuyện gì vậy? Em ổn chứ?'],
      ['Can you tell me what happened?', 'Em kể cô nghe chuyện gì đã xảy ra?'],
      ['Let\'s take a deep breath and calm down.', 'Hít một hơi thật sâu và bình tĩnh lại nhé.'],
      ['It\'s OK to make mistakes. That\'s how we learn.', 'Sai cũng không sao. Chúng ta học từ đó mà.'],
      ['Did you forget your book? Share with your partner today.', 'Em quên sách à? Hôm nay xem chung với bạn nhé.'],
    ],
    listening: { scene: ['Two pupils argue over a crayon.', 'Hai học sinh tranh nhau cây bút sáp.'], lines: [
      { who: 'S1', en: 'Teacher! He took my crayon!', vi: 'Cô ơi! Bạn ấy lấy bút sáp của em!' },
      { who: 'T', en: 'OK, let\'s calm down. Tuan, can you tell me what happened?', vi: 'Được rồi, bình tĩnh nào. Tuấn, em kể cô nghe chuyện gì xảy ra?' },
      { who: 'S2', en: 'I don\'t have a red one…', vi: 'Em không có bút màu đỏ…' },
      { who: 'T', en: 'I see. What can you say to Hoa?', vi: 'Cô hiểu rồi. Em nên nói gì với Hoa?' },
      { who: 'S2', en: 'Can I borrow your red crayon, please?', vi: 'Cho mình mượn bút sáp đỏ được không?' },
    ] },
    speaking: [
      ['Respond in English to 8 situation cards (a pupil cries, feels sick, finishes early, needs the toilet…).', 'Phản hồi bằng tiếng Anh 8 thẻ tình huống (học sinh khóc, mệt, làm xong sớm, xin đi vệ sinh…).'],
      ['Act out a 3-minute teacher–pupil dialogue with a partner.', 'Đóng vai hội thoại thầy – trò 3 phút với bạn.'],
    ],
    rolePlay: ['You are different Grade 3 pupils with problems (lost pencil, sad, talking too much). Bring them to me one by one.', 'Bạn đóng các học sinh lớp 3 gặp chuyện (mất bút, buồn, nói chuyện nhiều). Lần lượt đến gặp tôi.'],
    challenge: ['Write a classroom "problem bank" of 10 situations with your best English responses.', 'Viết "ngân hàng tình huống" 10 tình huống lớp học kèm câu phản hồi tiếng Anh tốt nhất.'],
    review: [
      ['How do you respond to "Teacher, I don\'t understand"?', 'Bạn phản hồi thế nào khi học sinh nói "Teacher, I don\'t understand"?'],
      ['Which situation still makes you switch to Vietnamese?', 'Tình huống nào khiến bạn vẫn chuyển sang tiếng Việt?'],
      ['Note one phrase to use every day.', 'Ghi một câu sẽ dùng mỗi ngày.'],
    ],
  }),
  L({
    id: 'w22', week: 22, stage: 6, title: ['Presenting a topic & designing lesson stages', 'Thuyết trình chủ đề và thiết kế các bước bài học'],
    objectives: [
      ['Give a 3-minute presentation on a primary topic.', 'Thuyết trình 3 phút về một chủ đề tiểu học.'],
      ['Design warm-up, presentation, practice and consolidation stages.', 'Thiết kế các bước khởi động, giới thiệu, luyện tập, củng cố.'],
      ['Write clear lesson aims in English.', 'Viết mục tiêu bài học rõ ràng bằng tiếng Anh.'],
    ],
    warmUp: ['Finish the sentence: "By the end of the lesson, pupils will be able to…"', 'Hoàn thành câu: "Cuối tiết học, học sinh có thể…"'],
    vocabulary: [
      { word: 'lesson aim', vi: 'mục tiêu bài học' }, { word: 'stage', vi: 'bước, giai đoạn' }, { word: 'lead-in', vi: 'dẫn dắt' },
      { word: 'consolidation', vi: 'củng cố' }, { word: 'timing', vi: 'phân bổ thời gian' }, { word: 'materials', vi: 'học liệu' },
      { word: 'interaction', vi: 'hình thức tương tác' }, { word: 'outcome', vi: 'kết quả' },
    ],
    expressions: [
      ['By the end of the lesson, pupils will be able to ask and answer about…', 'Cuối tiết, học sinh có thể hỏi và trả lời về…'],
      ['First, I\'ll start with a song to warm up.', 'Trước tiên, tôi sẽ khởi động bằng một bài hát.'],
      ['Then pupils will practise in pairs for five minutes.', 'Sau đó học sinh luyện theo cặp trong năm phút.'],
      ['Finally, we\'ll review the new words with a game.', 'Cuối cùng, chúng ta ôn từ mới bằng trò chơi.'],
      ['Today we\'re going to talk about…', 'Hôm nay chúng ta sẽ nói về…'],
    ],
    listening: { scene: ['A teacher presents a lesson plan to colleagues.', 'Giáo viên trình bày giáo án trước đồng nghiệp.'], lines: [
      { who: 'A', en: 'My lesson is Grade 4, Unit 16: Weather.', vi: 'Bài của tôi là Unit 16 lớp 4: Weather.' },
      { who: 'A', en: 'By the end, pupils will be able to ask and answer "What\'s the weather like?"', vi: 'Cuối tiết, học sinh hỏi và trả lời được "What\'s the weather like?"' },
      { who: 'B', en: 'How will you warm up?', vi: 'Bạn khởi động thế nào?' },
      { who: 'A', en: 'With a weather song and actions — about three minutes.', vi: 'Bằng bài hát thời tiết có động tác — khoảng ba phút.' },
    ] },
    speaking: [
      ['Present your lesson plan stages to a colleague in English (3 minutes).', 'Trình bày các bước giáo án với đồng nghiệp bằng tiếng Anh (3 phút).'],
      ['Give a 3-minute talk on one primary topic as if introducing it to parents.', 'Nói 3 phút về một chủ đề tiểu học như đang giới thiệu với phụ huynh.'],
    ],
    rolePlay: ['You are my head of department. Ask me questions about my lesson plan aims and stages.', 'Bạn là tổ trưởng chuyên môn. Hãy hỏi tôi về mục tiêu và các bước giáo án.'],
    challenge: ['Write a one-page lesson plan in English for your demo lesson (aims, stages, timing, materials).', 'Viết giáo án một trang bằng tiếng Anh cho tiết dạy thử (mục tiêu, các bước, thời gian, học liệu).'],
    review: [
      ['Is "Pupils learn weather" a good aim? Improve it.', '"Pupils learn weather" có phải mục tiêu tốt không? Hãy sửa lại.'],
      ['What are the four main stages of your lesson?', 'Bốn bước chính trong bài của bạn là gì?'],
      ['Which stage needs the most English from you?', 'Bước nào đòi hỏi bạn dùng tiếng Anh nhiều nhất?'],
    ],
  }),
  L({
    id: 'w23', week: 23, stage: 6, title: ['Micro-teaching 15–20 minutes', 'Dạy thử 15–20 phút'],
    objectives: [
      ['Teach a 15–20 minute lesson mostly in English.', 'Dạy một tiết 15–20 phút chủ yếu bằng tiếng Anh.'],
      ['Keep teacher talk short and pupil talk high.', 'Giảm lời giáo viên, tăng thời gian học sinh nói.'],
      ['Record the lesson for review.', 'Ghi hình tiết dạy để xem lại.'],
    ],
    warmUp: ['Rehearse your first 60 seconds aloud three times.', 'Tập to 60 giây đầu tiên ba lần.'],
    vocabulary: [
      { word: 'teacher talking time', vi: 'thời gian giáo viên nói' }, { word: 'pupil talking time', vi: 'thời gian học sinh nói' },
      { word: 'rehearse', vi: 'tập dượt' }, { word: 'pace', vi: 'nhịp độ' }, { word: 'transition', vi: 'chuyển tiếp' },
      { word: 'board work', vi: 'trình bày bảng' }, { word: 'eye contact', vi: 'giao tiếp bằng mắt' }, { word: 'wrap up', vi: 'kết thúc, tổng kết' },
    ],
    expressions: [
      ['Let\'s review what we learnt today.', 'Cùng ôn lại hôm nay chúng ta học gì.'],
      ['Who can tell me one new word?', 'Em nào nói cô nghe một từ mới?'],
      ['Your homework is…', 'Bài tập về nhà của các em là…'],
      ['You worked really hard today!', 'Hôm nay các em đã rất cố gắng!'],
      ['See you next lesson! Goodbye, class.', 'Hẹn gặp lại các em tiết sau! Tạm biệt cả lớp.'],
    ],
    listening: { scene: ['Closing a demo lesson.', 'Kết thúc tiết dạy thử.'], lines: [
      { who: 'T', en: 'Time\'s up! Let\'s review. What did we learn today?', vi: 'Hết giờ rồi! Cùng ôn lại nhé. Hôm nay chúng ta học gì?' },
      { who: 'S', en: 'Weather words!', vi: 'Từ về thời tiết ạ!' },
      { who: 'T', en: 'Yes! Tell me one.', vi: 'Đúng! Nói cô nghe một từ.' },
      { who: 'S', en: 'Windy!', vi: 'Windy ạ!' },
      { who: 'T', en: 'Excellent. You worked really hard today. See you next lesson!', vi: 'Xuất sắc. Hôm nay các em rất cố gắng. Hẹn gặp lại tiết sau!' },
    ] },
    speaking: [
      ['Teach your demo lesson to colleagues or a real class and record it.', 'Dạy thử trước đồng nghiệp hoặc lớp thật và ghi hình.'],
      ['Count your teacher talk in one stage: can you cut it by half?', 'Đếm lượng lời giáo viên trong một bước: bạn có cắt bớt một nửa được không?'],
    ],
    rolePlay: ['You are a Grade 5 class in my demo lesson. Behave like real pupils: some answer quickly, some need help.', 'Bạn là lớp 5 trong tiết dạy thử. Hãy như học sinh thật: có em trả lời nhanh, có em cần giúp.'],
    challenge: ['Deliver the full 15–20 minute lesson and fill in the competence checklist yourself.', 'Dạy trọn 15–20 phút và tự điền phiếu đánh giá năng lực.'],
    review: [
      ['How much of the lesson was in English (estimate %)?', 'Bao nhiêu phần trăm tiết học dùng tiếng Anh (ước lượng)?'],
      ['Which transition was not smooth?', 'Chỗ chuyển tiếp nào chưa mượt?'],
      ['Write two things that went well.', 'Ghi hai điều làm tốt.'],
    ],
  }),
  L({
    id: 'w24', week: 24, stage: 6, title: ['Review, feedback & reteach', 'Xem lại, nhận phản hồi và dạy lại'],
    milestone: ['Final assessment: 15–20 minute demo lesson and overall evaluation.', 'Đánh giá cuối khoá: thi giảng 15–20 phút và đánh giá tổng thể.'],
    objectives: [
      ['Watch your recording and identify strengths and errors.', 'Xem lại video, nhận ra điểm mạnh và lỗi.'],
      ['Give and receive feedback in English.', 'Đưa và nhận phản hồi bằng tiếng Anh.'],
      ['Reteach one stage after improving it.', 'Dạy lại một bước sau khi điều chỉnh.'],
    ],
    warmUp: ['Watch the first two minutes of your video with the sound off. What does your body language say?', 'Xem hai phút đầu video ở chế độ tắt tiếng. Ngôn ngữ cơ thể của bạn nói lên điều gì?'],
    vocabulary: [
      { word: 'strength', vi: 'điểm mạnh' }, { word: 'area to improve', vi: 'điểm cần cải thiện' }, { word: 'feedback', vi: 'phản hồi' },
      { word: 'reflect', vi: 'suy ngẫm' }, { word: 'action plan', vi: 'kế hoạch hành động' }, { word: 'goal', vi: 'mục tiêu' },
      { word: 'progress', vi: 'sự tiến bộ' }, { word: 'confident', vi: 'tự tin' },
    ],
    expressions: [
      ['One thing that went well was…', 'Một điều làm tốt là…'],
      ['Next time, I would…', 'Lần sau, tôi sẽ…'],
      ['Could you give me some feedback on my instructions?', 'Bạn có thể nhận xét về cách tôi giao nhiệm vụ không?'],
      ['I really liked the way you…', 'Tôi rất thích cách bạn…'],
      ['Have you thought about…?', 'Bạn đã nghĩ đến việc… chưa?'],
    ],
    listening: { scene: ['Peer feedback after a demo lesson.', 'Đồng nghiệp góp ý sau tiết dạy thử.'], lines: [
      { who: 'A', en: 'I really liked your warm-up. The pupils were very excited.', vi: 'Tôi rất thích phần khởi động của bạn. Học sinh rất hào hứng.' },
      { who: 'B', en: 'Thank you! What could I do better?', vi: 'Cảm ơn bạn! Tôi có thể làm tốt hơn ở đâu?' },
      { who: 'A', en: 'Your instructions were a bit long. Have you thought about demonstrating first?', vi: 'Phần giao nhiệm vụ hơi dài. Bạn đã nghĩ đến việc làm mẫu trước chưa?' },
      { who: 'B', en: 'Good idea. Next time, I would show them first and then check with a question.', vi: 'Ý hay đấy. Lần sau tôi sẽ làm mẫu trước rồi kiểm tra bằng một câu hỏi.' },
    ] },
    speaking: [
      ['Give feedback on a colleague\'s lesson: two strengths and one suggestion.', 'Góp ý tiết dạy của đồng nghiệp: hai điểm mạnh và một gợi ý.'],
      ['Reteach the weakest stage of your lesson and compare the two recordings.', 'Dạy lại bước yếu nhất và so sánh hai video.'],
    ],
    rolePlay: ['You are an experienced teacher trainer. Give me feedback on my demo lesson and ask me to reflect.', 'Bạn là chuyên gia tập huấn giáo viên. Hãy góp ý tiết dạy thử và yêu cầu tôi tự đánh giá.'],
    challenge: ['Write your personal action plan: three goals for the next three months.', 'Viết kế hoạch hành động cá nhân: ba mục tiêu cho ba tháng tới.'],
    review: [
      ['Compare your week 1 and week 24 recordings. What has changed?', 'So sánh bản ghi tuần 1 và tuần 24. Điều gì đã thay đổi?'],
      ['Which of the six competences is your strongest now?', 'Trong sáu nhóm năng lực, nhóm nào giờ là thế mạnh của bạn?'],
      ['Rate your overall teaching in English on the 1–4 scale.', 'Tự chấm năng lực dạy bằng tiếng Anh theo thang 1–4.'],
    ],
  }),
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id) ?? null;
export const lessonsOfStage = (stage: number) => LESSONS.filter((l) => l.stage === stage);

/** Câu lệnh mẫu luyện nói với AI (theo tài liệu), ghép thêm tình huống của bài */
export function aiPrompt(lesson: Lesson): string {
  return [
    `Bạn hãy đóng vai trong tình huống sau: ${lesson.rolePlay[1]} (${lesson.rolePlay[0]})`,
    'Tôi là giáo viên tiếng Anh tiểu học. Hãy giao tiếp với tôi bằng tiếng Anh một cách tự nhiên.',
    `Chủ đề bài: ${lesson.title[0]} — ${lesson.title[1]}.`,
    'Yêu cầu:',
    '- Dùng câu ngắn, từ vựng phù hợp với học sinh tiểu học.',
    '- Đặt từng câu hỏi để tôi có thời gian trả lời.',
    '- Nếu tôi mắc lỗi, hãy sửa nhẹ nhàng: giải thích lỗi bằng tiếng Việt, đưa ra câu đúng và yêu cầu tôi nói lại.',
    '- Không ngắt lời liên tục khi tôi đang diễn đạt; phân biệt lỗi gây khó hiểu và lỗi nhỏ chưa cần ưu tiên.',
    '- Cuối buổi, đánh giá phát âm, ngữ pháp, từ vựng, độ trôi chảy và khả năng phản xạ theo thang 1–4.',
    '- Đề xuất 3 điểm cần cải thiện trong buổi luyện tiếp theo.',
  ].join('\n');
}
