// Xưởng video stickman — bộ phong cách, giọng đọc, nhạc nền và nhân vật / bối cảnh mẫu của EduChain.
// Phương pháp giữ nhân vật đồng nhất lấy theo chế độ A · Director của kaomei/stickman-video-director (MIT):
// mô tả nhân vật "đóng băng" lặp nguyên văn ở mọi cảnh, khối giọng đọc lặp nguyên văn, mỗi cảnh ~10 giây
// chia 3 nhịp, cảnh sau kế thừa trạng thái cuối của cảnh trước, không có chữ trong hình.
// Phần mô tả dùng cho Google Flow (Veo) viết bằng tiếng Anh; nhãn giao diện bằng tiếng Việt.

export type Ratio = '16:9' | '9:16';
export type Narration = 'vi' | 'en' | 'none';

export type StylePreset = {
  key: string;
  name: string;
  desc: string;
  /** cách vẽ chung (không thay nhân vật) */
  grammar: string;
  /** câu mở đầu phần bối cảnh, ghép trước mô tả bối cảnh */
  environment: string;
  palette: string;
  negatives: string;
};

export const STYLES: StylePreset[] = [
  {
    key: 'cozy',
    name: 'Kể chuyện ấm áp (khuyên dùng)',
    desc: 'Nhân vật đầu trắng, nét đen, bối cảnh hoạt hình 2D nhiều màu, đổi cảnh theo câu chuyện. Hợp truyện, bài học, kỹ năng sống.',
    grammar: 'Smooth full-color 2D cartoon animation with clear cartoon contours and gentle cinematic framing. Characters keep minimalist white filled heads and torsos with dark single-line limbs; all color, light and depth live in the environment and props.',
    environment: 'Full-color 2D cartoon environment with soft warm daylight, gentle depth and clean shapes. Setting for this clip:',
    palette: 'Bright, friendly, child-appropriate colors: sky blue, sunny yellow, leaf green, soft coral and warm cream; calm pastel backgrounds with clear contrast around the characters.',
    negatives: 'no crude sketch lines, no paper texture, no photorealistic or 3D humanoid characters.',
  },
  {
    key: 'classic-light',
    name: 'Tối giản nền trắng',
    desc: 'Nền trắng phẳng, nét đen, tối đa 3 màu nhấn trên đồ vật. Hợp mẹo học, giải thích khái niệm nhanh.',
    grammar: 'Minimalist two-dimensional black line animation on a flat canvas. Characters keep their frozen design; saturated accent colors appear only on props and simple graphic effects.',
    environment: 'Flat, uniform, digitally pure-white canvas with no shading, gradients, textures or 3D depth. Simple line-drawn props suggest the setting:',
    palette: 'Black line art on white, plus at most three accent colors on props and graphics only: sky blue, sunny yellow and leaf green.',
    negatives: 'no gray tint, no paper texture, no gradients, no shadows, no fog, no 3D depth.',
  },
  {
    key: 'bright-studio',
    name: 'Studio sáng (mẹo học, phương pháp)',
    desc: 'Phòng trắng sáng, lưới sàn mờ, biểu tượng kính xanh nổi. Hợp video phương pháp học, mẹo ghi nhớ.',
    grammar: 'Smooth 2D cartoon animation with simple black lines and vibrant colors. Characters keep their frozen design inside a clean bright studio.',
    environment: 'Modern bright white studio space with subtle light-gray perspective grid lines on the floor plane, high-key lighting, clean white negative space and floating soft sky-blue glass icon panels. Focus for this clip:',
    palette: 'Clean white space with sky blue, sunny yellow and leaf green accents.',
    negatives: 'strictly minimalist studio, no circuit board textures, no sci-fi wall panels, no cracked concrete, no grunge textures.',
  },
];

export type VoicePreset = { key: string; name: string; narration: Narration; block: string; hint?: string };

