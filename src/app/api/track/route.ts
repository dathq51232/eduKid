import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { normalizePath } from '@/lib/analytics/path';
import { rateLimit } from '@/lib/rate-limit';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

// Đếm lượt truy cập ẩn danh cho trang Quản trị. Trình duyệt chỉ gửi đường dẫn (đã rút gọn lại ở đây) và cờ "lượt xem";
// mã khách là cookie ngẫu nhiên, máy chủ băm cùng NGÀY trước khi lưu → không lưu IP, không truy ngược được người dùng.
const COOKIE = 'edk_vid';

export async function POST(request: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });
  if (!hasSupabaseEnv()) return ok;

  let vid = request.cookies.get(COOKIE)?.value ?? '';
  const isNew = !/^[0-9a-f]{32}$/.test(vid);
  if (isNew) vid = randomBytes(16).toString('hex');
  const res = new NextResponse(null, { status: 204 });
  if (isNew) res.cookies.set(COOKIE, vid, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 365 * 86400 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`trk:${vid}`, 240, 3600_000) || !rateLimit(`trkip:${ip}`, 1500, 3600_000)) return res;

  const body = (await request.json().catch(() => ({}))) as { p?: unknown; v?: unknown; u?: { s?: unknown; c?: unknown; k?: unknown } };
  const path = normalizePath(typeof body.p === 'string' ? body.p : '/');
  if (path.startsWith('/api')) return res;
  const ua = request.headers.get('user-agent') ?? '';
  if (/bot|crawl|spider|slurp|headless|lighthouse/i.test(ua)) return res;
  const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
  const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); // ngày theo giờ Việt Nam
  const hashed = createHash('sha256').update(`${vid}:${day}`).digest('hex').slice(0, 32);

  try {
    const supabase = await createClient();
    await supabase.rpc('track_visit', { p_vid: hashed, p_path: path, p_device: device, p_view: body.v !== 0 });
    // Link marketing (UTM): lượt bấm link / lượt vào trang đăng ký — cùng mã khách đã băm, đếm mỗi khách 1 lần / ngày
    const u = body.u;
    if (u && typeof u.s === 'string' && typeof u.c === 'string' && (u.k === 'click' || u.k === 'signup_page')) {
      await supabase.rpc('track_campaign', { p_vid: hashed, p_source: u.s.slice(0, 20), p_campaign: u.c.slice(0, 40), p_kind: u.k });
    }
  } catch {
    // thống kê lỗi không được ảnh hưởng người dùng
  }
  return res;
}
