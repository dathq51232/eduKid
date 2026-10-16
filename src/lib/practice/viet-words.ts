// Vốn từ và câu cho bộ sinh câu Tiếng Việt 1.
// Mỗi từ/câu tự được xếp vào tuần học sớm nhất mà mọi tiếng đều đã học (âm đầu, vần, dấu thanh) — xem viet-inventory.ts.
// Nhờ đó một bài chỉ dùng từ, câu các em đã học, không vượt trước.
//
// Định dạng từ: "từ|emoji|loại" (từ nhiều tiếng nối bằng dấu _ )  — loại: n người, v con vật, d đồ vật, q cây – quả – đồ ăn, h hoạt động, t đặc điểm,
// c thiên nhiên – nơi chốn. Emoji để trống nếu không có tranh phù hợp.

export type WordKind = 'n' | 'v' | 'd' | 'q' | 'h' | 't' | 'c';
export const KIND_LABEL: Record<WordKind, string> = {
  n: 'người', v: 'con vật', d: 'đồ vật', q: 'cây, quả, đồ ăn', h: 'hoạt động', t: 'đặc điểm', c: 'thiên nhiên, nơi chốn',
};

const RAW = `
ba|👨|n bà|👵|n bé|👶|n bê|🐮|v cá|🐟|v cà|🍆|q bế||h ca||h bè||d bò|🐄|v
cò||v cỏ|🌿|q bố|👨|n bơ|🥑|q cờ|🚩|d đá|🪨|c đỏ|🔴|t dê|🐐|v cô|👩‍🏫|n bờ||c
bể||c đò||d dễ||t cọ|🖌️|d đỗ||q cỗ||q bi||d kẻ||h hồ||c hổ|🐅|v
hè||c lá|🍃|q lê|🍐|q lọ|🏺|d cú|🦉|v chó|🐕|v chú||n chè||q chị||n che||h
khế||q kho||h khỉ|🐒|v khô||t lò||d cũ||t kể||h bí||q mẹ|👩|n me||q
mũ|🧢|d mì|🍜|q nơ|🎀|d na||q nho|🍇|q nhà|🏠|c gà|🐔|v gõ||h gỗ|🪵|d ghế|🪑|d
ghi||h gió|🌬️|c giỏ|🧺|d giá||q ngõ||c ngủ|😴|h nghé||v nghỉ||h nghe|👂|h nụ||q
ngô|🌽|q nhổ||h mỏ||d rổ||d rễ||q sò|🐚|v sẻ||v tô|🥣|d tủ||d tre|🎋|q
trà|🍵|q thỏ|🐰|v thợ||n thư|✉️|d mía||q lúa|🌾|q cua|🦀|v rùa|🐢|v mưa|🌧️|c dưa|🍉|q
dừa|🥥|q sữa|🥛|q cửa|🚪|d búa|🔨|d chùa||c thìa|🥄|d đũa|🥢|d ngựa|🐎|v trưa||c dứa|🍍|q
chua||t tía||t phở|🍜|q quà|🎁|d quê||c quạ||v vở|📓|d vẽ|🎨|h ví|👛|d xe|🚲|d
xô|🪣|d xa||t vỏ||d vua|🤴|n y_tá|👩‍⚕️|n cà_phê|☕|q phố||c bàn||d chân|🦶|n khăn|🧣|d
cân|⚖️|d sân||c đèn|💡|d nến|🕯️|d kèn|🎺|d giun|🪱|v cam|🍊|q tắm|🛁|h nấm|🍄|q
con||n ngon||t lợn|🐖|v nón|👒|d chăn||d rắn|🐍|v cún|🐶|v đàn|🎻|d mận||q lăn||h
nhện|🕷️|v dế_mèn|🦗|v tôm|🦐|v cơm|🍚|q kem|🍦|q nhím|🦔|v chim|🐦|v tim|❤️|n hái||h tai|👂|n
tay|✋|n cây|🌳|q mây|☁️|c voi|🐘|v còi||d bơi|🏊|h chơi||h ngồi||h ổi||q xôi||q
gối||d nai|🦌|v váy|👗|d nồi|🍲|d chổi|🧹|d đêm|🌙|c máy_bay|✈️|d đồi||c tem||d núi|⛰️|c
túi|👜|d ngửi||h sao|⭐|c cáo|🦊|v kéo|✂️|d mèo|🐱|v rau|🥬|q cầu|🌉|c gấu|🐻|v trâu|🐃|v
sâu|🐛|v lều|⛺|d kêu||h rìu|🪓|d cừu|🐑|v lựu||q tàu|🚂|d bác||n sóc|🐿️|v cốc|🥛|d
ốc|🐌|v cúc|🌼|q mực|🦑|v hạt||q mặt||n quạt|🪭|d cát||c bát|🥣|d cột||d ớt|🌶️|q
cà_rốt|🥕|q hát|🎤|h rót||h ngọt||t tóc||n thác||c vẹt|🦜|v tết|🧧|c vịt|🦆|v mít||q
bút|🖊️|d cặp|🎒|d xe_đạp|🚲|d hộp|📦|d lớp||c mứt||q quét||h rét||t ngáp||h tháp||c
dép|🩴|d bếp||c búp_bê|🪆|d chanh|🍋|q bánh|🍰|q xanh||t kính|👓|d sách|📚|d ếch|🐸|v lịch|📅|d
vàng||t trăng|🌙|c nắng|☀️|c măng||q tranh|🖼️|d nhanh||t ong|🐝|v bóng|⚽|d sông||c trống|🥁|d
trứng|🥚|q gừng||q rừng|🌲|c xiếc|🎪|c biển|🌊|c thiệp|💌|d diều|🪁|d kiến|🐜|v chiếu||d yêu||h
chuối|🍌|q muối|🧂|q buồm|⛵|d thuốc|💊|d chuột|🐭|v chuông|🔔|d người|🧑|n cười|😄|h tươi||t bưởi||q
hươu|🦌|v mười||t nước|💧|c thước|📏|d lược||d bướm|🦋|v mướp||q vườn|🏡|c giường|🛏️|d gương|🪞|d
hoa|🌸|q loa|📢|d đường||c khoẻ||t khoai|🥔|q ngoan||t quần|👖|d thuyền|🚣|d tuyết|❄️|c xoăn||t
tuần||c
`;

