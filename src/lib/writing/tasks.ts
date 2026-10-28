// Bài luyện chữ cô giao (migration 0042): lưu nội dung + cài đặt trang vở; học sinh lớp luyện bài đang mở.
import { createClient } from '@/lib/supabase/client';
import { normalizeSheet, type SheetSettings } from './sheet';

export type WritingTask = { id: string; title: string; lines: string[]; sheet: SheetSettings; active: boolean; created_at: string; updated_at: string };

const isMissing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST202' || e.code === '42883' || /writing_task|does not exist|schema cache/i.test(e.message ?? ''));

export function taskError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  if (isMissing(err)) return 'Máy chủ chưa có chức năng giao bài luyện chữ — cần chạy migration 0042_writing_tasks.sql trên Supabase.';
  const m = err?.message ?? '';
  if (/not_allowed/.test(m)) return 'Chỉ giáo viên của lớp mới giao / sửa được bài.';
  if (/empty/.test(m)) return 'Bài chưa có câu nào.';
  if (/too_many/.test(m)) return 'Tối đa 60 dòng mỗi bài.';
  return 'Chưa lưu được, thử lại sau.';
}

type Row = Omit<WritingTask, 'sheet'> & { sheet: unknown };

export async function listTasks(classId: string): Promise<WritingTask[]> {
  const { data, error } = await createClient().rpc('writing_task_list', { p_class: classId });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map((t) => ({ ...t, sheet: normalizeSheet(t.sheet) }));
}

export async function saveTask(classId: string, id: string | null, title: string, sheet: SheetSettings, active: boolean): Promise<string> {
  const lines = sheet.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const { data, error } = await createClient().rpc('writing_task_save', { p_class: classId, p_id: id, p_title: title, p_lines: lines, p_sheet: sheet, p_active: active });
  if (error) throw error;
  return data as string;
}

export async function setTaskActive(id: string, active: boolean) {
  const { error } = await createClient().rpc('writing_task_set_active', { p_id: id, p_active: active });
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await createClient().rpc('writing_task_delete', { p_id: id });
  if (error) throw error;
}
