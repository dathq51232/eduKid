import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimitShared } from '@/lib/rate-limit';
import { countTodayUsage, loadTeacherAiConfig, logAiUsage } from '@/lib/ai/teacher-keys';
import { chatCompletion, isRetryable, type ProviderId } from '@/lib/ai/providers';

// Xưởng video: AI soạn bản nháp phân cảnh (mỗi cảnh ~10 giây cho Google Flow) từ nội dung / bài học,
// bằng API key chính chủ của thầy cô (migration 0030). Kết quả là bản nháp để thầy cô sửa rồi mới ghép câu lệnh.

export const maxDuration = 60;
const DAILY_LIMIT = 150;

const Item = z.object({ id: z.string().max(60), name: z.string().max(60), note: z.string().max(200).default('') });
const Body = z.object({
  brief: z.string().min(5).max(6000),
  clipCount: z.number().int().min(1).max(18),
  ratio: z.enum(['16:9', '9:16']),
  narration: z.enum(['vi', 'en', 'none']),
  characters: z.array(Item).max(12),
  settings: z.array(Item).min(1).max(20),
});

const SYSTEM = `Bạn là đạo diễn phim hoạt hình stickman giáo dục cho học sinh tiểu học Việt Nam (6–11 tuổi).
Nhiệm vụ: chia nội dung thành N cảnh, mỗi cảnh khoảng 10 giây, để tạo bằng Google Flow (Veo).
Mạch câu chuyện 5 bước (co giãn theo N): 1) Câu mở gây tò mò (câu hỏi hoặc tình huống lạ) 2) Điều các em hay nghĩ / hay nhầm 3) Khám phá cách làm đúng qua hành động 4) Điều cần nhớ, ngắn gọn 5) Kết vui + lời mời luyện tập thêm.
Quy tắc bắt buộc:
- "beats": đúng 3 câu TIẾNG ANH cho [0–3s], [3–7s], [7–10s]: hành động cụ thể, liên tục của nhân vật (nhảy, chỉ tay, mở sách, xếp khối…), không đứng yên, không biến hình chất lỏng, mỗi 2–3 giây có thay đổi hình.
- "firstFrame" và "endFrame": TIẾNG ANH, mô tả vị trí nhân vật, đồ vật đang cầm; endFrame của cảnh trước phải nối được với cảnh sau (cùng hướng di chuyển, cùng đồ vật, hoặc chuyển cảnh có chủ đích).
- Không có chữ, số, nhãn trong hình. Muốn hiện chữ thì ghi vào "overlay" (tiếng Việt, tối đa 5 từ) để chèn khi dựng.
- Không mô tả lại ngoại hình nhân vật (đã có mô tả cố định riêng); trong beats, firstFrame, endFrame chỉ gọi nhân vật đúng bằng tên đã cho (không dấu).
- "dialogue": lời người dẫn chuyện (giọng ngoài khung hình), ngắn, dễ hiểu, đúng kiến thức; tối đa ~28 từ tiếng Việt hoặc ~22 từ tiếng Anh mỗi cảnh. Nếu yêu cầu không lời thì để "".
- Chỉ chọn "settingId" và "cast" trong danh sách được cho. Mỗi cảnh 1–3 nhân vật.
- An toàn cho trẻ em: không đáng sợ, không bạo lực, không hành động nguy hiểm.
- Không bịa số liệu; kiến thức phải đúng chương trình tiểu học.
Chỉ trả về JSON: {"title":"…","clips":[{"settingId":"…","cast":["…"],"firstFrame":"…","beats":["…","…","…"],"dialogue":"…","endFrame":"…","overlay":"…"}]} — không thêm chữ nào ngoài JSON.`;

const Clip = z.object({
  settingId: z.coerce.string(), cast: z.array(z.coerce.string()).max(4).default([]),
  firstFrame: z.coerce.string().max(600).default(''), beats: z.array(z.coerce.string().max(600)).min(1).max(3),
  dialogue: z.coerce.string().max(600).default(''), endFrame: z.coerce.string().max(600).default(''), overlay: z.coerce.string().max(80).default(''),
});

