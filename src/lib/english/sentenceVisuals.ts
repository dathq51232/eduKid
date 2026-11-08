import type { CommunicationQuestion } from './communicationBank';

export type VocabChip = {
  icon: string; // tên file trong /emoji/f3d/<icon>.webp
  en: string;
  vi: string;
};

export type SceneVisual = {
  theme: 'morning' | 'school' | 'play' | 'meal' | 'home' | 'night' | 'health' | 'nature' | 'safety';
  themeLabel: string;
  actionMainIcon: string;
  actionSubIcon?: string;
  purposeMainIcon: string;
  purposeSubIcon?: string;
  vocab: VocabChip[];
};

type KeywordRule = {
  pattern: RegExp;
  icon: string;
  en: string;
  vi: string;
};

/**
 * Từ điển ánh xạ từ khóa/cụm từ tiếng Anh sang biểu tượng 3D (/emoji/f3d/<icon>.webp)
 * và nghĩa tiếng Việt ngắn gọn cho học sinh tiểu học.
 */
const KEYWORD_RULES: KeywordRule[] = [
  // Buổi sáng & Phòng ngủ
  { pattern: /\bwake(?:s)?\s+(?:me\s+)?up\b/i, icon: 'alarm-clock', en: 'wake up', vi: 'thức dậy' },
  { pattern: /\balarm\s+clock\b|\balarm\b/i, icon: 'alarm-clock', en: 'alarm clock', vi: 'đồng hồ báo thức' },
  { pattern: /\bsun\s+shines\b|\bsunshine\b|\bsunlight\b|\bsun\b/i, icon: 'sun', en: 'sun', vi: 'mặt trời' },
  { pattern: /\bmorning\b|\bnew\s+day\b|\bsunrise\b/i, icon: 'sunrise', en: 'morning', vi: 'buổi sáng' },
  { pattern: /\brub\s+my\s+eyes\b|\beyes\b|\beye\b/i, icon: 'eyes', en: 'eyes', vi: 'đôi mắt' },
  { pattern: /\bstretch\b/i, icon: 'person-cartwheeling', en: 'stretch', vi: 'vươn vai' },
  { pattern: /\bsleep\b|\basleep\b|\bsleepy\b|\bbedtime\b|\bdream(?:s)?\b/i, icon: 'sleeping-face', en: 'sleep', vi: 'giấc ngủ' },
  { pattern: /\bjump\s+out\s+of\s+bed\b|\bget\s+out\s+of\s+bed\b|\bmake\s+my\s+bed\b|\bbedroom\b|\bblanket\b|\bpillow\b|\bbed\b/i, icon: 'bed', en: 'bedroom / bed', vi: 'giường ngủ' },
  { pattern: /\bsmile(?:s)?\b|\bhappy\b|\bcheerful\b|\bjoy\b|\bglad\b/i, icon: 'grinning-face-with-smiling-eyes', en: 'smile', vi: 'mỉm cười' },
  { pattern: /\bslippers\b|\bshoes\b|\bsneakers\b|\bboots\b|\bsocks\b/i, icon: 'running-shoe', en: 'shoes', vi: 'giầy dép' },
  { pattern: /\bfeet\b|\bfoot\b|\bstep(?:s)?\b/i, icon: 'foot', en: 'feet', vi: 'đôi chân' },
  { pattern: /\bwindow\b|\bcurtain(?:s)?\b/i, icon: 'window', en: 'window', vi: 'cửa sổ' },
  { pattern: /\bfresh\s+air\b|\bbreeze\b|\bwind\b|\bbreathe\b/i, icon: 'wind-face', en: 'fresh air', vi: 'không khí trong lành' },

  // Vệ sinh cá nhân & Sức khỏe
  { pattern: /\btoothbrush\b|\btoothpaste\b|\bbrush\s+my\s+teeth\b|\bteeth\b|\btooth\b|\bcavities\b/i, icon: 'tooth', en: 'brush teeth', vi: 'đánh răng' },
  { pattern: /\bwash\s+my\s+hands\b|\bwash\s+hands\b|\bsoap\b|\bfoam\b|\bsanitizer\b|\bgerms\b|\bbacteria\b/i, icon: 'soap', en: 'wash with soap', vi: 'rửa bằng xà phòng' },
  { pattern: /\bbathroom\b|\bshower\b|\bbath\b|\btowel\b/i, icon: 'bathtub', en: 'bathroom', vi: 'phòng tắm' },
  { pattern: /\bsplash\b|\brinse\b|\bwater\b|\bthirsty\b|\bdrink\s+water\b|\bhydrate\b/i, icon: 'droplet', en: 'clean water', vi: 'nước sạch' },
  { pattern: /\bmirror\b|\bcomb\s+my\s+hair\b|\bcomb\b/i, icon: 'mirror', en: 'mirror', vi: 'gương soi' },
  { pattern: /\bhaircut\b|\bhair\b/i, icon: 'person-getting-haircut', en: 'neat hair', vi: 'tóc gọn gàng' },
  { pattern: /\buniform\b|\bshirt\b|\bclothes\b|\bdress(?:ed)?\b|\bwear\b/i, icon: 't-shirt', en: 'uniform', vi: 'đồng phục' },
  { pattern: /\bcoat\b|\bjacket\b|\bsweater\b/i, icon: 'coat', en: 'warm coat', vi: 'áo khoác ấm' },
  { pattern: /\bhat\b|\bcap\b|\bhelmet\b/i, icon: 'billed-cap', en: 'cap / helmet', vi: 'mũ bảo vệ' },
  { pattern: /\bdoctor\b|\bnurse\b|\bhospital\b|\bclinic\b|\bhealth\b|\bhealthy\b/i, icon: 'stethoscope', en: 'healthy', vi: 'khỏe mạnh' },
  { pattern: /\bmedicine\b|\bvitamin(?:s)?\b|\bsick\b/i, icon: 'pill', en: 'vitamins', vi: 'dưỡng chất' },

  // Bữa ăn & Thực phẩm
  { pattern: /\bbreakfast\b|\bpancake(?:s)?\b/i, icon: 'pancakes', en: 'breakfast', vi: 'bữa sáng' },
  { pattern: /\bmilk\b|\bdairy\b|\bcalcium\b/i, icon: 'glass-of-milk', en: 'milk', vi: 'sữa tươi' },
  { pattern: /\bbread\b|\btoast\b|\bsandwich\b/i, icon: 'sandwich', en: 'sandwich / bread', vi: 'bánh mì' },
  { pattern: /\begg(?:s)?\b/i, icon: 'egg', en: 'egg', vi: 'trứng' },
  { pattern: /\blunch\s+box\b|\bbento\b|\blunch\b|\bcanteen\b|\bcafeteria\b/i, icon: 'bento-box', en: 'lunch', vi: 'bữa trưa' },
  { pattern: /\bdinner\b|\bsupper\b|\bsoup\b|\bnoodle(?:s)?\b|\bbowl\b/i, icon: 'bowl-with-spoon', en: 'meal', vi: 'bữa ăn' },
  { pattern: /\brice\b/i, icon: 'cooked-rice', en: 'rice', vi: 'cơm trắng' },
  { pattern: /\bcook(?:ing)?\b|\bkitchen\b|\bprepare\s+food\b/i, icon: 'cooking', en: 'cook', vi: 'nấu ăn' },
  { pattern: /\bplate\b|\bfork\b|\bknife\b|\btable\b|\bchew\b|\beat(?:ing)?\b/i, icon: 'fork-and-knife-with-plate', en: 'eat nicely', vi: 'ăn uống' },
  { pattern: /\bchopsticks\b/i, icon: 'chopsticks', en: 'chopsticks', vi: 'đôi đũa' },
  { pattern: /\bapple(?:s)?\b|\bfruit(?:s)?\b/i, icon: 'red-apple', en: 'fresh fruit', vi: 'trái cây tươi' },
  { pattern: /\bbanana(?:s)?\b/i, icon: 'banana', en: 'banana', vi: 'quả chuối' },
  { pattern: /\bvegetable(?:s)?\b|\bbroccoli\b|\bsalad\b|\bgreens\b/i, icon: 'broccoli', en: 'vegetables', vi: 'rau xanh' },
  { pattern: /\bcarrot(?:s)?\b/i, icon: 'carrot', en: 'carrot', vi: 'cà rốt' },
  { pattern: /\bjuice\b|\bsmoothie\b|\bdrink\b/i, icon: 'beverage-box', en: 'drink', vi: 'đồ uống' },
  { pattern: /\bcandy\b|\bsweet(?:s)?\b|\bcake\b|\bdessert\b/i, icon: 'cupcake', en: 'sweets', vi: 'đồ ngọt' },

  // Đi học & An toàn giao thông
  { pattern: /\bbackpack\b|\bschool\s+bag\b|\bbag\b/i, icon: 'backpack', en: 'backpack', vi: 'cặp sách' },
  { pattern: /\bschool\s+bus\b|\bbus\b/i, icon: 'bus', en: 'school bus', vi: 'xe buýt trường' },
  { pattern: /\bbus\s+stop\b|\bwait\s+in\s+line\b|\bqueue\b/i, icon: 'bus-stop', en: 'bus stop', vi: 'trạm xe buýt' },
  { pattern: /\bbicycle\b|\bbike\b|\bcycling\b|\bride\b/i, icon: 'person-biking', en: 'ride a bike', vi: 'đạp xe' },
  { pattern: /\bcar\b|\bseatbelt\b|\bseat\s+belt\b|\bvehicle\b|\btraffic\b/i, icon: 'automobile', en: 'car / traffic', vi: 'ô tô / giao thông' },
  { pattern: /\bcrosswalk\b|\bcross\s+the\s+street\b|\bcross\s+the\s+road\b|\bsidewalk\b|\bwalk(?:s|ing)?\b/i, icon: 'person-walking', en: 'walk safely', vi: 'đi bộ an toàn' },
  { pattern: /\btraffic\s+light\b|\bred\s+light\b|\bgreen\s+light\b|\bsafe(?:ty|ly)?\b|\bdanger\b|\bstranger\b/i, icon: 'police-officer', en: 'stay safe', vi: 'giữ an toàn' },
  { pattern: /\blate\b|\bon\s+time\b|\bminute(?:s)?\b|\bhour(?:s)?\b|\bschedule\b|\btime\b/i, icon: 'mantelpiece-clock', en: 'on time', vi: 'đúng giờ' },

  // Trường học & Lớp học
  { pattern: /\bschool\b|\bclassroom\b|\bclass\b/i, icon: 'school', en: 'school', vi: 'trường học' },
  { pattern: /\bteacher(?:s)?\b|\blesson(?:s)?\b|\bexplain(?:s)?\b/i, icon: 'woman-teacher', en: 'teacher', vi: 'cô giáo' },
  { pattern: /\braise\s+my\s+hand\b|\bask\b|\banswer\b|\bquestion(?:s)?\b/i, icon: 'raised-hand', en: 'raise hand', vi: 'giơ tay phát biểu' },
  { pattern: /\blisten(?:s|ing)?\b|\bhear\b|\bquiet(?:ly)?\b|\battention\b/i, icon: 'ear', en: 'listen carefully', vi: 'lắng nghe' },
  { pattern: /\bread(?:s|ing)?\b|\bstory\b|\blibrary\b|\btextbook\b|\bbook(?:s)?\b|\bpage(?:s)?\b/i, icon: 'open-book', en: 'read books', vi: 'đọc sách' },
  { pattern: /\bnotebook\b|\bhomework\b|\bnote(?:s)?\b|\bexercise(?:s)?\b/i, icon: 'notebook', en: 'notebook', vi: 'vở ghi bài' },
  { pattern: /\bwrite(?:s|ing)?\b|\bpencil\b|\bpen\b|\bspelling\b|\bword(?:s)?\b/i, icon: 'writing-hand', en: 'write neatly', vi: 'viết bài' },
  { pattern: /\bruler\b|\bmeasure\b|\bmath\b|\bcount\b|\bnumber(?:s)?\b/i, icon: 'abacus', en: 'math & numbers', vi: 'toán học' },
  { pattern: /\bscience\b|\bexperiment\b|\bdiscover\b|\bcurious\b/i, icon: 'microscope', en: 'explore', vi: 'khám phá' },
  { pattern: /\bidea(?:s)?\b|\bunderstand\b|\bsmart\b|\bmind\b|\bbrain\b|\blearn(?:s|ing)?\b|\bstudy\b|\bknowledge\b/i, icon: 'light-bulb', en: 'bright idea', vi: 'hiểu bài / ý tưởng' },
  { pattern: /\bdraw(?:s|ing)?\b|\bpaint(?:s|ing)?\b|\bcolor(?:s)?\b|\bart\b|\bpicture\b/i, icon: 'artist-palette', en: 'draw & paint', vi: 'vẽ tranh' },
  { pattern: /\bsing(?:s|ing)?\b|\bsong\b|\bmusic\b/i, icon: 'musical-notes', en: 'music', vi: 'âm nhạc' },

  // Bạn bè, Giao tiếp & Giờ ra chơi
  { pattern: /\bhello\b|\bgreet\b|\bwave\b|\bgoodbye\b/i, icon: 'waving-hand', en: 'greet warmly', vi: 'vẫy tay chào' },
  { pattern: /\bthank\s+you\b|\bplease\b|\bsorry\b|\bpolite(?:ly)?\b|\bkind(?:ness)?\b|\bhelp(?:s|ing)?\b|\bshare(?:s|ing)?\b|\bcare\b|\blove\b/i, icon: 'pink-heart', en: 'kind & polite', vi: 'lễ phép & sẻ chia' },
  { pattern: /\bspeak\b|\btalk\b|\bsay\b|\bvoice\b|\bchat\b/i, icon: 'speech-balloon', en: 'speak politely', vi: 'trò chuyện' },
  { pattern: /\bfriend(?:s)?\b|\bclassmate(?:s)?\b|\btogether\b|\bteam\b/i, icon: 'boy', en: 'friends', vi: 'bạn bè' },
  { pattern: /\brun(?:s|ning)?\b|\bjog\b|\bchase\b|\bexercise\b|\bactive\b|\bstrong\b|\benergy\b/i, icon: 'person-running', en: 'run & stay active', vi: 'vận động khỏe mạnh' },
  { pattern: /\bsoccer\b|\bfootball\b|\bball\b|\bgoal\b|\bsport(?:s)?\b/i, icon: 'soccer-ball', en: 'play sports', vi: 'chơi thể thao' },
  { pattern: /\bbasketball\b/i, icon: 'basketball', en: 'basketball', vi: 'bóng rổ' },
  { pattern: /\bbadminton\b/i, icon: 'badminton', en: 'badminton', vi: 'cầu lông' },
  { pattern: /\bslide\b|\bplayground\b|\brecess\b|\bplay(?:s|ing|time)?\b|\bfun\b|\bgame(?:s)?\b/i, icon: 'playground-slide', en: 'playground', vi: 'sân chơi' },
  { pattern: /\brest\b|\brelax\b|\bnap\b|\bcalm\b/i, icon: 'person-in-lotus-position', en: 'relax', vi: 'nghỉ ngơi' },

  // Gia đình & Việc nhà
  { pattern: /\bhome\b|\bhouse\b|\bliving\s+room\b/i, icon: 'house-with-garden', en: 'sweet home', vi: 'ngôi nhà' },
  { pattern: /\bfamily\b|\bparents\b|\bmom\b|\bmother\b|\bdad\b|\bfather\b/i, icon: 'woman', en: 'family', vi: 'gia đình' },
  { pattern: /\bsweep\b|\bbroom\b|\bclean\b|\btidy\b|\bneat(?:ly)?\b|\bchore(?:s)?\b|\btrash\b|\bgarbage\b|\blitter\b|\bbin\b/i, icon: 'broom', en: 'keep tidy', vi: 'dọn gọn gàng' },
  { pattern: /\bfold\b|\blaundry\b|\bput\s+away\b|\borganize\b/i, icon: 'basket', en: 'organize', vi: 'sắp xếp' },
  { pattern: /\btoy(?:s)?\b|\bteddy\b/i, icon: 'teddy-bear', en: 'toys', vi: 'đồ chơi' },

  // Thiên nhiên & Môi trường
  { pattern: /\bplant(?:s|ing)?\b|\bseed(?:s|ling)?\b|\bsprout\b|\bgrow\b/i, icon: 'seedling', en: 'plant trees', vi: 'trồng cây' },
  { pattern: /\btree(?:s)?\b|\bforest\b|\bshade\b|\bnature\b|\bearth\b|\bplanet\b|\benvironment\b/i, icon: 'deciduous-tree', en: 'green nature', vi: 'thiên nhiên xanh' },
  { pattern: /\bflower(?:s)?\b|\bgarden\b|\bbloom\b/i, icon: 'sunflower', en: 'flowers', vi: 'hoa nở' },
  { pattern: /\bturn\s+off\b|\bsave\s+energy\b|\belectricity\b|\blight(?:s)?\b/i, icon: 'light-bulb', en: 'save energy', vi: 'tiết kiệm điện' },
  { pattern: /\breusable\b|\brecycle\b|\bplastic\b|\bbag(?:s)?\b/i, icon: 'shopping-bags', en: 'eco bag', vi: 'túi thân thiện' },
];

