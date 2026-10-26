// Danh mục 75 bài học STEM tiểu học (lớp 1–5) — chỉ lấy DỮ KIỆN từ bộ kế hoạch bài dạy STEM của giáo viên:
// tên bài, môn chủ đạo / tích hợp, thời điểm dạy theo 3 bộ sách, vật liệu. Không chép nội dung hoạt động hay phiếu học tập.
// fit: mức phù hợp với bài giảng 3D (cao / vừa / thấp); assets: đồ vật 3D gợi ý; tpl: bài mẫu 3D dựng sẵn (nếu có).
// Tạo bằng script đọc file .docx; sửa tay ở đây nếu cần.

export type StemLesson = {
  g: number; no: number; title: string; lead: string; integrated: string[]; when: string;
  timing: { KNTT?: string; CTST?: string; CD?: string };
  materials: string[]; fit: 'cao' | 'vua' | 'thap'; assets: string[]; tpl: string | null;
};

export const STEM_LESSONS: StemLesson[] = [
 {
  "g": 1,
  "no": 1,
  "title": "Trải nghiệm cùng khay 10 học Toán",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Các số từ 0 đến 10 (môn Toán)",
  "timing": {
   "KNTT": "Bài 2: Các số 6, 7, 8, 9, 10",
   "CTST": "Bài 17: Số 10",
   "CD": "Bài 8: Luyện tập"
  },
  "materials": [
   "Giấy trắng hoặc bìa màu hoặc bìa carton cỡ A4 (tờ)"
  ],
  "fit": "cao",
  "assets": [
   "tray10",
   "counter",
   "card"
  ],
  "tpl": "tray10"
 },
 {
  "g": 1,
  "no": 2,
  "title": "Dụng cụ so sánh số trong phạm vi 10",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Các số từ 0 đến 10 (môn Toán)",
  "timing": {
   "KNTT": "Bài 4: So sánh số",
   "CTST": "Bài: Em làm được những gì (sau bài số 10)",
   "CD": "Bài 11: Luyện tập"
  },
  "materials": [
   "Giấy trắng hoặc bìa màu hoặc bìa các-tông cỡ A5 (4 tờ)",
   "Băng dính xốp (20 cm)",
   "Dây chun (10 cái)",
   "Ống hút/ que tính (8 cái)"
  ],
  "fit": "vua",
  "assets": [
   "counter",
   "card",
   "balance"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 3,
  "title": "Thực hành cùng thẻ học Toán",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Luyện tập chung sau phần so sánh số (môn Toán)",
  "timing": {
   "KNTT": "Bài 6: Luyện tập chung (tiết 3, 4)",
   "CTST": "Bài: Thực hành và trải nghiệm Sông nước miền Tây",
   "CD": "Em ôn lại những gì đã học (trang 27)"
  },
  "materials": [
   "Giấy trắng hoặc bìa màu hoặc bìa carton cỡ A4 (4 tờ)",
   "Sticker (4 tờ)"
  ],
  "fit": "vua",
  "assets": [
   "card",
   "counter"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 4,
  "title": "Thực hành trang trí lớp học bằng các hình học",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Thực hành lắp ghép, xếp hình (môn Toán)",
  "timing": {
   "KNTT": "Bài 8: Thực hành lắp ghép, xếp hình",
   "CTST": "Bài: Xếp hình",
   "CD": "Bài: Hình vuông – Hình tròn – Hình tam giác – Hình chữ nhật"
  },
  "materials": [
   "Giấy các màu (20 tờ)",
   "Bìa các-tông (4 mảnh)"
  ],
  "fit": "cao",
  "assets": [
   "cube",
   "cuboid",
   "cyl",
   "ball",
   "cone",
   "tangram"
  ],
  "tpl": "shapes"
 },
 {
  "g": 1,
  "no": 5,
  "title": "Dụng cụ tính cộng, tính trừ",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Bảng cộng, bảng trừ trong phạm vi 10 (môn Toán).",
  "timing": {
   "KNTT": "Bài 13: Luyện tập chung",
   "CTST": "Bài 26: Em làm được những gì?",
   "CD": "Bài 30: Luyện tập"
  },
  "materials": [
   "Giấy bìa A5 (8 tờ)",
   "Giấy bìa hình chữ nhật, kích thước ½ A5 có sẵn các vạch đều nhau (4 tờ)"
  ],
  "fit": "vua",
  "assets": [
   "counter",
   "tray10",
   "card"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 6,
  "title": "Thực hành tính nhẩm",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Ôn tập phép cộng, phép trừ trong phạm vi 10 (môn Toán)",
  "timing": {
   "KNTT": "Bài 13: Luyện tập chung (Tiết 1,2)",
   "CTST": "Bài: Em làm được những gì? (Tiết 2,3)",
   "CD": "Bài: Luyện tập (sau bài Phép trừ trong phạm vi 10 (tiếp theo))"
  },
  "materials": [
   "Giấy A4 (4 tờ)",
   "Bìa ni-lông (4 tờ)"
  ],
  "fit": "vua",
  "assets": [
   "card",
   "counter"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 7,
  "title": "Đèn hiệu và biển báo giao thông",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung an toàn trên đường (môn Tự nhiên và Xã hội)",
  "timing": {
   "KNTT": "Bài 13: An toàn trên đường",
   "CTST": "Bài 14 : Đi đường an toàn",
   "CD": "Bài 9: An toàn trên đường"
  },
  "materials": [
   "Bộ hình phẳng cơ bản nhiều kích thước (1 cái)",
   "Bìa các-tông (1 tấm)",
   "Hình khối hộp chữ nhật (2 tờ)",
   "Băng dính hai mặt (2 tờ)",
   "Que tre (5 que)",
   "Nắp chai (5 cái)"
  ],
  "fit": "cao",
  "assets": [
   "traffic",
   "crosswalk",
   "road",
   "sign-stop",
   "sign-warn",
   "sign-info",
   "car",
   "kid"
  ],
  "tpl": "traffic"
 },
 {
  "g": 1,
  "no": 9,
  "title": "Cây xung quanh em",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "Khi dạy nội dung Thực vật và Động vật (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 15: Cây xung quanh em",
   "CTST": "Bài 16: Cây xung quanh em",
   "CD": "Bài 10: Cây xung quanh em"
  },
  "materials": [
   "Bìa các–tông (1tấm)",
   "Băng dính hai mặt (2 cuộn)",
   "Que tre (5 que)",
   "Ống hút (5 cái)"
  ],
  "fit": "cao",
  "assets": [
   "tree",
   "pine",
   "fruit-tree",
   "flower",
   "pot-plant",
   "plant-parts"
  ],
  "tpl": "plant"
 },
 {
  "g": 1,
  "no": 10,
  "title": "Bảng các số từ 1 đến 100",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 23: Bảng các số từ 1 đến 100",
   "CTST": "Bài: Bảng các số từ 1 đến 100 (Tiết 2, 3)",
   "CD": "Bài: Các số đến 100"
  },
  "materials": [
   "Bút màu (1 hộp)",
   "Bìa ni-lông (2 cái)",
   "Hộp bút (lông) màu (1 hộp)",
   "Giấy màu thủ công (1 túi)",
   "Giấy ô li (5 tờ)",
   "Giấy vẽ A4 (2 tờ)",
   "Thước kẻ (1 chiếc)"
  ],
  "fit": "vua",
  "assets": [
   "board100",
   "counter"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 11,
  "title": "Chăm sóc và bảo vệ vật nuôi",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Nhà cho vật nuôi (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 18: Chăm sóc và bảo vệ vật nuôi",
   "CTST": "Bài 19: Chăm sóc và bảo vệ vật nuôi",
   "CD": "Bài 11: Các con vật quanh em"
  },
  "materials": [
   "Giấy bìa các– tông hoặc hộp giấy tái chế",
   "Bút chì (1 cái)",
   "Bút màu (1 hộp)",
   "Kéo thủ công (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "dog",
   "cat",
   "chicken",
   "duck",
   "pig",
   "house",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 12,
  "title": "Trang trí cảnh quan nơi em sống",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Cộng đồng địa phương (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 10: Cùng khám phá quang cảnh xung quanh",
   "CTST": "Bài 11: Nơi em sinh sống",
   "CD": "Bài 6: Nơi em sống"
  },
  "materials": [
   "Giấy màu (4 tờ)",
   "Băng dính (1 cuộn)",
   "Keo dán (1 hộp)",
   "Dây duy băng (1 cuộn)"
  ],
  "fit": "cao",
  "assets": [
   "house",
   "tree",
   "road",
   "flower",
   "lake",
   "bridge",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 13,
  "title": "Mô hình tính dọc",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 33: Luyện tập chung – (tiết 1, 2)",
   "CTST": "Bài: Các phép tính dạng 34 + 23, 57 – 23 (tiết 2, 3)",
   "CD": "Bài: Luyện tập chung (trước bài Các ngày trong tuần lễ)"
  },
  "materials": [
   "Giấy A4/ giấy bìa A4 (4 tờ)",
   "File ni-lông (4 tờ)"
  ],
  "fit": "thap",
  "assets": [
   "card"
  ],
  "tpl": null
 },
 {
  "g": 1,
  "no": 14,
  "title": "Đồng hồ tiện ích",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật",
   "Tự nhiên và Xã hội"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 34: Xem giờ đúng trên đồng hồ",
   "CTST": "Bài: Chiếc đồng hồ của em",
   "CD": "Bài: Đồng hồ – Thời gian"
  },
  "materials": [
   "Mẫu in sẵn các bộ phận của đồng hồ (35 tờ)",
   "Đĩa giấy (6 đĩa)"
  ],
  "fit": "cao",
  "assets": [
   "clock"
  ],
  "tpl": "clock"
 },
 {
  "g": 1,
  "no": 15,
  "title": "Bầu trời ngày và đêm",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Ngày và đêm (môn Tự nhiên và Xã hội)",
  "timing": {
   "KNTT": "Bài 26: Cùng khám phá bầu trời",
   "CTST": "Bài 29: Ban ngày và ban đêm",
   "CD": "Bài 20: Bầu trời ban ngày và ban đêm"
  },
  "materials": [
   "Giấy bìa A4 (2 tờ)",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)",
   "Ốc vít (1 bộ)"
  ],
  "fit": "cao",
  "assets": [
   "sun",
   "moon",
   "star",
   "earth",
   "house"
  ],
  "tpl": "daynight"
 },
 {
  "g": 1,
  "no": 16,
  "title": "Thời tiết và trang phục",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Thời tiết và trang phục (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 27: Thời tiết luôn thay đổi",
   "CTST": "Bài 31: Hiện tượng thời tiết",
   "CD": "Bài 21: Thời tiết"
  },
  "materials": [
   "Giấy hoặc bìa",
   "Vải vụn hoặc dây ruy băng"
  ],
  "fit": "cao",
  "assets": [
   "sun",
   "cloud",
   "umbrella",
   "wind-sock",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 1,
  "title": "Tia số của em",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {},
  "materials": [
   "Các thẻ số từ 0 đến 15 (16 thẻ)",
   "Bảng phụ có vẽ hình ảnh tia chưa viết số (1 cái)"
  ],
  "fit": "vua",
  "assets": [
   "numberline",
   "card"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 2,
  "title": "Nghề nghiệp của người thân",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Nghề nghiệp của người lớn trong gia đình (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Tuần 2: Bài 2: Nghề nghiệp của người lớn trong gia đình",
   "CTST": "Tuần 2: Bài 2: Nghề nghiệp của người thân trong gia đình",
   "CD": "Tuần 2: Bài 2: Nghề nghiệp"
  },
  "materials": [
   "Giấy bìa A4 (3 tờ)",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)"
  ],
  "fit": "vua",
  "assets": [
   "adult",
   "house",
   "car",
   "rice",
   "computer"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 3,
  "title": "Giữ gìn vệ sinh nhà ở",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Con người & Sức khoẻ (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 4. Giữa sạch nhà ở",
   "CD": "Bài 4: Giữ vệ sinh nhà ở",
   "CTST": "Bài 4: Giữ vệ sinh nhà ở"
  },
  "materials": [
   "Chậu hoặc cốc đựng sản phẩm (1)",
   "Nước sạch (100ml)"
  ],
  "fit": "vua",
  "assets": [
   "house",
   "adult",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 4,
  "title": "Thanh cộng trong phạm vi 20",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 7: Phép cộng (qua 10) trong phạm vi 20",
   "CTST": "Bài: 8 cộng với một số; 7 cộng với một số, 6 cộng với một số",
   "CD": "Bài: Phép cộng có nhớ trong phạm vi 20; Bài: Phép cộng có nhớ trong phạm vi 20 (tiếp theo)"
  },
  "materials": [
   "Giấy bìa cứng/giấy thủ công/giấy vở ô li (1 tờ)",
   "Kéo/thước kẻ (1 cái)",
   "Bút màu (1 hộp)"
  ],
  "fit": "vua",
  "assets": [
   "tray10",
   "counter",
   "card"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 5,
  "title": "Lịch để bàn tiện ích",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật",
   "Tự nhiên và Xã hội"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 30: Ngày – tháng; Bài 31: Thực hành trải nghiệm xem đồng hồ, xem lịch",
   "CTST": "Bài: Ngày, tháng",
   "CD": "Bài: Ngày – Tháng"
  },
  "materials": [
   "Giấy bìa các-tông hoặc hộp giấy tái chế (1 hộp)",
   "Bút chì (1 cái)",
   "Bút màu (1 hộp)",
   "Kéo thủ công (1 cái)"
  ],
  "fit": "vua",
  "assets": [
   "calendar"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 6,
  "title": "Nơi sống của động vật",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Động vật sống ở đâu? (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 17. Động vật sống ở đâu?",
   "CTST": "Bài 16. Động vật sống ở đâu?",
   "CD": "Bài 11: Môi trường sống của thực vật và động vật"
  },
  "materials": [
   "Giấy bìa các–tông hoặc hộp giấy tái chế (2 tờ)",
   "Bút chì (1 cái)",
   "Bút màu (1 hộp)",
   "Kéo thủ công (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "lake",
   "fish",
   "duck",
   "tree",
   "bird",
   "frog",
   "cow",
   "rabbit",
   "fox"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 7,
  "title": "Thực hành nhân nhẩm, chia nhẩm",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 45: Luyện tập chung",
   "CTST": "Bài: Em làm được những gì? (chủ đề 4)",
   "CD": "Bài 64 : Luyện tập chung"
  },
  "materials": [
   "Thẻ phép tính trong bảng nhân 2 (hoặc bảng chia 2) (10 thẻ)",
   "Thẻ số kết quả của bảng nhân 2 (hoặc bảng chia 2) (10 thẻ)"
  ],
  "fit": "vua",
  "assets": [
   "counter",
   "card",
   "tray10"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 9,
  "title": "Trải nghiệm thành phố hình học",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật",
   "Tự nhiên và Xã hội"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 47: Luyện tập chung",
   "CTST": "Bài: Xếp hình, gấp hình",
   "CD": "Bài: Thực hành lắp, ghép xếp hình khối"
  },
  "materials": [
   "Súng bắn keo (1)",
   "Keo nến (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "cube",
   "cuboid",
   "cyl",
   "ball",
   "cone",
   "road",
   "car"
  ],
  "tpl": "shapes"
 },
 {
  "g": 2,
  "no": 10,
  "title": "Cơ quan vận động",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "Khi dạy nội dung về cơ quan vận động (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Tuần 24: Bài 21: Tìm hiểu cơ quan vận động",
   "CTST": "Tuần 23: Bài 19: Cơ quan vận động",
   "CD": "Tuần 23: Bài 14: Cơ quan vận động"
  },
  "materials": [
   "Giấy bìa A4 (1 tờ)",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)",
   "Ống hút (2 chiếc)",
   "Dây len hoặc chỉ (1 cuộn)"
  ],
  "fit": "vua",
  "assets": [
   "bone",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 11,
  "title": "Thực hành biểu diễn số với bàn tính",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 52. Viết số thành tổng của trăm, chục, đơn vị",
   "CTST": "Bài: Bài: Viết số thành tổng của trăm, chục, đơn vị",
   "CD": "Bài: Luyện tập chung"
  },
  "materials": [
   "Giấy bìa cứng/xốp/ vỏ hộp có dạng khối hộp chữ nhật (1 tấm/hộp)",
   "Que tính/que thẳng (chất liệu dẻo càng tốt) (3 que)",
   "Giấy thủ công nhiều màu sắc (1 túi)",
   "Bút mực hoặc bút sáp (1 cái)",
   "Keo dán (1 lọ)",
   "Kéo (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "abacus",
   "card"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 12,
  "title": "Bảo vệ cơ quan hô hấp",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Con người & Sức khoẻ (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 26: Chăm sóc, bảo vệ cơ quan hô hấp",
   "CD": "Bài 17: Bảo vệ cơ quan hô hấp",
   "CTST": "Bài 23 : Chăm sóc và bảo vệ cơ quan hô hấp"
  },
  "materials": [
   "Dây chun (Đoạn 20 cm)",
   "Xốp dán mũ (đoạn 20 cm)",
   "Giấy bóng kính (2 tờ)",
   "Ghim bấm (1 cái)",
   "Băng dính (1 cuộn)"
  ],
  "fit": "cao",
  "assets": [
   "lungs",
   "kid",
   "tree"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 13,
  "title": "Các loại phương tiện và đường giao thông",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 13: Hoạt động giao thông",
   "CD": "Bài 8: Đường và phương tiện giao thông",
   "CTST": "Bài 10 : Đường giao thông"
  },
  "materials": [
   "Bìa cứng (Đoạn 20 cm)",
   "Ống hút (đoạn 20 cm)",
   "Giấy màu xốp các màu (2 tờ)",
   "Ghim bấm (1 cái)",
   "Băng dính (1 cuộn)"
  ],
  "fit": "cao",
  "assets": [
   "road",
   "car",
   "bus",
   "bike",
   "boat",
   "plane",
   "train",
   "traffic",
   "bridge"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 14,
  "title": "Thước gấp",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 57. Thực hành và trải nghiệm đo độ dài",
   "CTST": "Bài: Thực hành và trải nghiệm",
   "CD": "Bài: Em vui học toán (trang 54)"
  },
  "materials": [
   "Tranh vẽ thước gấp/ thước gấp (1)",
   "Các băng giấy có độ dài (từ 20 cm trở lên), màu sắc khác nhau (5 cái)"
  ],
  "fit": "vua",
  "assets": [
   "ruler"
  ],
  "tpl": null
 },
 {
  "g": 2,
  "no": 15,
  "title": "Các mùa trong năm",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Các mùa trong năm (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Tuần 31: Bài 28: Các mùa trong năm",
   "CTST": "Tuần 31: Bài 26: Các mùa trong năm",
   "CD": "Tuần 30: Bài 19: Các mùa trong năm"
  },
  "materials": [
   "Giấy bìa A4 (2 tờ)",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)"
  ],
  "fit": "cao",
  "assets": [
   "sun",
   "earth",
   "tree",
   "flower",
   "cloud"
  ],
  "tpl": "solar"
 },
 {
  "g": 2,
  "no": 16,
  "title": "Vòng xoay ngẫu nhiên",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 66. Chắc chắn, có thể, không thể",
   "CTST": "Bài. Có thể, chắc chắn, không thể",
   "CD": "Bài. Em vui học toán"
  },
  "materials": [
   "Bìa cát tông/tấm phooc mếch (1 tấm)",
   "Ghim giấy (2 cái)",
   "Đĩa nhựa (1 cái)",
   "Que tre (1 que)",
   "Kéo (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "spinner"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 1,
  "title": "Họ hàng nội ngoại",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {},
  "materials": [
   "Giấy bìa A4 (2 tờ)",
   "Ống giấy (nếu có sẵn) (01)",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)"
  ],
  "fit": "thap",
  "assets": [
   "adult",
   "kid",
   "house"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 2,
  "title": "Bảng nhân, chia",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 12: Bảng nhân 9, bảng chia 9 (tiết 2,3 )",
   "CTST": "Bài: Em làm được những gì (sau bài Bảng chia 9)",
   "CD": "Bài: Luyện tập (tiếp theo) (trang 54, tập 1)"
  },
  "materials": [
   "Giấy A4 (1 tờ)",
   "Giấy bìa màu (2 tờ)",
   "Dập ghim (1 chiếc)"
  ],
  "fit": "vua",
  "assets": [
   "counter",
   "card",
   "tray10"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 3,
  "title": "Trải nghiệm một phần mấy",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 15: Luyện tập chung (sau bài Một phần mấy)",
   "CTST": "Bài: Em làm được những gì? (sau bài Bảng chia 9)",
   "CD": "Bài: Em vui học Toán (trang 65, tập 1)"
  },
  "materials": [
   "Giấy bìa màu (5 tờ)",
   "Đĩa giấy (5 chiếc)",
   "Dập ghim (1 chiếc)"
  ],
  "fit": "cao",
  "assets": [
   "fraction",
   "ball",
   "cuboid"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 4,
  "title": "Cẩm nang sử dụng máy tính đúng cách, an toàn",
  "lead": "Tin học",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Mục 3: Bài 3. Máy tính và em và Mục 1: Bài 4. Làm việc với máy tính",
   "CTST": "Bài 4. Làm việc với máy tính - Mục 4 + Mục 5",
   "CD": "Chủ đề A1 - Bài 5. Bảo vệ sức khỏe khi dùng máy tính"
  },
  "materials": [
   "Giấy A4 (1 tập)",
   "Giấy ô li (1 quyển)",
   "Kéo (1 chiếc)",
   "Keo dán (2 lọ)",
   "Bút màu (1 hộp)",
   "Bút chì (2 cái)",
   "Bút dạ (1 hộp)",
   "Giấy màu (10 tờ)"
  ],
  "fit": "vua",
  "assets": [
   "computer",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 5,
  "title": "Di tích lịch sử – văn hoá và cảnh quan thiên nhiên",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "Khi dạy nội dung Di tích lịch sử – văn hoá và cảnh quan thiên nhiên (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 11: Di tích lịch sử – văn hoá và cảnh quan thiên nhiên",
   "CTST": "Bài 10: Di tích lịch sử – văn hoá và cảnh quan thiên nhiên",
   "CD": "Bài 11: Di tích lịch sử – văn hoá và cảnh quan thiên nhiên"
  },
  "materials": [
   "Giấy bìa các–tông hoặc hộp giấy tái chế (1 hộp)",
   "Bút chì (1 cái)",
   "Bút màu (1 hộp)",
   "Kéo thủ công (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "pagoda",
   "bridge",
   "drum",
   "tree",
   "lake",
   "mountain"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 6,
  "title": "Cẩm nang sử dụng máy thu hình",
  "lead": "Công nghệ",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung Sử dụng máy thu hình (môn Công nghệ)",
  "timing": {
   "KNTT": "Bài 5. Sử dụng máy thu hình",
   "CTST": "Bài 5. Sử dụng máy thu hình",
   "CD": "Bài 5. Sử dụng máy thu hình"
  },
  "materials": [],
  "fit": "vua",
  "assets": [
   "tv"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 7,
  "title": "Các bộ phận của thực vật",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Các bộ phận của thực vật (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 13: Một số bộ phận của thực vật",
   "CTST": "Bài 15: Lá, thân, rễ của thực vật và bài 16: Hoa và quả",
   "CD": "Bài 12: Các bộ phận của thực vật và chức năng của chúng"
  },
  "materials": [
   "Giấy trắng (2 – 5 tờ)"
  ],
  "fit": "cao",
  "assets": [
   "plant-parts",
   "flower",
   "tree"
  ],
  "tpl": "plant"
 },
 {
  "g": 3,
  "no": 8,
  "title": "Cân thăng bằng",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Ôn tập về hình học và đo lường – Ôn tập chung (môn Toán)",
  "timing": {
   "KNTT": "Bài 43,44: Ôn tập về hình học và đo lường – Ôn tập chung",
   "CTST": "Bài: Thực hành và trải nghiệm (trang 95, Tập 1)",
   "CD": "Bài: Ôn tập về hình học và đo lường (trang 119, Tập 1)"
  },
  "materials": [
   "Móc treo áo (1 chiếc)",
   "Cốc giấy/ cốc nhựa nhỏ (2 chiếc)",
   "Dây (2 chiếc)",
   "Hộp/ bìa các-tông (1 chiếc)"
  ],
  "fit": "cao",
  "assets": [
   "balance",
   "cube",
   "ball"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 10,
  "title": "Đồng hồ sử dụng số La Mã",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Làm quen với chữ số La Mã (môn Toán)",
  "timing": {
   "KNTT": "Bài 47: Làm quen với chữ số La Mã",
   "CTST": "Bài: Làm quen với chữ số La Mã",
   "CD": "Bài: Làm quen với chữ số La Mã"
  },
  "materials": [
   "Bìa (2 tờ)",
   "Đĩa giấy (1 chiếc)",
   "Dập ghim (1 chiếc)",
   "Ghim mũ (1 chiếc)"
  ],
  "fit": "cao",
  "assets": [
   "clock"
  ],
  "tpl": "clock"
 },
 {
  "g": 3,
  "no": 11,
  "title": "Cơ quan tiêu hoá",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung cơ quan tiêu hoá (môn Tự nhiên & Xã hội)",
  "timing": {
   "KNTT": "Bài 18: Cơ quan tiêu hoá",
   "CTST": "Bài 20 : Cơ quan tiêu hoá",
   "CD": "Bài 15: Cơ quan tiêu hoá"
  },
  "materials": [
   "Tấm bìa cứng kích thước 1m x 1m (1 cái)",
   "Giấy bìa A4 (2 tờ)",
   "Giấy trắng A4 (2 tờ)",
   "Băng dính hai mặt (2 cuộn)",
   "Ống nhựa dẻo (2 m)"
  ],
  "fit": "cao",
  "assets": [
   "stomach",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 12,
  "title": "Thực hành với tệp và thư mục trong máy tính",
  "lead": "Tin học",
  "integrated": [
   "Tự nhiên và Xã hội"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 9. Thực hành với tệp và thư mục trong máy tính",
   "CTST": "Bài 8. Làm quen với thư mục - Mục 2 + Mục 3",
   "CD": "Chủ đề C2, Bài 2. Cây thư mục + Bài 3. Em tập thao tác với thư mục"
  },
  "materials": [],
  "fit": "thap",
  "assets": [
   "computer"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 13,
  "title": "Trải nghiệm cùng diện tích hình vuông và hình chữ nhật",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Diện tích hình vuông, hình chữ nhật (môn Toán)",
  "timing": {
   "KNTT": "Bài 53: Luyện tập chung",
   "CTST": "Bài: Diện tích hình chữ nhật. Diện tích hình vuông",
   "CD": "Bài: Luyện tập chung (sau bài Diện tích hình chữ nhật. Diện tích hình vuông)"
  },
  "materials": [
   "Giấy kẻ ô vuông (1 tập)",
   "1 bảng sơ đồ và 4 thẻ diện tích như ở mục 2b trang 61 (1 bộ)"
  ],
  "fit": "cao",
  "assets": [
   "grid",
   "ruler"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 14,
  "title": "Sáng tạo đồ dùng học tập",
  "lead": "Công nghệ",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "Khi dạy nội dung Làm đồ dùng học tập (môn Công nghệ)",
  "timing": {
   "KNTT": "Bài 8. Làm đồ dùng học tập",
   "CTST": "Bài 7. Làm đồ dùng học tập",
   "CD": "Bài 7. Làm đồ dùng học tập"
  },
  "materials": [
   "Giấy mút xốp mỏng (khổ A4) (1 tấm)",
   "Súng bắn keo và keo nến (1 cái)",
   "Khóa zip (1 cái)"
  ],
  "fit": "vua",
  "assets": [
   "ruler",
   "materials",
   "cuboid"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 15,
  "title": "Bề mặt Trái Đất",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 28: Bề mặt trái đất",
   "CTST": "Bài 29: Bề mặt Trái Đất",
   "CD": "Bài 22: Bề mặt Trái Đất"
  },
  "materials": [
   "Đất nặn (1 hộp đủ màu)",
   "Bìa cứng (1 tờ)",
   "Giấy màu (5 tờ (5 màu))",
   "Kéo (1 chiếc)",
   "Keo dán (1 hộp)",
   "Bút màu (1 hộp)",
   "Bút chì (1 cái)",
   "Que tre (15 cái)"
  ],
  "fit": "cao",
  "assets": [
   "mountain",
   "hill",
   "plain",
   "river",
   "sea",
   "lake"
  ],
  "tpl": null
 },
 {
  "g": 3,
  "no": 16,
  "title": "Mô hình Mặt Trời – Trái Đất – Mặt Trăng",
  "lead": "Tự nhiên và Xã hội",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 29: Mặt Trời – Trái Đất – Mặt Trăng",
   "CTST": "Bài 28: Trái Đất trong hệ Mặt Trời",
   "CD": "Bài 23: Trái Đất trong hệ Mặt Trời"
  },
  "materials": [
   "Giấy bìa A4",
   "Băng dính hai mặt hoặc hồ dán (1 cuộn/1 lọ)",
   "Đinh gim/Khuy bấm nhựa (3 chiếc)"
  ],
  "fit": "cao",
  "assets": [
   "sun",
   "earth",
   "moon"
  ],
  "tpl": "solar"
 },
 {
  "g": 4,
  "no": 1,
  "title": "Sự chuyển thể của nước và vòng tuần hoàn của nước",
  "lead": "Khoa học",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 2. Sự chuyển thể của nước và vòng tuần hoàn của nước trong tự nhiên",
   "CTST": "Bài 2. Sự chuyển thể của nước",
   "CD": "Bài 2. Sự chuyển thể của nước"
  },
  "materials": [
   "Giấy màu (1 tập)",
   "Đất nặn (2 hộp)",
   "Kéo (1 chiếc)",
   "Keo dán (2 lọ)",
   "Bút màu (1 hộp)",
   "Bút chì (2 cái)",
   "Xốp",
   "Màu nước (1 hộp)"
  ],
  "fit": "cao",
  "assets": [
   "ice",
   "pot",
   "cloud",
   "sea",
   "sun",
   "mountain"
  ],
  "tpl": "water"
 },
 {
  "g": 4,
  "no": 2,
  "title": "Gió, bão",
  "lead": "Khoa học",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 6. Gió bão và phòng chống bão",
   "CTST": "Bài 5. Gió, bão",
   "CD": "Bài 4. Sự chuyển động của không khí"
  },
  "materials": [
   "Giấy A4 (10 tờ)",
   "Giấy màu (10 tờ)",
   "Giấy nến (10 tờ)",
   "Giấy bóng kính (10 tờ)",
   "Que tre 1 bó (15 chiếc)",
   "Băng dính 2 mặt (1 cuộn)",
   "Bút màu (1 hộp)",
   "Bút chì (1 cái)",
   "Dây buộc (1 m)",
   "Dập gim (1 cái)",
   "Nến (2 cái)"
  ],
  "fit": "cao",
  "assets": [
   "wind-sock",
   "tree",
   "house",
   "cloud",
   "pinwheel"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 3,
  "title": "Bộ chữ số bí ẩn",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 16: Luyện tập chung (Tiết 1+2)",
   "CTST": "Bài 29: Em làm được những gì?",
   "CD": "Bài 5: Các số trong phạm vi 1 000 000 (tiếp theo)"
  },
  "materials": [
   "Giấy màu (1 tập)",
   "Kéo (1 chiếc)",
   "Keo dán (1 lọ)",
   "Bút màu (1 hộp)",
   "Dập ghim (1 cái)",
   "Giấy A4 (4 tờ)"
  ],
  "fit": "vua",
  "assets": [
   "card"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 4,
  "title": "Thế kỉ",
  "lead": "Toán",
  "integrated": [
   "Lịch sử",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung Giây, thế kỉ (môn Toán)",
  "timing": {
   "KNTT": "Bài 19: Giây, thế kỉ",
   "CTST": "Bài 35: Thế kỉ",
   "CD": "Bài 16: Thế kỉ"
  },
  "materials": [
   "Giấy A4 (4 tờ)",
   "Giấy màu (10 tờ)",
   "Keo dán (1 lọ)",
   "Bút chì (1 chiếc)",
   "Bút màu (1 hộp)",
   "Kéo (1 chiếc)",
   "Thước kẻ (1 chiếc)"
  ],
  "fit": "thap",
  "assets": [
   "numberline",
   "label"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 5,
  "title": "Âm thanh trong cuộc sống",
  "lead": "Khoa học",
  "integrated": [
   "Công nghệ",
   "Mĩ thuật",
   "Âm nhạc"
  ],
  "when": "",
  "timing": {},
  "materials": [
   "Hộp bánh bằng sắt",
   "Ống hút",
   "Giây chun",
   "Giấy màu",
   "Hồ",
   "Băng dính"
  ],
  "fit": "cao",
  "assets": [
   "speaker",
   "gong",
   "drum",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 6,
  "title": "Dẫn nhiệt",
  "lead": "Khoa học",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 13. Vật dẫn nhiệt tốt, Vật dẫn nhiệt kém",
   "CTST": "Bài 13. Sự truyền nhiệt và vật dẫn nhiệt",
   "CD": "Bài 12. Vật dẫn nhiệt tốt và vật dẫn nhiệt kém"
  },
  "materials": [
   "Chai thuỷ tinh (1chai)",
   "Giấy nhôm (1 cuộn)",
   "Giấy báo (giấy màu) (10 tờ)",
   "Xốp hơi bọc (1 tấm)",
   "Băng dính 2 mặt (1 tấm)",
   "Keo dán (2 cuộn)",
   "Kéo (1 chiếc)"
  ],
  "fit": "cao",
  "assets": [
   "cup",
   "spoon",
   "pot"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 7,
  "title": "Chậu hoa và cây cảnh mini",
  "lead": "Công nghệ",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung môn Công nghệ",
  "timing": {
   "KNTT": "Bài 5. Trồng hoa, cây cảnh trong chậu",
   "CTST": "Bài 4. Trồng cây cảnh trong chậu",
   "CD": "Bài 6, 7. Trồng và chăm sóc hoa/ cây cảnh trong chậu"
  },
  "materials": [
   "Chậu hoa, cây cảnh mini (1)"
  ],
  "fit": "cao",
  "assets": [
   "pot-plant",
   "flower",
   "materials"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 8,
  "title": "Tạo bài trình chiếu giới thiệu lịch sử – văn hoá địa phương",
  "lead": "Tin học",
  "integrated": [
   "Lịch sử – Địa lí"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 7. Tạo bài trình chiếu",
   "CTST": "Bài 9. Bài trình chiếu của em",
   "CD": "Chủ đề E1: Bài 1. Bố cục của trang chiếu; Bài 2. Định dạng văn bản trên trang chiếu"
  },
  "materials": [],
  "fit": "thap",
  "assets": [
   "computer"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 10,
  "title": "Dân cư và hoạt động sản xuất ở vùng Tây Nguyên",
  "lead": "Lịch sử – Địa lí",
  "integrated": [
   "Mĩ thuật",
   "Toán",
   "Tin học"
  ],
  "when": "Khi dạy thay các hoạt động 1, 2 trong bài 16: Dân cư, hoạt động sản xuất và một số nét văn hoá ở vùng Tây Nguyên – Sách CD",
  "timing": {
   "KNTT": "Bài 21: Dân cư và hoạt động sản xuất ở vùng Tây Nguyên",
   "CTST": "Bài 20: Dân cư và hoạt động sản xuất ở vùng Tây Nguyên"
  },
  "materials": [
   "Ghim nhọn (1 hộp)",
   "Kéo thủ công (1 cái)",
   "Hộp bút (lông) màu (1 hộp)",
   "Băng dính 2 mặt (1 cuộn)",
   "Thẻ đánh dấu (50 cái)",
   "Đất nặn (1 hộp)",
   "Keo dán (1 lọ)",
   "Giấy màu",
   "Giấy A4 (1 tờ)"
  ],
  "fit": "cao",
  "assets": [
   "rong",
   "gong",
   "coffee",
   "adult",
   "hill"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 11,
  "title": "Thực hành ước lượng trong tính toán đơn giản",
  "lead": "Toán",
  "integrated": [
   "Công nghệ",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 45. Thực hành và trải nghiệm ước lượng trong tính toán",
   "CTST": "Bài 79. Thực hành và trải nghiệm",
   "CD": "Bài 51. Em vui học Toán"
  },
  "materials": [
   "Giấy A4, giấy màu (20 tờ)",
   "Băng dính hai mặt (1 cuộn)",
   "Kéo (1 chiếc)",
   "Keo dán (1 lọ)",
   "Giấy xốp (1 cuộn)",
   "Dây treo (1 mét)"
  ],
  "fit": "vua",
  "assets": [
   "ruler",
   "balance",
   "card"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 12,
  "title": "Ăn uống cân bằng",
  "lead": "Khoa học",
  "integrated": [
   "Toán",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 24: Chế độ ăn uống cân bằng",
   "CTST": "Bài 25. Ăn, uống khoa học để cơ thể khoẻ mạnh",
   "CD": "Bài 18. Chế độ ăn uống"
  },
  "materials": [
   "Giấy A4, giấy màu (2 tờ, 5 tờ)",
   "Băng dính hai mặt (1 cuộn)",
   "Đất nặn (1 hộp)",
   "Keo dán (1 lọ)"
  ],
  "fit": "thap",
  "assets": [
   "fruit-tree",
   "fish",
   "egg"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 13,
  "title": "Làm chong chóng",
  "lead": "Công nghệ",
  "integrated": [
   "Khoa học"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 10: Đồ chơi dân gian",
   "CTST": "Bài 9. Làm diều giấy",
   "CD": "Bài 12 Làm chong chóng"
  },
  "materials": [
   "Giấy bìa (4 tờ)",
   "Băng dính hai mặt (1 cuộn)",
   "Keo dán (1 lọ)",
   "Bút màu (1 hộp)"
  ],
  "fit": "cao",
  "assets": [
   "pinwheel",
   "wind-sock",
   "materials"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 14,
  "title": "Chuỗi thức ăn trong tự nhiên",
  "lead": "Khoa học",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 29: Chuỗi thức ăn trong tự nhiên",
   "CTST": "Bài 30: Chuỗi thức ăn trong tự nhiên",
   "CD": "Bài 22: Chuỗi thức ăn"
  },
  "materials": [
   "Giấy A4 (4 tờ)",
   "Giấy bìa màu (5 Tờ)",
   "Đất nặn (1 hộp)"
  ],
  "fit": "cao",
  "assets": [
   "grass",
   "grasshopper",
   "frog",
   "fox",
   "rabbit",
   "bird"
  ],
  "tpl": "foodchain"
 },
 {
  "g": 4,
  "no": 15,
  "title": "Thực hành trải nghiệm cùng bộ lắp ghép hình phẳng",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 71. Ôn tập hình học và Đo lường",
   "CTST": "Bài 54. Xếp hình, vẽ hình",
   "CD": "Bài: Em vui học Toán (Chủ đề 3)"
  },
  "materials": [
   "Bút màu (1 hộp)",
   "Giấy A4 (6 tờ)",
   "Giấy màu (1 túi)",
   "Giấy bóng kính (2 cái)",
   "Thước kẻ (1 cái)",
   "Kéo (2 cái)"
  ],
  "fit": "cao",
  "assets": [
   "tangram",
   "grid"
  ],
  "tpl": null
 },
 {
  "g": 4,
  "no": 16,
  "title": "Chương trình của em",
  "lead": "Tin học",
  "integrated": [
   "Khoa học"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 16. Chương trình của em",
   "CTST": "Bài 14. Điều khiển nhân vật chuyển động trên sân khấu",
   "CD": "Chủ đề F _ Bài 7. Thực hành tạo chương trình của em"
  },
  "materials": [
   "Giấy A4 (3 tờ)",
   "Bút chì (1 chiếc)",
   "Bút màu (1 hộp)"
  ],
  "fit": "thap",
  "assets": [
   "computer",
   "kid"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 1,
  "title": "Tách muối ra khỏi dung dịch",
  "lead": "Khoa học",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung bài Mô hình thuyền buồm (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 12: Bài 11. Sử dụng năng lượng mặt trời, năng lượng gió, năng lượng nước chảy",
   "CTST": "Tuần 12: Bài 11. Năng lượng mặt trời, gió và nước chảy",
   "CD": "Tuần 12: Bài 6. Năng lượng mặt trời, năng lượng gió và năng lượng nước chảy"
  },
  "materials": [
   "Que gạt (6 hộp)",
   "Nước (1 cốc)",
   "Giấy thấm (6 tờ)"
  ],
  "fit": "cao",
  "assets": [
   "sea",
   "sun",
   "pot",
   "jar"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 2,
  "title": "Dụng cụ học số thập phân",
  "lead": "Toán",
  "integrated": [
   "Công nghệ"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 14. Luyện tập chung",
   "CTST": "Bài 23. Em làm được những gì?",
   "CD": "Bài 24. Em vui học ToánCánh diều"
  },
  "materials": [
   "Bìa trắng (1 tấm)",
   "Bìa màu (1 tấm)",
   "Bìa các-tông (1 tấm)",
   "Keo dán (1 lọ)",
   "Kéo (1 cái)",
   "Dập ghim (1 cái)"
  ],
  "fit": "vua",
  "assets": [
   "card",
   "ruler",
   "grid"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 3,
  "title": "Biến đổi chất",
  "lead": "Khoa học",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung bài Biến đổi chất (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 8: Bài 5. Sự biến đổi hoá học của chất",
   "CTST": "Tuần 8: Bài 4. Biến đổi chất",
   "CD": "Tuần 8: Bài 4. Sự biến đổi hoá học của chất"
  },
  "materials": [
   "Giấy trắng (5 tờ)",
   "Tăm bông (5 chiếc)",
   "Phong bì (5 chiếc)",
   "Quả chanh (2 quả)",
   "Diêm (1 bao)",
   "Cốc nhựa (1 cái)",
   "Mẩu bim bim (Mẩu)"
  ],
  "fit": "vua",
  "assets": [
   "jar",
   "pot",
   "cup"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 4,
  "title": "Mạch điện đơn giản",
  "lead": "Khoa học",
  "integrated": [
   "Công nghệ"
  ],
  "when": "Khi dạy nội dung bài Mạch điện đơn giản (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 9: Bài 9. Mạch điện đơn giản. Vật dẫn điện, vật cách điện",
   "CTST": "Tuần 9: Bài 7. Mạch điện đơn giản",
   "CD": "Tuần 9: Bài 7. Năng lượng điện"
  },
  "materials": [
   "Bộ lắp mạch điện đơn giản (1 hộp/nhóm)",
   "Kéo (1 cái/nhóm)",
   "Dây dẫn điện (4 đoạn/nhóm)",
   "Giấy nhôm (1 cuộn/nhóm)",
   "Pin nút 3V CR2032 (1 viên/nhóm)",
   "2 Pin AA 1,5V và hộp pin (1 bộ / nhóm)",
   "Đèn led và đèn vonfram (1 cái/nhóm)",
   "Băng keo điện 2 cm (1 cuộn/nhóm)",
   "Ống hút (dài 20 cm) (5 cái/nhóm)",
   "Kẹp giấy tam giác (3 cái/nhóm)",
   "Băng keo trang trí (1 cuộn/nhóm)",
   "Bút màu (1 hộp/1 nhóm)",
   "Giấy màu (10 tờ/nhóm)",
   "Giấy bóng kính (4 tờ/ nhóm)",
   "Đất nặn khô (1 gói/nhóm)"
  ],
  "fit": "cao",
  "assets": [
   "battery",
   "switch",
   "bulb"
  ],
  "tpl": "circuit"
 },
 {
  "g": 5,
  "no": 5,
  "title": "Mô hình thuyền buồm",
  "lead": "Khoa học",
  "integrated": [
   "Toán",
   "Mĩ thuật",
   "Công nghệ"
  ],
  "when": "Khi dạy nội dung bài Năng lượng mặt trời, gió và nước (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 12: Bài 11. Sử dụng năng lượng mặt trời, năng lượng gió, năng lượng nước chảy",
   "CTST": "Tuần 12: Bài 11. Năng lượng mặt trời, gió và nước chảy",
   "CD": "Tuần 12: Bài 6. Năng lượng mặt trời, năng lượng gió và năng lượng nước chảy"
  },
  "materials": [
   "Đất nặn (1 hộp)",
   "Giấy màu (10 tờ)",
   "Giấy nến (1 cuộn)",
   "Băng dính, keo nến (1 cuộn)",
   "Vỏ hộp sữa (5 vỏ)",
   "Ống hút/ Que gỗ dài (5 cái)"
  ],
  "fit": "cao",
  "assets": [
   "sailboat",
   "sea",
   "wind-sock"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 6,
  "title": "Thực hành trải nghiệm cùng bộ lắp ghép hình Tangram",
  "lead": "Toán",
  "integrated": [
   "Công nghệ"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 28. Thực hành và trải nghiệm đo, vẽ, lắp ghép, tạo hình",
   "CTST": "Bài 51. Thực hành và trải nghiệm",
   "CD": "Bài 78. Em vui học Toán"
  },
  "materials": [
   "Nam châm lá (1 tờ)",
   "Giấy A4 (5 tờ)",
   "Hộp màu (1 hộp)",
   "Thước kẻ (1 chiếc)",
   "Kéo (1 cái)",
   "Bút chì (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "tangram"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 7,
  "title": "Trồng cây không hạt",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật",
   "Công nghệ"
  ],
  "when": "Khi dạy nội dung bài Sự phát triển của cây con (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 16: Hoạt động 2, 3 của bài 14. Sự phát triển của cây con",
   "CTST": "Tuần 16: Hoạt động 3, 4 của bài 14. Sự lớn lên và phát triển của thực vật",
   "CD": "Tuần 16: Hoạt động 2, 3 của bài 9. Sự lớn lên và phát triển của thực vật có hoa"
  },
  "materials": [
   "Bộ phận một số cây cảnh (5 loại cây)",
   "Đất trồng (5 kg)",
   "Dây gai (1 cuộn)",
   "Chậu trồng/ Chai nhựa (1 cái)",
   "Găng tay (1 đôi)",
   "Xẻng (1 cái)",
   "Kéo cắt cây (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "pot-plant",
   "plant-parts",
   "jar"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 8,
  "title": "Triển lãm sản phẩm STEM cuối học kì 1",
  "lead": "Liên môn",
  "integrated": [],
  "when": "",
  "timing": {},
  "materials": [
   "Giấy màu",
   "Bút màu",
   "Bìa các-tông",
   "Keo dán",
   "Các sản phẩm STEM đã làm ở học kì 1"
  ],
  "fit": "vua",
  "assets": [
   "sign",
   "label",
   "materials"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 9,
  "title": "Vòng đời của động vật",
  "lead": "Khoa học",
  "integrated": [
   "Mĩ thuật",
   "Toán"
  ],
  "when": "Khi dạy nội dung bài Sự phát triển của cây con (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 16: Hoạt động 2, 3 của bài 14. Sự phát triển của cây con",
   "CTST": "Tuần 16: Hoạt động 3, 4 của bài 14. Sự lớn lên và phát triển của thực vật",
   "CD": "Tuần 16: Hoạt động 2, 3 của bài 9. Sự lớn lên và phát triển của thực vật có hoa"
  },
  "materials": [
   "Giấy bìa A4 (5 tờ)",
   "Đất nặn (1 hộp)",
   "Giấy màu (5 tờ)",
   "Kéo (1 cái)",
   "Bút chì (1 cái)",
   "Băng dính (1 cuộn)",
   "Hồ dán (1 lọ)",
   "Ống giấy (5 ống)",
   "Súng bắn keo (1 cái)"
  ],
  "fit": "cao",
  "assets": [
   "egg",
   "tadpole",
   "frog",
   "caterpillar",
   "butterfly",
   "chicken"
  ],
  "tpl": "lifecycle"
 },
 {
  "g": 5,
  "no": 10,
  "title": "Vi khuẩn có ích trong chế biến thực phẩm",
  "lead": "Khoa học",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung bài Vi khuẩn có ích trong chế biến thực phẩm (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 21: Bài 19. Vi khuẩn có ích trong chế biến thực phẩm",
   "CTST": "Tuần 21: Bài 19. Vi khuẩn có ích trong chế biến thực phẩm",
   "CD": "Tuần 21: Bài 13. Vi khuẩn có ích trong chế biến thực phẩm"
  },
  "materials": [
   "Giấy màu (3 tờ)",
   "Giấy oli (10 tờ)",
   "Giấy bìa (1 tờ)",
   "Kéo (1 cái)",
   "Keo dán (1 lọ)",
   "Bút màu (1 hộp)",
   "Bút chì (1 cái)",
   "Dây duy băng (1 dây)"
  ],
  "fit": "vua",
  "assets": [
   "jar",
   "cup"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 11,
  "title": "Xe ô tô cánh quạt chạy bằng pin",
  "lead": "Công nghệ",
  "integrated": [
   "Toán"
  ],
  "when": "Khi dạy nội dung bài Lắp ráp mô hình xe điện chạy bằng pin (môn Công nghệ)",
  "timing": {
   "KNTT": "Tuần 21: Bài 7. Lắp ráp mô hình xe điện chạy bằng pin",
   "CTST": "Tuần 21: Bài 7. Lắp ráp mô hình xe điện chạy bằng pin",
   "CD": "Tuần 21: Bài 8. Lắp ráp mô hình xe điện chạy bằng pin"
  },
  "materials": [
   "Hộp pin (1 hộp)",
   "Động cơ cánh quạt (1 chiếc)",
   "Giấy bìa các tông (2 bìa)",
   "Nắp chai nhựa (4 nắp)",
   "Kéo (1 cái)",
   "Compa (1 cái)",
   "Thước kẻ (1 cái)",
   "Ống hút nhựa (4 cái)",
   "Que tre (2 cái)"
  ],
  "fit": "cao",
  "assets": [
   "fan-car",
   "battery",
   "motor"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 12,
  "title": "Sử dụng máy tính cầm tay",
  "lead": "Toán",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 42. Máy tính cầm tay",
   "CTST": "Bài 60. Sử dụng máy tính cầm tay",
   "CD": "Bài 44. Sử dụng máy tính cầm tay"
  },
  "materials": [
   "Giấy A4 (3 tờ)",
   "Bút màu (1 hộp)",
   "Kéo (1 cái)",
   "Giấy màu",
   "Máy tính cầm tay (1 cái)"
  ],
  "fit": "vua",
  "assets": [
   "calculator"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 13,
  "title": "Máy phát điện gió",
  "lead": "Công nghệ",
  "integrated": [
   "Khoa học",
   "Toán",
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung bài Mô hình máy phát điện gió (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 23: Bài 8. Mô hình máy phát điện gió",
   "CTST": "Tuần 23: Bài 8. Mô hình máy phát điện gió",
   "CD": "Tuần 23: Bài 9. Mô hình máy phát điện gió"
  },
  "materials": [
   "Tua vít (1 cái)",
   "Súng bắn keo, nến (1 cái)",
   "Que gỗ (5 cái)",
   "Động cơ điện một chiều (1 chiếc)",
   "Bóng đèn (1 chiếc)",
   "Dây điện (2 sợi)"
  ],
  "fit": "cao",
  "assets": [
   "turbine",
   "bulb",
   "wind-sock"
  ],
  "tpl": "turbine"
 },
 {
  "g": 5,
  "no": 14,
  "title": "Ngôi nhà nhỏ tiện ích",
  "lead": "Toán",
  "integrated": [
   "Công nghệ",
   "Mĩ thuật"
  ],
  "when": "",
  "timing": {
   "KNTT": "Bài 28. Thực hành và trải nghiệm đo, vẽ, lắp ghép, tạo hình",
   "CTST": "Bài 51. Thực hành và trải nghiệm",
   "CD": "Bài 78. Em vui học Toán"
  },
  "materials": [
   "Hồ dán (1 lọ)",
   "Dập ghim (1 chiếc)",
   "Kéo (1 chiếc)",
   "Bút màu (1 hộp)",
   "Giấy bìa kẻ ô vuông (10 tờ)",
   "Bìa màu (10 tờ)",
   "Bìa xốp (10 tờ)"
  ],
  "fit": "cao",
  "assets": [
   "mini-house",
   "sun",
   "bulb"
  ],
  "tpl": null
 },
 {
  "g": 5,
  "no": 15,
  "title": "Cẩm nang chăm sóc sức khoẻ tuổi dậy thì",
  "lead": "Khoa học",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung bài Chăm sóc sức khoẻ tuổi dậy thì (môn Khoa học)",
  "timing": {
   "KNTT": "Tuần 28: Bài 25. Chăm sóc sức khoẻ tuổi dậy thì",
   "CTST": "Tuần 28: Bài 25. Chăm sóc sức khoẻ tuổi dậy thì",
   "CD": "Tuần 28: Bài 17. Chăm sóc và bảo vệ sức khoẻ tuổi dậy thì"
  },
  "materials": [
   "Giấy màu (15 tờ)",
   "Kéo (1 cái)",
   "Keo dán (1 lọ)",
   "Bút màu (1 hộp)",
   "Bút chì (1 cái)",
   "Dây duy băng (1 cuộn)",
   "Băng dính (1 cuộn)",
   "Tranh ảnh"
  ],
  "fit": "thap",
  "assets": [],
  "tpl": null
 },
 {
  "g": 5,
  "no": 16,
  "title": "Lập trình trò chơi",
  "lead": "Tin học",
  "integrated": [
   "Mĩ thuật"
  ],
  "when": "Khi dạy nội dung bài Tạo chương trình theo kịch bản (môn Tin học)",
  "timing": {
   "KNTT": "Tuần 32: Bài 16. Từ kịch bản đến chương trình",
   "CTST": "Tuần 32: Bài 15. Thực hành tạo chương trình theo kịch bản",
   "CD": "Tuần 33: Bài 14. Thực hành viết kịch bản và tạo chương trình"
  },
  "materials": [
   "Bút màu (1 hộp)",
   "Giấy A4 (6 tờ)",
   "Bìa màu (6 tờ)",
   "Bút lông (3 cái)"
  ],
  "fit": "thap",
  "assets": [
   "computer"
  ],
  "tpl": null
 }
];

export const FIT_LABEL: Record<StemLesson['fit'], string> = { cao: 'Rất hợp 3D', vua: 'Hợp vừa', thap: 'Nên dùng 2D' };
export const stemKey = (s: Pick<StemLesson, 'g' | 'no'>) => `${s.g}-${s.no}`;
