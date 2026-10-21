// Kho từ cho phiếu chính tả lớp 1 (tự soạn, không chép sách): mỗi từ ghi phần cần điền trong ngoặc vuông,
// vd "con [c]áo" → học sinh điền "c". pic = tên hình (bộ hình 3D Fluent Emoji của Microsoft, giấy phép MIT, lưu ở public/emoji).

export type PairId = 'c-k' | 'g-gh' | 'ng-ngh' | 's-x' | 'l-n' | 'ch-tr' | 'h-th-kh' | 'an-ang' | 'at-ac';
export type PicWord = { w: string; pic: string };
export type Pair = {
  id: PairId;
  /** các âm cần phân biệt, đúng thứ tự hiển thị */
  options: string[];
  title: string;
  /** 'van' = phân biệt vần: đáp án có thể kèm dấu thanh (b[àn] → "àn"); mặc định phân biệt âm đầu */
  kind?: 'van';
  /** quy tắc nhắc học sinh (có với cặp có luật chính tả) */
  rule?: string;
  pics: PicWord[];
  words: string[];
  copy: string[];
};

export const PAIRS: Pair[] = [
  {
    id: 'c-k', options: ['c', 'k'], title: 'Phân biệt c/k',
    rule: 'Viết k trước e, ê, i. Viết c trước các âm còn lại (a, ă, â, o, ô, ơ, u, ư).',
    pics: [
      { w: '[c]á', pic: 'tropical-fish' }, { w: '[c]ú', pic: 'owl' }, { w: '[c]ọ', pic: 'paintbrush' }, { w: '[c]ua', pic: 'crab' }, { w: '[c]à chua', pic: 'tomato' }, { w: '[k]em', pic: 'ice-cream' }, { w: '[k]éo', pic: 'scissors' }, { w: '[k]ẹo', pic: 'candy' }, { w: '[k]èn', pic: 'trumpet' }, { w: '[k]iến', pic: 'ant' }, { w: '[k]im', pic: 'sewing-needle' },
      
      { w: 'con [c]á', pic: 'tropical-fish' }, { w: 'con [c]ua', pic: 'crab' }, { w: '[c]á heo', pic: 'dolphin' }, { w: '[c]á voi', pic: 'spouting-whale' },
      { w: 'con [c]áo', pic: 'fox' }, { w: 'con [c]ú', pic: 'owl' }, { w: '[c]à rốt', pic: 'carrot' }, { w: 'quả [c]à chua', pic: 'tomato' },
      { w: 'quả [c]à tím', pic: 'eggplant' }, { w: 'quả [c]am', pic: 'tangerine' }, { w: '[c]úp vàng', pic: 'trophy' }, { w: '[c]ầu vồng', pic: 'rainbow' },
      { w: 'cái [c]ân', pic: 'balance-scale' }, { w: 'con [c]ừu', pic: 'ewe' }, { w: '[c]ọ vẽ', pic: 'paintbrush' }, { w: 'cái [c]ưa', pic: 'carpentry-saw' },
      { w: 'cái [k]éo', pic: 'scissors' }, { w: 'que [k]em', pic: 'ice-cream' }, { w: 'cái [k]ính', pic: 'glasses' }, { w: '[k]ính lúp', pic: 'magnifying-glass-tilted-left' },
      { w: 'con [k]iến', pic: 'ant' }, { w: 'viên [k]ẹo', pic: 'candy' }, { w: '[k]ẹo mút', pic: 'lollipop' }, { w: 'cái [k]èn', pic: 'trumpet' },
      { w: 'con [k]ì lân', pic: 'unicorn' }, { w: '[k]im khâu', pic: 'sewing-needle' }, { w: '[k]im cương', pic: 'gem-stone' }, { w: 'quả [k]i-wi', pic: 'kiwi-fruit' },
      { w: 'thanh [k]iếm', pic: 'dagger' }, { w: '[k]ẹp giấy', pic: 'paperclip' },
    ],
    words: [
      '[c]á kho', 'cá [c]ờ', '[c]ổ [c]ò', '[k]ẻ ô', 'bà [k]ể', '[k]ì đà', '[c]ủ hẹ', '[c]ô bé', '[c]ụ bà', '[c]ũ [k]ĩ', 'bé [k]ê', '[c]ỗ lễ', '[k]ề vai', 'đồ [c]ổ',
      '[c]on mèo', '[c]ái bàn', 'bé [c]ười', '[c]ặp sách', 'dòng [k]ênh', '[k]ể chuyện', '[k]ì lạ', 'thước [k]ẻ', '[c]ơm nước', 'cái [c]ốc', '[k]iến thức', 'con [c]ò', '[c]ỏ non', 'bánh [k]em', 'chữ [k]í', 'quả [c]ọ', '[c]ây đa', 'lá [c]ờ', '[k]ìm kẹp', 'cái [k]iềng', 'gõ [k]ẻng', '[k]ết bạn', '[c]ô giáo', '[c]ủ khoai'],
    copy: [
      'Bé có lá cờ đỏ.', 'Bà kể cho bé nghe.', 'Cô bé kẻ ô li.',
      'Con cá heo bơi lội tung tăng.', 'Bé kể chuyện con kiến cho bà nghe.', 'Mẹ mua cho em cây kem và quả cam.', 'Cô giáo khen bé viết chữ kí đẹp.'],
  },
  {
    id: 'g-gh', options: ['g', 'gh'], title: 'Phân biệt g/gh',
    rule: 'Viết gh trước e, ê, i. Viết g trước các âm còn lại.',
    pics: [
      { w: '[g]à', pic: 'rooster' }, { w: '[gh]ế', pic: 'chair' }, { w: '[gh]ẹ', pic: 'crab' }, { w: '[g]ỗ', pic: 'wood' }, { w: '[g]ấu', pic: 'bear' },
      
      { w: 'con [g]à', pic: 'rooster' }, { w: '[g]à con', pic: 'baby-chick' }, { w: 'con [g]ấu', pic: 'bear' }, { w: '[g]ấu bông', pic: 'teddy-bear' },
      { w: '[g]ấu trúc', pic: 'panda' }, { w: 'cái [g]ương', pic: 'mirror' }, { w: '[g]ăng tay', pic: 'gloves' }, { w: 'khúc [g]ỗ', pic: 'wood' },
      { w: 'viên [g]ạch', pic: 'brick' }, { w: 'củ [g]ừng', pic: 'ginger-root' }, { w: 'con [g]ấu trắng', pic: 'polar-bear' },
      { w: 'cái [gh]ế', pic: 'chair' }, { w: 'đàn [gh]i-ta', pic: 'guitar' }, { w: 'con [gh]ẹ', pic: 'crab' },
    ],
    words: [
      '[g]à mơ', '[gh]ế [g]ỗ', '[gh]i chú', 'ổ [g]à', '[gh]ẹ đỏ', 'đi [gh]e', '[g]ỗ [g]ụ', 'bé [gh]i', '[g]ò đất',
      '[g]ọn gàng', '[g]ồ [gh]ề', '[gh]i nhớ', '[gh]é thăm', 'nhà [g]a', 'con [g]ấu', '[gh]ép hình', '[g]ói quà', '[gh]ềnh thác', 'bàn [gh]ế', '[g]ửi thư', 'cái [g]ối', '[gh]i chép', '[g]ỗ lim', 'cầu [g]ỗ', '[g]ần gũi', '[g]ạo nếp', 'ngõ [g]ạch', '[gh]e thuyền', '[g]õ cửa'],
    copy: [
      'Nhà bà có ghế gỗ.', 'Bé ghi nhớ lời mẹ.', 'Gà mơ có ổ ở bờ đê.',
      'Bé ghé thăm nhà bà ngoại.', 'Gà con chạy quanh gốc cây.', 'Em xếp bàn ghế gọn gàng.', 'Chị gửi quà cho em.'],
  },
  {
    id: 'ng-ngh', options: ['ng', 'ngh'], title: 'Phân biệt ng/ngh',
    rule: 'Viết ngh trước e, ê, i. Viết ng trước các âm còn lại.',
    pics: [
      { w: '[ng]ô', pic: 'ear-of-corn' }, { w: '[ngh]é', pic: 'water-buffalo' }, { w: '[ng]ựa', pic: 'horse' }, { w: '[ng]ỗng', pic: 'goose' },
      
      { w: 'con [ng]ựa', pic: 'horse' }, { w: '[ng]ôi sao', pic: 'star' }, { w: 'bắp [ng]ô', pic: 'ear-of-corn' }, { w: 'con [ng]ỗng', pic: 'goose' },
      { w: '[ng]ôi nhà', pic: 'house-with-garden' }, { w: '[ng]ọn lửa', pic: 'fire' }, { w: '[ng]ọn núi', pic: 'mountain' }, { w: 'bé [ng]ủ', pic: 'sleeping-face' },
      { w: '[ng]ân hàng', pic: 'bank' }, { w: '[ng]ọn nến', pic: 'candle' },
      { w: 'con [ngh]é', pic: 'water-buffalo' }, { w: '[ngh]e nhạc', pic: 'headphone' },
    ],
    words: [
      '[ng]ã ba', '[ng]ủ', '[ngh]ĩ', '[ng]ô non', 'bé [ngh]ỉ', '[ngh]e kể', '[ng]õ hẹp', '[ng]ừ', '[ngh]ệ', '[ng]ư phủ',
      '[ng]ã tư', '[ngh]ề nghiệp', 'suy [ngh]ĩ', '[ng]ày mai', '[ngh]ỉ hè', '[ng]ộ nghĩnh', 'lắng [ngh]e', '[ng]ủ trưa', '[ngh]iêng ngả', 'con [ng]an', 'củ [ngh]ệ', '[ng]õ nhỏ', '[ngh]é ọ', '[ng]ạc nhiên', 'cá [ng]ừ', '[ngh]ĩ ngợi', '[ng]ón tay', 'bé [ngh]e lời', '[ng]ọt ngào', 'nhà [ngh]èo'],
    copy: [
      'Bé nghỉ ở nhà bà.', 'Bà có ngô và củ nghệ.', 'Nghé ọ ọ ở bờ đê.',
      'Bé lắng nghe cô kể chuyện.', 'Con ngựa phi nhanh trên đồng cỏ.', 'Nghỉ hè, em về quê ngoại.', 'Mẹ nấu bắp ngô thơm ngọt.'],
  },
  {
    id: 's-x', options: ['s', 'x'], title: 'Phân biệt s/x',
    pics: [
      { w: '[x]e', pic: 'bicycle' }, { w: '[s]ò', pic: 'oyster' }, { w: '[x]ô', pic: 'bucket' }, { w: '[s]ữa', pic: 'glass-of-milk' }, { w: '[s]ứa', pic: 'jellyfish' }, { w: '[s]óc', pic: 'chipmunk' }, { w: '[x]oài', pic: 'mango' },
      
      { w: 'quyển [s]ách', pic: 'open-book' }, { w: '[s]ư tử', pic: 'lion' }, { w: 'con [s]óc', pic: 'chipmunk' }, { w: 'cốc [s]ữa', pic: 'glass-of-milk' },
      { w: 'ốc [s]ên', pic: 'snail' }, { w: 'con [s]ò', pic: 'oyster' }, { w: 'con [s]ứa', pic: 'jellyfish' }, { w: 'ngôi [s]ao', pic: 'glowing-star' },
      { w: '[s]ấm sét', pic: 'cloud-with-lightning' }, { w: '[s]úp lơ', pic: 'broccoli' }, { w: '[s]ọt rác', pic: 'wastebasket' },
      { w: '[x]e đạp', pic: 'bicycle' }, { w: '[x]e buýt', pic: 'bus' }, { w: '[x]e máy', pic: 'motor-scooter' }, { w: '[x]e tải', pic: 'delivery-truck' },
      { w: 'quả [x]oài', pic: 'mango' }, { w: 'khúc [x]ương', pic: 'bone' }, { w: '[x]à phòng', pic: 'soap' }, { w: 'cái [x]ô', pic: 'bucket' },
      { w: '[x]úc xích', pic: 'hot-dog' }, { w: 'cây [x]ương rồng', pic: 'cactus' }, { w: '[x]e cứu hỏa', pic: 'fire-engine' },
    ],
    words: [
      '[s]ổ ghi', '[x]e lu', '[x]ổ [s]ố', '[x]ẻ gỗ', 'chú [s]ẻ', '[x]a quá', '[s]ở thú', '[x]ứ [s]ở', '[s]ợ', 'quả [s]u', '[s]ố ba', '[x]ù',
      '[s]âu răng', 'hoa [s]en', '[x]inh xắn', 'màu [x]anh', '[s]áng sớm', 'thổi [x]ôi', '[x]ếp hàng', 'cây [s]ả', 'rau [x]ào', '[s]ợ hãi', 'phố [x]á', 'tủ [s]ách', '[x]a xôi', '[s]ông suối', 'đĩa [x]ôi', '[s]ắc màu', 'quả [x]ơ mướp', 'củ [s]ắn', '[x]em phim', 'quả [s]im'],
    copy: [
      'Xe lu đi từ từ.', 'Chú sẻ ở bờ hồ.', 'Bé đi sở thú với bố.',
      'Sáng sớm, em đi học bằng xe đạp.', 'Con sóc nhảy trên cành cây.', 'Mẹ đồ xôi và luộc sắn.', 'Hồ sen nở hoa thơm ngát.'],
  },
  {
    id: 'l-n', options: ['l', 'n'], title: 'Phân biệt l/n',
    pics: [
      { w: '[l]ê', pic: 'pear' }, { w: '[l]á', pic: 'leaf-fluttering-in-wind' }, { w: '[n]ơ', pic: 'ribbon' }, { w: '[l]ừa', pic: 'donkey' }, { w: '[n]ho', pic: 'grapes' }, { w: '[n]ấm', pic: 'mushroom' }, { w: '[n]ến', pic: 'candle' },
      
      { w: 'chiếc [l]á', pic: 'leaf-fluttering-in-wind' }, { w: 'quả [l]ê', pic: 'pear' }, { w: 'con [l]ợn', pic: 'pig' }, { w: '[l]ạc đà', pic: 'two-hump-camel' },
      { w: 'củ [l]ạc', pic: 'peanuts' }, { w: 'đèn [l]ồng', pic: 'red-paper-lantern' }, { w: '[l]ông vũ', pic: 'feather' }, { w: 'con [l]ừa', pic: 'donkey' },
      { w: 'cây [n]ấm', pic: 'mushroom' }, { w: 'cây [n]ến', pic: 'candle' }, { w: 'chùm [n]ho', pic: 'grapes' }, { w: 'con [n]ai', pic: 'deer' },
      { w: 'cái [n]ơ', pic: 'ribbon' }, { w: 'giọt [n]ước', pic: 'droplet' }, { w: 'cái [n]ồi', pic: 'pot-of-food' }, { w: 'ngọn [n]úi', pic: 'snow-capped-mountain' },
      { w: '[n]am châm', pic: 'magnet' }, { w: 'chiếc [n]hẫn', pic: 'ring' },
    ],
    words: [
      '[l]á đỏ', '[n]ơ đỏ', '[l]á me', '[n]ụ', '[l]ò cò', '[l]ề', 'bé [n]ô', '[l]ê la', '[n]ề', '[l]ũ', '[n]a', '[l]ọ',
      '[n]ón lá', '[l]ên lớp', '[n]ắng vàng', '[l]ung linh', 'quả [n]a', '[l]o lắng', '[n]o nê', 'trời [n]ắng', '[l]ặng im', 'bông [l]úa', '[n]ồi cơm', '[l]ửa hồng', '[n]ở hoa', 'cái [l]ược', '[n]ằm ngủ', '[l]ễ phép', '[n]ước mắm', 'con [l]ươn', '[n]àng tiên', '[l]ạnh giá'],
    copy: [
      'Bé có nơ đỏ.', 'Lá me nhỏ li ti.', 'Mẹ cho bé na và lê.',
      'Trời nắng, lúa chín vàng.', 'Bé lễ phép chào ông bà.', 'Mẹ nấu nồi canh nấm.', 'Đêm trung thu, đèn lồng lung linh.'],
  },
  {
    id: 'ch-tr', options: ['ch', 'tr'], title: 'Phân biệt ch/tr',
    pics: [
      { w: '[ch]ó', pic: 'dog' }, { w: '[tr]à', pic: 'teapot' }, { w: '[ch]ổi', pic: 'broom' }, { w: '[tr]ống', pic: 'drum' }, { w: '[ch]uối', pic: 'banana' }, { w: '[ch]im', pic: 'bird' }, { w: '[tr]âu', pic: 'water-buffalo' },
      
      { w: 'con [ch]ó', pic: 'dog' }, { w: 'quả [ch]uối', pic: 'banana' }, { w: 'con [ch]im', pic: 'bird' }, { w: 'con [ch]uột', pic: 'mouse' },
      { w: 'quả [ch]anh', pic: 'lemon' }, { w: '[ch]ìa khóa', pic: 'key' }, { w: 'cái [ch]ổi', pic: 'broom' }, { w: 'cái [ch]uông', pic: 'bell' },
      { w: 'dưa [ch]uột', pic: 'cucumber' },
      { w: 'con [tr]âu', pic: 'water-buffalo' }, { w: 'cái [tr]ống', pic: 'drum' }, { w: 'mặt [tr]ăng', pic: 'crescent-moon' }, { w: 'quả [tr]ứng', pic: 'egg' },
      { w: 'ấm [tr]à', pic: 'teapot' }, { w: 'bức [tr]anh', pic: 'framed-picture' }, { w: '[tr]ường học', pic: 'school' }, { w: '[tr]ực thăng', pic: 'helicopter' },
    ],
    words: [
      '[ch]ị', '[ch]ú', '[tr]e', '[tr]í nhớ', 'lá [tr]e', '[ch]ia', '[ch]ùa', 'mẹ [ch]ở', '[tr]ụ', '[ch]e ô', '[tr]ổ', '[ch]ữ to', '[tr]ưa',
      '[ch]ăm chỉ', '[tr]ung thu', 'cây [tr]e', 'quả [ch]ín', '[tr]ời xanh', '[ch]ơi đùa', 'cá [tr]ê', '[ch]ào cờ', 'màu [tr]ắng', '[ch]ia sẻ', '[tr]òn xoe', 'bánh [ch]ưng', '[tr]ông em', '[ch]ợ quê', 'con [tr]ai', '[ch]ăn trâu', 'buổi [tr]ưa', 'cái [ch]ậu', '[tr]ang sách', '[ch]ú bộ đội'],
    copy: [
      'Chị cho bé lá tre.', 'Trưa, mẹ chở bé đi chợ.', 'Chú chó ở nhà bà.',
      'Bé chăm chỉ học bài.', 'Trăng rằm trung thu tròn và sáng.', 'Con trâu gặm cỏ bên bờ tre.', 'Chú chim hót trên cành.'],
  },
  {
    id: 'h-th-kh', options: ['h', 'th', 'kh'], title: 'Phân biệt h/th/kh',
    pics: [
      { w: '[th]ỏ', pic: 'rabbit' }, { w: '[kh]ỉ', pic: 'monkey' }, { w: '[h]ổ', pic: 'tiger' }, { w: '[th]ư', pic: 'envelope' },
      
      { w: 'con [h]ổ', pic: 'tiger' }, { w: 'bông [h]oa', pic: 'blossom' }, { w: '[h]ươu cao cổ', pic: 'giraffe' }, { w: '[h]à mã', pic: 'hippopotamus' },
      { w: '[h]ộp quà', pic: 'wrapped-gift' }, { w: '[h]ải cẩu', pic: 'seal' },
      { w: 'con [th]ỏ', pic: 'rabbit' }, { w: 'con [th]uyền', pic: 'sailboat' }, { w: '[th]ước kẻ', pic: 'straight-ruler' }, { w: 'lá [th]ư', pic: 'envelope' },
      { w: 'cây [th]ông', pic: 'evergreen-tree' }, { w: 'cái [th]ang', pic: 'ladder' }, { w: 'cái [th]ìa', pic: 'spoon' },
      { w: 'con [kh]ỉ', pic: 'monkey' }, { w: 'củ [kh]oai', pic: 'roasted-sweet-potato' }, { w: 'ổ [kh]óa', pic: 'locked' }, { w: '[kh]ăn quàng', pic: 'scarf' },
      { w: '[kh]ủng long', pic: 't-rex' }, { w: '[kh]ẩu trang', pic: 'face-with-medical-mask' },
    ],
    words: [
      'bờ [h]ồ', 'cá [kh]ô', '[th]ủ đô', '[h]è', '[th]ả cá', '[kh]e khẽ', '[h]ổ dữ', '[h]ồ cá', '[th]ợ mỏ', '[h]ỏi', '[th]ơ', '[kh]ô',
      '[h]ọc bài', '[th]ơm ngát', '[kh]ỏe mạnh', '[h]át ca', '[th]ả diều', 'quả [kh]ế', '[h]ồ nước', '[th]ợ may', '[kh]ăn mặt', '[h]iền lành', '[th]ứ hai', '[kh]ung cửa', '[h]oa hồng', 'bé [th]ích', '[kh]ôn ngoan', 'cái [h]ũ', '[th]ổi nến', 'bầu [kh]ông khí', 'con [h]ươu', 'quả [th]ị'],
    copy: [
      'Bé thả cá ở hồ.', 'Bà có cá khô.', 'Nghỉ hè, bé ở nhà bà.',
      'Chú khỉ leo trèo trên cây.', 'Em thả diều trên đồng cỏ.', 'Bé hát cho bà nghe.', 'Thỏ con thích ăn cà rốt.'],
  },
  {
    id: 'an-ang', kind: 'van', options: ['an', 'ang'], title: 'Phân biệt an/ang',
    rule: 'Điền vần an hoặc ang, nhớ đặt dấu thanh nếu tiếng có dấu (vd: bàn → àn).',
    pics: [{ w: 'cái th[ang]', pic: 'ladder' }, { w: 'ngân h[àng]', pic: 'bank' }, { w: 'đ[àn] ghi-ta', pic: 'guitar' }],
    words: ['b[àn] ghế', 'b[àn] tay', 'h[àng] cây', 'n[àng] tiên', 'l[àng] quê', 's[áng] sớm', 'v[àng] tươi', 'g[an] dạ', 'đ[àn] gà', 'th[an] củi',
      'c[àng] cua', 'tr[ang] sách', 'b[ạn] bè', 'l[an] can', 'm[ang] cặp', 's[àn] nhà', 'th[ang] máy', 'ch[àng] trai', 'h[àn] gắn', 'đ[àng] hoàng'],
    copy: ['Làng em có hàng tre xanh.', 'Bạn Lan ngồi bàn đầu.', 'Sáng sớm, nắng vàng tươi.', 'Đàn gà ăn thóc ở sân.'],
  },
  {
    id: 'at-ac', kind: 'van', options: ['at', 'ac'], title: 'Phân biệt at/ac',
    rule: 'Điền vần at hoặc ac, nhớ đặt dấu thanh nếu tiếng có dấu (vd: hát → át).',
    pics: [{ w: 'l[ạc] đà', pic: 'two-hump-camel' }, { w: 'củ l[ạc]', pic: 'peanuts' }, { w: 'nghe nh[ạc]', pic: 'headphone' }],
    words: ['b[ác] sĩ', 'h[át] ca', 'c[ác] bạn', 'm[át] mẻ', 'th[ác] nước', 'b[át] cơm', 'thơm ng[át]', 'h[ạt] đậu', 'tóc b[ạc]', 'kh[át] nước',
      'nh[ạt] màu', 'v[ác] cuốc', 'ph[át] quà', 'bãi c[át]', 'qu[ạt] mát', 'b[ạc] hà', 'g[ạt] nước', 'l[át] gạch', 'đ[ạt] giải', 'h[ạc] trắng'],
    copy: ['Cả lớp hát vang bài ca.', 'Bác sĩ khám cho bé.', 'Bãi cát mát rượi.', 'Bé tưới nước cho cây lạc.'],
  },
];

/** bỏ dấu thanh (giữ mũ, móc, trăng): "àn" → "an" để so với lựa chọn của cặp vần */
export const toneless = (x: string) => x.normalize('NFD').replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC');
export const pairById = (id: PairId) => PAIRS.find((p) => p.id === id)!;
/** phần đáp án và từ hiển thị: "con [c]áo" → { blank: "con __áo", ans: ["c"], full: "con cáo" } */
export function splitWord(w: string): { parts: { text: string; ans?: string }[]; ans: string[]; full: string } {
  const parts: { text: string; ans?: string }[] = [];
  const ans: string[] = [];
  for (const m of w.matchAll(/\[([^\]]+)\]|([^[]+)/g)) {
    if (m[1]) { parts.push({ text: m[1], ans: m[1] }); ans.push(m[1]); } else parts.push({ text: m[2] });
  }
  return { parts, ans, full: w.replace(/[[\]]/g, '') };
}
