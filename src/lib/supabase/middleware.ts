import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from 'next/server';

// Làm mới phiên đăng nhập Supabase ở mỗi request để Server Components đọc được user.
// Chưa cấu hình biến môi trường thì bỏ qua, trang minh họa vẫn chạy bình thường.
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Không chèn code giữa createServerClient và getUser: dễ gây lỗi đăng xuất ngẫu nhiên.
  await supabase.auth.getUser();
  return response;
}
