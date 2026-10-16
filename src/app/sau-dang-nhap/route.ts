import { NextResponse } from 'next/server';
import { getViewer, homeFor } from '@/lib/auth/viewer';
import { safeNext } from '@/lib/auth/safe-next';

// Sau khi đăng nhập: về trang được yêu cầu (nếu là đường dẫn nội bộ) hoặc trang chính theo vai trò.
// Trang đích vẫn tự kiểm tra quyền ở máy chủ.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  if (viewer.state !== 'ok') return NextResponse.redirect(new URL('/dang-nhap', url));
  const next = safeNext(url.searchParams.get('next'));
  return NextResponse.redirect(new URL(next || homeFor(viewer), url));
}
