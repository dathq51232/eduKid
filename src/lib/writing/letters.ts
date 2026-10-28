// Nội dung luyện chữ theo lớp: chữ cái, chữ số, vần, từ ngữ, chữ hoa, câu ứng dụng (tục ngữ, ca dao dân gian).
export type WriteSet = { id: string; label: string; grades: number[]; items: string[]; repeat: boolean };

export const WRITE_SETS: WriteSet[] = [
  { id: 'thuong', label: 'Chữ cái thường', grades: [1, 2], repeat: true, items: 'a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y'.split(' ') },
  { id: 'so', label: 'Chữ số', grades: [1, 2], repeat: true, items: '0 1 2 3 4 5 6 7 8 9'.split(' ') },
  { id: 'van', label: 'Vần', grades: [1], repeat: true, items: ['an', 'ăn', 'ân', 'on', 'ôn', 'ơn', 'en', 'ên', 'in', 'un', 'ang', 'ăng', 'âng', 'ong', 'ông', 'ung', 'ưng', 'anh', 'inh', 'ach', 'ich', 'oa', 'oe', 'uy'] },
  { id: 'tu', label: 'Từ ngữ', grades: [1, 2], repeat: true, items: ['bà', 'bé', 'cá', 'hoa', 'mẹ', 'nhà', 'quê', 'trường', 'cô giáo', 'bạn bè', 'học tập', 'chăm ngoan'] },
  { id: 'hoa', label: 'Chữ hoa', grades: [2, 3, 4, 5], repeat: true, items: 'A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y'.split(' ') },
  {
    id: 'cau', label: 'Câu ứng dụng', grades: [2, 3, 4, 5], repeat: false,
    items: ['Anh em thuận hoà', 'Uống nước nhớ nguồn', 'Ăn quả nhớ kẻ trồng cây', 'Có công mài sắt có ngày nên kim', 'Lá lành đùm lá rách',
      'Một cây làm chẳng nên non', 'Học thầy không tày học bạn', 'Tốt gỗ hơn tốt nước sơn', 'Gần mực thì đen, gần đèn thì sáng', 'Đi một ngày đàng học một sàng khôn'],
  },
];

export const setsForGrade = (g: number) => WRITE_SETS.filter((s) => s.grades.includes(g));
