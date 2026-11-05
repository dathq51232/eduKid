import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { countTodayUsage, loadTeacherAiConfig, logAiUsage } from '@/lib/ai/teacher-keys';
import { chatCompletion, isRetryable, type ProviderId } from '@/lib/ai/providers';

// Gợi ý ý tưởng dạy học cho một tiết (4 hoạt động: khởi động, khám phá, luyện tập, vận dụng).
// Tiết kiệm token: chỉ gửi môn + tên bài + mục tiêu ngắn; trả JSON gọn; trình duyệt lưu lại kết quả
// theo tên bài nên mỗi bài chỉ gọi AI một lần. Đổi thời lượng / bộ lọc được xử lý trên máy, không gọi lại.

export const maxDuration = 60;
const DAILY_LIMIT = 150;
const PHASES = ['kd', 'kp', 'lt', 'vd'] as const;

const Body = z.object({
  subject: z.string().max(60),
  title: z.string().min(2).max(200),
  grade: z.number().int().min(1).max(5).optional(),
  minutes: z.number().int().min(20).max(60).default(35),
  goal: z.string().max(1500).default(''),
});

const SYSTEM = `Bạn là giáo viên tiểu học giỏi ở Việt Nam (chương trình GDPT 2018). Gợi ý hoạt động giúp tiết học sinh động, đúng mục tiêu bài, hợp lứa tuổi, dễ tổ chức trong lớp ~30 em.
Mỗi hoạt động (kd=khởi động, kp=khám phá, lt=luyện tập, vd=vận dụng) cho đúng 3 ý tưởng khác nhau, độ dài và mức sôi động khác nhau (1 ý không cần chuẩn bị).
Chỉ trả JSON, không chữ nào khác:
{"goal":"mục tiêu bài 1 câu","kd":[{"t":"tên ngắn","m":phút,"p":phút chuẩn bị,"mv":0|1 có vận động,"g":0|1 làm nhóm/cặp,"e":1|2|3 mức sôi động,"d":"mô tả 1 câu","s":["bước ngắn",...tối đa 4],"w":"gắn mục tiêu gì"}],"kp":[...],"lt":[...],"vd":[...]}`;

const Idea = z.object({
  t: z.coerce.string().max(80), m: z.coerce.number().min(1).max(30), p: z.coerce.number().min(0).max(60).catch(0),
  mv: z.coerce.number().catch(0), g: z.coerce.number().catch(0), e: z.coerce.number().min(1).max(3).catch(2),
  d: z.coerce.string().max(400), s: z.array(z.coerce.string().max(200)).max(6).catch([]), w: z.coerce.string().max(200).catch(''),
});
export type LessonIdea = z.infer<typeof Idea>;

function parseJson(text: string) {
  const t = text.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  const raw = JSON.parse(s >= 0 && e > s ? t.slice(s, e + 1) : t) as Record<string, unknown>;
  const ideas = Object.fromEntries(PHASES.map((k) => [k, (Array.isArray(raw[k]) ? raw[k] as unknown[] : [])
    .map((x) => Idea.safeParse(x)).filter((r) => r.success).map((r) => r.data!).slice(0, 4)]));
  if (PHASES.some((k) => !ideas[k].length)) throw new Error('thiếu');
  return { goal: typeof raw.goal === 'string' ? raw.goal.slice(0, 300) : '', ideas };
}

export async function POST(request: Request) {
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ cho AI (xem docs/tro-ly-ai.md).' }, { status: 503 });
  if (!rateLimit(`aiidea:${viewer.userId}`, 6, 60_000)) return NextResponse.json({ error: 'Nhanh quá — đợi một phút rồi thử lại nhé.' }, { status: 429 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  const b = parsed.data;

  const config = await loadTeacherAiConfig(viewer.userId);
  if (!config?.openai && !config?.gemini) return NextResponse.json({ error: 'Chưa nối API key — mở Trợ lý AI (nút góc dưới) → Cài đặt API để dán key Gemini (miễn phí) hoặc OpenAI.', code: 'no_key' }, { status: 400 });
  if ((await countTodayUsage(viewer.userId)) >= DAILY_LIMIT) return NextResponse.json({ error: `Đã dùng đủ ${DAILY_LIMIT} lượt AI hôm nay — mai làm tiếp nhé.` }, { status: 429 });

  const user = [
    `Môn ${b.subject}${b.grade ? ` lớp ${b.grade}` : ' (tiểu học)'}. Bài: "${b.title}". Tiết ${b.minutes} phút.`,
    b.goal.trim() ? `Mục tiêu / tóm tắt giáo án: ${b.goal.trim()}` : '',
  ].filter(Boolean).join('\n');

  const order: ProviderId[] = config.preferred === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  let lastErr = 'AI chưa trả lời được, thử lại sau.';
  for (const provider of order) {
    const chosen = provider === 'openai' ? config.openai : config.gemini;
    if (!chosen) continue;
    const r = await chatCompletion(provider, chosen.key, { system: SYSTEM, messages: [{ role: 'user', content: user }], model: chosen.model, maxTokens: 3000 });
    await logAiUsage(viewer.userId, provider, chosen.model, 'lesson-ideas', r.ok, r.ok ? undefined : r.error);
    if (r.ok) {
      try { return NextResponse.json(parseJson(r.data.text)); }
      catch { lastErr = 'AI trả lời sai định dạng — bấm thử lại nhé.'; continue; }
    }
    lastErr = r.error;
    if (!isRetryable(r.httpStatus ?? 0)) break;
  }
  return NextResponse.json({ error: lastErr }, { status: 502 });
}
