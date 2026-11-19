// Dịch đề Toán sang tiếng Anh theo MẪU CÂU (không dịch máy) — quy tắc ở docs/QUY-TAC-SONG-NGU.md.
// Nguyên tắc: chỉ trả bản dịch khi MỌI câu trong đề khớp một quy tắc; câu nào chưa có quy tắc → trả null
// (khung song ngữ khi đó chỉ hiện phép tính + từ vựng). Không bao giờ ghép nửa Việt nửa Anh.
// Kiểm tra độ phủ và ngữ pháp: npm run check:song-ngu

// ---------------------------------------------------------------------------
// Số: viết lại theo kiểu tiếng Anh (12 500 / 12.500 → 12,500; 2,5 → 2.5; phân số, hỗn số giữ nguyên)
// ---------------------------------------------------------------------------
// Số nghìn có thể cách bằng dấu cách thường, dấu cách hẹp (U+202F) hay dấu cách không ngắt (U+00A0).
const NUM_SRC = String.raw`\d+ \d+\/\d+|\d+\/\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:,\d+)?|\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?`;
const NUM_RE = new RegExp(`(?<![\\d/])(?:${NUM_SRC})(?![\\d/])`, 'g');

/** "12 500" → "12,500"; "1.000" → "1,000"; "2,5" → "2.5"; "3/4", "2 1/3" giữ nguyên. */
export function enNum(raw: string): string {
  const s = raw.trim();
  if (/\//.test(s)) return s;
  const [intPart, dec] = s.split(',');
  const digits = intPart.replace(/[ .\u00a0\u202f]/g, '');
  const grouped = digits.length > 4 || /[ .\u00a0\u202f]/.test(intPart) ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : digits;
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}
const isOne = (raw: string) => enNum(raw) === '1';

/** Viết lại mọi số trong một đoạn theo kiểu tiếng Anh. */
const numsToEn = (t: string) => t.replace(NUM_RE, (m) => enNum(m)).replace(/km\/giờ/g, 'km/h').replace(/m\/phút/g, 'm/min').replace(/m\/giây/g, 'm/s');

// ---------------------------------------------------------------------------
// Từ điển: đồ vật (số ít, số nhiều), đơn vị, tên người, chủ ngữ
// ---------------------------------------------------------------------------
type Noun = [string, string];
const NOUNS: Record<string, Noun> = {
  'quyển vở': ['notebook', 'notebooks'], 'cuốn vở': ['notebook', 'notebooks'], 'vở': ['notebook', 'notebooks'],
  'cây bút chì': ['pencil', 'pencils'], 'chiếc bút chì': ['pencil', 'pencils'], 'bút chì': ['pencil', 'pencils'],
  'cây bút': ['pen', 'pens'], 'chiếc bút': ['pen', 'pens'], 'bút': ['pen', 'pens'],
  'viên bi': ['marble', 'marbles'], 'bi đỏ': ['red marble', 'red marbles'], 'bi xanh': ['blue marble', 'blue marbles'], 'bi': ['marble', 'marbles'],
  'quả bóng bay': ['balloon', 'balloons'], 'quả bóng': ['ball', 'balls'],
  'bông hoa giấy': ['paper flower', 'paper flowers'], 'bông hoa': ['flower', 'flowers'], 'hoa': ['flower', 'flowers'],
  'cái nhãn vở': ['label', 'labels'], 'nhãn vở': ['label', 'labels'],
  'cái kẹo': ['sweet', 'sweets'], 'chiếc kẹo': ['sweet', 'sweets'], 'viên kẹo': ['sweet', 'sweets'], 'kẹo': ['sweet', 'sweets'],
  'quả cam': ['orange', 'oranges'], 'quả quýt': ['tangerine', 'tangerines'], 'quả táo': ['apple', 'apples'],
  'quả trứng': ['egg', 'eggs'], 'quả xoài': ['mango', 'mangoes'], 'quả chuối': ['banana', 'bananas'], 'quả': ['fruit', 'fruits'],
  'con chó': ['dog', 'dogs'], 'con gà': ['chicken', 'chickens'], 'con chim': ['bird', 'birds'], 'con vịt': ['duck', 'ducks'],
  'con mèo': ['cat', 'cats'], 'con cá': ['fish', 'fish'], 'con thỏ': ['rabbit', 'rabbits'], 'con bò': ['cow', 'cows'],
  'con lợn': ['pig', 'pigs'], 'con ngựa': ['horse', 'horses'],
  'con gà con': ['chick', 'chicks'], 'con bướm': ['butterfly', 'butterflies'], 'con ong': ['bee', 'bees'], 'con rùa': ['turtle', 'turtles'],
  'con bọ rùa': ['ladybird', 'ladybirds'], 'con voi': ['elephant', 'elephants'], 'con khỉ': ['monkey', 'monkeys'], 'con hươu': ['deer', 'deer'],
  'con sóc': ['squirrel', 'squirrels'], 'con ếch': ['frog', 'frogs'], 'con cua': ['crab', 'crabs'], 'con trâu': ['buffalo', 'buffaloes'], 'con dê': ['goat', 'goats'],
  'con cừu': ['sheep', 'sheep'], 'con chuột': ['mouse', 'mice'], 'con kiến': ['ant', 'ants'], 'con ngỗng': ['goose', 'geese'], 'con': ['animal', 'animals'],
  'cây nấm': ['mushroom', 'mushrooms'], 'cây con': ['seedling', 'seedlings'], 'que tính': ['counting stick', 'counting sticks'],
  'chiếc đũa': ['chopstick', 'chopsticks'], 'đôi đũa': ['pair of chopsticks', 'pairs of chopsticks'], 'bàn tay': ['hand', 'hands'], 'ngón tay': ['finger', 'fingers'],
  'ngón': ['finger', 'fingers'], 'cái cốc': ['cup', 'cups'], 'cốc': ['cup', 'cups'], 'lớp': ['class', 'classes'], 'đội': ['team', 'teams'],
  'quả bóng xanh': ['blue ball', 'blue balls'], 'quả bóng đỏ': ['red ball', 'red balls'], 'quả dâu': ['strawberry', 'strawberries'], 'quả lê': ['pear', 'pears'],
  'quả dưa': ['melon', 'melons'], 'quả bưởi': ['pomelo', 'pomelos'], 'quả na': ['custard apple', 'custard apples'], 'quả chanh': ['lemon', 'lemons'],
  'cái thước': ['ruler', 'rulers'], 'cục tẩy': ['rubber', 'rubbers'], 'chiếc mũ': ['hat', 'hats'], 'chiếc cặp': ['school bag', 'school bags'],
  'cái ghế': ['chair', 'chairs'], 'cái bàn': ['table', 'tables'], 'chiếc thuyền': ['boat', 'boats'], 'chiếc ô tô': ['car', 'cars'], 'chiếc lá': ['leaf', 'leaves'],
  'ngôi sao': ['star', 'stars'], 'tấm thảm': ['rug', 'rugs'], 'cái giường': ['bed', 'beds'], 'cái tủ': ['cupboard', 'cupboards'], 'băng giấy': ['paper strip', 'paper strips'], 'bông': ['flower', 'flowers'], 'góc vuông': ['right angle', 'right angles'], 'khối lập phương': ['cube', 'cubes'], 'mặt': ['face', 'faces'], 'câu hỏi': ['question', 'questions'], 'cái đĩa': ['plate', 'plates'], 'đĩa': ['plate', 'plates'], 'quyển truyện tranh': ['comic', 'comics'],
  'cái bánh': ['cake', 'cakes'], 'chiếc bánh': ['cake', 'cakes'], 'gói bánh': ['packet of biscuits', 'packets of biscuits'],
  'quyển sách': ['book', 'books'], 'cuốn sách': ['book', 'books'], 'sách': ['book', 'books'], 'quyển truyện': ['storybook', 'storybooks'],
  'quyển': ['book', 'books'],
  'viên gạch': ['brick', 'bricks'], 'cây giống': ['seedling', 'seedlings'], 'cây': ['tree', 'trees'], 'chậu hoa': ['flower pot', 'flower pots'],
  'học sinh nữ': ['girl', 'girls'], 'học sinh nam': ['boy', 'boys'], 'học sinh': ['student', 'students'],
  'bạn nam': ['boy', 'boys'], 'bạn nữ': ['girl', 'girls'], 'bạn': ['pupil', 'pupils'], 'hành khách': ['passenger', 'passengers'],
  'chiếc khẩu trang': ['face mask', 'face masks'], 'tấm thiệp': ['card', 'cards'], 'tấm thẻ': ['card', 'cards'], 'thẻ': ['card', 'cards'],
  'bao gạo': ['bag of rice', 'bags of rice'], 'hộp bút': ['pencil case', 'pencil cases'], 'hộp sữa': ['carton of milk', 'cartons of milk'],
  'hộp': ['box', 'boxes'], 'thùng nước': ['crate of water', 'crates of water'], 'thùng': ['carton', 'cartons'], 'chai': ['bottle', 'bottles'],
  'rổ': ['basket', 'baskets'], 'túi': ['bag', 'bags'], 'bao': ['bag', 'bags'], 'giá': ['shelf', 'shelves'],
  'chiếc xe đạp': ['bicycle', 'bicycles'], 'xe đạp': ['bicycle', 'bicycles'], 'ô tô': ['car', 'cars'], 'xe': ['vehicle', 'vehicles'],
  'chuyến': ['trip', 'trips'], 'sản phẩm': ['product', 'products'], 'trang': ['page', 'pages'], 'vé': ['ticket', 'tickets'],
  'chiếc áo': ['shirt', 'shirts'], 'cái chân': ['leg', 'legs'], 'cái đầu': ['head', 'heads'], 'bánh xe': ['wheel', 'wheels'],
  'lượt khách': ['visitor', 'visitors'], 'điểm': ['point', 'points'], 'hình': ['shape', 'shapes'],
  'hình lập phương nhỏ': ['small cube', 'small cubes'], 'hình lập phương': ['cube', 'cubes'],
  'hình vuông': ['square', 'squares'], 'hình tam giác': ['triangle', 'triangles'], 'hình chữ nhật': ['rectangle', 'rectangles'], 'hình tròn': ['circle', 'circles'],
  'lít nước': ['litre of water', 'litres of water'], 'l nước': ['l of water', 'l of water'], 'lít dầu': ['litre of oil', 'litres of oil'],
  'l dầu': ['l of oil', 'l of oil'], 'l nước mắm': ['l of fish sauce', 'l of fish sauce'], 'lít nước mắm': ['litre of fish sauce', 'litres of fish sauce'],
  'kg gạo': ['kg of rice', 'kg of rice'], 'tấn gạo': ['tonne of rice', 'tonnes of rice'], 'tạ gạo': ['quintal of rice', 'quintals of rice'],
  'kg thóc': ['kg of paddy', 'kg of paddy'], 'kg táo': ['kg of apples', 'kg of apples'], 'kg thịt': ['kg of meat', 'kg of meat'],
  'kg đường': ['kg of sugar', 'kg of sugar'], 'kg cam': ['kg of oranges', 'kg of oranges'], 'ha rừng': ['hectare of forest', 'hectares of forest'],
};
// Lượng từ trơn chỉ dùng ở dòng đáp số ("? viên") — trong câu dễ sai nghĩa ("6 viên" là 6 viên bi chứ không phải 6 pieces)
const ANSWER_WORDS: Record<string, Noun> = { 'gói': ['packet', 'packets'], 'cuốn': ['book', 'books'], 'viên': ['piece', 'pieces'], 'chiếc': ['piece', 'pieces'], 'số': ['number', 'numbers'], 'tờ': ['note', 'notes'], 'chân': ['leg', 'legs'] };
const UNITS: Record<string, Noun> = {
  'xăng-ti-mét khối': ['cubic centimetre', 'cubic centimetres'], 'đề-xi-mét khối': ['cubic decimetre', 'cubic decimetres'], 'mét khối': ['cubic metre', 'cubic metres'],
  'xăng-ti-mét vuông': ['square centimetre', 'square centimetres'], 'đề-xi-mét vuông': ['square decimetre', 'square decimetres'], 'mét vuông': ['square metre', 'square metres'],
  'xăng-ti-mét': ['centimetre', 'centimetres'], 'mi-li-mét': ['millimetre', 'millimetres'], 'đề-xi-mét': ['decimetre', 'decimetres'],
  'ki-lô-mét': ['kilometre', 'kilometres'], 'mét': ['metre', 'metres'], 'ki-lô-gam': ['kilogram', 'kilograms'], 'gam': ['gram', 'grams'],
  'lít': ['litre', 'litres'], 'héc-ta': ['hectare', 'hectares'], 'tấn': ['tonne', 'tonnes'], 'tạ': ['quintal', 'quintals'], 'yến': ['ten-kilogram unit', 'ten-kilogram units'],
  'đồng': ['dong', 'dong'], 'độ C': ['degree Celsius', 'degrees Celsius'], 'độ': ['degree', 'degrees'],
  'giờ': ['hour', 'hours'], 'phút': ['minute', 'minutes'], 'giây': ['second', 'seconds'], 'ngày': ['day', 'days'], 'tuần': ['week', 'weeks'],
  'tháng': ['month', 'months'], 'năm': ['year', 'years'], 'tuổi': ['year old', 'years old'], 'lần': ['time', 'times'],
  'cm': ['cm', 'cm'], 'mm': ['mm', 'mm'], 'dm': ['dm', 'dm'], 'm': ['m', 'm'], 'km': ['km', 'km'], 'kg': ['kg', 'kg'], 'g': ['g', 'g'],
  'l': ['l', 'l'], 'ml': ['ml', 'ml'], 'ha': ['ha', 'ha'], 'cm²': ['cm²', 'cm²'], 'dm²': ['dm²', 'dm²'], 'm²': ['m²', 'm²'], 'km²': ['km²', 'km²'],
  'cm³': ['cm³', 'cm³'], 'dm³': ['dm³', 'dm³'], 'm³': ['m³', 'm³'], 'km/giờ': ['km/h', 'km/h'], 'm/phút': ['m/min', 'm/min'], 'm/giây': ['m/s', 'm/s'],
  '°C': ['°C', '°C'], '°': ['°', '°'], '%': ['%', '%'],
};
const NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Lan', 'Minh', 'Nga', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vy', 'Xuân', 'Yến',
  'Mai', 'Nam', 'Hoa', 'Tú', 'Linh', 'Khoa', 'Hùng', 'Hương', 'Long', 'Thảo', 'Huy', 'Ngọc', 'Việt', 'Trang', 'Hải', 'Hiền', 'Hạnh', 'Phương', 'Tuấn', 'Bảo'];