export type VWord = { w: string; emoji?: string; kind: WordKind };
export const VWORDS: VWord[] = RAW.trim()
  .split(/\s+/)
  .map((tok) => {
    const [w, emoji, kind] = tok.split('|');
    return { w: w.replace(/_/g, ' '), emoji: emoji || undefined, kind: kind as WordKind };
  });

// Câu ngắn: [câu, chủ thể (ai/con gì), câu hỏi về chủ thể]. Chủ thể là người dùng "Ai", con vật dùng "Con gì".
export const VSENTENCES: [string, string, string][] = [
  ['Ba bế bé.', 'Ba', 'Ai bế bé?'],
  ['Bố bế bé.', 'Bố', 'Ai bế bé?'],
  ['Bé có bơ.', 'Bé', 'Ai có bơ?'],
  ['Cô có cờ đỏ.', 'Cô', 'Ai có cờ đỏ?'],
  ['Bà có đỗ đỏ.', 'Bà', 'Ai có đỗ đỏ?'],
  ['Bé có lê.', 'Bé', 'Ai có lê?'],
  ['Bà kho cá.', 'Bà', 'Ai kho cá?'],
  ['Chị Hà có ô che.', 'Chị Hà', 'Ai có ô che?'],
  ['Khỉ có lá.', 'Khỉ', 'Con gì có lá?'],
  ['Bé ngủ ở nhà.', 'Bé', 'Ai ngủ ở nhà?'],
  ['Mẹ có giỏ nho.', 'Mẹ', 'Ai có giỏ nho?'],
  ['Bé nghe mẹ kể.', 'Bé', 'Ai nghe mẹ kể?'],
  ['Mẹ mua dừa.', 'Mẹ', 'Ai mua dừa?'],
  ['Bà cho bé sữa.', 'Bà', 'Ai cho bé sữa?'],
  ['Cua bò ra bờ.', 'Cua', 'Con gì bò ra bờ?'],
  ['Bé vẽ xe.', 'Bé', 'Ai vẽ xe?'],
  ['Bé có quà.', 'Bé', 'Ai có quà?'],
  ['Chị y tá ghi sổ.', 'Chị y tá', 'Ai ghi sổ?'],
  ['Bà bế bé.', 'Bà', 'Ai bế bé?'],
  ['Bé có cá.', 'Bé', 'Ai có cá?'],
  ['Bò ăn cỏ.', 'Bò', 'Con gì ăn cỏ?'],
  ['Dê ăn cỏ.', 'Dê', 'Con gì ăn cỏ?'],
  ['Bố có ô.', 'Bố', 'Ai có ô?'],
  ['Cô bế bé.', 'Cô', 'Ai bế bé?'],
  ['Chị Hà kể chú bé.', 'Chị Hà', 'Ai kể?'],
  ['Khỉ có quả lê.', 'Khỉ', 'Con gì có quả lê?'],
  ['Chó cún ở nhà.', 'Chó cún', 'Con gì ở nhà?'],
  ['Mẹ đi chợ.', 'Mẹ', 'Ai đi chợ?'],
  ['Bé nghỉ hè ở quê.', 'Bé', 'Ai nghỉ hè ở quê?'],
  ['Gà gáy ò ó o.', 'Gà', 'Con gì gáy?'],
  ['Nghé ăn cỏ ở bờ đê.', 'Nghé', 'Con gì ăn cỏ ở bờ đê?'],
  ['Bé ghi chữ ở vở.', 'Bé', 'Ai ghi chữ ở vở?'],
  ['Mẹ mua cá rô.', 'Mẹ', 'Ai mua cá rô?'],
  ['Thỏ ăn cà rốt.', 'Thỏ', 'Con gì ăn cà rốt?'],
  ['Bà trồng tre ở quê.', 'Bà', 'Ai trồng tre?'],
  ['Rùa bò ra bờ hồ.', 'Rùa', 'Con gì bò ra bờ hồ?'],
  ['Bé thả cá về hồ.', 'Bé', 'Ai thả cá?'],
  ['Bố đi xe ra phố.', 'Bố', 'Ai đi xe ra phố?'],
  ['Chú thợ sơn nhà.', 'Chú thợ', 'Ai sơn nhà?'],
  ['Cún con nằm trên chăn.', 'Cún con', 'Con gì nằm trên chăn?'],
  ['Mẹ cho bé quả cam.', 'Mẹ', 'Ai cho bé quả cam?'],
  ['Nhện giăng tơ.', 'Nhện', 'Con gì giăng tơ?'],
  ['Bé tắm cho cún.', 'Bé', 'Ai tắm cho cún?'],
  ['Chim hót trên cây.', 'Chim', 'Con gì hót trên cây?'],
  ['Voi có vòi dài.', 'Voi', 'Con gì có vòi dài?'],
  ['Bé ngồi ăn cơm.', 'Bé', 'Ai ngồi ăn cơm?'],
  ['Nai ăn lá non.', 'Nai', 'Con gì ăn lá non?'],
  ['Bà nấu xôi.', 'Bà', 'Ai nấu xôi?'],
  ['Mèo trèo cây cau.', 'Mèo', 'Con gì trèo cây cau?'],
  ['Sóc nhảy trên cành.', 'Sóc', 'Con gì nhảy trên cành?'],
  ['Trâu kéo cày.', 'Trâu', 'Con gì kéo cày?'],
  ['Mẹ hái rau ở vườn.', 'Mẹ', 'Ai hái rau?'],
  ['Cừu có bộ lông dày.', 'Cừu', 'Con gì có bộ lông dày?'],
  ['Ông kể chuyện cổ tích.', 'Ông', 'Ai kể chuyện?'],
  ['Bé hát bài ca.', 'Bé', 'Ai hát?'],
  ['Ốc bò chậm.', 'Ốc', 'Con gì bò chậm?'],
  ['Bác nông dân gặt lúa.', 'Bác nông dân', 'Ai gặt lúa?'],
  ['Vẹt biết nói.', 'Vẹt', 'Con gì biết nói?'],
  ['Vịt bơi dưới ao.', 'Vịt', 'Con gì bơi dưới ao?'],
  ['Chị mặc áo mới đi lễ.', 'Chị', 'Ai mặc áo mới?'],
  ['Bé đi học bằng xe đạp.', 'Bé', 'Ai đi học bằng xe đạp?'],
  ['Ếch kêu ộp ộp.', 'Ếch', 'Con gì kêu ộp ộp?'],
  ['Bố đọc sách cho bé.', 'Bố', 'Ai đọc sách cho bé?'],
  ['Cô giáo dạy bé học.', 'Cô giáo', 'Ai dạy bé học?'],
  ['Bé ngắm trăng rằm.', 'Bé', 'Ai ngắm trăng?'],
  ['Ong hút mật hoa.', 'Ong', 'Con gì hút mật hoa?'],
  ['Chú bộ đội gác biển.', 'Chú bộ đội', 'Ai gác biển?'],
  ['Kiến tha mồi về tổ.', 'Kiến', 'Con gì tha mồi về tổ?'],
  ['Anh thả diều trên đê.', 'Anh', 'Ai thả diều?'],
  ['Chuột gặm chiếc lược.', 'Chuột', 'Con gì gặm chiếc lược?'],
  ['Mẹ mua chuối và bưởi.', 'Mẹ', 'Ai mua chuối và bưởi?'],
  ['Hươu cao cổ ăn lá cây.', 'Hươu', 'Con gì ăn lá cây?'],
  ['Bướm bay trong vườn hoa.', 'Bướm', 'Con gì bay trong vườn hoa?'],
  ['Bà tưới nước cho cây.', 'Bà', 'Ai tưới nước cho cây?'],
  ['Bé chải tóc trước gương.', 'Bé', 'Ai chải tóc?'],
  ['Thuyền buồm ra khơi.', 'Thuyền buồm', 'Cái gì ra khơi?'],
  ['Bé ngoan được khen.', 'Bé', 'Ai được khen?'],
  ['Bố mua quần áo mới.', 'Bố', 'Ai mua quần áo mới?'],
];