export const VOICES: VoicePreset[] = [
  {
    key: 'vi-female', name: 'Cô giáo (nữ, giọng Bắc, tiếng Việt)', narration: 'vi',
    hint: 'Veo đọc tiếng Việt có thể chưa chuẩn dấu — nghe thử 1 cảnh trước; chưa ổn thì chọn "Không lời" và lồng tiếng bằng VoiceStudio.',
    block: 'One off-screen adult female narrator throughout, speaking Vietnamese with a clear Northern Vietnamese (Hanoi) accent and correct tones. Warm, clear mid-high voice, gentle forward resonance, no rasp or breathiness. Kind teacher-like conversational delivery for young children, slightly slow and steady pace, close dry studio sound. Keep the same vocal timbre, register, accent, pace and recording quality throughout. Emotional progression belongs to the visuals and music; do not change the narrator\'s voice or switch to character dialogue.',
  },
  {
    key: 'vi-male', name: 'Thầy giáo (nam, giọng Bắc, tiếng Việt)', narration: 'vi',
    hint: 'Veo đọc tiếng Việt có thể chưa chuẩn dấu — nghe thử 1 cảnh trước.',
    block: 'One off-screen adult male narrator throughout, speaking Vietnamese with a clear Northern Vietnamese (Hanoi) accent and correct tones. Warm clean baritone, medium-low pitch, gentle chest resonance, no rasp or breathiness. Friendly, calm conversational delivery for young children, slightly slow and steady pace, close dry studio sound. Keep the same vocal timbre, register, accent, pace and recording quality throughout. Emotional progression belongs to the visuals and music; do not change the narrator\'s voice or switch to character dialogue.',
  },
  {
    key: 'en-female', name: 'Cô giáo tiếng Anh (nữ, giọng Mỹ)', narration: 'en',
    block: 'One off-screen adult female narrator throughout. General American accent, clear warm mid-high voice, gentle forward resonance, no rasp or breathiness. Lively but gentle teacher-like delivery for young learners, controlled pitch variation, slow and very clear articulation, steady pace, close dry studio sound. Keep the same vocal timbre, register, accent, pace and recording quality throughout. Emotional progression belongs to the visuals and music; do not change the narrator\'s voice or switch to character dialogue.',
  },
  {
    key: 'silent', name: 'Không lời (lồng tiếng sau bằng VoiceStudio)', narration: 'none',
    hint: 'Flow chỉ tạo nhạc nền và tiếng động; lời đọc ghi riêng rồi ghép khi dựng.',
    block: 'No narrator and no spoken words of any kind; music and synchronized sound effects only. Narration will be added in post-production.',
  },
];

export type MusicPreset = { key: string; name: string; first: string; next: string };
export const MUSIC: MusicPreset[] = [
  { key: 'piano', name: 'Piano nhẹ, lạc quan',
    first: 'Audio: gentle, optimistic solo piano with a soft ambient pad, moderate tempo, kept well under the voice. Synchronized soft, playful SFX on physical actions.',
    next: 'Audio: seamlessly continue the identical gentle, optimistic solo piano with a soft ambient pad from clip 1, maintaining identical tempo, instrumentation and mood, kept well under the voice. Synchronized soft, playful SFX on physical actions.' },
  { key: 'ukulele', name: 'Ukulele vui tươi',
    first: 'Audio: bright, playful ukulele with light hand claps and glockenspiel accents, cheerful moderate tempo, kept well under the voice. Synchronized soft, playful SFX on physical actions.',
    next: 'Audio: seamlessly continue the identical bright, playful ukulele with light hand claps and glockenspiel accents from clip 1, maintaining identical tempo, instrumentation and mood, kept well under the voice. Synchronized soft, playful SFX on physical actions.' },
  { key: 'marimba', name: 'Marimba khám phá',
    first: 'Audio: curious, bouncy marimba and soft pizzicato strings, light moderate tempo, kept well under the voice. Synchronized soft, playful SFX on physical actions.',
    next: 'Audio: seamlessly continue the identical curious, bouncy marimba and soft pizzicato strings from clip 1, maintaining identical tempo, instrumentation and mood, kept well under the voice. Synchronized soft, playful SFX on physical actions.' },
];

export type LibItem = { id: string; name: string; note: string; anchor: string; refs: string[]; builtin?: boolean; owner?: string | null; shared?: boolean };

/** Khung mô tả nhân vật (Style 4) để thầy cô sửa thành nhân vật mới */
export const CHARACTER_TEMPLATE =
  'One minimalist 2D cartoon character with a white filled circular head, two small dark oval eyes, simple eyebrow strokes and a short curved smile. The torso is a slim closed tapered shape with solid white fill inside its dark outline. [Distinctive item, e.g. a bright red cap]. Both arms and both legs are dark single-line strokes with constant medium weight; hands are small dark rounded shapes and feet are short dark rounded strokes. Keep the same head-to-body proportions, white head and torso fill, and outline weight in every shot. Exactly two arms and two legs exist; a moving limb replaces its previous pose rather than leaving another limb behind. Expressions change only the simple facial marks, never the head shape or character design.';

