'use client';

// Thẻ “Tiếng Anh của cô” trên bảng giáo viên kéo theo ngân hàng câu & lộ trình (~150 KB):
// tải sau khi trang đã hiện để bảng giáo viên mở nhanh hơn.
import dynamic from 'next/dynamic';

const TeacherEnglishCard = dynamic(() => import('./TeacherEnglishCard'), {
  ssr: false,
  loading: () => <div className="te-card-ph" aria-hidden="true" style={{ minHeight: 132, borderRadius: 18, background: 'var(--surface-2, rgb(148 163 184 / .12))' }} />,
});

export default TeacherEnglishCard;
