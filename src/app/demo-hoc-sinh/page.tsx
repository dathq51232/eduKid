import type { Metadata } from 'next';
import StudentHomeDemo from '@/components/student/StudentHomeDemo';

export const metadata: Metadata = {
  title: 'Demo trang chủ học sinh · EduChain Kids',
  robots: { index: false, follow: false },
};

/** Trang demo (dữ liệu mẫu): trang chủ học sinh theo hướng kết hợp — lớp 1–2 "Lớp học của Milo", lớp 3–5 thẻ học có tiến độ */
export default function DemoStudentHomePage() {
  return <StudentHomeDemo />;
}
