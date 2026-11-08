// ============================================================================
// GIÁO TRÌNH PATTERN CHUNKS PHÂN BỔ THEO 3 ĐỘ TUỔI (4–6, 7–9, 10–12 TUỔI)
// ============================================================================

export type AgeLevel = 'age4_6' | 'age7_9' | 'age10_12';

export interface PatternSlotItem {
  id: string;
  slotEn: string;         // Cụm biến số thay vào khung (VD: "red apple")
  slotVi: string;         // Nghĩa tiếng Việt ngắn (VD: "quả táo đỏ")
  fullSentence: string;   // Câu hoàn chỉnh để đọc & chấm phản xạ
  fullVi: string;         // Nghĩa cả câu (chỉ hiện khi bật gợi ý)
  icon: string;           // Tên file 3D trong /emoji/f3d/<icon>.webp
  bossPrompt: string;     // Câu hỏi kích thích của Boss Cú Milo
  bossPromptVi: string;   // Tình huống kích thích
}

export interface PatternChunkGroup {
  id: string;
  level: AgeLevel;
  pattern: string;        // Khung câu (VD: "It's a [___]!")
  framePrefix: string;    // Phần trước biến số
  frameSuffix: string;    // Phần sau biến số
  viPurpose: string;      // Chức năng giao tiếp
  stimulusContext: string;// Ngữ cảnh kích hoạt
  targetLatencyMs: number;// Mục tiêu độ trễ phản xạ (ms)
  slots: PatternSlotItem[];
}

export const AGE_LEVEL_META: Record<
  AgeLevel,
  { code: AgeLevel; badge: string; title: string; subtitle: string; targetMs: number; description: string }
> = {
  age4_6: {
    code: 'age4_6',
    badge: '🌱 Cấp độ 1 · 4–6 tuổi',
    title: 'Visual-Sensory Chunks',
    subtitle: 'Mầm non & Lớp 1 · Bật cụm 3–5 từ (< 1.2s)',
    targetMs: 1200,
    description: 'Kết nối 100% hình ảnh 3D và hành động vật lý (TPR) với các khung câu ngắn, nhịp điệu vui nhộn.',
  },
  age7_9: {
    code: 'age7_9',
    badge: '🚀 Cấp độ 2 · 7–9 tuổi',
    title: 'Expansion & Micro-Story',
    subtitle: 'Lớp 2–3 · Thay biến số linh hoạt (< 1.0s)',
    targetMs: 1000,
    description: 'Đóng vai tình huống giao tiếp hằng ngày, bộc lộ sở thích và mô tả sự vật xung quanh.',
  },
  age10_12: {
    code: 'age10_12',
    badge: '⚡ Cấp độ 3 · 10–12 tuổi',
    title: 'Logic & Dynamic Reasoning',
    subtitle: 'Lớp 4–5 · Nối vế nguyên nhân & điều kiện (< 0.8s)',
    targetMs: 800,
    description: 'Phản xạ câu ghép chỉ mục đích, giải thích lý do (because / to / so that) và câu điều kiện.',
  },
};

