import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from 'next/server';
import { learningGate, parseGate } from '@/lib/auth/gate';
import type { Gate } from '@/lib/billing';
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
  // (mỗi lần chuyển trang đỡ một lượt gọi mạng). Trang đọc người dùng từ token (getViewer), API quyền cao xác thực lại bằng getUser (getVerifiedViewer); RLS vẫn kiểm tra.
  const path = request.nextUrl.pathname;
  const gated = GATED.includes(path) || path.startsWith('/hoc-sinh/de/');
  const { exp, sub } = sessionInfo(request);
  const fresh = Boolean(exp && exp * 1000 - Date.now() > 5 * 60_000);
  if (!gated && fresh) return response;

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

  // Trang học + token còn hạn: hỏi thẳng cổng học (my_learning_gate) — PostgREST tự kiểm chữ ký token, nên khỏi gọi
  // Supabase Auth trước (mỗi lần học sinh mở bài đỡ một vòng mạng). Token giả / bị thu hồi -> hàm báo lỗi -> đi đường đầy đủ bên dưới.
  let gate: Gate | null = null;
  let fromCache = false;
  if (gated && fresh) {
    // Đã kiểm tra "còn được học" trong 5 phút gần đây (cookie có ký số, gắn với đúng tài khoản): khỏi hỏi database.
    gate = sub ? await readGateCache(request, sub) : null;
    fromCache = Boolean(gate);
    if (!gate) {
      const { data, error } = await supabase.rpc('my_learning_gate');
      gate = parseGate(data, error);
    }
  }

  if (!gate) {
    // Không chèn code giữa createServerClient và getUser: dễ gây lỗi đăng xuất ngẫu nhiên.
    const { data } = await supabase.auth.getUser();

    // Bắt buộc đăng nhập mới được học / chơi (để mọi bài làm của học sinh đều được lưu và thầy cô xem được).
    // Chưa đăng nhập -> chuyển tới trang đăng nhập, đăng nhập xong quay lại đúng trang đang mở.
    if (!data.user && requiresLogin(path)) {
      const redirect = toLogin(request);
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    }
    if (data.user && gated) gate = await learningGate(supabase, data.user.id);
  }
  // Chỉ nhớ kết quả "còn được học": hết hạn thì không nhớ, để đóng phí xong là học được ngay.
  if (gate?.active && !fromCache) {
    const uid = sub ?? null;
    const v = uid ? await signGate(uid, gate) : null;
    if (v) response.cookies.set(GATE_COOKIE, v, { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: GATE_TTL_S });
  }

  // Học sinh: (1) hết hạn học phí -> chỉ còn trang của em + trang đóng phí; (2) chỉ học nội dung KHỐI CỦA MÌNH.
  // Thông tin lấy từ database (my_learning_gate), không tin tham số trên URL. Người lớn (giáo viên…) không bị giới hạn.
  if (gate) {
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
    // hết chỗ trong gói của thầy cô (migration 0045) -> trang của em (có thông báo); hết học phí -> trang đóng phí.
    // Hết học phí vẫn làm được BÀI CÔ GIAO (migration 0075): đề cô giao (/hoc-sinh/de/…) và bài học cô đang giao (/lam-bai).
    if (gate.is_student && !gate.active) {
      if (gate.reason === 'plan_locked') return go('/hoc-sinh');
      if (!(await assignedWork(supabase, path, request.nextUrl.searchParams))) return go('/hoc-sinh/dong-phi');
    }
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

/** Em hết hạn học phí vẫn được mở: đề cô giao, bài học cô đang giao cho em (hỏi database, không tin URL) */
async function assignedWork(supabase: ReturnType<typeof createServerClient>, path: string, q: URLSearchParams): Promise<boolean> {
  if (path.startsWith('/hoc-sinh/de/')) return true;
  const lesson = q.get('lessonId');
  if (path !== '/lam-bai' || !lesson) return false;
  const { data, error } = await supabase.rpc('student_assigned_lesson', { p_lesson: lesson });
  return !error && data === true;
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

/** Hạn (giây, epoch) và mã người dùng (sub) của access token trong cookie phiên Supabase — chỉ đọc để quyết định có cần
 *  làm mới phiên / dùng cookie cổng học không, KHÔNG dùng để xác thực. Cookie có thể bị chia nhỏ (.0, .1…) và có tiền tố "base64-". */
function sessionInfo(request: NextRequest): { exp: number | null; sub: string | null } {
  try {
    const all = request.cookies.getAll().filter((c) => c.name.startsWith('sb-') && /-auth-token(\.\d+)?$/.test(c.name));
    if (!all.length) return { exp: null, sub: null };
    const raw = all.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true })).map((c) => c.value).join('');
    const json = raw.startsWith('base64-') ? b64decode(raw.slice(7)) : raw;
    const v = JSON.parse(json) as { expires_at?: number; access_token?: string } | null;
    let sub: string | null = null;
    const part = v?.access_token?.split('.')[1];
    if (part) { const p = JSON.parse(b64decode(part)) as { sub?: unknown }; if (typeof p.sub === 'string') sub = p.sub; }
    return { exp: typeof v?.expires_at === 'number' ? v.expires_at : null, sub };
  } catch {
    return { exp: null, sub: null };
  }
}

function b64decode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

/* ---------------------------------------------------------- cookie cổng học (giảm gọi my_learning_gate) */
// Giá trị: "<sub>.<is_student 0|1>.<grade|->.<hết hạn ms>.<HMAC-SHA256>" — ký bằng khoá bí mật của máy chủ nên không tự sửa được;
// gắn với sub của phiên → đổi tài khoản trên cùng máy thì cookie cũ vô hiệu. Không có khoá bí mật thì không dùng cookie này.
const GATE_COOKIE = 'edukid_gate';
const GATE_TTL_S = 300;
const gateSecret = () => process.env.GATE_CACHE_SECRET || process.env.STUDENT_PIN_PEPPER || '';

async function hmac(text: string): Promise<string | null> {
  const secret = gateSecret();
  if (!secret) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signGate(sub: string, gate: Gate): Promise<string | null> {
  const body = `${sub}.${gate.is_student ? 1 : 0}.${gate.grade ?? '-'}.${Date.now() + GATE_TTL_S * 1000}`;
  const sig = await hmac(body);
  return sig ? `${body}.${sig}` : null;
}

async function readGateCache(request: NextRequest, sub: string): Promise<Gate | null> {
  const v = request.cookies.get(GATE_COOKIE)?.value;
  if (!v) return null;
  const parts = v.split('.');
  if (parts.length !== 5 || parts[0] !== sub || Number(parts[3]) < Date.now()) return null;
  const sig = await hmac(parts.slice(0, 4).join('.'));
  if (!sig || sig !== parts[4]) return null;
  const isStudent = parts[1] === '1';
  const grade = parts[2] === '-' ? null : Number(parts[2]);
  return { is_student: isStudent, grade, active: true, reason: isStudent ? 'paid' : 'not_student', until: null };
}
