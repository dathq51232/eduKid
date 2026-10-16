import { LogOut } from 'lucide-react';

// Đăng xuất bằng POST (không dùng link GET để tránh bị đăng xuất ngoài ý muốn)
export default function SignOutButton({ className = 'btn btn-outline btn-sm' }: { className?: string }) {
  return (
    <form action="/dang-xuat" method="post">
      <button type="submit" className={className}><LogOut aria-hidden="true" /> Đăng xuất</button>
    </form>
  );
}
