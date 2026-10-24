import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import { hasServiceRole } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { hasKeyEncryptionSecret } from '@/lib/ai/crypto';
import { loadTeacherAiConfig, saveTeacherAiKeys } from '@/lib/ai/teacher-keys';
import { validateKey } from '@/lib/ai/providers';

// Quản lý API key AI của giáo viên (mô hình tự mang key — BYOK).
// GET    /api/ai/keys  → trạng thái đã nối key nào chưa (không bao giờ trả key).
// POST   /api/ai/keys  → lưu key mới (kiểm tra key với nhà cung cấp trước khi lưu) + chọn nhà cung cấp ưu tiên.
// DELETE /api/ai/keys  → gỡ key (provider: openai | gemini | all).

export async function GET() {
  const viewer = await getViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });

  const supabase = await createClient();
  const { data } = await supabase.rpc('my_ai_key_status');
  const row = (data as { has_openai: boolean; has_gemini: boolean; preferred: string }[] | null)?.[0] ?? null;
  return NextResponse.json({
    setupOk: hasKeyEncryptionSecret() && hasServiceRole(),
    hasOpenai: row?.has_openai === true,
    hasGemini: row?.has_gemini === true,
    preferred: row?.preferred === 'openai' ? 'openai' : 'gemini',
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!rateLimit(`aikeys:${viewer.userId}`, 15, 60_000)) return NextResponse.json({ error: 'Thao tác quá nhanh — đợi chút rồi thử lại.' }, { status: 429 });
  if (!hasServiceRole() || !hasKeyEncryptionSecret()) {
    return NextResponse.json({ error: 'Máy chủ chưa cấu hình lưu API key (thiếu SUPABASE_SERVICE_ROLE_KEY hoặc AI_KEY_ENCRYPTION_SECRET — xem docs/tro-ly-ai.md).' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { openaiKey?: unknown; geminiKey?: unknown; preferred?: unknown };
  const openaiKey = typeof body.openaiKey === 'string' ? body.openaiKey.trim() : '';
  const geminiKey = typeof body.geminiKey === 'string' ? body.geminiKey.trim() : '';
  const preferred = body.preferred === 'openai' || body.preferred === 'gemini' ? body.preferred : null;
  if (!openaiKey && !geminiKey && !preferred) return NextResponse.json({ error: 'Không có gì để lưu.' }, { status: 400 });

  // Kiểm tra key thật với nhà cung cấp (gọi endpoint danh sách model — không tốn token).
  const patch: Parameters<typeof saveTeacherAiKeys>[1] = {};
  if (openaiKey) {
    const v = await validateKey('openai', openaiKey);
    if (!v.ok) return NextResponse.json({ error: v.error, provider: 'openai' }, { status: 400 });
    patch.openai = { key: openaiKey, model: v.data.model };
  }
  if (geminiKey) {
    const v = await validateKey('gemini', geminiKey);
    if (!v.ok) return NextResponse.json({ error: v.error, provider: 'gemini' }, { status: 400 });
    patch.gemini = { key: geminiKey, model: v.data.model };
  }
  if (preferred) {
    const current = openaiKey || geminiKey || preferred ? await loadTeacherAiConfig(viewer.userId) : null;
    const merged = {
      openai: patch.openai ?? current?.openai ?? null,
      gemini: patch.gemini ?? current?.gemini ?? null,
    };
    if (!merged[preferred]) return NextResponse.json({ error: `Chưa có API key ${preferred === 'gemini' ? 'Gemini' : 'OpenAI'} — dán key trước khi chọn làm mặc định.` }, { status: 400 });
    patch.preferred = preferred;
  }

  try {
    await saveTeacherAiKeys(viewer.userId, patch);
  } catch (e) {
    return NextResponse.json({ error: `Không lưu được: ${e instanceof Error ? e.message : 'lỗi không rõ'}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const viewer = await getViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher && !viewer.isAdmin) return NextResponse.json({ error: 'Chỉ dành cho giáo viên.' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình đầy đủ.' }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { provider?: unknown };
  const patch: Parameters<typeof saveTeacherAiKeys>[1] = {};
  if (body.provider === 'openai' || body.provider === 'all') patch.openai = null;
  if (body.provider === 'gemini' || body.provider === 'all') patch.gemini = null;
  if (!('openai' in patch) && !('gemini' in patch)) return NextResponse.json({ error: 'Chọn nhà cung cấp cần gỡ key.' }, { status: 400 });

  try {
    await saveTeacherAiKeys(viewer.userId, patch);
  } catch (e) {
    return NextResponse.json({ error: `Không gỡ được: ${e instanceof Error ? e.message : 'lỗi không rõ'}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
