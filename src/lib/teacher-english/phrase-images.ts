// Hình minh hoạ cho mẫu câu Classroom English: dùng bộ hình 3D có sẵn (public/emoji/f3d, Fluent Emoji 3D – MIT).
// Chọn hình theo từ khoá trong câu tiếng Anh (từ khoá cụ thể trước, chung chung sau); không khớp thì dùng
// hình theo chủ đề của Unit, cuối cùng là hình theo tình huống lớp học.
import type { Phrase, SituationKey, TopicKey } from './classroom-bank';

/** [từ khoá (viết thường, so theo ranh giới từ, tự khớp cả số nhiều -s/-es), tên hình f3d] — thứ tự là độ ưu tiên */
const KEYWORDS: [string, string][] = [
  // Ưu tiên: từ khoá mang ý chính của câu, dễ bị từ khác "giành" nếu để sau
  ['birthday', 'birthday-cake'], ['mid-autumn', 'red-paper-lantern'], ['lanterns', 'red-paper-lantern'], ['beach', 'beach-with-umbrella'],
  ['singing', 'microphone'], ['lamp', 'light-bulb'], ['policeman', 'police-officer'], ['go out', 'door'], ['come in', 'door'],
  ['cinema', 'clapper-board'], ['tall', 'person-standing'], ['clean the floor', 'broom'], ['crayon', 'crayon'],
  ['hello', 'waving-hand'], ['goodbye', 'waving-hand'], ['see you', 'waving-hand'], ['good morning', 'sunrise'], ['good afternoon', 'sun'], ['leader', 'triangular-flag'],
  // Đồ ăn, thức uống
  ['fish and chips', 'french-fries'], ['chips', 'french-fries'], ['pizza', 'pizza'], ['popcorn', 'popcorn'], ['pasta', 'spaghetti'],
  ['noodles', 'steaming-bowl'], ['banana', 'banana'], ['nut', 'peanuts'], ['apple', 'red-apple'], ['mango', 'mango'], ['lemon', 'lemon'],
  ['grapes', 'grapes'], ['cake', 'birthday-cake'], ['jam', 'honey-pot'], ['jelly', 'custard'], ['juice', 'beverage-box'],
  ['milk', 'glass-of-milk'], ['yams', 'roasted-sweet-potato'], ['banh chung', 'red-envelope'], ['seafood', 'shrimp'],
  ['chicken and rice', 'cooked-rice'], ['chicken', 'poultry-leg'], ['lunchtime', 'bento-box'], ['dinner', 'fork-and-knife-with-plate'],
  ['café', 'hot-beverage'], ['cup', 'hot-beverage'], ['yummy', 'shortcake'], ['eat', 'fork-and-knife-with-plate'],
  // Con vật
  ['zebra', 'zebra'], ['zebu', 'ox'], ['monkey', 'monkey'], ['tiger', 'tiger'], ['turtle', 'turtle'], ['tortoise', 'turtle'],
  ['hare', 'rabbit'], ['rabbit', 'rabbit'], ['giraffe', 'giraffe'], ['lion', 'lion'], ['elephant', 'elephant'], ['dolphin', 'dolphin'],
  ['parrot', 'parrot'], ['goldfish', 'tropical-fish'], ['aquarium', 'tropical-fish'], ['fish', 'fish'], ['goat', 'goat'],
  ['horse', 'horse'], ['duck', 'duck'], ['dog', 'dog'], ['kitten', 'cat'], ['cat', 'cat'], ['mouse', 'mouse-face'], ['fox', 'fox'],
  ['ox', 'ox'], ['bee', 'honeybee'], ['snake', 'snake'], ['farm', 'tractor'], ['zoo', 'giraffe'], ['pet', 'dog'], ['animal', 'elephant'],
  // Đồ chơi, quần áo
  ['teddy bear', 'teddy-bear'], ['kite', 'kite'], ['top', 'yo-yo'], ['yo-yo', 'yo-yo'], ['plane', 'airplane'], ['toy', 'teddy-bear'],
  ['shoes', 'running-shoe'], ['shirt', 't-shirt'], ['t-shirt', 't-shirt'], ['shorts', 'shorts'], ['jacket', 'coat'], ['dress', 'dress'],
  ['hat', 'billed-cap'], ['clothes', 't-shirt'], ['wearing', 't-shirt'],
  // Trường lớp, đồ dùng
  ['pencil case', 'pencil'], ['pencil', 'pencil'], ['pen', 'pen'], ['ruler', 'straight-ruler'], ['eraser', 'pencil'], ['rubber', 'pencil'],
  ['crayon', 'crayon'], ['school bag', 'backpack'], ['bag', 'backpack'], ['book', 'open-book'], ['library', 'books'], ['bookshop', 'books'],
  ['notebook', 'notebook'], ['homework', 'notebook'], ['spelling', 'pencil'], ['write', 'writing-hand'], ['writer', 'writing-hand'],
  ['draw', 'paintbrush'], ['colour', 'crayon'], ['picture', 'framed-picture'], ['board', 'framed-picture'], ['quiz', 'red-question-mark'],
  ['question', 'red-question-mark'], ['maths', 'abacus'], ['number', 'abacus'], ['count', 'abacus'], ['eleven', 'abacus'], ['twelve', 'abacus'],
  ['timetable', 'spiral-calendar'], ['subject', 'laptop'], ['computer', 'laptop'], ['gym', 'person-cartwheeling'],
  ['music room', 'musical-keyboard'], ['music', 'headphone'], ['school trip', 'minibus'], ['school', 'school'], ['class', 'school'],
  ['classroom', 'school'], ['bell', 'bell'], ['desk', 'chair'],
  // Hình, màu
  ['square', 'blue-square'], ['rainbow', 'rainbow'], ['red', 'red-circle'], ['blue', 'blue-circle'], ['green', 'green-circle'],
  // Cơ thể, sức khoẻ
  ['toothache', 'tooth'], ['dentist', 'tooth'], ['teeth', 'tooth'], ['headache', 'pill'], ['matter', 'pill'], ['healthy', 'person-running'],
  ['exercise', 'person-cartwheeling'], ['nose', 'nose'], ['mouth', 'mouth'], ['hair', 'person-getting-haircut'], ['face', 'grinning-face-with-smiling-eyes'],
  ['foot', 'foot'], ['hands', 'raised-hand'], ['hand', 'raised-hand'], ['eyes', 'eyes'], ['head', 'speaking-head'], ['wash', 'soap'],
  ['deep breath', 'person-in-lotus-position'], ['calm', 'person-in-lotus-position'],
  // Sở thích, thể thao
  ['football', 'soccer-ball'], ['ball', 'soccer-ball'], ['volleyball', 'volleyball'], ['badminton', 'badminton'], ['chess', 'chess-pawn'],
  ['swim', 'person-swimming'], ['swimming', 'person-swimming'], ['swam', 'person-swimming'], ['bike', 'bicycle'], ['bikes', 'bicycle'],
  ['cycling', 'person-biking'], ['skating', 'ice-skate'], ['guitar', 'guitar'], ['violin', 'violin'], ['singing', 'microphone'],
  ['sing', 'musical-notes'], ['song', 'musical-notes'], ['chant', 'musical-notes'], ['dance', 'woman-dancing'], ['reading', 'open-book'],
  ['listening to music', 'headphone'], ['sports day', 'sports-medal'], ['hobby', 'artist-palette'], ['free time', 'artist-palette'],
  ['run', 'person-running'], ['running', 'person-running'], ['sliding', 'playground-slide'], ['playground', 'playground-slide'],
  ['campfire', 'fire'], ['tent', 'tent'], ['camp', 'camping'], ['camping', 'camping'], ['blanket', 'bed'],
  // Nhà, gia đình
  ['bedroom', 'bed'], ['bed', 'bed'], ['kitchen', 'cooking'], ['cooks', 'cook'], ['lamp', 'light-bulb'], ['chairs', 'chair'],
  ['window', 'window'], ['door', 'door'], ['clock', 'alarm-clock'], ['mop', 'broom'], ['floor', 'broom'], ['tidy', 'broom'],
  ['pot', 'pot-of-food'], ['water', 'droplet'], ['tower', 'tokyo-tower'], ['house', 'house-with-garden'], ['home', 'house'],
  ['grandmother', 'old-woman'], ['grandfather', 'old-man'], ['grandparents', 'old-woman'], ['mother', 'woman'], ['father', 'man'],
  ['brother', 'boy'], ['sister', 'girl'], ['girl', 'girl'], ['boy', 'boy'], ['family', 'houses'], ['friend', 'waving-hand'],
  ['family photo', 'framed-picture'], ['photo', 'framed-picture'],
  // Nghề nghiệp
  ['doctor', 'stethoscope'], ['nurse', 'woman-health-worker'], ['policeman', 'police-officer'], ['hospital', 'hospital'],
  ['farmer', 'farmer'], ['job', 'briefcase'], ['shopkeeper', 'shopping-bags'], ['customer', 'shopping-bags'],
  // Thời gian
  ['birthday', 'birthday-cake'], ['what time', 'alarm-clock'], ['o\'clock', 'alarm-clock'], ['minutes', 'alarm-clock'], ['minute', 'alarm-clock'],
  ['time\'s up', 'alarm-clock'], ['monday', 'calendar'], ['saturdays', 'calendar'], ['week', 'calendar'], ['weekend', 'party-popper'],
  ['morning', 'sunrise'], ['get up', 'alarm-clock'], ['month', 'spiral-calendar'], ['june', 'spiral-calendar'], ['march', 'spiral-calendar'],
  // Thời tiết, thiên nhiên
  ['sunny', 'sun'], ['rainy', 'cloud-with-rain'], ['windy', 'wind-face'], ['autumn', 'fallen-leaf'], ['cool', 'fallen-leaf'],
  ['winter', 'snowflake'], ['cold', 'snowflake'], ['season', 'fallen-leaf'], ['weather', 'sun'], ['sea', 'water-wave'], ['seaside', 'beach-with-umbrella'],
  ['beach', 'beach-with-umbrella'], ['sand', 'beach-with-umbrella'], ['seashells', 'spiral-shell'], ['lake', 'water-wave'],
  ['leaf', 'leaf-fluttering-in-wind'], ['garden', 'house-with-garden'], ['gate', 'house-with-garden'], ['sun', 'sun'], ['countryside', 'sunrise-over-mountains'],
  ['island', 'desert-island'], ['hills', 'mountain'], ['summer', 'beach-with-umbrella'],
  // Địa điểm, giao thông
  ['bus', 'bus'], ['van', 'delivery-truck'], ['truck', 'delivery-truck'], ['cars', 'automobile'], ['car', 'automobile'], ['driving', 'automobile'],
  ['transport', 'bus'], ['post office', 'post-office'], ['supermarket', 'shopping-cart'], ['shopping', 'shopping-bags'], ['market', 'basket'],
  ['shop', 'shopping-bags'], ['grocery', 'basket'], ['cinema', 'clapper-board'], ['bridge', 'bridge-at-night'], ['street', 'cityscape'],
  ['city', 'cityscape'], ['village', 'houses'], ['map', 'national-park'], ['park', 'national-park'], ['turn left', 'right-arrow'],
  ['turn right', 'right-arrow'], ['go straight', 'right-arrow'], ['directions', 'right-arrow'], ['trip', 'minibus'], ['visit', 'airplane'],
  ['japan', 'triangular-flag'], ['australia', 'triangular-flag'], ['nationality', 'triangular-flag'], ['japanese', 'triangular-flag'],
  // Lễ hội
  ['tet', 'red-envelope'], ['lanterns', 'red-paper-lantern'], ['mid-autumn', 'red-paper-lantern'], ['teachers\' day', 'bouquet'],
  ['holiday', 'beach-with-umbrella'], ['party', 'party-popper'], ['wish card', 'love-letter'],
  // Truyện
  ['story', 'open-book'], ['characters', 'performing-arts'], ['act out', 'performing-arts'], ['role-play', 'performing-arts'],
  // Lớp học chung (để cuối: chung chung hơn)
  ['good morning', 'sunrise'], ['good afternoon', 'sun'], ['hello', 'waving-hand'], ['goodbye', 'waving-hand'], ['see you', 'waving-hand'],
  ['welcome', 'waving-hand'], ['guests', 'waving-hand'], ['absent', 'ledger'], ['name', 'speech-balloon'], ['sit down', 'chair'],
  ['seat', 'chair'], ['seats', 'chair'], ['stand up', 'person-standing'], ['quiet', 'person-in-lotus-position'], ['clap', 'raised-hand'],
  ['raise your hand', 'raised-hand'], ['big hand', 'party-popper'], ['shout', 'loudspeaker'], ['louder', 'loudspeaker'],
  ['listen', 'ear'], ['repeat', 'speaking-head'], ['say', 'speech-balloon'], ['ask', 'speech-balloon'], ['tell', 'speech-balloon'],
  ['pronunciation', 'speaking-head'], ['partner', 'speech-balloon'], ['pairs', 'speech-balloon'], ['groups', 'puzzle-piece'], ['group', 'puzzle-piece'],
  ['leader', 'triangular-flag'], ['team', 'sports-medal'], ['point', 'right-arrow'], ['game', 'game-die'], ['rules', 'ledger'],
  ['turn', 'game-die'], ['simon says', 'game-die'], ['guess', 'red-question-mark'], ['mime', 'performing-arts'], ['charades', 'performing-arts'],
  ['survey', 'ledger'], ['excellent', 'star'], ['brilliant', 'star'], ['great job', 'sports-medal'], ['well done', 'sports-medal'],
  ['good thinking', 'light-bulb'], ['remembered', 'light-bulb'], ['understand', 'light-bulb'], ['explain', 'light-bulb'], ['ready', 'triangular-flag'],
  ['don\'t worry', 'red-heart'], ['you can do it', 'red-heart'], ['mistakes', 'red-heart'], ['try', 'red-heart'], ['help', 'raised-hand'],
  ['check', 'pencil'], ['answer', 'red-question-mark'], ['circle', 'red-circle'], ['match', 'puzzle-piece'], ['tick', 'pencil'],
  ['look', 'eyes'], ['watch', 'eyes'], ['show me', 'eyes'], ['eyes on me', 'eyes'], ['learn', 'light-bulb'], ['review', 'books'],
  ['started', 'triangular-flag'], ['stop', 'alarm-clock'], ['come to the front', 'person-walking'], ['go back', 'person-walking'],
  ['walk', 'person-walking'], ['move', 'person-running'], ['line up', 'person-standing'], ['plan', 'spiral-calendar'],
  ['poster', 'framed-picture'], ['present', 'microphone'], ['share', 'speech-balloon'], ['interview', 'microphone'], ['describe', 'speech-balloon'],
];

