import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from 'next/server';
import { learningGate } from '@/lib/auth/gate';
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

  // Phiên còn hạn > 5 phút và không phải trang học cần kiểm tra học phí / khối: khỏi gọi Supabase Auth ở middleware
  // (mỗi lần chuyển trang đỡ một lượt gọi mạng). Trang vẫn tự xác thực bằng getUser() trong getViewer, RLS vẫn kiểm tra.
  const path0 = request.nextUrl.pathname;
  const gated = GATED.includes(path0) || path0.startsWith('/hoc-sinh/de/');
  if (!gated) {
    const exp = sessionExpiry(request);
    if (exp && exp * 1000 - Date.now() > 5 * 60_000) return response;
  }

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

  // Học sinh: (1) hết hạn học phí -> chỉ còn trang của em + trang đóng phí; (2) chỉ học nội dung KHỐI CỦA MÌNH.
  // Thông tin lấy từ database (my_learning_gate), không tin tham số trên URL. Người lớn (giáo viên…) không bị giới hạn.
  const path = request.nextUrl.pathname;
  if (data.user && (GATED.includes(path) || path.startsWith('/hoc-sinh/de/'))) {
    const gate = await learningGate(supabase, data.user.id);
    const grade = gate.is_student ? gate.grade : null;
    const go = (pathname: string, params: Record<string, string> = {}) => {
      const to = request.nextUrl.clone();
      to.pathname = pathname;
      to.search = '';
      for (const [k, v] of Object.entries(params)) to.searchParams.set(k, v);
      const redirect = NextResponse.redirect(to);
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      if (grade) redirect.cookies.set(GRADE_COOKIE, String(grade), { path: '/', sameSite: 'lax', maxAge: 12 * 3600 });
      return redirect;
    };
    if (gate.is_student && !gate.active) return go('/hoc-sinh/dong-phi');
    if (grade && GRADE_LOCKED.includes(path)) {
      const q = request.nextUrl.searchParams;
      const asked = Number(q.get('grade') ?? grade);
      const lessonGrade = path === '/lam-bai' ? lessonGradeFromId(q.get('lessonId')) : null;
      if (asked !== grade || (lessonGrade !== null && lessonGrade !== grade)) {
        const subject = q.get('subject');
        return go('/chon-bai', { grade: String(grade), ...(subject === 'toan' || subject === 'tieng-viet' || subject === 'tieng-anh' ? { subject } : {}) });
      }
    }
    // Gợi ý cho giao diện (ẩn nút chọn lớp khác). Chỉ để hiển thị — việc chặn nằm ở đây và ở các API.
    if (grade) {
      if (request.cookies.get(GRADE_COOKIE)?.value !== String(grade)) response.cookies.set(GRADE_COOKIE, String(grade), { path: '/', sameSite: 'lax', maxAge: 12 * 3600 });
    } else if (request.cookies.get(GRADE_COOKIE)) {
      response.cookies.delete(GRADE_COOKIE);
    }
  }
  return response;
}

const GRADE_LOCKED = ['/chon-bai', '/lam-bai'];
/** Phần học bị khoá khi hết hạn học phí (cùng /hoc-sinh/de/…) */
const GATED = ['/chon-bai', '/lam-bai', '/ket-qua', '/tro-choi'];
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

/** Hạn của access token trong cookie phiên Supabase (giây, epoch) — chỉ đọc để quyết định có cần làm mới phiên không,
 *  KHÔNG dùng để xác thực. Cookie có thể bị chia nhỏ (.0, .1…) và có tiền tố "base64-". */
function sessionExpiry(request: NextRequest): number | null {
  try {
    const all = request.cookies.getAll().filter((c) => c.name.startsWith('sb-') && /-auth-token(\.\d+)?$/.test(c.name));
    if (!all.length) return null;
    const raw = all.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })).map((c) => c.value).join('');
    let json = raw;
    if (raw.startsWith('base64-')) {
      const b64 = raw.slice(7).replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
      json = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
    }
    const v = JSON.parse(json) as { expires_at?: number } | null;
    return typeof v?.expires_at === 'number' ? v.expires_at : null;
  } catch {
    return null;
  }
}