const PLACES_VN = ['Hà Nội', 'Cần Thơ', 'Huế', 'Hải Phòng', 'Sa Pa', 'Đà Lạt', 'Đà Nẵng', 'Nha Trang', 'Vinh', 'Cà Mau', 'Lạng Sơn'];
NAMES.push(...PLACES_VN);
export const NAME_SET = new Set(NAMES.flatMap((n) => [n, ...n.split(' ')]));
// Chủ ngữ hay gặp (người)
const WHO: Record<string, string> = {
  'mẹ': 'Mum', 'bố': 'Dad', 'ông': 'Grandpa', 'bà': 'Grandma', 'anh': 'the older brother', 'chị': 'the older sister', 'em': 'I',
  'cô': 'the teacher', 'cô giáo': 'the teacher', 'thầy': 'the teacher', 'con': 'the child', 'bác An': 'Uncle An',
  'cả hai bạn': 'both children', 'cả hai': 'both of them', 'cả ba bạn': 'all three children', 'cả lớp': 'the whole class',
  'cửa hàng': 'the shop', 'một cửa hàng': 'a shop', 'nhà máy': 'the factory', 'thư viện': 'the library', 'nông trại': 'the farm', 'kho': 'the warehouse', 'trường': 'the school', 'người đó': 'that person', 'ô tô': 'the car', 'xe': 'the vehicle',
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const alt = (keys: string[]) => [...keys].sort((a, b) => b.length - a.length).map(esc).join('|');
const NOUN_ALT = alt(Object.keys(NOUNS));
const UNIT_ALT = alt(Object.keys(UNITS));
const NAME_ALT = alt(NAMES);
const WHO_ALT = alt([...Object.keys(WHO), ...NAMES]);

// ---------------------------------------------------------------------------
// Quy tắc: mẫu tiếng Việt có chỗ trống → mẫu tiếng Anh
//   {n} số · {t} đồ vật · {u} đơn vị · {name} tên người · {who} chủ ngữ · {cls} tên lớp (4A) · {e} biểu thức toán
//   Bên tiếng Anh: {1} = chỗ trống thứ 1 (số → kiểu Anh, đồ vật → số nhiều, đơn vị → dạng gọn)
//                 {1s} = số ít · {1q2} = số {1} kèm đồ vật/đơn vị {2} chia số ít/nhiều đúng (1 pen / 3 pens)
// ---------------------------------------------------------------------------
//   {s} môn học / môn thể thao · {p} hàng chữ số (chục, trăm nghìn…) · bên Anh {1d2} = ngày {1} tháng {2} → "14 January"
// Môn học, môn thể thao (dùng cả trong bảng số liệu)
const SUBJ: Record<string, string> = {
  'toán': 'Maths', 'tiếng việt': 'Vietnamese', 'tiếng anh': 'English', 'khoa học': 'Science', 'âm nhạc': 'Music', 'mĩ thuật': 'Art', 'mỹ thuật': 'Art',
  'thể dục': 'PE', 'bơi lội': 'swimming', 'bơi': 'swimming', 'bóng đá': 'football', 'cầu lông': 'badminton', 'bóng rổ': 'basketball', 'cờ vua': 'chess',
  'đá cầu': 'shuttlecock kicking', 'nhảy dây': 'skipping', 'bóng chuyền': 'volleyball', 'điền kinh': 'athletics', 'võ thuật': 'martial arts', 'vẽ': 'drawing', 'hát': 'singing',
};
const PLACE: Record<string, string> = {
  'đơn vị': 'ones', 'chục': 'tens', 'trăm': 'hundreds', 'nghìn': 'thousands', 'chục nghìn': 'ten thousands', 'trăm nghìn': 'hundred thousands',
  'triệu': 'millions', 'chục triệu': 'ten millions', 'trăm triệu': 'hundred millions',
  'phần mười': 'tenths', 'phần trăm': 'hundredths', 'phần nghìn': 'thousandths',
};
const MONTH = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WDAY: Record<string, string> = { 'hai': 'Monday', 'ba': 'Tuesday', 'tư': 'Wednesday', 'năm': 'Thursday', 'sáu': 'Friday', 'bảy': 'Saturday' };
const TREE: Record<string, string> = { 'phượng': 'flame trees', 'bàng': 'tropical almond trees', 'sao': 'sao trees', 'xà cừ': 'mahogany trees', 'bạch đàn': 'eucalyptus trees', 'cau': 'areca palms', 'dừa': 'coconut palms' };
const COLOR: Record<string, string> = { 'vàng': 'yellow', 'tím': 'purple', 'đỏ': 'red', 'xanh lá': 'green', 'xanh': 'blue', 'hồng': 'pink', 'cam': 'orange', 'trắng': 'white', 'nâu': 'brown', 'đen': 'black' };
const ACT: Record<string, string> = { 'học đàn': 'have a piano lesson', 'đá bóng': 'play football', 'học vẽ': 'have an art lesson', 'tập bơi': 'go swimming', 'học bơi': 'have a swimming lesson', 'học múa': 'have a dance lesson', 'đọc sách': 'read books', 'chạy bộ': 'go running', 'học tiếng Anh': 'have an English lesson' };
type Kind = 'n' | 't' | 'u' | 'name' | 'who' | 'cls' | 'e' | 's' | 'p' | 'w' | 'L' | 'k' | 'c' | 'a' | 'x';
type Rule = { re: RegExp; kinds: Kind[]; en: string };
const SLOT: Record<Kind, string> = {
  n: `(${NUM_SRC})`, t: `(${NOUN_ALT})`, u: `(${UNIT_ALT})`, name: `(${NAME_ALT})`, who: `(${WHO_ALT})`, cls: String.raw`(\d+[A-E])`,
  e: String.raw`([0-9a-z()+\-−–×x*:÷=<>?…_□ ,;./%  ]+?)`, s: `(${alt(Object.keys(SUBJ))})`, p: `(${alt(Object.keys(PLACE))})`, w: `(${alt(Object.keys(WDAY))})`, L: '([A-Z])', k: `(${alt(Object.keys(TREE))})`, c: `(${alt(Object.keys(COLOR))})`, a: `(${alt(Object.keys(ACT))})`, x: String.raw`([\p{L} ]+?)`,
};

function rule(vi: string, en: string): Rule {
  const kinds: Kind[] = [];
  const src = vi.split(/(\{(?:n|t|u|name|who|cls|e|s|p|w|L|k|c|a|x)\})/).map((part) => {
    const m = /^\{(n|t|u|name|who|cls|e|s|p|w|L|k|c|a|x)\}$/.exec(part);
    if (m) { kinds.push(m[1] as Kind); return SLOT[m[1] as Kind]; }
    return esc(part).replace(/ /g, '\\s+');
  }).join('');
  return { re: new RegExp(`^${src}$`, 'iu'), kinds, en };
}

const noun = (k: string): Noun => NOUNS[k.toLowerCase()] ?? NOUNS[k] ?? ['', ''];
const unit = (k: string): Noun => UNITS[k] ?? UNITS[k.toLowerCase()] ?? [k, k];
function fill(r: Rule, m: RegExpExecArray): string | null {
  const vals = m.slice(1);
  const one = (i: number, form: 's' | 'p' = 'p'): string | null => {
    const v = vals[i - 1], k = r.kinds[i - 1];
    if (v === undefined) return null;
    switch (k) {
      case 'n': return enNum(v);
      case 't': return noun(v)[form === 's' ? 0 : 1];
      case 'u': return unit(v)[form === 's' ? 0 : 1];
      case 'name': return v;
      case 'who': return WHO[v.toLowerCase()] ?? WHO[v] ?? (NAME_SET.has(v) ? v : null);
      case 'cls': return v.toUpperCase();
      case 'e': { const e = v.trim(); return /[a-zà-ỹ]{2,}/i.test(e.replace(/\b[xyabcmnS]\b/g, '')) ? null : numsToEn(e); }
      case 's': return SUBJ[v.toLowerCase()] ?? null;
      case 'p': return PLACE[v.toLowerCase()] ?? null;
      case 'w': return WDAY[v.toLowerCase()] ?? null;
      case 'L': return v;
      case 'k': return TREE[v.toLowerCase()] ?? null;
      case 'c': return COLOR[v.toLowerCase()] ?? null;
      case 'a': return ACT[v] ?? ACT[v.toLowerCase()] ?? null;
      case 'x': return null; // chỉ để khớp phần nhắc lại, không dùng bên tiếng Anh
    }
  };
  let bad = false;
  const out = r.en.replace(/\{(\d+)(s|m|z|q(\d+)|d(\d+))?\}/g, (_, a: string, mod?: string, b?: string, c?: string) => {
    const i = Number(a);
    if (mod === 'z') { const v = vals[i - 1]; if (v === undefined) { bad = true; return ''; } return v.padStart(2, '0'); }
    if (mod === 'm') { const mo = Number(vals[i - 1]); if (!MONTH[mo]) { bad = true; return ''; } return MONTH[mo]; }
    if (mod?.startsWith('d') && c) {
      const d = vals[i - 1], mo = Number(vals[Number(c) - 1]);
      if (d === undefined || !MONTH[mo]) { bad = true; return ''; }
      return `${enNum(d)} ${MONTH[mo]}`;
    }
    if (mod?.startsWith('q') && b) {
      const n = vals[i - 1];
      const w = one(Number(b), n !== undefined && isOne(n) ? 's' : 'p');
      if (n === undefined || w === null) { bad = true; return ''; }
      return `${enNum(n)} ${w}`;
    }
    const v = one(i, mod === 's' ? 's' : 'p');
    if (v === null) { bad = true; return ''; }
    return v;
  });
  return bad ? null : out;
}

// Thứ tự quan trọng: quy tắc cụ thể đứng trước quy tắc chung.
const RULES: Rule[] = [
  // --- Câu lệnh ---
  rule('Tính.', 'Calculate.'), rule('Tính:', 'Calculate:'), rule('Tính nhẩm.', 'Calculate mentally.'), rule('Tính nhẩm:', 'Calculate mentally:'),
  rule('Tính nhanh:', 'Calculate quickly:'), rule('Tính nhanh.', 'Calculate quickly.'),
  rule('Tính bằng cách thuận tiện.', 'Calculate in the most convenient way.'), rule('Tính bằng cách thuận tiện:', 'Calculate in the most convenient way:'),
  rule('Tính (không cần rút gọn).', 'Calculate (no need to simplify).'), rule('Tính (từ trái sang phải).', 'Calculate (from left to right).'),
  rule('Tính (thương là số thập phân).', 'Calculate (the quotient is a decimal).'), rule('Tính bằng hai cách (đáp số giống nhau).', 'Calculate in two ways (the answers are the same).'),
  rule('Đặt tính rồi tính:', 'Set out the calculation, then calculate:'), rule('Đặt tính rồi tính.', 'Set out the calculation, then calculate.'),
  rule('Tính giá trị của biểu thức.', 'Find the value of the expression.'), rule('Tính giá trị của biểu thức:', 'Find the value of the expression:'),
  rule('Chọn dấu thích hợp:', 'Choose the correct sign:'), rule('Chọn dấu thích hợp.', 'Choose the correct sign.'), rule('Đếm rồi chọn dấu:', 'Count, then choose the correct sign:'),
  rule('Tìm số thích hợp.', 'Find the correct number.'), rule('Tìm số thích hợp:', 'Find the correct number:'),
  rule('Tìm số thích hợp điền vào chỗ chấm:', 'Find the number that goes in the blank:'),
  rule('Viết số thích hợp vào chỗ trống.', 'Write the correct number in the blank.'), rule('Viết số thích hợp vào chỗ trống:', 'Write the correct number in the blank:'),
  rule('Viết số thích hợp vào ô trống.', 'Write the correct number in the box.'), rule('Điền số thích hợp vào ô trống.', 'Fill in the box with the correct number.'),
  rule('Viết số thích hợp.', 'Write the correct number.'), rule('Viết số.', 'Write the number.'), rule('Viết số thập phân thích hợp vào chỗ trống.', 'Write the correct decimal in the blank.'),
  rule('Tìm quy luật rồi viết số tiếp theo.', 'Find the pattern, then write the next number.'), rule('Tìm quy luật rồi viết số tiếp theo:', 'Find the pattern, then write the next number:'),
  rule('Viết số tiếp theo của dãy:', 'Write the next number in the sequence:'), rule('Cho dãy số:', 'Here is a number sequence:'),
  rule('Tìm số còn thiếu.', 'Find the missing number.'), rule('Tìm số còn thiếu trong dãy:', 'Find the missing number in the sequence:'),
  rule('Đếm thêm {n} rồi viết số tiếp theo.', 'Count on by {1}, then write the next number.'),
  rule('Đếm từng loại rồi viết số vào ô trống.', 'Count each kind, then write the number in the box.'),
  rule('Tìm số lớn.', 'Find the larger number.'), rule('Tìm số bé.', 'Find the smaller number.'), rule('Tìm x.', 'Find x.'), rule('Tìm x, biết:', 'Find x, given:'),
  rule('Tìm x, biết {e}', 'Find x, given {1}.'), rule('Tìm x, biết {e}.', 'Find x, given {1}.'),
  rule('Viết số liền trước, số liền sau.', 'Write the number before and the number after.'),
  rule('Viết số thành tổng các trăm, chục, đơn vị.', 'Write the number as a sum of hundreds, tens and ones.'),
  rule('Đúng hay sai?', 'True or false?'), rule('Chọn đơn vị thích hợp:', 'Choose the correct unit:'), rule('Đáp số:', 'Answer:'),
  rule('Chọn tất cả các số ghép được.', 'Choose all the numbers you can make.'), rule('Chọn tất cả các số bằng {n}.', 'Choose all the numbers equal to {1}.'),
  rule('Chọn tất cả các số lớn hơn {n} và bé hơn {n}.', 'Choose all the numbers greater than {1} and less than {2}.'),
  rule('Từ một phép nhân, viết hai phép chia.', 'From one multiplication, write two divisions.'),
  rule('Từ ba số {n}, {n}, {n}, viết các phép tính đúng.', 'Using the three numbers {1}, {2} and {3}, write correct calculations.'),
  rule('Tách số để cộng qua {n}.', 'Split a number to add past {1}.'), rule('(nhìn theo tranh)', '(look at the picture)'),
  rule('Viết thành tỉ số phần trăm.', 'Write as a percentage.'), rule('Viết phân số thập phân thành số thập phân.', 'Write the decimal fraction as a decimal.'),
  rule('Viết số thập phân gồm:', 'Write the decimal made up of:'), rule('Tính chu vi.', 'Find the perimeter.'), rule('Tính chu vi và diện tích.', 'Find the perimeter and the area.'),
  rule('Tính diện tích.', 'Find the area.'), rule('Tính chiều cao.', 'Find the height.'), rule('Tính chiều dài.', 'Find the length.'),
  rule('Tính diện tích xung quanh.', 'Find the lateral surface area.'), rule('Tính diện tích toàn phần.', 'Find the total surface area.'),
  rule('Tính diện tích một mặt và diện tích toàn phần.', 'Find the area of one face and the total surface area.'),
  rule('Tính độ dài đường gấp khúc.', 'Find the length of the broken line.'), rule('Tính độ dài mỗi đáy.', 'Find the length of each base.'),
  rule('Tính diện tích hình chữ nhật.', 'Find the area of the rectangle.'), rule('Tính chu vi hình chữ nhật.', 'Find the perimeter of the rectangle.'),
  rule('Tính diện tích hình chữ nhật đó.', 'Find the area of that rectangle.'), rule('Tính chu vi hình vuông.', 'Find the perimeter of the square.'),
  rule('Tính chu vi hình tam giác.', 'Find the perimeter of the triangle.'), rule('Tính chu vi hình bình hành.', 'Find the perimeter of the parallelogram.'),
  rule('Tính chu vi hình thoi.', 'Find the perimeter of the rhombus.'), rule('Tính diện tích vành khăn.', 'Find the area of the ring.'),
  rule('Tính diện tích mảnh vườn.', 'Find the area of the garden.'), rule('Tính diện tích trồng rau.', 'Find the area used for growing vegetables.'),
  rule('Tính diện tích hình tam giác ABC.', 'Find the area of triangle ABC.'), rule('Nối A với C.', 'Join A to C.'),
  rule('Tính tuổi con.', "Find the child's age."), rule('Số đó là bao nhiêu?', 'What is that number?'), rule('Tìm số thứ ba.', 'Find the third number.'),
  rule('Tính đường kính và bán kính của hình tròn đó.', 'Find the diameter and the radius of that circle.'),

  // --- Số: cấu tạo, đọc, so sánh, làm tròn ---
  rule('Số nào gồm {n} và {n}?', 'Which number is made up of {1} and {2}?'),
  rule('{n} gồm {n} và mấy?', '{1} is made up of {2} and what number?'), rule('{n} gồm mấy và {n}?', '{1} is made up of what number and {2}?'),
  rule('Số {n} gồm mấy trăm, mấy chục, mấy đơn vị?', 'How many hundreds, tens and ones are there in {1}?'),
  rule('Số {n} gồm mấy chục và mấy đơn vị?', 'How many tens and ones are there in {1}?'),
  rule('Viết số gồm {n} chục nghìn, {n} nghìn, {n} trăm, {n} chục, {n} đơn vị.', 'Write the number made up of {1} ten thousands, {2} thousands, {3} hundreds, {4} tens and {5} ones.'),
  rule('{n} chục, {n} đơn vị, {n} phần mười, {n} phần trăm.', '{1} tens, {2} ones, {3} tenths and {4} hundredths.'),
  rule('Số {n} đọc là:', 'The number {1} is read as:'), rule('{n} đọc là:', '{1} is read as:'),
  rule('Số liền trước của {n} là:', 'The number just before {1} is:'), rule('Số liền sau của {n} là:', 'The number just after {1} is:'),
  rule('Số liền trước của {n} là số nào?', 'What is the number just before {1}?'), rule('Số liền sau của {n} là số nào?', 'What is the number just after {1}?'),
  rule('Số {n} hơn số {n} bao nhiêu đơn vị?', 'How many more than {2} is {1}?'),
  rule('Số bé {n} bằng một phần mấy số lớn {n}?', 'What fraction of the larger number {2} is the smaller number {1}?'),
  rule('Số lớn là {n}, số bé là {n}.', 'The larger number is {1} and the smaller number is {2}.'), rule('Số lớn gấp mấy lần số bé?', 'How many times the smaller number is the larger number?'),
  rule('Trong số {n}, chữ số {n} thuộc hàng nào?', 'In the number {1}, which place is the digit {2} in?'),
  rule('Trong số {n}, chữ số {n} ở hàng chục có giá trị là bao nhiêu?', 'In the number {1}, what is the value of the digit {2} in the tens place?'),
  rule('Làm tròn số {n} đến hàng {e} được:', 'Rounding {1} to the nearest {2} gives:'),
  rule('Làm tròn số {n} đến hàng chục được số nào?', 'What do you get when you round {1} to the nearest ten?'),
  rule('Làm tròn số {n} đến hàng trăm được số nào?', 'What do you get when you round {1} to the nearest hundred?'),
  rule('Làm tròn số {n} đến hàng nghìn được số nào?', 'What do you get when you round {1} to the nearest thousand?'),
  rule('Làm tròn số {n} đến hàng chục nghìn được số nào?', 'What do you get when you round {1} to the nearest ten thousand?'),
  rule('Làm tròn số {n} đến hàng chục được:', 'Rounding {1} to the nearest ten gives:'), rule('Làm tròn số {n} đến hàng trăm được:', 'Rounding {1} to the nearest hundred gives:'),
  rule('Làm tròn số {n} đến hàng nghìn được:', 'Rounding {1} to the nearest thousand gives:'), rule('Làm tròn số {n} đến hàng chục nghìn được:', 'Rounding {1} to the nearest ten thousand gives:'),
  rule('Làm tròn số {n} đến hàng trăm nghìn được:', 'Rounding {1} to the nearest hundred thousand gives:'),
  rule('Làm tròn số {n} đến hàng nghìn.', 'Round {1} to the nearest thousand.'), rule('Làm tròn số {n} đến hàng trăm.', 'Round {1} to the nearest hundred.'),
  rule('Làm tròn số {n} đến hàng phần mười.', 'Round {1} to the nearest tenth.'), rule('Làm tròn số {n} đến hàng phần trăm.', 'Round {1} to the nearest hundredth.'),
  rule('Làm tròn số {n} đến số tự nhiên gần nhất.', 'Round {1} to the nearest whole number.'),
  rule('Một số khi làm tròn đến hàng nghìn được {n}.', 'A number rounded to the nearest thousand is {1}.'), rule('Một số khi làm tròn đến hàng trăm được {n}.', 'A number rounded to the nearest hundred is {1}.'),
  rule('Số bé nhất có thể là số nào?', 'What is the smallest possible number?'), rule('Số lớn nhất có thể là số nào?', 'What is the largest possible number?'),
  rule('Chọn tất cả các số khi làm tròn đến số tự nhiên gần nhất thì được {n}.', 'Choose all the numbers that round to {1} as the nearest whole number.'),
  rule('Làm tròn mỗi số đến hàng nghìn rồi ước lượng tổng {e} khoảng:', 'Round each number to the nearest thousand, then estimate the sum {1}. It is about:'),
  rule('Có mấy số lớn hơn {n} và bé hơn {n}?', 'How many numbers are greater than {1} and less than {2}?'),
  rule('Có bao nhiêu số tự nhiên từ {n} đến {n}?', 'How many whole numbers are there from {1} to {2}?'),
  rule('Có bao nhiêu số tự nhiên x thoả mãn {e}?', 'How many whole numbers x satisfy {1}?'),
  rule('Tìm số tự nhiên x lớn nhất sao cho {e}.', 'Find the greatest whole number x such that {1}.'),
  rule('Từ {n} đến {n} có bao nhiêu số chẵn?', 'How many even numbers are there from {1} to {2}?'),
  rule('Từ {n} đến {n} có bao nhiêu số lẻ?', 'How many odd numbers are there from {1} to {2}?'),
  rule('Viết các số tự nhiên từ {n} đến {n}.', 'Write the whole numbers from {1} to {2}.'), rule('Hỏi chữ số {n} được viết bao nhiêu lần?', 'How many times is the digit {1} written?'),
  rule('Từ ba chữ số {n}, {n}, {n}, lập số có ba chữ số khác nhau bé nhất.', 'Using the three digits {1}, {2} and {3}, make the smallest 3-digit number with different digits.'),
  rule('Từ ba chữ số {n}, {n}, {n}, lập số có ba chữ số khác nhau lớn nhất.', 'Using the three digits {1}, {2} and {3}, make the largest 3-digit number with different digits.'),
  rule('Tìm số lớn nhất có ba chữ số mà tổng các chữ số bằng {n}.', 'Find the largest 3-digit number whose digits add up to {1}.'),
  rule('Số thứ {n} trong dãy là bao nhiêu?', 'What is number {1} in the sequence?'), rule('Dãy số {e} có tất cả bao nhiêu số?', 'How many numbers are there in the sequence {1}?'),
  rule('{e} Hỏi số thứ {n} của dãy là số nào?', '{1} What is number {2} in the sequence?'),

  // --- Phép tính, biểu thức ---
  rule('Gấp {n} lên {n} lần được bao nhiêu?', 'What is {1} multiplied by {2}?'), rule('Gấp {n} lên {n} lần được số nào?', 'What number do you get when you multiply {1} by {2}?'),
  rule('Giảm {n} đi {n} lần được bao nhiêu?', 'What is {1} divided by {2}?'),
  rule('Lấy {n} gấp lên {n} lần rồi giảm đi {n} lần thì được số nào?', 'Multiply {1} by {2}, then divide by {3}. What number do you get?'),
  rule('Tìm {n} của {n}.', 'Find {1} of {2}.'), rule('{n} của {n} là bao nhiêu?', 'What is {1} of {2}?'), rule('{n} của một số là {n}.', '{1} of a number is {2}.'),
  rule('Tìm {n}% của {n}.', 'Find {1}% of {2}.'), rule('Tìm tỉ số phần trăm của {n} và {n}.', 'Find the percentage of {1} compared with {2}.'),
  rule('Viết tỉ số {n} dưới dạng tỉ số phần trăm.', 'Write the ratio {1} as a percentage.'),
  rule('Tổng của hai số là {n}.', 'The sum of two numbers is {1}.'), rule('Hiệu của hai số là {n}.', 'The difference between two numbers is {1}.'),
  rule('Tổng của hai số là {n}, hiệu của hai số là {n}.', 'The sum of two numbers is {1} and their difference is {2}.'),
  rule('Hai số có tổng là {n} và hiệu là {n}.', 'Two numbers have a sum of {1} and a difference of {2}.'),
  rule('Hai số có tổng là {n}, số lớn hơn số bé {n} đơn vị.', 'Two numbers have a sum of {1}. The larger number is {2} more than the smaller number.'),
  rule('Tỉ số của hai số là {n}.', 'The ratio of the two numbers is {1}.'), rule('Tổng của {n} và {n} là bao nhiêu?', 'What is the sum of {1} and {2}?'),
  rule('Trung bình cộng của ba số là {n}.', 'The average of three numbers is {1}.'), rule('Hai số đầu là {n} và {n}.', 'The first two numbers are {1} and {2}.'),
  rule('Tìm số trung bình cộng của các số:', 'Find the average of these numbers:'),
  rule('Một phép chia có số chia là {n}, thương là {n} và số dư là số lớn nhất có thể.', 'A division has a divisor of {1}, a quotient of {2} and the largest possible remainder.'),
  rule('Số bị chia là bao nhiêu?', 'What is the dividend?'), rule('Phép tính nào có kết quả bằng {e}', 'Which calculation has a result equal to {1}'),
  rule('Biểu thức nào có giá trị bằng {n}?', 'Which expression has a value of {1}?'),
  rule('Giá trị của biểu thức {e} là:', 'The value of the expression {1} is:'), rule('Kết quả của {e} là:', 'The result of {1} is:'), rule('{e} là:', '{1} is:'),
  rule('Thương của phép chia {e}', 'The quotient of the division {1}'), rule('Giá trị của biểu thức {e}', 'The value of the expression {1}'),
  rule('Với m = {n}, giá trị của biểu thức {e} là:', 'When m = {1}, the value of the expression {2} is:'),
  rule('Tính giá trị của biểu thức {e} với a = {n}.', 'Find the value of the expression {1} when a = {2}.'),
  rule('Tính giá trị của biểu thức {e} với a = {n}, b = {n}, c = {n}.', 'Find the value of the expression {1} when a = {2}, b = {3} and c = {4}.'),
  rule('Chu vi hình vuông cạnh a là P = a × {n}.', 'The perimeter of a square with side a is P = a × {1}.'),

  // --- Phân số, số thập phân ---
  rule('Rút gọn phân số {n} thành phân số tối giản.', 'Simplify the fraction {1} to its simplest form.'), rule('Rút gọn phân số {n} được phân số tối giản là:', 'Simplifying {1} gives the fraction in simplest form:'),
  rule('Quy đồng mẫu số hai phân số {n} và {n} (lấy mẫu số chung là {n}).', 'Give the fractions {1} and {2} a common denominator (use {3} as the common denominator).'),
  rule('Quy đồng mẫu số hai phân số {n} và {n} với mẫu số chung {n}.', 'Give the fractions {1} and {2} the common denominator {3}.'),
  rule('Chuyển hỗn số {n} thành phân số.', 'Convert the mixed number {1} to a fraction.'), rule('Viết phân số {n} thành hỗn số.', 'Write the fraction {1} as a mixed number.'),
  rule('Viết phân số {n} thành phân số thập phân.', 'Write the fraction {1} as a decimal fraction.'),
  rule('Viết phân số {n} thành phân số thập phân có mẫu số {n}.', 'Write the fraction {1} as a decimal fraction with denominator {2}.'),
  rule('{n} viết dưới dạng phân số là:', '{1} written as a fraction is:'), rule('Phân số đảo ngược của {n} là:', 'The reciprocal of {1} is:'),
  rule('Phân số {n} có tử số và mẫu số là bao nhiêu?', 'What are the numerator and the denominator of the fraction {1}?'),
  rule('(viết dưới dạng phân số có mẫu số {n})', '(write it as a fraction with denominator {1})'),

  // --- Thời gian, lịch ---
  rule('Ngày {n} tháng {n} là thứ mấy?', 'What day of the week is {1d2}?'),
  rule('Ngày {n} tháng {n} là chủ nhật.', '{1d2} is a Sunday.'), rule('Ngày {n} tháng {n} là thứ hai.', '{1d2} is a Monday.'),
  rule('Ngày {n} tháng {n} là thứ ba.', '{1d2} is a Tuesday.'), rule('Ngày {n} tháng {n} là thứ tư.', '{1d2} is a Wednesday.'),
  rule('Ngày {n} tháng {n} là thứ năm.', '{1d2} is a Thursday.'), rule('Ngày {n} tháng {n} là thứ sáu.', '{1d2} is a Friday.'),
  rule('Ngày {n} tháng {n} là thứ bảy.', '{1d2} is a Saturday.'),
  rule('Năm {n} thuộc thế kỉ nào?', 'Which century is the year {1} in?'), rule('Đồng hồ chỉ mấy giờ?', 'What time does the clock show?'),
  rule('Bây giờ là {n} giờ.', "It is {1} o'clock now."), rule('{n} giờ {n} phút còn gọi là {n} giờ kém bao nhiêu phút?', '{1}:{2z} is the same as how many minutes to {3}?'),
  rule('Bộ phim bắt đầu lúc {n} giờ {n} phút và kéo dài {n} phút.', 'The film starts at {1}:{2z} and lasts {3} minutes.'),
  rule('Bộ phim kết thúc lúc mấy giờ?', 'What time does the film end?'), rule('Bạn đã làm bài trong bao lâu?', 'How long did you spend on the task?'),
  rule('Hỏi xe đến nơi lúc mấy giờ?', 'What time does the vehicle arrive?'), rule('Hỏi ô tô đến B lúc mấy giờ?', 'What time does the car arrive at B?'),

  // --- Hình học, đo lường ---
  rule('Hình chữ nhật có chiều dài {n} {u}, chiều rộng {n} {u}.', 'A rectangle has a length of {1} {2} and a width of {3} {4}.'),
  rule('Hình chữ nhật dài {n} {u}, rộng {n} {u}.', 'A rectangle is {1} {2} long and {3} {4} wide.'),
  rule('Hình chữ nhật ABCD dài {n} {u}, rộng {n} {u}.', 'Rectangle ABCD is {1} {2} long and {3} {4} wide.'),
  rule('Hình chữ nhật có diện tích {n} {u}, chiều rộng {n} {u}.', 'A rectangle has an area of {1} {2} and a width of {3} {4}.'),
  rule('Hình chữ nhật có chu vi {n} {u}, chiều rộng {n} {u}.', 'A rectangle has a perimeter of {1} {2} and a width of {3} {4}.'),
  rule('Một hình chữ nhật có chu vi {n} {u}, chiều dài {n} {u}.', 'A rectangle has a perimeter of {1} {2} and a length of {3} {4}.'),
  rule('Một hình chữ nhật có chu vi {n} {u}, chiều rộng bằng {n} chiều dài.', 'A rectangle has a perimeter of {1} {2}. Its width is {3} of its length.'),
  rule('Hình vuông có cạnh {n} {u}.', 'A square has sides of {1} {2}.'), rule('Hình vuông có chu vi {n} {u}.', 'A square has a perimeter of {1} {2}.'),
  rule('Hình thoi có cạnh {n} {u}.', 'A rhombus has sides of {1} {2}.'), rule('Hình lập phương có cạnh {n} {u}.', 'A cube has edges of {1} {2}.'),
  rule('Hình tam giác có ba cạnh dài {n} {u}, {n} {u}, {n} {u}.', 'A triangle has sides of {1} {2}, {3} {4} and {5} {6}.'),
  rule('Hình tam giác có độ dài ba cạnh là {n} {u}, {n} {u} và {n} {u}.', 'A triangle has sides of {1} {2}, {3} {4} and {5} {6}.'),
  rule('Hình tam giác vuông có hai cạnh góc vuông dài {n} {u} và {n} {u}.', 'A right-angled triangle has two shorter sides of {1} {2} and {3} {4}.'),
  rule('Hình tam giác có diện tích {n} {u}, độ dài đáy {n} {u}.', 'A triangle has an area of {1} {2} and a base of {3} {4}.'),
  rule('Tính diện tích hình tam giác có độ dài đáy {n} {u} và chiều cao {n} {u}.', 'Find the area of a triangle with a base of {1} {2} and a height of {3} {4}.'),
  rule('Tính diện tích hình thang có độ dài hai đáy là {n} {u} và {n} {u}, chiều cao {n} {u}.', 'Find the area of a trapezium with bases of {1} {2} and {3} {4} and a height of {5} {6}.'),
  rule('Hình thang có diện tích {n} {u}, hai đáy dài {n} {u} và {n} {u}.', 'A trapezium has an area of {1} {2} and bases of {3} {4} and {5} {6}.'),
  rule('Hình thang có diện tích {n} {u}, chiều cao {n} {u}, đáy lớn hơn đáy bé {n} {u}.', 'A trapezium has an area of {1} {2} and a height of {3} {4}. The longer base is {5} {6} more than the shorter base.'),
  rule('Hình bình hành có hai cạnh kề dài {n} {u} và {n} {u}.', 'A parallelogram has two adjacent sides of {1} {2} and {3} {4}.'),
  rule('Hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u}.', 'A cuboid is {1} {2} long, {3} {4} wide and {5} {6} high.'),
  rule('Hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u} và hình lập phương cạnh {n} {u}.', 'A cuboid is {1} {2} long, {3} {4} wide and {5} {6} high, and a cube has edges of {7} {8}.'),
  rule('Tính thể tích hình hộp chữ nhật có chiều dài {n} {u}, chiều rộng {n} {u}, chiều cao {n} {u}.', 'Find the volume of a cuboid with a length of {1} {2}, a width of {3} {4} and a height of {5} {6}.'),
  rule('Tính thể tích hình lập phương có cạnh {n} {u}.', 'Find the volume of a cube with edges of {1} {2}.'),
  rule('Một hình hộp chữ nhật có thể tích {n} {u}, chiều dài {n} {u}, chiều rộng {n} {u}.', 'A cuboid has a volume of {1} {2}, a length of {3} {4} and a width of {5} {6}.'),
  rule('Một hình lập phương có diện tích xung quanh {n} {u}.', 'A cube has a lateral surface area of {1} {2}.'),
  rule('Tính tổng độ dài các cạnh của hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u}.', 'Find the total length of all the edges of a cuboid {1} {2} long, {3} {4} wide and {5} {6} high.'),
  rule('Hình nào có thể tích lớn hơn?', 'Which shape has the greater volume?'),
  rule('Tính chu vi hình tròn có đường kính {n} {u}.', 'Find the circumference of a circle with a diameter of {1} {2}.'),
  rule('Tính chu vi hình tròn có bán kính {n} {u}.', 'Find the circumference of a circle with a radius of {1} {2}.'),
  rule('Tính diện tích hình tròn có bán kính {n} {u}.', 'Find the area of a circle with a radius of {1} {2}.'),
  rule('Một hình tròn có chu vi {n} {u}.', 'A circle has a circumference of {1} {2}.'), rule('Một nửa hình tròn có đường kính {n} {u}.', 'A semicircle has a diameter of {1} {2}.'),
  rule('Tính chu vi của nửa hình tròn đó (gồm cả đường kính).', 'Find the perimeter of that semicircle (including the diameter).'),
  rule('Một vành khăn được tạo bởi hai hình tròn cùng tâm có bán kính {n} {u} và {n} {u}.', 'A ring is formed by two circles with the same centre and radii of {1} {2} and {3} {4}.'),
  rule('Bánh xe đạp có đường kính {n} {u}.', 'A bicycle wheel has a diameter of {1} {2}.'),
  rule('Bánh xe lăn {n} vòng thì xe đi được bao nhiêu mét?', 'If the wheel turns {1} times, how many metres does the bicycle travel?'),
  rule('Đường gấp khúc dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is the broken line?'),
  rule('Đường gấp khúc gồm các đoạn thẳng dài {n} {u}, {n} {u}, {n} {u}.', 'A broken line is made of segments {1} {2}, {3} {4} and {5} {6} long.'),
  rule('Đường gấp khúc gồm các đoạn thẳng dài {n} {u}, {n} {u}, {n} {u}, {n} {u}.', 'A broken line is made of segments {1} {2}, {3} {4}, {5} {6} and {7} {8} long.'),
  rule('Đường gấp khúc ABC có AB = {n} {u}, BC = {n} {u}.', 'Broken line ABC has AB = {1} {2} and BC = {3} {4}.'),
  rule('Đường gấp khúc ABCD có AB = {n} {u}, BC = {n} {u}, CD = {n} {u}.', 'Broken line ABCD has AB = {1} {2}, BC = {3} {4} and CD = {5} {6}.'),
  rule('Đường gấp khúc ABCDE có AB = {n} {u}, BC = {n} {u}, CD = {n} {u}, DE = {n} {u}.', 'Broken line ABCDE has AB = {1} {2}, BC = {3} {4}, CD = {5} {6} and DE = {7} {8}.'),
  rule('Đường A gồm hai đoạn dài {n} {u} và {n} {u}.', 'Path A is made of two parts, {1} {2} and {3} {4} long.'), rule('Đường B dài {n} {u}.', 'Path B is {1} {2} long.'),
  rule('Đường nào ngắn hơn?', 'Which path is shorter?'), rule('Đồ vật nào ngắn hơn?', 'Which object is shorter?'), rule('Đồ vật nào dài hơn?', 'Which object is longer?'),
  rule('Góc thứ nhất có số đo {n}°, góc thứ hai có số đo {n}°.', 'The first angle measures {1}° and the second angle measures {2}°.'),
  rule('Góc thứ nhất lớn hơn góc thứ hai bao nhiêu độ?', 'How many degrees larger is the first angle than the second?'),
  rule('Góc còn lại có số đo bao nhiêu độ?', 'How many degrees does the other angle measure?'), rule('Góc có số đo {n}° là góc gì?', 'What kind of angle measures {1}°?'),
  rule('Một góc bẹt được chia thành hai góc, một góc có số đo {n}°.', 'A straight angle is split into two angles. One angle measures {1}°.'),
  rule('Một góc vuông được chia thành hai góc, một góc có số đo {n}°.', 'A right angle is split into two angles. One angle measures {1}°.'),
  rule('Một hình tam giác có hai góc là {n}° và {n}°.', 'A triangle has two angles of {1}° and {2}°.'), rule('Đó là hình tam giác gì?', 'What kind of triangle is it?'),
  rule('Có tất cả bao nhiêu góc vuông?', 'How many right angles are there altogether?'), rule('Trong tranh, mỗi loại hình có bao nhiêu hình?', 'In the picture, how many of each shape are there?'),
  rule('Thể tích của khối là bao nhiêu xăng-ti-mét khối?', 'What is the volume of the solid in cubic centimetres?'),
  rule('Thể tích hòn đá là bao nhiêu xăng-ti-mét khối?', 'What is the volume of the stone in cubic centimetres?'),
  rule('Thả một hòn đá chìm hẳn vào bể thì mực nước dâng lên {n} {u}.', 'When a stone is dropped in and sinks completely, the water level rises by {1} {2}.'),
  rule('Một bể kính hình hộp chữ nhật có đáy dài {n} {u}, rộng {n} {u}, đang chứa nước.', 'A glass tank shaped like a cuboid has a base {1} {2} long and {3} {4} wide. It contains some water.'),
  rule('Một bể nước hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u}.', 'A water tank shaped like a cuboid is {1} {2} long, {3} {4} wide and {5} {6} high.'),
  rule('Bể chứa được nhiều nhất bao nhiêu lít nước?', 'What is the most water the tank can hold, in litres?'),
  rule('Trong bể có bao nhiêu lít nước?', 'How many litres of water are in the tank?'), rule('Trong bể còn lại bao nhiêu lít?', 'How many litres are left in the tank?'),
  rule('Một bể có {n} lít nước, người ta dùng {n} số nước.', 'A tank holds {1} litres of water. {2} of the water is used.'),
  rule('Tính diện tích bìa cần dùng (không tính mép dán).', 'Find the area of card needed (not counting the glued edges).'),
  rule('Người ta làm một cái hộp không nắp hình lập phương cạnh {n} {u}.', 'An open box (without a lid) is made in the shape of a cube with edges of {1} {2}.'),
  rule('Lát nền bằng các viên gạch vuông cạnh {n} {u}.', 'The floor is tiled with square tiles of side {1} {2}.'), rule('Cần bao nhiêu viên gạch?', 'How many tiles are needed?'),
  rule('Nền phòng hình chữ nhật dài {n} {u}, rộng {n} {u}.', 'A rectangular floor is {1} {2} long and {3} {4} wide.'),
  rule('Một mảnh vườn hình chữ nhật dài {n} {u}, rộng {n} {u}.', 'A rectangular garden is {1} {2} long and {3} {4} wide.'),
  rule('Một mảnh vườn hình chữ nhật dài {n} {u}, chiều rộng bằng một nửa chiều dài.', 'A rectangular garden is {1} {2} long. Its width is half its length.'),
  rule('Người ta làm lối đi rộng {n} {u} sát bốn cạnh vườn, phần còn lại trồng rau.', 'A path {1} {2} wide is made along the four sides of the garden. The rest is used for vegetables.'),
  rule('Một cánh đồng hình chữ nhật dài {n} {u}, rộng {n} {u}.', 'A rectangular field is {1} {2} long and {3} {4} wide.'),
  rule('Diện tích cánh đồng bằng bao nhiêu héc-ta?', 'What is the area of the field in hectares?'),
  rule('Một thửa ruộng hình thang có hai đáy {n} {u} và {n} {u}, chiều cao {n} {u}.', 'A trapezium-shaped field has bases of {1} {2} and {3} {4} and a height of {5} {6}.'),
  rule('Cứ {n} {u} thu được {n} {u} thóc.', 'Every {1} {2} yields {3} {4} of paddy.'), rule('Thửa ruộng thu được bao nhiêu ki-lô-gam thóc?', 'How many kilograms of paddy does the field yield?'),
  rule('Sân trường dài {n} {u}.', 'The schoolyard is {1} {2} long.'), rule('Quãng đường AB dài {n} {u}.', 'The distance from A to B is {1} {2}.'),
  rule('Trên bản đồ tỉ lệ {e}, quãng đường dài {n} {u}.', 'On a map with a scale of {1}, a road is {2} {3} long.'),
  rule('Trên bản đồ tỉ lệ {e}, một khu đất hình chữ nhật có chiều dài {n} {u}, chiều rộng {n} {u}.', 'On a map with a scale of {1}, a rectangular plot of land is {2} {3} long and {4} {5} wide.'),
  rule('Trên bản đồ tỉ lệ {e}, chiều dài sân trường là bao nhiêu xăng-ti-mét?', 'On a map with a scale of {1}, how many centimetres long is the schoolyard?'),
  rule('Độ dài thật của quãng đường là bao nhiêu mét?', 'What is the real length of the road in metres?'),
  rule('Diện tích thật của khu đất là bao nhiêu mét vuông?', 'What is the real area of the plot in square metres?'),
  rule('Em đo bằng gang tay:', 'I measure with hand spans:'), rule('Em đo bằng sải tay:', 'I measure with arm spans:'),
  rule('Hình A gồm {n} hình lập phương nhỏ, hình B gồm {n} hình lập phương nhỏ như thế.', 'Shape A is made of {1} small cubes and shape B is made of {2} of the same small cubes.'),
  rule('Một khối được xếp từ các hình lập phương nhỏ cạnh {n} {u}:', 'A solid is built from small cubes with edges of {1} {2}:'),
  rule('mỗi lớp có {n} hàng, mỗi hàng {n} hình; khối có {n} lớp.', 'each layer has {1} rows, each row has {2} cubes, and the solid has {3} layers.'),

  // --- Vận tốc, chuyển động ---
  rule('Một ô tô đi với vận tốc {n} {u} trong {n} giờ.', 'A car travels at {1} {2} for {3} hours.'), rule('Tính quãng đường ô tô đi được.', 'Find the distance the car travels.'),
  rule('Một người đi xe máy được {n} {u} trong {n} giờ.', 'A person rides a motorbike {1} {2} in {3} hours.'), rule('Tính vận tốc của người đó.', 'Find the speed of that person.'),
  rule('Một ô tô đi quãng đường {n} {u} hết {n} giờ {n} phút.', 'A car travels {1} {2} in {3} hours {4} minutes.'), rule('Tính vận tốc của ô tô.', 'Find the speed of the car.'),
  rule('Tính vận tốc của xe máy.', 'Find the speed of the motorbike.'),
  rule('Một người đi xe đạp quãng đường {n} {u} với vận tốc {n} {u}.', 'A person cycles {1} {2} at a speed of {3} {4}.'), rule('Hỏi người đó đi hết bao nhiêu giờ?', 'How many hours does the journey take?'),
  rule('Một vận động viên chạy {n} {u} trong {n} phút.', 'An athlete runs {1} {2} in {3} minutes.'), rule('Tính vận tốc chạy của vận động viên đó.', "Find the athlete's running speed."),
  rule('Một xe khách khởi hành lúc {n} giờ {n} phút, đi hết {n} giờ {n} phút.', 'A coach leaves at {1}:{2z} and the journey takes {3} hours {4} minutes.'),
  rule('Một ô tô đi từ A lúc {n} giờ {n} phút với vận tốc {n} {u}.', 'A car leaves A at {1}:{2z} at a speed of {3} {4}.'),
  rule('Một xe đạp đi trước xe máy {n} {u}, hai xe đi cùng chiều, xuất phát cùng lúc.', 'A bicycle is {1} {2} ahead of a motorbike. They travel in the same direction and set off at the same time.'),
  rule('Xe đạp đi {n} {u}, xe máy đi {n} {u}.', 'The bicycle travels at {1} {2} and the motorbike at {3} {4}.'),
  rule('Sau mấy giờ xe máy đuổi kịp xe đạp?', 'After how many hours does the motorbike catch up with the bicycle?'),
  rule('Hai ô tô xuất phát cùng lúc từ hai thành phố cách nhau {n} {u}, đi ngược chiều nhau.', 'Two cars set off at the same time from two cities {1} {2} apart, travelling towards each other.'),
  rule('Vận tốc hai xe là {n} {u} và {n} {u}.', 'Their speeds are {1} {2} and {3} {4}.'), rule('Sau bao lâu hai xe gặp nhau?', 'After how long do the two cars meet?'),
  rule('Ai chạy nhanh hơn?', 'Who runs faster?'),

  // --- Lời văn: có, mua, thêm, bớt, chia đều ---
  rule('Có {n} {t}.', 'There are {1q2}.'), rule('Có thêm {n} {t} bay đến.', '{1} more {2} fly in.'), rule('Có thêm {n} {t}.', 'There are {1q2} more.'),
  rule('Trên cây có {n} {t}.', 'There are {1q2} in the tree.'), rule('Hỏi trên cây có tất cả bao nhiêu {t}?', 'How many {1} are in the tree altogether?'),
  rule('Hỏi trên cây còn lại bao nhiêu {t}?', 'How many {1} are left on the tree?'), rule('Các bạn hái xuống {n} {t}.', 'The children pick {1q2}.'),
  rule('Trong kho có {n} {t}.', 'There are {1q2} in the storeroom.'), rule('Người ta lấy đi {n} {t}.', '{1q2} are taken away.'),
  rule('Hỏi trong kho còn lại bao nhiêu {t}?', 'How many {1} are left in the storeroom?'),
  rule('Trong rổ có {n} {t} và {n} {t}.', 'There are {1q2} and {3q4} in the basket.'), rule('Trong sân có {n} {t} và {n} {t}.', 'There are {1q2} and {3q4} in the yard.'),
  rule('Trong túi có {n} {t} và {n} {t}.', 'There are {1q2} and {3q4} in the bag.'),
  rule('{name} có {n} {t}.', '{1} has {2q3}.'), rule('{who} có {n} {t}.', '{1} has {2q3}.'),
  rule('Hỏi {name} có bao nhiêu {t}?', 'How many {2} does {1} have?'), rule('Hỏi {who} có bao nhiêu {t}?', 'How many {2} do {1} have altogether?'),
  rule('Hỏi cả hai bạn có bao nhiêu {t}?', 'How many {1} do both children have altogether?'), rule('Hỏi cả hai có bao nhiêu {t}?', 'How many {1} do they have altogether?'),
  rule('Hỏi cả hai có bao nhiêu {u} {t}?', 'How many {1} of {2s} do they have altogether?'),
  rule('Hỏi có bao nhiêu {t}?', 'How many {1} are there?'), rule('Hỏi có tất cả bao nhiêu {t}?', 'How many {1} are there altogether?'),
  rule('Có tất cả bao nhiêu {t}?', 'How many {1} are there altogether?'), rule('Hỏi trồng tất cả bao nhiêu cây?', 'How many trees are planted altogether?'),
  rule('Hỏi trồng được bao nhiêu cây?', 'How many trees can be planted?'),
  rule('Mẹ mua {n} {t}, mỗi quyển {n} đồng và một hộp bút giá {n} đồng.', 'Mum buys {1q2} at {3} dong each and a pencil case for {4} dong.'),
  rule('Mẹ đưa {n} đồng.', 'Mum pays with {1} dong.'), rule('Cô bán hàng trả lại bao nhiêu tiền?', 'How much change does the shopkeeper give?'),
  rule('Cô bán hàng trả lại mẹ bao nhiêu tiền?', 'How much change does the shopkeeper give Mum?'),
  rule('Mẹ mua một quyển truyện giá {n} đồng, đưa cô bán hàng {n} đồng.', 'Mum buys a storybook for {1} dong and gives the shopkeeper {2} dong.'),
  rule('{name} mua một quyển vở giá {n} đồng và đưa cô bán hàng {n} đồng.', '{1} buys a notebook for {2} dong and gives the shopkeeper {3} dong.'),
  rule('Cô trả lại {name} bao nhiêu tiền?', 'How much change does the shopkeeper give {1}?'),
  rule('Mỗi quyển vở giá {n} đồng.', 'Each notebook costs {1} dong.'), rule('Mua {n} quyển vở hết bao nhiêu tiền?', 'How much do {1} notebooks cost?'),
  rule('Một ki-lô-gam táo giá {n} đồng.', 'One kilogram of apples costs {1} dong.'), rule('Mua {n} kg táo hết bao nhiêu tiền?', 'How much do {1} kg of apples cost?'),
  rule('Mẹ mua {n} kg thịt, giá {n} đồng một ki-lô-gam.', 'Mum buys {1} kg of meat at {2} dong per kilogram.'),
  rule('Số tiền phải trả làm tròn đến hàng nghìn là bao nhiêu đồng?', 'Rounded to the nearest thousand, how many dong must be paid?'),
  rule('Em có các tờ tiền:', 'I have these banknotes:'), rule('Em có tất cả bao nhiêu tiền?', 'How much money do I have altogether?'),
  rule('Em có một tờ {n} đồng, một tờ {n} đồng và một tờ {n} đồng.', 'I have a {1}-dong note, a {2}-dong note and a {3}-dong note.'),
  rule('Một đôi giày giá {n} đồng, nay được giảm giá {n}%.', 'A pair of shoes costs {1} dong and is now {2}% off.'),
  rule('Hỏi giá đôi giày sau khi giảm là bao nhiêu đồng?', 'What is the price of the shoes after the discount, in dong?'),
  rule('Một chiếc áo mua vào giá {n} đồng, bán ra giá {n} đồng.', 'A shirt is bought for {1} dong and sold for {2} dong.'),
  rule('Tiền lãi bằng bao nhiêu phần trăm giá mua?', 'What percentage of the buying price is the profit?'),
  rule('Bác An gửi tiết kiệm {n} đồng, lãi suất {n}% một tháng.', 'Uncle An puts {1} dong into savings at an interest rate of {2}% per month.'),
  rule('Sau một tháng, bác An có tất cả bao nhiêu tiền (cả gốc và lãi)?', 'After one month, how much money does Uncle An have altogether (savings plus interest)?'),
  rule('Vé người lớn giá {n} nghìn đồng, vé trẻ em giá {n} nghìn đồng.', 'An adult ticket costs {1} thousand dong and a child ticket costs {2} thousand dong.'),
  rule('Hỏi đoàn mua bao nhiêu vé người lớn?', 'How many adult tickets does the group buy?'),
  rule('{n} hộp bút như nhau có {n} cây bút.', '{1} identical pencil cases hold {2} pens.'), rule('Hỏi {n} cây bút thì xếp được bao nhiêu hộp như thế?', 'How many such pencil cases can {1} pens fill?'),
  rule('{n} hộp như nhau có {n} {t}.', '{1} identical boxes hold {2q3}.'), rule('Hỏi {n} hộp như thế có bao nhiêu {t}?', 'How many {2} are there in {1} such boxes?'),
  rule('Mỗi hộp có {n} {t}.', 'Each box has {1q2}.'), rule('Hỏi {n} hộp có bao nhiêu {t}?', 'How many {2} are there in {1} boxes?'),
  rule('Hỏi xếp được mấy hộp?', 'How many boxes can be filled?'),
  rule('{n} bao gạo như nhau nặng {n} kg.', '{1} identical bags of rice weigh {2} kg.'), rule('Hỏi {n} bao như thế nặng bao nhiêu ki-lô-gam?', 'How many kilograms do {1} such bags weigh?'),
  rule('Mỗi thùng có {n} {t}.', 'Each carton has {1q2}.'), rule('Hỏi {n} thùng như thế có bao nhiêu {t}?', 'How many {2} are there in {1} such cartons?'),
  rule('Mỗi chuyến xe chở được {n} {t}.', 'Each trip carries {1q2}.'), rule('Hỏi {n} chuyến như thế chở được bao nhiêu {t}?', 'How many {2} can {1} such trips carry?'),
  rule('Có {n} {t} xếp đều vào {n} {t}.', '{1q2} are shared equally among {3q4}.'), rule('Mỗi giá có bao nhiêu quyển?', 'How many books are on each shelf?'),
  rule('Có {n} quả cam xếp đều vào {n} rổ.', '{1} oranges are shared equally among {2} baskets.'), rule('Người ta lấy ra {n} quả từ một rổ.', '{1} are taken out of one basket.'),
  rule('Hỏi rổ đó còn lại bao nhiêu quả cam?', 'How many oranges are left in that basket?'),
  rule('Có {n} bạn đi tham quan, mỗi xe chở được {n} bạn.', '{1} pupils are going on a trip. Each bus carries {2} pupils.'),
  rule('Cần ít nhất bao nhiêu xe để chở hết các bạn?', 'What is the smallest number of buses needed to carry all the pupils?'),
  rule('Có {n} l nước mắm được rót đều vào {n} chai.', '{1} l of fish sauce is poured equally into {2} bottles.'),
  rule('Hỏi mỗi chai có bao nhiêu lít nước mắm?', 'How many litres of fish sauce are in each bottle?'),
  rule('Có {n} l nước mắm, rót vào các chai, mỗi chai {n} l.', 'There are {1} l of fish sauce, poured into bottles of {2} l each.'), rule('Cần bao nhiêu chai?', 'How many bottles are needed?'),
  rule('Một cửa hàng nhập {n} thùng nước, mỗi thùng {n} chai.', 'A shop buys in {1} crates of water, with {2} bottles in each crate.'),
  rule('Cửa hàng đã bán {n} chai.', 'The shop has sold {1} bottles.'), rule('Hỏi cửa hàng còn lại bao nhiêu thùng nước?', 'How many crates of water does the shop have left?'),
  rule('Hỏi mỗi lớp nhận được bao nhiêu {t}?', 'How many {1} does each class get?'), rule('Hỏi mỗi lớp nhận được bao nhiêu kg gạo?', 'How many kg of rice does each class get?'),
  rule('Còn lại bao nhiêu {t}?', 'How many {1} are left?'),
  rule('Buổi sáng cửa hàng bán được {n} {t}, buổi chiều bán được {n} {t}.', 'In the morning the shop sells {1q2}, and in the afternoon it sells {3q4}.'),
  rule('Hỏi cả ngày cửa hàng bán được bao nhiêu {t}?', 'How many {1} does the shop sell in the whole day?'),
  rule('Túi thứ nhất có {n} {t}, túi thứ hai có {n} {t}.', 'The first bag has {1q2} and the second bag has {3q4}.'),
  rule('Phải chuyển từ túi thứ nhất sang túi thứ hai bao nhiêu {t} để hai túi bằng nhau?', 'How many {1} must be moved from the first bag to the second bag so that both bags have the same number?'),
  rule('Thùng A có {n} lít nước, thùng B có {n} lít nước.', 'Tank A has {1} litres of water and tank B has {2} litres of water.'),
  rule('Phải chuyển bao nhiêu lít từ thùng A sang thùng B để hai thùng bằng nhau?', 'How many litres must be moved from tank A to tank B so that both tanks hold the same amount?'),
  rule('Một thùng có {n} l dầu.', 'A drum holds {1} l of oil.'), rule('Lần đầu lấy ra {n} l, lần sau lấy ra {n} l.', 'First {1} l is taken out, then {2} l.'),
  rule('Hỏi trong thùng còn bao nhiêu lít dầu?', 'How many litres of oil are left in the drum?'),
  rule('Can thứ nhất có {n} l nước mắm, can thứ hai có {n} l.', 'The first can holds {1} l of fish sauce and the second can holds {2} l.'),
  rule('Hỏi cả hai can có bao nhiêu lít?', 'How many litres do the two cans hold altogether?'),
  rule('Bao gạo nhỏ nặng {n} kg, bao gạo to nặng gấp {n} lần bao nhỏ.', 'The small bag of rice weighs {1} kg. The big bag weighs {2} times as much as the small bag.'),
  rule('Hỏi cả hai bao nặng bao nhiêu ki-lô-gam?', 'How many kilograms do both bags weigh altogether?'),
  rule('Bao thứ nhất nặng {n} kg, bao thứ hai nặng {n} kg.', 'The first bag weighs {1} kg and the second bag weighs {2} kg.'),
  rule('Quả bí nặng {n} kg, quả dưa nhẹ hơn quả bí {n} kg.', 'The pumpkin weighs {1} kg. The melon is {2} kg lighter than the pumpkin.'),
  rule('Hỏi quả dưa nặng bao nhiêu ki-lô-gam?', 'How many kilograms does the melon weigh?'),
  rule('Túi đường nặng {n} g, túi muối nặng {n} g.', 'The bag of sugar weighs {1} g and the bag of salt weighs {2} g.'),
  rule('Cả hai túi nặng bao nhiêu gam?', 'How many grams do both bags weigh?'), rule('Còn thiếu bao nhiêu gam nữa thì đủ {n} kg?', 'How many more grams are needed to make {1} kg?'),
  rule('Cân thăng bằng:', 'The scales are balanced:'),
  rule('đĩa bên trái có {n} hộp sữa như nhau, đĩa bên phải có quả cân {n} g.', 'the left pan has {1} identical cartons of milk and the right pan has a {2} g weight.'),
  rule('Mỗi hộp sữa nặng bao nhiêu gam?', 'How many grams does each carton of milk weigh?'),
  rule('Hỏi cả hai bạn cân nặng bao nhiêu ki-lô-gam?', 'How many kilograms do both children weigh altogether?'),
  rule('Ba bạn cân nặng lần lượt {n} kg, {n} kg, {n} kg.', 'Three children weigh {1} kg, {2} kg and {3} kg.'),
  rule('Trung bình mỗi bạn cân nặng bao nhiêu ki-lô-gam?', 'On average, how many kilograms does each child weigh?'),
  rule('Một xe chở {n} bao gạo, mỗi bao {n} kg.', 'A truck carries {1} bags of rice, each weighing {2} kg.'), rule('Xe chở bao nhiêu tạ gạo?', 'How many quintals of rice does the truck carry?'),
  rule('Kho A có {n} tấn gạo, kho B nhiều hơn kho A {n} tấn, kho C gấp {n} lần kho B.', 'Warehouse A has {1} tonnes of rice. Warehouse B has {2} tonnes more than A, and warehouse C has {3} times as much as B.'),
  rule('Cả ba kho có bao nhiêu tấn gạo?', 'How many tonnes of rice do the three warehouses have altogether?'),
  rule('Kho thứ nhất có nhiều hơn kho thứ hai {n} tấn gạo.', 'The first warehouse has {1} tonnes of rice more than the second.'),
  rule('Số gạo kho thứ hai bằng {n} số gạo kho thứ nhất.', 'The rice in the second warehouse is {1} of the rice in the first.'),
  rule('Mỗi kho có bao nhiêu tấn gạo?', 'How many tonnes of rice does each warehouse have?'),
  rule('Một cửa hàng có {n} kg gạo.', 'A shop has {1} kg of rice.'),
  rule('Ngày đầu bán {n} số gạo, ngày thứ hai bán {n} số gạo còn lại.', 'On the first day it sells {1} of the rice, and on the second day it sells {2} of the remaining rice.'),
  rule('Hỏi cửa hàng còn bao nhiêu ki-lô-gam gạo?', 'How many kilograms of rice does the shop have left?'),
  rule('Một tấm vải, ngày đầu bán {n} tấm, ngày sau bán {n} tấm.', 'From a roll of cloth, {1} of the roll is sold on the first day and {2} of the roll the next day.'),
  rule('Hỏi còn lại bao nhiêu phần tấm vải?', 'What fraction of the roll is left?'),
  rule('Đoạn dây xanh dài {n} m, đoạn dây đỏ dài {n} m.', 'The blue rope is {1} m long and the red rope is {2} m long.'),
  rule('Đoạn dây xanh dài gấp mấy lần đoạn dây đỏ?', 'How many times as long as the red rope is the blue rope?'),
  rule('Đoạn dây thứ nhất dài {n} m, đoạn dây thứ hai dài {n} m.', 'The first rope is {1} m long and the second rope is {2} m long.'),
  rule('Cả hai đoạn dài bao nhiêu mét?', 'How many metres long are the two ropes altogether?'),
  rule('Một người thợ làm một sản phẩm hết {n} phút.', 'A worker takes {1} minutes to make one product.'),
  rule('Hỏi làm {n} sản phẩm như thế hết bao nhiêu thời gian?', 'How long does it take to make {1} such products?'),
  rule('Một xe buýt chở {n} hành khách.', 'A bus carries {1} passengers.'), rule('Đến bến, có {n} hành khách xuống xe.', 'At the stop, {1} passengers get off.'),
  rule('Hỏi trên xe còn lại bao nhiêu hành khách?', 'How many passengers are left on the bus?'),
  rule('Đàn vịt có {n} con.', 'There are {1} ducks in the flock.'), rule('Số gà ít hơn, bằng số vịt giảm đi {n} lần.', 'There are fewer chickens: the number of ducks divided by {1}.'),
  rule('Hỏi có tất cả bao nhiêu cái chân?', 'How many legs are there altogether?'),
  rule('Vừa gà vừa chó có {n} con, đếm được {n} cái chân.', 'There are {1} chickens and dogs altogether, with {2} legs.'),
  rule('Trong sân có gà và chó, đếm được {n} cái đầu và {n} cái chân.', 'There are chickens and dogs in the yard: {1} heads and {2} legs.'),
  rule('Bãi xe có {n} chiếc gồm xe ba bánh và xe đạp, đếm được tất cả {n} bánh xe.', 'A car park has {1} tricycles and bicycles, with {2} wheels altogether.'),
  rule('Hỏi có bao nhiêu chiếc xe đạp?', 'How many bicycles are there?'),
  rule('Ba bạn trồng cây.', 'Three children plant trees.'), rule('Hai lớp trồng được {n} cây.', 'Two classes plant {1} trees.'),
  rule('Số cây lớp {cls} bằng {n} số cây lớp {cls}.', 'Class {1} plants {2} as many trees as class {3}.'), rule('Mỗi lớp trồng bao nhiêu cây?', 'How many trees does each class plant?'),
  rule('Theo kế hoạch, một xã trồng {n} ha rừng.', 'According to the plan, a commune is to plant {1} ha of forest.'), rule('Thực tế xã trồng được {n} ha.', 'In fact, the commune plants {1} ha.'),
  rule('Xã đã thực hiện được bao nhiêu phần trăm kế hoạch?', 'What percentage of the plan has the commune achieved?'),
  rule('{n}% số cây của vườn là {n} cây.', '{1}% of the trees in the garden is {2} trees.'), rule('Hỏi vườn có tất cả bao nhiêu cây?', 'How many trees does the garden have altogether?'),
  rule('Quanh một hồ nước hình tròn có chu vi {n} m, người ta trồng cây cách đều nhau {n} m.', 'Around a circular lake with a circumference of {1} m, trees are planted {2} m apart.'),
  rule('Một cửa hàng bán được số xe đạp trong {n} ngày lần lượt là {e} chiếc.', 'A shop sold these numbers of bicycles over {1} days: {2}.'),
  rule('Trung bình mỗi ngày bán được bao nhiêu chiếc?', 'On average, how many does the shop sell each day?'),
  rule('Số sách thư viện cho mượn trong {n} ngày:', 'Books lent by the library over {1} days:'), rule('Số sách thư viện cho mượn trong tuần:', 'Books lent by the library during the week:'),
  rule('Trung bình mỗi ngày cho mượn bao nhiêu cuốn sách?', 'On average, how many books are lent each day?'),
  rule('Ngày nào cho mượn nhiều sách nhất?', 'On which day were the most books lent?'), rule('Ngày nào cho mượn ít sách nhất?', 'On which day were the fewest books lent?'),
  rule('Hỏi cuốn sách dày bao nhiêu trang?', 'How many pages does the book have?'),
  rule('Để đánh số trang một cuốn sách dày {n} trang (bắt đầu từ trang {n}) cần dùng tất cả bao nhiêu chữ số?', 'How many digits are needed to number the pages of a {1}-page book (starting from page {2})?'),

  // --- Tuổi ---
  rule('Năm nay em {n} tuổi, anh hơn em {n} tuổi.', 'This year I am {1} years old. My brother is {2} years older than me.'),
  rule('Năm nay con {n} tuổi, tuổi mẹ gấp {n} lần tuổi con.', "This year the child is {1} years old. Mum's age is {2} times the child's age."),
  rule('Năm nay mẹ {n} tuổi.', 'This year Mum is {1} years old.'), rule('Mẹ hơn con {n} tuổi.', 'Mum is {1} years older than her child.'),
  rule('Tuổi con bằng {n} tuổi mẹ.', "The child's age is {1} of Mum's age."), rule('Tổng số tuổi của mẹ và con là {n}.', "The sum of Mum's age and the child's age is {1}."),
  rule('Tổng số tuổi của hai mẹ con là {n} tuổi, mẹ hơn con {n} tuổi.', "Mum's and her child's ages add up to {1} years. Mum is {2} years older than the child."),
  rule('Hỏi {n} năm nữa anh bao nhiêu tuổi?', 'How old will my brother be in {1} years?'), rule('Hỏi {n} năm nữa anh hơn em mấy tuổi?', 'In {1} years, how many years older than me will my brother be?'),
  rule('Hỏi {n} năm nữa mẹ bao nhiêu tuổi?', 'How old will Mum be in {1} years?'), rule('Hỏi {n} năm nữa con bao nhiêu tuổi?', 'How old will the child be in {1} years?'),
  rule('Hỏi {n} năm trước mẹ bao nhiêu tuổi?', 'How old was Mum {1} years ago?'), rule('Hỏi con bao nhiêu tuổi?', 'How old is the child?'),
  rule('Hỏi hiện nay con bao nhiêu tuổi?', 'How old is the child now?'), rule('Hỏi năm nay con bao nhiêu tuổi?', 'How old is the child this year?'),

  // --- Thống kê, khả năng ---
  rule('Có {n} học sinh tham gia khảo sát.', '{1} students take part in the survey.'), rule('Có tất cả bao nhiêu bạn tham gia khảo sát?', 'How many pupils take part in the survey altogether?'),
  rule('Lớp em bình chọn màu yêu thích, kết quả ghi lần lượt:', 'My class votes for their favourite colour. The results in order are:'),
  rule('Các bạn chọn món quả yêu thích, ghi lại lần lượt:', 'The children choose their favourite fruit. The choices in order are:'),
  rule('Có bao nhiêu bạn chọn màu đỏ?', 'How many pupils chose red?'), rule('Có bao nhiêu bạn chọn màu vàng?', 'How many pupils chose yellow?'),
  rule('Có bao nhiêu bạn chọn màu xanh?', 'How many pupils chose blue?'), rule('Có bao nhiêu bạn chọn màu tím?', 'How many pupils chose purple?'),
  rule('Có bao nhiêu bạn chọn cam?', 'How many pupils chose oranges?'),
  rule('Môn nào được nhiều bạn yêu thích nhất?', 'Which subject do the most pupils like best?'), rule('Môn nào được nhiều bạn thích nhất?', 'Which subject do the most pupils like?'),
  rule('Lớp nào có nhiều nhất?', 'Which class has the most?'), rule('Bạn nào cao nhất?', 'Who is the tallest?'), rule('Bạn nào thấp nhất?', 'Who is the shortest?'),
  rule('Cây của bạn nào thấp nhất?', 'Whose plant is the shortest?'), rule('Cây của bạn nào cao nhất?', 'Whose plant is the tallest?'),
  rule('Bạn cao nhất cao bao nhiêu xăng-ti-mét?', 'How tall is the tallest child, in centimetres?'),
  rule('Bạn cao nhất cao hơn bạn thấp nhất bao nhiêu xăng-ti-mét?', 'How many centimetres taller is the tallest child than the shortest?'),
  rule('Chiều cao (cm) của {n} bạn trong nhóm:', 'Heights (cm) of the {1} children in the group:'), rule('Dãy số liệu chiều cao:', 'Height data:'),
  rule('Kết quả nhảy xa (m):', 'Long jump results (m):'), rule('Xếp tên các bạn theo thành tích từ cao đến thấp.', 'List the children from the best result to the worst.'),
  rule('Nhiệt độ cùng một buổi trưa:', 'Temperatures at noon on the same day:'), rule('Nơi nào mát nhất?', 'Which place is the coolest?'),
  rule('Nhiệt độ cao nhất các ngày trong tuần (°C):', 'Highest temperature on each day of the week (°C):'),
  rule('Ngày nóng nhất hơn ngày mát nhất bao nhiêu độ?', 'How many degrees warmer is the hottest day than the coolest day?'),
  rule('Buổi sáng nhiệt độ là {n} °C, buổi trưa tăng thêm {n} °C.', 'In the morning the temperature is {1} °C. By noon it rises by {2} °C.'),
  rule('Nhiệt độ buổi trưa là bao nhiêu độ C?', 'What is the temperature at noon, in °C?'),
  rule('Số học sinh đi học sớm trong {n} ngày:', 'Number of students arriving early over {1} days:'),
  rule('Có bao nhiêu ngày số học sinh đi học sớm nhiều hơn mức trung bình?', 'On how many days did more students than average arrive early?'),
  rule('Gieo xúc xắc {n} lần được số chấm:', 'A dice is rolled {1} times. The numbers of dots are:'),
  rule('Mặt {n} chấm xuất hiện bao nhiêu lần?', 'How many times does the {1}-dot face appear?'),
  rule('Gieo một con xúc xắc {n} lần, có {n} lần xuất hiện mặt {n} chấm.', 'A dice is rolled {1} times and the {3}-dot face appears {2} times.'),
  rule('Số lần xuất hiện mặt {n} chấm chiếm bao nhiêu phần trăm tổng số lần gieo?', 'What percentage of all the rolls show the {1}-dot face?'),
  rule('Tung một đồng xu {n} lần, có {n} lần xuất hiện mặt sấp.', 'A coin is tossed {1} times and lands heads {2} times.'),
  rule('Tỉ số của số lần xuất hiện mặt sấp và tổng số lần tung là:', 'The ratio of the number of heads to the total number of tosses is:'),
  rule('Mặt sấp xuất hiện bao nhiêu lần?', 'How many times does it land heads?'),
  rule('Có {n} tấm thẻ ghi các số {e}.', 'There are {1} cards with the numbers {2}.'), rule('Rút ngẫu nhiên {n} thẻ.', '{1} card is drawn at random.'),
  rule('Khả năng rút được thẻ ghi số lớn hơn {n} là:', 'The chance of drawing a card with a number greater than {1} is:'),
  rule('Khả năng rút được thẻ ghi số {n} là:', 'The chance of drawing the card with the number {1} is:'),
  rule('Có ba tấm thẻ số {n}, {n}, {n}.', 'There are three number cards: {1}, {2} and {3}.'),
  rule('Ghép hai trong ba tấm thẻ (mỗi tấm dùng một lần) để được số có hai chữ số.', 'Put two of the three cards together (each card used once) to make a 2-digit number.'),
  rule('Không nhìn vào túi, phải lấy ra ít nhất bao nhiêu viên bi để chắc chắn có {n} viên bi cùng màu?', 'Without looking in the bag, what is the smallest number of marbles you must take out to be sure of getting {1} marbles of the same colour?'),
  rule('Tỉ số của số cam và tổng số quả trong rổ là:', 'The ratio of oranges to the total number of fruits in the basket is:'),
  rule('Tỉ số của số lần ném trượt và tổng số lần ném là:', 'The ratio of missed throws to the total number of throws is:'),
  rule('Tỉ số của số bạn nam và số bạn nữ là:', 'The ratio of boys to girls is:'), rule('Bạn nào có tỉ số ném trúng cao hơn?', 'Who has the higher ratio of successful throws?'),
  rule('Lớp {cls} có {n} học sinh, trong đó có {n} học sinh nữ.', 'Class {1} has {2} students, of whom {3} are girls.'),
  rule('Số học sinh nữ chiếm bao nhiêu phần trăm số học sinh cả lớp?', 'What percentage of the class are girls?'),
  rule('Lớp {cls} có {n} học sinh, trong đó {n} số học sinh thích đá cầu.', 'Class {1} has {2} students, and {3} of them like shuttlecock kicking.'),
  rule('Có bao nhiêu bạn thích đá cầu?', 'How many pupils like shuttlecock kicking?'),
  rule('Lớp {cls} có {n} học sinh, lớp {cls} có {n} học sinh, lớp {cls} có {n} học sinh.', 'Class {1} has {2} students, class {3} has {4} students and class {5} has {6} students.'),
  rule('Lớp {cls} có bao nhiêu học sinh (mỗi bạn chọn một môn)?', 'How many students are there in class {1} (each pupil chose one subject)?'),
  rule('Đội văn nghệ có {n} bạn.', 'The performing arts team has {1} pupils.'), rule('Số bạn nam bằng {n} số bạn của cả đội.', 'The boys make up {1} of the whole team.'),
  rule('Hỏi đội có bao nhiêu bạn nữ?', 'How many girls are on the team?'),
  rule('Khối lớp {n} có {n} bạn, trong đó {n} số bạn thích bơi.', 'Grade {1} has {2} pupils, and {3} of them like swimming.'),
  rule('Viết {n} thành phân số thập phân, rồi tính số bạn thích bơi.', 'Write {1} as a decimal fraction, then work out how many pupils like swimming.'),
  rule('Trường có {n} học sinh, trong đó số học sinh tham gia câu lạc bộ thể thao chiếm {n}%.', 'A school has {1} students, and {2}% of them belong to the sports club.'),
  rule('Hỏi có bao nhiêu học sinh tham gia câu lạc bộ thể thao?', 'How many students belong to the sports club?'),
  rule('Biết có {n} bạn thích bóng rổ.', 'We know that {1} pupils like basketball.'),
  rule('Biểu đồ hình quạt tròn cho biết tỉ số phần trăm học sinh thích các môn thể thao:', 'The pie chart shows the percentage of students who like each sport:'),
  rule('Biểu đồ hình quạt tròn về các môn thể thao học sinh yêu thích:', "Pie chart of students' favourite sports:"),
  rule('Tìm số phần trăm còn thiếu của Bơi lội.', 'Find the missing percentage for Swimming.'),
  rule('Các bạn xếp thành một hàng.', 'The children stand in a line.'), rule('Hàng có {n} bạn.', 'There are {1} children in the line.'), rule('Hỏi hàng có mấy bạn?', 'How many children are in the line?'),
  rule('Cả bốn lớp có tất cả bao nhiêu bạn?', 'How many pupils are there in the four classes altogether?'),
  rule('Một người đi bộ:', 'A person is walking:'),
  rule('giờ đầu đi được {n} quãng đường, giờ thứ hai đi được {n} quãng đường.', 'in the first hour they cover {1} of the distance, and in the second hour {2} of the distance.'),
  rule('Người đó còn phải đi bao nhiêu phần quãng đường nữa?', 'What fraction of the distance is still left to walk?'),
  rule('Một bể nước hình lập phương cạnh {n} dm đang chứa nước đến {n}% thể tích bể.', 'A cube-shaped water tank with edges of {1} dm is filled to {2}% of its volume.'),
  rule('Tháng Hai bán được bao nhiêu lượt khách?', 'How many visitors were there in February?'), rule('Tháng Hai bán được bao nhiêu {t}?', 'How many {1} were sold in February?'),

  // --- Bổ sung (vòng 2) ---
  rule('Viết số gồm {n} trăm, {n} chục, {n} đơn vị.', 'Write the number made up of {1} hundreds, {2} tens and {3} ones.'),
  rule('Viết số gồm {n} chục, {n} đơn vị.', 'Write the number made up of {1} tens and {2} ones.'),
  rule('Số thập phân gồm {n} đơn vị, {n} phần mười, {n} phần trăm, {n} phần nghìn viết là:', 'The decimal made up of {1} ones, {2} tenths, {3} hundredths and {4} thousandths is written as:'),
  rule('Số thập phân gồm {n} đơn vị, {n} phần mười, {n} phần trăm viết là:', 'The decimal made up of {1} ones, {2} tenths and {3} hundredths is written as:'),
  rule('Trong số {n}, chữ số {n} ở hàng {p} có giá trị là bao nhiêu?', 'In the number {1}, what is the value of the digit {2} in the {3} place?'),
  rule('Trong số {n}, chữ số {n} có giá trị là bao nhiêu?', 'In the number {1}, what is the value of the digit {2}?'),
  rule('Làm tròn số {n} đến hàng trăm nghìn.', 'Round {1} to the nearest hundred thousand.'), rule('Làm tròn số {n} đến hàng chục nghìn.', 'Round {1} to the nearest ten thousand.'),
  rule('Làm tròn số {n} đến hàng chục.', 'Round {1} to the nearest ten.'),
  rule('Trong các số {e}, số nào bé nhất?', 'Which is the smallest of the numbers {1}?'), rule('Trong các số {e}, số nào lớn nhất?', 'Which is the largest of the numbers {1}?'),
  rule('Số còn thiếu là số nào?', 'What is the missing number?'), rule('Viết kết quả các phép tính sau.', 'Write the results of these calculations.'),
  rule('Biết {e}.', 'Given that {1}.'), rule('Tách số {n} thành số tròn chục và số đơn vị.', 'Split {1} into a multiple of ten and ones.'),
  rule('{n} giờ nữa là mấy giờ?', 'What time will it be in {1} hours?'), rule('Đồng hồ nào chỉ {n} giờ?', "Which clock shows {1} o'clock?"),
  rule('Lúc {n} giờ đúng, kim ngắn của đồng hồ chỉ số mấy?', "At exactly {1} o'clock, which number does the hour hand point to?"),
  rule('Mặt đồng hồ ghi số La Mã.', 'The clock face has Roman numerals.'),
  rule('Chọn tất cả các phép tính có kết quả lớn hơn {n}.', 'Choose all the calculations with a result greater than {1}.'),
  rule('Chọn tất cả các phép tính có kết quả bé hơn {n}.', 'Choose all the calculations with a result less than {1}.'),
  rule('Chọn tất cả các phép tính có kết quả bằng {n}.', 'Choose all the calculations with a result equal to {1}.'),
  rule('Chọn dấu + hoặc − thích hợp:', 'Choose + or −:'), rule('Chọn dấu đúng:', 'Choose the correct sign:'),
  rule('Phép tính nào có kết quả bằng {n}?', 'Which calculation has a result of {1}?'),
  rule('Số nào lớn hơn {n} nhưng bé hơn {n}?', 'Which number is greater than {1} but less than {2}?'),
  rule('Số đứng ngay sau số {n} là số nào?', 'Which number comes just after {1}?'), rule('Số đứng ngay trước số {n} là số nào?', 'Which number comes just before {1}?'),
  rule('Trong bảng các số từ {n} đến {n} (mỗi hàng {n} số), số ngay bên trái số {n} là số nào?', 'In a number grid from {1} to {2} ({3} numbers in each row), which number is just to the left of {4}?'),
  rule('Trong bảng các số từ {n} đến {n} (mỗi hàng {n} số), số ngay bên phải số {n} là số nào?', 'In a number grid from {1} to {2} ({3} numbers in each row), which number is just to the right of {4}?'),
  rule('Trong bảng các số từ {n} đến {n} (mỗi hàng {n} số), số ngay bên trên số {n} là số nào?', 'In a number grid from {1} to {2} ({3} numbers in each row), which number is just above {4}?'),
  rule('Trong bảng các số từ {n} đến {n} (mỗi hàng {n} số), số ngay bên dưới số {n} là số nào?', 'In a number grid from {1} to {2} ({3} numbers in each row), which number is just below {4}?'),
  rule('Đếm tiếp: {e} Số tiếp theo là số mấy?', 'Keep counting: {1} What is the next number?'),
  rule('Quan sát tranh rồi viết số thích hợp.', 'Look at the picture, then write the correct number.'), rule('Đếm rồi viết số thích hợp vào ô trống.', 'Count, then write the correct number in the box.'),
  rule('Chọn tất cả các băng giấy dài hơn {n} {u}.', 'Choose all the paper strips longer than {1} {2}.'),
  rule('Chọn TẤT CẢ các phép tính có kết quả bằng {n}.', 'Choose ALL the calculations with a result of {1}.'),
  rule('Chọn TẤT CẢ các cách tách số {n} thành hai phần.', 'Choose ALL the ways to split {1} into two parts.'),
  rule('Có {n} {t}, {n} {t} bơi đi.', 'There are {1q2}. {3q4} swim away.'), rule('Có {n} {t}, {n} {t} bay đi.', 'There are {1q2}. {3q4} fly away.'),
  rule('Có {n} chiếc ô tô, {n} chiếc ô tô chạy đi.', 'There are {1} cars. {2} cars drive away.'), rule('Có {n} {t}, {n} {t} bị vỡ.', 'There are {1q2}. {3q4} burst.'),
  rule('Có {n} {t}, {n} {t} chạy đi.', 'There are {1q2}. {3q4} run away.'),
  rule('Viết phép tính để biết còn lại mấy {t}.', 'Write a calculation to find how many {1} are left.'),
  rule('Viết phép tính để biết còn lại mấy chiếc ô tô.', 'Write a calculation to find how many cars are left.'),
  rule('Trong hộp có {n} {t}.', 'There are {1q2} in the box.'), rule('Mẹ bỏ thêm vào {n} {t}.', 'Mum puts in {1} more {2}.'),
  rule('Hỏi trong hộp có tất cả bao nhiêu {t}?', 'How many {1} are in the box altogether?'),
  rule('Hai số cộng lại bằng {n}.', 'Two numbers add up to {1}.'), rule('Số thứ nhất hơn số thứ hai {n} đơn vị.', 'The first number is {1} more than the second.'),
  rule('Hỏi số thứ nhất là bao nhiêu?', 'What is the first number?'),
  rule('Lớp nào có ít học sinh nhất?', 'Which class has the fewest students?'), rule('Lớp nào có nhiều học sinh nhất?', 'Which class has the most students?'),
  rule('Hỏi hàng có tất cả mấy bạn?', 'How many children are in the line altogether?'),
  rule('Có {n} {t} chia đều cho {n} {t}.', '{1q2} are shared equally among {3q4}.'), rule('Có {n} {t} chia đều vào {n} {t}.', '{1q2} are put equally into {3q4}.'),
  rule('Có {n} kg gạo chia đều cho {n} lớp.', '{1} kg of rice is shared equally among {2} classes.'),
  rule('Hỏi mỗi bạn được mấy {t}?', 'How many {1} does each pupil get?'), rule('Hỏi mỗi bạn được bao nhiêu {t}?', 'How many {1} does each pupil get?'),
  rule('Hỏi mỗi hộp có bao nhiêu {t}?', 'How many {1} are there in each box?'), rule('Hỏi mỗi rổ có bao nhiêu {t}?', 'How many {1} are there in each basket?'),
  rule('Hỏi mỗi túi có bao nhiêu {t}?', 'How many {1} are there in each bag?'), rule('Hỏi mỗi đĩa có bao nhiêu {t}?', 'How many {1} are there on each plate?'),
  rule('Cả bốn lớp có tất cả bao nhiêu {t}?', 'How many {1} do the four classes have altogether?'), rule('Cả bốn lớp có tất cả bao nhiêu quyển?', 'How many books do the four classes have altogether?'),
  rule('Có bao nhiêu học sinh thích {s}?', 'How many students like {1}?'), rule('Có bao nhiêu bạn thích {s}?', 'How many pupils like {1}?'),
  rule('Biết có {n} bạn thích {s}.', 'We know that {1} pupils like {2}.'), rule('Tìm số phần trăm còn thiếu của {s}.', 'Find the missing percentage for {1}.'),
  rule('Khả năng rút được thẻ ghi số chẵn là:', 'The chance of drawing a card with an even number is:'), rule('Khả năng rút được thẻ ghi số lẻ là:', 'The chance of drawing a card with an odd number is:'),
  rule('Tổng số tuổi của mẹ và con là {n} tuổi.', "Mum's age and her child's age add up to {1} years."), rule('Tính tuổi của mỗi người.', "Find each person's age."),
  rule('Hỏi mẹ hơn con bao nhiêu tuổi?', 'How many years older than her child is Mum?'),
  rule('Tổng số tuổi của hai bố con là {n} tuổi, bố hơn con {n} tuổi.', "Dad's and his child's ages add up to {1} years. Dad is {2} years older than the child."),
  rule('Sau {n} năm nữa tổng số tuổi của hai mẹ con là {n} tuổi.', "In {1} years, Mum's and her child's ages will add up to {2} years."),
  rule('Biết mẹ hơn con {n} tuổi.', 'Mum is {1} years older than her child.'),
  rule('Cách đây {n} năm, tuổi bố gấp {n} lần tuổi con.', "{1} years ago, Dad's age was {2} times the child's age."),
  rule('Hiện nay tổng số tuổi của hai bố con là {n} tuổi.', "Now Dad's and his child's ages add up to {1} years."),
  rule('Dùng cả {n} chữ số {e} (mỗi chữ số một lần), viết số lớn nhất.', 'Using all {1} digits {2} (each digit once), write the largest number.'),
  rule('Dùng cả {n} chữ số {e} (mỗi chữ số một lần), viết số bé nhất.', 'Using all {1} digits {2} (each digit once), write the smallest number.'),
  rule('Dùng cả {n} chữ số {e} (mỗi chữ số dùng một lần), viết số lớn nhất có {n} chữ số.', 'Using all {1} digits {2} (each digit once), write the largest {3}-digit number.'),
  rule('Dùng cả {n} chữ số {e} (mỗi chữ số dùng một lần), viết số bé nhất có {n} chữ số.', 'Using all {1} digits {2} (each digit once), write the smallest {3}-digit number.'),
  rule('Từ năm chữ số {e}, lập số lớn nhất có năm chữ số khác nhau.', 'Using the five digits {1}, make the largest 5-digit number with different digits.'),
  rule('Từ năm chữ số {e}, lập số bé nhất có năm chữ số khác nhau.', 'Using the five digits {1}, make the smallest 5-digit number with different digits.'),
  rule('Người ta dùng tất cả {n} chữ số để đánh số trang một cuốn sách (bắt đầu từ trang {n}).', '{1} digits are used altogether to number the pages of a book (starting from page {2}).'),
  rule('Không nhìn vào túi, phải lấy ra ít nhất bao nhiêu viên bi để chắc chắn có {n} viên bi đỏ?', 'Without looking in the bag, what is the smallest number of marbles you must take out to be sure of getting {1} red marbles?'),
  rule('Không nhìn vào túi, phải lấy ra ít nhất bao nhiêu viên bi để chắc chắn có {n} viên bi xanh?', 'Without looking in the bag, what is the smallest number of marbles you must take out to be sure of getting {1} blue marbles?'),
  rule('Tính P với a = {n} {u}.', 'Find P when a = {1} {2}.'),
  rule('Một bức tranh có {n} hình vuông, {n} hình chữ nhật và {n} hình tam giác thường (không có góc vuông).', 'A picture has {1} squares, {2} rectangles and {3} ordinary triangles (with no right angle).'),
  rule('Một căn phòng hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u}.', 'A room shaped like a cuboid is {1} {2} long, {3} {4} wide and {5} {6} high.'),
  rule('Người ta quét vôi bốn bức tường và trần nhà, trừ cửa có diện tích {n} {u}.', 'The four walls and the ceiling are painted, except for doors with an area of {1} {2}.'),
  rule('Tính diện tích cần quét vôi.', 'Find the area to be painted.'),
  rule('Xếp {n} hình tròn bằng nhau, bán kính {n} {u}, sát nhau thành một hàng thẳng.', '{1} equal circles with a radius of {2} {3} are placed touching in a straight row.'),
  rule('Hàng hình tròn dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is the row of circles?'),
  rule('Cạnh hình vuông dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is each side of the square?'),
  rule('Một hàng có {n} cây thẳng hàng, hai cây liền nhau cách nhau {n} {u}.', 'A row has {1} trees in a straight line, with {2} {3} between neighbouring trees.'),
  rule('Hỏi cây đầu tiên cách cây cuối cùng bao nhiêu mét?', 'How many metres apart are the first and the last trees?'),
  rule('Tính tổng độ dài các cạnh của hình lập phương có cạnh {n} {u}.', 'Find the total length of all the edges of a cube with edges of {1} {2}.'),
  rule('Năm {n} có bao nhiêu ngày?', 'How many days are there in the year {1}?'), rule('(Tháng Hai năm đó có {n} ngày.)', '(February that year has {1} days.)'),
  rule('Đoạn thẳng AB dài {n} {u}, M là trung điểm của AB.', 'Line segment AB is {1} {2} long, and M is the midpoint of AB.'),
  rule('Đoạn thẳng AM dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is line segment AM?'),
  rule('Độ dài thật của quãng đường là bao nhiêu ki-lô-mét?', 'What is the real length of the road in kilometres?'),
  rule('Người thứ nhất làm một mình xong một công việc trong {n} ngày, người thứ hai làm một mình xong trong {n} ngày.', 'Working alone, the first person finishes a job in {1} days and the second person in {2} days.'),
  rule('Hỏi một ngày cả hai người cùng làm được mấy phần công việc?', 'Working together, what fraction of the job do they finish in one day?'),
  rule('Mỗi {t} có {n} chân.', 'Each {1s} has {2} legs.'), rule('Hỏi {n} {t} có bao nhiêu chân?', 'How many legs do {1q2} have?'),

  // --- Bổ sung (vòng 3): lớp 1 và các mẫu còn lại ---
  rule('{n} giờ trước là mấy giờ?', 'What time was it {1} hours ago?'),
  rule('Lúc {n} giờ đúng, kim dài của đồng hồ chỉ số mấy?', "At exactly {1} o'clock, which number does the minute hand point to?"),
  rule('Hỏi {name} xong lúc mấy giờ?', 'What time does {1} finish?'), rule('Hỏi {name} làm bài trong bao nhiêu phút?', 'How many minutes does {1} spend on the task?'),
  rule('Hôm nay là thứ {w}.', 'Today is {1}.'), rule('Hôm nay là chủ nhật.', 'Today is Sunday.'), rule('Hôm qua là ngày nào?', 'What day was yesterday?'),
  rule('Ngày mai là ngày nào?', 'What day is tomorrow?'), rule('Hỏi {n} ngày nữa là ngày nào?', 'What day will it be in {1} days?'),
  rule('Trong một tuần, thứ {w} là ngày {n}.', 'In one week, {1} is the {2}th.'), rule('Hỏi thứ {w} tuần đó là ngày bao nhiêu?', 'What date is {1} that week?'),
  rule('Tháng {n} có bao nhiêu ngày?', 'How many days are there in {1m}?'),
  rule('Vật nào ngắn hơn?', 'Which object is shorter?'), rule('Vật nào dài hơn?', 'Which object is longer?'),
  rule('Bút A dài {n} {u}, bút B dài {n} {u}.', 'Pen A is {1} {2} long and pen B is {3} {4} long.'),
  rule('Thước của {name} dài {n} {u}, thước của {name} dài {n} {u}.', "{1}'s ruler is {2} {3} long and {4}'s ruler is {5} {6} long."),
  rule('Đúng chọn Đ, sai chọn S.', 'Choose Đ if it is true and S if it is false.'), rule('(chỉ viết số)', '(write the number only)'),
  rule('Mỗi bạn được mấy {t}?', 'How many {1} does each pupil get?'), rule('Mỗi bạn được bao nhiêu {t}?', 'How many {1} does each pupil get?'),
  rule('Hộp thứ nhất có {n} {t}.', 'The first box has {1q2}.'), rule('Hộp thứ hai có mấy {t}?', 'How many {1} does the second box have?'),
  rule('Hộp thứ hai có nhiều hơn hộp thứ nhất {n} {t}.', 'The second box has {1q2} more than the first box.'),
  rule('Hộp thứ hai có ít hơn hộp thứ nhất {n} {t}.', 'The second box has {1q2} fewer than the first box.'),
  rule('Em lấy ra {n} {t}.', 'I take out {1q2}.'), rule('Hỏi trong hộp còn lại bao nhiêu {t}?', 'How many {1} are left in the box?'),
  rule('Trên bàn có {n} {t}.', 'There are {1q2} on the table.'), rule('Hỏi trên bàn có tất cả bao nhiêu {t}?', 'How many {1} are on the table altogether?'),
  rule('Hàng trên có {n} {t}, hàng dưới có {n} {t}.', 'The top row has {1q2} and the bottom row has {3q4}.'),
  rule('Viết phép tính để biết có tất cả mấy {t}.', 'Write a calculation to find how many {1} there are altogether.'),
  rule('Bạn nào có ít {t} nhất?', 'Who has the fewest {1}?'), rule('Bạn nào có nhiều {t} nhất?', 'Who has the most {1}?'),
  rule('Có mấy hàng có đúng {n} {t}?', 'How many rows have exactly {1q2}?'), rule('Chọn nhóm có đúng {n} {t}.', 'Choose the group with exactly {1q2}.'),
  rule('Chọn TẤT CẢ các số lớn hơn {n}.', 'Choose ALL the numbers greater than {1}.'), rule('Chọn TẤT CẢ các số bé hơn {n}.', 'Choose ALL the numbers less than {1}.'),
  rule('Hỏi {name} có mấy {t}?', 'How many {2} does {1} have?'), rule('Hỏi có mấy {t}?', 'How many {1} are there?'),
  rule('{name} đứng thứ {n} tính từ bên trái.', '{1} is number {2} from the left.'), rule('{name} đứng thứ {n} tính từ bên phải.', '{1} is number {2} from the right.'),
  rule('Có tất cả {n} quả gồm quả bóng xanh và quả bóng đỏ, trong đó có {n} quả bóng xanh.', 'There are {1} balls altogether, blue and red. {2} of them are blue.'),
  rule('Hỏi có bao nhiêu quả bóng đỏ?', 'How many red balls are there?'),
  rule('Cần mấy que tính để xếp {n} hình tam giác rời nhau (không chung cạnh)?', 'How many counting sticks are needed to make {1} separate triangles (with no shared sides)?'),
  rule('Viết số gồm {n} nghìn, {n} trăm, {n} chục, {n} đơn vị.', 'Write the number made up of {1} thousands, {2} hundreds, {3} tens and {4} ones.'),
  rule('Số gồm {n} trăm, {n} chục và {n} đơn vị là ?', 'The number made up of {1} hundreds, {2} tens and {3} ones is ?'),
  rule('Biểu đồ cột về môn học yêu thích của lớp {cls} có:', 'The bar chart of favourite subjects in class {1} shows:'),
  rule('Bảng số liệu – Số bạn tham gia câu lạc bộ:', 'Data table – Number of pupils in the club:'),
  rule('Bảng số liệu – Số sách quyên góp:', 'Data table – Number of books donated:'), rule('Bảng số liệu – Số cây trồng được:', 'Data table – Number of trees planted:'),
  rule('Số bông hoa điểm tốt:', 'Number of good-mark flowers:'),
  rule('lớp {cls} có {n}, lớp {cls} có {n}, lớp {cls} có {n}, lớp {cls} có {n}.', 'class {1} has {2}, class {3} has {4}, class {5} has {6}, class {7} has {8}.'),
  rule('Xếp các lớp theo số hoa từ nhiều đến ít.', 'Order the classes from the most flowers to the fewest.'),
  rule('Hình khai triển của hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u} có bao nhiêu hình chữ nhật kích thước {n} {u} × {n} {u}?', 'The net of a cuboid {1} {2} long, {3} {4} wide and {5} {6} high has how many rectangles measuring {7} {8} × {9} {10}?'),
  rule('Người ta làm một cái hộp không nắp hình hộp chữ nhật dài {n} {u}, rộng {n} {u}, cao {n} {u} bằng bìa.', 'An open box (without a lid) shaped like a cuboid, {1} {2} long, {3} {4} wide and {5} {6} high, is made of card.'),
  rule('Có tất cả bao nhiêu đoạn thẳng nối hai trong các điểm đó?', 'How many line segments join two of those points altogether?'),
  rule('Các bạn giơ tay, đếm được {n} ngón tay.', 'The children raise their hands and {1} fingers are counted.'), rule('Hỏi có mấy bàn tay?', 'How many hands are there?'),
  rule('Trong sân có {n} cái chân gà.', 'There are {1} chicken legs in the yard.'),
  rule('Thùng thứ nhất có {n} {t}, thùng thứ hai có nhiều hơn {n} {t}.', 'The first container has {1q2}. The second has {3q4} more.'),
  rule('Thùng thứ nhất có {n} {u} nước, thùng thứ hai có nhiều hơn {n} {u} nước.', 'The first tank has {1} {2} of water. The second has {3} {4} more.'),
  rule('Thùng thứ nhất có {n} kg thóc, thùng thứ hai có nhiều hơn {n} kg thóc.', 'The first bin has {1} kg of paddy. The second has {2} kg more.'),
  rule('Đội Một có {n} {t}, đội Hai có nhiều hơn {n} {t}.', 'Team One has {1q2}. Team Two has {3q4} more.'),
  rule('M là trung điểm của đoạn thẳng AB, AM = {n} {u}.', 'M is the midpoint of line segment AB, and AM = {1} {2}.'),
  rule('Hỏi đoạn thẳng AB dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is line segment AB?'),
  rule('Trong phép chia cho {n}, số dư lớn nhất có thể là bao nhiêu?', 'When dividing by {1}, what is the largest possible remainder?'),
  rule('Rót ra {n} cốc, mỗi cốc {n} ml.', '{1} cups are poured out, {2} ml in each cup.'), rule('Trong bình còn lại bao nhiêu mi-li-lít nước?', 'How many millilitres of water are left in the jug?'),
  rule('Một bình có {n} ml nước.', 'A jug holds {1} ml of water.'), rule('Một bình có {n} l nước.', 'A jug holds {1} l of water.'),
  rule('Tính diện tích hình vuông.', 'Find the area of the square.'), rule('Có bao nhiêu bạn chọn táo?', 'How many pupils chose apples?'),
  rule('Có bao nhiêu bạn chọn chuối?', 'How many pupils chose bananas?'), rule('Có bao nhiêu bạn chọn xoài?', 'How many pupils chose mangoes?'),
  rule('Viết số tự nhiên {n} dưới dạng phân số có mẫu số là {n}.', 'Write the whole number {1} as a fraction with denominator {2}.'),
  rule('Một hình lập phương có thể tích {n} {u}.', 'A cube has a volume of {1} {2}.'), rule('Cạnh hình lập phương dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is each edge of the cube?'),
  rule('Một hình lập phương có diện tích toàn phần {n} {u}.', 'A cube has a total surface area of {1} {2}.'), rule('Tính độ dài cạnh hình lập phương.', 'Find the edge length of the cube.'),
  rule('Đổi vận tốc:', 'Convert the speed:'), rule('Đổi đơn vị:', 'Convert the units:'),
  rule('Vòi thứ nhất chảy đầy bể cạn trong {n} giờ.', 'The first tap fills the empty tank in {1} hours.'),
  rule('Vòi thứ hai tháo hết nước của bể đầy trong {n} giờ.', 'The second tap empties the full tank in {1} hours.'),
  rule('Bể đang cạn, nếu mở cả hai vòi cùng lúc thì sau bao nhiêu giờ bể đầy?', 'The tank is empty. If both taps are opened at the same time, after how many hours will it be full?'),
  rule('Vòi thứ nhất mỗi giờ chảy được {n} bể, vòi thứ hai mỗi giờ chảy được {n} bể.', 'Each hour the first tap fills {1} of the tank and the second tap fills {2} of the tank.'),
  rule('Nếu mở cả hai vòi cùng lúc thì mỗi giờ chảy được bao nhiêu phần của bể?', 'If both taps are opened at the same time, what fraction of the tank do they fill each hour?'),
  rule('(viết phân số tối giản)', '(write the fraction in simplest form)'),
  rule('Tìm số lớn nhất có hai chữ số mà tổng các chữ số bằng {n}.', 'Find the largest 2-digit number whose digits add up to {1}.'),
  rule('Tìm số bé nhất có hai chữ số mà tổng các chữ số bằng {n}.', 'Find the smallest 2-digit number whose digits add up to {1}.'),
  rule('Tìm số bé nhất có ba chữ số mà tổng các chữ số bằng {n}.', 'Find the smallest 3-digit number whose digits add up to {1}.'),
  rule('Mỗi bàn tay có {n} ngón.', 'Each hand has {1} fingers.'), rule('Hỏi {n} bàn tay có bao nhiêu ngón?', 'How many fingers do {1} hands have?'),
  rule('Có {n} {t}, xếp mỗi hộp {n} {t}.', 'There are {1q2}, with {3q4} in each box.'),
  rule('Mỗi bạn có một chiếc cặp màu xanh.', 'Each pupil has a blue school bag.'),
  rule('Hình tròn có đường kính {n} {u}.', 'A circle has a diameter of {1} {2}.'), rule('Hình tròn có bán kính {n} {u}.', 'A circle has a radius of {1} {2}.'),
  rule('Bán kính của hình tròn dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is the radius of the circle?'),
  rule('Năm nay tổng số tuổi của hai bố con là {n} tuổi.', "This year Dad's and his child's ages add up to {1} years."),
  rule('Năm nay tổng số tuổi của hai mẹ con là {n} tuổi.', "This year Mum's and her child's ages add up to {1} years."),
  rule('Hỏi sau {n} năm nữa tổng số tuổi của hai bố con là bao nhiêu?', "In {1} years, what will Dad's and his child's ages add up to?"),
  rule('Hỏi sau {n} năm nữa tổng số tuổi của hai mẹ con là bao nhiêu?', "In {1} years, what will Mum's and her child's ages add up to?"),
  rule('Năm nay mẹ hơn con {n} tuổi.', 'This year Mum is {1} years older than her child.'), rule('Năm nay bố hơn con {n} tuổi.', 'This year Dad is {1} years older than his child.'),
  rule('Hỏi sau {n} năm nữa mẹ hơn con bao nhiêu tuổi?', 'In {1} years, how many years older than her child will Mum be?'),
  rule('Hỏi sau {n} năm nữa bố hơn con bao nhiêu tuổi?', 'In {1} years, how many years older than his child will Dad be?'),
  rule('Năm nay tuổi mẹ gấp {n} lần tuổi con, mẹ hơn con {n} tuổi.', "This year Mum's age is {1} times her child's age, and Mum is {2} years older than the child."),
  rule('Số thập phân gồm {n} đơn vị, {n} phần mười viết là:', 'The decimal made up of {1} ones and {2} tenths is written as:'),
  rule('Số thập phân {n} có phần nguyên là bao nhiêu, phần thập phân gồm những chữ số nào (viết liền)?', 'In the decimal {1}, what is the whole-number part, and which digits make up the decimal part (write them together)?'),
  rule('Có {n} chiếc đũa xếp thành từng đôi.', '{1} chopsticks are put into pairs.'), rule('Hỏi có mấy đôi đũa?', 'How many pairs of chopsticks are there?'),
  rule('Số {n} viết bằng chữ số La Mã là:', 'The number {1} in Roman numerals is:'), rule('Góc có số đo {n}° là:', 'An angle of {1}° is:'),
  rule('Môn {s} hơn môn {s} bao nhiêu bạn chọn?', 'How many more pupils chose {1} than {2}?'),
  rule('Hai bên một con đường dài {n} {u}, người ta trồng cây ở cả hai bên, cứ {n} {u} một cây và ở cả hai đầu đường đều có cây.', 'Trees are planted on both sides of a road {1} {2} long, one tree every {3} {4}, with trees at both ends of the road.'),
  rule('Hỏi cần tất cả bao nhiêu cây?', 'How many trees are needed altogether?'),
  rule('Một cuộc thi có {n} câu hỏi.', 'A quiz has {1} questions.'),
  rule('Mỗi câu trả lời đúng được {n} điểm, mỗi câu trả lời sai bị trừ {n} điểm.', 'Each correct answer scores {1} points and each wrong answer loses {2} points.'),
  rule('{name} ném bóng vào rổ {n} lần, ném trúng {n} lần.', '{1} throws a ball at the basket {2} times and scores {3} times.'),
  rule('{name} ném {n} lần, trúng {n} lần.', '{1} throws {2} times and scores {3} times.'),
  rule('Ba người cùng làm một công việc.', 'Three people do a job together.'),
  rule('Nếu làm một mình, người thứ nhất mất {n} ngày, người thứ hai mất {n} ngày, người thứ ba mất {n} ngày.', 'Working alone, the first person takes {1} days, the second {2} days and the third {3} days.'),
  rule('Hỏi cả ba người cùng làm thì mất bao nhiêu ngày?', 'How many days do the three people take working together?'),
  rule('Các bạn chia đều {n} {t} cho {n} bạn.', 'The children share {1q2} equally among {3} pupils.'),
  rule('Tính:', 'Calculate:'), rule('Tính nhanh', 'Calculate quickly'),

  // --- Bổ sung (vòng 4) ---
  rule('Hỏi {who} có tất cả bao nhiêu {t}?', 'How many {2} do {1} have altogether?'), rule('Hỏi {who} còn lại bao nhiêu {t}?', 'How many {2} do {1} have left?'),
  rule('{who} có {n} {t}, nhận thêm {n} {t}.', '{1} has {2q3} and receives {4q5} more.'), rule('{who} có {n} {t}, đã dùng {n} {t}.', '{1} has {2q3} and has used {4q5}.'),
  rule('{who} có {n} {t}, đã bán {n} {t}.', '{1} has {2q3} and has sold {4q5}.'), rule('{who} có {n} {t}, cho bạn {n} {t}.', '{1} has {2q3} and gives a friend {4q5}.'),
  rule('Mẹ cho {name} thêm {n} {t}.', 'Mum gives {1} {2} more {3}.'), rule('{name} cho bạn {n} {t}.', '{1} gives a friend {2q3}.'),
  rule('{name} có {n} {t}, {name} cho em {n} số bi.', '{1} has {2q3} and gives {5} of the marbles to a younger sibling.'),
  rule('Hỏi {name} cho em bao nhiêu {t}?', 'How many {2} does {1} give to the younger sibling?'),
  rule('{name} có {n} {t}, {name} cho em {n} cái.', '{1} has {2q3} and gives {5} to a younger sibling.'), rule('{name} còn lại mấy {t}?', 'How many {2} does {1} have left?'),
  rule('Tháng Một bán được {n} {t}, tháng Hai bán được nhiều hơn tháng Một {n} {t}.', 'In January {1q2} were sold. In February {3q4} more were sold than in January.'),
  rule('{name} cân nặng {n} kg.', '{1} weighs {2} kg.'), rule('Tổ của {name} có {n} bạn nam và {n} bạn nữ.', "{1}'s group has {2} boys and {3} girls."),
  rule('{name} bắt đầu làm bài lúc {n} giờ và làm xong lúc {n} giờ {n} phút.', '{1} starts the task at {2}:00 and finishes at {3}:{4z}.'),
  rule('{name} bắt đầu làm bài lúc {n} giờ {n} phút và làm xong lúc {n} giờ {n} phút.', '{1} starts the task at {2}:{3z} and finishes at {4}:{5z}.'),
  rule('Một xe máy đi từ A lúc {n} giờ {n} phút và đến B lúc {n} giờ {n} phút.', 'A motorbike leaves A at {1}:{2z} and arrives at B at {3}:{4z}.'),
  rule('Một xe máy đi từ A lúc {n} giờ {n} phút và đến B lúc {n} giờ.', 'A motorbike leaves A at {1}:{2z} and arrives at B at {3}:00.'),
  rule('Một ô tô đi từ A lúc {n} giờ với vận tốc {n} {u}.', 'A car leaves A at {1}:00 at a speed of {2} {3}.'),
  rule('{n} giờ {n} phút + {n} giờ {n} phút = ?', '{1} h {2} min + {3} h {4} min = ?'), rule('{n} giờ {n} phút − {n} giờ {n} phút = ?', '{1} h {2} min − {3} h {4} min = ?'),
  rule('Hiện nay mẹ hơn con {n} tuổi.', 'Mum is now {1} years older than her child.'), rule('Hiện nay bố hơn con {n} tuổi.', 'Dad is now {1} years older than his child.'),
  rule('Sau {n} năm nữa tuổi mẹ gấp {n} lần tuổi con.', "In {1} years, Mum's age will be {2} times her child's age."),
  rule('Sau {n} năm nữa tuổi bố gấp {n} lần tuổi con.', "In {1} years, Dad's age will be {2} times his child's age."),
  rule('Sau {n} năm nữa tổng số tuổi của hai bố con là {n} tuổi.', "In {1} years, Dad's and his child's ages will add up to {2} years."),
  rule('Biết bố hơn con {n} tuổi.', 'Dad is {1} years older than his child.'),
  rule('Năm nay tuổi bố gấp {n} lần tuổi con, bố hơn con {n} tuổi.', "This year Dad's age is {1} times his child's age, and Dad is {2} years older than the child."),
  rule('Hai đường thẳng {L}O và {L}O vuông góc với nhau tại O.', 'Lines {1}O and {2}O are perpendicular at O.'),
  rule('Tia O{L} nằm giữa hai tia đó, góc {L}O{L} = {n}°.', 'Ray O{1} lies between those two rays, and angle {2}O{3} = {4}°.'),
  rule('Góc {L}O{L} có số đo bao nhiêu độ?', 'How many degrees does angle {1}O{2} measure?'),
  rule('Lúc {n} giờ đúng, kim giờ và kim phút tạo thành góc gì?', "At exactly {1} o'clock, what kind of angle do the hour hand and the minute hand make?"),
  rule('Lúc {n} giờ, kim giờ và kim phút tạo thành góc vuông hay không?', "At {1} o'clock, do the hour hand and the minute hand make a right angle?"),
  rule('Trong số {n}, chữ số ở hàng {p} thuộc lớp nào?', 'In the number {1}, which period does the digit in the {2} place belong to?'),
  rule('Số thập phân {n} bằng phân số tối giản nào?', 'Which fraction in simplest form is equal to the decimal {1}?'),
  rule('Bãi xe có {n} chiếc gồm ô tô và xe máy, đếm được tất cả {n} bánh xe.', 'A car park has {1} cars and motorbikes, with {2} wheels altogether.'),
  rule('Hỏi có bao nhiêu chiếc xe máy?', 'How many motorbikes are there?'), rule('Hỏi có bao nhiêu chiếc ô tô?', 'How many cars are there?'),
  rule('Một hình vuông cạnh {n} {u} có một hình tròn nằm bên trong, tiếp xúc với bốn cạnh (đường kính bằng cạnh hình vuông).', 'A square with sides of {1} {2} has a circle inside it touching all four sides (the diameter equals the side of the square).'),
  rule('Tính diện tích phần hình vuông nằm ngoài hình tròn.', 'Find the area of the part of the square outside the circle.'), rule('Tính diện tích hình vuông đó.', 'Find the area of that square.'),
  rule('Đội A làm một mình xong một đoạn đường trong {n} ngày, đội B làm một mình xong trong {n} ngày.', 'Working alone, team A finishes a stretch of road in {1} days and team B in {2} days.'),
  rule('Đội A làm một mình xong một công việc trong {n} ngày, đội B làm một mình xong trong {n} ngày.', 'Working alone, team A finishes a job in {1} days and team B in {2} days.'),
  rule('Nếu hai đội cùng làm thì sau bao nhiêu ngày xong đoạn đường?', 'If both teams work together, after how many days will the road be finished?'),
  rule('Nếu hai đội cùng làm thì sau bao nhiêu ngày xong công việc?', 'If both teams work together, after how many days will the job be finished?'),
  rule('Hai đội cùng làm {n} ngày thì đội A chuyển đi làm việc khác, đội B làm tiếp phần còn lại.', 'The two teams work together for {1} days, then team A moves to other work and team B finishes the rest.'),
  rule('Hỏi đội B phải làm thêm bao nhiêu ngày nữa?', 'How many more days must team B work?'), rule('Ba đội cùng làm một đoạn đường.', 'Three teams build a stretch of road together.'),
  rule('Nếu làm riêng, đội {n} mất {n} ngày, đội {n} mất {n} ngày, đội {n} mất {n} ngày.', 'Working separately, team {1} takes {2} days, team {3} takes {4} days and team {5} takes {6} days.'),
  rule('Cả ba đội làm chung {n} ngày thì đội {n} chuyển đi làm việc khác, hai đội còn lại làm tiếp đến khi xong.', 'All three teams work together for {1} days, then team {2} moves to other work and the other two teams carry on until it is finished.'),
  rule('Hỏi hai đội còn lại phải làm thêm bao nhiêu ngày?', 'How many more days must the other two teams work?'),
  rule('Viết phép nhân thích hợp.', 'Write the correct multiplication.'), rule('Viết phép chia thích hợp.', 'Write the correct division.'),
  rule('Đổi một tờ {n} đồng được bao nhiêu tờ {n} đồng?', 'How many {2}-dong notes can you get for one {1}-dong note?'),
  rule('Hai bạn học cùng lớp {cls}.', 'The two children are in the same class, {1}.'),
  rule('Buổi trưa ở {name} là {n} °C, ở {name} là {n} °C.', 'At noon it is {2} °C in {1} and {4} °C in {3}.'),
  rule('{name} nóng hơn {name} bao nhiêu độ C?', 'How many degrees Celsius warmer is {1} than {2}?'),
  rule('Có {n} khối lập phương.', 'There are {1} cubes.'), rule('Người ta sơn tất cả các mặt của mỗi khối.', 'All the faces of each cube are painted.'),
  rule('Hỏi đã sơn tất cả bao nhiêu mặt?', 'How many faces are painted altogether?'),
  rule('Người ta trồng cây {k} dọc bờ kênh dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu là hai cột điện nên không trồng cây.', '{1} are planted along a canal bank {2} {3} long, one every {4} {5}. There are electricity poles at both ends, so no trees are planted there.'),
  rule('Người ta trồng cây {k} dọc lối vào trường dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu là hai cột điện nên không trồng cây.', '{1} are planted along a school entrance path {2} {3} long, one every {4} {5}. There are electricity poles at both ends, so no trees are planted there.'),
  rule('Người ta trồng cây {k} dọc một bên đường dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu là hai cột điện nên không trồng cây.', '{1} are planted along one side of a road {2} {3} long, one every {4} {5}. There are electricity poles at both ends, so no trees are planted there.'),
  rule('Người ta trồng cây {k} dọc bờ kênh dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu đều có cây.', '{1} are planted along a canal bank {2} {3} long, one every {4} {5}, with trees at both ends.'),
  rule('Người ta trồng cây {k} dọc lối vào trường dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu đều có cây.', '{1} are planted along a school entrance path {2} {3} long, one every {4} {5}, with trees at both ends.'),
  rule('Người ta trồng cây {k} dọc một bên đường dài {n} {u}, cứ {n} {u} trồng một cây, hai đầu đều có cây.', '{1} are planted along one side of a road {2} {3} long, one every {4} {5}, with trees at both ends.'),
  rule('Người ta trồng cây {k} dọc bờ kênh dài {n} {u}, cứ {n} {u} trồng một cây, một đầu giáp tường rào nên không trồng, đầu kia có cây.', '{1} are planted along a canal bank {2} {3} long, one every {4} {5}. One end meets a fence, so there is no tree there; the other end has a tree.'),
  rule('Người ta trồng cây {k} dọc lối vào trường dài {n} {u}, cứ {n} {u} trồng một cây, một đầu giáp tường rào nên không trồng, đầu kia có cây.', '{1} are planted along a school entrance path {2} {3} long, one every {4} {5}. One end meets a fence, so there is no tree there; the other end has a tree.'),
  rule('Người ta trồng cây {k} dọc một bên đường dài {n} {u}, cứ {n} {u} trồng một cây, một đầu giáp tường rào nên không trồng, đầu kia có cây.', '{1} are planted along one side of a road {2} {3} long, one every {4} {5}. One end meets a fence, so there is no tree there; the other end has a tree.'),
  rule('Viết liền các số tự nhiên bắt đầu từ {n} thành một dãy chữ số: {n} rồi viết tiếp {e} (không có dấu cách).', 'Write the whole numbers from {1} one after another as a string of digits: {2}, then {3} (with no spaces).'),
  rule('Hỏi chữ số thứ {n} của dãy là chữ số nào?', 'What is digit number {1} in the string?'),
  rule('Con vật nào đi ngay trước {t}?', 'Which animal is just in front of the {1s}?'), rule('Con vật nào đi ngay sau {t}?', 'Which animal is just behind the {1s}?'),
  rule('Các con vật xếp hàng đi về phía mũi tên ➡️.', 'The animals walk in a line towards the arrow ➡️.'),
  rule('Tìm số tự nhiên x, biết: {e}', 'Find the whole number x, given: {1}'), rule('Tính: S = {e}', 'Calculate: S = {1}'),
  rule('Số gồm {n} chục và {n} đơn vị là ?', 'The number made up of {1} tens and {2} ones is ?'),
  rule('Trong phép tính {e}, số {n} gọi là gì?', 'In the calculation {1}, what is the number {2} called?'),
  rule('Trong phép nhân {e}, số {n} gọi là gì?', 'In the multiplication {1}, what is the number {2} called?'),
  rule('Trong phép cộng {e}, số {n} gọi là gì?', 'In the addition {1}, what is the number {2} called?'),
  rule('Trong phép trừ {e}, số {n} gọi là gì?', 'In the subtraction {1}, what is the number {2} called?'),
  rule('{name} cao hơn {name} {n} {u}.', '{1} is {3} {4} taller than {2}.'), rule('{name} thấp hơn {name} {n} {u}.', '{1} is {3} {4} shorter than {2}.'),
  rule('{name} nặng hơn {name} {n} {u}.', '{1} is {3} {4} heavier than {2}.'), rule('{name} nhẹ hơn {name} {n} {u}.', '{1} is {3} {4} lighter than {2}.'),
  rule('{name} có nhiều hơn {name} {n} {t}.', '{1} has {3} more {4} than {2}.'), rule('{name} có ít hơn {name} {n} {t}.', '{1} has {3} fewer {4} than {2}.'),
  rule('{name} có {n} hộp, mỗi hộp {n} {t}, và thêm {n} {t} để ngoài.', '{1} has {2} boxes with {3q4} in each box, plus {5q6} outside the boxes.'),
  rule('Xếp các khối lập phương nhỏ thành {n} tầng, mỗi tầng {n} hàng, mỗi hàng {n} khối.', 'Small cubes are stacked in {1} layers, with {2} rows in each layer and {3} cubes in each row.'),
  rule('Có tất cả bao nhiêu khối lập phương nhỏ?', 'How many small cubes are there altogether?'),
  rule('{name} bắt đầu đọc sách lúc {n} giờ {n} phút và đọc xong lúc {n} giờ {n} phút.', '{1} starts reading at {2}:{3z} and finishes at {4}:{5z}.'),
  rule('{name} đọc sách trong bao nhiêu phút?', 'How many minutes does {1} spend reading?'),
  rule('{name} bắt đầu làm bài lúc {n} giờ và làm xong lúc {n} giờ.', '{1} starts the task at {2}:00 and finishes at {3}:00.'),
  rule('{name} bắt đầu làm bài lúc {n} giờ {n} phút và làm xong lúc {n} giờ.', '{1} starts the task at {2}:{3z} and finishes at {4}:00.'),
  rule('Hai tờ tiền nào cộng lại được {n} đồng?', 'Which two banknotes add up to {1} dong?'),
  rule('Lớp {cls} hơn lớp {cls} bao nhiêu bạn?', 'How many more pupils does class {1} have than class {2}?'),
  rule('Lớp {cls} hơn lớp {cls} bao nhiêu cây?', 'How many more trees did class {1} plant than class {2}?'),
  rule('Lớp {cls} hơn lớp {cls} bao nhiêu quyển?', 'How many more books did class {1} donate than class {2}?'),
  rule('{name} và {name} có tất cả {n} {t}.', '{1} and {2} have {3q4} altogether.'), rule('{name} có nhiều hơn {name} {n} viên.', '{1} has {3} more marbles than {2}.'),
  rule('{n} thế kỉ = ? năm', '{1} centuries = ? years'), rule('Lớp {cls} và lớp {cls} cùng tham gia trồng.', 'Class {1} and class {2} take part in the planting together.'),
  rule('Mỗi hố trồng cây sâu {n} dm.', 'Each planting hole is {1} dm deep.'), rule('Hỏi có bao nhiêu cây bàng?', 'How many tropical almond trees are there?'),
  rule('Nhiệt độ cùng một buổi trưa: {name} {n} °C, {name} {n} °C, {name} {n} °C.', 'Temperatures at noon on the same day: {1} {2} °C, {3} {4} °C, {5} {6} °C.'),
  rule('Nhiệt độ cùng một buổi trưa: {name} {n} °C, {name} {n} °C, {name} {n} °C, {name} {n} °C.', 'Temperatures at noon on the same day: {1} {2} °C, {3} {4} °C, {5} {6} °C, {7} {8} °C.'),
  rule('Em đo bằng gang tay: {e} dài {n} gang tay, {e} dài {n} gang tay.', 'I measure with hand spans: {1} is {2} spans long and {3} is {4} spans long.'),
  rule('{name} chia đều {n} {t} cho hai bạn, hai bạn được số {x} bằng nhau.', '{1} shares {2q3} equally between two friends, so each friend gets the same number.'),
  rule('Ngày nào {name} KHÔNG {a}?', 'On which day does {1} NOT {2}?'),
  rule('Em đo bằng gang tay: {t} dài {n} gang tay, {t} dài {n} gang tay.', 'I measure with hand spans: the {1s} is {2} spans long and the {3s} is {4} spans long.'),
  rule('Em đo bằng sải tay: {t} dài {n} sải tay, {t} dài {n} sải tay.', 'I measure with arm spans: the {1s} is {2} spans long and the {3s} is {4} spans long.'),
  rule('Băng giấy {c} dài {n} {u}, băng giấy {c} dài {n} {u}.', 'The {1} paper strip is {2} {3} long and the {4} paper strip is {5} {6} long.'),
  rule('Sợi dây {c} dài {n} {u}, sợi dây {c} dài {n} {u}.', 'The {1} string is {2} {3} long and the {4} string is {5} {6} long.'),
  rule('Băng giấy nào ngắn nhất?', 'Which paper strip is the shortest?'), rule('Băng giấy nào dài nhất?', 'Which paper strip is the longest?'),
  rule('Sợi dây nào ngắn hơn?', 'Which string is shorter?'), rule('Sợi dây nào dài hơn?', 'Which string is longer?'),
  rule('Có tất cả {n} bông gồm bông hoa {c} và bông hoa {c}, trong đó có {n} bông hoa {c}.', 'There are {1} flowers altogether, {2} and {3}. {4} of them are {5}.'),
  rule('Hỏi có bao nhiêu bông hoa {c}?', 'How many {1} flowers are there?'),
  rule('Buổi sáng, {name} bắt đầu đi dã ngoại lúc {n} giờ và đi trong {n} giờ.', "In the morning, {1} sets off on a picnic at {2} o'clock and is out for {3} hours."),
  rule('Hỏi {n} ngày trước là ngày nào?', 'What day was it {1} days ago?'),
  rule('Trong một hàng, đứng trước {name} có {n} bạn, đứng sau {name} có {n} bạn.', 'In a line, there are {2} children in front of {1} and {4} children behind {3}.'),
  rule('{name} đứng thứ {n} tính từ bên trái, thứ {n} tính từ bên phải.', '{1} is number {2} from the left and number {3} from the right.'),
  rule('Hỏi bên phải {name} có mấy bạn?', 'How many children are to the right of {1}?'), rule('Hỏi bên trái {name} có mấy bạn?', 'How many children are to the left of {1}?'),
  rule('Hỏi {name} đứng thứ mấy tính từ bên phải?', 'What position is {1} from the right?'), rule('Hỏi {name} đứng thứ mấy tính từ bên trái?', 'What position is {1} from the left?'),
  rule('Năm nay {name} {n} tuổi, chị của {name} {n} tuổi.', "This year {1} is {2} years old and {3}'s older sister is {4} years old."),
  rule('Năm nay {name} {n} tuổi, anh của {name} {n} tuổi.', "This year {1} is {2} years old and {3}'s older brother is {4} years old."),
  rule('Có mấy {t}?', 'How many {1} are there?'), rule('Số còn thiếu là số mấy?', 'What is the missing number?'), rule('Số tiếp theo là số mấy?', 'What is the next number?'),
  rule('Đếm tiếp:', 'Keep counting:'), rule('Tìm số còn thiếu:', 'Find the missing number:'), rule('Phép tính đúng là:', 'The correct calculation is:'),
  rule('{name} có {n} {t}, xếp vào hai hộp.', '{1} has {2q3} and puts them into two boxes.'),
  rule('{name} xếp theo cách nào thì đủ que?', 'Which way of arranging them uses exactly the sticks {1} has?'),
  rule('Cần mấy que tính để xếp {n} hình vuông rời nhau (không chung cạnh)?', 'How many counting sticks are needed to make {1} separate squares (with no shared sides)?'),
  rule('{name} đặt thêm {n} {t}.', '{1} puts down {2} more {3}.'), rule('{name} lấy ra {n} {t}.', '{1} takes out {2q3}.'),
  rule('Số gồm {n} chục và {n} đơn vị là số nào?', 'Which number is made up of {1} tens and {2} ones?'), rule('Số {n} gồm mấy chục?', 'How many tens are there in {1}?'),
  rule('Bút mực dài hơn bút chì.', 'The pen is longer than the pencil.'),
  rule('Số đó là:', 'That number is:'), rule('Số lớn:', 'The larger number:'), rule('Số bé:', 'The smaller number:'), rule('Số thứ nhất:', 'The first number:'), rule('Số thứ hai:', 'The second number:'),
  rule('Kho A có {n} {t}, kho B có nhiều hơn {n} {t}.', 'Warehouse A has {1q2}. Warehouse B has {3q4} more.'),
  rule('Nhà máy làm được {n} {t}, đã chuyển đi {n} {t}.', 'A factory makes {1q2} and has sent out {3q4}.'),
  rule('"{n} xăng-ti-mét vuông" viết là:', '"{1} square centimetres" is written as:'), rule('"{n} mét vuông" viết là:', '"{1} square metres" is written as:'),
  rule('Một cây gỗ dài {n} {u} được cưa thành các đoạn dài {n} {u}.', 'A log {1} {2} long is sawn into pieces {3} {4} long.'), rule('Mỗi lần cưa mất {n} phút.', 'Each cut takes {1} minutes.'),
  rule('Hỏi cưa xong cây gỗ mất bao nhiêu phút?', 'How many minutes does it take to saw the whole log?'),
  rule('Trong phép chia {e}, số {n} gọi là gì?', 'In the division {1}, what is the number {2} called?'),
  rule('Hình tròn tâm O có bán kính {n} {u}.', 'A circle with centre O has a radius of {1} {2}.'),
  rule('Đường kính của hình tròn dài bao nhiêu xăng-ti-mét?', 'How many centimetres long is the diameter of the circle?'),
  rule('Hai đường thẳng HO và KO vuông góc với nhau tại O.', 'Lines HO and KO are perpendicular at O.'),
  rule('Tia OI nằm giữa hai tia đó, góc HOI = {n}°.', 'Ray OI lies between those two rays, and angle HOI = {1}°.'), rule('Góc IOK có số đo bao nhiêu độ?', 'How many degrees does angle IOK measure?'),
  rule('Một đoàn tham quan mua {n} vé gồm vé người lớn và vé trẻ em, hết tất cả {n} nghìn đồng.', 'A tour group buys {1} adult and child tickets for {2} thousand dong altogether.'),
  rule('Một xe khách khởi hành lúc {n} giờ, đi hết {n} giờ {n} phút.', "A coach leaves at {1} o'clock and the journey takes {2} hours {3} minutes."),
  rule('Có {n} quyển vở chia đều cho {n} lớp.', '{1} notebooks are shared equally among {2} classes.'),
  rule('Đáp số: {e} {t}', 'Answer: {1} {2}'), rule('Đáp số: {e} {u}', 'Answer: {1} {2}'),
];

/** Câu chỉ có số, dấu phép tính, ô trống, đơn vị — giữ nguyên (đổi số sang kiểu Anh). */
const MATH_ONLY = new RegExp(String.raw`^(?:${NUM_SRC}|km\/giờ|m\/phút|m\/giây|dm²|cm²|m²|cm³|dm³|m³|[\s+\-−–×x*:÷=<>?…_□.,;()/%²³°]|\.\.\.|cm|mm|dm|km|kg|ml|ha|m|g|l|[a-dmnxySP])+$`, 'u');
const UNIT_ONLY = new RegExp(`^(?:${UNIT_ALT})\\.?$`, 'u');

// Sửa hoà hợp chủ ngữ – động từ sau khi điền chỗ trống (1 bird are → 1 bird is; I has → I have…)
const SINGULAR_WHO = String.raw`(?:the factory|the library|the farm|the warehouse|the school|Mum|Dad|Grandpa|Grandma|the older brother|the older sister|the teacher|the child|the shop|a shop|that person|the car|the vehicle|Uncle An|the whole class|${NAME_ALT})`;
const POSTFIX: [RegExp, string][] = [
  [/\bThere are 1 /g, 'There is 1 '],
  [/^1 ((?:more )?[a-z ]+?) are\b/, '1 $1 is'],
  [/^1 ((?:more )?[a-z ]+?) fly\b/, '1 $1 flies'], [/^1 ((?:more )?[a-z ]+?) go\b/, '1 $1 goes'],
  [/^1 ((?:more )?[a-z ]+?) (swim|run|come|get|burst|drive)\b/, '1 $1 $2s'],
  [/^I has\b/, 'I have'], [/^(Both children|Both of them|All three children) has\b/, '$1 have'],
  [new RegExp(String.raw`\bdo (${SINGULAR_WHO}) have\b`, 'g'), 'does $1 have'],
  [/\bdoes (the whole class|Mum|Dad|[A-Z][a-zà-ỹ]+) have altogether\?/g, 'does $1 have?'],
];
const SINGULAR: Record<string, string> = Object.fromEntries([
  ...Object.values(NOUNS), ...Object.values(UNITS),
  ['ten thousand', 'ten thousands'], ['hundred thousand', 'hundred thousands'], ['thousand', 'thousands'], ['hundred', 'hundreds'], ['ten', 'tens'],
  ['one', 'ones'], ['tenth', 'tenths'], ['hundredth', 'hundredths'], ['thousandth', 'thousandths'], ['million', 'millions'], ['digit', 'digits'],
  ['century', 'centuries'], ['row', 'rows'], ['layer', 'layers'], ['cube', 'cubes'], ['leg', 'legs'], ['adult ticket', 'adult tickets'], ['head', 'heads'], ['finger', 'fingers'], ['hand', 'hands'],
].filter(([sg, pl]) => sg !== pl).map(([sg, pl]) => [pl, sg]));
const PLURAL_ALT = alt(Object.keys(SINGULAR));
const ONE_PLURAL = new RegExp(String.raw`(^|[^\d.,/:])1 (more |small |big |red |blue )?(${PLURAL_ALT})(?![\p{L}-])`, 'gu');
const postfix = (t: string) => POSTFIX.reduce((acc, [re, to]) => acc.replace(re, to),
  t.replace(ONE_PLURAL, (_, pre: string, adj = '', w: string) => `${pre}1 ${adj}${SINGULAR[w] ?? w}`));

// Mục trong bảng số liệu / danh sách ("Lớp 4A: 25 bạn; Lớp 4B: 30 bạn", "Thứ Hai: 12")
const WEEKDAY: Record<string, string> = { 'thứ hai': 'Monday', 'thứ ba': 'Tuesday', 'thứ tư': 'Wednesday', 'thứ năm': 'Thursday', 'thứ sáu': 'Friday', 'thứ bảy': 'Saturday', 'chủ nhật': 'Sunday' };
const SUBJECT = SUBJ;
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
const LABEL_RE = new RegExp(String.raw`^(?:(lớp)\s+(\d+[A-E])|(${alt(Object.keys(WEEKDAY))})|cột\s+(${alt(Object.keys(SUBJECT))})|(${alt(Object.keys(SUBJECT))})|(${NAME_ALT}))\s*:\s*(.*)$`, 'iu');
function translateItem(item: string): string | null {
  const t = item.trim().replace(/\.$/, '');
  if (!t) return '';
  if (MATH_ONLY.test(t)) return numsToEn(t);
  const m = LABEL_RE.exec(t);
  if (!m) { const q = new RegExp(String.raw`^(${NUM_SRC}|\?)\s+(${NOUN_ALT}|${UNIT_ALT}|${alt(Object.keys(ANSWER_WORDS))})$`, 'u').exec(t); return q ? qty(q[1], q[2]) : null; }
  const label = m[2] ? `Class ${m[2].toUpperCase()}` : m[3] ? WEEKDAY[m[3].toLowerCase()] : m[4] ? `${cap(SUBJECT[m[4].toLowerCase()])} column` : m[5] ? cap(SUBJECT[m[5].toLowerCase()]) : m[6];
  const v = translateItem(m[7]);
  return v === null ? null : `${label}: ${v}`;
}
function qty(n: string, w: string): string {
  const one = n !== '?' && isOne(n);
  const pair = NOUNS[w] ?? UNITS[w] ?? ANSWER_WORDS[w];
  return `${n === '?' ? '?' : enNum(n)} ${pair ? pair[one ? 0 : 1] : w}`;
}

function byRules(t: string): string | null {
  for (const r of RULES) {
    const m = r.re.exec(t);
    if (m) { const out = fill(r, m); if (out !== null) return postfix(out.charAt(0).toUpperCase() + out.slice(1)); }
  }
  return null;
}

const BAN_NAME = new RegExp(`(^|\\s)[Bb]ạn (${NAME_ALT})(?![\\p{L}])`, 'gu');
function translateSentence(s: string): string | null {
  const t = s.trim().replace(BAN_NAME, '$1$2');
  if (!t) return '';
  if (MATH_ONLY.test(t)) return numsToEn(t);
  if (UNIT_ONLY.test(t)) return unit(t.replace(/\.$/, ''))[1];
  const whole = byRules(t);
  if (whole !== null) return whole;
  // "Câu lệnh: phần sau" — dịch câu lệnh, phần sau là phép tính / danh sách số liệu
  const colon = t.search(/:\s/);
  if (colon > 0) {
    const head = byRules(t.slice(0, colon + 1));
    const tail = t.slice(colon + 1).trim();
    if (head !== null) {
      const rest = MATH_ONLY.test(tail) ? numsToEn(tail) : translateList(tail) ?? translateSentence(tail);
      if (rest !== null) return `${head} ${rest}`;
    }
  }
  return translateList(t) ?? (/^(?:\?|…|\.\.\.)\s/.test(t) ? translateItem(t.replace(/^(?:…|\.\.\.)/, '?')) : null);
}

/** Danh sách cách nhau bằng ";" (bảng số liệu). */
function translateList(t: string): string | null {
  const commaItems = t.replace(/\.$/, '').split(/,\s+/);
  if (commaItems.length > 1 && !t.includes(';')) {
    const qs = commaItems.map((x) => (/^\S/.test(x) && !MATH_ONLY.test(x) ? translateItem(x) : null));
    if (qs.every((x) => x)) return qs.join(', ') + (/\.$/.test(t) ? '.' : '');
  }
  if (!t.includes(';') && !LABEL_RE.test(t)) return null;
  const parts = t.split(/;\s*/).map(translateItem);
  if (parts.some((x) => x === null)) return null;
  return parts.filter(Boolean).join('; ') + (/\.$/.test(t) ? '.' : '');
}

/** Tách đề thành câu: sau . ? ! (khi theo sau là chữ hoa hoặc hết dòng) và theo dòng. Không tách số thập phân, dấu chia. */
export function splitSentences(prompt: string): string[] {
  return prompt.split(/\n+/).flatMap((line) => line.split(/(?<=[.?!])\s+(?=[A-ZÀ-ỸĐ(\d"“])/u)).map((x) => x.trim()).filter(Boolean);
}

/** Dịch cả đề; trả null nếu có câu chưa có quy tắc (không bao giờ trả nửa Việt nửa Anh). */
export function translateMathPrompt(prompt: string): string | null {
  const lines: string[] = [];
  for (const line of prompt.split(/\n+/)) {
    const out: string[] = [];
    for (const s of splitSentences(line)) {
      const e = translateSentence(s);
      if (e === null) return null;
      if (e) out.push(e);
    }
    if (out.length) lines.push(out.join(' '));
  }
  return lines.length ? lines.join('\n') : null;
}

/** Cho script kiểm tra: dịch từng câu (null = chưa có quy tắc). */
export const translateSentenceForCheck = translateSentence;