const TOPIC_IMG: Record<TopicKey, string> = {
  me: 'waving-hand', school: 'school', family: 'houses', home: 'house-with-garden', food: 'fork-and-knife-with-plate', animals: 'elephant',
  'body-health': 'person-cartwheeling', hobbies: 'artist-palette', 'toys-clothes': 'teddy-bear', time: 'alarm-clock', 'weather-nature': 'sun',
  places: 'national-park', jobs: 'briefcase', festivals: 'red-paper-lantern', 'numbers-colours': 'artist-palette', stories: 'open-book',
};
const SITUATION_IMG: Record<SituationKey, string> = {
  greeting: 'waving-hand', settling: 'person-in-lotus-position', starting: 'triangular-flag', instructions: 'ledger',
  'pairs-groups': 'speech-balloon', drilling: 'speaking-head', games: 'game-die', praise: 'star', encourage: 'red-heart',
  correcting: 'pencil', checking: 'light-bulb', behaviour: 'raised-hand', transitions: 'right-arrow', ending: 'bell',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MATCHERS = KEYWORDS.map(([k, img]) => [new RegExp(`(^|[^a-z'])${escape(k)}(?:e?s)?(?![a-z])`), img] as const);

/** Hình theo từ khoá trong câu tiếng Anh; null nếu không khớp */
export function keywordImage(en: string): string | null {
  const s = en.toLowerCase().replace(/[’]/g, '\'');
  for (const [re, img] of MATCHERS) if (re.test(s)) return img;
  return null;
}

const cache = new Map<string, string>();
/** Hình cho một mẫu câu: từ khoá → chủ đề Unit → tình huống */
export function phraseImage(p: Phrase): string {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const img = keywordImage(p.en) ?? (p.topic ? TOPIC_IMG[p.topic] : null) ?? SITUATION_IMG[p.situation];
  cache.set(p.id, img);
  return img;
}

export const f3dSrc = (name: string) => `/emoji/f3d/${name}.webp`;
