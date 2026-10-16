import Link from 'next/link';
import MiloMascot from '@/components/mascot/MiloMascot';

export default function NotConfigured({ title }: { title: string }) {
  return (
    <section className="dash-empty">
      <MiloMascot size={96} />
      <div>
        <h1>{title}</h1>
        <p>Chưa kết nối Supabase nên chưa có tài khoản và dữ liệu thật. Các bài học và game vẫn dùng được như bình thường.</p>
        <p>Hướng dẫn cấu hình: <code>docs/AUTH-SETUP.md</code>.</p>
        <Link href="/chon-bai" className="btn btn-primary">Vào học</Link>
      </div>
    </section>
  );
}
