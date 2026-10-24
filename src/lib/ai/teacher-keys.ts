import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptSecret, encryptSecret } from './crypto';
import type { ProviderId } from './providers';

// Lớp đọc/ghi key AI của giáo viên (bảng teacher_ai_keys — chỉ service_role với tới, migration 0030).
// Key giải mã trong tiến trình máy chủ rồi gọi nhà cung cấp, không bao giờ trả về trình duyệt.

export type TeacherAiConfig = {
  preferred: ProviderId;
  openai: { key: string; model: string } | null;
  gemini: { key: string; model: string } | null;
};

type Row = {
  user_id: string;
  openai_key_enc: string | null;
  openai_model: string | null;
  gemini_key_enc: string | null;
  gemini_model: string | null;
  preferred: string;
};

export async function loadTeacherAiConfig(userId: string): Promise<TeacherAiConfig | null> {
  const db = createAdminClient();
  const { data } = await db.from('teacher_ai_keys').select('user_id, openai_key_enc, openai_model, gemini_key_enc, gemini_model, preferred').eq('user_id', userId).maybeSingle();
  const row = data as Row | null;
  if (!row) return null;
  const openaiKey = row.openai_key_enc ? decryptSecret(row.openai_key_enc) : null;
  const geminiKey = row.gemini_key_enc ? decryptSecret(row.gemini_key_enc) : null;
  return {
    preferred: row.preferred === 'openai' ? 'openai' : 'gemini',
    openai: openaiKey && row.openai_model ? { key: openaiKey, model: row.openai_model } : null,
    gemini: geminiKey && row.gemini_model ? { key: geminiKey, model: row.gemini_model } : null,
  };
}

/** Lưu key đã mã hoá + model đã chọn (từ validateKey). Trường nào null thì giữ nguyên giá trị cũ. */
export async function saveTeacherAiKeys(
  userId: string,
  patch: { openai?: { key: string; model: string } | null; gemini?: { key: string; model: string } | null; preferred?: ProviderId },
): Promise<void> {
  const db = createAdminClient();
  const values: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (patch.openai === null) { values.openai_key_enc = null; values.openai_model = null; }
  else if (patch.openai) { values.openai_key_enc = encryptSecret(patch.openai.key); values.openai_model = patch.openai.model; }
  if (patch.gemini === null) { values.gemini_key_enc = null; values.gemini_model = null; }
  else if (patch.gemini) { values.gemini_key_enc = encryptSecret(patch.gemini.key); values.gemini_model = patch.gemini.model; }
  if (patch.preferred) values.preferred = patch.preferred;
  const { error } = await db.from('teacher_ai_keys').upsert(values);
  if (error) throw new Error(error.message);
}

/** Nhật ký mỗi lần gọi AI (bảng ai_usage) — dùng để đếm hạn mức trong ngày. */
export async function logAiUsage(userId: string, provider: ProviderId, model: string, task: string, ok: boolean, err?: string): Promise<void> {
  const db = createAdminClient();
  await db.from('ai_usage').insert({ user_id: userId, provider, model, task, ok, error: err ?? null });
}

/** Số lượt gọi AI hôm nay của giáo viên (để chặn vượt hạn mức). */
export async function countTodayUsage(userId: string): Promise<number> {
  const db = createAdminClient();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { count } = await db.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('ok', true).gte('created_at', start.toISOString());
  return count ?? 0;
}
