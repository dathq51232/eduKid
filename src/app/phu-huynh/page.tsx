import { redirect } from 'next/navigation';

// Mục phụ huynh đã được bỏ. Giữ đường dẫn cũ để liên kết/bookmark cũ không lỗi 404: chuyển về trang chủ.
export default function ParentsPage() {
  redirect('/');
}
