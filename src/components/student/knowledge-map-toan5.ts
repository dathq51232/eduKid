// "Bản đồ kiến thức" — Toán 5: trạm ↔ mảng kiến thức của bài (toan5-plan.ts). Phép tính trong ví dụ đã tính lại cho đúng.
import { F, regions, type MapDef, type MapNode } from './knowledge-map-types';

const NODES: MapNode[] = [
  {
    id: 'so-tu-nhien', name: 'Số tự nhiên', icon: F('abacus'), region: 'so', x: 100, y: 115, topics: ['natRev', 'natOps'],
    know: 'Ôn đọc, viết, so sánh và bốn phép tính với số tự nhiên.',
    tips: [{ name: 'Ghép thành số tròn', how: 'Ghép các thừa số cho ra 10, 100 để nhân nhẩm.', example: '25 × 36 = 25 × 4 × 9 = 100 × 9 = 900' }],
  },
  {
    id: 'phan-so', name: 'Phân số, hỗn số', icon: F('pizza'), region: 'so', x: 240, y: 115, topics: ['fracRev', 'decFrac', 'fracOps', 'fracAddDiff', 'mixed'],
    know: 'Cộng, trừ phân số khác mẫu số; phân số thập phân; hỗn số.',
    tips: [
      { name: 'Quy đồng rồi cộng', how: 'Đưa về cùng mẫu số rồi cộng tử số.', example: '2/3 + 1/4 = 8/12 + 3/12 = 11/12' },
      { name: 'Đổi hỗn số ra phân số', how: 'Phần nguyên nhân mẫu số rồi cộng tử số, giữ nguyên mẫu số.', example: '2 1/3 = (2 × 3 + 1)/3 = 7/3' },
    ],
  },
  {
    id: 'stp', name: 'Số thập phân', icon: F('books'), region: 'so', x: 380, y: 115, topics: ['decConcept', 'decCompare', 'decMeasure', 'decRound'],
    know: 'Đọc, viết, so sánh, làm tròn số thập phân; viết số đo dưới dạng số thập phân.',
    tips: [
      { name: 'Thêm 0 cho đủ chữ số', how: 'Thêm chữ số 0 vào cuối phần thập phân cho dài bằng nhau rồi so sánh.', example: '3,5 = 3,50 > 3,48' },
      { name: 'Làm tròn: nhìn chữ số đứng sau', how: 'Chữ số đứng sau từ 5 trở lên thì làm tròn lên.', example: '4,27 làm tròn đến hàng phần mười được 4,3' },
    ],
  },
  {
    id: 'cong-tru-stp', name: 'Cộng, trừ số thập phân', icon: F('shopping-cart'), region: 'so', x: 240, y: 235, topics: ['decAdd', 'decSub'],
    know: 'Đặt tính sao cho các dấu phẩy thẳng cột, tính như số tự nhiên.',
    tips: [{ name: 'Dấu phẩy thẳng cột', how: 'Viết thêm 0 cho đủ chữ số rồi đặt dấu phẩy thẳng hàng.', example: '8 − 2,35 = 8,00 − 2,35 = 5,65' }],
  },
  {
    id: 'nhan-chia-stp', name: 'Nhân, chia số thập phân', icon: F('divide'), region: 'so', x: 380, y: 235, topics: ['decMul', 'decDiv', 'decPow10'],
    know: 'Nhân, chia số thập phân; nhân, chia với 10, 100, 1 000 và 0,1; 0,01…',
    tips: [
      { name: 'Đếm chữ số sau dấu phẩy', how: 'Nhân như số tự nhiên, rồi đếm tổng số chữ số ở phần thập phân để đặt dấu phẩy.', example: '1,2 × 0,3 = 0,36' },
      { name: 'Nhân 10 dời phẩy sang phải', how: 'Nhân với 10 dời dấu phẩy sang phải 1 chữ số; chia 10 dời sang trái.', example: '3,45 × 10 = 34,5; 3,45 : 10 = 0,345' },
    ],
  },

  {
    id: 'ti-so', name: 'Tỉ số, tỉ lệ bản đồ', icon: F('balance-scale'), region: 'ps', x: 580, y: 115, topics: ['ratio', 'mapScale'],
    know: 'Tỉ số của a và b là a : b (hay a/b). Tỉ lệ bản đồ cho biết độ dài thật gấp bao nhiêu lần.',
    tips: [{ name: 'Nhân theo tỉ lệ', how: 'Độ dài thật = độ dài trên bản đồ × số lần của tỉ lệ.', example: 'Tỉ lệ 1 : 1 000 000, 3 cm trên bản đồ → 3 000 000 cm = 30 km' }],
  },
  {
    id: 'phan-tram', name: 'Tỉ số phần trăm', icon: F('cupcake'), region: 'ps', x: 730, y: 115, topics: ['pctOf', 'pctValue'],
    know: 'Tìm tỉ số phần trăm của hai số; tìm giá trị phần trăm của một số.',
    tips: [
      { name: 'Chia rồi nhân 100', how: 'Tỉ số phần trăm của a và b: lấy a : b rồi nhân 100.', example: '15 : 60 = 0,25 = 25%' },
      { name: 'Nhân rồi chia 100', how: 'Giá trị phần trăm: lấy số đó nhân với số phần trăm rồi chia 100.', example: '20% của 150 là 150 × 20 : 100 = 30' },
    ],
  },
  {
    id: 'tong-ti', name: 'Tổng – tỉ, hiệu – tỉ', icon: F('puzzle-piece'), region: 'ps', x: 580, y: 235, topics: ['sumRatio', 'diffRatio'],
    know: 'Tìm hai số khi biết tổng (hoặc hiệu) và tỉ số của hai số đó.',
    tips: [{ name: 'Vẽ các phần bằng nhau', how: 'Vẽ sơ đồ, đếm tổng số phần, tìm giá trị một phần.', example: 'Tổng 45, tỉ số 2/3 → 5 phần; số bé 45 : 5 × 2 = 18, số lớn 27' }],
  },
  {
    id: 'thoi-gian', name: 'Số đo thời gian', icon: F('alarm-clock'), region: 'ps', x: 730, y: 235, topics: ['timeUnits', 'timeAddSub', 'timeMulDiv'],
    know: 'Đổi đơn vị thời gian; cộng, trừ, nhân, chia số đo thời gian.',
    tips: [{ name: 'Đủ 60 phút thì đổi ra giờ', how: 'Cộng xong, số phút từ 60 trở lên thì đổi 60 phút thành 1 giờ.', example: '1 giờ 45 phút + 2 giờ 30 phút = 3 giờ 75 phút = 4 giờ 15 phút' }],
  },
  {
    id: 'chuyen-dong', name: 'Vận tốc, quãng đường', icon: F('bicycle'), region: 'ps', x: 880, y: 235, topics: ['speed', 'distTime'],
    know: 'v = s : t; s = v × t; t = s : v.',
    tips: [{ name: 'Tam giác s – v – t', how: 'Che đại lượng cần tìm: s ở trên thì chia, v và t cạnh nhau thì nhân.', example: 'Đi 120 km trong 3 giờ → v = 120 : 3 = 40 km/giờ' }],
  },

  {
    id: 'don-vi-dt', name: 'km², ha, đơn vị diện tích', icon: F('national-park'), region: 'hinh', x: 100, y: 425, topics: ['geoRev', 'kmHa', 'areaUnits'],
    know: '1 km² = 100 ha; 1 ha = 10 000 m². Hai đơn vị diện tích liền nhau gấp 100 lần.',
    tips: [{ name: 'Bậc thang gấp 100', how: 'Đổi sang đơn vị liền sau nhỏ hơn thì nhân 100.', example: '1 km² = 100 ha = 1 000 000 m²' }],
  },
  {
    id: 'tam-giac-thang', name: 'Tam giác, hình thang', icon: F('triangular-ruler'), region: 'hinh', x: 240, y: 425, topics: ['triangle', 'trapezoid'],
    know: 'Diện tích tam giác = đáy × chiều cao : 2. Hình thang = (đáy lớn + đáy bé) × chiều cao : 2.',
    tips: [{ name: 'Nhớ chia 2', how: 'Tam giác là nửa hình chữ nhật cùng đáy, cùng chiều cao.', example: 'Đáy 8 cm, cao 5 cm → 8 × 5 : 2 = 20 cm²' }],
  },
  {
    id: 'tron', name: 'Hình tròn', icon: F('yellow-circle'), region: 'hinh', x: 380, y: 425, topics: ['circle'],
    know: 'Chu vi = đường kính × 3,14. Diện tích = bán kính × bán kính × 3,14.',
    tips: [{ name: 'Chu vi dùng đường kính, diện tích dùng bán kính', how: 'Xem đề cho bán kính hay đường kính trước khi tính.', example: 'd = 10 cm → C = 31,4 cm; r = 5 cm → S = 5 × 5 × 3,14 = 78,5 cm²' }],
  },
  {
    id: 'the-tich', name: 'Thể tích, cm³, dm³, m³', icon: F('beverage-box'), region: 'hinh', x: 100, y: 545, topics: ['volume', 'volUnits'],
    know: '1 m³ = 1 000 dm³; 1 dm³ = 1 000 cm³.',
    tips: [{ name: 'Bậc thang gấp 1 000', how: 'Đơn vị thể tích liền nhau gấp nhau 1 000 lần.', example: '2 dm³ = 2 000 cm³' }],
  },
  {
    id: 'hop', name: 'Hình hộp, hình lập phương', icon: F('package'), region: 'hinh', x: 240, y: 545, topics: ['net', 'boxArea', 'cubeArea', 'boxVol', 'cubeVol'],
    know: 'Diện tích xung quanh, toàn phần; thể tích hình hộp chữ nhật, hình lập phương.',
    tips: [
      { name: 'Thể tích = dài × rộng × cao', how: 'Nhân ba kích thước cùng đơn vị đo.', example: '5 cm × 4 cm × 3 cm = 60 cm³' },
      { name: 'Lập phương có 6 mặt bằng nhau', how: 'Diện tích toàn phần = cạnh × cạnh × 6.', example: 'Cạnh 3 cm → 3 × 3 × 6 = 54 cm²' },
    ],
  },

  {
    id: 'so-lieu', name: 'Số liệu, biểu đồ hình quạt', icon: F('notebook'), region: 'tk', x: 640, y: 520, topics: ['dataSort', 'pieChart'],
    know: 'Thu thập, sắp xếp số liệu; đọc biểu đồ hình quạt tròn.',
    tips: [{ name: 'Cả hình tròn là 100%', how: 'Nửa hình tròn là 50%, một phần tư là 25%.', example: 'Phần chiếm một phần tư hình tròn là 25%' }],
  },
  {
    id: 'ti-so-lap', name: 'Tỉ số lần lặp lại', icon: F('game-die'), region: 'tk', x: 840, y: 520, topics: ['eventRatio'],
    know: 'Tỉ số của số lần lặp lại một sự kiện so với tổng số lần thực hiện.',
    tips: [{ name: 'Lần xuất hiện : tổng số lần', how: 'Đếm số lần sự kiện xảy ra, chia cho tổng số lần làm.', example: 'Tung đồng xu 20 lần, 9 lần mặt ngửa → tỉ số 9/20' }],
  },
];

export const MAP_TOAN5: MapDef = {
  grade: 5,
  title: 'Toán 5',
  regions: regions('Phân số và số thập phân', 'Tỉ số, phần trăm, chuyển động', 'Hình học và đo lường', 'Thống kê và xác suất'),
  nodes: NODES,
  links: [
    { from: 'so-tu-nhien', to: 'phan-so' },
    { from: 'phan-so', to: 'stp' },
    { from: 'stp', to: 'cong-tru-stp' },
    { from: 'cong-tru-stp', to: 'nhan-chia-stp' },
    { from: 'ti-so', to: 'phan-tram' },
    { from: 'ti-so', to: 'tong-ti' },
    { from: 'thoi-gian', to: 'chuyen-dong' },
    { from: 'don-vi-dt', to: 'tam-giac-thang' },
    { from: 'tam-giac-thang', to: 'tron' },
    { from: 'the-tich', to: 'hop' },
    { from: 'so-lieu', to: 'ti-so-lap' },
  ],
};