const STORY_THEME: Record<string, { theme: SceneVisual['theme']; label: string; defaultAction: string; defaultPurpose: string }> = {
  'source-1-part-1': { theme: 'morning', label: '🌅 Buổi sáng thức dậy', defaultAction: 'sunrise', defaultPurpose: 'grinning-face-with-smiling-eyes' },
  'source-1-part-2': { theme: 'morning', label: '🥞 Ăn sáng & Đến trường', defaultAction: 'pancakes', defaultPurpose: 'school' },
  'source-1-part-3': { theme: 'school', label: '🏫 Giờ học trên lớp', defaultAction: 'open-book', defaultPurpose: 'light-bulb' },
  'source-1-part-4': { theme: 'play', label: '⚽ Giờ ra chơi năng động', defaultAction: 'playground-slide', defaultPurpose: 'grinning-face-with-smiling-eyes' },
  'source-1-part-5': { theme: 'meal', label: '🍱 Ăn trưa & Học chiều', defaultAction: 'bento-box', defaultPurpose: 'star' },
  'source-1-part-6': { theme: 'home', label: '🏡 Về nhà cùng gia đình', defaultAction: 'house-with-garden', defaultPurpose: 'pink-heart' },
  'source-1-part-7': { theme: 'night', label: '🌙 Ôn bài & Chúc ngủ ngon', defaultAction: 'notebook', defaultPurpose: 'sleeping-face' },
  'source-2-part-1': { theme: 'health', label: '🧼 Vệ sinh sạch khuẩn', defaultAction: 'soap', defaultPurpose: 'star' },
  'source-2-part-2': { theme: 'health', label: '🍎 Ăn lành mạnh & Khỏe khoắn', defaultAction: 'red-apple', defaultPurpose: 'person-running' },
  'source-3-part-1': { theme: 'play', label: '🤝 Kết bạn & Lịch sự', defaultAction: 'waving-hand', defaultPurpose: 'pink-heart' },
  'source-4-part-1': { theme: 'nature', label: '🌱 Thói quen sống xanh', defaultAction: 'seedling', defaultPurpose: 'deciduous-tree' },
  'source-5-part-1': { theme: 'safety', label: '🚦 An toàn mỗi ngày', defaultAction: 'person-walking', defaultPurpose: 'police-officer' },
};

