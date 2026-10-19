import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from 'next/server';
import { studentGradeOf } from '@/lib/auth/student-grade';
import { lessonGradeFromId } from '@/lib/basics';

// Làm mới phiên đăng nhập Supabase ở mỗi request để Server Components đọc được user.
// Chưa cấu hình biến môi trường thì bỏ qua, trang minh họa vẫn chạy bình thường.
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  // Không có cookie phiên Supabase = chắc chắn chưa đăng nhập: bỏ qua lệnh gọi mạng tới Supabase Auth
  // (trang chủ, trang đăng nhập… của khách mở nhanh hơn).
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
  if (!hasSession) return requiresLogin(request.nextUrl.pathname) ? toLogin(request) : response;

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
  const { data } = await supabase.auth.getUser();

  // Bắt buộc đăng nhập mới được học / chơi (để mọi bài làm của học sinh đều được lưu và thầy cô xem được).
  // Chưa đăng nhập -> chuyển tới trang đăng nhập, đăng nhập xong quay lại đúng trang đang mở.
  if (!data.user && requiresLogin(request.nextUrl.pathname)) {
    const redirect = toLogin(request);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Học sinh chỉ học nội dung KHỐI CỦA MÌNH: mở bài / chọn bài của khối khác -> về trang chọn bài đúng khối.
  // Khối lấy từ database (lớp em đang học), không tin tham số trên URL. Người lớn (giáo viên…) không bị giới hạn.
  const path = request.nextUrl.pathname;
  if (data.user && GRADE_LOCKED.includes(path)) {
    const grade = await studentGradeOf(supabase, data.user.id);
    if (grade) {
      const q = request.nextUrl.searchParams;
      const asked = Number(q.get('grade') ?? grade);
      const lessonGrade = path === '/lam-bai' ? lessonGradeFromId(q.get('lessonId')) : null;
      if (asked !== grade || (lessonGrade !== null && lessonGrade !== grade)) {
        const to = request.nextUrl.clone();
        to.pathname = '/chon-bai';
        to.search = '';
        to.searchParams.set('grade', String(grade));
        const subject = q.get('subject');
        if (subject === 'toan' || subject === 'tieng-viet' || subject === 'tieng-anh') to.searchParams.set('subject', subject);
        const redirect = NextResponse.redirect(to);
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        redirect.cookies.set(GRADE_COOKIE, String(grade), { path: '/', sameSite: 'lax', maxAge: 12 * 3600 });
        return redirect;
      }
      // Gợi ý cho giao diện (ẩn nút chọn lớp khác). Chỉ để hiển thị — việc chặn nằm ở đây và ở /api/tien-do.
      if (request.cookies.get(GRADE_COOKIE)?.value !== String(grade)) response.cookies.set(GRADE_COOKIE, String(grade), { path: '/', sameSite: 'lax', maxAge: 12 * 3600 });
    } else if (request.cookies.get(GRADE_COOKIE)) {
      response.cookies.delete(GRADE_COOKIE);
    }
  }
  return response;
}

const GRADE_LOCKED = ['/chon-bai', '/lam-bai'];
export const GRADE_COOKIE = 'edukid_grade';

function toLogin(request: NextRequest) {
  const login = request.nextUrl.clone();
  login.pathname = '/dang-nhap';
  login.search = '';
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

/** Các khu vực học tập cần đăng nhập (trang chủ, đăng nhập, đăng ký… vẫn mở tự do) */
const LOGIN_REQUIRED = ['/chon-bai', '/lam-bai', '/ket-qua', '/tro-choi', '/thanh-tich'];
export function requiresLogin(pathname: string): boolean {
  return LOGIN_REQUIRED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
