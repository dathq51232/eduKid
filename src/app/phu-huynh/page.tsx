import Link from 'next/link';
import { ArrowLeft, BellRing, BookOpenCheck, CalendarDays, HeartHandshake, House, ShieldCheck, UsersRound } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';

const parentSections = [
  { title: 'Thông tin của con', description: 'Xem và cập nhật thông tin liên hệ, người được phép đón trẻ và các lưu ý cần thiết cho giáo viên.', Icon: UsersRound, tone: 'blue', status: 'Cần liên kết tài khoản phụ huynh' },
  { title: 'Tiến bộ học tập', description: 'Theo dõi kỹ năng Toán, Tiếng Việt, nhận xét của cô và những nội dung con nên luyện thêm.', Icon: BookOpenCheck, tone: 'green', status: 'Chờ dữ liệu đánh giá' },
  { title: 'Thông báo nhà trường', description: 'Tập trung thông báo về lịch học, lịch nghỉ, hoạt động, kiểm tra và những việc phụ huynh cần xác nhận.', Icon: BellRing, tone: 'orange', status: 'Chưa kết nối nguồn thông báo' },
  { title: 'Thông tin từ cô chủ nhiệm', description: 'Xem dặn dò của cô, bài tập cần phối hợp tại nhà và hướng dẫn trao đổi riêng khi cần.', Icon: HeartHandshake, tone: 'purple', status: 'Chưa kết nối lớp học' },
];

export default function ParentPortalPage() {
  return (
    <>
      <LearnHeader />
      <main className="parent-portal wrap">
        <Link href="/" className="parent-back"><ArrowLeft size={18} aria-hidden="true" /> Về trang chủ</Link>
        <section className="parent-welcome">
          <div className="parent-welcome-icon"><House size={30} aria-hidden="true" /></div>
          <p className="parent-eyebrow">EDUCHAIN KIDS · GIA ĐÌNH VÀ NHÀ TRƯỜNG</p>
          <h1>Đồng hành cùng con mỗi ngày</h1>
          <p className="parent-intro">Một nơi để phụ huynh cập nhật thông tin của con, theo dõi tiến bộ học tập và không bỏ lỡ thông báo từ nhà trường, cô giáo chủ nhiệm.</p>
          <div className="parent-trust-note"><ShieldCheck size={19} aria-hidden="true" /><span>Thông tin cá nhân của học sinh cần được bảo vệ và chỉ hiển thị cho tài khoản có quyền truy cập.</span></div>
        </section>
        <section className="parent-section" aria-labelledby="parent-tools-title">
          <div className="parent-section-heading">
            <div><p className="parent-eyebrow">KHU VỰC PHỤ HUYNH</p><h2 id="parent-tools-title">Tôi muốn làm gì?</h2></div>
            <span className="parent-grade-note"><CalendarDays size={16} aria-hidden="true" /> Dành cho gia đình có con lớp 1–5</span>
          </div>
          <div className="parent-tools-grid">
            {parentSections.map(({ title, description, Icon, tone, status }) => (
              <article className={`parent-tool-card tone-${tone}`} key={title}>
                <div className="parent-tool-icon"><Icon size={25} aria-hidden="true" /></div>
                <h3>{title}</h3><p>{description}</p><span className="parent-tool-status">{status}</span>
              </article>
            ))}
          </div>
        </section>
        <section className="parent-next-step">
          <div><h2>Bắt đầu bằng tài khoản được xác minh</h2><p>Để cập nhật hồ sơ hoặc xem thông tin riêng của con, hệ thống cần xác minh quan hệ phụ huynh–học sinh trước khi mở quyền truy cập.</p></div>
          <Link href="/dang-nhap?vai=nguoi-lon&next=%2Fphu-huynh" className="btn btn-primary">Đăng nhập <span aria-hidden="true">→</span></Link>
        </section>
        <p className="parent-build-note">Bản giao diện ban đầu: các mục đang là phần giới thiệu, chưa lưu thay đổi hồ sơ và chưa tải thông báo thật từ Supabase. Các chức năng này sẽ được kết nối sau khi xác minh schema và quy tắc phân quyền hiện có.</p>
      </main>
    </>
  );
}
