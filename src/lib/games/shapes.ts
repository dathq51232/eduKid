// Bộ hình + màu dùng chung cho các game (Thám tử quy luật, Nhà vô địch trí nhớ, hình minh họa thẻ game).
// Mỗi hình đều có tên tiếng Việt để đọc cho trình đọc màn hình; hình khác nhau cả về dáng lẫn màu,
// nên em nào khó phân biệt màu vẫn nhận ra được bằng hình dáng.

export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'hexagon', 'moon', 'drop', 'plus'] as const;
export type Shape = (typeof SHAPES)[number];

export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const;
export type ShapeColor = (typeof COLORS)[number];

export const SHAPE_NAME: Record<Shape, string> = {
  circle: 'hình tròn',
  square: 'hình vuông',
  triangle: 'hình tam giác',
  star: 'ngôi sao',
  heart: 'trái tim',
  diamond: 'hình thoi',
  hexagon: 'hình lục giác',
  moon: 'mặt trăng',
  drop: 'giọt nước',
  plus: 'dấu cộng',
};

export const COLOR_NAME: Record<ShapeColor, string> = {
  red: 'đỏ',
  blue: 'xanh dương',
  green: 'xanh lá',
  yellow: 'vàng',
  purple: 'tím',
  orange: 'cam',
};

export const COLOR_HEX: Record<ShapeColor, string> = {
  red: '#e2483d',
  blue: '#2f6fed',
  green: '#1f9d6b',
  yellow: '#f5b82e',
  purple: '#8b5cf6',
  orange: '#f08a24',
};

/** Hướng mũi tên: 0 = lên, 1 = phải, 2 = xuống, 3 = trái */
export type Direction = 0 | 1 | 2 | 3;
export const DIRECTION_NAME: Record<Direction, string> = { 0: 'lên', 1: 'sang phải', 2: 'xuống', 3: 'sang trái' };

export const shapeLabel = (shape: Shape, color: ShapeColor) => `${SHAPE_NAME[shape]} màu ${COLOR_NAME[color]}`;
