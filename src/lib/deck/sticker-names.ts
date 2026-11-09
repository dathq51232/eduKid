import { F3D_VI } from './f3d-catalog';
// Tên tiếng Việt của hình dán (để tìm nhanh trong thanh Chèn của bài thao giảng). Khoá: tên file hình.
export const STICKER_VI: Record<string, string> = {
  rabbit: 'thỏ', cat: 'mèo', dog: 'chó cún', duck: 'vịt', fish: 'cá', butterfly: 'bướm', 'lady-beetle': 'bọ rùa', bear: 'gấu', fox: 'cáo', lion: 'sư tử',
  tiger: 'hổ', monkey: 'khỉ', panda: 'gấu trúc', owl: 'cú mèo', horse: 'ngựa', pig: 'lợn heo', rooster: 'gà trống', 'baby-chick': 'gà con', dolphin: 'cá heo',
  elephant: 'voi', giraffe: 'hươu cao cổ', penguin: 'chim cánh cụt', frog: 'ếch', turtle: 'rùa', snail: 'ốc sên', ant: 'kiến', crab: 'cua', deer: 'hươu nai',
  goose: 'ngỗng', ewe: 'cừu', donkey: 'lừa', unicorn: 'kì lân', 't-rex': 'khủng long', 'red-apple': 'táo', banana: 'chuối', strawberry: 'dâu tây', carrot: 'cà rốt',
  grapes: 'nho', pear: 'lê', mango: 'xoài', tangerine: 'quýt cam', tomato: 'cà chua', lemon: 'chanh', 'kiwi-fruit': 'kiwi', cucumber: 'dưa chuột dưa leo',
  eggplant: 'cà tím', broccoli: 'súp lơ bông cải', mushroom: 'nấm', peanuts: 'lạc đậu phộng', 'ear-of-corn': 'ngô bắp', watermelon: 'dưa hấu', pineapple: 'dứa thơm',
  cherries: 'anh đào', peach: 'đào', pumpkin: 'bí ngô', potato: 'khoai tây', pencil: 'bút chì', 'open-book': 'sách vở', books: 'sách', scissors: 'kéo',
  'straight-ruler': 'thước kẻ', paintbrush: 'bút vẽ cọ', bell: 'chuông', drum: 'trống', trumpet: 'kèn', guitar: 'đàn ghi ta', headphone: 'tai nghe', key: 'chìa khoá',
  magnet: 'nam châm', glasses: 'kính', 'balance-scale': 'cân', chair: 'ghế', bucket: 'xô', broom: 'chổi', teapot: 'ấm trà', spoon: 'thìa muỗng', candle: 'nến',
  'light-bulb': 'bóng đèn', envelope: 'phong bì thư', bicycle: 'xe đạp', bus: 'xe buýt', 'delivery-truck': 'xe tải', 'fire-engine': 'xe cứu hoả', helicopter: 'trực thăng',
  sailboat: 'thuyền buồm', sun: 'mặt trời', sunflower: 'hoa hướng dương', 'deciduous-tree': 'cây', house: 'nhà', balloon: 'bóng bay', star: 'ngôi sao', trophy: 'cúp',
  'wrapped-gift': 'quà', rainbow: 'cầu vồng', 'crescent-moon': 'mặt trăng', 'cloud-with-lightning': 'mây sấm sét mưa', droplet: 'giọt nước', fire: 'lửa', blossom: 'hoa',
  'evergreen-tree': 'cây thông', mountain: 'núi', school: 'trường học', 'glowing-star': 'sao sáng', 'gem-stone': 'kim cương đá quý', sparkles: 'lấp lánh',
};
export const stickerName = (src: string) => {
  if (src.includes('@lobehub/fluent-emoji-3d')) {
    const code = src.split('/').pop()?.replace(/\.(webp|png)$/, '') ?? '';
    return `Emoji 3D (${code})`;
  }
  const k = src.split('/').pop()?.replace(/\.(webp|png)$/, '') ?? '';
  return STICKER_VI[k] ?? F3D_VI[k] ?? k.replace(/-/g, ' ');
};

/** Kiểu chữ có sẵn (bấm là áp ngay; thêm chữ mới theo kiểu) */
export const TEXT_STYLES: { id: string; label: string; size: number; font: 'baloo' | 'quick'; color: string; bg: string; stroke?: boolean; w: number; h: number }[] = [
  { id: 'title', label: 'Tiêu đề', size: 84, font: 'baloo', color: '#1d4ed8', bg: '', stroke: true, w: 1100, h: 140 },
  { id: 'question', label: 'Câu hỏi', size: 56, font: 'baloo', color: '#7c2d12', bg: '#fef3c7', w: 1000, h: 120 },
  { id: 'answer', label: 'Đáp án', size: 54, font: 'quick', color: '#15803d', bg: '#dcfce7', w: 760, h: 110 },
  { id: 'remember', label: 'Ghi nhớ', size: 44, font: 'quick', color: '#1f2937', bg: '#fde68a', w: 1000, h: 140 },
  { id: 'note', label: 'Chú thích', size: 32, font: 'quick', color: '#475569', bg: '', w: 640, h: 70 },
];
