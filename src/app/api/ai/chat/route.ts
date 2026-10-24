import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { countTodayUsage, loadTeacherAiConfig, logAiUsage } from '@/lib/ai/teacher-keys';
import { chatCompletion, type ProviderId } from '@/lib/ai/providers';
import { TEACHER_ASSISTANT_SYSTEM, trimHistory } from '@/lib/ai/prompt';

// Trợ lý AI hội thoại cho giáo viên, dùng API key chính chủ đã lưu (BYOK — migration 0030).
// Hội thoại giữ ở trình duyệt của thầy cô; máy chủ chỉ nhận các lượt gần nhất, không lưu nội dung trò chuyện.

export const maxDuration = 60; // sinh văn bản có thể mất 10–30 giây, đừng để Vercel cắt giữa đường

const DAILY_LIMIT = 150; // đủ dùng thật sự, tránh key bị lạm dụng nếu máy tính dùng chung bị bỏ quên

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ (xem docs/tro-ly-ai.md).' }, { status: 503 });
  if (!rateLimit(`aichat:${viewer.userId}`, 12, 5 * 60_000)) {
    return NextResponse.json({ error: 'Bạn hỏi nhanh quá — đợi khoảng một phút rồi tiếp tục nhé.' }, { status: 429 });
  }

  const config = await loadTeacherAiConfig(viewer.userId);
  if (!config?.openai && !config?.gemini) {
    return NextResponse.json({ error: 'Chưa nối API key nào — mở Cài đặt API để dán key Gemini (miễn phí) hoặc OpenAI.', code: 'no_key' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { messages?: unknown; provider?: unknown };
  const raw = Array.isArray(body.messages)
    ? (body.messages as { role?: unknown; content?: unknown }[])
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))
    : [];
  const messages = trimHistory(raw);
  if (!messages.some((m) => m.role === 'user')) return NextResponse.json({ error: 'Chưa có câu hỏi.' }, { status: 400 });

  const want = body.provider === 'openai' || body.provider === 'gemini' ? (body.provider as ProviderId) : null;
  const provider: ProviderId = want ?? config.preferred;
  const chosen = provider === 'openai' ? config.openai : config.gemini;
  if (!chosen) {
    const other = provider === 'openai' ? config.gemini : config.openai;
    return NextResponse.json(
      { error: `Chưa có API key ${provider === 'openai' ? 'OpenAI' : 'Gemini'}${other ? ' — đang dùng nhà cung cấp còn lại.' : ''}`, code: 'no_key' },
      { status: 400 },
    );
  }

  if ((await countTodayUsage(viewer.userId)) >= DAILY_LIMIT) {
    return NextResponse.json({ error: `Đã hỏi đủ ${DAILY_LIMIT} lượt hôm nay (để bảo vệ API key của thầy cô) — mai hỏi tiếp nhé.` }, { status: 429 });
  }

  const result = await chatCompletion(provider, chosen.key, { system: TEACHER_ASSISTANT_SYSTEM, messages, model: chosen.model });
  await logAiUsage(viewer.userId, provider, chosen.model, 'chat', result.ok, result.ok ? undefined : result.error);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ reply: result.data.text, provider, model: result.data.model });
}
