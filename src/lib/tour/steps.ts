// Nội dung các bước hướng dẫn lần đầu (GuidedTour). target = giá trị thuộc tính data-tour của phần tử cần làm sáng;
// cùng một giá trị có thể gắn ở nhiều chỗ (menu máy tính + thanh tab điện thoại): lấy chỗ đang hiện trên màn hình.
// Bước có target mà không tìm thấy phần tử đang hiện thì tự bỏ qua. Đổi nội dung lớn → tăng số cuối mã tour (-v2)
// để người dùng cũ được xem lại.
export type TourStep = { target?: string; title: string; body: string };
export type TourId = 'gv-moi-v1' | 'gv-lop-v1' | 'ph-tai-khoan-v1' | 'ph-con-v1';

export const TOURS: Record<TourId, TourStep[]> = {
  // Giáo viên chưa có lớp
  'gv-moi-v1': [
    { title: 'Chào mừng thầy cô đến EduChain Kids!', body: 'Chỉ mất khoảng 1 phút để làm quen. Bấm “Tiếp theo” để đi qua từng chức năng chính.' },
    { target: 'tao-lop', title: 'Bước đầu tiên: tạo lớp', body: 'Nhập tên lớp và khối. Tạo xong, thầy cô có mã lớp để gửi phụ huynh, học sinh và in thẻ đăng nhập cho các em.' },
    { target: 'tim-nhanh', title: 'Tìm nhanh mọi thứ', body: 'Bấm vào đây hoặc nhấn Ctrl + K để tìm tên học sinh hay mở một công cụ bất kỳ.' },
    { target: 'huong-dan', title: 'Xem lại hướng dẫn', body: 'Khi đã tạo lớp, menu sẽ hiện đủ các công cụ và có hướng dẫn tiếp theo. Bấm nút này bất cứ lúc nào để xem lại.' },
  ],
  // Giáo viên đã có lớp (cũng hiện ngay sau khi tạo lớp đầu tiên)
  'gv-lop-v1': [
    { title: 'Lớp đã sẵn sàng!', body: 'Cùng xem nhanh các công cụ để dạy trên lớp, giao bài và liên lạc với phụ huynh.' },
    { target: 'lop', title: 'Lớp và mã lớp', body: 'Bấm mã lớp để chép gửi phụ huynh, học sinh. Bấm “Học sinh” để thêm em, đặt PIN và in thẻ đăng nhập.' },
    { target: 'viec-nhanh', title: 'Việc hằng ngày', body: 'Điểm danh, gọi tên ngẫu nhiên và giao bài ngay từ trang Hôm nay.' },
    { target: 'nhom-tren-lop', title: 'Trên lớp', body: 'Sổ lớp, gọi tên – dò bài, chia nhóm, thi đua tổ và hẹn giờ chiếu bảng.' },
    { target: 'nhom-day-hoc', title: 'Dạy học', body: 'Kế hoạch bài dạy (giáo án, lịch báo giảng), bài giảng và trình chiếu, giao bài về nhà, phiếu bài tập, đề kiểm tra.' },
    { target: 'nhom-danh-gia', title: 'Đánh giá', body: 'Viết nhận xét học sinh theo tuần, học kỳ và ghi kết quả trên trường.' },
    { target: 'nhom-phu-huynh', title: 'Phụ huynh', body: 'Tin nhắn và đơn xin nghỉ của phụ huynh, danh bạ, phiếu báo tiến bộ, thư khen. Số đỏ là tin chưa đọc.' },
    { target: 'nhom-tien-ich', title: 'Tiện ích', body: 'Lịch âm dương, sinh nhật học sinh, quỹ lớp và sổ thu chi riêng của thầy cô.' },
    { target: 'tim-nhanh', title: 'Tìm nhanh', body: 'Nhấn Ctrl + K rồi gõ tên em hoặc tên công cụ để mở ngay.' },
    { target: 'huong-dan', title: 'Xem lại bất cứ lúc nào', body: 'Bấm nút này để xem lại hướng dẫn. Chúc thầy cô một năm học thật vui!' },
  ],
  // Phụ huynh đăng nhập bằng tài khoản người lớn
  'ph-tai-khoan-v1': [
    { title: 'Chào mừng bố mẹ đến EduChain Kids!', body: 'Cùng xem nhanh cách thêm con và theo dõi việc học của con. Bấm “Tiếp theo” để bắt đầu.' },
    { target: 'hoc-tai-nha', title: 'Học tại nhà', body: 'Thêm hồ sơ con để con tự học Toán, Tiếng Việt, Tiếng Anh theo đúng khối lớp. Mỗi con có mã PIN riêng để đăng nhập.' },
    { target: 'ma-moi', title: 'Con học ở trường?', body: 'Nhập mã mời do thầy cô chủ nhiệm gửi để xem tiến độ học của con ở lớp.' },
    { target: 'tien-do', title: 'Tiến độ học tập', body: 'Số bài con đã làm, tỉ lệ đúng và điểm tích luỹ hiện ở đây sau mỗi bài.' },
    { target: 'tien-ich', title: 'Tiện ích gia đình', body: 'Lịch và sổ thu chi của gia đình, chỉ bố mẹ xem được.' },
    { target: 'huong-dan', title: 'Xem lại hướng dẫn', body: 'Bấm nút này bất cứ lúc nào để xem lại.' },
  ],
  // Phụ huynh đăng nhập bằng mã PIN của con (trang theo dõi con ở lớp)
  'ph-con-v1': [
    { title: 'Chào mừng bố mẹ!', body: 'Đây là trang theo dõi con ở lớp. Cùng xem nhanh các mục chính nhé.' },
    { target: 'hom-nay', title: 'Hôm nay của con', body: 'Con có mặt hay vắng, lời khen và ghi chú của cô trong ngày.' },
    { target: 'thang-nay', title: 'Tóm tắt tháng', body: 'Số ngày đi học, số lần cô khen, nhắc nhở và số bài con luyện trong 7 ngày qua.' },
    { target: 'tin-tu-co', title: 'Tin nhắn từ cô', body: 'Thông báo của lớp và nhận xét hằng ngày dành cho con. Có nút vào nhóm Zalo lớp nếu cô đã thêm.' },
    { target: 'luyen-tap', title: 'Con luyện tập', body: 'Số bài mỗi ngày, độ đúng theo môn và gợi ý môn con cần luyện thêm.' },
    { target: 'nhan-co', title: 'Nhắn cô', body: 'Xin phép cho con nghỉ học hoặc hỏi han cô. Cô trả lời sẽ có thông báo ở đầu trang.' },
    { target: 'tien-ich', title: 'Tiện ích gia đình', body: 'Lịch và sổ thu chi riêng của gia đình.' },
    { target: 'huong-dan', title: 'Xem lại hướng dẫn', body: 'Bấm nút này bất cứ lúc nào để xem lại.' },
  ],
};
