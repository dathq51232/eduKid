// "Bản đồ kiến thức" — Toán 1. Bài Toán 1 chưa gắn mảng kiến thức nên trạm nối thẳng với số bài ("b1" = Bài 1),
// kể cả các bài Luyện tập chung / Ôn tập của trạm. Phép tính trong ví dụ đã tính lại cho đúng.
import { F, regions, type MapDef, type MapNode } from './knowledge-map-types';

const b = (...nos: number[]) => nos.map((n) => `b${n}`);

const NODES: MapNode[] = [
  {
    id: 'so-10', name: 'Các số đến 10', icon: F('abacus'), region: 'so', x: 100, y: 115, topics: b(1, 2, 6, 17, 20),
    know: 'Đếm, đọc, viết các số từ 0 đến 10.',
    tips: [{ name: 'Đếm bằng ngón tay', how: 'Giơ từng ngón tay, vừa giơ vừa đếm to.', example: '7 là một bàn tay (5 ngón) và thêm 2 ngón' }],
  },
  {
    id: 'so-sanh-10', name: 'Nhiều hơn, ít hơn', icon: F('balance-scale'), region: 'so', x: 240, y: 115, topics: b(3, 4, 6),
    know: 'So sánh hai nhóm đồ vật, so sánh hai số bằng dấu >, <, =.',
    tips: [
      { name: 'Nối từng cặp', how: 'Nối mỗi đồ vật nhóm này với một đồ vật nhóm kia. Nhóm nào còn thừa là nhiều hơn.', example: '5 quả táo và 3 quả cam → 5 > 3' },
      { name: 'Miệng cá sấu', how: 'Dấu > và < luôn há miệng về phía số lớn hơn.', example: '4 < 6' },
    ],
  },
  {
    id: 'may-va-may', name: 'Mấy và mấy', icon: F('puzzle-piece'), region: 'so', x: 380, y: 115, topics: b(5, 6),
    know: 'Tách một số thành hai phần.',
    tips: [{ name: 'Tách que tính', how: 'Lấy đủ que tính rồi chia thành hai nhóm, đếm từng nhóm.', example: '6 gồm 2 và 4' }],
  },
  {
    id: 'so-100', name: 'Số có hai chữ số', icon: F('books'), region: 'so', x: 100, y: 235, topics: b(21, 23, 24, 39, 41),
    know: 'Số có hai chữ số gồm chục và đơn vị. Bảng các số từ 1 đến 100.',
    tips: [{ name: 'Bó chục', how: 'Bó 10 que tính thành 1 chục, đếm số bó rồi đếm que lẻ.', example: '34 gồm 3 chục và 4 đơn vị' }],
  },
  {
    id: 'so-sanh-100', name: 'So sánh số có hai chữ số', icon: F('triangular-flag'), region: 'so', x: 240, y: 235, topics: b(22, 24),
    know: 'So sánh số chục trước. Số chục bằng nhau thì so sánh số đơn vị.',
    tips: [{ name: 'So hàng chục trước', how: 'Số nào nhiều chục hơn thì lớn hơn.', example: '45 > 39 vì 4 chục > 3 chục' }],
  },

  {
    id: 'cong-10', name: 'Cộng trong phạm vi 10', icon: F('shopping-cart'), region: 'ps', x: 580, y: 115, topics: b(10, 12, 13, 18, 20, 38),
    know: 'Gộp hai nhóm lại thì dùng phép cộng.',
    tips: [
      { name: 'Đếm thêm', how: 'Bắt đầu từ số lớn hơn rồi đếm thêm.', example: '6 + 3: đếm 7, 8, 9 → 6 + 3 = 9' },
      { name: 'Đổi chỗ vẫn bằng', how: 'Đổi chỗ hai số trong phép cộng, kết quả không đổi.', example: '2 + 7 = 7 + 2 = 9' },
    ],
  },
  {
    id: 'cong-100', name: 'Cộng số có hai chữ số', icon: F('package'), region: 'ps', x: 730, y: 115, topics: b(29, 30, 33, 39, 41),
    know: 'Đặt tính thẳng cột. Cộng đơn vị với đơn vị, chục với chục.',
    tips: [{ name: 'Chục với chục, đơn vị với đơn vị', how: 'Cộng số đơn vị trước, rồi cộng số chục.', example: '32 + 25 = 57' }],
  },
  {
    id: 'tru-10', name: 'Trừ trong phạm vi 10', icon: F('basket'), region: 'ps', x: 580, y: 235, topics: b(11, 12, 13, 18, 20, 38),
    know: 'Bớt đi một phần thì dùng phép trừ.',
    tips: [
      { name: 'Bớt rồi đếm phần còn lại', how: 'Che bớt số đồ vật bị lấy đi, đếm số còn lại.', example: 'Có 8 quả, ăn 3 quả: 8 − 3 = 5' },
      { name: 'Thử lại bằng phép cộng', how: 'Lấy kết quả cộng số bị bớt, ra số ban đầu là đúng.', example: '5 + 3 = 8 ✓' },
    ],
  },
  {
    id: 'tru-100', name: 'Trừ số có hai chữ số', icon: F('shopping-bags'), region: 'ps', x: 730, y: 235, topics: b(31, 32, 33, 39, 41),
    know: 'Đặt tính thẳng cột. Trừ đơn vị trước, rồi trừ chục.',
    tips: [{ name: 'Trừ từ phải sang trái', how: 'Trừ hàng đơn vị trước, sau đó trừ hàng chục.', example: '68 − 23 = 45' }],
  },

  {
    id: 'hinh-phang', name: 'Vuông, tròn, tam giác, chữ nhật', icon: F('large-orange-diamond'), region: 'hinh', x: 100, y: 425, topics: b(7, 8, 9, 19, 20, 40),
    know: 'Nhận ra hình vuông, hình tròn, hình tam giác, hình chữ nhật.',
    tips: [{ name: 'Đếm cạnh', how: 'Hình tam giác có 3 cạnh. Hình vuông, hình chữ nhật có 4 cạnh. Hình tròn không có cạnh.', example: 'Mặt đồng hồ treo tường có dạng hình tròn' }],
  },
  {
    id: 'khoi', name: 'Khối lập phương, khối hộp', icon: F('wrapped-gift'), region: 'hinh', x: 240, y: 425, topics: b(14, 16, 19),
    know: 'Nhận ra khối lập phương, khối hộp chữ nhật.',
    tips: [{ name: 'Nhìn các mặt', how: 'Khối lập phương có các mặt đều là hình vuông.', example: 'Con xúc xắc có dạng khối lập phương' }],
  },
  {
    id: 'vi-tri', name: 'Trên, dưới, trái, phải', icon: F('right-arrow'), region: 'hinh', x: 380, y: 425, topics: b(15, 16),
    know: 'Trên – dưới, trước – sau, bên trái – bên phải, ở giữa.',
    tips: [{ name: 'Đứng vào chỗ bạn', how: 'Tưởng tượng mình đứng đúng chỗ bạn trong tranh, quay cùng hướng rồi mới nói trái, phải.', example: 'Quả bóng ở dưới gầm bàn' }],
  },

  {
    id: 'do-dai', name: 'Dài hơn, ngắn hơn, đo cm', icon: F('straight-ruler'), region: 'tk', x: 580, y: 520, topics: b(25, 26, 27, 28, 40, 41),
    know: 'So sánh độ dài. Đo độ dài bằng xăng-ti-mét (cm).',
    tips: [{ name: 'Đặt vạch 0 ở đầu vật', how: 'Đặt vạch số 0 của thước thẳng với một đầu vật rồi đọc số ở đầu kia.', example: 'Đầu kia chạm vạch 15 → bút chì dài 15 cm' }],
  },
  {
    id: 'gio', name: 'Xem giờ đúng', icon: F('alarm-clock'), region: 'tk', x: 730, y: 520, topics: b(34, 36, 37),
    know: 'Kim dài chỉ số 12, kim ngắn chỉ số mấy thì là mấy giờ.',
    tips: [{ name: 'Nhìn kim ngắn', how: 'Khi kim dài chỉ số 12, kim ngắn chỉ số nào là bấy nhiêu giờ.', example: 'Kim ngắn chỉ 3, kim dài chỉ 12 → 3 giờ' }],
  },
  {
    id: 'lich', name: 'Các ngày trong tuần', icon: F('calendar'), region: 'tk', x: 880, y: 520, topics: b(35, 36, 37),
    know: 'Một tuần có 7 ngày: Thứ Hai đến Chủ nhật.',
    tips: [{ name: 'Vòng 7 ngày', how: 'Đọc thuộc Thứ Hai → … → Chủ nhật, rồi quay lại Thứ Hai.', example: 'Hôm nay Thứ Ba thì ngày mai là Thứ Tư' }],
  },
];

export const MAP_TOAN1: MapDef = {
  grade: 1,
  title: 'Toán 1',
  regions: regions('Các số', 'Phép cộng, phép trừ', 'Hình học', 'Đo độ dài và thời gian'),
  nodes: NODES,
  links: [
    { from: 'so-10', to: 'so-sanh-10' },
    { from: 'so-sanh-10', to: 'may-va-may' },
    { from: 'so-10', to: 'so-100' },
    { from: 'so-100', to: 'so-sanh-100' },
    { from: 'may-va-may', to: 'cong-10' },
    { from: 'may-va-may', to: 'tru-10' },
    { from: 'cong-10', to: 'cong-100' },
    { from: 'tru-10', to: 'tru-100' },
    { from: 'hinh-phang', to: 'khoi' },
    { from: 'gio', to: 'lich' },
  ],
};
