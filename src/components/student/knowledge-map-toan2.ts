// "Bản đồ kiến thức" — Toán 2: trạm ↔ mảng kiến thức của bài (toan2-plan.ts). Phép tính trong ví dụ đã tính lại cho đúng.
import { F, regions, type MapDef, type MapNode } from './knowledge-map-types';

const NODES: MapNode[] = [
  {
    id: 'so-100', name: 'Số đến 100, tia số', icon: F('abacus'), region: 'so', x: 100, y: 115, topics: ['num100', 'ray'],
    know: 'Đọc, viết, so sánh số đến 100. Số liền trước, số liền sau trên tia số.',
    tips: [{ name: 'Liền sau thêm 1, liền trước bớt 1', how: 'Số liền sau hơn số đó 1 đơn vị; số liền trước kém 1 đơn vị.', example: 'Liền sau của 49 là 50; liền trước của 70 là 69' }],
  },
  {
    id: 'thanh-phan', name: 'Số hạng, tổng, hơn kém', icon: F('puzzle-piece'), region: 'so', x: 240, y: 115, topics: ['parts', 'diff'],
    know: 'Số hạng + số hạng = tổng. Số bị trừ − số trừ = hiệu.',
    tips: [
      { name: 'Tổng là cả, số hạng là phần', how: 'Gộp các phần lại được tổng.', example: '25 + 13 = 38: 25 và 13 là số hạng, 38 là tổng' },
      { name: 'Hơn kém: lớn trừ bé', how: 'Muốn biết hơn kém bao nhiêu, lấy số lớn trừ số bé.', example: '15 hơn 9 là 15 − 9 = 6' },
    ],
  },
  {
    id: 'cong-tru-20', name: 'Cộng, trừ qua 10', icon: F('shopping-cart'), region: 'so', x: 380, y: 115, topics: ['add20', 'sub20', 'table20'],
    know: 'Bảng cộng, bảng trừ (qua 10) trong phạm vi 20.',
    tips: [
      { name: 'Làm tròn 10 khi cộng', how: 'Tách số sau để đủ 10 trước.', example: '8 + 5 = 8 + 2 + 3 = 10 + 3 = 13' },
      { name: 'Trừ về 10 trước', how: 'Trừ để còn 10, rồi trừ tiếp phần còn lại.', example: '13 − 5 = 13 − 3 − 2 = 10 − 2 = 8' },
    ],
  },
  {
    id: 'toan-don', name: 'Bài toán nhiều hơn, ít hơn', icon: F('red-question-mark'), region: 'so', x: 240, y: 235, topics: ['word20', 'more20', 'word100'],
    know: 'Bài toán thêm, bớt; nhiều hơn, ít hơn một số đơn vị.',
    tips: [{ name: 'Nhiều hơn thì cộng, ít hơn thì trừ', how: 'Gạch chân chữ "nhiều hơn" hay "ít hơn" để chọn phép tính.', example: 'Lan có 8 bông, Mai nhiều hơn 3 bông → Mai có 8 + 3 = 11 bông' }],
  },
  {
    id: 'cong-tru-100', name: 'Cộng, trừ có nhớ đến 100', icon: F('package'), region: 'so', x: 380, y: 235, topics: ['add100nc', 'add21', 'add22', 'sub21', 'sub22'],
    know: 'Đặt tính thẳng cột, tính từ phải sang trái, nhớ 1 sang hàng chục.',
    tips: [
      { name: 'Nhớ 1 sang hàng chục', how: 'Hàng đơn vị được 10 trở lên thì viết chữ số đơn vị, nhớ 1 sang hàng chục.', example: '38 + 25: 8 + 5 = 13, viết 3 nhớ 1; 3 + 2 + 1 = 6 → 63' },
      { name: 'Mượn 1 chục khi trừ', how: 'Hàng đơn vị không đủ trừ thì mượn 1 chục, rồi trả 1 ở hàng chục.', example: '52 − 17: 12 − 7 = 5; 5 − 1 − 1 = 3 → 35' },
    ],
  },

  {
    id: 'nhan', name: 'Phép nhân, thừa số, tích', icon: F('cupcake'), region: 'ps', x: 580, y: 115, topics: ['mulMeaning', 'mulParts'],
    know: 'Phép nhân là cách viết gọn phép cộng các số hạng bằng nhau. Thừa số × thừa số = tích.',
    tips: [{ name: 'Nhân là cộng lặp', how: 'Số được lấy mấy lần thì nhân với số lần đó.', example: '2 + 2 + 2 = 2 × 3 = 6' }],
  },
  {
    id: 'bang-nhan', name: 'Bảng nhân 2, 5', icon: F('raised-hand'), region: 'ps', x: 730, y: 115, topics: ['mul2', 'mul5', 'mulWord'],
    know: 'Thuộc bảng nhân 2, bảng nhân 5; giải bài toán có phép nhân.',
    tips: [{ name: 'Đếm thêm', how: 'Bảng nhân 5: đếm thêm 5 mỗi lần.', example: '5, 10, 15, 20 → 5 × 4 = 20' }],
  },
  {
    id: 'chia', name: 'Phép chia, bảng chia 2, 5', icon: F('pizza'), region: 'ps', x: 880, y: 115, topics: ['divMeaning', 'divParts', 'div2', 'div5'],
    know: 'Chia đều thành các phần bằng nhau. Số bị chia : số chia = thương.',
    tips: [{ name: 'Chia là ngược của nhân', how: 'Nhớ phép nhân để suy ra phép chia.', example: '2 × 5 = 10 nên 10 : 2 = 5 và 10 : 5 = 2' }],
  },
  {
    id: 'so-1000', name: 'Số có ba chữ số', icon: F('books'), region: 'ps', x: 580, y: 235, topics: ['place', 'round', 'roundCmp', 'num1000', 'expand'],
    know: 'Trăm, chục, đơn vị. Viết số thành tổng các trăm, chục, đơn vị.',
    tips: [{ name: 'Tách theo hàng', how: 'Mỗi chữ số có giá trị theo hàng của nó.', example: '465 = 400 + 60 + 5' }],
  },
  {
    id: 'so-sanh-1000', name: 'So sánh số có ba chữ số', icon: F('balance-scale'), region: 'ps', x: 730, y: 235, topics: ['cmp1000'],
    know: 'So sánh từ hàng trăm, rồi hàng chục, rồi hàng đơn vị.',
    tips: [{ name: 'So từ hàng trăm', how: 'Hàng trăm bằng nhau thì so tiếp hàng chục.', example: '529 < 592 vì cùng 5 trăm, 2 chục < 9 chục' }],
  },
  {
    id: 'cong-tru-1000', name: 'Cộng, trừ đến 1 000', icon: F('shopping-bags'), region: 'ps', x: 650, y: 345, topics: ['add3nc', 'add3c', 'sub3nc', 'sub3c', 'word1000'],
    know: 'Đặt tính thẳng cột, cộng, trừ (có nhớ) trong phạm vi 1 000.',
    tips: [{ name: 'Thử lại bằng phép ngược', how: 'Trừ xong, lấy hiệu cộng số trừ để kiểm tra.', example: '543 − 218 = 325; thử: 325 + 218 = 543 ✓' }],
  },

  {
    id: 'hinh', name: 'Đoạn thẳng, đường gấp khúc', icon: F('pencil'), region: 'hinh', x: 100, y: 425, topics: ['geo', 'polyline'],
    know: 'Điểm, đoạn thẳng, đường thẳng, ba điểm thẳng hàng. Độ dài đường gấp khúc.',
    tips: [{ name: 'Cộng từng đoạn', how: 'Độ dài đường gấp khúc là tổng độ dài các đoạn thẳng.', example: '3 cm + 4 cm + 5 cm = 12 cm' }],
  },
  {
    id: 'tu-giac', name: 'Tứ giác, khối trụ, khối cầu', icon: F('soccer-ball'), region: 'hinh', x: 240, y: 425, topics: ['quad', 'solid'],
    know: 'Hình tứ giác có 4 cạnh, 4 đỉnh. Nhận ra khối trụ, khối cầu.',
    tips: [{ name: 'Tìm đồ vật quanh em', how: 'Nghĩ tới đồ vật có cùng hình dạng.', example: 'Quả bóng là khối cầu; lon nước là khối trụ' }],
  },
  {
    id: 'kg-lit', name: 'Ki-lô-gam, lít', icon: F('glass-of-milk'), region: 'hinh', x: 380, y: 425, topics: ['kg', 'litre'],
    know: 'Cân nặng đo bằng ki-lô-gam (kg). Chất lỏng đo bằng lít (l).',
    tips: [{ name: 'Cùng đơn vị mới cộng', how: 'Cộng, trừ như số thường rồi viết đơn vị phía sau.', example: '5 kg + 3 kg = 8 kg' }],
  },
  {
    id: 'do-dai', name: 'dm, m, km', icon: F('straight-ruler'), region: 'hinh', x: 100, y: 545, topics: ['length'],
    know: '1 dm = 10 cm; 1 m = 10 dm = 100 cm; 1 km = 1 000 m.',
    tips: [{ name: 'Bậc thang gấp 10', how: 'Từ dm xuống cm thì nhân 10.', example: '3 dm = 30 cm' }],
  },
  {
    id: 'gio-lich', name: 'Giờ, ngày, tháng', icon: F('alarm-clock'), region: 'hinh', x: 240, y: 545, topics: ['time', 'date'],
    know: '1 ngày có 24 giờ; 1 giờ = 60 phút. Xem lịch tháng.',
    tips: [{ name: 'Giờ chiều bớt 12', how: 'Giờ buổi chiều, tối: lấy số giờ trừ 12.', example: '15 giờ là 3 giờ chiều' }],
  },
  {
    id: 'tien', name: 'Tiền Việt Nam', icon: F('purse'), region: 'hinh', x: 380, y: 545, topics: ['money'],
    know: 'Nhận biết tờ tiền 100, 200, 500, 1 000 đồng.',
    tips: [{ name: 'Gộp tờ tiền', how: 'Cộng giá trị các tờ tiền lại.', example: '2 tờ 500 đồng = 1 000 đồng' }],
  },

  {
    id: 'kiem-dem', name: 'Kiểm đếm, biểu đồ tranh', icon: F('notebook'), region: 'tk', x: 640, y: 520, topics: ['tally', 'picto'],
    know: 'Thu thập, phân loại, kiểm đếm số liệu. Đọc biểu đồ tranh.',
    tips: [{ name: 'Gạch theo bó 5', how: 'Gạch 4 vạch đứng, vạch thứ 5 gạch ngang để đếm nhanh.', example: '7 bạn thích mèo → 1 bó 5 và 2 vạch' }],
  },
  {
    id: 'kha-nang', name: 'Chắc chắn, có thể, không thể', icon: F('game-die'), region: 'tk', x: 840, y: 520, topics: ['chance'],
    know: 'Nói được một việc là chắc chắn, có thể hay không thể xảy ra.',
    tips: [{ name: 'Nhìn kỹ trong túi', how: 'Chỉ có một loại thì chắc chắn; không có loại đó thì không thể.', example: 'Túi chỉ có bi đỏ: lấy được bi đỏ là chắc chắn, bi xanh là không thể' }],
  },
];

export const MAP_TOAN2: MapDef = {
  grade: 2,
  title: 'Toán 2',
  regions: regions('Số và phép cộng, trừ', 'Nhân, chia và số đến 1 000', 'Hình học và đo lường', 'Thống kê và khả năng'),
  nodes: NODES,
  links: [
    { from: 'so-100', to: 'thanh-phan' },
    { from: 'thanh-phan', to: 'cong-tru-20' },
    { from: 'cong-tru-20', to: 'toan-don' },
    { from: 'cong-tru-20', to: 'cong-tru-100' },
    { from: 'cong-tru-100', to: 'cong-tru-1000' },
    { from: 'nhan', to: 'bang-nhan' },
    { from: 'bang-nhan', to: 'chia' },
    { from: 'so-1000', to: 'so-sanh-1000' },
    { from: 'so-1000', to: 'cong-tru-1000' },
    { from: 'hinh', to: 'tu-giac' },
    { from: 'kiem-dem', to: 'kha-nang' },
  ],
};