const LIMBS = 'Both arms and both legs are dark single-line strokes with constant medium weight; hands are small dark rounded shapes and feet are short dark rounded strokes. Keep the same head-to-body proportions, white head and torso fill, and outline weight in every shot. Exactly two arms and two legs exist; a moving limb replaces its previous pose rather than leaving another limb behind. Expressions change only the simple facial marks, never the head shape or character design.';

export const BUILTIN_CHARACTERS: LibItem[] = [
  { id: 'b-chain', builtin: true, name: 'Bé Chain', note: 'Học sinh tò mò, hay hỏi "vì sao?"', refs: [],
    anchor: `One small minimalist 2D cartoon child character with a white filled circular head, two small dark oval eyes, simple eyebrow strokes and a short curved smile. The torso is a short slim closed tapered shape with solid white fill inside its dark outline, wearing a small bright sky-blue backpack with two straps. ${LIMBS}` },
  { id: 'b-tun', builtin: true, name: 'Bạn Tũn', note: 'Bạn thân hay quên, vui tính', refs: [],
    anchor: `One small minimalist 2D cartoon child character with a white filled circular head, two small dark oval eyes, simple eyebrow strokes and a wide open grin, wearing a bright orange cap with a short brim facing forward. The torso is a short slim closed tapered shape with solid white fill inside its dark outline. ${LIMBS}` },
  { id: 'b-co-mai', builtin: true, name: 'Cô Mai', note: 'Cô giáo hiền, giải thích nhẹ nhàng', refs: [],
    anchor: `One adult minimalist 2D cartoon teacher character, taller than the children, with a white filled circular head, a simple solid dark short bob hair shape, two small dark oval eyes behind thin round glasses lines and a gentle curved smile. The torso is a slim closed tapered shape with solid white fill inside its dark outline, with a soft sunny-yellow cardigan outline over it. ${LIMBS}` },
];

export const BUILTIN_SETTINGS: LibItem[] = [
  { id: 's-lop', builtin: true, name: 'Lớp học tiểu học', note: 'Bàn ghế gỗ, bảng xanh, cửa sổ nắng', refs: [],
    anchor: 'A bright Vietnamese primary school classroom: rows of small light-wood desks and chairs, a dark green chalkboard with blank surface, large windows with soft morning sunlight and green trees outside, a small bookshelf and potted plant in the corner.' },
  { id: 's-san', builtin: true, name: 'Sân trường', note: 'Cây phượng, cột cờ, ghế đá', refs: [],
    anchor: 'A sunny Vietnamese primary schoolyard: a large flame tree with red blossoms, a flagpole, stone benches, a clean courtyard and the yellow school building in the background under a clear blue sky.' },
  { id: 's-goc-hoc', builtin: true, name: 'Góc học tập ở nhà', note: 'Bàn học, đèn bàn, kệ sách', refs: [],
    anchor: 'A cozy study corner at home: a small wooden desk with a desk lamp, a pencil cup and an open notebook, a low bookshelf with colorful book spines, a window with evening light and a small rug.' },
  { id: 's-cong-vien', builtin: true, name: 'Công viên', note: 'Bãi cỏ, hồ nhỏ, cây xanh', refs: [],
    anchor: 'A friendly neighborhood park: soft green grass, a small calm pond, leafy trees, a winding path and a few colorful flowers under gentle afternoon light.' },
  { id: 's-thu-vien', builtin: true, name: 'Thư viện', note: 'Kệ sách cao, bàn đọc', refs: [],
    anchor: 'A quiet school library: tall wooden bookshelves with colorful book spines, round reading tables, soft lamps and a cozy reading rug with cushions.' },
];

/** Tên gọi không dấu của nhân vật, dùng trong câu lệnh tiếng Anh ("Bé Chain" → "Be Chain") */
export const alias = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim();

export const styleOf = (k: string) => STYLES.find((s) => s.key === k) ?? STYLES[0];
export const voiceOf = (k: string) => VOICES.find((v) => v.key === k) ?? VOICES[0];
export const musicOf = (k: string) => MUSIC.find((m) => m.key === k) ?? MUSIC[0];
