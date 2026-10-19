// Danh mục Game trí tuệ. Dữ liệu tách riêng khỏi giao diện.
//
// Lưu ý: "lớp" (1–5) là lớp em đang học; "cấp độ" (L1–L5) là thang thử thách nội bộ do EduChain Kids
// đặt ra cho từng game. L1–L5 KHÔNG phải chuẩn hay cấp độ chính thức của Bộ Giáo dục và Đào tạo.

export type GameCategory = 'logic' | 'memory' | 'space' | 'math' | 'language';
export type GameFilter = 'all' | GameCategory;
export type GameLevel = 1 | 2 | 3 | 4 | 5;
export type GameId = 'pattern' | 'memory' | 'maze' | 'robot' | 'sudoku' | 'balance';
export type Grade = 1 | 2 | 3 | 4 | 5;

export const GAME_LEVELS: GameLevel[] = [1, 2, 3, 4, 5];
export const LEVEL_INFO: Record<GameLevel, { name: string; hint: string }> = {
  1: { name: 'Làm quen', hint: 'Bắt đầu nhẹ nhàng' },
  2: { name: 'Cơ bản', hint: 'Thêm một chút mới' },
  3: { name: 'Vận dụng', hint: 'Cần quan sát kĩ hơn' },
  4: { name: 'Thử thách', hint: 'Dành cho em thích nghĩ sâu' },
  5: { name: 'Mở rộng', hint: 'Thử thách lớn nhất' },
};
export const LEVEL_NOTE =
  'Cấp độ L1–L5 là thang thử thách riêng của EduChain Kids, không phải cấp độ chính thức của Bộ Giáo dục và Đào tạo. Em có thể chọn bất kì cấp độ nào.';

export const FILTERS: { id: GameFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'logic', label: 'Logic' },
  { id: 'memory', label: 'Trí nhớ' },
  { id: 'space', label: 'Không gian' },
  { id: 'math', label: 'Toán' },
  { id: 'language', label: 'Ngôn ngữ' },
];
export const CATEGORY_LABEL: Record<GameCategory, string> = {
  logic: 'Logic',
  memory: 'Trí nhớ',
  space: 'Không gian',
  math: 'Toán',
  language: 'Ngôn ngữ',
};

export const GRADES: Grade[] = [1, 2, 3, 4, 5];

export type GameInfo = {
  id: GameId;
  slug: string;
  title: string;
  summary: string;
  /** Nhóm kỹ năng để lọc; nhóm đầu tiên là nhóm chính */
  categories: GameCategory[];
  skills: string[];
  grades: Grade[];
  minutes: [number, number];
  /** 'beta' = đang thử nghiệm: chơi được đầy đủ nhưng còn đang hoàn thiện */
  status: 'ready' | 'beta';
  /** Cách tăng độ khó qua các cấp độ, ghi rõ để phụ huynh / thầy cô hiểu */
  difficulty: string;
};

export const GAMES: GameInfo[] = [
  {
    id: 'pattern',
    slug: 'tham-tu-quy-luat',
    title: 'Thám tử quy luật',
    summary: 'Quan sát dãy hình, tìm ra quy luật và chọn hình tiếp theo.',
    categories: ['logic', 'math'],
    skills: ['Quan sát', 'Nhận diện quy luật', 'Suy luận'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 8],
    status: 'ready',
    difficulty: 'Quy luật dài dần (AB → ABC → AABB), rồi đến quy luật tăng dần, xoay hướng và hai đặc điểm cùng lúc; số lựa chọn tăng từ 3 lên 4.',
  },
  {
    id: 'memory',
    slug: 'nha-vo-dich-tri-nho',
    title: 'Nhà vô địch trí nhớ',
    summary: 'Lật thẻ, ghi nhớ vị trí và tìm tất cả các cặp hình giống nhau.',
    categories: ['memory'],
    skills: ['Ghi nhớ', 'Tập trung', 'Kiên nhẫn'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 10],
    status: 'ready',
    difficulty: 'Số cặp thẻ tăng dần: 3 → 4 → 6 → 8 → 10 cặp. Không tính giờ.',
  },
  {
    id: 'maze',
    slug: 'me-cung',
    title: 'Mê cung phiêu lưu',
    summary: 'Dẫn Milo đi qua mê cung để đến ngôi sao ở đích.',
    categories: ['space', 'logic'],
    skills: ['Định hướng', 'Lập kế hoạch', 'Phương hướng trái – phải'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 10],
    status: 'beta',
    difficulty: 'Mê cung rộng dần: 5 × 5 → 6 × 6 → 8 × 8 → 10 × 10 → 12 × 12 ô. Không đếm ngược.',
  },
  {
    id: 'robot',
    slug: 'robot-lap-trinh',
    title: 'Robot lập trình',
    summary: 'Xếp thẻ lệnh thành chương trình để Milo robot nhặt hết ngôi sao mà không va vào đá.',
    categories: ['logic', 'space'],
    skills: ['Tư duy lập trình', 'Trình tự', 'Tìm và sửa lỗi'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 10],
    status: 'ready',
    difficulty: 'Sân rộng dần 4 × 4 → 6 × 6, nhiều sao và đá hơn, giới hạn số thẻ; L4 có thẻ "đi n bước" (vòng lặp), L5 robot có hướng nhìn: Tiến, Quay trái, Quay phải.',
  },
  {
    id: 'sudoku',
    slug: 'sudoku-mini',
    title: 'Sudoku mini',
    summary: 'Điền hình hoặc số sao cho mỗi hàng, mỗi cột, mỗi vùng đều đủ và không lặp lại.',
    categories: ['logic', 'math'],
    skills: ['Suy luận loại trừ', 'Quan sát', 'Kiên nhẫn'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 10],
    status: 'ready',
    difficulty: 'L1 lưới 4 × 4 bằng hình; L2–L3 lưới 4 × 4 bằng số, nhiều ô trống hơn; L4–L5 lưới 6 × 6. Đề tự sinh, luôn có đúng một lời giải.',
  },
  {
    id: 'balance',
    slug: 'can-thang-bang',
    title: 'Cân thăng bằng',
    summary: 'Tìm số còn thiếu để hai đĩa cân nặng bằng nhau — làm quen với phương trình.',
    categories: ['math', 'logic'],
    skills: ['Tính nhẩm', 'So sánh', 'Suy luận nhiều bước'],
    grades: [1, 2, 3, 4, 5],
    minutes: [5, 8],
    status: 'ready',
    difficulty: 'Phạm vi 10 → 20 → 100; từ quả cân có số đến hình chưa biết cân nặng, suy luận 2–3 bước có nhân, chia. Cân nghiêng cho biết cần số lớn hơn hay nhỏ hơn.',
  },
];

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id) as GameInfo;
export const gameHref = (g: GameInfo, level?: GameLevel) => `/tro-choi/${g.slug}${level ? `?cap=${level}` : ''}`;

/** Cấp độ gợi ý để bắt đầu theo lớp — chỉ là gợi ý, em luôn được chọn lại */
export const SUGGESTED_LEVEL: Record<Grade, GameLevel> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };

export const parseLevel = (v: string | string[] | null | undefined): GameLevel => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return n === 2 || n === 3 || n === 4 || n === 5 ? n : 1;
};
export const parseGrade = (v: string | string[] | null | undefined): Grade | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5 ? n : null;
};

export function filterGames(filter: GameFilter, grade: Grade | null): GameInfo[] {
  return GAMES.filter((g) => (filter === 'all' || g.categories.includes(filter)) && (grade === null || g.grades.includes(grade)));
}