export const PATTERN_CHUNKS_BY_LEVEL: Record<AgeLevel, PatternChunkGroup[]> = {
  // ==========================================================================
  // GIAI ĐOẠN 1: 4–6 TUỔI (VISUAL-SENSORY CHUNKS)
  // ==========================================================================
  age4_6: [
    {
      id: 'c1-its-a',
      level: 'age4_6',
      pattern: "It's a [ ___ ]!",
      framePrefix: "It's a ",
      frameSuffix: '!',
      viPurpose: 'Gọi tên đồ vật / con vật quanh bé',
      stimulusContext: 'Flashcard 3D bật mở bất ngờ',
      targetLatencyMs: 1200,
      slots: [
        { id: 's1', slotEn: 'red apple', slotVi: 'quả táo đỏ', fullSentence: "It's a red apple!", fullVi: 'Đó là một quả táo đỏ!', icon: 'red-apple', bossPrompt: 'Look! What is this sweet fruit?', bossPromptVi: 'Nhìn kìa! Quả gì màu đỏ ngọt ngào thế nhỉ?' },
        { id: 's2', slotEn: 'big dog', slotVi: 'chú chó lớn', fullSentence: "It's a big dog!", fullVi: 'Đó là một chú chó lớn!', icon: 'dog', bossPrompt: 'Woof woof! Who is barking at the door?', bossPromptVi: 'Gâu gâu! Ai đang ở ngoài cửa thế?' },
        { id: 's3', slotEn: 'yellow sun', slotVi: 'mặt trời vàng', fullSentence: "It's a yellow sun!", fullVi: 'Đó là ông mặt trời màu vàng!', icon: 'sun', bossPrompt: 'What is shining brightly in the sky?', bossPromptVi: 'Cái gì đang tỏa sáng trên bầu trời?' },
        { id: 's4', slotEn: 'school bus', slotVi: 'xe buýt trường', fullSentence: "It's a school bus!", fullVi: 'Đó là chiếc xe buýt trường học!', icon: 'bus', bossPrompt: 'Beep beep! What vehicle takes us to school?', bossPromptVi: 'Bíp bíp! Xe gì chở chúng mình tới trường?' },
        { id: 's5', slotEn: 'cute rabbit', slotVi: 'chú thỏ xinh', fullSentence: "It's a cute rabbit!", fullVi: 'Đó là một chú thỏ dễ thương!', icon: 'rabbit', bossPrompt: 'Who has long ears and loves carrots?', bossPromptVi: 'Ai có đôi tai dài và thích ăn cà rốt?' },
      ],
    },
    {
      id: 'c1-i-want',
      level: 'age4_6',
      pattern: 'I want [ ___ ]!',
      framePrefix: 'I want ',
      frameSuffix: '!',
      viPurpose: 'Nói món đồ hoặc món ăn em muốn',
      stimulusContext: 'Giỏ quà của Cú Milo mở ra',
      targetLatencyMs: 1200,
      slots: [
        { id: 's1', slotEn: 'some milk', slotVi: 'một ít sữa', fullSentence: 'I want some milk!', fullVi: 'Tớ muốn uống sữa!', icon: 'glass-of-milk', bossPrompt: 'Are you thirsty? What do you want to drink?', bossPromptVi: 'Em khát nước à? Em muốn uống gì?' },
        { id: 's2', slotEn: 'the teddy bear', slotVi: 'gấu bông', fullSentence: 'I want the teddy bear!', fullVi: 'Tớ muốn chú gấu bông!', icon: 'teddy-bear', bossPrompt: 'Which toy do you want to hug?', bossPromptVi: 'Em muốn ôm món đồ chơi nào?' },
        { id: 's3', slotEn: 'a sweet banana', slotVi: 'quả chuối ngọt', fullSentence: 'I want a sweet banana!', fullVi: 'Tớ muốn một quả chuối ngọt!', icon: 'banana', bossPrompt: 'It is snack time! What fruit do you want?', bossPromptVi: 'Đến giờ ăn nhẹ rồi! Em muốn quả gì?' },
        { id: 's4', slotEn: 'an ice cream', slotVi: 'cây kem mát', fullSentence: 'I want an ice cream!', fullVi: 'Tớ muốn một cây kem!', icon: 'soft-ice-cream', bossPrompt: 'It is a hot day! What cool treat do you want?', bossPromptVi: 'Trời nóng quá! Em muốn món gì mát lạnh?' },
      ],
    },
    {
      id: 'c1-look-at',
      level: 'age4_6',
      pattern: 'Look at the [ ___ ]!',
      framePrefix: 'Look at the ',
      frameSuffix: '!',
      viPurpose: 'Chỉ cho bạn cùng xem điều thú vị',
      stimulusContext: 'Đèn pin rọi sáng vật thể trong tranh',
      targetLatencyMs: 1200,
      slots: [
        { id: 's1', slotEn: 'happy monkey', slotVi: 'chú khỉ vui vẻ', fullSentence: 'Look at the happy monkey!', fullVi: 'Nhìn chú khỉ vui vẻ kìa!', icon: 'monkey', bossPrompt: 'Point your finger! Who is climbing the tree?', bossPromptVi: 'Chỉ tay lên cây kìa! Ai đang trèo cây thế?' },
        { id: 's2', slotEn: 'colorful rainbow', slotVi: 'cầu vồng rực rỡ', fullSentence: 'Look at the colorful rainbow!', fullVi: 'Nhìn cầu vồng rực rỡ kìa!', icon: 'rainbow', bossPrompt: 'The rain stopped! What is in the sky?', bossPromptVi: 'Mưa tạnh rồi! Cái gì hiện ra trên bầu trời?' },
        { id: 's3', slotEn: 'little butterfly', slotVi: 'chú bướm nhỏ', fullSentence: 'Look at the little butterfly!', fullVi: 'Nhìn chú bướm nhỏ kìa!', icon: 'butterfly', bossPrompt: 'What is flying over the flower?', bossPromptVi: 'Con gì đang bay trên bông hoa thế?' },
        { id: 's4', slotEn: 'bright star', slotVi: 'ngôi sao sáng', fullSentence: 'Look at the bright star!', fullVi: 'Nhìn ngôi sao sáng kìa!', icon: 'star', bossPrompt: 'Night is here! What is twinkling above us?', bossPromptVi: 'Trời tối rồi! Cái gì đang lấp lánh trên cao?' },
      ],
    },
    {
      id: 'c1-i-can',
      level: 'age4_6',
      pattern: 'I can [ ___ ]!',
      framePrefix: 'I can ',
      frameSuffix: '!',
      viPurpose: 'Nói về hành động em làm được (Simon Says)',
      stimulusContext: 'Hiệu lệnh vận động TPR',
      targetLatencyMs: 1200,
      slots: [
        { id: 's1', slotEn: 'run fast', slotVi: 'chạy thật nhanh', fullSentence: 'I can run fast!', fullVi: 'Tớ có thể chạy thật nhanh!', icon: 'person-running', bossPrompt: 'Ready, set, go! What can you do on the playground?', bossPromptVi: 'Chuẩn bị, chạy thôi! Em làm được gì trên sân chơi?' },
        { id: 's2', slotEn: 'ride a bike', slotVi: 'đạp xe đạp', fullSentence: 'I can ride a bike!', fullVi: 'Tớ biết đi xe đạp!', icon: 'person-biking', bossPrompt: 'Put on your helmet! What can you do in the park?', bossPromptVi: 'Đội mũ bảo hiểm vào! Em biết làm gì ở công viên?' },
        { id: 's3', slotEn: 'swim well', slotVi: 'bơi giỏi', fullSentence: 'I can swim well!', fullVi: 'Tớ bơi rất giỏi!', icon: 'person-swimming', bossPrompt: 'Splash into the pool! What can you do in the water?', bossPromptVi: 'Xuống hồ bơi nào! Em biết làm gì dưới nước?' },
        { id: 's4', slotEn: 'draw a picture', slotVi: 'vẽ tranh', fullSentence: 'I can draw a picture!', fullVi: 'Tớ có thể vẽ một bức tranh!', icon: 'artist-palette', bossPrompt: 'Pick up your crayons! What can you make?', bossPromptVi: 'Cầm bút màu lên nào! Em có thể làm gì?' },
      ],
    },
    {
      id: 'c1-no-its-not',
      level: 'age4_6',
      pattern: "No, it's not! It's a [ ___ ]!",
      framePrefix: "No, it's not! It's a ",
      frameSuffix: '!',
      viPurpose: 'Phản xạ đính chính khi Cú Milo cố tình đoán sai',
      stimulusContext: 'Cú Milo trêu chọc đoán nhầm đồ vật',
      targetLatencyMs: 1200,
      slots: [
        { id: 's1', slotEn: 'cat', slotVi: 'con mèo', fullSentence: "No, it's not! It's a cat!", fullVi: 'Không phải đâu! Đó là con mèo!', icon: 'cat', bossPrompt: 'Meow! Is this a big elephant?', bossPromptVi: 'Meo meo! Đây có phải là con voi to không nhỉ?' },
        { id: 's2', slotEn: 'bicycle', slotVi: 'chiếc xe đạp', fullSentence: "No, it's not! It's a bicycle!", fullVi: 'Không phải đâu! Đó là chiếc xe đạp!', icon: 'bicycle', bossPrompt: 'Ring ring! Is this an airplane?', bossPromptVi: 'Kính coong! Đây có phải là chiếc máy bay không?' },
        { id: 's3', slotEn: 'strawberry', slotVi: 'quả dâu tây', fullSentence: "No, it's not! It's a strawberry!", fullVi: 'Không phải đâu! Đó là quả dâu tây!', icon: 'strawberry', bossPrompt: 'Look at this red berry! Is it a watermelon?', bossPromptVi: 'Nhìn quả màu đỏ nhỏ xinh này! Có phải quả dưa hấu không?' },
      ],
    },
  ],

  // ==========================================================================
  // GIAI ĐOẠN 2: 7–9 TUỔI (EXPANSION & MICRO-STORY CHUNKS)
  // ==========================================================================
  age7_9: [
    {
      id: 'c2-can-i-have',
      level: 'age7_9',
      pattern: 'Can I have [ ___ ], please?',
      framePrefix: 'Can I have ',
      frameSuffix: ', please?',
      viPurpose: 'Hỏi xin lịch sự ở bàn ăn hoặc cửa hàng',
      stimulusContext: 'Đóng vai mua hàng tại siêu thị ảo',
      targetLatencyMs: 1000,
      slots: [
        { id: 's1', slotEn: 'some clean water', slotVi: 'một cốc nước sạch', fullSentence: 'Can I have some clean water, please?', fullVi: 'Cho cháu xin một cốc nước sạch ạ?', icon: 'droplet', bossPrompt: 'You just finished running! Ask politely for water:', bossPromptVi: 'Em vừa chạy thể dục xong! Hãy lịch sự xin nước uống:' },
        { id: 's2', slotEn: 'that storybook', slotVi: 'quyển truyện đó', fullSentence: 'Can I have that storybook, please?', fullVi: 'Cho tớ mượn quyển truyện đó nhé?', icon: 'open-book', bossPrompt: 'You are at the school library! Ask the teacher for the book:', bossPromptVi: 'Em đang ở thư viện trường! Hãy hỏi mượn cô giáo quyển truyện:' },
        { id: 's3', slotEn: 'a warm sandwich', slotVi: 'chiếc bánh mì kẹp ấm', fullSentence: 'Can I have a warm sandwich, please?', fullVi: 'Cho con xin một chiếc bánh mì kẹp ấm ạ?', icon: 'sandwich', bossPrompt: 'It is breakfast time! Ask mom for a sandwich:', bossPromptVi: 'Đến giờ ăn sáng rồi! Hãy xin mẹ chiếc bánh mì kẹp:' },
        { id: 's4', slotEn: 'a new pencil', slotVi: 'chiếc bút chì mới', fullSentence: 'Can I have a new pencil, please?', fullVi: 'Cho em xin một chiếc bút chì mới ạ?', icon: 'pencil', bossPrompt: 'You need to write your homework! Ask for a pencil:', bossPromptVi: 'Em cần viết bài tập! Hãy hỏi xin chiếc bút chì:' },
      ],
    },
    {
      id: 'c2-there-is',
      level: 'age7_9',
      pattern: 'There is a [ ___ ]!',
      framePrefix: 'There is a ',
      frameSuffix: '!',
      viPurpose: 'Quan sát và mô tả vị trí đồ vật / con vật',
      stimulusContext: 'Thám tử nhí quan sát căn phòng',
      targetLatencyMs: 1000,
      slots: [
        { id: 's1', slotEn: 'cat on the bed', slotVi: 'chú mèo trên giường', fullSentence: 'There is a cat on the bed!', fullVi: 'Có một chú mèo đang ở trên giường!', icon: 'bed', bossPrompt: 'Look into the bedroom! What do you see on the bed?', bossPromptVi: 'Nhìn vào phòng ngủ kìa! Em thấy gì trên giường?' },
        { id: 's2', slotEn: 'bus at the school gate', slotVi: 'xe buýt ở cổng trường', fullSentence: 'There is a bus at the school gate!', fullVi: 'Có một chiếc xe buýt ở cổng trường!', icon: 'bus-stop', bossPrompt: 'Look outside the school! What is waiting at the gate?', bossPromptVi: 'Nhìn ra cổng trường kìa! Cái gì đang đậu ở đó?' },
        { id: 's3', slotEn: 'turtle in the garden', slotVi: 'chú rùa trong vườn', fullSentence: 'There is a turtle in the garden!', fullVi: 'Có một chú rùa ở trong vườn!', icon: 'turtle', bossPrompt: 'Step into the green garden! Who is crawling slowly?', bossPromptVi: 'Bước ra khu vườn xanh! Ai đang bò chậm rãi thế?' },
        { id: 's4', slotEn: 'rainbow in the sky', slotVi: 'cầu vồng trên bầu trời', fullSentence: 'There is a rainbow in the sky!', fullVi: 'Có một chiếc cầu vồng trên bầu trời!', icon: 'rainbow', bossPrompt: 'Look up after the rain! What is shining in the sky?', bossPromptVi: 'Nhìn lên trời sau cơn mưa kìa! Có gì trên bầu trời?' },
      ],
    },
    {
      id: 'c2-im-going-to',
      level: 'age7_9',
      pattern: "I'm going to [ ___ ].",
      framePrefix: "I'm going to ",
      frameSuffix: '.',
      viPurpose: 'Nói về dự định / hoạt động sắp làm theo giờ',
      stimulusContext: 'Đồng hồ báo giờ sinh hoạt trong ngày',
      targetLatencyMs: 1000,
      slots: [
        { id: 's1', slotEn: 'brush my teeth', slotVi: 'đánh răng', fullSentence: "I'm going to brush my teeth.", fullVi: 'Tớ chuẩn bị đi đánh răng đây.', icon: 'tooth', bossPrompt: "It's 7 o'clock in the morning! What are you going to do in the bathroom?", bossPromptVi: '7 giờ sáng rồi! Em chuẩn bị làm gì trong phòng tắm?' },
        { id: 's2', slotEn: 'eat my lunch', slotVi: 'ăn bữa trưa', fullSentence: "I'm going to eat my lunch.", fullVi: 'Tớ chuẩn bị ăn bữa trưa đây.', icon: 'bento-box', bossPrompt: "It's 12 o'clock at noon! What are you going to do?", bossPromptVi: '12 giờ trưa rồi! Em chuẩn bị làm gì?' },
        { id: 's3', slotEn: 'play soccer with friends', slotVi: 'đá bóng với các bạn', fullSentence: "I'm going to play soccer with friends.", fullVi: 'Tớ sắp đi đá bóng cùng các bạn.', icon: 'soccer-ball', bossPrompt: 'School is over! What are you going to do on the field?', bossPromptVi: 'Tan học rồi! Em định làm gì trên sân cỏ?' },
        { id: 's4', slotEn: 'go to sleep early', slotVi: 'đi ngủ sớm', fullSentence: "I'm going to go to sleep early.", fullVi: 'Tớ chuẩn bị đi ngủ sớm đây.', icon: 'sleeping-face', bossPrompt: "It's 9 o'clock at night! What are you going to do?", bossPromptVi: '9 giờ tối rồi! Em chuẩn bị làm gì?' },
      ],
    },
    {
      id: 'c2-do-you-like',
      level: 'age7_9',
      pattern: 'Yes, I do! I love [ ___ ]!',
      framePrefix: 'Yes, I do! I love ',
      frameSuffix: '!',
      viPurpose: 'Phản xạ trả lời câu hỏi Do you like...? kèm cảm xúc',
      stimulusContext: 'Hỏi đáp siêu tốc 2 chiều với Cú Milo',
      targetLatencyMs: 1000,
      slots: [
        { id: 's1', slotEn: 'fresh strawberries', slotVi: 'dâu tây tươi', fullSentence: 'Yes, I do! I love fresh strawberries!', fullVi: 'Có chứ! Tớ rất thích dâu tây tươi!', icon: 'strawberry', bossPrompt: 'Do you like eating fresh strawberries?', bossPromptVi: 'Em có thích ăn dâu tây tươi không?' },
        { id: 's2', slotEn: 'playing badminton', slotVi: 'chơi cầu lông', fullSentence: 'Yes, I do! I love playing badminton!', fullVi: 'Có chứ! Tớ rất thích chơi cầu lông!', icon: 'badminton', bossPrompt: 'Do you like playing badminton at recess?', bossPromptVi: 'Em có thích chơi cầu lông vào giờ ra chơi không?' },
        { id: 's3', slotEn: 'reading funny stories', slotVi: 'đọc truyện vui', fullSentence: 'Yes, I do! I love reading funny stories!', fullVi: 'Có chứ! Tớ rất thích đọc những câu chuyện vui!', icon: 'books', bossPrompt: 'Do you like reading funny stories?', bossPromptVi: 'Em có thích đọc truyện vui không?' },
      ],
    },
  ],

  // ==========================================================================
  // GIAI ĐOẠN 3: 10–12 TUỔI (LOGIC & DYNAMIC REASONING)
  // ==========================================================================
  age10_12: [
    {
      id: 'c3-i-prefer-because',
      level: 'age10_12',
      pattern: 'I prefer [ ___ ].',
      framePrefix: 'I prefer ',
      frameSuffix: '.',
      viPurpose: 'Nêu lựa chọn cá nhân và giải thích lý do (because)',
      stimulusContext: 'Thử thách lựa chọn nhanh This or That',
      targetLatencyMs: 800,
      slots: [
        { id: 's1', slotEn: 'riding a bike, because it keeps me healthy', slotVi: 'đạp xe vì giúp khỏe mạnh', fullSentence: 'I prefer riding a bike, because it keeps me healthy.', fullVi: 'Tớ thích đạp xe hơn vì nó giúp tớ khỏe mạnh.', icon: 'person-biking', bossPrompt: 'Riding a bike or sitting all day — which do you prefer and why?', bossPromptVi: 'Đạp xe hay ngồi cả ngày — em thích điều nào hơn và vì sao?' },
        { id: 's2', slotEn: 'eating fresh fruit, because it has vitamins', slotVi: 'ăn trái cây vì giàu vitamin', fullSentence: 'I prefer eating fresh fruit, because it has vitamins.', fullVi: 'Tớ thích ăn trái cây tươi hơn vì có nhiều vitamin.', icon: 'red-apple', bossPrompt: 'Fresh fruit or sugary candy — which do you prefer and why?', bossPromptVi: 'Trái cây tươi hay kẹo ngọt — em chọn món nào và vì sao?' },
        { id: 's3', slotEn: 'reading books, because I learn new ideas', slotVi: 'đọc sách vì học được ý hay', fullSentence: 'I prefer reading books, because I learn new ideas.', fullVi: 'Tớ thích đọc sách hơn vì học được nhiều ý tưởng mới.', icon: 'open-book', bossPrompt: 'Why do you prefer reading books in your free time?', bossPromptVi: 'Vì sao em thích đọc sách vào giờ rảnh?' },
      ],
    },
    {
      id: 'c3-if-it-will',
      level: 'age10_12',
      pattern: 'If [ ___ ].',
      framePrefix: 'If ',
      frameSuffix: '.',
      viPurpose: 'Phản xạ câu điều kiện loại 1 trước tình huống thay đổi',
      stimulusContext: 'Dự báo thời tiết & tình huống biến đổi ngẫu nhiên',
      targetLatencyMs: 800,
      slots: [
        { id: 's1', slotEn: 'it is sunny, I will play in the park', slotVi: 'trời nắng thì đi chơi công viên', fullSentence: 'If it is sunny, I will play in the park.', fullVi: 'Nếu trời nắng đẹp, tớ sẽ ra công viên chơi.', icon: 'sun', bossPrompt: 'Look at the bright sun! What will you do if it is sunny?', bossPromptVi: 'Trời nắng đẹp quá! Em sẽ làm gì nếu trời nắng?' },
        { id: 's2', slotEn: 'it rains heavily, I will read books at home', slotVi: 'trời mưa to thì đọc sách ở nhà', fullSentence: 'If it rains heavily, I will read books at home.', fullVi: 'Nếu trời mưa to, tớ sẽ đọc sách ở nhà.', icon: 'cloud-with-rain', bossPrompt: 'Dark clouds are coming! What will you do if it rains heavily?', bossPromptVi: 'Mây đen kéo đến rồi! Em sẽ làm gì nếu trời mưa to?' },
        { id: 's3', slotEn: 'I finish homework early, I will help my mom cook', slotVi: 'xong bài sớm thì giúp mẹ nấu ăn', fullSentence: 'If I finish homework early, I will help my mom cook.', fullVi: 'Nếu làm xong bài tập sớm, tớ sẽ giúp mẹ nấu ăn.', icon: 'cooking', bossPrompt: 'What will you do if you finish your homework early tonight?', bossPromptVi: 'Tối nay nếu làm xong bài tập sớm, em sẽ làm gì?' },
      ],
    },
    {
      id: 'c3-what-should-i-do',
      level: 'age10_12',
      pattern: 'You should [ ___ ]!',
      framePrefix: 'You should ',
      frameSuffix: '!',
      viPurpose: 'Đưa ra lời khuyên nhanh khi bạn gặp rắc rối',
      stimulusContext: 'Cú Milo cần lời khuyên xử lý tình huống',
      targetLatencyMs: 800,
      slots: [
        { id: 's1', slotEn: 'wash your hands with soap right away', slotVi: 'rửa tay bằng xà phòng ngay', fullSentence: 'You should wash your hands with soap right away!', fullVi: 'Cậu nên rửa tay bằng xà phòng ngay lập tức!', icon: 'soap', bossPrompt: 'Oh no, my hands are covered in mud before lunch! What should I do?', bossPromptVi: 'Ôi, tay tớ dính bẩn trước giờ ăn trưa rồi! Tớ nên làm gì?' },
        { id: 's2', slotEn: 'go to bed early to rest your eyes', slotVi: 'đi ngủ sớm để mắt nghỉ ngơi', fullSentence: 'You should go to bed early to rest your eyes!', fullVi: 'Cậu nên đi ngủ sớm để đôi mắt được nghỉ ngơi!', icon: 'sleeping-face', bossPrompt: 'I feel so sleepy and my eyes are tired! What should I do?', bossPromptVi: 'Tớ buồn ngủ và mỏi mắt quá! Tớ nên làm gì bây giờ?' },
        { id: 's3', slotEn: 'raise your hand and ask the teacher politely', slotVi: 'giơ tay hỏi cô giáo lễ phép', fullSentence: 'You should raise your hand and ask the teacher politely!', fullVi: 'Cậu nên giơ tay và lễ phép hỏi cô giáo!', icon: 'raised-hand', bossPrompt: 'I do not understand this math problem in class! What should I do?', bossPromptVi: 'Tớ chưa hiểu bài toán này trên lớp! Tớ nên làm gì?' },
      ],
    },
  ],
};