function matchClauseRules(text: string): KeywordRule[] {
  const hits: KeywordRule[] = [];
  const usedIcons = new Set<string>();
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text) && !usedIcons.has(rule.icon)) {
      hits.push(rule);
      usedIcons.add(rule.icon);
    }
  }
  return hits;
}

/**
 * Tạo dữ liệu minh họa trực quan (Action ➔ Purpose + Thẻ từ vựng hình ảnh) cho một câu giao tiếp tiếng Anh.
 */
export function buildSentenceVisual(
  q: Pick<CommunicationQuestion, 'action' | 'reason' | 'sentence'> & { storyId?: string; topicId?: string },
): SceneVisual {
  const storyMeta = (q.storyId && STORY_THEME[q.storyId]) || {
    theme: 'school' as const,
    label: '✨ Tình huống giao tiếp',
    defaultAction: 'books',
    defaultPurpose: 'star',
  };

  const actionMatches = matchClauseRules(q.action);
  const purposeMatches = matchClauseRules(q.reason);

  const actionMainIcon = actionMatches[0]?.icon ?? storyMeta.defaultAction;
  const actionSubIcon = actionMatches[1]?.icon;

  // Đảm bảo biểu tượng chính của vế Purpose không bị trùng hoàn toàn với Action nếu có lựa chọn thứ 2
  let purposeMainIcon = purposeMatches[0]?.icon ?? storyMeta.defaultPurpose;
  if (purposeMainIcon === actionMainIcon && purposeMatches[1]) {
    purposeMainIcon = purposeMatches[1].icon;
  } else if (purposeMainIcon === actionMainIcon) {
    purposeMainIcon = storyMeta.defaultPurpose !== actionMainIcon ? storyMeta.defaultPurpose : 'star';
  }
  const purposeSubIcon = purposeMatches.find((m) => m.icon !== purposeMainIcon && m.icon !== actionMainIcon)?.icon;

  // Tổng hợp tối đa 4 thẻ từ vựng hình ảnh (Picture Dictionary chips) xuất hiện trong câu
  const combined = [...actionMatches, ...purposeMatches];
  const seenEn = new Set<string>();
  const vocab: VocabChip[] = [];
  for (const item of combined) {
    if (seenEn.has(item.en)) continue;
    seenEn.add(item.en);
    vocab.push({ icon: item.icon, en: item.en, vi: item.vi });
    if (vocab.length >= 4) break;
  }

  if (vocab.length === 0) {
    vocab.push(
      { icon: actionMainIcon, en: q.action.replace(/[.!?]+$/, '').trim(), vi: 'hành động' },
      { icon: purposeMainIcon, en: q.reason.replace(/[.!?]+$/, '').trim(), vi: 'mục đích' },
    );
  }

  return {
    theme: storyMeta.theme,
    themeLabel: storyMeta.label,
    actionMainIcon,
    actionSubIcon,
    purposeMainIcon,
    purposeSubIcon,
    vocab,
  };
}