function parse(text: string) {
  const t = text.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  const raw = JSON.parse(s >= 0 && e > s ? t.slice(s, e + 1) : t) as { title?: unknown; clips?: unknown[] };
  const clips = (raw.clips ?? []).map((x) => Clip.safeParse(x)).filter((r) => r.success).map((r) => r.data!);
  return { title: typeof raw.title === 'string' ? raw.title.slice(0, 120) : '', clips };
}

export async function POST(request: Request) {
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên và quản trị.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ cho AI (xem docs/tro-ly-ai.md).' }, { status: 503 });
  if (!(await rateLimitShared(`aivid:${viewer.userId}`, 4, 60_000))) return NextResponse.json({ error: 'Soạn nhanh quá — đợi một phút rồi thử lại nhé.' }, { status: 429 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  const b = parsed.data;

  const config = await loadTeacherAiConfig(viewer.userId);
  if (!config?.openai && !config?.gemini) return NextResponse.json({ error: 'Chưa nối API key — mở Trợ lý AI (nút góc dưới) → Cài đặt API để dán key Gemini (miễn phí) hoặc OpenAI.', code: 'no_key' }, { status: 400 });
  if ((await countTodayUsage(viewer.userId)) >= DAILY_LIMIT) return NextResponse.json({ error: `Đã dùng đủ ${DAILY_LIMIT} lượt AI hôm nay — mai làm tiếp nhé.` }, { status: 429 });

  const lang = b.narration === 'vi' ? 'tiếng Việt' : b.narration === 'en' ? 'tiếng Anh (đơn giản, trình độ tiểu học)' : 'KHÔNG LỜI (dialogue để trống, kể bằng hình)';
  const user = [
    `Số cảnh N = ${b.clipCount} (tổng ~${b.clipCount * 10} giây). Khổ hình ${b.ratio}${b.ratio === '9:16' ? ' (dọc: dùng chiều sâu, chuyển động theo chiều dọc)' : ' (ngang: dàn hành động trái – giữa – phải)'}.`,
    `Lời dẫn chuyện: ${lang}.`,
    `Nhân vật có thể dùng (id: tên — ghi chú): ${b.characters.map((c) => `${c.id}: ${c.name}${c.note ? ` — ${c.note}` : ''}`).join('; ') || 'không có (chỉ cảnh vật)'}.`,
    `Bối cảnh có thể dùng (id: tên — ghi chú): ${b.settings.map((s) => `${s.id}: ${s.name}${s.note ? ` — ${s.note}` : ''}`).join('; ')}.`,
    `Nội dung video:\n<noi_dung>\n${b.brief.trim()}\n</noi_dung>`,
  ].join('\n');

  const order: ProviderId[] = config.preferred === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  const ids = new Set(b.characters.map((c) => c.id)), sids = new Set(b.settings.map((s) => s.id));
  let lastErr = 'AI chưa trả lời được, thử lại sau.';
  for (const provider of order) {
    const chosen = provider === 'openai' ? config.openai : config.gemini;
    if (!chosen) continue;
    const r = await chatCompletion(provider, chosen.key, { system: SYSTEM, messages: [{ role: 'user', content: user }], model: chosen.model, maxTokens: 6000 });
    await logAiUsage(viewer.userId, provider, chosen.model, 'video-storyboard', r.ok, r.ok ? undefined : r.error);
    if (r.ok) {
      try {
        const out = parse(r.data.text);
        const clips = out.clips.slice(0, b.clipCount).map((c) => ({
          ...c,
          settingId: sids.has(c.settingId) ? c.settingId : b.settings[0].id,
          cast: c.cast.filter((id) => ids.has(id)).slice(0, 3),
          beats: [c.beats[0] ?? '', c.beats[1] ?? '', c.beats[2] ?? ''] as [string, string, string],
          dialogue: b.narration === 'none' ? '' : c.dialogue,
        }));
        if (!clips.length) throw new Error('empty');
        return NextResponse.json({ title: out.title, clips, provider, model: r.data.model });
      } catch {
        lastErr = 'AI trả lời sai định dạng — bấm “AI soạn phân cảnh” lần nữa nhé.';
        continue;
      }
    }
    lastErr = r.error;
    if (!isRetryable(r.httpStatus ?? 0)) break;
  }
  return NextResponse.json({ error: lastErr }, { status: 502 });
}
