import Link from 'next/link';
import { Award, FileText, MessageSquareHeart, NotebookPen, Radar, Send, SpellCheck, Table2 } from 'lucide-react';

/** 8 công cụ của giáo viên cho một lớp — hiện ngay ở trang "Lớp của tôi" (/giao-vien). */
export default function TeacherTools({ classId, className }: { classId: string; className: string }) {
  return (
    <section className="dash-section teacher-tools-wrap no-print" aria-labelledby="teacher-tools-title">
      <h2 id="teacher-tools-title">Công cụ cho lớp {className}</h2>
      <nav className="teacher-tools" aria-label="Công cụ giáo viên">
        <Link href={`/giao-vien/lop/${classId}/ke-hoach`} className="tool-card tone-green">
          <NotebookPen aria-hidden="true" /><strong>Kế hoạch bài dạy</strong><span>Giáo án soạn sẵn theo bài, sửa, nhân bản, lịch báo giảng tuần, tải Word</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/giao-bai`} className="tool-card tone-blue">
          <Send aria-hidden="true" /><strong>Giao bài về nhà</strong><span>Chọn bài, hạn nộp; xem em nào đã làm, em nào chưa</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/lo-hong`} className="tool-card tone-red">
          <Radar aria-hidden="true" /><strong>Lỗ hổng kiến thức</strong><span>Dạng bài lớp hay sai, em cần kèm, giao bài ôn ngay</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/de-kiem-tra`} className="tool-card tone-green">
          <Table2 aria-hidden="true" /><strong>Ma trận và đề kiểm tra</strong><span>Lập ma trận 3 mức, đề A/B, xuất Word hoặc giao làm trên app</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/phieu-bai-tap`} className="tool-card tone-yellow">
          <FileText aria-hidden="true" /><strong>Phiếu bài tập</strong><span>Phiếu in theo bài đang học, đáp án trang riêng</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/phieu-chinh-ta`} className="tool-card tone-blue">
          <SpellCheck aria-hidden="true" /><strong>Phiếu chính tả</strong><span>c/k, g/gh, ng/ngh, s/x, l/n, ch/tr, h/th/kh: phiếu có tranh, tập chép, đáp án; mỗi lần một phiếu mới</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/phieu-tien-bo`} className="tool-card tone-coral">
          <MessageSquareHeart aria-hidden="true" /><strong>Phiếu báo tiến bộ</strong><span>Lời nhắn cho phụ huynh theo tuần, tháng: điểm mạnh, cần cố gắng, gợi ý ở nhà</span>
        </Link>
        <Link href={`/giao-vien/lop/${classId}/thu-khen`} className="tool-card tone-purple">
          <Award aria-hidden="true" /><strong>Thư khen</strong><span>Chọn mẫu, tạo thư cho các em được khen; tải PDF, ảnh PNG hoặc in</span>
        </Link>
      </nav>
    </section>
  );
}
