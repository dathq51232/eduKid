import { NextResponse } from 'next/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { countTodayUsage, loadTeacherAiConfig, logAiUsage, saveTeacherAiKeys } from '@/lib/ai/teacher-keys';
import { chatCompletion, isRetryable, streamChatCompletion, type ProviderId } from '@/lib/ai/providers';
import { TEACHER_ASSISTANT_SYSTEM, trimHistory } from '@/lib/ai/prompt';

// Trợ lý AI hội thoại cho giáo viên, dùng API key chính chủ đã lưu (BYOK — migration 0030).
// Hội thoại giữ ở trình duyệt của thầy cô; máy chủ chỉ nhận các lượt gần nhất, không lưu nội dung trò chuyện.

export const maxDuration = 60; // sinh văn bản có thể mất 10–30 giây, đừng để Vercel cắt giữa đường

const DAILY_LIMIT = 150; // đủ dùng thật sự, tránh key bị lạm dụng nếu máy tính dùng chung bị bỏ quên

export async function POST(request: Request) {
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ (xem docs/tro-ly-ai.md).' }, { status: 503 });
  if (!rateLimit(`aichat:${viewer.userId}`, 12, 5 * 60_000)) {
    return NextResponse.json({ error: 'Bạn hỏi nhanh quá — đợi khoảng một phút rồi tiếp tục nhé.' }, { status: 429 });
  }
  // Van chặn theo phút: gói miễn phí Gemini chỉ nhận ~10 lượt/phút — chặn giật liên tục trước khi Google chặn.
  if (!rateLimit(`aichat-rpm:${viewer.userId}`, 8, 60_000)) {
    return NextResponse.json({ error: 'Hỏi chậm thôi thầy cô — gói miễn phí của Gemini chỉ nhận khoảng 10 lượt mỗi phút, nghỉ chút rồi hỏi tiếp nhé.' }, { status: 429 });
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

  // Ưu tiên streaming: chữ về từng phần nên thầy cô thấy trợ lý "viết dần" thay vì chờ nguyên khối 30–60 giây.
  const s = await streamChatCompletion(provider, chosen.key, { system: TEACHER_ASSISTANT_SYSTEM, messages, model: chosen.model });
  if (s.ok) {
    await logAiUsage(viewer.userId, provider, s.model, 'chat', true);
    if (s.model !== chosen.model && !s.busy) {
      try {
        await saveTeacherAiKeys(viewer.userId, provider === 'gemini' ? { gemini: { key: chosen.key, model: s.model } } : { openai: { key: chosen.key, model: s.model } });
      } catch { /* không lưu được thì lần sau tự thử chuyển lại */ }
    }
    return new Response(s.stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Ai-Model': s.model, 'X-Ai-Provider': provider } });
  }

  // 429 (hết lượt mỗi phút của gói miễn phí): stream đã tự chờ 22 giây và thử lại ngầm rồi —
  // đừng gọi thêm lần nào nữa (lãng phí quota), trả thẳng lời nhắc nghỉ.
  if (s.httpStatus === 429) {
    await logAiUsage(viewer.userId, provider, chosen.model, 'chat', false, s.error);
    return NextResponse.json({ error: s.error }, { status: 429 });
  }

  // Không stream được (lỗi hết hạn/thiếu model) — dùng đường không stream cũ, kèm fallback nhà cung cấp khi quá tải.
  const result = await chatCompletion(provider, chosen.key, { system: TEACHER_ASSISTANT_SYSTEM, messages, model: chosen.model });
  await logAiUsage(viewer.userId, provider, chosen.model, 'chat', result.ok, result.ok ? undefined : result.error);

  // Fallback tự động: nếu provider ưu tiên quá tải / hạn mức (429/503)
  // và người dùng đã lưu key của cả hai nhà cung cấp, tự chuyển sang nhà kia một lần.
  if (!result.ok) {
    const fallbackProvider: ProviderId = provider === 'gemini' ? 'openai' : 'gemini';
    const fallbackChosen = fallbackProvider === 'openai' ? config.openai : config.gemini;
    if (fallbackChosen && isRetryable(result.httpStatus ?? 0)) {
      const fr = await chatCompletion(fallbackProvider, fallbackChosen.key, { system: TEACHER_ASSISTANT_SYSTEM, messages, model: fallbackChosen.model });
      await logAiUsage(viewer.userId, fallbackProvider, fallbackChosen.model, 'chat', fr.ok, fr.ok ? undefined : fr.error);
      if (fr.ok) {
        if (fr.data.model !== fallbackChosen.model && !fr.data.busy) {
          try { await saveTeacherAiKeys(viewer.userId, fallbackProvider === 'gemini' ? { gemini: { key: fallbackChosen.key, model: fr.data.model } } : { openai: { key: fallbackChosen.key, model: fr.data.model } }); } catch { /* ignore */ }
        }
        return NextResponse.json({ reply: fr.data.text, provider: fallbackProvider, model: fr.data.model, fallback: true });
      }
    }
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Nhà cung cấp ép đổi model — lưu lại để lần sau dùng thẳng.
  if (result.data.model !== chosen.model && !result.data.busy) {
    try {
      await saveTeacherAiKeys(viewer.userId, provider === 'gemini' ? { gemini: { key: chosen.key, model: result.data.model } } : { openai: { key: chosen.key, model: result.data.model } });
    } catch { /* không lưu được thì lần sau tự thử chuyển lại */ }
  }
  return NextResponse.json({ reply: result.data.text, provider, model: result.data.model });
}
