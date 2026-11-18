// "Bản đồ kiến thức" — Toán 3: trạm ↔ mảng kiến thức của bài (toan3-plan.ts). Phép tính trong ví dụ đã tính lại cho đúng.
import { F, regions, type MapDef, type MapNode } from './knowledge-map-types';

const NODES: MapNode[] = [
  {
    id: 'so-1000', name: 'Số và cộng, trừ đến 1 000', icon: F('abacus'), region: 'so', x: 100, y: 115, topics: ['num1000', 'addsub1000', 'findAddSub'],
    know: 'Ôn số đến 1 000, cộng, trừ; tìm thành phần chưa biết của phép cộng, phép trừ.',
    tips: [{ name: 'Tìm số hạng: lấy tổng trừ', how: 'Số hạng chưa biết = tổng − số hạng đã biết.', example: '? + 45 = 120 → 120 − 45 = 75' }],
  },
  {
    id: 'bang-nhan-chia', name: 'Bảng nhân, bảng chia 2–9', icon: F('raised-hand'), region: 'so', x: 240, y: 115, topics: ['table', 'findMulDiv'],
    know: 'Thuộc các bảng nhân, bảng chia từ 2 đến 9; tìm thừa số, số bị chia, số chia.',
    tips: [
      { name: 'Đếm thêm', how: 'Bảng nhân 6: mỗi lần đếm thêm 6.', example: '6, 12, 18, 24 → 6 × 4 = 24' },
      { name: 'Tìm thừa số: lấy tích chia', how: 'Thừa số chưa biết = tích : thừa số đã biết.', example: '? × 7 = 56 → 56 : 7 = 8' },
    ],
  },
  {
    id: 'nhan-chia-1cs', name: 'Nhân, chia với số có 1 chữ số', icon: F('divide'), region: 'so', x: 380, y: 115, topics: ['mul2d', 'div2d', 'remainder', 'mul3d', 'div3d'],
    know: 'Nhân, chia số có hai, ba chữ số với số có một chữ số; phép chia có dư.',
    tips: [
      { name: 'Nhân từ phải sang trái', how: 'Nhân hàng đơn vị trước, được bao nhiêu chục thì nhớ sang hàng chục.', example: '46 × 3: 6 × 3 = 18, viết 8 nhớ 1; 4 × 3 + 1 = 13 → 138' },
      { name: 'Số dư bé hơn số chia', how: 'Chia xong, nhớ kiểm tra số dư luôn bé hơn số chia.', example: '29 : 4 = 7 (dư 1)' },
    ],
  },
  {
    id: 'mot-phan', name: 'Một phần mấy', icon: F('pizza'), region: 'so', x: 170, y: 235, topics: ['fraction'],
    know: 'Chia đều thành các phần bằng nhau, lấy một phần.',
    tips: [{ name: 'Chia đều', how: 'Muốn tìm một phần mấy của một số, lấy số đó chia cho số phần.', example: '1/3 của 12 cái kẹo là 12 : 3 = 4 cái' }],
  },
  {
    id: 'gap-giam', name: 'Gấp, giảm, so sánh số lần', icon: F('balance-scale'), region: 'so', x: 330, y: 235, topics: ['times', 'reduce', 'ratio'],
    know: 'Gấp một số lên nhiều lần, giảm một số đi nhiều lần, số lớn gấp mấy lần số bé.',
    tips: [
      { name: 'Gấp thì nhân, giảm thì chia', how: 'Gấp lên mấy lần thì nhân; giảm đi mấy lần thì chia.', example: '6 gấp 4 lần là 24; 24 giảm 3 lần là 8' },
      { name: 'Gấp mấy lần: lớn chia bé', how: 'Lấy số lớn chia cho số bé.', example: '35 : 7 = 5 → 35 gấp 5 lần 7' },
    ],
  },

  {
    id: 'so-10k', name: 'Số đến 10 000, số La Mã', icon: F('books'), region: 'ps', x: 580, y: 115, topics: ['num10k', 'cmp10k', 'roman', 'round'],
    know: 'Số có bốn chữ số, so sánh, làm tròn đến hàng chục, hàng trăm; chữ số La Mã.',
    tips: [{ name: 'I là 1, V là 5, X là 10', how: 'Chữ nhỏ đứng trước chữ lớn thì trừ, đứng sau thì cộng.', example: 'IV = 4, VI = 6, IX = 9, XI = 11' }],
  },
  {
    id: 'so-100k', name: 'Số đến 100 000', icon: F('office-building'), region: 'ps', x: 730, y: 115, topics: ['num100k', 'cmp100k', 'round100k'],
    know: 'Số có năm chữ số; so sánh; làm tròn đến hàng nghìn, hàng chục nghìn.',
    tips: [{ name: 'Nhìn chữ số đứng sau', how: 'Làm tròn đến hàng nghìn: nhìn hàng trăm, bé hơn 5 thì làm tròn xuống.', example: '45 312 làm tròn đến hàng nghìn được 45 000' }],
  },
  {
    id: 'cong-tru-100k', name: 'Cộng, trừ đến 100 000', icon: F('shopping-cart'), region: 'ps', x: 880, y: 115, topics: ['add10k', 'sub10k', 'add100k', 'sub100k'],
    know: 'Đặt tính thẳng cột, cộng, trừ có nhớ trong phạm vi 100 000.',
    tips: [{ name: 'Thử lại bằng phép ngược', how: 'Lấy hiệu cộng số trừ, ra số bị trừ là đúng.', example: '63 528 − 27 345 = 36 183; thử: 36 183 + 27 345 = 63 528 ✓' }],
  },
  {
    id: 'nhan-chia-lon', name: 'Nhân, chia số có 4–5 chữ số', icon: F('package'), region: 'ps', x: 650, y: 235, topics: ['mul4d', 'div4d', 'mul5d', 'div5d'],
    know: 'Nhân, chia số có bốn, năm chữ số với (cho) số có một chữ số.',
    tips: [{ name: 'Thử lại chia bằng nhân', how: 'Lấy thương nhân số chia (cộng số dư nếu có), ra số bị chia là đúng.', example: '8 436 : 4 = 2 109; thử: 2 109 × 4 = 8 436 ✓' }],
  },
  {
    id: 'bieu-thuc', name: 'Biểu thức, bài toán hai bước', icon: F('red-question-mark'), region: 'ps', x: 810, y: 235, topics: ['expr', 'twoStep'],
    know: 'Tính giá trị biểu thức số; giải bài toán bằng hai bước tính.',
    tips: [
      { name: 'Nhân, chia trước', how: 'Không có ngoặc: nhân, chia trước; cộng, trừ sau.', example: '20 + 5 × 4 = 20 + 20 = 40' },
      { name: 'Trong ngoặc trước', how: 'Có ngoặc thì tính trong ngoặc trước.', example: '(20 + 5) × 4 = 25 × 4 = 100' },
    ],
  },

  {
    id: 'hinh', name: 'Trung điểm, góc, hình tròn', icon: F('triangular-ruler'), region: 'hinh', x: 100, y: 425, topics: ['geoReview', 'midpoint', 'circle', 'angle'],
    know: 'Trung điểm của đoạn thẳng; tâm, bán kính, đường kính; góc vuông, góc không vuông.',
    tips: [
      { name: 'Trung điểm chia đôi', how: 'Trung điểm chia đoạn thẳng thành hai đoạn dài bằng nhau.', example: 'AB = 8 cm, M là trung điểm → AM = 4 cm' },
      { name: 'Đường kính gấp đôi bán kính', how: 'Đường kính = bán kính × 2.', example: 'Bán kính 3 cm → đường kính 6 cm' },
    ],
  },
  {
    id: 'hinh-phang', name: 'Tam giác, tứ giác, khối', icon: F('wrapped-gift'), region: 'hinh', x: 240, y: 425, topics: ['shapes', 'solids'],
    know: 'Hình tam giác, tứ giác, hình chữ nhật, hình vuông; khối lập phương, khối hộp chữ nhật.',
    tips: [{ name: 'Đếm mặt, đỉnh, cạnh', how: 'Chỉ tay vào từng mặt, từng đỉnh khi đếm để không sót.', example: 'Khối lập phương có 6 mặt, 8 đỉnh, 12 cạnh' }],
  },
  {
    id: 'chu-vi-dt', name: 'Chu vi, diện tích', icon: F('framed-picture'), region: 'hinh', x: 380, y: 425, topics: ['perimeter', 'areaIntro', 'area'],
    know: 'Chu vi là tổng độ dài các cạnh. Diện tích hình chữ nhật = dài × rộng.',
    tips: [{ name: 'Đi một vòng hay phủ kín', how: 'Chu vi là đi một vòng quanh hình; diện tích là phần phủ kín bên trong.', example: 'Dài 5 cm, rộng 3 cm: chu vi (5 + 3) × 2 = 16 cm; diện tích 5 × 3 = 15 cm²' }],
  },
  {
    id: 'don-vi', name: 'mm, g, ml, độ C', icon: F('glass-of-milk'), region: 'hinh', x: 100, y: 545, topics: ['mm', 'gram', 'ml', 'temp'],
    know: '1 cm = 10 mm; 1 kg = 1 000 g; 1 l = 1 000 ml. Đo nhiệt độ bằng độ C.',
    tips: [{ name: 'Nhớ số 1 000', how: 'Từ kg sang g, từ l sang ml đều nhân 1 000.', example: '2 kg = 2 000 g; 3 l = 3 000 ml' }],
  },
  {
    id: 'gio-tien', name: 'Đồng hồ, tháng năm, tiền', icon: F('alarm-clock'), region: 'hinh', x: 240, y: 545, topics: ['clock', 'month', 'money'],
    know: 'Xem giờ chính xác đến phút; các tháng trong năm; tiền Việt Nam.',
    tips: [{ name: 'Mỗi số cách 5 phút', how: 'Kim dài chỉ số 1 là 5 phút, số 3 là 15 phút, số 6 là 30 phút.', example: 'Kim ngắn qua số 8, kim dài chỉ số 3 → 8 giờ 15 phút' }],
  },

  {
    id: 'bang-so-lieu', name: 'Bảng số liệu', icon: F('notebook'), region: 'tk', x: 640, y: 520, topics: ['dataTable'],
    know: 'Thu thập, phân loại, ghi chép số liệu; đọc bảng số liệu.',
    tips: [{ name: 'Dò hàng rồi dò cột', how: 'Tìm đúng hàng, tìm đúng cột; ô giao nhau là số cần đọc.', example: 'Hàng "Lớp 3A", cột "Bóng đá" → ô giao nhau cho biết số bạn' }],
  },
  {
    id: 'kha-nang', name: 'Khả năng xảy ra', icon: F('game-die'), region: 'tk', x: 840, y: 520, topics: ['chance'],
    know: 'Một sự kiện chắc chắn, có thể hay không thể xảy ra.',
    tips: [{ name: 'Nhìn kỹ trong hộp', how: 'Có loại đó thì có thể; không có loại đó thì không thể.', example: 'Hộp có bi xanh và bi đỏ: lấy được bi vàng là không thể' }],
  },
];

export const MAP_TOAN3: MapDef = {
  grade: 3,
  title: 'Toán 3',
  regions: regions('Số và phép tính đến 1 000', 'Số đến 100 000', 'Hình học và đo lường', 'Thống kê và khả năng'),
  nodes: NODES,
  links: [
    { from: 'so-1000', to: 'bang-nhan-chia' },
    { from: 'bang-nhan-chia', to: 'nhan-chia-1cs' },
    { from: 'bang-nhan-chia', to: 'mot-phan' },
    { from: 'nhan-chia-1cs', to: 'gap-giam' },
    { from: 'nhan-chia-1cs', to: 'nhan-chia-lon' },
    { from: 'so-10k', to: 'so-100k' },
    { from: 'so-100k', to: 'cong-tru-100k' },
    { from: 'cong-tru-100k', to: 'bieu-thuc' },
    { from: 'nhan-chia-lon', to: 'bieu-thuc' },
    { from: 'hinh', to: 'hinh-phang' },
    { from: 'hinh-phang', to: 'chu-vi-dt' },
    { from: 'bang-so-lieu', to: 'kha-nang' },
  ],
};
